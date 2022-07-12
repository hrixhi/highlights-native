import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    // ScrollView,
    Platform,
    // Switch,
    TouchableOpacity as RNTouchableOpacity,
    Linking,
} from 'react-native';
import { TextInput } from './CustomTextInput';
import { ScrollView, Switch, TouchableOpacity } from 'react-native-gesture-handler';
import Alert from './Alert';
import { Text, View } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getChannels,
    getEvents,
    createDateV1,
    editDateV1,
    deleteDateV1,
    meetingRequest,
    markAttendance,
    getActivity,
    markActivityAsRead,
    regenZoomMeeting,
} from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import * as Clipboard from 'expo-clipboard';

import { Agenda } from 'react-native-calendars';
// import { PreferredLanguageText } from '../helpers/LanguageContext';
import { eventFrequencyOptions } from '../helpers/FrequencyOptions';
// import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';
// import BottomSheet from 'reanimated-bottom-sheet';
import BottomSheet from './BottomSheet';

import _ from 'lodash';
import DropDownPicker from 'react-native-dropdown-picker';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

import Reanimated from 'react-native-reanimated';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { useOrientation } from '../hooks/useOrientation';

import { blueButtonMR, blueButtonCalendarMB } from '../helpers/BlueButtonPosition';
import { filterEventModalHeight, filterActivityModalHeight, newEventModalHeight } from '../helpers/ModalHeights';
import { paddingResponsive } from '../helpers/paddingHelper';
import { disableEmailId } from '../constants/zoomCredentials';

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [modalAnimation] = useState(new Animated.Value(1));
    const [title, setTitle] = useState('');
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60));
    const [showAddEvent, setShowAddEvent] = useState(false);
    // const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [items, setItems] = useState<any>({});
    const [channels, setChannels] = useState<any[]>([]);
    const [channelId, setChannelId] = useState('');
    const [currentMonth, setCurrentMonth] = useState(moment(new Date()).format('MMMM YYYY'));

    // v1
    const current = new Date();
    const [description, setDescription] = useState('');
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState('1-W');
    const [repeatTill, setRepeatTill] = useState(new Date());
    const [isMeeting, setIsMeeting] = useState(false);
    const [recordMeeting, setRecordMeeting] = useState(false);
    const [isCreatingEvents, setIsCreatingEvents] = useState(false);
    const [editEvent, setEditEvent] = useState<any>(null);
    // Stores channel name of event being modified
    const [editChannelName, setEditChannelName] = useState('');
    const [isEditingEvents, setIsEditingEvents] = useState(false);
    const [isDeletingEvents, setIsDeletingEvents] = useState(false);
    const [userId, setUserId] = useState('');
    const [allActivity, setAllActivity] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');
    const [meetingProvider, setMeetingProvider] = useState('');
    const [unreadCount, setUnreadCount] = useState<any>(0);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState('My Events');

    const [selectedStartDay, setSelectedStartDay] = useState<any>(`${start.getDay() + 1}`);
    const [selectedDays, setSelectedDays] = useState<any[]>([selectedStartDay]);

    // Filter start & end
    const currentDate = new Date();
    const startCurrentDate = new Date();
    const [filterStart, setFilterStart] = useState<any>(
        new Date(startCurrentDate.getTime() - 1000 * 60 * 60 * 24 * 30 * 10)
    );
    const [filterEnd, setFilterEnd] = useState<any>(new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * 30 * 10));

    // FILTERS
    const [allItems, setAllItems] = useState<any[]>([]);
    const [itemsMap, setItemsMap] = useState<any>({});
    const [filterByChannel, setFilterByChannel] = useState('All');
    const [filterEventsType, setFilterEventsType] = useState('All');

    const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
    const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);

    const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
    const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

    const [showRepeatTillDateAndroid, setShowRepeatTillDateAndroid] = useState(false);

    const [showFilterStartDateAndroid, setShowFilterStartDateAndroid] = useState(false);
    const [showFilterEndDateAndroid, setShowFilterEndDateAndroid] = useState(false);

    const [activeTab, setActiveTab] = useState('agenda');
    const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
    const [showChannelDropdown, setShowChannelDropdown] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showFilterByChannelDropdown, setShowFilterByChannelDropdown] = useState(false);
    const [showFilterTypeDropdown, setShowFilterTypeDropdown] = useState(false);

    console.log('Show Filter modal', showFilterModal);
    console.log('Channel id', channelId);

    const orientation = useOrientation();

    const channelOptions = [
        {
            value: 'My Events',
            label: 'My Events',
        },
    ];

    channels.map((channel: any) => {
        channelOptions.push({
            value: channel._id,
            label: channel.name,
        });
    });

    const weekDays = {
        '1': 'Sun',
        '2': 'Mon',
        '3': 'Tue',
        '4': 'Wed',
        '5': 'Thu',
        '6': 'Fri',
        '7': 'Sat',
    };

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    const onUpdateSelectedDate = (date: any) => {
        setCurrentMonth(moment(date.dateString).format('MMMM YYYY'));
    };

    /**
     * @description Updated selected start day for recurring days selection (start day is disabled by default)
     */
    useEffect(() => {
        const startDay = start.getDay() + 1;

        setSelectedStartDay(startDay.toString());
        setSelectedDays([startDay.toString()]);
    }, [start]);

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {
            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '');
            }
        })();
    }, []);

    const renderTimeMessage = () => {
        const currentTime = new Date();

        if (currentTime.getHours() < 12 && currentTime.getHours() > 0) {
            return 'Good Morning';
        } else if (currentTime.getHours() >= 12 && currentTime.getHours() < 17) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    };

    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');
            server
                .query({
                    query: getChannels,
                    variables: {
                        userId: user._id,
                    },
                })
                .then((res) => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                    }
                })
                .catch((err) => {});
        }
    }, []);

    useEffect(() => {
        let all = [...allActivity];
        if (filterByChannel === 'All') {
        } else {
            all = all.filter((e: any) => filterByChannel === e.channelId);
        }

        if (filterStart && filterEnd) {
            all = all.filter(
                (e: any) => new Date(e.date) > new Date(filterStart) && new Date(e.date) < new Date(filterEnd)
            );
        }

        setActivity(all);

        let total = [...allItems];

        setItems({});
        setItemsMap({});

        if (filterEventsType !== 'All') {
            if (filterEventsType === 'Meetings') {
                total = total.filter((e: any) => e.meeting);
            } else if (filterEventsType === 'Submissions') {
                total = total.filter((e: any) => e.cueId !== '' && !e.end);
            } else if (filterEventsType === 'Events') {
                total = total.filter((e: any) => !e.cueId && !e.meeting && e.end !== null);
            }
        }

        // Filter between start and end
        if (filterStart && filterEnd) {
            total = total.filter((e: any) => {
                return new Date(e.start) > filterStart && new Date(e.start) < filterEnd;
            });
        }

        let filterByChannels = [];

        if (filterByChannel === 'All') {
            filterByChannels = total;
        } else {
            const all = [...total];
            const filter = all.filter((e: any) => filterByChannel === e.channelId);

            filterByChannels = filter;
        }

        // Now we have the filtered events so we need to put them in an object for Calendar
        const loadedItems: { [key: string]: any } = {};

        filterByChannels.map((item: any) => {
            const strTime = timeToString(item.start);

            if (!loadedItems[strTime]) {
                loadedItems[strTime] = [item];
            } else {
                const existingItems = loadedItems[strTime];
                loadedItems[strTime] = [...existingItems, item];
            }
        });

        // console.log("Total post filter length", filterByChannels.length)

        // Selected date (current date) should never be empty, otherwise Calendar will keep loading
        const todayStr = timeToString(new Date());

        if (!loadedItems[todayStr]) {
            loadedItems[todayStr] = [];
        }

        Object.keys(loadedItems).map((date: string) => {
            const events = loadedItems[date];

            let sortedEvents = events.sort((a: any, b: any) => {
                return new Date(a.start) > new Date(b.start);
            });

            sortedEvents = events.sort((a: any, b: any) => {
                return a.title > b.title;
            });

            loadedItems[date] = sortedEvents;
        });

        for (let i = -120; i < 120; i++) {
            const time = Date.now() + i * 24 * 60 * 60 * 1000;
            const strTime = timeToString(new Date(time));

            if (!loadedItems[strTime]) {
                loadedItems[strTime] = [];
            }
        }

        setItems(loadedItems);
        setItemsMap(loadedItems);
    }, [filterByChannel, filterEventsType, filterStart, filterEnd, allItems]);

    /**
     * @description Fetch user activity
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
                const server = fetchAPI(user._id);
                server
                    .query({
                        query: getActivity,
                        variables: {
                            userId: user._id,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.activity.getActivity) {
                            const tempActivity = res.data.activity.getActivity;
                            let unread = 0;
                            tempActivity.map((act: any) => {
                                if (act.status === 'unread') {
                                    unread++;
                                }
                            });
                            setUnreadCount(unread);
                            setActivity(tempActivity);
                            setAllActivity(tempActivity);
                        }
                    });
            }
        })();
    }, []);

    // console.log('Is Submit disabled', isSubmitDisabled);

    // useEffect(() => {
    //     if (title !== '' && end > start) {
    //         console.log('Title', title);

    //         setIsSubmitDisabled(false);
    //         return;
    //     }

    //     setIsSubmitDisabled(true);
    // }, [title, start, end]);

    // use effect for edit events
    useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.originalTitle);
            setDescription(editEvent.description);
            setStart(new Date(editEvent.start));
            setEnd(new Date(editEvent.end));
            setEditChannelName(editEvent.channelName !== '' ? editEvent.channelName : 'My Events');

            if (editEvent.dateId !== 'channel' && editEvent.createdBy) {
                setIsMeeting(true);
                if (editEvent.recordMeeting) {
                    setRecordMeeting(true);
                }
            }
        } else {
            setTitle('');
            setDescription('');
            const current = new Date();
            setStart(new Date());
            setEnd(new Date(current.getTime() + 1000 * 60 * 60));
            setEditChannelName('');
        }
    }, [editEvent]);

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

    const renderActivity = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                }}
            >
                {/* <InsetShadow
                    shadowColor={'#000'}
                    shadowOffset={2}
                    shadowOpacity={0.12}
                    shadowRadius={10}
                    // elevation={600000}
                    containerStyle={{
                        height: 'auto'
                    }}
                > */}
                <View>
                    <ScrollView
                        style={{
                            height: windowHeight - 90,
                        }}
                        horizontal={false}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle={'black'}
                    >
                        {activity.length === 0 ? (
                            <View
                                style={{
                                    paddingVertical: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    No Alerts
                                </Text>
                            </View>
                        ) : null}
                        {activity.map((act: any, index) => {
                            const { cueId, channelId, createdBy, target, threadId } = act;

                            if (filterByChannel !== 'All') {
                                if (filterByChannel !== act.channelId) {
                                    return;
                                }
                            }

                            return (
                                <TouchableOpacity
                                    onPress={async () => {
                                        const uString: any = await AsyncStorage.getItem('user');
                                        if (uString) {
                                            const user = JSON.parse(uString);
                                            const server = fetchAPI('');
                                            server.mutate({
                                                mutation: markActivityAsRead,
                                                variables: {
                                                    activityId: act._id,
                                                    userId: user._id,
                                                    markAllRead: false,
                                                },
                                            });
                                        }

                                        // Opens the cue from the activity
                                        if (
                                            cueId !== null &&
                                            cueId !== '' &&
                                            channelId !== '' &&
                                            createdBy !== '' &&
                                            target === 'CUE'
                                        ) {
                                            props.openCueFromCalendar(channelId, cueId, createdBy);
                                        }

                                        if (target === 'DISCUSSION') {
                                            if (threadId && threadId !== '') {
                                                await AsyncStorage.setItem('openThread', threadId);
                                            }

                                            props.openDiscussion(channelId);
                                        }

                                        if (
                                            target === 'CHANNEL_SUBSCRIBED' ||
                                            target === 'CHANNEL_MODERATOR_ADDED' ||
                                            target === 'CHANNEL_MODERATOR_REMOVED'
                                        ) {
                                            props.openChannel(channelId);
                                        }

                                        if (target === 'Q&A') {
                                            if (threadId && threadId !== '') {
                                                await AsyncStorage.setItem('openThread', threadId);
                                            }

                                            props.openQA(channelId, cueId, createdBy);
                                        }
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        borderColor: '#f2f2f2',
                                        borderBottomWidth: index === activity.length - 1 ? 0 : 1,
                                        width: '100%',
                                        paddingVertical: 5,
                                        backgroundColor: 'white',
                                        height: 90,
                                        paddingHorizontal: paddingResponsive(),
                                        // borderLeftWidth: 3,
                                        // borderLeftColor: act.colorCode
                                    }}
                                    key={index}
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'white',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                            <View
                                                style={{
                                                    width: 9,
                                                    height: 9,
                                                    borderRadius: 6,
                                                    marginRight: 5,
                                                    backgroundColor: act.colorCode,
                                                    marginLeft: 5,
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {act.channelName}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                padding: 5,
                                                lineHeight: 18,
                                                fontWeight: 'bold',
                                            }}
                                            numberOfLines={2}
                                            ellipsizeMode="tail"
                                        >
                                            {act.title} - {act.subtitle}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            padding: 0,
                                            flexDirection: 'row',
                                            alignSelf: 'center',
                                            paddingRight: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                padding: 5,
                                                lineHeight: 14,
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {act.status === 'unread' ? (
                                                <Ionicons name="alert-circle-outline" color="#f94144" size={18} />
                                            ) : null}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13,
                                                fontWeight: 'bold',
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {emailTimeDisplay(act.date)}
                                        </Text>
                                        {/* <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                        </Text> */}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {/* </InsetShadow> */}
                </View>
            </View>
        );
    };

    //   const onDateClick = useCallback((title, date, dateId) => {
    //     Alert("Delete " + title + "?", date, [
    //       {
    //         text: "Cancel",
    //         style: "cancel"
    //       },
    //       {
    //         text: "Delete",
    //         onPress: async () => {
    //           const server = fetchAPI("");
    //           server
    //             .mutate({
    //               mutation: deleteDate,
    //               variables: {
    //                 dateId
    //               }
    //             })
    //             .then(res => {
    //               if (res.data && res.data.date.delete) {
    //                 Alert("Event Deleted!");
    //                 loadEvents();
    //               }
    //             });
    //         }
    //       }
    //     ]);
    //   }, []);

    /**
     * @description Handle Create event
     */

    const handleCreate = useCallback(async () => {
        if (title === '') {
            Alert('A title must be set for the event. ');
            return;
        } else if (start < new Date()) {
            Alert('Event must be set in the future.');
            return;
        } else if (start > end) {
            Alert('End time must be after than start time.');
            return;
        }
        if (recurring) {
            if (start > repeatTill) {
                Alert('Repeat until date must be set in the future.');
                return;
            }
        }

        setIsCreatingEvents(true);

        const meeting = channelId && channelId !== '' ? isMeeting : false;

        const freq = recurring ? frequency : '';

        const repeat = recurring ? repeatTill.toUTCString() : '';

        const repeatDays = recurring && frequency === '1-W' ? selectedDays : '';

        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: createDateV1,
                    variables: {
                        title,
                        userId: user._id,
                        start: start.toUTCString(),
                        end: end.toUTCString(),
                        channelId,
                        meeting,
                        description,
                        recordMeeting,
                        frequency: freq,
                        repeatTill: repeat,
                        repeatDays,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.date.createV1 === 'SUCCESS') {
                        loadEvents();
                        setTitle('');
                        setRepeatTill(new Date());
                        setIsMeeting(false);
                        setDescription('');
                        setFrequency('1-W');
                        setRecurring(false);
                        setRecordMeeting(false);
                        setIsCreatingEvents(false);
                        setShowAddEvent(false);
                        setSelectedDays([]);
                        setSelectedStartDay('');
                        props.setTab('Agenda');
                    } else if (res.data && res.data.date.createV1 === 'ZOOM_MEETING_CREATE_FAILED') {
                        Alert('Event scheduled but Zoom meeting could not be created.');
                        loadEvents();
                        setTitle('');
                        setRepeatTill(new Date());
                        setIsMeeting(false);
                        setDescription('');
                        setFrequency('1-W');
                        setRecurring(false);
                        setRecordMeeting(false);
                        setIsCreatingEvents(false);
                        setShowAddEvent(false);
                        setSelectedDays([]);
                        setSelectedStartDay('');
                    } else {
                        Alert('Failed to create event. Try again.');
                        setIsCreatingEvents(false);
                    }
                })
                .catch((err) => {
                    setIsCreatingEvents(false);
                    console.log(err);
                });
        }
    }, [
        title,
        start,
        end,
        channelId,
        recordMeeting,
        isMeeting,
        repeatTill,
        frequency,
        recurring,
        // isSubmitDisabled,
        isCreatingEvents,
        selectedDays,
    ]);

    const handleEdit = useCallback(async () => {
        if (title === '') {
            Alert('A title must be set for the event. ');
            return;
        } else if (end < new Date()) {
            Alert('Event end time must be set in the future.');
            return;
        } else if (start > end) {
            Alert('Event end time must be set after the start time.');
            return;
        }

        Alert('Update event?', '', [
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
                    setIsEditingEvents(true);

                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: editDateV1,
                            variables: {
                                id: editEvent.eventId,
                                title,
                                start: start.toUTCString(),
                                end: end.toUTCString(),
                                description,
                                recordMeeting,
                            },
                        })
                        .then((res) => {
                            loadEvents();
                            setTitle('');
                            setRepeatTill(new Date());
                            setIsMeeting(false);
                            setDescription('');
                            setFrequency('1-W');
                            setRecurring(false);
                            setRecordMeeting(false);
                            setIsEditingEvents(false);
                            setEditEvent(null);
                            setShowAddEvent(false);
                        })
                        .catch((err) => {
                            setIsEditingEvents(false);
                            console.log(err);
                        });
                },
            },
        ]);
    }, [editEvent, title, start, end, description, isMeeting, recordMeeting]);

    const handleDelete = useCallback(
        async (deleteAll: boolean) => {
            const { eventId, recurringId } = editEvent;

            setIsDeletingEvents(true);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: deleteDateV1,
                    variables: {
                        id: !deleteAll ? eventId : recurringId,
                        deleteAll,
                    },
                })
                .then((res) => {
                    const updated = new Date();
                    loadEvents();
                    setTitle('');
                    setRepeatTill(new Date());
                    setIsMeeting(false);
                    setDescription('');
                    setFrequency('1-W');
                    setRecurring(false);
                    setRecordMeeting(false);
                    setIsDeletingEvents(false);
                    setEditEvent(null);
                    setShowAddEvent(false);
                })
                .catch((err) => {
                    setIsDeletingEvents(false);
                    console.log(err);
                });
        },
        [title, start, end, description, isMeeting, recordMeeting]
    );

    const loadEvents = useCallback(async () => {
        setLoadingEvents(true);

        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        } else {
            return;
        }

        const server = fetchAPI('');
        server
            .query({
                query: getEvents,
                variables: {
                    userId: parsedUser._id,
                },
            })
            .then((res) => {
                if (res.data.date && res.data.date.getCalendar) {
                    // console.log("Get calendar", res.data.date.getCalendar)

                    const loadedItems: { [key: string]: any } = {};

                    const allEvents: any = [];

                    // Add Logic to convert to items for Agenda
                    res.data.date.getCalendar.map((item: any) => {
                        const strTime = timeToString(item.start);

                        const { title } = htmlStringParser(item.title);

                        let colorCode = '#202025';

                        const matchSubscription = props.subscriptions.find((sub: any) => {
                            return sub.channelId === item.channelId;
                        });

                        if (matchSubscription && matchSubscription !== undefined) {
                            colorCode = matchSubscription.colorCode;
                        }

                        const modifiedItem = {
                            eventId: item.eventId ? item.eventId : '',
                            originalTitle: title,
                            title: item.channelName ? item.channelName + ' - ' + title : title,
                            start: new Date(item.start),
                            end: datesEqual(item.start, item.end) ? null : new Date(item.end),
                            dateId: item.dateId,
                            description: item.description,
                            createdBy: item.createdBy,
                            channelName: item.channelName,
                            recurringId: item.recurringId,
                            recordMeeting: item.recordMeeting ? true : false,
                            meeting: item.meeting,
                            channelId: item.channelId,
                            cueId: item.cueId,
                            color: colorCode,
                            submitted: item.submitted,
                            zoomMeetingId: item.zoomMeetingId,
                            zoomStartUrl: item.zoomStartUrl,
                            zoomJoinUrl: item.zoomJoinUrl,
                            zoomRegistrationJoinUrl: item.zoomRegistrationJoinUrl,
                            zoomMeetingScheduledBy: item.zoomMeetingScheduledBy,
                            zoomMeetingCreatorProfile: item.zoomMeetingCreatorProfile,
                            meetingLink: item.meetingLink ? item.meetingLink : null,
                            isNonChannelMeeting: item.isNonChannelMeeting,
                            nonChannelGroupId: item.nonChannelGroupId,
                            groupUsername: item.groupUsername,
                        };

                        allEvents.push(modifiedItem);

                        if (!loadedItems[strTime]) {
                            // console.log("New date", strTime)
                            loadedItems[strTime] = [modifiedItem];
                        } else {
                            const existingItems = loadedItems[strTime];
                            loadedItems[strTime] = [...existingItems, modifiedItem];
                        }
                    });

                    // Selected date (current date) should never be empty, otherwise Calendar will keep loading
                    const todayStr = timeToString(new Date());

                    if (!loadedItems[todayStr]) {
                        loadedItems[todayStr] = [];
                    }

                    // console.log("Before sort")

                    Object.keys(loadedItems).map((date: string) => {
                        const events = loadedItems[date];

                        let sortedEvents = events.sort((a: any, b: any) => {
                            return new Date(a.start) > new Date(b.start);
                        });

                        sortedEvents = events.sort((a: any, b: any) => {
                            return a.title > b.title;
                        });

                        loadedItems[date] = sortedEvents;
                    });

                    for (let i = -120; i < 120; i++) {
                        const time = Date.now() + i * 24 * 60 * 60 * 1000;
                        const strTime = timeToString(new Date(time));

                        if (!loadedItems[strTime]) {
                            loadedItems[strTime] = [];
                        }
                    }

                    setItems(loadedItems);
                    setItemsMap(loadedItems);
                    setAllItems(allEvents);
                }

                setLoadingEvents(false);
            })
            .catch((err) => {
                console.log(err);
                Alert('Unable to load calendar.', 'Check connection.');

                setLoadingEvents(false);

                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            });
    }, [props.tab, modalAnimation, props.subscriptions]);

    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);

        return time;
    };

    const renderStartDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={start}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);

                            setStart(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showStartDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={start}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowStartDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowStartDateAndroid(false);
                            setStart(roundedValue);
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
                                setShowStartDateAndroid(true);
                                setShowStartTimeAndroid(false);
                                setShowEndDateAndroid(false);
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
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(true);
                                setShowEndDateAndroid(false);
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
                        value={start}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setStart(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showStartTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={start}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowStartTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowStartTimeAndroid(false);
                            setStart(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderEndDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={end}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setEnd(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={end}
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

                            setEnd(roundedValue);
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
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(false);
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
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(false);
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
                        value={end}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setEnd(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={end}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowEndTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowEndTimeAndroid(false);
                            setEnd(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderRepeatTillDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={repeatTill}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setRepeatTill(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showRepeatTillDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={repeatTill}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowRepeatTillDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;

                            const roundedValue = roundSeconds(currentDate);

                            setShowRepeatTillDateAndroid(false);
                            setRepeatTill(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
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
                                setShowRepeatTillDateAndroid(true);
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
                    </View>
                ) : null}
            </View>
        );
    };

    // console.log("Filter start", filterStart)
    // console.log("Filter end", filterEnd)

    const renderFilterStartDateTimePicker = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 20,
                }}
            >
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={filterStart}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);

                            setFilterStart(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showFilterStartDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={filterStart}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            console.log('Selected date prior', selectedDate);

                            if (!selectedDate) {
                                setShowFilterStartDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowFilterStartDateAndroid(false);
                            setFilterStart(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                setShowFilterStartDateAndroid(true);
                                setShowFilterEndDateAndroid(false);
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(false);
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
                    </View>
                ) : null}
            </View>
        );
    };

    const renderFilterEndDateTimePicker = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 20,
                }}
            >
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={filterEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setFilterEnd(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showFilterEndDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={filterEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowFilterEndDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowFilterEndDateAndroid(false);

                            const roundedValue = roundSeconds(currentDate);

                            setFilterEnd(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            // width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                setShowFilterStartDateAndroid(false);
                                setShowFilterEndDateAndroid(true);
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
                    </View>
                ) : null}
            </View>
        );
    };

    const renderEditChannelName = () => {
        return (
            editChannelName && (
                <View style={{ maxWidth: width < 768 ? '100%' : '33%', backgroundColor: '#fff', marginBottom: 20 }}>
                    <TouchableOpacity
                        key={Math.random()}
                        disabled={true}
                        // style={styles.allOutline}
                        style={{ backgroundColor: '#fff' }}
                        onPress={() => {
                            return;
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 20,
                                fontSize: 15,
                                color: '#a2a2ac',
                            }}
                        >
                            Shared with {editChannelName}
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        );
    };

    /**
     * @description Display zoom meeting info
     */
    const renderEditMeetingInfo = () => {
        return editEvent && editEvent.zoomMeetingId && editEvent.zoomMeetingId !== '' ? (
            <View style={{ width: '100%', maxWidth: 600, marginTop: 30 }}>
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            marginRight: 5,
                            color: '#000000',
                        }}
                    >
                        Zoom Meeting ID
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'overpass',
                            color: '#797979',
                        }}
                        selectable={true}
                    >
                        {editEvent.zoomMeetingId}
                    </Text>
                </View>

                <View style={{ width: '100%', maxWidth: 400, marginBottom: 10 }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            marginRight: 10,
                            color: '#000000',
                            marginBottom: 5,
                        }}
                    >
                        Invite Link
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'overpass',
                            color: '#797979',
                        }}
                        selectable={true}
                    >
                        {editEvent.zoomJoinUrl}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={{ marginRight: 15 }}
                        onPress={() => {
                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                window.open(editEvent.zoomStartUrl, '_blank');
                            } else {
                                Linking.openURL(editEvent.zoomStartUrl);
                            }
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000',
                            }}
                        >
                            Start meeting
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginRight: 15 }}
                        onPress={async () => {
                            Clipboard.setString(editEvent.zoomJoinUrl);
                            Alert('Invite link copied!');
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000',
                            }}
                        >
                            Copy Invite
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={{}}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'inter',
                                    color: '#F94144'
                                }}>
                                Delete Meeting
                            </Text>
                        </TouchableOpacity> */}
                </View>
            </View>
        ) : editEvent && editEvent.meeting && userZoomInfo && userZoomInfo.accountId ? (
            <View
                style={{
                    marginTop: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    paddingHorizontal: 15,
                    backgroundColor: '#f8f8f8',
                    borderRadius: 1,
                    width: '100%',
                    maxWidth: 600,
                    borderRadius: 10,
                }}
            >
                <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <Text style={{ paddingHorizontal: 20, fontSize: Dimensions.get('window').width < 768 ? 14 : 16 }}>
                        Zoom meeting has been deleted or has expired
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: regenZoomMeeting,
                                    variables: {
                                        userId,
                                        dateId: editEvent.eventId,
                                    },
                                })
                                .then((res) => {
                                    if (res.data && res.data.date.regenZoomMeeting) {
                                        const e = res.data.date.regenZoomMeeting;
                                        setEditEvent({
                                            eventId: e.eventId ? e.eventId : '',
                                            originalTitle: title,
                                            title: e.channelName ? title + ' - ' + e.channelName : title,
                                            start: new Date(e.start),
                                            end: datesEqual(e.start, e.end) ? null : new Date(e.end),
                                            dateId: e.dateId,
                                            description: e.description,
                                            createdBy: e.createdBy,
                                            channelName: e.channelName,
                                            recurringId: e.recurringId,
                                            recordMeeting: e.recordMeeting ? true : false,
                                            meeting: e.meeting,
                                            channelId: e.channelId,
                                            cueId: e.cueId,
                                            submitted: e.submitted,
                                            zoomMeetingId: e.zoomMeetingId,
                                            zoomStartUrl: e.zoomStartUrl,
                                            zoomJoinUrl: e.zoomJoinUrl,
                                            zoomRegistrationJoinUrl: e.zoomRegistrationJoinUrl,
                                            zoomMeetingScheduledBy: e.zoomMeetingScheduledBy,
                                            zoomMeetingCreatorProfile: e.zoomMeetingCreatorProfile,
                                        });
                                    } else {
                                        Alert('Failed to create zoom meeting.');
                                    }
                                })
                                .catch((err) => {
                                    Alert('Something went wrong.');
                                });
                        }}
                        style={{
                            backgroundColor: '#f8f8f8',
                            paddingLeft: Dimensions.get('window').width < 768 ? 20 : 10,
                            paddingVertical: Dimensions.get('window').width < 768 ? 10 : 0,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000',
                                backgroundColor: '#f3f3f3',
                            }}
                        >
                            Create New
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : null;
    };

    const renderEditEventOptions = () => {
        const { recurringId, start, end, channelId } = editEvent;

        const date = new Date();

        return (
            <View
                style={{
                    width: '100%',
                    maxWidth: 600,
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    marginTop: Dimensions.get('window').width < 768 ? 25 : 30,
                }}
            >
                <RNTouchableOpacity
                    style={{
                        backgroundColor: 'white',
                    }}
                    onPress={() => handleEdit()}
                    disabled={isEditingEvents || isDeletingEvents || props.user.email === disableEmailId}
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
                        {isEditingEvents ? 'EDITING...' : 'EDIT'}
                    </Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        // overflow: 'hidden',
                        marginTop: 25,
                    }}
                    onPress={() => {
                        Alert('Delete event?', '', [
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
                                    handleDelete(false);
                                },
                            },
                        ]);
                    }}
                    disabled={isEditingEvents || isDeletingEvents || props.user.email === disableEmailId}
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
                        {isDeletingEvents ? 'DELETING...' : 'DELETE'}
                    </Text>
                </RNTouchableOpacity>

                {recurringId && recurringId !== '' ? (
                    <RNTouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            // overflow: 'hidden',
                            // height: 35,
                            marginTop: 25,
                        }}
                        onPress={() => {
                            Alert('Delete all events?', '', [
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
                                        handleDelete(true);
                                    },
                                },
                            ]);
                        }}
                        disabled={isEditingEvents || isDeletingEvents || props.user.email === disableEmailId}
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
                            {isDeletingEvents ? 'DELETING...' : 'DELETE ALL'}
                        </Text>
                    </RNTouchableOpacity>
                ) : null}
            </View>
        );
    };

    useEffect(() => {
        loadEvents();
        loadChannels();
    }, [props.subscriptions]);

    const loadItemsForMonth = useCallback(
        (month: any) => {
            const itemsWithEmptyDates: { [label: string]: any } = {};

            setTimeout(() => {
                for (let i = -120; i < 120; i++) {
                    const time = month.timestamp + i * 24 * 60 * 60 * 1000;
                    const strTime = timeToString(new Date(time));

                    if (!itemsMap[strTime]) {
                        itemsWithEmptyDates[strTime] = [];
                    } else {
                        itemsWithEmptyDates[strTime] = itemsMap[strTime];
                    }
                }

                // let allEventsLoad: any[] = []

                // Object.keys(itemsWithEmptyDates).map((date: string) => {
                //     allEventsLoad = [...allEventsLoad, itemsWithEmptyDates[date]]
                // })

                // console.log("alleventsload length", allEventsLoad.length)

                // Object.keys(items).forEach(key => {
                //     itemsWithEmptyDates[key] = items[key];
                // });

                // Selected date (current date) should never be empty, otherwise Calendar will keep loading
                const todayStr = timeToString(new Date());

                if (!itemsWithEmptyDates[todayStr]) {
                    itemsWithEmptyDates[todayStr] = [];
                }

                Object.keys(itemsWithEmptyDates).map((date: string) => {
                    const events = itemsWithEmptyDates[date];

                    let sortedEvents = events.sort((a: any, b: any) => {
                        return new Date(a.start) > new Date(b.start);
                    });

                    sortedEvents = events.sort((a: any, b: any) => {
                        return a.title > b.title;
                    });

                    itemsWithEmptyDates[date] = sortedEvents;
                });

                setItems(itemsWithEmptyDates);
            }, 1000);
        },
        [itemsMap, items]
    );

    const timeToString = (time: any) => {
        const date = new Date(time);
        return moment(date).format('YYYY-MM-DD');
    };

    const renderItem = (item: any) => {
        const { title } = htmlStringParser(item.title);

        const assingmentDue = new Date() > new Date(item.start);

        const isMeeting = item.meeting;

        const isNonChannelMeeting = item.isNonChannelMeeting;

        const groupUsername = item.groupUsername;

        const startTime = new Date(item.start);
        const endTime = new Date(item.end);

        const displayDate = !item.end
            ? moment(new Date(item.start)).format('h:mm a')
            : moment(new Date(item.start)).format('h:mm a') + ' to ' + moment(new Date(item.end)).format('h:mm a');

        return (
            <TouchableOpacity
                style={{
                    // height: 80,
                    backgroundColor: 'white',
                    marginTop: 20,
                    marginBottom: 15,
                    marginHorizontal: 20,
                    marginRight: Dimensions.get('window').width < 768 ? 15 : 30,
                    // padding: 10,
                    paddingHorizontal: 20,
                    paddingBottom: 10,
                    borderRadius: 15,
                    shadowOffset: {
                        width: 0,
                        height: -10,
                    },
                    flexDirection: 'column',
                    shadowOpacity: 0.03,
                    shadowRadius: 16,
                    zIndex: 50,
                    maxWidth: 600,
                }}
                onPress={() => {
                    onSelectEvent(item);
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingTop: Platform.OS === 'android' ? 7 : 10,
                    }}
                >
                    <View
                        style={{
                            width: 9,
                            height: 9,
                            borderRadius: 6,
                            marginRight: 7,
                            backgroundColor: item.color,
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: 'inter',
                            fontSize: Dimensions.get('window').width < 768 ? 15 : 16,
                            width: '100%',
                            paddingRight: 10,
                        }}
                        numberOfLines={1}
                    >
                        {item.title} {isNonChannelMeeting ? ' · ' + groupUsername : ''}{' '}
                    </Text>
                </View>

                <Text
                    style={{
                        color: 'black',
                        marginTop:
                            item.description !== '' ||
                            (item.submitted !== null && userId !== '' && userId !== item.createdBy) ||
                            (isMeeting && new Date() > startTime && new Date() < endTime)
                                ? Platform.OS === 'android'
                                    ? 3
                                    : 5
                                : Platform.OS === 'android'
                                ? 7
                                : 10,
                        paddingLeft: 17,
                        fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                    }}
                >
                    {displayDate}{' '}
                </Text>

                {item.description && item.description !== '' ? (
                    <Text
                        style={{
                            paddingTop: Platform.OS === 'android' ? 3 : 5,
                            color: '#000',
                            paddingRight: 10,
                            paddingLeft: 17,
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                        }}
                        numberOfLines={1}
                    >
                        {item.description}
                    </Text>
                ) : null}

                {item.submitted !== null && userId !== '' && userId !== item.createdBy ? (
                    <Text
                        style={{
                            color: item.submitted ? '#35AC78' : !assingmentDue ? '#007AFF' : '#F94144',
                            paddingTop: 5,
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                            fontFamily: 'inter',
                            paddingLeft: 17,
                            // color: '#a2a2ac'
                        }}
                    >
                        {item.submitted ? 'SUBMITTED' : assingmentDue ? 'MISSING' : 'PENDING'}
                    </Text>
                ) : null}

                {isMeeting && new Date() > startTime && new Date() < endTime ? (
                    <Text
                        style={{
                            color: '#007AFF',
                            paddingTop: 5,
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                            fontFamily: 'inter',
                            paddingLeft: 17,
                        }}
                    >
                        {'IN PROGRESS'}
                    </Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    const rowHasChanged = (r1: any, r2: any) => {
        return r1 !== r2;
    };

    const datesEqual = (date1: string, date2: string) => {
        const one = new Date(date1);
        const two = new Date(date2);

        if (one > two) return false;
        else if (one < two) return false;
        else return true;
    };

    const onSelectEvent = async (event: any) => {
        const uString: any = await AsyncStorage.getItem('user');
        // Only allow edit if event is not past
        if (uString) {
            const user = JSON.parse(uString);

            const timeString = datesEqual(event.start, event.end)
                ? moment(new Date(event.start)).format('MMMM Do YY, h:mm a')
                : moment(new Date(event.start)).format('MMMM Do YY, h:mm a') +
                  ' to ' +
                  moment(new Date(event.end)).format('MMMM Do YY, h:mm a');

            const descriptionString = event.description ? event.description + '- ' + timeString : '' + timeString;

            if (user._id === event.createdBy && new Date(event.end) > new Date() && event.eventId) {
                setEditEvent(event);
                // setTab('Add');
                setShowAddEvent(true);
            } else if (
                user._id === event.createdBy &&
                event.cueId === '' &&
                new Date(event.end) < new Date() &&
                event.eventId
            ) {
                Alert('Delete ' + event.title + '?', descriptionString, [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        },
                    },
                    {
                        text: 'Delete',
                        onPress: async () => {
                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: deleteDateV1,
                                    variables: {
                                        id: event.eventId,
                                        deleteAll: false,
                                    },
                                })
                                .then((res) => {
                                    if (res.data && res.data.date.deleteV1) {
                                        Alert('Event Deleted!');
                                        loadEvents();
                                    }
                                });
                        },
                    },
                ]);
            } else {
                const date = new Date();

                if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                    const meetingLink = !meetingProvider
                        ? event.zoomRegistrationJoinUrl
                            ? event.zoomRegistrationJoinUrl
                            : event.zoomJoinUrl
                        : event.meetingLink;

                    if (!meetingLink) {
                        Alert('No meeting link set. Contact your instructor.');
                        return;
                    }

                    Alert('Join meeting?', '', [
                        {
                            text: 'No',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                    window.open(meetingLink, '_blank');
                                } else {
                                    Linking.openURL(meetingLink);
                                }
                            },
                        },
                    ]);
                } else if (event.cueId !== '') {
                    props.openCueFromCalendar(event.channelId, event.cueId, event.createdBy);
                } else {
                    Alert(event.title, descriptionString);
                }
            }
        }
    };

    const yesterday = moment().subtract(1, 'day');
    const disablePastDt = (current: any) => {
        return current.isAfter(yesterday);
    };

    const width = Dimensions.get('window').width;

    const renderRecurringOptions = () => (
        <View style={{ flexDirection: 'column', backgroundColor: '#fff', marginTop: 30, width: '100%', maxWidth: 600 }}>
            <View style={{ width: '100%', display: 'flex', backgroundColor: '#fff' }}>
                <View
                    style={{
                        width: '100%',
                        // paddingTop: width < 768 ? 0 : 40,
                        backgroundColor: 'white',
                    }}
                >
                    <Text style={styles.text}>Recurring</Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                    }}
                >
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        thumbColor={'#f4f4f6'}
                        trackColor={{
                            false: '#f4f4f6',
                            true: '#000',
                        }}
                        style={{
                            transform: [
                                { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                            ],
                            marginTop: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    />
                </View>
            </View>

            {recurring ? (
                <View style={{ width: width < 768 ? '100%' : 'auto', display: 'flex', maxWidth: 600 }}>
                    <View
                        style={{
                            width: '100%',
                            paddingTop: 40,
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text style={styles.text}>Interval</Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: showFrequencyDropdown ? getDropdownHeight(eventFrequencyOptions.length) : 50,
                            zIndex: showFrequencyDropdown ? 1 : 0,
                            // marginRight: 10
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            open={showFrequencyDropdown}
                            value={frequency}
                            items={eventFrequencyOptions.map((item: any) => {
                                return {
                                    label: item.value === '' ? 'Once' : item.label,
                                    value: item.value,
                                };
                            })}
                            scrollViewProps={{
                                nestedScrollEnabled: true,
                            }}
                            setOpen={setShowFrequencyDropdown}
                            setValue={setFrequency}
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 0,
                                height: 45,
                                // elevation: !showFrequencyDropdown ? 0 : 2
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                // elevation: !showFrequencyDropdown ? 0 : 2
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 1,
                                    height: 3,
                                },
                                shadowOpacity: !showFrequencyDropdown ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                </View>
            ) : null}

            {recurring && frequency === '1-W' ? (
                <View style={{ width: '100%', maxWidth: 600, display: 'flex' }} key={selectedDays.toString()}>
                    <View style={{ width: '100%', backgroundColor: 'white', paddingVertical: 15, marginTop: 20 }}>
                        <Text style={styles.text}>Occurs on</Text>
                        {
                            <View
                                style={{
                                    flexDirection: 'row',
                                    width: '100%',
                                    flexWrap: 'wrap',
                                    paddingTop: Dimensions.get('window').width < 768 ? 10 : 20,
                                }}
                            >
                                {Object.keys(weekDays).map((day: any, ind: number) => {
                                    const label = weekDays[day];

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 10,
                                                padding: 5,
                                                marginBottom: 10,
                                            }}
                                            key={ind}
                                        >
                                            <BouncyCheckbox
                                                disabled={day === selectedStartDay}
                                                style={{ marginRight: 5 }}
                                                isChecked={selectedDays.includes(day)}
                                                disableText={true}
                                                onPress={(e: any) => {
                                                    if (selectedDays.includes(day)) {
                                                        const filterDays = selectedDays.filter(
                                                            (sel: any) => sel !== day
                                                        );
                                                        setSelectedDays(filterDays);
                                                    } else {
                                                        const updatedSelectDays = [...selectedDays, day];
                                                        setSelectedDays(updatedSelectDays);
                                                    }
                                                }}
                                            />
                                            <Text>{label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        }
                    </View>
                </View>
            ) : null}

            {recurring ? (
                <View
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingTop: 30,
                        backgroundColor: '#fff',
                        // marginLeft: 'auto',
                        // zIndex: 100
                    }}
                >
                    <Text style={styles.text}>
                        End date
                        {/* {PreferredLanguageText("repeatTill")}{" "} */}
                        {Platform.OS === 'android' ? ': ' + moment(new Date(repeatTill)).format('MMMM Do YYYY') : null}
                    </Text>
                    <View
                        style={{
                            // width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            backgroundColor: '#fff',
                            // marginTop: 12,
                            marginLeft: 'auto',
                        }}
                    >
                        {renderRepeatTillDateTimePicker()}
                    </View>
                </View>
            ) : null}
        </View>
    );

    const renderMeetingOptions = () => {
        let meetingSwitchMessage =
            'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.';

        let meetingSwitchSubtitle = 'Note - you must have a meeting link specified in your Course settings.';

        if ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') && !meetingProvider) {
            meetingSwitchMessage =
                'To generate Zoom meetings directly from Cues, connect to Zoom under Account > Profile.';
            meetingSwitchSubtitle = '';
        } else if (userZoomInfo && userZoomInfo.accountId && userZoomInfo.accountId !== '' && !meetingProvider) {
            meetingSwitchMessage = 'Cues will automatically generate a Zoom meeting.';
            meetingSwitchSubtitle =
                'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.';
        }

        return channelId !== '' || editChannelName !== '' ? (
            <View
                style={{
                    width: '100%',
                    maxWidth: 600,
                    flexDirection: 'row',
                    marginTop: 40,
                    backgroundColor: '#fff',
                }}
            >
                {!editEvent ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            width: '100%',
                        }}
                    >
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={styles.text}>Meeting</Text>
                                {editEvent ? null : (
                                    <RNTouchableOpacity
                                        style={{
                                            marginLeft: 10,
                                        }}
                                        onPress={() => {
                                            Alert(meetingSwitchMessage, meetingSwitchSubtitle);
                                        }}
                                    >
                                        <Text>
                                            <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                        </Text>
                                    </RNTouchableOpacity>
                                )}
                            </View>
                        </View>

                        {editEvent ||
                        ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') &&
                            !meetingProvider) ? null : (
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <Switch
                                    value={isMeeting}
                                    onValueChange={() => {
                                        setIsMeeting(!isMeeting);
                                    }}
                                    thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#000',
                                    }}
                                    style={{
                                        transform: [
                                            { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                            { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                        ],
                                        marginTop: Dimensions.get('window').width < 768 ? 0 : 10,
                                    }}
                                    disabled={
                                        editEvent ||
                                        ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') &&
                                            !meetingProvider)
                                    }
                                />
                            </View>
                        )}
                    </View>
                ) : null}
            </View>
        ) : null;
    };

    const renderEventModalContent = () => {
        return (
            <ScrollView
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0,
                    zIndex: 10000,
                }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingBottom: 120,
                    paddingTop: Dimensions.get('window').width > 768 && orientation === 'PORTRAIT' ? 50 : 20,
                }}
                showsVerticalScrollIndicator={true}
                // scrollEnabled={true}
                // scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                // overScrollMode={'never'}
                nestedScrollEnabled={true}
                indicatorStyle={'black'}
            >
                {/* <View
                    style={{
                        backgroundColor: 'white',
                        width: '100%',
                        height: '100%',
                        paddingHorizontal: 20,
                        borderTopRightRadius: 0,
                        borderTopLeftRadius: 0,
                        marginBottom: 120,
                        alignSelf: 'center'
                    }}
                > */}
                {/* <View
                        style={{
                            flexDirection: 'column',
                            paddingTop: 20,
                            // paddingBottom: 40,
                            backgroundColor: 'white'
                        }}
                    > */}
                <View
                    style={{
                        width: '100%',
                        maxWidth: 600,
                        backgroundColor: '#fff',
                    }}
                >
                    <View style={{ width: '100%', marginBottom: 10 }}>
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'Inter',
                                color: '#000000',
                                fontWeight: 'bold',
                            }}
                        >
                            Topic
                        </Text>
                        <TextInput
                            value={title}
                            placeholder={''}
                            onChangeText={(val) => setTitle(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                        />
                    </View>
                </View>
                <View
                    style={{
                        width: '100%',
                        backgroundColor: '#fff',
                        maxWidth: 600,
                        // marginLeft: Dimensions.get('window').width < 768 ? 0 : 50
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold',
                        }}
                    >
                        Description
                    </Text>
                    <TextInput
                        value={description}
                        // placeholder="Description"
                        onChangeText={(val) => setDescription(val)}
                        placeholderTextColor={'#a2a2ac'}
                        hasMultipleLines={true}
                    />
                </View>
                {/* </View> */}
                <View style={{ backgroundColor: '#fff', width: '100%', maxWidth: 600, flexDirection: 'column' }}>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            paddingTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 0,
                            alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
                        }}
                    >
                        <Text style={styles.text}>
                            Start
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(start)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        {renderStartDateTimePicker()}
                    </View>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            backgroundColor: '#fff',
                            marginTop: 12,
                            marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 0,
                            alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
                        }}
                    >
                        <Text style={styles.text}>
                            End
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(end)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        {renderEndDateTimePicker()}
                    </View>
                </View>

                <View style={{}}>
                    {channels.length > 0 && !editEvent ? (
                        <View>
                            <View style={{ width: '100%', paddingBottom: 10, marginTop: 30 }}>
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    For
                                </Text>
                            </View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    display: 'flex',
                                    height: showChannelDropdown ? getDropdownHeight(channelOptions.length) : 50,
                                    zIndex: showChannelDropdown ? 1 : 0,
                                    maxWidth: 600,
                                }}
                            >
                                <DropDownPicker
                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                    open={showChannelDropdown}
                                    value={selectedChannel}
                                    items={channelOptions}
                                    setOpen={setShowChannelDropdown}
                                    scrollViewProps={{
                                        nestedScrollEnabled: true,
                                    }}
                                    onSelectItem={(val: any) => {
                                        setSelectedChannel(val.value);

                                        console.log('Selected dropdown value', val);

                                        if (val.value === 'My Events') {
                                            setChannelId('');
                                        } else {
                                            setChannelId(val.value);
                                        }
                                    }}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 0,
                                        height: 45,
                                        // elevation: !showChannelDropdown ? 0 : 2
                                    }}
                                    dropDownContainerStyle={{
                                        borderWidth: 0,
                                        // elevation: !showChannelDropdown ? 0 : 2
                                    }}
                                    containerStyle={{
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 1,
                                            height: 3,
                                        },
                                        shadowOpacity: !showChannelDropdown ? 0 : 0.08,
                                        shadowRadius: 12,
                                    }}
                                    textStyle={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontFamily: 'overpass',
                                    }}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* {editEvent && renderEditChannelName()} */}
                {renderEditMeetingInfo()}

                {!editEvent && renderRecurringOptions()}
                {renderMeetingOptions()}
                {channelId !== '' && meetingProvider !== '' && isMeeting ? (
                    <Text
                        style={{
                            fontSize: 11,
                            color: '#000000',
                            // textTransform: 'uppercase',
                            lineHeight: 20,
                            fontFamily: 'Inter',
                            paddingBottom: 15,
                            maxWidth: 600,
                        }}
                    >
                        The meeting link will be same as the one in the Course Settings. Ensure you have a working link
                        set at all times.
                    </Text>
                ) : null}
                {channelId !== '' && userZoomInfo && userZoomInfo.accountId && !meetingProvider && !editEvent ? (
                    <Text
                        style={{
                            fontSize: 11,
                            color: '#000000',
                            // textTransform: 'uppercase',
                            lineHeight: 20,
                            fontFamily: 'Inter',
                            paddingVertical: 15,
                            maxWidth: 600,
                        }}
                    >
                        Note: You need to be a licensed Zoom user for student attendances to be automatically captured
                        and visible under your Course past meetings.
                    </Text>
                ) : null}

                {channelId !== '' && (!userZoomInfo || !userZoomInfo.accountId) && !meetingProvider ? (
                    <View
                        style={{
                            marginVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 10,
                            paddingHorizontal: 15,
                            backgroundColor: '#f8f8f8',
                            borderRadius: 1,
                            width: '100%',
                            maxWidth: 600,
                            borderRadius: 10,
                        }}
                    >
                        <Ionicons
                            name="warning-outline"
                            size={Dimensions.get('window').width < 768 ? 22 : 24}
                            color={'#f3722c'}
                        />

                        <View
                            style={{
                                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <Text
                                style={{
                                    paddingHorizontal: 20,
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                }}
                            >
                                To schedule online meetings connect your account to Zoom
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    // ZOOM OAUTH

                                    const url = 'https://app.learnwithcues.com/zoom_auth';

                                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                        Linking.openURL(url);
                                    } else {
                                        window.open(url, '_blank');
                                    }
                                }}
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    paddingLeft: Dimensions.get('window').width < 768 ? 20 : 10,
                                    paddingVertical: Dimensions.get('window').width < 768 ? 10 : 0,
                                }}
                                disabled={props.user.email === disableEmailId}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'inter',
                                        color: '#000',
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    Connect
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {!editEvent ? (
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                            flexDirection: 'row',
                            backgroundColor: '#fff',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <RNTouchableOpacity
                            style={{
                                marginBottom: 20,
                                marginTop: 40,
                            }}
                            onPress={() => handleCreate()}
                            disabled={isCreatingEvents || props.user.email === disableEmailId}
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
                                    width: 120,
                                }}
                            >
                                {isCreatingEvents ? 'ADDING...' : 'ADD'}
                            </Text>
                        </RNTouchableOpacity>
                    </View>
                ) : null}
                {editEvent ? renderEditEventOptions() : null}
                {/* </View> */}
            </ScrollView>
        );
    };

    /**
     * @description Renders filter for Agenda
     */
    const renderFilterModalContent = () => {
        const filterChannelOptions = [
            { value: 'All', label: 'All' },
            { value: '', label: 'My Events' },
        ];

        props.subscriptions.map((sub: any) => {
            filterChannelOptions.push({
                value: sub.channelId,
                label: sub.channelName,
            });
        });

        const typeOptions = [
            { value: 'All', label: 'All' },
            { value: 'Meetings', label: 'Meetings' },
            { value: 'Submissions', label: 'Submissions' },
            { value: 'Events', label: 'Events' },
        ];

        return (
            <ScrollView
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0,
                }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                <View style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold',
                        }}
                    >
                        Workspace
                    </Text>
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: showFilterByChannelDropdown ? getDropdownHeight(filterChannelOptions.length) : 50,
                            marginTop: 10,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            open={showFilterByChannelDropdown}
                            value={filterByChannel}
                            items={filterChannelOptions}
                            setOpen={setShowFilterByChannelDropdown}
                            setValue={setFilterByChannel}
                            scrollViewProps={{
                                nestedScrollEnabled: true,
                            }}
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
                                shadowOpacity: !showFilterByChannelDropdown ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                </View>
                {activeTab === 'agenda' ? (
                    <View style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'Inter',
                                color: '#000000',
                                fontWeight: 'bold',
                            }}
                        >
                            Type
                        </Text>

                        <View
                            style={{
                                backgroundColor: 'white',
                                display: 'flex',
                                height: showFilterTypeDropdown ? getDropdownHeight(typeOptions.length) : 50,
                                marginTop: 10,
                                // zIndex: showFilterTypeDropdown ? 1 : 0,
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                open={showFilterTypeDropdown}
                                value={filterEventsType}
                                items={typeOptions}
                                setOpen={setShowFilterTypeDropdown}
                                setValue={setFilterEventsType}
                                scrollViewProps={{
                                    nestedScrollEnabled: true,
                                }}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 0,
                                    height: 45,
                                    // elevation: !showFilterTypeDropdown ? 0 : 2
                                }}
                                dropDownContainerStyle={{
                                    borderWidth: 0,
                                    // elevation: !showFilterTypeDropdown ? 0 : 2
                                }}
                                containerStyle={{
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 1,
                                        height: 3,
                                    },
                                    shadowOpacity: !showFilterTypeDropdown ? 0 : 0.08,
                                    shadowRadius: 12,
                                }}
                                textStyle={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'overpass',
                                }}
                            />
                        </View>
                    </View>
                ) : null}
                <View style={{ backgroundColor: '#fff', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            flexDirection: 'row',
                            // paddingTop: 12,
                            backgroundColor: '#fff',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.text}>
                            Start
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(filterStart)).format('MMMM Do YYYY')
                                : null}
                        </Text>
                        {renderFilterStartDateTimePicker()}
                    </View>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            flexDirection: 'row',
                            backgroundColor: '#fff',
                            marginTop: Dimensions.get('window').width < 768 ? 12 : 20,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.text}>
                            End
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(filterEnd)).format('MMMM Do YYYY')
                                : null}
                        </Text>
                        {renderFilterEndDateTimePicker()}
                    </View>
                </View>
            </ScrollView>
        );
    };

    let windowHeight = 0;

    // iPhone
    if (Dimensions.get('window').width < 768 && Platform.OS === 'ios') {
        windowHeight = Dimensions.get('window').height - 115;
        // Android Phone
    } else if (Dimensions.get('window').width < 768 && Platform.OS === 'android') {
        windowHeight = Dimensions.get('window').height - 30;
        // Tablet potrait
    } else if (orientation === 'PORTRAIT' && Dimensions.get('window').width > 768) {
        windowHeight = Dimensions.get('window').height - 30;
        // Tablet landscape
    } else if (orientation === 'LANDSCAPE' && Dimensions.get('window').width > 768) {
        windowHeight = Dimensions.get('window').height - 60;
    } else {
        windowHeight = Dimensions.get('window').height - 30;
    }

    // Height needs to offset the App bar height (Different for iPhone, Android, iPad, Android tablet)

    return (
        <Animated.View
            style={{
                opacity: modalAnimation,
                width: '100%',
                // height: windowHeight,
                height:
                    Dimensions.get('window').width < 768
                        ? windowHeight - (Platform.OS === 'ios' ? 0 : 18)
                        : windowHeight - (Platform.OS === 'ios' ? 50 : 30),
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    // justifyContent: 'center',
                    alignItems: 'center',
                    // paddingHorizontal: 20,
                    paddingTop: 15,
                    paddingBottom: 10,
                    paddingHorizontal: paddingResponsive(),
                }}
            >
                {activeTab === 'activity' ? (
                    <TouchableOpacity
                        style={{
                            marginRight: 15,
                        }}
                        onPress={() => setActiveTab('agenda')}
                    >
                        <Ionicons name={'arrow-back-outline'} size={35} color="#1f1f1f" />
                    </TouchableOpacity>
                ) : (
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 800 ? 22 : 26,
                            color: '#000',
                            fontFamily: 'Inter',
                        }}
                    >
                        {renderTimeMessage()}
                    </Text>
                )}

                {activeTab === 'activity' ? (
                    <Text
                        style={{
                            color: '#1f1f1f',
                            fontFamily: 'Inter',
                            fontWeight: 'bold',
                            fontSize: Dimensions.get('window').width < 768 ? 22 : 30,
                        }}
                    >
                        Activity
                    </Text>
                ) : null}

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginLeft: 'auto',
                    }}
                >
                    {activeTab === 'activity' ? null : (
                        <View
                            style={{
                                marginRight: 20,
                            }}
                        >
                            <TouchableOpacity
                                containerStyle={{
                                    position: 'relative',
                                }}
                                onPress={() => setActiveTab('activity')}
                            >
                                <Ionicons
                                    name={'notifications-outline'}
                                    style={{
                                        color: activeTab === 'activity' ? '#000' : 'black',
                                    }}
                                    size={Dimensions.get('window').width < 800 ? 23 : 26}
                                    color="black"
                                />
                            </TouchableOpacity>
                            {unreadCount && unreadCount > 0 ? (
                                <View
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 7,
                                        backgroundColor: '#f94144',
                                        position: 'absolute',
                                        top: -1,
                                        right: -2,
                                    }}
                                />
                            ) : null}
                        </View>
                    )}

                    {activeTab === 'activity' && unreadCount && unreadCount > 0 ? (
                        <TouchableOpacity
                            style={{
                                marginRight: 15,
                            }}
                            onPress={async () => {
                                Alert('Mark as Read?', '', [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                        onPress: () => {
                                            return;
                                        },
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: async () => {
                                            const uString: any = await AsyncStorage.getItem('user');
                                            if (uString) {
                                                const user = JSON.parse(uString);
                                                const server = fetchAPI(user._id);
                                                server
                                                    .mutate({
                                                        mutation: markActivityAsRead,
                                                        variables: {
                                                            userId: user._id,
                                                            markAllRead: true,
                                                        },
                                                    })
                                                    .then((res) => {
                                                        if (res.data.activity.markActivityAsRead) {
                                                            server
                                                                .query({
                                                                    query: getActivity,
                                                                    variables: {
                                                                        userId: user._id,
                                                                    },
                                                                })
                                                                .then((res) => {
                                                                    if (res.data && res.data.activity.getActivity) {
                                                                        const tempActivity =
                                                                            res.data.activity.getActivity;
                                                                        let unread = 0;
                                                                        tempActivity.map((act: any) => {
                                                                            if (act.status === 'unread') {
                                                                                unread++;
                                                                            }
                                                                        });
                                                                        setUnreadCount(unread);
                                                                        setActivity(tempActivity);
                                                                    }
                                                                });
                                                        }
                                                    })
                                                    .catch((err) => {});
                                            }
                                        },
                                    },
                                ]);
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Ionicons
                                name={'checkmark-done-outline'}
                                size={Dimensions.get('window').width < 800 ? 23 : 26}
                                color="black"
                            />
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity onPress={() => setShowFilterModal(!showFilterModal)}>
                        <Ionicons
                            name={'filter-outline'}
                            size={Dimensions.get('window').width < 800 ? 23 : 26}
                            color="black"
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View
                style={{ flex: 1, marginBottom: Dimensions.get('window').width < 1024 ? 24 : 0 }}
                key={activeTab.toString() + channels.length.toString() + orientation}
            >
                {activeTab === 'agenda' ? (
                    loadingEvents ? (
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : (
                        <Agenda
                            initialNumToRender={10}
                            showClosingKnob={true}
                            // showOnlySelectedDayItems={Platform.OS === 'android'}
                            showOnlySelectedDayItems={false}
                            items={items}
                            loadItemsForMonth={loadItemsForMonth}
                            selected={timeToString(new Date())}
                            renderItem={renderItem}
                            rowHasChanged={rowHasChanged}
                            pastScrollRange={3}
                            futureScrollRange={3}
                            theme={{
                                agendaKnobColor: '#e0e0e0', // knob color
                                agendaTodayColor: '#007AFF', // today in list
                                todayTextColor: '#007AFF',
                                selectedDayBackgroundColor: '#007AFF', // calendar sel date
                                dotColor: '#007AFF', // dots
                            }}
                            onDayPress={onUpdateSelectedDate}
                            onDayLongPress={onUpdateSelectedDate}
                            renderEmptyDate={() => <View />}
                            reservationsKeyExtractor={(item: any, index: number) => {
                                const { reservation } = item;

                                return reservation
                                    ? (reservation.channelId ? reservation.channelId : '') +
                                          (reservation.channelName ? reservation.channelName : '') +
                                          (reservation.createdBy ? reservation.createdBy : '') +
                                          reservation.start
                                    : index.toString();
                            }}
                        />
                    )
                ) : (
                    renderActivity()
                )}
            </View>

            {showAddEvent ? (
                <BottomSheet
                    snapPoints={[
                        0,
                        newEventModalHeight(windowHeight, Dimensions.get('window').width, Platform.OS, orientation),
                    ]}
                    close={() => {
                        setEditEvent(null);
                        setShowAddEvent(false);
                    }}
                    isOpen={showAddEvent}
                    title={
                        editEvent && editChannelName
                            ? `${editEvent && editEvent.meeting ? 'Meeting' : 'Event'} ${
                                  editEvent.isNonChannelMeeting
                                      ? ': ' + editEvent.groupUsername
                                      : 'for ' + editChannelName
                              }`
                            : 'New event'
                    }
                    renderContent={() => renderEventModalContent()}
                    header={true}
                    callbackNode={fall}
                />
            ) : null}

            {showAddEvent ? (
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
                        onPress={() => setShowAddEvent(false)}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}

            {showFilterModal ? (
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
                    <RNTouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => setShowFilterModal(false)}
                    ></RNTouchableOpacity>
                </Reanimated.View>
            ) : null}

            {activeTab === 'agenda' && showFilterModal ? (
                <BottomSheet
                    snapPoints={[0, filterEventModalHeight(Dimensions.get('window').width, Platform.OS, orientation)]}
                    close={() => {
                        console.log('Close bottom sheet');
                        setShowFilterModal(false);
                    }}
                    isOpen={showFilterModal}
                    title={'Filter'}
                    renderContent={() => renderFilterModalContent()}
                    header={false}
                    callbackNode={fall}
                />
            ) : null}

            {activeTab !== 'agenda' && showFilterModal ? (
                <BottomSheet
                    snapPoints={[
                        0,
                        filterActivityModalHeight(Dimensions.get('window').width, Platform.OS, orientation),
                    ]}
                    close={() => {
                        setShowFilterModal(false);
                    }}
                    isOpen={showFilterModal}
                    title={'Filter'}
                    renderContent={() => renderFilterModalContent()}
                    header={false}
                    callbackNode={fall}
                />
            ) : null}

            {activeTab === 'agenda' ? (
                <TouchableOpacity
                    onPress={() => {
                        setShowAddEvent(true);
                    }}
                    containerStyle={{
                        position: 'absolute',
                        marginRight: blueButtonMR(Dimensions.get('window').width, orientation, Platform.OS),
                        marginBottom: blueButtonCalendarMB(Dimensions.get('window').width, orientation, Platform.OS),
                        right: 0,
                        justifyContent: 'center',
                        bottom: 0,
                        width: Dimensions.get('window').width > 350 ? 62 : 58,
                        height: Dimensions.get('window').width > 350 ? 62 : 58,
                        borderRadius: Dimensions.get('window').width > 350 ? 31 : 29,
                        backgroundColor: '#000',
                        borderColor: '#f2f2f2',
                        borderWidth: 0,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 4,
                            height: 4,
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 10,
                        zIndex: 50,
                    }}
                >
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        <Ionicons name="add-outline" size={Dimensions.get('window').width > 350 ? 36 : 35} />
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* {activeTab === 'activity' && unreadCount && unreadCount > 0 ? (
                <TouchableOpacity
                    onPress={async () => {
                        const uString: any = await AsyncStorage.getItem('user');
                        if (uString) {
                            const user = JSON.parse(uString);
                            const server = fetchAPI(user._id);
                            server
                                .mutate({
                                    mutation: markActivityAsRead,
                                    variables: {
                                        userId: user._id,
                                        markAllRead: true
                                    }
                                })
                                .then(res => {
                                    if (res.data.activity.markActivityAsRead) {
                                        server
                                            .query({
                                                query: getActivity,
                                                variables: {
                                                    userId: user._id
                                                }
                                            })
                                            .then(res => {
                                                if (res.data && res.data.activity.getActivity) {
                                                    const tempActivity = res.data.activity.getActivity.reverse();
                                                    let unread = 0;
                                                    tempActivity.map((act: any) => {
                                                        if (act.status === 'unread') {
                                                            unread++;
                                                        }
                                                    });
                                                    setUnreadCount(unread);
                                                    setActivity(tempActivity);
                                                }
                                            });
                                    }
                                })
                                .catch(err => {});
                        }
                    }}
                    style={{
                        position: 'absolute',
                        marginRight:
                            Dimensions.get('window').width >= 1100
                                ? (Dimensions.get('window').width - 1100) / 2 - 25
                                : Dimensions.get('window').width >= 768
                                ? 30
                                : 24,
                        marginBottom: Dimensions.get('window').width < 768 ? 35 : 75,
                        right: 0,
                        justifyContent: 'center',
                        bottom: 0,
                        // width: 58,
                        // height: 58,
                        paddingVertical: 15,
                        paddingHorizontal: 20,
                        borderRadius: 29,
                        backgroundColor: '#000',
                        borderColor: '#f2f2f2',
                        borderWidth: 0,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 4,
                            height: 4
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 10,
                        zIndex: 50
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            width: '100%',
                            textAlign: 'center',
                            fontFamily: 'inter',
                            fontWeight: 'bold'
                        }}
                    >
                        Mark as Read
                    </Text>
                </TouchableOpacity>
            ) : null} */}
        </Animated.View>
    );
};

// export default React.memo(CalendarX, (prev, next) => {
//     return _.isEqual(
//         {
//             ...prev.tab,
//             ...prev.cues,
//             ...prev.showSearchMobile,
//             ...prev.setShowSearchMobile
//         },
//         {
//             ...next.tab,
//             ...next.cues,
//             ...next.showSearchMobile,
//             ...next.setShowSearchMobile
//         }
//     );
// });

export default React.memo(CalendarX);

const styles: any = StyleSheet.create({
    eventTitle: {
        fontFamily: 'inter',
        fontSize: 14,
        // ,
        height: '44%',
        width: '100%',
        paddingTop: 5,
        color: '#2f2f3c',
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20,
    },
    text: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#000000',
        marginBottom: Dimensions.get('window').width < 768 ? 10 : 0,
        fontFamily: 'Inter',
        fontWeight: 'bold',
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10,
        marginLeft: 10,
    },
    allBlack: {
        fontSize: 11,
        color: '#2f2f3c',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: 11,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#2f2f3c',
    },
});
