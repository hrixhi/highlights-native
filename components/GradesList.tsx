// REACT
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Dimensions, TextInput, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import moment from 'moment';
import useDynamicRefs from 'use-dynamic-refs';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from '../components/CustomTextInput';
import * as Progress from 'react-native-progress';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';

import GradesSheet from './GradesSheet';
import { paddingResponsive } from '../helpers/paddingHelper';
import { disableEmailId } from '../constants/zoomCredentials';

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores));
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues));
    const [scores, setScores] = useState<any[]>(unparsedScores);
    const [cues, setCues] = useState<any[]>(
        unparsedCues.sort((a: any, b: any) => {
            return a.deadline < b.deadline ? -1 : 1;
        })
    );
    const styles = stylesObject(props.isOwner);
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [activeCueId, setActiveCueId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeScore, setActiveScore] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Deadline, Name, Status
    const [sortByOption, setSortByOption] = useState('Deadline');

    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    // Dynamic refs
    const [getRef, setRef] = useDynamicRefs();

    const itemsRef = React.useRef<Array<ScrollView | null>>([]);

    // Sticky Table
    const scrollPosition = useRef(new Animated.Value(0)).current;
    const scrollEvent = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }], {
        useNativeDriver: false,
    });

    const userColumnScrollViewRef: any = useRef(null);

    useEffect(() => {
        scrollPosition.addListener((position: any) => {
            console.log('Scroll Position ref');

            userColumnScrollViewRef.current?.scrollTo({
                y: position.value,
                animated: false,
            });

            Array.from(Array(cues.length).keys()).forEach((_, ind: number) => {
                if (ind === 0) return;

                console.log('Index', ind);
                const currRef: any = itemsRef.current[ind];

                console.log('Curr ref', currRef);

                currRef.scrollTo({
                    y: position.value,
                    animated: false,
                });
            });

            return () => {
                scrollPosition.removeAllListeners();
            };
        });
    }, [cues]);

    // console.log('Ref 10', getRef('10'));
    console.log('ItemRef 10', itemsRef.current[10]);

    // HOOKS

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (studentSearch === '') {
            setScores(JSON.parse(JSON.stringify(props.scores)));
        } else {
            const allStudents = JSON.parse(JSON.stringify(props.scores));

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setScores(matches);
        }
    }, [studentSearch]);

    /**
     * @description Prepare export data for Grades
     */
    useEffect(() => {
        if (props.scores.length === 0 || cues.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [''];

        cues.forEach((cue) => {
            const { title } = htmlStringParser(cue.cue);

            row1.push(`${title} (${cue.gradeWeight ? cue.gradeWeight.toString() : '0'}%)`);
        });

        row1.push('Total');

        exportAoa.push(row1);

        scores.forEach((score: any) => {
            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.releaseSubmission) {
                    if (!s.submittedAt || !s.graded) {
                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight);
                    } else {
                        totalPoints += Number(s.gradeWeight) * Number(s.score);
                        totalScore += Number(s.gradeWeight);
                    }
                }
            });

            let userRow = [];

            userRow.push(score.fullName);

            cues.forEach((cue) => {
                const scoreObject = score.scores.find((s: any) => {
                    return s.cueId.toString().trim() === cue._id.toString().trim();
                });

                if (scoreObject && scoreObject.graded) {
                    userRow.push(scoreObject.score);
                } else {
                    userRow.push('-');
                }
            });

            const pointsToAdd =
                totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '') + '%' : '0';

            // Add Total here
            userRow.push(pointsToAdd);

            exportAoa.push(userRow);
        });

        setExportAoa(exportAoa);
    }, [scores, cues]);

    useEffect(() => {
        if (sortByOption === 'Name') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const { title: aTitle } = htmlStringParser(a.cue);
                const { title: bTitle } = htmlStringParser(b.cue);

                if (aTitle < bTitle) {
                    return sortByOrder ? -1 : 1;
                } else if (aTitle > bTitle) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Weight') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aGradeWeight = Number(a.gradeWeight);
                const bGradeWeight = Number(b.gradeWeight);

                if (aGradeWeight < bGradeWeight) {
                    return sortByOrder ? 1 : -1;
                } else if (aGradeWeight > bGradeWeight) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Status') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (
                    scoreObjectA &&
                    scoreObjectA.score &&
                    scoreObjectA.graded &&
                    scoreObjectB &&
                    (!scoreObjectB.score || !scoreObjectB.graded)
                ) {
                    return sortByOrder ? 1 : -1;
                } else if (
                    scoreObjectA &&
                    (!scoreObjectA.score || !scoreObjectA.graded) &&
                    scoreObjectB &&
                    scoreObjectB.score &&
                    scoreObjectB.graded
                ) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (scoreObjectA && scoreObjectA.submittedAt && scoreObjectB && !scoreObjectB.submittedAt) {
                    return sortByOrder ? -1 : 1;
                } else if (scoreObjectA && !scoreObjectA.submittedAt && scoreObjectB && scoreObjectB.submittedAt) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (scoreObjectA && !scoreObjectB) {
                    return -1;
                } else if (scoreObjectB && !scoreObjectA) {
                    return 1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Deadline') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aDate = new Date(a.deadline);
                const bDate = new Date(b.deadline);

                if (aDate < bDate) {
                    return sortByOrder ? -1 : 1;
                } else if (aDate > bDate) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        }
    }, [sortByOption, sortByOrder, props.cues]);

    function getTimeRemaining(endtime: string) {
        const total = Date.parse(endtime) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return (
                days + ' day' + (days === 1 ? '' : 's') + ', ' + hours + ' hour' + (hours === 1 ? '' : 's') + ' left'
            );
        } else if (hours > 0) {
            return (
                hours +
                ' hour' +
                (hours === 1 ? '' : 's') +
                ', ' +
                minutes +
                ' minute' +
                (minutes === 1 ? '' : 's') +
                ' left'
            );
        } else {
            return minutes + ' minutes left';
        }
    }

    /**
     * @description Handles exporting of grades into Spreadsheet
     */
    const exportGrades = async () => {
        try {
            const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const fileExtension = '.xlsx';

            const ws = XLSX.utils.aoa_to_sheet(exportAoa);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Grades ');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

            const uri = FileSystem.cacheDirectory + 'grades.xlsx';
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'MyWater data',
                UTI: 'com.microsoft.excel.xlsx',
            });
        } catch (e) {
            alert('Failed to export grades. Try again.');
            console.log('Error', e);
        }
    };

    /**
     * @description Handles modifying grade
     */
    const modifyGrade = () => {
        props.modifyGrade(activeCueId, activeUserId, activeScore);
        setActiveCueId('');
        setActiveUserId('');
        setActiveScore('');
    };

    useEffect(() => {
        if (props.exportScores) {
            exportGrades();
            props.setExportScores(false);
        }
    }, [props.exportScores]);

    /**
     * @description Renders export button
     */
    const renderExportButton = () => {
        return (
            <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        justifyContent: 'flex-end',
                        width: '100%',
                        backgroundColor: '#fff',
                        marginBottom: 20,
                    }}
                >
                    {scores.length === 0 || cues.length === 0 || !props.isOwner ? null : (
                        <TouchableOpacity
                            onPress={() => {
                                exportGrades();
                            }}
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                marginRight: 10,
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: '#007AFF',
                                    fontSize: 12,
                                    borderColor: '#007AFF',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    textTransform: 'uppercase',
                                }}
                            >
                                EXPORT
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderTabs = () => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'center',
                    paddingBottom: 10,
                    paddingTop: Dimensions.get('window').width < 768 ? 10 : 20,
                }}
            >
                <TouchableOpacity
                    style={activeTab === 'overview' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('overview');
                    }}
                >
                    <Text style={activeTab === 'overview' ? styles.selectedText : styles.unselectedText}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={activeTab !== 'overview' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('scores');
                    }}
                >
                    <Text style={activeTab !== 'overview' ? styles.selectedText : styles.unselectedText}>
                        Submissions
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderPerformanceOverview = () => {
        const grade = props.report[props.channelId] ? props.report[props.channelId].score : 0;
        const progress = props.report[props.channelId] ? Number(props.report[props.channelId].total) : 0;
        const totalAssessments = props.report[props.channelId] ? props.report[props.channelId].totalAssessments : 0;
        const submitted = props.report[props.channelId] ? props.report[props.channelId].submittedAssessments : 0;
        const notSubmitted = totalAssessments - submitted;
        const late = props.report[props.channelId] ? props.report[props.channelId].lateAssessments : 0;
        const graded = props.report[props.channelId] ? props.report[props.channelId].gradedAssessments : 0;
        const attended = props.attendance[props.channelId] ? props.attendance[props.channelId].length : 0;
        const totalMeetings = props.date[props.channelId] ? props.date[props.channelId].length : 0;
        const totalPosts = props.thread[props.channelId] ? props.thread[props.channelId].length : 0;
        const upcomingDeadline =
            props.report[props.channelId] && props.report[props.channelId].upcomingAssessmentDate !== ''
                ? moment(new Date(props.report[props.channelId].upcomingAssessmentDate)).format('MMM Do, h:mma')
                : '';

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    padding: 20,
                    marginVertical: 30,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                }}
            >
                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                            }}
                        >
                            Grade
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                            }}
                        >
                            {grade}%
                        </Text>
                    </View>

                    <View
                        style={{
                            maxWidth: 200,
                            paddingTop: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Progress
                            </Text>
                            <View
                                style={{
                                    paddingTop: 7,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    // width: 200,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 20,
                                        paddingBottom: 5,
                                    }}
                                >
                                    {progress}%
                                </Text>

                                {progress > 0 && Dimensions.get('window').width >= 768 ? (
                                    <Progress.Bar
                                        progress={progress / 100}
                                        width={200}
                                        color={progress >= 100 ? '#35AC78' : '#007AFF'}
                                    />
                                ) : null}
                            </View>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                            }}
                        >
                            Next submission
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                                textAlign: 'center',
                            }}
                        >
                            {upcomingDeadline !== '' ? upcomingDeadline : 'N/A'}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                            }}
                        >
                            Total Assessments
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                            }}
                        >
                            {totalAssessments}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                            }}
                        >
                            Not Submitted{' '}
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                            }}
                        >
                            {notSubmitted}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            // width: 200,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                // paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Submitted{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {submitted}
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Late{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {late}
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Graded{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {graded}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderScoresTableStudent = () => {
        return (
            <View
                style={{
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '33%' : '25%',
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
                                if (sortByOption !== 'Name') {
                                    setSortByOption('Name');
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
                                Assessment
                            </Text>
                            {sortByOption === 'Name' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                    {Dimensions.get('window').width < 768 ? null : (
                        <View
                            style={{
                                width: '25%',
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
                                    if (sortByOption !== 'Weight') {
                                        setSortByOption('Weight');
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
                                    Weightage
                                </Text>
                                {sortByOption === 'Weight' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                    )}
                    <View
                        style={{
                            width: Dimensions.get('window').width < 768 ? '33%' : '25%',
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
                                if (sortByOption !== 'Status') {
                                    setSortByOption('Status');
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
                                Status
                            </Text>
                            {sortByOption === 'Status' ? (
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
                            width: Dimensions.get('window').width < 768 ? '33%' : '25%',
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
                                if (sortByOption !== 'Deadline') {
                                    setSortByOption('Deadline');
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
                                Deadline
                            </Text>
                            {sortByOption === 'Deadline' ? (
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
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: '#f2f2f2',
                        borderTopWidth: 0,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                    }}
                >
                    {cues.map((cue: any, ind: number) => {
                        const { title } = htmlStringParser(cue.cue);

                        const scoreObject = scores[0].scores.find((s: any) => {
                            return s.cueId.toString().trim() === cue._id.toString().trim();
                        });

                        const hasDeadlinePassed = new Date(cue.deadline) < new Date() || cue.releaseSubmission;
                        const hasLateSubmissionPassed =
                            (cue.availableUntil && new Date(cue.availableUntil) < new Date()) || cue.releaseSubmission;

                        let remaining;

                        if (!hasDeadlinePassed) {
                            let start = new Date(cue.initiateAt);
                            let end = new Date(cue.deadline);
                            const current = new Date();

                            const currentElapsed = current.valueOf() - start.valueOf();
                            const totalDifference = end.valueOf() - start.valueOf();

                            remaining = 100 - (currentElapsed / totalDifference) * 100;
                        } else if (hasDeadlinePassed && cue.availableUntil && !hasLateSubmissionPassed) {
                            let start = new Date(cue.deadline);
                            let end = new Date(cue.availableUntil);
                            const current = new Date();

                            const currentElapsed = current.getTime() - start.getTime();
                            const totalDifference = end.getTime() - start.getTime();

                            remaining = 100 - (currentElapsed / totalDifference) * 100;
                        }

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === cues.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === cues.length - 1 ? 8 : 0,
                                    borderTopColor: '#f2f2f2',
                                    borderTopWidth: ind === 0 ? 0 : 1,
                                }}
                            >
                                <View
                                    style={{
                                        width: Dimensions.get('window').width < 768 ? '33%' : '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        flexDirection: 'column',
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!scoreObject || !scoreObject.cueId) return;

                                            props.openCueFromGrades(cue._id);
                                        }}
                                        disabled={!scoreObject || !scoreObject.cueId}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                textAlign: 'center',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                paddingTop: 7,
                                            }}
                                        >
                                            {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {Dimensions.get('window').width < 768 ? null : (
                                    <View
                                        style={{
                                            width: Dimensions.get('window').width < 768 ? '33%' : '25%',
                                            padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        }}
                                    >
                                        <View>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    textAlign: 'center',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                <View
                                    style={{
                                        width: Dimensions.get('window').width < 768 ? '33%' : '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {scoreObject && !scoreObject.submittedAt ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor: '#f94144',
                                            }}
                                        />
                                    ) : scoreObject && scoreObject !== undefined ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor:
                                                    scoreObject.graded &&
                                                    scoreObject.score &&
                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline)
                                                        ? '#f3722c'
                                                        : '#35AC78',
                                            }}
                                        />
                                    ) : null}
                                    {!scoreObject || !scoreObject.submittedAt ? (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {scoreObject &&
                                            scoreObject !== undefined &&
                                            scoreObject.graded &&
                                            scoreObject.score &&
                                            scoreObject.score.replace(/\.0+$/, '')
                                                ? scoreObject.score + '%'
                                                : !scoreObject || !scoreObject.cueId
                                                ? 'N/A'
                                                : 'Not Submitted'}
                                        </Text>
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                color:
                                                    scoreObject &&
                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline)
                                                        ? '#f3722c'
                                                        : '#000000',
                                            }}
                                        >
                                            {scoreObject &&
                                            scoreObject !== undefined &&
                                            scoreObject.graded &&
                                            scoreObject.score
                                                ? scoreObject.score.replace(/\.0+$/, '') + '%'
                                                : scoreObject &&
                                                  new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline)
                                                ? 'Late'
                                                : 'Submitted'}
                                        </Text>
                                    )}
                                    {scoreObject &&
                                    scoreObject.submittedAt &&
                                    scoreObject.graded &&
                                    scoreObject.score &&
                                    new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline) ? (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                color: '#f3722c',
                                                marginLeft: 5,
                                            }}
                                        >
                                            (Late)
                                        </Text>
                                    ) : null}
                                </View>

                                <View
                                    style={{
                                        width: Dimensions.get('window').width < 768 ? '33%' : '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 0,
                                    }}
                                >
                                    {hasDeadlinePassed && (!cue.availableUntil || hasLateSubmissionPassed) ? (
                                        <View>
                                            {cue.availableUntil ? (
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                textAlign: 'center',
                                                                width: '100%',
                                                            }}
                                                        >
                                                            {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            paddingTop: 10,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                textAlign: 'center',
                                                                width: '100%',
                                                                fontFamily: 'Inter',
                                                            }}
                                                        >
                                                            Late:{' '}
                                                            <Text
                                                                style={{
                                                                    fontFamily: 'overpass',
                                                                }}
                                                            >
                                                                {moment(new Date(cue.availableUntil)).format(
                                                                    'MMM Do, h:mm a'
                                                                )}
                                                            </Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                </Text>
                                            )}
                                        </View>
                                    ) : !hasDeadlinePassed ? (
                                        <View
                                            style={{
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    width: '100%',
                                                    fontSize: 14,
                                                    // textAlign: 'center',
                                                    paddingBottom: 10,
                                                }}
                                            >
                                                {getTimeRemaining(cue.deadline)}
                                            </Text>
                                            {Dimensions.get('window').width < 768 ? null : (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Progress.Bar
                                                        progress={remaining ? remaining / 100 : 0}
                                                        width={150}
                                                        color={'#007AFF'}
                                                        style={{ transform: [{ rotateY: '180deg' }] }}
                                                    />
                                                </View>
                                            )}
                                            {Dimensions.get('window').width < 768 ? null : (
                                                <View
                                                    style={{
                                                        marginTop: 10,
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.initiateAt)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            )}
                                            {Dimensions.get('window').width < 768 ? (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    ) : cue.availableUntil && !hasLateSubmissionPassed ? (
                                        <View
                                            style={{
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    width: '100%',
                                                    fontSize: 14,
                                                    // textAlign: 'center',
                                                    paddingBottom: 10,
                                                }}
                                            >
                                                Late submission available. {getTimeRemaining(cue.availableUntil)}
                                            </Text>
                                            {Dimensions.get('window').width < 768 ? null : (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Progress.Bar
                                                        progress={remaining ? remaining / 100 : 0}
                                                        width={150}
                                                        color={'#FFC107'}
                                                        style={{ transform: [{ rotateY: '180deg' }] }}
                                                    />
                                                </View>
                                            )}
                                            {/*  */}
                                            {Dimensions.get('window').width < 768 ? null : (
                                                <View
                                                    style={{
                                                        marginTop: 10,
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.availableUntil)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            )}
                                            {Dimensions.get('window').width < 768 ? (
                                                <Text
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {moment(new Date(cue.availableUntil)).format('MMM Do, h:mm a')}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderStudentView = () => {
        return (
            <View
                style={{
                    width: '100%',
                    marginBottom: Dimensions.get('window').width < 768 ? 75 : 0,
                    paddingHorizontal: paddingResponsive(),
                }}
            >
                {renderPerformanceOverview()}
                {renderScoresTableStudent()}
            </View>
        );
    };

    console.log('Scores', scores);

    const renderInstructorView = () => {
        return (
            <GradesSheet
                key={cues.length.toString() + scores.length.toString()}
                scores={scores}
                cues={cues}
                studentSearch={studentSearch}
                setStudentSearch={setStudentSearch}
                //
                activeCueId={activeCueId}
                activeUserId={activeUserId}
                activeScore={activeScore}
                setActiveCueId={setActiveCueId}
                setActiveUserId={setActiveUserId}
                setActiveScore={setActiveScore}
            />
        );

        return (
            <View style={{ maxHeight: 500 }}>
                <View style={{ flexDirection: 'row' }}>
                    {/* Search Header */}

                    {/* Users Scrollview */}
                    <ScrollView
                        ref={userColumnScrollViewRef}
                        onScroll={scrollEvent}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        bounces={false}
                        style={{
                            marginTop: 90,
                            borderRightColor: '#ccc',
                            borderRightWidth: 1,
                            zIndex: 2,
                        }}
                        contentContainerStyle={{
                            borderRightColor: '#ccc',
                            borderRightWidth: 1,
                            zIndex: 2,
                            backgroundColor: '#f2f2f2',
                        }}
                    >
                        {scores.map((score: any, row: number) => {
                            return (
                                <View
                                    style={{
                                        height: 90,
                                        width: 150,
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
                                            uri: score.avatar
                                                ? score.avatar
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                        }}
                                    >
                                        {score.fullName}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                    {/*  */}
                    <ScrollView horizontal bounces={false}>
                        {cues.map((cue: any, col: number) => {
                            const { title } = htmlStringParser(cue.cue);

                            return (
                                <View
                                    style={{
                                        width: 120,
                                    }}
                                >
                                    {/* Cue Header */}
                                    <TouchableOpacity
                                        style={{
                                            width: 120,
                                            height: 90,
                                            justifyContent: 'center',
                                        }}
                                        key={col.toString()}
                                        onPress={() => props.openCueFromGrades(cue._id)}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: '#000000',
                                                marginBottom: 5,
                                            }}
                                        >
                                            {new Date(cue.deadline).toString().split(' ')[1] +
                                                ' ' +
                                                new Date(cue.deadline).toString().split(' ')[2]}
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                                marginBottom: 5,
                                                textAlignVertical: 'center',
                                            }}
                                            numberOfLines={2}
                                            ellipsizeMode="tail"
                                        >
                                            {title}
                                        </Text>
                                        <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000' }}>
                                            {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Individual Cue Scores */}
                                    <ScrollView
                                        ref={(el: ScrollView | null) => (itemsRef.current[col] = el)}
                                        onScroll={scrollEvent}
                                        showsVerticalScrollIndicator={false}
                                        scrollEventThrottle={16}
                                        bounces={false}
                                        style={{}}
                                    >
                                        {scores.map((score: any, row: number) => {
                                            const scoreObject = score.scores.find((s: any) => {
                                                return s.cueId.toString().trim() === cue._id.toString().trim();
                                            });

                                            if (
                                                scoreObject &&
                                                activeCueId === scoreObject.cueId &&
                                                activeUserId === score.userId
                                            ) {
                                                return (
                                                    <View
                                                        style={{
                                                            width: 120,
                                                            height: 90,
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                flexDirection: 'row',
                                                                justifyContent: 'flex-end',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <TextInput
                                                                value={activeScore}
                                                                placeholder={' / 100'}
                                                                onChangeText={(val) => {
                                                                    setActiveScore(val);
                                                                }}
                                                                style={{
                                                                    width: '50%',
                                                                    marginRight: 5,
                                                                    padding: 8,
                                                                    borderBottomColor: '#f2f2f2',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 12,
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    modifyGrade();
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="checkmark-circle-outline"
                                                                    size={17}
                                                                    style={{ marginRight: 5 }}
                                                                    color={'#8bc34a'}
                                                                />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setActiveCueId('');
                                                                    setActiveUserId('');
                                                                    setActiveScore('');
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="close-circle-outline"
                                                                    size={17}
                                                                    color={'#f94144'}
                                                                />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <TouchableOpacity
                                                    disabled={!props.isOwner}
                                                    style={{
                                                        width: 120,
                                                        height: 90,
                                                        justifyContent: 'center',
                                                    }}
                                                    key={row.toString() + '-' + col.toString()}
                                                    onPress={() => {
                                                        if (!scoreObject) return;

                                                        setActiveCueId(scoreObject.cueId);
                                                        setActiveUserId(score.userId);
                                                        setActiveScore(scoreObject.score);
                                                    }}
                                                >
                                                    {!scoreObject || !scoreObject.submittedAt ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color: '#f94144',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score.replace(/\.0+$/, '')
                                                                ? scoreObject.score
                                                                : !scoreObject || !scoreObject.cueId
                                                                ? 'N/A'
                                                                : 'Missing'}
                                                        </Text>
                                                    ) : (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color:
                                                                    scoreObject &&
                                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                                        new Date(cue.deadline)
                                                                        ? '#f3722c'
                                                                        : '#000000',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score
                                                                ? scoreObject.score.replace(/\.0+$/, '')
                                                                : scoreObject &&
                                                                  new Date(parseInt(scoreObject.submittedAt)) >=
                                                                      new Date(cue.deadline)
                                                                ? 'Late'
                                                                : 'Submitted'}
                                                        </Text>
                                                    )}

                                                    {scoreObject &&
                                                    scoreObject !== undefined &&
                                                    scoreObject.score &&
                                                    scoreObject.graded &&
                                                    (new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline) ||
                                                        !scoreObject.submittedAt) ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color: !scoreObject.submittedAt ? '#f94144' : '#f3722c',
                                                                marginTop: 5,
                                                                borderWidth: 0,
                                                                borderColor: !scoreObject.submittedAt
                                                                    ? '#f94144'
                                                                    : '#f3722c',
                                                                borderRadius: 10,
                                                                width: 60,
                                                                alignSelf: 'center',
                                                            }}
                                                        >
                                                            {!scoreObject.submittedAt ? '(Missing)' : '(Late)'}
                                                        </Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderInstructorViewOld = () => {
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
            >
                <ScrollView
                    showsHorizontalScrollIndicator={props.isOwner ? true : false}
                    horizontal={props.isOwner ? true : false}
                    showsVerticalScrollIndicator={props.isOwner ? false : true}
                    contentContainerStyle={{
                        flexDirection: props.isOwner ? 'column' : 'row',
                        alignItems: 'center',
                    }}
                    nestedScrollEnabled={true}
                >
                    <View
                        style={{
                            minHeight: 70,
                            flexDirection: props.isOwner ? 'row' : 'column',
                            overflow: 'hidden',
                            borderBottomWidth:
                                (!props.isOwner && Dimensions.get('window').width) || props.isOwner < 768 ? 1 : 0,
                            borderBottomColor: '#f2f2f2',
                        }}
                        key={'-'}
                    >
                        {props.isOwner ? (
                            <View style={styles.col} key={'0,0'}>
                                <TextInput
                                    value={studentSearch}
                                    onChangeText={(val: string) => setStudentSearch(val)}
                                    placeholder={'Search'}
                                    placeholderTextColor={'#1F1F1F'}
                                    style={{
                                        width: '100%',
                                        marginRight: 5,
                                        padding: 8,
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                        fontSize: 15,
                                    }}
                                />
                            </View>
                        ) : null}
                        {cues.length === 0 ? null : (
                            <View style={styles.col} key={'total'}>
                                <View style={{ height: 10, marginBottom: 5 }} />
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
                                {/* <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                100%
                            </Text> */}
                            </View>
                        )}
                        {cues.map((cue: any, col: number) => {
                            const { title } = htmlStringParser(cue.cue);
                            return (
                                <TouchableOpacity
                                    style={styles.col}
                                    key={col.toString()}
                                    onPress={() => props.openCueFromGrades(cue._id)}
                                >
                                    <Text
                                        style={{ textAlign: 'center', fontSize: 12, color: '#000000', marginBottom: 5 }}
                                    >
                                        {new Date(cue.deadline).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(cue.deadline).toString().split(' ')[2]}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginBottom: 5,
                                            textAlignVertical: 'center',
                                        }}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {title}
                                    </Text>
                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000' }}>
                                        {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Search results empty */}
                    {scores.length === 0 ? (
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
                        <View>
                            {scores.map((score: any, row: number) => {
                                let totalPoints = 0;
                                let totalScore = 0;
                                score.scores.map((s: any) => {
                                    if (s.releaseSubmission) {
                                        if (!s.submittedAt || !s.graded) {
                                            // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                            totalScore += Number(s.gradeWeight);
                                        } else {
                                            totalPoints += Number(s.gradeWeight) * Number(s.score);
                                            totalScore += Number(s.gradeWeight);
                                        }
                                    }
                                });

                                return (
                                    <View style={styles.row} key={row}>
                                        {props.isOwner ? (
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
                                                        uri: score.avatar
                                                            ? score.avatar
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
                                                    {score.fullName}
                                                </Text>
                                            </View>
                                        ) : null}
                                        {cues.length === 0 ? null : (
                                            <View style={styles.col} key={'total'}>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 13,
                                                        color: '#000000',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {totalScore !== 0
                                                        ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '')
                                                        : '0'}
                                                    %
                                                </Text>
                                            </View>
                                        )}
                                        {cues.map((cue: any, col: number) => {
                                            const scoreObject = score.scores.find((s: any) => {
                                                return s.cueId.toString().trim() === cue._id.toString().trim();
                                            });

                                            if (
                                                scoreObject &&
                                                activeCueId === scoreObject.cueId &&
                                                activeUserId === score.userId
                                            ) {
                                                return (
                                                    <View style={styles.col}>
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                flexDirection: 'row',
                                                                justifyContent: 'flex-end',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <TextInput
                                                                value={activeScore}
                                                                placeholder={' / 100'}
                                                                onChangeText={(val) => {
                                                                    setActiveScore(val);
                                                                }}
                                                                style={{
                                                                    width: '50%',
                                                                    marginRight: 5,
                                                                    padding: 8,
                                                                    borderBottomColor: '#f2f2f2',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 12,
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    modifyGrade();
                                                                }}
                                                                disabled={props.user.email === disableEmailId}
                                                            >
                                                                <Ionicons
                                                                    name="checkmark-circle-outline"
                                                                    size={17}
                                                                    style={{ marginRight: 5 }}
                                                                    color={'#8bc34a'}
                                                                />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setActiveCueId('');
                                                                    setActiveUserId('');
                                                                    setActiveScore('');
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="close-circle-outline"
                                                                    size={17}
                                                                    color={'#f94144'}
                                                                />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <TouchableOpacity
                                                    disabled={!props.isOwner}
                                                    style={styles.col}
                                                    key={row.toString() + '-' + col.toString()}
                                                    onPress={() => {
                                                        if (!scoreObject) return;

                                                        setActiveCueId(scoreObject.cueId);
                                                        setActiveUserId(score.userId);
                                                        setActiveScore(scoreObject.score);
                                                    }}
                                                >
                                                    {!scoreObject || !scoreObject.submittedAt ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color: '#f94144',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score.replace(/\.0+$/, '')
                                                                ? scoreObject.score
                                                                : !scoreObject || !scoreObject.cueId
                                                                ? 'N/A'
                                                                : 'Missing'}
                                                        </Text>
                                                    ) : (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color:
                                                                    scoreObject &&
                                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                                        new Date(cue.deadline)
                                                                        ? '#f3722c'
                                                                        : '#000000',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score
                                                                ? scoreObject.score.replace(/\.0+$/, '')
                                                                : scoreObject &&
                                                                  new Date(parseInt(scoreObject.submittedAt)) >=
                                                                      new Date(cue.deadline)
                                                                ? 'Late'
                                                                : 'Submitted'}
                                                        </Text>
                                                    )}

                                                    {scoreObject &&
                                                    scoreObject !== undefined &&
                                                    scoreObject.score &&
                                                    scoreObject.graded &&
                                                    (new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline) ||
                                                        !scoreObject.submittedAt) ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 13,
                                                                color: !scoreObject.submittedAt ? '#f94144' : '#f3722c',
                                                                marginTop: 5,
                                                                borderWidth: 0,
                                                                borderColor: !scoreObject.submittedAt
                                                                    ? '#f94144'
                                                                    : '#f3722c',
                                                                borderRadius: 10,
                                                                width: 60,
                                                                alignSelf: 'center',
                                                            }}
                                                        >
                                                            {!scoreObject.submittedAt ? '(Missing)' : '(Late)'}
                                                        </Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </ScrollView>
            </View>
        );
    };

    // MAIN RETURN
    return (
        <ScrollView
            style={{
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
                paddingTop: 10,
            }}
            nestedScrollEnabled={true}
        >
            {/* {renderExportButton()} */}
            {props.scores.length === 0 || cues.length === 0 ? (
                <View style={{ backgroundColor: '#fff' }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 18,
                            paddingVertical: 40,
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                        }}
                    >
                        {cues.length === 0
                            ? props.isOwner
                                ? PreferredLanguageText('noGraded')
                                : PreferredLanguageText('noGradedStudents')
                            : PreferredLanguageText('noStudents')}
                    </Text>
                </View>
            ) : props.isOwner ? (
                // <View
                //     style={{
                //         width: '100%',
                //         backgroundColor: 'white',
                //         maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                //         maxWidth: 1024,
                //         borderRadius: 2,
                //         // borderWidth: 1,
                //         marginTop: 25,
                //         // borderColor: '#cccccc',
                //         zIndex: 5000000,
                //         flexDirection: 'column',
                //         justifyContent: props.isOwner ? 'flex-start' : 'center',
                //         alignItems: props.isOwner ? 'flex-start' : 'center',
                //         position: 'relative',
                //         overflow: 'scroll',
                //     }}
                //     // key={JSON.stringify(props.scores)}
                // >
                //     {renderInstructorView()}
                // </View>
                renderInstructorViewOld()
            ) : (
                renderStudentView()
            )}
        </ScrollView>
    );
};

export default GradesList;

const stylesObject: any = (isOwner: any) =>
    StyleSheet.create({
        row: {
            minHeight: 70,
            flexDirection: isOwner ? 'row' : 'column',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: (!isOwner && Dimensions.get('window').width < 768) || isOwner ? 1 : 0,
        },
        col: {
            height: isOwner ? 'auto' : 90,
            paddingBottom: isOwner ? 0 : 10,
            width: isOwner ? (Dimensions.get('window').width < 768 ? 120 : 120) : 180,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: 7,
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: isOwner || Dimensions.get('window').width < 768 ? 0 : 1,
        },
        selectedText: {
            fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
            color: '#fff',
            backgroundColor: '#000',
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            fontFamily: 'inter',
            textTransform: 'uppercase',
        },
        unselectedText: {
            fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
            color: '#000',
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            // backgroundColor: '#000',
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
            fontWeight: 'bold',
        },
        selectedButton: {
            backgroundColor: '#000',
            borderRadius: 20,
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            maxHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
            marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
        },
        unselectedButton: {
            // backgroundColor: '#000',
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            maxHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            borderRadius: 20,
            color: '#000000',
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
            marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
        },
    });
