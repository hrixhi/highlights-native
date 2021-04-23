import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import CheckBox from 'react-native-check-box';

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>([])

    return (
        <View style={{
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}>
            {
                problems.map((problem: any, index: any) => {
                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25, backgroundColor: 'white' }}>
                        <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                            <View style={{ paddingTop: 15, backgroundColor: 'white' }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 17, paddingBottom: 25, marginRight: 10 }}>
                                    {index + 1}.
                            </Text>
                            </View>
                            <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                                <TextInput
                                    value={problem.question}
                                    style={styles.input}
                                    placeholder={'Problem ' + (index + 1).toString()}
                                    onChangeText={val => {
                                        const newProbs = [...problems];
                                        newProbs[index].question = val;
                                        setProblems(newProbs)
                                        props.setProblems(newProbs)
                                    }}
                                    placeholderTextColor={'#a2a2aa'}
                                />
                                <View style={{ flex: 1 }} />
                                <TextInput
                                    value={problem.points}
                                    style={styles.input}
                                    placeholder={'Enter points'}
                                    onChangeText={val => {
                                        const newProbs = [...problems];
                                        newProbs[index].points = val;
                                        setProblems(newProbs)
                                        props.setProblems(newProbs)
                                    }}
                                    placeholderTextColor={'#a2a2aa'}
                                />
                            </View>
                            <View style={{ paddingTop: 15, paddingLeft: 10 }}>
                                <Ionicons
                                    name='close-outline'
                                    onPress={() => {
                                        const updatedProblems = [...problems]
                                        updatedProblems.splice(index, 1);
                                        setProblems(updatedProblems)
                                        props.setProblems(updatedProblems)
                                    }}
                                />
                            </View>
                        </View>
                        {
                            problem.options.map((option: any, i: any) => {
                                return <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                    <View style={{ paddingTop: 15, backgroundColor: '#fff' }}>
                                        <CheckBox
                                            style={{ paddingRight: 20 }}
                                            isChecked={option.isCorrect}
                                            onClick={() => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].options[i].isCorrect = !updatedProblems[index].options[i].isCorrect;
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                    </View>
                                    <TextInput
                                        value={option.option}
                                        style={styles.input}
                                        placeholder={'Option ' + (i + 1).toString()}
                                        onChangeText={val => {
                                            const newProbs = [...problems];
                                            newProbs[index].options[i].option = val;
                                            setProblems(newProbs)
                                            props.setProblems(newProbs)
                                        }}
                                        placeholderTextColor={'#a2a2aa'}
                                    />
                                    <View style={{ paddingTop: 15, paddingLeft: 10, backgroundColor: '#fff' }}>
                                        <Ionicons
                                            name='close-outline'
                                            onPress={() => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].options.splice(i, 1);
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                    </View>
                                </View>
                            })
                        }
                        <TouchableOpacity
                            onPress={() => {
                                const updatedProblems = [...problems]
                                updatedProblems[index].options.push({
                                    option: '',
                                    isCorrect: false
                                })
                                setProblems(updatedProblems)
                                props.setProblems(updatedProblems)
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                maxHeight: 70,
                                marginTop: 15,
                                width: '100%',
                                justifyContent: 'flex-start', flexDirection: 'row',
                                marginBottom: 50
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025',
                                fontSize: 12,
                                overflow: 'hidden',
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                            }}>
                                ADD CHOICE
                            </Text>
                        </TouchableOpacity>
                    </View>
                })
            }
            <View style={{ backgroundColor: 'white' }}>
                <TouchableOpacity
                    onPress={() => {
                        const updatedProblems = [...problems, { question: '', options: [], points: '' }]
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 15,
                        width: '100%', justifyContent: 'center', flexDirection: 'row',
                        marginBottom: 50
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        fontSize: 12,
                        backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 200,
                        overflow: 'hidden',
                        borderRadius: 15,
                    }}>
                        ADD PROBLEM
                  </Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default QuizCreate;

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
