// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, ActivityIndicator, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// API
import {
    findChannelById,
    getSubscribers,
    getUserCount,
    subscribe,
    unsubscribe,
    updateChannel,
    duplicateChannel,
    resetAccessCode,
    deleteChannel,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import ColorPicker from './ColorPicker';
import DropDownPicker from 'react-native-dropdown-picker';
import Alert from './Alert';
import * as Clipboard from 'expo-clipboard';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user, userId, org, refreshSubscriptions } = useAppContext();

    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingChannelColor, setLoadingChannelColor] = useState(true);
    const [name, setName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [password, setPassword] = useState('');
    const [temporary, setTemporary] = useState(false);
    const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [tags, setTags] = useState('');
    const [copied, setCopied] = useState(false);
    const [originalSubs, setOriginalSubs] = useState<any[]>([]);
    const [options, setOptions] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [owners, setOwners] = useState<any[]>([]);
    const [channelCreator, setChannelCreator] = useState('');
    const [colorCode, setColorCode] = useState('');
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
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showDuplicateChannel, setShowDuplicateChannel] = useState(false);
    const [duplicateChannelName, setDuplicateChannelName] = useState('');
    const [duplicateChannelPassword, setDuplicateChannelPassword] = useState('');
    const [duplicateChannelColor, setDuplicateChannelColor] = useState('');
    const [duplicateChannelTemporary, setDuplicateChannelTemporary] = useState(false);
    const [duplicateChannelSubscribers, setDuplicateChannelSubscribers] = useState(true);
    const [duplicateChannelModerators, setDuplicateChannelModerators] = useState(true);
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        });

        return match;
    });
    // NATIVE DROPDOWN
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
    const [isViewersDropdownOpen, setIsViewersDropdownOpen] = useState(false);
    const [isEditorsDropdownOpen, setIsEditorsDropdownOpen] = useState(false);
    const [meetingUrl, setMeetingUrl] = useState('');

    const server = useApolloClient();

    //
    const [isDuplicatingChannel, setIsDuplicatingChannel] = useState(false);
    const [isDeletingChannel, setIsDeletingChannel] = useState(false);

    // HOOKS

    useEffect(() => {
        let filterRemovedModerators = selectedModerators.filter((mod: any) => selectedValues.includes(mod));

        setSelectedModerators(filterRemovedModerators);
    }, [selectedValues]);

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {
        setLoadingUsers(true);

        let filteredUsers = [...allUsers];

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

        if (activeSection !== 'All') {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id);
            });

            filteredUsers = filterSections;
        }

        if (channelCreator !== '') {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== channelCreator;
            });

            filteredUsers = filterOutMainOwner;
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

        setLoadingUsers(false);
    }, [activeRole, activeGrade, activeSection, channelCreator, allUsers]);

    /**
     * @description Filter out channel Creator from the Subscribers dropdown
     */
    useEffect(() => {
        if (channelCreator !== '') {
            const subscribers = [...selectedValues];

            const filterOutOwner = subscribers.filter((sub: any) => {
                return sub !== channelCreator;
            });

            setSelectedValues(filterOutOwner);
        }
    }, [channelCreator, allUsers]);

    useEffect(() => {
        if (props.refreshChannelSettings) {
            fetchChannelSettings();
            props.setRefreshChannelSettings(false);
        }
    }, [props.refreshChannelSettings]);

    const fetchChannelSettings = useCallback(async () => {
        setLoadingUsers(true);
        setLoadingOrg(true);

        // get all users

        console.log('fetchChannelSettings user', user);

        server
            .query({
                query: getUserCount,
                variables: {
                    schoolId: user.schoolId,
                },
            })
            .then((res) => {
                const users = [...res.data.user.getSchoolUsers];
                users.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) {
                        return -1;
                    }
                    if (a.fullName > b.fullName) {
                        return 1;
                    }
                    return 0;
                });

                setAllUsers(users);

                const tempUsers: any[] = [];
                users.map((item: any, index: any) => {
                    const x = { ...item, selected: false, index };
                    delete x.__typename;
                    tempUsers.push({
                        group: item.fullName[0].toUpperCase(),
                        label: item.fullName + ', ' + item.email,
                        value: item._id,
                    });
                    return x;
                });

                // get channel details
                server
                    .query({
                        query: findChannelById,
                        variables: {
                            channelId: props.channelId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.channel.findById) {
                            setName(res.data.channel.findById.name);
                            setOriginalName(res.data.channel.findById.name);
                            setPassword(res.data.channel.findById.password ? res.data.channel.findById.password : '');
                            setTemporary(res.data.channel.findById.temporary ? true : false);
                            setChannelCreator(res.data.channel.findById.channelCreator);
                            setIsPublic(res.data.channel.findById.isPublic ? true : false);
                            setDescription(res.data.channel.findById.description);
                            setTags(res.data.channel.findById.tags ? res.data.channel.findById.tags : []);
                            setAccessCode(res.data.channel.findById.accessCode);
                            setMeetingUrl(
                                res.data.channel.findById.meetingUrl ? res.data.channel.findById.meetingUrl : ''
                            );

                            setColorCode(res.data.channel.findById.colorCode);

                            if (res.data.channel.findById.owners) {
                                const ownerOptions: any[] = [];
                                tempUsers.map((item: any) => {
                                    const u = res.data.channel.findById.owners.find((i: any) => {
                                        return i === item.value;
                                    });
                                    if (u) {
                                        ownerOptions.push(item);
                                    }
                                });

                                // Filter out the main channel creator from the moderators list

                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                    return user.value !== res.data.channel.findById.channelCreator;
                                });

                                const mod = filterOutMainOwner.map((user: any) => user.value);

                                setOwners(filterOutMainOwner);

                                setSelectedModerators(mod);

                                setLoadingOrg(false);
                            }
                        }
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
            })
            .catch((e) => {
                console.log('Error', e);
            });

        // get subs
        server
            .query({
                query: getSubscribers,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data && res.data.user.findByChannelId) {
                    const tempUsers: any[] = [];
                    res.data.user.findByChannelId.map((item: any, index: any) => {
                        const x = { ...item, selected: false, index };

                        delete x.__typename;
                        tempUsers.push({
                            name: item.fullName,
                            id: item._id,
                        });
                    });

                    const tempSelectedValues: any[] = [];

                    res.data.user.findByChannelId.map((item: any, index: any) => {
                        tempSelectedValues.push(item._id);
                    });

                    setSelectedValues(tempSelectedValues);
                    setOriginalSubs(tempUsers);
                    setSelected(tempUsers);
                    setLoadingUsers(false);
                }
            })
            .catch((e) => {
                console.log('Error', e);
            });
    }, [props.channelId]);

    /**
     * @description Fetches all the data for the channel
     */
    useEffect(() => {
        fetchChannelSettings();
    }, [props.channelId]);

    /**
     * @description Handles duplicating channel
     */
    const handleDuplicate = useCallback(() => {
        if (duplicateChannelName.toString().trim() === '') {
            alert('Enter duplicate course name.');
            return;
        }

        if (duplicateChannelColor === '') {
            alert('Pick duplicate course color.');
            return;
        }

        setIsDuplicatingChannel(true);

        server
            .mutate({
                mutation: duplicateChannel,
                variables: {
                    channelId: props.channelId,
                    name: duplicateChannelName.trim(),
                    password: duplicateChannelPassword,
                    colorCode: duplicateChannelColor,
                    temporary: duplicateChannelTemporary,
                    duplicateSubscribers: duplicateChannelSubscribers,
                    duplicateOwners: duplicateChannelModerators,
                },
            })
            .then((res2) => {
                if (res2.data && res2.data.channel.duplicate === 'created') {
                    alert('Course duplicated successfully.');
                    // Refresh Subscriptions for user
                    refreshSubscriptions();
                    props.handleDeleteChannel();
                    setIsDuplicatingChannel(false);
                }
            })
            .catch((e) => {
                alert('Something went wrong. Try again.');
                setIsDuplicatingChannel(false);
            });
    }, [
        duplicateChannel,
        duplicateChannelName,
        duplicateChannelPassword,
        props.channelId,
        duplicateChannelColor,
        duplicateChannelTemporary,
        duplicateChannelSubscribers,
        duplicateChannelModerators,
    ]);

    /**
     * @description Reset access code for channel
     */
    const handleResetCode = useCallback(() => {
        setCopied(false);

        server
            .mutate({
                mutation: resetAccessCode,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then(async (res) => {
                if (res.data && res.data.channel.resetAccessCode) {
                    setAccessCode(res.data.channel.resetAccessCode);
                } else {
                    Alert('Could not reset code.');
                }
            })
            .catch((e) => {
                console.log(e);
                Alert('Could not reset code.');
            });
    }, [props.channelId]);

    /**
     * @description Handle updating channel
     */
    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            alert('Enter course name.');
            return;
        }

        let moderatorsPresentAsSubscribers = true;

        selectedModerators.map((owner: any) => {
            const presentInSubscriber = selectedValues.find((sub: any) => {
                return owner === sub;
            });

            if (!presentInSubscriber) {
                moderatorsPresentAsSubscribers = false;
            }
        });

        if (!moderatorsPresentAsSubscribers) {
            alert('A moderator must be a subscriber');
            return;
        }

        setIsUpdatingChannel(true);

        server
            .mutate({
                mutation: updateChannel,
                variables: {
                    name: name.trim(),
                    password,
                    channelId: props.channelId,
                    temporary,
                    owners: selectedModerators,
                    colorCode,
                    meetingUrl,
                },
            })
            .then((res) => {
                if (res.data && res.data.channel.update) {
                    // added subs
                    selectedValues.map((sub: any) => {
                        const og = originalSubs.find((o: any) => {
                            return o.id === sub;
                        });
                        if (!og) {
                            console.log('To Add User', sub);
                            server.mutate({
                                mutation: subscribe,
                                variables: {
                                    channelId: props.channelId,
                                    password: password,
                                    userId: sub,
                                },
                            });
                        }
                    });
                    // removed subs
                    originalSubs.map((o: any) => {
                        if (o.id === channelCreator) return;

                        const og = selectedValues.find((sub: any) => {
                            return o.id === sub;
                        });

                        if (!og) {
                            console.log('To Remove User', o.id);
                            server.mutate({
                                mutation: unsubscribe,
                                variables: {
                                    channelId: props.channelId,
                                    keepContent: true,
                                    userId: o.id,
                                },
                            });
                        }
                    });
                    setIsUpdatingChannel(false);

                    alert('Course updated successfully.');

                    const updatedOriginalSubs: any[] = [];

                    allUsers.map((item: any) => {
                        if (selectedValues.includes(item._id)) {
                            updatedOriginalSubs.push({
                                name: item.fullName,
                                id: item._id,
                            });
                        }
                    });

                    // Set updated subs as new subs
                    setOriginalSubs(updatedOriginalSubs);

                    props.handleUpdateChannel(name.trim(), colorCode);

                    refreshSubscriptions();
                } else {
                    setIsUpdatingChannel(false);
                    alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                setIsUpdatingChannel(false);
                alert('Something went wrong. Try again.');
            });
    }, [
        name,
        password,
        props.channelId,
        options,
        originalSubs,
        owners,
        temporary,
        selected,
        originalName,
        colorCode,
        meetingUrl,
        selectedValues,
        selectedModerators,
    ]);

    /**
     * @description Handle delete channel (Note: Only temporary channels can be deleted)
     */
    const handleDelete = useCallback(async () => {
        setIsDeletingChannel(true);
        server
            .mutate({
                mutation: deleteChannel,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res: any) => {
                Alert('Deleted Course successfully.');
                refreshSubscriptions();
                props.handleDeleteChannel();
                setIsDeletingChannel(false);
            })
            .catch((e: any) => {
                Alert('Failed to delete Course.');
                setIsDeletingChannel(false);
                console.log('Error', e);
            });
    }, [props.channelId]);

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

    if (loadingOrg || loadingUsers) {
        return (
            <View
                style={{
                    width: '100%',
                    height: Dimensions.get('window').height - 200,
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    paddingVertical: 100,
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    // RENDER VIEW FOR CHANNEL DUPLICATION

    if (showDuplicateChannel) {
        return (
            <View
                style={{
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 10,
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: Dimensions.get('window').width < 768 ? 200 : 150,
                }}
            >
                <View style={styles.screen}>
                    <View
                        style={{
                            alignSelf: 'center',
                            minHeight: 100,
                        }}
                    >
                        <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                            <TouchableOpacity
                                key={Math.random()}
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    paddingHorizontal: 15,
                                }}
                                onPress={() => {
                                    props.scrollToTop();
                                    setShowDuplicateChannel(false);
                                }}
                            >
                                <Text
                                    style={{
                                        width: '100%',
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        fontWeight: 'bold',
                                        color: '#1F1F1F',
                                    }}
                                >
                                    <Ionicons
                                        name="close-outline"
                                        size={24}
                                        color={'#000000'}
                                        style={{ marginRight: 10 }}
                                    />
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text
                            style={{
                                fontSize: 20,
                                alignSelf: 'center',
                                fontFamily: 'inter',
                                flex: 1,
                                lineHeight: 25,
                            }}
                        >
                            Duplicate Course
                        </Text>
                        <View
                            style={{
                                paddingHorizontal: 20,
                                width: '100%',
                            }}
                        >
                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {PreferredLanguageText('name')}
                                </Text>
                                <TextInput
                                    value={duplicateChannelName}
                                    placeholder={''}
                                    onChangeText={(val) => {
                                        setDuplicateChannelName(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={true}
                                />
                            </View>

                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {PreferredLanguageText('enrolmentPassword')}
                                </Text>
                                <TextInput
                                    value={duplicateChannelPassword}
                                    placeholder={`(${PreferredLanguageText('optional')})`}
                                    onChangeText={(val) => setDuplicateChannelPassword(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={false}
                                />
                            </View>
                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Theme
                                </Text>
                                <View
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: 'white',
                                        marginTop: 20,
                                    }}
                                >
                                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                                        <ColorPicker
                                            color={duplicateChannelColor}
                                            onChange={(color: any) => setDuplicateChannelColor(color)}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Switch to copy Subscribers */}
                            {selected.length > 0 ? (
                                <View>
                                    <View
                                        style={{
                                            width: '100%',
                                            paddingTop: 30,
                                            paddingBottom: 15,
                                            backgroundColor: 'white',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Duplicate Viewers
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10,
                                            }}
                                        >
                                            <Switch
                                                value={duplicateChannelSubscribers}
                                                onValueChange={() => {
                                                    setDuplicateChannelSubscribers(!duplicateChannelSubscribers);
                                                }}
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
                                    </View>
                                </View>
                            ) : null}

                            {/* Switch to copy Moderators */}
                            {owners.length > 0 ? (
                                <View>
                                    <View
                                        style={{
                                            width: '100%',
                                            paddingTop: 15,
                                            paddingBottom: 15,
                                            backgroundColor: 'white',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Duplicate Editors
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10,
                                            }}
                                        >
                                            <Switch
                                                value={duplicateChannelModerators}
                                                onValueChange={() => {
                                                    setDuplicateChannelModerators(!duplicateChannelModerators);
                                                }}
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
                                    </View>
                                </View>
                            ) : null}

                            <View
                                style={{
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginTop: 50,
                                    paddingBottom: 50,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => handleDuplicate()}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 15,
                                        // overflow: 'hidden',
                                        // height: 35,
                                    }}
                                    disabled={isDuplicatingChannel || user.email === disableEmailId}
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
                                        {isDuplicatingChannel ? 'SAVING...' : 'SAVE'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // MAIN RETURN
    return (
        <View
            style={{
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
                backgroundColor: '#fff',
                zIndex: 5000000,
                paddingBottom: 100,
            }}
        >
            <View
                style={{
                    paddingTop: 10,
                    paddingBottom: 20,
                    width: '100%',
                    backgroundColor: 'white',
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 10,
                }}
            >
                <View style={{ backgroundColor: 'white', paddingTop: 20, paddingHorizontal: 10 }}>
                    <View
                        style={{
                            maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                            alignSelf: 'center',
                            minHeight: 100,
                        }}
                    >
                        <View style={{ backgroundColor: 'white' }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        marginRight: 8,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Access Code
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert('Share this code so people can join your course directly.');
                                    }}
                                >
                                    <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                </TouchableOpacity>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 30,
                                        fontFamily: 'inter',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {accessCode}
                                </Text>

                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginRight: 10,
                                        }}
                                        onPress={() => {
                                            Clipboard.setString(accessCode);
                                            setCopied(true);
                                        }}
                                    >
                                        <Ionicons
                                            name={copied ? 'checkmark-circle-outline' : 'clipboard-outline'}
                                            size={18}
                                            color={copied ? '#35AC78' : '#000'}
                                        />
                                        <Text
                                            style={{
                                                color: copied ? '#35AC78' : '#000',
                                                fontSize: 10,
                                                paddingTop: 3,
                                            }}
                                        >
                                            {' '}
                                            {copied ? 'Copied' : 'Copy'}{' '}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => handleResetCode()}
                                    >
                                        <Ionicons name="refresh-outline" size={18} color={'#000'} />
                                        <Text style={{ color: '#000', fontSize: 10, paddingTop: 3 }}> Reset </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View
                            style={{
                                backgroundColor: 'white',
                                maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                                marginTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={name}
                                autoCompleteType="off"
                                placeholder={''}
                                onChangeText={(val) => {
                                    setName(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        <View
                            style={{
                                backgroundColor: 'white',
                                maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                autoCompleteType="off"
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={(val) => setPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>

                        {org.meetingProvider && org.meetingProvider !== '' ? (
                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Meeting link
                                </Text>
                                <TextInput
                                    value={meetingUrl}
                                    autoCompleteType="off"
                                    placeholder={''}
                                    onChangeText={(val) => setMeetingUrl(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={false}
                                />
                            </View>
                        ) : null}

                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Theme
                            </Text>
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    backgroundColor: 'white',
                                    marginTop: 20,
                                }}
                            >
                                <View
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'white',
                                        maxWidth: Dimensions.get('window').width < 768 ? 320 : 600,
                                    }}
                                >
                                    <ColorPicker color={colorCode} onChange={(color: any) => setColorCode(color)} />
                                </View>
                            </View>
                        </View>

                        <View
                            style={{
                                display: 'flex',
                                width: '100%',
                                flexDirection: 'row',
                                paddingTop: 30,
                                alignItems: 'center',
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
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        marginRight: 8,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Students
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert(
                                            'Students are able to view content, provide submissions, post discussion threads and view their performance.'
                                        );
                                    }}
                                >
                                    <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                </TouchableOpacity>
                            </View>
                            {user.userCreatedOrg ? (
                                <TouchableOpacity
                                    onPress={() => props.setShowInviteByEmailsModal(true)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginLeft: 'auto',
                                        paddingTop: 2,
                                    }}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        color="#000"
                                        style={{ marginRight: 7, paddingTop: 2 }}
                                        size={18}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: '#000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Add Users
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {!user.userCreatedOrg ? renderSubscriberFilters() : null}
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
                                        console.log('val', val);
                                        setSelectedValues(val);
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
                        {userId === channelCreator ? (
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
                                        marginRight: 8,
                                        color: '#000000',
                                        fontFamily: 'Inter',
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
                        ) : null}
                        {userId === channelCreator ? (
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
                        ) : null}

                        <View
                            style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 100 }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    Alert('Update course?', '', [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel',
                                            onPress: () => {
                                                return;
                                            },
                                        },
                                        {
                                            text: 'Yes',
                                            onPress: () => {
                                                handleSubmit();
                                            },
                                        },
                                    ]);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                }}
                                disabled={isUpdatingChannel || user.email === disableEmailId}
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
                                    {isUpdatingChannel ? 'UPDATING...' : 'UPDATE'}
                                </Text>
                            </TouchableOpacity>

                            {userId === channelCreator ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        props.scrollToTop();
                                        setShowDuplicateChannel(true);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 15,
                                        marginTop: 15,
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
                                            width: 150,
                                        }}
                                    >
                                        DUPLICATE
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {temporary ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert('Delete course?', '', [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    return;
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: () => {
                                                    handleDelete();
                                                },
                                            },
                                        ]);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        marginTop: 15,
                                    }}
                                    disabled={isDeletingChannel || user.email === disableEmailId}
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
                                            width: 150,
                                        }}
                                    >
                                        {isDeletingChannel ? 'DELETING...' : 'DELETE'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ChannelSettings;

const styles = StyleSheet.create({
    screen: {
        paddingTop: 10,
        paddingBottom: 20,
        width: '100%',
        backgroundColor: 'white',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        maxWidth: Dimensions.get('window').width < 768 ? '100%' : 600,
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
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
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        fontFamily: 'inter',
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20,
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
    },
    colorContainerOutline: {
        lineHeight: 22,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
});
