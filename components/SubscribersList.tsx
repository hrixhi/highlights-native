import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Dimensions, Button } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { findUserById, getMessages, inviteByEmail, isSubInactive, makeSubActive, makeSubInactive, markMessagesAsRead, submitGrade, unsubscribe } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import NewMessage from './NewMessage';
import MessageCard from './MessageCard';
import { validateEmail } from '../helpers/emailCheck';
// import Select from 'react-select'
// import FileViewer from 'react-file-viewer';
import WebView from 'react-native-webview';
import MultiSelect from 'react-native-multiple-select';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { Video } from 'expo-av';

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
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [loadedChatWithUser, setLoadedChatWithUser] = useState<any>({})
    const [isLoadedUserInactive, setIsLoadedUserInactive] = useState(false)
    const [webviewKey, setWebviewKey] = useState(Math.random())
    useEffect(() => {
        setTimeout(() => {
            setWebviewKey(Math.random())
        }, 2000);
    }, [imported])

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
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers)
    let options = filteredSubscribers.map((sub: any) => {
        return {
            value: sub._id, label: sub.displayName
        }
    })
    const group = selected

    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission)
            setImported(true)
            setUrl(obj.url)
            setType(obj.type)
            setTitle(obj.title)
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [submission])

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
    }, [loadedChatWithUser, props.channelId, props.reload])

    const handleSubStatusChange = useCallback(() => {
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
    }, [isLoadedUserInactive, loadedChatWithUser, props.channelId])

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            minHeight: windowHeight,
            paddingHorizontal: 20,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showSubmission || showChat || showAddUsers || showNewGroup ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
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
                        <View style={{ flexDirection: 'column', backgroundColor: '#fff', height: 50, alignItems: 'center' }}>
                            {
                                loadedChatWithUser !== {} ?
                                    <View style={{ paddingHorizontal: 20, backgroundColor: '#fff' }}>
                                        <Text style={{ color: '#202025', marginBottom: 10 }}>
                                            {loadedChatWithUser.displayName}
                                            {showNewGroup ? '' : ', '}
                                            {loadedChatWithUser.fullName} {loadedChatWithUser.email ? ("(" + loadedChatWithUser.email + ")") : ''}
                                        </Text>
                                    </View> : null
                            }
                            {
                                isOwner && !props.cueId && !showAddUsers
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
                                        <TouchableOpacity
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
                            }
                        </View>
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                        {
                            props.cueId ?
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
                                    {PreferredLanguageText('status')}
                                </Text> :
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
                                    {PreferredLanguageText('inbox')}
                                </Text>
                        }
                        {
                            !props.cueId ?
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
                        {
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
                        }
                    </View>
            }
            {
                !showAddUsers ? (subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
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
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            style={{ flex: 1, paddingTop: 12 }}>
                                            {
                                                messages.length === 0 ?
                                                    <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                        {PreferredLanguageText('noMessages')}
                                                    </Text>
                                                    : null
                                            }
                                            {
                                                messages.map((message) => {
                                                    return <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                        <MessageCard
                                                            message={message} />
                                                    </View>
                                                })
                                            }
                                            <View style={{ backgroundColor: 'white' }}>
                                                <NewMessage
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
                                            </View>
                                        </ScrollView>
                                        :
                                        (
                                            showNewGroup ?
                                                <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    keyboardDismissMode={'on-drag'}
                                                    style={{ flex: 1, paddingTop: 12 }}>
                                                    <Text
                                                        ellipsizeMode="tail"
                                                        style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
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
                                                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingHorizontal: 50, paddingBottom: 100, paddingTop: 50, fontFamily: 'inter', flex: 1 }}>
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
                                                                                setShowSubmission(true)
                                                                                setStatus(subscriber.fullName)
                                                                                setScore(subscriber.score)
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
                                <View>
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardDismissMode={'on-drag'}
                                        style={{ flex: 1, paddingTop: 12 }}>
                                        <View style={{
                                            width: Dimensions.get('window').width < 1024 ? '100%' : '60%', alignSelf: 'center'
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
                                                <View style={{ width: '40%', alignSelf: 'flex-start', marginLeft: '10%' }}>
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
                                            !imported ?
                                                <RichEditor
                                                    disabled={true}
                                                    key={Math.random()}
                                                    containerStyle={{
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
                                                        borderRadius: 8,
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
                                                        <View
                                                            key={Math.random()}
                                                            style={{ flex: 1 }}
                                                        >
                                                            <WebView
                                                                source={{ uri: "https://docs.google.com/gview?embedded=true&url=" + url }}
                                                                key={webviewKey}
                                                            />
                                                        </View>
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
                                        contentContainerStyle={{
                                            height: 20, width: '100%',
                                            paddingTop: 15
                                        }}
                                        style={{}}
                                        horizontal={true}
                                        showsHorizontalScrollIndicator={false}
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
                                                            lineHeight: 20
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
                    <View style={{ backgroundColor: '#fff', alignSelf: 'center', width: 400, maxWidth: '100%' }}>
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
                                height: 35,
                                marginTop: 15,
                                width: '100%',
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
                    </View>
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
            height: 80,
            marginBottom: 20,
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
