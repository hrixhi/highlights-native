import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Dimensions, Image, Platform, Linking, TextInput } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { createMessage, deleteThread, getThreadWithReplies, markThreadsAsRead, getThreadCategories } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Collapse } from 'react-collapse';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import moment from 'moment';
// import {
//     Menu,
//     MenuOptions,
//     MenuOption,
//     MenuTrigger,
// } from 'react-native-popup-menu';
import { htmlStringParser } from '../helpers/HTMLParser';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import FileUpload from './UploadFiles';
import ReactPlayer from "react-native-video";
// import NewPostModal from './NewPostModal';
import DropDownPicker from 'react-native-dropdown-picker';


const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    // State 
    const [loading, setLoading] = useState(false)
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads))
    const [threads] = useState<any[]>(unparsedThreads.reverse())
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([])
    const [showThreadCues, setShowThreadCues] = useState(false)
    const [filterChoice, setFilterChoice] = useState('All')
    const [showPost, setShowPost] = useState(false)
    const [threadId, setThreadId] = useState('')
    const [showComments, setShowComments] = useState(true)
    const [avatar, setAvatar] = useState('')
    const [privatePost, setPrivatePost] = useState(false)
    const [threadCategories, setThreadCategories] = useState<any[]>([])
    const [customCategory, setCustomCategory] = useState('None')
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [userId, setUserId] = useState('')
    const [threadChat, setThreadChat] = useState<any[]>([])
    const styles = styleObject()
    const categories: any[] = []
    const categoryObject: any = {}
    let filteredThreads: any[] = []
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    // ALERTS
    const unableToLoadThreadAlert = PreferredLanguageText('unableToLoadThread')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category'
        }
    })
    Object.keys(categoryObject).map((key) => {
        categories.push(key)
    })
    if (filterChoice === 'All') {
        filteredThreads = threads
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice
        })
    }
    let categoriesOptions = [{
        value: 'None', label: 'None'
    }];
    categories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            label: category
        })
    })
    let categoryChoices = [{
        value: 'All',
        label: 'All'
    }]
    categories.map((cat: any) => {
        categoryChoices.push({
            value: cat,
            label: cat
        })
    })

    // HOOKS

    /**
     * @description Load categories on init
     */
    useEffect(() => {
        loadCategories()
    }, [props.channelId])

    /**
     * Set is Owner on init
     */
    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem("user")
                if (u) {
                    const user = JSON.parse(u)
                    setUserId(user._id)
                    if (user.avatar) {
                        setAvatar(user.avatar)
                    } else {
                        setAvatar('https://cues-files.s3.amazonaws.com/images/default.png')
                    }
                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [])
    

    /**
     * Load discussion from Search or Activity
     */
    useEffect(() => {
        (
            async () => {
                const tId = await AsyncStorage.getItem('openThread')
                if (tId && tId !== "" && threads.length !== 0) {

                    // Clear the openChat

                    await AsyncStorage.removeItem('openThread')

                    loadCueDiscussions(tId)

                }
            }
        )()
    }, [threads])

    /**
     * @description Fetches all the categories for that Channel
     */
    const loadCategories = useCallback(async () => {
        if (props.channelId === undefined || props.channelId === null || props.channelId === '') {
            return;
        }
        const server = fetchAPI('')
        server.query({
            query: getThreadCategories,
            variables: {
                channelId: props.channelId
            }
        })
            .then(res => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setThreadCategories(res.data.thread.getChannelThreadCategories)
                }
            })
            .catch(err => {
            })
    }, [props.channelId])

    /**
     * @description Called from Modal for creating a new thread
     */
    const createNewThread = useCallback(async (message: any, category: any, isPrivate: any) => {
        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message,
                userId,
                channelId: props.channelId,
                isPrivate,
                anonymous: false,
                cueId: props.cueId === null ? 'NULL' : props.cueId,
                parentId: 'INIT',
                category: category === "None" ? "" : category
            }
        }).then(res => {
            if (res.data.thread.writeMessage) {
                setShowPost(false)
                props.reload()
            } else {
                Alert(checkConnectionAlert)
            }
        }).catch(err => {
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })

    }, [props.cueId, props.channelId, userId, isOwner])


    /**
     * @description Send a Thread message
     */
    const onSend = useCallback(async (messages: any) => {

        let message = "";

        if ((messages[0].file && messages[0].file !== "")|| (messages[0].image && messages[0].image !== "") || (messages[0].audio && messages[0].audio !== "") || (messages[0].video && messages[0].video !== "")) {
            message = messages[0].msgObject;
        } else {
            message = messages[0].text;
        }

        messages[0] = {
            ...messages[0],
            user: {
                _id: userId
            }
        }

        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message,
                userId,
                channelId: props.channelId,
                isPrivate: false,
                anonymous: false,
                cueId: props.cueId === null ? 'NULL' : props.cueId,
                parentId: threadId === '' ? 'INIT' : threadId,
                category: ''
            }
        }).then(res => {
            if (res.data.thread.writeMessage) {
                setThreadChat(threadChat => GiftedChat.append(threadChat, messages))
                // props.reload()
            } else {
                Alert(checkConnectionAlert)
            }
        }).catch(err => {
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })

    }, [props.cueId, props.channelId, threadId, userId, showPost, customCategory, privatePost, isOwner])


    /**
     * @description Load the entire the Thread using the thread ID
     */
    const loadCueDiscussions = useCallback(async (tId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const user = JSON.parse(u)
            setThreadId(tId)
            setLoading(true)
            setShowThreadCues(true)
            const server = fetchAPI('')
            server.query({
                query: getThreadWithReplies,
                variables: {
                    threadId: tId
                }
            })
                .then(res => {
                    setThreadWithReplies(res.data.thread.getThreadWithReplies)
                    const tempChat: any[] = []
                    res.data.thread.getThreadWithReplies.map((msg: any) => {
                        let text: any = ''
                        let img: any = ''
                        let audio: any = ''
                        let video: any = ''
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message)
                            const { type, url } = obj;
                            if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                                img = url
                            } else if (type === "mp3" || type === "wav" || type === "mp2") {
                                audio = url
                            } else if (type === "mp4" || type === "oga" || type === "mov" || type === "wmv") {
                                video = url
                            } else {
                                text = <TouchableOpacity style={{ backgroundColor: '#006AFF' }}>
                                    <Text style={{
                                        textDecorationLine: 'underline',
                                        backgroundColor: '#006AFF',
                                        color: '#fff'
                                    }}
                                        onPress={() => {
                                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                window.open(url, '_blank')
                                            } else {
                                                Linking.openURL(url)
                                            }
                                        }}
                                    >
                                        {obj.title + '.' + obj.type}
                                    </Text>
                                </TouchableOpacity>
                            }


                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            image: img,
                            audio,
                            video,
                            createdAt: msg.time,
                            user: {
                                _id: msg.userId,
                                name: msg.fullName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png'
                            },
                        })
                    })
                    tempChat.reverse()
                    setThreadChat(tempChat)
                    setLoading(false)
                })
                .catch(err => {
                    Alert(unableToLoadThreadAlert, checkConnectionAlert)
                    setLoading(false)
                })
            server.mutate({
                mutation: markThreadsAsRead,
                variables: {
                    userId: user._id,
                    threadId: tId
                }
            }).then(res => {
                if (props.refreshUnreadDiscussionCount) {
                    props.refreshUnreadDiscussionCount()
                }
            })
                .catch(e => console.log(e))
        }

    }, [])


    // const deletePost = useCallback((threadId: string) => {
    //     if (!isOwner) {
    //         return;
    //     }
    //     const server = fetchAPI('')
    //     server.mutate({
    //         mutation: deleteThread,
    //         variables: {
    //             threadId
    //         }
    //     }).then((res) => {
    //         if (res.data && res.data.thread.delete) {
    //             props.reload()
    //         } else {
    //             Alert(somethingWentWrongAlert)
    //         }
    //     }).catch(e => Alert(somethingWentWrongAlert))
    // }, [isOwner])


    /**
     * @description Renders Custom bubble for Gifted Chat
     */
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#006AFF'
                    }
                }}
            />
        )
    }

    /**
     * @description Customize how Audio message appears
     */
    const renderMessageAudio = (props: any) => {

        if (props.currentMessage.audio && props.currentMessage.audio !== "") {
            return <View>
                <ReactPlayer
                    source={{ uri: props.currentMessage.audio }}
                        // controls={true}
                        // onContextMenu={(e: any) => e.preventDefault()}
                        // config={{
                        //     file: { attributes: { controlsList: 'nodownload' } }
                        // }}
                    style={{
                        width: 250,
                        height: 60
                    }}
                />
            </View>
        }

        return null;

    }

    /**
     * @description Customize how Video Message appears
     */
    const renderMessageVideo = (props: any) => {

        if (props.currentMessage.video && props.currentMessage.video !== "") {
            return <View>
                <ReactPlayer
                        video={{ uri: props.currentMessage.video }}
                        // controls={true}
                        // onContextMenu={(e: any) => e.preventDefault()}
                        // config={{
                        //     file: { attributes: { controlsList: 'nodownload' } }
                        // }}
                        videoWidth={250}
                        videoHeight={200}
                />
            </View>
        }

        return null;

    }

    // FUNCTIONS

    /**
     * @description Helper to display Time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day'))
            return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year'))
            return date.format("MMM DD");
        else
            return date.format("MM/DD/YYYY");
    }

    /**
     * @description Renders the Filter Dropdown and the New Post button
     */
    const renderThreadHeader = () => {
        return <View style={{
            backgroundColor: '#efefef',
            flexDirection: 'row',
            paddingBottom: 20,
            width: '100%',
            maxWidth: 900,
            borderRadius: 1
        }}>
            {
                props.cueId === null && categoryChoices.length > 1 ?
                    <View style={{
                        backgroundColor: '#efefef',
                    }}>
                        {/* <label style={{ width: 150, backgroundColor: '#efefef', borderBottom: '1px solid #d9dcdf' }}>
                            <Select
                                touchUi={true}
                                themeVariant="light"
                                value={filterChoice}
                                onChange={(val: any) => {
                                    setFilterChoice(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false,
                                    }
                                }}
                                data={categoryChoices}
                            />
                        </label> */}
                         <DropDownPicker
                            open={isFilterDropdownOpen}
                            value={filterChoice}
                            items={categoryChoices}
                            setOpen={setIsFilterDropdownOpen}
                            setValue={setFilterChoice}
                        />
                    </View> : null}
            {
                showComments ?
                    <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', backgroundColor: '#efefef' }}>
                        <TouchableOpacity
                            key={Math.random()}
                            onPress={() => {
                                setThreadId('')
                                setThreadChat([])
                                setShowPost(true)
                            }}
                            style={{
                                backgroundColor: '#efefef',
                                overflow: 'hidden',
                                height: 35,
                                // marginTop: 15,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                right: 0
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#006AFF',
                                fontSize: 12,
                                borderColor: '#006AFF',
                                paddingHorizontal: 20,
                                borderWidth: 1,
                                fontFamily: 'inter',
                                height: 35,
                                // width: 100,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                NEW POST
                                {/* <Ionicons name='create-outline' size={15} color={'#000000'} /> */}
                            </Text>
                        </TouchableOpacity>
                    </View> : null
            }

        </View>
    }

    /**
     * @description Renders selected thread with GiftedChat component
     */
    const renderSelectedThread = () => {
        return (<View style={{
            width: '100%',
            maxWidth: 900,
            borderRadius: 1,
            padding: 10,
            minHeight: 400,
        }}
        >
            <GiftedChat
                renderMessageAudio={renderMessageAudio}
                renderMessageVideo={renderMessageVideo}
                renderUsernameOnMessage={true}
                messages={threadChat}
                onSend={messages => onSend(messages)}
                user={{
                    _id: userId,
                    avatar
                }}
                renderBubble={renderBubble}
                renderActions={() => (
                    <View style={{
                        marginTop: -10
                    }}>
                        <FileUpload
                            chat={true}
                            onUpload={(u: any, t: any) => {
                                const title = prompt('Enter title and click on OK to share.')
                                if (!title || title === "") return;

                                let text: any = ''
                                let img: any = ''
                                let audio: any = ''
                                let video: any = ''
                                let file: any = ''

                                if (t === 'png' || t === 'jpeg' || t === 'jpg' || t === 'gif') {
                                    img = u
                                } else if (t === "mp3" || t === "wav" || t === "mp2") {
                                    audio = u
                                } else if (t === "mp4" || t === "oga" || t === "mov" || t === "wmv") {
                                    video = u
                                } else {
                                    file = u
                                    text = <TouchableOpacity
                                        onPress={() => {
                                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                window.open(u, '_blank')
                                            } else {
                                                Linking.openURL(u)
                                            }
                                        }}
                                        style={{
                                            backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                                            marginTop: 6,
                                        }}>
                                        <Text style={{
                                            textAlign: "center",
                                            lineHeight: 34,
                                            color: '#006AFF',
                                            fontSize: 12,
                                            borderWidth: 1,
                                            borderColor: '#006AFF',
                                            paddingHorizontal: 20,
                                            fontFamily: "inter",
                                            height: 35,
                                            // paddingTop: 2
                                            // width: 125,
                                            borderRadius: 15,
                                            textTransform: "uppercase"
                                        }}>
                                            {title}
                                        </Text>
                                    </TouchableOpacity>
                                }

                                const obj = { title, type: t, url: u }

                                onSend([{
                                    title,
                                    text,
                                    image: img,
                                    audio,
                                    video,
                                    file,
                                    msgObject: JSON.stringify(obj)
                                }])
                            }}
                        />
                    </View>
                )}
            />
        </View>)
    }

    /**
     * @description Renders List of threads
     */
    const renderAllThreads = () => {
        return (<View style={{ width: '100%', backgroundColor: threads.length === 0 ? '#efefef' : 'white', maxWidth: 900, borderRadius: 1 }}>
        {
            threads.length === 0 ?
                <View style={{ flex: 1 }}>
                    <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 20, paddingVertical: 50, fontFamily: 'inter', flex: 1, backgroundColor: '#efefef' }}>
                        {
                            !props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')
                        }
                    </Text>
                </View>
                : <ScrollView
                    showsVerticalScrollIndicator={true}
                    horizontal={false}
                    // style={{ height: '100%' }}
                    contentContainerStyle={{
                        // borderWidth: 1,
                        // borderRightWidth: 0,
                        // borderLeftWidth: 0,
                        // borderRightWidth: 1,
                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 10,
                        borderColor: '#efefef',
                        borderRadius: 1,
                        width: '100%',
                        maxHeight: Dimensions.get('window').width < 1024 ? 400 : 500,
                    }}
                >
                    {
                        filteredThreads.map((thread: any, ind) => {

                            let title = ''

                            if (thread.message[0] === '{' && thread.message[thread.message.length - 1] === '}') {
                                const obj = JSON.parse(thread.message)
                                title = obj.title
                            } else {
                                const { title: t, subtitle: s } = htmlStringParser(thread.message)
                                title = t
                            }

                            return <TouchableOpacity
                                onPress={() => loadCueDiscussions(thread._id)}
                                style={{
                                    // backgroundColor: '#efefef',
                                    flexDirection: 'row',
                                    borderColor: '#efefef',
                                    paddingVertical: 5,
                                    // borderRightWidth: 1,
                                    borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                    // minWidth: 600, // flex: 1,
                                    width: '100%'
                                }}>
                                <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                    <Image
                                        style={{
                                            height: 35,
                                            width: 35,
                                            marginTop: 5,
                                            marginLeft: 5,
                                            marginBottom: 5,
                                            borderRadius: 75,
                                            // marginTop: 20,
                                            alignSelf: 'center'
                                        }}
                                        source={{ uri: thread.avatar ? thread.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                    />
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                        {thread.anonymous ? 'Anonymous' : thread.fullName}
                                    </Text>
                                    <Text style={{ fontSize: 12, margin: 5, fontWeight: 'bold', lineHeight: 18 }} ellipsizeMode='tail' numberOfLines={2} >
                                        {title}
                                    </Text>
                                </View>
                                <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                    <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingLeft: 10, alignItems: 'center' }}>
                                        {
                                            thread.isPrivate ?
                                                <Text style={{ fontSize: 13, padding: 5, color: '#006AFF', textAlign: 'center' }} ellipsizeMode='tail'>
                                                    <Ionicons name='eye-off-outline' size={18} />
                                                </Text>
                                                : null
                                        }
                                        {thread.unreadThreads > 0 ? <View style={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            marginHorizontal: 5,
                                            backgroundColor: "#006AFF",
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 3
                                        }}>
                                            <Text style={{ color: 'white', fontSize: 10 }}>
                                                {thread.unreadThreads}
                                            </Text>

                                        </View> : null}
                                        <Text style={{ fontSize: 12, padding: 5, lineHeight: 13, fontWeight: 'bold', color: thread.unreadThreads > 0 ? "#006AFF" : '#000000' }} ellipsizeMode='tail'>
                                            {emailTimeDisplay(thread.time)}
                                        </Text>
                                        <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode='tail'>
                                            <Ionicons name='chevron-forward-outline' size={18} color='#006AFF' />
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        })
                    }
                </ScrollView>
        }
    </View>)
    }

    // MAIN RETURN 

    return (
        <View style={{
            backgroundColor: '#efefef',
            width: '100%',
            paddingTop: 0,
            justifyContent: 'center',
            flexDirection: 'row',
        }}>
            {/* <NewPostModal show={showPost} categories={categories} categoriesOptions={categoriesOptions} onClose={() => setShowPost(false)} onSend={createNewThread} /> */}
            <View style={{
                width: '100%',
                maxWidth: 900,
                backgroundColor: '#efefef',
                borderRadius: 1
            }}>
                {
                    !showThreadCues || showPost ?
                        renderThreadHeader() : null
                }
                {/* <Collapse isOpened={showComfments} style={{ flex: 1 }}> */}
                <View style={{ flex: 1 }}>
                    {
                        (
                            loading ?
                                <View style={{
                                    width: '100%',
                                    paddingVertical: 100,
                                    justifyContent: 'center',
                                    flex: 1,
                                    flexDirection: 'column',
                                    backgroundColor: '#efefef'
                                }}>
                                    <ActivityIndicator color={'#1F1F1F'} />
                                </View> :
                                <View style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    flex: 1,
                                    flexDirection: 'column',
                                    borderLeftWidth: threads.length === 0 ? 0 : 3,
                                    borderLeftColor: props.channelColor,
                                    borderRadius: 1,
                                    shadowOffset: {
                                        width: threads.length === 0 ? 0 : 2,
                                        height:  threads.length === 0 ? 0 : 2,
                                    },
                                    shadowOpacity: 0.1,
                                    shadowRadius:  threads.length === 0 ? 0 : 10,
                                }}
                                    key={JSON.stringify(filteredThreads) + JSON.stringify(showPost)}
                                >
                                    {showThreadCues ? <View style={{
                                        width: '100%',
                                        backgroundColor: '#fff',
                                    }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowPost(false)
                                                setShowThreadCues(false)
                                                props.reload()
                                            }}
                                            style={{
                                                paddingRight: 20,
                                                paddingLeft: 10,
                                                alignSelf: 'flex-start',
                                            }}
                                        >
                                            <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center', paddingTop: 10, }}>
                                                <Ionicons name='chevron-back-outline' size={30} color={'#1F1F1F'} />
                                            </Text>
                                        </TouchableOpacity>
                                    </View> : null }
                                    {
                                        (showThreadCues ?
                                                renderSelectedThread() : renderAllThreads())
                                    }
                                </View>
                        )
                    }
                {/* </Collapse> */}
                </View>
            </View>
        </View >
    );
}

export default React.memo(ThreadsList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        marginSmall: {
            height: 10
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
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row'
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white'
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F'
        },
    })
}
