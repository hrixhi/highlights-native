import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, Dimensions, ScrollView, Animated, Button, Linking } from 'react-native';
import Alert from '../components/Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { createCue, deleteCue, deleteForEveryone, getChannels, getQuiz, getSharedWith, markAsRead, shareCueWithMoreIds, start, submit } from '../graphql/QueriesAndMutations';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import FileUpload from './UploadFiles';
import DateTimePicker from '@react-native-community/datetimepicker';
import Quiz from './Quiz';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import TeXToSVG from "tex-to-svg";
import Collapsible from 'react-native-collapsible';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as Updates from 'expo-updates';
import MultiSelect from 'react-native-multiple-select';

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [cue, setCue] = useState(props.cue.cue)
    const [shuffle, setShuffle] = useState(props.cue.shuffle)
    const [starred, setStarred] = useState(props.cue.starred)
    const [color, setColor] = useState(props.cue.color)
    const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false)
    const [frequency, setFrequency] = useState(props.cue.frequency)
    const [customCategory, setCustomCategory] = useState(props.cue.customCategory)
    const [customCategories] = useState(props.customCategories)
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [markedAsRead, setMarkedAsRead] = useState(false)
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    const [isOwner, setIsOwner] = useState(false)
    const stopPlay = props.cue.endPlayAt && props.cue.endPlayAt !== ''
        ? (
            props.cue.endPlayAt === 'Invalid Date' ? new Date() : new Date(props.cue.endPlayAt)
        )
        : new Date()
    const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay)
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
        props.cue.endPlayAt && props.cue.endPlayAt !== ''
            ? false
            : true
    )
    const now = new Date(props.cue.date)
    const RichText: any = useRef();
    const [height, setHeight] = useState(100)
    const [showOriginal, setShowOriginal] = useState(props.cue.channelId && props.cue.channelId !== '' ? true : false)
    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#F8D41F', '#B8D41F', '#53BE6D'].reverse()
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false)
    const dead = props.cue.deadline && props.cue.deadline !== ''
        ? (
            props.cue.deadline === 'Invalid Date' ? new Date() : new Date(props.cue.deadline)
        )
        : new Date()
    const [deadline, setDeadline] = useState<Date>(dead)
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0)
    const [score] = useState<any>(props.cue.score ? props.cue.score : 0)
    const [graded, setGraded] = useState(props.cue.gradeWeight && props.cue.gradeWeight !== 0 ? true : false)
    const currentDate = new Date()
    const [submitted, setSubmitted] = useState(false)
    const [userSetupComplete, setUserSetupComplete] = useState(false)
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [submissionImported, setSubmissionImported] = useState(false)
    const [submissionUrl, setSubmissionUrl] = useState('')
    const [showOptions, setShowOptions] = useState(false)
    const [submissionType, setSubmissionType] = useState('')
    const [submissionTitle, setSubmissionTitle] = useState('')
    const [key, setKey] = useState(Math.random())
    const [showImportOptions, setShowImportOptions] = useState(false)
    const [channels, setChannels] = useState<any[]>([])
    const [shareWithChannelId, setShareWithChannelId] = useState('')
    const [selected, setSelected] = useState<any[]>([])
    const [subscribers, setSubscribers] = useState<any[]>([])
    const [expandMenu, setExpandMenu] = useState(false)
    // quiz options
    const [isQuiz, setIsQuiz] = useState(false)
    const [problems, setProblems] = useState<any[]>([])
    const [solutions, setSolutions] = useState<any[]>([])
    const [quizId, setQuizId] = useState('')
    const [loading, setLoading] = useState(true)
    const [initiatedAt, setInitiatedAt] = useState<any>(null)
    const [isQuizTimed, setIsQuizTimed] = useState(false)
    const [duration, setDuration] = useState(0)
    const [initDuration, setInitDuration] = useState(0)
    const [equation, setEquation] = useState('y = x + 1')
    const [showEquationEditor, setShowEquationEditor] = useState(false)
    const [handlingSubmit, setHandlingSubmit] = useState(false)

    const insertEquation = useCallback(() => {
        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        RichText.current.insertHTML('<div><br/>' + SVGEquation + '<br/></div>');
        setShowEquationEditor(false)
        setEquation('')
        // setReloadEditorKey(Math.random())
    }, [equation, RichText, RichText.current, cue])

    const diff_seconds = (dt2: any, dt1: any) => {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        return Math.abs(Math.round(diff));
    }

    useEffect(() => {
        if (!isQuizTimed || initiatedAt === null || initiatedAt === '' || isOwner) {
            // not a timed quiz or its not been initiated
            return;
        }
        let now = new Date()
        now.setMinutes(now.getMinutes() - 1)
        let current = new Date();
        if (now >= deadline) {
            // deadline crossed
            return;
        }
        if (duration === 0) {
            return;
        }
        const remainingTime = duration - diff_seconds(initiatedAt, current)
        if (remainingTime <= 0) {
            // duration has been set correctly yet no time remaining
            if (!props.cue.submittedAt || props.cue.submittedAt === '') {
                handleSubmit()
            }
        } else {
            setInitDuration(remainingTime)  // set remaining duration in seconds
        }
    }, [initiatedAt, duration, deadline, isQuizTimed, props.cue.submittedAt, isOwner])

    const loadChannelsAndSharedWith = useCallback(async () => {
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
            if (user._id.toString().trim() === props.cue.createdBy && props.cue.channelId && props.cue.channelId !== '') {
                // owner
                server.query({
                    query: getSharedWith,
                    variables: {
                        channelId: props.cue.channelId,
                        cueId: props.cue._id
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
                                if (s.isFixed) {
                                    ids.push(s.value)
                                }
                            })
                            setSubscribers(shared)
                            setSelected(ids)
                        }
                    })
                    .catch((err: any) => console.log(err))
            }
        }
    }, [props.cue,])

    useEffect(() => {
        loadChannelsAndSharedWith()
    }, [])

    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = props.cue.original;
            const data2 = cue;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1)
                if (obj.quizId) {
                    if (isQuiz) {
                        return;
                    }
                    // load quiz here and set problems
                    const server = fetchAPI('')
                    server.query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId
                        }
                    }).then(res => {
                        if (res.data && res.data.quiz.getQuiz) {
                            setQuizId(obj.quizId)
                            const solutionsObject = cue ? JSON.parse(cue) : {}
                            if (solutionsObject.solutions) {
                                setSolutions(solutionsObject.solutions)
                            }
                            setProblems(res.data.quiz.getQuiz.problems);
                            if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                                setDuration(res.data.quiz.getQuiz.duration * 60);
                                setIsQuizTimed(true)
                            }
                            if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== '') {
                                const init = new Date(solutionsObject.initiatedAt)
                                setInitiatedAt(init)
                            }
                            setTitle(obj.title)
                            setIsQuiz(true)
                            setLoading(false)
                        }
                    })
                } else {
                    setImported(true)
                    setUrl(obj.url)
                    setType(obj.type)
                    setTitle(obj.title)
                }
            } else {
                setImported(false)
                setUrl('')
                setType('')
                setTitle('')
            }
            if (data2 && data2[0] && data2[0] === '{' && data2[data2.length - 1] === '}') {
                const obj = JSON.parse(data2)
                setSubmissionImported(true)
                setSubmissionUrl(obj.url)
                setSubmissionType(obj.type)
                setSubmissionTitle(obj.title)
            } else {
                setSubmissionImported(false)
                setSubmissionUrl('')
                setSubmissionType('')
                setSubmissionTitle('')
            }
        } else {
            const data = cue
            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data)
                setSubmissionImported(true)
                setSubmissionUrl(obj.url)
                setSubmissionType(obj.type)
                setSubmissionTitle(obj.title)
            } else {
                setSubmissionImported(false)
                setSubmissionUrl('')
                setSubmissionType('')
                setSubmissionTitle('')
            }
        }
        setLoading(false)
        setKey(Math.random())
    }, [props.cue, cue, isQuiz])

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

    const initQuiz = useCallback(async () => {
        let now = new Date()
        if (now >= deadline) {
            Alert("Unable to start quiz!", "Deadline has passed.")
            return;
        }
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const user = JSON.parse(u)
            const now = new Date()
            const server = fetchAPI('')
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt: now
            })
            server.mutate({
                mutation: start,
                variables: {
                    cueId: props.cue._id,
                    userId: user._id,
                    cue: saveCue
                }
            }).then((res) => {
                if (res.data.quiz.start) {
                    setInitiatedAt(now)
                }
            }).catch(err => console.log(err))
            // save time to cloud first
            // after saving time in cloud, save it locally, set initiatedAt
            // quiz gets triggered
        }
    }, [props.cue._id, solutions, deadline])

    const fileUpload = useCallback(async () => {
        const file = await DocumentPicker.getDocumentAsync()
        console.log(file)
    }, [])

    const handleUpdate = useCallback(async () => {
        if (submissionImported && submissionTitle === '') {
            Alert("Enter title.")
            return
        }
        let subCues: any = {}
        try {
            const value = await AsyncStorage.getItem('cues')
            if (value) {
                subCues = JSON.parse(value)
            }
        } catch (e) {
        }
        if (subCues[props.cueKey].length === 0) {
            return
        }
        let saveCue = ''
        if (isQuiz) {
            saveCue = JSON.stringify({
                solutions,
                initiatedAt
            })
        } else if (submissionImported) {
            const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = cue
        }
        const submittedNow = new Date()
        subCues[props.cueKey][props.cueIndex] = {
            _id: props.cue._id,
            cue: saveCue,
            date: props.cue.date,
            color,
            shuffle,
            frequency,
            starred,
            customCategory,
            // Channel controls
            channelId: props.cue.channelId,
            createdBy: props.cue.createdBy,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            channelName: props.cue.channelName,
            original: props.cue.original,
            status: 'read',
            graded: props.cue.graded,
            gradeWeight,
            submission,
            unreadThreads: props.cue.unreadThreads,
            score,
            comment: props.cue.comment,
            submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
            deadline: submission ? deadline.toISOString() : '',
        }
        const stringifiedCues = JSON.stringify(subCues)
        await AsyncStorage.setItem('cues', stringifiedCues)
        props.reloadCueListAfterUpdate()
    }, [cue, customCategory, shuffle, frequency, starred, color, playChannelCueIndef, notify, submissionImported,
        submission, deadline, gradeWeight, submitted, submissionTitle, submissionType, submissionUrl, isQuiz,
        props.closeModal, props.cueIndex, props.cueKey, props.cue, endPlayAt, props, solutions, initiatedAt])

    const handleDelete = useCallback(async () => {

        const server = fetchAPI('')
        if (props.cue.channelId && isOwner) {
            server.mutate({
                mutation: deleteForEveryone,
                variables: {
                    cueId: props.cue._id
                }
            }).then(res => {
                if (res.data.cue.deleteForEveryone) {
                    Alert("Cue Deleted!");
                }
            })
        }

        if (!props.cue.channelId) {
            server.mutate({
                mutation: deleteCue,
                variables: {
                    cueId: props.cue._id
                }
            })
        }

        let subCues: any = {}
        try {
            const value = await AsyncStorage.getItem('cues')
            if (value) {
                subCues = JSON.parse(value)
            }
        } catch (e) {
        }
        if (subCues[props.cueKey].length === 0) {
            return
        }
        const updatedCues: any[] = []
        subCues[props.cueKey].map((i: any, j: any) => {
            if (j !== props.cueIndex) {
                updatedCues.push({ ...i })
            }
        })
        subCues[props.cueKey] = updatedCues
        const stringifiedCues = JSON.stringify(subCues)
        await AsyncStorage.setItem('cues', stringifiedCues)
        props.closeModal()
    }, [props.cueIndex, props.closeModal, props.cueKey, props.cue, isOwner])

    const handleSubmit = useCallback(async () => {
        const u: any = await AsyncStorage.getItem('user')
        let now = new Date()
        // one minute of extra time to submit 
        now.setMinutes(now.getMinutes() - 1)
        if (isQuiz) {
            if (now >= deadline) {
                Alert("Submission failed.", "If you started a timed quiz, your last recorded edit will be recorded.")
                setHandlingSubmit(false)
                return;
            }
            // over here check that all options have been selected
            // TO DO
        } else {
            if (now >= deadline) {
                Alert("Submission failed.", "Deadline has passed.")
                setHandlingSubmit(false)
                return;
            }
        }
        if (u) {
            const parsedUser = JSON.parse(u)
            if (!parsedUser.email || parsedUser.email === '') {
                // cannot submit
                setHandlingSubmit(false)
                return
            }
            let saveCue = ''
            if (isQuiz) {
                saveCue = JSON.stringify({
                    solutions,
                    initiatedAt
                })
            } else if (submissionImported) {
                const obj = {
                    type: submissionType,
                    url: submissionUrl,
                    title: submissionTitle
                }
                saveCue = JSON.stringify(obj)
            } else {
                if (cue === '') {
                    setHandlingSubmit(false)
                    return;
                }
                saveCue = cue
            }

            const server = fetchAPI('')
            server.mutate({
                mutation: submit,
                variables: {
                    cue: saveCue,
                    cueId: props.cue._id,
                    userId: parsedUser._id,
                    quizId: isQuiz ? quizId : null
                }
            }).then(res => {
                if (res.data.cue.submitModification) {
                    Alert(
                        "Submission Complete.",
                        (new Date()).toString(),
                        [
                            {
                                text: "Cancel", style: "cancel"
                            },
                            {
                                text: "Okay", onPress: async () => {
                                    await Updates.reloadAsync()
                                    setHandlingSubmit(false)
                                }
                            }
                        ]
                    );
                }
            }).catch(err => {
                Alert("Something went wrong.", "Try again later.")
            })
        }
    }, [props.cue, cue, submissionTitle, submissionType, submissionUrl, submissionImported, isQuiz, quizId, initiatedAt, solutions, deadline])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u && props.cue.createdBy) {
                    const parsedUser = JSON.parse(u)
                    if (parsedUser._id.toString().trim() === props.cue.createdBy.toString().trim()) {
                        setIsOwner(true)
                    }
                    if (parsedUser.email && parsedUser.email !== '') {
                        setUserSetupComplete(true)
                    }
                }
            }
        )()
    }, [props.cue])

    useEffect(() => {
        handleUpdate()
    }, [cue, shuffle, frequency, starred, color, props.cueIndex, submitted, markedAsRead,
        submissionTitle, submissionImported, submissionType, isQuiz, solutions, initiatedAt,
        customCategory, props.cueKey, endPlayAt, playChannelCueIndef, notify])

    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== 'read' && !markedAsRead) {
            const u = await AsyncStorage.getItem('user')
            if (u) {
                const user = JSON.parse(u)
                const server = fetchAPI('')
                server.mutate({
                    mutation: markAsRead,
                    variables: {
                        cueId: props.cue._id,
                        userId: user._id
                    }
                })
                    .then(res => {
                        if (res.data.status.markAsRead) {
                            setMarkedAsRead(true)
                        }
                    })
                    .catch(err => {
                    })
            }
        }
    }, [props.cue, markedAsRead])

    const clearAll = useCallback(() => {
        Alert(
            "Clear?",
            "This action cannot be undone.",
            [
                {
                    text: "Cancel", style: "cancel"
                },
                {
                    text: "Clear", onPress: () => {
                        setSubmissionImported(false)
                        setCue('')
                        setSubmissionUrl('')
                        setSubmissionType('')
                        setSubmissionTitle('')
                        setReloadEditorKey(Math.random())
                    }
                }
            ]
        )
    }, [])

    const shareCue = useCallback(async () => {
        let saveCue = ''
        if (submissionImported) {
            const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = cue
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: createCue,
            variables: {
                cue: props.cue.channelId ? props.cue.original : saveCue,
                starred,
                color: color.toString(),
                channelId: shareWithChannelId,
                frequency,
                customCategory,
                shuffle,
                createdBy: props.cue.createdBy,
                gradeWeight: gradeWeight.toString(),
                submission,
                deadline: submission ? deadline.toISOString() : '',
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
            }
        })
            .then(res => {
                if (res.data.cue.create) {
                    Alert('Shared!', 'Cue has been successfully shared.')
                }
            })
            .catch(err => {
                Alert("Something went wrong.", "Check connection.")
            })
    }, [
        submissionImported, submissionTitle, submissionType, submissionUrl,
        cue, starred, color, frequency, customCategory, shuffle, gradeWeight,
        submission, deadline, notify, playChannelCueIndef, endPlayAt,
        shareWithChannelId, props.cue])

    const onAddNew = useCallback((userId) => {
        const server = fetchAPI('')
        server.mutate({
            mutation: shareCueWithMoreIds,
            variables: {
                cueId: props.cue._id,
                userId
            }
        }).then(res => {
            if (res.data && res.data.cue.shareCueWithMoreIds) {
                loadChannelsAndSharedWith()
            }
        }).catch(err => console.log(err))
        const updatedSelected: any[] = [...selected]
        updatedSelected.push(userId)
        setSelected(updatedSelected)
    }, [subscribers, props.cue, selected])

    useEffect(() => {
        updateStatusAsRead()
    }, [props.cue.status])

    const download = useCallback(async (original: boolean) => {
        Linking.openURL(original ? url : submissionUrl);
    }, [submissionUrl, url, submissionTitle, submissionType, type, title])

    const width = Dimensions.get('window').width;

    if (loading) {
        return null;
    }

    return (
        <View style={{
            width: '100%',
            // height: Dimensions.get('window').height - 85,
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 20,
            // overflow: 'hidden'
        }}>
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: 1,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                // height: '100%'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                {
                    (props.cue.channelId && props.cue.channelId !== '') ?
                        <View style={{
                            width: '100%', flexDirection: 'row', marginBottom: 5, backgroundColor: '#fff'
                        }}>
                            {
                                isQuiz ? null :
                                    <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                        <TouchableOpacity
                                            style={{
                                                justifyContent: 'center',
                                                flexDirection: 'column',
                                                backgroundColor: '#fff'
                                            }}
                                            onPress={() => {
                                                setShowOriginal(true)
                                            }}>
                                            <Text style={showOriginal ? styles.allGrayFill : styles.all}>
                                                View Shared
                                            </Text>
                                        </TouchableOpacity>
                                        {
                                            isOwner && submission ? null :
                                                <TouchableOpacity
                                                    style={{
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                        backgroundColor: '#fff'
                                                    }}
                                                    onPress={() => {
                                                        setShowOriginal(false)
                                                    }}>
                                                    <Text style={!showOriginal ? styles.allGrayFill : styles.all}>
                                                        {
                                                            submission ? 'My Submission' : 'My Notes'
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                    </View>
                            }
                            {
                                props.cue.graded && (props.cue.score !== undefined && props.cue.score !== null) ?
                                    <Text style={{
                                        fontSize: 12,
                                        color: 'white',
                                        height: 22,
                                        overflow: 'hidden',
                                        paddingHorizontal: 10,
                                        marginLeft: 10,
                                        borderRadius: 10,
                                        backgroundColor: '#3B64F8',
                                        lineHeight: 20,
                                        paddingTop: 1
                                    }}>
                                        {props.cue.score}%
                                    </Text> : null
                            }
                            <TouchableOpacity
                                onPress={() => setStarred(!starred)}
                                style={{
                                    backgroundColor: 'white',
                                    flex: 1
                                }}>
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -35,
                                    paddingRight: 25,
                                    width: '100%'
                                }}>
                                    <Ionicons name='bookmark' size={25} color={starred ? '#d91d56' : '#a2a2aa'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                        : <View style={{ flexDirection: 'row' }}>
                            <View style={{ backgroundColor: 'white', flex: 1 }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        overflow: 'hidden',
                                        fontSize: 12,
                                        color: '#fff',
                                        paddingHorizontal: 10,
                                        borderRadius: 10,
                                        backgroundColor: '#a2a2aa',
                                        lineHeight: 20,
                                        width: 70,
                                        marginBottom: 20,
                                        textAlign: 'center'
                                    }}>
                                    Update
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setStarred(!starred)}
                                style={{
                                    backgroundColor: 'white',
                                    flex: 1
                                }}>
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -36,
                                    paddingRight: 25,
                                    width: '100%'
                                }}>
                                    <Ionicons name='bookmark' size={25} color={starred ? '#d91d56' : '#a2a2aa'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                }
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column-reverse' : 'row',
                    paddingBottom: 4,
                    backgroundColor: 'white'
                }} onTouchStart={() => Keyboard.dismiss()}>
                    <View style={{ flexDirection: submissionImported || showImportOptions ? 'row' : 'column', flex: 1, backgroundColor: '#fff' }}>
                        {
                            (showOriginal)
                                ? <View style={{ height: 28, backgroundColor: '#fff' }} />
                                : (
                                    (props.cue.submittedAt && props.cue.submittedAt !== '') || submitted ?
                                        <View style={{ height: 28, backgroundColor: '#fff' }} />
                                        :
                                        <RichToolbar
                                            key={reloadEditorKey.toString() + showOriginal.toString()}
                                            style={{
                                                flexWrap: 'wrap',
                                                backgroundColor: 'white',
                                                height: 28,
                                                overflow: 'visible'
                                            }}
                                            iconSize={12}
                                            editor={RichText}
                                            disabled={false}
                                            iconTint={"#a2a2aa"}
                                            selectedIconTint={"#a2a2aa"}
                                            disabledIconTint={"#a2a2aa"}
                                            actions={
                                                submissionImported || showImportOptions ? ["back", "clear"] :
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
                                                        actions.undo,
                                                        actions.redo,
                                                        "clear"
                                                    ]}
                                            iconMap={{
                                                ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={15} color={tintColor} />,
                                                ["clear"]: ({ tintColor }) => <Ionicons name='trash-outline' size={13} color={tintColor} onPress={() => clearAll()} />,
                                                ["back"]: ({ tintColor }) => <Ionicons name='arrow-back' size={13} color={tintColor} onPress={() => setShowImportOptions(false)} />
                                            }}
                                            onPressAddImage={galleryCallback}
                                            insertCamera={cameraCallback}
                                        />
                                )
                        }
                        {
                            !showOriginal && props.cue.submission && !submissionImported && showImportOptions ?
                                <FileUpload
                                    back={() => setShowImportOptions(false)}
                                    onUpload={(u: any, t: any) => {
                                        const obj = { url: u, type: t, title: submissionTitle }
                                        setCue(JSON.stringify(obj))
                                        setShowImportOptions(false)
                                    }}
                                />
                                : null
                        }
                    </View>
                    <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                        {/* {
                            !showOriginal && !submissionImported && !props.cue.graded ?
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
                            !showOriginal && props.cue.submission && !submissionImported && !props.cue.graded ?
                                <Text style={{
                                    color: '#a2a2aa',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 10,
                                }}
                                    onPress={() => {
                                        setShowImportOptions(true)
                                        fileUpload()
                                    }}
                                >
                                    IMPORT     {Dimensions.get('window').width < 768 ? '' : '|  '}
                                </Text> :
                                null
                        }
                        <Text style={{
                            color: '#a2a2aa',
                            fontSize: 11,
                            lineHeight: 30,
                            flex: 1,
                            textAlign: 'right',
                            marginRight: 10
                        }}>
                            {
                                now.toString().split(' ')[1] +
                                ' ' +
                                now.toString().split(' ')[2] +
                                ', ' +
                                now.toString().split(' ')[3]
                            }
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
                                <Text style={{ flex: 1, fontSize: 12, color: '#a2a2aa' }}>
                                    ^ → Superscript, _ → Subscript, int → Integral, sum → Summation, prod → Product, sqrt → Square root, bar → Bar over letter, alpha, beta, ... omega → Small Greek letter, Alpha, Beta, ... Omega → Capital Greek letter
                                </Text>
                            </View>
                        </View> : null
                }
                <ScrollView
                    style={{
                        paddingBottom: 25,
                        borderBottomColor: '#f4f4f6', borderBottomWidth: 1
                    }}
                    onScrollBeginDrag={Keyboard.dismiss}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={'on-drag'}
                    overScrollMode={'always'}
                    onScroll={() => Keyboard.dismiss()}
                    nestedScrollEnabled={true}
                >
                    {
                        showOriginal && (imported || isQuiz) ?
                            <View style={{ flexDirection: 'row', marginRight: '10%', marginLeft: '10%', backgroundColor: '#fff' }}>
                                <View style={{ width: '40%', alignSelf: 'flex-start', backgroundColor: '#fff' }}>
                                    <TextInput
                                        editable={false}
                                        value={title}
                                        style={styles.input}
                                        placeholder={'Title'}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2aa'}
                                    />
                                </View>
                                {
                                    isQuiz ?
                                        (
                                            isQuizTimed && (!props.cue.submittedAt || props.cue.submittedAt !== '') ? (
                                                initiatedAt && initDuration !== 0 ?
                                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: '#fff' }}>
                                                        <CountdownCircleTimer
                                                            size={120}
                                                            key={initDuration}
                                                            children={({ remainingTime }: any) => {
                                                                if ((!remainingTime || remainingTime === 0) && !handlingSubmit) {
                                                                    setHandlingSubmit(true)
                                                                    handleSubmit()
                                                                }
                                                                const hours = Math.floor(remainingTime / 3600)
                                                                const minutes = Math.floor((remainingTime % 3600) / 60)
                                                                const seconds = remainingTime % 60
                                                                return <Text style={{ color: '#3B64F8' }}>
                                                                    {hours}h {minutes}m {seconds}s
                                                                </Text>
                                                            }}
                                                            isPlaying={true}
                                                            duration={duration}
                                                            initialRemainingTime={initDuration}
                                                            colors="#3B64F8"
                                                        />
                                                    </View>
                                                    : null
                                            ) : null
                                        )
                                        :
                                        <View style={{ marginLeft: 25, marginTop: 20, alignSelf: 'flex-start', backgroundColor: '#fff' }}>
                                            {/* <a download={true} href={url} style={{ textDecoration: 'none' }}> */}
                                            <Ionicons name='cloud-download-outline' color='#a2a2aa' size={20} onPress={() => download(true)} />
                                            {/* </a> */}
                                        </View>
                                }
                            </View> : null
                    }
                    {
                        !showOriginal && props.cue.graded && props.cue.comment ?
                            <View>
                                <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 25, marginLeft: '5%' }}>
                                    Grader's Remarks
                                </Text>
                                <TextInput
                                    value={props.cue.comment}
                                    style={{
                                        height: 200,
                                        backgroundColor: '#f4f4f6',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 13,
                                        paddingBottom: 13,
                                        marginTop: 5,
                                        marginBottom: 20
                                    }}
                                    editable={false}
                                    placeholder={'Optional'}
                                    placeholderTextColor={'#a2a2aa'}
                                    multiline={true}
                                />
                            </View>
                            : null
                    }
                    {
                        !showOriginal && submissionImported && !isQuiz ?
                            <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                                <View style={{ width: '40%', alignSelf: 'flex-start', marginLeft: '10%', backgroundColor: 'white' }}>
                                    <TextInput
                                        value={submissionTitle}
                                        style={styles.input}
                                        placeholder={'Title'}
                                        onChangeText={val => setSubmissionTitle(val)}
                                        placeholderTextColor={'#a2a2aa'}
                                    />
                                </View>
                                {props.cue.submittedAt && props.cue.submittedAt !== '' ?
                                    <View style={{ width: 175, marginLeft: 25, marginTop: 5, alignSelf: 'flex-start' }}>
                                        {/* <a download={true} href={submissionUrl} style={{ textDecoration: 'none' }}> */}
                                        <Ionicons name='cloud-download-outline' color='#a2a2aa' size={20} onPress={() => download(false)} />
                                        {/* </a> */}
                                    </View> : null
                                }
                            </View> : null
                    }
                    <View style={{
                        width: '100%',
                        minHeight: 475,
                        backgroundColor: 'white'
                    }}
                    >
                        {!showOriginal ? null
                            : (
                                isQuiz ?
                                    (
                                        isQuizTimed && !isOwner ?
                                            (
                                                initiatedAt ?
                                                    <Quiz
                                                        // disable quiz if graded or deadline has passed
                                                        graded={props.cue.graded}
                                                        hasEnded={currentDate >= deadline}
                                                        solutions={solutions}
                                                        problems={problems}
                                                        setSolutions={(s: any) => setSolutions(s)}
                                                    /> : <View>
                                                        <View style={{ backgroundColor: '#fff' }}>
                                                            <TouchableOpacity
                                                                onPress={() => initQuiz()}
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    overflow: 'hidden',
                                                                    height: 35,
                                                                    marginTop: 15,
                                                                    justifyContent: 'center', flexDirection: 'row',
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
                                                                    width: 200,
                                                                    borderRadius: 15,
                                                                }}>
                                                                    START QUIZ
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                            )
                                            :
                                            <Quiz
                                                isOwner={isOwner}
                                                // disable quiz if graded or deadline has passed
                                                graded={props.cue.graded || (currentDate >= deadline)}
                                                solutions={solutions}
                                                problems={problems}
                                                setSolutions={(s: any) => setSolutions(s)}
                                            />
                                    )
                                    : (imported ?
                                        (
                                            // null
                                            <WebView source={{ uri: "http://docs.google.com/gview?embedded=true&url=" + url }} style={{ overflow: 'scroll' }} />                                            //     type === 'pptx' ?
                                            //         <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + url} width='100%' height='600px' frameBorder='0' />
                                            //         : <FileViewer
                                            //             unsupportedComponent={() =>
                                            //                 <View style={{ backgroundColor: 'white', flex: 1 }}>
                                            //                     <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                            //                         <Ionicons name='document-outline' size={50} color='#a2a2aa' />
                                            //                     </Text>
                                            //                 </View>
                                            //             }
                                            //             style={{ fontFamily: 'overpass' }}
                                            //             fileType={type}
                                            //             filePath={url}
                                            //             key={Math.random()}
                                            //             errorComponent={<View>
                                            //                 <Text>
                                            //                     ERROR!!
                                            // </Text>
                                            //             </View>}
                                            //             onError={(e: any) => console.log(e)} />

                                        )
                                        :
                                        <RichEditor
                                            key={showOriginal.toString() + reloadEditorKey.toString()}
                                            disabled={true}
                                            containerStyle={{
                                                height: height,
                                                backgroundColor: '#f4f4f6',
                                                padding: 3,
                                                paddingTop: 5,
                                                paddingBottom: 10,
                                                borderRadius: 8,
                                            }}
                                            ref={RichText}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#f4f4f6',
                                                minHeight: 475,
                                                borderRadius: 8,
                                            }}
                                            editorStyle={{
                                                backgroundColor: '#f4f4f6',
                                                placeholderColor: '#a2a2aa',
                                                color: '#202025',
                                                contentCSSText: 'font-size: 13px;'
                                            }}
                                            initialContentHTML={props.cue.original}
                                            onScroll={() => Keyboard.dismiss()}
                                            placeholder={"Title"}
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
                                        />))
                        }
                        {showOriginal ? null
                            : (submissionImported ?
                                (
                                    // null
                                    <WebView source={{ uri: "http://docs.google.com/gview?embedded=true&url=" + submissionUrl }} />
                                    // submissionType === 'pptx' ?
                                    //     <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + submissionUrl} width='100%' height='600px' frameBorder='0' />
                                    //     : <FileViewer
                                    //         unsupportedComponent={() =>
                                    //             <View style={{ backgroundColor: 'white', flex: 1 }}>
                                    //                 <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    //                     <Ionicons name='document-outline' size={50} color='#a2a2aa' />
                                    //                 </Text>
                                    //             </View>
                                    //         }
                                    //         key={submissionUrl + submissionType}
                                    //         style={{ fontFamily: 'overpass' }}
                                    //         fileType={submissionType}
                                    //         filePath={submissionUrl}
                                    //         errorComponent={<View>
                                    //             <Text>
                                    //                 ERROR!!
                                    //     </Text>
                                    //         </View>}
                                    //         onError={(e: any) => console.log(e)} />
                                )
                                :
                                <RichEditor
                                    key={showOriginal.toString() + reloadEditorKey.toString()}
                                    containerStyle={{
                                        height: height,
                                        backgroundColor: '#f4f4f6',
                                        padding: 3,
                                        paddingTop: 5,
                                        paddingBottom: 10,
                                        borderRadius: 8,
                                    }}
                                    disabled={props.cue.submittedAt && props.cue.submittedAt !== ''}
                                    ref={RichText}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#f4f4f6',
                                        minHeight: 475,
                                        borderRadius: 8,
                                    }}
                                    editorStyle={{
                                        backgroundColor: '#f4f4f6',
                                        placeholderColor: '#a2a2aa',
                                        color: '#202025',
                                        contentCSSText: 'font-size: 13px;'
                                    }}
                                    initialContentHTML={cue}
                                    onScroll={() => Keyboard.dismiss()}
                                    placeholder={"Title"}
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
                                />)
                        }
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowOptions(!showOptions)}
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            // marginTop: 20,
                            backgroundColor: '#fff',
                            borderTopColor: '#f4f4f6',
                            borderTopWidth: 1,
                            paddingTop: 40,
                            paddingBottom: 20
                        }}>
                        <Text style={{
                            color: '#a2a2aa', fontSize: 17, paddingRight: 10
                        }}>
                            Options
                        </Text>
                        <Ionicons size={17} name={showOptions ? 'caret-down-circle-outline' : 'caret-forward-circle-outline'} color='#a2a2aa' />
                    </TouchableOpacity>
                    <Collapsible collapsed={!showOptions} key={showOptions.toString()}>
                        <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {
                                props.cue.channelId ?
                                    <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                    Channel
                                                    {/* <Ionicons
                                                        name='school-outline' size={20} color={'#a2a2aa'} /> */}
                                                </Text>
                                            </View>
                                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                                <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                    <View style={styles.colorBar}>
                                                        <TouchableOpacity
                                                            style={styles.allOutline}
                                                            onPress={() => { }}>
                                                            <Text style={{ color: '#fff', lineHeight: 20, fontSize: 12 }}>
                                                                {props.cue.channelName}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                            {
                                                props.cue.channelId !== '' && isOwner ?
                                                    <View style={{ height: 350, flexDirection: 'column', paddingTop: 25, overflow: 'scroll', backgroundColor: 'white' }}>
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
                                                                onSelectedItemsChange={(sel: any) => {
                                                                    if (sel.length > selected.length) {
                                                                        onAddNew(sel[selected.length])
                                                                    } else {
                                                                        Alert("Cannot un-share!")
                                                                    }
                                                                }}
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
                                            props.cue.channelId !== '' ?
                                                <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white' }}>
                                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                        <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                            Submission Required
                                                        </Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                                        {
                                                            isOwner ?
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
                                                                : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                        }
                                                        {
                                                            submission ?
                                                                <View style={{
                                                                    width: '100%',
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    backgroundColor: 'white'
                                                                }}>
                                                                    <Text style={{
                                                                        fontSize: 12,
                                                                        color: '#a2a2aa',
                                                                        textAlign: 'left',
                                                                        paddingRight: 10
                                                                    }}>
                                                                        Due
                                                                    </Text>
                                                                    {
                                                                        isOwner ?
                                                                            <View style={{ backgroundColor: '#fff' }}>
                                                                                <DateTimePicker
                                                                                    style={styles.timePicker}
                                                                                    value={deadline}
                                                                                    mode={'date'}
                                                                                    textColor={'#202025'}
                                                                                    onChange={(event, selectedDate) => {
                                                                                        const currentDate: any = selectedDate;
                                                                                        setDeadline(currentDate)
                                                                                    }}
                                                                                />
                                                                                <View style={{ height: 10, backgroundColor: 'white' }} />
                                                                                <DateTimePicker
                                                                                    style={styles.timePicker}
                                                                                    value={deadline}
                                                                                    mode={'time'}
                                                                                    textColor={'#202025'}
                                                                                    onChange={(event, selectedDate) => {
                                                                                        const currentDate: any = selectedDate;
                                                                                        setDeadline(currentDate)
                                                                                    }}
                                                                                />
                                                                            </View>
                                                                            : <Text style={{
                                                                                fontSize: 12,
                                                                                color: '#a2a2aa',
                                                                                textAlign: 'left'
                                                                            }}>
                                                                                {deadline.toLocaleString()}
                                                                            </Text>
                                                                    }
                                                                </View>
                                                                : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                        }
                                                    </View>
                                                </View> : null
                                        }
                                        {
                                            submission ?
                                                <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white' }}>
                                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                        <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                            Graded
                                                </Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', backgroundColor: 'white', }}>
                                                        <View style={{
                                                            backgroundColor: 'white',
                                                            height: 40,
                                                            paddingRight: 10
                                                        }}>
                                                            <Switch
                                                                disabled={!isOwner}
                                                                value={graded}
                                                                onValueChange={() => setGraded(!graded)}
                                                                style={{ height: 20 }}
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
                                                                    backgroundColor: 'white'
                                                                }}>
                                                                    <Text style={{
                                                                        fontSize: 12,
                                                                        color: '#a2a2aa',
                                                                        textAlign: 'left',
                                                                        paddingRight: 10
                                                                    }}>
                                                                        Grade Weight {'\n'}(% of overall grade)
                                                        </Text>
                                                                    {
                                                                        isOwner ?
                                                                            <TextInput
                                                                                value={gradeWeight}
                                                                                style={styles.input}
                                                                                placeholder={'0-100'}
                                                                                onChangeText={val => setGradeWeight(val)}
                                                                                placeholderTextColor={'#a2a2aa'}
                                                                            /> :
                                                                            <Text style={{
                                                                                color: '#a2a2aa',
                                                                                textAlign: 'left',
                                                                                fontSize: 12
                                                                            }}>
                                                                                {gradeWeight}
                                                                            </Text>
                                                                    }
                                                                </View>
                                                                : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                                                        }
                                                    </View>
                                                </View> : null
                                        }
                                    </View>
                                    : null
                            }
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                            Category
                                    </Text>
                                    </View>
                                    {
                                        props.cue.channelId ?
                                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                                <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                    <View style={styles.colorBar}>
                                                        <TouchableOpacity
                                                            style={styles.allGrayOutline}
                                                            onPress={() => { }}>
                                                            <Text style={{ color: '#a2a2aa', lineHeight: 20, fontSize: 12 }}>
                                                                {props.cue.customCategory === '' ? 'None' : props.cue.customCategory}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                            : <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                                <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                    {
                                                        addCustomCategory ?
                                                            <View style={styles.colorBar}>
                                                                <TextInput
                                                                    value={customCategory}
                                                                    style={styles.allGrayOutline}
                                                                    placeholder={'New Category'}
                                                                    onChangeText={val => {
                                                                        setCustomCategory(val)
                                                                    }}
                                                                    placeholderTextColor={'#a2a2aa'}
                                                                />
                                                            </View> :
                                                            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                                <TouchableOpacity
                                                                    style={customCategory === '' ? styles.allGrayOutline : styles.all}
                                                                    onPress={() => {
                                                                        setCustomCategory('')
                                                                    }}>
                                                                    <Text style={{ color: '#a2a2aa', lineHeight: 20 }}>
                                                                        None
                                                                </Text>
                                                                </TouchableOpacity>
                                                                {
                                                                    customCategories.map((category: string) => {
                                                                        return <TouchableOpacity
                                                                            key={Math.random()}
                                                                            style={customCategory === category ? styles.allGrayOutline : styles.all}
                                                                            onPress={() => {
                                                                                setCustomCategory(category)
                                                                            }}>
                                                                            <Text style={{ color: '#a2a2aa', lineHeight: 20, fontSize: 12 }}>
                                                                                {category}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    })
                                                                }
                                                            </ScrollView>
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
                                                        <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
                                                            <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a2a2aa'} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                    }
                                </View>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                            Priority
                                </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                                            <ScrollView style={{ ...styles.colorBar, height: 20 }} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                {
                                                    colorChoices.map((c: string, i: number) => {
                                                        return <View style={color === i ? styles.colorContainerOutline : styles.colorContainer} key={Math.random()}>
                                                            <TouchableOpacity
                                                                style={{
                                                                    width: 9,
                                                                    height: 9,
                                                                    borderRadius: 6,
                                                                    backgroundColor: colorChoices[i]
                                                                }}
                                                                onPress={() => {
                                                                    setColor(i)
                                                                }}
                                                            />
                                                        </View>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View>
                                {
                                    channels.length === 0 ? null :
                                        <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6', backgroundColor: 'white' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                    Share
                                            </Text>
                                            </View>
                                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                                <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                    <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                        {
                                                            channels.map((channel) => {
                                                                return <TouchableOpacity
                                                                    key={Math.random()}
                                                                    style={shareWithChannelId === channel._id ? styles.allOutline : styles.allBlack}
                                                                    onPress={() => {
                                                                        if (shareWithChannelId === '') {
                                                                            setShareWithChannelId(channel._id)
                                                                        } else {
                                                                            setShareWithChannelId('')
                                                                        }
                                                                    }}>
                                                                    <Text style={{ lineHeight: 20, fontSize: 12, color: shareWithChannelId === channel._id ? '#fff' : '#202025' }}>
                                                                        {channel.name}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            })
                                                        }
                                                    </ScrollView>
                                                </View>
                                                <View style={{ width: '15%', backgroundColor: 'white' }}>
                                                    <TouchableOpacity
                                                        disabled={shareWithChannelId === ''}
                                                        onPress={() => shareCue()}
                                                        style={{ backgroundColor: 'white' }}>
                                                        <Text style={{ textAlign: 'center', lineHeight: 20, width: '100%' }}>
                                                            <Ionicons name={'arrow-redo-outline'} size={20} color={shareWithChannelId === '' ? '#a2a2aa' : '#202025'} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                }
                            </View>
                        </View>
                        <View style={{ width: '100%', paddingTop: 15, flexDirection: width < 768 ? 'column' : 'row', backgroundColor: 'white' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                        <Ionicons name='notifications-outline' size={20} color={'#a2a2aa'} />
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'white',
                                    width: '100%',
                                    height: 40,
                                    paddingRight: 10
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
                                        style={{ height: 20 }}
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
                                    <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                <Ionicons
                                                    name='repeat-outline' size={20} color={'#a2a2aa'} />
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                paddingRight: 10
                                            }}>
                                                <Switch
                                                    value={!shuffle}
                                                    onValueChange={() => setShuffle(!shuffle)}
                                                    style={{ height: 20 }}
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
                                                        flex: 1,
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            Remind every
                                                        </Text>
                                                        <Picker
                                                            style={styles.picker}
                                                            itemStyle={{
                                                                fontSize: 17
                                                            }}
                                                            selectedValue={frequency}
                                                            onValueChange={(itemValue: any) =>
                                                                setFrequency(itemValue)
                                                            }>
                                                            {
                                                                timedFrequencyOptions.map((item: any, index: number) => {
                                                                    return <Picker.Item
                                                                        color={frequency === item.value ? '#3B64F8' : "#202025"}
                                                                        label={item.value === '0' && cue.channelId !== '' ? 'Once' : item.label}
                                                                        value={item.value}
                                                                        key={index}
                                                                    />
                                                                })
                                                            }
                                                        </Picker>
                                                    </View> :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            Remind on
                                                        </Text>
                                                        <View style={{ backgroundColor: '#fff' }}>

                                                            <DateTimePicker
                                                                style={styles.timePicker}
                                                                value={endPlayAt}
                                                                mode={'date'}
                                                                textColor={'#202025'}
                                                                onChange={(event, selectedDate) => {
                                                                    const currentDate: any = selectedDate;
                                                                    setEndPlayAt(currentDate)
                                                                }}
                                                            />
                                                            <View style={{ height: 10, backgroundColor: 'white' }} />
                                                            <DateTimePicker
                                                                style={styles.timePicker}
                                                                value={endPlayAt}
                                                                mode={'time'}
                                                                textColor={'#202025'}
                                                                onChange={(event, selectedDate) => {
                                                                    const currentDate: any = selectedDate;
                                                                    setEndPlayAt(currentDate)
                                                                }}
                                                            />
                                                        </View>
                                                        {/* <Datetime
                                                            value={endPlayAt}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
                                                        /> */}
                                                    </View>
                                            }
                                        </View>
                                    </View> : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                            }
                            {
                                notify && !shuffle ?
                                    <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: '#fff' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                                <Ionicons
                                                    name='infinite-outline' size={20} color={'#a2a2aa'} />
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                paddingRight: 10
                                            }}>
                                                <Switch
                                                    value={playChannelCueIndef}
                                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#a2a2aa'
                                                    }}
                                                    thumbColor='white'
                                                />
                                            </View>
                                            {
                                                playChannelCueIndef ? <View style={{ flex: 1, backgroundColor: '#fff' }} /> :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            Remind till
                                                            </Text>
                                                        <View style={{ backgroundColor: '#fff' }}>
                                                            <DateTimePicker
                                                                style={styles.timePicker}
                                                                value={endPlayAt}
                                                                mode={'date'}
                                                                textColor={'#202025'}
                                                                onChange={(event, selectedDate) => {
                                                                    const currentDate: any = selectedDate;
                                                                    setEndPlayAt(currentDate)
                                                                }}
                                                            />
                                                            <View style={{ height: 10, backgroundColor: 'white' }} />
                                                            <DateTimePicker
                                                                style={styles.timePicker}
                                                                value={endPlayAt}
                                                                mode={'time'}
                                                                textColor={'#202025'}
                                                                onChange={(event, selectedDate) => {
                                                                    const currentDate: any = selectedDate;
                                                                    setEndPlayAt(currentDate)
                                                                }}
                                                            />
                                                        </View>
                                                        {/* <Datetime
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
                                                            value={endPlayAt}
                                                        /> */}
                                                    </View>
                                            }
                                        </View>
                                    </View> : <View style={{ flex: 1, backgroundColor: '#fff' }} />
                            }
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
                                {
                                    isOwner || (!props.cue.channelId || props.cue.channelId === '') ?
                                        <TouchableOpacity
                                            onPress={() => handleDelete()}
                                            style={{ backgroundColor: 'white', borderRadius: 15, }}>
                                            <Text style={{
                                                textAlign: 'center',
                                                lineHeight: 35,
                                                color: 'white',
                                                fontSize: 12,
                                                backgroundColor: '#3B64F8',
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
                                                fontFamily: 'inter',
                                                overflow: 'hidden',
                                                height: 35
                                            }}>
                                                {
                                                    isOwner ? (
                                                        props.cue.channelId && props.cue.channelId !== '' ? 'DELETE FOR EVERYONE' : 'DELETE'
                                                    ) : 'DELETE'
                                                }
                                            </Text>
                                        </TouchableOpacity> : null
                                }
                                {
                                    !isOwner && (props.cue.channelId && props.cue.channelId !== '') && submission ?
                                        <TouchableOpacity
                                            disabled={
                                                // if user has not signed up
                                                !userSetupComplete ||
                                                // deadline has passed & its not an initiated timed quiz
                                                ((currentDate >= deadline) && !(isQuiz && isQuizTimed && initiatedAt)) ||
                                                // graded
                                                props.cue.graded ||
                                                // if timed quiz not initiated
                                                (isQuiz && isQuizTimed && !initiatedAt) ||
                                                // if quiz submitted already
                                                (isQuiz && (props.cue.submittedAt && props.cue.submittedAt !== ''))
                                            }
                                            onPress={() => handleSubmit()}
                                            style={{ backgroundColor: 'white', borderRadius: 15, }}>
                                            <Text style={{
                                                textAlign: 'center',
                                                lineHeight: 35,
                                                color: 'white',
                                                fontSize: 12,
                                                backgroundColor: '#3B64F8',
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
                                                fontFamily: 'inter',
                                                overflow: 'hidden',
                                                height: 35
                                            }}>
                                                {
                                                    userSetupComplete ? (
                                                        ((props.cue.submittedAt && props.cue.submittedAt !== '') || submitted
                                                            ? (props.cue.graded ? 'GRADED' : (isQuiz ? 'SUBMITTED' : ((currentDate < deadline ? 'RE-SUBMIT' : 'SUBMISSIONS ENDED'))))
                                                            : (currentDate < deadline ? 'SUBMIT' : 'SUBMISSIONS ENDED'))
                                                    ) : 'SIGN UP TO SUBMIT'
                                                }
                                            </Text>
                                        </TouchableOpacity> : null
                                }
                            </View>
                        </View>
                    </Collapsible>
                </ScrollView>
            </Animated.View>
        </View >
    );
}

