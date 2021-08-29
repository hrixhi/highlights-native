import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions, Keyboard, Switch } from 'react-native';
import { Text, View } from './Themed';
import CheckBox from 'react-native-check-box';
import Latex from 'react-native-latex';
import MathJax from 'react-native-mathjax-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { TextInput as CustomTextInput } from './CustomTextInput';

import { Video } from 'expo-av';

import RenderHtml from 'react-native-render-html';

import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';

import {
    actions,
    RichEditor,
    RichToolbar,
  } from "react-native-pell-rich-editor";

import Alert from "../components/Alert";

import FileUpload from "./UploadFiles";

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

import { RadioButton } from "./RadioButton";

import lodash from "lodash";


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    
    console.log("Props", props)

    const [problems, setProblems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any>([])
    const [updateKey, setUpdateKey] = useState(Math.random())
    const [shuffledProblems, setShuffledProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [headers, setHeaders] = useState<any>(props.headers)
    const [instructions, setInstructions] = useState(props.instructions)
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [modifiedCorrectAnswerProblems, setModifiedCorrectAnswerProblems] = useState<any[]>([]);
    const [regradeChoices, setRegradeChoices] = useState<any[]>([])
    const [timer, setTimer] = useState(false);
    const [height, setHeight] = useState(100);
    const [equation, setEquation] = useState("y = x + 1");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0,
      })

    let RichText: any = useRef();
    let videoRef: any = useRef();

    const regradeOptions = {
        'awardCorrectBoth': 'Award points for both corrected and previously correct answers (no scores will be reduced)',
        'onlyAwardPointsForNew': 'Only award points for new correct answer (some students\'\ scores may be deducted)',
        'giveEveryoneFullCredit': 'Give everyone full credit',
        'noRegrading': 'Update question without regrading.' 
    }

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

    useEffect(() => {

        setHeaders(props.headers);
        setInstructions(props.instructions);

    }, [props.headers, props.instructions])


    useEffect(() => {

        if (props.duration) {
            setTimer(true);

            let hours = Math.floor(props.duration / 3600); 

            let minutes = Math.floor((props.duration - hours * 3600) / 60); 
    
            setDuration({
                hours,
                minutes,
                seconds: 0
            });

        } else {
            setTimer(false);
        }
        
    }, [props.duration])

    // Over here the solutions objeect for modification is first set and updated based on changes...
    useEffect(() => {

        if (props.isOwner) return;

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
    }, [problems, props.solutions, props.setSolutions, props.isOwner])

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

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

    const renderTimer = () => {

        const hours: any[] = [0, 1, 2, 3, 4, 5, 6]
        const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

        return <View
        style={{
          width: Dimensions.get('window').width < 768 ? "100%" : "50%",
          borderRightWidth: 0,
          flex: 1,
          paddingLeft: 0,
          borderColor: "#f4f4f6",
          paddingTop: 10,
          paddingRight: 25
        }}
      >
        <View
          style={{
            width: "100%",
            paddingBottom: 15,
            backgroundColor: "white",
            flexDirection: 'row',
            justifyContent: 'flex-start'
          }}
        >
          <Text style={{
            color: "#2f2f3c",
            fontSize: 11,
            lineHeight: 30,
            // paddingRight: 20,
            paddingTop: 20,
            textTransform: "uppercase",
          }}>
            TIMED
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            width: "100%",
            height: 40,
            marginRight: 10,
            flexDirection: 'row',
            justifyContent: 'flex-start'
          }}
        >
          <Switch
            value={timer}
            onValueChange={() => {
              if (timer) {
                setDuration({
                  hours: 1,
                  minutes: 0,
                  seconds: 0,
                });
              }
              setTimer(!timer);
            }}
            style={{ height: 20, marginRight: 20 }}
            trackColor={{
              false: "#f4f4f6",
              true: "#3B64F8",
            }}
            activeThumbColor="white"
          />
          {timer ? (
          <View
            style={{
              borderRightWidth: 0,
              paddingTop: 0,
              borderColor: "#f4f4f6",
              flexDirection: 'row'
            }}
          >
            <View>
              <Menu onSelect={(hour: any) => setDuration({
                ...duration,
                hours: hour
              })}>
                <MenuTrigger>
                  <Text
                    style={{
                      fontFamily: "inter",
                      fontSize: 14,
                      color: "#2f2f3c",
                    }}
                  >
                    {duration.hours} H <Ionicons name="caret-down" size={14} /> &nbsp;&nbsp;:&nbsp;&nbsp;
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
                  {hours.map((hour: any) => {
                    return (
                      <MenuOption value={hour}>
                        <Text>{hour}</Text>
                      </MenuOption>
                    );
                  })}
                </MenuOptions>
              </Menu>
            </View>
            <View>
              <Menu onSelect={(min: any) => setDuration({
                ...duration,
                minutes: min
              })}>
                <MenuTrigger>
                  <Text
                    style={{
                      fontFamily: "inter",
                      fontSize: 14,
                      color: "#2f2f3c",
                    }}
                  >
                    {duration.minutes}  m  <Ionicons name="caret-down" size={14} />
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
                  {minutes.map((min: any) => {
                    return (
                      <MenuOption value={min}>
                        <Text>{min}</Text>
                      </MenuOption>
                    );
                  })}
                </MenuOptions>
              </Menu>
            </View>
          </View>
        ) : null}
        </View>
      </View>
    }

    const resetChanges = (questionNumber: number) => {

        const currentProblems = lodash.cloneDeep(problems)
        const unmodifiedProblems = lodash.cloneDeep(props.unmodifiedProblems)

        const updateProblems = currentProblems.map((problem: any, index: number) => {
            if (index === questionNumber){ 
                const unmodified : any = { ...unmodifiedProblems[index] }
                unmodified['problemIndex'] = index;
                return unmodified;
            }
            return problem;
        })

        setProblems([...updateProblems]);

        setEditQuestionNumber(0);
    }


    useEffect(() => {

        // Determine if a problem has changed or is same as before
        const modified = problems.map((prob: any, index: number) => {

            // Only regrade MCQs and True and False
            if (prob.questionType === "" || prob.questionType === "trueFalse") {
                const options : any[] = prob.options;

                const unmodifiedOptions : any[] = props.unmodifiedProblems[index].options

                let modifiedCorrectAnswer = false;

                options.map((o: any, i: number) => {
                    if (o.isCorrect !== unmodifiedOptions[i].isCorrect) {
                        modifiedCorrectAnswer = true;
                    }
                })

                return modifiedCorrectAnswer
            } 

            return false;
        })

        setModifiedCorrectAnswerProblems(modified)

    }, [problems])

    useEffect(() => {

        let initialModified = props.problems.map(() => false);
        let initialRegradeChoices = props.problems.map(() => '');

        setModifiedCorrectAnswerProblems(initialModified);
        setRegradeChoices(initialRegradeChoices);

    }, [props.problems])



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

    if (problems.length !== solutions.length && !props.isOwner) {
        return null
    }

    let displayProblems = props.shuffleQuiz && !props.isOwner && !props.submitted ? shuffledProblems : problems;

    let totalPoints = 0;

    problems.map((problem: any) => {
        totalPoints += Number(problem.points)
    })

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
            {
                <View style={{ display: 'flex', flexDirection: 'row', }}>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                        {problems.length} {problems.length === 1 ? "Question" : "Questions"}
                    </Text>
                    <Text style={{ marginRight: 10, fontSize: 15}}>
                        |
                    </Text>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                        {totalPoints} Points 
                    </Text>
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontSize: 15}}>
                        |
                    </Text> : null}
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontWeight: '700' }}>
                        {duration.hours} H {duration.minutes} min
                    </Text> : null}
                </View>
            }
            {props.isOwner ? renderTimer() : null }
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


                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        {props.isOwner && modifiedCorrectAnswerProblems[index] ? 
                            <View style={{ marginVertical: 10, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f3f3f3', borderRadius: 10 }}>
                                {regradeChoices[index] !== "" ? <Ionicons name='checkmark-circle-outline' size={22} color={'#53BE68'} /> : <Ionicons name='warning-outline' size={22} color={'#ED7D22'} />}
                                <Text style={{ paddingHorizontal: 12, width: Dimensions.get('window').width < 768 ? '90%' : '100%', lineHeight: 20 }}>
                                    {regradeChoices[index] !== "" ? (regradeChoices[index] === "noRegrading" ? "Question will not be regraded" : "Question will be re-graded for all existing submissions") : "Correct Answer modified. Select regrade option for those who have already taken the quiz." }  
                                </Text>
                            </View>
                            : null }
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
                                            (props.isOwner && editQuestionNumber === (index + 1) ? 
                                            <View style={{ flexDirection: 'column', width: '100%' }}>
                                                {renderQuestionEditor(editQuestionNumber - 1)}
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
                                            : 
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
                                            </Text>))
                                        )
                                }
                            </View>
                            <View style={{ flexDirection: 'column', paddingTop: 15, paddingLeft: 20, marginBottom: Dimensions.get('window').width < 768 ? 30 : 0 }}>
                                <View
                                    style={{ flexDirection: 'row' }}
                                >
                                    <TextInput
                                        editable={props.isOwner && editQuestionNumber === (index + 1)}
                                        value={props.isOwner && editQuestionNumber === (index + 1) ? `${problem.points}` : (problem.points + " " + (Number(problem.points) === 1 ? 'Point' : ' Points'))}
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
                                        !problem.required ?
                                            (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingTop: 20 }}>
                                                optional
                                            </Text>)
                                            : (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingTop: 20 }}>
                                                required
                                            </Text>)
                                    }
                                    {
                                        props.isOwner ? (editQuestionNumber !== (index + 1) ? 
                                        (<Text onPress={() => setEditQuestionNumber(index + 1)} style={{ marginBottom: 20, paddingTop: 8, paddingLeft: 30, paddingRight: 5 }}> <Ionicons name='pencil-outline' size={22} color={'#3B64F8'} /></Text>) 
                                        : null)
                                        :
                                        null
                                    }
                                </View>
                                {
                                        !problem.questionType && !onlyOneCorrect ?
                                            (<Text style={{ fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'right', paddingRight: 30, paddingTop: 20 }}>
                                                more than one correct answer
                                            </Text>)
                                            : null
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
                                        {onlyOneCorrect && editQuestionNumber !== (index + 1) ?
                                        <TouchableOpacity
                                            style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', marginTop: 5 }}
                                            onPress={() => {
                                                selectMCQOption(problem, problemIndex, i);
                                            }} 
                                            disabled={props.submitted || props.isOwner || props.hasEnded}
                                        >
                                            <RadioButton selected={props.isOwner ? option.isCorrect : solutions[problemIndex].selected[i].isSelected} />
                                        </TouchableOpacity>
                                        :
                                        <CheckBox
                                            disabled={props.isOwner && editQuestionNumber === (index + 1) ? false : (props.submitted || props.isOwner || props.hasEnded)}
                                            style={{ paddingRight: 20 }}
                                            isChecked={props.isOwner ? option.isCorrect : solutions[problemIndex].selected[i].isSelected}
                                            onClick={() => {
                                                if (props.isOwner) {
                                                    const updatedProbs = [...problems]
                                                    if (problem.questionType === "trueFalse") {
                                                        updatedProbs[problemIndex].options[0].isCorrect = false;
                                                        updatedProbs[problemIndex].options[1].isCorrect = false;
                                                    }
                                                    updatedProbs[problemIndex].options[i].isCorrect = !updatedProbs[problemIndex].options[i].isCorrect;
                                                    setProblems(updatedProbs)
                                                } else {
                                                    selectMCQOption(problem, problemIndex, i);
                                                }
                                            }}
                                        />}
                                    </View>
                                    <View style={{ backgroundColor: '#fff', width: '80%' }}>
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
                                                        (props.isOwner && problem.questionType !== "trueFalse" && editQuestionNumber === (index + 1) ? 
                                                        <AutoGrowingTextInput
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
                                                            onChange={(e: any) => {
                                                                const newProbs = [...problems];
                                                                newProbs[problemIndex].options[i].option = e.nativeEvent.text;
                                                                setProblems(newProbs)
                                                            }}
                                                            placeholder={'Option ' + (i + 1).toString()}
                                                            placeholderTextColor={'#a2a2ac'}
                                                        /> :
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
                                                    </Text>)
                                                )
                                        }
                                    </View>
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?
                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    {
                                        props.isOwner || props.submitted || props.graded || props.hasEnded  ? <Text style={{
                                            marginTop: 20,
                                            fontSize: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            maxWidth: "100%",
                                            color: props.isOwner ? "#a2a2ac" : "#000",
                                            marginBottom: props.isOwner ? 50 : 30
                                        }}>
                                            {props.isOwner ? "Free Response Answer" : solutions[problemIndex].response}
                                        </Text> :
                                        <AutoGrowingTextInput
                                            style={{ maxWidth: '100%', marginBottom: 10, marginTop: 10, paddingTop: 13, paddingBottom: 13, fontSize: 15, borderBottomColor: '#cccccc', borderBottomWidth: 1 }}
                                            editable={!props.submitted && !props.graded && !props.isOwner && !props.hasEnded}
                                            value={solutions[problemIndex].response}
                                            onChange={(e: any) => {
                                                const updatedSolution = [...solutions]
                                                updatedSolution[problemIndex].response = e.target.value;
                                                setSolutions(updatedSolution)
                                                props.setSolutions(updatedSolution)
                                            }}
                                            minHeight={80}
                                            placeholder='Answer'
                                            hasMultipleLines={true}
                                        />
                                    }
                                    

                                </View>
                                :
                                null
                        }


                        {/* Add save changes button & regrade options here */}

                        {
                            props.isOwner && modifiedCorrectAnswerProblems[index] && (editQuestionNumber !== index + 1) ?
                            <Text style={{ fontSize: 14, fontWeight: 'bold', paddingLeft: 20, marginBottom: 20, lineHeight: 20 }}>
                                {regradeChoices[index] === '' ? '' : regradeOptions[regradeChoices[index]]}
                            </Text>
                            : null
                        }

                        {
                            props.isOwner && modifiedCorrectAnswerProblems[index] && (editQuestionNumber === index + 1) ?
                            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ marginRight: 10 }}>Regrade Option: </Text>
                                <Menu
                                    onSelect={(cat: any) => {
                                        const updateRegradeChoices = [...regradeChoices];
                                        updateRegradeChoices[index] = cat;
                                        setRegradeChoices(updateRegradeChoices);
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c', width: Dimensions.get('window').width > 768 ? '100%' : 200 }}>
                                            {regradeChoices[index] === '' ? 'Select Option' : regradeOptions[regradeChoices[index]]}<Ionicons name='caret-down' size={14} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#b9b9b9',
                                            overflow: 'scroll',
                                            maxHeight: '100%',
                                            width: Dimensions.get('window').width < 768 ? 300 : 400
                                        }
                                    }}>
                                        {
                                            Object.keys(regradeOptions).map((option: any, i: number) => {
                                                return <MenuOption
                                                    value={option}>
                                                    <Text>
                                                        {i + 1}: {regradeOptions[option]}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                                :
                                null
                        }

                        {
                            props.isOwner && editQuestionNumber === (index + 1) ?
                                <View style={{ width: '100%', flexDirection: 'row', marginBottom: 30, marginLeft: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => resetChanges(index) }
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120, marginRight: 30 }}
                                    >
                                            
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#2F2F3C",
                                                fontSize: 12,
                                                backgroundColor: "#F4F4F6",
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
                                                fontFamily: "inter",
                                                overflow: "hidden",
                                                height: 35,
                                                textTransform: 'uppercase'
                                            }}>
                                            Reset
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setEditQuestionNumber(0) }
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120 }}
                                    >
                                            
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#2F2F3C",
                                                fontSize: 12,
                                                backgroundColor: "#F4F4F6",
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
                                                fontFamily: "inter",
                                                overflow: "hidden",
                                                height: 35,
                                                textTransform: 'uppercase'
                                            }}>
                                            DONE
                                        </Text>
                                    </TouchableOpacity>
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
                                props.modifyQuiz(instructions, problems, headers, modifiedCorrectAnswerProblems, regradeChoices, timer, duration);
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
