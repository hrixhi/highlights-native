// REACT
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import _ from 'lodash';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    findThreadsByUserId,
    getAllPastDates,
    getAttendancesByUser,
    getPerformanceReport
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View } from '../components/Themed';
import Grades from './Grades';
import AttendanceList from './AttendanceList';

const Performance: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [scores, setScores] = useState<any[]>([]);
    const [score, setScore] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [dates, setDates] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>({});
    const [date, setDate] = useState<any>({});
    const [thread, setThread] = useState<any>({});
    const [threads, setThreads] = useState<any[]>([]);
    const [fetchingScores, setFetchingScores] = useState(true);
    const [fetchingAttendance, setFetchingAttendance] = useState(true);
    const [fetchingDates, setFetchingDates] = useState(true);
    const [fetchingThreads, setFetchingThreads] = useState(true);
    const data = [['Channel', 'Score', 'Total']];
    scores.map((score: any) => {
        data.push([
            score.channelName,
            Number(score.score) / Number(score.total),
            Number(score.total) - Number(score.score) / Number(score.total)
        ]);
    });

    // HOOKS

    /**
     * @description Calculates Score, attendance and threads count for performance summary
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const tempSc: any = {};
                scores.map((sc: any) => {
                    if (!tempSc[sc.channelId]) {
                        tempSc[sc.channelId] = sc;
                    }
                });
                setScore(tempSc);

                const tempAtt: any = {};
                attendances.map((att: any) => {
                    if (tempAtt[att.channelId]) {
                        tempAtt[att.channelId].push(att);
                    } else {
                        tempAtt[att.channelId] = [att];
                    }
                });
                setAttendance(tempAtt);

                const tempDate: any = {};
                dates.map((dt: any) => {
                    if (tempDate[dt.channelId]) {
                        tempDate[dt.channelId].push(dt);
                    } else {
                        tempDate[dt.channelId] = [dt];
                    }
                });
                setDate(tempDate);

                const tempThread: any = {};
                threads.map((t: any) => {
                    if (tempThread[t.channelId]) {
                        tempThread[t.channelId].push(t);
                    } else {
                        tempThread[t.channelId] = [t];
                    }
                });
                setThread(tempThread);

                setLoading(false);
            }
        })();
    }, [scores, attendances, dates, threads]);

    /**
     * @description Fetches Performance report for User
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                const server = fetchAPI(user._id);
                server
                    .query({
                        query: getPerformanceReport,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.user.getPerformanceReport) {
                            setScores(res.data.user.getPerformanceReport);
                            setFetchingScores(false);
                        }
                    })
                    .catch(err => {
                        setFetchingScores(false);
                    });
                server
                    .query({
                        query: getAttendancesByUser,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.attendance.getAttendancesByUser) {
                            setAttendances(res.data.attendance.getAttendancesByUser);
                            setFetchingAttendance(false);
                        }
                    })
                    .catch(err => {
                        setFetchingAttendance(false);
                    });
                server
                    .query({
                        query: getAllPastDates,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.date.getPastDates) {
                            setDates(res.data.date.getPastDates);
                            setFetchingDates(false);
                        }
                    })
                    .catch(err => {
                        setFetchingDates(false);
                    });
                server
                    .query({
                        query: findThreadsByUserId,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.thread.findByUserId) {
                            setThreads(res.data.thread.findByUserId);
                            setFetchingThreads(false);
                        }
                    })
                    .catch(err => {
                        setFetchingThreads(false);
                    });
            }
        })();
    }, []);

    if (loading || fetchingScores || fetchingAttendance || fetchingDates || fetchingThreads) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    alignSelf: 'center',
                    paddingVertical: 100
                }}>
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    // MAIN RETURN

    return (
        <View
            style={{
                width: '100%',
                // maxWidth: 900,
                alignSelf: 'center',
                backgroundColor: '#fff',
                paddingBottom: 25,
            }}>
            {props.activeTab === 'meetings' ? (
                <AttendanceList
                    channelId={props.channelId}
                    channelCreatedBy={props.channelCreatedBy}
                    channelColor={props.colorCode}
                />
            ) : null}
            {props.activeTab === 'meetings' ? null : (
                <Grades
                    channelId={props.channelId}
                    channelCreatedBy={props.channelCreatedBy}
                    filterChoice={props.channelName}
                    openCueFromGrades={(cueId: string) => {
                        props.openCueFromGrades(props.channelId, cueId, props.channelCreatedBy);
                    }}
                    activeTab={props.activeTab}
                    channelColor={props.colorCode}
                    report={score}
                    attendance={attendance}
                    thread={thread}
                    date={date}
                    exportScores={props.exportScores}
                    setExportScores={props.setExportScores}
                />
            )}
        </View>
    );
};

export default Performance;
