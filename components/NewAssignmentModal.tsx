// // REACT
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, TextInput, Dimensions, Platform, Keyboard, KeyboardAvoidingView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import Alert from './Alert';
// // COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from './CustomTextInput';
import DropDownPicker from 'react-native-dropdown-picker';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import Reanimated from 'react-native-reanimated';
import { disableEmailId } from '../constants/zoomCredentials';
import { RadioButton } from './RadioButton';
import { paddingResponsive } from '../helpers/paddingHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createGradebookEntry,
    handleEditStandard,
    createStandards,
    editGradebookEntry,
    deleteGradebookEntry,
    handleDeleteStandard,
} from '../graphql/QueriesAndMutations';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import TagInput from 'react-native-tags-input';

const customFontFamily = `@font-face {
        font-family: 'Overpass';
        src: url('https://cues-files.s3.amazonaws.com/fonts/Omnes-Pro-Regular.otf'); 
   }`;

const NewAssignmentModal: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [gradebookEntryType, setGradebookEntryType] = useState(
        props.gradebookEntryType ? props.gradebookEntryType : 'assignment'
    );

    const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
    const [newAssignmentGradeWeight, setNewAssignmentGradeWeight] = useState('');
    const [newAssignmentTotalPoints, setNewAssignmentTotalPoints] = useState('');

    const [newAssignmentDeadline, setNewAssignmentDeadline] = useState(new Date());
    const [showNewAssignmentDeadlineDateAndroid, setShowNewAssignmentDeadlineDateAndroid] = useState(false);
    const [showNewAssignmentDeadlineTimeAndroid, setShowNewAssignmentDeadlineTimeAndroid] = useState(false);

    // ASSIGNMENT ENTRY
    const [newAssignmentStoreSubmittedDate, setNewAssignmentStoreSubmittedDate] = useState(false);
    const [newAssignmentStoreFeedback, setNewAssignmentStoreFeedback] = useState(false);
    const [newAssignmentShareWithOptions, setNewAssignmentShareWithOptions] = useState<any[]>([]);
    const [newAssignmentShareWithSelected, setNewAssignmentShareWithSelected] = useState<string[]>([]);
    const [newAssignmentShareWithAll, setNewAssignmentShareWithAll] = useState(true);
    const [newAssignmentPointsScored, setNewAssignmentPointsScored] = useState<any[]>([]);
    const [newAssignmentStep, setNewAssignmentStep] = useState(0);
    const [newAssignmentFormErrors, setNewAssignmentFormErrors] = useState<string[]>([]);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
    const [showSubmissionDatePickerAndroid, setShowSubmissionDatePickerAndroid] = useState('');
    const [editSetupComplete, setEditSetupComplete] = useState(false);

    // STANDARDS BASED ENTRY
    const [newCategories, setNewCategories] = useState<any>({
        tag: '',
        tagsArray: [],
    });

    const [newStandards, setNewStandards] = useState<any[]>([
        {
            title: '',
            description: '',
            category: '',
        },
    ]);
    const [categoryDropdownOptions, setCategoryDropdownOptions] = useState<any[]>([]);
    const [gradeStudentsStandards, setGradeStudentsStandards] = useState<boolean>(false);

    const [assignPointsStandardDropdownOptions, setAssignPointsStandardDropdownOptions] = useState([
        {
            value: '0',
            label: 'Standard 1',
        },
    ]);
    const [assignPointsStandardSelected, setAssignPointsStandardSelected] = useState('0');
    const [standardDropdownOpen, setStandardDropdownOpen] = useState(false);

    const [newStandardsPointsScored, setNewStandardsPointsScored] = useState<any[][]>([]);
    const [masteryMap, setMasteryMap] = useState(undefined);
    const [masteryPercentageMap, setMasteryPercentageMap] = useState(undefined);
    const [masteryHighest, setMasteryHighest] = useState(-1);

    const [editEntryId, setEditEntryId] = useState('');
    const [editStandardTitle, setEditStandardTitle] = useState('');
    const [editStandardDescription, setEditStandardDescription] = useState('');
    const [editStandardCategory, setEditStandardCategory] = useState('');

    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState('');

    const [masteryDropdownOpen, setMasteryDropdownOpen] = useState('');

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

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    useEffect(() => {
        const updateStandardsDropdown: any[] = newStandards.map((standard: any, ind: number) => {
            return {
                value: ind.toString(),
                label: `Standard ${ind + 1}`,
            };
        });

        setAssignPointsStandardDropdownOptions(updateStandardsDropdown);
    }, [newStandards]);

    useEffect(() => {
        if (props.editEntryId && props.editStandard) {
            setGradebookEntryType('standards');
            setEditStandardTitle(props.editStandard.title);
            setEditStandardDescription(props.editStandard.description);
            setEditStandardCategory(props.editStandard.category ? props.editStandard.category : '');
        }
    }, [props.editEntryId, props.editStandard]);

    useEffect(() => {
        if (props.editEntryId && props.editAssignment && props.instructorGradebook) {
            const { scores } = props.editAssignment;

            if (!props.editAssignment) return;

            let shareWithAll = false;
            let storeSubmissionDate = false;
            let storeFeedback = false;

            let shareWithSelected: string[] = [];

            let gradebookPointsScored: any[] = [];

            props.instructorGradebook.users.map((user: any) => {
                const findScore = scores.find((x: any) => x.userId === user.userId);

                console.log('FindScore', findScore);

                if (!findScore) {
                    shareWithAll = false;
                } else {
                    shareWithSelected.push(user.userId);

                    if (findScore.submittedAt) {
                        storeSubmissionDate = true;
                    }

                    if (findScore.feedback) {
                        storeFeedback = true;
                    }

                    gradebookPointsScored.push({
                        _id: user.userId,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        submitted: findScore.submitted,
                        points: findScore.pointsScored ? findScore.pointsScored.toString() : '',
                        lateSubmission: findScore.lateSubmission,
                        feedback: findScore.feedback ? findScore.feedback : '',
                        submittedAt: findScore.submittedAt ? new Date(findScore.submittedAt) : undefined,
                    });
                }
            });

            setNewAssignmentTitle(props.editAssignment.title);
            setNewAssignmentDeadline(new Date(props.editAssignment.deadline));
            setNewAssignmentGradeWeight(props.editAssignment.gradeWeight.toString());
            setNewAssignmentTotalPoints(props.editAssignment.totalPoints.toString());
            setNewAssignmentPointsScored(gradebookPointsScored);
            setNewAssignmentStep(1);
            setNewAssignmentShareWithAll(shareWithAll);
            setNewAssignmentStoreFeedback(storeFeedback);
            setNewAssignmentStoreSubmittedDate(storeSubmissionDate);
            setNewAssignmentShareWithSelected(shareWithSelected);

            setEditSetupComplete(true);
        }
    }, [props.editEntryId, props.editAssignment, props.instructorGradebook]);

    // SELECT USERS TO ASSIGN POINTS TO
    useEffect(() => {
        if (newAssignmentShareWithAll) {
            let selected: string[] = [];

            props.courseStudents.map((student: any) => {
                selected.push(student._id);
            });

            setNewAssignmentShareWithSelected(selected);
        }
    }, [newAssignmentShareWithAll, props.courseStudents]);

    useEffect(() => {
        if ((props.editEntryId && editSetupComplete) || !props.editEntryId) {
            let updatePointsScored = [...newAssignmentPointsScored];

            // Add selected
            newAssignmentShareWithSelected.map((studentId: string) => {
                const alreadyAdded = updatePointsScored.find((x: any) => x._id === studentId);

                if (!alreadyAdded) {
                    const findStudent = props.courseStudents.find((x: any) => x._id === studentId);

                    updatePointsScored.push({
                        _id: findStudent._id,
                        fullName: findStudent.fullName,
                        avatar: findStudent.avatar,
                        submitted: false,
                        points: '',
                        lateSubmission: false,
                        feedback: '',
                        submittedAt: new Date(),
                    });
                }
            });

            // Remove unselected
            const filterRemoved = updatePointsScored.filter((x: any) => newAssignmentShareWithSelected.includes(x._id));

            console.log('Update New assignment points scored', filterRemoved);

            setNewAssignmentPointsScored(filterRemoved);
        }
    }, [newAssignmentShareWithSelected, props.courseStudents, props.editEntryId, editSetupComplete]);

    useEffect(() => {
        if (props.courseStudents) {
            const dropdownOptions = props.courseStudents.map((student: any) => {
                return {
                    value: student._id,
                    label: student.fullName,
                };
            });

            const dropdownSelected = props.courseStudents.map((student: any) => student._id);

            setNewAssignmentShareWithOptions(dropdownOptions);
            setNewAssignmentShareWithSelected(dropdownSelected);

            // Standard based

            const standardsPointsScores: any[] = props.courseStudents.map((student: any) => {
                return {
                    _id: student._id,
                    fullName: student.fullName,
                    avatar: student.avatar,
                    points: '',
                };
            });

            setNewStandardsPointsScored([standardsPointsScores]);
        }
    }, [props.courseStudents]);

    // Update Categories for standards
    useEffect(() => {
        // Add categories from the database here directly REMEMBER
        let categoryOptions: any[] = [...props.standardsCategories];

        console.log('New Categories', newCategories);

        newCategories.tagsArray.map((category: string) => categoryOptions.push(category));

        let removedList: string[] = [];

        categoryDropdownOptions.map((option: any) => {
            const findCategory = categoryOptions.find((category) => category === option.value);

            if (!findCategory) {
                removedList.push(option.value);
            }
        });

        categoryOptions = categoryOptions.map((option) => {
            return {
                value: option,
                label: option,
            };
        });

        let updateStandards: any[] = [...newStandards];

        newStandards.map((standard: any) => {
            if (removedList.includes(standard.category)) {
                return {
                    ...standard,
                    category: '',
                };
            }

            return standard;
        });

        setNewStandards(updateStandards);

        // Update new Standards to remove categories that are not present in the dropdown
        setCategoryDropdownOptions(categoryOptions);
    }, [newCategories, props.standardsCategories]);

    const resetNewEntryForm = () => {
        // Assignment
        setNewAssignmentTitle('');
        setNewAssignmentGradeWeight('');
        setNewAssignmentTotalPoints('');
        setNewAssignmentDeadline(new Date());
        setNewAssignmentPointsScored([]);
        setNewAssignmentFormErrors([]);
        setNewAssignmentStoreFeedback(false);
        setNewAssignmentStoreSubmittedDate(false);
        setNewAssignmentShareWithAll(true);
        setNewAssignmentStep(0);
        setEditEntryId('');
        setGradebookEntryType('assignment');
        setEditStandardTitle('');
        setEditStandardDescription('');
        setEditStandardCategory('');

        // Reset assignment points scored
        let selected: string[] = [];

        props.courseStudents.map((student: any) => {
            selected.push(student._id);
        });

        setNewAssignmentShareWithSelected(selected);

        // Standards
        setNewStandards([
            {
                title: '',
                description: '',
                category: '',
            },
        ]);

        const standardsPointsScores: any[] = props.courseStudents.map((student: any) => {
            return {
                _id: student._id,
                fullName: student.fullName,
                avatar: student.avatar,
                points: '',
            };
        });

        setNewStandardsPointsScored([standardsPointsScores]);

        // Refetch Categories
    };

    const handleDeleteAssignment = useCallback(async () => {
        setIsDeletingAssignment(true);

        if (gradebookEntryType === 'assignment') {
            const server = fetchAPI('');

            server
                .mutate({
                    mutation: deleteGradebookEntry,
                    variables: {
                        entryId: editEntryId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.delete) {
                        Alert('Deleted Gradebook entry successfully.');
                        resetNewEntryForm();
                        props.onClose();
                        // Reload gradebook
                        props.refreshAssignmentData();
                    } else {
                        Alert('Failed to delete gradebook entry.');
                    }
                    setIsDeletingAssignment(false);
                })
                .catch((e) => {
                    console.log('Error', e);
                    Alert('Failed to delete gradebook entry.');
                    setIsDeletingAssignment(false);
                });
        } else {
            const server = fetchAPI('');

            server
                .mutate({
                    mutation: handleDeleteStandard,
                    variables: {
                        standardId: editEntryId,
                    },
                })
                .then((res) => {
                    if (res.data.standard && res.data.standard.deleteStandard) {
                        Alert('Deleted Standard successfully.');
                        resetNewEntryForm();
                        props.setShowNewAssignment(false);
                        // Reload gradebook
                        props.refreshStandardsData();
                    } else {
                        Alert('Failed to delete gradebook entry.');
                    }
                    setIsDeletingAssignment(false);
                })
                .catch((e) => {
                    console.log('Error', e);
                    Alert('Failed to delete gradebook entry.');
                    setIsDeletingAssignment(false);
                });
        }
    }, []);

    const handleCreateAssignment = useCallback(
        async (editing?: boolean) => {
            setIsCreatingAssignment(true);

            let errors = [];

            if (gradebookEntryType === 'assignment') {
                if (!newAssignmentTitle || newAssignmentTitle === '') {
                    errors.push('Title is required for the assignment.');
                }

                if (
                    newAssignmentTotalPoints === '' ||
                    Number.isNaN(Number(newAssignmentTotalPoints)) ||
                    Number(newAssignmentTotalPoints) < 0
                ) {
                    errors.push('Enter valid total points for the assignment.');
                }

                if (
                    newAssignmentGradeWeight === '' ||
                    Number.isNaN(Number(newAssignmentGradeWeight)) ||
                    Number(newAssignmentGradeWeight) < 0
                ) {
                    errors.push('Enter valid grade weight for the assignment.');
                }

                // Validate each user entry
                newAssignmentPointsScored.map((user) => {
                    //
                    if (user.submitted) {
                        if (!user.points || Number.isNaN(Number(user.points))) {
                            errors.push(`Enter valid points for student ${user.fullName}.`);
                        }
                    }
                });

                if (errors.length > 0) {
                    setNewAssignmentFormErrors(errors);
                    setIsCreatingAssignment(false);
                    return;
                }

                // Sanitize
                const sanitizeScores = newAssignmentPointsScored.map((user: any) => {
                    return {
                        userId: user._id,
                        submitted: user.submitted,
                        points: user.submitted ? Number(user.points) : undefined,
                        lateSubmission:
                            user.submitted && !newAssignmentStoreSubmittedDate ? user.lateSubmission : undefined,
                        submittedAt: user.submitted && newAssignmentStoreSubmittedDate ? user.submittedAt : undefined,
                        feedback: user.submitted && newAssignmentStoreFeedback ? user.feedback : undefined,
                    };
                });

                //
                const gradebookEntryInput = {
                    title: newAssignmentTitle,
                    totalPoints: Number(newAssignmentTotalPoints),
                    gradeWeight: Number(newAssignmentGradeWeight),
                    deadline: newAssignmentDeadline,
                    channelId: props.channelId,
                    scores: sanitizeScores,
                };

                console.log('New Assignment Input', gradebookEntryInput);

                const server = fetchAPI('');

                if (editing) {
                    server
                        .mutate({
                            mutation: editGradebookEntry,
                            variables: {
                                gradebookEntryInput,
                                entryId: props.editEntryId,
                            },
                        })
                        .then((res) => {
                            if (res.data.gradebook && res.data.gradebook.edit) {
                                Alert('Updated Gradebook entry successfully.');
                                resetNewEntryForm();
                                props.onClose();
                                // Reload gradebook
                                props.refreshAssignmentData();
                            } else {
                                Alert('Failed to update gradebook entry.');
                            }
                            setIsCreatingAssignment(false);
                        })
                        .catch((e) => {
                            console.log('Error', e);
                            Alert('Failed to update gradebook entry.');
                            setIsCreatingAssignment(false);
                        });
                } else {
                    server
                        .mutate({
                            mutation: createGradebookEntry,
                            variables: {
                                gradebookEntryInput,
                            },
                        })
                        .then((res) => {
                            if (res.data.gradebook && res.data.gradebook.create) {
                                Alert('Created Gradebook entry successfully.');
                                resetNewEntryForm();
                                props.onClose();
                                // Reload gradebook
                                props.refreshAssignmentData();
                            } else {
                                Alert('Failed to create gradebook entry.');
                            }
                            setIsCreatingAssignment(false);
                        })
                        .catch((e) => {
                            console.log('Error', e);
                            Alert('Failed to update gradebook entry.');
                            setIsCreatingAssignment(false);
                        });
                }
            } else {
                if (editing) {
                    if (editStandardTitle === '') {
                        errors.push('Title is required for standard');
                    }

                    if (errors.length > 0) {
                        setNewAssignmentFormErrors(errors);
                        setIsCreatingAssignment(false);
                        return;
                    }

                    const server = fetchAPI('');

                    server
                        .mutate({
                            mutation: handleEditStandard,
                            variables: {
                                standardId: editEntryId,
                                title: editStandardTitle,
                                description: editStandardDescription,
                                category: editStandardCategory,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.standards.editStandard) {
                                Alert('Updated Standard successfully.');
                                props.onClose();
                                resetNewEntryForm();
                                props.refreshStandardsData();
                            } else {
                                Alert('Failed to edit Standard.');
                            }
                            setIsCreatingAssignment(false);
                        })
                        .catch((e) => {
                            Alert('Failed to edit Standard.');
                        });
                } else {
                    newStandards.map((standard: any, ind: number) => {
                        if (standard.title === '' || !standard.title) {
                            errors.push(`Enter title for standard ${ind + 1}`);
                        }
                    });

                    let sanitizeStandardsScores: any[] = [];

                    // Sanitize
                    if (gradeStudentsStandards) {
                        sanitizeStandardsScores = newStandardsPointsScored.map((standard: any) => {
                            let scoresWithNumbers: any[] = [];

                            standard.map((user: any) => {
                                if (user.points && user.points !== '') {
                                    scoresWithNumbers.push({
                                        userId: user._id,
                                        points: Number(user.points),
                                    });
                                }
                            });

                            return scoresWithNumbers;
                        });
                    }

                    console.log('Standards input', {
                        standards: newStandards,
                        standardsScores: gradeStudentsStandards ? sanitizeStandardsScores : undefined,
                        channelId: props.channelId,
                    });

                    const server = fetchAPI('');

                    server
                        .mutate({
                            mutation: createStandards,
                            variables: {
                                standardsInput: {
                                    standards: newStandards,
                                    standardsScores: gradeStudentsStandards ? sanitizeStandardsScores : undefined,
                                    channelId: props.channelId,
                                },
                            },
                        })
                        .then((res) => {
                            if (res.data.standards && res.data.standards.create) {
                                Alert('Created Gradebook entry successfully.');
                                props.onClose();
                                resetNewEntryForm();
                                props.refreshStandardsData();
                            } else {
                                Alert('Failed to create gradebook entry.');
                            }
                            setIsCreatingAssignment(false);
                        })
                        .catch((e) => {
                            console.log('Error', e);
                            Alert('Failed to update gradebook entry.');
                            setIsCreatingAssignment(false);
                        });
                }
            }
        },
        [
            gradebookEntryType,
            newAssignmentTitle,
            newAssignmentTotalPoints,
            newAssignmentGradeWeight,
            newAssignmentDeadline,
            newAssignmentPointsScored,
            newAssignmentStoreFeedback,
            newAssignmentStoreSubmittedDate,
            newStandards,
            newStandardsPointsScored,
            editStandardTitle,
            editStandardDescription,
            editStandardCategory,
        ]
    );

    console.log('Gradebook Entry Points Scored', newAssignmentPointsScored);

    const renderNewAssignmentDeadlineDateTimepicker = () => {
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
                        value={newAssignmentDeadline}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);

                            setNewAssignmentDeadline(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showNewAssignmentDeadlineDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={{
                            width: 125,
                            height: 45,
                            borderRadius: 10,
                            marginLeft: 10,
                        }}
                        value={newAssignmentDeadline}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowNewAssignmentDeadlineDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowNewAssignmentDeadlineDateAndroid(false);
                            setNewAssignmentDeadline(roundedValue);
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
                                setShowNewAssignmentDeadlineDateAndroid(true);
                                setShowNewAssignmentDeadlineTimeAndroid(false);
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
                                setShowNewAssignmentDeadlineDateAndroid(false);
                                setShowNewAssignmentDeadlineTimeAndroid(true);
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
                        style={{
                            width: 125,
                            height: 45,
                            borderRadius: 10,
                            marginLeft: 10,
                        }}
                        value={newAssignmentDeadline}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setNewAssignmentDeadline(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showNewAssignmentDeadlineTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={{
                            width: 125,
                            height: 45,
                            borderRadius: 10,
                            marginLeft: 10,
                        }}
                        value={newAssignmentDeadline}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowNewAssignmentDeadlineTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowNewAssignmentDeadlineTimeAndroid(false);
                            setNewAssignmentDeadline(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderSubmissionButtons = () => {
        return (
            <View
                style={{
                    width: '100%',
                    alignItems: 'center',
                    marginBottom: 40,
                    marginTop: 50,
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
                            onPress={() => handleCreateAssignment(true)}
                            disabled={isCreatingAssignment || props.user.email === disableEmailId}
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
                                {isCreatingAssignment ? '...' : 'EDIT'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                marginBottom: 20,
                            }}
                            onPress={() => handleDeleteAssignment()}
                            disabled={isDeletingAssignment || props.user.email === disableEmailId}
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
                                {isDeletingAssignment ? '...' : 'DELETE'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={{
                            marginBottom: 20,
                        }}
                        onPress={() => handleCreateAssignment(false)}
                        disabled={isCreatingAssignment || props.user.email === disableEmailId}
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
                            {isCreatingAssignment ? '...' : 'CREATE'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderFormErrors = () => {
        return (
            <View>
                {/* Form errors */}
                {newAssignmentFormErrors.length > 0 ? (
                    <View
                        style={{
                            borderRadius: 12,
                            padding: 20,
                            backgroundColor: '#FEF2FE',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            marginTop: 0,
                        }}
                    >
                        <View style={{ backgroundColor: '#FEF2FE' }}>
                            <Ionicons name={'close-circle'} size={16} color={'#F8719D'} />
                        </View>
                        <View
                            style={{
                                paddingLeft: 10,
                                backgroundColor: '#FEF2FE',
                            }}
                        >
                            <View style={{ backgroundColor: '#FEF2FE' }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#991B1B',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    There were {newAssignmentFormErrors.length} errors with your submission
                                </Text>
                            </View>
                            <View
                                style={{
                                    paddingLeft: 10,
                                    marginTop: 10,
                                    backgroundColor: '#FEF2FE',
                                }}
                            >
                                {newAssignmentFormErrors.map((error) => {
                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingBottom: 7,
                                                backgroundColor: '#FEF2FE',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#B91C1C',
                                                }}
                                            >
                                                -
                                            </Text>
                                            <View
                                                style={{
                                                    paddingLeft: 10,
                                                    backgroundColor: '#FEF2FE',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#B91C1C',
                                                    }}
                                                >
                                                    {error}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderAssignmentGradebookEntry = () => {
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
                        value={newAssignmentTitle}
                        placeholder={''}
                        onChangeText={(val) => setNewAssignmentTitle(val)}
                        placeholderTextColor={'#1F1F1F'}
                        required={true}
                    />
                </View>

                <View style={{ width: '100%', flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column' }}>
                    <View
                        style={{
                            flexDirection: 'row',
                        }}
                    >
                        <View
                            style={{
                                width: Dimensions.get('window').width > 768 ? '33%' : '50%',
                                paddingRight: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Total Points
                            </Text>
                            <CustomTextInput
                                value={newAssignmentTotalPoints}
                                placeholder={''}
                                onChangeText={(val) => setNewAssignmentTotalPoints(val)}
                                keyboardType="numeric"
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        <View
                            style={{
                                width: Dimensions.get('window').width > 768 ? '33%' : '50%',
                                paddingRight: Dimensions.get('window').width > 768 ? 20 : 0,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Grade Weight
                            </Text>
                            <CustomTextInput
                                value={newAssignmentGradeWeight}
                                placeholder={''}
                                onChangeText={(val) => setNewAssignmentGradeWeight(val)}
                                placeholderTextColor={'#1F1F1F'}
                                keyboardType="numeric"
                                required={true}
                            />
                        </View>
                    </View>
                    <View
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                            alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
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
                            Deadline
                            {/* {PreferredLanguageText("repeatTill")}{" "} */}
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(newAssignmentDeadline)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        <View
                            style={{
                                // width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                                flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                backgroundColor: '#fff',
                                marginTop: Platform.OS === 'ios' ? 0 : 12,
                                marginLeft: Platform.OS === 'ios' ? 'auto' : 0,
                            }}
                        >
                            {renderNewAssignmentDeadlineDateTimepicker()}
                        </View>
                    </View>

                    {/* OPTIONS */}
                    <View
                        style={{
                            flexDirection: 'column',
                            width: '100%',
                            marginTop: 30,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Options
                        </Text>
                        {/* Store submission date */}
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                padding: 10,
                                marginTop: 10,
                            }}
                        >
                            {/* Checkbox */}
                            <View>
                                <BouncyCheckbox
                                    style={{ marginRight: 5 }}
                                    isChecked={newAssignmentStoreSubmittedDate}
                                    disableText={true}
                                    onPress={(e: any) => {
                                        setNewAssignmentStoreSubmittedDate(!newAssignmentStoreSubmittedDate);
                                    }}
                                />
                            </View>
                            {/* Option */}
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    paddingLeft: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    Record submission date
                                </Text>
                                <Text style={{ marginTop: 10 }}>
                                    Check if you wish to store when the student submitted the assignment
                                </Text>
                            </View>
                        </View>

                        {/* Store feedback */}
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                padding: 10,
                            }}
                        >
                            {/* Checkbox */}
                            <View>
                                <BouncyCheckbox
                                    style={{ marginRight: 5 }}
                                    isChecked={newAssignmentStoreFeedback}
                                    disableText={true}
                                    onPress={(e: any) => {
                                        setNewAssignmentStoreFeedback(!newAssignmentStoreFeedback);
                                    }}
                                />
                            </View>
                            {/* Option */}
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    paddingLeft: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    Give feedback
                                </Text>
                                <Text style={{ marginTop: 10 }}>
                                    Check if you wish to give feedback for each student
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/*  */}

                    <View style={{ width: '100%', marginTop: 30 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Assign scores
                        </Text>

                        {newAssignmentStep === 1 ? (
                            <View
                                style={{
                                    marginTop: 20,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    maxHeight: 500,
                                    overflow: 'scroll',
                                }}
                            >
                                <ScrollView
                                    showsHorizontalScrollIndicator={true}
                                    horizontal={true}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
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
                                        }}
                                        key={'-'}
                                    >
                                        <View
                                            style={{
                                                height: 50,
                                                width: 120,
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
                                                width: 120,
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
                                                Submitted
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                height: 50,
                                                width: 120,
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
                                                Score
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                height: 50,
                                                width: 120,
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
                                                {newAssignmentStoreSubmittedDate ? 'Date' : 'Late'}
                                            </Text>
                                        </View>
                                        {newAssignmentStoreFeedback ? (
                                            <View
                                                style={{
                                                    height: 50,
                                                    width: 120,
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
                                                    Feedback
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <ScrollView
                                        showsVerticalScrollIndicator={true}
                                        horizontal={false}
                                        contentContainerStyle={{
                                            width: '100%',
                                        }}
                                        nestedScrollEnabled={true}
                                    >
                                        {newAssignmentPointsScored.map((student, studentIdx) => {
                                            return (
                                                <View
                                                    style={{
                                                        minHeight: 70,
                                                        flexDirection: 'row',
                                                        overflow: 'hidden',
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#f2f2f2',
                                                    }}
                                                    key={studentIdx}
                                                >
                                                    <View
                                                        style={{
                                                            height: 90,
                                                            width: 120,
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
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
                                                            width: 120,
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Switch
                                                                value={student.submitted}
                                                                onValueChange={() => {
                                                                    const updatePointsScored = [
                                                                        ...newAssignmentPointsScored,
                                                                    ];

                                                                    updatePointsScored[studentIdx].submitted =
                                                                        !student.submitted;
                                                                    updatePointsScored[studentIdx].points = '';
                                                                    updatePointsScored[studentIdx].lateSubmission =
                                                                        false;

                                                                    setNewAssignmentPointsScored(updatePointsScored);
                                                                }}
                                                                style={{ height: 20 }}
                                                                trackColor={{
                                                                    false: '#f2f2f2',
                                                                    true: '#000',
                                                                }}
                                                                activeThumbColor="white"
                                                            />
                                                        </View>
                                                    </View>

                                                    <View
                                                        style={{
                                                            height: 90,
                                                            width: 120,
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {!student.submitted ? (
                                                                <Text
                                                                    style={{
                                                                        width: 80,
                                                                    }}
                                                                >
                                                                    -
                                                                </Text>
                                                            ) : (
                                                                <TextInput
                                                                    value={student.points}
                                                                    placeholder={''}
                                                                    onChangeText={(val) => {
                                                                        const updatePointsScored = [
                                                                            ...newAssignmentPointsScored,
                                                                        ];

                                                                        updatePointsScored[studentIdx].points = val;

                                                                        setNewAssignmentPointsScored(
                                                                            updatePointsScored
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        width: 80,
                                                                        marginRight: 5,
                                                                        padding: 8,
                                                                        borderColor: '#ccc',
                                                                        borderWidth: 1,
                                                                        fontSize: 14,
                                                                    }}
                                                                    keyboardType="numeric"
                                                                    placeholderTextColor={'#1F1F1F'}
                                                                />
                                                            )}
                                                        </View>
                                                    </View>

                                                    <View
                                                        style={{
                                                            height: 90,
                                                            width: 120,
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {!student.submitted ? (
                                                                <Text>-</Text>
                                                            ) : newAssignmentStoreSubmittedDate ? (
                                                                <View
                                                                    style={{
                                                                        marginTop: 10,
                                                                    }}
                                                                >
                                                                    <View
                                                                        style={{
                                                                            backgroundColor: '#fff',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            // marginLeft: 'auto',
                                                                        }}
                                                                    >
                                                                        {Platform.OS === 'ios' ? (
                                                                            <DateTimePicker
                                                                                themeVariant="light"
                                                                                style={{
                                                                                    width: 125,
                                                                                    height: 45,
                                                                                    borderRadius: 10,
                                                                                    marginLeft: 10,
                                                                                }}
                                                                                value={student.submittedAt}
                                                                                mode={'date'}
                                                                                textColor={'#2f2f3c'}
                                                                                onChange={(event, selectedDate) => {
                                                                                    if (!selectedDate) return;
                                                                                    const currentDate: any =
                                                                                        selectedDate;
                                                                                    const roundedValue =
                                                                                        roundSeconds(currentDate);

                                                                                    const updatePointsScored = [
                                                                                        ...newAssignmentPointsScored,
                                                                                    ];

                                                                                    updatePointsScored[
                                                                                        studentIdx
                                                                                    ].submittedAt = roundedValue;

                                                                                    setNewAssignmentPointsScored(
                                                                                        updatePointsScored
                                                                                    );
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                        {Platform.OS === 'android' &&
                                                                        showSubmissionDatePickerAndroid ===
                                                                            studentIdx.toString() ? (
                                                                            <DateTimePicker
                                                                                themeVariant="light"
                                                                                style={{
                                                                                    width: 125,
                                                                                    height: 45,
                                                                                    borderRadius: 10,
                                                                                    marginLeft: 10,
                                                                                }}
                                                                                value={student.submittedAt}
                                                                                mode={'date'}
                                                                                textColor={'#2f2f3c'}
                                                                                onChange={(event, selectedDate) => {
                                                                                    if (!selectedDate) return;
                                                                                    const currentDate: any =
                                                                                        selectedDate;

                                                                                    const updatePointsScored = [
                                                                                        ...newAssignmentPointsScored,
                                                                                    ];

                                                                                    updatePointsScored[
                                                                                        studentIdx
                                                                                    ].submittedAt = currentDate;

                                                                                    setNewAssignmentPointsScored(
                                                                                        updatePointsScored
                                                                                    );
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                        {Platform.OS === 'android' ? (
                                                                            <Text>
                                                                                {moment(
                                                                                    new Date(student.submittedAt)
                                                                                ).format('MMMM Do YYYY')}
                                                                            </Text>
                                                                        ) : null}
                                                                        {Platform.OS === 'android' ? (
                                                                            <View
                                                                                style={{
                                                                                    flexDirection: 'row',
                                                                                    marginTop: 12,
                                                                                    backgroundColor: '#fff',
                                                                                    marginLeft:
                                                                                        Dimensions.get('window').width <
                                                                                        768
                                                                                            ? 0
                                                                                            : 10,
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
                                                                                        setShowSubmissionDatePickerAndroid(
                                                                                            studentIdx.toString()
                                                                                        );
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
                                                                </View>
                                                            ) : (
                                                                <Switch
                                                                    value={student.lateSubmission}
                                                                    onValueChange={() => {
                                                                        const updatePointsScored = [
                                                                            ...newAssignmentPointsScored,
                                                                        ];

                                                                        updatePointsScored[studentIdx].lateSubmission =
                                                                            !student.lateSubmission;

                                                                        setNewAssignmentPointsScored(
                                                                            updatePointsScored
                                                                        );
                                                                    }}
                                                                    style={{ height: 20 }}
                                                                    trackColor={{
                                                                        false: '#f2f2f2',
                                                                        true: '#000',
                                                                    }}
                                                                    activeThumbColor="white"
                                                                />
                                                            )}
                                                        </View>
                                                    </View>

                                                    {newAssignmentStoreFeedback ? (
                                                        <View
                                                            style={{
                                                                height: 90,
                                                                width: 120,
                                                                justifyContent: 'center',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                padding: 7,
                                                                borderBottomColor: '#f2f2f2',
                                                                borderBottomWidth:
                                                                    Dimensions.get('window').width < 768 ? 0 : 1,
                                                            }}
                                                        >
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                {!student.submitted ? (
                                                                    <Text>-</Text>
                                                                ) : (
                                                                    <View
                                                                        style={{
                                                                            flexDirection: 'row',
                                                                            justifyContent: 'center',
                                                                            paddingVertical: 10,
                                                                        }}
                                                                    >
                                                                        <TextInput
                                                                            multiline={true}
                                                                            numberOfLines={3}
                                                                            style={{
                                                                                padding: 8,
                                                                                borderColor: '#ccc',
                                                                                borderWidth: 1,
                                                                                fontSize: 14,
                                                                                minWidth: '100%',
                                                                            }}
                                                                            value={student.feedback}
                                                                            onChangeText={(val) => {
                                                                                const updatePointsScored = [
                                                                                    ...newAssignmentPointsScored,
                                                                                ];

                                                                                updatePointsScored[
                                                                                    studentIdx
                                                                                ].feedback = val;

                                                                                setNewAssignmentPointsScored(
                                                                                    updatePointsScored
                                                                                );
                                                                            }}
                                                                        />
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </ScrollView>
                            </View>
                        ) : (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    width: '100%',
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingTop: 20,
                                    }}
                                >
                                    <Switch
                                        value={newAssignmentShareWithAll}
                                        onValueChange={() => setNewAssignmentShareWithAll(!newAssignmentShareWithAll)}
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
                                        All Students
                                    </Text>
                                </View>

                                {newAssignmentShareWithAll ? null : (
                                    <View style={{ marginTop: 30 }}>
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                display: 'flex',
                                                height: isUsersDropdownOpen
                                                    ? getDropdownHeight(newAssignmentShareWithOptions.length)
                                                    : 50,
                                                maxWidth: 600,
                                                marginBottom: isUsersDropdownOpen ? 20 : 0,
                                            }}
                                        >
                                            <DropDownPicker
                                                disabled={newAssignmentShareWithAll}
                                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                                multiple={true}
                                                open={isUsersDropdownOpen}
                                                value={newAssignmentShareWithSelected}
                                                items={newAssignmentShareWithOptions}
                                                setOpen={setIsUsersDropdownOpen}
                                                setValue={setNewAssignmentShareWithSelected}
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
                                )}
                            </View>
                        )}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                marginTop: 20,
                            }}
                        >
                            <Text>Step {newAssignmentStep + 1} / 2</Text>

                            <TouchableOpacity
                                disabled={newAssignmentShareWithSelected.length === 0}
                                style={{
                                    backgroundColor: 'black',
                                    paddingVertical: 12,
                                    paddingHorizontal: 18,
                                }}
                                onPress={() => {
                                    if (newAssignmentStep === 0) {
                                        setNewAssignmentStep(1);
                                    } else {
                                        setNewAssignmentStep(0);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        color: '#fff',
                                    }}
                                >
                                    {newAssignmentStep === 0
                                        ? newAssignmentShareWithSelected.length === 0
                                            ? 'No Selections'
                                            : 'Next'
                                        : 'Back'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    console.log('categoryDropdownOptions', categoryDropdownOptions);
    const renderStandardsGradebookEntry = () => {
        return (
            <View
                style={{
                    width: '100%',
                }}
            >
                <View style={{ width: '100%' }}>
                    {/* Lists of standards */}
                    <View
                        style={{
                            width: '100%',
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            New Categories
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            width: '100%',
                        }}
                    >
                        <TagInput
                            inputStyle={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                color: '#000',
                                fontFamily: 'inter',
                                fontSize: 14,
                                width: '100%',
                                padding: 7,
                            }}
                            containerStyle={{
                                paddingHorizontal: 0,
                            }}
                            tagStyle={{
                                backgroundColor: '#f8f8f8',
                                padding: 3,
                            }}
                            updateState={(newTags: any) => setNewCategories(newTags)}
                            tags={newCategories}
                        />
                    </View>
                </View>

                <View style={{ width: '100%', marginTop: 25 }}>
                    <View
                        style={{
                            width: '100%',
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Standards
                        </Text>
                    </View>
                    {/*  */}
                    <View
                        style={{
                            flexDirection: 'column',
                        }}
                    >
                        {newStandards.map((standard: any, ind: number) => {
                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: Dimensions.get('window').width > 768 ? 'center' : 'flex-start',
                                        paddingVertical: 20,
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                    }}
                                >
                                    {/* Number */}
                                    <Text
                                        style={{
                                            fontSize: 21,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {ind + 1}.
                                    </Text>
                                    {/* Title */}
                                    <View
                                        style={{
                                            flexDirection: Dimensions.get('window').width > 768 ? 'row' : 'column',
                                            flex: 1,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width > 768 ? '40%' : '100%',
                                                paddingLeft: 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    marginBottom: 10,
                                                }}
                                            >
                                                Title
                                            </Text>

                                            <TextInput
                                                value={standard.points}
                                                placeholder={''}
                                                onChangeText={(val) => {
                                                    const updateStandards = [...newStandards];

                                                    updateStandards[ind].title = val;

                                                    setNewStandards(updateStandards);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    marginRight: 5,
                                                    padding: 8,
                                                    borderColor: '#ccc',
                                                    borderWidth: 1,
                                                    fontSize: 14,
                                                    height: 40,
                                                }}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>
                                        {/* Description */}
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width > 768 ? '40%' : '100%',
                                                marginTop: Dimensions.get('window').width > 768 ? 0 : 20,
                                                paddingLeft: 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    marginBottom: 10,
                                                }}
                                            >
                                                Description
                                            </Text>
                                            <TextInput
                                                value={standard.description}
                                                placeholder={''}
                                                onChangeText={(val) => {
                                                    const updateStandards = [...newStandards];

                                                    updateStandards[ind].description = val;

                                                    setNewStandards(updateStandards);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    marginRight: 5,
                                                    padding: 8,
                                                    borderColor: '#ccc',
                                                    borderWidth: 1,
                                                    fontSize: 14,
                                                    minHeight: 40,
                                                }}
                                                multiline={true}
                                                // numberOfLines={2}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>
                                        {/* Dropdown */}
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width > 768 ? '20%' : '100%',
                                                marginTop: Dimensions.get('window').width > 768 ? 0 : 20,
                                                paddingLeft: 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    marginBottom: 10,
                                                }}
                                            >
                                                Category
                                            </Text>

                                            <View
                                                style={{
                                                    height:
                                                        categoryDropdownOpen === ind.toString()
                                                            ? getDropdownHeight(categoryDropdownOptions.length)
                                                            : 50,
                                                    zIndex: categoryDropdownOpen === ind.toString() ? 1 : 0,
                                                }}
                                            >
                                                <DropDownPicker
                                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                                    open={categoryDropdownOpen === ind.toString()}
                                                    value={standard.category}
                                                    items={categoryDropdownOptions}
                                                    setOpen={(open: boolean) => {
                                                        setCategoryDropdownOpen(open ? ind.toString() : '');
                                                    }}
                                                    onSelectItem={(val) => {
                                                        console.log('Value', val);

                                                        const updateStandards = [...newStandards];

                                                        updateStandards[ind].category = val.value;

                                                        setNewStandards(updateStandards);
                                                    }}
                                                    // zIndex={1000001}
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
                                                        shadowOpacity:
                                                            categoryDropdownOpen !== ind.toString() ? 0 : 0.08,
                                                        shadowRadius: 12,
                                                    }}
                                                    textStyle={{
                                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                        fontFamily: 'overpass',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                    {newStandards.length > 1 ? (
                                        <TouchableOpacity
                                            style={{
                                                paddingLeft: 20,
                                            }}
                                            onPress={() => {
                                                const updateStandards = [...newStandards];
                                                updateStandards.splice(ind, 1);
                                                setNewStandards(updateStandards);

                                                const updateStandardsPointsScored = [...newStandardsPointsScored];
                                                updateStandardsPointsScored.splice(ind, 1);
                                                setNewStandardsPointsScored(updateStandardsPointsScored);

                                                //
                                                if (Number(assignPointsStandardSelected) < updateStandards.length) {
                                                    setAssignPointsStandardSelected('0');
                                                }
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#000" />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            );
                        })}

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                }}
                                onPress={() => {
                                    const updateStandards: any[] = [...newStandards];
                                    updateStandards.push({
                                        title: '',
                                        description: '',
                                        category: '',
                                    });
                                    setNewStandards(updateStandards);

                                    //
                                    const updateStandardsPointsScored = [...newStandardsPointsScored];

                                    const standardsPointsScores = props.courseStudents.map((student: any) => {
                                        return {
                                            _id: student._id,
                                            fullName: student.fullName,
                                            avatar: student.avatar,
                                            points: '',
                                        };
                                    });

                                    updateStandardsPointsScored.push(standardsPointsScores);

                                    setNewStandardsPointsScored(updateStandardsPointsScored);
                                }}
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
                                    Add Row
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {/*  */}

                <View style={{ width: '100%', marginTop: 25 }}>
                    <View
                        style={{
                            width: '100%',
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Options
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            width: '100%',
                            borderBottomColor: '#f2f2f2',
                            borderBottomWidth: 1,
                            padding: 10,
                        }}
                    >
                        {/* Checkbox */}
                        <View>
                            <BouncyCheckbox
                                style={{ marginRight: 5 }}
                                isChecked={gradeStudentsStandards}
                                disableText={true}
                                onPress={(e: any) => {
                                    setGradeStudentsStandards(!gradeStudentsStandards);
                                }}
                            />
                        </View>
                        {/* Option */}
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'column',
                                paddingLeft: 15,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                }}
                            >
                                Grade Students
                            </Text>
                            <Text style={{ marginTop: 10 }}>
                                Check if you wish to assign points for each student before creating standards
                            </Text>
                        </View>
                    </View>

                    {/* Grade students */}

                    {gradeStudentsStandards ? (
                        <View
                            style={{
                                width: '100%',
                                marginTop: 20,
                            }}
                        >
                            {newStandards.length > 1 ? (
                                <View style={{}}>
                                    {/*  */}
                                    <View
                                        style={{
                                            height: standardDropdownOpen
                                                ? getDropdownHeight(categoryDropdownOptions.length)
                                                : 50,
                                            zIndex: standardDropdownOpen ? 1 : 0,
                                        }}
                                    >
                                        <DropDownPicker
                                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                            open={standardDropdownOpen}
                                            value={assignPointsStandardSelected}
                                            items={assignPointsStandardDropdownOptions}
                                            setOpen={setStandardDropdownOpen}
                                            setValue={setAssignPointsStandardSelected}
                                            // zIndex={1000001}
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
                                                shadowOpacity: standardDropdownOpen ? 0 : 0.08,
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

                            <View
                                style={{
                                    marginTop: 20,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    maxHeight: 500,
                                    overflow: 'scroll',
                                    width: '100%',
                                    flexDirection: 'column',
                                }}
                            >
                                <View
                                    style={{
                                        minHeight: 50,
                                        flexDirection: 'row',
                                        overflow: 'hidden',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#f2f2f2',
                                        backgroundColor: '#f8f8f8',
                                    }}
                                    key={'-'}
                                >
                                    <View
                                        style={{
                                            height: 50,
                                            width: '50%',
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
                                            width: '50%',
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
                                            Mastery
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
                                    {newStandardsPointsScored[Number(assignPointsStandardSelected)].map(
                                        (student: any, studentIdx: number) => {
                                            console.log('Student', student);

                                            return (
                                                <View
                                                    style={{
                                                        minHeight: 70,
                                                        flexDirection: 'row',
                                                        overflow: 'hidden',
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#f2f2f2',
                                                    }}
                                                    key={studentIdx}
                                                >
                                                    <View
                                                        style={{
                                                            height: 90,
                                                            width: '50%',
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
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
                                                            width: '50%',
                                                            justifyContent: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: 7,
                                                            borderBottomColor: '#f2f2f2',
                                                            borderBottomWidth:
                                                                Dimensions.get('window').width < 768 ? 0 : 1,
                                                        }}
                                                    >
                                                        <Menu
                                                            onSelect={(value: any) => {
                                                                const updateStandardsPointsScored = [
                                                                    ...newStandardsPointsScored,
                                                                ];

                                                                updateStandardsPointsScored[
                                                                    Number(assignPointsStandardSelected)
                                                                ][studentIdx].points = value;

                                                                setNewStandardsPointsScored(
                                                                    updateStandardsPointsScored
                                                                );
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
                                                                    {student.points === ''
                                                                        ? 'Not assigned'
                                                                        : props.masteryMap[student.points.toString()]}
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
                                                                {props.masteryDropdownOptions.map((item: any) => {
                                                                    return (
                                                                        <MenuOption value={item.value}>
                                                                            <Text
                                                                                style={{
                                                                                    fontSize: 15,
                                                                                    fontFamily: 'Inter',
                                                                                    paddingBottom: 3,
                                                                                }}
                                                                            >
                                                                                {item.value === ''
                                                                                    ? 'Not assigned'
                                                                                    : item.label}
                                                                            </Text>
                                                                        </MenuOption>
                                                                    );
                                                                })}
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View>
                                                </View>
                                            );
                                        }
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    ) : null}
                </View>
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
                    {props.editEntryId ? 'Edit' : 'New '} Gradebook Entry
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
                {/* Switch between types if there is standards based scale */}
                {props.standardsBasedScale && !props.editEntryId ? (
                    <View
                        style={{
                            width: '100%',
                            marginTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Entry type
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 15,
                                marginBottom: 30,
                            }}
                        >
                            {newEntryTabs.map((tab: any, ind: number) => {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginRight: 20,
                                        }}
                                        onPress={() => setGradebookEntryType(tab.value)}
                                    >
                                        <RadioButton selected={gradebookEntryType === tab.value} />
                                        <Text
                                            style={{
                                                marginLeft: 10,
                                            }}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}
                {gradebookEntryType === 'assignment'
                    ? renderAssignmentGradebookEntry()
                    : renderStandardsGradebookEntry()}

                {renderFormErrors()}
                {renderSubmissionButtons()}
            </ScrollView>
        </View>
    );
};

export default NewAssignmentModal;
