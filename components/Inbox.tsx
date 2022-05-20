// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    Linking,
    ScrollView,
    Keyboard,
    TextInput as DefaultTextInput,
    StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getAllUsers,
    getChats,
    getMessages,
    markMessagesAsRead,
    sendMessage,
    updateGroup,
    getGroup,
    startInstantMeetingInbox,
    searchMessages,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { Text, TouchableOpacity, View } from './Themed';
import alert from '../components/Alert';
import FileUpload from './UploadFiles';
// import { Select } from '@mobiscroll/react';
import { TextInput } from './CustomTextInput';
// import ReactPlayer from 'react-native-video';
import { GiftedChat, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import DropDownPicker from 'react-native-dropdown-picker';
import { Video } from 'expo-av';
import BottomSheet from './BottomSheet';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import DateTimePicker from '@react-native-community/datetimepicker';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleImageUpload } from '../helpers/ImageUpload';
import { handleFile } from '../helpers/FileUpload';
import Reanimated from 'react-native-reanimated';

import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg';
import { getDropdownHeight } from '../helpers/DropdownHeight';

import 'intl';
import 'intl/locale-data/jsonp/en';
// import en from "relative-time-format/locale/en.json"

import RelativeTimeFormat from 'relative-time-format';
import en from 'relative-time-format/locale/en.json';
import { importInboxModalHeight } from '../helpers/ModalHeights';
import { useOrientation } from '../hooks/useOrientation';