export default UpdateControls

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 17,
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
        lineHeight: 18
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white'
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
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
        backgroundColor: 'white'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    shuffleContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'flex-end',
        backgroundColor: 'white',
        paddingTop: 40
    },
    col1: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        width: 100,
        height: 200,
        alignSelf: 'center',
        marginTop: -20,
        borderRadius: 3
    },
    text: {
        fontSize: 12,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    all: {
        fontSize: 12,
        color: '#a2a2aa',
        height: 22,
        overflow: 'hidden',
        paddingHorizontal: 10,
        backgroundColor: 'white',
        lineHeight: 20
    },
    allOutline: {
        fontSize: 12,
        backgroundColor: '#202025',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    allBlack: {
        fontSize: 12,
        color: '#202025',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allGrayFill: {
        fontSize: 12,
        overflow: 'hidden',
        color: '#fff',
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#a2a2aa',
        lineHeight: 20
    },
    allGrayOutline: {
        fontSize: 12,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa',
        lineHeight: 20
    },
    color1: {
        backgroundColor: '#d91d56'
    },
    color2: {
        backgroundColor: '#ED7D22',
    },
    color3: {
        backgroundColor: '#F8D41F',
    },
    color4: {
        backgroundColor: '#B8D41F',
    },
    color5: {
        backgroundColor: '#53BE6D',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    }
})
