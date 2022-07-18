// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import {
    checkChannelStatus,
    checkChannelStatusForCode,
    createChannel,
    findBySchoolId,
    subscribe,
    getUserCount,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from './CustomTextInput';
import { Text, View, TouchableOpacity } from './Themed';
import Alert from '../components/Alert';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import ColorPicker from './ColorPicker';
import alert from '../components/Alert';
import DropDownPicker from 'react-native-dropdown-picker';
import BottomSheet from './BottomSheet';
import Reanimated from 'react-native-reanimated';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { useOrientation } from '../hooks/useOrientation';
import { channelPasswordModalHeight, newCourseModalHeight } from '../helpers/ModalHeights';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user, subscriptions, refreshSubscriptions } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [fullName, setFullName] = useState('');
    const [temporary, setTemporary] = useState(false);
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [role] = useState(user.role);

    const [userCreatedOrg] = useState(user.userCreatedOrg);
    const [colorCode, setColorCode] = useState('');
    const [channels, setChannels] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [options, setOptions] = useState<any[]>([]);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinWithCode, setJoinWithCode] = useState('');
    const [joinWithCodeDisabled, setJoinWithCodeDisabled] = useState(true);
    const [showChannelPasswordInput, setShowChannelPasswordInput] = useState(false);
    const [channelPasswordId, setChannelPasswordId] = useState('');
    const [channelPassword, setChannelPassword] = useState('');

    const orientation = useOrientation();

    // NATIVE DROPDOWN
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
    const [isViewersDropdownOpen, setIsViewersDropdownOpen] = useState(false);
    const [isEditorsDropdownOpen, setIsEditorsDropdownOpen] = useState(false);
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const sections = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
    ];
    const filterRoleOptions = [
        {
            value: 'All',
            label: 'All Users',
        },
        {
            value: 'student',
            label: 'Student',
        },
        {
            value: 'instructor',
            label: 'Instructor',
        },
    ];
    const gradeOptions = grades.map((g: any) => {
        return {
            value: g,
            label: g,
        };
    });
    const filterGradeOptions = [
        {
            value: 'All',
            label: 'All Grades',
        },
        ...gradeOptions,
    ];
    const sectionOptions = sections.map((s: any) => {
        return {
            value: s,
            label: s,
        };
    });
    const filterSectionOptions = [
        {
            value: 'All',
            label: 'All Sections',
        },
        ...sectionOptions,
    ];
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');
    const [selectedValues, setSelectedValues] = useState<any[]>([]);
    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        });

        return match;
    });
    const [sortChannels, setSortChannels] = useState<any[]>([]);
    const [subIds, setSubIds] = useState<any[]>([]);
    const fall = new Reanimated.Value(1);
    const [activeTab, setActiveTab] = useState('create');

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    const server = useApolloClient();

    // HOOKS

    /**
     * @description Loads user on Init
     */
    useEffect(() => {
        fetchSchoolUsers(user.schoolId);
    }, [user]);

    useEffect(() => {
        const subSet = new Set();
        subscriptions.map((sub: any) => {
            subSet.add(sub.channelId);
        });
        setSubIds(Array.from(subSet.values()));
    }, [subscriptions]);

    useEffect(() => {
        const sort = channels.sort((a: any, b: any) => {
            const aSubscribed = subscriptions.find((sub: any) => sub.channelId === a._id);

            const bSubscribed = subscriptions.find((sub: any) => sub.channelId === b._id);

            if (aSubscribed && !bSubscribed) {
                return -1;
            } else if (!aSubscribed && bSubscribed) {
                return 1;
            } else {
                return 0;
            }
        });

        setSortChannels(sort);
    }, [channels, subscriptions]);

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {
        let filteredUsers = [...allUsers];

        // First filter by role

        if (activeRole !== 'All') {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole || selectedValues.includes(user._id);
            });

            filteredUsers = filterRoles;
        }

        if (activeGrade !== 'All') {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade || selectedValues.includes(user._id);
            });

            filteredUsers = filterGrades;
        }

        if (userId !== '') {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== userId;
            });

            filteredUsers = filterOutMainOwner;
        }

        if (activeSection !== 'All') {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id);
            });

            filteredUsers = filterSections;
        }

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                group: user.fullName[0].toUpperCase(),
                label: user.fullName + ', ' + user.email,
                value: user._id,
            };
        });

        const sort = filteredOptions.sort((a, b) => {
            if (a.group < b.group) {
                return -1;
            }
            if (a.group > b.group) {
                return 1;
            }
            return 0;
        });

        setOptions(sort);
    }, [activeRole, activeGrade, activeSection, userId]);

    /**
     * @description Validate submit for new channel
     */
    useEffect(() => {
        if (name !== '') {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [name, password, passwordRequired, props.showCreate, colorCode]);

    /**
     * @description Validate submit for join channel with code
     */
    useEffect(() => {
        if (joinWithCode !== '' && joinWithCode.length === 9) {
            setJoinWithCodeDisabled(false);
        } else {
            setJoinWithCodeDisabled(true);
        }
    }, [joinWithCode]);

    /**
     * @description Fetches channels for users
     */
    useEffect(() => {
        server
            .query({
                query: findBySchoolId,
                variables: {
                    schoolId: user.schoolId,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.channel.findBySchoolId) {
                    const fetchChannels = [...res.data.channel.findBySchoolId];

                    const sortedChannels = fetchChannels.sort((a: any, b: any) => {
                        if (a.name < b.name) {
                            return -1;
                        }
                        if (a.name > b.name) {
                            return 1;
                        }
                        return 0;
                    });

                    setChannels(sortedChannels);
                    setLoading(false);
                }
            })
            .catch((err) => {
                setLoading(false);
            });
    }, []);

    /**
     * @description Fetch all users to allow selection for Users to create channel
     */
    const fetchSchoolUsers = useCallback((schoolId) => {
        server
            .query({
                query: getUserCount,
                variables: {
                    schoolId,
                },
            })
            .then((res) => {
                const schoolUsers = [...res.data.user.getSchoolUsers];

                schoolUsers.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) {
                        return -1;
                    }
                    if (a.fullName > b.fullName) {
                        return 1;
                    }
                    return 0;
                });

                setAllUsers(schoolUsers);

                const tempUsers: any[] = [];
                schoolUsers.map((item: any, index: any) => {
                    const x = { ...item, selected: false, index };
                    delete x.__typename;
                    tempUsers.push({
                        group: item.fullName[0].toUpperCase(),
                        label: item.fullName + ', ' + item.email,
                        value: item._id,
                    });
                    return x;
                });

                const sort = tempUsers.sort((a, b) => {
                    if (a.text < b.text) {
                        return -1;
                    }
                    if (a.text > b.text) {
                        return 1;
                    }
                    return 0;
                });

                setOptions(sort);
            });
    }, []);

    /**
     * @description Subscribes user to a channel
     */
    const handleSubscribe = useCallback(
        async (channelId, pass) => {
            server
                .mutate({
                    mutation: subscribe,
                    variables: {
                        userId,
                        channelId,
                        password: pass,
                    },
                })
                .then((res) => {
                    if (res.data.subscription && res.data.subscription.subscribe) {
                        const subscriptionStatus = res.data.subscription.subscribe;
                        switch (subscriptionStatus) {
                            case 'subscribed':
                                alert('Subscribed successfully!');
                                // Refresh subscriptions
                                setShowChannelPasswordInput(false);
                                props.closeAddCourseModal();
                                refreshSubscriptions();
                                setChannelPasswordId('');
                                break;
                            case 'incorrect-password':
                                Alert(incorrectPasswordAlert);
                                break;
                            case 'already-subbed':
                                Alert(alreadySubscribedAlert);
                                break;
                            case 'error':
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                        }
                    }
                })
                .catch((err) => {
                    Alert(somethingWrongAlert, checkConnectionAlert);
                });
        },
        [props.closeModal]
    );

    /**
     * @description Fetches status of channel and depending on that handles subscription to channel
     */
    const handleSub = useCallback(
        async (channelId) => {
            server
                .query({
                    query: checkChannelStatus,
                    variables: {
                        channelId,
                    },
                })
                .then(async (res) => {
                    if (res.data.channel && res.data.channel.getChannelStatus) {
                        const channelStatus = res.data.channel.getChannelStatus;
                        switch (channelStatus) {
                            case 'password-not-required':
                                handleSubscribe(channelId, '');
                                break;
                            case 'password-required':
                                setChannelPasswordId(channelId);
                                setShowChannelPasswordInput(true);
                                break;
                            case 'non-existant':
                                Alert(doesNotExistAlert);
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                    Alert(somethingWrongAlert, checkConnectionAlert);
                });
        },
        [props.closeModal, passwordRequired, displayName, fullName, temporary]
    );

    /**
     * @description Fetches status of channel using code and then handles subscription
     */
    const handleSubmitCode = useCallback(async () => {
        server
            .query({
                query: checkChannelStatusForCode,
                variables: {
                    accessCode: joinWithCode,
                },
            })
            .then((res) => {
                if (res.data.channel && res.data.channel.getChannelStatusForCode) {
                    const channelStatus = res.data.channel.getChannelStatusForCode.split(':');

                    switch (channelStatus[0]) {
                        case 'password-not-required':
                            handleSubscribe(channelStatus[1], '');
                            break;
                        case 'password-required':
                            setChannelPasswordId(channelStatus[1]);
                            break;
                        case 'non-existant':
                            Alert(doesNotExistAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, [joinWithCode]);

    /**
     * @description Handle create new channel
     */
    const handleSubmit = useCallback(async () => {
        if (colorCode === '') {
            Alert('Select color theme for channel.');
            return;
        }

        setIsSubmitting(true);

        if (name.toString().trim() === '') {
            return;
        }

        server
            .mutate({
                mutation: createChannel,
                variables: {
                    name,
                    password,
                    createdBy: userId,
                    temporary,
                    colorCode,
                    description,
                    tags,
                    isPublic,
                    moderators: selectedModerators,
                    subscribers: selectedValues,
                },
            })
            .then((res) => {
                if (res.data.channel.create) {
                    const channelCreateStatus = res.data.channel.create;
                    setIsSubmitting(false);
                    switch (channelCreateStatus) {
                        case 'created':
                            Alert('Course created successfully');
                            props.closeModal();
                            refreshSubscriptions();
                            // Refresh subs
                            break;
                        case 'invalid-name':
                            Alert(invalidChannelNameAlert);
                            break;
                        case 'exists':
                            Alert(nameAlreadyInUseAlert);
                            break;
                        case 'error':
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                setIsSubmitting(false);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, [
        name,
        password,
        props.closeModal,
        passwordRequired,
        displayName,
        fullName,
        temporary,
        colorCode,
        description,
        isPublic,
        tags,
        selectedModerators,
        selectedValues,
    ]);

    // FUNCTIONS

    /**
     * @description Renders filters for Subscribers dropdown
     */
    const renderSubscriberFilters = () => {
        return (
            <View style={{ width: '100%', flexDirection: 'column', backgroundColor: 'white', marginTop: 20 }}>
                <View style={{ backgroundColor: 'white' }}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                            height: isRoleDropdownOpen ? 210 : 50,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            open={isRoleDropdownOpen}
                            value={activeRole}
                            items={filterRoleOptions}
                            setOpen={setIsRoleDropdownOpen}
                            setValue={setActiveRole}
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
                                shadowOpacity: !isRoleDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 15 }}>
                    <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                        <View
                            style={{
                                backgroundColor: 'white',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : 250,
                                height: isGradeDropdownOpen ? 250 : 50,
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                open={isGradeDropdownOpen}
                                value={activeGrade}
                                items={filterGradeOptions}
                                setOpen={setIsGradeDropdownOpen}
                                setValue={setActiveGrade}
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
                                    shadowOpacity: !isGradeDropdownOpen ? 0 : 0.08,
                                    shadowRadius: 12,
                                }}
                                textStyle={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'overpass',
                                }}
                            />
                        </View>
                    </View>
                    <View style={{ backgroundColor: 'white', marginLeft: 'auto' }}>
                        <View
                            style={{
                                backgroundColor: 'white',
                                maxWidth: Dimensions.get('window').width < 768 ? 150 : 250,
                                height: isSectionDropdownOpen ? 250 : 50,
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                open={isSectionDropdownOpen}
                                value={activeSection}
                                items={filterSectionOptions}
                                setOpen={setIsSectionDropdownOpen}
                                setValue={setActiveSection}
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
                                    shadowOpacity: !isSectionDropdownOpen ? 0 : 0.08,
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
            </View>
        );
    };

    const renderTabs = () => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingTop: 5 }}>
                <TouchableOpacity
                    style={activeTab === 'create' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('create');
                    }}
                >
                    <Text style={activeTab === 'create' ? styles.selectedText : styles.unselectedText}>
                        {' '}
                        {activeTab === 'create' ? 'Create Course' : 'Create'}{' '}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={activeTab !== 'create' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('join');
                    }}
                >
                    <Text style={activeTab !== 'create' ? styles.selectedText : styles.unselectedText}>
                        {activeTab === 'join' ? 'Join a Course' : 'Join'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderAddCourseModal = () => {
        return (
            <ScrollView
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                contentContainerStyle={{
                    backgroundColor: 'white',
                    width: '100%',
                    maxWidth: 600,
                    alignSelf: 'center',
                    paddingTop: Dimensions.get('window').width < 768 ? 20 : 0,
                    marginTop: orientation === 'PORTRAIT' && Dimensions.get('window').width > 768 ? 50 : 0,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                    paddingBottom:
                        Dimensions.get('window').width < 768
                            ? Platform.OS === 'ios'
                                ? 150
                                : 200
                            : orientation === 'LANDSCAPE'
                            ? 200
                            : 300,
                }}
            >
                {role !== 'instructor' || (role === 'instructor' && activeTab === 'join') ? (
                    <View
                        style={{
                            padding: 15,
                            width: '100%',
                            marginBottom: Dimensions.get('window').width < 768 ? 40 : 60,
                        }}
                    >
                        {role === 'instructor' ? null : (
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 16 : 18,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    textAlign: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                {channelPasswordId !== '' ? 'Enter course password' : 'Join with a code'}
                            </Text>
                        )}
                        {channelPasswordId === '' ? (
                            <TextInput
                                value={joinWithCode}
                                placeholder={'Access Code'}
                                textContentType={'none'}
                                autoCompleteType={'off'}
                                onChangeText={(val) => {
                                    setJoinWithCode(val);
                                }}
                                autoFocus={true}
                                placeholderTextColor={'#7d7f7c'}
                            />
                        ) : (
                            <TextInput
                                value={channelPassword}
                                placeholder={'Password'}
                                textContentType={'none'}
                                autoCompleteType={'off'}
                                onChangeText={(val) => {
                                    setChannelPassword(val);
                                }}
                                autoFocus={true}
                                placeholderTextColor={'#7d7f7c'}
                            />
                        )}
                        <TouchableOpacity
                            onPress={() => {
                                if (channelPasswordId !== '') {
                                    handleSubscribe(channelPasswordId, channelPassword);
                                } else {
                                    handleSubmitCode();
                                }
                            }}
                            disabled={joinWithCodeDisabled || user.email === disableEmailId}
                            style={{
                                marginTop: 10,
                                alignSelf: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
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
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 120,
                                }}
                            >
                                Join
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {role !== 'instructor' || (role === 'instructor' && activeTab === 'join') ? null : (
                    <View style={{ width: '100%' }}>
                        {/* <View style={{ marginBottom: 15, width: '100%', alignSelf: 'center' }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                            color: '#000000',
                            textAlign: 'center'
                        }}>
                        Create a new course
                    </Text>
                </View> */}
                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                }}
                            >
                                {/* {PreferredLanguageText('name')} */}
                                Name
                            </Text>
                            <TextInput
                                value={name}
                                placeholder={''}
                                textContentType={'none'}
                                onChangeText={(val) => {
                                    setName(val);
                                    setPasswordRequired(false);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                                // footerMessage={'case sensitive'}
                            />
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                }}
                            >
                                {/* {PreferredLanguageText('enrolmentPassword')} */}
                                Enrolment password
                            </Text>
                            <TextInput
                                value={password}
                                textContentType={'none'}
                                placeholder={'Optional'}
                                onChangeText={(val) => setPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>

                        <View
                            style={{
                                width: '100%',
                                maxWidth: 600,
                                paddingBottom: 15,
                                backgroundColor: '#ffffff',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 15,
                                    marginBottom: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontFamily: 'Inter',
                                        marginRight: 8,
                                        color: '#000000',
                                    }}
                                >
                                    Temporary
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert(
                                            'Courses that are not temporary can only be deleted by the school administrator.'
                                        );
                                    }}
                                >
                                    <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                </TouchableOpacity>
                            </View>

                            <Switch
                                value={temporary}
                                onValueChange={() => setTemporary(!temporary)}
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
                                }}
                            />
                        </View>

                        <View
                            style={{
                                width: '100%',
                                paddingVertical: 15,
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    paddingTop: 20,
                                    paddingBottom: 15,
                                    backgroundColor: 'white',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontFamily: 'Inter',
                                        color: '#000000',
                                    }}
                                >
                                    Theme
                                </Text>
                            </View>
                            <View style={{ width: '100%', backgroundColor: 'white' }}>
                                <ColorPicker color={colorCode} onChange={(color: any) => setColorCode(color)} />
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'Inter',
                                    marginRight: 8,
                                    color: '#000000',
                                }}
                            >
                                Students
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert(
                                        'Students are able to view content, provide submissions, post discussion threads and view their performance.',
                                        userCreatedOrg
                                            ? 'After creating the course, you can add new users using their emails from the settings tab.'
                                            : ''
                                    );
                                }}
                            >
                                <Ionicons name="help-circle-outline" size={18} color="#939699" />
                            </TouchableOpacity>
                        </View>

                        {!userCreatedOrg ? renderSubscriberFilters() : null}

                        <View
                            style={{
                                flexDirection: 'column',
                                marginTop: 25,
                            }}
                        >
                            <View
                                style={{
                                    maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                                    width: '100%',
                                    height: isViewersDropdownOpen ? getDropdownHeight(options.length) : 50,
                                }}
                            >
                                <DropDownPicker
                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                    multiple={true}
                                    open={isViewersDropdownOpen}
                                    value={selectedValues}
                                    items={options}
                                    setOpen={setIsViewersDropdownOpen}
                                    setValue={(val: any) => {
                                        setSelectedValues(val);
                                        // Filter out any moderator if not part of the selected values

                                        let filterRemovedModerators = selectedModerators.filter((mod: any) =>
                                            val.includes(mod)
                                        );

                                        setSelectedModerators(filterRemovedModerators);
                                    }}
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
                                        shadowOpacity: !isViewersDropdownOpen ? 0 : 0.08,
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
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 25,
                                marginBottom: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    fontFamily: 'Inter',
                                    marginRight: 8,
                                    color: '#000000',
                                }}
                            >
                                Instructors
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert(
                                        'Instructors can share content, score and view submissions for all users, initiate meetings and edit course settings, in addition to the student permissions.'
                                    );
                                }}
                            >
                                <Ionicons name="help-circle-outline" size={18} color="#939699" />
                            </TouchableOpacity>
                        </View>

                        <View
                            style={{
                                height: isEditorsDropdownOpen ? getDropdownHeight(moderatorOptions.length) : 50,
                            }}
                        >
                            <DropDownPicker
                                listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                multiple={true}
                                open={isEditorsDropdownOpen}
                                value={selectedModerators}
                                items={moderatorOptions}
                                setOpen={setIsEditorsDropdownOpen}
                                setValue={setSelectedModerators}
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
                                    shadowOpacity: !isEditorsDropdownOpen ? 0 : 0.08,
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
                                flex: 1,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'row',
                                paddingTop: 25,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handleSubmit()}
                                style={{
                                    backgroundColor: 'white',
                                    marginTop: 15,
                                    marginBottom: 50,
                                }}
                                disabled={isSubmitDisabled || isSubmitting || user.email === disableEmailId}
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
                                    {isSubmitting ? 'Creating' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderPasswordInputModal = () => {
        return (
            <View
                style={{
                    paddingHorizontal: 40,
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <View
                    style={{
                        maxWidth: 600,
                        width: '100%',
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 18 : 20,
                            color: '#000000',
                            textAlign: 'center',
                            marginBottom: 10,
                            fontFamily: 'Inter',
                        }}
                    >
                        Enter course password
                    </Text>
                    <TextInput
                        value={channelPassword}
                        placeholder={''}
                        textContentType={'none'}
                        autoCompleteType={'off'}
                        onChangeText={(val) => {
                            setChannelPassword(val);
                        }}
                        autoFocus={true}
                        placeholderTextColor={'#7d7f7c'}
                    />
                    <TouchableOpacity
                        onPress={() => {
                            setShowChannelPasswordInput(false);
                            handleSubscribe(channelPasswordId, channelPassword);
                        }}
                        disabled={channelPassword === ''}
                        style={{
                            marginTop: 10,
                            alignSelf: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
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
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            Subscribe
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View
                style={{
                    width: '100%',
                    // height: '100%',
                    // flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    alignSelf: 'center',
                    marginTop: 100,
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

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

    return (
        <View
            style={{
                width: '100%',
                maxHeight: windowHeight,
                height: '100%',
                backgroundColor: props.showCreate ? '#fff' : '#fff',
            }}
            key={1}
        >
            {props.showAddCourseModal ? (
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        paddingTop: 10,
                        paddingBottom: 15,
                        display: 'flex',
                        width: '100%',
                        paddingLeft: 25,
                    }}
                >
                    {/* <TouchableOpacity
                        style={{
                            // marginRight: 15,
                            position: 'absolute',
                            // marginRight: 'auto',
                            left: 0,
                            paddingLeft: 20,
                            paddingTop: 15
                        }}
                        onPress={() => props.setShowSettings(false)}
                    >
                        <Ionicons name={'arrow-back-outline'} size={25} color="black" />
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={{
                            paddingTop: 6,
                            paddingBottom: 4,
                            marginHorizontal: 12,
                        }}
                        disabled={true}
                    >
                        <Text
                            style={{
                                color: '#656565',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 22 : 26,
                            }}
                        >
                            Profile
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            paddingTop: 6,
                            paddingBottom: 4,
                            marginHorizontal: 12,
                            borderBottomColor: '#000',
                            borderBottomWidth: 2,
                        }}
                        disabled={true}
                    >
                        <Text
                            style={{
                                color: '#000',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 22 : 26,
                            }}
                        >
                            Courses
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            <View style={{ width: '100%', paddingBottom: 25, backgroundColor: props.showCreate ? '#fff' : '#fff' }}>
                {/* Back Button */}
                {props.showCreate ? (
                    <View
                        style={{ flexDirection: 'row', width: '100%', height: 50, marginBottom: 10, paddingLeft: 10 }}
                    >
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    props.setShowCreate(false);
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 10,
                                    alignSelf: 'flex-start',
                                    paddingBottom: 10,
                                }}
                            >
                                <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
                {/* Main Content */}
                {!props.showCreate ? (
                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                        }}
                        key={sortChannels.length + subIds.length}
                    >
                        {/* */}
                        {sortChannels.length === 0 ? (
                            <View
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#fff',
                                    paddingVertical: 100,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    No courses found. Click on + to {role === 'instructor' ? 'create ' : 'join '} a
                                    course.
                                </Text>
                            </View>
                        ) : (
                            <View
                                style={{
                                    borderColor: '#f2f2f2',
                                    backgroundColor: '#fff',
                                    overflow: 'hidden',
                                    borderRadius: 1,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 4,
                                        height: 4,
                                    },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 10,
                                }}
                            >
                                <ScrollView
                                    contentContainerStyle={{
                                        width: '100%',
                                        paddingBottom: 200,
                                        backgroundColor: 'white',
                                    }}
                                    showsVerticalScrollIndicator={true}
                                    indicatorStyle="black"
                                >
                                    {sortChannels.map((channel: any, ind: any) => {
                                        const subscribed = subIds.includes(channel._id);

                                        let role = 'Student';

                                        // Check if user is a moderator or the owner
                                        if (subscribed && userId !== '') {
                                            const isModerator = channel.owners.includes(userId);

                                            if (channel.channelCreator === userId) {
                                                role = 'Instructor';
                                            } else if (isModerator) {
                                                role = 'Instructor';
                                            }
                                        }

                                        return (
                                            <View
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    borderColor: '#f2f2f2',
                                                    borderBottomWidth: ind === channels.length - 1 ? 0 : 1,
                                                    width: '100%',
                                                    paddingVertical: 5,
                                                }}
                                                key={ind}
                                            >
                                                <View style={{ backgroundColor: '#fff', padding: 5, paddingLeft: 15 }}>
                                                    <Image
                                                        style={{
                                                            height: 40,
                                                            width: 40,
                                                            marginTop: 5,
                                                            marginLeft: 5,
                                                            marginBottom: 5,
                                                            borderRadius: 75,
                                                            alignSelf: 'center',
                                                        }}
                                                        source={{
                                                            uri: channel.createdByAvatar
                                                                ? channel.createdByAvatar
                                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                        }}
                                                    />
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 5 }}>
                                                    <Text
                                                        style={{ fontSize: 16, padding: 5, fontFamily: 'inter' }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {channel.name}
                                                    </Text>
                                                    <Text
                                                        style={{ fontSize: 14, padding: 5, fontWeight: 'bold' }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {channel.createdByUsername}
                                                    </Text>
                                                </View>
                                                <View style={{ padding: 20 }}>
                                                    {!subscribed ? (
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                paddingLeft: 10,
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    Alert('Subscribe to ' + channel.name + '?', '', [
                                                                        {
                                                                            text: 'Cancel',
                                                                            style: 'cancel',
                                                                            onPress: () => {
                                                                                return;
                                                                            },
                                                                        },
                                                                        {
                                                                            text: 'Yes',
                                                                            onPress: () => handleSub(channel._id),
                                                                        },
                                                                    ]);
                                                                }}
                                                                disabled={user.email === disableEmailId}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        textAlign: 'center',
                                                                        // fontSize: 13,
                                                                        color: '#000',
                                                                        marginRight: 10,
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    <Ionicons name="enter-outline" size={24} />
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                paddingLeft: 10,
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    fontSize: 14,
                                                                    fontFamily: 'inter',
                                                                    color: '#000',
                                                                }}
                                                            >
                                                                {role}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : null}
            </View>
            {props.showAddCourseModal ? (
                <BottomSheet
                    snapPoints={[
                        0,
                        newCourseModalHeight(windowHeight, Dimensions.get('window').width, Platform.OS, orientation),
                    ]}
                    close={() => {
                        props.closeAddCourseModal();
                    }}
                    tabs={role === 'instructor' ? renderTabs() : null}
                    isOpen={props.showAddCourseModal}
                    // title={'Add a course'}
                    renderContent={() => renderAddCourseModal()}
                    header={true}
                    callbackNode={fall}
                />
            ) : null}
            {showChannelPasswordInput ? (
                <BottomSheet
                    snapPoints={[
                        0,
                        channelPasswordModalHeight(Dimensions.get('window').width, Platform.OS, orientation),
                    ]}
                    close={() => {
                        setChannelPassword('');
                        setChannelPasswordId('');
                        setShowChannelPasswordInput(false);
                    }}
                    isOpen={showChannelPasswordInput}
                    // title={'Add a course'}
                    renderContent={() => renderPasswordInputModal()}
                    header={false}
                    callbackNode={fall}
                />
            ) : null}
            {props.showAddCourseModal ? (
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
                ></Reanimated.View>
            ) : null}
            {showChannelPasswordInput ? (
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
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => setShowChannelPasswordInput(false)}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}
        </View>
    );
};

export default ChannelControls;

const styles = StyleSheet.create({
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#fff',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#000000',
        borderRadius: 12,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 20,
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20,
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
