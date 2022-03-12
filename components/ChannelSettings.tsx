// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Keyboard, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    findChannelById, getOrganisation, getSubscribers, getUserCount, subscribe, unsubscribe, updateChannel, getChannelColorCode, duplicateChannel, resetAccessCode, getChannelModerators, deleteChannel, addUsersByEmail
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import { ScrollView } from 'react-native-gesture-handler';

import ColorPicker from "./ColorPicker";

// import {
//     Menu,
//     MenuOptions,
//     MenuOption,
//     MenuTrigger,
// } from 'react-native-popup-menu';
import DropDownPicker from 'react-native-dropdown-picker';

import Alert from './Alert';
// import TextareaAutosize from 'react-textarea-autosize';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
// import Clipboard from '@react-native-clipboard/clipboard';

// import ReactTagInput from "@pathofdev/react-tag-input";
// import "@pathofdev/react-tag-input/build/index.css";
import { getDropdownHeight } from '../helpers/DropdownHeight';
import BottomSheet from './BottomSheet';
import Reanimated from 'react-native-reanimated';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingChannelColor, setLoadingChannelColor] = useState(true);
    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)
    const [isUpdatingChannel, setIsUpdatingChannel] = useState(false)
    const [school, setSchool] = useState<any>(null)
    const [accessCode, setAccessCode] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [tags, setTags] = useState('')
    const [copied, setCopied] = useState(false);
    const [originalSubs, setOriginalSubs] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selected, setSelected] = useState<any[]>([])
    const [owner, setOwner] = useState<any>({})
    const [owners, setOwners] = useState<any[]>([])
    const [channelCreator, setChannelCreator] = useState('')
    const [colorCode, setColorCode] = useState("")
    const colorChoices = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#0d5d35", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607db8"]
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
    const filterRoleOptions = [
        {
            value: 'All',
            label: 'All Users'
        },
        {
            value: 'student',
            label: 'Student'
        },
        {
            value: 'instructor',
            label: 'Instructor'
        }
    ]
    const gradeOptions = grades.map((g: any) => {
        return {
            value: g,
            label: g
        }
    })
    const filterGradeOptions = [
        {
            value: 'All',
            label: 'All Grades'
        },
        ...gradeOptions
    ]
    const sectionOptions = sections.map((s: any) => {
        return {
            value: s,
            label: s
        }
    })
    const filterSectionOptions = [
        {
            value: 'All',
            label: 'All Sections'
        },
        ...sectionOptions
    ]
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');
    const [selectedValues, setSelectedValues] = useState<any[]>([]);
    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showDuplicateChannel, setShowDuplicateChannel] = useState(false);
    const [duplicateChannelName, setDuplicateChannelName] = useState("");
    const [duplicateChannelPassword, setDuplicateChannelPassword] = useState("");
    const [duplicateChannelColor, setDuplicateChannelColor] = useState("");
    const [duplicateChannelTemporary, setDuplicateChannelTemporary] = useState(false);
    const [duplicateChannelSubscribers, setDuplicateChannelSubscribers] = useState(true);
    const [duplicateChannelModerators, setDuplicateChannelModerators] = useState(true);
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        })

        return match
    })
    // NATIVE DROPDOWN
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
    const [isViewersDropdownOpen, setIsViewersDropdownOpen] = useState(false);
    const [isEditorsDropdownOpen, setIsEditorsDropdownOpen] = useState(false); 
    const [meetingProvider, setMeetingProvider] = useState('');
    const [meetingUrl, setMeetingUrl] = useState('');

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0]
    });

    useEffect(() => {
        let filterRemovedModerators = selectedModerators.filter((mod: any) => selectedValues.includes(mod))

        setSelectedModerators(filterRemovedModerators)
    }, [selectedValues])

    // HOOKS

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {

            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '')
            }

        })()
    }, [])

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {

        let filteredUsers = [...allUsers];

        if (activeRole !== "All") {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole || selectedValues.includes(user._id)
            })

            filteredUsers = filterRoles;
        }

        if (activeGrade !== "All") {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade || selectedValues.includes(user._id)
            })

            filteredUsers = filterGrades
        }

        if (activeSection !== "All") {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id)
            })

            filteredUsers = filterSections
        }

        if (channelCreator !== "") {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== channelCreator
            })

            filteredUsers = filterOutMainOwner
        }

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                group: user.fullName[0].toUpperCase(),
                label: user.fullName + ", " + user.email,
                value: user._id
            }
        })

        const sort = filteredOptions.sort((a, b) => {
            if (a.group < b.group) { return -1; }
            if (a.group > b.group) { return 1; }
            return 0;
        })

        setOptions(sort)

    }, [activeRole, activeGrade, activeSection, channelCreator])

    /**
     * @description Filter out channel Creator from the Subscribers dropdown
     */
    useEffect(() => {
        if (channelCreator !== "") {
            const subscribers = [...selectedValues]

            const filterOutOwner = subscribers.filter((sub: any) => {
                return sub !== channelCreator
            })

            setSelectedValues(filterOutOwner);

        }
    }, [channelCreator])

    useEffect(() => {
        if (props.refreshChannelSettings) {
            fetchChannelSettings()
            props.setRefreshChannelSettings(false)
        }
    }, [props.refreshChannelSettings])
    

    const fetchChannelSettings = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')

                let schoolObj: any;

                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI('')
                    // get all users
                    server.query({
                        query: getOrganisation,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.school.findByUserId) {
                            setSchool(res.data.school.findByUserId)
                            schoolObj = res.data.school.findByUserId;
                            const schoolId = res.data.school.findByUserId._id
                            if (schoolId && schoolId !== '') {
                                server.query({
                                    query: getUserCount,
                                    variables: {
                                        schoolId
                                    }
                                }).then((res) => {
                                    res.data.user.getSchoolUsers.sort((a: any, b: any) => {
                                        if (a.fullName < b.fullName) { return -1; }
                                        if (a.fullName > b.fullName) { return 1; }
                                        return 0;
                                    })

                                    setAllUsers(res.data.user.getSchoolUsers);

                                    const tempUsers: any[] = []
                                    res.data.user.getSchoolUsers.map((item: any, index: any) => {
                                        const x = { ...item, selected: false, index }
                                        delete x.__typename
                                        tempUsers.push({
                                            group: item.fullName[0].toUpperCase(),
                                            label: item.fullName + ", " + item.email,
                                            value: item._id 
                                        })
                                        return x
                                    })

                                    // get channel details
                                    server.query({
                                        query: findChannelById,
                                        variables: {
                                            channelId: props.channelId
                                        }
                                    }).then(res => {
                                        if (res.data && res.data.channel.findById) {

                                            setName(res.data.channel.findById.name)
                                            setOriginalName(res.data.channel.findById.name)
                                            setPassword(res.data.channel.findById.password ? res.data.channel.findById.password : '')
                                            setTemporary(res.data.channel.findById.temporary ? true : false)
                                            setChannelCreator(res.data.channel.findById.channelCreator)
                                            setIsPublic(res.data.channel.findById.isPublic ? true : false)
                                            setDescription(res.data.channel.findById.description)
                                            setTags(res.data.channel.findById.tags ? res.data.channel.findById.tags : [])
                                            setAccessCode(res.data.channel.findById.accessCode)
                                            setMeetingUrl(res.data.channel.findById.meetingUrl ? res.data.channel.findById.meetingUrl : '')

                                            if (res.data.channel.findById.owners) {
                                                const ownerOptions: any[] = []
                                                tempUsers.map((item: any) => {
                                                    const u = res.data.channel.findById.owners.find((i: any) => {
                                                        return i === item.value
                                                    })
                                                    if (u) {
                                                        ownerOptions.push(item)
                                                    }
                                                })

                                                // Filter out the main channel creator from the moderators list

                                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                                    return user.value !== res.data.channel.findById.channelCreator
                                                })

                                                const mod = filterOutMainOwner.map((user: any) => user.value)

                                                setOwners(filterOutMainOwner)

                                                setSelectedModerators(mod)

                                                setLoadingOrg(false)
                                            }
                                        }
                                    })

                                    const sort = tempUsers.sort((a, b) => {
                                        if (a.text < b.text) { return -1; }
                                        if (a.text > b.text) { return 1; }
                                        return 0;
                                    })

                                    setOptions(sort)

                                })
                            }
                        } else {


                            // get channel details
                            server.query({
                                query: findChannelById,
                                variables: {
                                    channelId: props.channelId
                                }
                            }).then(res => {
                                if (res.data && res.data.channel.findById) {

                                    setName(res.data.channel.findById.name)
                                    setOriginalName(res.data.channel.findById.name)
                                    setPassword(res.data.channel.findById.password ? res.data.channel.findById.password : '')
                                    setTemporary(res.data.channel.findById.temporary ? true : false)
                                    setChannelCreator(res.data.channel.findById.channelCreator)

                                    setIsPublic(res.data.channel.findById.isPublic ? true : false)
                                    setDescription(res.data.channel.findById.description)
                                    setTags(res.data.channel.findById.tags ? res.data.channel.findById.tags : [])
                                    setAccessCode(res.data.channel.findById.accessCode)

                                    server.query({
                                        query: getChannelModerators,
                                        variables: {
                                            channelId: props.channelId
                                        }
                                    }).then(res => {
                                        if (res.data && res.data.channel.getChannelModerators) {
                                            const tempUsers: any[] = []
                                            res.data.channel.getChannelModerators.map((item: any, index: any) => {
                                                const x = { ...item, selected: false, index }
                
                                                delete x.__typename
                                                tempUsers.push({
                                                    name: item.fullName,
                                                    id: item._id
                                                })
                
                                                // add the user always 
                                            })
                
                                            const tempSelectedValues: any[] = []
                
                                            res.data.channel.getChannelModerators.map((item: any, index: any) => {
                                                tempSelectedValues.push(item._id)
                                            })

                                            setOwners(tempUsers)
                                            setSelectedModerators(tempSelectedValues)
            

                                        }
                                    })

                                    setLoadingOrg(false)
                                }
                            })


                        }
                    })
                    .catch(e => {
                        alert("Could not fetch course data. Check connection.")
                    })

                    // get subs
                    server.query({
                        query: getSubscribers,
                        variables: {
                            channelId: props.channelId
                        }
                    }).then(res => {
                        if (res.data && res.data.user.findByChannelId) {
                            const tempUsers: any[] = []
                            res.data.user.findByChannelId.map((item: any, index: any) => {
                                const x = { ...item, selected: false, index }

                                delete x.__typename
                                tempUsers.push({
                                    name: item.fullName,
                                    id: item._id
                                })

                            })

                            console.log("Options", tempUsers)

                            if (!schoolObj) {
                                setAllUsers(res.data.user.findByChannelId)
                                setOptions(tempUsers)
                            }

                            const tempSelectedValues: any[] = []

                            res.data.user.findByChannelId.map((item: any, index: any) => {
                                tempSelectedValues.push(item._id)
                            })

                            setSelectedValues(tempSelectedValues)
                            setOriginalSubs(tempUsers)
                            setSelected(tempUsers)
                            setLoadingUsers(false)
                        }
                    })

                    server.query({
                        query: getChannelColorCode,
                        variables: {
                            channelId: props.channelId
                        }
                    }).then(res => {
                        if (res.data && res.data.channel.getChannelColorCode) {
                            setColorCode(res.data.channel.getChannelColorCode)
                            setLoadingChannelColor(false)
                        }
                    })
                }
    }, [props.channelId, props.user])

    /**
     * @description Fetches all the data for the channel 
     */
    useEffect(() => {
        fetchChannelSettings()
    }, [props.channelId, props.user])

    /**
     * @description Handles duplicating channel
     */
    const handleDuplicate = useCallback(() => {

        if (duplicateChannelName.toString().trim() === '') {
            alert('Enter duplicate course name.')
            return
        }

        if (duplicateChannelColor === "") {
            alert('Pick duplicate course color.')
            return
        }

        const server = fetchAPI('')
        server.mutate({
            mutation: duplicateChannel,
                variables: {
                    channelId: props.channelId,
                    name: duplicateChannelName.trim(),
                    password: duplicateChannelPassword,
                    colorCode: duplicateChannelColor,
                    temporary: duplicateChannelTemporary,
                    duplicateSubscribers: duplicateChannelSubscribers,
                    duplicateOwners: duplicateChannelModerators
                }
            }).then((res2) => {
                if (res2.data && res2.data.channel.duplicate === "created") {
                    alert("Course duplicated successfully.")
                    // Refresh Subscriptions for user
                    // props.refreshSubscriptions()
                    props.closeModal()
                }
            })
        .catch((e) => {
            alert("Something went wrong. Try again.")
        })

    }, [duplicateChannel, duplicateChannelName, duplicateChannelPassword, props.channelId,
        duplicateChannelColor, duplicateChannelTemporary, duplicateChannelSubscribers,
        duplicateChannelModerators])

    /**
     * @description Reset access code for channel
     */
    const handleResetCode = useCallback(() => {

        setCopied(false)

        const server = fetchAPI('')
        server.mutate({
            mutation: resetAccessCode,
            variables: {
                channelId: props.channelId
            }
        }).then(async res => {
            
            if (res.data && res.data.channel.resetAccessCode) {
                setAccessCode(res.data.channel.resetAccessCode)
            } else {
                Alert("Could not reset code.")
            }

        }).catch((e) => {
            console.log(e);
            Alert("Could not reset code.")
        })
        
    }, [props.channelId])

    /**
     * @description Handle updating channel
     */
    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            alert('Enter course name.')
            return
        }

        let moderatorsPresentAsSubscribers = true;

        selectedModerators.map((owner: any) => {
            const presentInSubscriber = selectedValues.find((sub: any) => {
                return owner === sub;
            })

            if (!presentInSubscriber) {
                moderatorsPresentAsSubscribers = false
            }
        })

        if (!moderatorsPresentAsSubscribers) {
            alert("A moderator must be a subscriber");
            return;
        }

        setIsUpdatingChannel(true);

        const server = fetchAPI('')
        
                server.mutate({
                    mutation: updateChannel,
                    variables: {
                        name: name.trim(),
                        password,
                        channelId: props.channelId,
                        temporary,
                        owners: selectedModerators,
                        colorCode,
                        meetingUrl
                    }
                }).then(res => {
                    if (res.data && res.data.channel.update) {
                        // added subs
                        selectedValues.map((sub: any) => {
                            const og = originalSubs.find((o: any) => {
                                return o.id === sub
                            })
                            if (!og) {

                                console.log("To Add User", sub)
                                server.mutate({
                                    mutation: subscribe,
                                    variables: {
                                        channelId: props.channelId,
                                        password: password,
                                        userId: sub
                                    }
                                })
                            }
                        })
                        // removed subs
                        originalSubs.map((o: any) => {

                            if (o.id === channelCreator) return;

                            const og = selectedValues.find((sub: any) => {
                                return o.id === sub
                            })

                            if (!og) {
                                console.log("To Remove User", o.id)
                                server.mutate({
                                    mutation: unsubscribe,
                                    variables: {
                                        channelId: props.channelId,
                                        keepContent: true,
                                        userId: o.id
                                    }
                                })
                            }
                        })
                        setIsUpdatingChannel(false);

                        alert("Course updated successfully.")
                        
                        const updatedOriginalSubs: any[] = []

                        allUsers.map((item: any) => {

                            if (selectedValues.includes(item._id)) {
                                updatedOriginalSubs.push({
                                    name: item.fullName,
                                    id: item._id
                                })
                            }
                            
                        })


                        // Set updated subs as new subs
                        setOriginalSubs(updatedOriginalSubs)

                        // need to refresh channel subscriptions since name will be updated

                        props.closeModal()
                    } else {
                        setIsUpdatingChannel(false);
                        alert("Something went wrong. Try again.")
                    }
                }).catch(err => {
                    setIsUpdatingChannel(false);
                    alert("Something went wrong. Try again.")
                })
            
    }, [name, password, props.channelId, options, originalSubs, owners,
        temporary, selected, originalName, colorCode, meetingUrl, selectedValues, selectedModerators])

    /**
     * @description Handle delete channel (Note: Only temporary channels can be deleted)
     */
     const handleDelete = useCallback(async () => {
        const server = fetchAPI('')
        server.mutate({
            mutation: deleteChannel,
            variables: {
                channelId: props.channelId,
            }
        }).then((res: any) => {
            Alert("Deleted Course successfully.")
            props.refreshSubscriptions()
        })
        .catch((e: any) => {
            Alert("Failed to delete Course.")
            console.log("Error", e)
        })

        
    }, [props.channelId])

    // FUNCTIONS 

    /**
	* @description Renders filters for Subscribers dropdown 
	*/
    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'column', backgroundColor: 'white', marginTop: 20 }}>
            <View style={{ backgroundColor: 'white', }}>
                <View style={{ backgroundColor: 'white', maxWidth: 320, height: isRoleDropdownOpen ? 210 : 50 }}>
                    <DropDownPicker
                        open={isRoleDropdownOpen}
                        value={activeRole}
                        items={filterRoleOptions}
                        setOpen={setIsRoleDropdownOpen}
                        setValue={setActiveRole}
                        style={{
                            borderWidth: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f2f2f2'
                        }}
                        dropDownContainerStyle={{
                            borderWidth: 0,
                            zIndex: 1000001,
                            elevation: 1000001
                        }}
                        containerStyle={{
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 1,
                                height: 3
                            },
                            shadowOpacity: !isRoleDropdownOpen ? 0 : 0.08,
                            shadowRadius: 12,
                            zIndex: 1000001,
                            elevation: 1000001
                        }}
                    />
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                    <View style={{ backgroundColor: 'white', maxWidth: 150, height: isGradeDropdownOpen ? 250 : 50  }}>
                        <DropDownPicker
                            open={isGradeDropdownOpen}
                            value={activeGrade}
                            items={filterGradeOptions}
                            setOpen={setIsGradeDropdownOpen}
                            setValue={setActiveGrade}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2'
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 1,
                                    height: 3
                                },
                                shadowOpacity: !isGradeDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                        />
                    </View>
                </View>
                <View style={{ backgroundColor: 'white',  }}>
                    <View style={{ backgroundColor: 'white', maxWidth: 150, height: isSectionDropdownOpen ? 250 : 50, }}>
                        <DropDownPicker
                            open={isSectionDropdownOpen}
                            value={activeSection}
                            items={filterSectionOptions}
                            setOpen={setIsSectionDropdownOpen}
                            setValue={setActiveSection}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2'
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 1,
                                    height: 3
                                },
                                shadowOpacity: !isSectionDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                                zIndex: 1000001,
                                elevation: 1000001
                            }}
                        />
                    </View>
                </View>
            </View>

        </View>)
    }

    if (loadingOrg || loadingUsers || loadingChannelColor) {
        return <View
            style={{
                width: "100%",
                height: Dimensions.get('window').height - 200,
                flex: 1,
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                paddingVertical: 100
            }}>
            <ActivityIndicator color={"#1F1F1F"} />
        </View>
    }


    // RENDER VIEW FOR CHANNEL DUPLICATION

    if (showDuplicateChannel) {
        return (<View style={{
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            width: '100%'
        }}>
            <View style={styles.screen} >
                <View style={{
                    alignSelf: 'center',
                    minHeight: 100,
                }}>
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                                paddingHorizontal: 15,
                            }}
                            onPress={() => {
                                props.scrollToTop()
                                setShowDuplicateChannel(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#1F1F1F'
                            }}>
                                <Ionicons name='close-outline' size={24} color={'#000000'} style={{ marginRight: 10 }} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            alignSelf: 'center',
                            fontFamily: 'inter',
                            flex: 1,
                            lineHeight: 25
                        }}>
                        Duplicate Course
                    </Text>
                    <ScrollView
                        onScroll={() => {
                            Keyboard.dismiss()
                        }}
                        style={{
                            width: '100%'
                        }}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            width: '100%'
                        }}
                    >
                        <View style={{ backgroundColor: 'white', }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}>
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={duplicateChannelName}
                                placeholder={''}
                                onChangeText={val => {
                                    setDuplicateChannelName(val)
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        {
                            !school ?
                            (<View style={{ backgroundColor: 'white' }}>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}>
                                    Description
                                </Text>
                                {/* <TextareaAutosize
                                value={description}
                                style={{
                                    fontFamily: 'overpass',
                                    width: "100%",
                                    maxWidth: 500,
                                    borderBottom: '1px solid #f2f2f2',
                                    fontSize: 14,
                                    paddingTop: 13,
                                    paddingBottom: 13,
                                    marginTop: 12,
                                    marginBottom: 20,
                                    borderRadius: 1,

                                }}
                                minRows={2}
                                placeholder={""}
                                onChange={(e: any) => setDescription(e.target.value)}
                                /> */}
                                <AutoGrowingTextInput
                                    value={description}
                                    onChange={(event: any) => setDescription(event.nativeEvent.text || '')}
                                    style={{
                                        fontFamily: 'overpass',
                                        width: "100%",
                                        maxWidth: 500,
                                        borderBottom: '1px solid #f2f2f2',
                                        fontSize: 14,
                                        paddingTop: 13,
                                        paddingBottom: 13,
                                        marginTop: 12,
                                        marginBottom: 20,
                                        borderRadius: 1,
                                    }}
                                    placeholder={'Description'}
                                    placeholderTextColor='#66737C'
                                    maxHeight={200}
                                    minHeight={45}
                                    enableScrollToCaret
                                    // ref={}
                                />
                            </View>
                            ) : null
                        }
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={duplicateChannelPassword}
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={val => setDuplicateChannelPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                required={false}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}>
                                Theme
                            </Text>
                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white', marginTop: 20 }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <ColorPicker
                                        color={duplicateChannelColor}
                                        onChange={(color: any) => setDuplicateChannelColor(color) }
                                    />
                                </View>
                            </View>
                        </View>
                        {
                            !school ? 
                                <View
                                    style={{
                                        width: "100%",
                                        marginTop: 25
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            // paddingTop: 40,
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}>Public</Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            width: "100%",
                                            height: 30,
                                            // marginHorizontal: 10
                                        }}>
                                        <Switch
                                            value={isPublic}
                                            onValueChange={() => setIsPublic(!isPublic)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#f2f2f2",
                                                true: "#006AFF"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#1F1F1F', fontSize: 12 }}>
                                        Makes your channel visible to all users
                                    </Text>
                                </View>
                                : null
                        }
                        {
                            !school ? 
                                <View
                                style={{
                                    width: "100%",
                                    marginTop: 25
                                }}>
                                <View
                                    style={{
                                        width: "100%",
                                        paddingBottom: 15,
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#000000'
                                    }}>Tags</Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        width: "100%",
                                    }}>
                                    {/* <ReactTagInput 
                                        tags={tags} 
                                        placeholder=" "
                                        removeOnBackspace={true}
                                        maxTags={5}
                                        onChange={(newTags) => setTags(newTags)}
                                        /> */}
                                </View>
                                <Text style={{ color: '#1F1F1F', fontSize: 12, marginTop: 10 }}>
                                    Add up to 5
                                </Text>
                            </View>
                            : null
                        }
                        {/* Switch to copy Subscribers */}
                        {
                            selected.length > 0 ?
                                <View>
                                    <View
                                        style={{
                                            width: "100%",
                                            paddingTop: 30,
                                            paddingBottom: 15,
                                            backgroundColor: "white",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Duplicate Viewers
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row" }}>
                                        <View
                                            style={{
                                                backgroundColor: "white",
                                                height: 40,
                                                marginRight: 10,
                                            }}
                                        >
                                            <Switch
                                                value={duplicateChannelSubscribers}
                                                onValueChange={() => {
                                                    setDuplicateChannelSubscribers(!duplicateChannelSubscribers);
                                                }}
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: "#f2f2f2",
                                                    true: "#006AFF"
                                                }}
                                                activeThumbColor="white"
                                            />
                                        </View>
                                    </View>
                                </View>
                                : null
                        }

                        {/* Switch to copy Moderators */}
                        {
                            owners.length > 0 ?
                                <View>
                                    <View
                                        style={{
                                            width: "100%",
                                            paddingTop: 15,
                                            paddingBottom: 15,
                                            backgroundColor: "white",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Duplicate Editors
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row" }}>
                                        <View
                                            style={{
                                                backgroundColor: "white",
                                                height: 40,
                                                marginRight: 10,
                                            }}
                                        >
                                            <Switch
                                                value={duplicateChannelModerators}
                                                onValueChange={() => {
                                                    setDuplicateChannelModerators(!duplicateChannelModerators);
                                                }}
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: "#f2f2f2",
                                                    true: "#006AFF"
                                                }}
                                                activeThumbColor="white"
                                            />
                                        </View>
                                    </View>
                                </View>
                                : null
                        }

                        <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                            <TouchableOpacity
                                onPress={() => handleDuplicate()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    overflow: 'hidden',
                                    height: 35,
                                }}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#006AFF',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    textTransform: 'uppercase',
                                    width: 150
                                }}>
                                    SAVE
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </View>
        </View>)

    }

    // MAIN RETURN 
    return (
        <View style={{
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: '#fff',
            zIndex: 5000000,
        }}>
            <View style={styles.screen} >
                <View style={{ backgroundColor: 'white', paddingTop: 20, paddingHorizontal: 10, }}>
                    <View
                        style={{
                            maxWidth: 320,
                            alignSelf: 'center',
                            minHeight: 100,
                        }}
                    >
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>
                                Access Code
                            </Text>

                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,  }}>

                                <Text style={{
                                    fontSize: 30, fontFamily: 'inter', fontWeight: 'bold', 
                                }}>
                                    {accessCode}
                                </Text>

                                <View style={{ flexDirection: 'row', }}>
{/* 
                                    <TouchableOpacity style={{ 
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        marginRight: 10
                                    }} onPress={() => {
                                        // Clipboard.setString(accessCode)
                                        setCopied(true)
                                    }}>
                                        <Ionicons name={copied ? "checkmark-circle-outline" : "clipboard-outline"} size={18} color={copied ? "#35AC78" : "#006AFF"} />
                                        <Text style={{ color: copied ? "#35AC78" : "#006AFF", fontSize: 10, paddingTop: 3 }}> {copied ? "Copied" : "Copy"} </Text>
                                    </TouchableOpacity> */}

                                    <TouchableOpacity style={{ 
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }} onPress={() => handleResetCode()}>
                                        <Ionicons name="refresh-outline" size={18} color={"#006AFF"} />
                                        <Text style={{ color: '#006AFF', fontSize: 10, paddingTop: 3 }}> Reset </Text>
                                    </TouchableOpacity>

                                </View>

                            </View>

                            <Text style={{ color: '#1F1F1F', fontSize: 12, marginTop: 10, marginBottom: 20, }}>
                                Share this code so people can join your course directly 
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'white', maxWidth: 320 }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={name}
                                autoCompleteType='off'
                                placeholder={''}
                                onChangeText={val => {
                                    setName(val)
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white', maxWidth: 320 }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                autoCompleteType='off'
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={val => setPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>

                        {
                            meetingProvider && meetingProvider !== "" ?
                            (<View style={{ backgroundColor: 'white' }}>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#000000'
                                }}>
                                    Meeting link
                                </Text>
                                <TextInput
                                    value={meetingUrl}
                                    autoCompleteType='off'
                                    placeholder={''}
                                    onChangeText={val => setMeetingUrl(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={false}
                                />
                            </View>
                            ) : null
                        }

                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>
                                Theme
                            </Text>
                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white', marginTop: 20 }}>
                                <View style={{ width: '100%', backgroundColor: 'white', maxWidth: 320 }}>
                                    <ColorPicker
                                        color={colorCode}
                                        onChange={(color: any) => setColorCode(color) }
                                    />
                                </View>
                            </View>
                        </View>

                        {
                            !school ? 
                                <View
                                    style={{
                                        width: "100%",
                                        marginTop: 25
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            // paddingTop: 40,
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'Inter'
                                        }}>Public</Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            width: "100%",
                                            height: 30,
                                            // marginHorizontal: 10
                                        }}>
                                        <Switch
                                            value={isPublic}
                                            onValueChange={() => setIsPublic(!isPublic)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#f2f2f2",
                                                true: "#006AFF"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#1F1F1F', fontSize: 12 }}>
                                        Makes your channel visible to all users
                                    </Text>
                                </View>
                                : null
                        }
                        {
                            !school ? 
                                <View
                                style={{
                                    width: "100%",
                                    marginTop: 25
                                }}>
                                <View
                                    style={{
                                        width: "100%",
                                        paddingBottom: 15,
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        fontFamily: 'Inter'
                                    }}>Tags</Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        width: "100%",
                                    }}>
                                    <ReactTagInput 
                                        tags={tags} 
                                        placeholder=" "
                                        removeOnBackspace={true}
                                        maxTags={5}
                                        onChange={(newTags) => setTags(newTags)}
                                        />
                                </View>
                                <Text style={{ color: '#1F1F1F', fontSize: 12, marginTop: 10 }}>
                                    Add up to 5
                                </Text>
                            </View>
                            : null
                        }

                        <View style={{
                            display: 'flex',
                            width: '100%',
                            flexDirection: 'row',
                            paddingTop: 30,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontSize: 14,
                                fontFamily: 'Inter',
                                color: '#000000'
                            }}>
                                Viewers
                            </Text>
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
                                    paddingTop: 2
                                }}
                            >
                                <Ionicons name="mail-outline" color="#006AFF" style={{ marginRight: 7, paddingTop: 2 }} size={18} />
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: '#006AFF'
                                    }}
                                >
                                Invite New Users
                                </Text>
                            </TouchableOpacity>
                        </View>


                        {school ? renderSubscriberFilters() : null}
                        <View style={{
                            flexDirection: 'column', marginTop: 25,
                        }}>
                            <View style={{ maxWidth: 320, width: '100%', height: isViewersDropdownOpen ? getDropdownHeight(options.length) : 50, }}>
                                <DropDownPicker
                                    multiple={true}
                                    open={isViewersDropdownOpen}
                                    value={selectedValues}
                                    items={options}
                                    setOpen={setIsViewersDropdownOpen}
                                    setValue={(val: any) => {
                                        console.log("val", val)
                                        setSelectedValues(val)
                                    }}
                                    style={{
                                        borderWidth: 0,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#f2f2f2'
                                    }}
                                    dropDownContainerStyle={{
                                        borderWidth: 0,
                                        zIndex: 1000001,
                                        elevation: 1000001
                                    }}
                                    containerStyle={{
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 1,
                                            height: 3
                                        },
                                        shadowOpacity: !isViewersDropdownOpen ? 0 : 0.08,
                                        shadowRadius: 12,
                                        zIndex: 1000001,
                                        elevation: 1000001
                                    }}
                                />
                            </View>
                        </View>
                        {props.userId === channelCreator ? <Text style={{
                            fontSize: 14,
                            color: '#000000', marginTop: 25, marginBottom: 20,
                            maxWidth: 320,
                            fontFamily: 'Inter'
                        }}>
                            Editors
                        </Text> : null}
                        {props.userId === channelCreator ? <View style={{ height: isEditorsDropdownOpen ? getDropdownHeight(moderatorOptions.length) : 50, }}>
                            <DropDownPicker
                                multiple={true}
                                open={isEditorsDropdownOpen}
                                value={selectedModerators}
                                items={moderatorOptions}
                                setOpen={setIsEditorsDropdownOpen}
                                setValue={setSelectedModerators}
                                style={{
                                    borderWidth: 0,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f2f2f2'
                                }}
                                dropDownContainerStyle={{
                                    borderWidth: 0,
                                    zIndex: 1000001,
                                    elevation: 1000001
                                }}
                                containerStyle={{
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 1,
                                        height: 3
                                    },
                                    shadowOpacity: !isEditorsDropdownOpen ? 0 : 0.08,
                                    shadowRadius: 12,
                                    zIndex: 1000001,
                                    elevation: 1000001
                                }}
                            />
                        </View> : null}
                        {/* <label style={{ width: '100%', maxWidth: 320 }}>
                            <Select
                                themeVariant="light"
                                select="multiple"
                                selectMultiple={true}
                                placeholder="Select..."
                                inputClass="mobiscrollCustomMultiInput"
                                value={selectedModerators}
                                data={moderatorOptions}
                                onChange={(val: any) => {
                                    setSelectedModerators(val.value)
                                }}
                                touchUi={true}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false,
                                    }
                                }}
                            // minWidth={[60, 320]}
                            />
                        </label> */}

                        <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert("Update course?", "", [
                                        {
                                            text: "Cancel",
                                            style: "cancel",
                                            onPress: () => {
                                                return;
                                            }
                                        },
                                        {
                                            text: "Yes",
                                            onPress: () => {
                                                handleSubmit()
                                            }
                                        }
                                    ])
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    overflow: 'hidden',
                                    height: 35,
                                }}
                                disabled={isUpdatingChannel}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#006AFF',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    textTransform: 'uppercase',
                                    width: 150
                                }}>
                                    {isUpdatingChannel ? "UPDATING" : "UPDATE"}
                                </Text>
                            </TouchableOpacity>

                            {props.userId === channelCreator ? <TouchableOpacity
                                onPress={() => {
                                    props.scrollToTop()
                                    setShowDuplicateChannel(true)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 15
                                }}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#006AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 12,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    textTransform: 'uppercase',
                                    width: 150
                                }}>
                                    DUPLICATE
                                </Text>
                            </TouchableOpacity> : null}
                            {
                                temporary ?
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert("Delete course?", "", [
                                                {
                                                    text: "Cancel",
                                                    style: "cancel",
                                                    onPress: () => {
                                                        return;
                                                    }
                                                },
                                                {
                                                    text: "Yes",
                                                    onPress: () => {
                                                        handleDelete()
                                                    }
                                                }
                                            ])
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            overflow: 'hidden',
                                            height: 35,
                                            marginTop: 15
                                        }}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: '#006AFF',
                                            borderWidth: 1,
                                            borderRadius: 15,
                                            borderColor: '#006AFF',
                                            backgroundColor: '#fff',
                                            fontSize: 12,
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            textTransform: 'uppercase',
                                            width: 150
                                        }}>
                                            DELETE
                                        </Text>
                                    </TouchableOpacity>
                                    : null
                            }
                        </View>

                    </View>
                </View>
            </View>
        </View>
    );
}

export default ChannelSettings

const styles = StyleSheet.create({
    screen: {
        paddingTop: 10,
        paddingBottom: 20,
        width: '100%',
        backgroundColor: 'white',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    all: {
        fontSize: 14, fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 14, fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 20
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 14, fontFamily: 'inter',
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white'
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
        borderColor: '#1F1F1F'
    },
});

