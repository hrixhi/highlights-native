// REACT
import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    TextInput,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';

// GRAPHQL
import { fetchAPI } from '../graphql/FetchAPI';
import { getAttendancesForChannel, getPastDates, modifyAttendance } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text } from './Themed';
import moment from 'moment';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Alert from './Alert';
import { paddingResponsive } from '../helpers/paddingHelper';
// import { Datepicker } from '@mobiscroll/react';

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [fixedPastMeetings, setFixedPastMeetings] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [allChannelAttendances, setAllChannelAttendances] = useState<any[]>([]);
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [loadingAttendances, setLoadingAttendances] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [end, setEnd] = useState<any>(null);
    const [start, setStart] = useState<any>(null);
    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [userId, setUserId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // HOOKS

    // Title, Attendance
    const [sortByOption, setSortByOption] = useState('Date');

    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    useEffect(() => {
        if (sortByOption === 'Title') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? 1 : -1;
                } else if (a.title > b.title) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        } else if (sortByOption === 'Attendance') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                const attendanceObjectA = channelAttendances[0].attendances.find((s: any) => {
                    return s.dateId.toString().trim() === a.dateId.toString().trim();
                });

                const attendanceObjectB = channelAttendances[0].attendances.find((s: any) => {
                    return s.dateId.toString().trim() === b.dateId.toString().trim();
                });

                if (attendanceObjectA && !attendanceObjectB) {
                    return sortByOrder ? -1 : 1;
                } else if (!attendanceObjectA && attendanceObjectB) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        } else if (sortByOption === 'Date') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                const aDate = new Date(a.start);
                const bDate = new Date(b.start);

                if (aDate < bDate) {
                    return sortByOrder ? -1 : 1;
                } else if (aDate > bDate) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        }
    }, [sortByOption, sortByOrder, fixedPastMeetings, channelAttendances]);

    /**
     * @description Load data on init
     */
    useEffect(() => {
        loadChannelAttendances();
        setPastMeetings([]);
        loadPastSchedule();
    }, [props.channelId]);

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (studentSearch === '') {
            setChannelAttendances(allChannelAttendances);
        } else {
            const allAttendances = [...allChannelAttendances];

            const matches = allAttendances.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setChannelAttendances(matches);
        }
    }, [studentSearch]);

    /**
     * @description Set if user is owner
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                if (user._id.toString().trim() === props.channelCreatedBy) {
                    setIsOwner(true);
                }
                setUserId(user._id);
            }
        })();
    }, [props.channelCreatedBy, props.channelId]);

    /**
     * @description Create Structure for exporting attendance data in Spreadsheet
     */
    useEffect(() => {
        if (allChannelAttendances.length === 0 || pastMeetings.length === 0) {
            return;
        }

        // Calculate total for each student and add it to the end
        const studentTotalMap: any = {};

        allChannelAttendances.forEach((att) => {
            let count = 0;
            pastMeetings.forEach((meeting) => {
                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                });

                if (attendanceObject) count++;
            });

            studentTotalMap[att.userId] = count;
        });

        setAttendanceTotalMap(studentTotalMap);

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [''];

        pastMeetings.forEach((meeting) => {
            row1.push(moment(new Date(meeting.start)).format('MMMM Do, h:mm a'));
        });

        row1.push('Total');

        exportAoa.push(row1);

        allChannelAttendances.forEach((att) => {
            let userRow = [];

            userRow.push(att.fullName);

            pastMeetings.forEach((meeting) => {
                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                });

                if (attendanceObject) {
                    userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMMM Do, h:mm a')}`);
                } else {
                    userRow.push('-');
                }
            });

            userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`);

            exportAoa.push(userRow);
        });

        setExportAoa(exportAoa);
    }, [allChannelAttendances, pastMeetings]);

    /**
     * @description Filter meetings with start and end
     */
    useEffect(() => {
        if (start && end) {
            const filteredPastMeetings = fixedPastMeetings.filter((meeting) => {
                return new Date(meeting.start) > start && new Date(meeting.end) < end;
            });

            setPastMeetings(filteredPastMeetings);
        } else {
            setPastMeetings(fixedPastMeetings);
        }
    }, [start, end]);

    /**
     * @description API call to fetch user attendances
     */
    const loadChannelAttendances = useCallback(() => {
        setLoadingAttendances(true);
        const server = fetchAPI('');
        server
            .query({
                query: getAttendancesForChannel,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then(async (res) => {
                if (res.data && res.data.attendance.getAttendancesForChannel) {
                    const u = await AsyncStorage.getItem('user');
                    if (u) {
                        const user = JSON.parse(u);
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            // all attendances
                            setAllChannelAttendances(res.data.attendance.getAttendancesForChannel);
                            setChannelAttendances(res.data.attendance.getAttendancesForChannel);
                        } else {
                            // only user's attendances
                            const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
                                return u.userId.toString().trim() === user._id.toString().trim();
                            });
                            const userAttendances = [{ ...attendances }];
                            setAllChannelAttendances(userAttendances);
                            setChannelAttendances(userAttendances);
                        }
                        setLoadingAttendances(false);
                    }
                }
            })
            .catch((e: any) => {
                setLoadingAttendances(false);
            });
    }, [props.channelId]);

    /**
     * @description API call to fetch past meetings
     */
    const loadPastSchedule = useCallback(() => {
        setLoadingMeetings(true);
        const server = fetchAPI('');
        server
            .query({
                query: getPastDates,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data && res.data.attendance.getPastDates) {
                    setFixedPastMeetings(res.data.attendance.getPastDates);
                    setPastMeetings(res.data.attendance.getPastDates);
                }
                setLoadingMeetings(false);
            })
            .catch((e: any) => {
                setLoadingMeetings(false);
            });
    }, [props.channelId]);

    // FUNCTIONS

    /**
     * @description Mark as present/absent
     */
    const onChangeAttendance = (dateId: String, userId: String, markPresent: Boolean) => {
        Alert(markPresent ? 'Mark Present?' : 'Mark Absent?', '', [
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
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: modifyAttendance,
                            variables: {
                                dateId,
                                userId,
                                channelId: props.channelId,
                                markPresent,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.attendance.modifyAttendance) {
                                loadChannelAttendances();
                            }
                        });
                },
            },
        ]);
    };

    /**
     * @description Export attendance data into spreadsheet
     */
    const exportAttendance = async () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance ');
        /* generate XLSX file and send to client */
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        const uri = FileSystem.cacheDirectory + 'attendance.xlsx';
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'MyWater data',
            UTI: 'com.microsoft.excel.xlsx',
        });
    };

    const renderViewerAttendanceList = () => {
        const studentCount = attendanceTotalMap[userId];
        const userAttendance = channelAttendances.find((att: any) => {
            return att.userId === userId;
        });

        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    paddingTop: 10,
                    // maxHeight: 450,
                    borderRadius: 1,
                    zIndex: 5000000,
                }}
                key={JSON.stringify(allChannelAttendances)}
            >
                <ScrollView horizontal={false} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                    {/* Row 1 with total */}
                    <View
                        style={{
                            minHeight: 70,
                            flexDirection: 'row',
                            overflow: 'hidden',
                            paddingBottom: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f2f2f2',
                            alignItems: 'center',
                        }}
                        key={'-'}
                    >
                        <View
                            style={{
                                width: '50%',
                                borderBottomColor: '#f2f2f2',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: '#000000',
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                }}
                            >
                                Total
                            </Text>
                        </View>
                        <View
                            style={{
                                width: '50%',
                                borderBottomColor: '#f2f2f2',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: '#000000',
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                }}
                            >
                                {studentCount} / {pastMeetings.length}
                            </Text>
                        </View>
                    </View>
                    {/* Render all channel attendances */}
                    {pastMeetings.map((meeting: any, col: number) => {
                        const { start, end } = meeting;

                        const attendanceObject = userAttendance.attendances.find((s: any) => {
                            return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                        });

                        return (
                            <View
                                style={{
                                    minHeight: 70,
                                    flexDirection: 'row',
                                    overflow: 'hidden',
                                    // paddingBottom: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f2f2f2',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                                key={'-'}
                            >
                                <View style={{ width: '50%', alignContent: 'center', justifyContent: 'center' }}>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 12,
                                            color: '#000000',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {moment(new Date(start)).format('MMMM Do')}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 12,
                                            color: '#000000',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {moment(new Date(start)).format('h:mm')} -{' '}
                                        {moment(new Date(end)).format('h:mm')}
                                    </Text>
                                </View>
                                <View style={{ width: '50%', alignContent: 'center', justifyContent: 'center' }}>
                                    <View style={{}}>
                                        <View
                                            style={{
                                                marginBottom: 5,
                                                width: '100%',
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text>
                                                {attendanceObject ? (
                                                    <Ionicons name="checkmark-outline" size={15} color={'#000'} />
                                                ) : (
                                                    '-'
                                                )}
                                            </Text>
                                        </View>
                                        {attendanceObject ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                    width: '100%',
                                                }}
                                            >
                                                {attendanceObject.joinedAt
                                                    ? moment(new Date(attendanceObject.joinedAt)).format('h:mm a')
                                                    : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderStudentsMeetingsList = () => {
        return (
            <View
                style={{
                    width: '100%',
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomColor: '#f2f2f2',
                        borderBottomWidth: 1,
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Title') {
                                    setSortByOption('Title');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Title
                            </Text>
                            {sortByOption === 'Title' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Date') {
                                    setSortByOption('Date');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Date
                            </Text>
                            {sortByOption === 'Date' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Attendance') {
                                    setSortByOption('Attendance');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Attendance
                            </Text>
                            {sortByOption === 'Attendance' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView
                    horizontal={false}
                    style={{
                        width: '100%',
                        maxHeight: 350,
                    }}
                    contentContainerStyle={{
                        flexDirection: 'column',

                        borderTopWidth: 0,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                    }}
                >
                    {pastMeetings.map((meeting: any, ind: number) => {
                        const attendanceObject = channelAttendances[0].attendances.find((s: any) => {
                            return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                        });

                        console.log('Meeting', meeting);

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === pastMeetings.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === pastMeetings.length - 1 ? 8 : 0,
                                    borderTopColor: '#f2f2f2',
                                    borderTopWidth: ind === 0 ? 0 : 1,
                                }}
                            >
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {meeting.title}
                                    </Text>
                                    {meeting.recordingLink ? (
                                        <TouchableOpacity
                                            style={{
                                                paddingTop: 10,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                Linking.openURL(meeting.recordingLink);
                                            }}
                                        >
                                            <Ionicons name="videocam-outline" color={'#000'} size={15} />
                                            <Text
                                                style={{
                                                    paddingLeft: 4,
                                                    color: '#000',
                                                    fontSize: 12,
                                                }}
                                            >
                                                Recording
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {moment(new Date(meeting.start)).format('MMM Do YYYY')}{' '}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            paddingTop: 10,
                                        }}
                                    >
                                        {moment(new Date(meeting.start)).format('h:mma')} -{' '}
                                        {moment(new Date(meeting.end)).format('h:mma')}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text>
                                            {attendanceObject ? (
                                                <Ionicons name="checkmark-outline" size={15} color={'#000'} />
                                            ) : (
                                                '-'
                                            )}
                                        </Text>

                                        {attendanceObject ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    width: '100%',
                                                }}
                                            >
                                                {attendanceObject.joinedAt
                                                    ? moment(new Date(attendanceObject.joinedAt)).format('h:mm a')
                                                    : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderOwnerAttendanceList = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    paddingTop: 10,
                    maxHeight: 450,
                    borderRadius: 1,
                    zIndex: 5000000,
                }}
                key={JSON.stringify(allChannelAttendances)}
            >
                <ScrollView
                    showsHorizontalScrollIndicator={true}
                    horizontal={true}
                    contentContainerStyle={{
                        // height: '100%',
                        // maxHeight: 450,
                        flexDirection: 'column',
                    }}
                    nestedScrollEnabled={true}
                >
                    <View>
                        <View
                            style={{
                                minHeight: 70,
                                flexDirection: 'row',
                                overflow: 'hidden',
                                paddingBottom: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                            }}
                            key={'-'}
                        >
                            {isOwner ? (
                                <View style={styles.col} key={'0,0'}>
                                    <TextInput
                                        value={studentSearch}
                                        onChangeText={(val: string) => setStudentSearch(val)}
                                        placeholder={'Search'}
                                        placeholderTextColor={'#1F1F1F'}
                                        style={{
                                            width: '100%',
                                            borderColor: '#f2f2f2',
                                            borderBottomWidth: 1,
                                            fontSize: 15,
                                            paddingVertical: 8,
                                            marginTop: 0,
                                            paddingHorizontal: 10,
                                        }}
                                    />
                                </View>
                            ) : null}
                            <View style={styles.col} key={'1,1'}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: '#000000',
                                        fontFamily: 'inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    Total
                                </Text>
                            </View>
                            {pastMeetings.map((meeting: any, col: number) => {
                                const { title, start, end } = meeting;
                                return (
                                    <View style={styles.col} key={col.toString()}>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 13,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                            }}
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: '#000000',
                                                marginBottom: 5,
                                            }}
                                        >
                                            {moment(new Date(start)).format('MMMM Do')}
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: '#000000',
                                                marginBottom: 5,
                                            }}
                                        >
                                            {moment(new Date(start)).format('h:mm')} -{' '}
                                            {moment(new Date(end)).format('h:mm')}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Search results empty */}
                    {channelAttendances.length === 0 ? (
                        <View>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 20,
                                    paddingVertical: 50,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                }}
                            >
                                No Students.
                            </Text>
                        </View>
                    ) : null}

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={
                            {
                                // height: '100%'
                            }
                        }
                        nestedScrollEnabled={true}
                    >
                        {channelAttendances.map((channelAttendance: any, row: number) => {
                            const studentCount = attendanceTotalMap[channelAttendance.userId];

                            return (
                                <View style={styles.row} key={row}>
                                    {isOwner ? (
                                        <View style={styles.col}>
                                            <Image
                                                style={{
                                                    height: 37,
                                                    width: 37,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                    marginBottom: 7,
                                                }}
                                                source={{
                                                    uri: channelAttendance.avatar
                                                        ? channelAttendance.avatar
                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 13,
                                                    color: '#000000',
                                                    fontFamily: 'inter',
                                                }}
                                            >
                                                {channelAttendance.fullName}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View style={styles.col}>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 13,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                            }}
                                        >
                                            {studentCount} / {pastMeetings.length}
                                        </Text>
                                    </View>
                                    {pastMeetings.map((meeting: any, col: number) => {
                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                                        });
                                        return (
                                            <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                <TouchableOpacity
                                                    disabled={!isOwner}
                                                    onPress={() =>
                                                        onChangeAttendance(
                                                            meeting.dateId,
                                                            channelAttendance.userId,
                                                            attendanceObject ? false : true
                                                        )
                                                    }
                                                    style={{
                                                        marginBottom: 5,
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text>
                                                        {attendanceObject ? (
                                                            <Ionicons
                                                                name="checkmark-outline"
                                                                size={15}
                                                                color={'#000'}
                                                            />
                                                        ) : isOwner ? (
                                                            <Ionicons
                                                                name="checkmark-outline"
                                                                size={15}
                                                                color={'#e0e0e0'}
                                                            />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </Text>
                                                </TouchableOpacity>
                                                {attendanceObject ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 12,
                                                            color: '#000000',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        {attendanceObject.joinedAt
                                                            ? moment(new Date(attendanceObject.joinedAt)).format(
                                                                  'h:mm a'
                                                              )
                                                            : ''}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </ScrollView>
                </ScrollView>
            </View>
        );
    };

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
            }}
        >
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                }}
            >
                {allChannelAttendances.length === 0 || fixedPastMeetings.length === 0 ? null : (
                    <Text
                        style={{
                            color: '#1f1f1f',
                            fontSize: 18,
                            fontFamily: 'inter',
                            // paddingLeft: 20,
                        }}
                    >
                        Attendance
                    </Text>
                )}
                {pastMeetings.length === 0 || allChannelAttendances.length === 0 || !isOwner ? null : (
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#fff',
                            overflow: 'hidden',
                            // height: 35,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            marginLeft: 'auto',
                        }}
                        onPress={() => {
                            exportAttendance();
                        }}
                    >
                        <Ionicons
                            name="download-outline"
                            size={Dimensions.get('window').width < 800 ? 23 : 26}
                            color="#000"
                        />
                    </TouchableOpacity>
                )}
            </View>
            <View
                style={{
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    paddingBottom: 20,
                    width: '100%',
                    justifyContent: 'flex-end',
                }}
            >
                {allChannelAttendances.length === 0 || fixedPastMeetings.length === 0 ? null : (
                    <View style={{ backgroundColor: '#fff' }}>
                        <View
                            style={{
                                display: 'flex',
                                width: '100%',
                                flexDirection: 'row',
                                backgroundColor: '#fff',
                                alignItems: 'center',
                                borderBottomColor: '#d9dcdf',
                                borderBottomWidth: 1,
                            }}
                        >
                            {/* <Datepicker
                                themeVariant="light"
                                controls={['calendar']}
                                select="range"
                                touchUi={true}
                                inputProps={{
                                    placeholder: 'Filter'
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                value={[start, end]}
                                onChange={(val: any) => {
                                    setStart(val.value[0]);
                                    setEnd(val.value[1]);
                                }}
                            /> */}
                        </View>
                    </View>
                )}
                {/* <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }} /> */}
            </View>

            {allChannelAttendances.length === 0 ||
            pastMeetings.length === 0 ||
            loadingAttendances ||
            loadingMeetings ? (
                loadingAttendances || loadingMeetings ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0,
                            paddingVertical: 100,
                        }}
                    >
                        {/* <ActivityIndicator color={'#1F1F1F'} /> */}
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 18,
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                            }}
                        >
                            {pastMeetings.length === 0
                                ? isOwner
                                    ? 'Past meetings and attendances will be displayed here.'
                                    : 'Past meetings & attendances will be displayed here.'
                                : 'No Students.'}
                        </Text>
                    </View>
                )
            ) : isOwner ? (
                renderOwnerAttendanceList()
            ) : (
                renderStudentsMeetingsList()
            )}
        </View>
    );
};

export default AttendanceList;

const styles = StyleSheet.create({
    row: {
        minHeight: 70,
        flexDirection: 'row',
        overflow: 'hidden',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
    },
    col: {
        width: Dimensions.get('window').width < 768 ? 90 : 120,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: 7,
    },
});
