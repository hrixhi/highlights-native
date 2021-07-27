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
    getUserCount, subscribe, unsubscribe, updateChannel
} from '../graphql/QueriesAndMutations';
import Alert from './Alert';
import MultiSelectComponent from './MultiSelect';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)

    const [originalSubs, setOriginalSubs] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selected, setSelected] = useState<any[]>([])
    const [owner, setOwner] = useState<any>('')
    const [owners, setOwners] = useState<any[]>([])


    const RichText: any = useRef()

    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            Alert('Enter channel name.')
            return
        }

        if (selected.length === 0) {
            Alert('Select subscribers.')
            return
        }
        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: name.trim()
            }
        }).then(res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true || name.trim() === originalName.trim())) {

                let unsub = false
                // if (confirm('Unsubscribe removed moderators?')) {
                //     unsubscribe = true
                // }

                server.mutate({
                    mutation: updateChannel,
                    variables: {
                        name: name.trim(),
                        password,
                        channelId: props.channelId,
                        temporary,
                        owners,
                        unsubscribe: unsub
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
        temporary, selected, originalName])

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
                                    const tempUsers: any[] = []
                                    res.data.user.getSchoolUsers.map((item: any, index: any) => {
                                        const x = { ...item, selected: false, index }
                                        delete x.__typename
                                        tempUsers.push({
                                            label: (item.fullName),
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
                                                setOwners(ownerOptions)
                                            }
                                        }
                                    })
                                    setOptions(tempUsers)
                                })
                            }
                        }
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
                                if (item._id.toString().trim() === user._id.toString().trim()) {
                                    setOwner(item._id)
                                } else {
                                    delete x.__typename
                                    tempUsers.push({
                                        label: (item.fullName + ', ' + item.displayName + ', ' + (item.email ? item.email : '')),
                                        value: item._id
                                    })
                                    temp.push(item._id)
                                }
                            })
                            setOriginalSubs(tempUsers)
                            setSelected(temp)
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
                            <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
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
                            <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
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
                        <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                            Subscribers
                        </Text>
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
                                onSelectedItemsChange={(sel: any) => setSelected(sel)}
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
                        <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                            Moderators
                        </Text>
                        <View
                            style={{
                                paddingTop: 25,
                                backgroundColor: "#fff",
                                // borderWidth: 1,
                                // flex: 1
                            }}>
                            <MultiSelectComponent
                                subscribers={options}
                                selected={owners}
                                onAddNew={(e: any) => setOwners(e)}
                                settings={true}
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
        padding: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});