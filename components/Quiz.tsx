import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Text, View } from './Themed';
import CheckBox from 'react-native-check-box';


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
                            <TextInput
                                editable={false}
                                value={problem.question}
                                style={styles.input}
                                placeholder={'Problem ' + (index + 1).toString()}
                                placeholderTextColor={'#a2a2aa'}
                            />
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
