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
    Switch,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';

// GRAPHQL
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getAttendancesForChannel,
    getPastDates,
    modifyAttendance,
    getCourseStudents,
    getAttendanceBook,
    getAttendanceBookStudent,
    handleUpdateAttendanceBookEntry,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text } from './Themed';
import moment from 'moment';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Alert from './Alert';
import { paddingResponsive } from '../helpers/paddingHelper';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import DropDownPicker from 'react-native-dropdown-picker';
import { disableEmailId } from '../constants/zoomCredentials';
import { PreferredLanguageText } from '../helpers/LanguageContext';
// import { Datepicker } from '@mobiscroll/react';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import NewAttendanceModal from './NewAttendanceModal';

const attendanceTypeOptions = [
    {
        value: 'present',
        label: 'Present',
    },
    {
        value: 'absent',
        label: 'Absent',
    },
];

const attendanceTypeLabels = {
    present: 'Present',
    absent: 'Absent',
};

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [fixedPastMeetings, setFixedPastMeetings] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [allChannelAttendances, setAllChannelAttendances] = useState<any[]>([]);
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [userId, setUserId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
    const [editMeetingTopic, setEditMeetingTopic] = useState('');
    const [editMeetingRecordingLink, setEditMeetingRecordingLink] = useState('');
    const [editMeeting, setEditMeeting] = useState<any>({});
    const [updatingPastMeeting, setUpdatingPastMeeting] = useState(false);

    const [editEntryId, setEditEntryId] = useState('');
    const [editEntryType, setEditEntryType] = useState('');
    const [editAttendance, setEditAttendance] = useState(undefined);

    //
    const [instructorAttendanceBook, setInstructorAttendanceBook] = useState<any>(undefined);
    const [attendanceBookEntries, setAttendanceBookEntries] = useState([]);
    const [attendanceBookUsers, setAttendanceBookUsers] = useState<any[]>([]);
    const [isFetchingAttendanceBook, setIsFetchingAttendanceBook] = useState(false);

    const [studentAttendanceBook, setStudentAttendanceBook] = useState<any>(undefined);
    const [studentAttendanceBookEntries, setStudentAttendanceBookEntries] = useState([]);
    const [isFetchingStudentAttendanceBook, setIsFetchingStudentAttendanceBook] = useState(false);

    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [courseStudents, setCourseStudents] = useState<any[]>([]);
    const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);
    const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);

    // Edit ID
    const [activeModifyId, setActiveModifyId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeModifyEntryType, setActiveModifyEntryType] = useState('');
    const [attendanceEntry, setAttendanceEntry] = useState<any>(undefined);

    const [attendanceBookUsersDropdownOptions, setAttendanceBookUsersDropdownOptions] = useState<any[]>([]);
    const [attendanceBookAnalyticsSelectedUser, setAttendanceBookAnalyticsSelectedUser] = useState(undefined);

    const [isAttendanceAnalyticsDropdownOpen, setIsAttendanceAnalyticsDropdownOpen] = useState(false);

    // HOOKS

    // Title, Attendance
    const [sortByOption, setSortByOption] = useState('Date');

    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    useEffect(() => {
        if (sortByOption === 'Title') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? 1 : -1;
                } else if (a.title > b.title) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setStudentAttendanceBookEntries(sortEntries);
        } else if (sortByOption === 'Attendance') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
                if (a.attendanceType === 'present' && b.attendanceType === 'absent') {
                    return sortByOrder ? -1 : 1;
                } else if (a.attendanceType === 'absent' && b.attendanceType === 'present') {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStudentAttendanceBookEntries(sortEntries);
        } else if (sortByOption === 'Date') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
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

            setStudentAttendanceBookEntries(sortEntries);
        }
    }, [sortByOption, sortByOrder]);

    // HOOKS

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (!instructorAttendanceBook || !instructorAttendanceBook.users) {
            return;
        }

        if (studentSearch === '') {
            setAttendanceBookUsers([...instructorAttendanceBook.users]);
        } else {
            const allStudents = [...instructorAttendanceBook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setAttendanceBookUsers(matches);
        }
    }, [studentSearch, instructorAttendanceBook]);

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            fetchAttendancebookInstructor();
        } else {
            fetchAttendancebookStudent();
        }
    }, [props.isOwner, props.channelId]);

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            loadCourseStudents();
        }
    }, [props.isOwner, props.channelId]);

    const updateAttendanceBookEntry = useCallback(() => {
        const server = fetchAPI('');

        console.log('Variables', {
            userId: activeUserId,
            entryId: activeModifyId,
            attendanceEntry: activeModifyEntryType === 'meeting' ? false : true,
            attendanceType: attendanceEntry.attendanceType,
            late: attendanceEntry.late,
            excused: attendanceEntry.excused,
            channelId: props.channelId,
        });

        server
            .mutate({
                mutation: handleUpdateAttendanceBookEntry,
                variables: {
                    userId: activeUserId,
                    entryId: activeModifyId,
                    attendanceEntry: activeModifyEntryType === 'meeting' ? false : true,
                    attendanceType: attendanceEntry.attendanceType,
                    late: attendanceEntry.late,
                    excused: attendanceEntry.excused,
                    channelId: props.channelId,
                },
            })
            .then((res: any) => {
                console.log('Res', res);
                if (res.data && res.data.attendance.handleUpdateAttendanceBookEntry) {
                    Alert('Attendance Entry updated successfully.');
                    //
                    setActiveUserId('');
                    setActiveModifyId('');
                    setActiveModifyEntryType('');
                    setAttendanceEntry(undefined);
                    //
                    fetchAttendancebookInstructor();
                } else {
                    Alert('Failed to update Attendance Entry.');
                    //
                }
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to update Attendance Entry.');
            });
    }, [props.channelId, activeUserId, activeModifyId, activeModifyEntryType, attendanceEntry]);

    /**
     * @description Fetch all course students for creating new assignment and assigning scores
     */
    const loadCourseStudents = useCallback(() => {
        setIsFetchingStudents(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getCourseStudents,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getCourseStudents) {
                        setCourseStudents(res.data.channel.getCourseStudents);
                    } else {
                        setCourseStudents([]);
                    }
                    setIsFetchingStudents(false);
                })
                .catch((e) => {
                    console.log('Error', e);
                    Alert('Failed to fetch students.');
                    setIsFetchingStudents(false);
                });
        }
    }, [props.channelId]);

    const fetchAttendancebookInstructor = useCallback(() => {
        setIsFetchingAttendanceBook(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getAttendanceBook,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.attendance && res.data.attendance.getAttendanceBook) {
                        setInstructorAttendanceBook(res.data.attendance.getAttendanceBook);
                        setAttendanceBookEntries(res.data.attendance.getAttendanceBook.entries);
                        setAttendanceBookUsers(res.data.attendance.getAttendanceBook.users);

                        if (res.data.attendance.getAttendanceBook.users.length > 0) {
                            console.log('selected user ', res.data.attendance.getAttendanceBook.users[0].userId);

                            const userDropdowns: any[] = res.data.attendance.getAttendanceBook.users.map(
                                (user: any) => {
                                    return {
                                        value: user.userId,
                                        label: user.fullName,
                                    };
                                }
                            );
                            setAttendanceBookUsersDropdownOptions(userDropdowns);
                            setAttendanceBookAnalyticsSelectedUser(
                                res.data.attendance.getAttendanceBook.users[0].userId
                            );
                        }
                    } else {
                        setInstructorAttendanceBook(undefined);
                        setAttendanceBookEntries([]);
                        setAttendanceBookUsers([]);
                    }
                    setIsFetchingAttendanceBook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch attendance.');
                    setInstructorAttendanceBook(undefined);
                    setAttendanceBookEntries([]);
                    setAttendanceBookUsers([]);
                    setIsFetchingAttendanceBook(false);
                });
        }
    }, []);

    const fetchAttendancebookStudent = useCallback(() => {
        setIsFetchingStudentAttendanceBook(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getAttendanceBookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId: props.user._id,
                    },
                })
                .then((res) => {
                    if (res.data.attendance && res.data.attendance.getAttendanceBookStudent) {
                        setStudentAttendanceBook(res.data.attendance.getAttendanceBookStudent);
                        setStudentAttendanceBookEntries(res.data.attendance.getAttendanceBookStudent.entries);
                    } else {
                        setStudentAttendanceBook(undefined);
                        setStudentAttendanceBookEntries([]);
                    }
                    setIsFetchingStudentAttendanceBook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch attendance book.');
                    setStudentAttendanceBook(undefined);
                    setStudentAttendanceBookEntries([]);
                    setIsFetchingStudentAttendanceBook(false);
                });
        }
    }, []);

    const handleEditAttendanceBookEntry = useCallback(
        (attendanceBookEntryId: string) => {
            const { entries, users } = instructorAttendanceBook;

            const findEntry = entries.find(
                (entry: any) =>
                    entry.attendanceEntryId === attendanceBookEntryId || entry.dateId === attendanceBookEntryId
            );

            const { attendances } = findEntry;

            const attendanceBookEntries: any[] = [];

            users.map((user: any) => {
                const findAttendance = attendances.find((x: any) => x.userId === user.userId);

                attendanceBookEntries.push({
                    _id: user.userId,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    attendanceType: findAttendance.attendanceType,
                    late: findAttendance.late,
                    excused: findAttendance.excused,
                });
            });

            setEditEntryId(attendanceBookEntryId);
            setEditEntryType(findEntry.dateId ? 'meeting' : 'entry');
            setEditAttendance(findEntry);
            props.setShowNewAttendance(true);
        },
        [instructorAttendanceBook]
    );

    // useEffect(() => {
    //     if (sortByOption === 'Title') {
    //         const sortMeetings = [...fixedPastMeetings];

    //         sortMeetings.sort((a: any, b: any) => {
    //             if (a.title < b.title) {
    //                 return sortByOrder ? 1 : -1;
    //             } else if (a.title > b.title) {
    //                 return sortByOrder ? -1 : 1;
    //             } else {
    //                 return 0;
    //             }
    //         });

    //         setPastMeetings(sortMeetings);
    //     } else if (sortByOption === 'Attendance') {
    //         const sortMeetings = [...fixedPastMeetings];

    //         sortMeetings.sort((a: any, b: any) => {
    //             const attendanceObjectA = channelAttendances[0].attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === a.dateId.toString().trim();
    //             });

    //             const attendanceObjectB = channelAttendances[0].attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === b.dateId.toString().trim();
    //             });

    //             if (attendanceObjectA && !attendanceObjectB) {
    //                 return sortByOrder ? -1 : 1;
    //             } else if (!attendanceObjectA && attendanceObjectB) {
    //                 return sortByOrder ? 1 : -1;
    //             } else {
    //                 return 0;
    //             }
    //         });

    //         setPastMeetings(sortMeetings);
    //     } else if (sortByOption === 'Date') {
    //         const sortMeetings = [...fixedPastMeetings];

    //         sortMeetings.sort((a: any, b: any) => {
    //             const aDate = new Date(a.start);
    //             const bDate = new Date(b.start);

    //             if (aDate < bDate) {
    //                 return sortByOrder ? -1 : 1;
    //             } else if (aDate > bDate) {
    //                 return sortByOrder ? 1 : -1;
    //             } else {
    //                 return 0;
    //             }
    //         });

    //         setPastMeetings(sortMeetings);
    //     }
    // }, [sortByOption, sortByOrder, fixedPastMeetings, channelAttendances]);

    // /**
    //  * @description Load data on init
    //  */
    // useEffect(() => {
    //     loadChannelAttendances();
    //     setPastMeetings([]);
    //     loadPastSchedule();
    // }, [props.channelId]);

    // /**
    //  * @description Filter users by search
    //  */
    // useEffect(() => {
    //     if (studentSearch === '') {
    //         setChannelAttendances(allChannelAttendances);
    //     } else {
    //         const allAttendances = [...allChannelAttendances];

    //         const matches = allAttendances.filter((student: any) => {
    //             return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
    //         });

    //         setChannelAttendances(matches);
    //     }
    // }, [studentSearch]);

    /**
     * @description Set if user is owner
     */
    // useEffect(() => {
    //     (async () => {
    //         const u = await AsyncStorage.getItem('user');
    //         if (u) {
    //             const user = JSON.parse(u);
    //             if (user._id.toString().trim() === props.channelCreatedBy) {
    //                 setIsOwner(true);
    //             }
    //             setUserId(user._id);
    //         }
    //     })();
    // }, [props.channelCreatedBy, props.channelId]);

    /**
     * @description Create Structure for exporting attendance data in Spreadsheet
     */
    // useEffect(() => {
    //     if (allChannelAttendances.length === 0 || pastMeetings.length === 0) {
    //         return;
    //     }

    //     // Calculate total for each student and add it to the end
    //     const studentTotalMap: any = {};

    //     allChannelAttendances.forEach((att) => {
    //         let count = 0;
    //         pastMeetings.forEach((meeting) => {
    //             const attendanceObject = att.attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === meeting.dateId.toString().trim();
    //             });

    //             if (attendanceObject) count++;
    //         });

    //         studentTotalMap[att.userId] = count;
    //     });

    //     setAttendanceTotalMap(studentTotalMap);

    //     const exportAoa = [];

    //     // Add row 1 with past meetings and total
    //     let row1 = [''];

    //     pastMeetings.forEach((meeting) => {
    //         row1.push(moment(new Date(meeting.start)).format('MMMM Do, h:mm a'));
    //     });

    //     row1.push('Total');

    //     exportAoa.push(row1);

    //     allChannelAttendances.forEach((att) => {
    //         let userRow = [];

    //         userRow.push(att.fullName);

    //         pastMeetings.forEach((meeting) => {
    //             const attendanceObject = att.attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === meeting.dateId.toString().trim();
    //             });

    //             if (attendanceObject) {
    //                 userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMMM Do, h:mm a')}`);
    //             } else {
    //                 userRow.push('-');
    //             }
    //         });

    //         userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`);

    //         exportAoa.push(userRow);
    //     });

    //     setExportAoa(exportAoa);
    // }, [allChannelAttendances, pastMeetings]);

    /**
     * @description Filter meetings with start and end
     */
    // useEffect(() => {
    //     if (start && end) {
    //         const filteredPastMeetings = fixedPastMeetings.filter((meeting) => {
    //             return new Date(meeting.start) > start && new Date(meeting.end) < end;
    //         });

    //         setPastMeetings(filteredPastMeetings);
    //     } else {
    //         setPastMeetings(fixedPastMeetings);
    //     }
    // }, [start, end]);

    /**
     * @description API call to fetch user attendances
     */
    // const loadChannelAttendances = useCallback(() => {
    //     setLoadingAttendances(true);
    //     const server = fetchAPI('');
    //     server
    //         .query({
    //             query: getAttendancesForChannel,
    //             variables: {
    //                 channelId: props.channelId,
    //             },
    //         })
    //         .then(async (res) => {
    //             if (res.data && res.data.attendance.getAttendancesForChannel) {
    //                 const u = await AsyncStorage.getItem('user');
    //                 if (u) {
    //                     const user = JSON.parse(u);
    //                     if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
    //                         // all attendances
    //                         setAllChannelAttendances(res.data.attendance.getAttendancesForChannel);
    //                         setChannelAttendances(res.data.attendance.getAttendancesForChannel);
    //                     } else {
    //                         // only user's attendances
    //                         const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
    //                             return u.userId.toString().trim() === user._id.toString().trim();
    //                         });
    //                         const userAttendances = [{ ...attendances }];
    //                         setAllChannelAttendances(userAttendances);
    //                         setChannelAttendances(userAttendances);
    //                     }
    //                     setLoadingAttendances(false);
    //                 }
    //             }
    //         })
    //         .catch((e: any) => {
    //             setLoadingAttendances(false);
    //         });
    // }, [props.channelId]);

    // /**
    //  * @description API call to fetch past meetings
    //  */
    // const loadPastSchedule = useCallback(() => {
    //     setLoadingMeetings(true);
    //     const server = fetchAPI('');
    //     server
    //         .query({
    //             query: getPastDates,
    //             variables: {
    //                 channelId: props.channelId,
    //             },
    //         })
    //         .then((res) => {
    //             if (res.data && res.data.attendance.getPastDates) {
    //                 setFixedPastMeetings(res.data.attendance.getPastDates);
    //                 setPastMeetings(res.data.attendance.getPastDates);
    //             }
    //             setLoadingMeetings(false);
    //         })
    //         .catch((e: any) => {
    //             setLoadingMeetings(false);
    //         });
    // }, [props.channelId]);

    // FUNCTIONS

    /**
     * @description Mark as present/absent
     */
    // const onChangeAttendance = (dateId: String, userId: String, markPresent: Boolean) => {
    //     Alert(markPresent ? 'Mark Present?' : 'Mark Absent?', '', [
    //         {
    //             text: 'Cancel',
    //             style: 'cancel',
    //             onPress: () => {
    //                 return;
    //             },
    //         },
    //         {
    //             text: 'Yes',
    //             onPress: async () => {
    //                 const server = fetchAPI('');
    //                 server
    //                     .mutate({
    //                         mutation: modifyAttendance,
    //                         variables: {
    //                             dateId,
    //                             userId,
    //                             channelId: props.channelId,
    //                             markPresent,
    //                         },
    //                     })
    //                     .then((res) => {
    //                         if (res.data && res.data.attendance.modifyAttendance) {
    //                             loadChannelAttendances();
    //                         }
    //                     });
    //             },
    //         },
    //     ]);
    // };

    // /**
    //  * @description Export attendance data into spreadsheet
    //  */
    // const exportAttendance = async () => {
    //     const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    //     const fileExtension = '.xlsx';

    //     const ws = XLSX.utils.aoa_to_sheet(exportAoa);
    //     const wb = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, 'Attendance ');
    //     /* generate XLSX file and send to client */
    //     const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    //     const uri = FileSystem.cacheDirectory + 'attendance.xlsx';
    //     await FileSystem.writeAsStringAsync(uri, wbout, {
    //         encoding: FileSystem.EncodingType.Base64,
    //     });

    //     await Sharing.shareAsync(uri, {
    //         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //         dialogTitle: 'MyWater data',
    //         UTI: 'com.microsoft.excel.xlsx',
    //     });
    // };

    const renderStudentsMeetingsList = () => {
        return (
            <View
                style={{
                    width: '100%',
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
                    {studentAttendanceBookEntries.map((entry: any, ind: number) => {
                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === studentAttendanceBookEntries.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === studentAttendanceBookEntries.length - 1 ? 8 : 0,
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
                                        {entry.title}
                                    </Text>
                                    {entry.recordingLink ? (
                                        <TouchableOpacity
                                            style={{
                                                paddingTop: 10,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                Linking.openURL(entry.recordingLink);
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
                                        {new Date(entry.start).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(entry.start).toString().split(' ')[2]}{' '}
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
                                            <Ionicons
                                                name={
                                                    entry.attendanceType === 'present'
                                                        ? 'checkmark-outline'
                                                        : 'close-outline'
                                                }
                                                size={24}
                                                color={entry.attendanceType === 'present' ? '#35AC78' : '#F94144'}
                                            />
                                        </Text>

                                        {(entry.attendanceType === 'present' && entry.late) ||
                                        (entry.attendanceType === 'absent' && entry.excused) ? (
                                            <Text
                                                style={{
                                                    marginTop: 2,
                                                    fontSize: 10,
                                                    textAlign: 'center',
                                                    // backgroundColor: '#f3722c',
                                                    borderRadius: 12,
                                                    marginLeft: 5,
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 4,
                                                    color: '#000',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {entry.attendanceType === 'present' && entry.late ? 'LATE' : 'EXCUSED'}
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

    const renderInstructorView = () => {
        return (
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
                <View
                    style={{
                        minHeight: 70,
                        flexDirection: 'row',
                        overflow: 'hidden',
                        borderBottomWidth: 1,
                        borderBottomColor: '#f2f2f2',
                    }}
                    key={'-'}
                >
                    <View
                        style={{
                            backgroundColor: '#f8f8f8',
                            minWidth: 175,
                            maxWidth: 175,
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                        key={'0,0'}
                    >
                        <TextInput
                            value={studentSearch}
                            onChangeText={(val: string) => setStudentSearch(val)}
                            placeholder={'Search'}
                            placeholderTextColor={'#1F1F1F'}
                            style={{
                                width: '100%',
                                marginRight: 5,
                                padding: 8,
                                borderColor: '#ccc',
                                borderRadius: 18,
                                borderWidth: 1,
                                fontSize: 15,
                                backgroundColor: '#fff',
                            }}
                        />
                    </View>

                    <View
                        style={{
                            backgroundColor: '#f8f8f8',
                            minWidth: 175,
                            maxWidth: 175,
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                        key={'total'}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'inter',
                                marginBottom: 5,
                            }}
                        >
                            {PreferredLanguageText('total')}
                        </Text>
                    </View>
                    {attendanceBookEntries.map((entry: any, col: number) => {
                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    minWidth: 175,
                                    maxWidth: 175,
                                    padding: 10,
                                    borderRightWidth: 1,
                                    borderRightColor: '#f2f2f2',
                                }}
                                key={col.toString()}
                                onPress={() => {
                                    handleEditAttendanceBookEntry(
                                        entry.dateId ? entry.dateId : entry.attendanceEntryId
                                    );
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 12,
                                        color: '#000000',
                                        marginBottom: 5,
                                    }}
                                >
                                    {new Date(entry.start).toString().split(' ')[1] +
                                        ' ' +
                                        new Date(entry.start).toString().split(' ')[2]}{' '}
                                </Text>
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        color: '#000000',
                                        fontFamily: 'inter',
                                        marginTop: 3,
                                        // marginBottom: 5,
                                        // textAlignVertical: 'center',
                                    }}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >
                                    {entry.title}
                                </Text>

                                <View
                                    style={{
                                        marginTop: 3,
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name={'create-outline'}
                                            size={15}
                                            color="#1f1f1f"
                                            style={{
                                                fontFamily: 'Inter',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Search results empty */}
                {instructorAttendanceBook.users.length === 0 ? (
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
                    contentContainerStyle={{
                        // height: '100%',
                        width: '100%',
                    }}
                    nestedScrollEnabled={true}
                >
                    {attendanceBookUsers.map((user: any, row: number) => {
                        const userTotals = instructorAttendanceBook.totals.find((x: any) => x.userId === user.userId);

                        return (
                            <View
                                style={{
                                    minHeight: 70,
                                    flexDirection: 'row',
                                    overflow: 'hidden',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f2f2f2',
                                }}
                                key={row}
                            >
                                <View
                                    style={{
                                        minWidth: 175,
                                        maxWidth: 175,
                                        padding: 10,
                                        borderRightWidth: 1,
                                        borderRightColor: '#f2f2f2',
                                    }}
                                >
                                    <Image
                                        style={{
                                            height: 37,
                                            width: 37,
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
                                            marginTop: 7,
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                        }}
                                    >
                                        {user.fullName}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        minWidth: 175,
                                        maxWidth: 175,
                                        padding: 10,
                                        borderRightWidth: 1,
                                        borderRightColor: '#f2f2f2',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 13,
                                            color: '#000000',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {userTotals.totalPresent + ' / ' + userTotals.totalAttendancesPossible}
                                    </Text>
                                </View>
                                {attendanceBookEntries.map((entry: any, col: number) => {
                                    const userAttendance = entry.attendances.find((x: any) => x.userId === user.userId);

                                    if (
                                        (activeModifyId === entry.dateId ||
                                            activeModifyId === entry.attendanceEntryId) &&
                                        activeUserId === user.userId
                                    ) {
                                        return (
                                            <View
                                                style={{
                                                    minWidth: 175,
                                                    maxWidth: 175,
                                                    padding: 10,
                                                    borderRightWidth: 1,
                                                    borderRightColor: '#f2f2f2',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginTop: 10,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                // alignItems: 'center',
                                                                marginRight: 20,
                                                            }}
                                                        >
                                                            <Menu
                                                                onSelect={(attendanceType: any) => {
                                                                    const updateEntry = {
                                                                        ...attendanceEntry,
                                                                        attendanceType,
                                                                    };

                                                                    // updateEntry.attendanceType = val.value;

                                                                    setAttendanceEntry(updateEntry);
                                                                }}
                                                                style={{ paddingRight: 20, paddingLeft: 20 }}
                                                            >
                                                                <MenuTrigger>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily: 'inter',
                                                                            fontSize: 14,
                                                                            color: '#2F2F3C',
                                                                        }}
                                                                    >
                                                                        {
                                                                            attendanceTypeLabels[
                                                                                attendanceEntry.attendanceType
                                                                            ]
                                                                        }
                                                                        <Ionicons name="caret-down" size={14} />
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
                                                                    {attendanceTypeOptions.map((item: any) => {
                                                                        return (
                                                                            <MenuOption value={item.value}>
                                                                                <Text
                                                                                    style={{
                                                                                        fontSize: 15,
                                                                                        fontFamily: 'Inter',
                                                                                        paddingBottom: 3,
                                                                                    }}
                                                                                >
                                                                                    {item.label}
                                                                                </Text>
                                                                            </MenuOption>
                                                                        );
                                                                    })}
                                                                </MenuOptions>
                                                            </Menu>

                                                            <View
                                                                style={{
                                                                    marginTop: 20,
                                                                }}
                                                            >
                                                                <View
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                    }}
                                                                >
                                                                    <Switch
                                                                        value={
                                                                            attendanceEntry.attendanceType === 'present'
                                                                                ? attendanceEntry.late
                                                                                : attendanceEntry.excused
                                                                        }
                                                                        onValueChange={() => {
                                                                            const updateEntry = {
                                                                                ...attendanceEntry,
                                                                            };

                                                                            if (
                                                                                attendanceEntry.attendanceType ===
                                                                                'present'
                                                                            ) {
                                                                                updateEntry.late =
                                                                                    !attendanceEntry.late;
                                                                            } else {
                                                                                updateEntry.excused =
                                                                                    !attendanceEntry.excused;
                                                                            }

                                                                            setAttendanceEntry(updateEntry);
                                                                        }}
                                                                        // style={{ height: 20 }}
                                                                        trackColor={{
                                                                            false: '#f2f2f2',
                                                                            true: '#000',
                                                                        }}
                                                                        activeThumbColor="white"
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            paddingLeft: 10,
                                                                        }}
                                                                    >
                                                                        {attendanceEntry.attendanceType === 'present'
                                                                            ? 'Late'
                                                                            : 'Excused'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                updateAttendanceBookEntry();
                                                            }}
                                                            disabled={props.user.email === disableEmailId}
                                                        >
                                                            <Ionicons
                                                                name="checkmark-circle-outline"
                                                                size={20}
                                                                style={{ marginRight: 5 }}
                                                                color={'#8bc34a'}
                                                            />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setActiveModifyId('');
                                                                setActiveModifyEntryType('');
                                                                setActiveUserId('');
                                                                setAttendanceEntry(undefined);
                                                                // setActiveScore('');
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name="close-circle-outline"
                                                                size={20}
                                                                color={'#f94144'}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    }

                                    return (
                                        <View
                                            style={{
                                                minWidth: 175,
                                                maxWidth: 175,
                                                padding: 10,
                                                borderRightWidth: 1,
                                                borderRightColor: '#f2f2f2',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TouchableOpacity
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
                                                key={row.toString() + '-' + col.toString()}
                                                onPress={() => {
                                                    setActiveModifyId(
                                                        entry.dateId ? entry.dateId : entry.attendanceEntryId
                                                    );
                                                    setActiveModifyEntryType(
                                                        entry.dateId ? 'meeting' : 'attendanceBook'
                                                    );
                                                    setActiveUserId(user.userId);
                                                    setAttendanceEntry(
                                                        userAttendance
                                                            ? userAttendance
                                                            : {
                                                                  attendanceType: 'absent',
                                                                  late: false,
                                                                  excused: false,
                                                              }
                                                    );
                                                }}
                                            >
                                                <Text>
                                                    <Ionicons
                                                        name={
                                                            userAttendance.attendanceType === 'present'
                                                                ? 'checkmark-outline'
                                                                : 'close-outline'
                                                        }
                                                        size={24}
                                                        color={
                                                            userAttendance.attendanceType === 'present'
                                                                ? '#35AC78'
                                                                : '#F94144'
                                                        }
                                                    />
                                                </Text>

                                                {(userAttendance.attendanceType === 'present' && userAttendance.late) ||
                                                (userAttendance.attendanceType === 'absent' &&
                                                    userAttendance.excused) ? (
                                                    <Text
                                                        style={{
                                                            // marginTop: 2,
                                                            fontSize: 10,
                                                            textAlign: 'center',
                                                            // backgroundColor: '#f3722c',
                                                            borderRadius: 12,
                                                            marginLeft: 5,
                                                            paddingHorizontal: 7,
                                                            paddingVertical: 4,
                                                            color: '#000',
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {userAttendance.attendanceType === 'present' &&
                                                        userAttendance.late
                                                            ? 'LATE'
                                                            : 'EXCUSED'}
                                                    </Text>
                                                ) : null}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </ScrollView>
            </ScrollView>
        );
    };

    const renderInstructorAttendances = () => {
        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 50,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                        }}
                    >
                        Attendances
                    </Text>

                    {/*  */}
                    <TouchableOpacity
                        style={{}}
                        onPress={() => {
                            props.setShowNewAttendance(true);
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
                                fontSize: 12,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 100,
                            }}
                        >
                            New
                        </Text>
                    </TouchableOpacity>
                </View>

                {isFetchingAttendanceBook ? (
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
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : !instructorAttendanceBook ? (
                    <View>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 100,
                                paddingHorizontal: 10,
                                fontFamily: 'inter',
                            }}
                        >
                            Could not fetch attendances.
                        </Text>
                    </View>
                ) : instructorAttendanceBook.entries.length === 0 || instructorAttendanceBook.users.length === 0 ? (
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 100,
                                paddingHorizontal: 10,
                                fontFamily: 'inter',
                            }}
                        >
                            {instructorAttendanceBook.entries.length === 0
                                ? 'No attendances found.'
                                : 'No users in course.'}
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                maxWidth: 1024,
                                borderRadius: 2,
                                borderWidth: 1,
                                marginTop: 20,
                                borderColor: '#cccccc',
                                zIndex: 5000000,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                position: 'relative',
                                overflow: 'scroll',
                            }}
                        >
                            {renderInstructorView()}
                        </View>

                        {/*  */}
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Attendance Insights
                                </Text>
                            </View>

                            <View>{renderAttendanceAnalytics()}</View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderAttendanceAnalytics = () => {
        let totalAttendancesPossible;
        let totalPresent;
        let totalLate;
        let totalExcused;
        let last30AttendancesPossible;
        let last30Present;
        let last30Late;
        let last30TotalExcused;
        let last7AttendancesPossible;
        let last7Present;
        let last7Late;
        let last7TotalExcused;

        let totalAbsences;
        let totalInexcused;

        // LAST 30
        let last30Absences;
        let last30Inexcused;

        // Last 7
        let last7Absences;
        let last7Inexcused;

        if (props.isOwner) {
            const userTotals = instructorAttendanceBook.totals.find(
                (x: any) => x.userId === attendanceBookAnalyticsSelectedUser
            );

            totalAttendancesPossible = userTotals.totalAttendancesPossible;
            totalPresent = userTotals.totalPresent;
            totalLate = userTotals.totalLate;
            totalExcused = userTotals.totalExcused;
            last30AttendancesPossible = userTotals.last30AttendancesPossible;
            last30Present = userTotals.last30Present;
            last30Late = userTotals.last30Late;
            last30TotalExcused = userTotals.last30TotalExcused;
            last7AttendancesPossible = userTotals.last7AttendancesPossible;
            last7Present = userTotals.last7Present;
            last7Late = userTotals.last7Late;
            last7TotalExcused = userTotals.last7TotalExcused;

            //
            totalAbsences = totalAttendancesPossible - totalPresent;
            totalInexcused = totalAbsences - totalExcused;

            // LAST 30
            last30Absences = last30AttendancesPossible - last30Present;
            last30Inexcused = last30Absences - last30TotalExcused;

            // Last 7
            last7Absences = last7AttendancesPossible - last7Present;
            last7Inexcused = last7Absences - last7TotalExcused;
        } else {
            totalAttendancesPossible = studentAttendanceBook.total.totalAttendancesPossible;
            totalPresent = studentAttendanceBook.total.totalPresent;
            totalLate = studentAttendanceBook.total.totalLate;
            totalExcused = studentAttendanceBook.total.totalExcused;
            last30AttendancesPossible = studentAttendanceBook.total.last30AttendancesPossible;
            last30Present = studentAttendanceBook.total.last30Present;
            last30Late = studentAttendanceBook.total.last30Late;
            last30TotalExcused = studentAttendanceBook.total.last30TotalExcused;
            last7AttendancesPossible = studentAttendanceBook.total.last7AttendancesPossible;
            last7Present = studentAttendanceBook.total.last7Present;
            last7Late = studentAttendanceBook.total.last7Late;
            last7TotalExcused = studentAttendanceBook.total.last7TotalExcused;

            //
            totalAbsences = totalAttendancesPossible - totalPresent;
            totalInexcused = totalAbsences - totalExcused;

            // LAST 30
            last30Absences = last30AttendancesPossible - last30Present;
            last30Inexcused = last30Absences - last30TotalExcused;

            // Last 7
            last7Absences = last7AttendancesPossible - last7Present;
            last7Inexcused = last7Absences - last7TotalExcused;
        }

        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 25,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: 'white',
                                display: 'flex',
                                height: isAttendanceAnalyticsDropdownOpen
                                    ? getDropdownHeight(attendanceBookUsersDropdownOptions.length)
                                    : 50,
                                zIndex: isAttendanceAnalyticsDropdownOpen ? 1 : 0,
                                // marginRight: 10
                                maxWidth: '100%',
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                open={isAttendanceAnalyticsDropdownOpen}
                                value={attendanceBookAnalyticsSelectedUser}
                                items={attendanceBookUsersDropdownOptions}
                                scrollViewProps={{
                                    nestedScrollEnabled: true,
                                }}
                                setOpen={setIsAttendanceAnalyticsDropdownOpen}
                                setValue={setAttendanceBookAnalyticsSelectedUser}
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
                                    shadowOpacity: !isAttendanceAnalyticsDropdownOpen ? 0 : 0.08,
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

                {/* <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        marginTop: 30,
                    }}
                > */}
                <ScrollView
                    horizontal={true}
                    style={{
                        marginTop: 25,
                    }}
                >
                    <View
                        style={{
                            width: 200,
                        }}
                    >
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#DECA57',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        backgroundColor: '#DECA57',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Absences
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalAbsences}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="remove-circle-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Absences}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Absences}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: 200,
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f8961e',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        backgroundColor: '#f8961e',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Late
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalLate}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="time-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Late}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Late}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: 200,
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#ccc',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f94144',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        backgroundColor: '#f94144',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Inexcused
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalInexcused}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="warning-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Inexcused}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Inexcused}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: 200,
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#ccc',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#35ac78',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        backgroundColor: '#35ac78',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Present
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalPresent}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Present}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Present}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderStudentAttendances = () => {
        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 50,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                        }}
                    >
                        Attendances
                    </Text>
                </View>

                {isFetchingStudentAttendanceBook ? (
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
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : !studentAttendanceBook ? (
                    <View>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 100,
                                paddingHorizontal: 10,
                                fontFamily: 'inter',
                            }}
                        >
                            Could not fetch attendances.
                        </Text>
                    </View>
                ) : studentAttendanceBook.entries.length === 0 ? (
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 100,
                                paddingHorizontal: 10,
                                fontFamily: 'inter',
                            }}
                        >
                            No attendances found.
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                maxWidth: 1024,
                                borderRadius: 2,
                                borderWidth: 1,
                                marginTop: 20,
                                borderColor: '#cccccc',
                                zIndex: 5000000,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                position: 'relative',
                                overflow: 'scroll',
                            }}
                        >
                            {renderStudentsMeetingsList()}
                        </View>

                        {/*  */}
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Attendance Insights
                                </Text>
                            </View>

                            {/*  */}
                            <View>{renderAttendanceAnalytics()}</View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    if (props.showNewAttendance) {
        return (
            <NewAttendanceModal
                channelId={props.channelId}
                courseStudents={courseStudents}
                onClose={() => {
                    props.setShowNewAttendance(false);

                    setEditEntryId('');
                    setEditEntryType('');
                    setEditAttendance(undefined);
                }}
                user={props.user}
                // Refresh Functions
                refreshAttendanceData={() => {
                    fetchAttendancebookInstructor();
                }}
                editEntryId={editEntryId}
                editEntryType={editEntryType}
                editAttendance={editAttendance}
                instructorAttendanceBook={instructorAttendanceBook}
            />
        );
    }

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                paddingHorizontal: paddingResponsive(),
                paddingBottom: 250,
            }}
        >
            {props.isOwner ? renderInstructorAttendances() : renderStudentAttendances()}
            {/* {renderEditDateModal()} */}
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
