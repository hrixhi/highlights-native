import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Text, View } from './Themed';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';
import MathJax from 'react-native-mathjax-svg';

import { TextInput as CustomTextInput } from './CustomTextInput';


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any>([])
    const [updateKey, setUpdateKey] = useState(Math.random())
    const [shuffledProblems, setShuffledProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [headers, setHeaders] = useState<any>(props.headers)
    const [instructions, setInstructions] = useState(props.instructions)

    useEffect(() => {

        setHeaders(props.headers);
        setInstructions(props.instructions);

    }, [props.headers, props.instructions])

    // Over here the solutions objeect for modification is first set and updated based on changes...
    useEffect(() => {
        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions)
        } else {
            const solutionInit: any = []
            problems.map((problem: any) => {

                if (!problem.questionType || problem.questionType === "trueFalse") {
                    const arr: any = []

                    problem.options.map((i: any) => {
                        arr.push({
                            options: i.option,
                            isSelected: false
                        })
                    })

                    solutionInit.push({
                        selected: arr
                    })
                } else {
                    solutionInit.push({
                        response: ''
                    })
                }


            })
            setSolutions(solutionInit)
            props.setSolutions(solutionInit)
        }
    }, [problems, props.solutions, props.setSolutions])

    useEffect(() => {
        if (props.shuffleQuiz && !props.isOwner) {
            setLoading(true)
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated
            })

            setProblems(updatedProblemsWithIndex)

            const headerPositions = Object.keys(headers);

            // Headers not at index 0
            const filteredHeaderPositions = headerPositions.filter((pos: any) => pos > 0);

            // If headers then we only shuffle the questions between each header
            if (filteredHeaderPositions.length > 0) {

                let arrayOfArrays = [];

                let start = 0;

                for (let i = 0; i <= filteredHeaderPositions.length; i++) {
                    if (i === filteredHeaderPositions.length) {
                        const subArray = updatedProblemsWithIndex.slice(start, updatedProblemsWithIndex.length);
                        arrayOfArrays.push(subArray);

                    } else {
                        const subArray = updatedProblemsWithIndex.slice(start, Number(filteredHeaderPositions[i]));
                        arrayOfArrays.push(subArray);
                        start = Number(filteredHeaderPositions[i]);

                    }

                }

                let shuffled: any = [];

                for (let i = 0; i < arrayOfArrays.length; i++) {
                    const s = shuffle(arrayOfArrays[i]);
                    shuffled.push(s);
                }

                const shuffledArray = shuffled.flat();

                setShuffledProblems(shuffledArray)


            } else {

                const shuffledArray = shuffle(updatedProblemsWithIndex);

                setShuffledProblems(shuffledArray)

            }

        } else {
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated
            })

            setProblems(updatedProblemsWithIndex)
        }
        setLoading(false)

    }, [props.shuffleQuiz, headers])

    function shuffle(input: any[]) {

        const array = [...input];

        var currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    const renderHeader = (index: number) => {

        if (index in headers) {

            return (<TextInput
                editable={props.isOwner}
                value={headers[index]}
                style={{
                    marginBottom: 30,
                    marginTop: 50,
                    fontSize: 15,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontWeight: "600",
                    width: '100%'
                }}
                onChangeText={(val: string) => {
                    const currentHeaders = JSON.parse(JSON.stringify(headers))
                    currentHeaders[index] = val
                    setHeaders(currentHeaders);
                }}
                placeholder={'Header'}
                placeholderTextColor={'#a2a2ac'}
            />)

            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 50, fontSize: 15, fontWeight: "bold", color: 'black' }}>
                {headers[index]}
            </Text>)
        }

        return null;
    }

    const selectMCQOption = (problem: any, problemIndex: number, optionIndex: number) => {

        let onlyOneCorrect = true;

        if (!problem.questionType) {
            let noOfCorrect = 0;

            problem.options.map((option: any) => {
                if (option.isCorrect) noOfCorrect++;
            })

            if (noOfCorrect > 1) onlyOneCorrect = false;
        }
        // Check if one correct or multiple correct
        const updatedSolution = [...solutions]

        if (onlyOneCorrect && !updatedSolution[problemIndex].selected[optionIndex].isSelected) {
            problem.options.map((option: any, optionIndex: any) => {
                updatedSolution[problemIndex].selected[optionIndex].isSelected = false;
            })
        }

        updatedSolution[problemIndex].selected[optionIndex].isSelected = !updatedSolution[problemIndex].selected[optionIndex].isSelected;

        setSolutions(updatedSolution)
        props.setSolutions(updatedSolution)

    }

    if (problems.length !== solutions.length) {
        return null
    }

    let displayProblems = props.shuffleQuiz && !props.isOwner && !props.submitted ? shuffledProblems : problems;

    if (loading || props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#a2a2ac"} />
    </View>)

    return (
        <View style={{
            flex: 1,
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
            key={solutions}
        >
            {instructions !== "" ?
                <TextInput
                    editable={props.isOwner}
                    value={instructions}
                    multiline={true}
                    numberOfLines={3}
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        fontSize: 15,
                        paddingTop: 12,
                        paddingBottom: 12,
                        width: '100%'
                    }}
                    onChangeText={(val: string) => setInstructions(val)}
                    placeholder={'Instructions'}
                    placeholderTextColor={'#a2a2ac'}
                />
                : null}
            {
                displayProblems.map((problem: any, index: any) => {

                    const { problemIndex } = problem;

                    if (problemIndex === undefined || problemIndex === null) return;

                    let onlyOneCorrect = true;

                    if (!problem.questionType) {
                        let noOfCorrect = 0;

                        problem.options.map((option: any) => {
                            if (option.isCorrect) noOfCorrect++;
                        })

                        if (noOfCorrect > 1) onlyOneCorrect = false;
                    }

                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row' }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <View style={{ paddingTop: 15 }}>
                                    <Text style={{ color: '#a2a2ac', fontSize: 15, marginBottom: 25, marginRight: 10, marginTop: 10 }}>
                                        {index + 1}.
                                    </Text>
                                </View>
                                {
                                    problem.question && problem.question.includes("image:") ?
                                        (<Image
                                            // resizeMode={'contain'}
                                            style={{
                                                width: 400,
                                                height: 400
                                            }}
                                            source={{
                                                uri: (problem.question.split("image:")[1])
                                            }}
                                        />) :
                                        (
                                            problem.question && problem.question.includes("formula:") ? (
                                                <View style={{
                                                    // borderColor: '#f4f4f6',
                                                    // borderWidth: 1,
                                                    // borderRadius: 15,
                                                    padding: 10,
                                                    width: '50%',
                                                    backgroundColor: 'white'
                                                }}>
                                                    <MathJax style={{
                                                        width: '100%',
                                                        height: 100
                                                    }}
                                                        color="black"
                                                    >
                                                        {problem.question.split("formula:")[1]}
                                                    </MathJax>
                                                </View>
                                            ) :
                                                <TextInput
                                                    editable={props.isOwner}
                                                    value={problem.question}
                                                    style={{
                                                        fontSize: 15,
                                                        padding: 15,
                                                        paddingTop: 12,
                                                        paddingBottom: 12,
                                                        marginTop: 5,
                                                        marginBottom: 20,
                                                        width: '80%'
                                                    }}
                                                    onChangeText={(val: string) => {
                                                        const newProbs = [...problems];
                                                        newProbs[problemIndex].question = val;
                                                        setProblems(newProbs)
                                                    }}
                                                    multiline={true}
                                                    placeholder={'Problem ' + (index + 1).toString()}
                                                    placeholderTextColor={'#a2a2ac'}
                                                />
                                        )
                                }
                            </View>
                            <View
                                style={{ flexDirection: 'row' }}
                            >
                                <TextInput
                                    editable={false}
                                    value={problem.points + " " + (Number(problem.points) === 1 ? 'Point' : ' Points')}
                                    style={{
                                        width: 150,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        marginBottom: 20,
                                        marginLeft: Dimensions.get('window').width < 768 ? 20 : 0
                                    }}
                                    placeholder={'Enter points'}
                                    placeholderTextColor={'#a2a2ac'}
                                />
                                {
                                    !problem.questionType && !onlyOneCorrect ?
                                        (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingRight: 30, paddingTop: 20 }}>
                                            more than one correct answer
                                        </Text>)
                                        : null
                                }
                                {
                                    !problem.required ?
                                        (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingTop: 20 }}>
                                            optional
                                        </Text>)
                                        : (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingTop: 20 }}>
                                            required
                                        </Text>)
                                }
                            </View>
                        </View>
                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {
                                let color = '#2f2f3c'
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (props.submitted && option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (props.submitted && !option.isCorrect && solutions[problemIndex].selected[i].isSelected) {
                                    color = '#D91D56'
                                }
                                return <View style={{ flexDirection: 'row', backgroundColor: '#fff' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingLeft: 40, paddingRight: 10, backgroundColor: '#fff', paddingTop: 15 }}>
                                        <CheckBox
                                            disabled={props.submitted || props.isOwner || props.hasEnded}
                                            style={{ paddingRight: 20 }}
                                            isChecked={props.isOwner ? option.isCorrect : solutions[problemIndex].selected[i].isSelected}
                                            onClick={() => {
                                                selectMCQOption(problem, problemIndex, i);
                                            }}
                                        />
                                    </View>
                                    <View style={{ backgroundColor: '#fff' }}>
                                        {
                                            option.option && option.option.includes("image:") ?
                                                (<Image
                                                    // resizeMode={'contain'}
                                                    style={{
                                                        width: 200,
                                                        height: 200
                                                    }}
                                                    source={{
                                                        uri: option.option.split("image:")[1]
                                                    }}
                                                />) :
                                                (
                                                    option.option && option.option.includes("formula:") ?
                                                        <View style={{
                                                            // borderColor: '#f4f4f6',
                                                            // borderWidth: 1,
                                                            // borderRadius: 15,
                                                            padding: 10,
                                                            width: '30%',
                                                            backgroundColor: 'white'
                                                        }}>
                                                            <MathJax style={{
                                                                width: '100%',
                                                                height: 100
                                                            }}
                                                                color='black'
                                                            >
                                                                {option.option.split("formula:")[1]}</MathJax>
                                                        </View> :
                                                        <TextInput
                                                            editable={props.isOwner}
                                                            value={option.option}
                                                            style={{
                                                                width: '100%',
                                                                fontSize: 15,
                                                                padding: 15,
                                                                paddingTop: 12,
                                                                paddingBottom: 12,
                                                                marginTop: 5,
                                                                marginBottom: 20,
                                                                color
                                                            }}
                                                            onChangeText={(val: string) => {
                                                                const newProbs = [...problems];
                                                                newProbs[problemIndex].options[i].option = val;
                                                                setProblems(newProbs)
                                                            }}
                                                            placeholder={'Option ' + (i + 1).toString()}
                                                            placeholderTextColor={'#a2a2ac'}
                                                        />
                                                )
                                        }
                                    </View>
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?
                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    <CustomTextInput
                                        editable={!props.submitted && !props.graded && !props.isOwner && !props.hasEnded}
                                        value={solutions[problemIndex].response}
                                        onChange={(e: any) => {
                                            const updatedSolution = [...solutions]
                                            updatedSolution[problemIndex].response = e.target.value;
                                            setSolutions(updatedSolution)
                                            props.setSolutions(updatedSolution)
                                        }}
                                        placeholder='Answer'
                                        hasMultipleLines={true}

                                    />

                                </View>
                                :
                                null
                        }
                    </View>
                })
            }

            {/* Add Save Changes button here */}
            {
                props.isOwner ?
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff' }}>
                        <TouchableOpacity
                            onPress={() => {
                                props.modifyQuiz(instructions, problems, headers);
                            }}
                            style={{ backgroundColor: "white", borderRadius: 15, width: 150 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#3B64F8",
                                    borderRadius: 15,
                                    paddingHorizontal: 25,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                Save
                            </Text>
                        </TouchableOpacity>
                    </View>
                    :
                    null
            }
        </View >
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
