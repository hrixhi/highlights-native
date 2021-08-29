import React, { useState, useCallback, useRef } from 'react';
import { Dimensions, Image, StyleSheet, Keyboard } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import CheckBox from 'react-native-check-box';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from "react-native-popup-menu";

import { Video } from 'expo-av';

import RenderHtml from 'react-native-render-html';

const questionTypeOptions = [
    {
        label: "MCQ",
        value: "",
    },
    {
        label: "Free response",
        value: "freeResponse"
    },
    {
        label: "True/False",
        value: "trueFalse"
    }
]

const questionTypeLabels = {
    "": "MCQ",
    "freeResponse": "Free response",
    "trueFalse": "True/False"
}

import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';

import {
    actions,
    RichEditor,
    RichToolbar,
  } from "react-native-pell-rich-editor";

import Alert from "../components/Alert";

import FileUpload from "./UploadFiles";

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : [])
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [height, setHeight] = useState(100);
    const [equation, setEquation] = useState("y = x + 1");
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    let RichText: any = useRef();
    let videoRef: any = useRef();

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

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
    
    const renderQuestionEditor = (index: number) => {

        if (editQuestionNumber === 0) return null;

        let audioVideoQuestion = problems[index].question[0] === "{"  && problems[index].question[problems[index].question.length - 1] === "}";

        let url = "";
        let type = "";
        let content = "";

        if (audioVideoQuestion) {
            const parse = JSON.parse(problems[index].question);

            url = parse.url;
            content = parse.content;
            type = parse.type;
        }
        
        return (<View >
            <RichToolbar
                key={reloadEditorKey.toString()}
                style={{
                  flexWrap: "wrap",
                  backgroundColor: "white",
                  height: 28,
                  overflow: "visible",
                  alignItems: 'flex-start'
                }}
                iconSize={12}
                editor={RichText}
                disabled={false}
                iconTint={"#2f2f3c"}
                selectedIconTint={"#2f2f3c"}
                disabledIconTint={"#2f2f3c"}
                actions={
                    [
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                    //   actions.checkboxList,
                      actions.insertLink,
                      actions.insertImage,
                      // "insertCamera",
                      actions.undo,
                      actions.redo,
                      "clear",
                    ]
                }
                iconMap={{
                  ["insertCamera"]: ({ tintColor }) => (
                    <Ionicons
                      name="camera-outline"
                      size={15}
                      color={tintColor}
                    />
                  ),
                  ["clear"]: ({ tintColor }) => (
                    <Ionicons
                      name="trash-outline"
                      size={13}
                      color={tintColor}
                    //   onPress={() => clearAll()}
                    />
                  ),
                }}
                onPressAddImage={galleryCallback}
                insertCamera={cameraCallback}
              />
                {audioVideoQuestion || !showImportOptions ? null : (
                    <View style={{ paddingVertical: 10 }}>
                        <FileUpload
                            action={"audio/video"}
                            back={() => setShowImportOptions(false)}
                            onUpload={(u: any, t: any) => {
                                console.log("url after upload", u)
                                const obj = { url: u, type: t, content: '' };
                                const newProbs = [...problems];
                                console.log("New problems", newProbs);
                                newProbs[index].question = JSON.stringify(obj);
                                console.log("Update with object problems", newProbs);
                                setProblems(newProbs)
                                props.setProblems(newProbs)
                                setShowImportOptions(false);
                            }}
                        />
                    </View>
                )}
                {audioVideoQuestion ? 
                    renderAudioVideoPlayer(url, type)
                  : null
                }
                <RichEditor
                    key={reloadEditorKey.toString()}
                    containerStyle={{
                        height: 250,
                        backgroundColor: "#fff",
                        padding: 3,
                        paddingTop: 5,
                        paddingBottom: 10,
                        // borderRadius: 15,
                        display: "flex",
                    }}
                    ref={RichText}
                    style={{
                        width: "100%",
                        backgroundColor: "#fff",
                        // borderRadius: 15,
                        minHeight: 250,
                        display: "flex",
                        borderBottomWidth: 1,
                        borderColor: "#a2a2ac",
                        paddingBottom: 10
                    }}
                    editorStyle={{
                        backgroundColor: "#fff",
                        placeholderColor: "#a2a2ac",
                        color: "#2F2F3C",
                        contentCSSText: "font-size: 14px;",
                        
                    }}
                    initialContentHTML={audioVideoQuestion ? content : problems[index].question}
                    onScroll={() => Keyboard.dismiss()}
                    placeholder={"Problem"}
                    onChange={(text) => {
                        if (audioVideoQuestion) {
                            const currQuestion = JSON.parse(problems[index].question);
                            const updatedQuestion = {
                                ...currQuestion,
                                content: text
                            }
                            const newProbs = [...problems];
                            newProbs[index].question = JSON.stringify(updatedQuestion);
                            setProblems(newProbs)
                            props.setProblems(newProbs)

                        } else {
                            const modifedText = text.split("&amp;").join("&");
                            // setCue(modifedText);
                            const newProbs = [...problems];
                            newProbs[index].question = modifedText;
                            setProblems(newProbs)
                            props.setProblems(newProbs)
                        }
                    }}
                    onHeightChange={handleHeightChange}
                    onBlur={() => Keyboard.dismiss()}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    allowsFullscreenVideo={true}
                    allowsInlineMediaPlayback={true}
                    allowsLinkPreview={true}
                    allowsBackForwardNavigationGestures={true}
                />
        </View>)
    }

    const cameraCallback = useCallback(async () => {

        const cameraSettings = await ImagePicker.getCameraPermissionsAsync()
        if (!cameraSettings.granted) {
            await ImagePicker.requestCameraPermissionsAsync();
            const updatedCameraSettings = await ImagePicker.getCameraPermissionsAsync()
            if (!updatedCameraSettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });
        if (!result.cancelled) {
            const dir = FileSystem.documentDirectory + 'images'
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const fileName = Math.round((Math.random() * 100)).toString();
            FileSystem.copyAsync({
                from: result.uri,
                to: dir + '/' + fileName + '.jpg'
            }).then(r => {
                ImageManipulator.manipulateAsync(
                    (dir + '/' + fileName + '.jpg'),
                    [],
                    { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                ).then(res => {
                    RichText.current.insertImage(
                        'data:image/jpeg;base64,' + res.base64, 'border-radius: 10px'
                    )
                    // setReloadEditorKey(Math.random())
                }).catch(err => {
                    Alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert("Something went wrong.")
            })
        }

    }, [RichText, RichText.current])

    const galleryCallback = useCallback(async () => {

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
            const dir = FileSystem.documentDirectory + 'images'
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const fileName = Math.round((Math.random() * 100)).toString();
            FileSystem.copyAsync({
                from: result.uri,
                to: dir + '/' + fileName + '.jpg'
            }).then((r) => {
                ImageManipulator.manipulateAsync(
                    (dir + '/' + fileName + '.jpg'),
                    [],
                    { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                ).then(res => {
                    RichText.current.insertImage(
                        'data:image/jpeg;base64,' + res.base64, 'border-radius: 10px'
                    )
                }).catch(err => {
                    Alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert("Something went wrong.")
            })
        }
    }, [RichText, RichText.current])


    const optionGalleryCallback = useCallback(async (index: any, i: any) => {
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
        return <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start' }} >
            {index in headers
                ?
                <View style={{ flexDirection: 'row', width: '95%', marginTop: 50, paddingLeft: 20 }}>
                    <View style={{ width: Dimensions.get('window').width < 768 ? '90%' : '50%' }}>
                        <AutoGrowingTextInput
                            value={headers[index]}
                            placeholder={'Heading'}
                            onChange={(e: any) => {
                                const currentHeaders = JSON.parse(JSON.stringify(headers))
                                currentHeaders[index] =  e.nativeEvent.text;
                                setHeaders(currentHeaders);
                                props.setHeaders(currentHeaders)
                            }}
                            placeholderTextColor={'#a2a2ac'}
                            style={{ maxWidth: '100%', marginBottom: 10, marginTop: 10, paddingTop: 13, paddingBottom: 13, fontSize: 15, borderBottomColor: '#cccccc', borderBottomWidth: 1 }}
                            // hasMultipleLines={false}
                        />
                    </View>
                    <View style={{ paddingTop: 20, paddingLeft: 20 }}>
                        <Ionicons
                            name='close-outline'
                            onPress={() => {
                                removeHeader(index)
                            }}
                            size={17}
                        />
                    </View>
                </View>
                :
                <TouchableOpacity
                    style={{
                        width: 100, flexDirection: 'row', marginLeft: 35
                    }}
                    onPress={() => addHeader(index)}
                >
                    {/* <Ionicons name='add-circle' size={19} color={"#2F2F3C"} /> */}
                    <Text
                        style={{
                            // marginLeft: 10,
                            fontSize: 10,
                            paddingBottom: 20,
                            textTransform: "uppercase",
                            // paddingLeft: 20,
                            flex: 1,
                            lineHeight: 25,
                            color: '#2f2f3c',
                        }}>
                        Add Header
                    </Text>
                </TouchableOpacity>}
        </View>
    }

    const isCurrentQuestionValid = (index: number) => {

        if (editQuestionNumber === 0) return true;

        const currentQuestion = problems[index];
        
        if (currentQuestion.question === "") {
            alert(`Question ${index + 1} has no content.`)
            return false; 
        }

        if (currentQuestion.points === "") {
            alert(`Enter points for Question ${index + 1}.`)
            return false; 
        }

        if (currentQuestion.questionType === "" && currentQuestion.options.length < 2) {
            alert(`Create at least 2 options for Question ${index + 1}.`)
            return false; 
        }

        if ((currentQuestion.questionType === "" || currentQuestion.questionType === "trueFalse")) {

            let error = false;

            const keys: any = {};

            let optionFound = false;

            currentQuestion.options.map((option: any) => {
                if (option.option === "" || option.option === "formula:") {
                    alert(`Fill missing option for Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.option in keys) {
                    alert(`Option repeated in a Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.isCorrect) {
                    optionFound = true;
                }

                keys[option.option] = 1;
            });

            if (!optionFound || error) {
                alert(`Select a correct answer for Question ${index + 1}.`)
                return false;
            }

        }

        return true;

    }

    const tagsStyles = {
        body: {
          fontSize: 15,
          lineHeight: 25
        },
    };
      


    return (
        <View style={{
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            borderTopColor: '#f4f4f6',
            borderTopWidth: 1,
        }}>

            {
                problems.map((problem: any, index: any) => {

                    const { questionType } = problem;

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

                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25, backgroundColor: 'white' }}>
                        {renderHeaderOption(index)}
                        <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                            <View style={{ paddingTop: 15 }}>
                                <Text style={{ color: '#2f2f3c', fontSize: 15, paddingBottom: 25, paddingRight: 20, paddingTop: 45 }}>
                                    {index + 1}.
                                </Text>
                            </View>
                            <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', width: '95%' }}>
                                <View key={reloadEditorKey} style={{ width: Dimensions.get('window').width < 768 ? '95%' : '70%', paddingTop: 35 }}>
                                    {
                                        (editQuestionNumber === (index + 1) ? renderQuestionEditor(index) : (audioVideoQuestion ? <View>
                                            {renderAudioVideoPlayer(url, type)}
                                            <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15 }}>
                                            <RenderHtml
                                                contentWidth={Dimensions.get('window').width < 768 ? Dimensions.get('window').width * 0.8 : Dimensions.get('window').width }
                                                source={{
                                                    html: content
                                                }}
                                                enableExperimentalMarginCollapsing={true}
                                                tagsStyles={tagsStyles}
                                            /> 
                                            </Text>
                                        </View> : <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15 }}>
                                            <RenderHtml
                                                // contentWidth={"100%"}
                                                contentWidth={Dimensions.get('window').width < 768 ? Dimensions.get('window').width : Dimensions.get('window').width }
                                                source={{
                                                    html: problem.question
                                                }}
                                                enableExperimentalMarginCollapsing={true}
                                                tagsStyles={tagsStyles}
                                            /> 
                                        </Text>))
                                    }
                                    {(editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 20 }}>
                                        { 
                                            <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff'
                                                    }}
                                                    onPress={() => {
                                                        setShowImportOptions(!showImportOptions)
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#a2a2ac',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10,
                                                            marginLeft: 20
                                                        }}
                                                    >
                                                        {
                                                            showImportOptions ? "" : "INSERT AUDIO/VIDEO"
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                    </View> : null)}
                                </View>
                                <View style={{ flexDirection: editQuestionNumber !== (index + 1) ? 'row' : 'column',  paddingLeft: Dimensions.get('window').width > 768 ? 50 : 0, marginTop: 15, alignItems: 'center'  }}>
                                    <View style={{
                                        display: 'flex',
                                        // alignItems: 'center',
                                        flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column',
                                        paddingTop: 25,
                                    }}>
                                        <TextInput
                                            value={editQuestionNumber === (index + 1) ? problem.points : ((problem.points === "" ? "Enter" : problem.points) + " " + (Number(problem.points) === 1 ? 'Point' : 'Points'))}
                                            editable={editQuestionNumber === (index + 1)}
                                            // style={styles.input}
                                            style={{
                                                fontSize: 15,
                                                padding: 15,
                                                paddingTop: 12,
                                                paddingBottom: 12,
                                                marginTop: 5,
                                                width: editQuestionNumber !== (index + 1) ? 120 : 75,
                                                textAlign: 'center',
                                                marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30,
                                                fontWeight: editQuestionNumber === (index + 1) ? 'normal' : '700',
                                                borderBottomColor: '#cccccc',
                                                borderBottomWidth: editQuestionNumber === (index + 1) ? 1 : 0,
                                            }}
                                            placeholder={'Points'}
                                            onChangeText={val => {
                                                const newProbs = [...problems];
                                                newProbs[index].points = val;
                                                setProblems(newProbs)
                                                props.setProblems(newProbs)
                                            }}
                                            placeholderTextColor={'#a2a2ac'}
                                        />

                                        {editQuestionNumber === (index + 1) ? <View
                                            style={{
                                                // display: 'flex',
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                marginBottom: Dimensions.get('window').width < 768 ? 0 : 20,
                                            }}>
                                            <Menu
                                                onSelect={(questionType: any) => {
                                                    const updatedProblems = [...problems]
                                                    updatedProblems[index].questionType = questionType;
                                                    // Clear Options 
                                                    if (questionType === "freeResponse") {
                                                        updatedProblems[index].options = []
                                                    } else if (questionType === "trueFalse") {
                                                        updatedProblems[index].options = []
                                                        updatedProblems[index].options.push({
                                                            option: 'True',
                                                            isCorrect: false
                                                        })
                                                        updatedProblems[index].options.push({
                                                            option: 'False',
                                                            isCorrect: false
                                                        })
                                                    }
                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                                style={{ paddingRight: 20, paddingLeft: 20 }}
                                            >
                                                <MenuTrigger>
                                                    <Text
                                                        style={{
                                                            fontFamily: "inter",
                                                            fontSize: 14,
                                                            color: "#2F2F3C",
                                                        }}
                                                    >
                                                        {questionType === "" ? "MCQ" : questionTypeLabels[questionType]}
                                                        <Ionicons name="caret-down" size={14} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions
                                                    customStyles={{
                                                        optionsContainer: {
                                                            padding: 10,
                                                            borderRadius: 15,
                                                            shadowOpacity: 0,
                                                            borderWidth: 1,
                                                            borderColor: "#f4f4f6",
                                                            overflow: 'scroll',
                                                            maxHeight: '100%'
                                                        },
                                                    }}
                                                >
                                                    {questionTypeOptions.map((item: any) => {
                                                        return (
                                                            <MenuOption value={item.value}>
                                                                <Text>{item.value === "" ? "MCQ" : item.label}</Text>
                                                            </MenuOption>
                                                        );
                                                    })}
                                                </MenuOptions>
                                            </Menu>
                                        </View> : null}
                                    </View>


                                    <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column', }}>
                                        {editQuestionNumber === (index + 1) ? <View style={{ paddingTop: 15, flexDirection: 'row', alignItems: 'center', marginBottom: Dimensions.get('window').width < 768 ? 0 : 20, }}>
                                            <CheckBox
                                                // style={{ paddingRight: 0 }}
                                                isChecked={problem.required}
                                                onClick={() => {
                                                    const updatedProblems = [...problems]
                                                    updatedProblems[index].required = !updatedProblems[index].required;
                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                            />
                                            <Text style={{ fontSize: 10, textTransform: 'uppercase', marginLeft: 10 }}>
                                                Required
                                            </Text>
                                        </View> : null}
                                        <View style={{ paddingTop: 10, paddingLeft: editQuestionNumber === (index + 1) ? 0 : 25, flexDirection: 'row', alignItems: 'center', marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30, }}>
                                            {editQuestionNumber === (index + 1) ? 
                                            <View style={{ flexDirection: 'row', paddingLeft: Dimensions.get('window').width < 768 ? 20 : 0  }}>
                                                <Ionicons
                                                    name='checkmark-circle-outline'
                                                    color={"#53BE6D"}
                                                    style={{
                                                        marginRight: 30
                                                    }}
                                                    onPress={() => {
                                                        if (isCurrentQuestionValid(editQuestionNumber - 1)) {
                                                            setEditQuestionNumber(0)
                                                        }
                                                    }}
                                                    size={22}
                                                />

                                                <Ionicons
                                                    name='trash-outline'
                                                    color={"#D91D56"}
                                                    onPress={() => {
                                                        Alert(`Delete Question ${editQuestionNumber} ?`, "", [
                                                            {
                                                                text: "Cancel",
                                                                style: "cancel",
                                                            },
                                                            {
                                                                text: "Clear",
                                                                onPress: () => {
                                                                    const updatedProblems = [...problems]
                                                                    updatedProblems.splice(index, 1);
                                                                    removeHeadersOnDeleteProblem(index + 1);
                                                                    setProblems(updatedProblems)
                                                                    props.setProblems(updatedProblems)
                                                                    setEditQuestionNumber(0);
                                                                },
                                                            },
                                                        ])
                                                    }}
                                                    size={22}
                                                />
                                            </View> : <Ionicons
                                            name='pencil-outline'
                                            color={'#3B64F8'}
                                            onPress={() => {
                                                if (isCurrentQuestionValid(editQuestionNumber - 1)) {
                                                    setEditQuestionNumber(index + 1)
                                                }
                                            }}
                                            size={22}
                                        />}
                                     </View>
                                    </View>
                                </View>

                            </View>
                        </View>
                        {
                            problem.options.map((option: any, i: any) => {
                                return <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                    <View style={{ paddingTop: 25, paddingHorizontal: 25 }}>
                                        <CheckBox
                                            disabled={editQuestionNumber !== (index + 1)}
                                            style={{ paddingRight: 20 }}
                                            isChecked={option.isCorrect}
                                            onClick={() => {
                                                const updatedProblems = [...problems]
                                                if (questionType === "trueFalse") {
                                                    updatedProblems[index].options[0].isCorrect = false;
                                                    updatedProblems[index].options[1].isCorrect = false;
                                                }
                                                updatedProblems[index].options[i].isCorrect = !updatedProblems[index].options[i].isCorrect;
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        
                                        />
                                    </View>
                                    <View style={{ width: '100%', paddingRight: 30 }}>
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
                                                <AutoGrowingTextInput
                                                    value={option.option}
                                                    style={styles.input}
                                                    placeholder={PreferredLanguageText('option') + " " + (i + 1).toString()}
                                                    onChange={(e: any) => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].options[i].option = e.nativeEvent.text;
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    }}
                                                    editable={questionType !== "trueFalse" && editQuestionNumber === (index + 1)}
                                                    placeholderTextColor={'#a2a2ac'}
                                                />
                                        }
                                        {editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row' }}>
                                            {questionType === "trueFalse" ? null : <TouchableOpacity
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
                                                        optionGalleryCallback(index, i)
                                                    }
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        paddingTop: option.option && option.option.includes("formula:")
                                                            ? 10 : 0,
                                                        color: '#a2a2ac',
                                                        fontFamily: 'Overpass',
                                                        fontSize: 10
                                                    }}
                                                >
                                                    {
                                                        option.option && option.option.includes("image:")
                                                            ? "REMOVE IMAGE" : "ADD IMAGE"
                                                    }
                                                </Text>
                                            </TouchableOpacity>}
                                            {questionType === "trueFalse" ? null :
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff', paddingLeft: 10
                                                    }}
                                                    onPress={() => {
                                                        const updatedProblems = [...problems]
                                                        updatedProblems[index].options.splice(i, 1);
                                                        setProblems(updatedProblems)
                                                        props.setProblems(updatedProblems)
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingTop: option.option && option.option.includes("formula:")
                                                                ? 10 : 0,
                                                            color: '#a2a2ac',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10
                                                        }}
                                                    >
                                                        CLEAR
                                                    </Text>
                                                </TouchableOpacity>
                                            }
                                        </View> : null}
                                    </View>

                                </View>
                            })
                        }
                        {editQuestionNumber === (index + 1) && questionType === "" ? <TouchableOpacity
                            onPress={() => {
                                const updatedProblems = [...problems]
                                updatedProblems[index].options.push({
                                    option: '',
                                    isCorrect: false
                                })
                                setProblems(updatedProblems)
                                props.setProblems(updatedProblems)
                            }}
                            style={{ width: 100, flexDirection: 'row', marginLeft: 22, marginTop: 20 }}
                        >
                            <Text style={{
                                marginLeft: 10,
                                fontSize: 10,
                                paddingBottom: 50,
                                textTransform: "uppercase",
                                flex: 1,
                                lineHeight: 25,
                                color: "#3b64f8",
                                paddingTop: 30

                            }}>
                                {PreferredLanguageText('addChoice')}
                            </Text>
                        </TouchableOpacity> :
                            <View style={{ height: 100, backgroundColor: 'white' }} />}
                    </View>
                })
            }
            <View style={{
                width: '100%', flexDirection: 'row',
                justifyContent: 'flex-start', paddingLeft: 30,
                paddingTop: 25, borderBottomColor: '#cccccc',
                paddingBottom: 25, borderBottomWidth: 1
            }}>
                <TouchableOpacity
                    onPress={() => {
                        if (!isCurrentQuestionValid(editQuestionNumber - 1)) {
                            return;
                        }
                        const updatedProblems = [...problems, { question: '', options: [], points: '', questionType: '', required: true }]
                        setEditQuestionNumber(problems.length + 1)
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        borderRadius: 15,
                        backgroundColor: "white",
                    }}
                >
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
                            textTransform: "uppercase",
                        }}>
                        Add Problem
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
        fontSize: 11,
        textAlign: 'center',
        width: "100%",
        // height: 200,
        // alignSelf: 'center',
        // marginTop: -20,
        borderRadius: 3
    },
});

