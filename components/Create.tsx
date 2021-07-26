import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { createCue, createQuiz, getChannelCategories, getChannels, getSharedWith } from '../graphql/QueriesAndMutations';
// import Datetime from 'react-datetime';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import FileUpload from './UploadFiles';
// import FileViewer from 'react-file-viewer';
import Alert from '../components/Alert'
// import Select from 'react-select';
import QuizCreate from './QuizCreate';
// import DurationPicker from 'react-duration-picker'
import TeXToSVG from "tex-to-svg";
// import EquationEditor from "equation-editor-react";
import MultiSelect from 'react-native-multiple-select';
import { TimePicker } from 'react-native-simple-time-picker';
import { PreferredLanguageText } from "../helpers/LanguageContext";
// import { Video } from 'expo-av';
import moment from 'moment';
import Webview from './Webview';

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';


const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const current = new Date()
    const [cue, setCue] = useState('')
    const [shuffle, setShuffle] = useState(false)
    const [starred, setStarred] = useState(false)
    const [notify, setNotify] = useState(false)
    const [color, setColor] = useState(0)
    const [frequency, setFrequency] = useState('0')
    const [customCategory, setCustomCategory] = useState('')
    const [localCustomCategories] = useState(props.customCategories)
    const [customCategories, setCustomCategories] = useState(props.customCategories)
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [channels, setChannels] = useState<any[]>([])
    const [channelId, setChannelId] = useState<any>('')
    const [endPlayAt, setEndPlayAt] = useState(new Date(current.getTime() + 1000 * 60 * 60))
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true)
    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#F8D41F', '#B8D41F', '#53BE6D'].reverse()
    const [modalAnimation] = useState(new Animated.Value(0))
    // const now = new Date()
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    let RichText: any = useRef()
    const [height, setHeight] = useState(100)
    const [init, setInit] = useState(false)
    const [submission, setSubmission] = useState(false)
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24))
    const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()))
    const [gradeWeight, setGradeWeight] = useState<any>(0)
    const [graded, setGraded] = useState(false)
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [channelName, setChannelName] = useState('')
    const [frequencyName, setFrequencyName] = useState('Day')
    const [showImportOptions, setShowImportOptions] = useState(false)
    const [selected, setSelected] = useState<any[]>([])
    const [subscribers, setSubscribers] = useState<any[]>([])
    // const [expandMenu, setExpandMenu] = useState(false)
    // options to create Quiz
    const [isQuiz, setIsQuiz] = useState(false)
    const [problems, setProblems] = useState<any[]>([])
    const [timer, setTimer] = useState(false)
    const [duration, setDuration] = useState({
        hours: 1, minutes: 0, seconds: 0
    })

    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [headers, setHeaders] = useState<any>({});
    const [quizInstructions, setQuizInstructions] = useState('');
    const [initialDuration, setInitialDuration] = useState(null)

    const [equation, setEquation] = useState('y = x + 1')
    const [showEquationEditor, setShowEquationEditor] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showInitiateAtTimeAndroid, setShowInitiateAtTimeAndroid] = useState(false);
    const [showInitiateAtDateAndroid, setShowInitiateAtDateAndroid] = useState(false);

    const [showDeadlineTimeAndroid, setShowDeadlineTimeAndroid] = useState(false);
    const [showDeadlineDateAndroid, setShowDeadlineDateAndroid] = useState(false);

    const [showEndPlayAtTimeAndroid, setShowEndPlayAtTimeAndroid] = useState(false);
    const [showEndPlayAtDateAndroid, setShowEndPlayAtDateAndroid] = useState(false);

    const enterOneProblemAlert = PreferredLanguageText('enterOneProblem')
    const invalidDurationAlert = PreferredLanguageText('invalidDuration')
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems')
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints')
    const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions')
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect')
    const noStudentSelectedAlert = PreferredLanguageText('noStudentSelected')
    const selectWhoToShareAlert = PreferredLanguageText('selectWhoToShare')
    const clearQuestionAlert = PreferredLanguageText('clearQuestion')
    const cannotUndoAlert = PreferredLanguageText('cannotUndo')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const enterContentAlert = PreferredLanguageText('enterContent');
    const enterTitleAlert = PreferredLanguageText('enterTitle');

    const insertEquation = useCallback(() => {
        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        RichText.current.insertHTML('<div><br/>' + SVGEquation + '<br/></div>');
        setShowEquationEditor(false)
        setEquation('')
        setReloadEditorKey(Math.random())
    }, [equation, RichText, RichText.current, cue])

    useEffect(() => {
        if (cue[0] === '{' && cue[cue.length - 1] === '}') {
            const obj = JSON.parse(cue)
            setImported(true)
            setUrl(obj.url)
            setType(obj.type)
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [cue])

    const createNewQuiz = useCallback(() => {
        let error = false
        if (problems.length === 0) {
            Alert(enterOneProblemAlert)
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert)
                return;
            }
        }
        problems.map((problem) => {
            if (problem.question === '' || problem.question === 'formula:') {
                Alert(fillMissingProblemsAlert)
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(enterNumericPointsAlert)
                error = true;
            }
            let optionFound = false
            // if (problem.options.length === 0) {
            //     Alert(mustHaveOneOptionAlert)
            //     error = true;
            // }

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert("Problem must have at least 2 options")
                error = true;
            }

            // If MCQ, check if any options repeat:
            if (!problem.questionType) {
                const keys: any = {};

                problem.options.map((option: any) => {
                    if (option.option === '' || option.option === 'formula:') {
                        Alert(fillMissingOptionsAlert)
                        error = true;
                    }

                    if (option.option in keys) {
                        Alert("Option repeated in a question");
                        error = true
                    }

                    if (option.isCorrect) {
                        optionFound = true
                    }

                    keys[option.option] = 1
                })

                if (!optionFound) {
                    Alert(eachOptionOneCorrectAlert)
                    error = true;
                }
            }

        })
        if (error) {
            return
        }
        const server = fetchAPI('')
        const durationMinutes = (duration.hours * 60) + (duration.minutes) + (duration.seconds / 60);
        server.mutate({
            mutation: createQuiz,
            variables: {
                quiz: {
                    problems,
                    duration: timer ? durationMinutes.toString() : null,
                    shuffleQuiz,
                    instructions: quizInstructions,
                    headers: JSON.stringify(headers)
                }
            }
        }).then(res => {
            if (res.data && res.data.quiz.createQuiz !== 'error') {
                storeDraft('quizDraft', '');
                handleCreate(res.data.quiz.createQuiz)
            }
        })
    }, [problems, cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz,
        gradeWeight, deadline, initiateAt, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url, timer, duration,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef, shuffleQuiz, quizInstructions,
        headers])

    const loadChannelCategoriesAndSubscribers = useCallback(async () => {

        if (channelId === '') {
            setCustomCategories(localCustomCategories)
            return
        }
        const server = fetchAPI('')
        // get categories
        server.query({
            query: getChannelCategories,
            variables: {
                channelId
            }
        }).then(res => {
            if (res.data.channel && res.data.channel.getChannelCategories) {
                setCustomCategories(res.data.channel.getChannelCategories)
            }
        }).catch(err => {
        })
        // get subscribers
        server.query({
            query: getSharedWith,
            variables: {
                channelId,
                cueId: null
            }
        })
            .then((res: any) => {
                if (res.data && res.data.cue.getSharedWith) {
                    const sharedWith = res.data.cue.getSharedWith
                    const shared: any[] = []
                    const ids: any[] = []
                    sharedWith.map((s: any) => {
                        shared.push({
                            value: s.value,
                            label: s.label
                        })
                        ids.push(s.value)
                    })
                    setSubscribers(shared)
                    setSelected(ids)
                }
            })
            .catch((err: any) => console.log(err))

    }, [channelId, localCustomCategories])

    useEffect(() => {
        loadChannelCategoriesAndSubscribers()
    }, [channelId])

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

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

    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user')
        if (uString) {
            const user = JSON.parse(uString)
            const server = fetchAPI('')
            server.query({
                query: getChannels,
                variables: {
                    userId: user._id
                }
            })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId)
                    }
                })
                .catch(err => {
                })
        }
        setInit(true)
    }, [])

    useEffect(() => {
        loadChannels()
    }, [])

    useEffect(() => {
        if (!init) {
            return
        }
        let saveCue = ''
        // Current limitation - not able to save quizzes...
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else if (isQuiz) {
            const quiz = {
                title,
                problems,
                timer,
                duration,
                headers,
                quizInstructions
            }

            const saveQuiz = JSON.stringify(quiz)

            storeDraft('quizDraft', saveQuiz)
        } else {
            saveCue = cue
        }
        if (saveCue && saveCue !== "") {
            storeDraft('cueDraft', saveCue)
        } else {
            storeDraft('cueDraft', '')
        }
    }, [cue, init, type, url, imported, title, isQuiz, problems, timer, duration, headers, quizInstructions])

    const storeDraft = useCallback(async (type, value) => {
        await AsyncStorage.setItem(type, value)
    }, [])

    const handleCreate = useCallback(async (quizId?: string) => {

        setIsSubmitting(true)

        if (isSubmitting) return;

        if (!quizId && (cue === null || cue.toString().trim() === '')) {
            Alert(enterContentAlert)
            setIsSubmitting(false)
            return
        }

        if ((imported || isQuiz) && title === '') {
            Alert(enterTitleAlert)
            setIsSubmitting(false)
            return
        }

        let saveCue = ''
        if (quizId) {
            const obj: any = {
                quizId,
                title
            }
            if (timer) {
                obj.initiatedAt = null
            }
            saveCue = JSON.stringify(obj)
        } else if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = cue
        }

        // LOCAL CUE
        if (channelId === '') {
            let subCues: any = {}
            try {
                const value = await AsyncStorage.getItem('cues')
                if (value) {
                    subCues = JSON.parse(value)
                }
            } catch (e) {
            }
            let _id = subCues['local'].length;
            while (true) {
                const duplicateId = subCues['local'].findIndex((item: any) => {
                    return item._id === _id
                })
                if (duplicateId === -1) {
                    break;
                } else {
                    _id++;
                }
            }
            const newCue = {
                _id,
                cue: saveCue,
                date: new Date(),
                color,
                shuffle,
                frequency,
                starred,
                customCategory,
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
            }
            subCues['local'].push(newCue)
            const stringifiedCues = JSON.stringify(subCues)
            await AsyncStorage.setItem('cues', stringifiedCues)
            storeDraft('cueDraft', '')
            setIsSubmitting(false)
            props.closeModal()
        } else {
            // CHANNEL CUE
            const uString = await AsyncStorage.getItem('user')
            if (!uString) {
                return
            }

            if (selected.length === 0) {
                Alert(noStudentSelectedAlert, selectWhoToShareAlert)
                return;
            }

            if ((submission || isQuiz) && deadline < initiateAt) {
                Alert("Available from time must be set before deadline", "")
                return;
            }

            const user = JSON.parse(uString)
            const server = fetchAPI('')
            // const userIds: any[] = []
            // if (selected.length !== 0) {
            //     selected.map((item) => {
            //         userIds.push(item.value)
            //     })
            // }

            const variables = {
                cue: saveCue,
                starred,
                color: color.toString(),
                channelId,
                frequency,
                customCategory,
                shuffle,
                createdBy: user._id,
                gradeWeight: gradeWeight.toString(),
                submission: submission || isQuiz,
                deadline: submission || isQuiz ? deadline.toISOString() : '',
                initiateAt: submission || isQuiz ? initiateAt.toISOString() : '',
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                shareWithUserIds: selected.length === subscribers.length ? null : selected
            }

            server.mutate({
                mutation: createCue,
                variables
            })
                .then(res => {
                    if (res.data.cue.create) {
                        Animated.timing(modalAnimation, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: true
                        }).start(() => {
                            storeDraft('cueDraft', '')
                            setIsSubmitting(false)
                            props.closeModal()
                        })
                    }
                })
                .catch(err => {
                    Alert(somethingWentWrongAlert, checkConnectionAlert)
                    setIsSubmitting(false)
                })
        }

        setIsSubmitting(false)
    }, [cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz, timer, duration,
        gradeWeight, deadline, initiateAt, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef])

    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft')
                if (h !== null) {
                    setCue(h)
                }
                const quizDraft = await AsyncStorage.getItem('quizDraft')
                if (quizDraft !== null) {
                    const { duration, timer, problems, title, headers, quizInstructions } = JSON.parse(quizDraft);
                    setInitialDuration(duration)
                    setDuration(duration);
                    setTimer(timer);
                    setProblems(problems);
                    setTitle(title);
                    setHeaders(headers);
                    setQuizInstructions(quizInstructions);
                }
            } catch (e) {
                console.log(e)
            }
        }
        getData()
    }, [])

    const clearAll = useCallback(() => {
        Alert(
            clearQuestionAlert,
            cannotUndoAlert,
            [
                {
                    text: "Cancel", style: "cancel"
                },
                {
                    text: "Clear", onPress: () => {
                        setCue('')
                        setImported(false)
                        setUrl('')
                        setType('')
                        setTitle('')
                        setProblems([])
                        setIsQuiz(false)
                        setTimer(false)
                        setShowEquationEditor(false)
                        setEquation('')
                        setReloadEditorKey(Math.random())
                    }
                }
            ]
        )
    }, [])

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])


    const onChange = useCallback((value, { action, removedValue }) => {
        switch (action) {
            case 'remove-value':
            case 'pop-value':
                if (removedValue.isFixed) {
                    return;
                }
                break;
            case 'clear':
                value = subscribers.filter(v => v.isFixed);
                break;
        }
        setSelected(value)
    }, [subscribers])

    const onChangeDuration = useCallback((duration: any) => {
        const { hours, minutes, seconds } = duration;
        setDuration({ hours, minutes, seconds });
    }, [])

    // const handleCursorPosition = (scrollY: any) => {
    //     // Positioning scroll bar
    //     RichText.current.scrollTo({ y: scrollY - 60, animated: true });
    // }

    const renderInitiateAtDateTimePicker = () => {
        return (<View style={{ backgroundColor: '#fff' }}>
            {Platform.OS === "ios" ? <DateTimePicker
                style={styles.timePicker}
                value={initiateAt}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    const currentDate: any = selectedDate;
                    setInitiateAt(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}
            {Platform.OS === "android" && showInitiateAtDateAndroid ? <DateTimePicker
                style={styles.timePicker}
                value={initiateAt}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowInitiateAtDateAndroid(false);
                    setInitiateAt(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}

            {Platform.OS === "android" ? <View style={{
                width: '100%',
                flexDirection: 'row',
                marginTop: 12,
                backgroundColor: '#fff',
                marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
            }}>

                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        marginBottom: 10,
                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowInitiateAtDateAndroid(true)
                        setShowInitiateAtTimeAndroid(false)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Date
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowInitiateAtDateAndroid(false)
                        setShowInitiateAtTimeAndroid(true)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Time
                    </Text>
                </TouchableOpacity>
            </View> : null}

            <View style={{ height: 10, backgroundColor: 'white' }} />
            {Platform.OS === "ios" ? <DateTimePicker
                style={styles.timePicker}
                value={initiateAt}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    const currentDate: any = selectedDate;
                    setInitiateAt(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}
            {Platform.OS === "android" && showInitiateAtTimeAndroid ? <DateTimePicker
                style={styles.timePicker}
                value={initiateAt}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowInitiateAtTimeAndroid(false);
                    setInitiateAt(currentDate)

                }}
                minimumDate={new Date()}
            /> : null}
        </View>)
    }

    const renderDeadlineDateTimePicker = () => {
        return (<View style={{ backgroundColor: '#fff' }}>
            {Platform.OS === "ios" ? <DateTimePicker
                style={styles.timePicker}
                value={deadline}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    const currentDate: any = selectedDate;
                    setDeadline(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}
            {Platform.OS === "android" && showDeadlineDateAndroid ? <DateTimePicker
                style={styles.timePicker}
                value={deadline}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowDeadlineDateAndroid(false);
                    setDeadline(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}

            {Platform.OS === "android" ? <View style={{
                width: '100%',
                flexDirection: 'row',
                marginTop: 12,
                backgroundColor: '#fff',
                marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
            }}>

                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        marginBottom: 10,
                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowDeadlineDateAndroid(true)
                        setShowDeadlineTimeAndroid(false)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Date
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowDeadlineDateAndroid(false)
                        setShowDeadlineTimeAndroid(true)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Time
                    </Text>
                </TouchableOpacity>
            </View> : null}

            <View style={{ height: 10, backgroundColor: 'white' }} />
            {Platform.OS === "ios" ? <DateTimePicker
                style={styles.timePicker}
                value={deadline}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    const currentDate: any = selectedDate;
                    setDeadline(currentDate)
                }}
                minimumDate={new Date()}
            /> : null}
            {Platform.OS === "android" && showDeadlineTimeAndroid ? <DateTimePicker
                style={styles.timePicker}
                value={deadline}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowDeadlineTimeAndroid(false);
                    setDeadline(currentDate)

                }}
                minimumDate={new Date()}
            /> : null}
        </View>)
    }

    const renderEndPlayAtDateTimePicker = () => {
        return <View style={{ backgroundColor: '#fff' }}>
            {Platform.OS === 'ios' && <DateTimePicker
                style={styles.timePicker}
                value={endPlayAt}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    const currentDate: any = selectedDate;
                    setEndPlayAt(currentDate)
                }}
                minimumDate={new Date()}
            />}

            {Platform.OS === "android" && showEndPlayAtDateAndroid ? <DateTimePicker
                style={styles.timePicker}
                value={endPlayAt}
                mode={'date'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowEndPlayAtDateAndroid(false)
                    setEndPlayAt(currentDate)

                }}
                minimumDate={new Date()}
            /> : null}

            {Platform.OS === "android" ? <View style={{
                width: '100%',
                flexDirection: 'row',
                marginTop: 12,
                backgroundColor: '#fff',
                marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
            }}>

                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        marginBottom: 10,

                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowEndPlayAtDateAndroid(true)
                        setShowEndPlayAtTimeAndroid(false)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Date
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        borderRadius: 15,
                        width: 150, justifyContent: 'center', flexDirection: 'row',
                    }}
                    onPress={() => {
                        setShowEndPlayAtDateAndroid(false)
                        setShowEndPlayAtTimeAndroid(true)
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 10,
                        // backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150,
                        borderRadius: 15,
                    }}>
                        Set Time
                    </Text>
                </TouchableOpacity>
            </View> : null}


            <View style={{ height: 10, backgroundColor: 'white' }} />
            {Platform.OS === 'ios' && <DateTimePicker
                style={styles.timePicker}
                value={endPlayAt}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setEndPlayAt(currentDate)
                }}
                minimumDate={new Date()}
            />}
            {Platform.OS === 'android' && showEndPlayAtTimeAndroid && <DateTimePicker
                style={styles.timePicker}
                value={endPlayAt}
                mode={'time'}
                textColor={'#202025'}
                onChange={(event, selectedDate) => {
                    if (!selectedDate) return;
                    const currentDate: any = selectedDate;
                    setShowEndPlayAtTimeAndroid(false);
                    setEndPlayAt(currentDate)
                }}
                minimumDate={new Date()}
            />}
        </View>
    }



    const quizAlert = PreferredLanguageText('quizzesCanOnly')
    const width = Dimensions.get('window').width;
    return (
        <View style={{
            width: '100%',
            height: Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height,
            backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingHorizontal: 25,
            overflow: 'hidden'
        }}>
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: modalAnimation,
                height: '100%',
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 20, }}>
                    <View style={{
                        backgroundColor: 'white', flex: 1,
                    }}>
                        <View
                            style={{
                                backgroundColor: '#fff'
                            }}
                        >
                            <Text style={{
                                fontSize: 21,
                                paddingBottom: 20,
                                fontFamily: 'inter',
                                // textTransform: "uppercase",
                                // paddingLeft: 10,
                                flex: 1,
                                lineHeight: 25,
                                color: '#202025',
                            }}>
                                {PreferredLanguageText('new')}
                            </Text>
                        </View>
                    </View>
                    <View
                        onTouchStart={() => setStarred(!starred)}
                        style={{
                            backgroundColor: 'white',
                            // paddingRight: 15,
                            marginTop: Platform.OS === "ios" ? 0 : 0,
                        }}>
                        <Text style={{
                            textAlign: 'right',
                            lineHeight: 34,
                        }}>
                            <Ionicons name='bookmark' size={34} color={starred ? '#d91d56' : '#a2a2aa'} />
                        </Text>
                    </View>
                </View>
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column-reverse' : 'row',
                    paddingBottom: 10,
                    backgroundColor: 'white',
                }}
                    onTouchStart={() => Keyboard.dismiss()}
                >
                    {Platform.OS === "ios" ? <View
                        style={{ flexDirection: (imported || isQuiz || showImportOptions) ? 'row' : 'column', flex: 1, }}
                        key={reloadEditorKey}
                    >
                        {
                            showImportOptions ? null :
                                <RichToolbar
                                    key={reloadEditorKey.toString()}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        backgroundColor: 'white',
                                        // height: 28,
                                        overflow: 'scroll',
                                    }}
                                    iconSize={16}
                                    editor={RichText}
                                    disabled={false}
                                    iconTint={"#a2a2aa"}
                                    selectedIconTint={"#a2a2aa"}
                                    disabledIconTint={"#a2a2aa"}
                                    actions={
                                        imported || isQuiz ? [""] :
                                            [
                                                actions.setBold,
                                                actions.setItalic,
                                                actions.setUnderline,
                                                actions.insertBulletsList,
                                                actions.insertOrderedList,
                                                actions.checkboxList,
                                                actions.insertLink,
                                                actions.insertImage,
                                                "insertCamera",
                                                "clear",
                                                actions.undo,
                                                actions.redo,
                                            ]}
                                    iconMap={{
                                        ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={16} color={tintColor} />,
                                        ["clear"]: ({ tintColor }) => <Ionicons name='trash-outline' size={16} color={tintColor} onPress={() => {
                                            clearAll()
                                        }} />,
                                        ["back"]: ({ tintColor }) => <Ionicons name='arrow-back' size={16} color={tintColor} onPress={() => setShowImportOptions(false)} />
                                    }}
                                    onPressAddImage={galleryCallback}
                                    insertCamera={cameraCallback}
                                />
                        }
                        {
                            imported || !showImportOptions ? null :
                                <FileUpload
                                    back={() => setShowImportOptions(false)}
                                    onUpload={(u: any, t: any) => {
                                        console.log(t)
                                        const obj = { url: u, type: t, title }
                                        setCue(JSON.stringify(obj))
                                        setShowImportOptions(false)
                                    }}
                                />
                        }
                    </View> :
                        <View
                        >
                            <RichToolbar
                                key={reloadEditorKey.toString()}
                                style={{
                                    flexWrap: 'wrap',
                                    backgroundColor: 'white',
                                    // height: 28,
                                    overflow: 'visible'
                                }}
                                iconSize={18}
                                editor={RichText}
                                disabled={false}
                                iconTint={"#a2a2aa"}
                                selectedIconTint={"#a2a2aa"}
                                disabledIconTint={"#a2a2aa"}
                                actions={
                                    imported || isQuiz || showImportOptions ? ["back", "clear"] :
                                        [
                                            actions.setBold,
                                            actions.setItalic,
                                            actions.setUnderline,
                                            actions.insertBulletsList,
                                            actions.insertOrderedList,
                                            actions.checkboxList,
                                            actions.insertLink,
                                            actions.insertImage,
                                            "insertCamera",
                                            "clear",
                                            actions.undo,
                                            actions.redo,

                                        ]}
                                iconMap={{
                                    ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={18} color={tintColor} />,
                                    ["clear"]: ({ tintColor }) => <Ionicons name='trash-outline' size={18} color={tintColor} onPress={() => clearAll()} />,
                                    // ["back"]: ({ tintColor }) => <Ionicons name='arrow-back' size={18} color={tintColor} onPress={() => setShowImportOptions(false)} />
                                }}
                                onPressAddImage={galleryCallback}
                                insertCamera={cameraCallback}
                            />
                            {
                                imported || !showImportOptions ? null :
                                    <FileUpload
                                        back={() => setShowImportOptions(false)}
                                        onUpload={(u: any, t: any) => {
                                            console.log(t)
                                            const obj = { url: u, type: t, title }
                                            setCue(JSON.stringify(obj))
                                            setShowImportOptions(false)
                                        }}
                                    />
                            }
                        </View>
                    }
                    <View style={{ flexDirection: 'row', backgroundColor: '#fff', justifyContent: 'flex-end' }}>
                        {/* {
                            !isQuiz ?
                                <Text style={{
                                    color: '#a2a2aa',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 20
                                }}
                                    onPress={() => setShowEquationEditor(!showEquationEditor)}
                                >
                                    {
                                        showEquationEditor ? 'HIDE' : 'FORMULA'
                                    }
                                </Text> : null
                        } */}
                        {
                            isQuiz ? null :
                                <Text style={{
                                    color: '#a2a2aa',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 20,
                                    textTransform: 'uppercase'
                                }}
                                    onPress={() => setShowImportOptions(true)}
                                >
                                    {PreferredLanguageText('import')}
                                </Text>
                        }
                        <Text style={{
                            color: '#a2a2aa',
                            fontSize: 11,
                            lineHeight: 30,
                            textAlign: 'right',
                            paddingRight: 10,
                            textTransform: 'uppercase'
                        }}
                            onPress={() => {
                                if (channelId !== '') {
                                    setIsQuiz(true)
                                    setSubmission(true)
                                } else {
                                    Alert(quizAlert)
                                }
                            }}
                        >
                            {PreferredLanguageText('quiz')}
                        </Text>
                    </View>
                </View>
                {
                    showEquationEditor ?
                        <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingBottom: 20 }}>
                            <View style={{
                                borderColor: '#f4f4f6',
                                borderWidth: 1,
                                borderRadius: 15,
                                padding: 10,
                                minWidth: 200,
                                maxWidth: '50%'
                            }}>
                                {/* <EquationEditor
                                    value={equation}
                                    onChange={setEquation}
                                    autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                    autoOperatorNames="sin cos tan arccos arcsin arctan"
                                /> */}
                            </View>
                            <TouchableOpacity
                                style={{
                                    justifyContent: 'center',
                                    paddingHorizontal: 20,
                                    maxWidth: '10%'
                                }}
                                onPress={() => insertEquation()}
                            >
                                <Ionicons name='add-circle-outline' color='#a2a2aa' size={20} />
                            </TouchableOpacity>
                            <View style={{ minWidth: '40%', flex: 1, paddingVertical: 5, justifyContent: 'center', }}>
                                <Text style={{ flex: 1, fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                    ^ → Superscript, _ → Subscript, int → Integral, sum → Summation, prod → Product, sqrt → Square root, bar → Bar over letter, alpha, beta, ... omega → Small Greek letter, Alpha, Beta, ... Omega → Capital Greek letter
                                </Text>
                            </View>
                        </View> : null
                }
                <ScrollView
                    style={{ paddingBottom: 100, marginTop: Platform.OS === "ios" ? 40 : 0 }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={'on-drag'}
                    overScrollMode={'always'}
                    nestedScrollEnabled={true}
                >
                    {
                        imported || isQuiz ?
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row', overflow: 'visible', backgroundColor: 'white' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6', paddingRight: 15, display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                    <TextInput
                                        value={title}
                                        style={styles.input}
                                        placeholder={PreferredLanguageText('title')}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2aa'}
                                    />
                                    <TouchableOpacity
                                        style={{
                                            marginLeft: 15,
                                            paddingTop: 15,
                                            backgroundColor: '#fff'
                                        }}
                                        onPress={() => clearAll()}
                                    >
                                        <Ionicons name="trash-outline" color="#a2a2aa" size={20} style={{ alignSelf: 'center' }} />
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                color: "#a2a2aa",
                                                textAlign: "center"
                                            }}>
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {
                                    isQuiz ?
                                        <View style={{ width: width < 768 ? '100%' : '31.67%', borderRightWidth: 0, borderColor: '#f4f4f6', paddingTop: 10, backgroundColor: '#fff' }}>
                                            <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 15, color: '#a2a2aa' }}>
                                                    <Ionicons name='timer-outline' size={20} color={'#a2a2aa'} />
                                                </Text>
                                            </View>
                                            <View style={{
                                                backgroundColor: 'white',
                                                width: '100%',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={timer}
                                                    onValueChange={() => {
                                                        if (timer) {
                                                            setDuration({
                                                                hours: 1,
                                                                minutes: 0,
                                                                seconds: 0
                                                            })
                                                        }
                                                        setTimer(!timer)
                                                    }}
                                                    style={{ height: 20, marginRight: 'auto' }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#3B64F8'
                                                    }}
                                                    thumbColor='white'
                                                />
                                            </View>
                                        </View> : null
                                }
                                {
                                    isQuiz && timer ?
                                        <View style={{ width: width < 768 ? '100%' : '35%', borderRightWidth: 0, borderColor: '#f4f4f6', backgroundColor: '#fff' }}>
                                            <Text>
                                                duration picker...
                                            </Text>
                                            <TimePicker
                                                hoursUnit={'h'}
                                                minutesUnit={'m'}
                                                secondsUnit={'s'}
                                                value={duration}
                                                onChange={onChangeDuration}
                                                pickerShows={['hours', 'minutes', 'seconds']} />
                                        </View> : null
                                }
                            </View> : null
                    }
                    <View style={{
                        width: '100%',
                        minHeight: isQuiz ? 0 : 500,
                        backgroundColor: 'white'
                    }}>
                        {
                            isQuiz ?
                                (
                                    <View style={{
                                        width: '100%',
                                        flexDirection: 'column',
                                        backgroundColor: 'white'
                                    }}>
                                        <CustomTextInput
                                            value={quizInstructions}
                                            placeholder="Instructions"
                                            onChangeText={val => setQuizInstructions(val)}
                                            placeholderTextColor={"#a2a2aa"}
                                            required={false}
                                            hasMultipleLines={true}
                                        />
                                        <QuizCreate
                                            problems={problems}
                                            headers={headers}
                                            setProblems={(p: any) => setProblems(p)}
                                            setHeaders={(h: any) =>
                                                setHeaders(h)}
                                        />
                                    </View>
                                )
                                : (imported ?
                                    (
                                        type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav' ?
                                            <ReactPlayer url={url} controls={true} onContextMenu={(e: any) => e.preventDefault()} config={{ file: { attributes: { controlsList: 'nodownload' } } }} />
                                            :
                                            <View
                                                // key={Math.random()}
                                                key={url}
                                                style={{ flex: 1 }}
                                            >
                                                <Webview
                                                    key={url}
                                                    url={url}
                                                />
                                            </View>
                                    )
                                    :
                                    null)
                        }
                        <RichEditor
                            key={reloadEditorKey.toString()}
                            containerStyle={{
                                height,
                                backgroundColor: '#f4f4f6',
                                padding: 3,
                                paddingTop: 5,
                                paddingBottom: 10,
                                borderRadius: 15,
                                display: (isQuiz || imported) ? "none" : "flex"
                            }}
                            ref={RichText}
                            style={{
                                width: '100%',
                                backgroundColor: '#f4f4f6',
                                borderRadius: 15,
                                minHeight: 475,
                                display: (isQuiz || imported) ? "none" : "flex"
                            }}
                            editorStyle={{
                                backgroundColor: '#f4f4f6',
                                placeholderColor: '#a2a2aa',
                                color: '#202025',
                                contentCSSText: 'font-size: 16px;',

                            }}
                            initialContentHTML={cue}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder={PreferredLanguageText('title')}
                            onChange={(text) => {
                                const modifedText = text.split('&amp;').join('&')
                                setCue(modifedText)
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

                    </View>
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {channels.length !== 0 ?
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row', overflow: 'visible', backgroundColor: 'white' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                            {/* {PreferredLanguageText('channel')} */}
                                            Share With
                                            {/* <Ionicons
                                                name='school-outline' size={20} color={'#a2a2aa'} /> */}
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '100%', display: 'flex', backgroundColor: 'white' }}>
                                            <Menu
                                                onSelect={(channel: any) => {
                                                    if (channel === '') {
                                                        setChannelId('')
                                                        setCustomCategories(localCustomCategories)
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                        setSubmission(false)
                                                        setGradeWeight(0)
                                                        setGraded(false)
                                                        setSelected([])
                                                        setSubscribers([])
                                                        setProblems([])
                                                        setIsQuiz(false)
                                                        setChannelName('')
                                                        setTimer(false)
                                                    } else {
                                                        setChannelId(channel._id)
                                                        setChannelName(channel.name)
                                                        setAddCustomCategory(false)
                                                        setCustomCategory('')
                                                        setSubmission(isQuiz ? true : false)
                                                        setGradeWeight(0)
                                                        setGraded(false)
                                                    }
                                                }}>
                                                <MenuTrigger>
                                                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#202025' }}>
                                                        {channelName === '' ? 'My Cues' : channelName}<Ionicons name='caret-down' size={14} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: '#f4f4f6'
                                                    }
                                                }}>
                                                    <MenuOption
                                                        value={''}>
                                                        <Text>
                                                            {PreferredLanguageText('myCues')}
                                                        </Text>
                                                    </MenuOption>
                                                    {
                                                        channels.map((channel: any) => {
                                                            return <MenuOption
                                                                value={channel}>
                                                                <Text>
                                                                    {channel.name}
                                                                </Text>
                                                            </MenuOption>
                                                        })
                                                    }
                                                </MenuOptions>
                                            </Menu>
                                        </View>
                                    </View>
                                    {
                                        channelId !== '' ?
                                            <View style={{ flexDirection: 'column', paddingTop: 25, overflow: 'scroll', backgroundColor: 'white', flex: 1 }}>
                                                <ScrollView style={{
                                                    width: '100%',
                                                    padding: 5,
                                                    backgroundColor: '#fff'
                                                }}>
                                                    <MultiSelect
                                                        hideTags={false}
                                                        items={subscribers}
                                                        uniqueKey="value"
                                                        ref={RichText}
                                                        styleTextDropdown={{
                                                            fontFamily: 'overpass'
                                                        }}
                                                        styleDropdownMenuSubsection={{
                                                            height: 50,
                                                        }}
                                                        styleSelectorContainer={{
                                                            height: 350,
                                                        }}
                                                        styleItemsContainer={{
                                                            height: 250
                                                        }}
                                                        styleListContainer={{
                                                            height: 250,
                                                            backgroundColor: '#fff'
                                                        }}
                                                        onSelectedItemsChange={(sel: any) => setSelected(sel)}
                                                        selectedItems={selected}
                                                        selectText="Share with"
                                                        searchInputPlaceholderText="Search..."
                                                        altFontFamily="overpass"
                                                        tagRemoveIconColor="#a2a2aa"
                                                        tagBorderColor="#a2a2aa"
                                                        tagTextColor="#a2a2aa"
                                                        selectedItemTextColor="#202025"
                                                        selectedItemIconColor="#202025"
                                                        itemTextColor="#202025"
                                                        displayKey="label"
                                                        textColor="#202025"
                                                        submitButtonColor={'#202025'}
                                                        submitButtonText="Done"
                                                    />
                                                </ScrollView>
                                            </View> : null
                                    }
                                </View>
                                {
                                    channelId !== '' ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white', }}>
                                            <View style={{ width: '100%', paddingTop: 60, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                    {PreferredLanguageText('submissionRequired')}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    paddingRight: 10
                                                }}>
                                                    <Switch
                                                        disabled={isQuiz}
                                                        value={submission}
                                                        onValueChange={() => {
                                                            setSubmission(!submission)
                                                        }}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f4f4f6',
                                                            true: '#a2a2aa'
                                                        }}
                                                        thumbColor='white'
                                                    />
                                                </View>

                                                <View style={{ display: 'flex', flexDirection: 'column' }}>

                                                    {
                                                        submission ?
                                                            <View style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: Platform.OS === "android" ? 'column' : 'row',
                                                                backgroundColor: 'white',
                                                                paddingBottom: 10
                                                            }}>
                                                                <Text style={styles.text}>
                                                                    Available
                                                                    {Platform.OS === "android" ? ": " + moment(new Date(initiateAt)).format('MMMM Do YYYY, h:mm a') : null}
                                                                </Text>

                                                                {renderInitiateAtDateTimePicker()}
                                                            </View>
                                                            : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                    }

                                                    {
                                                        submission ?
                                                            <View style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: Platform.OS === "android" ? 'column' : 'row',
                                                                backgroundColor: 'white',

                                                            }}>
                                                                <Text style={styles.text}>
                                                                    {PreferredLanguageText('deadline')}
                                                                    {Platform.OS === "android" ? ": " + moment(new Date(deadline)).format('MMMM Do YYYY, h:mm a') : null}
                                                                </Text>
                                                                {renderDeadlineDateTimePicker()}
                                                            </View>
                                                            : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                    }

                                                </View>

                                            </View>
                                        </View> : null
                                }
                                {
                                    submission ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                    Grade Weight
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    paddingRight: 10,
                                                    paddingLeft: 10
                                                }}>
                                                    <Switch
                                                        value={graded}
                                                        onValueChange={() => setGraded(!graded)}
                                                        style={{ height: 20, marginRight: 'auto' }}
                                                        trackColor={{
                                                            false: '#f4f4f6',
                                                            true: '#a2a2aa'
                                                        }}
                                                        thumbColor='white'
                                                    />
                                                </View>
                                                {
                                                    graded ?
                                                        <View style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white',
                                                            alignItems: 'flex-start',
                                                            marginTop: 10
                                                        }}>
                                                            <Text style={styles.text}>
                                                                {PreferredLanguageText('percentageOverall')}
                                                            </Text>
                                                            <TextInput
                                                                value={gradeWeight}
                                                                style={{
                                                                    width: '100%',
                                                                    borderBottomColor: '#f4f4f6',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 15,
                                                                    padding: 15,
                                                                    paddingTop: 0,
                                                                    paddingBottom: 12,
                                                                    // marginTop: 5,
                                                                    marginBottom: 20
                                                                }}
                                                                placeholder={'0-100'}
                                                                onChangeText={val => setGradeWeight(val)}
                                                                placeholderTextColor={'#a2a2aa'}
                                                            />
                                                        </View>
                                                        : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                }
                                            </View>
                                        </View> : null
                                }
                            </View>
                            : null}
                        <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                            {PreferredLanguageText('category')}
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white' }}>
                                            {
                                                addCustomCategory ?
                                                    <View style={styles.colorBar}>
                                                        <TextInput
                                                            value={customCategory}
                                                            style={styles.allGrayOutline}
                                                            placeholder={'Enter Category'}
                                                            onChangeText={val => {
                                                                setCustomCategory(val)
                                                            }}
                                                            placeholderTextColor={'#a2a2aa'}
                                                        />
                                                    </View> :
                                                    <Menu
                                                        onSelect={(cat: any) => setCustomCategory(cat)}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2aa' }}>
                                                                {customCategory === '' ? 'None' : customCategory}<Ionicons name='caret-down' size={14} />
                                                            </Text>
                                                        </MenuTrigger>
                                                        <MenuOptions customStyles={{
                                                            optionsContainer: {
                                                                padding: 10,
                                                                borderRadius: 15,
                                                                shadowOpacity: 0,
                                                                borderWidth: 1,
                                                                borderColor: '#f4f4f6'
                                                            }
                                                        }}>
                                                            <MenuOption
                                                                value={''}>
                                                                <Text>
                                                                    None
                                                                </Text>
                                                            </MenuOption>
                                                            {
                                                                customCategories.map((category: any) => {
                                                                    return <MenuOption
                                                                        value={category}>
                                                                        <Text>
                                                                            {category}
                                                                        </Text>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>
                                            }
                                        </View>
                                        <View style={{ width: '15%', backgroundColor: 'white' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (addCustomCategory) {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                    } else {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(true)
                                                    }
                                                }}
                                                style={{ backgroundColor: 'white' }}>
                                                <Text style={{ textAlign: 'center', lineHeight: 20, width: '100%' }}>
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a2a2aa'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                        {PreferredLanguageText('priority')}
                                    </Text>
                                </View>
                                <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                                        <ScrollView style={{ ...styles.colorBar, height: 24 }} horizontal={true} showsHorizontalScrollIndicator={false}>
                                            {
                                                colorChoices.map((c: string, i: number) => {
                                                    return <TouchableOpacity onPress={() => {
                                                        setColor(i)
                                                    }} style={color === i ? styles.colorContainerOutline : styles.colorContainer} key={Math.random()}>
                                                        <View
                                                            style={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: 9,
                                                                backgroundColor: colorChoices[i]
                                                            }}

                                                        />
                                                    </TouchableOpacity>
                                                })
                                            }
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ width: '100%', paddingTop: 15, flexDirection: width < 768 ? 'column' : 'row', backgroundColor: '#fff' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                        Reminder
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'white',
                                    width: '100%',
                                    height: 40,
                                    marginRight: 10
                                }}>
                                    <Switch
                                        value={notify}
                                        onValueChange={() => {
                                            if (notify) {
                                                // setShuffle(false)
                                                setFrequency("0")
                                            } else {
                                                // setShuffle(true)
                                                setFrequency("1-D")
                                            }
                                            setPlayChannelCueIndef(true)
                                            setNotify(!notify)
                                        }}
                                        style={{ height: 20, marginRight: 'auto' }}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#3B64F8'
                                        }}
                                        thumbColor='white'
                                    />
                                </View>
                            </View>
                            {
                                notify ?
                                    <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                Recurring
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={!shuffle}
                                                    onValueChange={() => setShuffle(!shuffle)}
                                                    style={{ height: 20, marginRight: 'auto' }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#a2a2aa'
                                                    }}
                                                    thumbColor='white'
                                                />
                                            </View>
                                            {
                                                !shuffle ?
                                                    <View style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindEvery')}
                                                        </Text>
                                                        <Menu
                                                            onSelect={(cat: any) => {
                                                                setFrequency(cat.value)
                                                                setFrequencyName(cat.label)
                                                            }}>
                                                            <MenuTrigger>
                                                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2aa' }}>
                                                                    {frequencyName}<Ionicons name='caret-down' size={14} />
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions customStyles={{
                                                                optionsContainer: {
                                                                    padding: 10,
                                                                    borderRadius: 15,
                                                                    shadowOpacity: 0,
                                                                    borderWidth: 1,
                                                                    borderColor: '#f4f4f6'
                                                                }
                                                            }}>
                                                                {/* <MenuOption
                                                                    value={''}>
                                                                    <Text>
                                                                        None
                                                                    </Text>
                                                                </MenuOption> */}
                                                                {
                                                                    timedFrequencyOptions.map((item: any) => {
                                                                        return <MenuOption
                                                                            value={item}>
                                                                            <Text>
                                                                                {item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                            </Text>
                                                                        </MenuOption>
                                                                    })
                                                                }
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View> :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: Platform.OS === "ios" ? "row" : "column",
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('RemindOn')}
                                                            {Platform.OS === "android" ? ": " + moment(new Date(endPlayAt)).format('MMMM Do YYYY, h:mm a') : null}
                                                        </Text>
                                                        {/* <Datetime
                                                            value={endPlayAt}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
                                                        /> */}
                                                        {renderEndPlayAtDateTimePicker()}
                                                    </View>
                                            }
                                        </View>
                                    </View> : null
                            }
                            {
                                notify && !shuffle ?
                                    <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: '#fff' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                Indefinite
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={playChannelCueIndef}
                                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                                    style={{ height: 20, marginRight: 'auto' }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#a2a2aa'
                                                    }}
                                                    thumbColor='white'
                                                />
                                            </View>
                                            {
                                                playChannelCueIndef ? null :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: Platform.OS === "android" ? 'column' : 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindTill')}
                                                            {Platform.OS === "android" ? ": " + moment(new Date(endPlayAt)).format('MMMM Do YYYY, h:mm a') : null}
                                                        </Text>
                                                        {/* <Datetime
                                                            value={endPlayAt}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
                                                        /> */}
                                                        {renderEndPlayAtDateTimePicker()}
                                                    </View>
                                            }
                                        </View>
                                    </View> : null
                            }

                            {isQuiz ? <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                        Shuffle Questions
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                    <View style={{
                                        backgroundColor: 'white',
                                        height: 40,
                                        marginRight: 10
                                    }}>
                                        <Switch
                                            value={shuffleQuiz}
                                            onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                                            style={{ height: 20, marginRight: 'auto' }}
                                            trackColor={{
                                                false: '#f4f4f6',
                                                true: '#a2a2aa'
                                            }}
                                            thumbColor='white'
                                        />
                                    </View>
                                </View>
                            </View> : null}
                        </View>
                    </View>
                    <View style={styles.footer}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'row',
                                height: 50,
                                paddingTop: 10
                            }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (isQuiz) {
                                        createNewQuiz()
                                    } else {
                                        handleCreate()
                                    }
                                }}
                                style={{
                                    borderRadius: 15,
                                    backgroundColor: 'white'
                                }}>
                                {
                                    channelId === '' ?
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 11,
                                            backgroundColor: '#3B64F8',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isSubmitting ? PreferredLanguageText('sharing') : PreferredLanguageText('save')}
                                            {/* TO  <Ionicons name='home-outline' size={14} /> */}
                                        </Text> :
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 11,
                                            backgroundColor: '#3B64F8',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isSubmitting ? PreferredLanguageText('sharing') : PreferredLanguageText('share')}
                                        </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Collapsible ends here */}
                </ScrollView>
            </Animated.View>
        </View >
    );
}