import { disableEmailId, zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

RelativeTimeFormat.addLocale(en);

const Inbox: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [loadingChats, setLoadingChats] = useState(true);
    const [chats, setChats] = useState<any[]>([]);
    const [userId, setUserId] = useState('');
    const [avatar, setAvatar] = useState('');
    const [chat, setChat] = useState<any[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [users, setUsers] = useState<any>([]);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [chatUsers, setChatUsers] = useState<any[]>([]);
    const [groupId, setGroupId] = useState('');
    const [chatName, setChatName] = useState('');
    const [chatImg, setChatImg] = useState('');
    const [isChatGroup, setIsChatGroup] = useState(false);
    const [viewGroup, setViewGroup] = useState(false);
    const [groupUsers, setGroupUsers] = useState<any[]>([]);
    const [groupCreatedBy, setGroupCreatedBy] = useState('');
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupImage, setEditGroupImage] = useState('');
    const [filterChannelId, setFilterChannelId] = useState('All');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupImage, setNewGroupImage] = useState(undefined);
    const [creatingMessage, setCreatingMessage] = useState(false);
    const [selected, setSelected] = useState<any[]>([]);
    const [isFilterChannelDropdownOpen, setIsFilterChannelDropdownOpen] = useState(false);
    const [isNewUsersDropdownOpen, setIsNewUsersDropdownOpen] = useState(false);
    const [isUpdateUsersDropdownOpen, setIsUpdateUsersDropdownOpen] = useState(false);
    const [uploadFileVisible, setUploadFileVisible] = useState(false);
    const [importTitle, setImportTitle] = useState('');
    const [importType, setImportType] = useState('');
    const [importFileName, setImportFileName] = useState('');
    const [importUrl, setImportUrl] = useState('');
    //
    const [showInstantMeeting, setShowInstantMeeting] = useState(false);
    const [instantMeetingTitle, setInstantMeetingTitle] = useState<any>('');
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');
    const [meetingProvider, setMeetingProvider] = useState('');
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>('');
    const [instantMeetingNewChat, setInstantMeetingNewChat] = useState(false);
    const [instantMeetingNewUserId, setInstantMeetingNewUserId] = useState('');
    const [instantMeetingNewChatGroupId, setInstantMeetingNewChatGroupId] = useState('');
    const [instantMeetingNewChatUsername, setInstantMeetingNewChatUsername] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [uploadProfilePicVisible, setUploadProfilePicVisible] = useState(false);

    const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
    const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

    const orientation = useOrientation();

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    const audioRef: any = useRef();
    const videoRef: any = useRef();

    const width = Dimensions.get('window').width;
    let options = users.map((sub: any) => {
        return {
            value: sub._id,
            label: sub.fullName,
            group: sub.fullName[0].toUpperCase(),
        };
    });
    options = options.sort((a: any, b: any) => {
        if (a.group < b.group) {
            return -1;
        }
        if (a.group > b.group) {
            return 1;
        }
        return 0;
    });
    let channelOptions = [{ value: 'All', label: 'All Courses' }];
    props.subscriptions.map((subscription: any) => {
        channelOptions.push({
            value: subscription.channelId,
            label: subscription.channelName,
        });
    });
    const sortChatsByLastMessage = chats.sort((a: any, b: any) => {
        return new Date(a.lastMessageTime) > new Date(b.lastMessageTime) ? -1 : 1;
    });
    const windowHeight = Dimensions.get('window').height;

    // ALERTS
    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    // HOOKS

    /**
     * @description Loads Users and Chats on Init
     */
    useEffect(() => {
        loadUsers();
        loadChats();
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults([]);
            return;
        }
        (async () => {
            setIsSearching(true);
            const server = fetchAPI('');
            server
                .query({
                    query: searchMessages,
                    variables: {
                        term: searchTerm,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.message.searchMessages) {
                        const data = JSON.parse(res.data.message.searchMessages);
                        const results = data['messages'];
                        setSearchResults(results);
                        setIsSearching(false);
                    }
                })
                .catch((err) => {
                    console.log('Error', err);
                    setSearchResults([]);
                    setIsSearching(false);
                });
        })();
    }, [searchTerm, userId]);

    const sendImport = useCallback(() => {
        if (importType === 'image') {
            let img: any = importUrl;
            let text: any = '';
            let audio: any = '';
            let video: any = '';
            let file: any = '';

            const obj = { title: importTitle, type: 'jpg', url: importUrl };

            console.log('onSend', {
                title: importTitle,
                text,
                image: img,
                audio,
                video,
                file,
                saveCue: JSON.stringify(obj),
            });

            onSend([
                {
                    title: importTitle,
                    text,
                    image: img,
                    audio,
                    video,
                    file,
                    saveCue: JSON.stringify(obj),
                },
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
                    saveCue: JSON.stringify(obj),
                },
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
                        if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                            window.open(importUrl, '_blank');
                        } else {
                            Linking.openURL(importUrl);
                        }
                    }}
                    style={{
                        backgroundColor: '#007AFF',
                        borderRadius: 15,
                        marginLeft: 15,
                        marginTop: 6,
                    }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: 'white',
                            fontSize: 12,
                            borderWidth: 1,
                            borderColor: '#007AFF',
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            borderRadius: 15,
                            textTransform: 'uppercase',
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
                    saveCue: JSON.stringify(obj),
                },
            ]);
        }

        setImportType('');
        setImportUrl('');
        setUploadFileVisible(false);
    }, [importTitle, importUrl, importType]);

    /**
     *
     */
    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, userId);

            setImportUrl(url);
            setImportType('image');
            setImportTitle('Image');
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

            setImportType(audioVideo ? 'mp4' : res.type);
            setImportTitle(audioVideo ? 'Video' : res.name);
            setImportFileName(res.name);
            setImportUrl(res.url);
        },
        [userId]
    );

    /**
     * @description Opens a chat if "openChat" value set in AsyncStorage. Used to open a specific message from Search
     */
    useEffect(() => {
        (async () => {
            const openChat = await AsyncStorage.getItem('openChat');

            if (openChat && chats.length !== 0) {
                const parseChat: any = JSON.parse(openChat);

                await AsyncStorage.removeItem('openChat');

                if (parseChat.users && parseChat.users.length > 2) {
                    loadGroupChat(parseChat.users, parseChat._id);
                } else {
                    loadChat(parseChat.users[0] === userId ? parseChat.users[1] : parseChat.users[0], parseChat._id);
                }
            } else if (Dimensions.get('window').width >= 768 && chats.length !== 0 && !props.showDirectory) {
                // Set the first chat as default if not mobile view and not view directory
                const firstChat = chats[0];

                if (firstChat.users && firstChat.users.length > 2) {
                    loadGroupChat(firstChat.users, firstChat._id);
                } else {
                    loadChat(firstChat.users[0] === userId ? firstChat.users[1] : firstChat.users[0], firstChat._id);
                }
            }
        })();
    }, [chats, props.showDirectory]);

    /**
     * @description Loads all the users to show in Directory
     */
    const loadUsers = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        let server: any = null;
        let user: any = {};
        if (u) {
            user = JSON.parse(u);
            server = fetchAPI(user._id);
            setUserId(user._id);
            if (user.avatar) {
                setAvatar(user.avatar);
            } else {
                setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
            }

            if (user.zoomInfo) {
                setUserZoomInfo(user.zoomInfo);
            }
        } else {
            return;
        }
        setLoadingSubs(true);
        server
            .query({
                query: getAllUsers,
                variables: {
                    userId: user._id,
                },
            })
            .then((res: any) => {
                if (res.data.user && res.data.user.getAllUsers) {
                    const sortedUsers = res.data.user.getAllUsers.sort((a: any, b: any) => {
                        if (a.fullName < b.fullName) {
                            return -1;
                        }
                        if (a.fullName > b.fullName) {
                            return 1;
                        }
                        return 0;
                    });
                    setUsers(sortedUsers);
                }
                setLoadingSubs(false);
            })
            .catch((err: any) => {
                Alert('Unable to load subscribers.', 'Check connection.');
                setLoadingSubs(false);
            });
    }, []);

    /**
     * @description Loads all the chat threads for user
     */
    const loadChats = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');

        let server: any = null;
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
            server = fetchAPI(parsedUser._id);
        } else {
            return;
        }
        setLoadingChats(true);
        server
            .query({
                query: getChats,
                variables: {
                    userId: parsedUser._id,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.group.getChats) {
                    setChats(res.data.group.getChats.reverse());
                    props.hideNewChatButton(false);
                    setShowNewGroup(false);
                    setLoadingChats(false);
                }
            })
            .catch((err: any) => {
                console.log(err);
                setLoadingChats(false);
            });
    }, [userId]);

    /**
     * @description Used to open a group chat on Select
     */
    const loadGroupChat = useCallback(
        async (groupUsers, groupId) => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers(groupUsers);
                setGroupId(groupId);
                setIsChatGroup(true);
                setShowNewGroup(false);
                setViewGroup(false);

                // Set current chat name and image
                chats.map((c: any) => {
                    if (c._id === groupId) {
                        setGroupCreatedBy(c.createdBy);
                        setGroupUsers(c.userNames);
                        setEditGroupName(c.name);
                        setEditGroupImage(c.image ? c.image : undefined);
                        setChatName(c.name);
                        setChatImg(c.image ? c.image : 'https://cues-files.s3.amazonaws.com/images/default.png');
                    }
                });

                loadMessagesForChat(groupId, parsedUser._id);

                const server = fetchAPI(parsedUser._id);
                // mark as read here
                server
                    .mutate({
                        mutation: markMessagesAsRead,
                        variables: {
                            userId: parsedUser._id,
                            groupId,
                        },
                    })
                    .then((res) => console.log(res))
                    .catch((e) => console.log(e));
            }
        },
        [chats, userId]
    );

    const renderEndDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setInstantMeetingEnd(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowEndDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowEndDateAndroid(false);

                            const roundedValue = roundSeconds(currentDate);

                            setInstantMeetingEnd(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                            }}
                            onPress={() => {
                                setShowEndDateAndroid(true);
                                setShowEndTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                                marginLeft: 50,
                            }}
                            onPress={() => {
                                setShowEndDateAndroid(false);
                                setShowEndTimeAndroid(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setInstantMeetingEnd(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowEndTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowEndTimeAndroid(false);
                            setInstantMeetingEnd(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    /**
     * @description Used to create a group
     */
    const createGroup = useCallback(async () => {
        if (selected.length === 0) {
            alert('Select users.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: sendMessage,
                variables: {
                    users: [userId, ...selected],
                    message: 'New Group Created',
                    userId,
                    groupName: newGroupName,
                    groupImage: newGroupImage,
                },
            })
            .then((res) => {
                setSelected([]);
                setNewGroupName('');
                setNewGroupImage(undefined);

                if (res.data.message.createDirect) {
                    loadChats();
                } else {
                    Alert(unableToPostAlert, checkConnectionAlert);
                }
            })
            .catch((err) => {
                Alert(somethingWentWrongAlert, checkConnectionAlert);
            });
    }, [selected, userId, newGroupName, newGroupImage]);

    /**
     * @description Used to update Group Chat info and users in Inbox
     */
    const handleUpdateGroup = useCallback(async () => {
        if (chatUsers.length < 2) {
            Alert('Group must have at least 2 users');
        }

        if (editGroupName === '') {
            Alert('Enter group name');
            return;
        }

        const server = fetchAPI('');

        server
            .mutate({
                mutation: updateGroup,
                variables: {
                    groupId,
                    users: [userId, ...chatUsers],
                    groupName: editGroupName,
                    groupImage: editGroupImage,
                },
            })
            .then((res) => {
                setNewGroupName('');
                setNewGroupImage(undefined);
                setViewGroup(false);

                if (res.data.message.updateGroup) {
                    Alert('Updated group successfully.');
                    loadChats();
                } else {
                    Alert('Could not update group. Try again.');
                }
            })
            .catch((err) => {
                // setSendingThread(false)
                Alert('Could not update group. Try again.');
            });
    }, [groupId, editGroupName, editGroupImage, chatUsers]);

    /**
     * @description Handles sending of a message
     */
    const onSend = useCallback(
        async (messages = []) => {
            if (creatingMessage) return;

            const message =
                messages[0].file || messages[0].image || messages[0].audio || messages[0].video
                    ? messages[0].saveCue
                    : messages[0].text;
            const u: any = await AsyncStorage.getItem('user');
            if (!message || message === '' || !u) {
                return;
            }
            if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
                return;
            }
            const user = JSON.parse(u);

            messages[0] = {
                ...messages[0],
                user: {
                    _id: userId,
                },
            };

            setCreatingMessage(true);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: sendMessage,
                    variables: {
                        users: chatUsers,
                        message,
                        userId,
                        groupId,
                    },
                })
                .then(async (res) => {
                    if (res.data.message.createDirect) {
                        // Add a dummy _id to the message for now
                        messages[0] = {
                            ...messages[0],
                            _id: Math.random().toString(),
                        };

                        setChat((previousMessages) => GiftedChat.append(previousMessages, messages));

                        if (!groupId || groupId === '') {
                            const res = await server.query({
                                query: getGroup,
                                variables: {
                                    users: chatUsers,
                                },
                            });

                            console.log('New group id', res.data.message.getGroupId);

                            if (res && res.data.message.getGroupId && res.data.message.getGroupId !== '') {
                                setGroupId(res.data.message.getGroupId);
                            }
                        }

                        setCreatingMessage(false);
                    } else {
                        Alert(unableToPostAlert, checkConnectionAlert);
                        setCreatingMessage(false);
                    }
                })
                .catch((err) => {
                    // setSendingThread(false)
                    console.log('error', err);
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                    setCreatingMessage(false);
                });
        },
        [chatUsers, userId, groupId, creatingMessage]
    );

    /**
     * @description Loads chat on Select
     */
    const loadChat = useCallback(
        async (uId, groupId) => {
            setChat([]);
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers([parsedUser._id, uId]);
                setGroupId(groupId);
                setIsChatGroup(false);
                setShowNewGroup(false);
                setViewGroup(false);
                // Set current chat name and image
                chats.map((chat: any) => {
                    if (chat._id === groupId) {
                        // Group name or individual user name
                        let fName = '';

                        chat.userNames.map((user: any) => {
                            if (user._id !== parsedUser._id) {
                                fName = user.fullName;
                                return;
                            }
                        });

                        setChatName(fName);

                        // Find the chat avatar
                        const otherUser = chat.userNames.find((user: any) => {
                            return user._id !== parsedUser._id;
                        });

                        const chatImg =
                            chat.name && chat.name !== ''
                                ? chat.image
                                    ? chat.image
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                : otherUser.avatar && otherUser.avatar !== ''
                                ? otherUser.avatar
                                : 'https://cues-files.s3.amazonaws.com/images/default.png';

                        setChatImg(chatImg);
                    }
                });

                loadMessagesForChat(groupId, parsedUser._id);

                const server = fetchAPI(parsedUser._id);
                // mark chat as read here
                server
                    .mutate({
                        mutation: markMessagesAsRead,
                        variables: {
                            userId: parsedUser._id,
                            groupId,
                        },
                    })
                    .then((res) => {
                        // props.refreshUnreadMessagesCount()
                    })
                    .catch((e) => console.log(e));
            }
        },
        [chats, userId]
    );

    const loadMessagesForChat = useCallback((groupId: string, userId: string) => {
        const server = fetchAPI(userId);

        server
            .query({
                query: getMessages,
                variables: {
                    groupId,
                },
            })
            .then((res) => {
                const tempChat: any[] = [];
                res.data.message.getMessagesThread.map((msg: any) => {
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
                        } else if (type === 'meeting_link') {
                            text = (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                            color: msg.sentBy !== userId ? '#000' : '#fff',
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
                                        {obj.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        } else {
                            text = (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                            color: msg.sentBy !== userId ? '#000' : '#fff',
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
                        createdAt: msg.sentAt,
                        user: {
                            _id: msg.sentBy,
                            name: msg.fullName,
                            avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                        },
                    });
                });
                tempChat.reverse();
                setChat(tempChat);
                setShowChat(true);
                if (Dimensions.get('window').width < 768) {
                    props.hideNewChatButton(true);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    /**
     * Human readable elapsed or remaining time (example: 3 minutes ago)
     * @param  {Date|Number|String} date A Date object, timestamp or string parsable with Date.parse()
     * @param  {Date|Number|String} [nowDate] A Date object, timestamp or string parsable with Date.parse()
     * @param  {Intl.RelativeTimeFormat} [trf] A Intl formater
     * @return {string} Human readable elapsed or remaining time
     */
    function fromNow(date: Date, nowDate = Date.now(), rft = new RelativeTimeFormat('en', { numeric: 'auto' })) {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;
        const intervals = [
            { ge: YEAR, divisor: YEAR, unit: 'year' },
            { ge: MONTH, divisor: MONTH, unit: 'month' },
            { ge: WEEK, divisor: WEEK, unit: 'week' },
            { ge: DAY, divisor: DAY, unit: 'day' },
            { ge: HOUR, divisor: HOUR, unit: 'hour' },
            { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
            { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
            { ge: 0, divisor: 1, text: 'just now' },
        ];
        const now = typeof nowDate === 'object' ? nowDate.getTime() : new Date(nowDate).getTime();
        const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
        const diffAbs = Math.abs(diff);
        for (const interval of intervals) {
            if (diffAbs >= interval.ge) {
                const x = Math.round(Math.abs(diff) / interval.divisor);
                const isFuture = diff < 0;
                const outputTime = interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
                return outputTime
                    .replace(' ago', '')
                    .replace(' minutes', 'min')
                    .replace(' months', 'mth')
                    .replace(' days', 'd')
                    .replace(' weeks', 'wks')
                    .replace(' hours', 'h')
                    .replace(' seconds', 's');
            }
        }
    }

    /**
     * @description Loads a new chat with a user when selected from Directory
     */
    const loadNewChat = useCallback(
        async (uId) => {
            setChat([]);
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers([parsedUser._id, uId]);
                setIsChatGroup(false);
                setShowNewGroup(false);
                setViewGroup(false);
                // Set chat name and image

                // Group name or individual user name
                let fName = '';
                let img = 'https://cues-files.s3.amazonaws.com/images/default.png';

                users.map((user: any) => {
                    if (user._id === uId) {
                        fName = user.fullName;
                        if (user.avatar) {
                            img = user.avatar;
                        }
                        return;
                    }
                });

                setChatName(fName);
                setChatImg(img);
                setGroupId('');

                const server = fetchAPI('');

                // First load the group if there is one

                const res = await server.query({
                    query: getGroup,
                    variables: {
                        users: [parsedUser._id, uId],
                    },
                });

                // Completely new chat so no need to fetch messages
                if (!res || !res.data.message.getGroupId || res.data.message.getGroupId === '') {
                    setShowChat(true);

                    if (Dimensions.get('window').width < 768) {
                        props.hideNewChatButton(true);
                    }

                    return;
                }

                setGroupId(res.data.message.getGroupId);

                loadMessagesForChat(res.data.message.getGroupId, parsedUser._id);
            }
        },
        [users, userId]
    );

    // FUNCTIONS

    /**
     * @description Customize message bubble background color
     */
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#007AFF',
                    },
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
                            height: 60,
                        }}
                        source={{
                            uri: props.currentMessage.audio,
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
                            height: 250,
                        }}
                        source={{
                            uri: props.currentMessage.video,
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
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const startInstantMeeting = useCallback(() => {
        if (userZoomInfo || (meetingProvider && meetingProvider !== '')) {
            const current = new Date();
            setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
            setShowInstantMeeting(true);
        } else {
            Alert(
                'You must connect your account with Zoom to start a meeting.',
                'Would you like to proceed to setup?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        },
                    },
                    {
                        text: 'Yes',
                        onPress: () => {
                            // ZOOM OATH

                            const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                zoomRedirectUri
                            )}&state=${userId}`;

                            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                Linking.openURL(url);
                            } else {
                                window.open(url, '_blank');
                            }
                        },
                    },
                ]
            );
        }
    }, [userZoomInfo, meetingProvider]);

    const startInstantMeetingNewChat = useCallback(
        async (newUserId: string, newUsername: string) => {
            if (userZoomInfo) {
                const current = new Date();
                setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
                setShowInstantMeeting(true);
                setInstantMeetingNewChat(true);
                setInstantMeetingNewUserId(newUserId);
                setInstantMeetingNewChatUsername(newUsername);

                const server = fetchAPI('');

                // First load the group if there is one
                const res = await server.query({
                    query: getGroup,
                    variables: {
                        users: [newUserId, userId],
                    },
                });

                if (res && res.data.message.getGroupId && res.data.message.getGroupId === '') {
                    setInstantMeetingNewChatGroupId(res.data.message.getGroupId);
                }
            } else {
                Alert(
                    'You must connect your account with Zoom to start a meeting.',
                    'Would you like to proceed to setup?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Yes',
                            onPress: () => {
                                // ZOOM OATH

                                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                    zoomRedirectUri
                                )}&state=${userId}`;

                                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                    Linking.openURL(url);
                                } else {
                                    window.open(url, '_blank');
                                }
                            },
                        },
                    ]
                );
            }
        },
        [userZoomInfo, meetingProvider, userId]
    );

    const createInstantMeetingNewChat = useCallback(async () => {
        const startDate = new Date();

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeetingInbox,
                variables: {
                    userId,
                    topic: instantMeetingTitle,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId: instantMeetingNewChatGroupId,
                    users: [userId, instantMeetingNewUserId],
                },
            })
            .then((res) => {
                if (res.data && res.data.message.startInstantMeetingInbox !== 'error') {
                    loadNewChat(instantMeetingNewUserId);

                    setShowInstantMeeting(false);
                    setInstantMeetingTitle('');
                    setInstantMeetingEnd('');
                    setInstantMeetingNewChat(false);
                    setInstantMeetingNewUserId('');
                    setInstantMeetingNewChatGroupId('');
                    setInstantMeetingNewChatUsername('');

                    Linking.openURL(res.data.message.startInstantMeetingInbox);
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                Alert('Something went wrong.');
            });
    }, [instantMeetingNewUserId, userId, instantMeetingNewChatGroupId, instantMeetingTitle, instantMeetingEnd]);

    const createInstantMeeting = useCallback(() => {
        const startDate = new Date();

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeetingInbox,
                variables: {
                    userId,
                    topic: instantMeetingTitle,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId,
                    users: chatUsers,
                },
            })
            .then((res) => {
                if (res.data && res.data.message.startInstantMeetingInbox !== 'error') {
                    setShowInstantMeeting(false);
                    setInstantMeetingTitle('');
                    setInstantMeetingEnd('');

                    Linking.openURL(res.data.message.startInstantMeetingInbox);
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                Alert('Something went wrong.');
            });
    }, [chatUsers, userId, groupId, instantMeetingTitle, instantMeetingEnd]);

    /**
     * @description Displays time in email format similar to GMAIL
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    const renderStartInstantMeetingModal = () => {
        return (
            <ScrollView
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: 20,
                        marginVertical: 20,
                        maxWidth: 600,
                        alignSelf: 'center',
                        width: '100%',
                    }}
                >
                    <View style={{ width: '100%', maxWidth: 600, marginTop: 20 }}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Topic
                        </Text>
                        <View
                            style={{
                                marginTop: 10,
                                marginBottom: 10,
                            }}
                        >
                            <TextInput
                                style={{
                                    padding: 10,
                                    fontSize: 15,
                                    backgroundColor: '#ffffff',
                                    borderColor: '#cccccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                }}
                                value={instantMeetingTitle}
                                placeholder={''}
                                onChangeText={(val) => setInstantMeetingTitle(val)}
                                placeholderTextColor={'#1F1F1F'}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            width: '100%',
                            maxWidth: 600,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            {/* {PreferredLanguageText('end')} */}
                            End
                        </Text>
                        <View style={{ marginTop: 10, marginBottom: 10, marginLeft: 'auto' }}>
                            {renderEndDateTimePicker()}
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            if (instantMeetingNewChat) {
                                createInstantMeetingNewChat();
                            } else {
                                createInstantMeeting();
                            }
                        }}
                        style={{
                            backgroundColor: 'white',
                            marginTop: 20,
                            // width: "100%",
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            Start Meeting
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderImportModalContent = () => {
        if (importType && importUrl) {
            return (
                <View style={{ paddingHorizontal: 10 }}>
                    {importType === 'image' ? (
                        <Image
                            style={{
                                height: 200,
                                width: 250,
                                alignSelf: 'center',
                            }}
                            source={{ uri: importUrl }}
                        />
                    ) : importType === 'mp4' ? (
                        <View style={{ paddingVertical: 15 }}>
                            <Video
                                ref={audioRef}
                                style={{
                                    width: 250,
                                    height: 150,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: importUrl,
                                }}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                            />
                        </View>
                    ) : (
                        <Text
                            style={{
                                color: '#000',
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 30,
                                paddingBottom: 30,
                                paddingLeft: 20,
                            }}
                        >
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
                                backgroundColor: 'white',
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                                marginRight: 20,
                            }}
                            onPress={() => {
                                setImportTitle('');
                                setImportUrl('');
                                setImportType('');
                                setImportFileName('');
                                setUploadFileVisible(false);
                            }}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                alignSelf: 'center',
                            }}
                            onPress={() => {
                                sendImport();
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#fff',
                                    backgroundColor: '#000',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                Send
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={{ paddingHorizontal: '20%', paddingTop: 20 }}>
                <TouchableOpacity
                    style={{
                        marginTop: 10,
                        alignSelf: 'center',
                        borderColor: '#000',
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000',
                        paddingHorizontal: 24,
                        justifyContent: 'center',
                        overflow: 'hidden',
                        paddingVertical: 14,
                        width: '100%',
                    }}
                    onPress={() => {
                        uploadImageHandler(true);
                    }}
                >
                    <Ionicons name="camera-outline" size={16} color={'#fff'} />
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: 11,
                            fontFamily: 'inter',
                            textTransform: 'uppercase',
                            paddingLeft: 4,
                        }}
                    >
                        {' '}
                        Camera{' '}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        marginTop: 15,
                        alignSelf: 'center',
                        borderColor: '#fff',
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000',
                        paddingHorizontal: 24,
                        justifyContent: 'center',
                        overflow: 'hidden',
                        paddingVertical: 14,
                        width: '100%',
                    }}
                    onPress={() => {
                        uploadImageHandler(false);
                    }}
                >
                    <Ionicons name="image-outline" size={16} color={'#fff'} />
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: 11,
                            fontFamily: 'inter',
                            textTransform: 'uppercase',
                            paddingLeft: 4,
                        }}
                    >
                        {' '}
                        Gallery{' '}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        marginTop: 15,
                        alignSelf: 'center',
                        borderColor: '#fff',
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000',
                        paddingHorizontal: 24,
                        justifyContent: 'center',
                        overflow: 'hidden',
                        paddingVertical: 14,
                        width: '100%',
                    }}
                    onPress={() => {
                        uploadFileHandler(false);
                    }}
                >
                    <Ionicons name="document-outline" size={16} color={'#fff'} />
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: 11,
                            fontFamily: 'inter',
                            textTransform: 'uppercase',
                            paddingLeft: 4,
                        }}
                    >
                        {' '}
                        File{' '}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        marginTop: 15,
                        alignSelf: 'center',
                        borderColor: '#fff',
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000',
                        paddingHorizontal: 24,
                        justifyContent: 'center',
                        overflow: 'hidden',
                        paddingVertical: 14,
                        width: '100%',
                    }}
                    onPress={() => {
                        uploadFileHandler(true);
                    }}
                >
                    <Ionicons name="videocam-outline" size={16} color={'#fff'} />
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: 11,
                            fontFamily: 'inter',
                            textTransform: 'uppercase',
                            paddingLeft: 4,
                        }}
                    >
                        {' '}
                        Video{' '}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderChat = () => {
        return (
            <View
                style={{
                    width: '100%',
                    height:
                        Dimensions.get('window').width < 768
                            ? windowHeight - (Platform.OS === 'android' ? 60 : 150)
                            : Dimensions.get('window').height - 60 - 120,
                    zIndex: 5000,
                    borderColor: '#f2f2f2',
                }}
            >
                <GiftedChat
                    renderInputToolbar={(props) => {
                        return (
                            <InputToolbar
                                {...props}
                                containerStyle={{
                                    // backgroundColor: '#f8f8f8',
                                    paddingVertical: 5,
                                }}
                                placeholder="Message..."
                                textInputStyle={{
                                    // borderWidth: 1,
                                    // borderColor: '#ccc',
                                    padding: 10,
                                    paddingBottom: 15,
                                    borderRadius: 10,
                                }}
                            />
                        );
                    }}
                    bottomOffset={Platform.OS === 'ios' ? 40 : 0}
                    renderMessageAudio={renderMessageAudio}
                    renderMessageVideo={renderMessageVideo}
                    renderUsernameOnMessage={isChatGroup}
                    messages={chat}
                    onSend={(messages) => onSend(messages)}
                    user={{
                        _id: userId,
                        avatar,
                    }}
                    renderBubble={renderBubble}
                    renderSend={({ text, ...chatProps }) => {
                        return (
                            <Send
                                {...chatProps}
                                text={text}
                                disabled={text.trim() === '' || props.user.email === disableEmailId}
                            />
                        );
                    }}
                    renderActions={() => (
                        // <View>
                        <TouchableOpacity
                            style={{
                                paddingBottom: 12,
                            }}
                            onPress={() => {
                                Keyboard.dismiss();
                                setUploadFileVisible(true);
                            }}
                        >
                            <Text
                                style={{
                                    color: '#000',
                                    // lineHeight: 40,
                                    textAlign: 'right',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    textTransform: 'uppercase',
                                    paddingLeft: 10,
                                }}
                            >
                                <Ionicons name="add-outline" size={27} />
                            </Text>
                        </TouchableOpacity>
                        // </View>
                    )}
                />
            </View>
        );
    };

    const renderCreateGroup = () => {
        return (
            <View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode={'on-drag'}
                    style={{ paddingTop: 12 }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            marginTop: 25,
                            overflow: 'scroll',
                            marginBottom: 25,
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: '90%',
                                padding: 5,
                                maxWidth: 500,
                                minHeight: 200,
                                marginBottom: 15,
                            }}
                        >
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: newGroupImage
                                        ? newGroupImage
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    paddingTop: 15,
                                }}
                            >
                                {newGroupImage ? (
                                    <TouchableOpacity
                                        onPress={() => setNewGroupImage(undefined)}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}
                                    >
                                        <Text>
                                            <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <FileUpload
                                        onUpload={(u: any, t: any) => {
                                            setNewGroupImage(u);
                                        }}
                                    />
                                )}
                            </View>

                            {/* Add group name here */}
                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                        color: '#000000',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {PreferredLanguageText('name')}
                                </Text>
                                <TextInput
                                    value={newGroupName}
                                    placeholder={''}
                                    onChangeText={(val) => {
                                        setNewGroupName(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={true}
                                />
                            </View>

                            {/* Add group avatar here */}
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    marginBottom: 15,
                                }}
                            >
                                Users
                            </Text>
                            {/* <Select
                            themeVariant="light"
                            selectMultiple={true}
                            group={true}
                            groupLabel="&nbsp;"
                            inputClass="mobiscrollCustomMultiInput"
                            placeholder="Select"
                            touchUi={true}
                            value={selected}
                            data={options}
                            onChange={(val: any) => {
                                setSelected(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble'
                                },
                                medium: {
                                    touchUi: false
                                }
                            }}
                            minWidth={[60, 320]}
                        /> */}
                            <View
                                style={{
                                    height: isUpdateUsersDropdownOpen ? getDropdownHeight(options.length) : 50,
                                }}
                            >
                                <DropDownPicker
                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                    multiple={true}
                                    open={isUpdateUsersDropdownOpen}
                                    value={selected}
                                    items={options}
                                    setOpen={setIsUpdateUsersDropdownOpen}
                                    setValue={setSelected}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 0,
                                        height: 45,
                                        // elevation: !showFilterByChannelDropdown ? 0 : 2
                                    }}
                                    dropDownContainerStyle={{
                                        borderWidth: 0,
                                        // elevation: !showFilterByChannelDropdown ? 0 : 2
                                    }}
                                    containerStyle={{
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 1,
                                            height: 3,
                                        },
                                        shadowOpacity: !isUpdateUsersDropdownOpen ? 0 : 0.08,
                                        shadowRadius: 12,
                                    }}
                                    textStyle={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontFamily: 'overpass',
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => createGroup()}
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            CREATE
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    };

    const renderDirectory = () => {
        return (
            <View
                style={{
                    // flex: 1,
                    width: '100%',
                    borderRadius: 1,
                    borderColor: '#f2f2f2',
                    maxHeight: width < 1024 ? windowHeight - 104 - 90 : windowHeight - 52 - 110,
                    // overflow: 'hidden'
                }}
            >
                <ScrollView
                    contentContainerStyle={{
                        width: '100%',
                        borderRadius: 1,
                        marginTop: 10,
                        paddingHorizontal: 10,
                        marginBottom: 100,
                    }}
                    scrollEnabled={true}
                    indicatorStyle="black"
                >
                    {users.map((user: any, ind: any) => {
                        if (filterChannelId !== 'All') {
                            const id = user.channelIds
                                ? user.channelIds.find((id: any) => {
                                      return id === filterChannelId;
                                  })
                                : undefined;
                            if (!id) {
                                return null;
                            }
                        }
                        return (
                            <TouchableOpacity
                                key={ind.toString()}
                                onPress={() => {
                                    loadNewChat(user._id);
                                }}
                                style={{
                                    backgroundColor: '#fff',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderColor: '#f2f2f2',
                                    paddingVertical: 5,
                                    borderBottomWidth: ind === users.length - 1 ? 0 : 1,
                                    width: '100%',
                                }}
                            >
                                <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                    <Image
                                        style={{
                                            height: 50,
                                            width: 50,
                                            marginTop: 5,
                                            marginLeft: 5,
                                            marginBottom: 5,
                                            borderRadius: 75,
                                            alignSelf: 'center',
                                        }}
                                        source={{
                                            uri: user.avatar
                                                ? user.avatar
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#fff',
                                        paddingLeft: 5,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            padding: 5,
                                            fontFamily: 'inter',
                                            marginTop: 5,
                                        }}
                                        ellipsizeMode="tail"
                                    >
                                        {user.fullName}
                                    </Text>
                                    <Text style={{ fontSize: 12, padding: 5, fontWeight: 'bold' }} ellipsizeMode="tail">
                                        {user.email}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: '#fff',
                                        padding: 0,
                                        flexDirection: 'row',
                                        alignSelf: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode="tail">
                                        <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderChatsMobile = () => {
        return (
            <View style={{ backgroundColor: '#fff' }}>
                <View
                    style={{
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingBottom: 10,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <DefaultTextInput
                            value={searchTerm}
                            style={{
                                color: '#000',
                                backgroundColor: '#f2f2f2',
                                borderRadius: 15,
                                fontSize: 13,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                marginRight: 2,
                                width: '100%',
                            }}
                            // autoCompleteType={'xyz'}
                            placeholder={'Search'}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={'#000'}
                        />
                    </View>
                    {searchTerm === '' ? null : (
                        <View
                            style={{
                                marginLeft: Dimensions.get('window').width < 768 ? 10 : 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchTerm('');
                                    Keyboard.dismiss();
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    marginLeft: 'auto',
                                }}
                            >
                                <Ionicons name={'close-outline'} size={20} color={'#1f1f1f'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={'black'}
                    horizontal={false}
                    contentContainerStyle={{
                        borderColor: '#f2f2f2',
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        width: '100%',
                    }}
                >
                    {sortChatsByLastMessage.length === 0 ? (
                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#000',
                                    fontSize: 20,
                                    paddingVertical: 100,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                }}
                            >
                                Click on + to initiate a new chat.
                            </Text>
                        </View>
                    ) : null}
                    {isSearching ? null : searchTerm !== '' ? (
                        <View style={{}}>
                            {searchResults.length === 0 ? (
                                <View
                                    style={{
                                        padding: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'Inter',
                                            textAlign: 'center',
                                        }}
                                    >
                                        No Results
                                    </Text>
                                </View>
                            ) : null}
                            {searchResults.map((obj: any, ind: number) => {
                                let t = '';
                                let s = '';
                                let messageSenderName = '';
                                let messageSenderAvatar = '';
                                let createdAt = '';

                                const users = obj.groupId.users;

                                const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                if (obj.groupId && obj.groupId.name) {
                                    messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                    messageSenderAvatar = obj.groupId.image
                                        ? obj.groupId.image
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                } else if (sender) {
                                    messageSenderName = sender.fullName;
                                    messageSenderAvatar = sender.avatar
                                        ? sender.avatar
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                }

                                if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                    const o = JSON.parse(obj.message);
                                    t = o.title;
                                    s = o.type;
                                } else {
                                    const { title, subtitle } = htmlStringParser(obj.message);
                                    t = title;
                                    s = subtitle;
                                }

                                createdAt = obj.sentAt;

                                return (
                                    <TouchableOpacity
                                        key={ind.toString()}
                                        onPress={() => {
                                            if (obj.groupId.users.length > 2) {
                                                loadGroupChat(obj.groupId.users, obj.groupId._id);
                                            } else {
                                                loadChat(
                                                    obj.groupId.users[0] === userId
                                                        ? obj.groupId.users[1]
                                                        : obj.groupId.users[0],
                                                    obj.groupId._id
                                                );
                                            }
                                        }}
                                        style={{
                                            backgroundColor: groupId === obj.groupId._id ? '#f8f8f8' : '#fff',
                                            flexDirection: 'row',
                                            width: '100%',
                                            borderRadius: 5,
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            borderBottomWidth: ind === searchResults.length - 1 ? 0 : 1,
                                        }}
                                    >
                                        <View style={{ backgroundColor: 'none', padding: 5 }}>
                                            <Image
                                                style={{
                                                    height: 45,
                                                    width: 45,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                }}
                                                source={{ uri: messageSenderAvatar }}
                                            />
                                        </View>
                                        <View
                                            style={{
                                                flex: 1,
                                                backgroundColor: 'none',
                                                paddingLeft: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                    marginTop: 5,
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {messageSenderName}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 13, margin: 5, color: '#1f1f1f' }}
                                                ellipsizeMode="tail"
                                                numberOfLines={1}
                                            >
                                                {t}
                                            </Text>
                                            {/* <Highlighter
                                                searchWords={[searchTerm]}
                                                autoEscape={true}
                                                textToHighlight={t}
                                                highlightStyle={{
                                                    backgroundColor: '#ffd54f',
                                                    fontFamily: 'overpass',
                                                    fontSize: 14,
                                                    color: '#1f1f1f',
                                                }}
                                                unhighlightStyle={{
                                                    fontFamily: 'overpass',
                                                    fontSize: 14,
                                                    color: '#1f1f1f',
                                                }}
                                            /> */}
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 0,
                                                flexDirection: 'row',
                                                alignSelf: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    padding: 5,
                                                    lineHeight: 13,
                                                    color: '#000000',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {fromNow(new Date(createdAt))}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 14, padding: 5, lineHeight: 13 }}
                                                ellipsizeMode="tail"
                                            >
                                                <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        sortChatsByLastMessage.map((chat: any, index: number) => {
                            // Group name or individual user name
                            let fName = '';

                            if (chat.name && chat.name !== '') {
                                fName = chat.name;
                            } else {
                                chat.userNames.map((user: any) => {
                                    if (user._id !== userId) {
                                        fName = user.fullName;
                                        return;
                                    }
                                });
                            }

                            const otherUser = chat.userNames.find((user: any) => {
                                return user._id !== userId;
                            });

                            const chatImg =
                                chat.name && chat.name !== ''
                                    ? chat.image
                                        ? chat.image
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                    : otherUser && otherUser.avatar && otherUser.avatar !== ''
                                    ? otherUser.avatar
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png';

                            const { title } = htmlStringParser(chat.lastMessage);
                            return (
                                <TouchableOpacity
                                    key={index.toString()}
                                    onPress={() => {
                                        if (chat.userNames.length > 2) {
                                            loadGroupChat(chat.users, chat._id);
                                        } else {
                                            loadChat(
                                                chat.users[0] === userId ? chat.users[1] : chat.users[0],
                                                chat._id
                                            );
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#fff',
                                        flexDirection: 'row',
                                        borderColor: '#f2f2f2',
                                        paddingVertical: 5,
                                        borderBottomWidth: index === chats.length - 1 ? 0 : 1,
                                        width: '100%',
                                    }}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                        <Image
                                            style={{
                                                height: 45,
                                                width: 45,
                                                marginTop: 5,
                                                marginLeft: 5,
                                                marginBottom: 5,
                                                borderRadius: 75,
                                                alignSelf: 'center',
                                            }}
                                            source={{ uri: chatImg }}
                                        />
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'none',
                                            paddingLeft: 5,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                padding: 5,
                                                fontFamily: 'inter',
                                                marginTop: 5,
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {fName}
                                        </Text>
                                        <Text
                                            style={{ fontSize: 14, margin: 5 }}
                                            ellipsizeMode="tail"
                                            numberOfLines={2}
                                        >
                                            {title}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: '#fff',
                                            padding: 0,
                                            flexDirection: 'row',
                                            alignSelf: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {/* Unread notification badge */}
                                        {chat.unreadMessages > 0 ? (
                                            <View
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    marginRight: 5,
                                                    backgroundColor: '#007AFF',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontSize: 12 }}>
                                                    {chat.unreadMessages}
                                                </Text>
                                            </View>
                                        ) : null}

                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13,
                                                color: '#000000',
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {fromNow(new Date(chat.lastMessageTime))}
                                        </Text>
                                        <Text style={{ fontSize: 14, padding: 5, lineHeight: 13 }} ellipsizeMode="tail">
                                            <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderChatsLarge = () => {
        let filterSubscribedUsers = users;

        if (filterChannelId !== 'All') {
            filterSubscribedUsers = users.filter((user: any) => {
                const found = user.channelIds.find((id: any) => {
                    return id === filterChannelId;
                });

                if (found) return true;

                return false;
            });
        }

        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    height: windowHeight - 60 - 60,
                    maxHeight: windowHeight - 60 - 60,
                    // borderTopColor: '#f2f2f2',
                    // borderTopWidth: 1,
                }}
            >
                {/* Left pane will be for rendering active chats */}
                <View
                    style={{
                        width: '30%',
                        borderRightWidth: 1,
                        borderRightColor: '#f2f2f2',
                        height: '100%',
                    }}
                >
                    {props.showDirectory ? (
                        <View
                            style={{
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingVertical: 9,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        props.setShowDirectory(false);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Ionicons name="arrow-back-outline" size={32} color="#000" />
                                </TouchableOpacity>
                            </View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 'auto',
                                    paddingLeft: 5,
                                }}
                            >
                                <View>{renderDirectoryFilter()}</View>
                                <View
                                    style={
                                        {
                                            // paddingLeft: 5,
                                        }
                                    }
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowNewGroup(true);
                                            setShowChat(false);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 36,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#000',
                                                fontSize: 13,
                                                paddingLeft: 20,
                                                fontFamily: 'inter',
                                                borderRadius: 15,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            NEW GROUP
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingVertical: 13,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <DefaultTextInput
                                    value={searchTerm}
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#f2f2f2',
                                        borderRadius: 15,
                                        fontSize: 13,
                                        paddingVertical: 8,
                                        paddingHorizontal: 16,
                                        marginRight: 2,
                                        width: '100%',
                                    }}
                                    // autoCompleteType={'xyz'}
                                    placeholder={'Search'}
                                    onChangeText={(val) => setSearchTerm(val)}
                                    placeholderTextColor={'#000'}
                                />
                            </View>
                            <View
                                style={{
                                    marginLeft: 10,
                                    marginRight: 5,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        if (searchTerm !== '') {
                                            setSearchTerm('');
                                        } else {
                                            props.setShowDirectory(true);
                                            setShowChat(false);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <Ionicons
                                        name={searchTerm !== '' ? 'close-outline' : 'person-add-outline'}
                                        size={20}
                                        color={searchTerm !== '' ? '#1f1f1f' : '#000'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <ScrollView
                        style={{
                            width: '100%',
                        }}
                        contentContainerStyle={{
                            paddingRight: 10,
                            paddingVertical: 10,
                        }}
                        horizontal={false}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle={'black'}
                    >
                        {isSearching ? (
                            <View
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'white',
                                    marginVertical: 25,
                                }}
                            >
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : null}
                        {!isSearching && searchTerm === '' && sortChatsByLastMessage.length === 0 ? (
                            <View
                                style={{
                                    padding: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    No Messages.
                                </Text>
                            </View>
                        ) : null}

                        {isSearching ? null : searchTerm !== '' ? (
                            <View style={{}}>
                                {searchResults.length === 0 ? (
                                    <View
                                        style={{
                                            padding: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 20,
                                                fontFamily: 'Inter',
                                                textAlign: 'center',
                                            }}
                                        >
                                            No Results
                                        </Text>
                                    </View>
                                ) : null}
                                {searchResults.map((obj: any, ind: number) => {
                                    let t = '';
                                    let s = '';
                                    let messageSenderName = '';
                                    let messageSenderAvatar = '';
                                    let createdAt = '';

                                    const users = obj.groupId.users;

                                    const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                    if (obj.groupId && obj.groupId.name) {
                                        messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                        messageSenderAvatar = obj.groupId.image
                                            ? obj.groupId.image
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    } else if (sender) {
                                        messageSenderName = sender.fullName;
                                        messageSenderAvatar = sender.avatar
                                            ? sender.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    }

                                    if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                        const o = JSON.parse(obj.message);
                                        t = o.title;
                                        s = o.type;
                                    } else {
                                        const { title, subtitle } = htmlStringParser(obj.message);
                                        t = title;
                                        s = subtitle;
                                    }

                                    createdAt = obj.sentAt;

                                    return (
                                        <TouchableOpacity
                                            key={ind.toString()}
                                            onPress={() => {
                                                if (obj.groupId.users.length > 2) {
                                                    loadGroupChat(obj.groupId.users, obj.groupId._id);
                                                } else {
                                                    loadChat(
                                                        obj.groupId.users[0] === userId
                                                            ? obj.groupId.users[1]
                                                            : obj.groupId.users[0],
                                                        obj.groupId._id
                                                    );
                                                }
                                            }}
                                            style={{
                                                backgroundColor: groupId === obj.groupId._id ? '#f8f8f8' : '#fff',
                                                flexDirection: 'row',
                                                borderColor: '#f8f8f8',
                                                width: '100%',
                                                borderRadius: 5,
                                            }}
                                        >
                                            <View style={{ backgroundColor: 'none', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 45,
                                                        width: 45,
                                                        marginTop: 5,
                                                        marginLeft: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{ uri: messageSenderAvatar }}
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'none',
                                                    paddingLeft: 5,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'none',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 5,
                                                        padding: 5,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '90%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'inter',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {messageSenderName}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        alignItems: 'center',
                                                        backgroundColor: 'none',
                                                    }}
                                                >
                                                    <View style={{ width: '75%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{ fontSize: 13, margin: 5, color: '#1f1f1f' }}
                                                            ellipsizeMode="tail"
                                                            numberOfLines={1}
                                                        >
                                                            {t}
                                                        </Text>
                                                        {/* <Highlighter
                                                            searchWords={[searchTerm]}
                                                            autoEscape={true}
                                                            textToHighlight={t}
                                                            highlightStyle={{
                                                                backgroundColor: '#ffd54f',
                                                                fontFamily: 'overpass',
                                                                fontSize: 13,
                                                                color: '#1f1f1f',
                                                            }}
                                                            unhighlightStyle={{
                                                                fontFamily: 'overpass',
                                                                fontSize: 13,
                                                                color: '#1f1f1f',
                                                            }}
                                                        /> */}
                                                    </View>
                                                    <View style={{ width: '25%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                padding: 5,
                                                                lineHeight: 13,
                                                                color: '#1f1f1f',
                                                                textAlign: 'right',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fromNow(new Date(createdAt))}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : props.showDirectory ? (
                            <View
                                style={{
                                    width: '100%',
                                }}
                            >
                                {filterSubscribedUsers.length === 0 ? (
                                    <View
                                        style={{
                                            padding: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 20,
                                                fontFamily: 'Inter',
                                                textAlign: 'center',
                                            }}
                                        >
                                            No Users
                                        </Text>
                                    </View>
                                ) : null}
                                {filterSubscribedUsers.map((user: any, ind: any) => {
                                    return (
                                        <View
                                            style={{
                                                width: '100%',
                                                borderBottomWidth: ind === users.length - 1 ? 0 : 1,
                                                paddingVertical: 5,
                                                backgroundColor: '#fff',
                                                borderColor: '#f2f2f2',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                            key={ind.toString()}
                                        >
                                            <TouchableOpacity
                                                onPress={() => {
                                                    loadNewChat(user._id);
                                                }}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                                    <Image
                                                        style={{
                                                            height: 45,
                                                            width: 45,
                                                            marginTop: 5,
                                                            marginLeft: 5,
                                                            marginBottom: 5,
                                                            borderRadius: 75,
                                                        }}
                                                        source={{
                                                            uri: user.avatar
                                                                ? user.avatar
                                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                        }}
                                                    />
                                                </View>
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: '#fff',
                                                        paddingLeft: 0,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            padding: 5,
                                                            fontFamily: 'inter',
                                                            marginTop: 5,
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {user.fullName}
                                                    </Text>
                                                    <Text style={{ fontSize: 14, padding: 5 }} ellipsizeMode="tail">
                                                        {user.email}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>

                                            {meetingProvider && meetingProvider !== '' ? null : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        // loadNewChat(user._id);
                                                        startInstantMeetingNewChat(user._id, user.fullName);
                                                    }}
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        // marginRight: 10,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            padding: 0,
                                                            flexDirection: 'row',
                                                            alignSelf: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{ fontSize: 14, padding: 5, lineHeight: 13 }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            <Ionicons name="videocam-outline" size={18} color="#000" />
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                }}
                            >
                                {sortChatsByLastMessage.map((chat: any, index: number) => {
                                    // Group name or individual user name
                                    let fName = '';

                                    if (chat.name && chat.name !== '') {
                                        fName = chat.name;
                                    } else {
                                        chat.userNames.map((user: any) => {
                                            if (user._id !== userId) {
                                                fName = user.fullName;
                                                return;
                                            }
                                        });
                                    }

                                    const otherUser = chat.userNames.find((user: any) => {
                                        return user._id !== userId;
                                    });

                                    const chatImg =
                                        chat.name && chat.name !== ''
                                            ? chat.image
                                                ? chat.image
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                            : otherUser && otherUser.avatar && otherUser.avatar !== ''
                                            ? otherUser.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';

                                    const { title } = htmlStringParser(chat.lastMessage);

                                    return (
                                        <TouchableOpacity
                                            key={index.toString()}
                                            onPress={() => {
                                                if (chat.userNames.length > 2) {
                                                    loadGroupChat(chat.users, chat._id);
                                                } else {
                                                    loadChat(
                                                        chat.users[0] === userId ? chat.users[1] : chat.users[0],
                                                        chat._id
                                                    );
                                                }
                                            }}
                                            style={{
                                                backgroundColor: groupId === chat._id ? '#f8f8f8' : '#fff',
                                                flexDirection: 'row',
                                                borderColor: '#f8f8f8',
                                                width: '100%',
                                                borderRadius: 5,
                                            }}
                                        >
                                            <View style={{ backgroundColor: 'none', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 45,
                                                        width: 45,
                                                        marginTop: 5,
                                                        marginLeft: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{ uri: chatImg }}
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'none',
                                                    paddingLeft: 5,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'none',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 5,
                                                        padding: 5,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '90%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'inter',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fName}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={{
                                                            width: '10%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        {chat.unreadMessages > 0 ? (
                                                            <View
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#007AFF',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Text style={{ color: 'white', fontSize: 12 }}>
                                                                    {chat.unreadMessages}
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>

                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        alignItems: 'center',
                                                        backgroundColor: 'none',
                                                    }}
                                                >
                                                    <View style={{ width: '75%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{ fontSize: 13, margin: 5, color: '#1f1f1f' }}
                                                            ellipsizeMode="tail"
                                                            numberOfLines={1}
                                                        >
                                                            {title}
                                                        </Text>
                                                    </View>
                                                    <View style={{ width: '25%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                padding: 5,
                                                                lineHeight: 13,
                                                                color: '#1f1f1f',
                                                                textAlign: 'right',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fromNow(new Date(chat.lastMessageTime))}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Right pane is to view chat */}
                <View
                    style={{
                        width: '70%',
                        flexDirection: 'column',
                        height: '100%',
                    }}
                >
                    {showChat ? renderHeader() : null}
                    {showChat && !viewGroup && !showNewGroup ? renderChat() : null}
                    {showNewGroup ? renderCreateGroup() : null}
                    {viewGroup ? renderEditGroup() : null}
                </View>
            </View>
        );
    };

    const renderDirectoryFilter = () => {
        return props.showDirectory ? (
            <View style={{ backgroundColor: '#fff' }}>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#fff',
                        maxWidth: 150,
                    }}
                >
                    <Menu
                        style={
                            {
                                // paddingTop: 16,
                            }
                        }
                        onSelect={(channel: any) => {
                            setFilterChannelId(channel);
                        }}
                    >
                        <MenuTrigger>
                            <Text
                                style={{
                                    // fontFamily: "inter",
                                    fontSize: 15,
                                    color: '#000000',
                                }}
                            >
                                {filterChannelLabel ? filterChannelLabel : 'Filter Course'}
                                <Ionicons name="chevron-down-outline" size={15} />
                            </Text>
                        </MenuTrigger>
                        <MenuOptions
                            optionsContainerStyle={{
                                shadowOffset: {
                                    width: 2,
                                    height: 2,
                                },
                                shadowColor: '#000',
                                // overflow: 'hidden',
                                shadowOpacity: 0.07,
                                shadowRadius: 7,
                                padding: 10,
                                // borderWidth: 1,
                                // borderColor: '#CCC'
                            }}
                        >
                            {channelOptions.map((channel: any, ind: number) => {
                                return (
                                    <MenuOption key={ind.toString()} value={channel.value}>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontFamily: 'Inter',
                                                paddingBottom: 3,
                                            }}
                                        >
                                            {channel.label}
                                        </Text>
                                    </MenuOption>
                                );
                            })}
                        </MenuOptions>
                    </Menu>
                </View>
            </View>
        ) : null;
    };

    const renderHeader = () => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f2f2f2',
                    height: 60,
                }}
            >
                {(showNewGroup && Dimensions.get('window').width < 768) ||
                viewGroup ||
                (showChat && Dimensions.get('window').width < 768) ||
                (props.showDirectory && Dimensions.get('window').width < 768) ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (viewGroup) {
                                setViewGroup(false);
                                return;
                            } else {
                                if (!showChat) {
                                    props.setShowDirectory(false);
                                }
                                setShowChat(false);
                                props.hideNewChatButton(false);
                            }
                            setGroupId('');
                            setChatName('');
                            setChatImg('');
                            loadChats();
                            setIsChatGroup(false);

                            props.refreshUnreadInbox();
                        }}
                        style={{
                            paddingLeft: 5,
                            paddingRight: 15,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                            }}
                        >
                            <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {Dimensions.get('window').width < 768 && !showChat && !showNewGroup ? renderDirectoryFilter() : null}

                {showNewGroup ? (
                    <View
                        style={
                            {
                                // paddingBottom: 20,
                            }
                        }
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'Inter',
                                color: '#000000',
                            }}
                        >
                            New Group
                        </Text>
                    </View>
                ) : null}

                {showChat ? (
                    <View
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                        }}
                    >
                        <TouchableOpacity
                            disabled={!isChatGroup}
                            onPress={() => setViewGroup(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1,
                                width: '100%',
                            }}
                        >
                            <Image
                                style={{
                                    height: 36,
                                    width: 36,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{ uri: chatImg }}
                            />
                            <Text
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 16,
                                    paddingLeft: 20,
                                    flex: 1,
                                }}
                            >
                                {chatName}
                            </Text>
                        </TouchableOpacity>

                        {meetingProvider && meetingProvider !== '' ? null : (
                            <TouchableOpacity
                                onPress={() => startInstantMeeting()}
                                style={{
                                    marginLeft: 'auto',
                                }}
                            >
                                <Ionicons name="videocam-outline" size={21} color="#000" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}

                {showNewGroup || showChat || !props.showDirectory ? null : (
                    <View style={{ flexDirection: 'row', flex: 1 }} />
                )}

                {showNewGroup || showChat || !props.showDirectory ? null : (
                    <TouchableOpacity
                        onPress={() => {
                            setShowNewGroup(true);
                            setShowChat(false);
                        }}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 36,
                            marginTop: 10,
                            marginRight: 10,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#000',
                                fontSize: 15,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                textTransform: 'capitalize',
                            }}
                        >
                            New Group
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderEditGroup = () => {
        return (
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                {/*  */}
                {userId === groupCreatedBy ? (
                    <View>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingTop: 0,
                            }}
                        >
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: editGroupImage
                                        ? editGroupImage
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            {editGroupImage && editGroupImage !== '' ? (
                                <TouchableOpacity
                                    onPress={() => setEditGroupImage(undefined)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        marginLeft: 10,
                                    }}
                                >
                                    <Text>
                                        <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setUploadProfilePicVisible(true)}
                                    style={{
                                        position: 'absolute',
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#007AFF',
                                            lineHeight: 35,
                                            textAlign: 'right',
                                            fontSize: 12,
                                            fontFamily: 'overpass',
                                            textTransform: 'uppercase',
                                            backgroundColor: 'transparent',
                                        }}
                                    >
                                        <Ionicons name={'attach-outline'} size={30} color={'white'} />
                                        {/* {PreferredLanguageText('import')} */}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                }}
                            >
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={editGroupName}
                                placeholder={''}
                                onChangeText={(val) => {
                                    setEditGroupName(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                    </View>
                ) : null}

                <Text
                    style={{
                        fontSize: 14,
                        fontFamily: 'Inter',
                        color: '#000000',
                        fontWeight: 'bold',
                    }}
                >
                    Users
                </Text>

                {groupCreatedBy === userId ? (
                    <DropDownPicker
                        listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                        multiple={true}
                        open={isNewUsersDropdownOpen}
                        value={chatUsers}
                        items={options}
                        setOpen={setIsNewUsersDropdownOpen}
                        setValue={setChatUsers}
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 0,
                            height: 45,
                            // elevation: !showFilterByChannelDropdown ? 0 : 2
                        }}
                        dropDownContainerStyle={{
                            borderWidth: 0,
                            // elevation: !showFilterByChannelDropdown ? 0 : 2
                        }}
                        containerStyle={{
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 1,
                                height: 3,
                            },
                            shadowOpacity: !isNewUsersDropdownOpen ? 0 : 0.08,
                            shadowRadius: 12,
                        }}
                        textStyle={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            fontFamily: 'overpass',
                        }}
                    />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode={'on-drag'}
                        style={{ paddingTop: 12 }}
                    >
                        {groupUsers.map((user: any, ind: any) => {
                            return (
                                <View
                                    key={ind.toString()}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1,
                                        width: '100%',
                                        paddingVertical: 7,
                                        borderBottomWidth: ind === Object.keys(groupUsers).length - 1 ? 0 : 1,
                                        borderBottomColor: '#f2f2f2',
                                        paddingHorizontal: 10,
                                    }}
                                >
                                    <Image
                                        style={{
                                            height: 35,
                                            width: 35,
                                            borderRadius: 75,
                                            alignSelf: 'center',
                                        }}
                                        source={{
                                            uri: user.avatar
                                                ? user.avatar
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 16,
                                            paddingLeft: 20,
                                        }}
                                    >
                                        {user.fullName}
                                    </Text>
                                    {groupCreatedBy === user._id ? (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                paddingRight: 20,
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            Admin
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                {groupCreatedBy === userId ? (
                    <TouchableOpacity
                        onPress={() => handleUpdateGroup()}
                        style={{
                            alignSelf: 'center',
                            marginTop: 50,
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            UPDATE
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    const filterChannelLabel = channelOptions.find((channel: any) => channel.value === filterChannelId)?.label;

    // MAIN RETURN
    return (
        <View>
            {loadingSubs || loadingChats ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                    }}
                >
                    <ActivityIndicator color={'#1F1F1F'} />
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        height: windowHeight,
                        backgroundColor: 'white',
                    }}
                    key={1}
                >
                    {((showNewGroup || showChat || props.showDirectory) && Dimensions.get('window').width < 768) ||
                    Dimensions.get('window').width >= 768 ? null : (
                        <View
                            style={{
                                paddingHorizontal: 20,
                                paddingBottom: 20,
                                flexDirection: 'row',
                                paddingTop: 15,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 800 ? 22 : 26,
                                    color: '#000',
                                    fontFamily: 'Inter',
                                    fontWeight: 'bold',
                                }}
                            >
                                Your Messages
                            </Text>
                        </View>
                    )}

                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                        <View style={{ width: '100%', alignSelf: 'center' }}>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    width: '100%',
                                    marginBottom: width < 1024 ? 20 : 0,
                                }}
                            >
                                {Dimensions.get('window').width < 768 &&
                                (showChat || showNewGroup || viewGroup || props.showDirectory)
                                    ? renderHeader()
                                    : null}
                                {viewGroup && Dimensions.get('window').width < 768 ? renderEditGroup() : null}
                                {viewGroup && Dimensions.get('window').width < 768
                                    ? null
                                    : showChat && Dimensions.get('window').width < 768
                                    ? renderChat()
                                    : showNewGroup && Dimensions.get('window').width < 768
                                    ? renderCreateGroup()
                                    : props.showDirectory && Dimensions.get('window').width < 768
                                    ? renderDirectory()
                                    : Dimensions.get('window').width < 768
                                    ? renderChatsMobile()
                                    : renderChatsLarge()}
                            </View>
                        </View>
                    </View>
                    {uploadFileVisible && (
                        <BottomSheet
                            snapPoints={[
                                0,
                                importInboxModalHeight(Dimensions.get('window').width, Platform.OS, orientation),
                            ]}
                            close={() => {
                                setUploadFileVisible(false);
                            }}
                            isOpen={uploadFileVisible}
                            title={
                                importType
                                    ? 'Send ' + (importType !== 'image' && importType !== 'video' ? 'File' : importType)
                                    : 'Send Attachment'
                            }
                            renderContent={() => renderImportModalContent()}
                            header={false}
                        />
                    )}
                    {uploadFileVisible ? (
                        <Reanimated.View
                            style={{
                                alignItems: 'center',
                                backgroundColor: 'black',
                                opacity: 0.3,
                                height: '100%',
                                top: 0,
                                left: 0,
                                width: '100%',
                                position: 'absolute',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'transparent',
                                    width: '100%',
                                    height: '100%',
                                }}
                                onPress={() => setUploadFileVisible(false)}
                            ></TouchableOpacity>
                        </Reanimated.View>
                    ) : null}
                    {showInstantMeeting && (
                        <BottomSheet
                            snapPoints={[0, windowHeight]}
                            close={() => {
                                setShowInstantMeeting(false);
                                setInstantMeetingTitle('');
                                setInstantMeetingEnd('');
                                setInstantMeetingNewChat(false);
                                setInstantMeetingNewChatGroupId('');
                                setInstantMeetingNewUserId('');
                                setInstantMeetingNewChatUsername('');
                            }}
                            isOpen={showInstantMeeting}
                            title={`Start meeting with ${
                                instantMeetingNewChat ? instantMeetingNewChatUsername : chatName
                            }`}
                            renderContent={() => renderStartInstantMeetingModal()}
                            header={true}
                            callbackNode={fall}
                        />
                    )}
                    {showInstantMeeting ? (
                        <Reanimated.View
                            style={{
                                alignItems: 'center',
                                backgroundColor: 'black',
                                opacity: animatedShadowOpacity,
                                height: '100%',
                                top: 0,
                                left: 0,
                                width: '100%',
                                position: 'absolute',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'transparent',
                                    width: '100%',
                                    height: '100%',
                                }}
                                onPress={() => setShowInstantMeeting(false)}
                            ></TouchableOpacity>
                        </Reanimated.View>
                    ) : null}
                </View>
            )}
            {/* {uploadFileVisible && (
                <BottomSheet
                    snapPoints={[0, 400]}
                    close={() => {
                        setUploadFileVisible(false);
                    }}
                    isOpen={uploadFileVisible}
                    title={'Send Media/File'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10 }}>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#007AFF',
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
                                    backgroundColor: '#007AFF',
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
                                    Gallery{' '}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#007AFF',
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
                                    backgroundColor: '#007AFF',
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
                                    Audio/Video{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )} */}
        </View>
    );
};

export default Inbox;

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10,
        marginLeft: 10,
    },
});
