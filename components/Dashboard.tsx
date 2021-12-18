// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Image,
    Dimensions,
    Linking,
    ScrollView,
    Switch,
    Platform,
    TextInput as DefaultInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';
import moment from 'moment';

// API
import axios from 'axios';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    checkChannelStatus,
    subscribe,
    markAttendance,
    meetingRequest,
    startInstantMeeting,
    getOngoingMeetings
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text, TouchableOpacity } from '../components/Themed';
import Walkthrough from './Walkthrough';
import Channels from './Channels';
import Create from './Create';
import CalendarX from './Calendar';
import { TextInput } from './CustomTextInput';
import alert from './Alert';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Performance from './Performance';
import SearchResultCard from './SearchResultCard';
import Inbox from './Inbox';
import Card from './Card';
import Alert from '../components/Alert';
import Discussion from './Discussion';
import ChannelSettings from './ChannelSettings';
// import logo from '../components/default-images/cues-logo-white-exclamation-hidden.jpg';
import InsetShadow from 'react-native-inset-shadow';
import DropDownPicker from 'react-native-dropdown-picker';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { htmlStringParser } from '../helpers/HTMLParser';
import { zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const styles = styleObject();
    const [userId, setUserId] = useState('');
    const scrollViewRef: any = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [collapseMap, setCollapseMap] = useState<any>({});
    const [results, setResults] = useState<any>({
        Channels: [],
        Classroom: [],
        Messages: [],
        Threads: []
    });
    const [resultCount, setResultCount] = useState(0);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [filterStart, setFilterStart] = useState<any>(null);
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [searchOptions] = useState(['Classroom', 'Messages', 'Threads', 'Channels']);
    const [sortBy, setSortBy] = useState('Date ↑');
    const [cueMap, setCueMap] = useState<any>({});
    const [categoryMap, setCategoryMap] = useState<any>({});
    const [editFolderChannelId, setEditFolderChannelId] = useState('');
    const [cueIds, setCueIds] = useState<any[]>([]);
    const [filterByChannel, setFilterByChannel] = useState('All');
    const [indexMap, setIndexMap] = useState<any>({});
    const [channelKeyList, setChannelKeyList] = useState<any[]>([]);
    const [channelHeightList, setChannelHeightList] = useState<any[]>([]);
    const [activityChannelId, setActivityChannelId] = useState<any>('');
    const [filterEventsType, setFilterEventsType] = useState('All');
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState();
    const [openChannelId, setOpenChannelId] = useState('');
    let cancelTokenRef: any = useRef({});
    const tabs = ['Content', 'Discuss', 'Meet', 'Scores', 'Settings'];
    const width = Dimensions.get('window').width;
    const windowHeight = width < 768 ? Dimensions.get('window').height - 0 : Dimensions.get('window').height;
    const sortbyOptions = [
        {
            value: 'Date ↑',
            text: 'Date ↑'
        },
        {
            value: 'Date ↓',
            text: 'Date ↓'
        },
        {
            value: 'Priority',
            text: 'Priority'
        }
    ];
    const [showInstantMeeting, setShowInstantMeeting] = useState(false);
    const [instantMeetingChannelId, setInstantMeetingChannelId] = useState<any>('');
    const [instantMeetingCreatedBy, setInstantMeetingCreatedBy] = useState<any>('');
    const [instantMeetingTitle, setInstantMeetingTitle] = useState<any>('');
    const [instantMeetingDescription, setInstantMeetingDescription] = useState<any>('');
    const [instantMeetingStart, setInstantMeetingStart] = useState<any>('');
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>('');
    const [instantMeetingAlertUsers, setInstantMeetingAlertUsers] = useState<any>(true);
    const [ongoingMeetings, setOngoingMeetings] = useState<any[]>([]);
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');

    // ALERTS
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');

    // const openThreadFromSearch = useCallback(
    //     (channelId: String) => {
    //         if (
    //             scrollViewRef &&
    //             scrollViewRef.current !== null &&
    //             channelKeyList &&
    //             channelKeyList.length > 0 &&
    //             channelHeightList &&
    //             channelHeightList.length > 0
    //         ) {
    //             let matchIndex = -1;

    //             channelKeyList.map((key: any, index: number) => {
    //                 if (key === channelId) {
    //                     matchIndex = index;
    //                 }
    //             });

    //             let indexMapKey = '';

    //             Object.keys(indexMap).map((key: any) => {
    //                 if (key.split('-SPLIT-')[1] === channelId) {
    //                     indexMapKey = key;
    //                 }
    //             });

    //             if (matchIndex === -1 || !channelHeightList[matchIndex] || indexMapKey === '') {
    //                 Alert('Cannot open discussion.');
    //             }

    //             const temp = JSON.parse(JSON.stringify(indexMap));
    //             temp[indexMapKey] = 2;
    //             setIndexMap(temp);

    //             const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
    //             tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
    //             setCollapseMap(tempCollapse);

    //             scrollViewRef.current.scrollTo({
    //                 x: 0,
    //                 y: channelHeightList[matchIndex],
    //                 animated: true
    //             });
    //         }
    //     },
    //     [scrollViewRef.current, channelKeyList, channelHeightList, indexMap]
    // );

    // HOOKS

    /**
     * @description Open discussion from Activity using loadDiscussionForChannelId => It will open that Channel in ScrollView
     */
    useEffect(() => {
        setLoadDiscussionForChannelId(props.loadDiscussionForChannelId);
    }, [props.loadDiscussionForChannelId]);

    /**
     * @description Opens a channel in ScrollView
     */
    useEffect(() => {
        setOpenChannelId(props.openChannelId);
    }, [props.openChannelId]);

    /**
     * @description Scrolls to specific channel in Channels ScrollView for openChannelId
     */
    useEffect(() => {
        if (
            scrollViewRef &&
            scrollViewRef.current !== null &&
            channelKeyList &&
            channelKeyList.length > 0 &&
            channelHeightList &&
            channelHeightList.length > 0 &&
            openChannelId !== ''
        ) {
            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === openChannelId) {
                    matchIndex = index;
                }
            });

            let indexMapKey = '';

            Object.keys(indexMap).map((key: any) => {
                if (key.split('-SPLIT-')[1] === openChannelId) {
                    indexMapKey = key;
                }
            });

            if (matchIndex === -1 || !channelHeightList[matchIndex] || !openChannelId) return;

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
            setCollapseMap(tempCollapse);

            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true
            });

            setOpenChannelId('');
        }
    }, [scrollViewRef.current, channelKeyList, channelHeightList, openChannelId]);

    /**
     * @description Scrolls to specific channel in Channels ScrollView for loadDiscussionForChannelId
     */
    useEffect(() => {
        if (
            scrollViewRef &&
            scrollViewRef.current !== null &&
            channelKeyList &&
            channelKeyList.length > 0 &&
            channelHeightList &&
            channelHeightList.length > 0 &&
            loadDiscussionForChannelId !== ''
        ) {
            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === loadDiscussionForChannelId) {
                    matchIndex = index;
                }
            });

            let indexMapKey = '';

            Object.keys(indexMap).map((key: any) => {
                if (key.split('-SPLIT-')[1] === loadDiscussionForChannelId) {
                    indexMapKey = key;
                }
            });

            if (
                matchIndex === -1 ||
                !channelHeightList[matchIndex] ||
                indexMapKey === '' ||
                !loadDiscussionForChannelId
            )
                return;

            const temp = JSON.parse(JSON.stringify(indexMap));
            temp[indexMapKey] = 2;
            setIndexMap(temp);

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
            setCollapseMap(tempCollapse);

            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true
            });

            setLoadDiscussionForChannelId('');
        }
    }, [scrollViewRef.current, channelKeyList, channelHeightList, loadDiscussionForChannelId, indexMap]);

    /**
     * @description Prepares all the data to be displayed in workspace
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                setUserId(user._id);

                if (user.zoomInfo) {
                    setUserZoomInfo(user.zoomInfo);
                }
            }
        })();

        const temp: any = {};
        const tempCat: any = {};
        const mycues: any[] = [];
        temp['Home'] = [];
        const tempCollapse: any = {};
        tempCollapse['Home'] = false;
        const tempIndexes: any = {};

        let dateFilteredCues: any[] = [];
        if (filterStart && filterEnd) {
            dateFilteredCues = props.cues.filter((item: any) => {
                const date = new Date(item.date);
                return date >= filterStart && date <= filterEnd;
            });
        } else {
            dateFilteredCues = props.cues;
        }

        props.subscriptions.map((sub: any) => {
            // const tempCategories: any = {}
            const tempCues: any[] = [];
            const cat: any = { '': [] };
            dateFilteredCues.map((cue: any, ind: any) => {
                if (cue.channelId === sub.channelId) {
                    tempCues.push(cue);
                    if (!cat[cue.customCategory]) {
                        cat[cue.customCategory] = '';
                    }
                }
            });

            if (sortBy === 'Priority') {
                tempCues.reverse();
            } else if (sortBy === 'Date ↑') {
                tempCues.sort((a: any, b: any) => {
                    const aDate = new Date(a.date);
                    const bDate = new Date(b.date);
                    if (aDate < bDate) {
                        return 1;
                    } else if (aDate > bDate) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }

            const key =
                sub.channelName +
                '-SPLIT-' +
                sub.channelId +
                '-SPLIT-' +
                sub.channelCreatedBy +
                '-SPLIT-' +
                sub.colorCode;
            temp[key] = tempCues;
            tempCollapse[key] = false;
            tempIndexes[key] = 0;
            if (!cat['']) {
                delete cat[''];
            }
            tempCat[key] = Object.keys(cat);
        });
        const cat: any = { '': [] };
        props.cues.map((cue: any) => {
            if (!cue.channelId || cue.channelId === '') {
                mycues.push(cue);
                if (!cat[cue.customCategory]) {
                    cat[cue.customCategory] = 1;
                }
            }
        });
        if (sortBy === 'Priority') {
            mycues.reverse();
        } else if (sortBy === 'Date ↑') {
            mycues.sort((a: any, b: any) => {
                const aDate = new Date(a.date);
                const bDate = new Date(b.date);
                if (aDate < bDate) {
                    return -1;
                } else if (aDate > bDate) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }

        temp['Home'] = mycues;
        if (!cat['']) {
            delete cat[''];
        }
        tempCat['Home'] = Object.keys(cat);
        tempIndexes['Home'] = 0;

        setCueMap(temp);
        setCollapseMap(tempCollapse);
        setCategoryMap(tempCat);
        setIndexMap(tempIndexes);
    }, [sortBy, filterStart, filterEnd]);

    /**
     * @description Calls method to fetch any ongoing meetings
     */
    useEffect(() => {
        getCurrentMeetings();
    }, [userId, collapseMap]);

    /**
     * @description Fetches search results for search term
     */
    useEffect(() => {
        if (searchTerm.trim() === '') {
            return;
        }

        setLoadingSearchResults(true);

        if (typeof cancelTokenRef.current != typeof undefined) {
            cancelTokenRef.current &&
                cancelTokenRef.current.cancel &&
                cancelTokenRef.current.cancel('Operation canceled due to new request.');
        }

        //Save the cancel token for the current request
        cancelTokenRef.current = axios.CancelToken.source();

        try {
            axios
                .post(
                    `https://api.learnwithcues.com/search`,
                    {
                        term: searchTerm,
                        userId
                    },
                    { cancelToken: cancelTokenRef.current.token }
                )
                .then((res: any) => {
                    console.log(res.data);
                    console.log(res.channels);
                    const totalCount =
                        res.data.personalCues.length +
                        res.data.channelCues.length +
                        res.data.channels.length +
                        res.data.threads.length +
                        res.data.messages.length;

                    const tempResults = {
                        Classroom: [...res.data.personalCues, ...res.data.channelCues],
                        Channels: res.data.channels,
                        Threads: res.data.threads,
                        Messages: res.data.messages
                    };

                    setResultCount(totalCount);
                    setResults(tempResults);
                    setLoadingSearchResults(false);
                });
        } catch (error) {
            setLoadingSearchResults(false);
            console.log(error);
        }
    }, [searchTerm, userId]);

    /**
     * @description API call to start instant meeting
     */
    const createInstantMeeting = useCallback(() => {
        if (instantMeetingTitle === '') {
            Alert('Enter topic for meeting');
            return;
        }

        const startDate = new Date();
        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeeting,
                variables: {
                    userId: instantMeetingCreatedBy,
                    channelId: instantMeetingChannelId,
                    title: instantMeetingTitle,
                    description: instantMeetingDescription,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    notifyUsers: instantMeetingAlertUsers
                }
            })
            .then(res => {
                if (res.data && res.data.channel.startInstantMeeting !== 'error') {
                    setShowInstantMeeting(false);
                    setInstantMeetingChannelId('');
                    setInstantMeetingCreatedBy('');
                    setInstantMeetingTitle('');
                    setInstantMeetingDescription('');
                    setInstantMeetingStart('');
                    setInstantMeetingEnd('');
                    setInstantMeetingAlertUsers(true);

                    window.open(res.data.channel.startInstantMeeting, '_blank');

                    getCurrentMeetings();
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch(err => {
                Alert('Something went wrong.');
            });
    }, [
        instantMeetingTitle,
        instantMeetingDescription,
        instantMeetingStart,
        instantMeetingEnd,
        instantMeetingChannelId,
        instantMeetingCreatedBy,
        instantMeetingAlertUsers
    ]);

    /**
     * @description Handle create instant meeting for channel owners
     */
    const getCurrentMeetings = useCallback(async () => {
        // console.log('Collapse map', collapseMap);

        let channelId = '';

        Object.keys(collapseMap).map((key: any) => {
            if (collapseMap[key] && key.split('-SPLIT-')[0] !== 'Home') {
                console.log('Active', collapseMap[key]);
                console.log('Key', key.split('-SPLIT-')[1]);
                channelId = key.split('-SPLIT-')[1];
            }
        });

        if (userId !== '' && channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getOngoingMeetings,
                    variables: {
                        userId,
                        channelId
                    }
                })
                .then(res => {
                    if (res.data && res.data.channel.ongoingMeetings) {
                        setOngoingMeetings(res.data.channel.ongoingMeetings);
                    }
                })
                .catch(err => {
                    Alert('Something went wrong.');
                });
        }
    }, [userId, collapseMap]);

    /**
     * @description Handle create instant meeting for channel owners
     */
    const handleStartMeeting = async (channelId: string, channelCreatedBy: string) => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const user = JSON.parse(u);
            if (user.zoomInfo) {
                setInstantMeetingChannelId(channelId);
                setInstantMeetingCreatedBy(channelCreatedBy);
                const current = new Date();
                setInstantMeetingStart(current);
                setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
                setShowInstantMeeting(true);
            } else {
                Alert('You must connect with Zoom to start a meeting.');

                // ZOOM OATH

                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                    zoomRedirectUri
                )}&state=${userId}`;

                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Linking.openURL(url);
                } else {
                    window.open(url);
                }
            }
        } else {
            return;
        }
    };

    /**
     * @description Call to enter classroom
     */
    const handleEnterClassroom = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const user = JSON.parse(u);
            if (user.zoomInfo) {
                // Zoom is connected
                const server = fetchAPI('');
                server
                    .mutate({
                        mutation: meetingRequest,
                        variables: {
                            userId,
                            channelId: instantMeetingChannelId,
                            isOwner: user._id.toString().trim() === instantMeetingCreatedBy
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.channel.meetingRequest !== 'error') {
                            server.mutate({
                                mutation: markAttendance,
                                variables: {
                                    userId: userId,
                                    channelId: props.channelId
                                }
                            });
                            window.open(res.data.channel.meetingRequest, '_blank');
                        } else {
                            Alert('Classroom not in session. Waiting for instructor.');
                        }
                    })
                    .catch(err => {
                        Alert('Something went wrong.');
                    });
            }
        }
    }, [userId, instantMeetingChannelId, instantMeetingCreatedBy]);

    /**
     * @description Fetches status of channel and depending on that handles subscription to channel
     */
    const handleSub = useCallback(async channelId => {
        const server = fetchAPI('');
        server
            .query({
                query: checkChannelStatus,
                variables: {
                    channelId
                }
            })
            .then(res => {
                if (res.data.channel && res.data.channel.getChannelStatus) {
                    const channelStatus = res.data.channel.getChannelStatus;
                    switch (channelStatus) {
                        case 'password-not-required':
                            handleSubscribe(channelId, '');
                            break;
                        case 'password-required':
                            let pass: any = prompt('Enter Password');
                            if (!pass) {
                                pass = '';
                            }
                            handleSubscribe(channelId, pass);
                            break;
                        case 'non-existant':
                            Alert(doesNotExistAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch(err => {
                console.log(err);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, []);

    /**
     * @description Subscribes user to a channel
     */
    const handleSubscribe = useCallback(
        async (channelId, pass) => {
            const uString: any = await AsyncStorage.getItem('user');
            const user = JSON.parse(uString);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: subscribe,
                    variables: {
                        userId: user._id,
                        channelId,
                        password: pass
                    }
                })
                .then(res => {
                    if (res.data.subscription && res.data.subscription.subscribe) {
                        const subscriptionStatus = res.data.subscription.subscribe;
                        switch (subscriptionStatus) {
                            case 'subscribed':
                                alert('Subscribed successfully!');
                                setSearchTerm('');
                                props.reloadData();
                                break;
                            case 'incorrect-password':
                                Alert(incorrectPasswordAlert);
                                break;
                            case 'already-subbed':
                                Alert(alreadySubscribedAlert);
                                break;
                            case 'error':
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                        }
                    }
                })
                .catch(err => {
                    Alert(somethingWrongAlert, checkConnectionAlert);
                });
        },
        [props.closeModal]
    );

    // FUNCTIONS

    const renderTabs = (key: any) => {
        const activeTab = tabs[indexMap[key]];

        return (
            <View
                style={{
                    flexDirection: 'row',
                    marginBottom: 30,
                    paddingTop: 10,
                    backgroundColor: '#efefef',
                    flex: 1,
                    justifyContent: 'center'
                    //paddingVertical: 20
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        maxWidth: 900,
                        flex: 1,
                        backgroundColor: '#efefef'
                    }}
                >
                    <TouchableOpacity
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#efefef'
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap));
                            temp[key] = 0;
                            setIndexMap(temp);
                        }}
                    >
                        <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name="library-outline" size={18} style={{ marginBottom: 5 }} />
                        </Text>
                        <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                            {props.version === 'read' ? 'Read' : 'Library'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#efefef'
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap));
                            temp[key] = 1;
                            setIndexMap(temp);
                        }}
                    >
                        <Text style={activeTab === 'Discuss' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name="chatbubbles-outline" size={18} />
                        </Text>
                        <Text style={activeTab === 'Discuss' ? styles.allGrayFill1 : styles.all1}>Discussion</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column",
                        backgroundColor: '#efefef'
                    }}
                    onPress={() => handleEnterClassroom()}>
                    <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                        <Ionicons name='videocam-outline' size={18} />
                    </Text>
                    <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                        Meet
                    </Text>
                </TouchableOpacity> */}
                    {props.version !== 'read' ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#efefef'
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 2;
                                setIndexMap(temp);
                            }}
                        >
                            <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="videocam-outline" size={18} />
                            </Text>
                            <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>Meetings</Text>
                        </TouchableOpacity>
                    ) : null}
                    {props.version !== 'read' ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#efefef'
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 3;
                                setIndexMap(temp);
                            }}
                        >
                            <Text style={activeTab === 'Scores' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="bar-chart-outline" size={18} />
                            </Text>
                            <Text style={activeTab === 'Scores' ? styles.allGrayFill1 : styles.all1}>Scores</Text>
                        </TouchableOpacity>
                    ) : null}
                    {key.split('-SPLIT-')[2] === userId ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#efefef'
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 4;
                                setIndexMap(temp);
                            }}
                        >
                            <Text style={activeTab === 'Settings' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="build-outline" size={18} />
                            </Text>
                            <Text style={activeTab === 'Settings' ? styles.allGrayFill1 : styles.all1}>
                                {props.version === 'read' ? 'Edit' : 'Settings'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    /**
     * @description Renders filter for Agenda
     */
    // const renderEventFilters = () => {
    //     const channelOptions = [
    //         { value: 'All', text: 'All' },
    //         { value: 'My Events', text: 'My Events' }
    //     ];

    //     props.subscriptions.map((sub: any) => {
    //         channelOptions.push({
    //             value: sub.channelName,
    //             text: sub.channelName
    //         });
    //     });

    //     const typeOptions = [
    //         { value: 'All', text: 'All' },
    //         { value: 'Lectures', text: 'Lectures' },
    //         { value: 'Submissions', text: 'Submissions' },
    //         { value: 'Events', text: 'Events' }
    //     ];

    //     return (
    //         <div style={{ display: 'flex', flexDirection: 'column' }}>
    //             <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
    //                 <Text style={{ fontSize: 10, color: '#000000', paddingLeft: 5, paddingBottom: 10 }}>Channel</Text>
    //                 <label style={{ width: 200, backgroundColor: 'white' }}>
    //                     <Select
    //                         touchUi={true}
    //                         theme="ios"
    //                         themeVariant="light"
    //                         value={filterByChannel}
    //                         onChange={(val: any) => {
    //                             setFilterByChannel(val.value);
    //                         }}
    //                         responsive={{
    //                             small: {
    //                                 display: 'bubble'
    //                             },
    //                             medium: {
    //                                 touchUi: false
    //                             }
    //                         }}
    //                         dropdown={false}
    //                         data={channelOptions}
    //                     />
    //                 </label>
    //             </div>
    //             <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
    //                 <Text style={{ fontSize: 10, color: '#000000', paddingLeft: 5, paddingBottom: 10 }}>Type</Text>

    //                 <label style={{ width: 200, backgroundColor: 'white' }}>
    //                     <Select
    //                         touchUi={true}
    //                         theme="ios"
    //                         themeVariant="light"
    //                         value={filterEventsType}
    //                         onChange={(val: any) => {
    //                             setFilterEventsType(val.value);
    //                         }}
    //                         responsive={{
    //                             small: {
    //                                 display: 'bubble'
    //                             },
    //                             medium: {
    //                                 touchUi: false
    //                             }
    //                         }}
    //                         dropdown={false}
    //                         data={typeOptions}
    //                     />
    //                 </label>
    //             </div>
    //         </div>
    //     );
    // };

    /**
     * @description Renders View for search results
     */
    const searchResults = (
        <View
            key={cueMap.toString() + JSON.stringify(results)}
            style={{
                flexDirection: 'row',
                height:
                    Dimensions.get('window').width < 768
                        ? Dimensions.get('window').height - 115
                        : Dimensions.get('window').height - 52,
                width: '100%',
                overflow: 'hidden',
                justifyContent: 'center',
                backgroundColor: '#efefef'
            }}
        >
            <View
                style={{
                    width: '100%',
                    maxWidth: 900,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                    backgroundColor: '#efefef'
                }}
            >
                {!loadingSearchResults && resultCount !== 0 ? (
                    <Text
                        style={{
                            fontSize: 20,
                            paddingVertical: 30,
                            fontFamily: 'inter',
                            // flex: 1,
                            lineHeight: 23,
                            color: '#006AFF',
                            backgroundColor: '#efefef'
                        }}
                    >
                        {resultCount} Results
                    </Text>
                ) : null}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    horizontal={true}
                    nestedScrollEnabled={true}
                    contentContainerStyle={{
                        width: '100%'
                    }}
                >
                    {!loadingSearchResults &&
                    results &&
                    results[searchOptions[0]].length === 0 &&
                    results[searchOptions[1]].length === 0 &&
                    results[searchOptions[2]].length === 0 &&
                    results[searchOptions[3]].length === 0 ? (
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 20,
                                paddingVertical: 50,
                                fontFamily: 'inter',
                                flex: 1,
                                backgroundColor: '#efefef'
                            }}
                        >
                            No results.
                        </Text>
                    ) : null}
                    {loadingSearchResults ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#efefef'
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', backgroundColor: '#efefef' }}>
                        {searchOptions.map((option: any) => {
                            if (results[option].length === 0 || loadingSearchResults) {
                                return null;
                            }

                            return (
                                <View style={{ marginRight: 20, backgroundColor: '#efefef' }}>
                                    <Text
                                        style={{
                                            flexDirection: 'row',
                                            color: '#1F1F1F',
                                            // fontWeight: 'bold',
                                            fontSize: 14,
                                            lineHeight: 25,
                                            fontFamily: 'inter',
                                            paddingBottom: 10
                                        }}
                                    >
                                        {option === 'Classroom' ? 'Content' : option}
                                    </Text>
                                    <ScrollView>
                                        {results[option].map((obj: any, index: any) => {
                                            let t = '';
                                            let s = '';
                                            let channelName = '';
                                            let colorCode = '';
                                            let subscribed = false;

                                            if (option === 'Classroom') {
                                                const { title, subtitle } = htmlStringParser(obj.cue);
                                                t = title;
                                                s = subtitle;
                                                const filterChannel = props.subscriptions.filter((channel: any) => {
                                                    return channel.channelId === obj.channelId;
                                                });

                                                if (filterChannel && filterChannel.length !== 0) {
                                                    channelName = filterChannel[0].channelName;
                                                    colorCode = filterChannel[0].colorCode;
                                                }
                                            } else if (option === 'Channels') {
                                                t = obj.name;

                                                channelName = obj.name;
                                                // Determine if already subscribed or not
                                                const existingSubscription = props.subscriptions.filter(
                                                    (channel: any) => {
                                                        return channel.channelId === obj._id;
                                                    }
                                                );

                                                if (existingSubscription && existingSubscription.length !== 0) {
                                                    subscribed = true;
                                                }
                                            } else if (option === 'Threads') {
                                                if (
                                                    obj.message[0] === '{' &&
                                                    obj.message[obj.message.length - 1] === '}'
                                                ) {
                                                    const o = JSON.parse(obj.message);
                                                    t = o.title;
                                                    s = o.type;
                                                } else {
                                                    const { title, subtitle } = htmlStringParser(obj.message);
                                                    t = title;
                                                    s = subtitle;
                                                }
                                                const filterChannel = props.subscriptions.filter((channel: any) => {
                                                    return channel.channelId === obj.channelId;
                                                });

                                                if (filterChannel && filterChannel.length !== 0) {
                                                    channelName = filterChannel[0].channelName;
                                                    colorCode = filterChannel[0].colorCode;
                                                }
                                            } else if (option === 'Messages') {
                                                if (
                                                    obj.message[0] === '{' &&
                                                    obj.message[obj.message.length - 1] === '}'
                                                ) {
                                                    const o = JSON.parse(obj.message);
                                                    t = o.title;
                                                    s = o.type;
                                                } else {
                                                    const { title, subtitle } = htmlStringParser(obj.message);
                                                    t = title;
                                                    s = subtitle;
                                                }
                                            }

                                            return (
                                                <View
                                                    style={{
                                                        // height: 150,
                                                        marginBottom: 15,
                                                        // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                        // maxWidth: 150,
                                                        backgroundColor: '#efefef',
                                                        width: '100%',
                                                        maxWidth: 150
                                                    }}
                                                    key={index}
                                                >
                                                    <SearchResultCard
                                                        title={t}
                                                        subtitle={s}
                                                        channelName={channelName}
                                                        colorCode={colorCode}
                                                        option={option}
                                                        subscribed={subscribed}
                                                        handleSub={() => handleSub(obj.channelId)}
                                                        onPress={async () => {
                                                            if (option === 'Classroom') {
                                                                props.openCueFromCalendar(
                                                                    obj.channelId,
                                                                    obj._id,
                                                                    obj.createdBy
                                                                );
                                                                setSearchTerm('');
                                                            } else if (option === 'Threads') {
                                                                await AsyncStorage.setItem(
                                                                    'openThread',
                                                                    obj.parentId && obj.parentId !== ''
                                                                        ? obj.parentId
                                                                        : obj._id
                                                                );

                                                                if (obj.cueId && obj.cueId !== '') {
                                                                    props.openQAFromSearch(obj.channelId, obj.cueId);
                                                                } else {
                                                                    props.openDiscussionFromSearch(obj.channelId);

                                                                    props.setLoadDiscussionForChannelId(obj.channelId);
                                                                }

                                                                setSearchTerm('');
                                                            } else if (option === 'Messages') {
                                                                // open chat and set Chat ID and users in Async storage to open that specific chat

                                                                await AsyncStorage.setItem(
                                                                    'openChat',
                                                                    JSON.stringify({
                                                                        _id: obj.groupId,
                                                                        users: obj.users
                                                                    })
                                                                );

                                                                props.setOption('Inbox');

                                                                setSearchTerm('');
                                                            } else if (option === 'Channels') {
                                                                if (subscribed) {
                                                                    // Open the channel meeting
                                                                    props.openChannelFromActivity(obj._id);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const renderOngoingMeetings = (createdBy: string, colorCode: string) => {
        // console.log('Ongoing meetings', ongoingMeetings);
        return (
            <View style={{ width: '100%', maxWidth: 900, backgroundColor: '#efefef', paddingBottom: 30 }}>
                <Text style={{ color: '#1f1f1f', fontSize: 15, fontFamily: 'inter', marginBottom: 20 }}>
                    In Progress
                </Text>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        // paddingTop: 10,
                        maxHeight: 500,
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        borderLeftColor: colorCode,
                        borderLeftWidth: 3,
                        shadowOffset: {
                            width: 2,
                            height: 2
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        zIndex: 5000000
                    }}
                >
                    <ScrollView
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
                            maxHeight: Dimensions.get('window').width < 1024 ? 400 : 500
                        }}
                    >
                        {ongoingMeetings.map((meeting: any, ind: number) => {
                            let startTime = emailTimeDisplay(meeting.start);
                            let endTime = emailTimeDisplay(meeting.end);

                            return (
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        borderColor: '#efefef',
                                        paddingVertical: 8,
                                        borderBottomWidth: ind === ongoingMeetings.length - 1 ? 0 : 1,
                                        // minWidth: 600, // flex: 1,
                                        width: '100%',
                                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center'
                                    }}
                                >
                                    <View style={{}}>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                fontFamily: 'inter',
                                                maxWidth: 300
                                            }}
                                        >
                                            {meeting.title}
                                        </Text>
                                        {meeting.description ? (
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    padding: 5,
                                                    maxWidth: 300
                                                }}
                                            >
                                                {meeting.description}
                                                {/* This is a sample description */}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 'auto',
                                            marginTop: Dimensions.get('window').width < 768 ? 5 : 0
                                        }}
                                    >
                                        <View style={{ marginRight: 20 }}>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    padding: 5,
                                                    lineHeight: 13
                                                }}
                                            >
                                                {startTime} to {endTime}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!userZoomInfo || userZoomInfo.accountId === '') {
                                                        Alert(
                                                            'Join Meeting?',
                                                            'WARNING- To mark attendance as present, you must Connect to Zoom under Account.',
                                                            [
                                                                {
                                                                    text: 'Cancel',
                                                                    style: 'cancel',
                                                                    onPress: () => {
                                                                        return;
                                                                    }
                                                                },
                                                                {
                                                                    text: 'Okay',
                                                                    onPress: () => {
                                                                        if (createdBy === userId) {
                                                                            if (Platform.OS == 'web') {
                                                                                window.open(meeting.startUrl, '_blank');
                                                                            } else {
                                                                                Linking.openURL(meeting.startUrl);
                                                                            }
                                                                        } else {
                                                                            if (Platform.OS == 'web') {
                                                                                window.open(meeting.joinUrl, '_blank');
                                                                            } else {
                                                                                Linking.openURL(meeting.joinUrl);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        );
                                                    } else {
                                                        if (createdBy === userId) {
                                                            if (Platform.OS == 'web') {
                                                                window.open(meeting.startUrl, '_blank');
                                                            } else {
                                                                Linking.openURL(meeting.startUrl);
                                                            }
                                                        } else {
                                                            if (Platform.OS == 'web') {
                                                                window.open(meeting.joinUrl, '_blank');
                                                            } else {
                                                                Linking.openURL(meeting.joinUrl);
                                                            }
                                                        }
                                                    }
                                                }}
                                                style={{}}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: 'inter',
                                                        color: '#006AFF',
                                                        marginRight: 20
                                                    }}
                                                >
                                                    JOIN {createdBy === userId ? '' : 'MEETING'}
                                                </Text>
                                            </TouchableOpacity>

                                            {createdBy === userId ? (
                                                <TouchableOpacity
                                                    onPress={async () => {
                                                        await navigator.clipboard.writeText(meeting.joinUrl);
                                                        Alert('Invite link copied!');
                                                    }}
                                                    style={{}}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontFamily: 'inter',
                                                            color: '#006AFF',
                                                            marginRight: 20
                                                        }}
                                                    >
                                                        COPY INVITE
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    };

    // const renderInstantMeetingPopup = () => {
    //     return (
    //         <Popup
    //             isOpen={showInstantMeeting}
    //             buttons={[
    //                 {
    //                     text: 'START',
    //                     handler: function(event) {
    //                         createInstantMeeting();
    //                     }
    //                 },
    //                 {
    //                     text: 'CANCEL',
    //                     handler: function(event) {
    //                         setShowInstantMeeting(false);
    //                         setInstantMeetingChannelId('');
    //                         setInstantMeetingCreatedBy('');
    //                         setInstantMeetingTitle('');
    //                         setInstantMeetingDescription('');
    //                         setInstantMeetingStart('');
    //                         setInstantMeetingEnd('');
    //                     }
    //                 }
    //             ]}
    //             theme="ios"
    //             themeVariant="light"
    //             onClose={() => {
    //                 setShowInstantMeeting(false);
    //                 setInstantMeetingChannelId('');
    //                 setInstantMeetingCreatedBy('');
    //             }}
    //             responsive={{
    //                 small: {
    //                     display: 'bottom'
    //                 },
    //                 medium: {
    //                     // Custom breakpoint
    //                     display: 'center'
    //                 }
    //             }}>
    //             <View
    //                 style={{
    //                     flexDirection: 'column',
    //                     paddingHorizontal: Dimensions.get('window').width > 768 ? 25 : 0,
    //                     backgroundColor: '#f2f2f7'
    //                 }}
    //                 className="mbsc-align-center mbsc-padding">
    //                 <ScrollView
    //                     showsVerticalScrollIndicator={true}
    //                     horizontal={false}
    //                     contentContainerStyle={{
    //                         width: '100%'
    //                     }}>
    //                     <View
    //                         style={{
    //                             flexDirection: 'column',
    //                             paddingHorizontal: 20,
    //                             marginVertical: 20,
    //                             minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
    //                             maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
    //                             backgroundColor: '#f2f2f7'
    //                         }}>
    //                         <Text
    //                             style={{
    //                                 fontSize: 13,
    //                                 textTransform: 'uppercase',
    //                                 fontFamily: 'inter',
    //                                 marginBottom: 20
    //                             }}>
    //                             Start an instant meeting
    //                         </Text>

    //                         <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f2f2f7' }}>
    //                             <Text
    //                                 style={{
    //                                     fontSize: 14,
    //                                     // fontFamily: 'inter',
    //                                     color: '#000000'
    //                                 }}>
    //                                 Topic
    //                             </Text>
    //                             <View style={{ marginTop: 10, marginBottom: 10 }}>
    //                                 <DefaultInput
    //                                     style={{ padding: 10, fontSize: 14 }}
    //                                     value={instantMeetingTitle}
    //                                     placeholder={''}
    //                                     onChangeText={val => setInstantMeetingTitle(val)}
    //                                     placeholderTextColor={'#1F1F1F'}
    //                                     // required={true}
    //                                 />
    //                             </View>
    //                         </View>

    //                         <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#f2f2f7' }}>
    //                             <Text
    //                                 style={{
    //                                     fontSize: 14,
    //                                     // fontFamily: 'inter',
    //                                     color: '#000000'
    //                                 }}>
    //                                 Description
    //                             </Text>
    //                             <View style={{ marginTop: 10, marginBottom: 10 }}>
    //                                 <DefaultInput
    //                                     style={{ padding: 10, fontSize: 14 }}
    //                                     value={instantMeetingDescription}
    //                                     placeholder={''}
    //                                     onChangeText={val => setInstantMeetingDescription(val)}
    //                                     placeholderTextColor={'#1F1F1F'}
    //                                     // required={true}
    //                                 />
    //                             </View>
    //                         </View>
    //                         <View
    //                             style={{
    //                                 width: '100%',
    //                                 maxWidth: 400,
    //                                 // paddingVertical: 15,
    //                                 backgroundColor: '#f2f2f7'
    //                             }}>
    //                             <Text style={styles.text}>{PreferredLanguageText('end')}</Text>
    //                             <View style={{ marginTop: 10, marginBottom: 10 }}>
    //                                 <Datepicker
    //                                     controls={['date', 'time']}
    //                                     touchUi={true}
    //                                     theme="ios"
    //                                     value={instantMeetingEnd}
    //                                     themeVariant="light"
    //                                     // inputComponent="input"
    //                                     inputProps={{
    //                                         placeholder: 'Select end...',
    //                                         backgroundColor: 'white'
    //                                     }}
    //                                     onChange={(event: any) => {
    //                                         const date = new Date(event.value);
    //                                         const roundOffDate = roundSeconds(date);
    //                                         setInstantMeetingEnd(roundOffDate);
    //                                     }}
    //                                     responsive={{
    //                                         xsmall: {
    //                                             controls: ['date', 'time'],
    //                                             display: 'bottom',
    //                                             touchUi: true
    //                                         },
    //                                         medium: {
    //                                             controls: ['date', 'time'],
    //                                             display: 'anchored',
    //                                             touchUi: false
    //                                         }
    //                                     }}
    //                                 />
    //                             </View>
    //                         </View>
    //                         <View
    //                             style={{
    //                                 width: '100%',
    //                                 paddingTop: 10,
    //                                 paddingBottom: 15,
    //                                 backgroundColor: '#f2f2f7'
    //                             }}>
    //                             <Text
    //                                 style={{
    //                                     fontSize: 14,
    //                                     // fontFamily: 'inter',
    //                                     color: '#000000'
    //                                 }}>
    //                                 Notify Users
    //                             </Text>
    //                         </View>
    //                         <View
    //                             style={{
    //                                 height: 40,
    //                                 marginRight: 10,
    //                                 backgroundColor: '#f2f2f7'
    //                             }}>
    //                             <Switch
    //                                 value={instantMeetingAlertUsers}
    //                                 onValueChange={() => {
    //                                     setInstantMeetingAlertUsers(!instantMeetingAlertUsers);
    //                                 }}
    //                                 style={{ height: 20 }}
    //                                 trackColor={{
    //                                     false: '#efefef',
    //                                     true: '#006AFF'
    //                                 }}
    //                                 activeThumbColor="white"
    //                             />
    //                         </View>
    //                         <View
    //                             style={{
    //                                 width: '100%',
    //                                 maxWidth: 400,
    //                                 // paddingVertical: 15,

    //                                 backgroundColor: '#f2f2f7'
    //                             }}>
    //                             <Text
    //                                 style={{
    //                                     fontSize: 11,
    //                                     color: '#000000',
    //                                     textTransform: 'uppercase',
    //                                     lineHeight: 20,
    //                                     fontFamily: 'Inter'
    //                                 }}>
    //                                 NOTE: You can schedule future meetings under Agenda
    //                             </Text>
    //                         </View>
    //                     </View>
    //                 </ScrollView>
    //             </View>
    //         </Popup>
    //     );
    // };

    /**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    /**
     * @description Renders all the channels under workspace
     */
    const overview = (
        <View
            key={collapseMap.toString()}
            style={{
                flexDirection: 'column',
                width: '100%',
                bottom: 0
            }}
        >
            {Dimensions.get('window').width > 768 ? (
                <View
                    style={{
                        paddingHorizontal: 20,
                        paddingTop: 10,
                        paddingBottom: 15
                    }}
                >
                    <Text
                        style={{
                            color: '#006aff',
                            fontFamily: 'Inter',
                            fontWeight: 'bold',
                            fontSize: 30,
                            paddingVertical: 6,
                            marginHorizontal: 12
                        }}
                    >
                        Workspace
                    </Text>
                </View>
            ) : null}
            {/* Add sort by filter here */}
            <ScrollView
                persistentScrollbar={true}
                showsVerticalScrollIndicator={true}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                    // maxHeight:
                    //     width < 768 ? Dimensions.get('window').height - 115 : Dimensions.get('window').height - 52,
                    backgroundColor: '#fff'
                }}
                ref={scrollViewRef}
            >
                {Object.keys(cueMap).map((key: any, ind: any) => {
                    return (
                        <InsetShadow
                            shadowColor={'#000'}
                            shadowOffset={2}
                            shadowOpacity={0.12}
                            shadowRadius={collapseMap[key] ? 10 : 0}
                            elevation={500000}
                            containerStyle={{
                                height: 'auto'
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                    borderColor: '#efefef',
                                    borderTopWidth: ind !== 0 && collapseMap[key] ? 1 : 0
                                    // paddingBottom: 10,
                                }}
                                key={ind}
                                onLayout={event => {
                                    const layout = event.nativeEvent.layout;
                                    const temp1 = [...channelKeyList];
                                    const temp2 = [...channelHeightList];
                                    temp1[ind] = key.split('-SPLIT-')[1];
                                    temp2[ind] = layout.y;
                                    setChannelKeyList(temp1);
                                    setChannelHeightList(temp2);
                                }}
                            >
                                {ind !== 0 ? (
                                    <View
                                        style={{
                                            backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                            flexDirection: 'row',
                                            borderColor: '#efefef',
                                            paddingTop: 10,
                                            paddingHorizontal: props.option === 'Classroom' ? 20 : 0,
                                            borderTopWidth:
                                                ind === 0 ||
                                                collapseMap[key] ||
                                                collapseMap[Object.keys(cueMap)[ind - 1]]
                                                    ? 0
                                                    : 1,
                                            paddingBottom: 0,
                                            maxWidth: 900,
                                            alignSelf: 'center',
                                            width: '100%'
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                alignItems: 'center',
                                                paddingBottom: 20,
                                                paddingTop: 9
                                            }}
                                            onPress={() => {
                                                const tempCollapse = JSON.parse(JSON.stringify(collapseMap));

                                                Object.keys(tempCollapse).forEach((item: any, index: any) => {
                                                    if (item === key) return;
                                                    tempCollapse[item] = false;
                                                });

                                                tempCollapse[key] = !collapseMap[key];
                                                setCollapseMap(tempCollapse);
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 9,
                                                    // marginTop: 2,
                                                    marginRight: 5,
                                                    backgroundColor: key.split('-SPLIT-')[3]
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 18,

                                                    fontFamily: 'inter',
                                                    flex: 1,
                                                    backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                    lineHeight: 18,
                                                    color: collapseMap[key] ? '#000000' : '#1a3026'
                                                }}
                                            >
                                                {' '}
                                                {key.split('-SPLIT-')[0]}
                                            </Text>
                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                paddingTop: 5,
                                                paddingLeft: 15
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    backgroundColor: collapseMap[key] ? '#efefef' : '#fff'
                                                }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap));

                                                        Object.keys(tempCollapse).forEach((item: any, index: any) => {
                                                            if (item === key) return;
                                                            tempCollapse[item] = false;
                                                        });

                                                        tempCollapse[key] = !collapseMap[key];
                                                        setCollapseMap(tempCollapse);
                                                    }}
                                                    style={{ backgroundColor: collapseMap[key] ? '#efefef' : '#fff' }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            lineHeight: 30,
                                                            backgroundColor: collapseMap[key] ? '#efefef' : '#fff'
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={
                                                                collapseMap[key]
                                                                    ? 'chevron-up-outline'
                                                                    : 'chevron-down-outline'
                                                            }
                                                            size={18}
                                                            color={collapseMap[key] ? '#1F1F1F' : '#006AFF'}
                                                        />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                            flexDirection: 'row',
                                            paddingHorizontal: props.option === 'Classroom' ? 20 : 0,
                                            maxWidth: 900,
                                            alignSelf: 'center',
                                            width: '100%',
                                            paddingBottom: 20,
                                            paddingTop: 9
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => {
                                                const tempCollapse = JSON.parse(JSON.stringify(collapseMap));

                                                Object.keys(tempCollapse).forEach((item: any, index: any) => {
                                                    if (item === key) return;
                                                    tempCollapse[item] = false;
                                                });

                                                tempCollapse[key] = !collapseMap[key];
                                                setCollapseMap(tempCollapse);
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    marginRight: 5,
                                                    borderRadius: 9,
                                                    backgroundColor: '#000000'
                                                }}
                                            />
                                            <Text
                                                ellipsizeMode="tail"
                                                style={{
                                                    fontSize: 18,

                                                    backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                    fontFamily: 'inter',
                                                    flex: 1,
                                                    lineHeight: 18,
                                                    color: collapseMap[key] ? '#000000' : '#1F1F1F'
                                                }}
                                            >
                                                {key}
                                            </Text>
                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-evenly',
                                                backgroundColor: collapseMap[key] ? '#efefef' : '#fff',
                                                paddingTop: 5
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    paddingLeft: 7,
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    backgroundColor: collapseMap[key] ? '#efefef' : '#fff'
                                                }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
                                                        tempCollapse[key] = !collapseMap[key];

                                                        Object.keys(tempCollapse).forEach((item: any, index: any) => {
                                                            if (item === key) return;
                                                            tempCollapse[item] = false;
                                                        });

                                                        setCollapseMap(tempCollapse);
                                                    }}
                                                    style={{ backgroundColor: collapseMap[key] ? '#efefef' : '#fff' }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            lineHeight: 30,
                                                            backgroundColor: collapseMap[key] ? '#efefef' : '#fff'
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={
                                                                collapseMap[key]
                                                                    ? 'chevron-up-outline'
                                                                    : 'chevron-down-outline'
                                                            }
                                                            size={18}
                                                            color={collapseMap[key] ? '#1F1F1F' : '#006AFF'}
                                                        />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                {collapseMap[key] && ind !== 0 ? renderTabs(key) : null}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        backgroundColor: '#efefef',
                                        borderColor: '#efefef',
                                        borderBottomWidth:
                                            collapseMap[key] && ind !== Object.keys(cueMap).length - 1 ? 1 : 0
                                    }}
                                    key={collapseMap.toString()}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            maxWidth: 900,
                                            backgroundColor: '#efefef',
                                            paddingHorizontal: width < 768 ? 20 : 0
                                        }}
                                    >
                                        {collapseMap[key] ? (
                                            <View
                                                style={{ width: '100%', paddingBottom: 25, backgroundColor: '#efefef' }}
                                                key={
                                                    editFolderChannelId.toString() +
                                                    cueIds.toString() +
                                                    cueMap.toString()
                                                }
                                            >
                                                {indexMap[key] !== 0 ? (
                                                    indexMap[key] === 1 ? (
                                                        <Discussion
                                                            channelId={key.split('-SPLIT-')[1]}
                                                            filterChoice={key.split('-SPLIT-')[0]}
                                                            channelCreatedBy={key.split('-SPLIT-')[2]}
                                                            refreshUnreadDiscussionCount={() =>
                                                                props.refreshUnreadDiscussionCount()
                                                            }
                                                            channelColor={key.split('-SPLIT-')[3]}
                                                        />
                                                    ) : // Meet
                                                    indexMap[key] === 2 ? (
                                                        <View
                                                            style={{
                                                                alignItems: 'center',
                                                                backgroundColor: '#efefef'
                                                            }}
                                                        >
                                                            {key.split('-SPLIT-')[2] === userId ? (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        marginBottom: 20,
                                                                        backgroundColor: '#efefef'
                                                                    }}
                                                                >
                                                                    <TouchableOpacity
                                                                        onPress={() =>
                                                                            handleStartMeeting(
                                                                                key.split('-SPLIT-')[1],
                                                                                key.split('-SPLIT-')[2]
                                                                            )
                                                                        }
                                                                        style={{
                                                                            backgroundColor: '#efefef',
                                                                            overflow: 'hidden',
                                                                            height: 35,
                                                                            marginTop: 20,
                                                                            justifyContent: 'center',
                                                                            flexDirection: 'row',
                                                                            marginLeft: 'auto'
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            style={{
                                                                                textAlign: 'center',
                                                                                lineHeight: 34,
                                                                                color: '#fff',
                                                                                borderRadius: 15,
                                                                                backgroundColor: '#006AFF',
                                                                                fontSize: 12,
                                                                                paddingHorizontal: 20,
                                                                                fontFamily: 'inter',
                                                                                height: 35,
                                                                                width: 175,
                                                                                textTransform: 'uppercase'
                                                                            }}
                                                                        >
                                                                            Start Meeting
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            ) : null}

                                                            {ongoingMeetings.length > 0
                                                                ? renderOngoingMeetings(
                                                                      key.split('-SPLIT-')[2],
                                                                      key.split('-SPLIT-')[3]
                                                                  )
                                                                : null}

                                                            <Performance
                                                                channelName={key.split('-SPLIT-')[0]}
                                                                onPress={(name: any, id: any, createdBy: any) => {
                                                                    props.setChannelFilterChoice('All');
                                                                    props.handleFilterChange(name);
                                                                    props.setChannelId(id);
                                                                    props.setChannelCreatedBy(createdBy);
                                                                    props.openGrades();
                                                                    props.hideHome();
                                                                }}
                                                                filterStart={filterStart}
                                                                filterEnd={filterEnd}
                                                                channelId={key.split('-SPLIT-')[1]}
                                                                channelCreatedBy={key.split('-SPLIT-')[2]}
                                                                subscriptions={props.subscriptions}
                                                                openCueFromGrades={props.openCueFromCalendar}
                                                                colorCode={key.split('-SPLIT-')[3]}
                                                                activeTab={'meetings'}
                                                            />
                                                        </View>
                                                    ) : // Scores
                                                    indexMap[key] === 3 ? (
                                                        <Performance
                                                            channelName={key.split('-SPLIT-')[0]}
                                                            onPress={(name: any, id: any, createdBy: any) => {
                                                                props.setChannelFilterChoice('All');
                                                                props.handleFilterChange(name);
                                                                props.setChannelId(id);
                                                                props.setChannelCreatedBy(createdBy);
                                                                props.openGrades();
                                                                props.hideHome();
                                                            }}
                                                            filterStart={filterStart}
                                                            channelId={key.split('-SPLIT-')[1]}
                                                            channelCreatedBy={key.split('-SPLIT-')[2]}
                                                            filterEnd={filterEnd}
                                                            subscriptions={props.subscriptions}
                                                            openCueFromGrades={props.openCueFromCalendar}
                                                            colorCode={key.split('-SPLIT-')[3]}
                                                            activeTab={'scores'}
                                                            isEditor={key.split('-SPLIT-')[2] === userId}
                                                        />
                                                    ) : (
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                maxWidth: 400,
                                                                alignSelf: 'center',
                                                                borderTopRightRadius: 10,
                                                                borderBottomRightRadius: 10
                                                            }}
                                                        >
                                                            <ChannelSettings
                                                                channelId={key.split('-SPLIT-')[1]}
                                                                refreshSubscriptions={props.refreshSubscriptions}
                                                                closeModal={() => {
                                                                    // setShowHome(false)
                                                                    // closeModal()
                                                                }}
                                                                channelColor={key.split('-SPLIT-')[3]}
                                                            />
                                                        </View>
                                                    )
                                                ) : cueMap[key].length === 0 ? (
                                                    <Text
                                                        style={{
                                                            width: '100%',
                                                            color: '#1F1F1F',
                                                            fontSize: 20,
                                                            paddingTop: 50,
                                                            paddingBottom: 50,
                                                            paddingHorizontal: 5,
                                                            fontFamily: 'inter',
                                                            flex: 1
                                                        }}
                                                    >
                                                        {PreferredLanguageText('noCuesCreated')}
                                                    </Text>
                                                ) : (
                                                    <ScrollView
                                                        horizontal={true}
                                                        contentContainerStyle={{
                                                            // maxWidth: '100%',
                                                            backgroundColor: '#efefef',
                                                            paddingHorizontal: 20
                                                        }}
                                                        showsHorizontalScrollIndicator={false}
                                                        key={
                                                            editFolderChannelId.toString() +
                                                            cueIds.toString() +
                                                            cueMap.toString()
                                                        }
                                                    >
                                                        {categoryMap[key].map((category: any, i: any) => {
                                                            // Check if even one category exists in cues

                                                            const foundCue = cueMap[key].find(
                                                                (cue: any) =>
                                                                    cue.customCategory.toString().trim() ===
                                                                    category.toString().trim()
                                                            );

                                                            if (!foundCue) return null;

                                                            return (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        maxWidth: 130,
                                                                        backgroundColor: '#efefef',
                                                                        marginRight: 15
                                                                    }}
                                                                >
                                                                    <View
                                                                        style={{
                                                                            backgroundColor: '#efefef',
                                                                            paddingLeft: 5
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            style={{
                                                                                flex: 1,
                                                                                flexDirection: 'row',
                                                                                color: '#1F1F1F',
                                                                                // fontWeight: 'bold',
                                                                                fontSize: 12,
                                                                                lineHeight: 25,
                                                                                fontFamily: 'inter',
                                                                                backgroundColor: '#efefef'
                                                                            }}
                                                                            ellipsizeMode="tail"
                                                                        >
                                                                            {category === '' ? ' ' : category}
                                                                        </Text>
                                                                    </View>
                                                                    <View
                                                                        style={{
                                                                            // borderWidth: 1,
                                                                            maxWidth: 130,
                                                                            paddingLeft: 5,
                                                                            backgroundColor: '#efefef',
                                                                            width: '100%'
                                                                            // height: 190
                                                                        }}
                                                                        key={i.toString() + key.toString()}
                                                                    >
                                                                        {cueMap[key].map((cue: any, index: any) => {
                                                                            if (
                                                                                cue.customCategory.toString().trim() !==
                                                                                category.toString().trim()
                                                                            ) {
                                                                                return null;
                                                                            }
                                                                            return (
                                                                                <View
                                                                                    style={{
                                                                                        marginBottom: 15,
                                                                                        backgroundColor: '#efefef',
                                                                                        width: '100%',
                                                                                        maxWidth: 130
                                                                                    }}
                                                                                    key={index}
                                                                                >
                                                                                    <Card
                                                                                        gray={true}
                                                                                        cueIds={cueIds}
                                                                                        onLongPress={() => {
                                                                                            setCueIds([]);
                                                                                            setEditFolderChannelId(
                                                                                                cue.channelId
                                                                                                    ? cue.channelId
                                                                                                    : 'Home'
                                                                                            );
                                                                                        }}
                                                                                        add={() => {
                                                                                            const temp = JSON.parse(
                                                                                                JSON.stringify(cueIds)
                                                                                            );
                                                                                            const found = temp.find(
                                                                                                (i: any) => {
                                                                                                    return (
                                                                                                        i === cue._id
                                                                                                    );
                                                                                                }
                                                                                            );
                                                                                            if (!found) {
                                                                                                temp.push(cue._id);
                                                                                            }
                                                                                            setCueIds(temp);
                                                                                        }}
                                                                                        remove={() => {
                                                                                            const temp = JSON.parse(
                                                                                                JSON.stringify(cueIds)
                                                                                            );
                                                                                            const upd = temp.filter(
                                                                                                (i: any) => {
                                                                                                    return (
                                                                                                        i !== cue._id
                                                                                                    );
                                                                                                }
                                                                                            );
                                                                                            setCueIds(upd);
                                                                                        }}
                                                                                        editFolderChannelId={
                                                                                            editFolderChannelId
                                                                                        }
                                                                                        fadeAnimation={
                                                                                            props.fadeAnimation
                                                                                        }
                                                                                        updateModal={() => {
                                                                                            props.openUpdate(
                                                                                                cue.key,
                                                                                                cue.index,
                                                                                                0,
                                                                                                cue._id,
                                                                                                cue.createdBy
                                                                                                    ? cue.createdBy
                                                                                                    : '',
                                                                                                cue.channelId
                                                                                                    ? cue.channelId
                                                                                                    : ''
                                                                                            );
                                                                                        }}
                                                                                        cue={cue}
                                                                                        channelId={props.channelId}
                                                                                        subscriptions={
                                                                                            props.subscriptions
                                                                                        }
                                                                                    />
                                                                                </View>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                </View>
                                                            );
                                                        })}
                                                    </ScrollView>
                                                )}
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        </InsetShadow>
                    );
                })}
            </ScrollView>
        </View>
    );

    // MAIN RETURN
    return (
        <View
            style={{
                height: windowHeight,
                backgroundColor: props.option === 'To Do' ? '#efefef' : '#fff'
            }}
        >
            {/* {renderInstantMeetingPopup()} */}
            {/* <View
                style={{
                    backgroundColor: '#000000',
                    borderBottomWidth: 2,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    height: 52,
                    paddingVertical: 2,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 7
                    },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    zIndex: 500000
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                        maxWidth: 900,
                        alignSelf: 'center',
                        backgroundColor: '#000000',
                        paddingVertical: 10,
                        flex: 1,
                        height: 48
                    }}
                >
                    {Dimensions.get('window').width < 768 ? null : (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#000000',
                                flex: 1,
                                height: 28,
                                paddingTop: 0
                            }}
                        >
                            <Image
                                source={{
                                    uri:
                                        'https://cues-files.s3.amazonaws.com/logo/cues-logo-white-exclamation-hidden.jpg'
                                }}
                                style={{
                                    width: 50,
                                    marginTop: 1,
                                    height: 22,
                                    marginRight: 13
                                }}
                                resizeMode={'contain'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    paddingRight: 30,
                                    flex: 1,
                                    backgroundColor: '#000000',
                                    paddingTop: 1
                                }}
                            >
                                {props.options.map((op: any) => {
                                    if (op === 'Settings' || op === 'Channels') {
                                        return;
                                    }
                                    return (
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#000000'
                                            }}
                                            onPress={() => {
                                                if (op === 'To Do') {
                                                    setFilterEventsType('');
                                                    setFilterByChannel('');
                                                    setActivityChannelId('');
                                                }
                                                if (op === 'Classroom') {
                                                    props.closeCreateModal();
                                                }
                                                props.setOption(op);
                                                if (op === 'Browse') {
                                                    props.openCreate();
                                                }
                                            }}
                                        >
                                            <Text style={op === props.option ? styles.allGrayFill : styles.all}>
                                                {op === 'Classroom'
                                                    ? props.version === 'read'
                                                        ? 'Library'
                                                        : 'Workspace'
                                                    : op === 'Performance'
                                                    ? 'Performance'
                                                    : op === 'To Do'
                                                    ? 'Agenda'
                                                    : op}
                                            </Text>

                                            {op === 'Inbox' && props.unreadMessages > 0 ? (
                                                <View
                                                    style={{
                                                        width: 7,
                                                        height: 7,
                                                        borderRadius: 7,
                                                        backgroundColor: '#f94144',
                                                        position: 'absolute',
                                                        top: -3,
                                                        right: 5
                                                    }}
                                                />
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#000000',
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            margin: 0
                        }}
                    >
                        {Dimensions.get('window').width < 768 ? (
                            <Image
                                source={{
                                    uri:
                                        'https://cues-files.s3.amazonaws.com/logo/cues-logo-white-exclamation-hidden.jpg'
                                }}
                                style={{
                                    width: 50,
                                    marginTop: 1,
                                    height: 18,
                                    marginRight: 13
                                }}
                                resizeMode={'contain'}
                            />
                        ) : null}
                        <TextInput
                            value={searchTerm}
                            style={{
                                color: '#fff',
                                backgroundColor: '#1F1F1F',
                                borderRadius: 15,
                                fontSize: 12,
                                paddingBottom: 5,
                                paddingTop: 4,
                                paddingHorizontal: 16,
                                marginTop: 10,
                                marginRight: 2,
                                maxWidth: 225
                            }}
                            autoCompleteType={'xyz'}
                            placeholder={'Search'}
                            onChangeText={val => setSearchTerm(val)}
                            placeholderTextColor={'#fff'}
                        />
                        {Dimensions.get('window').width < 768 ? (
                            <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#000000' }} />
                        ) : null}
                        {props.option === 'To Do' || props.option === 'Classroom' ? (
                            <TouchableOpacity
                                style={{ backgroundColor: 'none', marginLeft: 15 }}
                                onPress={() => {
                                    setShowFilterPopup(true);
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: '#efefef',
                                        marginTop: 1,
                                        textAlign: 'right'
                                    }}
                                >
                                    <Ionicons name="filter-outline" size={18} />
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        <Menu
                            style={{
                                marginLeft: 15,
                                right: 0,
                                marginTop: 3
                            }}
                            onSelect={(op: any) => {
                                if (op === 'Settings') {
                                    props.setShowHelp(false);
                                }
                                props.setOption(op);
                            }}
                        >
                            <MenuTrigger>
                                <Text>
                                    <Ionicons
                                        name={
                                            props.option === 'Settings' && !props.showHelp
                                                ? 'person-circle-outline'
                                                : props.option === 'Channels'
                                                ? 'file-tray-stacked-outline'
                                                : 'settings-outline'
                                        }
                                        size={16}
                                        color={
                                            (props.option === 'Settings' && !props.showHelp) ||
                                            props.option === 'Channels'
                                                ? '#006AFF'
                                                : '#efefef'
                                        }
                                    />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions
                                customStyles={{
                                    optionsContainer: {
                                        padding: 5,
                                        borderRadius: 15,
                                        shadowOpacity: 0,
                                        borderWidth: 1,
                                        borderColor: '#efefef',
                                        maxWidth: 150
                                    }
                                }}
                            >
                                <MenuOption value={'Channels'}>
                                    <Text
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: '#000000'
                                        }}
                                    >
                                        &nbsp;{props.version !== 'read' ? 'COURSES' : 'SHELVES'}
                                    </Text>
                                </MenuOption>
                                <MenuOption value={'Settings'}>
                                    <Text
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: '#000000'
                                        }}
                                    >
                                        &nbsp;ACCOUNT
                                    </Text>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    </View>
                </View>
            </View> */}
            {searchTerm === '' ? (
                props.modalType === 'Create' && (props.option === 'Classroom' || props.option === 'Browse') ? (
                    <Create
                        key={JSON.stringify(props.customCategories)}
                        customCategories={props.customCategories}
                        closeModal={() => props.closeCreateModal()}
                        closeOnCreate={() => props.closeOnCreate()}
                        option={props.option}
                        version={props.version}
                    />
                ) : (
                    <View
                        style={{
                            alignSelf: 'center',
                            width: '100%',
                            backgroundColor: props.option === 'To Do' ? '#efefef' : '#fff',
                            height: width < 768 ? windowHeight - 104 : windowHeight - 52
                        }}
                    >
                        {props.option === 'Settings' ? (
                            <Walkthrough
                                closeModal={() => {}}
                                saveDataInCloud={() => props.saveDataInCloud()}
                                reOpenProfile={() => props.reOpenProfile()}
                                reloadData={() => props.reloadData()}
                                setShowHelp={(val: any) => props.setShowHelp(val)}
                                showHelp={props.showHelp}
                            />
                        ) : null}
                        {props.option === 'Channels' ? (
                            <Channels
                                setShowCreate={(val: any) => props.setShowCreate(val)}
                                showCreate={props.showCreate}
                                closeModal={() => {}}
                                subscriptions={props.subscriptions}
                                refreshSubscriptions={props.refreshSubscriptions}
                            />
                        ) : null}
                        {props.option === 'Classroom' ? overview : null}
                        {props.option === 'To Do' ? (
                            <CalendarX
                                tab={props.tab}
                                version={props.version}
                                setTab={(val: any) => props.setTab(val)}
                                filterStart={filterStart}
                                filterEnd={filterEnd}
                                cues={props.calendarCues}
                                subscriptions={props.subscriptions}
                                openCueFromCalendar={props.openCueFromCalendar}
                                openDiscussion={props.openDiscussionFromActivity}
                                openChannel={props.openChannelFromActivity}
                                openQA={props.openQAFromActivity}
                                filterByChannel={filterByChannel}
                                activityChannelId={activityChannelId}
                                filterEventsType={filterEventsType}
                            />
                        ) : null}
                        {props.option === 'Inbox' ? (
                            <Inbox
                                showDirectory={props.showDirectory}
                                setShowDirectory={(val: any) => props.setShowDirectory(val)}
                                subscriptions={props.subscriptions}
                                refreshUnreadInbox={props.refreshUnreadInbox}
                                hideNewChatButton={props.hideNewChatButton}
                            />
                        ) : null}
                    </View>
                )
            ) : (
                searchResults
            )}
            {/* <Popup
                isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'OK',
                        handler: function(event) {
                            setShowFilterPopup(false);
                        }
                    },
                    {
                        text: 'RESET',
                        handler: function(event) {
                            setFilterStart(null);
                            setFilterEnd(null);
                            setFilterByChannel('All');
                            setFilterEventsType('All');
                            setShowFilterPopup(false);
                        }
                    }
                ]}
                themeVariant="light"
                theme="ios"
                onClose={() => setShowFilterPopup(false)}
                responsive={{
                    small: {
                        display: 'center'
                    },
                    medium: {
                        display: 'center'
                    }
                }}>
                <View
                    style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }}
                    className="mbsc-align-center mbsc-padding">
                    {props.option === 'Classroom' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                            <Text style={{ fontSize: 10, color: '#000000', paddingLeft: 5, paddingBottom: 10 }}>
                                Sort By
                            </Text>

                            <label style={{ width: 200, backgroundColor: 'white' }}>
                                <Select
                                    touchUi={true}
                                    theme="ios"
                                    themeVariant="light"
                                    value={sortBy}
                                    onChange={(val: any) => {
                                        setSortBy(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble'
                                        },
                                        medium: {
                                            touchUi: false
                                        }
                                    }}
                                    dropdown={false}
                                    data={sortbyOptions}
                                />
                            </label>
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text style={{ fontSize: 10, color: '#000000', paddingLeft: 5, paddingBottom: 10 }}>
                            Filter
                        </Text>

                        <label style={{ width: 200, backgroundColor: 'white' }}>
                            <Datepicker
                                theme="ios"
                                themeVariant="light"
                                controls={['calendar']}
                                select="range"
                                touchUi={true}
                                inputProps={{
                                    placeholder: 'Select'
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                value={[filterStart, filterEnd]}
                                onChange={(val: any) => {
                                    console.log('Selected', val);
                                    setFilterStart(val.value[0]);
                                    setFilterEnd(val.value[1]);
                                }}
                            />
                        </label>
                    </div>

                    {props.option === 'To Do' ? renderEventFilters() : null}
                </View>
            </Popup> */}
        </View>
    );
};

export default React.memo(Dashboard, (prev, next) => {
    return _.isEqual(
        {
            ...prev.cues,
            ...prev.tab,
            ...prev.showDirectory,
            ...prev.showHelp,
            ...prev.modalType
        },
        {
            ...next.cues,
            ...next.tab,
            ...next.showDirectory,
            ...next.showHelp,
            ...next.modalType
        }
    );
});

// export default Dashboard

const styleObject: any = () =>
    StyleSheet.create({
        all: {
            fontSize: 14,
            color: '#fff',
            height: 24,
            paddingHorizontal: 15,
            backgroundColor: '#000000',
            lineHeight: 24,
            fontFamily: 'overpass',
            fontWeight: 'bold',
            textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 14,
            color: '#fff',
            paddingHorizontal: 15,
            borderRadius: 12,
            backgroundColor: '#006AFF',
            lineHeight: 24,
            height: 24,
            fontFamily: 'inter',
            textTransform: 'uppercase'
        },
        all1: {
            fontSize: 10,
            color: '#1F1F1F',
            height: 20,
            paddingHorizontal: 7,
            backgroundColor: '#efefef',
            lineHeight: 20,
            fontFamily: 'inter',
            textAlign: 'center'
        },
        allGrayFill1: {
            fontSize: 10,
            color: '#006AFF',
            height: 20,
            paddingHorizontal: 7,
            lineHeight: 20,
            fontFamily: 'inter',
            textAlign: 'center'
        }
    });
