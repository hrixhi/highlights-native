import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { ScrollView } from "react-native-gesture-handler";
import { Text, View } from './Themed';
// import EquationEditor from 'equation-editor-react';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';
import MathJax from 'react-native-mathjax-svg';
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import { RadioButton } from "./RadioButton";


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions)
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores)
    const [problemComments, setProblemComments] = useState<any[]>(props.solutions.problemComments ? props.solutions.problemComments : [])

    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState("");
    const [comment, setComment] = useState(props.comment ? props.comment : "");
    const [headers, setHeaders] = useState<any>(props.headers)
    const [attemptDuration, setAttemptDuration] = useState<any>("")

    let videoRef: any = useRef();

    useEffect(() => {

        setHeaders(props.headers);
        // setInstructions(props.instructions);

    }, [props.headers])

    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })
        setCurrentScore(currentScore);

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];

            props.solutions.solutions.forEach((sol: any) => comments.push(""));

            setProblemComments(comments);

        }

    }, [props.solutions])

    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        })
        setTotalPossible(total);
    }, [props.problems])

    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2))

    }, [problemScores, totalPossible])

    const diff_seconds = (dt2: any, dt1: any) => {
        console.log("dt2", dt2);
        console.log("dt1", dt1);

        const diff = dt2.getTime() - dt1.getTime();

        const Seconds_from_T1_to_T2 = diff / 1000;
        return Math.abs(Seconds_from_T1_to_T2);
    };

    useEffect(() => {
        if (props.initiatedAt && props.initiatedAt !== null) {
            const difference = diff_seconds(new Date(parseInt(props.submittedAt)), new Date(props.initiatedAt));

            console.log("Difference", difference);

            if (Number.isNaN(difference)) {
                setAttemptDuration("");
                return;
            }

            let hours = Math.floor(difference / 3600); 
            let minutes = Math.floor((difference - hours * 3600) / 60); 
            let seconds = difference - hours * 3600 - minutes * 60;
            
            setAttemptDuration(`${hours === 0 ? "" : Math.round(hours)} ${hours === 0 ? "" : "H"}  ${Math.round(minutes)} min  ${Math.round(seconds)} s `)
        }
    }, [props.submittedAt, props.initiatedAt])

    const renderAudioVideoPlayer = (url: string, type: string) => {
        return <Video
            ref={videoRef}
            style={{
                width: 400,
                height: 400
            }}
            source={{
            uri: url,
            }}
            useNativeControls
            resizeMode="contain"
            isLooping
            // onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
    }


    const renderHeader = (index: number) => {

        if (!headers) return;

        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 15, fontWeight: "600", backgroundColor: 'white', color: 'black' }}>
                {headers[index]}
            </Text>)
        }

        return null;
    }

    let totalPoints = 0;

    problems.map((problem: any) => {
        totalPoints += Number(problem.points)
    })


    if (props.loading) return (<View
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
        <ScrollView
            style={{
                paddingBottom: 25,
                borderBottomColor: "#f4f4f6",
                borderBottomWidth: 1,
                width: '100%'
            }}
            //   onScrollBeginDrag={Keyboard.dismiss}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={"on-drag"}
            overScrollMode={"always"}
            //   onScroll={() => Keyboard.dismiss()}
            nestedScrollEnabled={true}>
            <View style={{
                width: '100%', backgroundColor: 'white',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingTop: 15,
                flexDirection: 'column',
                justifyContent: 'flex-start'
            }}
            >
                {
                <View style={{ display: 'flex', flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#cccccc", width: '100%' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', marginBottom: Dimensions.get('window').width < 768 ? 20 : 0,  }}>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                            {problems.length} {problems.length === 1 ? "Question" : "Questions"}
                        </Text>
                        <Text style={{ marginRight: 10, fontSize: 15 }}>
                            |
                        </Text>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                            {totalPoints} Points 
                        </Text>
                        {props.initiatedAt && attemptDuration !== "" ? <Text style={{ marginRight: 10, fontSize: 15}}>
                            |
                        </Text> : null}
                        {props.initiatedAt && attemptDuration !== "" ? <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                            Attempt Duration: {attemptDuration}
                        </Text> : null}
                    </View>
                    

                    <View style={{ }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: "white",
                                    height: 22,
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#3B64F8",
                                    lineHeight: 20,
                                    paddingTop: 1,
                                    overflow: 'hidden'
                                }}>
                                {percentage}%
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: "white",
                                    height: 22,
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#3B64F8",
                                    lineHeight: 20,
                                    paddingTop: 1,
                                    overflow: 'hidden'
                                }}>
                                {currentScore}/{totalPossible}
                            </Text>
                            {props.isOwner ? <Text style={{ fontSize: 15, color: "#2f2f3c", marginBottom: 10, paddingLeft: 20, lineHeight: 22, textTransform: 'uppercase' }}>
                                {props.partiallyGraded ? "In progress" : "Graded"}
                            </Text> : null}
                        </View>

                    </View>
                </View>
            }
            

                {
                    props.problems.map((problem: any, index: any) => {

                        let onlyOneCorrect = true;

                        if (!problem.questionType) {
                            let noOfCorrect = 0;

                            problem.options.map((option: any) => {
                                if (option.isCorrect) noOfCorrect++;
                            })

                            if (noOfCorrect > 1) onlyOneCorrect = false;
                        }

                        let audioVideoQuestion = problem.question[0] === "{"  && problem.question[problem.question.length - 1] === "}";

                        let url = "";
                        let content = "";
                        let type = "";
    
                        if (audioVideoQuestion) {
                            const parse = JSON.parse(problem.question);
    
                            url = parse.url;
                            content = parse.content;
                            type = parse.type;
                        }

                        const tagsStyles = {
                            body: {
                              fontSize: 15,
                              lineHeight: 25
                            },
                        };
    

                        return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                            {renderHeader(index)}
                            <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>
                                <View style={{ flexDirection: 'row', flex: 1, }}>
                                    <View style={{ paddingTop: 15 }}>
                                        <Text style={{ color: '#a2a2ac', fontSize: 15, paddingBottom: 25, marginRight: 10, paddingTop: 10 }}>
                                            {index + 1}.
                                        </Text>
                                    </View>
                                    {
                                        problem.question && problem.question.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 400,
                                                    height: 400
                                                }}
                                                source={{
                                                    uri: problem.question.split("image:")[1]
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
                                                        backgroundColor: 'white',
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
                                                (audioVideoQuestion ? <View style={{ width: '80%', marginBottom: 10 }}>
                                                {renderAudioVideoPlayer(url, type)}
                                                <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                    <RenderHtml
                                                        contentWidth={Dimensions.get('window').width < 768 ? Dimensions.get('window').width * 0.8 : Dimensions.get('window').width }
                                                        source={{
                                                            html: content
                                                        }}
                                                        enableExperimentalMarginCollapsing={true}
                                                        tagsStyles={tagsStyles}
                                                    /> 
                                                </Text>
                                            </View> : <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, width: '80%', marginBottom: 10, lineHeight: 25 }}>
                                                <RenderHtml
                                                    // contentWidth={"100%"}
                                                    contentWidth={Dimensions.get('window').width < 768 ? Dimensions.get('window').width : Dimensions.get('window').width }
                                                    source={{
                                                        html: problem.question
                                                    }}
                                                    enableExperimentalMarginCollapsing={true}
                                                    tagsStyles={tagsStyles}
                                                />
                                            </Text>)
                                            )
                                    }

                                </View>

                                <View style={{ flexDirection: 'row', paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0, height: 80, alignItems: 'center' }}>
                                    {!props.isOwner ? null : <TextInput
                                        editable={true}
                                        value={problemScores[index]}
                                        onChangeText={(val: any) => {
                                            if (Number.isNaN(Number(val))) return
                                            const updateProblemScores = [...problemScores]
                                            updateProblemScores[index] = val;
                                            setProblemScores(updateProblemScores)
                                        }}
                                        style={{
                                            width: 100,
                                            borderBottomColor: '#f4f4f6',
                                            borderBottomWidth: 1,
                                            fontSize: 15,
                                            padding: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            marginTop: 5,
                                            marginBottom: 20,
                                            backgroundColor: '#fff'
                                        }}
                                        placeholder={'Points'}
                                        placeholderTextColor={'#a2a2ac'}
                                    />}
                                    {!props.isOwner ? null : <TextInput
                                        editable={false}
                                        value={"/ " + problem.points}
                                        style={{
                                            width: 60,
                                            fontSize: 15,
                                            padding: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            marginTop: 5,
                                            marginBottom: 20,
                                            backgroundColor: '#fff'
                                        }}
                                        placeholder={'Enter points'}
                                        placeholderTextColor={'#a2a2ac'}
                                    />}
                                    {
                                        !props.isOwner ? <Text style={{ fontSize: 15, width: 150, marginTop: 5, marginBottom: 20, paddingTop: 12, textAlign: 'right', color: 'black' }}>
                                            {Number(problemScores[index]).toFixed(1)} / {Number(problem.points).toFixed(1)}
                                        </Text> : null
                                    }

                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            !problem.required ?
                                                (<Text style={{
                                                    fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                                }}>
                                                    optional
                                                </Text>)
                                                : (<Text style={{
                                                    fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                                }}>
                                                    required
                                                </Text>)
                                        }
                                    </View>
                                </View>
                                
                            </View>
                            {
                                (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                    let color = '#2f2f3c'
                                    if (option.isCorrect) {
                                        color = '#3B64F8'
                                    } else if (!option.isCorrect && solutions[index].selected[i].isSelected) {
                                        color = '#D91D56'
                                    }


                                    return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                        <View style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 15 }}>
                                            <CheckBox
                                                disabled={true}
                                                style={{ paddingRight: 20 }}
                                                isChecked={solutions[index].selected[i].isSelected}
                                            />
                                        </View>
                                        {
                                            option.option && option.option.includes("image:") ?
                                                (<Image
                                                    resizeMode={'contain'}
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
                                                            backgroundColor: 'white',
                                                        }}>
                                                            <MathJax style={{
                                                                width: '100%',
                                                                height: 100
                                                            }}
                                                                color='black'
                                                            >
                                                                {option.option.split("formula:")[1]}</MathJax>
                                                        </View> :
                                                         <Text
                                                            style={{
                                                                width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                                fontSize: 15,
                                                                padding: 15,
                                                                paddingTop: 12,
                                                                paddingBottom: 12,
                                                                marginTop: 5,
                                                                marginBottom: 20,
                                                                color,
                                                                lineHeight: 25
                                                            }}
                                                        >
                                                            {option.option}
                                                        </Text>
                                                )
                                        }
                                    </View>
                                })
                            }
                            {
                                problem.questionType === "freeResponse" ?
                                    <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                        <CustomTextInput
                                            editable={false}
                                            value={solutions[index].response}
                                            placeholder='Answer'
                                            hasMultipleLines={true}

                                        />
                                    </View>
                                    :
                                    null
                            }
                            {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: '80%', maxWidth: 400, marginLeft: 40 }}>
                                {props.isOwner ? <AutoGrowingTextInput
                                    editable={props.isOwner ? true : false}
                                    value={problemComments[index]}
                                    placeholder='Remark'
                                    hasMultipleLines={true}
                                    minHeight={80}
                                    onChangeText={(val: any) => {
                                        const updateProblemComments = [...problemComments];
                                        updateProblemComments[index] = val;
                                        setProblemComments(updateProblemComments)
                                    }}
                                    style={{
                                        width: '100%',
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        marginBottom: 20,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#cccccc'
                                    }}
                                /> :
                                    <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40, backgroundColor: 'white' }}>
                                        <Text style={{ color: '#3b64f8', fontSize: 13, backgroundColor: 'white' }}>
                                            {problemComments[index]}
                                        </Text>
                                    </View>}
                            </View>}
                        </View>
                    })
                }

                {!props.isOwner && !comment ? null : <View style={{ width: '100%', paddingVertical: 50, paddingLeft: 40, borderTopWidth: 1, borderColor: '#f4f4f6' }}>
                    <Text style={{ width: '100%', textAlign: 'left' }}>
                        Feedback
                    </Text>
                    {props.isOwner ? <View style={{ width: '80%', maxWidth: 400 }}>
                        <AutoGrowingTextInput
                            editable={props.isOwner ? true : false}
                            value={comment}
                            onChangeText={(val: any) => setComment(val)}
                            hasMultipleLines={true}
                            minHeight={80}
                            style={{
                                width: '100%',
                                fontSize: 15,
                                padding: 15,
                                paddingTop: 12,
                                paddingBottom: 12,
                                marginTop: 5,
                                marginBottom: 20,
                                borderBottomWidth: 1,
                                borderBottomColor: '#cccccc'
                            }}
                        />
                    </View> :
                        <Text style={{ color: '#3b64f8', fontSize: 15, width: '100%', textAlign: 'left', marginTop: 40 }}>
                            {comment}
                        </Text>
                    }
                </View>}

                {/* Add Submit button here */}
                {props.isOwner ? <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        marginTop: 25,
                        marginBottom: 25
                    }}>
                    <TouchableOpacity
                        onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            overflow: 'hidden',
                            height: 35,
                            marginBottom: props.isOwner ? 200 : 50
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: 'white',
                            fontSize: 11,
                            backgroundColor: '#3B64F8',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 35,
                        }}>
                            SAVE
                        </Text>
                    </TouchableOpacity>
                </View> : null}
            </View >
            <View style={{ height: 100, backgroundColor: '#fff' }} />
        </ScrollView>
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f4f4f6',
        // borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
