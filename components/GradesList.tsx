// REACT
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Dimensions,
    TextInput,
    Animated,
    Image,
    Switch,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import moment from 'moment';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import * as Progress from 'react-native-progress';
// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';

import { paddingResponsive } from '../helpers/paddingHelper';
import { disableEmailId } from '../constants/zoomCredentials';
import NewAssignmentModal from './NewAssignmentModal';

import Alert from './Alert';
import {
    getStudentAnalytics,
    getGradebookInstructor,
    getAssignmentAnalytics,
    getCourseStudents,
    getStandardsBasedGradingScale,
    getStandardsGradebook,
    getStandardsInsights,
    handleUpdateGradebookScore,
    getCourseGradingScale,
    handleReleaseSubmission,
    getGradebookStudent,
    getStandardsGradebookStudent,
    getStandardsCategories,
} from '../graphql/QueriesAndMutations';

import {
    VictoryPie,
    VictoryLabel,
    VictoryTooltip,
    VictoryChart,
    VictoryBar,
    Bar,
    VictoryStack,
    VictoryAxis,
    VictoryLine,
    VictoryVoronoiContainer,
} from 'victory-native';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import DropDownPicker from 'react-native-dropdown-picker';
import { useAppContext } from '../contexts/AppContext';
import { useApolloClient } from '@apollo/client';

