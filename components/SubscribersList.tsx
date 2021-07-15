import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, Dimensions, Button, Switch, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import { ScrollView } from "react-native-gesture-handler";
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { editPersonalMeeting, findUserById, getMessages, getPersonalMeetingLink, getPersonalMeetingLinkStatus, inviteByEmail, isSubInactive, makeSubActive, makeSubInactive, markMessagesAsRead, submitGrade, unsubscribe, getQuiz, gradeQuiz, editReleaseSubmission } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import NewMessage from "./NewMessage";
import NewMessageNative from './NewMessageNative';
import MessageCard from './MessageCard';
import { validateEmail } from '../helpers/emailCheck';
import MultiSelect from 'react-native-multiple-select';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { Video } from 'expo-av';
import moment from "moment";
import Webview from './Webview';

import QuizGrading from './QuizGrading';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const categories = ['All', 'Read', 'Delivered', 'Not Delivered']
    const [showSubmission, setShowSubmission] = useState(false)
    const [showAddUsers, setShowAddUsers] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [submission, setSubmission] = useState<any>('')
    const [score, setScore] = useState("0")
    const [graded, setGraded] = useState(false)
    const [status, setStatus] = useState("")
    const [userId, setUserId] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [showChat, setShowChat] = useState(false)
    const [users, setUsers] = useState<any>([])
    const [emails, setEmails] = useState('')
    const [showNewGroup, setShowNewGroup] = useState(false)
    const RichText: any = useRef()
    const [selected, setSelected] = useState<any[]>([])
    const [expandMenu, setExpandMenu] = useState(false)
    const [comment, setComment] = useState('')
    const [releaseSubmission, setReleaseSubmission] = useState(false);

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [loadedChatWithUser, setLoadedChatWithUser] = useState<any>({})
    const [isLoadedUserInactive, setIsLoadedUserInactive] = useState(false)
    const [webviewKey, setWebviewKey] = useState(Math.random())
    const [isQuiz, setIsQuiz] = useState(false);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [meetingOn, setMeetingOn] = useState(false)
    const [meetingLink, setMeetingLink] = useState('')
    const [showMeetingOptions, setShowMeetingOptions] = useState(false);
    const scrollRef: any = useRef();
    const [loading, setLoading] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [submittedAt, setSubmittedAt] = useState('');
    const [isV0Quiz, setIsV0Quiz] = useState(false)
    const [headers, setHeaders] = useState({})

    // Test
    const [height, setHeight] = useState(42)

    const categoriesLanguageMap: { [label: string]: string } = {
        All: 'all',
        Read: 'read',
        Delivered: 'delivered',
        "Not Delivered": 'notDelivered',
        "Submitted": 'submitted',
        "Graded": "graded"
    }

    // Alerts
    const usersAddedAlert = PreferredLanguageText('usersAdded')
    const emailInviteSentAlert = PreferredLanguageText('emailInviteSent')
    const unableToLoadMessagesAlert = PreferredLanguageText('unableToLoadMessages')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const userSubscriptionActivatedAlert = PreferredLanguageText('userSubscriptionActivated')
    const userSubscriptionInactivatedAlert = PreferredLanguageText('userSubscriptionInactivated')
    const userRemovedAlert = PreferredLanguageText('userRemoved');
    const alreadyUnsubscribedAlert = PreferredLanguageText('alreadyUnsubscribed')
    const [user, setUser] = useState<any>({})


    if (props.cue && props.cue.submission) {
        categories.push('Submitted')
        categories.push('Graded')
    }
    const styles = styleObject()
    let filteredSubscribers: any = []
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'read'
            })
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'delivered'
            })
            break;
        case 'Not Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'not-delivered'
            })
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'graded'
            })
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'submitted'
            })
            break;
        default:
            filteredSubscribers = subscribers
            break;
    }
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 120 : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers)
    let options = filteredSubscribers.map((sub: any) => {
        return {
            value: sub._id, label: sub.displayName
        }
    })
    const group = selected.map(s => {
        return s.value
    })

    useEffect(() => {
        if (props.cue && props.cue.releaseSubmission !== null && props.cue.releaseSubmission !== undefined) {
            setReleaseSubmission(props.cue.releaseSubmission)
        } else {
            setReleaseSubmission(false)
        }
    }, [props.cue])

    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission)
            if (obj.solutions) {
                setIsQuiz(true)
                setQuizSolutions(obj)

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
    }, [submission])

    useEffect(() => {
        if (quizSolutions) {
            if (quizSolutions.problemScores) {
                setIsV0Quiz(false)
            } else {
                setIsV0Quiz(true)
            }
        }
    }, [quizSolutions])

    useEffect(() => {
        if (isQuiz) {
            const obj = JSON.parse(props.cue.original);

            setLoading(true)

            if (obj.quizId) {
                const server = fetchAPI("");
                server
                    .query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId
                        }
                    })
                    .then(res => {
                        console.log(res.data);
                        if (res.data && res.data.quiz.getQuiz) {
                            setProblems(res.data.quiz.getQuiz.problems);
                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                            setLoading(false);
                        }
                    });
            }
        }
    }, [isQuiz])

    useEffect(() => {
        // get meeting status & set the meeting link accordingly
        if (users && users.length > 0) {
            const server = fetchAPI('')
            server.query({
                query: getPersonalMeetingLinkStatus,
                variables: {
                    users
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.getPersonalMeetingLinkStatus) {
                    setMeetingOn(true)
                    getMeetingLink()
                }
            })
        }
    }, [users])

    const getMeetingLink = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getPersonalMeetingLink,
            variables: {
                userId: user._id,
                users: users
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.getPersonalMeetingLink && res.data.channel.getPersonalMeetingLink !== 'error') {
                setMeetingLink(res.data.channel.getPersonalMeetingLink)
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, user])

    const updateMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editPersonalMeeting,
            variables: {
                users,
                channelId: props.channelId,
                meetingOn: !meetingOn
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.editPersonalMeeting) {
                if (!meetingOn) {
                    // meeting turned on
                    getMeetingLink()
                }
                setMeetingOn(!meetingOn)
                props.handleReleaseSubmissionUpdate()
            } else {
                console.log(res)
                alert('Something went wrong')
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, props.channelId, meetingOn, getMeetingLink])

    const showError = useCallback(() => {
        alert('Meeting is inactive.')
    }, [])

    const handleGradeSubmit = useCallback(() => {
        if (Number.isNaN(Number(score))) {
            return
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: submitGrade,
            variables: {
                cueId: props.cueId,
                userId,
                score,
                comment
            }
        }).then(res => {
            if (res.data.cue.submitGrade) {
                props.reload()
                setShowSubmission(false)
            }
        })
    }, [score, userId, props.cueId, comment])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setUser(user)
                    if (user._id && props.channelCreatedBy && user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [props.channelCreatedBy])

    const submitEmails = useCallback(async () => {
        const lowerCaseEmails = emails.toLowerCase()
        const parsedEmails: any[] = []
        const unparsedEmails = lowerCaseEmails.split('\n')
        unparsedEmails.map((email) => {
            if (validateEmail(email)) {
                parsedEmails.push(email)
            }
        })
        if (parsedEmails.length === 0) return;
        const server = fetchAPI('')
        server.mutate({
            mutation: inviteByEmail,
            variables: {
                emails: parsedEmails,
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.user.inviteByEmail) {
                setEmails('')
                Alert(usersAddedAlert, emailInviteSentAlert)
                props.reload()
            }
        }).catch(err => {
            console.log(err)
        })
    }, [emails, props.channelId])

    const loadChat = useCallback(async (userId, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers([parsedUser._id, userId])
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: [parsedUser._id, userId]
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark chat as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
            // load the user
            server.query({
                query: findUserById,
                variables: {
                    id: userId
                }
            }).then(res => {
                if (res.data && res.data.user.findById) {
                    setLoadedChatWithUser(res.data.user.findById)
                    server.query({
                        query: isSubInactive,
                        variables: {
                            userId: res.data.user.findById._id,
                            channelId: props.channelId
                        }
                    }).then((res2: any) => {
                        if (res2.data && res2.data.subscription.isSubInactive) {
                            setIsLoadedUserInactive(true)
                        }
                    }).catch((err) => console.log(err))
                }
            })
        }
    }, [props.channelId])

    const loadGroupChat = useCallback(async (groupUsers, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers(groupUsers)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: groupUsers
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }
    }, [])

    const handleDelete = useCallback(() => {
        Alert("Remove user from channel?", "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: unsubscribe,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId,
                                keepContent: false
                            }
                        }).then(async res => {
                            if (res.data.subscription && res.data.subscription.unsubscribe) {
                                Alert(userRemovedAlert)
                                props.reload()
                                setShowChat(false)
                                setIsLoadedUserInactive(false)
                                setLoadedChatWithUser({})
                            } else {
                                Alert(alreadyUnsubscribedAlert)
                            }
                        }).catch(err => {
                            Alert(somethingWentWrongAlert, checkConnectionAlert)
                        })
                    }
                }
            ]
        )
    }, [loadedChatWithUser, props.channelId, props.reload])

    const handleSubStatusChange = useCallback(() => {


        const alertMessage = isLoadedUserInactive ? "Make user active?" : "Make user inactive?"

        Alert(alertMessage, "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: isLoadedUserInactive ? makeSubActive : makeSubInactive,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (isLoadedUserInactive) {
                                // changed to active
                                if (res.data && res.data.subscription.makeActive) {
                                    Alert(userSubscriptionActivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            } else {
                                // changed to inactive
                                if (res.data && res.data.subscription.makeInactive) {
                                    Alert(userSubscriptionInactivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            }
                        })
                    }
                }
            ]
        )


    }, [isLoadedUserInactive, loadedChatWithUser, props.channelId])


    const updateReleaseSubmission = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editReleaseSubmission,
            variables: {
                cueId: props.cueId,
                releaseSubmission: !releaseSubmission,
            }
        }).then((res: any) => {
            if (res.data && res.data.cue.editReleaseSubmission) {
                setReleaseSubmission(!releaseSubmission)
            } else {
                console.log(res)
                alert('Something went wrong')
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [releaseSubmission, props.cueId])


    const onGradeQuiz = (problemScores: string[], problemComments: string[], score: number, comment: string) => {
        const server = fetchAPI("");
        console.log("Saving problem comments", problemComments);
        server
            .mutate({
                mutation: gradeQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    problemScores,
                    problemComments,
                    score,
                    comment
                }
            })
            .then(res => {
                if (res.data && res.data.cue.gradeQuiz) {
                    props.reload()
                    setShowSubmission(false)
                }
            });

    }

    const renderQuizSubmissions = () => {

        const { initiatedAt, solutions } = quizSolutions;

        return (<View style={{ backgroundColor: 'white', width: '100%', marginLeft: '5%', display: 'flex', flexDirection: 'column' }}>
            {initiatedAt ? <Text style={{ width: '100%', height: 15, paddingBottom: 25, color: 'black' }}>
                Quiz initiated at {moment(new Date(initiatedAt)).format('MMMM Do YYYY, h:mm a')}
            </Text> :
                null
            }
            <Text style={{ width: '100%', height: 15, color: 'black', marginTop: 20, paddingBottom: 25, fontWeight: 'bold' }}>
                Selected Answers:
            </Text>
            <View style={{ marginTop: 20, display: 'flex', flexDirection: "column", backgroundColor: '#fff' }}>
                {solutions.map((solution: any, index: number) => {


                    if (solution.selected) {
                        const answers: any[] = solution.selected;

                        const selectedAnswers = answers.filter(ans => ans.isSelected);

                        let selectedAnswersString: any[] = []

                        selectedAnswers.forEach((ans: any) => {
                            selectedAnswersString.push(ans.options)
                        })

                        return (<Text style={{ width: '100%', height: 15, marginTop: 10, paddingBottom: 25, color: '#202025' }}>
                            Problem {index + 1} : {selectedAnswersString.join(", ")}
                        </Text>)
                    } else {
                        return (<Text style={{ width: '100%', height: 15, marginTop: 10, paddingBottom: 25, color: '#202025' }}>
                            Problem {index + 1} : {solution.response}
                        </Text>)
                    }



                })}
            </View>
        </View>)

    }

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            minHeight: windowHeight,
            paddingHorizontal: 25,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showSubmission || showChat || showAddUsers || showNewGroup ?
                    <View style={{ backgroundColor: 'white', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                if (showChat) {
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                    setUsers([])
                                } else {
                                    setShowSubmission(false)
                                    setStatus("")
                                    setScore("0")
                                    setUserId("")
                                }
                                setShowAddUsers(false)
                                setShowNewGroup(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='chevron-back-outline' size={23} color={'#202025'} />
                            </Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'column', backgroundColor: '#fff' }}>
                            {
                                loadedChatWithUser && loadedChatWithUser !== {} && !showNewGroup && !showAddUsers && !showSubmission && users.length < 3 ?
                                    <View style={{ paddingHorizontal: 20, backgroundColor: '#fff' }}>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={{ color: '#202025', marginBottom: 10, marginTop: -20, paddingLeft: 15 }}>
                                            {loadedChatWithUser.displayName}
                                            {showNewGroup || showSubmission ? '' : ', '}
                                            {loadedChatWithUser.fullName} {loadedChatWithUser.email ? ("(" + loadedChatWithUser.email + ")") : ''}
                                        </Text>
                                    </View> : null
                            }
                            {/* {
                                isOwner && !props.cueId && !showAddUsers && !showNewGroup && !showSubmission && users.length < 3
                                    ? <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: '#fff' }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#fff' }}
                                            onPress={() => handleSubStatusChange()}
                                        >
                                            <Text style={{
                                                color: '#a2a2aa',
                                                fontSize: 11,
                                                lineHeight: 30,
                                                textAlign: 'right',
                                                paddingRight: 20,
                                                textTransform: 'uppercase'
                                            }}>
                                                {
                                                    isLoadedUserInactive ? PreferredLanguageText('makeActive') : PreferredLanguageText('makeInactive')
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                        {/* <TouchableOpacity
                                            style={{ backgroundColor: '#fff' }}
                                            onPress={() => handleDelete()}
                                        >
                                            <Text style={{
                                                color: '#a2a2aa',
                                                fontSize: 11,
                                                lineHeight: 30,
                                                textAlign: 'right',
                                                paddingRight: 10,
                                                textTransform: 'uppercase'
                                            }}>
                                                {PreferredLanguageText('removeFromChannel')}
                                            </Text>
                                        </TouchableOpacity> 
                                    </View>
                                    : null
                            } */}
                            {
                                showChat ? <View style={{ flexDirection: 'column', backgroundColor: 'white' }}>
                                    {
                                        isOwner ?
                                            (
                                                showMeetingOptions
                                                    ?
                                                    <View style={{
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <View>
                                                            <View style={{
                                                                backgroundColor: 'white',
                                                                height: 52,
                                                                paddingTop: 20,
                                                                flexDirection: 'row'
                                                            }}>
                                                                <View style={{ width: '80%', backgroundColor: 'white', flexDirection: 'row', }}>
                                                                    <Switch
                                                                        value={meetingOn}
                                                                        onValueChange={() => updateMeetingStatus()}
                                                                        style={{ height: 40, marginRight: 20, }}
                                                                        trackColor={{
                                                                            false: '#f4f4f6',
                                                                            true: '#3B64F8'
                                                                        }}
                                                                        activeThumbColor='white'
                                                                    />
                                                                    <View style={{ backgroundColor: 'white', paddingTop: 3, }}>
                                                                        <Text style={{ fontSize: 15, color: '#a2a2aa', }}>
                                                                            Meeting
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                                <Text style={{
                                                                    width: '20%',
                                                                    color: '#a2a2aa',
                                                                    fontSize: 11,
                                                                    lineHeight: 30,
                                                                    paddingTop: 0,
                                                                    textAlign: 'right',
                                                                    paddingRight: 20,
                                                                    textTransform: 'uppercase'
                                                                }}
                                                                    onPress={() => {
                                                                        setShowMeetingOptions(!showMeetingOptions)
                                                                    }}
                                                                >
                                                                    HIDE
                                                                </Text>
                                                            </View>
                                                            <Text style={{ fontSize: 12, color: '#a2a2aa', paddingTop: 10, backgroundColor: 'white' }}>
                                                                Restart switch if you are unable to join.
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    :
                                                    null
                                            ) : null
                                    }
                                    {showMeetingOptions ? <View style={{ backgroundColor: 'white', marginTop: 25, }}>
                                        <View style={{ backgroundColor: 'white', width: '100%', flexDirection: 'column' }}>
                                            {!isOwner ?
                                                <Text style={{
                                                    width: '100%',
                                                    color: '#a2a2aa',
                                                    fontSize: 11,
                                                    lineHeight: 30,
                                                    paddingTop: 0,
                                                    textAlign: 'right',
                                                    paddingRight: 20,
                                                    textTransform: 'uppercase'
                                                }}
                                                    onPress={() => {
                                                        setShowMeetingOptions(!showMeetingOptions)
                                                    }}
                                                >
                                                    HIDE
                                                </Text>
                                                :
                                                null
                                            }
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (meetingOn) {
                                                        Linking.openURL(meetingLink);
                                                    } else {
                                                        showError()
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: 'white',
                                                    overflow: 'hidden',
                                                    height: 35,
                                                    // marginTop: 15,

                                                    marginBottom: 20
                                                }}>
                                                <Text style={{
                                                    textAlign: 'center',
                                                    lineHeight: 35,
                                                    color: meetingOn ? '#fff' : '#202025',
                                                    fontSize: 12,
                                                    backgroundColor: meetingOn ? '#3B64F8' : '#f4f4f6',
                                                    paddingHorizontal: 25,
                                                    fontFamily: 'inter',
                                                    height: 35,
                                                    width: 175,
                                                    borderRadius: 15,
                                                    overflow: 'hidden',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Join Meeting
                                                </Text>
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 12, color: '#a2a2aa', marginBottom: 10, backgroundColor: 'white' }}>
                                                Enabled only when meeting in session.
                                            </Text>
                                        </View>

                                    </View> : null}
                                    {
                                        !showMeetingOptions ?
                                            <View style={{ backgroundColor: 'white' }}>
                                                <Text style={{
                                                    color: '#a2a2aa',
                                                    fontSize: 11,
                                                    lineHeight: 30,
                                                    paddingTop: 10,
                                                    paddingRight: 10,
                                                    textAlign: 'right',
                                                    textTransform: 'uppercase'
                                                }}
                                                    onPress={() => {
                                                        setShowMeetingOptions(!showMeetingOptions)
                                                    }}
                                                >
                                                    OPTIONS
                                                </Text>
                                            </View> :
                                            null
                                    }
                                </View>
                                    : null
                            }
                        </View>
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                        {
                            props.cueId ?
                                null :
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        fontSize: 11,
                                        paddingBottom: 20,
                                        color: '#202025',
                                        textTransform: "uppercase",
                                        // paddingLeft: 10,
                                        flex: 1,
                                        lineHeight: 23
                                    }}>
                                    {PreferredLanguageText('inbox')}
                                </Text>
                        }
                        {
                            isOwner && !props.cueId ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowNewGroup(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        marginTop: -1,
                                        fontSize: 10,
                                        color: '#a2a2aa',
                                        textTransform: 'uppercase'
                                    }}>
                                        {PreferredLanguageText('newGroup')}
                                    </Text>
                                </TouchableOpacity> : null
                        }
                        {/* {
                            isOwner && !props.cueId ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowAddUsers(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        marginTop: -1,
                                        fontSize: 10,
                                        color: '#a2a2aa',
                                        textTransform: 'uppercase'
                                    }}>
                                        {PreferredLanguageText('inviteUser')}
                                    </Text>
                                </TouchableOpacity> : null
                        } */}
                    </View>
            }
            {
                !showAddUsers && !showSubmission && props.cue && props.cue.submission ?
                    <View style={{
                        backgroundColor: 'white',
                        height: 40,
                        // marginTop: 20,
                        marginBottom: 20,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <Switch
                            value={releaseSubmission}
                            onValueChange={() => updateReleaseSubmission()}
                            style={{ height: 20, marginRight: 20 }}
                            trackColor={{
                                false: '#f4f4f6',
                                true: '#3B64F8'
                            }}
                            activeThumbColor='white'
                        />
                        <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 3 }}>
                            <Text style={{ fontSize: 15, color: '#a2a2aa', }}>
                                Visible to students
                            </Text>
                        </View>
                    </View>
                    : null
            }
            {
                !showAddUsers ? (subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                            {
                                props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View> :
                    <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={key}
                    >
                        {
                            !showSubmission ?
                                (
                                    showChat ?
                                        <KeyboardAvoidingView style={{ flex: 1 }}
                                            behavior="height"
                                            // contentContainerStyle={{ flex: 1}}
                                            // keyboardVerticalOffset={ Platform.OS === "ios" ? (!showMeetingOptions ? 150 : 500) : (-60) }
                                            keyboardVerticalOffset={Platform.OS === "ios" ? (!showMeetingOptions ? 150 : (isOwner ? 450 : 350)) : -60}
                                        >
                                            <ScrollView
                                                ref={scrollRef}
                                                onContentSizeChange={() => scrollRef && scrollRef.current && scrollRef.current.scrollToEnd({ animated: false })}
                                                showsVerticalScrollIndicator={false}
                                                keyboardDismissMode={'on-drag'}
                                                style={{ flex: 1, paddingTop: 12, height: 200, }}>
                                                {
                                                    messages.length === 0 ?
                                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                            {PreferredLanguageText('noMessages')}
                                                        </Text>
                                                        : null
                                                }
                                                {
                                                    messages.map((message) => {
                                                        return <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                            <MessageCard
                                                                user={user}
                                                                message={message} />
                                                        </View>
                                                    })
                                                }
                                                {/* Empty space to scrooll to end */}
                                                <View style={{ height: 20, backgroundColor: 'white' }} />

                                            </ScrollView>
                                            <NewMessageNative

                                                cueId={props.cueId}
                                                channelId={props.channelId}
                                                parentId={null}
                                                users={users}
                                                back={() => {
                                                    props.reload()
                                                    setShowChat(false)
                                                    setIsLoadedUserInactive(false)
                                                    setLoadedChatWithUser({})
                                                }}
                                                placeholder={`${PreferredLanguageText('message')}...`}
                                            />
                                            {/* <AutoGrowingTextInput style={{ width: '100%', backgroundColor: 'gray', height: 50, padding: 10 }} /> */}
                                        </KeyboardAvoidingView>

                                        :
                                        (
                                            showNewGroup ?
                                                <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    keyboardDismissMode={'on-drag'}
                                                    style={{ flex: 1, paddingTop: 12 }}>
                                                    <Text
                                                        ellipsizeMode="tail"
                                                        style={{ color: '#a2a2aa', fontSize: 16, flex: 1, lineHeight: 25 }}>
                                                        {PreferredLanguageText('newGroup')}
                                                    </Text>
                                                    <View style={{ height: 350, flexDirection: 'column', paddingTop: 25, overflow: 'scroll', backgroundColor: 'white' }}>
                                                        <ScrollView style={{
                                                            width: '100%',
                                                            padding: 5,
                                                            backgroundColor: '#fff'
                                                        }}>
                                                            <MultiSelect
                                                                hideTags={false}
                                                                items={options}
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
                                                    </View>
                                                    <View style={{ backgroundColor: 'white' }}>
                                                        <NewMessage
                                                            cueId={props.cueId}
                                                            channelId={props.channelId}
                                                            parentId={null}
                                                            users={group}
                                                            addUserId={true}
                                                            back={() => {
                                                                props.reload()
                                                                setShowChat(false)
                                                                setIsLoadedUserInactive(false)
                                                                setLoadedChatWithUser({})
                                                                setShowNewGroup(false)
                                                            }}
                                                            placeholder={`${PreferredLanguageText('message')}...`}
                                                        />
                                                    </View>
                                                </ScrollView>
                                                : <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    horizontal={false}
                                                    key={filterChoice + key}
                                                >
                                                    {
                                                        !props.cueId || props.cueId === '' ?
                                                            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f4f4f6', marginBottom: 20 }}>
                                                                {
                                                                    props.groups.length > 0 ? (props.groups.map((group: any, index: any) => {
                                                                        let displayName = ''
                                                                        group.userNames.map((u: any) => { displayName += (u.displayName + ', ') })
                                                                        return <View style={styles.col} key={filterChoice + key + index}>
                                                                            <SubscriberCard
                                                                                chat={!props.cueId || props.cueId === '' ? true : false}
                                                                                fadeAnimation={props.fadeAnimation}
                                                                                subscriber={{
                                                                                    displayName,
                                                                                    fullName: 'Team',
                                                                                    unreadMessages: group.unreadMessages
                                                                                }}
                                                                                onPress={() => {
                                                                                    loadGroupChat(group.users, group._id)
                                                                                }}
                                                                                status={!props.cueId ? false : true}
                                                                            />
                                                                        </View>
                                                                    })) : <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingHorizontal: 50, paddingBottom: 100, paddingTop: 50, fontFamily: 'inter', flex: 1 }}>
                                                                            {PreferredLanguageText('noGroups')}
                                                                        </Text>
                                                                    </View>
                                                                }
                                                            </View>
                                                            : null
                                                    }
                                                    {
                                                        filteredSubscribers.map((subscriber: any, index: any) => {
                                                            return <View style={styles.col} key={filterChoice + key + index}>
                                                                <SubscriberCard
                                                                    chat={!props.cueId || props.cueId === '' ? true : false}
                                                                    fadeAnimation={props.fadeAnimation}
                                                                    subscriber={subscriber}
                                                                    onPress={() => {
                                                                        if (props.cueId && props.cueId !== null) {
                                                                            if (subscriber.fullName === 'submitted' || subscriber.fullName === 'graded') {
                                                                                setSubmission(subscriber.submission)
                                                                                setSubmittedAt(subscriber.submittedAt)
                                                                                setShowSubmission(true)
                                                                                setStatus(subscriber.fullName)
                                                                                setScore(subscriber.score)
                                                                                setGraded(subscriber.graded)
                                                                                setComment(subscriber.comment)
                                                                                setUserId(subscriber.userId)
                                                                            }
                                                                        } else {
                                                                            loadChat(subscriber._id, subscriber.groupId)
                                                                        }
                                                                    }}
                                                                    status={!props.cueId ? false : true}
                                                                />
                                                            </View>
                                                        })
                                                    }
                                                </ScrollView>)
                                ) :
                                isQuiz && !isV0Quiz ?
                                    <QuizGrading
                                        loading={loading}
                                        problems={problems}
                                        solutions={quizSolutions}
                                        partiallyGraded={!graded}
                                        onGradeQuiz={onGradeQuiz}
                                        comment={comment}
                                        headers={headers}
                                        isOwner={true}
                                    />
                                    :
                                    <View>
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            // style={{ flex: 1, paddingTop: 12 }}
                                            style={{ backgroundColor: 'white' }}
                                        >
                                            <View style={{
                                                width: Dimensions.get('window').width < 1024 ? '100%' : '60%', alignSelf: 'center',
                                                backgroundColor: 'white'
                                            }}>
                                                <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                                    {PreferredLanguageText('score')}
                                                </Text>
                                                <TextInput
                                                    value={score}
                                                    style={styles.input}
                                                    placeholder={'0-100'}
                                                    onChangeText={val => setScore(val)}
                                                    placeholderTextColor={'#a2a2aa'}
                                                />
                                                <Text style={{ color: '#202025', fontSize: 14, paddingVertical: 10, }}>
                                                    {PreferredLanguageText('comment')}
                                                </Text>
                                                <TextInput
                                                    value={comment}
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
                                                    placeholder={'Optional'}
                                                    onChangeText={val => setComment(val)}
                                                    placeholderTextColor={'#a2a2aa'}
                                                    multiline={true}
                                                />
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
                                                        onPress={() => handleGradeSubmit()}
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
                                                            {status === 'graded' ? 'REGRADE' : 'ENTER GRADE'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 25, marginLeft: '5%' }}>
                                                {PreferredLanguageText('viewSubmission')}
                                            </Text>
                                            {
                                                imported ?
                                                    <View style={{ width: '40%', alignSelf: 'flex-start', marginLeft: '10%', }}>
                                                        <TextInput
                                                            editable={false}
                                                            value={title}
                                                            style={styles.input}
                                                            placeholder={'Title'}
                                                            onChangeText={val => setTitle(val)}
                                                            placeholderTextColor={'#a2a2aa'}
                                                        />
                                                    </View> : null
                                            }
                                            {
                                                isQuiz && Object.keys(quizSolutions).length > 0 ?
                                                    renderQuizSubmissions() : null
                                            }
                                            {
                                                !imported && !isQuiz ?
                                                    <RichEditor
                                                        disabled={true}
                                                        key={Math.random()}
                                                        containerStyle={{
                                                            backgroundColor: '#f4f4f6',
                                                            padding: 3,
                                                            paddingTop: 5,
                                                            paddingBottom: 10,
                                                            borderRadius: 15,
                                                        }}
                                                        ref={RichText}
                                                        style={{
                                                            width: '100%',
                                                            backgroundColor: '#f4f4f6',
                                                            borderRadius: 15,
                                                            minHeight: 450
                                                        }}
                                                        editorStyle={{
                                                            backgroundColor: '#f4f4f6',
                                                            placeholderColor: '#a2a2aa',
                                                            color: '#202025',
                                                            contentCSSText: 'font-size: 13px;'
                                                        }}
                                                        initialContentHTML={submission}
                                                        placeholder={"Title"}
                                                        onChange={(text) => { }}
                                                        allowFileAccess={true}
                                                        allowFileAccessFromFileURLs={true}
                                                        allowUniversalAccessFromFileURLs={true}
                                                        allowsFullscreenVideo={true}
                                                        allowsInlineMediaPlayback={true}
                                                        allowsLinkPreview={true}
                                                        allowsBackForwardNavigationGestures={true}
                                                    /> : (
                                                        type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav' ?
                                                            <View style={{ backgroundColor: '#fff', height: 300 }}>
                                                                <Video
                                                                    ref={RichText}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: 300
                                                                    }}
                                                                    source={{
                                                                        uri: url,
                                                                    }}
                                                                    useNativeControls={true}
                                                                    resizeMode="contain"
                                                                    isLooping={false}
                                                                />
                                                            </View>
                                                            :
                                                            (!isQuiz ? <View
                                                                key={url}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <Webview
                                                                    key={url}
                                                                    url={url}
                                                                />
                                                            </View> : null)
                                                    )
                                            }
                                        </ScrollView>
                                    </View>
                        }
                        {
                            !props.cueId || showSubmission ? null :
                                <View style={{
                                    width: '100%',
                                    height: 70,
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
                                    <ScrollView
                                        // contentContainerStyle={{
                                        //     // height: 20, 
                                        //     width: '100%',
                                        //     paddingTop: 15,
                                        //     paddingHorizontal: 10
                                        // }}
                                        style={{
                                            width: '98.5%',
                                            height: '40%',
                                            flexDirection: 'row',
                                            paddingTop: 10
                                        }}
                                        horizontal={true} showsHorizontalScrollIndicator={false}
                                    >
                                        {
                                            unparsedSubs.length === 0 ? null : categories.map((category: string) => {
                                                return <TouchableOpacity
                                                    key={Math.random()}
                                                    style={filterChoice === category ? styles.cusCategoryOutline : styles.cusCategory}
                                                    onPress={() => setFilterChoice(category)}>
                                                    <Text
                                                        style={{
                                                            color: '#a2a2aa',
                                                            lineHeight: 20,
                                                            fontSize: 12
                                                        }}>
                                                        {PreferredLanguageText(categoriesLanguageMap[category])}
                                                    </Text>
                                                </TouchableOpacity>
                                            })
                                        }
                                    </ScrollView>
                                </View>
                        }
                    </View>) :
                    <ScrollView style={{
                        backgroundColor: '#fff',
                        marginBottom: 100,
                        alignSelf: 'center', width: 500, maxWidth: '100%'
                    }}>
                        <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                            {PreferredLanguageText('inviteByEmail')}
                        </Text>
                        <TextInput
                            value={emails}
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
                            placeholder={'Enter one email per line.'}
                            onChangeText={val => setEmails(val)}
                            placeholderTextColor={'#a2a2aa'}
                            multiline={true}
                        />
                        <TouchableOpacity
                            onPress={() => submitEmails()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                alignSelf: 'center',
                                height: 35,
                                marginTop: 15,
                                width: 150,
                                justifyContent: 'center', flexDirection: 'row',
                                marginBottom: 50,
                                borderRadius: 15,
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025s',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                borderRadius: 15,
                                height: 35,
                                width: 150,

                                textTransform: 'uppercase'
                            }}>
                                {PreferredLanguageText("addUsers")}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#202025',
                            fontSize: 12,
                            paddingHorizontal: 25,
                            width: "100%",
                            fontFamily: 'inter',
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            {filteredSubscribers.length !== 0 ? PreferredLanguageText('existingUsers') : PreferredLanguageText('noExistingUsers')}
                        </Text>
                        <View style={{ display: "flex", flexDirection: 'column', alignItems: 'center', backgroundColor: 'fff', }}>
                            {
                                filteredSubscribers.map((sub: any) => {
                                    return (<View style={{
                                        backgroundColor: '#f4f4f6',
                                        width: '100%',
                                        padding: 10,
                                        borderRadius: 8,
                                        marginBottom: 10
                                    }}>
                                        <Text style={{ color: '#202025', }}>
                                            {sub.displayName}
                                        </Text>
                                        <Text style={{ color: '#202025', }}>
                                            {sub.email}
                                        </Text>
                                    </View>)
                                })
                            }
                        </View>
                    </ScrollView>
            }
        </View >
    );
}

export default React.memo(SubscribersList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})


const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: 20,
            backgroundColor: 'white'
        },
        marginSmall: {
            height: 10,
            backgroundColor: 'white'
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            // flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f4f4f6',
            borderBottomWidth: 1,
            fontSize: 15,
            padding: 15,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        },
        outline: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a2a2aa',
            color: 'white'
        },
        cusCategory: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a2a2aa',
            color: 'white'
        }
    })
}
