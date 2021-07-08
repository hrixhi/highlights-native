import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { ScrollView } from "react-native-gesture-handler";
import { Text, View } from './Themed';
// import EquationEditor from 'equation-editor-react';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';



const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions)
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores)

    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState("");

    console.log(props);
    
    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })
        setCurrentScore(currentScore);
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

    console.log(problemScores);

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
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
        >
            <View style={{ width: '100%', flexDirection: 'row', backgroundColor: '#fff' }}>
                <Text style={{ width: '25%', fontSize: 15, color: "#202025", marginBottom: 10, backgroundColor: '#fff'  }}>
                    {props.partiallyGraded ? "Finish Grading" : "Graded" }
                </Text>
                <View style={{ width: '70%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, backgroundColor: '#fff'  }}>
                    <Text
                        style={{
                            fontSize: 12,
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
                            fontSize: 12,
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
                    console.log(problem.questionType)
                    return <View style={{ borderBottomColor: '#f4f4f6', backgroundColor: '#fff', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
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
                                                borderColor: '#f4f4f6',
                                                borderWidth: 1,
                                                borderRadius: 15,
                                                padding: 10,
                                                width: '50%'
                                            }}>
                                                <Latex style={{
                                                    width: '100%',
                                                    height: 100
                                                }}>
                                                    {problem.question.split("formula:")[1]}</Latex>
                                            </View>
                                        ) :
                                            <TextInput
                                                editable={false}
                                                value={problem.question}
                                                style={styles.input}
                                                placeholder={'Problem ' + (index + 1).toString()}
                                                placeholderTextColor={'#a2a2aa'}
                                            />
                                    )
                            }
                            <TextInput
                                editable={true}
                                value={problemScores[index]}
                                onChangeText={(val: any) => {
                                    // console.log(Number.isNaN(e.target.value))
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
                            />
                            <TextInput
                                editable={false}
                                value={"/ " + problem.points }
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
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />
                        </View>
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
                                                        borderColor: '#f4f4f6',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <Latex style={{
                                                            width: '100%',
                                                            height: 100
                                                        }}>
                                                            {option.option.split("formula:")[1]}</Latex>
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

                            <View style={{ width: '80%', backgroundColor: '#fff'  }}>
                                <CustomTextInput 
                                    editable={false}
                                    value={solutions[index].response}
                                    // onChange={(e: any) => {
                                    //     const updatedSolution = [...solutions]
                                    //     updatedSolution[index].response = e.target.value;
                                    //     setSolutions(updatedSolution)
                                    //     props.setSolutions(updatedSolution)
                                    // }}
                                    placeholder='Answer'
                                    // style={{
                                    //     width: '50%',
                                    //     fontSize: 15,
                                    //     padding: 15,
                                    //     paddingTop: 12,
                                    //     paddingBottom: 12,
                                    //     marginTop: 5,
                                    //     marginBottom: 20,
                                    //     color:  '#202025'
                                    // }}
                                    hasMultipleLines={true}

                                />
                            
                            </View>
                            :
                            null

                        }
                    </View>
                })
            }


            {/* Add Submit button here */}
            <View
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
                    onPress={() => props.onGradeQuiz(problemScores, Number(percentage))}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        overflow: 'hidden',
                        height: 35,
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#3B64F8',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                    }}>
                        SUBMIT 
                    </Text>
                </TouchableOpacity>
            </View>
        </View >
        <View style={{ height: 100, backgroundColor: '#fff'}} />
        </ScrollView>
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
