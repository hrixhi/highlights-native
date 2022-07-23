// REACT
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, ActivityIndicator, Dimensions, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';

// API
import {
    getStatuses,
    creatFolder,
    getFolder,
    getFolderCues,
    getChannelFolders,
    updateFolder,
    addToFolder,
    deleteFolder,
    findCueById,
    handleReleaseSubmission,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { View, TouchableOpacity, Text } from '../components/Themed';
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler';
import SubscribersList from './SubscribersList';
import { Ionicons } from '@expo/vector-icons';
import SortableList from 'react-native-sortable-list';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';
import { WebView } from 'react-native-webview';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { TextInput } from './CustomTextInput';
import BottomSheet from './BottomSheet';
import { paddingResponsive } from '../helpers/paddingHelper';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';
import { omitTypename } from '../helpers/omitTypename';
import { renderLoadingSpinner, renderWebviewError } from './LoadingSpinnersWebview';

const Update: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const {
        user,
        userId,
        refreshCues,
        savingCueToCloud,
        // SYNC FROM BACKEND
        syncCueFromBackend,
        changeSyncingCueFromBackend,
        syncingCueFromBackend,
        syncCueError,
        handleCueReleaseSubmissionStatus,
    } = useAppContext();

    const [modalAnimation] = useState(new Animated.Value(1));

    const [init, setInit] = useState(false);
    const [cue, setCue] = useState<any>(undefined);
    const [cueId] = useState(props.cueId);
    const [createdBy] = useState(props.createdBy);
    const [channelCreatedBy] = useState(props.channelCreatedBy);
    const [submission, setSubmission] = useState(false);
    const [allowLateSubmission, setAllowLateSubmission] = useState(false);
    const [availableUntil, setAvailableUntil] = useState<any>(undefined);
    const [deadline, setDeadline] = useState<any>(undefined);
    const [isQuiz, setIsQuiz] = useState(false);
    const [folderId, setFolderId] = useState('');
    const [channelOwner, setChannelOwner] = useState(userId === channelCreatedBy);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);

    const [viewStatus, setViewStatus] = useState(false);
    const [showOriginal, setShowOriginal] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [save, setSave] = useState(false);
    const [del, setDel] = useState(false);
    const [shareFeedback, setShareFeedback] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [exportQuizScores, setExportQuizScores] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(false);

    const [showFolder, setShowFolder] = useState(false);
    const [createNewFolder, setCreateNewFolder] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [selectedCues, setSelectedCues] = useState<any[]>([]);

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
    const [insertFormulaVisible, setInsertFormulaVisible] = useState(false);
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('Content');
    // Fullscreen
    const [fullScreenWebview, setFullScreenWebview] = useState(false);
    const [fullScreenPdfUrl, setFullScreenPdfUrl] = useState('');
    const [fullScreenPdfViewerKey, setFullScreenPdfViewerKey] = useState(Math.random().toString());
    const [reloadViewerKey, setReloadViewerKey] = useState(Math.random().toString());

    const server = useApolloClient();

    // HOOKS

    /**
     * @description Set if cue is a Quiz
     */
    useEffect(() => {
        if (cue && cue.channelId) {
            const data1 = cue.original;
            const data2 = cue.cue;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    setIsQuiz(true);
                }
            }
            if (data2 && data2[0] && data2[0] === '{' && data2[data2.length - 1] === '}') {
                const obj = JSON.parse(data2);
                if (obj.attempts) {
                    setSubmissionAttempts(obj.attempts);
                }
            }
            setSubmission(cue.submission);
            setAllowLateSubmission(cue.availableUntil && cue.availableUntil !== '');
            setDeadline(cue.deadline ? new Date(cue.deadline) : undefined);
            setAvailableUntil(cue.availableUntil ? new Date(cue.availableUntil) : undefined);
            setViewSubmission(
                (cue.submittedAt !== null && cue.submittedAt !== undefined) || (cue.graded && cue.releaseSubmission)
            );
            setFolderId(cue.folderId);
        }
    }, [cue]);

    /**
     * @description Every time a cue is opened we need to Sync the cue with the database to ensure that we have the latest object since we use multiple devices (LATER ON WE MUST SUBSCRIBE CUES TO WEBHOOKS TO MONITOR REAL TIME CHANGES)
     */
    useEffect(() => {
        if (cueId && cueId !== '' && props.channelId && props.channelId !== '') {
            // SYNC CUE
            fetchCueFromBackend(cueId);
        } else {
            setCue(props.cue);
        }
        setInit(true);
    }, [cueId, props.channelId]);

    /**
     * @description Filter out all channel Cues that already have a folderID
     */
    useEffect(() => {
        if (!props.channelCues) return;

        let filterExisting = props.channelCues.filter((channelCue: any) => {
            return channelCue.folderId === '' || !channelCue.folderId;
        });

        // Filter out current
        if (folderId) {
            filterExisting = filterExisting.filter((channelCue: any) => {
                return channelCue._id !== cue._id;
            });
        }

        setChannelCues(filterExisting);
    }, [props.channelCues, folderId, cue]);

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
        loadStudentResponses();
    }, [cueId, props.channelId]);

    const fetchCueFromBackend = (cueId: string) => {
        changeSyncingCueFromBackend(true);
        server
            .query({
                query: findCueById,
                variables: {
                    cueId,
                    userId,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.findCueById) {
                    const newCue = JSON.parse(JSON.stringify(res.data.cue.findCueById), omitTypename);

                    setCue(newCue);
                    syncCueFromBackend(newCue, false);
                } else {
                    // FALLBACK TO DEFAULT IF NOT A SUBMISSION (MAY BE USEFUL FOR OFFLINE FUNCTIONALITY)
                    // setCue(props.cue)
                    syncCueFromBackend(undefined, true);
                }
                changeSyncingCueFromBackend(false);
            })
            .catch((e) => {
                syncCueFromBackend(undefined, true);
                changeSyncingCueFromBackend(false);
            });
    };

    /**
     * @description Fetch all the channel folders
     */
    const fetchChannelFolders = useCallback(async () => {
        server
            .query({
                query: getChannelFolders,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data.folder.getFoldersForChannel) {
                    setChannelFolders(res.data.folder.getFoldersForChannel);
                }
            })
            .catch((e) => {});
    }, [props.channelId]);

    /**
     * @description Fetch folder cues if current cue has folder Id
     */
    const fetchFolderCues = useCallback(async () => {
        if (cue && folderId && folderId !== '') {
            setLoadingFolderCues(true);
            setLoadingFolder(true);

            server
                .query({
                    query: getFolderCues,
                    variables: {
                        folderId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.folder.getCuesById) {
                        setFolderCues(res.data.folder.getCuesById);
                        setLoadingFolderCues(false);
                    }
                })
                .catch((e) => {
                    setLoadingFolderCues(false);
                });

            server
                .query({
                    query: getFolder,
                    variables: {
                        folderId,
                    },
                })
                .then((res) => {
                    if (res.data.folder.findById) {
                        setFolder(res.data.folder.findById);
                        setLoadingFolder(false);
                    }
                })
                .catch((e) => {
                    setLoadingFolder(false);
                });
        }
    }, [folderId]);

    /**
     * @description Update cue with release Submission
     */
    const updateCueWithReleaseSubmission = async (releaseSubmission: boolean) => {
        // Release Submission

        server
            .mutate({
                mutation: handleReleaseSubmission,
                variables: {
                    entryId: cueId,
                    gradebookEntry: false,
                    releaseSubmission,
                },
            })
            .then((res) => {
                if (res.data && res.data.gradebook.handleReleaseSubmission) {
                    Alert(
                        releaseSubmission
                            ? 'Grades are now visible to students.'
                            : 'Grades are now hidden from students.'
                    );

                    handleCueReleaseSubmissionStatus(cueId, releaseSubmission);

                    const updateCurrentCue = { ...cue, releaseSubmission };

                    setCue(updateCurrentCue);
                } else {
                    Alert('Failed to modify status. Try again.');
                }
            })
            .catch((e) => {
                Alert('Failed to modify status. Try again.');
            });
    };

    /**
     * @description Load threads and statuses
     */
    const loadStudentResponses = useCallback(() => {
        if (userId === channelCreatedBy.toString().trim()) {
            setLoadingStatuses(true);
            setChannelOwner(true);
            server
                .query({
                    query: getStatuses,
                    variables: {
                        cueId,
                    },
                })
                .then((res) => {
                    if (res.data.status && res.data.status.findByCueId) {
                        const subs: any[] = [];
                        const statuses = [...res.data.status.findByCueId];

                        statuses.sort((a: any, b: any) => {
                            return a.fullName > b.fullName ? -1 : 1;
                        });

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
                                releaseSubmission: status.releaseSubmission,
                                totalPoints: status.totalPoints,
                                pointsScored: status.pointsScored,
                            });
                        });
                        setSubscribers(subs);
                        setLoadingStatuses(false);
                    } else {
                        setLoadingStatuses(false);
                    }
                })
                .catch((err) => {
                    // Alert(unableToLoadStatusesAlert, checkConnectionAlert);
                    setLoadingStatuses(false);
                });
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy]);

    /**
     * @description Helpter for icon to use in navbar
     */
    const getNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                if (isQuiz) {
                    return activeTab === op ? 'checkbox' : 'checkbox-outline';
                }
                return activeTab === op ? 'create' : 'create-outline';
            case 'Details':
                return activeTab === op ? 'options' : 'options-outline';
            case 'Submission':
                return activeTab === op ? 'time' : 'time-outline';
            case 'Feedback':
                return activeTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return activeTab === op ? 'person' : 'person-outline';
        }
    };

    const getNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return isQuiz ? 'Quiz' : submission && !channelOwner ? 'Assignment' : 'Content';
            case 'Details':
                return 'Details';
            case 'Submission':
                return 'Submission';
            case 'Feedback':
                return submission || isQuiz ? 'Feedback' : 'Status';
            default:
                return activeTab === op ? 'person' : 'person-outline';
        }
    };

    const getNavbarIconColor = (op: string) => {
        if (op === activeTab) {
            return '#000';
        }
        return '#575655';
    };

    const width = Dimensions.get('window').width;

    /**
     * @description Tabs (Content, Options, Submission, etc)
     */
    const options = (
        <React.Fragment>
            <TouchableOpacity
                style={{
                    backgroundColor: '#fff',
                    width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                    flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => {
                    setShowOptions(false);
                    setViewStatus(false);
                    setShowOriginal(true);
                    setShowComments(false);
                    setActiveTab('Content');
                }}
            >
                <Ionicons
                    name={getNavbarIconName('Content')}
                    style={{ color: getNavbarIconColor('Content'), marginBottom: 6 }}
                    size={23}
                />
                <Text
                    style={{
                        fontSize: width < 800 ? 11 : 16,
                        lineHeight: width < 800 ? 11 : 23,
                        color: getNavbarIconColor('Content'),
                        fontWeight: 'bold',
                        fontFamily: 'Inter',
                        marginBottom: width < 800 ? 0 : 6,
                        paddingLeft: width < 800 ? 0 : 5,
                    }}
                >
                    {getNavbarText('Content')}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    backgroundColor: '#fff',
                    width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                    flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => {
                    setShowOptions(true);
                    setViewStatus(false);
                    setShowOriginal(false);
                    setShowComments(false);
                    setActiveTab('Details');
                }}
            >
                <Ionicons
                    name={getNavbarIconName('Details')}
                    style={{ color: getNavbarIconColor('Details'), marginBottom: 6 }}
                    size={23}
                />
                <Text
                    style={{
                        fontSize: width < 800 ? 11 : 16,
                        lineHeight: width < 800 ? 11 : 23,
                        color: getNavbarIconColor('Details'),
                        fontWeight: 'bold',
                        fontFamily: 'Inter',
                        marginBottom: width < 800 ? 0 : 6,
                        paddingLeft: width < 800 ? 0 : 5,
                    }}
                >
                    {getNavbarText('Details')}
                </Text>
            </TouchableOpacity>
            {props.channelId === '' || !submission || (channelOwner && submission) || isQuiz ? null : (
                <TouchableOpacity
                    style={{
                        backgroundColor: '#fff',
                        width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    }}
                    onPress={() => {
                        setViewStatus(false);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Submission');
                    }}
                >
                    {/* <Text
                        style={
                            !showOriginal && !viewStatus && !showOptions && !showComments
                                ? styles.allGrayFill
                                : styles.all
                        }
                    >
                        SUBMISSION
                    </Text> */}
                    <Ionicons
                        name={getNavbarIconName('Submission')}
                        style={{ color: getNavbarIconColor('Submission'), marginBottom: 6 }}
                        size={23}
                    />
                    <Text
                        style={{
                            fontSize: width < 800 ? 11 : 16,
                            lineHeight: width < 800 ? 11 : 23,
                            color: getNavbarIconColor('Submission'),
                            fontWeight: 'bold',
                            fontFamily: 'Inter',
                            marginBottom: width < 800 ? 0 : 6,
                            paddingLeft: width < 800 ? 0 : 5,
                        }}
                    >
                        {getNavbarText('Submission')}
                    </Text>
                </TouchableOpacity>
            )}
            {/* Add Status button here */}
            {props.channelId === '' || !channelOwner || props.version === 'read' ? null : (
                <TouchableOpacity
                    style={{
                        backgroundColor: '#fff',
                        width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    }}
                    onPress={() => {
                        setViewStatus(true);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Feedback');
                    }}
                >
                    <Ionicons
                        name={getNavbarIconName('Feedback')}
                        style={{ color: getNavbarIconColor('Feedback'), marginBottom: 6 }}
                        size={23}
                    />
                    <Text
                        style={{
                            fontSize: width < 800 ? 11 : 16,
                            lineHeight: width < 800 ? 11 : 23,
                            color: getNavbarIconColor('Feedback'),
                            fontWeight: 'bold',
                            fontFamily: 'Inter',
                            marginBottom: width < 800 ? 0 : 6,
                            paddingLeft: width < 800 ? 0 : 5,
                        }}
                    >
                        {getNavbarText('Feedback')}
                    </Text>
                </TouchableOpacity>
            )}
        </React.Fragment>
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
                    zIndex: 500001,
                }}
            >
                <View
                    style={{
                        zIndex: 500001,
                        // flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#f8f8f8',
                        paddingVertical: 14,
                        paddingHorizontal: 10,
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
                            maxWidth: undefined,
                        }}
                    >
                        {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                    </Text>

                    {/* Render Existing cues */}
                    <ScrollView
                        style={{
                            width: '100%',
                            maxWidth: undefined,
                            backgroundColor: '#f8f8f8',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            paddingBottom: 7,
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={true}
                        indicatorStyle="black"
                    >
                        {folderCuesToDisplay.map((folderCue: any, ind: number) => {
                            if (!folderCue || !folderCue.channelId) return;

                            const { title } = htmlStringParser(
                                folderCue.channelId && folderCue.channelId !== '' ? folderCue.original : folderCue.cue
                            );

                            const colorChoices: any[] = [
                                '#f94144',
                                '#f3722c',
                                '#f8961e',
                                '#f9c74f',
                                '#3abb83',
                            ].reverse();

                            const col = colorChoices[folderCue.color];

                            return (
                                <View
                                    style={{
                                        height: 60,
                                        backgroundColor: '#fff',
                                        borderRadius: 1,
                                        maxWidth: 130,
                                        width: 130,
                                        borderColor: col,
                                        borderLeftWidth: 3,
                                        flexDirection: 'row',
                                        shadowOffset: {
                                            width: 2,
                                            height: 2,
                                        },
                                        overflow: 'hidden',
                                        shadowOpacity: 0.07,
                                        shadowRadius: 7,
                                        zIndex: 500000,
                                        marginRight: 15,
                                    }}
                                    key={ind.toString()}
                                >
                                    <TouchableOpacity
                                        onPress={() => props.openCue(folderCue._id)}
                                        key={'textPage'}
                                        style={{
                                            maxWidth: 210,
                                            height: '100%',
                                            // borderTop
                                            width: '100%',
                                            padding: 7,
                                            paddingHorizontal: 10,
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.date2}>
                                                {new Date(folderCue.date).toString().split(' ')[1] +
                                                    ' ' +
                                                    new Date(folderCue.date).toString().split(' ')[2]}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                width: '100%',
                                                flexDirection: 'row',
                                                flex: 1,
                                                height: '70%',
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
                                                    color: folderCue._id === cue._id ? '#007AFF' : '#000000',
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

    const renderNewFolderListRow = (row: any) => {
        const { key, index, data, disabled, active } = row;

        const { title } = htmlStringParser(data.channelId && data.channelId !== '' ? data.original : data.cue);

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

        const col = colorChoices[data.color];

        return (
            <View
                style={{
                    height: 60,
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    maxWidth: 130,
                    width: 130,
                    borderColor: col,
                    borderLeftWidth: 3,
                    flexDirection: 'row',
                    shadowOffset: {
                        width: 2,
                        height: 2,
                    },
                    overflow: 'hidden',
                    shadowOpacity: 0.07,
                    shadowRadius: 7,
                    zIndex: 500000,
                    marginRight: 15,
                }}
            >
                <View
                    key={'textPage'}
                    style={{
                        maxWidth: 210,
                        height: '100%',
                        width: '100%',
                        padding: 7,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            height: '33%',
                            backgroundColor: '#fff',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.date2}>
                            {new Date(data.date).toString().split(' ')[1] +
                                ' ' +
                                new Date(data.date).toString().split(' ')[2]}
                        </Text>

                        {data._id === cue._id ? null : (
                            <TouchableOpacity
                                onPress={() => {
                                    const temp = [...channelCues];
                                    temp.push(data);
                                    setChannelCues(temp);

                                    const sCues = selectedCues.filter((c: any) => c._id !== data._id);
                                    setSelectedCues(sCues);
                                }}
                            >
                                <Text style={{ color: '#f94144' }}>
                                    <Ionicons name="remove-circle-outline" size={16} />
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                            flexDirection: 'row',
                            flex: 1,
                            height: '67%',
                            alignItems: 'center',
                        }}
                    >
                        {DragHandle}

                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 12,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: 5,
                                color: '#000000',
                            }}
                        >
                            {title}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEditFolderListRow = (row: any) => {
        const { key, index, data, disabled, active } = row;

        const { title } = htmlStringParser(data.channelId && data.channelId !== '' ? data.original : data.cue);

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

        const col = colorChoices[data.color];

        return (
            <View
                style={{
                    height: 60,
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    maxWidth: 130,
                    width: 130,
                    borderColor: col,
                    borderLeftWidth: 3,
                    flexDirection: 'row',
                    shadowOffset: {
                        width: 2,
                        height: 2,
                    },
                    overflow: 'hidden',
                    shadowOpacity: 0.07,
                    shadowRadius: 7,
                    zIndex: 500000,
                    marginRight: 15,
                }}
            >
                <View
                    key={'textPage'}
                    style={{
                        maxWidth: 210,
                        height: '100%',
                        width: '100%',
                        padding: 7,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            height: '33%',
                            backgroundColor: '#fff',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.date2}>
                            {new Date(data.date).toString().split(' ')[1] +
                                ' ' +
                                new Date(data.date).toString().split(' ')[2]}
                        </Text>

                        {data._id === cue._id ? null : (
                            <TouchableOpacity
                                onPress={() => {
                                    const temp = [...channelCues];
                                    temp.push(data);
                                    setChannelCues(temp);

                                    const sCues = folderCuesToDisplay.filter((c: any) => c._id !== data._id);
                                    setFolderCuesToDisplay(sCues);
                                }}
                            >
                                <Text style={{ color: '#f94144' }}>
                                    <Ionicons name="remove-circle-outline" size={16} />
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                            flexDirection: 'row',
                            flex: 1,
                            height: '67%',
                            alignItems: 'center',
                        }}
                    >
                        {DragHandle}

                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 12,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: 5,
                                color: data._id === cue._id ? '#007AFF' : '#000000',
                            }}
                        >
                            {title}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const DragHandle = (
        <Text style={{ marginRight: 5, marginTop: 3 }}>
            {' '}
            <Ionicons name="swap-horizontal-outline" size={14} color="#000000" />{' '}
        </Text>
    );

    const renderNewFolderSelectionList = () => {
        return (
            <SortableList
                horizontal={true}
                style={{
                    width: '100%',
                    height: 100,
                }}
                data={selectedCues}
                renderRow={renderNewFolderListRow}
            />
        );
    };

    const renderEditFolderSelectionList = () => {
        return (
            <SortableList
                horizontal={true}
                style={{
                    width: '100%',
                    height: 100,
                }}
                data={folderCuesToDisplay}
                renderRow={renderEditFolderListRow}
            />
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
                    height: 180,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'column',
                        paddingHorizontal: 10,
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {/* Section 1: Shows all cues from Channel */}
                    {/* All cues being rendered here instead of filtered */}
                    <View
                        style={{
                            // flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#f8f8f8',
                            paddingTop: 14,
                            paddingBottom: 7,
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: undefined,
                                    backgroundColor: '#f8f8f8',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15,
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                                indicatorStyle="black"
                            >
                                {channelCues.map((channelCue: any, ind: number) => {
                                    if (channelCue.folderId && channelCue.folderId !== '') return;

                                    const { title } = htmlStringParser(
                                        channelCue.channelId && channelCue.channelId !== ''
                                            ? channelCue.original
                                            : channelCue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83',
                                    ].reverse();

                                    const col = colorChoices[channelCue.color];

                                    return (
                                        <View
                                            style={{
                                                height: 60,
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2,
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15,
                                            }}
                                            key={ind.toString()}
                                        >
                                            <View
                                                key={'textPage'}
                                                style={{
                                                    maxWidth: 210,
                                                    height: 60,
                                                    // borderTop
                                                    width: '100%',
                                                    padding: 7,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(channelCue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(channelCue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...selectedCues];
                                                            temp.push(channelCue);
                                                            setSelectedCues(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== channelCue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#007AFF', textAlign: 'center' }}>
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
                                                        height: '70%',
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
                                                            color: '#000000',
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
                            <View style={{ backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#f8f8f8',
                                        paddingVertical: 20,
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}

                    {channelCues.length === 0 && selectedCues.length === 0 ? null : selectedCues.length !== 0 ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingTop: 7,
                                paddingBottom: 14,
                            }}
                        >
                            {renderNewFolderSelectionList()}
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#f8f8f8' }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontFamily: 'inter',
                                    backgroundColor: '#f8f8f8',
                                    paddingVertical: 20,
                                }}
                            >
                                No selection.
                            </Text>
                        </View>
                    )}
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
                    height: 180,
                }}
            >
                <View style={{ width: '100%', flexDirection: 'column', paddingHorizontal: 10 }}>
                    {/* Section 1: Shows all cues from Channel */}
                    <View
                        style={{
                            // flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#f8f8f8',
                            paddingTop: 14,
                            paddingBottom: 7,
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: undefined,
                                    backgroundColor: '#f8f8f8',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15,
                                    // marginTop: 10
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                                indicatorStyle="black"
                                // showsVerticalScrollIndicator={false}
                            >
                                {channelCues.map((channelCue: any, ind: number) => {
                                    const { title } = htmlStringParser(
                                        channelCue.channelId && channelCue.channelId !== ''
                                            ? channelCue.original
                                            : channelCue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83',
                                    ].reverse();

                                    const col = colorChoices[channelCue.color];

                                    return (
                                        <View
                                            style={{
                                                height: 60,
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2,
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15,
                                            }}
                                            key={ind.toString()}
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
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(channelCue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(channelCue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...folderCuesToDisplay];
                                                            temp.push(channelCue);
                                                            setFolderCuesToDisplay(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== channelCue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#007AFF', textAlign: 'center' }}>
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
                                                        height: '70%',
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
                                                            color: '#000000',
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
                            <View style={{ backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#f8f8f8',
                                        paddingVertical: 20,
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}
                    {folderCuesToDisplay.length !== 0 ? (
                        <View
                            style={{
                                // flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingTop: 7,
                                paddingBottom: 14,
                            }}
                        >
                            {renderEditFolderSelectionList()}
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#f8f8f8' }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontFamily: 'inter',
                                    backgroundColor: '#f8f8f8',
                                    paddingVertical: 20,
                                }}
                            >
                                No selection.
                            </Text>
                        </View>
                    )}
                </View>
            </InsetShadow>
        );
    };

    if (!init) return null;

    /**
     * @description Content view
     */
    const ContentView = (
        <Animated.View
            style={{
                width: '100%',
                backgroundColor: '#fff',
                height: '100%',
                maxHeight: windowHeight,
                opacity: modalAnimation,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            }}
        >
            {!viewStatus ? (
                <UpdateControls
                    key={JSON.stringify(cue) + props.cueId}
                    setEditorFocus={(val: boolean) => setEditorFocus(val)}
                    channelId={props.channelId}
                    save={save}
                    del={del}
                    submit={submit}
                    viewSubmission={viewSubmission}
                    setViewSubmission={(v: boolean) => setViewSubmission(v)}
                    cue={cue}
                    channelOwner={channelOwner}
                    createdBy={createdBy}
                    folderId={folderId}
                    closeModal={(submit?: boolean) => props.closeModal(submit)}
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
                    setSave={(save: boolean) => setSave(save)}
                    setDelete={(del: boolean) => setDel(del)}
                    setSubmit={(submit: boolean) => setSubmit(submit)}
                    setSubmissionAttempts={(att: any[]) => setSubmissionAttempts(att)}
                    // refreshAfterSubmittingQuiz={() => props.refreshAfterSubmittingQuiz()}
                    setFullScreenWebviewURL={(url: string) => {
                        setFullScreenWebview(true);
                        setFullScreenPdfUrl(url);
                        setFullScreenPdfViewerKey(Math.random().toString());
                    }}
                    reloadViewerKey={reloadViewerKey}
                    setInsertFormulaVisible={(val: boolean) => setInsertFormulaVisible(val)}
                    reloadStatuses={loadStudentResponses}
                />
            ) : (
                <View>
                    {loadingStatuses ? (
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'column',
                                    alignSelf: 'center',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <View
                                    style={{
                                        marginTop: 10,
                                    }}
                                >
                                    <ActivityIndicator size={20} color={'#1F1F1F'} />
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            marginTop: 10,
                                        }}
                                    >
                                        Loading Responses...
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                backgroundColor: 'white',
                                width: '100%',
                                height: windowHeight - 52,
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0,
                            }}
                        >
                            <ScrollView
                                contentContainerStyle={{
                                    width: '100%',
                                    height: windowHeight - 52,
                                    alignItems: 'center',
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
                                <View style={{ maxWidth: undefined, width: '100%' }}>
                                    <SubscribersList
                                        key={JSON.stringify(subscribers)}
                                        subscribers={subscribers}
                                        cueId={cueId}
                                        channelId={props.channelId}
                                        closeModal={() => props.closeModal()}
                                        reload={loadStudentResponses}
                                        cue={cue}
                                        updateCueWithReleaseSubmission={updateCueWithReleaseSubmission}
                                        reloadStatuses={loadStudentResponses}
                                        shareFeedback={shareFeedback}
                                        setShareFeedback={(feedback: boolean) => setShareFeedback(feedback)}
                                        exportQuizScores={exportQuizScores}
                                        setExportQuizScores={(exp: boolean) => setExportQuizScores(exp)}
                                        setFullScreenWebviewURL={(url: string) => {
                                            setFullScreenWebview(true);
                                            setFullScreenPdfUrl(url);
                                            setFullScreenPdfViewerKey(Math.random().toString());
                                        }}
                                        reloadViewerKey={reloadViewerKey}
                                        isQuiz={isQuiz}
                                    />
                                </View>
                            </ScrollView>
                        </View>
                    )}
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
                {channelOwner && folderId && !editFolder && showOriginal && props.channelId ? (
                    <TouchableOpacity
                        onPress={async () => {
                            setEditFolder(true);
                        }}
                        style={{
                            backgroundColor: '#fff',
                            paddingLeft: 0,
                        }}
                        disabled={user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'uppercase',
                                fontSize: 12,
                                fontFamily: 'Inter',
                                color: '#000',
                                fontWeight: 'bold',
                            }}
                        >
                            Edit Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Create new folder button */}
                {channelOwner && !folderId && !createNewFolder && !editFolder && showOriginal && props.channelId ? (
                    <TouchableOpacity
                        onPress={() => {
                            setCreateNewFolder(true);
                            setSelectedCues([cue]);
                            const filter = props.channelCues.filter(
                                (channelCue: any) =>
                                    channelCue._id !== cue._id && (!channelCue.folderId || channelCue.folderId === '')
                            );
                            setChannelCues(filter);
                        }}
                        style={{
                            backgroundColor: '#ffffff',
                            paddingLeft: 0,
                        }}
                        // disabled={user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'uppercase',
                                fontSize: 12,
                                fontFamily: 'Inter',
                                color: '#000',
                                fontWeight: 'bold',
                            }}
                        >
                            New Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Add to existing folder button */}
                {channelFolders.length > 0 &&
                channelOwner &&
                !folderId &&
                !createNewFolder &&
                !editFolder &&
                showOriginal ? (
                    <Menu
                        onSelect={async (choice: any) => {
                            if (addingToFolder) {
                                return;
                            }
                            setAddingToFolder(true);
                            server
                                .mutate({
                                    mutation: addToFolder,
                                    variables: {
                                        cueId: cue._id,
                                        folderId: choice,
                                    },
                                })
                                .then(async (res) => {
                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                    if (!res.data.folder.addToFolder) {
                                        Alert('Could not add to list. Try again.');
                                        setAddingToFolder(false);
                                        return;
                                    }
                                    setAddingToFolder(false);
                                    setFolderId(choice);
                                })
                                .catch((e) => {
                                    Alert('Could not add to list. Try again.');
                                    setAddingToFolder(false);
                                });
                        }}
                    >
                        <MenuTrigger disabled={user.email === disableEmailId}>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    paddingLeft: 0,
                                }}
                            >
                                <Text
                                    style={{
                                        lineHeight: 34,
                                        marginLeft: 20,
                                        textTransform: 'uppercase',
                                        fontSize: 12,
                                        fontFamily: 'Inter',
                                        color: '#000',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Add to Folder
                                </Text>
                            </View>
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
                            {channelFolders.map((folder: any) => {
                                return (
                                    <MenuOption key={folder._id} value={folder._id}>
                                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    fontFamily: 'Inter',
                                                    paddingBottom: 3,
                                                }}
                                            >
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

                                if (selectedCues.length < 2) {
                                    Alert('Folder must contain at least 2 items.');
                                    setCreatingFolder(false);
                                    return;
                                }

                                if (newFolderTitle.trim() === '') {
                                    Alert('Folder title cannot be empty.');
                                    setCreatingFolder(false);
                                    return;
                                }

                                server
                                    .mutate({
                                        mutation: creatFolder,
                                        variables: {
                                            title: newFolderTitle,
                                            cueIds: selectedCues.map((cue: any) => cue._id),
                                        },
                                    })
                                    .then(async (res) => {
                                        // Update cue locally with the new Unread count so that the Unread count reflects in real time

                                        if (res.data.folder.create === null || res.data.folder.create === '') {
                                            Alert('Could not create folder. Try again.');
                                            setCreatingFolder(false);
                                            return;
                                        }

                                        setFolderId(res.data.folder.create);
                                        setCreatingFolder(false);
                                        setCreateNewFolder(false);

                                        refreshCues();
                                    })
                                    .catch((e) => {
                                        Alert('Could not create folder. Try again.');
                                        setCreatingFolder(false);
                                    });
                            }}
                            disabled={creatingFolder || user.email === disableEmailId}
                            style={{
                                backgroundColor: '#fff',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    color: '#000',
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
                                backgroundColor: '#fff',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    color: '#000',
                                    fontWeight: 'bold',
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
                                Alert('Update folder?', '', [
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
                                            setUpdatingFolder(true);

                                            const cueIds = folderCuesToDisplay.map((cue: any) => cue._id);

                                            if (cueIds.length < 2) {
                                                Alert('Folder must contain at least 2 items.');
                                                setUpdatingFolder(false);
                                                return;
                                            }

                                            if (updateFolderTitle.trim() === '') {
                                                Alert('Folder title cannot be empty.');
                                                setUpdatingFolder(false);
                                                return;
                                            }

                                            server
                                                .mutate({
                                                    mutation: updateFolder,
                                                    variables: {
                                                        title: updateFolderTitle,
                                                        cueIds,
                                                        folderId,
                                                    },
                                                })
                                                .then(async (res) => {
                                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                                    if (
                                                        res.data.folder.update === null ||
                                                        res.data.folder.update === undefined
                                                    ) {
                                                        Alert('Could not update folder. Try again.');
                                                        setUpdatingFolder(false);
                                                        return;
                                                    }

                                                    // Check if current cue was removed from the list then set folder id to ""
                                                    if (!cueIds.includes(cue._id)) {
                                                        setFolderId('');
                                                    } else {
                                                        await fetchFolderCues();
                                                    }

                                                    setUpdatingFolder(false);
                                                    setEditFolder(false);

                                                    refreshCues();
                                                })
                                                .catch((e) => {
                                                    Alert('Could not update folder. Try again.');
                                                    setUpdatingFolder(false);
                                                });
                                        },
                                    },
                                ]);
                            }}
                            disabled={updatingFolder || user.email === disableEmailId}
                            style={{
                                backgroundColor: '#fff',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    color: '#000',
                                    fontWeight: 'bold',
                                }}
                            >
                                {creatingFolder ? '...' : 'Update '}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                Alert('Delete folder?', '', [
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
                                            setDeletingFolder(true);

                                            server
                                                .mutate({
                                                    mutation: deleteFolder,
                                                    variables: {
                                                        folderId,
                                                    },
                                                })
                                                .then(async (res) => {
                                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                                    if (!res.data.folder.delete) {
                                                        Alert('Could not delete list. Try again.');
                                                        setDeletingFolder(false);
                                                        return;
                                                    }

                                                    setDeletingFolder(false);
                                                    setEditFolder(false);
                                                    setFolderId('');

                                                    fetchChannelFolders();

                                                    refreshCues();
                                                })
                                                .catch((e) => {
                                                    Alert('Could not delete folder. Try again.');
                                                    setDeletingFolder(false);
                                                });
                                        },
                                    },
                                ]);
                            }}
                            style={{
                                backgroundColor: '#fff',
                                paddingLeft: 0,
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    color: '#000',
                                    fontWeight: 'bold',
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
                                backgroundColor: '#fff',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    color: '#000',
                                    fontWeight: 'bold',
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
            <View style={{ width: '100%', backgroundColor: '#ffffff', flexDirection: 'column', zIndex: 500000 }}>
                {/* The first bar will be the main black bar with the back button, Cue Tabs and buttons */}
                <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'center',
                        height: 52,
                        backgroundColor: '#ffffff',
                        paddingHorizontal: paddingResponsive(),
                        zIndex: 500000,
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
                                width: Platform.OS === 'ios' ? 35 : 40,
                                height: Platform.OS === 'ios' ? 35 : 40,
                                borderRadius: 70,
                                backgroundColor: '#f8f8f8',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 10,
                                    height: 10,
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 15,
                                elevation: 1,
                            }}
                        >
                            <Ionicons
                                name={showExistingFolder ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={20}
                                color="#1f1f1f"
                            />
                        </TouchableOpacity>
                    ) : null}
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            maxWidth: undefined,
                            backgroundColor: '#ffffff',
                            height: 52,
                        }}
                    >
                        {/* BACK BUTTON */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                paddingTop: Dimensions.get('window').width > 768 ? 9 : 9,
                                backgroundColor: '#ffffff',
                            }}
                            onPress={() => {
                                props.closeModal();
                            }}
                        >
                            <Text>
                                <Ionicons name="arrow-back-outline" size={35} color={'#1f1f1f'} />
                            </Text>
                        </TouchableOpacity>

                        {/* CUE TABS IF THE DIMENSIONS IS BIGGER THAN 1024 */}
                        {/* {Dimensions.get('window').width >= 1024 && !createNewFolder && !editFolder ? options : null} */}

                        {/* Render Folder Title input if Create / Edit */}

                        {createNewFolder ? (
                            <View
                                style={{
                                    flex: 1,
                                    height: 52,
                                    backgroundColor: '#ffffff',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    minWidth: 200,
                                    width: 200,
                                    maxWidth: '100%',
                                }}
                            >
                                <TextInput
                                    value={newFolderTitle}
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#f8f8f8',
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
                                        height: 30,
                                    }}
                                    placeholderTextColor={'#000'}
                                    placeholder={'Folder Title'}
                                    onChangeText={(val: any) => setNewFolderTitle(val)}
                                />
                            </View>
                        ) : null}

                        {editFolder ? (
                            <View
                                style={{
                                    flex: 1,
                                    height: 52,
                                    backgroundColor: '#ffffff',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    minWidth: 200,
                                    width: 200,
                                    maxWidth: '100%',
                                }}
                            >
                                <TextInput
                                    value={updateFolderTitle}
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#f8f8f8',
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
                                        height: 30,
                                    }}
                                    placeholderTextColor={'#000'}
                                    placeholder={'Folder Title'}
                                    onChangeText={(val: any) => setUpdateFolderTitle(val)}
                                />
                            </View>
                        ) : null}

                        {/* BUTTONS */}
                        {
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#ffffff',
                                    justifyContent: 'flex-end',
                                    flexDirection: 'row',
                                    paddingTop: 8,
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
                                            backgroundColor: '#ffffff',
                                            marginLeft: 20,
                                        }}
                                        disabled={user.email === disableEmailId}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#ffffff',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'Inter',
                                                color: '#000',
                                            }}
                                        >
                                            {savingCueToCloud ? 'SAVING...' : 'SAVE'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}

                                {channelOwner &&
                                !showOriginal &&
                                !showOptions &&
                                !editFolder &&
                                !createNewFolder &&
                                cue.submission ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setShareFeedback(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#ffffff',
                                            marginLeft: 20,
                                            marginRight: 10,
                                        }}
                                        disabled={user.email === disableEmailId}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#ffffff',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'Inter',
                                                color: '#000',
                                            }}
                                        >
                                            {cue.releaseSubmission ? 'HIDE' : 'SHARE'} FEEDBACK
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}

                                {channelOwner &&
                                !showOriginal &&
                                !showOptions &&
                                !editFolder &&
                                !createNewFolder &&
                                isQuiz ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setExportQuizScores(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#ffffff',
                                            marginLeft: 20,
                                            paddingTop: 2,
                                            marginRight: 10,
                                        }}
                                    >
                                        <Ionicons
                                            name="download-outline"
                                            size={Dimensions.get('window').width < 800 ? 23 : 26}
                                            color="black"
                                        />
                                    </TouchableOpacity>
                                ) : null}

                                {!channelOwner &&
                                !showOriginal &&
                                !viewStatus &&
                                !showOptions &&
                                !showComments &&
                                !isQuiz &&
                                !editFolder &&
                                !createNewFolder &&
                                !cue.releaseSubmission &&
                                submissionAttempts.length > 0 &&
                                ((!allowLateSubmission && new Date() < deadline) ||
                                    (allowLateSubmission && new Date() < availableUntil)) ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setViewSubmission(!viewSubmission);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#ffffff',
                                            marginLeft: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#ffffff',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'Inter',
                                                color: '#000',
                                            }}
                                        >
                                            {viewSubmission ? 'NEW SUBMISSION' : 'VIEW SUBMISSION'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                {!channelOwner &&
                                !showOriginal &&
                                !viewStatus &&
                                !showOptions &&
                                !showComments &&
                                !isQuiz &&
                                !editFolder &&
                                !createNewFolder &&
                                !cue.releaseSubmission &&
                                ((!allowLateSubmission && new Date() < deadline) ||
                                    (allowLateSubmission && new Date() < availableUntil)) &&
                                !viewSubmission ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setSubmit(true);
                                        }}
                                        disabled={
                                            submit ||
                                            cue.releaseSubmission ||
                                            (!allowLateSubmission && new Date() > deadline) ||
                                            (allowLateSubmission && new Date() > availableUntil)
                                        }
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#ffffff',
                                            marginLeft: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#ffffff',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'Inter',
                                                color: '#000',
                                            }}
                                        >
                                            {submit ? 'SUBMITTING...' : 'SUBMIT'}
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
                                            backgroundColor: '#ffffff',
                                        }}
                                        disabled={user.email === disableEmailId}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: '#ffffff',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'Inter',
                                                color: '#000',
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
                        backgroundColor: '#f8f8f8',
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
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {createNewFolder ? renderNewFolderOptions() : null}
                </View>

                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {editFolder ? renderEditFolderOptions() : null}
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, height: '100%' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    flex: 1,
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
                        maxHeight: '100%',
                    }}
                >
                    <View style={{ width: '100%', position: 'relative', height: '100%' }}>
                        {/* Header */}
                        {!editorFocus && !insertFormulaVisible ? renderHeader() : null}

                        {/* Main Content */}
                        {syncingCueFromBackend && !syncCueError ? (
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    flex: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        alignSelf: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            marginTop: 10,
                                        }}
                                    >
                                        <ActivityIndicator size={20} color={'#1F1F1F'} />
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                                marginTop: 10,
                                            }}
                                        >
                                            Loading...
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : syncCueError || !cue ? (
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    flex: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        alignSelf: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons name={'cloud-offline-outline'} size={50} />

                                    <Text
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'Inter',
                                            marginTop: 10,
                                        }}
                                    >
                                        Failed to fetch content. Try again.
                                    </Text>

                                    {syncingCueFromBackend ? (
                                        <View
                                            style={{
                                                marginTop: 10,
                                            }}
                                        >
                                            <ActivityIndicator size={20} color={'#1F1F1F'} />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: 'white',
                                                marginTop: 25,
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                            onPress={() => {
                                                fetchCueFromBackend(cueId);
                                            }}
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
                                                    width: 130,
                                                }}
                                            >
                                                Reload page
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    flex: 1,
                                }}
                            >
                                {ContentView}
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
            {/* Mobile tabs */}
            {!editorFocus && !insertFormulaVisible ? (
                <View
                    style={{
                        position: 'absolute',
                        backgroundColor: '#fff',
                        alignSelf: 'flex-end',
                        width: '100%',
                        paddingTop: Platform.OS === 'ios' ? 12 : 8,
                        paddingBottom: Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -10,
                        },
                        bottom: 0,
                        right: 0,
                        shadowOpacity: 0.03,
                        shadowRadius: 12,
                        zIndex: 100,
                        elevation: 120,
                        borderTopColor: '#e8e8e8',
                        borderTopWidth: 1,
                    }}
                >
                    {options}
                </View>
            ) : null}
            <BottomSheet
                isOpen={fullScreenWebview}
                snapPoints={[
                    0,
                    Platform.OS === 'ios' ? Dimensions.get('window').height - 60 : Dimensions.get('window').height,
                ]}
                close={() => {
                    setFullScreenWebview(false);
                    setFullScreenPdfUrl('');
                    setReloadViewerKey(Math.random().toString());
                }}
                title={''}
                renderContent={() => {
                    return (
                        <View style={{ width: '100%', height: '100%', paddingTop: 10 }} key={fullScreenPdfViewerKey}>
                            <WebView
                                startInLoadingState={true}
                                source={{ uri: fullScreenPdfUrl }}
                                renderLoading={() => renderLoadingSpinner()}
                                renderError={() => renderWebviewError()}
                            />
                        </View>
                    );
                }}
                header={true}
                callbackNode={props.callbackNode}
            />
        </View>
    );
};

export default Update;

const styles: any = StyleSheet.create({
    all: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#000',
        height: 25,
        // backgroundColor: '#000',
        lineHeight: 25,
        fontFamily: 'Inter',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    allBlueTabButton: {
        backgroundColor: '#000',
        borderRadius: 20,
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: 2,
    },
    tabButton: {
        // backgroundColor: '#000',
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        borderRadius: 20,
        color: '#000000',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: 2,
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        backgroundColor: '#000',
        lineHeight: 24,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase',
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '30%',
        display: 'flex',
        flexDirection: 'row',
    },
    date2: {
        fontSize: 10,
        color: '#1F1F1F',
        // marginLeft: 10,
        lineHeight: 12,
        textAlign: 'left',
        paddingVertical: 2,
        flex: 1,
    },
});
