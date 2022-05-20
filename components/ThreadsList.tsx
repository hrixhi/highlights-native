import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    // ScrollView,
    Dimensions,
    Image,
    Platform,
    Linking,
    Keyboard,
    TextInput as DefaultTextInput,
    KeyboardAvoidingView,
    useWindowDimensions,
} from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

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
    getThreadCategories,
    searchThreads,
    updateThread,
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
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import FileUpload from './UploadFiles';
import { Video } from 'expo-av';
import NewPostModal from './NewPostModal';
import DropDownPicker from 'react-native-dropdown-picker';
import BottomSheet from './BottomSheet';
import { handleImageUpload } from '../helpers/ImageUpload';
import { handleFile } from '../helpers/FileUpload';
import Reanimated from 'react-native-reanimated';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { useOrientation } from '../hooks/useOrientation';
import { discussionThreadsHeight, selectedThreadHeight } from '../helpers/ComponentHeights';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';

import MathJax from 'react-native-mathjax';

// Editor
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import ColorPicker from './ColorPicker';
import { EmojiView, InsertLink } from './ToolbarComponents';
import { disableEmailId } from '../constants/zoomCredentials';
const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');
const formulaIcon = require('../assets/images/formulaIcon3.png');

const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // State
    const [loading, setLoading] = useState(false);
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads));
    const [threads] = useState<any[]>(unparsedThreads.reverse());
    const [showThreadCues, setShowThreadCues] = useState(false);
    const [filterChoice, setFilterChoice] = useState('All');
    const [threadId, setThreadId] = useState('');
    const [selectedThread, setSelectedThread] = useState<any>({});
    const [avatar, setAvatar] = useState('');
    const [threadCategories, setThreadCategories] = useState<any[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [userId, setUserId] = useState('');
    const [threadChat, setThreadChat] = useState<any[]>([]);
    const categories: any[] = [];
    const categoryObject: any = {};
    let filteredThreads: any[] = [];
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isReplyEditorFocused, setIsReplyEditorFocused] = useState(false);
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [anonymous, setAnonymous] = useState(false);
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    const [editDiscussionThreadId, setEditDiscussionThreadId] = useState('');
    const [editDiscussionThreadHtml, setEditDiscussionThreadHtml] = useState<any>({});
    const [editDiscussionThreadAttachments, setEditDiscussionThreadAttachments] = useState<any[]>([]);
    const [editDiscussionThreadAnonymous, setEditDiscussionThreadAnonymous] = useState(false);

    const [editorFocus, setEditorFocus] = useState(false);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
    const [foreColorVisible, setForeColorVisible] = useState(false);
    const [hiliteColor, setHiliteColor] = useState('#ffffff');
    const [foreColor, setForeColor] = useState('#000000');
    const [insertLinkVisible, setInsertLinkVisible] = useState(false);
    const [insertImageVisible, setInsertImageVisible] = useState(false);
    const RichText: any = useRef(null);
    const scrollRef: any = useRef();
    const [height, setHeight] = useState(100);

    const formulaWebviewRef: any = useRef(null);
    const [insertFormulaVisible, setInsertFormulaVisible] = useState(false);
    const [newPostEditorRef, setNewPostEditorRef] = useState<any>(null);

    const [formulaToInsert, setFormulaToInsert] = useState('');

    const { width: contentWidth } = useWindowDimensions();

    // ALERTS
    const unableToLoadThreadAlert = PreferredLanguageText('unableToLoadThread');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');

    const styles = styleObject();

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category';
        }
    });
    Object.keys(categoryObject).map((key) => {
        categories.push(key);
    });
    if (filterChoice === 'All') {
        filteredThreads = threads;
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice;
        });
    }
    let categoriesOptions = [
        {
            value: 'None',
            label: 'None',
        },
    ];
    categories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            label: category,
        });
    });
    let categoryChoices = [
        {
            value: 'All',
            label: 'All',
        },
    ];
    categories.map((cat: any) => {
        categoryChoices.push({
            value: cat,
            label: cat,
        });
    });

    // HOOKS

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
                    query: searchThreads,
                    variables: {
                        term: searchTerm,
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.thread.searchThreads) {
                        // Map unique search results
                        const threadIdSet = new Set();
                        const uniqueResults: any[] = [];

                        res.data.thread.searchThreads.map((thread: any) => {
                            if (thread.parentId) {
                                if (threadIdSet.has(thread.parentId)) {
                                    // Skip
                                } else {
                                    uniqueResults.push(thread);
                                    threadIdSet.add(thread.parentId);
                                }
                            } else {
                                if (threadIdSet.has(thread._id)) {
                                    // Skip
                                } else {
                                    uniqueResults.push(thread);
                                    threadIdSet.add(thread._id);
                                }
                            }
                        });

                        setSearchResults(uniqueResults);
                        setIsSearching(false);
                    }
                })
                .catch((err) => {
                    console.log('Error', err);
                    setSearchResults([]);
                    setIsSearching(false);
                });
        })();
    }, [searchTerm, props.channelId]);

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
            } else {
                if (threads.length > 0 && Dimensions.get('window').width > 768) {
                    loadCueDiscussions(threads[0]._id);
                }
            }
        })();
    }, [threads]);

    useEffect(() => {
        setHtml('');
        setAttachments([]);
        setIsReplyEditorFocused(false);
    }, [threadId]);

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
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setThreadCategories(res.data.thread.getChannelThreadCategories);
                }
            })
            .catch((err) => {});
    }, [props.channelId]);

    /**
     * @description Called from Modal for creating a new thread
     */
    const createNewThread = useCallback(
        async (title: string, message: any, category: any, isPrivate: boolean, anonymous: boolean) => {
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: createMessage,
                    variables: {
                        message,
                        userId,
                        channelId: props.channelId,
                        isPrivate,
                        anonymous,
                        cueId: 'NULL',
                        parentId: 'INIT',
                        category: category === 'None' ? '' : category,
                        title,
                    },
                })
                .then((res) => {
                    if (res.data.thread.writeMessage) {
                        props.setShowNewDiscussionPost(false);
                        props.reload();
                    } else {
                        Alert(checkConnectionAlert);
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        },
        [props.cueId, props.channelId, userId, isOwner]
    );

    const handleDeleteThread = useCallback(async (threadId: string, parentId?: string) => {
        Alert('Delete post?', '', [
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
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: deleteThread,
                            variables: {
                                threadId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.thread.delete) {
                                if (parentId) {
                                    loadCueDiscussions(parentId);
                                } else {
                                    //
                                    setSelectedThread('');
                                    props.reload();
                                }
                            } else {
                                Alert('Could not delete thread. Try again.');
                                return;
                            }
                        })
                        .catch((e) => {
                            Alert('Could not delete thread. Try again.');
                            return;
                        });
                },
            },
        ]);
    }, []);

    const handleUpdateThread = useCallback(async () => {
        if (!editDiscussionThreadId || isSendingReply) return;

        if (editDiscussionThreadHtml === '') {
            Alert('Thread content cannot be empty.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: updateThread,
                variables: {
                    threadId: editDiscussionThreadId,
                    message: JSON.stringify({
                        html: editDiscussionThreadHtml,
                        attachments: editDiscussionThreadAttachments,
                    }),
                    anonymous: editDiscussionThreadAnonymous,
                },
            })
            .then((res) => {
                if (res.data && res.data.thread.updateThread) {
                    setEditDiscussionThreadId('');
                    setEditDiscussionThreadHtml('');
                    setEditDiscussionThreadAttachments([]);
                    setEditDiscussionThreadAnonymous(false);
                    loadCueDiscussions(threadId);
                } else {
                    Alert('Could not update thread. Try again.');
                    return;
                }
            })
            .catch((e) => {
                Alert('Could not update thread. Try again.');
                return;
            });
    }, [
        editDiscussionThreadId,
        editDiscussionThreadHtml,
        editDiscussionThreadAttachments,
        editDiscussionThreadAnonymous,
        isSendingReply,
    ]);

    const handleReply = useCallback(async () => {
        if (html === '') {
            Alert('Reply cannot be empty');
            return;
        }

        setIsSendingReply(true);

        const server = fetchAPI('');
        server
            .mutate({
                mutation: createMessage,
                variables: {
                    message: JSON.stringify({
                        html,
                        attachments,
                    }),
                    userId,
                    channelId: props.channelId,
                    isPrivate: false,
                    anonymous,
                    cueId: 'NULL',
                    parentId: threadId,
                    category: '',
                },
            })
            .then((res) => {
                if (res.data.thread.writeMessage) {
                    setIsSendingReply(false);
                    setIsReplyEditorFocused(false);
                    setHtml('');
                    setAttachments([]);

                    // Refresh chat replies
                    loadCueDiscussions(threadId);
                } else {
                    setIsSendingReply(false);
                    Alert(checkConnectionAlert);
                }
            })
            .catch((err) => {
                setIsSendingReply(false);
                Alert(somethingWentWrongAlert, checkConnectionAlert);
            });
    }, [props.channelId, props.cueId, threadId, html, attachments, userId, anonymous]);

    /**
     * @description Load the entire the Thread using the thread ID
     */
    /**
     * @description Load the entire the Thread using the thread ID
     */
    const loadCueDiscussions = useCallback(async (threadId: string) => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            props.setShowNewDiscussionPost(false);
            const user = JSON.parse(u);
            setThreadId(threadId);
            setLoading(true);
            setShowThreadCues(true);

            if (Dimensions.get('window').width < 768) {
                props.setHideNavbarDiscussions(true);
            }
            const server = fetchAPI('');
            server
                .query({
                    query: getThreadWithReplies,
                    variables: {
                        threadId,
                    },
                })
                .then((res) => {
                    const tempChat: any[] = [];
                    res.data.thread.getThreadWithReplies.map((msg: any) => {
                        if (msg._id !== threadId) {
                            tempChat.push(msg);
                        } else {
                            setSelectedThread(msg);
                        }
                    });
                    // tempChat.reverse();
                    setThreadChat(tempChat);
                    setLoading(false);
                })
                .catch((err) => {
                    Alert(unableToLoadThreadAlert, checkConnectionAlert);
                    setLoading(false);
                });
            server
                .mutate({
                    mutation: markThreadsAsRead,
                    variables: {
                        userId: user._id,
                        threadId: threadId,
                    },
                })
                .then((res) => {
                    if (props.refreshUnreadDiscussionCount) {
                        props.refreshUnreadDiscussionCount();
                    }
                })
                .catch((e) => console.log(e));
        }
    }, []);

    useEffect(() => {
        // if (insertFormulaVisible) {
        //     props.setHideNavbarDiscussions(true);
        //     return;
        // }

        if (Dimensions.get('window').width >= 768) {
            props.setHideNavbarDiscussions(editorFocus);
        }

        // Insert Formula
        // if (editorFocus && formulaToInsert !== '' && RichText && RichText.current && RichText.current._focus) {
        //     console.log('Insert formula', formulaToInsert);

        //     console.log('Editor Focus', editorFocus);

        //     console.log('RichText.current', RichText.current);

        //     RichText.current?.focusContentEditor();

        //     RichText.current?.insertHTML('<div><br/></div>');

        //     RichText.current?.insertImage(formulaToInsert, 'width:300px');

        //     RichText.current?.insertHTML('<div><br/></div>');

        //     setFormulaToInsert('');
        // }
    }, [editorFocus, insertFormulaVisible, formulaToInsert, RichText]);

    // EDITOR METHODS

    useEffect(() => {
        changeForeColor(foreColor);
    }, [foreColor]);

    useEffect(() => {
        changeHiliteColor(hiliteColor);
    }, [hiliteColor]);

    const handleUploadFile = useCallback(async () => {
        const res = await handleFile(false, props.userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);

        setUploadResult(res.url, res.type, res.name);
    }, [RichText, RichText.current]);

    const handleUploadAudioVideo = useCallback(async () => {
        const res = await handleFile(true, props.userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);

        setUploadResult(res.url, res.type, res.name);
    }, [RichText, RichText.current, props.userId]);

    console.log('Attachments', attachments);

    const setUploadResult = useCallback(
        (uploadURL: string, uploadType: string, updloadName: string) => {
            const updatedAttachments: any[] = [...attachments];

            updatedAttachments.push({
                url: uploadURL,
                type: uploadType,
                name: updloadName,
            });

            setAttachments(updatedAttachments);
        },
        [attachments]
    );

    const changeForeColor = useCallback(
        (h: any) => {
            RichText.current?.setForeColor(h);

            setForeColorVisible(false);
        },
        [foreColor, RichText, RichText.current]
    );

    const changeHiliteColor = useCallback(
        (h: any) => {
            RichText.current?.setHiliteColor(h);

            setHiliteColorVisible(false);
        },
        [hiliteColor, RichText, RichText.current]
    );

    /**
     * @description Height for editor
     */
    const handleHeightChange = useCallback((h: any) => {
        setHeight(h);
    }, []);

    const handleCursorPosition = useCallback(
        (scrollY: any) => {
            // Positioning scroll bar
            scrollRef.current.scrollTo({ y: scrollY - 30, animated: true });
        },
        [scrollRef, scrollRef.current]
    );

    const insertEmoji = useCallback(
        (emoji) => {
            RichText.current?.insertText(emoji);
        },
        [RichText, RichText.current]
    );

    const handleEmoji = useCallback(() => {
        Keyboard.dismiss();
        // RichText.current?.blurContentEditor();
        setEmojiVisible(!emojiVisible);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, emojiVisible]);

    const handleHiliteColor = useCallback(() => {
        Keyboard.dismiss();
        setHiliteColorVisible(!hiliteColorVisible);
        setForeColorVisible(false);
        setEmojiVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, hiliteColorVisible]);

    const handleForeColor = useCallback(() => {
        Keyboard.dismiss();
        setForeColorVisible(!foreColorVisible);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, foreColorVisible]);

    const handleAddImage = useCallback(() => {
        setInsertImageVisible(true);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertLinkVisible(false);
    }, []);

    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, props.userId);

            RichText.current?.focusContentEditor();

            RichText.current?.insertHTML('<div><br/></div>');

            RichText.current?.insertImage(url, 'width:300px');

            RichText.current?.insertHTML('<div><br/></div>');

            setInsertImageVisible(false);
        },
        [RichText, RichText.current, props.userId]
    );

    const handleInsertLink = useCallback(() => {
        setInsertLinkVisible(true);
        setInsertImageVisible(false);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
    }, [RichText, RichText.current]);

    const onInsertLink = useCallback(
        (title, link) => {
            RichText.current?.insertLink(title, link);

            Keyboard.dismiss();
            setInsertLinkVisible(false);
        },
        [RichText, RichText.current]
    );

    const handleInsertFormula = useCallback(
        (editorRef: any) => {
            if (editorRef) {
                editorRef.current?.blurContentEditor();
                setNewPostEditorRef(editorRef);
            } else {
                RichText.current?.blurContentEditor();
                setNewPostEditorRef(editorRef);
            }
            // props.setInsertFormulaVisible(true);
            setInsertFormulaVisible(true);
            setEmojiVisible(false);
            setForeColorVisible(false);
            setHiliteColorVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);
            // setEditorFocus(false);
        },
        [RichText, RichText.current, Keyboard]
    );

    const insertFormula = useCallback(
        (state: any) => {
            const url = state.url;

            const splitURL = url.split('?');

            if (splitURL.length > 0) {
                const query = splitURL[1];

                const params = query.split('&');

                params.map((param: any) => {
                    if (param.includes('equationImageURL')) {
                        const parts = param.split('=');

                        const imageURL = decodeURIComponent(parts[1]);

                        // props.setInsertFormulaVisible(false);

                        let editorRef: any = {};

                        if (newPostEditorRef && newPostEditorRef?.current) {
                            editorRef = newPostEditorRef;
                        } else {
                            editorRef = RichText;
                        }

                        setInsertFormulaVisible(false);

                        setEditorFocus(true);

                        setFormulaToInsert(imageURL);

                        // editorRef.current?.focusContentEditor();
                    }
                });
            }
        },
        [RichText, newPostEditorRef]
    );

    const renderFormulaEditor = () => {
        return (
            <View
                style={{
                    zIndex: 50000000,
                    paddingTop: 15,
                    width: '100%',
                    height: '100%',
                }}
            >
                <WebView
                    source={{ uri: 'https://app.learnwithcues.com/equationEditor?showInsertButton=true' }}
                    // onLoadEnd={() => this.hideSpinner()}
                    // onMessage={onMessage.bind(this)}
                    ref={formulaWebviewRef}
                    startInLoadingState={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onLoadProgress={({ nativeEvent }) => {
                        console.log('nativeEvent', nativeEvent);
                        //your code goes here
                    }}
                    onNavigationStateChange={(state) => {
                        console.log('State', state);

                        insertFormula(state);

                        //your code goes here
                    }}
                />
            </View>
        );
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
     * Human readable elapsed or remaining time (example: 3 minutes ago)
     * @param  {Date|Number|String} date A Date object, timestamp or string parsable with Date.parse()
     * @param  {Date|Number|String} [nowDate] A Date object, timestamp or string parsable with Date.parse()
     * @param  {Intl.RelativeTimeFormat} [trf] A Intl formater
     * @return {string} Human readable elapsed or remaining time
     * @author github.com/victornpb
     * @see https://stackoverflow.com/a/67338038/938822
     */
    function fromNow(
        date: Date,
        replace: boolean,
        nowDate = Date.now(),
        rft = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    ) {
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
                if (replace) {
                    return outputTime
                        .replace(' ago', '')
                        .replace(' minutes', 'min')
                        .replace(' months', 'mth')
                        .replace(' days', 'd')
                        .replace(' weeks', 'wks')
                        .replace(' hours', 'h')
                        .replace(' seconds', 's');
                } else {
                    return outputTime;
                }
            }
        }
    }

    console.log('Editor Focus', editorFocus);

    const renderDiscussionEditor = () => {
        return (
            <View
                style={{
                    flex: 1,
                    zIndex: 5000000,
                }}
            >
                <View
                    style={{
                        borderWidth: editorFocus ? 0 : 1,
                        borderColor: '#ccc',
                        height: editorFocus ? '100%' : 200,
                    }}
                >
                    <RichToolbar
                        style={{
                            borderColor: '#f2f2f2',
                            borderBottomWidth: 1,
                            backgroundColor: '#fff',
                            display: editorFocus ? 'flex' : 'none',
                            maxHeight: 40,
                            height: 40,
                        }}
                        flatContainerStyle={{
                            paddingHorizontal: 12,
                        }}
                        editor={RichText}
                        disabled={false}
                        selectedIconTint={'#007AFF'}
                        disabledIconTint={'#bfbfbf'}
                        actions={[
                            actions.keyboard,
                            'insertFile',
                            actions.insertImage,
                            actions.insertVideo,
                            actions.insertLink,
                            // 'insertFormula',
                            actions.insertBulletsList,
                            actions.insertOrderedList,
                            actions.checkboxList,
                            actions.alignLeft,
                            actions.alignCenter,
                            actions.alignRight,
                            actions.blockquote,
                            actions.code,
                            actions.line,
                            // 'insertEmoji'
                        ]}
                        iconMap={{
                            [actions.keyboard]: ({ tintColor }) => (
                                <Text style={[styles.tib, { color: 'green', fontSize: 20 }]}>✓</Text>
                            ),
                            insertFile: importIcon,
                            insertEmoji: emojiIcon,
                            // insertFormula: formulaIcon,
                        }}
                        insertEmoji={handleEmoji}
                        insertFile={handleUploadFile}
                        insertVideo={handleUploadAudioVideo}
                        onPressAddImage={handleAddImage}
                        onInsertLink={handleInsertLink}
                        // insertFormula={handleInsertFormula}
                    />
                    <ScrollView
                        horizontal={false}
                        style={{
                            backgroundColor: '#fff',
                            // maxHeight: editorFocus ? 340 : 'auto',
                            height: '100%',
                        }}
                        keyboardDismissMode={'none'}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={20}
                        indicatorStyle={'black'}
                        showsHorizontalScrollIndicator={true}
                        persistentScrollbar={true}
                        ref={scrollRef}
                    >
                        <RichEditor
                            initialFocus={editorFocus}
                            ref={RichText}
                            useContainer={true}
                            style={{
                                width: '100%',
                                // paddingHorizontal: 10,
                                backgroundColor: '#fff',
                                // borderRadius: 15,
                                display: 'flex',
                                // borderTopWidth: 1,
                                // borderColor: '#f2f2f2',
                                flex: 1,
                                height: '100%',
                                // minHeight: 200,
                            }}
                            editorStyle={{
                                backgroundColor: '#fff',
                                placeholderColor: '#a2a2ac',
                                color: '#2f2f3c',
                                cssText: 'Overpass',
                                contentCSSText: 'font-size: 16px; min-height: 200px; font-family: Overpass;',
                            }}
                            initialContentHTML={editDiscussionThreadId !== '' ? editDiscussionThreadHtml : html}
                            initialHeight={200}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder={isReplyEditorFocused ? 'Reply' : 'Content'}
                            onChange={(text) => {
                                const modifedText = text.split('&amp;').join('&');

                                if (editDiscussionThreadId !== '') {
                                    setEditDiscussionThreadHtml(modifedText);
                                } else {
                                    setHtml(modifedText);
                                }
                            }}
                            onHeightChange={handleHeightChange}
                            onFocus={() => {
                                setEditorFocus(true);
                            }}
                            onBlur={() => {
                                setEditorFocus(false);
                            }}
                            allowFileAccess={true}
                            allowFileAccessFromFileURLs={true}
                            allowUniversalAccessFromFileURLs={true}
                            allowsFullscreenVideo={true}
                            allowsInlineMediaPlayback={true}
                            allowsLinkPreview={true}
                            allowsBackForwardNavigationGestures={true}
                            onCursorPosition={handleCursorPosition}
                        />
                    </ScrollView>

                    <RichToolbar
                        style={{
                            borderColor: '#f2f2f2',
                            borderTopWidth: 1,
                            backgroundColor: '#fff',
                            display: editorFocus ? 'flex' : 'none',
                        }}
                        flatContainerStyle={{
                            paddingHorizontal: 12,
                        }}
                        editor={RichText}
                        disabled={false}
                        // iconTint={color}
                        selectedIconTint={'#007AFF'}
                        disabledIconTint={'#bfbfbf'}
                        // onPressAddImage={that.onPressAddImage}
                        // iconSize={24}
                        // iconGap={10}
                        actions={[
                            actions.undo,
                            actions.redo,
                            actions.setBold,
                            actions.setItalic,
                            actions.setUnderline,
                            actions.setStrikethrough,
                            actions.heading1,
                            actions.heading3,
                            actions.setParagraph,
                            actions.foreColor,
                            actions.hiliteColor,
                            actions.setSuperscript,
                            actions.setSubscript,
                            // actions.removeFormat
                            // Insert stuff
                            // 'insertHTML',
                            // 'fontSize'
                        ]} // default defaultActions
                        iconMap={{
                            [actions.heading1]: ({ tintColor }) => (
                                <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                    H1
                                </Text>
                            ),
                            [actions.heading3]: ({ tintColor }) => (
                                <Text
                                    style={[
                                        styles.tib,
                                        {
                                            color: tintColor,
                                            fontSize: 19,
                                            paddingBottom: 1,
                                        },
                                    ]}
                                >
                                    H3
                                </Text>
                            ),
                            [actions.setParagraph]: ({ tintColor }) => (
                                <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                    p
                                </Text>
                            ),
                            [actions.foreColor]: ({ tintColor }) => (
                                <Text
                                    style={{
                                        fontSize: 19,
                                        fontWeight: 'bold',
                                        color: 'red',
                                    }}
                                >
                                    A
                                </Text>
                            ),
                            [actions.hiliteColor]: ({ tintColor }) => (
                                <Text
                                    style={{
                                        color: 'black',
                                        fontSize: 19,
                                        backgroundColor: '#ffc701',
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    H
                                </Text>
                            ),
                        }}
                        hiliteColor={handleHiliteColor}
                        foreColor={handleForeColor}
                        // removeFormat={handleRemoveFormat}
                    />

                    {/* </KeyboardAvoidingView> */}
                </View>
                {/* Render attachments */}
                {((editDiscussionThreadId !== '' && editDiscussionThreadAttachments.length > 0) ||
                    (!editDiscussionThreadId && attachments.length > 0)) &&
                !editorFocus ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            maxWidth: 500,
                            marginVertical: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'Overpass',
                                marginBottom: 20,
                            }}
                        >
                            Attachments
                        </Text>
                        {(editDiscussionThreadId !== '' ? editDiscussionThreadAttachments : attachments).map(
                            (file: any, ind: number) => {
                                return (
                                    <View
                                        key={ind.toString()}
                                        style={{
                                            width: '100%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: '#cccccc',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 1,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name="attach-outline" size={22} color="#000" />
                                        <Text
                                            style={{
                                                paddingLeft: 10,
                                                fontSize: 15,
                                                fontFamily: 'Overpass',
                                                maxWidth: '80%',
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            onPress={() => {
                                                const updatedAttachments: any[] = [...attachments];
                                                updatedAttachments.splice(ind, 1);
                                                setAttachments(updatedAttachments);
                                            }}
                                        >
                                            <Text>
                                                <Ionicons
                                                    name="close-outline"
                                                    style={{
                                                        marginLeft: 'auto',
                                                    }}
                                                    size={19}
                                                />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }
                        )}
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Renders selected thread with GiftedChat component
     */
    const renderSelectedThread = () => {
        let selectedThreadTitle = '';
        let selectedThreadContent = '';
        let selectedThreadAttachments = [];

        if (
            selectedThread.message &&
            selectedThread.message[0] === '{' &&
            selectedThread.message[selectedThread.message.length - 1] === '}' &&
            selectedThread.title
        ) {
            // New version
            const obj = JSON.parse(selectedThread.message);
            selectedThreadContent = obj.html;
            selectedThreadAttachments = obj.attachments;
            selectedThreadTitle = selectedThread.title;
        } else if (
            selectedThread.message &&
            selectedThread.message[0] === '{' &&
            selectedThread.message[selectedThread.message.length - 1] === '}' &&
            !selectedThread.title
        ) {
            // New version
            const obj = JSON.parse(selectedThread.message);
            selectedThreadTitle = obj.title;
        } else {
            const { title: t, subtitle: s } = htmlStringParser(selectedThread.message);

            selectedThreadTitle = t;
            selectedThreadContent = s;
        }

        return (
            <ScrollView
                style={{
                    maxHeight: Dimensions.get('window').height - 50,
                }}
                contentContainerStyle={{
                    width: '100%',
                    borderRadius: 1,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 15,
                    paddingBottom: 100,
                }}
            >
                {/* Render the selected thread main */}
                <View
                    style={{
                        paddingTop: 10,
                        paddingBottom: 20,
                        marginBottom: 20,
                        paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f2f2f2',
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                paddingTop: 10,
                                paddingBottom: 20,
                                fontFamily: 'Inter',
                            }}
                        >
                            {selectedThreadTitle}
                        </Text>
                    </View>
                    {/*  */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 5,
                            marginBottom: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Image
                                style={{
                                    height: 50,
                                    width: 50,
                                    marginBottom: 5,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri:
                                        selectedThread.avatar &&
                                        (!selectedThread.anonymous || selectedThread.userId === userId || isOwner)
                                            ? selectedThread.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            <View
                                style={{
                                    marginLeft: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            color: selectedThread.userId === userId ? '#007AFF' : '#000',
                                        }}
                                    >
                                        {!selectedThread.anonymous || selectedThread.userId === userId || isOwner
                                            ? selectedThread.fullName
                                            : 'Anonymous'}
                                    </Text>
                                    {/*  */}
                                    {selectedThread.edited ? (
                                        <View
                                            style={{
                                                backgroundColor: '#e6f0ff',
                                                padding: 4,
                                                marginLeft: 15,
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#007AFF',
                                                    fontSize: 11,
                                                }}
                                            >
                                                Edited
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        marginTop: 7,
                                        color: '#1f1f1f',
                                    }}
                                >
                                    {fromNow(new Date(selectedThread.time), false)}{' '}
                                    {selectedThread.category ? ' in ' + selectedThread.category : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Render Views and edit button */}
                        <View
                            style={{
                                marginLeft: 'auto',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                }}
                            >
                                {selectedThread.views} {selectedThread.views === 1 ? 'view' : 'views'}
                            </Text>
                            {userId === selectedThread.userId && !editDiscussionThreadId && !isReplyEditorFocused ? (
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 20,
                                    }}
                                    onPress={() => {
                                        setEditDiscussionThreadId(selectedThread._id);
                                        const parse = JSON.parse(selectedThread.message);
                                        setEditDiscussionThreadHtml(parse.html ? parse.html : '');
                                        setEditDiscussionThreadAttachments(parse.attachments ? parse.attachments : []);
                                        setEditDiscussionThreadAnonymous(selectedThread.anonymous);
                                        setEditorFocus(true);
                                    }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text>
                                        <Ionicons name={'pencil-outline'} size={16} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {isOwner ? (
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 20,
                                    }}
                                    onPress={() => {
                                        handleDeleteThread(selectedThread._id, undefined);
                                    }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text>
                                        <Ionicons name={'trash-outline'} size={18} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                    {/* Content */}

                    {editDiscussionThreadId !== '' && editDiscussionThreadId === selectedThread._id ? (
                        <View
                            style={{
                                flexDirection: 'column',
                            }}
                        >
                            {editorFocus ? null : renderDiscussionEditor()}

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 20,
                                }}
                            >
                                {isOwner ? null : (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                marginRight: 7,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={anonymous}
                                                onChange={(e: any) => {
                                                    setAnonymous(!anonymous);
                                                }}
                                            />
                                        </View>
                                        <Text style={{ fontSize: 15, fontFamily: 'Inter' }}>Anonymous</Text>
                                    </View>
                                )}

                                {/* Buttons */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: 'white',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            marginRight: 20,
                                        }}
                                        onPress={() => {
                                            Alert('Discard reply?', '', [
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
                                                        setEditDiscussionThreadAnonymous(false);
                                                        setEditDiscussionThreadId('');
                                                        setEditDiscussionThreadHtml('');
                                                        setEditDiscussionThreadAttachments([]);
                                                    },
                                                },
                                            ]);
                                        }}
                                        disabled={isSendingReply}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: '#000',
                                                fontSize: 15,
                                                backgroundColor: 'white',
                                                fontFamily: 'inter',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            // marginTop: 15,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}
                                        onPress={() => {
                                            handleUpdateThread();
                                        }}
                                        disabled={isSendingReply || props.user.email === disableEmailId}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: '#000',
                                                fontSize: 15,
                                                fontFamily: 'inter',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {isSendingReply ? 'Updating...' : 'Update'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <RenderHtml
                            contentWidth={contentWidth}
                            source={{
                                html: selectedThreadContent,
                            }}
                            defaultTextProps={{
                                selectable: false,
                            }}
                            // renderers={renderers}
                            renderers={{
                                img: ({ TDefaultRenderer, ...rendererProps }) => {
                                    const node = rendererProps.tnode.domNode;

                                    const attribs = node.attribs;

                                    if (attribs && attribs['data-eq']) {
                                        const formula = '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                        console.log('Formula', formula);

                                        return (
                                            <View
                                                style={{
                                                    minWidth: 100,
                                                }}
                                            >
                                                <MathJax
                                                    html={formula}
                                                    mathJaxOptions={{
                                                        messageStyle: 'none',
                                                        extensions: ['tex2jax.js', 'MathMenu.js', 'MathZoom.js'],
                                                        jax: ['input/TeX', 'output/HTML-CSS'],
                                                        tex2jax: {
                                                            inlineMath: [
                                                                ['$', '$'],
                                                                ['\\(', '\\)'],
                                                            ],
                                                            displayMath: [
                                                                ['$$', '$$'],
                                                                ['\\[', '\\]'],
                                                            ],
                                                            processEscapes: false,
                                                        },
                                                        SVG: {
                                                            useGlobalCache: false,
                                                        },
                                                        TeX: {
                                                            extensions: [
                                                                'AMSmath.js',
                                                                'AMSsymbols.js',
                                                                'noErrors.js',
                                                                'noUndefined.js',
                                                                'AMSmath.js',
                                                                'AMSsymbols.js',
                                                                'autoload-all.js',
                                                            ],
                                                        },
                                                    }}
                                                />
                                            </View>
                                        );
                                    }

                                    return (
                                        <Image
                                            source={{
                                                uri: attribs.src,
                                            }}
                                            style={{
                                                maxWidth: Dimensions.get('window').width,
                                                width: 300,
                                                height: 300,
                                                flex: 1,
                                            }}
                                            resizeMode={'contain'}
                                        />
                                    );
                                },
                            }}
                            tagsStyles={{
                                p: {
                                    lineHeight: 50,
                                    fontSize: 16,
                                },
                            }}
                        />
                    )}
                    {/* Attachments */}
                    {/* Render attachments */}
                    {editDiscussionThreadId !== '' ? null : selectedThreadAttachments.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                width: '100%',
                                maxWidth: 500,
                                marginVertical: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Overpass',
                                    marginBottom: 20,
                                }}
                            >
                                Attachments
                            </Text>
                            {selectedThreadAttachments.map((file: any, ind: number) => {
                                return (
                                    <View
                                        key={ind.toString()}
                                        style={{
                                            width: '100%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: '#cccccc',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 2,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name="attach-outline" size={22} color="#000" />
                                        <Text
                                            style={{
                                                paddingLeft: 10,
                                                fontSize: 15,
                                                fontFamily: 'Overpass',
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            onPress={() => {
                                                if (
                                                    Platform.OS === 'web' ||
                                                    Platform.OS === 'macos' ||
                                                    Platform.OS === 'windows'
                                                ) {
                                                    window.open(file.url, '_blank');
                                                } else {
                                                    Linking.openURL(file.url);
                                                }
                                            }}
                                        >
                                            <Text>
                                                <Ionicons
                                                    name="download-outline"
                                                    style={{
                                                        marginLeft: 'auto',
                                                    }}
                                                    size={19}
                                                />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}
                </View>

                {editDiscussionThreadId !== '' ? null : isReplyEditorFocused ? (
                    <View
                        style={{
                            flexDirection: 'row',
                        }}
                    >
                        <View>
                            <Image
                                style={{
                                    height: 35,
                                    width: 35,
                                    marginTop: 5,
                                    marginLeft: 5,
                                    marginBottom: 5,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                    marginRight: 10,
                                }}
                                source={{
                                    uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                        </View>
                        {editorFocus ? null : renderDiscussionEditor()}
                    </View>
                ) : (
                    <DefaultTextInput
                        placeholder="Leave a reply"
                        onFocus={() => {
                            setEditorFocus(true);
                            setIsReplyEditorFocused(true);
                        }}
                        value=""
                        style={{
                            padding: 8,
                            borderRadius: 2,
                            borderWidth: 1,
                            borderColor: '#cccccc',
                        }}
                        placeholderTextColor="#000"
                    />
                )}
                {/* Comments */}
                {isReplyEditorFocused ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 20,
                        }}
                    >
                        {isOwner ? null : (
                            <View
                                style={{
                                    marginLeft: 50,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#fff',
                                        marginRight: 7,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={anonymous}
                                        onChange={(e: any) => {
                                            setAnonymous(!anonymous);
                                        }}
                                    />
                                </View>
                                <Text style={{ fontSize: 15, fontFamily: 'Inter' }}>Anonymous</Text>
                            </View>
                        )}
                        {/* Buttons */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: 'auto',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginRight: 20,
                                }}
                                onPress={() => {
                                    Alert('Discard reply?', '', [
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
                                                setIsReplyEditorFocused(false);
                                                setHtml('');
                                                setAttachments([]);
                                            },
                                        },
                                    ]);
                                }}
                                disabled={isSendingReply}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 15,
                                        backgroundColor: 'white',
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    // marginTop: 15,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                }}
                                onPress={() => {
                                    handleReply();
                                }}
                                disabled={isSendingReply || props.user.email === disableEmailId}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {isSendingReply ? 'Sending...' : 'Send'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {/* Render all replies here */}

                <View
                    style={{
                        flex: 1,
                    }}
                >
                    {threadChat.map((thread: any, ind: number) => {
                        let replyThreadContent = '';
                        let replyThreadAttachments = [];

                        if (
                            thread.message &&
                            thread.message[0] === '{' &&
                            thread.message[thread.message.length - 1] === '}'
                        ) {
                            // New version
                            const obj = JSON.parse(thread.message);
                            replyThreadContent = obj.html || '';
                            replyThreadAttachments = obj.attachments;
                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(thread.message);
                            replyThreadContent = s;
                        }

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'column',
                                    width: '100%',
                                    paddingVertical: 20,
                                    borderBottomColor: '#f2f2f2',
                                    borderBottomWidth: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}
                                >
                                    <Image
                                        style={{
                                            height: 35,
                                            width: 35,
                                            marginTop: 5,
                                            marginLeft: 5,
                                            marginBottom: 5,
                                            borderRadius: 75,
                                            alignSelf: 'center',
                                        }}
                                        source={{
                                            uri:
                                                thread.avatar &&
                                                (!thread.anonymous || thread.userId === userId || isOwner)
                                                    ? thread.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            paddingLeft: 15,
                                            color: thread.userId === userId ? '#007AFF' : '#000',
                                        }}
                                    >
                                        {!thread.anonymous || thread.userId === userId || isOwner
                                            ? thread.fullName
                                            : 'Anonymous'}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            paddingLeft: 10,
                                            color: '#1f1f1f',
                                        }}
                                    >
                                        {fromNow(thread.time, true)}
                                    </Text>
                                    {thread.edited ? (
                                        <View
                                            style={{
                                                backgroundColor: '#e6f0ff',
                                                padding: 4,
                                                marginLeft: 15,
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#007AFF',
                                                    fontSize: 11,
                                                }}
                                            >
                                                Edited
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        {userId === thread.userId &&
                                        !editDiscussionThreadId &&
                                        !isReplyEditorFocused ? (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditDiscussionThreadId(thread._id);
                                                    const parse = JSON.parse(thread.message);
                                                    setEditDiscussionThreadHtml(parse.html ? parse.html : '');
                                                    setEditDiscussionThreadAttachments(
                                                        parse.attachments ? parse.attachments : []
                                                    );
                                                    setEditDiscussionThreadAnonymous(thread.anonymous);
                                                    setEditorFocus(true);
                                                }}
                                                disabled={props.user.email === disableEmailId}
                                            >
                                                <Text>
                                                    <Ionicons name={'pencil-outline'} size={14} color="#000" />
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                        {isOwner ? (
                                            <TouchableOpacity
                                                style={{
                                                    marginLeft: 20,
                                                }}
                                                onPress={() => {
                                                    handleDeleteThread(thread._id, thread.parentId);
                                                }}
                                                disabled={props.user.email === disableEmailId}
                                            >
                                                <Text>
                                                    <Ionicons name={'trash-outline'} size={16} color="#000" />
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                                {editDiscussionThreadId !== '' && editDiscussionThreadId === thread._id ? (
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                        }}
                                    >
                                        {editorFocus ? null : renderDiscussionEditor()}

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginTop: 20,
                                            }}
                                        >
                                            {isOwner ? null : (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            marginRight: 7,
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={anonymous}
                                                            onChange={(e: any) => {
                                                                setAnonymous(!anonymous);
                                                            }}
                                                        />
                                                    </View>
                                                    <Text style={{ fontSize: 15, fontFamily: 'Inter' }}>Anonymous</Text>
                                                </View>
                                            )}

                                            {/* Buttons */}
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: 'white',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                        marginRight: 20,
                                                    }}
                                                    onPress={() => {
                                                        Alert('Discard reply?', '', [
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
                                                                    setEditDiscussionThreadAnonymous(false);
                                                                    setEditDiscussionThreadId('');
                                                                    setEditDiscussionThreadHtml('');
                                                                    setEditDiscussionThreadAttachments([]);
                                                                },
                                                            },
                                                        ]);
                                                    }}
                                                    disabled={isSendingReply}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            color: '#000',
                                                            borderRadius: 15,
                                                            fontSize: 15,
                                                            backgroundColor: 'white',
                                                            fontFamily: 'inter',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        Cancel
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        // marginTop: 15,
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                    }}
                                                    onPress={() => {
                                                        handleUpdateThread();
                                                    }}
                                                    disabled={isSendingReply}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            color: '#000',
                                                            fontSize: 15,
                                                            fontFamily: 'inter',
                                                            borderRadius: 15,
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {isSendingReply ? 'Updating...' : 'Update'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <RenderHtml
                                        contentWidth={contentWidth}
                                        source={{
                                            html: replyThreadContent,
                                        }}
                                        defaultTextProps={{
                                            selectable: false,
                                        }}
                                        // renderers={renderers}
                                        renderers={{
                                            img: ({ TDefaultRenderer, ...rendererProps }) => {
                                                const node = rendererProps.tnode.domNode;

                                                const attribs = node.attribs;

                                                if (attribs && attribs['data-eq']) {
                                                    const formula = '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                    console.log('Formula', formula);

                                                    return (
                                                        <View
                                                            style={{
                                                                minWidth: 100,
                                                            }}
                                                        >
                                                            <MathJax
                                                                html={formula}
                                                                mathJaxOptions={{
                                                                    messageStyle: 'none',
                                                                    extensions: [
                                                                        'tex2jax.js',
                                                                        'MathMenu.js',
                                                                        'MathZoom.js',
                                                                    ],
                                                                    jax: ['input/TeX', 'output/HTML-CSS'],
                                                                    tex2jax: {
                                                                        inlineMath: [
                                                                            ['$', '$'],
                                                                            ['\\(', '\\)'],
                                                                        ],
                                                                        displayMath: [
                                                                            ['$$', '$$'],
                                                                            ['\\[', '\\]'],
                                                                        ],
                                                                        processEscapes: false,
                                                                    },
                                                                    SVG: {
                                                                        useGlobalCache: false,
                                                                    },
                                                                    TeX: {
                                                                        extensions: [
                                                                            'AMSmath.js',
                                                                            'AMSsymbols.js',
                                                                            'noErrors.js',
                                                                            'noUndefined.js',
                                                                            'AMSmath.js',
                                                                            'AMSsymbols.js',
                                                                            'autoload-all.js',
                                                                        ],
                                                                    },
                                                                }}
                                                            />
                                                        </View>
                                                    );
                                                }

                                                return (
                                                    <Image
                                                        source={{
                                                            uri: attribs.src,
                                                        }}
                                                        style={{
                                                            maxWidth: Dimensions.get('window').width,
                                                            width: 300,
                                                            height: 300,
                                                            flex: 1,
                                                        }}
                                                        resizeMode={'contain'}
                                                    />
                                                );
                                            },
                                        }}
                                        tagsStyles={{
                                            p: {
                                                lineHeight: 50,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                )}
                                {/* Render attachments */}
                                {editDiscussionThreadId !== '' ? null : replyThreadAttachments.length > 0 ? (
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            width: '100%',
                                            maxWidth: 500,
                                            marginVertical: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontFamily: 'Overpass',
                                                marginBottom: 20,
                                            }}
                                        >
                                            Attachments
                                        </Text>
                                        {replyThreadAttachments.map((file: any, ind: number) => {
                                            return (
                                                <View
                                                    key={ind.toString()}
                                                    style={{
                                                        width: '100%',
                                                        paddingVertical: 12,
                                                        paddingHorizontal: 16,
                                                        borderWidth: 1,
                                                        borderColor: '#cccccc',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        borderRadius: 2,
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <Ionicons name="attach-outline" size={22} color="#000" />
                                                    <Text
                                                        style={{
                                                            paddingLeft: 10,
                                                            fontSize: 15,
                                                            fontFamily: 'Overpass',
                                                        }}
                                                    >
                                                        {file.name}
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                        onPress={() => {
                                                            if (
                                                                Platform.OS === 'web' ||
                                                                Platform.OS === 'macos' ||
                                                                Platform.OS === 'windows'
                                                            ) {
                                                                window.open(file.url, '_blank');
                                                            } else {
                                                                Linking.openURL(file.url);
                                                            }
                                                        }}
                                                    >
                                                        <Text>
                                                            <Ionicons
                                                                name="download-outline"
                                                                style={{
                                                                    marginLeft: 'auto',
                                                                }}
                                                                size={19}
                                                            />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    /**
     * @description Renders List of threads
     */
    const renderAllThreadsMobile = () => {
        return (
            <View
                style={{
                    width: '100%',
                }}
            >
                <View
                    style={{
                        paddingHorizontal: 20,
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
                                backgroundColor: '#efefef',
                                borderRadius: 15,
                                fontSize: 13,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                marginRight: 2,
                                width: '100%',
                            }}
                            autoCompleteType={'xyz'}
                            placeholder={'Search'}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={'#000'}
                        />
                    </View>
                    {searchTerm !== '' ? (
                        <View
                            style={{
                                marginLeft: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    if (searchTerm !== '') {
                                        setSearchTerm('');
                                    } else {
                                        props.setShowDirectory(true);
                                    }
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
                    ) : null}
                </View>

                {searchTerm !== '' && searchResults.length === 0 && !isSearching ? (
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

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        // maxWidth: '80%',
                        borderRadius: 1,
                    }}
                >
                    {isSearching ? null : threads.length === 0 ? (
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 16,
                                    paddingVertical: 50,
                                    fontFamily: 'inter',
                                    flex: 1,
                                    backgroundColor: '#fff',
                                    paddingHorizontal: 10,
                                }}
                            >
                                {!props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')}
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            contentContainerStyle={{
                                borderColor: '#f2f2f2',
                                borderRadius: 1,
                                width: '100%',
                            }}
                        >
                            {(searchTerm !== '' ? searchResults : filteredThreads).map((thread: any, ind: number) => {
                                let title = '';

                                if (!searchTerm && thread.title) {
                                    title = thread.title;
                                } else if (
                                    !searchTerm &&
                                    thread.message[0] === '{' &&
                                    thread.message[thread.message.length - 1] === '}' &&
                                    !thread.title
                                ) {
                                    const obj = JSON.parse(thread.message);
                                    title = obj.title;
                                } else if (!searchTerm) {
                                    const { title: t, subtitle: s } = htmlStringParser(thread.message);
                                    title = t;
                                }

                                if (searchTerm && thread.searchTitle) {
                                    title = thread.searchTitle;
                                }

                                return (
                                    <TouchableOpacity
                                        onPress={() =>
                                            loadCueDiscussions(thread.parentId ? thread.parentId : thread._id)
                                        }
                                        style={{
                                            // backgroundColor: '#fff',
                                            flexDirection: 'row',
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            // borderRightWidth: 1,
                                            borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                            // minWidth: 600, // flex: 1,
                                            width: '100%',
                                        }}
                                        key={ind.toString()}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 5,
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Image
                                                style={{
                                                    height: 40,
                                                    width: 40,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    // marginTop: 20,
                                                    alignSelf: 'center',
                                                }}
                                                source={{
                                                    uri:
                                                        thread.avatar && (!thread.anonymous || thread.userId === userId)
                                                            ? thread.avatar
                                                            : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                }}
                                            />
                                        </View>
                                        <View
                                            style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 5, marginTop: 5 }}
                                        >
                                            <Text
                                                style={{ fontSize: 15, padding: 5, fontFamily: 'inter' }}
                                                ellipsizeMode="tail"
                                                numberOfLines={2}
                                            >
                                                {title}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    margin: 5,
                                                    lineHeight: 18,
                                                    color: thread.userId === userId ? '#007AFF' : '#000',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {thread.anonymous && thread.userId !== userId && !isOwner
                                                    ? 'Anonymous'
                                                    : thread.fullName}
                                            </Text>
                                        </View>
                                        <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    backgroundColor: '#fff',
                                                    paddingLeft: 10,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {thread.isPrivate ? (
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            padding: 5,
                                                            color: '#000',
                                                            textAlign: 'center',
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        <Ionicons name="eye-off-outline" size={15} />
                                                    </Text>
                                                ) : null}
                                                {thread.unreadThreads > 0 ? (
                                                    <View
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: 8,
                                                            marginHorizontal: 5,
                                                            backgroundColor: '#007AFF',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 12 }}>
                                                            {thread.unreadThreads}
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
                                                    {emailTimeDisplay(thread.time)}
                                                </Text>
                                                <Text
                                                    style={{ fontSize: 14, padding: 5, lineHeight: 13 }}
                                                    ellipsizeMode="tail"
                                                >
                                                    <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyThreads = () => {
        return (
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        width: '100%',
                        color: '#1F1F1F',
                        fontSize: 16,
                        paddingVertical: 100,
                        fontFamily: 'inter',
                        flex: 1,
                        backgroundColor: '#fff',
                        paddingHorizontal: 10,
                    }}
                >
                    {!props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')}
                </Text>
            </View>
        );
    };

    /**
     * @description Renders List of threads
     */
    const renderThreadsLarge = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    height: '100%',
                }}
            >
                {/* Left pane will be for rendering active chats */}
                {props.hideNavbarDiscussions ? null : (
                    <View
                        style={{
                            width: '30%',
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            height: '100%',
                        }}
                    >
                        {/* Search bar */}
                        <View
                            style={{
                                paddingHorizontal: 20,
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
                                        backgroundColor: '#efefef',
                                        borderRadius: 15,
                                        fontSize: 13,
                                        paddingVertical: 8,
                                        paddingHorizontal: 16,
                                        marginRight: 2,
                                        width: '100%',
                                    }}
                                    autoCompleteType={'xyz'}
                                    placeholder={'Search'}
                                    onChangeText={(val) => setSearchTerm(val)}
                                    placeholderTextColor={'#000'}
                                />
                            </View>
                            {searchTerm !== '' ? (
                                <View
                                    style={{
                                        marginLeft: 20,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (searchTerm !== '') {
                                                setSearchTerm('');
                                            } else {
                                                props.setShowDirectory(true);
                                            }
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
                            ) : null}
                        </View>
                        {/*  */}
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            contentContainerStyle={{
                                borderColor: '#f2f2f2',
                                borderRadius: 1,
                                width: '100%',
                                height: '100%',
                                paddingVertical: 10,
                                paddingRight: 10,
                            }}
                        >
                            {isSearching ? (
                                <View
                                    style={{
                                        width: '100%',
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

                            {searchTerm !== '' && searchResults.length === 0 && !isSearching ? (
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

                            {isSearching
                                ? null
                                : (searchTerm !== '' ? searchResults : filteredThreads).map(
                                      (thread: any, ind: number) => {
                                          let title = '';

                                          if (!searchTerm && thread.title) {
                                              title = thread.title;
                                          } else if (
                                              !searchTerm &&
                                              thread.message[0] === '{' &&
                                              thread.message[thread.message.length - 1] === '}' &&
                                              !thread.title
                                          ) {
                                              const obj = JSON.parse(thread.message);
                                              title = obj.title;
                                          } else if (!searchTerm) {
                                              const { title: t, subtitle: s } = htmlStringParser(thread.message);
                                              title = t;
                                          }

                                          if (searchTerm && thread.searchTitle) {
                                              title = thread.searchTitle;
                                          }

                                          return (
                                              <TouchableOpacity
                                                  onPress={() =>
                                                      loadCueDiscussions(thread.parentId ? thread.parentId : thread._id)
                                                  }
                                                  style={{
                                                      backgroundColor: threadId === thread._id ? '#f8f8f8' : '#fff',
                                                      flexDirection: 'row',
                                                      borderColor: '#f8f8f8',
                                                      width: '100%',
                                                      borderRadius: 5,
                                                  }}
                                                  key={ind.toString()}
                                              >
                                                  <View style={{ flex: 1, backgroundColor: 'none', paddingLeft: 10 }}>
                                                      <View
                                                          style={{
                                                              flexDirection: 'row',
                                                              marginTop: 5,
                                                              alignItems: 'center',
                                                              width: '100%',
                                                              backgroundColor: 'none',
                                                          }}
                                                      >
                                                          <Text
                                                              style={{
                                                                  fontSize: 15,
                                                                  padding: 5,
                                                                  fontFamily: 'inter',
                                                                  flex: 1,
                                                              }}
                                                              ellipsizeMode="tail"
                                                              numberOfLines={1}
                                                          >
                                                              {title}
                                                          </Text>
                                                          <View
                                                              style={{
                                                                  marginLeft: 'auto',
                                                                  flexDirection: 'row',
                                                                  backgroundColor: 'none',
                                                                  paddingLeft: 10,
                                                                  alignItems: 'center',
                                                              }}
                                                          >
                                                              {thread.isPrivate ? (
                                                                  <Text
                                                                      style={{
                                                                          fontSize: 14,
                                                                          padding: 5,
                                                                          color: '#000',
                                                                          textAlign: 'center',
                                                                      }}
                                                                      ellipsizeMode="tail"
                                                                  >
                                                                      <Ionicons name="eye-off-outline" size={15} />
                                                                  </Text>
                                                              ) : null}
                                                              {thread.unreadThreads > 0 ? (
                                                                  <View
                                                                      style={{
                                                                          width: 15,
                                                                          height: 15,
                                                                          borderRadius: 8,
                                                                          marginLeft: 5,
                                                                          backgroundColor: '#007AFF',
                                                                          alignItems: 'center',
                                                                          justifyContent: 'center',
                                                                      }}
                                                                  >
                                                                      <Text style={{ color: 'white', fontSize: 12 }}>
                                                                          {thread.unreadThreads}
                                                                      </Text>
                                                                  </View>
                                                              ) : null}
                                                          </View>
                                                      </View>

                                                      {/* Bottom bar must have Category -> Author -> Date -> Private/Anonymous tags */}
                                                      <View
                                                          style={{
                                                              flexDirection: 'row',
                                                              alignItems: 'center',
                                                              backgroundColor: 'none',
                                                          }}
                                                      >
                                                          {/* Category */}
                                                          <Text
                                                              style={{
                                                                  fontSize: 12,
                                                                  margin: 5,
                                                                  lineHeight: 18,
                                                                  marginRight: 10,
                                                              }}
                                                              ellipsizeMode="tail"
                                                          >
                                                              {thread.category ? thread.category : 'None'}
                                                          </Text>

                                                          {/* Author  */}
                                                          <Text
                                                              style={{
                                                                  fontSize: 12,
                                                                  margin: 5,
                                                                  lineHeight: 18,
                                                                  marginRight: 10,
                                                                  color: '#000',
                                                              }}
                                                              ellipsizeMode="tail"
                                                          >
                                                              {thread.anonymous && thread.userId !== userId && !isOwner
                                                                  ? 'Anonymous'
                                                                  : thread.fullName}
                                                          </Text>

                                                          {/* Date & Time */}
                                                          <Text
                                                              style={{
                                                                  fontSize: 12,
                                                                  margin: 5,
                                                                  lineHeight: 18,
                                                                  marginLeft: 'auto',
                                                              }}
                                                              ellipsizeMode="tail"
                                                          >
                                                              {fromNow(thread.time, true)}
                                                          </Text>
                                                      </View>
                                                  </View>
                                                  {/* <View
                                        style={{
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            backgroundColor: 'none',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                backgroundColor: 'none',
                                                paddingHorizontal: 10,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {thread.isPrivate ? (
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        padding: 5,
                                                        color: '#007AFF',
                                                        textAlign: 'center',
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
                                                        backgroundColor: '#007AFF',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontSize: 11 }}>
                                                        {thread.unreadThreads}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View> */}
                                              </TouchableOpacity>
                                          );
                                      }
                                  )}
                        </ScrollView>
                    </View>
                )}

                {/* Right pane */}
                <View
                    style={{
                        width: props.hideNavbarDiscussions ? '100%' : '70%',
                        height: '100%',
                    }}
                >
                    {threadId === '' && !props.showNewDiscussionPost ? (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'column',
                                }}
                            >
                                <Text
                                    style={{
                                        marginBottom: 10,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Ionicons name="chatbubbles-outline" size={28} color="#1f1f1f" />
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        textAlign: 'center',
                                    }}
                                >
                                    Select Thread to view
                                </Text>
                            </View>
                        </View>
                    ) : null}
                    {props.showNewDiscussionPost ? (
                        <NewPostModal
                            categories={categories}
                            categoriesOptions={categoriesOptions}
                            onClose={() => {
                                props.setShowNewDiscussionPost(false);
                                if (Dimensions.get('window').width < 768) {
                                    props.setHideNavbarDiscussions(false);
                                }
                            }}
                            onSend={createNewThread}
                            isOwner={isOwner}
                            userId={userId}
                            user={props.user}
                            setHideNavbarDiscussions={props.setHideNavbarDiscussions}
                        />
                    ) : showThreadCues ? (
                        renderSelectedThread()
                    ) : null}
                    {/* <FormulaGuide
                        value={equation}
                        onChange={setEquation}
                        show={showEquationEditor}
                        onClose={() => setShowEquationEditor(false)}
                        onInsertEquation={insertEquation}
                    /> */}
                </View>
            </View>
        );
    };

    // MAIN RETURN

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                flex: 1,
            }}
            keyboardVerticalOffset={Dimensions.get('window').width < 768 ? 50 : 30}
        >
            <View
                style={{
                    backgroundColor: '#fff',
                    width: '100%',
                    height: '100%',
                    paddingTop: 0,
                    justifyContent: 'center',
                    flexDirection: 'row',
                }}
            >
                {props.showNewDiscussionPost && (threads.length === 0 || Dimensions.get('window').width < 768) ? (
                    <NewPostModal
                        categories={categories}
                        categoriesOptions={categoriesOptions}
                        onClose={() => {
                            props.setShowNewDiscussionPost(false);
                            if (Dimensions.get('window').width < 768) {
                                props.setHideNavbarDiscussions(false);
                            }
                        }}
                        onSend={createNewThread}
                        isOwner={isOwner}
                        userId={userId}
                        user={props.user}
                        setHideNavbarDiscussions={props.setHideNavbarDiscussions}
                    />
                ) : null}
                {props.showNewDiscussionPost &&
                (threads.length === 0 || Dimensions.get('window').width < 768) ? null : (
                    <View
                        style={{
                            width: '100%',
                            height: '100%',
                            // maxWidth: '80%',
                            backgroundColor: '#fff',
                            borderRadius: 1,
                        }}
                    >
                        {/* {!showThreadCues || Dimensions.get('window').width >= 768 || showPost ? renderThreadHeader() : null} */}
                        {loading && Dimensions.get('window').width < 768 ? (
                            <View
                                style={{
                                    width: '100%',
                                    paddingVertical: 100,
                                    justifyContent: 'center',
                                    flex: 1,
                                    flexDirection: 'column',
                                    backgroundColor: '#fff',
                                }}
                            >
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'white',
                                    flex: 1,
                                    flexDirection: 'column',
                                    borderRadius: 1,
                                    // height: showThreadCues ? Dimensions.get('window').height - 120 : 0,
                                }}
                                key={JSON.stringify(filteredThreads) + JSON.stringify(props.showNewDiscussionPost)}
                            >
                                {showThreadCues && Dimensions.get('window').width < 768 && !editorFocus ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            paddingHorizontal: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                props.setShowNewDiscussionPost(false);
                                                if (Dimensions.get('window').width < 768) {
                                                    props.setHideNavbarDiscussions(false);
                                                }
                                                setShowThreadCues(false);
                                                props.reload();
                                            }}
                                            style={{
                                                paddingRight: 20,
                                                paddingLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                                                alignSelf: 'flex-start',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    lineHeight: 34,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    paddingTop: 10,
                                                }}
                                            >
                                                <Ionicons size={35} name="arrow-back-outline" color="#1f1f1f" />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {editorFocus
                                    ? renderDiscussionEditor()
                                    : showThreadCues && Dimensions.get('window').width < 768
                                    ? renderSelectedThread()
                                    : threads.length === 0
                                    ? renderEmptyThreads()
                                    : Dimensions.get('window').width < 768
                                    ? renderAllThreadsMobile()
                                    : renderThreadsLarge()}
                            </View>
                        )}
                    </View>
                )}
            </View>
            {/* Editor Modals */}
            {emojiVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setEmojiVisible(false);
                    }}
                    isOpen={emojiVisible}
                    title={'Select emoji'}
                    renderContent={() => <EmojiView onSelect={insertEmoji} />}
                    header={false}
                />
            )}
            {insertImageVisible && (
                <BottomSheet
                    snapPoints={[0, 200]}
                    close={() => {
                        setInsertImageVisible(false);
                    }}
                    isOpen={insertImageVisible}
                    title={'Insert image'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10, zIndex: 10000 }}>
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
                                    width: 150,
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
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#000',
                                    paddingHorizontal: 24,
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    width: 150,
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
                        </View>
                    )}
                    header={false}
                />
            )}
            {insertLinkVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setInsertLinkVisible(false);
                    }}
                    isOpen={insertLinkVisible}
                    title={'Insert Link'}
                    renderContent={() => <InsertLink onInsertLink={onInsertLink} />}
                    header={false}
                />
            )}
            {hiliteColorVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setHiliteColorVisible(false);
                    }}
                    isOpen={hiliteColorVisible}
                    title={'Highlight color'}
                    renderContent={() => (
                        <View
                            style={{
                                paddingHorizontal: 10,
                                paddingTop: 20,
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 10000,
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={hiliteColor}
                                onChange={(color: string) => setHiliteColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={() => setHiliteColor('#ffffff')}
                                disabled={hiliteColor === '#ffffff'}
                            >
                                <Text
                                    style={{
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#007AFF',
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}
            {foreColorVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setForeColorVisible(false);
                    }}
                    isOpen={foreColorVisible}
                    title={'Text color'}
                    renderContent={() => (
                        <View
                            style={{
                                paddingHorizontal: 10,
                                paddingTop: 20,
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 10000,
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={foreColor}
                                onChange={(color: string) => setForeColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={() => setForeColor('#000000')}
                                disabled={foreColor === '#000000'}
                            >
                                <Text
                                    style={{
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#007AFF',
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}

            {emojiVisible || insertImageVisible || insertLinkVisible || hiliteColorVisible || foreColorVisible ? (
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
                        onPress={() => {
                            setEmojiVisible(false);
                            setInsertImageVisible(false);
                            setInsertLinkVisible(false);
                            setHiliteColorVisible(false);
                            setForeColorVisible(false);
                        }}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}
            {insertFormulaVisible && (
                <BottomSheet
                    snapPoints={[
                        0,
                        Dimensions.get('window').height -
                            (Dimensions.get('window').width < 768 ? (Platform.OS === 'ios' ? 60 : 20) : 30),
                    ]}
                    close={() => {
                        setInsertFormulaVisible(false);
                    }}
                    isOpen={insertFormulaVisible}
                    title={'Insert Formula'}
                    renderContent={() => renderFormulaEditor()}
                    header={true}
                    callbackNode={fall}
                />
            )}
            {insertFormulaVisible ? (
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
                        onPress={() => setInsertFormulaVisible(false)}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}
        </KeyboardAvoidingView>
    );
};

export default ThreadsList;

// export default React.memo(ThreadsList, (prev, next) => {
//     return _.isEqual(prev.threads, next.threads);
// });

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1,
        },
        marginSmall: {
            height: 10,
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white',
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row',
        },
        channelOption: {
            width: '33.333%',
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F',
        },
    });
};
