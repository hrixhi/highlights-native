import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import MultiSelect from 'react-native-multiple-select';
import {
    doesChannelNameExist, findChannelById, getOrganisation, getSubscribers,
    getUserCount, subscribe, unsubscribe, updateChannel, getChannelColorCode
} from '../graphql/QueriesAndMutations';
import Alert from './Alert';
import MultiSelectComponent from './MultiSelect';
import ColorPicker from "./ColorPicker";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)

    
    // Use to subscribe and unsubscribe users
    const [originalSubs, setOriginalSubs] = useState<any[]>([])

    // Dropdown options for subscribers
    const [options, setOptions] = useState<any[]>([])

    // Selected Subscribers
    const [selected, setSelected] = useState<any[]>([])

    const [owner, setOwner] = useState<any>({})

    // Selected Moderators
    const [owners, setOwners] = useState<any[]>([])

    // The Main channel owner (Hide from all lists)
    const [channelCreator, setChannelCreator] = useState('')

    // Channel color
    const [colorCode, setColorCode] = useState("")
    const colorChoices = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#0d5d35", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607db8"]
    
    // Filters
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
    const roles = ['student', 'instructor']
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');

    // Used to find out if any moderators are removed
    const [originalOwners, setOriginalOwners] = useState<any[]>([]);

    // Used to keep all users to filter
    const [allUsers, setAllUsers] = useState([]);

    const [modOptions, setModOptions] = useState<any[]>([]);

    const RichText: any = useRef()

    useEffect(() => {

        let filteredUsers = [...allUsers];
        
        // First filter by role

        if (activeRole !== "All") {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole
            }) 

            filteredUsers = filterRoles;
        }

        if (activeGrade !== "All") {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade
            })

            filteredUsers  = filterGrades
        }

        if (activeSection !== "All") {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection
            })

            filteredUsers  = filterSections 
        }

        if (channelCreator !== "") {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== channelCreator
            })

            filteredUsers = filterOutMainOwner
        }

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                label: (user.fullName + ', ' + user.displayName),
                value: user._id
            }
        })

        setOptions(filteredOptions)
        
    }, [activeRole, activeGrade, activeSection, channelCreator])

    console.log("owners", owners)

    useEffect(() => {
        if (channelCreator !== "") {
            const subscribers = [...selected]

            const filterOutMainOwner = subscribers.filter((sub: any) => {
              return sub !== channelCreator  
            })

            setSelected(filterOutMainOwner)

        }
    }, [channelCreator])

    useEffect(() => {
        const filterSubs = allUsers.filter((user: any) => {
            return selected.includes(user._id)
        })

        const mods = filterSubs.map((user: any) => {
            return {
                label: (user.fullName + ', ' + user.displayName),
                value: user._id
            }
        })
        
        setModOptions(mods)


    }, [selected])

    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'row', backgroundColor: 'white', marginTop: 15 }}>
            <View style={{ backgroundColor: 'white', }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 10 }}>
                                <Menu
                                    onSelect={(role: any) => {
                                        setActiveRole(role)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                            {activeRole}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 10,
                                                    marginTop: 1,
                                                    backgroundColor: "#fff"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    All
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        {
                                            roles.map((role: any) => {
                                                return <MenuOption
                                                    value={role}>
                                                    <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                        <Text style={{ marginLeft: 5 }}>
                                                            {role}
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', backgroundColor: 'white' }}>
                                Roles
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'white', }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                                <Menu
                                    onSelect={(grade: any) => {
                                        setActiveGrade(grade)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                            {activeGrade}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 10,
                                                    marginTop: 1,
                                                    backgroundColor: "#fff"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    All
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        {
                                            grades.map((role: any) => {
                                                return <MenuOption
                                                    value={role}>
                                                    <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                        <Text style={{ marginLeft: 5 }}>
                                                            {role}
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', backgroundColor: 'white', paddingLeft: 20 }}>
                                Grades
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'white', }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                                <Menu
                                    onSelect={(grade: any) => {
                                        setActiveSection(grade)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                            {activeSection}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 10,
                                                    marginTop: 1,
                                                    backgroundColor: "#fff"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    All
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        {
                                            sections.map((section: any) => {
                                                return <MenuOption
                                                    value={section}>
                                                    <View style={{ display: 'flex', flexDirection: 'row',  }}>
                                                        <Text style={{ marginLeft: 5 }}>
                                                            {section}
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', paddingLeft: 20 }}>
                                Sections
                            </Text>
                        </View>
        </View>)
    }

    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            Alert('Enter channel name.')
            return
        }

        let moderatorsPresentAsSubscribers = true;

        owners.map((owner: any) => {
            const presentInSubscriber = selected.find((sub: any) => {
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


        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: name.trim()
            }
        }).then(async res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true || name.trim() === originalName.trim())) {

                server.mutate({
                    mutation: updateChannel,
                    variables: {
                        name: name.trim(),
                        password,
                        channelId: props.channelId,
                        temporary,
                        owners,
                        colorCode
                    }
                }).then(res2 => {
                    if (res2.data && res2.data.channel.update) {
                        // added subs
                        selected.map((sub: any) => {
                            const og = originalSubs.find((o: any) => {
                                return o.value === sub
                            })
                            if (!og) {
                                server.mutate({
                                    mutation: subscribe,
                                    variables: {
                                        name: name.trim(),
                                        password: password,
                                        userId: sub
                                    }
                                })
                            }
                        })
                        // removed subs
                        originalSubs.map((o: any) => {

                            if (o.value === channelCreator) return;

                            const og = selected.find((sub: any) => {
                                return o.value === sub
                            })
                            if (!og) {
                                server.mutate({
                                    mutation: unsubscribe,
                                    variables: {
                                        channelId: props.channelId,
                                        keepContent: true,
                                        userId: o.value
                                    }
                                })
                            }
                        })
                        Alert("Channel updated!")
                        setOriginalSubs([])
                        props.closeModal()
                    } else {
                        Alert("Something went wrong.")
                    }
                }).catch(err => {
                    console.log(err)
                    Alert("Something went wrong.")
                })
            } else {
                Alert("Channel name in use.")
            }
        }).catch(err => {
            Alert("Something went wrong.")
        })
    }, [name, password, props.channelId, options, originalSubs, owners,
        temporary, selected, originalName, colorCode])

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
                    userId: o.value
                }
            })
        })
        props.closeModal()
    }, [props.channelId, originalSubs, owner])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
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
                                            label: (item.fullName + ', ' + item.displayName),
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

                                            console.log("Owners", res.data.channel.findById.owners)
                                            if (res.data.channel.findById.owners) {
                                                const ownerOptions: any[] = []
                                                tempUsers.map((item: any) => {
                                                    const u = res.data.channel.findById.owners.find((i: any) => {
                                                        return i === item.value
                                                    })
                                                    if (u) {
                                                        ownerOptions.push(item.value)
                                                    }
                                                })

                                                // Filter out the main channel creator from the moderators list

                                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                                    return user !== res.data.channel.findById.channelCreator
                                                })

                                                setOriginalOwners(filterOutMainOwner)

                                                setOwners(ownerOptions)
                                            }
                                        }
                                    })
                                    setOptions(tempUsers)
                                })
                            }
                        }
                    })
                    .catch((e: any) => {
                        console.log("Error", e)
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
                            const temp: any[] = []
                            res.data.user.findByChannelId.map((item: any, index: any) => {
                                const x = { ...item, selected: false, index }
                                
                                    delete x.__typename
                                    tempUsers.push({
                                        label: (item.fullName + ', ' + item.displayName + ', ' + (item.email ? item.email : '')),
                                        value: item._id
                                    })
                                    temp.push(item._id)
                            })
                            setOriginalSubs(tempUsers)
                            setSelected(temp)
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
                        }
                    })
                }
            }
        )()

    }, [props.channelId, props.user])

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 10 }}>
                <Text
                    style={{
                        fontSize: 21,
                        // paddingBottom: 20,
                        fontFamily: 'inter',
                        // textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 25,
                        color: '#2f2f3c',
                        paddingBottom: 50
                    }}>
                    Settings
                </Text>
                <ScrollView
                    style={{
                        height: Dimensions.get('window').height - 200
                        // borderWidth: 1
                    }}
                >
                    <View style={{ flex: 1, paddingBottom: 50, backgroundColor: '#fff' }}>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                {PreferredLanguageText('channel') + ' ' + PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={name}
                                placeholder={''}
                                onChangeText={val => {
                                    setName(val)
                                }}
                                placeholderTextColor={'#a2a2ac'}
                                required={true}
                                footerMessage={'case sensitive'}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={val => setPassword(val)}
                                placeholderTextColor={'#a2a2ac'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                color
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

                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase',  marginTop: 20  }}>
                            Subscribers
                        </Text>

                        {renderSubscriberFilters()}
                        <View
                            style={{
                                paddingTop: 25,
                                backgroundColor: "#fff",
                                // borderWidth: 1,
                                // flex: 1
                            }}>
                            <MultiSelect
                                key={selected.toString()}
                                hideTags={false}
                                items={options}
                                uniqueKey="value"
                                ref={RichText}
                                styleTextDropdown={{
                                    fontFamily: 'overpass'
                                }}
                                styleDropdownMenuSubsection={{
                                    height: 50,
                                }}
                                styleSelectorContainer={{
                                    height: 350,
                                }}
                                styleItemsContainer={{
                                    height: 250
                                }}
                                styleListContainer={{
                                    height: 250,
                                    backgroundColor: '#fff'
                                }}
                                onSelectedItemsChange={(sel: any) => {
                                    setSelected(sel)
                                    const filterOwners = owners.filter((owner: any) => {
                                        return sel.includes(owner)
                                    })

                                    setOwners(filterOwners)
                                }}
                                selectedItems={selected}
                                selectText="Subscribers"
                                searchInputPlaceholderText="Search..."
                                altFontFamily="overpass"
                                tagRemoveIconColor="#a2a2ac"
                                tagBorderColor="#a2a2ac"
                                tagTextColor="#a2a2ac"
                                selectedItemTextColor="#2f2f3c"
                                selectedItemIconColor="#2f2f3c"
                                itemTextColor="#2f2f3c"
                                displayKey="label"
                                textColor="#2f2f3c"
                                submitButtonColor={'#2f2f3c'}
                                submitButtonText="Done"
                            />
                        </View>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', marginTop: 40 }}>
                            Moderators
                        </Text>
                        <View
                            style={{
                                paddingTop: 15,
                                backgroundColor: "#fff",
                                // borderWidth: 1,
                                // flex: 1
                            }}>
                            <MultiSelectComponent
                                subscribers={modOptions}
                                selected={owners}
                                onAddNew={(e: any) => setOwners(e)}
                                settings={true}
                                selectText="Moderators"
                            />
                        </View>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'row',
                                paddingTop: 25
                            }}>
                            <TouchableOpacity
                                onPress={() => handleSubmit()}
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
                                    lineHeight: 35,
                                    color: 'white',
                                    fontSize: 11,
                                    backgroundColor: '#3B64F8',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                    UPDATE
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {
                            temporary ?
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        // height: 50,
                                        paddingTop: 15
                                    }}>
                                    <TouchableOpacity
                                        onPress={() => handleDelete()}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            overflow: 'hidden',
                                            height: 35,
                                            // marginTop: 15
                                        }}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: '#2f2f3c',
                                            fontSize: 11,
                                            backgroundColor: '#f4f4f6',
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            DELETE
                                        </Text>
                                    </TouchableOpacity>
                                </View> : null
                        }
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

export default ChannelSettings

const styles = StyleSheet.create({
    screen: {
        padding: 15,
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: 500,
        height: Dimensions.get('window').height - 85,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    },
    all: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
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
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});