const masteryColors = {
    '': '#f94144',
    '0': '#f9c74f',
    '1': '#f3722c',
    '2': '#f8961e',
    '3': '#35ac78',
    '4': '#0098f7',
    '5': '#006aff',
};

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId } = useAppContext();

    const [exportAoa, setExportAoa] = useState<any[]>();
    const [activeModifyId, setActiveModifyId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeModifyEntryType, setActiveModifyEntryType] = useState('');

    const [standardModifyEntry, setStandardModifyEntry] = useState<any>(undefined);
    const [standardUserScore, setStandardUserScore] = useState<any>(undefined);
    const [modifyStandardOption, setModifyStandardOption] = useState('newEntry');
    const [selectedModifyStandard, setSelectedModifyStandard] = useState<any>('');

    const [activeScore, setActiveScore] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentSearchStandard, setStudentSearchStandard] = useState('');

    // GRADEBOOK
    const [selectedGradebookMode, setSelectedGradebookMode] = useState('assignments');
    const [isFetchingGradebook, setIsFetchingGradebook] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [instructorGradebook, setIntructorGradebook] = useState<any>(undefined);
    const [gradebookEntries, setGradebookEntries] = useState<any[]>([]);
    const [gradebookUsers, setGradebookUsers] = useState<any[]>([]);
    const [courseStudents, setCourseStudents] = useState<any[]>([]);
    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);

    // Deadline, Name, Status
    const [sortByOption, setSortByOption] = useState('Deadline');
    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    // STANDARDS SORT BY OPTIONS
    const [sortByOptionStandard, setSortByOptionStandard] = useState('Standard');

    // STUDENT GRADEBOOK
    const [isFetchingStudentGradebook, setIsFetchingStudentGradebook] = useState(false);
    const [studentGradebook, setStudentGradebook] = useState<any>(undefined);
    const [gradebookStudentEntries, setGradebookStudentEntries] = useState<any[]>([]);

    // INSTRUCTOR ANALYTICS
    const [assignmentAnalytics, setAssignmentAnalytics] = useState<any>(undefined);
    const [isFetchingAssignmentAnalytics, setIsFetchingAssignmentAnalytics] = useState(false);
    const [assignmentAnalyticsOptions, setAssignmentAnalyticsOptions] = useState<any[]>([]);
    const [assignmentAnalyticsSelected, setAssignmentAnalyticsSelected] = useState<any>(undefined);
    const [studentAnalytics, setStudentAnalytics] = useState<any>(undefined);
    const [userAnalyticsOptions, setUserAnalyticsOptions] = useState<any[]>([]);
    const [userAnalyticsSelected, setUserAnalyticsSelected] = useState(undefined);
    const [isFetchingStudentAnalytics, setIsFetchingStudentAnalytics] = useState(false);
    const [isFetchingStandardsBasedGrading, setIsFetchingStandardsBasedGrading] = useState(false);
    const [standardsBasedScale, setStandardsBasedScale] = useState(undefined);
    const [courseGradingScale, setCourseGradingScale] = useState(undefined);
    const [standardsCategories, setStandardsCategories] = useState([]);
    const [isFetchingStandardsCategories, setIsFetchingStandardsCategories] = useState(false);

    // STANDARDS
    const [newCategories, setNewCategories] = useState<string[]>([]);
    const [newStandards, setNewStandards] = useState<any[]>([
        {
            title: '',
            description: '',
            category: '',
        },
    ]);

    const [isAssignmentsDropdownOpen, setIsAssignmentsDropdownOpen] = useState(false);

    // STANDARDS GRADEBOOK
    const [isFetchingStandardsGradebook, setIsFetchingStandardsGradebook] = useState(false);
    const [instructorStandardsGradebook, setIntructorStandardsGradebook] = useState<any>(undefined);
    const [standardsGradebookEntries, setStandardsGradebookEntries] = useState<any[]>([]);
    const [standardsGradebookCategories, setStandardsGradebookCategories] = useState<any>(undefined);
    const [standardsGradebookUsers, setStandardsGradebookUsers] = useState<any[]>([]);

    // USER STANDARDS GRADEBOOK
    const [isFetchingStandardsGradebookStudent, setIsFetchingStandardsGradebookStudent] = useState(false);
    const [studentStandardsGradebook, setStudentStandardsGradebook] = useState<any>(undefined);
    const [standardsGradebookEntriesStudent, setStandardsGradebookEntriesStudent] = useState<any[]>([]);

    // SWITCH % and PTS
    const [viewGradebookTabs] = useState(['Pts', '%']);
    const [gradebookViewPoints, setGradebookViewPoints] = useState(true);

    const [categoryDropdownOptions, setCategoryDropdownOption] = useState<any[]>([]);
    const [gradeStudentsStandards, setGradeStudentsStandards] = useState<boolean>(false);

    const [isStandardsUsersDropdownOpen, setIsStandardsUsersDropdownOpen] = useState(false);
    const [isStandardsDropdownOpen, setIsStandardsDropdownOpen] = useState(false);

    // STANDARDS INSIGHTS
    const [isFetchingStandardsAnalytics, setIsFetchingStandardsAnalytics] = useState(false);
    const [standardAnalyticsSelectedUser, setStandardAnalyticsSelectedUser] = useState('');
    const [standardAnalyticsSelected, setStandardAnalyticsSelected] = useState('');
    const [standardsAnalytics, setStandardsAnalytics] = useState(undefined);
    const [standardsAnalyticsDropdownOptions, setStandardsAnalyticsDropdownOptions] = useState<any[]>([]);
    const [standardsAnalyticsUsersDropdownOptions, setStandardsAnalyticsUsersDropdownOptions] = useState<any[]>([]);

    const [assignPointsStandardDropdownOptions, setAssignPointsStandardDropdownOptions] = useState([
        {
            value: '0',
            text: 'Standard 1',
        },
    ]);
    const [assignPointsStandardSelected, setAssignPointsStandardSelected] = useState('0');
    const [newStandardsPointsScored, setNewStandardsPointsScored] = useState<any[][]>([]);
    const [masteryDropdownOptions, setMasteryDropdownOptions] = useState<any[]>([]);
    const [masteryMap, setMasteryMap] = useState(undefined);
    const [masteryPercentageMap, setMasteryPercentageMap] = useState(undefined);
    const [masteryHighest, setMasteryHighest] = useState(-1);

    // EDIT ENTRY
    const [editEntryId, setEditEntryId] = useState('');
    const [editAssignment, setEditAssignment] = useState(undefined);
    const [editStandard, setEditStandard] = useState(undefined);

    const [editStandardTitle, setEditStandardTitle] = useState('');
    const [editStandardDescription, setEditStandardDescription] = useState('');
    const [editStandardCategory, setEditStandardCategory] = useState('');

    const newEntryTabs = [
        {
            value: 'assignment',
            label: 'Assignment',
        },
        {
            value: 'standards',
            label: 'Standards',
        },
    ];

    const modifyStandardOptions = [
        {
            value: 'newEntry',
            label: 'New entry',
        },
        {
            value: 'override',
            label: 'Override',
        },
    ];

    const tabs = [
        {
            value: 'assignments',
            label: 'Assignments',
        },
        {
            value: 'standards',
            label: 'Standards',
        },
    ];

    const server = useApolloClient();

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            fetchGradebookInstructor();
            fetchCourseAssignmentsAnalytics();
            loadCourseStudents();
            fetchStandardsBasedGradingScale();
            fetchCourseGradingScale();
        } else if (props.channelId) {
            fetchGradebookStudent();
            fetchStandardsBasedGradingScale();
            fetchCourseGradingScale();
        }
    }, [props.isOwner, props.channelId]);

    useEffect(() => {
        if (assignmentAnalytics) {
            const assignments = [...assignmentAnalytics];

            assignments.sort((a: any, b: any) => {
                return a.title < b.title ? 1 : -1;
            });

            const dropdownOptions = assignments.map((x: any) => {
                return {
                    value: x.cueId ? x.cueId : x.gradebookEntryId,
                    label: x.title,
                };
            });

            setAssignmentAnalyticsOptions(dropdownOptions);

            setAssignmentAnalyticsSelected(dropdownOptions.length > 0 ? dropdownOptions[0].value : undefined);
        }
    }, [assignmentAnalytics]);

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (!instructorGradebook || !instructorGradebook.users) {
            return;
        }

        if (studentSearch === '') {
            setGradebookUsers([...instructorGradebook.users]);
        } else {
            const allStudents = [...instructorGradebook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setGradebookUsers(matches);
        }
    }, [studentSearch, instructorGradebook]);

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (!instructorStandardsGradebook || !instructorStandardsGradebook.users) {
            return;
        }

        if (studentSearchStandard === '') {
            setStandardsGradebookUsers([...instructorStandardsGradebook.users]);
        } else {
            const allStudents = [...instructorStandardsGradebook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearchStandard.toLowerCase());
            });

            setStandardsGradebookUsers(matches);
        }
    }, [studentSearchStandard, instructorStandardsGradebook]);

    useEffect(() => {
        if (standardsBasedScale && props.isOwner && props.channelId) {
            fetchStandardsBasedGradebookInstructor();
            fetchStandardsCategories();
        } else if (standardsBasedScale && props.channelId) {
            fetchStandardsBasedGradebookStudent();
            fetchStandardsCategories();
        }
    }, [standardsBasedScale, props.isOwner, props.channelId]);

    useEffect(() => {
        if (userAnalyticsSelected && props.isOwner) {
            fetchStudentAnalytics();
        }
    }, [userAnalyticsSelected, props.isOwner]);

    useEffect(() => {
        if (props.channelId && standardAnalyticsSelected && standardAnalyticsSelectedUser) {
            fetchStandardsAnalytics();
        }
    }, [standardAnalyticsSelected, standardAnalyticsSelectedUser, props.isOwner, props.channelId]);

    useEffect(() => {
        if (courseStudents) {
            const dropdownOptions = courseStudents.map((student: any) => {
                return {
                    value: student._id,
                    label: student.fullName,
                };
            });

            const dropdownSelected = courseStudents.map((student: any) => student._id);

            if (dropdownSelected.length > 0) {
                setUserAnalyticsSelected(dropdownSelected[0]);
            }

            setUserAnalyticsOptions(dropdownOptions);
        }
    }, [courseStudents]);

    useEffect(() => {
        if (!studentGradebook) return;

        if (sortByOption === 'Name') {
            const sortCues = [...studentGradebook.entries];

            sortCues.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? -1 : 1;
                } else if (a.title > b.title) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Weight') {
            const sortCues = [...studentGradebook.entries];

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

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Status') {
            const sortCues = [...studentGradebook.entries];

            sortCues.sort((a: any, b: any) => {
                if (a.score && !b.score) {
                    return sortByOrder ? 1 : -1;
                } else if (!a.score && b.score) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            sortCues.sort((a: any, b: any) => {
                if (a.submitted && !b.submitted) {
                    return sortByOrder ? -1 : 1;
                } else if (!a.submitted && b.submitted) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            // sortCues.sort((a: any, b: any) => {

            //     if (scoreObjectA && !scoreObjectB) {
            //         return -1;
            //     } else if (scoreObjectB && !scoreObjectA) {
            //         return 1;
            //     } else {
            //         return 0;
            //     }
            // });

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Deadline') {
            const sortCues = [...studentGradebook.entries];

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

            setGradebookStudentEntries(sortCues);
        }
    }, [sortByOption, sortByOrder, studentGradebook]);

    useEffect(() => {
        if (!studentStandardsGradebook) return;

        if (sortByOptionStandard === 'Standard') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? -1 : 1;
                } else if (a.title > b.title) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Category') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.category < b.category) {
                    return sortByOrder ? -1 : 1;
                } else if (a.category > b.category) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Description') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.description < b.description) {
                    return sortByOrder ? -1 : 1;
                } else if (a.description > b.description) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Mastery') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.masteryPoints && !b.masteryPoints) {
                    return sortByOrder ? -1 : 1;
                } else if (!a.masteryPoints && b.masteryPoints) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.masteryPoints && b.masteryPoints && a.masteryPoints > b.masteryPoints) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        }
    }, [sortByOption, sortByOrder, studentStandardsGradebook]);

    /**
     * @description Fetch all course students for creating new assignment and assigning scores
     */
    const loadCourseStudents = useCallback(() => {
        setIsFetchingStudents(true);
        if (props.channelId && props.channelId !== '') {
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

    const fetchGradebookInstructor = useCallback(() => {
        setIsFetchingGradebook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getGradebookInstructor,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getGradebook) {
                        setIntructorGradebook(res.data.gradebook.getGradebook);
                        setGradebookEntries(res.data.gradebook.getGradebook.entries);
                        setGradebookUsers(res.data.gradebook.getGradebook.users);
                    } else {
                        setIntructorGradebook(undefined);
                        setGradebookEntries([]);
                        setGradebookUsers([]);
                    }
                    setIsFetchingGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setIntructorGradebook(undefined);
                    setGradebookEntries([]);
                    setGradebookUsers([]);
                    setIsFetchingGradebook(false);
                });
        }
    }, []);

    const fetchGradebookStudent = useCallback(() => {
        setIsFetchingStudentGradebook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getGradebookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getGradebookStudent) {
                        setStudentGradebook(res.data.gradebook.getGradebookStudent);
                        setGradebookStudentEntries(res.data.gradebook.getGradebookStudent.entries);
                    } else {
                        setStudentGradebook(undefined);
                        setGradebookStudentEntries([]);
                    }
                    setIsFetchingStudentGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setStudentGradebook(undefined);
                    setGradebookStudentEntries([]);
                    setIsFetchingStudentGradebook(false);
                });
        }
    }, [props.channelId, userId]);

    const fetchStandardsBasedGradingScale = useCallback(() => {
        setIsFetchingStandardsBasedGrading(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsBasedGradingScale,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getStandardsBasedGradingScale) {
                        console.log('Standards Based grading', res.data.channel.getStandardsBasedGradingScale);
                        // setIntructorGradebook(res.data.gradebook.getStandardsBasedGradingScale);
                        setStandardsBasedScale(res.data.channel.getStandardsBasedGradingScale);

                        let highest = -1;
                        let map: any = {
                            '': 'Not Assigned',
                        };

                        let percentageMap: any = {
                            '': 0,
                        };

                        let points: number[] = [];

                        //
                        const scaleOptions = res.data.channel.getStandardsBasedGradingScale.range.map((level: any) => {
                            if (level.points > highest) {
                                highest = level.points;
                            }

                            map[level.points.toString()] = level.name.toString();

                            points.push(level.points);

                            return {
                                label: level.name.toString() + ' (' + level.points.toString() + ')',
                                value: level.points.toString(),
                            };
                        });

                        points.sort((a: number, b: number) => (a < b ? 1 : -1));

                        points.map((point: number) => {
                            const percentage = (point / points.length) * 100;
                            percentageMap[point.toString()] = percentage;
                        });

                        setMasteryHighest(highest);
                        setMasteryMap(map);
                        setMasteryPercentageMap(percentageMap);
                        setMasteryDropdownOptions(scaleOptions);
                    } else {
                        // setIntructorGradebook(undefined);
                        setStandardsBasedScale(undefined);
                    }
                    setIsFetchingStandardsBasedGrading(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    // Alert('Failed to fetch ');
                    // setIntructorGradebook(undefined);
                    setIsFetchingStandardsBasedGrading(false);
                });
        }
    }, [props.channelId]);

    const fetchCourseGradingScale = useCallback(async () => {
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getCourseGradingScale,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.channel.getCourseGradingScale) {
                        setCourseGradingScale(res.data.channel.getCourseGradingScale);
                    } else {
                        setCourseGradingScale(undefined);
                    }
                })
                .catch((e) => {
                    setCourseGradingScale(undefined);
                });
        }
    }, [props.channelId]);

    const fetchCourseAssignmentsAnalytics = useCallback(() => {
        setIsFetchingAssignmentAnalytics(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getAssignmentAnalytics,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getAssignmentAnalytics) {
                        setAssignmentAnalytics(res.data.gradebook.getAssignmentAnalytics);
                    } else {
                        setAssignmentAnalytics(undefined);
                    }
                    setIsFetchingAssignmentAnalytics(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch assignment analytics');
                    setAssignmentAnalytics(undefined);
                    setIsFetchingAssignmentAnalytics(false);
                });
        }
    }, []);

    const fetchStandardsBasedGradebookInstructor = useCallback(() => {
        setIsFetchingStandardsGradebook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsGradebook,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsGradebook) {
                        setIntructorStandardsGradebook(res.data.standards.getStandardsGradebook);

                        // Category Map
                        const categoryMap: any = {};

                        res.data.standards.getStandardsGradebook.entries.map((entry: any) => {
                            if (categoryMap[entry.category ? entry.category : '']) {
                                const updateEntries = [...categoryMap[entry.category ? entry.category : '']];
                                updateEntries.push(entry);
                                categoryMap[entry.category ? entry.category : ''] = updateEntries;
                            } else {
                                categoryMap[entry.category ? entry.category : ''] = [entry];
                            }
                        });

                        const categories = Object.keys(categoryMap);

                        categories.sort((a: any, b: any) => {
                            return a > b ? 1 : -1;
                        });

                        // Sort categories
                        const entries: any[] = [];

                        const categoryCountMap: any = {};

                        // Sort standards within each
                        categories.map((category: string) => {
                            const categoryEntries: any[] = categoryMap[category];

                            categoryEntries.sort((a: any, b: any) => {
                                return a.title > b.title ? 1 : -1;
                            });

                            entries.push(...categoryEntries);

                            categoryCountMap[category] = categoryMap[category].length;
                        });

                        if (entries.length > 0) {
                            const entryDropdowns: any[] = entries.map((entry: any) => {
                                return {
                                    value: entry._id,
                                    label: entry.title,
                                };
                            });

                            setStandardsAnalyticsDropdownOptions(entryDropdowns);
                            setStandardAnalyticsSelected(entries[0]._id);
                        }

                        if (res.data.standards.getStandardsGradebook.users.length > 0) {
                            console.log('selected user ', res.data.standards.getStandardsGradebook.users[0].userId);

                            const userDropdowns: any[] = res.data.standards.getStandardsGradebook.users.map(
                                (user: any) => {
                                    return {
                                        value: user.userId,
                                        label: user.fullName,
                                    };
                                }
                            );
                            setStandardsAnalyticsUsersDropdownOptions(userDropdowns);
                            setStandardAnalyticsSelectedUser(res.data.standards.getStandardsGradebook.users[0].userId);
                        }

                        setStandardsGradebookEntries(entries);
                        setStandardsGradebookCategories(categoryCountMap);
                        setStandardsGradebookUsers(res.data.standards.getStandardsGradebook.users);
                    } else {
                        setIntructorStandardsGradebook(undefined);
                        setStandardsGradebookCategories(undefined);
                        setStandardsGradebookEntries([]);
                        setStandardsGradebookUsers([]);
                    }
                    setIsFetchingStandardsGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setIntructorStandardsGradebook(undefined);
                    setStandardsGradebookEntries([]);
                    setStandardsGradebookCategories(undefined);
                    setStandardsGradebookUsers([]);
                    setIsFetchingStandardsGradebook(false);
                });
        }
    }, [props.channelId]);

    const fetchStandardsBasedGradebookStudent = useCallback(() => {
        setIsFetchingStandardsGradebookStudent(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsGradebookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsGradebookStudent) {
                        setStudentStandardsGradebook(res.data.standards.getStandardsGradebookStudent);

                        // Category Map
                        const categoryMap: any = {};

                        res.data.standards.getStandardsGradebookStudent.entries.map((entry: any) => {
                            if (categoryMap[entry.category ? entry.category : '']) {
                                const updateEntries = [...categoryMap[entry.category ? entry.category : '']];
                                updateEntries.push(entry);
                                categoryMap[entry.category ? entry.category : ''] = updateEntries;
                            } else {
                                categoryMap[entry.category ? entry.category : ''] = [entry];
                            }
                        });

                        const categories = Object.keys(categoryMap);

                        categories.sort((a: any, b: any) => {
                            return a > b ? 1 : -1;
                        });

                        // Sort categories
                        const entries: any[] = [];

                        const categoryCountMap: any = {};

                        // Sort standards within each
                        categories.map((category: string) => {
                            const categoryEntries: any[] = categoryMap[category];

                            categoryEntries.sort((a: any, b: any) => {
                                return a.title > b.title ? 1 : -1;
                            });

                            entries.push(...categoryEntries);

                            categoryCountMap[category] = categoryMap[category].length;
                        });

                        if (entries.length > 0) {
                            const entryDropdowns: any[] = entries.map((entry: any) => {
                                return {
                                    value: entry._id,
                                    label: entry.title,
                                };
                            });

                            setStandardsAnalyticsDropdownOptions(entryDropdowns);
                            setStandardAnalyticsSelected(entries[0]._id);
                        }

                        setStandardAnalyticsSelectedUser(userId);

                        setStandardsGradebookEntriesStudent(entries);
                        setStandardsGradebookCategories(categoryCountMap);
                    } else {
                        setStudentStandardsGradebook(undefined);
                        setStandardsGradebookCategories(undefined);
                        setStandardsGradebookEntriesStudent([]);
                    }
                    setIsFetchingStandardsGradebookStudent(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setStudentStandardsGradebook(undefined);
                    setStandardsGradebookEntriesStudent([]);
                    setStandardsGradebookCategories(undefined);
                    setIsFetchingStandardsGradebookStudent(false);
                });
        }
    }, [props.channelId, userId]);

    const fetchStandardsCategories = useCallback(() => {
        setIsFetchingStandardsCategories(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsCategories,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsCategories) {
                        setStandardsCategories(res.data.standards.getStandardsCategories);
                    } else {
                        setStandardsCategories([]);
                    }
                    setIsFetchingStandardsCategories(false);
                })
                .catch((e) => {
                    setStandardsCategories([]);
                    setIsFetchingStandardsCategories(false);
                });
        }
    }, []);

    const fetchStudentAnalytics = useCallback(() => {
        setIsFetchingStudentAnalytics(true);

        server
            .query({
                query: getStudentAnalytics,
                variables: {
                    channelId: props.channelId,
                    userId: userAnalyticsSelected,
                },
            })
            .then((res) => {
                if (res.data.gradebook && res.data.gradebook.getStudentScores) {
                    setStudentAnalytics(res.data.gradebook.getStudentScores);
                } else {
                    setStudentAnalytics(undefined);
                }
                setIsFetchingStudentAnalytics(false);
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to fetch students.');
                setStudentAnalytics(undefined);
                setIsFetchingStudentAnalytics(false);
            });
    }, [userAnalyticsSelected]);

    const fetchStandardsAnalytics = useCallback(() => {
        setIsFetchingStandardsAnalytics(true);

        server
            .query({
                query: getStandardsInsights,
                variables: {
                    channelId: props.channelId,
                    standardId: standardAnalyticsSelected,
                    userId: standardAnalyticsSelectedUser,
                },
            })
            .then((res) => {
                if (res.data && res.data.standards.getStandardsInsights) {
                    setStandardsAnalytics(res.data.standards.getStandardsInsights);
                } else {
                    setStandardsAnalytics(undefined);
                }
                setIsFetchingStandardsAnalytics(false);
            })
            .catch((e) => {
                console.log('Error', e);
                setStandardsAnalytics(undefined);
                setIsFetchingStandardsAnalytics(false);
            });
    }, [standardAnalyticsSelected, standardAnalyticsSelectedUser, props.isOwner, props.channelId]);

    const handleUpdateAssignmentScore = useCallback(
        async (totalPoints: number) => {
            async function updateScore() {
                server
                    .mutate({
                        mutation: handleUpdateGradebookScore,
                        variables: {
                            userId: activeUserId,
                            entryId: activeModifyId,
                            gradebookEntry: activeModifyEntryType !== 'cue',
                            score: Number(activeScore),
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.gradebook.handleUpdateGradebookScore) {
                            Alert('Updated user score successfully.');
                            // Reload gradebook
                            fetchGradebookInstructor();
                            fetchCourseAssignmentsAnalytics();
                            fetchStudentAnalytics();

                            setActiveUserId('');
                            setActiveModifyId('');
                            setActiveScore('');
                            setActiveModifyEntryType('');
                        } else {
                            Alert('Failed to update user score. Try again.');
                        }
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update user score. Try again.');
                    });
            }

            if (activeScore === '' || Number.isNaN(Number(activeScore))) {
                Alert('Enter a valid score for student.');
                return;
            }

            if (Number(activeScore) > totalPoints) {
                //
                Alert(
                    'New score is greater than the total points for the assignment.',
                    'Would you still like to proceed?',
                    [
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
                                updateScore();
                            },
                        },
                    ]
                );
            } else {
                updateScore();
            }
        },
        [activeUserId, activeModifyId, activeScore, activeModifyEntryType]
    );

    const renderStandardsInstructorView = () => {
        return (
            <ScrollView
                showsHorizontalScrollIndicator={true}
                horizontal={true}
                showsVerticalScrollIndicator={false}
                indicatorStyle={'black'}
                contentContainerStyle={{
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                nestedScrollEnabled={true}
            >
                {/* NESTED CATEGORIES */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#f8f8f8',
                            minWidth: 150,
                            maxWidth: 150,
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <TextInput
                            value={studentSearchStandard}
                            onChangeText={(val: string) => setStudentSearchStandard(val)}
                            placeholder={'Search user'}
                            placeholderTextColor={'#1F1F1F'}
                            style={{
                                width: '100%',
                                maxWidth: 200,
                                borderColor: '#f2f2f2',
                                borderWidth: 1,
                                backgroundColor: '#fff',
                                borderRadius: 24,
                                fontSize: 15,
                                paddingVertical: 8,
                                marginTop: 0,
                                paddingHorizontal: 10,
                            }}
                        />
                    </View>

                    <View>
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minHeight: 70,
                                flexDirection: 'row',
                                overflow: 'hidden',
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                            }}
                            key={'-'}
                        >
                            {Object.keys(standardsGradebookCategories).map((category: string) => {
                                return (
                                    <View
                                        style={{
                                            backgroundColor: '#f8f8f8',
                                            minWidth: 250 * standardsGradebookCategories[category],
                                            maxWidth: 250 * standardsGradebookCategories[category],
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                        key={'total'}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: '#f8f8f8',
                                                marginTop: 5,
                                                marginBottom: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'inter',
                                                    paddingRight: 8,
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {category ? category : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minHeight: 70,
                                flexDirection: 'row',
                                overflow: 'hidden',
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                            }}
                            key={'-'}
                        >
                            {/* All stanedards */}
                            {standardsGradebookEntries.map((entry: any, col: number) => {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#f8f8f8',
                                            minWidth: 250,
                                            maxWidth: 250,
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                        key={col.toString()}
                                        onPress={() => {
                                            handleEditStandardEntry(entry._id);
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: '#f8f8f8',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'inter',
                                                    paddingRight: 8,

                                                    // marginBottom: 5,
                                                    // textAlignVertical: 'center',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {entry.title}
                                            </Text>
                                            <Ionicons
                                                name={'create-outline'}
                                                size={15}
                                                color="#1f1f1f"
                                                style={{
                                                    fontFamily: 'Inter',
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
                {/* Search results empty */}
                {instructorStandardsGradebook.users.length === 0 ? (
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

                {/* Body */}
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    horizontal={false}
                    contentContainerStyle={{
                        // height: '100%',
                        width: '100%',
                    }}
                    nestedScrollEnabled={true}
                >
                    {standardsGradebookUsers.map((user: any, row: number) => {
                        return (
                            <View
                                style={{
                                    minHeight: 70,
                                    flexDirection: 'row',
                                    overflow: 'hidden',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f2f2f2',
                                }}
                            >
                                {/*  */}
                                <View
                                    style={{
                                        minWidth: 150,
                                        maxWidth: 150,
                                        padding: 10,
                                        borderRightWidth: 1,
                                        borderRightColor: '#f2f2f2',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
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

                                {standardsGradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    if (userScore.points && masteryPercentageMap) {
                                        const percentage = masteryPercentageMap[userScore.masteryPoints.toString()];
                                        const color = masteryColors[userScore.masteryPoints.toString()];

                                        return (
                                            <View
                                                style={{
                                                    minWidth: 250,
                                                    maxWidth: 250,
                                                    padding: 10,
                                                    borderRightWidth: 1,
                                                    borderRightColor: '#f2f2f2',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        paddingHorizontal: 15,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {/* Left hand side */}
                                                    <View style={{ flex: 1, flexDirection: 'column' }}>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                marginBottom: 7,
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
                                                                        color: '#1f1f1f',
                                                                        fontSize: 14,
                                                                        // fontFamily: 'Inter',
                                                                    }}
                                                                >
                                                                    {masteryMap[userScore.masteryPoints.toString()]}
                                                                    {userScore.overridden ? '*' : ''}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text
                                                                    style={{
                                                                        color,
                                                                        fontSize: 16,
                                                                        fontFamily: 'Inter',
                                                                    }}
                                                                >
                                                                    {userScore.points}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View>
                                                            {/* <ProgressBar
                                                                maxCompleted={100}
                                                                completed={percentage}
                                                                bgColor={color}
                                                                isLabelVisible={false}
                                                                height={'5px'}
                                                            /> */}
                                                            <Progress.Bar progress={percentage / 100} color={color} />
                                                        </View>
                                                    </View>
                                                    {/* Right hand side */}
                                                    {/* <View>
                                                        <TouchableOpacity
                                                            style={{
                                                                padding: 7,
                                                                backgroundColor: '#fff',
                                                                marginLeft: 15,
                                                            }}
                                                            onPress={() => {
                                                                setStandardModifyEntry(entry);
                                                                setStandardUserScore({
                                                                    ...userScore,
                                                                    fullName: user.fullName,
                                                                });
                                                            }}
                                                        >
                                                            <Ionicons name="create-outline" size={13} />
                                                        </TouchableOpacity>
                                                    </View> */}
                                                </View>
                                            </View>
                                        );
                                    } else {
                                        return (
                                            <View
                                                style={{
                                                    minWidth: 250,
                                                    maxWidth: 250,
                                                    padding: 10,
                                                    borderRightWidth: 1,
                                                    borderRightColor: '#f2f2f2',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#1f1f1f',
                                                            fontSize: 14,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        Not Assigned
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{
                                                            paddingLeft: 8,
                                                        }}
                                                        onPress={() => {
                                                            setStandardModifyEntry(entry);
                                                            setStandardUserScore({
                                                                ...userScore,
                                                                fullName: user.fullName,
                                                            });
                                                        }}
                                                    >
                                                        <Ionicons name="create-outline" size={12} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    }
                                })}
                            </View>
                        );
                    })}
                </ScrollView>
                <View
                    style={{
                        backgroundColor: '#f8f8f8',
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
                            minWidth: 150,
                            maxWidth: 150,
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    />
                    {/*  */}
                    {standardsGradebookEntries.map((entry: any, col: number) => {
                        const pointsTally: any = {};

                        entry.scores.map((score: any) => {
                            if (score.masteryPoints) {
                                if (pointsTally[score.masteryPoints.toString()]) {
                                    pointsTally[score.masteryPoints.toString()] += 1;
                                } else {
                                    pointsTally[score.masteryPoints.toString()] = 1;
                                }
                            } else {
                                if (pointsTally['']) {
                                    pointsTally[''] += 1;
                                } else {
                                    pointsTally[''] = 1;
                                }
                            }
                        });

                        const colorScale: string[] = [];

                        Object.keys(pointsTally).map((masteryPoints: string) => {
                            colorScale.push(masteryColors[masteryPoints]);
                        });

                        return (
                            <View
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    minWidth: 250,
                                    maxWidth: 250,
                                    padding: 10,
                                    borderRightWidth: 1,
                                    borderRightColor: '#f2f2f2',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                }}
                            >
                                <VictoryStack width={250} height={70} horizontal={true} colorScale={colorScale}>
                                    {Object.keys(pointsTally).map((masteryPoints: string) => {
                                        return (
                                            <VictoryBar
                                                barWidth={20}
                                                data={[
                                                    {
                                                        x: 'a',
                                                        y: pointsTally[masteryPoints],
                                                        // label:
                                                        //     masteryMap[masteryPoints] +
                                                        //     ' : ' +
                                                        //     pointsTally[masteryPoints],
                                                    },
                                                ]}
                                                // labelComponent={
                                                //     <VictoryTooltip
                                                //         orientation={'top'}
                                                //         horizontal={true}
                                                //         flyoutPadding={14}
                                                //         style={
                                                //             {
                                                //                 // fontFamily: 'Inter',
                                                //             }
                                                //         }
                                                //     />
                                                // }
                                            />
                                        );
                                    })}
                                </VictoryStack>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    const handleEditStandardEntry = useCallback(
        (standardId: string) => {
            const { entries } = instructorStandardsGradebook;

            const findEntry = entries.find((entry: any) => entry._id === standardId);

            // setGradebookEntryType('standards');
            // setEditStandardTitle(findEntry.title);
            // setEditStandardDescription(findEntry.description);
            // setEditStandardCategory(findEntry.category ? findEntry.category : '');
            setEditEntryId(standardId);
            setEditStandard(findEntry);
            props.setHideNavbarGrades(true);
            props.setShowNewAssignment(true);
        },
        [instructorStandardsGradebook]
    );

    const handleEditGradebookEntry = useCallback(
        (gradebookEntryId: string) => {
            const { entries, users } = instructorGradebook;

            const findEntry = entries.find((entry: any) => entry.gradebookEntryId === gradebookEntryId);

            // const { scores } = findEntry;

            // console.log('Entry scores', scores);

            // if (!findEntry) return;

            // let shareWithAll = false;
            // let storeSubmissionDate = false;
            // let storeFeedback = false;

            // let shareWithSelected: string[] = [];

            // let gradebookPointsScored: any[] = [];

            // users.map((user: any) => {
            //     const findScore = scores.find((x: any) => x.userId === user.userId);

            //     console.log('FindScore', findScore);

            //     if (!findScore) {
            //         shareWithAll = false;
            //     } else {
            //         shareWithSelected.push(user.userId);

            //         if (findScore.submittedAt) {
            //             storeSubmissionDate = true;
            //         }

            //         if (findScore.feedback) {
            //             storeFeedback = true;
            //         }

            //         gradebookPointsScored.push({
            //             _id: user.userId,
            //             fullName: user.fullName,
            //             avatar: user.avatar,
            //             submitted: findScore.submitted,
            //             points: findScore.pointsScored ? findScore.pointsScored : '',
            //             lateSubmission: findScore.lateSubmission,
            //             feedback: findScore.feedback ? findScore.feedback : '',
            //             submittedAt: findScore.submittedAt,
            //         });
            //     }
            // });

            // setNewAssignmentTitle(findEntry.title);
            // setNewAssignmentDeadline(findEntry.deadline);
            // setNewAssignmentGradeWeight(findEntry.gradeWeight);
            // setNewAssignmentTotalPoints(findEntry.totalPoints);
            // setNewAssignmentPointsScored(gradebookPointsScored);
            // setNewAssignmentStep(1);
            // setNewAssignmentShareWithAll(shareWithAll);
            // setNewAssignmentStoreFeedback(storeFeedback);
            // setNewAssignmentStoreSubmittedDate(storeSubmissionDate);
            // setNewAssignmentShareWithSelected(shareWithSelected);

            setEditEntryId(gradebookEntryId);
            setEditAssignment(findEntry);
            props.setShowNewAssignment(true);
            props.setHideNavbarGrades(true);
        },
        [instructorGradebook]
    );

    const renderStandardScale = () => {
        if (!standardsBasedScale) return null;

        return (
            <View
                style={{
                    marginTop: 30,
                    flexDirection: 'column',
                    borderWidth: 1,
                    borderColor: '#ccc',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '30%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Mastery
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '50%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Description
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '20%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Points
                        </Text>
                    </View>
                </View>
                {standardsBasedScale.range.map((level: any) => {
                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                marginVertical: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: '30%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    // maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.name}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '50%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    // maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.description}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '20%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.points}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderInstructorView = () => {
        return (
            <ScrollView
                showsHorizontalScrollIndicator={true}
                horizontal={true}
                showsVerticalScrollIndicator={false}
                indicatorStyle={'black'}
                contentContainerStyle={{
                    flexDirection: 'column',
                    alignItems: 'center',
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
                            minWidth: 150,
                            maxWidth: 150,
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
                            minWidth: 150,
                            maxWidth: 150,
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
                    {gradebookEntries.map((entry: any, col: number) => {
                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#f8f8f8',
                                    minWidth: 150,
                                    maxWidth: 150,
                                    padding: 10,
                                    borderRightWidth: 1,
                                    borderRightColor: '#f2f2f2',
                                }}
                                key={col.toString()}
                                onPress={() => {
                                    if (entry.cueId) {
                                        props.openCueFromGrades(props.channelId, entry.cueId, props.channelCreatedBy);
                                    } else {
                                        handleEditGradebookEntry(entry.gradebookEntryId);
                                    }
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
                                    {new Date(entry.deadline).toString().split(' ')[1] +
                                        ' ' +
                                        new Date(entry.deadline).toString().split(' ')[2]}{' '}
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

                                <Text
                                    style={{
                                        marginTop: 3,
                                        backgroundColor: '#f8f8f8',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name={entry.cueId ? 'open-outline' : 'create-outline'}
                                        size={15}
                                        color="#1f1f1f"
                                        style={{
                                            fontFamily: 'Inter',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Search results empty */}
                {instructorGradebook.users.length === 0 ? (
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
                    {gradebookUsers.map((user: any, row: number) => {
                        const userTotals = instructorGradebook.totals.find((x: any) => x.userId === user.userId);

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
                                        minWidth: 150,
                                        maxWidth: 150,
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
                                        minWidth: 150,
                                        maxWidth: 150,
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
                                        {gradebookViewPoints
                                            ? userTotals.pointsScored + ' / ' + userTotals.totalPointsPossible
                                            : userTotals.score + '%'}
                                    </Text>
                                    <Text
                                        style={{
                                            marginTop: 5,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {userTotals.gradingScaleOutcome
                                            ? '(' + userTotals.gradingScaleOutcome + ')'
                                            : null}
                                    </Text>
                                </View>
                                {gradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    if (
                                        (activeModifyId === entry.cueId || activeModifyId === entry.gradebookEntryId) &&
                                        activeUserId === user.userId
                                    ) {
                                        return (
                                            <View
                                                style={{
                                                    minWidth: 150,
                                                    maxWidth: 150,
                                                    padding: 10,
                                                    borderRightWidth: 1,
                                                    borderRightColor: '#f2f2f2',
                                                }}
                                                key={col.toString()}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Points out of {entry.totalPoints}
                                                    </Text>

                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <TextInput
                                                            value={activeScore}
                                                            placeholder={` / ${entry.totalPoints}`}
                                                            onChangeText={(val) => {
                                                                setActiveScore(val);
                                                            }}
                                                            keyboardType="numeric"
                                                            style={{
                                                                width: '50%',
                                                                marginRight: 5,
                                                                padding: 8,
                                                                borderBottomColor: '#f2f2f2',
                                                                borderBottomWidth: 1,
                                                                fontSize: 14,
                                                            }}
                                                            placeholderTextColor={'#1F1F1F'}
                                                        />
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                handleUpdateAssignmentScore(entry.totalPoints);
                                                            }}
                                                            disabled={user.email === disableEmailId}
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
                                                                setActiveScore('');
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
                                                minWidth: 150,
                                                maxWidth: 150,
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
                                                disabled={!userScore}
                                                key={row.toString() + '-' + col.toString()}
                                                onPress={() => {
                                                    setActiveModifyId(
                                                        entry.cueId ? entry.cueId : entry.gradebookEntryId
                                                    );
                                                    setActiveModifyEntryType(entry.cueId ? 'cue' : 'gradebook');
                                                    setActiveUserId(user.userId);
                                                    setActiveScore(
                                                        userScore && userScore.pointsScored
                                                            ? userScore.pointsScored.toString()
                                                            : ''
                                                    );
                                                }}
                                            >
                                                {!userScore || !userScore.submitted ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f94144',
                                                        }}
                                                    >
                                                        {!userScore ? 'N/A' : 'Not Submitted'}
                                                    </Text>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color:
                                                                userScore && userScore.lateSubmission
                                                                    ? '#f3722c'
                                                                    : '#000000',
                                                        }}
                                                    >
                                                        {userScore.score
                                                            ? gradebookViewPoints
                                                                ? userScore.pointsScored + ' / ' + entry.totalPoints
                                                                : userScore.score + '%'
                                                            : userScore.lateSubmission
                                                            ? 'Late'
                                                            : 'Submitted'}
                                                    </Text>
                                                )}

                                                {userScore &&
                                                userScore.submitted &&
                                                userScore.score &&
                                                userScore.lateSubmission ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f3722c',
                                                            marginTop: 5,
                                                            borderWidth: 0,
                                                            borderColor: '#f3722c',
                                                            borderRadius: 10,
                                                            width: 60,
                                                            alignSelf: 'center',
                                                        }}
                                                    >
                                                        (Late)
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

    const modifyReleaseSubmission = useCallback(
        async (entryId: string, entryType: string, releaseSubmission: boolean, deadlinePassed: boolean) => {
            async function updateReleaseSubmission() {
                setIsFetchingAssignmentAnalytics(true);

                server
                    .mutate({
                        mutation: handleReleaseSubmission,
                        variables: {
                            entryId,
                            gradebookEntry: entryType !== 'cue',
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
                            fetchCourseAssignmentsAnalytics();
                        } else {
                            Alert('Failed to modify status. Try again.');
                        }
                        setIsFetchingAssignmentAnalytics(false);
                    })
                    .catch((e) => {
                        Alert('Failed to modify status. Try again.');
                        setIsFetchingAssignmentAnalytics(false);
                    });
            }

            if (!deadlinePassed && releaseSubmission) {
                Alert('Deadline has not passed.', 'Would you still like to make scores visible?', [
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
                            updateReleaseSubmission();
                        },
                    },
                ]);
            } else {
                updateReleaseSubmission();
            }
        },
        []
    );

    const renderAssignmentAnalytics = () => {
        if (isFetchingAssignmentAnalytics) {
            return (
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
            );
        }

        if (!assignmentAnalytics) return;

        const selectedAssignment = assignmentAnalytics.find(
            (assignment: any) =>
                assignment.cueId === assignmentAnalyticsSelected ||
                assignment.gradebookEntryId === assignmentAnalyticsSelected
        );

        if (!selectedAssignment) return null;

        const topPerformersData = selectedAssignment.topPerformers.map((user: any) => {
            return {
                x: user.fullName,
                y: gradebookViewPoints ? user.pointsScored : user.score,
            };
        });

        const bottomPerformersData = selectedAssignment.bottomPerformers.map((user: any) => {
            return {
                x: user.fullName,
                y: gradebookViewPoints ? user.pointsScored : user.score,
            };
        });

        return (
            <View>
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                        marginTop: 25,
                        alignItems: Dimensions.get('window').width > 768 ? 'center' : 'flex-start',
                        justifyContent: 'space-between',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: isAssignmentsDropdownOpen
                                ? getDropdownHeight(assignmentAnalyticsOptions.length)
                                : 50,
                            maxWidth: 600,
                            marginBottom: isAssignmentsDropdownOpen ? 20 : 0,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            multiple={false}
                            open={isAssignmentsDropdownOpen}
                            value={assignmentAnalyticsSelected}
                            items={assignmentAnalyticsOptions}
                            setOpen={setIsAssignmentsDropdownOpen}
                            setValue={setAssignmentAnalyticsSelected}
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
                                shadowOpacity: !isAssignmentsDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Switch
                            value={selectedAssignment.releaseSubmission}
                            onValueChange={() => {
                                modifyReleaseSubmission(
                                    assignmentAnalyticsSelected,
                                    selectedAssignment.cueId ? 'cue' : 'gradebook',
                                    !selectedAssignment.releaseSubmission,
                                    new Date(selectedAssignment.deadline) < new Date()
                                );
                            }}
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
                            Scores visible to students
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
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
                                Deadline
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                    textAlign: 'center',
                                }}
                            >
                                {moment(selectedAssignment.deadline).format('MMM Do, h:mma')}
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
                                    Grade Weight
                                </Text>

                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 20,
                                        paddingTop: 7,
                                        textAlign: 'center',
                                    }}
                                >
                                    {selectedAssignment.gradeWeight + '%'}
                                </Text>
                            </View>
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
                                    Standard Deviation
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 20,
                                        paddingTop: 7,
                                        textAlign: 'center',
                                    }}
                                >
                                    {gradebookViewPoints ? selectedAssignment.stdPts : selectedAssignment.std + '%'}
                                </Text>
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
                                Total Points
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                    textAlign: 'center',
                                }}
                            >
                                {selectedAssignment.totalPoints}
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
                                Mean
                            </Text>

                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingBottom: 5,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.meanPts : selectedAssignment.mean + '%'}
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
                                Max
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.maxPts : selectedAssignment.max + '%'}
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
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Shared With
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {selectedAssignment.sharedWith} students
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
                                Median
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.medianPts : selectedAssignment.median + '%'}
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
                                Min
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.minPts : selectedAssignment.min + '%'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: Dimensions.get('window').width >= 768 ? 'row' : 'column',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                    }}
                >
                    <View
                        style={{
                            width: Dimensions.get('window').width >= 768 ? '33%' : '100%',
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
                                    fontFamily: 'Inter',
                                }}
                            >
                                Status
                            </Text>
                            <View>
                                <VictoryPie
                                    width={
                                        Dimensions.get('window').width >= 768
                                            ? Dimensions.get('window').width * 0.3
                                            : Dimensions.get('window').width - 50
                                    }
                                    height={250}
                                    colorScale={['tomato', 'orange', 'green']}
                                    data={[
                                        {
                                            x: 1,
                                            y:
                                                selectedAssignment.sharedWith -
                                                selectedAssignment.graded -
                                                selectedAssignment.submitted,
                                        },
                                        {
                                            x: 2,
                                            y: selectedAssignment.submitted,
                                        },
                                        {
                                            x: 3,
                                            y: selectedAssignment.graded,
                                        },
                                    ]}
                                    style={{ labels: { fill: 'black', fontSize: 20 } }}
                                    innerRadius={120}
                                    labels={({ datum }) => {
                                        if (datum.y > 0) {
                                            if (datum.x === 1) {
                                                return datum.y + ' Not submitted';
                                            } else if (datum.x === 2) {
                                                return datum.y + ' Submitted';
                                            } else {
                                                return datum.y + ' Graded';
                                            }
                                        }
                                        return '';
                                    }}
                                    // labelComponent={<CustomLabel />}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: Dimensions.get('window').width > 768 ? '33%' : '100%',
                            marginTop: Dimensions.get('window').width > 768 ? 0 : 20,
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
                                    fontFamily: 'Inter',
                                }}
                            >
                                Highest scores
                            </Text>
                            <VictoryChart
                                width={Dimensions.get('window').width > 768 ? 350 : Dimensions.get('window').width - 50}
                                domainPadding={{ x: 20, y: [0, 20] }}
                            >
                                <VictoryBar
                                    style={{ data: { fill: '#c43a31' } }}
                                    dataComponent={<Bar />}
                                    data={topPerformersData}
                                    labels={({ datum }) => {
                                        return datum.y + (gradebookViewPoints ? '' : '%');
                                    }}
                                />
                            </VictoryChart>
                        </View>
                    </View>

                    <View
                        style={{
                            width: Dimensions.get('window').width > 768 ? '33%' : '100%',
                            marginTop: Dimensions.get('window').width > 768 ? 0 : 20,
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
                                    fontFamily: 'Inter',
                                }}
                            >
                                Lowest scores
                            </Text>
                            <VictoryChart
                                width={Dimensions.get('window').width > 768 ? 350 : Dimensions.get('window').width - 50}
                                domainPadding={{ x: 20, y: [0, 20] }}
                            >
                                <VictoryBar
                                    style={{ data: { fill: '#c43a31' } }}
                                    dataComponent={<Bar />}
                                    data={bottomPerformersData}
                                    labels={({ datum }) => {
                                        return datum.y + (gradebookViewPoints ? '' : '%');
                                    }}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStandardAnalytics = () => {
        // Line Chart

        let data;

        let xTickValues;

        let yTickValues;

        if (standardsAnalytics) {
            data = standardsAnalytics.scores.map((score: any) => {
                return {
                    x: score.createdAt,
                    y: score.points,
                    // label: masteryMap[score.points.toString()] + ` (${score.points.toString()})`,
                };
            });

            xTickValues = standardsAnalytics.scores.map((score: any) => {
                return score.createdAt;
            });

            yTickValues = standardsBasedScale.range.map((scale: any) => {
                return scale.points;
            });
        }

        return (
            <View>
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                        marginTop: 25,
                        alignItems: 'center',
                    }}
                >
                    {props.isOwner ? (
                        <View
                            style={{
                                backgroundColor: 'white',
                                display: 'flex',
                                height: isStandardsUsersDropdownOpen
                                    ? getDropdownHeight(standardsAnalyticsUsersDropdownOptions.length)
                                    : 50,
                                maxWidth: 600,
                                marginBottom: isStandardsUsersDropdownOpen ? 20 : 0,
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                multiple={false}
                                open={isStandardsUsersDropdownOpen}
                                value={standardAnalyticsSelectedUser}
                                items={standardsAnalyticsUsersDropdownOptions}
                                setOpen={setIsStandardsUsersDropdownOpen}
                                setValue={setStandardAnalyticsSelectedUser}
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
                                    shadowOpacity: !isStandardsUsersDropdownOpen ? 0 : 0.08,
                                    shadowRadius: 12,
                                }}
                                textStyle={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'overpass',
                                }}
                            />
                        </View>
                    ) : null}

                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: isStandardsDropdownOpen
                                ? getDropdownHeight(standardsAnalyticsDropdownOptions.length)
                                : 50,
                            maxWidth: 600,
                            marginTop: Dimensions.get('window').width > 768 ? 0 : 20,
                            marginBottom: isStandardsDropdownOpen ? 20 : 0,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            multiple={false}
                            open={isStandardsDropdownOpen}
                            value={standardAnalyticsSelected}
                            items={standardsAnalyticsDropdownOptions}
                            setOpen={setIsStandardsDropdownOpen}
                            setValue={setStandardAnalyticsSelected}
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
                                shadowOpacity: !isStandardsDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                </View>
                {!standardsAnalytics ? (
                    <View
                        style={{
                            marginTop: 100,
                        }}
                    >
                        <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Mastery not Assigned</Text>
                    </View>
                ) : (
                    <View
                        style={{
                            marginTop: 25,
                            flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                        }}
                    >
                        {data.length > 1 ? (
                            <View
                                style={{
                                    width: Dimensions.get('window').width > 768 ? '50%' : '100%',
                                }}
                            >
                                <VictoryChart
                                    //   theme={VictoryTheme.material}
                                    containerComponent={
                                        <VictoryVoronoiContainer
                                            labels={(d) => {
                                                console.log('D', d);
                                                // return '(x=' + d.x + ';y=' + d.y + ')';
                                                return masteryMap[d.datum.y.toString()];
                                            }}
                                        />
                                    }
                                >
                                    <VictoryAxis
                                        tickValues={xTickValues}
                                        tickFormat={(t) => moment(new Date(parseInt(t))).format('MMM Do, YY')}
                                        //   tickFormat={t => new Date(t).getHours()}
                                    />
                                    <VictoryAxis dependentAxis tickValues={yTickValues} />
                                    <VictoryLine
                                        // style={{
                                        //     data: { stroke: '#c43a31' },
                                        //     parent: { border: '1px solid #ccc' },
                                        // }}
                                        data={data}
                                    />
                                </VictoryChart>
                            </View>
                        ) : null}
                        <View
                            style={{
                                width: Dimensions.get('window').width > 768 ? '50%' : '100%',
                                paddingLeft: Dimensions.get('window').width > 768 && data.length > 1 ? 50 : 0,
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    padding: 20,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                }}
                            >
                                <View style={{}}>
                                    <Text
                                        style={{
                                            fontFamily: 'Inter',
                                            fontSize: 16,
                                        }}
                                    >
                                        {standardsAnalytics.masteryPoints
                                            ? masteryMap[standardsAnalytics.masteryPoints.toString()]
                                            : 'Not Assigned'}
                                        {standardsAnalytics.overridden}
                                    </Text>
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            color: masteryColors[standardsAnalytics.masteryPoints.toString()],
                                        }}
                                    >
                                        {standardsAnalytics.total}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    marginTop: 30,
                                    flexDirection: 'column',
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: props.isOwner ? '40%' : '50%',
                                            backgroundColor: '#f8f8f8',
                                            paddingHorizontal: 12,
                                            paddingVertical: 16,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Date
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            width: props.isOwner ? '40%' : '50%',
                                            backgroundColor: '#f8f8f8',
                                            paddingHorizontal: 12,
                                            paddingVertical: 16,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Mastery
                                        </Text>
                                    </View>
                                    {props.isOwner ? (
                                        <View
                                            style={{
                                                width: '20%',
                                                backgroundColor: '#f8f8f8',
                                                paddingHorizontal: 12,
                                                paddingVertical: 16,
                                            }}
                                        ></View>
                                    ) : null}
                                </View>
                                {standardsAnalytics.scores.map((score: any) => {
                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: props.isOwner ? '40%' : '50%',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 16,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                    }}
                                                >
                                                    {moment(new Date(parseInt(score.createdAt))).format('MMM Do, YY')}
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: props.isOwner ? '40%' : '50%',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 16,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {masteryMap[score.points.toString()]}
                                                </Text>
                                            </View>
                                            {props.isOwner ? (
                                                <View
                                                    style={{
                                                        width: '20%',
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 16,
                                                    }}
                                                >
                                                    <Ionicons name="trash-outline" size={18} />
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderStudentAnalytics = () => {
        if (isFetchingStudentAnalytics) {
            return (
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
            );
        }

        if (!studentAnalytics || !assignmentAnalytics) return;

        const data = [
            {
                x: 1,
                y: studentAnalytics.progress,
            },
            {
                x: 2,
                y: 100 - studentAnalytics.progress,
            },
        ];

        const avgScoreData: any[] = [];

        const studentScoresData: any[] = [];

        console.log('Student analytics', studentAnalytics);

        console.log('assignmentAnalytics', assignmentAnalytics);

        studentAnalytics.scores.map((score: any) => {
            const id = score.cueId ? score.cueId : score.gradebookEntryId;

            const findAssignment = assignmentAnalytics.find((x: any) => x.cueId === id || x.gradebookEntryId === id);

            if (!findAssignment) return;

            avgScoreData.push({
                x: findAssignment.title,
                y: gradebookViewPoints ? findAssignment.meanPts : findAssignment.mean,
            });

            studentScoresData.push({
                x: findAssignment.title,
                y: gradebookViewPoints ? score.pointsScored : score.score,
            });
        });

        return (
            <View>
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                        marginTop: 25,
                        alignItems: Dimensions.get('window').width > 768 ? 'center' : 'flex-start',
                        justifyContent: 'space-between',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            height: isUsersDropdownOpen ? getDropdownHeight(assignmentAnalyticsOptions.length) : 50,
                            maxWidth: 600,
                            marginBottom: isUsersDropdownOpen ? 20 : 0,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            multiple={false}
                            open={isUsersDropdownOpen}
                            value={userAnalyticsSelected}
                            items={userAnalyticsOptions}
                            setOpen={setIsUsersDropdownOpen}
                            setValue={setUserAnalyticsSelected}
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
                                shadowOpacity: !isUsersDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                    }}
                >
                    <View
                        style={{
                            width: Dimensions.get('window').width > 768 ? '50%' : '100%',
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
                                    fontFamily: 'Inter',
                                }}
                            >
                                Course Progress
                            </Text>
                            <View>
                                <VictoryPie
                                    width={
                                        Dimensions.get('window').width >= 768
                                            ? Dimensions.get('window').width * 0.3
                                            : Dimensions.get('window').width - 50
                                    }
                                    height={250}
                                    data={data}
                                    innerRadius={120}
                                    cornerRadius={25}
                                    labels={() => null}
                                    style={{
                                        data: {
                                            fill: ({ datum }) => {
                                                const color = datum.y > 30 ? '#0450b4' : 'red';
                                                return datum.x === 1 ? color : 'transparent';
                                            },
                                        },
                                    }}
                                    labelComponent={
                                        <VictoryLabel
                                            textAnchor="middle"
                                            verticalAnchor="middle"
                                            x={200}
                                            y={200}
                                            text={`${Math.round(studentAnalytics.progress)}%`}
                                            style={{ fontSize: Dimensions.get('window').width > 768 ? 45 : 30 }}
                                        />
                                    }
                                />
                            </View>
                        </View>

                        {/*  */}

                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: 30,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Submissions
                            </Text>
                            <View
                                style={{
                                    maxWidth: '100%',
                                }}
                            >
                                <VictoryPie
                                    colorScale={['tomato', 'orange', 'green']}
                                    width={
                                        Dimensions.get('window').width >= 768
                                            ? Dimensions.get('window').width * 0.3
                                            : Dimensions.get('window').width - 50
                                    }
                                    height={250}
                                    data={[
                                        {
                                            x: 1,
                                            y:
                                                studentAnalytics.sharedWith -
                                                studentAnalytics.graded -
                                                studentAnalytics.submitted,
                                        },
                                        {
                                            x: 2,
                                            y: studentAnalytics.submitted,
                                        },
                                        {
                                            x: 3,
                                            y: studentAnalytics.graded,
                                        },
                                    ]}
                                    style={{ labels: { fill: 'black', fontSize: 20 }, parent: { overflow: 'visible' } }}
                                    innerRadius={120}
                                    labels={({ datum }) => {
                                        if (datum.y > 0) {
                                            if (datum.x === 1) {
                                                return datum.y + ' Not submitted';
                                            } else if (datum.x === 2) {
                                                return datum.y + ' Submitted';
                                            } else {
                                                return datum.y + ' Graded';
                                            }
                                        }
                                        return '';
                                    }}
                                    labelComponent={<VictoryLabel />}
                                    // labelComponent={
                                    //     <VictoryLabel
                                    //         textAnchor="middle"
                                    //         verticalAnchor="middle"
                                    //         x={200}
                                    //         y={200}
                                    //         text={`${Math.round(
                                    //             (studentAnalytics.graded / studentAnalytics.sharedWith) * 100
                                    //         )}%`}
                                    //         style={{ fontSize: 45 }}
                                    //     />
                                    // }
                                    // labelComponent={<CustomLabel />}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: Dimensions.get('window').width > 768 ? '50%' : '100%',
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
                                    fontFamily: 'Inter',
                                }}
                            >
                                Student score vs Course Average
                            </Text>

                            <VictoryChart
                                horizontal
                                height={400}
                                width={Dimensions.get('window').width > 768 ? 350 : Dimensions.get('window').width - 50}
                                padding={40}
                            >
                                <VictoryStack style={{ data: { width: 25 }, labels: { fontSize: 15 } }}>
                                    <VictoryBar
                                        style={{ data: { fill: 'tomato' } }}
                                        data={studentScoresData}
                                        y={(data) => -Math.abs(data.y)}
                                        labels={({ datum }) => `${Math.abs(datum.y)}${gradebookViewPoints ? '' : '%'}`}
                                    />
                                    <VictoryBar
                                        style={{ data: { fill: 'orange' } }}
                                        data={avgScoreData}
                                        labels={({ datum }) => `${Math.abs(datum.y)}${gradebookViewPoints ? '' : '%'}`}
                                    />
                                </VictoryStack>

                                <VictoryAxis
                                    style={{
                                        axis: { stroke: 'transparent' },
                                        ticks: { stroke: 'transparent' },
                                        tickLabels: { fontSize: 15, fill: 'black' },
                                    }}
                                    tickLabelComponent={<VictoryLabel x={400 / 2} textAnchor="middle" />}
                                    tickValues={studentScoresData.map((point) => point.x).reverse()}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderCourseGradingScale = () => {
        if (!courseGradingScale) return;

        return (
            <View
                style={{
                    marginTop: 30,
                    flexDirection: 'column',
                    borderWidth: 1,
                    borderColor: '#ccc',
                    width: Dimensions.get('window').width > 768 ? '50%' : '100%',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Grade
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            From
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            To
                        </Text>
                    </View>
                </View>
                {courseGradingScale.range.map((level: any) => {
                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                paddingVertical: 15,
                                borderBottomColor: '#f8f8f8',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                    maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.name}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.start}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.end === 100 ? '100' : '<' + level.end}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderPerformanceOverview = () => {
        const grade = gradebookViewPoints
            ? studentGradebook.total.pointsScored + '/' + studentGradebook.total.totalPointsPossible
            : studentGradebook.total.score + '%';
        const gradingScaleOutcome = studentGradebook.total.gradingScaleOutcome
            ? '(' + studentGradebook.total.gradingScaleOutcome + ')'
            : '';
        const progress = studentGradebook.total.courseProgress;
        const totalAssessments = studentGradebook.total.totalAssessments;
        const submitted = studentGradebook.total.submitted;
        const notSubmitted = studentGradebook.total.notSubmitted;
        const late = studentGradebook.total.lateSubmissions;
        const graded = studentGradebook.total.graded;
        const upcomingDeadline = studentGradebook.total.nextAssignmentDue
            ? moment(new Date(studentGradebook.total.nextAssignmentDue)).format('MMM Do, h:mma')
            : 'N/A';

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    padding: 20,
                    marginTop: 20,
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
                            Total
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                                textAlign: 'center',
                            }}
                        >
                            {grade} {gradingScaleOutcome}
                        </Text>
                    </View>

                    <View
                        style={{
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
                                textAlign: 'center',
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
                                textAlign: 'center',
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
                                textAlign: 'center',
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
                                    textAlign: 'center',
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
                                    textAlign: 'center',
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
                                    textAlign: 'center',
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

    const renderStudentView = () => {
        return (
            <View
                style={{
                    width: '100%',
                    marginBottom: Dimensions.get('window').width < 768 ? 75 : 0,
                }}
            >
                <View>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 50,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                            }}
                        >
                            Overview
                        </Text>
                    </View>

                    {renderPerformanceOverview()}
                </View>
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
                            Scores
                        </Text>
                    </View>

                    {renderScoresTableStudent()}
                </View>
            </View>
        );
    };

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

    const renderStandardsStudentView = () => {
        return (
            <ScrollView
                showsHorizontalScrollIndicator={true}
                horizontal={true}
                showsVerticalScrollIndicator={false}
                indicatorStyle={'black'}
                contentContainerStyle={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
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
                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
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
                                if (sortByOptionStandard !== 'Standard') {
                                    setSortByOptionStandard('Standard');
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
                                Standard
                            </Text>
                            {sortByOptionStandard === 'Standard' ? (
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
                            backgroundColor: '#f8f8f8',
                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
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
                                if (sortByOptionStandard !== 'Category') {
                                    setSortByOptionStandard('Category');
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
                                Category
                            </Text>
                            {sortByOptionStandard === 'Category' ? (
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
                            backgroundColor: '#f8f8f8',
                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
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
                                if (sortByOptionStandard !== 'Description') {
                                    setSortByOptionStandard('Description');
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
                                Description
                            </Text>
                            {sortByOptionStandard === 'Description' ? (
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
                            backgroundColor: '#f8f8f8',
                            minWidth: Dimensions.get('window').width < 768 ? 200 : '34%',
                            maxWidth: Dimensions.get('window').width < 768 ? 200 : '34%',
                            padding: 10,
                            borderRightWidth: 1,
                            borderRightColor: '#f2f2f2',
                            flexDirection: 'column',
                            justifyContent: 'center',
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
                                if (sortByOptionStandard !== 'Mastery') {
                                    setSortByOptionStandard('Mastery');
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
                                Points
                            </Text>
                            {sortByOptionStandard === 'Mastery' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search results empty */}
                {standardsGradebookEntriesStudent.length === 0 ? (
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
                            No standards.
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
                    style={{
                        width: '100%',
                    }}
                    nestedScrollEnabled={true}
                >
                    {standardsGradebookEntriesStudent.map((entry: any, ind: number) => {
                        console.log('Entry', entry);
                        if (!masteryPercentageMap || !masteryColors) return null;

                        let percentage;
                        let color;

                        if (entry.masteryPoints) {
                            percentage = masteryPercentageMap[entry.masteryPoints.toString()];
                            color = masteryColors[entry.masteryPoints.toString()];
                        }

                        return (
                            <View
                                style={{
                                    minHeight: 70,
                                    flexDirection: 'row',
                                    overflow: 'hidden',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f2f2f2',
                                }}
                                key={ind.toString()}
                            >
                                <View
                                    style={{
                                        minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                        maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
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
                                            fontFamily: 'Inter',
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.title}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                        maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
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
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.category ? entry.category : 'None'}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                        maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
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
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.description}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        minWidth: Dimensions.get('window').width < 768 ? 200 : '34%',
                                        maxWidth: Dimensions.get('window').width < 768 ? 200 : '34%',
                                        padding: 10,
                                        borderRightWidth: 1,
                                        borderRightColor: '#f2f2f2',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    {entry.masteryPoints ? (
                                        <View style={{ flexDirection: 'column', alignItems: 'center', maxWidth: 200 }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 7,
                                                    width: '100%',
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
                                                            color: '#1f1f1f',
                                                            fontSize: 14,
                                                            // fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {masteryMap[entry.masteryPoints.toString()]}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color,
                                                            fontSize: 16,
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {entry.points}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View>
                                                <Progress.Bar progress={percentage / 100} color={color} />
                                            </View>
                                        </View>
                                    ) : (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#1f1f1f',
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Not Assigned
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </ScrollView>
        );
    };

    const renderScoresTableStudent = () => {
        return (
            <View
                style={{
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                    marginTop: 20,
                }}
            >
                <ScrollView
                    showsHorizontalScrollIndicator={true}
                    horizontal={true}
                    showsVerticalScrollIndicator={false}
                    indicatorStyle={'black'}
                    contentContainerStyle={{
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
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
                        {/*  */}
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                padding: 10,
                                borderRightWidth: 1,
                                borderRightColor: '#f2f2f2',
                                flexDirection: 'column',
                                justifyContent: 'center',
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
                        {/*  */}
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                padding: 10,
                                borderRightWidth: 1,
                                borderRightColor: '#f2f2f2',
                                flexDirection: 'column',
                                justifyContent: 'center',
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
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                padding: 10,
                                borderRightWidth: 1,
                                borderRightColor: '#f2f2f2',
                                flexDirection: 'column',
                                justifyContent: 'center',
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
                        {/* Deadline */}
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                minWidth: Dimensions.get('window').width < 768 ? 150 : '34%',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : '34%',
                                padding: 10,
                                borderRightWidth: 1,
                                borderRightColor: '#f2f2f2',
                                flexDirection: 'column',
                                justifyContent: 'center',
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

                    {/* Search results empty */}
                    {gradebookStudentEntries.length === 0 ? (
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
                                No assignments.
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
                        {gradebookStudentEntries.map((entry: any, ind: number) => {
                            const hasDeadlinePassed = new Date(entry.deadline) < new Date() || entry.releaseSubmission;
                            const hasLateSubmissionPassed =
                                (entry.availableUntil && new Date(entry.availableUntil) < new Date()) ||
                                entry.releaseSubmission;

                            let remaining;

                            if (!hasDeadlinePassed && entry.cueId) {
                                let start = new Date(entry.initiateAt);
                                let end = new Date(entry.deadline);
                                const current = new Date();

                                const currentElapsed = current.valueOf() - start.valueOf();
                                const totalDifference = end.valueOf() - start.valueOf();

                                remaining = 100 - (currentElapsed / totalDifference) * 100;
                            } else if (
                                hasDeadlinePassed &&
                                entry.availableUntil &&
                                !hasLateSubmissionPassed &&
                                entry.cueId
                            ) {
                                let start = new Date(entry.deadline);
                                let end = new Date(entry.availableUntil);
                                const current = new Date();

                                const currentElapsed = current.getTime() - start.getTime();
                                const totalDifference = end.getTime() - start.getTime();

                                remaining = 100 - (currentElapsed / totalDifference) * 100;
                            }

                            console.log('hasDeadlinePassed', hasDeadlinePassed);
                            console.log('hasLateSubmissionPassed', hasLateSubmissionPassed);
                            console.log('remaining', remaining);

                            return (
                                <View
                                    style={{
                                        minHeight: 70,
                                        flexDirection: 'row',
                                        overflow: 'hidden',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#f2f2f2',
                                    }}
                                    key={ind.toString()}
                                >
                                    <View
                                        style={{
                                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!entry || !entry.cueId) return;

                                                props.openCueFromGrades(
                                                    props.channelId,
                                                    entry.cueId,
                                                    props.channelCreatedBy
                                                );
                                            }}
                                            disabled={!entry.cueId}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    textAlign: 'center',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {entry.title}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View
                                        style={{
                                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {entry.gradeWeight ? entry.gradeWeight : '0'}%
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            minWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            maxWidth: Dimensions.get('window').width < 768 ? 150 : '22%',
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {!entry.submitted ? (
                                                <View
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 10,
                                                        marginRight: 7,
                                                        backgroundColor: '#f94144',
                                                    }}
                                                />
                                            ) : !entry.score ? (
                                                <View
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 10,
                                                        marginRight: 7,
                                                        backgroundColor: entry.lateSubmission ? '#f3722c' : '#35AC78',
                                                    }}
                                                />
                                            ) : null}
                                            {!entry.submitted ? (
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Not Submitted
                                                </Text>
                                            ) : (
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        color: entry.lateSubmission ? '#f3722c' : '#000000',
                                                    }}
                                                >
                                                    {entry.score
                                                        ? gradebookViewPoints
                                                            ? entry.pointsScored + '/' + entry.totalPoints
                                                            : entry.score + '%'
                                                        : entry.lateSubmission
                                                        ? 'Late'
                                                        : 'Submitted'}
                                                </Text>
                                            )}
                                        </View>
                                        {entry.lateSubmission && entry.score ? (
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
                                            minWidth: Dimensions.get('window').width < 768 ? 250 : '34%',
                                            maxWidth: Dimensions.get('window').width < 768 ? 250 : '34%',
                                            padding: 10,
                                            borderRightWidth: 1,
                                            borderRightColor: '#f2f2f2',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {hasDeadlinePassed && (!entry.availableUntil || hasLateSubmissionPassed) ? (
                                            <View>
                                                {entry.availableUntil ? (
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
                                                                {moment(new Date(entry.deadline)).format(
                                                                    'MMM Do, h:mm a'
                                                                )}
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
                                                                    {moment(new Date(entry.availableUntil)).format(
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
                                                        {moment(new Date(entry.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                )}
                                            </View>
                                        ) : !hasDeadlinePassed ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 20,
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
                                                    {getTimeRemaining(entry.deadline)}
                                                </Text>
                                                {entry.cueId && remaining ? (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Progress.Bar
                                                            progress={remaining ? remaining / 100 : 0}
                                                            color={'#007AFF'}
                                                            style={{ transform: [{ rotateY: '180deg' }] }}
                                                            width={
                                                                Dimensions.get('window').width < 768
                                                                    ? Dimensions.get('window').width * 0.01 * 34 - 20
                                                                    : 230
                                                            }
                                                        />
                                                    </View>
                                                ) : null}
                                                {/*  */}
                                                {entry.cueId && remaining ? (
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
                                                            {moment(new Date(entry.initiateAt)).format('MMM Do')}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {moment(new Date(entry.deadline)).format('MMM Do, h:mm a')}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        ) : entry.availableUntil && !hasLateSubmissionPassed ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 20,
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
                                                    Late submission available. {getTimeRemaining(entry.availableUntil)}
                                                </Text>
                                                {entry.cueId && remaining ? (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Progress.Bar
                                                            progress={remaining ? remaining / 100 : 0}
                                                            color={'#FFC107'}
                                                            style={{ transform: [{ rotateY: '180deg' }] }}
                                                            width={
                                                                Dimensions.get('window').width < 768
                                                                    ? Dimensions.get('window').width * 0.01 * 34 - 20
                                                                    : 230
                                                            }
                                                        />
                                                    </View>
                                                ) : null}
                                                {/*  */}
                                                {entry.cueId && remaining ? (
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
                                                            {moment(new Date(entry.deadline)).format('MMM Do')}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {moment(new Date(entry.availableUntil)).format(
                                                                'MMM Do, h:mm a'
                                                            )}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </ScrollView>
            </View>
        );
    };

    const renderAssignmentsGradebook = () => {
        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
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
                                Scores
                            </Text>

                            {Dimensions.get('window').width > 768 || standardsBasedScale
                                ? null
                                : renderSwitchGradebookViewpoints()}
                        </View>
                        {isFetchingGradebook ? (
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
                        ) : !instructorGradebook ? (
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
                                    Could not fetch instructor gradebook.
                                </Text>
                            </View>
                        ) : instructorGradebook.entries.length === 0 || instructorGradebook.users.length === 0 ? (
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
                                    {instructorGradebook.entries.length === 0
                                        ? 'No assignments created.'
                                        : 'No users in course.'}
                                </Text>
                            </View>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                    maxWidth: '100%',
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
                        )}

                        {/* Render analytics section */}

                        {assignmentAnalytics && assignmentAnalytics.length > 0 ? (
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
                                        Assignment Insights
                                    </Text>
                                </View>

                                {/*  */}
                                <View>{renderAssignmentAnalytics()}</View>
                            </View>
                        ) : null}

                        {/* Student Insights */}

                        {studentAnalytics && assignmentAnalytics && assignmentAnalytics.length > 0 ? (
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
                                        Student Insights
                                    </Text>
                                </View>

                                <View>{renderStudentAnalytics()}</View>
                            </View>
                        ) : null}

                        {courseGradingScale && !isFetchingGradebook && instructorGradebook ? (
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
                                        Scale
                                    </Text>
                                </View>

                                <View>{renderCourseGradingScale()}</View>
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
                        {isFetchingStudentGradebook ? (
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
                        ) : !studentGradebook ? (
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
                                    Could not fetch student gradebook.
                                </Text>
                            </View>
                        ) : studentGradebook.entries.length === 0 ? (
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
                                    No assignments created.
                                </Text>
                            </View>
                        ) : (
                            <View>{renderStudentView()}</View>
                        )}
                        {courseGradingScale && !isFetchingStudentGradebook && studentGradebook ? (
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
                                        Scale
                                    </Text>
                                </View>

                                <View>{renderCourseGradingScale()}</View>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        );
    };

    const renderStandardsGradebook = () => {
        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 50,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Mastery
                            </Text>
                        </View>
                        {isFetchingStandardsGradebook ? (
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
                        ) : !instructorStandardsGradebook ? (
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
                                    Could not fetch standards gradebook.
                                </Text>
                            </View>
                        ) : instructorStandardsGradebook.entries.length === 0 ||
                          instructorStandardsGradebook.users.length === 0 ? (
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
                                    {instructorStandardsGradebook.entries.length === 0
                                        ? 'No standards created.'
                                        : 'No users in course.'}
                                </Text>
                            </View>
                        ) : (
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
                                {renderStandardsInstructorView()}
                            </View>
                        )}

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
                                    Scale
                                </Text>
                            </View>
                            <View>{renderStandardScale()}</View>
                        </View>

                        {/* Analytics */}
                        {standardAnalyticsSelected && standardAnalyticsSelectedUser ? (
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
                                        Standards Insights
                                    </Text>
                                </View>

                                {isFetchingStandardsAnalytics ? (
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
                                ) : (
                                    <View>{renderStandardAnalytics()}</View>
                                )}
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <View>
                        <View
                            style={{
                                flexDirection: 'column',
                                marginBottom: 50,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 50,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Mastery
                                </Text>
                            </View>
                            {isFetchingStandardsGradebookStudent ? (
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
                            ) : !studentStandardsGradebook ? (
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
                                        Could not fetch standards gradebook.
                                    </Text>
                                </View>
                            ) : studentStandardsGradebook.entries.length === 0 ? (
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
                                        No standards created.
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        borderRadius: 2,
                                        borderWidth: 1,
                                        borderColor: '#cccccc',
                                        marginTop: 20,
                                    }}
                                >
                                    {renderStandardsStudentView()}
                                </View>
                            )}
                            {standardsBasedScale ? (
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
                                            Scale
                                        </Text>
                                    </View>
                                    <View>{renderStandardScale()}</View>
                                </View>
                            ) : null}
                            {standardAnalyticsSelected && standardAnalyticsSelectedUser ? (
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
                                            Standards Insights
                                        </Text>
                                    </View>

                                    {isFetchingStandardsAnalytics ? (
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
                                    ) : (
                                        <View>{renderStandardAnalytics()}</View>
                                    )}
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderSwitchGradebookViewpoints = () => {
        return (
            <View>
                {selectedGradebookMode === 'assignments' ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            marginLeft: 'auto',
                            alignItems: 'center',
                            borderRadius: 20,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        {viewGradebookTabs.map((tab: string, ind: number) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor:
                                            (tab === 'Pts' && gradebookViewPoints) ||
                                            (tab !== 'Pts' && !gradebookViewPoints)
                                                ? '#000'
                                                : '#f8f8f8',
                                        borderRadius: 20,
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        minWidth: 60,
                                    }}
                                    onPress={() => {
                                        if (tab === 'Pts') {
                                            setGradebookViewPoints(true);
                                        } else {
                                            setGradebookViewPoints(false);
                                        }
                                    }}
                                    key={ind.toString()}
                                >
                                    <Text
                                        style={{
                                            color:
                                                (tab === 'Pts' && gradebookViewPoints) ||
                                                (tab !== 'Pts' && !gradebookViewPoints)
                                                    ? '#fff'
                                                    : '#000',
                                            fontSize: 12,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null}
            </View>
        );
    };

    return (
        <View>
            {props.showNewAssignment ? (
                <NewAssignmentModal
                    channelId={props.channelId}
                    courseStudents={courseStudents}
                    onClose={() => {
                        props.setShowNewAssignment(false);
                        props.setHideNavbarGrades(false);
                        setEditEntryId('');
                        setEditAssignment(undefined);
                        setEditStandard(undefined);
                    }}
                    standardsBasedScale={standardsBasedScale}
                    standardsCategories={standardsCategories}
                    masteryDropdownOptions={masteryDropdownOptions}
                    masteryMap={masteryMap}
                    // Refresh Functions
                    refreshAssignmentData={() => {
                        fetchGradebookInstructor();
                        fetchCourseAssignmentsAnalytics();
                        fetchStudentAnalytics();
                    }}
                    refreshStandardsData={() => {
                        fetchStandardsBasedGradebookInstructor();
                        fetchStandardsAnalytics();
                    }}
                    editEntryId={editEntryId}
                    editAssignment={editAssignment}
                    editStandard={editStandard}
                    instructorGradebook={instructorGradebook}
                />
            ) : (
                <View
                    style={{
                        paddingHorizontal: paddingResponsive(),
                        marginBottom: 200,
                    }}
                >
                    {standardsBasedScale ? (
                        Dimensions.get('window').width < 768 ? (
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    marginTop: 25,
                                }}
                            >
                                {tabs.map((tab: any, ind: number) => {
                                    return (
                                        <View nativeID={tab.value} key={ind.toString()}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor:
                                                        tab.value === selectedGradebookMode ? '#000' : '#f2f2f2',
                                                    borderRadius: 20,
                                                    paddingHorizontal: 14,
                                                    marginRight: 10,
                                                    paddingVertical: 7,
                                                }}
                                                onPress={() => {
                                                    setSelectedGradebookMode(tab.value);
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: tab.value === selectedGradebookMode ? '#fff' : '#000',
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {tab.label}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    marginTop: 25,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    {tabs.map((tab: any, ind: number) => {
                                        return (
                                            <View
                                                nativeID={tab.value}
                                                style={{
                                                    marginRight: 38,
                                                }}
                                                key={ind.toString()}
                                            >
                                                <TouchableOpacity
                                                    style={{
                                                        paddingVertical: 3,
                                                        backgroundColor: 'none',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        borderBottomColor: '#000',
                                                        borderBottomWidth: tab.value === selectedGradebookMode ? 1 : 0,
                                                    }}
                                                    onPress={() => {
                                                        setSelectedGradebookMode(tab.value);
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#000',
                                                            fontSize: 14,
                                                            fontFamily:
                                                                tab.value === selectedGradebookMode
                                                                    ? 'inter'
                                                                    : 'overpass',
                                                            textTransform: 'uppercase',
                                                            // paddingLeft: 5,
                                                        }}
                                                    >
                                                        {tab.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>

                                {renderSwitchGradebookViewpoints()}
                            </View>
                        )
                    ) : null}

                    {selectedGradebookMode === 'assignments'
                        ? renderAssignmentsGradebook()
                        : renderStandardsGradebook()}
                </View>
            )}
        </View>
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
