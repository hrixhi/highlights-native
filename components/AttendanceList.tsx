// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
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
// import { Datepicker } from '@mobiscroll/react';

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [fixedPastMeetings, setFixedPastMeetings] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [loadingAttendances, setLoadingAttendances] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [end, setEnd] = useState<any>(null);
    const [start, setStart] = useState<any>(null);
    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});
    const [exportAoa, setExportAoa] = useState<any[]>();

    // HOOKS

    /**
     * @description Load data on init
     */
    useEffect(() => {
        loadChannelAttendances();
        setPastMeetings([]);
        loadPastSchedule();
    }, [props.channelId]);

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
            }
        })();
    }, [props.channelCreatedBy, props.channelId]);

    /**
     * @description Create Structure for exporting attendance data in Spreadsheet
     */
    useEffect(() => {
        if (channelAttendances.length === 0 || pastMeetings.length === 0) {
            return;
        }

        // Calculate total for each student and add it to the end
        const studentTotalMap: any = {};

        channelAttendances.forEach(att => {
            let count = 0;
            pastMeetings.forEach(meeting => {
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

        pastMeetings.forEach(meeting => {
            row1.push(moment(new Date(meeting.start)).format('MMMM Do, h:mm a'));
        });

        row1.push('Total');

        exportAoa.push(row1);

        channelAttendances.forEach(att => {
            let userRow = [];

            userRow.push(att.fullName);

            pastMeetings.forEach(meeting => {
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
    }, [channelAttendances, pastMeetings]);

    /**
     * @description Filter meetings with start and end
     */
    useEffect(() => {
        if (start && end) {
            const filteredPastMeetings = fixedPastMeetings.filter(meeting => {
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
                    channelId: props.channelId
                }
            })
            .then(async res => {
                if (res.data && res.data.attendance.getAttendancesForChannel) {
                    const u = await AsyncStorage.getItem('user');
                    if (u) {
                        const user = JSON.parse(u);
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            // all attendances
                            setChannelAttendances(res.data.attendance.getAttendancesForChannel);
                        } else {
                            // only user's attendances
                            const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
                                return u.userId.toString().trim() === user._id.toString().trim();
                            });
                            const userAttendances = [{ ...attendances }];
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
                    channelId: props.channelId
                }
            })
            .then(res => {
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
                }
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
                                markPresent
                            }
                        })
                        .then(res => {
                            if (res.data && res.data.attendance.modifyAttendance) {
                                loadChannelAttendances();
                            }
                        });
                }
            }
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
            encoding: FileSystem.EncodingType.Base64
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'MyWater data',
            UTI: 'com.microsoft.excel.xlsx'
        });
    };

    console.log('Past meetings', pastMeetings);
    console.log('Past attendances', channelAttendances);

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#f2f2f2',
                width: '100%'
            }}
        >
            {channelAttendances.length === 0 || fixedPastMeetings.length === 0 ? null : (
                <Text
                    style={{
                        color: '#1f1f1f',
                        fontSize: 18,
                        fontFamily: 'inter',
                        marginBottom: 10,
                        paddingHorizontal: 10
                    }}
                >
                    Past meetings
                </Text>
            )}
            <Text style={{ width: '100%', textAlign: 'center' }}>
                {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} /> */}
            </Text>
            <View
                style={{
                    backgroundColor: '#f2f2f2',
                    flexDirection: 'row',
                    paddingBottom: 20,
                    width: '100%',
                    justifyContent: 'flex-end'
                }}
            >
                {channelAttendances.length === 0 || fixedPastMeetings.length === 0 ? null : (
                    <View style={{ backgroundColor: '#f2f2f2' }}>
                        <View
                            style={{
                                display: 'flex',
                                width: '100%',
                                flexDirection: 'row',
                                backgroundColor: '#f2f2f2',
                                alignItems: 'center',
                                borderBottomColor: '#d9dcdf',
                                borderBottomWidth: 1
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
                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#f2f2f2' }} />
                {pastMeetings.length === 0 || channelAttendances.length === 0 || !isOwner ? null : (
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#f2f2f2',
                            overflow: 'hidden',
                            height: 35,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            marginRight: 10
                        }}
                        onPress={() => {
                            exportAttendance();
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#006AFF',
                                fontSize: 12,
                                borderColor: '#006AFF',
                                borderWidth: 1,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            EXPORT
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {channelAttendances.length === 0 || pastMeetings.length === 0 || loadingAttendances || loadingMeetings ? (
                loadingAttendances || loadingMeetings ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#f2f2f2',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0,
                            paddingVertical: 100
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#f2f2f2' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 20,
                                paddingVertical: 50,
                                paddingHorizontal: 20,
                                fontFamily: 'inter'
                            }}
                        >
                            {pastMeetings.length === 0 ? 'No past meetings.' : 'No Students.'}
                        </Text>
                    </View>
                )
            ) : (
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        paddingTop: 10,
                        maxHeight: 450,
                        // paddingHorizontal: 10,
                        borderRadius: 1,
                        borderLeftColor: props.channelColor,
                        borderLeftWidth: 3,
                        shadowOffset: {
                            width: 2,
                            height: 2
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        zIndex: 5000000
                    }}
                    key={JSON.stringify(channelAttendances)}
                >
                    <ScrollView
                        showsHorizontalScrollIndicator={true}
                        horizontal={true}
                        contentContainerStyle={{
                            // height: '100%',
                            // maxHeight: 450,
                            flexDirection: 'column'
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
                                    borderBottomColor: '#f2f2f2'
                                }}
                                key={'-'}
                            >
                                {isOwner ? <View style={styles.col} key={'0,0'} /> : null}
                                <View style={styles.col} key={'0,0'}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            textAlign: 'center'
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
                                                    fontFamily: 'inter'
                                                }}
                                            >
                                                {title}
                                            </Text>
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                    marginBottom: 5
                                                }}
                                            >
                                                {moment(new Date(start)).format('MMMM Do')}
                                            </Text>
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                    marginBottom: 5
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
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 13,
                                                        color: '#000000',
                                                        fontFamily: 'inter'
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
                                                    fontFamily: 'inter'
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
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Text>
                                                            {attendanceObject ? (
                                                                <Ionicons
                                                                    name="checkmark-outline"
                                                                    size={15}
                                                                    color={'#006AFF'}
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
                                                                width: '100%'
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
        borderBottomColor: '#e0e0e0',
        borderBottomWidth: 1
    },
    col: {
        width: Dimensions.get('window').width < 768 ? 90 : 120,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: 7
    }
});
