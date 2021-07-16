import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { ScrollView } from "react-native-gesture-handler";
import { Text, View } from './Themed';
// import EquationEditor from 'equation-editor-react';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';
import MathJax from 'react-native-mathjax-svg';

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

        setPercentage(((currentScore/totalPossible)*100).toFixed(2))

    }, [problemScores, totalPossible])


    const renderHeader = (index: number) => {

        if (!headers) return;

        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 15, fontWeight: "600", backgroundColor: 'white', color: 'black' }}>
                {headers[index]}
            </Text>)
        } 

        return null;
    }

    if (props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#a2a2aa"} />
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
            <View style={{ width: '100%', flexDirection: 'row', backgroundColor: '#fff' }}>
                <Text style={{ width: '25%', fontSize: 15, color: "#202025", marginBottom: 10, backgroundColor: '#fff'  }}>
                    {props.partiallyGraded ? "Finish Grading" : "" }
                </Text>
                <View style={{ width: '70%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, backgroundColor: '#fff'  }}>
                    <Text
                        style={{
                            fontSize: 11,
                            color: "white",
                            height: 22,
                            overflow: "hidden",
                            paddingHorizontal: 10,
                            marginLeft: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {percentage}%
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: "white",
                            height: 22,
                            overflow: "hidden",
                            paddingHorizontal: 10,
                            marginLeft: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {currentScore}/{totalPossible}
                    </Text>
                </View>
                
            </View>
            
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

                    return <View style={{ borderBottomColor: '#f4f4f6', backgroundColor: '#fff', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                            <View style={{ paddingTop: 15, backgroundColor: '#fff' }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 15, paddingBottom: 25, marginRight: 10 }}>
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
                                            <TextInput
                                                editable={false}
                                                value={problem.question}
                                                style={{
                                                    width: '50%',
                                                    fontSize: 15,
                                                    padding: 15,
                                                    paddingTop: 12,
                                                    paddingBottom: 12,
                                                    marginTop: 5,
                                                    marginBottom: 20
                                                }}
                                                multiline={true}
                                                placeholder={'Problem ' + (index + 1).toString()}
                                                placeholderTextColor={'#a2a2aa'}
                                            />
                                    )
                            }
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
                                    width: '25%',
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
                                placeholderTextColor={'#a2a2aa'}
                            />}
                            {!props.isOwner ? null : <TextInput
                                editable={false}
                                value={"/ " + problem.points }
                                style={{
                                    width: '25%',
                                    fontSize: 15,
                                    padding: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    marginTop: 5,
                                    marginBottom: 20,
                                    backgroundColor: '#fff'
                                }}
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />}
                            {
                                !props.isOwner ? <Text style={{ fontSize: 15, width: '40%', marginTop: 5, marginBottom: 20, paddingTop: 12, textAlign: 'right', color: 'black' }}>
                                    {Number(problemScores[index]).toFixed(1)} / {Number(problem.points).toFixed(1)}
                                </Text> : null
                            }

                        </View>

                        {
                            !problem.questionType && !onlyOneCorrect ? 
                                (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right', }}>
                                    more than one correct answer
                                </Text>)
                                : null
                        }
                        {
                            !problem.required ? 
                                (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right',  }}>
                                    optional
                                </Text>)
                                : (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right',   }}>
                                    required
                                    </Text>)
                        }
                        {
                            !problem.questionType && problem.options.map((option: any, i: any) => {

                                let color = '#202025'
                                if (option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (!option.isCorrect && solutions[index].selected[i].isSelected)  {
                                    color = '#D91D56'
                                }


                                return <View style={{ flexDirection: 'row', backgroundColor: '#fff' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingTop: 15, backgroundColor: '#fff'  }}>
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
                                                    <TextInput
                                                        editable={false}
                                                        value={option.option}
                                                        style={{
                                                            width: '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color
                                                        }}
                                                        placeholder={'Option ' + (i + 1).toString()}
                                                        placeholderTextColor={'#a2a2aa'}
                                                    />
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ? 
                            <View style={{ width: '100%', backgroundColor: '#fff'  }}>
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
                        {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: '100%', backgroundColor: 'white'}}>
                            {props.isOwner ? <CustomTextInput 
                                editable={props.isOwner ? true : false}
                                value={problemComments[index]}
                                placeholder='Instructor Remarks'
                                hasMultipleLines={true}
                                onChangeText={(val: any) => {
                                    const updateProblemComments = [...problemComments];
                                    updateProblemComments[index] = val;
                                    setProblemComments(updateProblemComments)
                                }}
                            /> : 
                            <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40, backgroundColor: 'white' }}> 
                                <Text style={{ color: '#a2a2aa',  fontSize: 13, backgroundColor: 'white'   }}>
                                   Remark: {" "}
                                </Text>
                                <Text style={{ color: '#3b64f8',  fontSize: 13, backgroundColor: 'white'  }}>
                                    {problemComments[index]}
                                </Text>
                            </View>}
                        </View>}
                    </View>
                })
            }

            {!props.isOwner && !comment ? null : <View style={{ width: '100%', alignItems: 'center', marginVertical: 50, backgroundColor: 'white' }}>
                <Text style={{ width: '100%', marginBottom: 20, textAlign: 'center', backgroundColor: 'white', color: 'black' }}>
                    Overall Remarks
                </Text>
                {props.isOwner ?  <View style={{ width: '100%', backgroundColor: 'white'}}>
                    <CustomTextInput 
                        editable={props.isOwner ? true : false}
                        value={comment}
                        onChangeText={(val: any) => setComment(val)}
                        hasMultipleLines={true}
                    /> 
                </View> :
                <Text style={{ color: '#3b64f8', fontSize: 15, width: '100%', textAlign: 'center', marginTop: 40, backgroundColor: 'white' }}>
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
                        SUBMIT 
                    </Text>
                </TouchableOpacity>
            </View> : null}
        </View >
        <View style={{ height: 100, backgroundColor: '#fff'}} />
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
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
