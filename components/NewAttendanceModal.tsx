// // REACT
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Dimensions, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import Alert from './Alert';
// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from './CustomTextInput';
import { paddingResponsive } from '../helpers/paddingHelper';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import {
    createChannelAttendance,
    deleteChannelAttendance,
    editChannelAttendance,
} from '../graphql/QueriesAndMutations';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

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

const NewAttendanceModal: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user } = useAppContext();
    // STATE
    const [newAttendanceTitle, setNewAttendanceTitle] = useState('');
    const [newAttendanceDate, setNewAttendanceDate] = useState(new Date());
    const [newAttendanceRecordingLink, setNewAttendanceRecordingLink] = useState('');
    const [newStudentAttendances, setNewStudentAttendances] = useState<any[]>([]);

    const [showNewAttendanceDateAndroid, setShowNewAttendanceDateAndroid] = useState(false);

    const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);
    const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);

    const server = useApolloClient();

    const resetNewEntryForm = () => {
        setNewAttendanceTitle('');
        setNewAttendanceDate(new Date());
        setNewAttendanceRecordingLink('');

        // Standard Points scored
        const studentAttendances: any[] = props.courseStudents.map((student: any) => {
            return {
                _id: student._id,
                fullName: student.fullName,
                avatar: student.avatar,
                attendanceType: 'present',
                late: false,
                excused: false,
            };
        });

        setNewStudentAttendances(studentAttendances);
    };

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const handleCreateAttendance = useCallback(
        async (editing?: boolean) => {
            setIsCreatingAttendance(true);

            if (!newAttendanceTitle || newAttendanceTitle === '') {
                Alert('Attendance title is required.');
                return;
            }

            // Sanitize
            const sanitizeAttendances = newStudentAttendances.map((user: any) => {
                return {
                    userId: user._id,
                    attendanceType: user.attendanceType,
                    late: user.attendanceType === 'present' ? user.late : false,
                    excused: user.attendanceType === 'absent' ? user.excused : false,
                };
            });

            //
            const attendanceEntryInput = {
                title: newAttendanceTitle,
                date: newAttendanceDate,
                recordingLink: newAttendanceRecordingLink,
                channelId: props.channelId,
                attendances: sanitizeAttendances,
            };

            if (editing) {
                server
                    .mutate({
                        mutation: editChannelAttendance,
                        variables: {
                            attendanceEntryInput,
                            entryId: props.editEntryId,
                            attendanceBookEntry: props.editEntryType === 'entry',
                        },
                    })
                    .then((res) => {
                        if (res.data.attendance && res.data.attendance.editEntry) {
                            Alert('Updated Attendance entry successfully.');
                            resetNewEntryForm();
                            props.onClose();
                            // Reload attendance book
                            props.refreshAttendanceData();
                        } else {
                            Alert('Failed to update attendance entry.');
                        }
                        setIsCreatingAttendance(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update attendance entry.');
                        setIsCreatingAttendance(false);
                    });
            } else {
                server
                    .mutate({
                        mutation: createChannelAttendance,
                        variables: {
                            attendanceEntryInput,
                        },
                    })
                    .then((res) => {
                        if (res.data.attendance && res.data.attendance.createEntry) {
                            Alert('Created Attendance entry successfully.');
                            resetNewEntryForm();
                            props.onClose();
                            // Reload attendance book
                            props.refreshAttendanceData();
                        } else {
                            Alert('Failed to create attendance entry.');
                        }
                        setIsCreatingAttendance(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update attendance entry.');
                        setIsCreatingAttendance(false);
                    });
            }
        },
        [
            newAttendanceTitle,
            newAttendanceDate,
            newAttendanceRecordingLink,
            newStudentAttendances,
            props.editEntryId,
            props.editEntryType,
        ]
    );

    const handleDeleteAttendance = useCallback(async () => {
        setIsDeletingAttendance(true);

        server
            .mutate({
                mutation: deleteChannelAttendance,
                variables: {
                    entryId: props.editEntryId,
                    attendanceBookEntry: props.editEntryType === 'entry',
                },
            })
            .then((res) => {
                if (res.data.attendance && res.data.attendance.deleteEntry) {
                    Alert('Deleted Attendance entry successfully.');
                    resetNewEntryForm();
                    props.onClose();
                    // Reload attendance book
                    props.refreshAttendanceData();
                } else {
                    Alert('Failed to delete attendance entry.');
                }
                setIsDeletingAttendance(false);
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to delete attendance entry.');
                setIsDeletingAttendance(false);
            });
    }, [props.editEntryId, props.editEntryType]);

    useEffect(() => {
        if (props.courseStudents && !props.editEntryId) {
            // Attendances

            const studentAttendances: any[] = props.courseStudents.map((student: any) => {
                return {
                    _id: student._id,
                    fullName: student.fullName,
                    avatar: student.avatar,
                    attendanceType: 'present',
                    late: false,
                    excused: false,
                };
            });

            setNewStudentAttendances(studentAttendances);
        }
    }, [props.courseStudents]);

    useEffect(() => {
        if (props.editEntryId && props.editAttendance && props.instructorAttendanceBook) {
            const { entries, users } = props.instructorAttendanceBook;

            const findEntry = entries.find(
                (entry: any) => entry.attendanceEntryId === props.editEntryId || entry.dateId === props.editEntryId
            );

            const { title, start, recordingLink, attendances } = findEntry;

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

            setNewAttendanceTitle(title);
            setNewAttendanceDate(new Date(start));
            setNewAttendanceRecordingLink(recordingLink);
            setNewStudentAttendances(attendanceBookEntries);
        }
    }, [props.courseStudents, props.editEntryId, props.editAttendance, props.instructorAttendanceBook]);

    const renderNewAttendanceDateTimepicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={{
                            width: 125,
                            height: 45,
                            borderRadius: 10,
                            marginLeft: 10,
                        }}
                        value={newAttendanceDate}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);

                            setNewAttendanceDate(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showNewAttendanceDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={{
                            width: 125,
                            height: 45,
                            borderRadius: 10,
                            marginLeft: 10,
                        }}
                        value={newAttendanceDate}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowNewAttendanceDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowNewAttendanceDateAndroid(false);
                            setNewAttendanceDate(roundedValue);
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
                                setShowNewAttendanceDateAndroid(true);
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

    const renderAttendanceEntry = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'column',
                    marginBottom: 50,
                }}
            >
                <View style={{ width: '100%' }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#000000',
                        }}
                    >
                        Title
                    </Text>
                    <CustomTextInput
                        value={newAttendanceTitle}
                        placeholder={''}
                        onChangeText={(val) => setNewAttendanceTitle(val)}
                        placeholderTextColor={'#1F1F1F'}
                        required={true}
                    />
                </View>
                <View
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#000000',
                        }}
                    >
                        Date
                        {/* {PreferredLanguageText("repeatTill")}{" "} */}
                        {Platform.OS === 'android'
                            ? ': ' + moment(new Date(newAttendanceDate)).format('MMMM Do YYYY')
                            : null}
                    </Text>
                    <View
                        style={{
                            // width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                            flexDirection: 'row',
                            backgroundColor: '#fff',
                            // marginTop: Platform.OS === 'ios' ? 0 : 12,
                            marginLeft: 'auto',
                        }}
                    >
                        {renderNewAttendanceDateTimepicker()}
                    </View>
                </View>
                <View
                    style={{
                        width: '100%',
                        marginTop: 25,
                    }}
                >
                    <View style={{ width: '100%' }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Recording Link
                        </Text>
                        <CustomTextInput
                            value={newAttendanceRecordingLink}
                            placeholder={''}
                            onChangeText={(val) => setNewAttendanceRecordingLink(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={false}
                        />
                    </View>
                </View>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        maxWidth: 1024,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                        zIndex: 5000000,
                        maxHeight: 500,
                        position: 'relative',
                        overflow: 'scroll',
                        marginTop: 30,
                    }}
                >
                    <ScrollView
                        showsHorizontalScrollIndicator={true}
                        horizontal={true}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                        }}
                        nestedScrollEnabled={true}
                    >
                        <View
                            style={{
                                minHeight: 50,
                                flexDirection: 'row',
                                overflow: 'hidden',
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                                backgroundColor: '#f8f8f8',
                                width: '100%',
                            }}
                            key={'-'}
                        >
                            <View
                                style={{
                                    height: 50,
                                    width: '33%',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    borderBottomColor: '#f2f2f2',
                                    borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        textAlign: 'center',
                                    }}
                                >
                                    Student
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 50,
                                    width: '33%',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    borderBottomColor: '#f2f2f2',
                                    borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        textAlign: 'center',
                                    }}
                                >
                                    Attendance
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 50,
                                    width: '33%',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    borderBottomColor: '#f2f2f2',
                                    borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        textAlign: 'center',
                                    }}
                                >
                                    Option
                                </Text>
                            </View>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            contentContainerStyle={{
                                width: '100%',
                            }}
                            nestedScrollEnabled={true}
                        >
                            {newStudentAttendances.map((student, studentIdx) => {
                                return (
                                    <View
                                        style={{
                                            minHeight: 70,
                                            flexDirection: 'row',
                                            overflow: 'hidden',
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f2f2f2',
                                            width: '100%',
                                        }}
                                        key={studentIdx}
                                    >
                                        <View
                                            style={{
                                                height: 90,
                                                width: '33%',
                                                justifyContent: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: 7,
                                                borderBottomColor: '#f2f2f2',
                                                borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                            }}
                                        >
                                            <Image
                                                style={{
                                                    height: 37,
                                                    width: 37,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                    marginBottom: 7,
                                                }}
                                                source={{
                                                    uri: student.avatar
                                                        ? student.avatar
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
                                                {student.fullName}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                height: 90,
                                                width: '33%',
                                                justifyContent: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: 7,
                                                borderBottomColor: '#f2f2f2',
                                                borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {/* Attendance Type */}
                                                <Menu
                                                    onSelect={(value: any) => {
                                                        const updateAttendances = [...newStudentAttendances];

                                                        updateAttendances[studentIdx].attendanceType = value;

                                                        setNewStudentAttendances(updateAttendances);
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
                                                            {attendanceTypeLabels[student.attendanceType]}
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
                                            </View>
                                        </View>
                                        <View
                                            style={{
                                                height: 90,
                                                width: '33%',
                                                justifyContent: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: 7,
                                                borderBottomColor: '#f2f2f2',
                                                borderBottomWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                                            }}
                                        >
                                            {/* LATE OR EXCUSED */}
                                            {student.attendanceType === 'present' ? (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Switch
                                                        value={student.late}
                                                        onValueChange={() => {
                                                            const updateAttendances = [...newStudentAttendances];

                                                            updateAttendances[studentIdx].late = !student.late;

                                                            setNewStudentAttendances(updateAttendances);
                                                        }}
                                                        style={{ height: 20 }}
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
                                                        Late
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Switch
                                                        value={student.excused}
                                                        onValueChange={() => {
                                                            const updateAttendances = [...newStudentAttendances];

                                                            updateAttendances[studentIdx].excused = !student.excused;

                                                            setNewStudentAttendances(updateAttendances);
                                                        }}
                                                        style={{ height: 20 }}
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
                                                        Excused
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderSubmissionButtons = () => {
        return (
            <View
                style={{
                    width: '100%',
                    alignItems: 'center',
                    marginVertical: 50,
                }}
            >
                {props.editEntryId ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                marginBottom: 20,
                            }}
                            onPress={() => handleCreateAttendance(true)}
                            disabled={isCreatingAttendance || user.email === disableEmailId}
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
                                {isCreatingAttendance ? '...' : 'EDIT'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                marginBottom: 20,
                            }}
                            onPress={() => handleDeleteAttendance()}
                            disabled={isDeletingAttendance || user.email === disableEmailId}
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
                                    width: 120,
                                }}
                            >
                                {isDeletingAttendance ? '...' : 'DELETE'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={{
                            marginBottom: 20,
                        }}
                        onPress={() => handleCreateAttendance(false)}
                        disabled={isCreatingAttendance || user.email === disableEmailId}
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
                            {isCreatingAttendance ? '...' : 'CREATE'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View
            style={{
                // flex: 1,
                paddingHorizontal: paddingResponsive(),
                marginBottom: 100,
            }}
        >
            {/* HEADER */}
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    position: 'relative',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 30,
                    marginTop: 20,
                }}
            >
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        left: 0,
                    }}
                    onPress={() => {
                        resetNewEntryForm();
                        props.onClose();
                    }}
                >
                    <Text>
                        <Ionicons size={35} name="chevron-back-outline" color="#1f1f1f" />
                    </Text>
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: 22,
                        fontFamily: 'inter',
                    }}
                >
                    {props.editEntryId ? 'Edit' : 'New '} Attendance Entry
                </Text>
            </View>
            <ScrollView
                horizontal={false}
                style={{
                    marginBottom: 100,
                    height: Dimensions.get('window').height - 200,
                }}
                contentContainerStyle={
                    {
                        // marginBottom: 100,
                    }
                }
                showsVerticalScrollIndicator={false}
                indicatorStyle="black"
            >
                {renderAttendanceEntry()}
                {renderSubmissionButtons()}
            </ScrollView>
        </View>
    );
};

export default NewAttendanceModal;
