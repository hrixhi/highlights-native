import React, { useState, useCallback } from 'react';
import { Image, StyleSheet } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import CheckBox from 'react-native-check-box';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";

const questionTypeOptions = [
    {
        label: "MCQ",
        value: "",
    },
    {
        label: "Free response",
        value: "freeResponse"
    },
]


const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : [])
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});

    const galleryCallback = useCallback(async (index: any, i: any) => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync()
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
            if (!updatedGallerySettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });

        if (!result.cancelled) {
            if (i !== null) {
                const newProbs = [...problems];
                newProbs[index].options[i].option = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            } else {
                const newProbs = [...problems];
                newProbs[index].question = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            }
        }
    }, [problems, props.setProblems])

    const removeHeadersOnDeleteProblem = (index: number) => {

        const headerPositions = Object.keys(headers);

        const headerIndicesToUpdate = headerPositions.filter((i: any) => i > index);

        const currentHeaders = JSON.parse(JSON.stringify(headers));

        delete currentHeaders[index];

        headerIndicesToUpdate.forEach((i: any) => {

            const currHeaderValue = headers[i];

            delete currentHeaders[i];

            currentHeaders[i - 1] = currHeaderValue;

        })

        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders)

    }

    const addHeader = (index: number) => {

        // Use headers as an object with key as index values
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        currentHeaders[index] = "";
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);

    }

    const removeHeader = (index: number) => {

        const currentHeaders = JSON.parse(JSON.stringify(headers));
        delete currentHeaders[index];
        setHeaders(currentHeaders)
        props.setHeaders(currentHeaders);

    }

    const renderHeaderOption = (index: number) => {
        return <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff'  }} >
                { index in headers
                ? 
                <View style={{ flexDirection: 'row', width: '100%', marginTop: 50, backgroundColor: '#fff'  }}>
                    <View style={{ width: '90%', backgroundColor: '#fff' }}>
                        <TextInput
                            value={headers[index]}
                            placeholder={'Header'}
                            onChangeText={val => {
                                const currentHeaders = JSON.parse(JSON.stringify(headers)) 
                                currentHeaders[index] = val
                                setHeaders(currentHeaders);
                                props.setHeaders(currentHeaders)
                            }}
                            placeholderTextColor={'#a2a2aa'}
                            hasMultipleLines={false}
                        />
                    </View>

                    <View style={{ paddingTop: 15, paddingLeft: 10, backgroundColor: '#fff'  }}>
                        <Ionicons
                            name='close-outline'
                            onPress={() => {
                               removeHeader(index)
                            }}
                        />
                    </View>
                </View>
                : 
                
                <TouchableOpacity 
                    style={{ width: 100, flexDirection: 'row', backgroundColor: '#fff' }} 
                    onPress={() => addHeader(index)}
                >
                    {/* <Ionicons name='add-circle' size={19} color={"#202025"} /> */}
                    <Text
                        style={{
                            marginLeft: 10,
                            fontSize: 10,
                            paddingBottom: 20,
                            textTransform: "uppercase",
                            // paddingLeft: 20,
                            flex: 1,
                            lineHeight: 25,
                            color: '#a2a2aa'
                        }}>
                        Add HEADER
                    </Text>
                </TouchableOpacity>}
            </View>
    }


    return (
        <View style={{
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}>
             {/* Insert HEADER FOR INDEX 0 */}
            {renderHeaderOption(0)}
            {
                problems.map((problem: any, index: any) => {

                    const { questionType } = problem;

                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25, backgroundColor: 'white' }}>
                        <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                            <View style={{ paddingTop: 15, backgroundColor: 'white' }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 16, paddingBottom: 25, marginRight: 10 }}>
                                    {index + 1}.
                            </Text>
                            </View>
                            <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                <View style={{ backgroundColor: '#fff', width: '50%' }}>
                                    {
                                        problem.question && problem.question.includes("image:") ?
                                            <Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 400,
                                                    height: 400,
                                                    maxWidth: '100%'
                                                }}
                                                source={{
                                                    uri: problem.question.split("image:")[1]
                                                }}
                                            />
                                            :
                                            <TextInput
                                                value={problem.question}
                                                // style={styles.input}
                                                placeholder={PreferredLanguageText('problem') + " " + (index + 1).toString()}
                                                onChangeText={val => {
                                                    const newProbs = [...problems];
                                                    newProbs[index].question = val;
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                }}
                                                placeholderTextColor={'#a2a2aa'}
                                                hasMultipleLines={true}
                                            />
                                    }
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff', paddingLeft: 10
                                        }}
                                        onPress={() => {
                                            if (problem.question && problem.question.includes("image:")) {
                                                const newProbs = [...problems];
                                                newProbs[index].question = "";
                                                setProblems(newProbs)
                                                props.setProblems(newProbs)
                                            } else {
                                                galleryCallback(index, null)
                                            }
                                        }}
                                    >
                                        <Text
                                            style={{
                                                paddingTop: problem.question && problem.question.includes("formula:")
                                                    ? 10 : 0,
                                                color: '#a2a2aa',
                                                fontFamily: 'Overpass',
                                                fontSize: 10,
                                            }}
                                        >
                                            {
                                                problem.question && problem.question.includes("image:")
                                                    ? "Remove Image" : "Add Image"
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'row', width: '50%', maxWidth: '50%', paddingLeft: 10, }}>

                                    <View style={{ width: '75%', backgroundColor: 'white' }}>
                                        <TextInput
                                            value={problem.points}
                                            // style={{ width: '100%' }}
                                            // style={styles.input}
                                            placeholder={PreferredLanguageText('enterPoints')}
                                            onChangeText={val => {
                                                const newProbs = [...problems];
                                                newProbs[index].points = val;
                                                setProblems(newProbs)
                                                props.setProblems(newProbs)
                                            }}
                                            placeholderTextColor={'#a2a2aa'}
                                        />
                                    </View>
                                    
                                     <Ionicons
                                        name='close-outline'
                                        onPress={() => {
                                            const updatedProblems = [...problems]
                                            updatedProblems.splice(index, 1);
                                            removeHeadersOnDeleteProblem(index + 1);
                                            setProblems(updatedProblems)
                                            props.setProblems(updatedProblems)
                                        }}
                                    />
                                </View>
                                
                            </View>
                        </View>

                        {/* Required */}
                        
                        <View style={{ paddingTop: 25, paddingLeft: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff"}}>
                            <CheckBox
                                style={{ paddingRight: 10 }}
                                isChecked={problem.required}
                                onClick={() => {
                                    const updatedProblems = [...problems]
                                    updatedProblems[index].required = !updatedProblems[index].required;
                                    setProblems(updatedProblems)
                                    props.setProblems(updatedProblems)
                                }}
                            />
                            <Text style={{ fontSize: 12, color: '#a2a2aa'  }}>
                                Required
                            </Text>
                        </View>

                        {/* <View
                            style={{
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: 'row',
                            }}>
                            <Picker
                                style={styles.picker}
                                itemStyle={{
                                    fontSize: 15
                                }}
                                selectedValue={questionType}
                                onValueChange={(questionType: any) => {
                                    const updatedProblems = [...problems]
                                    updatedProblems[index].questionType = questionType;

                                    // Clear Options 
                                    if (questionType !== "") {
                                        updatedProblems[index].options = []
                                    }
                                    setProblems(updatedProblems)
                                    props.setProblems(updatedProblems)
                                }}>
                                {questionTypeOptions.map((item: any, index: number) => {
                                    return (
                                        <Picker.Item
                                            color={questionType === item.value ? "#3B64F8" : "#202025"}
                                            label={item.value === "" ? "MCQ" : item.label}
                                            value={item.value}
                                            key={index}
                                        />
                                    );
                                })}
                            </Picker>
                        </View> */}

                        {/* Use Checkbox for Question Type */}
                        <View style={{ paddingTop: 25, paddingLeft: 10, paddingBottom: 25, flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff"}}>
                            
                            <CheckBox
                                style={{ paddingRight: 10 }}
                                isChecked={questionType === ""}
                                onClick={() => {
                                    const updatedProblems = [...problems]
                                    updatedProblems[index].questionType = "";

                                    // Clear Options 
                                    // if (questionType !== "") {
                                    updatedProblems[index].options = []
                                    // }
                                    setProblems(updatedProblems)
                                    props.setProblems(updatedProblems)
                                }}
                            />
                            <Text style={{ fontSize: 12, color: '#a2a2aa', marginRight: 50  }}>
                                MCQ
                            </Text>

                            <CheckBox
                                style={{ paddingRight: 10 }}
                                isChecked={questionType === "freeResponse"}
                                onClick={() => {
                                    const updatedProblems = [...problems]
                                    updatedProblems[index].questionType = "freeResponse";

                                    // Clear Options 
                                    // if (questionType !== "") {
                                    updatedProblems[index].options = []
                                    // }
                                    setProblems(updatedProblems)
                                    props.setProblems(updatedProblems)
                                }}
                            />
                            <Text style={{ fontSize: 12, color: '#a2a2aa'  }}>
                                Free Response
                            </Text>

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
                                    <View style={{ backgroundColor: '#fff', width: '80%' }}>
                                        {
                                            option.option && option.option.includes("image:") ?
                                                <Image
                                                    resizeMode={'contain'}
                                                    style={{
                                                        width: 200,
                                                        height: 200
                                                    }}
                                                    source={{
                                                        uri: option.option.split("image:")[1]
                                                    }}
                                                /> :
                                                <TextInput
                                                    value={option.option}
                                                    // style={styles.input}
                                                    placeholder={PreferredLanguageText('option') + " " + (i + 1).toString()}
                                                    onChangeText={val => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].options[i].option = val;
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    }}
                                                    placeholderTextColor={'#a2a2aa'}
                                                />
                                        }
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#fff', paddingLeft: 10
                                            }}
                                            onPress={() => {
                                                if (option.option && option.option.includes("image:")) {
                                                    const newProbs = [...problems];
                                                    newProbs[index].options[i].option = "";
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                } else {
                                                    galleryCallback(index, i)
                                                }
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    paddingTop: option.option && option.option.includes("formula:")
                                                        ? 10 : 0,
                                                    color: '#a2a2aa',
                                                    fontFamily: 'Overpass',
                                                    fontSize: 10
                                                }}
                                            >
                                                {
                                                    option.option && option.option.includes("image:")
                                                        ? "Remove Image" : "Add Image"
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
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
                        {questionType === "" ? <TouchableOpacity
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
                                width: 100, flexDirection: 'row', backgroundColor: 'white'
                            }}>
                            <Text style={{
                                marginLeft: 10,
                                fontSize: 10,
                                paddingBottom: 50,
                                textTransform: "uppercase",
                                flex: 1,
                                lineHeight: 25,
                                color: "#a2a2aa",
                                paddingTop: 30

                            }}>
                                {PreferredLanguageText('addChoice')}
                            </Text>
                        </TouchableOpacity> : <View style={{ height: 100, backgroundColor: 'white' }} />}
                        {renderHeaderOption(index + 1)}
                    </View>
                })
            }

            

            <View style={{ backgroundColor: 'white', flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity
                    onPress={() => {
                        const updatedProblems = [...problems, { question: '', options: [], points: '', questionType: '', required: true }]
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        width: 100, flexDirection: 'row', backgroundColor: 'white'
                    }}>
                    <Text style={{
                        marginLeft: 10,
                        fontSize: 10,
                        paddingBottom: 20,
                        textTransform: "uppercase",
                        flex: 1,
                        lineHeight: 25,
                        color: "#a2a2aa"
                    }}>
                        {PreferredLanguageText('addProblem')}
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
    },
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        width: "100%",
        // height: 200,
        // alignSelf: 'center',
        // marginTop: -20,
        borderRadius: 3
    },
});