export default Create

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: '#202025',
        borderRadius: 10,
        marginLeft: 10
    },
    cuesInput: {
        width: '100%',
        backgroundColor: '#f4f4f6',
        borderRadius: 15,
        fontSize: 21,
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: '4%'
    },
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
        paddingBottom: 30,
        lineHeight: 18
    },
    colorContainer: {
        // lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginHorizontal: 7,
        padding: 4,
        backgroundColor: 'white'
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginHorizontal: 7,
        paddingHorizontal: 5,
        backgroundColor: 'white',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    },
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
    },
    date: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 4,
        backgroundColor: 'white',
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 11,
        textAlign: 'center',
        width: 100,
        height: 200,
        alignSelf: 'center',
        marginTop: -20,
        borderRadius: 3
    },
    text: {
        fontSize: 11,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    all: {
        fontSize: 11,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allBlack: {
        fontSize: 11,
        color: '#202025',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 11,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#202025'
    },
    allGrayOutline: {
        fontSize: 11,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    },
    color1: {
        backgroundColor: '#D11C60'
    },
    color2: {
        backgroundColor: '#EF5B24',
    },
    color3: {
        backgroundColor: '#E0D41F',
    },
    color4: {
        backgroundColor: '#B8D41F',
    },
    color5: {
        backgroundColor: '#7FB1D3',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    }
})