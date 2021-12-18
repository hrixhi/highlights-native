// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Keyboard, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    doesChannelNameExist, findChannelById, getOrganisation, getSubscribers, getUserCount, subscribe, unsubscribe, updateChannel, getChannelColorCode, duplicateChannel, resetAccessCode, getChannelModerators
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

// import ReactTagInput from "@pathofdev/react-tag-input";
// import "@pathofdev/react-tag-input/build/index.css";

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

    // HOOKS

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

    /**
     * @description Fetches all the data for the channel 
     */
    useEffect(() => {
        (
            async () => {
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
                        alert("Could not Channel data. Check connection.")
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
            }
        )()

    }, [props.channelId, props.user])

    /**
     * @description Handles duplicating channel
     */
    const handleDuplicate = useCallback(() => {

        if (duplicateChannelName.toString().trim() === '') {
            alert('Enter duplicate channel name.')
            return
        }

        if (duplicateChannelColor === "") {
            alert('Pick duplicate channel color.')
            return
        }

        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: duplicateChannelName.trim()
            }
        }).then(async res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true)) {
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
                        alert("Channel duplicated successfully.")
                        // Refresh Subscriptions for user
                        props.refreshSubscriptions()
                        props.closeModal()
                    }
                })
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
            alert('Enter channel name.')
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
                        colorCode
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
                        setOriginalSubs([])

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
        temporary, selected, originalName, colorCode, selectedValues, selectedModerators])

    /**
     * @description Handle delete channel (Note: Only temporary channels can be deleted)
     */
    const handleDelete = useCallback(() => {
        const server = fetchAPI('')
        const subs = JSON.parse(JSON.stringify(originalSubs))
        subs.push(owner)
        subs.map((o: any) => {
            server.mutate({
                mutation: unsubscribe,
                variables: {
                    channelId: props.channelId,
                    keepContent: false,
                    userId: o.id
                }
            })
        })
        Alert("Deleted Channel successfully.")
        props.closeModal()
        // Force reload
        props.refreshSubscriptions()
    }, [props.channelId, originalSubs, owner])

    // FUNCTIONS 

    /**
	* @description Renders filters for Subscribers dropdown 
	*/
    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'column', backgroundColor: 'white', marginTop: 20 }}>
            <View style={{ backgroundColor: 'white', }}>
                <View style={{ backgroundColor: 'white', }}>
                    {/* <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                        <Select
                            touchUi={true}
                            value={activeRole}
                            rows={3}
                            themeVariant="light"
                            onChange={(val: any) => {
                                setActiveRole(val.value)
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble'
                                },
                                medium: {
                                    touchUi: false
                                }
                            }}
                            data={filterRoleOptions}
                        />
                    </label> */}
                    <DropDownPicker
                        open={isRoleDropdownOpen}
                        value={activeRole}
                        items={filterRoleOptions}
                        setOpen={setIsRoleDropdownOpen}
                        setValue={setActiveRole}
                    />
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                    <View style={{ backgroundColor: 'white', }}>
                        {/* <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                            <Select
                                touchUi={true}
                                value={activeGrade}
                                themeVariant="light"
                                onChange={(val: any) => {
                                    setActiveGrade(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                data={filterGradeOptions}
                            />
                        </label> */}
                        <DropDownPicker
                            open={isGradeDropdownOpen}
                            value={activeGrade}
                            items={filterGradeOptions}
                            setOpen={setIsGradeDropdownOpen}
                            setValue={setActiveGrade}
                        />
                    </View>
                </View>
                <View style={{ backgroundColor: 'white', }}>
                    <View style={{ backgroundColor: 'white', }}>
                        {/* <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                            <Select
                                touchUi={true}
                                value={activeSection}
                                themeVariant="light"
                                onChange={(val: any) => {
                                    setActiveSection(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                data={filterSectionOptions}
                            />
                        </label> */}
                        <DropDownPicker
                            open={isSectionDropdownOpen}
                            value={activeSection}
                            items={filterSectionOptions}
                            setOpen={setIsSectionDropdownOpen}
                            setValue={setActiveSection}
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
                flex: 1,
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#efefef",
                paddingVertical: 100
            }}>
            <ActivityIndicator color={"#1F1F1F"} />
        </View>
    }


    // RENDER VIEW FOR CHANNEL DUPLICATION

    if (showDuplicateChannel) {
        return (<View style={{
            borderLeftWidth: 3,
            borderColor: props.channelColor,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            shadowOffset: {
                width: 2,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            zIndex: 5000000
        }}>
            <View style={styles.screen} >
                <View style={{
                    maxWidth: 400,
                    alignSelf: 'center',
                    minHeight: 100,
                }}>
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                setShowDuplicateChannel(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#1F1F1F'
                            }}>
                                <Ionicons name='chevron-back-outline' size={22} color={'#000000'} style={{ marginRight: 10 }} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            paddingBottom: 20,
                            fontFamily: 'inter',
                            flex: 1,
                            lineHeight: 25
                        }}>
                        Duplicate
                    </Text>
                    <ScrollView
                        onScroll={() => {
                            Keyboard.dismiss()
                        }}
                        contentContainerStyle={{
                            maxHeight: Dimensions.get('window').height - 95,
                            // height: 'auto',
                            minHeight: 100,
                            paddingRight: 50
                        }}
                    >
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000'
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
                                footerMessage={'case sensitive'}
                            />
                        </View>
                        {
                            !school ?
                            (<View style={{ backgroundColor: 'white' }}>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#000000'
                                }}>
                                    Description
                                </Text>
                                {/* <TextareaAutosize
                                value={description}
                                style={{
                                    fontFamily: 'overpass',
                                    width: "100%",
                                    maxWidth: 500,
                                    borderBottom: '1px solid #efefef',
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
                                        borderBottom: '1px solid #efefef',
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
                                color: '#000000'
                            }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={duplicateChannelPassword}
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={val => setDuplicateChannelPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000'
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
                                            color: '#000000'
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
                                                false: "#efefef",
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
                                                color: '#000000'
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
                                                    false: "#efefef",
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
                                                color: '#000000'
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
                                                    false: "#efefef",
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
            borderLeftWidth: 3,
            borderColor: props.channelColor,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            shadowOffset: {
                width: 2,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            zIndex: 5000000
        }}>
            <View style={styles.screen} >
                <View style={{ backgroundColor: 'white', paddingTop: 20, paddingHorizontal: 10, }}>
                    <View
                        style={{
                            maxWidth: 400,
                            alignSelf: 'center',
                            minHeight: 100,
                        }}
                    >
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000'
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

                                    <TouchableOpacity style={{ 
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        marginRight: 10
                                    }} onPress={() => {
                                        navigator.clipboard.writeText(accessCode)
                                        setCopied(true)
                                    }}>
                                        <Ionicons name={copied ? "checkmark-circle-outline" : "clipboard-outline"} size={18} color={copied ? "#35AC78" : "#006AFF"} />
                                        <Text style={{ color: copied ? "#35AC78" : "#006AFF", fontSize: 10, paddingTop: 3 }}> {copied ? "Copied" : "Copy"} </Text>
                                    </TouchableOpacity>

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

                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000'
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
                                footerMessage={'case sensitive'}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14, 
                                color: '#000000'
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

                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                color: '#000000'
                            }}>
                                Theme
                            </Text>
                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white', marginTop: 20 }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
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
                                            color: '#000000'
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
                                                false: "#efefef",
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

                        <Text style={{
                            fontSize: 14,
                            paddingTop: 20,
                            color: '#000000'
                        }}>
                            Viewers
                        </Text>

                        {school ? renderSubscriberFilters() : null}
                        <View style={{
                            flexDirection: 'column', marginTop: 25,
                        }}>
                            <View style={{ height: 'auto', maxWidth: 320, width: '100%' }}>
                                <div style={{ width: '100%', maxWidth: 320 }} >
                                <DropDownPicker
                                    multiple={true}
                                    open={isViewersDropdownOpen}
                                    value={selectedValues}
                                    items={options}
                                    setOpen={setIsViewersDropdownOpen}
                                    setValue={(val: any) => {
                                        setSelectedValues(val)
                                        // Filter out any moderator if not part of the selected values

                                        let filterRemovedModerators = selectedModerators.filter((mod: any) => val.includes(mod))

                                        setSelectedModerators(filterRemovedModerators)
                                    }}
                                />
                                    {/* <label style={{ width: '100%', maxWidth: 320 }}>
                                        <Select
                                            themeVariant="light"
                                            selectMultiple={true}
                                            group={true}
                                            groupLabel="&nbsp;"
                                            inputClass="mobiscrollCustomMultiInput"
                                            placeholder="Select..."
                                            touchUi={true}
                                            value={selectedValues}
                                            data={options}
                                            onChange={(val: any) => {
                                                setSelectedValues(val.value)
                                                // Filter out any moderator if not part of the selected values

                                                let filterRemovedModerators = selectedModerators.filter((mod: any) => val.value.includes(mod))

                                                setSelectedModerators(filterRemovedModerators)
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false,
                                                }
                                            }}
                                        />
                                    </label> */}

                                </div>
                            </View>
                        </View>
                        <Text style={{
                            fontSize: 14,
                            color: '#000000', marginTop: 25, marginBottom: 20
                        }}>
                            Editors
                        </Text>
                        <DropDownPicker
                            multiple={true}
                            open={isEditorsDropdownOpen}
                            value={selectedModerators}
                            items={moderatorOptions}
                            setOpen={setIsEditorsDropdownOpen}
                            setValue={setSelectedModerators}
                        />
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


                            <TouchableOpacity
                                onPress={() => setShowDuplicateChannel(true)}
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
                            </TouchableOpacity>
                            {
                                temporary ?
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert("Delete channel?", "", [
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
                                            marginTop: 15,
                                        }}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: '#000000',
                                            fontSize: 12,
                                            backgroundColor: '#efefef',
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
        borderBottomColor: '#efefef',
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

