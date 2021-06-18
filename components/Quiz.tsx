import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput } from 'react-native';
import { Text, View } from './Themed';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any>([])

    useEffect(() => {
        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions)
        } else {
            const solutionInit: any = []
            problems.map((problem: any) => {
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
            })
            setSolutions(solutionInit)
            props.setSolutions(solutionInit)
        }
    }, [problems, props.solutions, props.setSolutions])

    if (problems.length !== solutions.length) {
        return null
    }

    return (
        <View style={{
            flex: 1,
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
            key={solutions}
        >
            {
                problems.map((problem: any, index: any) => {
                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25, backgroundColor: '#fff' }} key={index}>
                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                            <View style={{ paddingTop: 15, backgroundColor: '#fff' }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 17, paddingBottom: 25, marginRight: 10 }}>
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
                                editable={false}
                                value={problem.points + ' Points'}
                                style={styles.input}
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />
                        </View>
                        {
                            problem.options.map((option: any, i: any) => {

                                let color = '#202025'
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (props.graded && option.isCorrect && solutions[index].selected[i].isSelected) {
                                    color = '#3B64F8'
                                }

                                return <View style={{ flexDirection: 'row', backgroundColor: '#fff' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingTop: 15, backgroundColor: '#fff' }}>
                                        <CheckBox
                                            disabled={props.graded || props.isOwner || props.hasEnded}
                                            style={{ paddingRight: 20 }}
                                            isChecked={props.isOwner ? option.isCorrect : solutions[index].selected[i].isSelected}
                                            onClick={() => {
                                                const updatedSolution = [...solutions]
                                                updatedSolution[index].selected[i].isSelected = Boolean(!updatedSolution[index].selected[i].isSelected);
                                                setSolutions(updatedSolution)
                                                props.setSolutions(updatedSolution)
                                            }}
                                        />
                                    </View>
                                    <View style={{ backgroundColor: '#fff' }}>
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
                                                                width: '100%',
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
                                </View>
                            })
                        }
                    </View>
                })
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
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
