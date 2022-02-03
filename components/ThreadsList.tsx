import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    Linking,
    Keyboard,
    TextInput
} from 'react-native';
import Alert from '../components/Alert';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createMessage,
    deleteThread,
    getThreadWithReplies,
    markThreadsAsRead,
    getThreadCategories
} from '../graphql/QueriesAndMutations';
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
import { Video } from 'expo-av';
import NewPostModal from './NewPostModal';
import DropDownPicker from 'react-native-dropdown-picker';
import BottomSheet from './BottomSheet';
import { handleImageUpload } from '../helpers/ImageUpload';
import { handleFile } from '../helpers/FileUpload'

const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // State
    const [loading, setLoading] = useState(false);
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads));
    const [threads] = useState<any[]>(unparsedThreads.reverse());
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([]);
    const [showThreadCues, setShowThreadCues] = useState(false);
    const [filterChoice, setFilterChoice] = useState('All');
    const [showPost, setShowPost] = useState(false);
    const [threadId, setThreadId] = useState('');
    const [showComments, setShowComments] = useState(true);
    const [avatar, setAvatar] = useState('');
    const [privatePost, setPrivatePost] = useState(false);
    const [threadCategories, setThreadCategories] = useState<any[]>([]);
    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [userId, setUserId] = useState('');
    const [threadChat, setThreadChat] = useState<any[]>([]);
    const styles = styleObject();
    const categories: any[] = [];
    const categoryObject: any = {};
    let filteredThreads: any[] = [];
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    const [uploadFileVisible, setUploadFileVisible] = useState(false);
    const [importTitle, setImportTitle] = useState('');
    const [importType, setImportType] = useState('');
    const [importFileName, setImportFileName] = useState('');
    const [importUrl, setImportUrl] = useState('');

    const audioRef: any = useRef();
    const videoRef: any = useRef();

    // ALERTS
    const unableToLoadThreadAlert = PreferredLanguageText('unableToLoadThread');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');

    useEffect(() => {
        const channelCategories: any[] = [];
        threads.map(item => {
            if (item.category !== '' && !categoryObject[item.category]) {
                categoryObject[item.category] = 'category';
            }
        });
        Object.keys(categoryObject).map(key => {
            channelCategories.push(key);
        });

        console.log('categories', channelCategories);

        const options = [
            {
                value: 'None',
                label: 'None'
            }
        ];
        channelCategories.map((category: any) => {
            options.push({
                value: category,
                label: category
            });
        });

        console.log('Categories options', options);

        props.setNewPostCategories(options);
    }, [threads]);

    threads.map(item => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category';
        }
    });
    Object.keys(categoryObject).map(key => {
        categories.push(key);
    });
    if (filterChoice === 'All') {
        filteredThreads = threads;
    } else {
        filteredThreads = threads.filter(item => {
            return item.category === filterChoice;
        });
    }
    let categoriesOptions = [
        {
            value: 'None',
            label: 'None'
        }
    ];
    categories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            label: category
        });
    });
    let categoryChoices = [
        {
            value: 'All',
            label: 'All'
        }
    ];
    categories.map((cat: any) => {
        categoryChoices.push({
            value: cat,
            label: cat
        });
    });

    // HOOKS

    useEffect(() => {}, []);

    /**
     * @description Load categories on init
     */
    useEffect(() => {
        loadCategories();
    }, [props.channelId]);

    /**
     * Set is Owner on init
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                setUserId(user._id);
                if (user.avatar) {
                    setAvatar(user.avatar);
                } else {
                    setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
                }
                if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                    setIsOwner(true);
                }
            }
        })();
    }, []);

    /**
     * Load discussion from Search or Activity
     */
    useEffect(() => {
        (async () => {
            const tId = await AsyncStorage.getItem('openThread');
            if (tId && tId !== '' && threads.length !== 0) {
                // Clear the openChat

                await AsyncStorage.removeItem('openThread');

                loadCueDiscussions(tId);
            }
        })();
    }, [threads]);

    

    /**
     * 
     */
     const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            
            const url = await handleImageUpload(takePhoto, userId);

            setImportUrl(url)
            setImportType('image')
            setImportTitle('Image')

        },
        [userId]
    );

    /**
     * 
     */
     const uploadFileHandler = useCallback(
        async (audioVideo) => {
            const res = await handleFile(audioVideo, userId);

            console.log('File upload result', res);

            if (!res || res.url === '' || res.type === '') {
                return;
            }

            setImportType(audioVideo ? 'mp4' : res.type)
            setImportTitle(audioVideo ? 'Video' : res.name)
            setImportFileName(res.name)
            setImportUrl(res.url)

        },
        [userId]
    );

    const sendImport = useCallback(() => {

        if (importType === 'image') {
            let img: any = importUrl;
            let text: any = '';
            let audio: any = '';
            let video: any = '';
            let file: any = '';

            const obj = { title: importTitle, type: 'jpg', url: importUrl };

            onSend([
                {
                    title: importTitle,
                    text,
                    image: img,
                    audio,
                    video,
                    file,
                    msgObject: JSON.stringify(obj)
                }
            ]);
        } else if (importType === 'mp4') {
            let text: any = '';
            let img: any = '';
            let audio: any = '';
            let video: any = '';
            let file: any = '';

            video = importUrl;

            const obj = { title: importTitle, type: importType, url: importUrl };

            onSend([
                {
                    title: importTitle,
                    text,
                    image: img,
                    audio,
                    video,
                    file,
                    msgObject: JSON.stringify(obj)
                }
            ]);

        } else {
            let text: any = '';
            let img: any = '';
            let audio: any = '';
            let video: any = '';
            let file: any = '';

            file = importUrl;
            text = (
                <TouchableOpacity
                        onPress={() => {
                            if (
                                Platform.OS === 'web' ||
                                Platform.OS === 'macos' ||
                                Platform.OS === 'windows'
                            ) {
                                window.open(importUrl, '_blank');
                            } else {
                                Linking.openURL(importUrl);
                            }
                        }}
                        style={{
                            backgroundColor: '#006AFF',
                            borderRadius: 15,
                            marginLeft: 15,
                            marginTop: 6
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: 'white',
                                fontSize: 12,
                                borderWidth: 1,
                                borderColor: '#006AFF',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            {importTitle}
                        </Text>
                    </TouchableOpacity>
                );

            const obj = { title: importTitle, type: importType, url: importUrl };

            onSend([
                {
                    title: importTitle,
                    text,
                    image: img,
                    audio,
                    video,
                    file,
                    msgObject: JSON.stringify(obj)
                }
            ]);

        }

        setImportType('')
        setImportUrl('')
        setUploadFileVisible(false);

    }, [importTitle, importUrl, importType])

    /**
     * @description Fetches all the categories for that Channel
     */
    const loadCategories = useCallback(async () => {
        if (props.channelId === undefined || props.channelId === null || props.channelId === '') {
            return;
        }
        const server = fetchAPI('');
        server
            .query({
                query: getThreadCategories,
                variables: {
                    channelId: props.channelId
                }
            })
            .then(res => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setThreadCategories(res.data.thread.getChannelThreadCategories);
                }
            })
            .catch(err => {});
    }, [props.channelId]);

    /**
     * @description Called from Modal for creating a new thread
     */
    const createNewThread = useCallback(
        async (message: any, category: any, isPrivate: any) => {
            console.log('Create new thread', {
                message,
                userId,
                channelId: props.channelId,
                isPrivate,
                anonymous: false,
                cueId: props.cueId === null ? 'NULL' : props.cueId,
                parentId: 'INIT',
                category: category === 'None' ? '' : category
            });

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: createMessage,
                    variables: {
                        message,
                        userId,
                        channelId: props.channelId,
                        isPrivate,
                        anonymous: false,
                        cueId: props.cueId === null ? 'NULL' : props.cueId,
                        parentId: 'INIT',
                        category: category === 'None' ? '' : category
                    }
                })
                .then(res => {
                    if (res.data.thread.writeMessage) {
                        setShowPost(false);
                        props.reload();
                    } else {
                        Alert(checkConnectionAlert);
                    }
                })
                .catch(err => {
                    console.log('Error', err);
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        },
        [props.cueId, props.channelId, userId, isOwner]
    );

    /**
     * @description Send a Thread message
     */
    const onSend = useCallback(
        async (messages: any) => {
            let message = '';

            if (
                (messages[0].file && messages[0].file !== '') ||
                (messages[0].image && messages[0].image !== '') ||
                (messages[0].audio && messages[0].audio !== '') ||
                (messages[0].video && messages[0].video !== '')
            ) {
                message = messages[0].msgObject;
            } else {
                message = messages[0].text;
            }

            messages[0] = {
                ...messages[0],
                user: {
                    _id: userId
                }
            };

            const server = fetchAPI('');
            server
                .mutate({
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
                })
                .then(res => {
                    if (res.data.thread.writeMessage) {
                        setThreadChat(threadChat => GiftedChat.append(threadChat, messages));
                        // props.reload()
                    } else {
                        Alert(checkConnectionAlert);
                    }
                })
                .catch(err => {
                    console.log('Error', err);
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        },
        [props.cueId, props.channelId, threadId, userId, showPost, customCategory, privatePost, isOwner]
    );

    /**
     * @description Load the entire the Thread using the thread ID
     */
    const loadCueDiscussions = useCallback(async tId => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            setThreadId(tId);
            setLoading(true);
            setShowThreadCues(true);
            const server = fetchAPI('');
            server
                .query({
                    query: getThreadWithReplies,
                    variables: {
                        threadId: tId
                    }
                })
                .then(res => {
                    setThreadWithReplies(res.data.thread.getThreadWithReplies);
                    const tempChat: any[] = [];
                    res.data.thread.getThreadWithReplies.map((msg: any) => {
                        let text: any = '';
                        let img: any = '';
                        let audio: any = '';
                        let video: any = '';
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message);
                            const { type, url } = obj;
                            if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                                img = url;
                            } else if (type === 'mp3' || type === 'wav' || type === 'mp2') {
                                audio = url;
                            } else if (type === 'mp4' || type === 'oga' || type === 'mov' || type === 'wmv') {
                                video = url;
                            } else {
                                text = (
                                    <TouchableOpacity style={{ backgroundColor: '#006AFF' }}>
                                        <Text
                                            style={{
                                                textDecorationLine: 'underline',
                                                backgroundColor: '#006AFF',
                                                color: '#fff'
                                            }}
                                            onPress={() => {
                                                if (
                                                    Platform.OS === 'web' ||
                                                    Platform.OS === 'macos' ||
                                                    Platform.OS === 'windows'
                                                ) {
                                                    window.open(url, '_blank');
                                                } else {
                                                    Linking.openURL(url);
                                                }
                                            }}
                                        >
                                            {obj.title + '.' + obj.type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message);
                            text = t;
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
                                avatar: msg.avatar
                                    ? msg.avatar
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png'
                            }
                        });
                    });
                    tempChat.reverse();
                    setThreadChat(tempChat);
                    setLoading(false);
                })
                .catch(err => {
                    Alert(unableToLoadThreadAlert, checkConnectionAlert);
                    setLoading(false);
                });
            server
                .mutate({
                    mutation: markThreadsAsRead,
                    variables: {
                        userId: user._id,
                        threadId: tId
                    }
                })
                .then(res => {
                    if (props.refreshUnreadDiscussionCount) {
                        props.refreshUnreadDiscussionCount();
                    }
                })
                .catch(e => console.log(e));
        }
    }, []);

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
        );
    };

    /**
     * @description Customize how Audio message appears
     */
    const renderMessageAudio = (props: any) => {
        if (props.currentMessage.audio && props.currentMessage.audio !== '') {
            return (
                <View>
                    <Video
                        ref={audioRef}
                        style={{
                            width: 250,
                            height: 60
                        }}
                        source={{
                            uri: props.currentMessage.audio
                        }}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        // onPlaybackStatusUpdate={status => setStatus(() => status)}
                    />
                </View>
            );
        }

        return null;
    };

    /**
     * @description Customize how Video Message appears
     */
    const renderMessageVideo = (props: any) => {
        if (props.currentMessage.video && props.currentMessage.video !== '') {
            return (
                <View>
                    <Video
                        ref={videoRef}
                        style={{
                            width: 250,
                            height: 250
                        }}
                        source={{
                            uri: props.currentMessage.video
                        }}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        // onPlaybackStatusUpdate={status => setStatus(() => status)}
                    />
                </View>
            );
        }

        return null;
    };

    // FUNCTIONS

    /**
     * @description Helper to display Time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    /**
     * @description Renders the Filter Dropdown and the New Post button
     */
    const renderThreadHeader = () => {
        const filterDropdownHeight =
            Object.keys(categoryChoices).length * 60 > 260 ? 250 : Object.keys(categoryChoices).length * 60;

        return (
            <View
                style={{
                    backgroundColor: '#f2f2f2',
                    flexDirection: 'column-reverse',
                    paddingBottom: 20,
                    paddingHorizontal: 20,
                    width: '100%',
                    maxWidth: 900,
                    borderRadius: 1
                }}
            >
                {props.cueId === null && categoryChoices.length > 1 ? (
                    <View
                        style={{
                            backgroundColor: '#f2f2f2',
                            height: isFilterDropdownOpen ? filterDropdownHeight : 50,
                            maxWidth: '100%',
                            marginTop: 20
                        }}
                    >
                        <DropDownPicker
                            listMode="SCROLLVIEW"
                            open={isFilterDropdownOpen}
                            value={filterChoice}
                            items={categoryChoices}
                            setOpen={setIsFilterDropdownOpen}
                            setValue={setFilterChoice}
                            zIndex={1000001}
                            style={{
                                borderWidth: 0,
                                // borderBottomWidth: 1,
                                // borderBottomColor: '#f2f2f2',
                                backgroundColor: '#f2f2f2',
                                borderBottomColor: '#d9dcdf',
                                borderBottomWidth: 2
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001,
                                // backgroundColor: '#f2f2f2',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 1,
                                    height: 3
                                },
                                shadowOpacity: !isFilterDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12
                            }}
                            containerStyle={{
                                // backgroundColor: '#f2f2f2',
                                borderRadius: 0
                            }}
                        />
                    </View>
                ) : null}
                {showComments ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'flex-end',
                            flexDirection: 'row',
                            backgroundColor: '#f2f2f2'
                        }}
                    >
                        <TouchableOpacity
                            key={Math.random()}
                            onPress={() => {
                                setThreadId('');
                                setThreadChat([]);
                                // setShowPost(true);
                                props.showNewPostModal();
                            }}
                            style={{
                                backgroundColor: '#006AFF',
                                overflow: 'hidden',
                                height: 35,
                                // marginTop: 15,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderRadius: 15,
                                right: 0
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: '#ffffff',
                                    fontSize: 12,
                                    borderColor: '#006AFF',
                                    paddingHorizontal: 20,
                                    borderWidth: 1,
                                    fontFamily: 'inter',
                                    height: 35,
                                    // width: 100,
                                    borderRadius: 15,
                                    textTransform: 'uppercase'
                                }}
                            >
                                NEW POST
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Renders selected thread with GiftedChat component
     */
    const renderSelectedThread = () => {
        return (
            <View
                style={{
                    width: '100%',
                    maxWidth: 900,
                    borderRadius: 1,
                    padding: 10,
                    minHeight: 400,
                    borderLeftWidth: 3,
                    borderLeftColor: props.channelColor
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
                        <View
                            style={{
                                marginTop: -10
                            }}
                        >
                            <TouchableOpacity onPress={() => {
                                Keyboard.dismiss()
                                setUploadFileVisible(true)
                            }}>
                                <Text
                                    style={{
                                        color: '#006AFF',
                                        lineHeight: 40,
                                        textAlign: 'right',
                                        fontSize: 12,
                                        fontFamily: 'overpass',
                                        textTransform: 'uppercase',
                                        paddingLeft: 10
                                    }}
                                >
                                    <Ionicons name="document-attach-outline" size={18} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        );
    };

    /**
     * @description Renders List of threads
     */
    const renderAllThreads = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    maxWidth: 900,
                    borderRadius: 1,
                    borderLeftWidth: threads.length === 0 ? 0 : 3,
                    borderLeftColor: props.channelColor
                }}
            >
                {threads.length === 0 ? (
                    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 20,
                                paddingVertical: 50,
                                fontFamily: 'inter',
                                flex: 1,
                                backgroundColor: '#f2f2f2',
                                paddingHorizontal: 20
                            }}
                        >
                            {!props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        // style={{ height: '100%' }}
                        contentContainerStyle={{
                            paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 10,
                            borderColor: '#f2f2f2',
                            borderRadius: 1,
                            width: '100%'
                        }}
                    >
                        {filteredThreads.map((thread: any, ind) => {
                            let title = '';

                            if (thread.message[0] === '{' && thread.message[thread.message.length - 1] === '}') {
                                const obj = JSON.parse(thread.message);
                                title = obj.title;
                            } else {
                                const { title: t, subtitle: s } = htmlStringParser(thread.message);
                                title = t;
                            }

                            return (
                                <TouchableOpacity
                                    onPress={() => loadCueDiscussions(thread._id)}
                                    style={{
                                        // backgroundColor: '#f2f2f2',
                                        flexDirection: 'row',
                                        borderColor: '#f2f2f2',
                                        paddingVertical: 5,
                                        // borderRightWidth: 1,
                                        borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                        // minWidth: 600, // flex: 1,
                                        width: '100%'
                                    }}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                        <Image
                                            style={{
                                                height: 35,
                                                width: 35,
                                                marginTop: 5,
                                                marginLeft: 5,
                                                marginBottom: 5,
                                                borderRadius: 75,
                                                alignSelf: 'center'
                                            }}
                                            source={{
                                                uri: thread.avatar
                                                    ? thread.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                            }}
                                        />
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                        <Text
                                            style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }}
                                            ellipsizeMode="tail"
                                        >
                                            {thread.anonymous ? 'Anonymous' : thread.fullName}
                                        </Text>
                                        <Text
                                            style={{ fontSize: 12, margin: 5, fontWeight: 'bold', lineHeight: 18 }}
                                            ellipsizeMode="tail"
                                            numberOfLines={2}
                                        >
                                            {title}
                                        </Text>
                                    </View>
                                    <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                backgroundColor: '#fff',
                                                paddingLeft: 10,
                                                alignItems: 'center'
                                            }}
                                        >
                                            {thread.isPrivate ? (
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        padding: 5,
                                                        color: '#006AFF',
                                                        textAlign: 'center'
                                                    }}
                                                    ellipsizeMode="tail"
                                                >
                                                    <Ionicons name="eye-off-outline" size={18} />
                                                </Text>
                                            ) : null}
                                            {thread.unreadThreads > 0 ? (
                                                <View
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        marginHorizontal: 5,
                                                        backgroundColor: '#006AFF',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: 3
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontSize: 10 }}>
                                                        {thread.unreadThreads}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    padding: 5,
                                                    lineHeight: 13,
                                                    fontWeight: 'bold',
                                                    color: thread.unreadThreads > 0 ? '#006AFF' : '#000000'
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {emailTimeDisplay(thread.time)}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 13, padding: 5, lineHeight: 13 }}
                                                ellipsizeMode="tail"
                                            >
                                                <Ionicons name="chevron-forward-outline" size={18} color="#006AFF" />
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderImportModalContent = () => {
        if (importType && importUrl) {
            return <View style={{ paddingHorizontal: 10 }}>
                {importType === 'image' ? 
                    <Image
                        style={{
                            height: 200,
                            width: 250,
                            alignSelf: 'center'
                        }}
                        source={{ uri: importUrl }}
                    /> : importType === 'mp4' ? (
                        <View style={{ paddingVertical: 15,}}>
                            <Video
                                ref={audioRef}
                                style={{
                                    
                                    width: 250,
                                    height: 150,
                                    alignSelf: 'center'
                                }}
                                source={{
                                    uri: importUrl
                                }}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                            />
                        </View>
                    ) : (
                        <Text style={{ color: '#000', fontFamily: 'Inter', fontSize: 20, paddingTop: 30, paddingBottom: 30, paddingLeft: 20 }}>
                            {importFileName}
                        </Text>
                    )}

                    {/* <TextInput
                        value={importTitle}
                        placeholder={''}
                        onChangeText={val => setImportTitle(val)}
                        placeholderTextColor={'#1F1F1F'}
                        required={true}
                    /> */}

                    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: '#006AFF',
                                borderRadius: 19,
                                width: 150,
                                alignSelf: 'center',
                                marginRight: 20
                            }}
                            onPress={() => {
                                setImportTitle('')
                                setImportUrl('')
                                setImportFileName('')
                                setUploadFileVisible(false)
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    lineHeight: 34,
                                    color: '#fff'
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: '#006AFF',
                                borderRadius: 19,
                                width: 150,
                                alignSelf: 'center'
                            }}
                            onPress={() => {
                                sendImport()
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    lineHeight: 34,
                                    color: '#fff'
                                }}
                            >
                                Send
                            </Text>
                        </TouchableOpacity>
                    </View>
            </View>
        } 

        return <View style={{ paddingHorizontal: 10 }}>
            <TouchableOpacity
                style={{
                    marginTop: 20,
                    backgroundColor: '#006AFF',
                    borderRadius: 19,
                    width: 150,
                    alignSelf: 'center'
                }}
                onPress={() => {
                    uploadImageHandler(true);
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        lineHeight: 34,
                        color: '#fff'
                    }}
                >
                    {' '}
                    Camera{' '}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    marginTop: 20,
                    backgroundColor: '#006AFF',
                    borderRadius: 19,
                    width: 150,
                    alignSelf: 'center'
                }}
                onPress={() => {
                    uploadImageHandler(false);
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        lineHeight: 34,
                        color: '#fff'
                    }}
                >
                    {' '}
                    Image Gallery{' '}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    marginTop: 20,
                    backgroundColor: '#006AFF',
                    borderRadius: 19,
                    width: 150,
                    alignSelf: 'center'
                }}
                onPress={() => {
                    uploadFileHandler(false);
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        lineHeight: 34,
                        color: '#fff'
                    }}
                >
                    {' '}
                    File{' '}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    marginTop: 20,
                    backgroundColor: '#006AFF',
                    borderRadius: 19,
                    width: 150,
                    alignSelf: 'center'
                }}
                onPress={() => {
                    uploadFileHandler(true);
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        lineHeight: 34,
                        color: '#fff'
                    }}
                >
                    {' '}
                    Video{' '}
                </Text>
            </TouchableOpacity>
        </View>
    }

    // MAIN RETURN

    return (
        <View
            style={{
                backgroundColor: '#f2f2f2',
                width: '100%',
                paddingTop: 0,
                justifyContent: 'center',
                flexDirection: 'row',
                flex: 1,
                height: '100%'
                // maxHeight: '100%'
            }}
        >
            <View
                style={{
                    width: '100%',
                    maxWidth: 900,
                    backgroundColor: '#f2f2f2',
                    borderRadius: 1,
                    flex: 1,
                    height: '100%'
                }}
            >
                {!showThreadCues || showPost ? renderThreadHeader() : null}
                {/* <Collapse isOpened={showComfments} style={{ flex: 1 }}> */}
                <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
                    {loading ? (
                        <View
                            style={{
                                width: '100%',
                                paddingVertical: 100,
                                justifyContent: 'center',
                                flex: 1,
                                flexDirection: 'column',
                                backgroundColor: '#f2f2f2'
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: '#f2f2f2',
                                flex: 1,
                                flexDirection: 'column',
                                borderRadius: 1
                                // shadowOffset: {
                                //     width: threads.length === 0 ? 0 : 2,
                                //     height: threads.length === 0 ? 0 : 2
                                // },
                                // shadowOpacity: 0.1,
                                // shadowRadius: threads.length === 0 ? 0 : 10
                            }}
                            key={JSON.stringify(filteredThreads) + JSON.stringify(showPost)}
                        >
                            {showThreadCues ? (
                                <View
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'white',
                                        borderLeftWidth: 3,
                                        borderLeftColor: props.channelColor
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowPost(false);
                                            setShowThreadCues(false);
                                            props.reload();
                                        }}
                                        style={{
                                            paddingRight: 20,
                                            paddingLeft: 10,
                                            alignSelf: 'flex-start'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                width: '100%',
                                                textAlign: 'center',
                                                paddingTop: 10
                                            }}
                                        >
                                            <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                            {showThreadCues ? renderSelectedThread() : renderAllThreads()}
                        </View>
                    )}
                </View>
            </View>
            {showPost && (
                <NewPostModal
                    show={showPost}
                    categories={categories}
                    categoriesOptions={categoriesOptions}
                    onClose={() => setShowPost(false)}
                    onSend={createNewThread}
                />
            )}
             {uploadFileVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setUploadFileVisible(false);
                    }}
                    isOpen={uploadFileVisible}
                    title={importType ? 'Send ' + (importType !== 'image' && importType !== 'video' ? 'File' : importType) : 'Import' }
                    renderContent={() => renderImportModalContent()}
                    header={false}
                />
            )}
        </View>
    );
};

export default React.memo(ThreadsList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads);
});

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
        }
    });
};
