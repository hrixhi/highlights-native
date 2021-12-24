import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    ScrollView,
    Platform,
    Switch,
    Linking
} from 'react-native';
import { TextInput } from './CustomTextInput';
import Alert from './Alert';
import { Text, View, TouchableOpacity } from './Themed';
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
    markActivityAsRead
} from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';

import { Agenda } from 'react-native-calendars';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { eventFrequencyOptions } from '../helpers/FrequencyOptions';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';
// import BottomSheet from 'reanimated-bottom-sheet';
import BottomSheet from './BottomSheet';

import _ from 'lodash';
import DropDownPicker from 'react-native-dropdown-picker';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [modalAnimation] = useState(new Animated.Value(1));
    const [title, setTitle] = useState('');
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60));
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
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
    const [unreadCount, setUnreadCount] = useState<any>(0);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState('Home');

    const [selectedStartDay, setSelectedStartDay] = useState<any>(`${start.getDay() + 1}`);
    const [selectedDays, setSelectedDays] = useState<any[]>([selectedStartDay]);

    // Filter start & end
    const currentDate = new Date();
    const [filterStart, setFilterStart] = useState<any>(new Date(currentDate.getTime() - 1000 * 60 * 60 * 24 * 30 * 5));
    const [filterEnd, setFilterEnd] = useState<any>(new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * 30 * 10));

    // FILTERS
    const [eventChannels, setEventChannels] = useState<any[]>([]);
    const [filterChannels, setFilterChannels] = useState<any[]>([]);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [filterByLectures, setFilterByLectures] = useState(false);
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

    const channelOptions = [
        {
            value: 'Home',
            label: 'Home'
        }
    ];

    channels.map((channel: any) => {
        channelOptions.push({
            value: channel._id,
            label: channel.name
        });
    });

    const weekDays = {
        '1': 'Sun',
        '2': 'Mon',
        '3': 'Tue',
        '4': 'Wed',
        '5': 'Thu',
        '6': 'Fri',
        '7': 'Sat'
    };

    console.log('Channel options', channelOptions);

    const onUpdateSelectedDate = (date: any) => {
        setCurrentMonth(moment(date.dateString).format('MMMM YYYY'));
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
                        userId: user._id
                    }
                })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                    }
                })
                .catch(err => {});
        }
    }, []);

    useEffect(() => {
        let total = [...allItems];

        if (filterEventsType !== 'All') {
            if (filterEventsType === 'Meetings') {
                total = total.filter((e: any) => e.meeting);
            } else if (filterEventsType === 'Submissions') {
                total = total.filter((e: any) => e.cueId !== '');
            } else if (filterEventsType === 'Events') {
                total = total.filter((e: any) => e.cueId === '' && !e.meeting);
            }
        }

        let filterByChannels = [];

        if (filterByChannel === 'All') {
            filterByChannels = total;
        } else {
            const all = [...total];
            const filter = all.filter((e: any) => filterByChannel === e.channelName);

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

        // Selected date (current date) should never be empty, otherwise Calendar will keep loading
        const todayStr = timeToString(new Date());

        if (!loadedItems[todayStr]) {
            loadedItems[todayStr] = [];
        }

        setItems(loadedItems);
    }, [filterByChannel, filterEventsType]);

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
                            setAllActivity(tempActivity);
                        }
                    });
            }
        })();
    }, []);

    useEffect(() => {
        if (title !== '' && end > start) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [title, start, end]);

    // use effect for edit events
    useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.originalTitle);
            setDescription(editEvent.description);
            setStart(new Date(editEvent.start));
            setEnd(new Date(editEvent.end));
            setEditChannelName(editEvent.channelName);

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
                    backgroundColor: 'white'
                }}
            >
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
                    <ScrollView horizontal={false} showsVerticalScrollIndicator={true} indicatorStyle={'black'}>
                        {activity.map((act: any, index) => {
                            const { cueId, channelId, createdBy, target, threadId } = act;

                            if (filterByChannel !== 'All') {
                                if (filterByChannel !== act.channelId) {
                                    return;
                                }
                            }

                            const date = new Date(act.date);

                            if (filterStart && filterEnd) {
                                const start = new Date(filterStart);
                                if (date < start) {
                                    return;
                                }
                                const end = new Date(filterEnd);
                                if (date > end) {
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
                                                    markAllRead: false
                                                }
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
                                        borderColor: '#efefef',
                                        borderBottomWidth: index === activity.length - 1 ? 0 : 1,
                                        width: '100%',
                                        paddingVertical: 5,
                                        backgroundColor: 'white',
                                        height: 90
                                        // borderLeftWidth: 3,
                                        // borderLeftColor: act.colorCode
                                    }}
                                    key={index}
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'white',
                                            paddingLeft: Dimensions.get('window').width < 768 ? 10 : 20
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                            <View
                                                style={{
                                                    width: 9,
                                                    height: 9,
                                                    borderRadius: 6,
                                                    // marginTop: 2,
                                                    marginRight: 5,
                                                    // paddingTop: 5,
                                                    backgroundColor: act.colorCode
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    padding: 5,
                                                    fontFamily: 'inter'
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {act.channelName}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                padding: 5,
                                                lineHeight: 18,
                                                fontWeight: 'bold'
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
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {act.status === 'unread' ? (
                                                <Ionicons name="alert-circle-outline" color="#f94144" size={18} />
                                            ) : null}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                padding: 5,
                                                lineHeight: 13,
                                                fontWeight: 'bold'
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {emailTimeDisplay(act.date)}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            <Ionicons name="chevron-forward-outline" size={18} color="#006AFF" />
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </InsetShadow>
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
                        repeatDays
                    }
                })
                .then(res => {
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
                    }
                })
                .catch(err => {
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
        isSubmitDisabled,
        isCreatingEvents,
        selectedDays
    ]);

    const handleEdit = useCallback(async () => {
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
                    recordMeeting
                }
            })
            .then(res => {
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
            .catch(err => {
                setIsEditingEvents(false);
                console.log(err);
            });
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
                        deleteAll
                    }
                })
                .then(res => {
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
                .catch(err => {
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
                    userId: parsedUser._id
                }
            })
            .then(res => {
                if (res.data.date && res.data.date.getCalendar) {
                    const channelsSet = new Set();

                    const parsedEvents: any[] = [];
                    res.data.date.getCalendar.map((e: any) => {
                        const { title } = htmlStringParser(e.title);

                        channelsSet.add(e.channelName);

                        parsedEvents.push({
                            eventId: e.eventId ? e.eventId : '',
                            originalTitle: title,
                            title: e.channelName ? e.channelName + ' - ' + title : title,
                            start: new Date(e.start),
                            end: new Date(e.end),
                            dateId: e.dateId,
                            description: e.description,
                            createdBy: e.createdBy,
                            channelName: e.channelName,
                            recurringId: e.recurringId,
                            recordMeeting: e.recordMeeting ? true : false,
                            meeting: e.meeting,
                            channelId: e.channelId,
                            cueId: e.cueId
                        });
                    });

                    const loadedItems: { [key: string]: any } = {};

                    const allEvents: any = [];

                    // Add Logic to convert to items for Agenda
                    res.data.date.getCalendar.map((item: any) => {
                        const strTime = timeToString(item.start);

                        const { title } = htmlStringParser(item.title);

                        const modifiedItem = {
                            eventId: item.eventId ? item.eventId : '',
                            originalTitle: title,
                            title: item.channelName ? item.channelName + ' - ' + title : title,
                            start: new Date(item.start),
                            end: new Date(item.end),
                            dateId: item.dateId,
                            description: item.description,
                            createdBy: item.createdBy,
                            channelName: item.channelName,
                            recurringId: item.recurringId,
                            recordMeeting: item.recordMeeting ? true : false,
                            meeting: item.meeting,
                            channelId: item.channelId,
                            cueId: item.cueId
                        };

                        allEvents.push(modifiedItem);

                        if (!loadedItems[strTime]) {
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

                    setEventChannels(Array.from(channelsSet));
                    setItems(loadedItems);
                    setAllItems(allEvents);
                }

                setLoadingEvents(false);

                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            })
            .catch(err => {
                console.log(err);
                Alert('Unable to load calendar.', 'Check connection.');

                setLoadingEvents(false);

                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            });
    }, [props.tab, modalAnimation]);

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
                            if (!selectedDate) return;
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
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row'
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
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row'
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
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
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
                            if (!selectedDate) return;
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
                            if (!selectedDate) return;
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
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row'
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
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row'
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
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
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
                            if (!selectedDate) return;
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
                            if (!selectedDate) return;
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
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                            onPress={() => {
                                setShowRepeatTillDateAndroid(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
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

    const renderFilterStartDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
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
                            if (!selectedDate) return;
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
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row'
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
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
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
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
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
                            if (!selectedDate) return;
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
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                            onPress={() => {
                                setShowFilterStartDateAndroid(false);
                                setShowFilterEndDateAndroid(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 35,
                                    color: '#2f2f3c',
                                    overflow: 'hidden',
                                    fontSize: 10,
                                    // backgroundColor: '#f4f4f6',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    width: 150,
                                    borderRadius: 15
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
                                color: '#a2a2ac'
                            }}
                        >
                            Shared with {editChannelName}
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        );
    };

    const renderEditEventOptions = () => {
        const { recurringId, start, end, channelId } = editEvent;

        const date = new Date();

        return (
            <View
                style={{
                    width: Dimensions.get('window').width < 768 ? '100%' : '10%',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                    display: 'flex',
                    marginBottom: 50,
                    alignItems: Dimensions.get('window').width < 768 ? 'center' : 'flex-start',
                    backgroundColor: 'white'
                    // paddingLeft: 7
                    // justifyContent: 'center'
                }}
            >
                {date > new Date(start) && date < new Date(end) ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 35,
                            borderRadius: 15
                        }}
                        onPress={async () => {
                            const uString: any = await AsyncStorage.getItem('user');

                            const user = JSON.parse(uString);

                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: meetingRequest,
                                    variables: {
                                        userId: user._id,
                                        channelId,
                                        isOwner: true
                                    }
                                })
                                .then(res => {
                                    if (res.data && res.data.channel.meetingRequest !== 'error') {
                                        Linking.openURL(res.data.channel.meetingRequest);
                                    } else {
                                        Alert('Classroom not in session. Waiting for instructor.');
                                    }
                                })
                                .catch(err => {
                                    Alert('Something went wrong.');
                                });
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#006AFF',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 200,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            Enter Classroom
                        </Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 25,
                        borderRadius: 15
                        // marginBottom: 20
                    }}
                    onPress={() => handleEdit()}
                    disabled={isSubmitDisabled || isEditingEvents || isDeletingEvents}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: 'white',
                            fontSize: 11,
                            backgroundColor: '#006AFF',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 35,
                            width: 200,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}
                    >
                        {isEditingEvents ? 'EDITING...' : 'EDIT'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 25,
                        marginLeft: Dimensions.get('window').width < 768 ? 0 : 20,
                        borderRadius: 15
                    }}
                    onPress={() => handleDelete(false)}
                    disabled={isDeletingEvents || isEditingEvents}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#2f2f3c',
                            fontSize: 11,
                            backgroundColor: '#f4f4f6',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 35,
                            width: 200,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}
                    >
                        {isDeletingEvents ? 'DELETING...' : 'DELETE'}
                    </Text>
                </TouchableOpacity>

                {recurringId && recurringId !== '' ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 25,
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 20,
                            borderRadius: 15
                        }}
                        onPress={() => handleDelete(true)}
                        disabled={isDeletingEvents || isEditingEvents}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#2f2f3c',
                                fontSize: 11,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 200,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            {isDeletingEvents ? 'DELETING...' : 'DELETE ALL'}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    useEffect(() => {
        loadEvents();
        loadChannels();
    }, []);

    const loadItemsForMonth = (month: any) => {
        const itemsWithEmptyDates: { [label: string]: any } = {};
        for (let i = -90; i < 90; i++) {
            const time = month.timestamp + i * 24 * 60 * 60 * 1000;
            const strTime = timeToString(time);

            if (!items[strTime]) {
                itemsWithEmptyDates[strTime] = [];
            }
        }

        Object.keys(items).forEach(key => {
            itemsWithEmptyDates[key] = items[key];
        });

        // Selected date (current date) should never be empty, otherwise Calendar will keep loading
        const todayStr = timeToString(new Date());

        if (!itemsWithEmptyDates[todayStr]) {
            itemsWithEmptyDates[todayStr] = [];
        }

        setItems(itemsWithEmptyDates);
    };

    const timeToString = (time: any) => {
        const date = new Date(time);
        return date.toISOString().split('T')[0];
    };

    const renderItem = (item: any) => {
        const { title } = htmlStringParser(item.title);

        let colorCode = '#202025';

        const matchSubscription = props.subscriptions.find((sub: any) => {
            return sub.channelName === item.channelName;
        });

        if (matchSubscription && matchSubscription !== undefined) {
            colorCode = matchSubscription.colorCode;
        }

        const displayDate = datesEqual(item.start, item.end)
            ? moment(new Date(item.start)).format('h:mm a')
            : moment(new Date(item.start)).format('h:mm a') + ' to ' + moment(new Date(item.end)).format('h:mm a');

        return (
            <TouchableOpacity
                style={{
                    height: 80,
                    backgroundColor: 'white',
                    marginTop: 10,
                    marginBottom: 15,
                    marginRight: Dimensions.get('window').width > 768 ? 20 : 10,
                    padding: 10,
                    borderRadius: 15,
                    shadowOffset: {
                        width: 1,
                        height: 1
                    },
                    // overflow: 'hidden',
                    shadowOpacity: 0.03,
                    shadowRadius: 16,
                    zIndex: 50
                }}
                onPress={() => {
                    onSelectEvent(item);
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2 }}>
                    <View
                        style={{
                            width: 9,
                            height: 9,
                            borderRadius: 6,
                            // marginTop: 2,
                            marginRight: 5,
                            // paddingTop: 5,
                            backgroundColor: colorCode
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: 'inter',
                            fontSize: 15,
                            width: '100%'
                            // paddingTop: 5,
                            // color: colorCode,
                        }}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                </View>

                <Text style={{ color: 'black', marginTop: item.description !== '' ? 5 : 10 }}>{displayDate} </Text>

                <Text
                    style={{
                        paddingTop: 5,
                        color: '#a2a2ac'
                    }}
                    numberOfLines={1}
                >
                    {item.description}
                </Text>
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
                ? moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a')
                : moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a') +
                  ' to ' +
                  moment(new Date(event.end)).format('MMMM Do YYYY, h:mm a');

            const descriptionString = event.description ? event.description + '- ' + timeString : '' + timeString;

            if (user._id === event.createdBy && new Date(event.end) > new Date() && event.eventId) {
                setEditEvent(event);
                setShowAddEvent(true);
            } else if (user._id === event.createdBy && new Date(event.end) < new Date() && event.eventId) {
                // console.log("Delete prompt should come")
                Alert('Delete ' + event.title + '?', descriptionString, [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        }
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
                                        deleteAll: false
                                    }
                                })
                                .then(res => {
                                    if (res.data && res.data.date.deleteV1) {
                                        Alert('Event Deleted!');
                                        loadEvents();
                                    }
                                });
                        }
                    }
                ]);
            } else {
                const date = new Date();

                if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                    Alert(event.title, 'Enter classroom?', [
                        {
                            text: 'No',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            }
                        },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                const uString: any = await AsyncStorage.getItem('user');

                                const user = JSON.parse(uString);

                                const server = fetchAPI('');
                                server
                                    .mutate({
                                        mutation: meetingRequest,
                                        variables: {
                                            userId: user._id,
                                            channelId: event.channelId,
                                            isOwner: false
                                        }
                                    })
                                    .then(res => {
                                        if (res.data && res.data.channel.meetingRequest !== 'error') {
                                            server.mutate({
                                                mutation: markAttendance,
                                                variables: {
                                                    userId: user._id,
                                                    channelId: event.channelId
                                                }
                                            });
                                            Linking.openURL(res.data.channel.meetingRequest);
                                        } else {
                                            Alert('Classroom not in session. Waiting for instructor.');
                                        }
                                    })
                                    .catch(err => {
                                        Alert('Something went wrong.');
                                    });
                            }
                        }
                    ]);
                } else if (event.cueId !== '') {
                    props.openCueFromCalendar(event.channelId, event.cueId, event.createdBy);
                } else {
                    Alert(event.title, descriptionString);
                }
            }
        }
    };

    const windowHeight =
        Dimensions.get('window').width < 768 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;

    const yesterday = moment().subtract(1, 'day');
    const disablePastDt = (current: any) => {
        return current.isAfter(yesterday);
    };

    const width = Dimensions.get('window').width;

    const renderRecurringOptions = () => (
        <View style={{ flexDirection: width < 768 ? 'column' : 'row', backgroundColor: '#fff' }}>
            <View style={{ width: width < 768 ? '100%' : '33.33%', display: 'flex', backgroundColor: '#fff' }}>
                <View
                    style={{
                        width: '100%',
                        paddingTop: width < 768 ? 0 : 40,
                        backgroundColor: 'white'
                    }}
                >
                    <Text style={styles.text}>Recurring</Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        height: 40,
                        marginRight: 10
                    }}
                >
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: '#f4f4f6',
                            true: '#006AFF'
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>

            {recurring ? (
                <View style={{ width: width < 768 ? '100%' : '33.33%', display: 'flex' }}>
                    <View
                        style={{
                            width: '100%',
                            paddingTop: width < 768 ? 20 : 40,
                            paddingBottom: 15,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text style={styles.text}>Interval</Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: showFrequencyDropdown ? 300 : 50
                            // marginRight: 10
                        }}
                    >
                        <DropDownPicker
                            listMode="SCROLLVIEW"
                            open={showFrequencyDropdown}
                            value={frequency}
                            items={eventFrequencyOptions.map((item: any) => {
                                return {
                                    label: item.value === '' ? 'Once' : item.label,
                                    value: item.value
                                };
                            })}
                            setOpen={setShowFrequencyDropdown}
                            setValue={setFrequency}
                            zIndex={1000001}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#efefef'
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 4,
                                    height: 4
                                },
                                shadowOpacity: !showFrequencyDropdown ? 0 : 0.12,
                                shadowRadius: 12,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                        />
                    </View>
                </View>
            ) : null}

            {recurring && frequency === '1-W' ? (
                <View style={{ width: '100%', maxWidth: 400, display: 'flex' }}>
                    <View style={{ width: '100%', backgroundColor: 'white', paddingVertical: 15, marginTop: 20 }}>
                        <Text style={styles.text}>Occurs on</Text>
                        {
                            <View style={{ flexDirection: 'row', width: '100%', flexWrap: 'wrap', paddingTop: 10 }}>
                                {Object.keys(weekDays).map((day: any, ind: number) => {
                                    const label = weekDays[day];

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 10,
                                                padding: 5,
                                                marginBottom: 10
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
                        width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingTop: 12,
                        backgroundColor: '#fff',
                        marginLeft: 'auto',
                        zIndex: 100
                    }}
                >
                    <Text style={styles.text}>
                        End date
                        {/* {PreferredLanguageText("repeatTill")}{" "} */}
                        {Platform.OS === 'android'
                            ? ': ' + moment(new Date(repeatTill)).format('MMMM Do YYYY, h:mm a')
                            : null}
                    </Text>
                    <View
                        style={{
                            // width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            backgroundColor: '#fff',
                            // marginTop: 12,
                            marginLeft: 'auto'
                        }}
                    >
                        {renderRepeatTillDateTimePicker()}
                    </View>
                </View>
            ) : null}
        </View>
    );

    const renderMeetingOptions = () => {
        return channelId !== '' || editChannelName !== '' ? (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    marginTop: 40,
                    paddingBottom: 15,
                    backgroundColor: '#fff'
                }}
            >
                {!editEvent ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            width: '50%'
                        }}
                    >
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <Text style={styles.text}>Meeting</Text>
                        </View>

                        <View
                            style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10
                            }}
                        >
                            <Switch
                                value={isMeeting}
                                onValueChange={() => {
                                    setIsMeeting(!isMeeting);
                                }}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: '#f4f4f6',
                                    true: '#006AFF'
                                }}
                                disabled={editEvent}
                                activeThumbColor="white"
                            />
                        </View>
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
                    // height: windowHeight,
                    backgroundColor: 'white',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0
                }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                overScrollMode={'never'}
                nestedScrollEnabled={true}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        width: '100%',
                        height: '100%',
                        paddingHorizontal: 20,
                        borderTopRightRadius: 0,
                        borderTopLeftRadius: 0
                    }}
                >
                    <View
                        style={{
                            flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                            paddingTop: 20,
                            // paddingBottom: 40,
                            backgroundColor: 'white'
                        }}
                    >
                        <View
                            style={{
                                width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                backgroundColor: '#fff'
                            }}
                        >
                            <View style={{ width: '100%', maxWidth: 400 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                        color: '#000000',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Topic
                                </Text>
                                <TextInput
                                    value={title}
                                    placeholder={''}
                                    onChangeText={val => setTitle(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={true}
                                />
                            </View>
                        </View>
                        <View
                            style={{
                                width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                backgroundColor: '#fff',
                                marginLeft: Dimensions.get('window').width < 768 ? 0 : 50
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    fontWeight: 'bold'
                                }}
                            >
                                Description
                            </Text>
                            <TextInput
                                value={description}
                                // placeholder="Description"
                                onChangeText={val => setDescription(val)}
                                placeholderTextColor={'#a2a2ac'}
                                hasMultipleLines={true}
                            />
                        </View>
                    </View>
                    <View style={{ backgroundColor: '#fff', width: '100%', marginBottom: 30 }}>
                        <View
                            style={{
                                width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                paddingTop: 12,
                                backgroundColor: '#fff',
                                marginLeft: 'auto',
                                alignItems: 'center'
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
                                width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                backgroundColor: '#fff',
                                marginTop: 12,
                                marginLeft: 'auto',
                                alignItems: 'center'
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
                        {channels.length > 0 && !editEvent ? (
                            <View>
                                <View style={{ width: '100%', paddingBottom: 10, marginTop: 40 }}>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: 'inter',
                                            color: '#000000',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        For
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        display: 'flex',
                                        height: showChannelDropdown ? 260 : 50
                                    }}
                                >
                                    <DropDownPicker
                                        listMode="SCROLLVIEW"
                                        open={showChannelDropdown}
                                        value={selectedChannel}
                                        items={channelOptions}
                                        setOpen={setShowChannelDropdown}
                                        setValue={(val: any) => {
                                            setSelectedChannel(val);

                                            if (val === 'Home') {
                                                setChannelId('');
                                            } else {
                                                setChannelId(val);
                                            }
                                        }}
                                        zIndex={999999}
                                        style={{
                                            borderWidth: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#efefef'
                                        }}
                                        dropDownContainerStyle={{
                                            borderWidth: 0,
                                            zIndex: 999999
                                        }}
                                        containerStyle={{
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 4,
                                                height: 4
                                            },
                                            shadowOpacity: !showChannelDropdown ? 0 : 0.12,
                                            shadowRadius: 12,
                                            zIndex: 999999
                                        }}
                                    />
                                    {/* <Select
                          touchUi={true}
                          themeVariant="light"
                          value={selectedChannel}
                          onChange={(val: any) => {
                              setSelectedChannel(val.value);

                              if (val.value === 'Home') {
                                  setChannelId('');
                              } else {
                                  setChannelId(val.value);
                              }
                          }}
                          responsive={{
                              small: {
                                  display: 'bubble'
                              },
                              medium: {
                                  touchUi: false
                              }
                          }}
                          style={{
                              backgroundColor: '#efefef'
                          }}
                          data={channelOptions}
					  /> */}
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {editEvent && renderEditChannelName()}

                    {!editEvent && renderRecurringOptions()}
                    {renderMeetingOptions()}
                    {channelId !== '' && (
                        <Text
                            style={{
                                fontSize: 11,
                                color: '#000000',
                                // textTransform: 'uppercase',
                                lineHeight: 20,
                                fontFamily: 'Inter',
                                paddingBottom: 15
                            }}
                        >
                            Zoom meeting will be automatically created and attendances will be captured for online
                            meetings.
                        </Text>
                    )}
                    {!editEvent ? (
                        <View
                            style={{
                                width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                flexDirection: 'row',
                                backgroundColor: '#fff',
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: 150
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 15,
                                    borderRadius: 15,
                                    width: '100%',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginTop: 40
                                }}
                                onPress={() => handleCreate()}
                                disabled={isCreatingEvents}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        lineHeight: 35,
                                        color: 'white',
                                        overflow: 'hidden',
                                        fontSize: 11,
                                        backgroundColor: '#006AFF',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,

                                        width: 150,
                                        borderRadius: 15
                                    }}
                                >
                                    {isCreatingEvents ? 'ADDING...' : 'ADD'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    {editEvent ? renderEditEventOptions() : null}
                </View>
            </ScrollView>
        );
    };

    /**
     * @description Renders filter for Agenda
     */
    const renderFilterModalContent = () => {
        const filterChannelOptions = [
            { value: 'All', label: 'All' },
            { value: '', label: 'Home' }
        ];

        props.subscriptions.map((sub: any) => {
            filterChannelOptions.push({
                value: sub.channelName,
                label: sub.channelName
            });
        });

        const typeOptions = [
            { value: 'All', label: 'All' },
            { value: 'Meetings', label: 'Meetings' },
            { value: 'Submissions', label: 'Submissions' },
            { value: 'Events', label: 'Events' }
        ];

        return (
            <ScrollView
                style={{
                    width: '100%',
                    // height: windowHeight,
                    backgroundColor: 'white',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0
                }}
                contentContainerStyle={{
                    paddingHorizontal: 20
                }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                overScrollMode={'never'}
                nestedScrollEnabled={true}
            >
                <View style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold'
                        }}
                    >
                        Workspace
                    </Text>
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: showFilterByChannelDropdown ? 250 : 50,
                            marginTop: 10
                        }}
                    >
                        <DropDownPicker
                            listMode="SCROLLVIEW"
                            open={showFilterByChannelDropdown}
                            value={filterByChannel}
                            items={filterChannelOptions}
                            setOpen={setShowFilterByChannelDropdown}
                            setValue={setFilterByChannel}
                            zIndex={1000001}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#efefef'
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 4,
                                    height: 4
                                },
                                shadowOpacity: !showFilterByChannelDropdown ? 0 : 0.12,
                                shadowRadius: 12,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                        />
                    </View>
                </View>
                <View style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold'
                        }}
                    >
                        Type
                    </Text>

                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: showFilterTypeDropdown ? 230 : 50,
                            marginTop: 10
                            // marginRight: 10
                        }}
                    >
                        <DropDownPicker
                            listMode="SCROLLVIEW"
                            open={showFilterTypeDropdown}
                            value={filterEventsType}
                            items={typeOptions}
                            setOpen={setShowFilterTypeDropdown}
                            setValue={setFilterEventsType}
                            zIndex={1000001}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#efefef'
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 4,
                                    height: 4
                                },
                                shadowOpacity: !showFilterTypeDropdown ? 0 : 0.12,
                                shadowRadius: 12,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                        />
                    </View>
                </View>
                <View style={{ backgroundColor: '#fff', width: '100%' }}>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            // paddingTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: 'auto',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={styles.text}>
                            Start
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(filterStart)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        {renderFilterStartDateTimePicker()}
                    </View>
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            backgroundColor: '#fff',
                            marginTop: 12,
                            marginLeft: 'auto',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={styles.text}>
                            End
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(filterEnd)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        {renderFilterEndDateTimePicker()}
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <Animated.View
            style={{
                opacity: modalAnimation,
                width: '100%',
                // height: windowHeight,
                height: windowHeight - 35,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    // justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    paddingBottom: 15
                }}
            >
                <TouchableOpacity
                    style={{
                        // backgroundColor: activeTab === 'agenda' ? '#000' : '#fff',
                        paddingVertical: 6,
                        marginHorizontal: 12,
                        borderBottomColor: '#006aff',
                        borderBottomWidth: activeTab === 'agenda' ? 3 : 0
                    }}
                    onPress={() => setActiveTab('agenda')}
                >
                    <Text
                        style={{
                            color: activeTab === 'agenda' ? '#006aff' : '#656565',
                            fontFamily: 'Inter',
                            fontWeight: 'bold',
                            fontSize: Dimensions.get('window').width < 768 ? 20 : 30
                        }}
                    >
                        To do
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        // backgroundColor: activeTab === 'activity' ? '#000' : '#fff',
                        paddingVertical: 6,
                        marginHorizontal: 12,
                        borderBottomColor: '#006aff',
                        borderBottomWidth: activeTab === 'activity' ? 3 : 0
                    }}
                    onPress={() => setActiveTab('activity')}
                >
                    <Text
                        style={{
                            color: activeTab === 'activity' ? '#006aff' : '#656565',
                            fontFamily: 'Inter',
                            fontWeight: 'bold',
                            fontSize: Dimensions.get('window').width < 768 ? 20 : 30
                        }}
                    >
                        Activity
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        // position: 'absolute',
                        marginTop: 7,
                        marginLeft: 'auto'
                    }}
                    onPress={() => setShowFilterModal(!showFilterModal)}
                >
                    <Ionicons name={showFilterModal ? 'close-outline' : 'filter-outline'} size={22} color="black" />
                </TouchableOpacity>
            </View>
            <View
                style={{ flex: 1, marginBottom: Dimensions.get('window').width < 1024 ? 12 : 0 }}
                key={activeTab.toString()}
            >
                {activeTab === 'agenda' ? (
                    loadingEvents ? (
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : (
                        <Agenda
                            showClosingKnob={true}
                            items={items}
                            loadItemsForMonth={loadItemsForMonth}
                            selected={new Date().toISOString().split('T')[0]}
                            renderItem={renderItem}
                            rowHasChanged={rowHasChanged}
                            pastScrollRange={12}
                            futureScrollRange={12}
                            theme={{
                                agendaKnobColor: '#F4F4F6', // knob color
                                agendaTodayColor: '#006AFF', // today in list
                                todayTextColor: '#006AFF',
                                selectedDayBackgroundColor: '#006AFF', // calendar sel date
                                dotColor: '#006AFF' // dots
                            }}
                            onDayPress={onUpdateSelectedDate}
                        />
                    )
                ) : (
                    renderActivity()
                )}
            </View>

            <BottomSheet
                snapPoints={[0, windowHeight - 35]}
                close={() => {
                    setEditEvent(null);
                    setShowAddEvent(false);
                }}
                isOpen={showAddEvent}
                title={'Create an event'}
                renderContent={() => renderEventModalContent()}
                header={true}
            />

            <BottomSheet
                snapPoints={[0, '55%']}
                close={() => {
                    setShowFilterModal(false);
                }}
                isOpen={showFilterModal}
                title={'Filter'}
                renderContent={() => renderFilterModalContent()}
                header={false}
            />

            {activeTab === 'agenda' ? (
                <TouchableOpacity
                    onPress={() => {
                        setShowAddEvent(true);
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
                        width: 58,
                        height: 58,
                        borderRadius: 29,
                        backgroundColor: '#006aff',
                        borderColor: '#efefef',
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
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        <Ionicons name="add-outline" size={35} />
                    </Text>
                </TouchableOpacity>
            ) : null}

            {activeTab === 'activity' ? (
                <TouchableOpacity
                    onPress={() => {
                        setShowAddEvent(true);
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
                        backgroundColor: '#006aff',
                        borderColor: '#efefef',
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
            ) : null}
        </Animated.View>
    );
};

export default React.memo(CalendarX, (prev, next) => {
    return _.isEqual(
        {
            ...prev.tab,
            ...prev.cues
        },
        {
            ...next.tab,
            ...prev.cues
        }
    );
});

const styles: any = StyleSheet.create({
    eventTitle: {
        fontFamily: 'inter',
        fontSize: 14,
        // ,
        height: '44%',
        width: '100%',
        paddingTop: 5,
        color: '#2f2f3c'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 10,
        fontFamily: 'Inter',
        fontWeight: 'bold'
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10,
        marginLeft: 10
    },
    allBlack: {
        fontSize: 11,
        color: '#2f2f3c',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 11,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#2f2f3c'
    }
});
