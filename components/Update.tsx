// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ActivityIndicator, Dimensions, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getCueThreads,
    getStatuses,
    getUnreadQACount,
    creatFolder,
    getFolder,
    getFolderCues,
    getChannelFolders,
    updateFolder,
    addToFolder,
    deleteFolder,
    // removeFromFolder,
    getReleaseSubmissionStatus
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { View, TouchableOpacity, Text } from '../components/Themed';
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler';
import ThreadsList from './ThreadsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscribersList from './SubscribersList';
import { Ionicons } from '@expo/vector-icons';
// import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';

const Update: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [modalAnimation] = useState(new Animated.Value(1));
    const [cueId] = useState(props.cueId);
    const [createdBy] = useState(props.createdBy);
    const [channelCreatedBy] = useState(props.channelCreatedBy);
    const [threads, setThreads] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scroll2: any = useRef();
    const scroll3: any = useRef();
    const [channelOwner, setChannelOwner] = useState(false);
    const [viewStatus, setViewStatus] = useState(false);
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
    const [showOriginal, setShowOriginal] = useState(true);
    const [isQuiz, setIsQuiz] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [save, setSave] = useState(false);
    const [del, setDel] = useState(false);
    const [showFolder, setShowFolder] = useState(false);
    const [createNewFolder, setCreateNewFolder] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [selectedCues, setSelectedCues] = useState<any[]>([]);
    const [folderId, setFolderId] = useState(props.cue.folderId && props.cue.folderId !== '' ? props.cue.folderId : '');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [channelFolders, setChannelFolders] = useState<any[]>([]);
    const [editFolder, setEditFolder] = useState(false);
    const [updatingFolder, setUpdatingFolder] = useState(false);
    const [deletingFolder, setDeletingFolder] = useState(false);
    const [addingToFolder, setAddingToFolder] = useState(false);
    const [folderCues, setFolderCues] = useState<any[]>([]);
    const [folder, setFolder] = useState<any>({});
    const [loadingFolderCues, setLoadingFolderCues] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [updateFolderTitle, setUpdateFolderTitle] = useState('');
    const [folderCuesToDisplay, setFolderCuesToDisplay] = useState<any[]>([]);
    const [showExistingFolder, setShowExistingFolder] = useState(false);
    const windowHeight = Dimensions.get('window').height;
    const [editorFocus, setEditorFocus] = useState(false);

    // ALERTS
    const unableToLoadStatusesAlert = PreferredLanguageText('unableToLoadStatuses');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const unableToLoadCommentsAlert = PreferredLanguageText('unableToLoadComments');

    console.log('Props.cue', props.cue);

    // HOOKS

    /**
     * @description Set if cue is a Quiz
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = props.cue.original;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    setIsQuiz(true);
                }
            }
        }
    }, [props.cue]);

    /**
     * @description Every time a cue is opened we need to check if the releaseSubmission property was modified so that a student is not allowed to do submissions
     */
    useEffect(() => {
        if (cueId && cueId !== '') {
            checkReleaseSubmissionStatus(cueId);
        }
    }, [cueId]);

    /**
     * @description Filter out all channel Cues that already have a folderID
     */
    useEffect(() => {
        if (!props.channelCues) return;

        const filterExisting = props.channelCues.filter((cue: any) => {
            return cue.folderId === '' || !cue.folderId;
        });

        setChannelCues(filterExisting);
    }, [props.channelCues]);

    /**
     * @description Fetch all Channel Folders
     */
    useEffect(() => {
        fetchChannelFolders();
    }, [props.channelId]);

    /**
     * @description Set folder cues to display
     */
    useEffect(() => {
        if (folderId !== '' && folder && folder !== null && folder.cueIds && folderCues && folderCues.length > 0) {
            // const cuesInOrder = folder.cueIds.map((id: any) => {
            //     return folderCues.find((cue: any) => cue._id === id)
            // })

            // const filterUndefined = cuesInOrder.filter((cue: any) => cue !== undefined)

            setFolderCuesToDisplay(folderCues);
            setUpdateFolderTitle(folder.title);
        }
    }, [folder, folderCues, folderId]);

    /**
     * @description Fetch folder cues if folder id is set
     */
    useEffect(() => {
        fetchFolderCues();
    }, [folderId]);

    /**
     * @description Load threads and statuses
     */
    useEffect(() => {
        loadThreadsAndStatuses();
    }, [props.cueId, props.channelId]);

    /**
     * @description Fetches release submission status
     */
    const checkReleaseSubmissionStatus = (cueId: string) => {
        const server = fetchAPI('');
        server
            .query({
                query: getReleaseSubmissionStatus,
                variables: {
                    cueId
                }
            })
            .then(async res => {
                if (res.data.cue.getReleaseSubmissionStatus) {
                    // Update cue and refresh

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem('cues');
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) {}
                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex];

                    const saveCue = {
                        ...currCue,
                        releaseSubmission: true
                    };

                    subCues[props.cueKey][props.cueIndex] = saveCue;

                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem('cues', stringifiedCues);

                    props.reloadCueListAfterUpdate();
                }
            })
            .catch(e => {
                // Do nothing
            });
    };

    // useEffect(() => {
    //     if (props.target && props.target === 'Q&A') {
    //         setShowComments(true);
    //     }
    // }, [props.target]);

    /**
     * @description Fetch all the channel folders
     */
    const fetchChannelFolders = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        }

        const server = fetchAPI(parsedUser._id);
        server
            .query({
                query: getChannelFolders,
                variables: {
                    channelId: props.channelId
                }
            })
            .then(res => {
                if (res.data.folder.getFoldersForChannel) {
                    setChannelFolders(res.data.folder.getFoldersForChannel);
                }
            })
            .catch(e => {});
    }, [props.channelId]);

    /**
     * @description Fetch folder cues if current cue has folder Id
     */
    const fetchFolderCues = useCallback(async () => {
        if (props.cue && folderId && folderId !== '') {
            const u = await AsyncStorage.getItem('user');
            let parsedUser: any = {};
            if (u) {
                parsedUser = JSON.parse(u);
            }

            setLoadingFolderCues(true);
            setLoadingFolder(true);

            const server = fetchAPI(parsedUser._id);
            server
                .query({
                    query: getFolderCues,
                    variables: {
                        folderId,
                        userId: parsedUser._id
                    }
                })
                .then(res => {
                    if (res.data.folder.getCuesById) {
                        setFolderCues(res.data.folder.getCuesById);
                        setLoadingFolderCues(false);
                    }
                })
                .catch(e => {
                    setLoadingFolderCues(false);
                });

            server
                .query({
                    query: getFolder,
                    variables: {
                        folderId
                    }
                })
                .then(res => {
                    if (res.data.folder.findById) {
                        setFolder(res.data.folder.findById);
                        setLoadingFolder(false);
                    }
                })
                .catch(e => {
                    setLoadingFolder(false);
                });
        }
    }, [folderId]);

    /**
     * @description Update cue with release Submission
     */
    const updateCueWithReleaseSubmission = async (releaseSubmission: boolean) => {
        // Release Submission

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        const saveCue = {
            ...currCue,
            releaseSubmission
        };

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);

        props.reloadCueListAfterUpdate();
    };

    /**
     * @description Update QA unread count (Not used right now)
     */
    const updateQAUnreadCount = async () => {
        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        }

        if (Number.isNaN(Number(cueId))) {
            const server = fetchAPI(parsedUser._id);

            server
                .query({
                    query: getUnreadQACount,
                    variables: {
                        userId: parsedUser._id,
                        cueId
                    }
                })
                .then(async res => {
                    // Update cue locally with the new Unread count so that the Unread count reflects in real time

                    if (
                        res.data.threadStatus.getUnreadQACount === null ||
                        res.data.threadStatus.getUnreadQACount === undefined
                    ) {
                        return null;
                    }

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem('cues');
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) {}
                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex];

                    const saveCue = {
                        ...currCue,
                        unreadThreads: res.data.threadStatus.getUnreadQACount
                    };

                    subCues[props.cueKey][props.cueIndex] = saveCue;

                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem('cues', stringifiedCues);

                    props.reloadCueListAfterUpdate();
                });

            server
                .query({
                    query: getCueThreads,
                    variables: {
                        cueId
                    }
                })
                .then(async res => {
                    const u = await AsyncStorage.getItem('user');
                    if (u) {
                        const parsedUser = JSON.parse(u);
                        let filteredThreads: any[] = [];
                        if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                            filteredThreads = res.data.thread.findByCueId;
                        } else {
                            filteredThreads = res.data.thread.findByCueId.filter((thread: any) => {
                                return !thread.isPrivate || thread.userId === parsedUser._id;
                            });
                        }
                        setThreads(filteredThreads);
                    }
                });
        }
    };

    /**
     * @description Load threads and statuses
     */
    const loadThreadsAndStatuses = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        }
        if (Number.isNaN(Number(cueId))) {
            setLoading(true);
            const server = fetchAPI(parsedUser._id);
            server
                .query({
                    query: getCueThreads,
                    variables: {
                        cueId
                    }
                })
                .then(async res => {
                    const u = await AsyncStorage.getItem('user');
                    if (u) {
                        const parsedUser = JSON.parse(u);
                        let filteredThreads: any[] = [];
                        if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                            filteredThreads = res.data.thread.findByCueId;
                        } else {
                            filteredThreads = res.data.thread.findByCueId.filter((thread: any) => {
                                return !thread.isPrivate || thread.userId === parsedUser._id;
                            });
                        }
                        setThreads(filteredThreads);
                        if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                            setChannelOwner(true);
                            server
                                .query({
                                    query: getStatuses,
                                    variables: {
                                        cueId
                                    }
                                })
                                .then(res2 => {
                                    if (res2.data.status && res2.data.status.findByCueId) {
                                        const subs: any[] = [];
                                        const statuses = res2.data.status.findByCueId;
                                        statuses.map((status: any) => {
                                            subs.push({
                                                avatar: status.avatar,
                                                displayName: status.fullName,
                                                _id: status.userId,
                                                fullName: status.status,
                                                submission: status.submission,
                                                comment: status.comment,
                                                score: status.score,
                                                graded: status.graded,
                                                userId: status.userId,
                                                submittedAt: status.submittedAt,
                                                deadline: status.deadline,
                                                releaseSubmission: status.releaseSubmission
                                            });
                                        });
                                        setSubscribers(subs);
                                        setLoading(false);
                                    } else {
                                        setLoading(false);
                                    }
                                })
                                .catch(err => {
                                    Alert(unableToLoadStatusesAlert, checkConnectionAlert);
                                    setLoading(false);
                                });
                        } else {
                            setLoading(false);
                        }
                    } else {
                        setThreads(res.data.thread.findByCueId);
                        setLoading(false);
                    }
                })
                .catch(err => {
                    Alert(unableToLoadCommentsAlert, checkConnectionAlert);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy]);

    /**
     * @description Reload all subscriptions responses
     */
    const reloadStatuses = useCallback(async () => {
        setLoading(true);
        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        } else {
            return;
        }

        const server = fetchAPI(parsedUser._id);
        server
            .query({
                query: getStatuses,
                variables: {
                    cueId
                }
            })
            .then(res2 => {
                if (res2.data.status && res2.data.status.findByCueId) {
                    const subs: any[] = [];
                    const statuses = res2.data.status.findByCueId;
                    statuses.map((status: any) => {
                        subs.push({
                            displayName: status.fullName,
                            _id: status.userId,
                            fullName: status.status,
                            submission: status.submission,
                            comment: status.comment,
                            score: status.score,
                            graded: status.graded,
                            userId: status.userId,
                            submittedAt: status.submittedAt,
                            deadline: status.deadline,
                            releaseSubmission: status.releaseSubmission
                        });
                    });
                    setSubscribers(subs);
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            })
            .catch(err => {
                Alert(unableToLoadStatusesAlert, checkConnectionAlert);
                setLoading(false);
            });
    }, [cueId]);

    /**
     * @description Handle used to drage cues for sorting
     */
    // const DragHandle = SortableHandle(() => (
    //     <Text style={{ marginRight: 5, marginTop: 3, cursor: 'pointer' }}>
    //         {' '}
    //         <Ionicons name="swap-horizontal-outline" size={14} color="#000000" />{' '}
    //     </Text>
    // ));

    /**
     * @description Sortable Cue for Create Folder
     */
    // const SortableItem = SortableElement(({ value, sortIndex }: any) => {
    //     const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue);

    //     const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

    //     const col = colorChoices[value.color];

    //     return (
    //         <View
    //             style={{
    //                 height: '100%',
    //                 backgroundColor: '#fff',
    //                 borderRadius: 1,
    //                 maxWidth: 130,
    //                 width: 130,
    //                 borderColor: col,
    //                 borderLeftWidth: 3,
    //                 flexDirection: 'row',
    //                 shadowOffset: {
    //                     width: 2,
    //                     height: 2
    //                 },
    //                 overflow: 'hidden',
    //                 shadowOpacity: 0.07,
    //                 shadowRadius: 7,
    //                 zIndex: 500000,
    //                 marginRight: 15
    //             }}>
    //             <View
    //                 key={'textPage'}
    //                 style={{
    //                     maxWidth: 210,
    //                     height: '100%',
    //                     width: '100%',
    //                     padding: 7,
    //                     paddingHorizontal: 10,
    //                     backgroundColor: '#fff'
    //                 }}>
    //                 <View
    //                     style={{
    //                         height: '30%',
    //                         backgroundColor: '#fff',
    //                         display: 'flex',
    //                         flexDirection: 'row',
    //                         alignItems: 'center'
    //                     }}>
    //                     <Text style={styles.date2}>
    //                         {new Date(value.date).toString().split(' ')[1] +
    //                             ' ' +
    //                             new Date(value.date).toString().split(' ')[2]}
    //                     </Text>

    //                     {value._id === props.cue._id ? null : (
    //                         <TouchableOpacity
    //                             onPress={() => {
    //                                 const temp = [...channelCues];
    //                                 temp.push(value);
    //                                 setChannelCues(temp);

    //                                 const sCues = selectedCues.filter((c: any) => c._id !== value._id);
    //                                 setSelectedCues(sCues);
    //                             }}>
    //                             <Text style={{ color: '#f94144' }}>
    //                                 <Ionicons name="remove-circle-outline" size={16} />
    //                             </Text>
    //                         </TouchableOpacity>
    //                     )}
    //                 </View>

    //                 <View
    //                     style={{
    //                         backgroundColor: '#fff',
    //                         width: '100%',
    //                         flexDirection: 'row',
    //                         flex: 1,
    //                         height: '70%',
    //                         alignItems: 'center'
    //                     }}>
    //                     <DragHandle />

    //                     <Text
    //                         ellipsizeMode={'tail'}
    //                         numberOfLines={1}
    //                         style={{
    //                             fontFamily: 'inter',
    //                             fontSize: 12,
    //                             lineHeight: 20,
    //                             flex: 1,
    //                             marginTop: 5,
    //                             color: '#000000'
    //                         }}>
    //                         {title}
    //                     </Text>
    //                 </View>
    //             </View>
    //         </View>
    //     );
    // });

    /**
     * @description Sortable Cue for Update Folder
     * Needs to be stylisticaly same as SortableItem
     */
    // const SortableItemUpdate = SortableElement(({ value, sortIndex }: any) => {
    //     const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue);

    //     const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

    //     const col = colorChoices[value.color];

    //     return (
    //         <View
    //             style={{
    //                 height: '100%',
    //                 backgroundColor: '#fff',
    //                 borderRadius: 1,
    //                 maxWidth: 130,
    //                 width: 130,
    //                 borderColor: col,
    //                 borderLeftWidth: 3,
    //                 flexDirection: 'row',
    //                 shadowOffset: {
    //                     width: 2,
    //                     height: 2
    //                 },
    //                 overflow: 'hidden',
    //                 shadowOpacity: 0.07,
    //                 shadowRadius: 7,
    //                 zIndex: 500000,
    //                 marginRight: 15
    //             }}>
    //             <View
    //                 key={'textPage'}
    //                 style={{
    //                     maxWidth: 210,
    //                     height: '100%',
    //                     width: '100%',
    //                     padding: 7,
    //                     paddingHorizontal: 10,
    //                     backgroundColor: '#fff'
    //                 }}>
    //                 <View
    //                     style={{
    //                         height: '30%',
    //                         backgroundColor: '#fff',
    //                         display: 'flex',
    //                         flexDirection: 'row',
    //                         alignItems: 'center'
    //                     }}>
    //                     <Text style={styles.date2}>
    //                         {new Date(value.date).toString().split(' ')[1] +
    //                             ' ' +
    //                             new Date(value.date).toString().split(' ')[2]}
    //                     </Text>

    //                     {value._id === props.cue._id ? null : (
    //                         <TouchableOpacity
    //                             onPress={() => {
    //                                 const temp = [...channelCues];
    //                                 temp.push(value);
    //                                 setChannelCues(temp);

    //                                 const sCues = folderCuesToDisplay.filter((c: any) => c._id !== value._id);
    //                                 setFolderCuesToDisplay(sCues);
    //                             }}>
    //                             <Text style={{ color: '#f94144' }}>
    //                                 <Ionicons name="remove-circle-outline" size={16} />
    //                             </Text>
    //                         </TouchableOpacity>
    //                     )}
    //                 </View>

    //                 <View
    //                     style={{
    //                         backgroundColor: '#fff',
    //                         width: '100%',
    //                         flexDirection: 'row',
    //                         flex: 1,
    //                         height: '70%',
    //                         alignItems: 'center'
    //                     }}>
    //                     <DragHandle />

    //                     <Text
    //                         ellipsizeMode={'tail'}
    //                         numberOfLines={1}
    //                         style={{
    //                             fontFamily: 'inter',
    //                             fontSize: 12,
    //                             lineHeight: 20,
    //                             flex: 1,
    //                             marginTop: 5,
    //                             color: value._id === props.cue._id ? '#006AFF' : '#000000'
    //                         }}>
    //                         {title}
    //                     </Text>
    //                 </View>
    //             </View>
    //         </View>
    //     );
    // });

    /**
     * @description Renders the Selected Cues as sortable for Create Folder
     */
    // const SortableList = SortableContainer(({ items }: any) => {
    //     return (
    //         <ScrollView
    //             style={{
    //                 width: '100%',
    //                 maxWidth: 900,
    //                 backgroundColor: '#efefef',
    //                 borderTopLeftRadius: 0,
    //                 borderTopRightRadius: 0,
    //                 paddingBottom: 15
    //             }}
    //             horizontal={true}
    //             showsHorizontalScrollIndicator={true}>
    //             {items.map((value: any, index: number) => (
    //                 <SortableItem key={`item-${index}`} index={index} sortIndex={index} value={value} />
    //             ))}
    //         </ScrollView>
    //     );
    // });

    /**
     * @description Renders the Selected Cues as sortable for Update Folder
     */
    // const SortableListUpdate = SortableContainer(({ items }: any) => {
    //     return (
    //         <ScrollView
    //             style={{
    //                 width: '100%',
    //                 maxWidth: 900,
    //                 backgroundColor: '#efefef',
    //                 borderTopLeftRadius: 0,
    //                 borderTopRightRadius: 0,
    //                 paddingBottom: 15
    //             }}
    //             horizontal={true}
    //             showsHorizontalScrollIndicator={true}>
    //             {items.map((value: any, index: number) => (
    //                 <SortableItemUpdate key={`item-${index}`} index={index} sortIndex={index} value={value} />
    //             ))}
    //         </ScrollView>
    //     );
    // });

    /**
     *
     * @description Used to sort the selected cues for Create Folder
     */
    // const onSortEnd = ({ oldIndex, newIndex }: any) => {
    //     setSelectedCues(arrayMove(selectedCues, oldIndex, newIndex));
    // };

    /**
     *
     *
     *
     * @description Used to sort the selected cues for Update Folder
     */
    // const onSortEndUpdate = ({ oldIndex, newIndex }: any) => {
    //     setFolderCuesToDisplay(arrayMove(folderCuesToDisplay, oldIndex, newIndex));
    // };

    /**
     * @description Tabs (Content, Options, Submission, etc)
     */
    const options = (
        <View
            style={{
                paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 20,
                flexDirection: 'row',
                flex: 1,
                backgroundColor: '#000',
                paddingTop: Dimensions.get('window').width < 1024 ? 9 : 12,
                height: 48,
                justifyContent: Dimensions.get('window').width < 1024 ? 'center' : 'flex-start'
            }}
        >
            <TouchableOpacity
                style={showOriginal ? styles.allBlueTabButton : styles.tabButton}
                onPress={() => {
                    setShowOptions(false);
                    setViewStatus(false);
                    setShowOriginal(true);
                    setShowComments(false);
                }}
            >
                <Text style={showOriginal ? styles.allGrayFill : styles.all}>Content</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={showOptions ? styles.allBlueTabButton : styles.tabButton}
                onPress={() => {
                    setShowOptions(true);
                    setViewStatus(false);
                    setShowOriginal(false);
                    setShowComments(false);
                }}
            >
                <Text style={showOptions ? styles.allGrayFill : styles.all}>DETAILS</Text>
            </TouchableOpacity>
            {props.channelId === '' || !submission || (channelOwner && submission) || isQuiz ? null : (
                <TouchableOpacity
                    style={
                        !showOriginal && !viewStatus && !showOptions && !showComments
                            ? styles.allBlueTabButton
                            : styles.tabButton
                    }
                    onPress={() => {
                        setViewStatus(false);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                    }}
                >
                    <Text
                        style={
                            !showOriginal && !viewStatus && !showOptions && !showComments
                                ? styles.allGrayFill
                                : styles.all
                        }
                    >
                        SUBMISSION
                    </Text>
                </TouchableOpacity>
            )}
            {/* Add Status button here */}
            {props.channelId === '' || !channelOwner || props.version === 'read' ? null : (
                <TouchableOpacity
                    style={viewStatus ? styles.allBlueTabButton : styles.tabButton}
                    onPress={() => {
                        setViewStatus(true);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                    }}
                >
                    <Text style={viewStatus ? styles.allGrayFill : styles.all}>Feedback</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    /**
     * @description Renders the existing folder cues for the Header
     */
    const renderExistingFolder = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto',
                    zIndex: 500001
                }}
            >
                <View
                    style={{
                        zIndex: 500001,
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#efefef',
                        paddingVertical: 14,
                        paddingHorizontal: 10
                    }}
                >
                    {/* Render Folder Title */}

                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: 'Inter',
                            color: '#1F1F1F',
                            paddingBottom: 10,
                            width: '100%',
                            maxWidth: 900
                        }}
                    >
                        {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                    </Text>

                    {/* Render Existing cues */}
                    <ScrollView
                        style={{
                            width: '100%',
                            maxWidth: 900,
                            backgroundColor: '#efefef',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            paddingBottom: 15
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={true}
                    >
                        {folderCuesToDisplay.map((cue: any) => {
                            if (!cue || !cue.channelId) return;

                            const { title } = htmlStringParser(
                                cue.channelId && cue.channelId !== '' ? cue.original : cue.cue
                            );

                            const colorChoices: any[] = [
                                '#f94144',
                                '#f3722c',
                                '#f8961e',
                                '#f9c74f',
                                '#3abb83'
                            ].reverse();

                            const col = colorChoices[cue.color];

                            return (
                                <View
                                    style={{
                                        height: '100%',
                                        backgroundColor: '#fff',
                                        borderRadius: 1,
                                        maxWidth: 130,
                                        width: 130,
                                        borderColor: col,
                                        borderLeftWidth: 3,
                                        flexDirection: 'row',
                                        shadowOffset: {
                                            width: 2,
                                            height: 2
                                        },
                                        overflow: 'hidden',
                                        shadowOpacity: 0.07,
                                        shadowRadius: 7,
                                        zIndex: 500000,
                                        marginRight: 15
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => props.openCue(cue._id)}
                                        key={'textPage'}
                                        style={{
                                            maxWidth: 210,
                                            height: '100%',
                                            // borderTop
                                            width: '100%',
                                            padding: 7,
                                            paddingHorizontal: 10,
                                            backgroundColor: '#fff'
                                        }}
                                    >
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.date2}>
                                                {new Date(props.cue.date).toString().split(' ')[1] +
                                                    ' ' +
                                                    new Date(props.cue.date).toString().split(' ')[2]}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                width: '100%',
                                                flexDirection: 'row',
                                                flex: 1,
                                                height: '70%'
                                            }}
                                        >
                                            <Text
                                                ellipsizeMode={'tail'}
                                                numberOfLines={1}
                                                style={{
                                                    fontFamily: 'inter',
                                                    // fontWeight: 'bold',
                                                    fontSize: 12,
                                                    lineHeight: 20,
                                                    flex: 1,
                                                    marginTop: 5,
                                                    color: cue._id === props.cue._id ? '#006AFF' : '#000000'
                                                }}
                                            >
                                                {title}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </InsetShadow>
        );
    };

    /**
     * @description method to render the cue selections for new folder
     * Two Sections (First section shows all options and the second one shows the selected cues)
     */
    const renderNewFolderOptions = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto'
                }}
            >
                <View style={{ width: '100%', flexDirection: 'column', paddingHorizontal: 10 }}>
                    {/* Section 1: Shows all cues from Channel */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#efefef',
                            paddingTop: 14,
                            paddingBottom: 7
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: 900,
                                    backgroundColor: '#efefef',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                            >
                                {channelCues.map((cue: any) => {
                                    const { title } = htmlStringParser(
                                        cue.channelId && cue.channelId !== '' ? cue.original : cue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83'
                                    ].reverse();

                                    const col = colorChoices[cue.color];

                                    return (
                                        <View
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15
                                            }}
                                        >
                                            <View
                                                key={'textPage'}
                                                style={{
                                                    maxWidth: 210,
                                                    height: '100%',
                                                    // borderTop
                                                    width: '100%',
                                                    padding: 7,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(props.cue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(props.cue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...selectedCues];
                                                            temp.push(cue);
                                                            setSelectedCues(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== cue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto'
                                                        }}
                                                    >
                                                        <Text style={{ color: '#006AFF', textAlign: 'center' }}>
                                                            <Ionicons name="add-outline" size={16} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        flex: 1,
                                                        height: '70%'
                                                    }}
                                                >
                                                    <Text
                                                        ellipsizeMode={'tail'}
                                                        numberOfLines={1}
                                                        style={{
                                                            fontFamily: 'inter',
                                                            fontSize: 12,
                                                            lineHeight: 20,
                                                            flex: 1,
                                                            marginTop: 5,
                                                            color: '#000000'
                                                        }}
                                                    >
                                                        {title}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ backgroundColor: '#efefef' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#efefef',
                                        paddingVertical: 20
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}

                    {channelCues.length !== 0 ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: '#efefef',
                                paddingTop: 7,
                                paddingBottom: 14
                            }}
                        >
                            {/* <SortableList
                                axis={'x'}
                                lockAxis={'x'}
                                items={selectedCues}
                                onSortEnd={onSortEnd}
                                useDragHandle
                            /> */}
                        </View>
                    ) : null}
                </View>
            </InsetShadow>
        );
    };

    /**
     * @description method to render the cue selections for edit folder
     * Two Sections (First section shows all options and the second one shows the selected cues)
     */
    const renderEditFolderOptions = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto'
                }}
            >
                <View style={{ width: '100%', flexDirection: 'column', paddingHorizontal: 10 }}>
                    {/* Section 1: Shows all cues from Channel */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#efefef',
                            paddingTop: 14,
                            paddingBottom: 7
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: 900,
                                    backgroundColor: '#efefef',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15
                                    // marginTop: 10
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                                // showsVerticalScrollIndicator={false}
                            >
                                {channelCues.map((cue: any) => {
                                    const { title } = htmlStringParser(
                                        cue.channelId && cue.channelId !== '' ? cue.original : cue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83'
                                    ].reverse();

                                    const col = colorChoices[cue.color];

                                    return (
                                        <View
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15
                                            }}
                                        >
                                            <View
                                                key={'textPage'}
                                                style={{
                                                    maxWidth: 210,
                                                    height: '100%',
                                                    // borderTop
                                                    width: '100%',
                                                    padding: 7,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(props.cue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(props.cue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...folderCuesToDisplay];
                                                            temp.push(cue);
                                                            setFolderCuesToDisplay(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== cue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto'
                                                        }}
                                                    >
                                                        <Text style={{ color: '#006AFF', textAlign: 'center' }}>
                                                            <Ionicons name="add-outline" size={16} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        flex: 1,
                                                        height: '70%'
                                                    }}
                                                >
                                                    <Text
                                                        ellipsizeMode={'tail'}
                                                        numberOfLines={1}
                                                        style={{
                                                            fontFamily: 'inter',
                                                            fontSize: 12,
                                                            lineHeight: 20,
                                                            flex: 1,
                                                            marginTop: 5,
                                                            color: '#000000'
                                                        }}
                                                    >
                                                        {title}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ backgroundColor: '#efefef' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#efefef',
                                        paddingVertical: 20
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}

                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#efefef',
                            paddingTop: 7,
                            paddingBottom: 14
                        }}
                    >
                        {/* <SortableListUpdate
                            items={folderCuesToDisplay}
                            onSortEnd={onSortEndUpdate}
                            useDragHandle={true}
                            axis={'x'}
                            lockAxis={'x'}
                        /> */}
                    </View>
                </View>
            </InsetShadow>
        );
    };

    /**
     * @description Content view
     */
    const ContentView = (
        <Animated.View
            style={{
                width: '100%',
                // maxWidth: 900,
                height: '100%',
                maxHeight: windowHeight,
                opacity: modalAnimation,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
            }}
            key={JSON.stringify(threads)}
        >
            {!viewStatus ? (
                // <ScrollView
                //     nestedScrollEnabled={true}
                //     showsVerticalScrollIndicator={true}
                //     horizontal={false}
                //     style={{
                //         borderTopRightRadius: 0,
                //         borderTopLeftRadius: 0,
                //         width: '100%'
                //     }}
                //     contentContainerStyle={{
                //         borderTopRightRadius: 0,
                //         borderTopLeftRadius: 0,
                //         maxHeight: windowHeight - 52,
                //         alignItems: 'center',
                //         width: '100%'
                //     }}
                // >
                <View
                    style={{
                        maxWidth: 900,
                        height: '100%',
                        width: '100%'
                    }}
                >
                    <UpdateControls
                        // key={JSON.stringify(showOriginal) + JSON.stringify(viewStatus)}
                        setEditorFocus={(val: boolean) => setEditorFocus(val)}
                        channelId={props.channelId}
                        save={save}
                        del={del}
                        customCategories={props.customCategories}
                        cue={props.cue}
                        cueIndex={props.cueIndex}
                        cueKey={props.cueKey}
                        channelOwner={channelOwner}
                        createdBy={createdBy}
                        folderId={folderId}
                        closeModal={() => props.closeModal()}
                        reloadCueListAfterUpdate={() => props.reloadCueListAfterUpdate()}
                        changeViewStatus={() => setViewStatus(true)}
                        viewStatus={viewStatus}
                        showOptions={showOptions}
                        showOriginal={showOriginal}
                        showFolder={showFolder}
                        setShowOptions={(op: boolean) => setShowOptions(op)}
                        setShowOriginal={(val: boolean) => setShowOriginal(val)}
                        showComments={showComments}
                        setShowComments={(s: any) => setShowComments(s)}
                        setShowFolder={(s: any) => setShowFolder(s)}
                        reloadStatuses={reloadStatuses}
                        setSave={(save: boolean) => setSave(save)}
                        setDelete={(del: boolean) => setDel(del)}
                    />
                    {!Number.isNaN(Number(cueId)) || !props.channelId ? (
                        <View style={{ flex: 1, backgroundColor: 'white' }} />
                    ) : showComments ? (
                        <ScrollView
                            // key={Math.random()}
                            ref={scroll2}
                            contentContainerStyle={{
                                width: '100%',
                                maxWidth: 900,
                                alignSelf: 'center',
                                height: '100%'
                            }}
                            contentOffset={{ x: 0, y: 1 }}
                            showsVerticalScrollIndicator={false}
                            overScrollMode={'always'}
                            alwaysBounceVertical={true}
                            scrollEnabled={true}
                            scrollEventThrottle={1}
                            keyboardDismissMode={'on-drag'}
                        >
                            <ThreadsList
                                channelCreatedBy={props.channelCreatedBy}
                                key={JSON.stringify(threads)}
                                threads={threads}
                                cueId={cueId}
                                channelId={props.channelId}
                                channelName={props.filterChoice}
                                closeModal={() => props.closeModal()}
                                reload={() => loadThreadsAndStatuses()}
                                updateQAUnreadCount={() => updateQAUnreadCount()}
                                type={'Q&A'}
                            />
                        </ScrollView>
                    ) : null}
                </View>
            ) : (
                // </ScrollView>
                <View>
                    {channelOwner ? (
                        <View
                            style={{
                                backgroundColor: 'white',
                                width: '100%',
                                height: windowHeight - 52,
                                // paddingHorizontal: 20,
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0
                            }}
                        >
                            <ScrollView
                                ref={scroll3}
                                contentContainerStyle={{
                                    width: '100%',
                                    height: windowHeight - 52,
                                    alignItems: 'center'
                                }}
                                showsVerticalScrollIndicator={true}
                                contentOffset={{ x: 0, y: 1 }}
                                key={channelOwner.toString()}
                                overScrollMode={'always'}
                                alwaysBounceVertical={true}
                                scrollEnabled={true}
                                scrollEventThrottle={1}
                                keyboardDismissMode={'on-drag'}
                            >
                                <View style={{ maxWidth: 900, width: '100%' }}>
                                    <SubscribersList
                                        key={JSON.stringify(subscribers)}
                                        subscribers={subscribers}
                                        cueId={cueId}
                                        channelName={props.filterChoice}
                                        channelId={props.channelId}
                                        closeModal={() => props.closeModal()}
                                        reload={() => loadThreadsAndStatuses()}
                                        cue={props.cue}
                                        updateCueWithReleaseSubmission={updateCueWithReleaseSubmission}
                                        reloadStatuses={reloadStatuses}
                                    />
                                </View>
                            </ScrollView>
                        </View>
                    ) : null}
                </View>
            )}
        </Animated.View>
    );

    /**
     * @description Renders all the Folder buttons (edit, add, delete, cancel, etc.) for the header
     */
    const renderFolderButtons = () => {
        return (
            <React.Fragment>
                {/* Edit folder button */}
                {channelOwner && folderId !== '' && !editFolder && showOriginal ? (
                    <TouchableOpacity
                        onPress={async () => {
                            setEditFolder(true);
                        }}
                        style={{
                            backgroundColor: '#000',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'uppercase',
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        >
                            Edit Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Create new folder button */}
                {channelOwner && folderId === '' && !createNewFolder && !editFolder && showOriginal ? (
                    <TouchableOpacity
                        onPress={() => {
                            setCreateNewFolder(true);
                            setSelectedCues([props.cue]);
                            const filter = props.channelCues.filter((cue: any) => cue._id !== props.cue._id);
                            setChannelCues(filter);
                        }}
                        style={{
                            backgroundColor: '#000',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'uppercase',
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        >
                            New Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Add to existing folder button */}
                {channelFolders.length > 0 &&
                channelOwner &&
                folderId === '' &&
                !createNewFolder &&
                !editFolder &&
                showOriginal ? (
                    <Menu
                        onSelect={async (choice: any) => {
                            if (addingToFolder) {
                                return;
                            }
                            const server = fetchAPI('');
                            setAddingToFolder(true);
                            server
                                .mutate({
                                    mutation: addToFolder,
                                    variables: {
                                        cueId: props.cue._id,
                                        folderId: choice
                                    }
                                })
                                .then(async res => {
                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                    if (!res.data.folder.addToFolder) {
                                        Alert('Could not add to list. Try again.');
                                        setAddingToFolder(false);
                                        return;
                                    }
                                    setAddingToFolder(false);
                                    setFolderId(choice);
                                })
                                .catch(e => {
                                    Alert('Could not add to list. Try again.');
                                    setAddingToFolder(false);
                                });
                        }}
                    >
                        <MenuTrigger>
                            <View
                                style={{
                                    backgroundColor: '#000',
                                    paddingLeft: 0
                                }}
                            >
                                <Text
                                    style={{
                                        lineHeight: 34,
                                        marginLeft: 20,
                                        textTransform: 'uppercase',
                                        fontSize: 12,
                                        fontFamily: 'overpass',
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Add to Folder
                                </Text>
                            </View>
                        </MenuTrigger>
                        <MenuOptions
                            customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#e9e9ec',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}
                        >
                            {channelFolders.map((folder: any) => {
                                return (
                                    <MenuOption key={folder._id} value={folder._id}>
                                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                                            <Text style={{ fontSize: 14, fontFamily: 'inter', color: '#000000' }}>
                                                {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                );
                            })}
                        </MenuOptions>
                    </Menu>
                ) : null}

                {/* New Folder selected */}

                {createNewFolder ? (
                    <React.Fragment>
                        <TouchableOpacity
                            onPress={async () => {
                                setCreatingFolder(true);

                                const server = fetchAPI('');

                                server
                                    .mutate({
                                        mutation: creatFolder,
                                        variables: {
                                            title: newFolderTitle,
                                            cueIds: selectedCues.map((cue: any) => cue._id)
                                        }
                                    })
                                    .then(async res => {
                                        // Update cue locally with the new Unread count so that the Unread count reflects in real time

                                        if (res.data.folder.create === null || res.data.folder.create === '') {
                                            Alert('Could not create folder. Try again.');
                                            setCreatingFolder(false);
                                            return;
                                        }

                                        setFolderId(res.data.folder.create);
                                        setCreatingFolder(false);
                                        setCreateNewFolder(false);

                                        props.refreshCues();
                                    })
                                    .catch(e => {
                                        Alert('Could not create folder. Try again.');
                                        setCreatingFolder(false);
                                    });
                            }}
                            disabled={selectedCues.length < 2 || creatingFolder}
                            style={{
                                backgroundColor: '#000',
                                paddingLeft: 0
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#fff'
                                }}
                            >
                                {creatingFolder ? '...' : 'Create'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                setNewFolderTitle('');
                                setCreateNewFolder(false);
                                setSelectedCues([]);
                            }}
                            style={{
                                backgroundColor: '#000',
                                paddingLeft: 0
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ) : null}

                {/* Edit Folder selected */}

                {editFolder ? (
                    <React.Fragment>
                        <TouchableOpacity
                            onPress={async () => {
                                const server = fetchAPI('');

                                setUpdatingFolder(true);

                                const cueIds = folderCuesToDisplay.map((cue: any) => cue._id);

                                server
                                    .mutate({
                                        mutation: updateFolder,
                                        variables: {
                                            title: updateFolderTitle,
                                            cueIds,
                                            folderId
                                        }
                                    })
                                    .then(async res => {
                                        // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                        if (res.data.folder.update === null || res.data.folder.update === undefined) {
                                            Alert('Could not create folder. Try again.');
                                            setUpdatingFolder(false);
                                            return;
                                        }

                                        // Check if current cue was removed from the list then set folder id to ""
                                        if (!cueIds.includes(props.cue._id)) {
                                            setFolderId('');
                                        } else {
                                            await fetchFolderCues();
                                        }

                                        setUpdatingFolder(false);
                                        setEditFolder(false);

                                        props.refreshCues();
                                    })
                                    .catch(e => {
                                        Alert('Could not create folder. Try again.');
                                        setUpdatingFolder(false);
                                    });
                            }}
                            disabled={folderCuesToDisplay.length < 2 || updatingFolder}
                            style={{
                                backgroundColor: '#000',
                                paddingLeft: 0
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            >
                                {creatingFolder ? '...' : 'Update '}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                const server = fetchAPI('');

                                setDeletingFolder(true);

                                server
                                    .mutate({
                                        mutation: deleteFolder,
                                        variables: {
                                            folderId
                                        }
                                    })
                                    .then(async res => {
                                        // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                        if (!res.data.folder.delete) {
                                            Alert('Could not delete list. Try again.');
                                            setDeletingFolder(false);
                                            return;
                                        }

                                        setDeletingFolder(false);
                                        setFolderId('');

                                        props.refreshCues();
                                    })
                                    .catch(e => {
                                        Alert('Could not create folder. Try again.');
                                        setDeletingFolder(false);
                                    });
                            }}
                            style={{
                                backgroundColor: '#000',
                                paddingLeft: 0
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            >
                                {deletingFolder ? '...' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                setEditFolder(false);

                                // Set cues to display to original
                                const cuesInOrder = folder.cueIds.map((id: any) => {
                                    return folderCues.find((cue: any) => cue._id === id);
                                });

                                setFolderCuesToDisplay(cuesInOrder);
                            }}
                            style={{
                                backgroundColor: '#000',
                                paddingLeft: 0
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            >
                                {deletingFolder ? '...' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ) : null}
            </React.Fragment>
        );
    };

    /**
     *  @description This function will render the Bar with Back button, Folder options, Option Tabs, And Save, Delete buttons
     *
     * */
    const renderHeader = () => {
        return (
            <View style={{ width: '100%', backgroundColor: '#000', flexDirection: 'column', zIndex: 500000 }}>
                {/* The first bar will be the main black bar with the back button, Cue Tabs and buttons */}
                <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'center',
                        height: 52,
                        backgroundColor: '#000',
                        paddingHorizontal: 10,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 4,
                            height: 4
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 10,
                        zIndex: 500000
                    }}
                >
                    {folderId !== '' &&
                    folderCuesToDisplay.length !== 0 &&
                    !editFolder &&
                    !createNewFolder &&
                    showOriginal ? (
                        <TouchableOpacity
                            onPress={() => setShowExistingFolder(!showExistingFolder)}
                            style={{
                                position: 'absolute',
                                zIndex: 500001,
                                bottom: -17,
                                left: '50%',
                                width: 35,
                                height: 35,
                                borderRadius: '100%',
                                backgroundColor: '#efefef',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 10,
                                    height: 10
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 15
                            }}
                        >
                            <Ionicons
                                name={showExistingFolder ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={20}
                                color="#1f1f1f"
                            />
                        </TouchableOpacity>
                    ) : null}
                    <View style={{ flexDirection: 'row', flex: 1, maxWidth: 900, backgroundColor: '#000', height: 52 }}>
                        {/* BACK BUTTON */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                paddingTop: Dimensions.get('window').width > 768 ? 9 : 11,
                                backgroundColor: '#000'
                            }}
                            onPress={() => {
                                props.closeModal();
                            }}
                        >
                            <Text>
                                <Ionicons
                                    name="arrow-back-outline"
                                    size={Dimensions.get('window').width > 768 ? 30 : 26}
                                    color={'#fff'}
                                />
                            </Text>
                        </TouchableOpacity>

                        {/* CUE TABS IF THE DIMENSIONS IS BIGGER THAN 1024 */}
                        {Dimensions.get('window').width >= 1024 && !createNewFolder && !editFolder ? options : null}

                        {/* Render Folder Title input if Create / Edit */}

                        {createNewFolder ? (
                            <View
                                style={{
                                    flex: 1,
                                    height: 52,
                                    backgroundColor: '#000',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    minWidth: 200,
                                    width: 200,
                                    maxWidth: '100%'
                                }}
                            >
                                <TextInput
                                    value={newFolderTitle}
                                    style={{
                                        color: '#fff',
                                        backgroundColor: '#1F1F1F',
                                        borderRadius: 15,
                                        fontSize: 12,
                                        paddingVertical: 3,
                                        paddingHorizontal: 8,
                                        marginTop: 7,
                                        marginLeft: 10,
                                        marginRight: 2,
                                        minWidth: 200,
                                        width: 200,
                                        maxWidth: '100%',
                                        height: 30
                                    }}
                                    autoCompleteType={'xyz'}
                                    placeholderTextColor={'#fff'}
                                    placeholder={'Folder Title'}
                                    onChange={(e: any) => setNewFolderTitle(e.target.value)}
                                />
                            </View>
                        ) : null}

                        {editFolder ? (
                            <TextInput
                                value={updateFolderTitle}
                                style={{
                                    color: '#fff',
                                    backgroundColor: '#1F1F1F',
                                    borderRadius: 15,
                                    fontSize: 12,
                                    paddingBottom: 5,
                                    paddingTop: 4,
                                    paddingHorizontal: 16,
                                    marginTop: 2,
                                    marginLeft: 10,
                                    marginRight: 2,
                                    maxWidth: 225
                                }}
                                autoCompleteType={'xyz'}
                                placeholderTextColor={'#fff'}
                                placeholder={'Folder Title'}
                                onChange={(e: any) => setUpdateFolderTitle(e.target.value)}
                            />
                        ) : null}

                        {/* BUTTONS */}
                        {
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#000',
                                    justifyContent: 'flex-end',
                                    flexDirection: 'row',
                                    paddingTop: 8
                                }}
                            >
                                {((channelOwner && showOriginal && !isQuiz) || showOptions || !props.channelId) &&
                                !editFolder &&
                                !createNewFolder ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setSave(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#000',
                                            marginLeft: 20
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#000',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#fff'
                                            }}
                                        >
                                            SAVE
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                {((channelOwner && showOriginal) ||
                                    (channelOwner && showOptions) ||
                                    !props.channelId) &&
                                !editFolder &&
                                !createNewFolder ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setDel(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            marginLeft: 20,
                                            backgroundColor: '#000'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#000',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#fff'
                                            }}
                                        >
                                            DELETE
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                {renderFolderButtons()}
                            </View>
                        }
                    </View>
                </View>

                {/* These are the expanded menues with folders */}

                <View
                    style={{
                        backgroundColor: '#efefef'
                    }}
                >
                    {folderId !== '' &&
                    folderCuesToDisplay.length !== 0 &&
                    !editFolder &&
                    !createNewFolder &&
                    showOriginal &&
                    showExistingFolder
                        ? renderExistingFolder()
                        : null}
                </View>

                <View
                    style={{
                        backgroundColor: '#efefef'
                    }}
                >
                    {createNewFolder ? renderNewFolderOptions() : null}
                </View>

                <View
                    style={{
                        backgroundColor: '#efefef'
                    }}
                >
                    {editFolder ? renderEditFolderOptions() : null}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                flex: 1
            }}
            keyboardVerticalOffset={Dimensions.get('window').width < 768 ? 50 : 30}
        >
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    maxHeight: '100%'
                }}
            >
                {loading ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0
                        }}
                    >
                        <ActivityIndicator color={'#000000'} />
                    </View>
                ) : (
                    <View style={{ width: '100%', position: 'relative', height: '100%' }}>
                        {/* Header */}
                        {!editorFocus ? renderHeader() : null}
                        {/* Main Content */}
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                // flex: 1,
                                height: '100%'
                            }}
                        >
                            {ContentView}
                        </View>

                        {/* Mobile tabs */}
                        {Dimensions.get('window').width < 1024 && !editorFocus ? (
                            <View
                                style={{
                                    position: 'absolute',
                                    zIndex: 1000,
                                    backgroundColor: '#000',
                                    bottom: 0,
                                    width: '100%',
                                    paddingTop: 5,
                                    paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                                    paddingHorizontal: 20,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    height: Dimensions.get('window').width < 768 ? 54 : 68,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: -7
                                    },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 10,
                                    zIndex: 500000
                                }}
                            >
                                {options}
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

export default Update;

const styles: any = StyleSheet.create({
    all: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        height: 25,
        backgroundColor: '#000',
        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    },
    allBlueTabButton: {
        backgroundColor: '#006AFF',
        borderRadius: 20,
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15
    },
    tabButton: {
        backgroundColor: '#000',
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        borderRadius: 20,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        // borderRadius: 12,
        backgroundColor: '#006AFF',
        lineHeight: 24,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '30%',
        display: 'flex',
        flexDirection: 'row'
    },
    date2: {
        fontSize: 10,
        color: '#1F1F1F',
        // marginLeft: 10,
        lineHeight: 12,
        textAlign: 'left',
        paddingVertical: 2,
        flex: 1
    }
});
