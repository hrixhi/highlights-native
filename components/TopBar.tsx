import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, ScrollView, Dimensions, Linking, Platform } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { getMeetingStatus, getOrganisation, totalUnreadDiscussionThreads, totalUnreadMessages } from '../graphql/QueriesAndMutations';
import useColorScheme from '../hooks/useColorScheme';

const TopBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styles: any = styleObject(props.channelId)
    const colorScheme = 'dark';
    const [unreadDiscussionThreads, setUnreadDiscussionThreads] = useState(0)
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [meetingOn, setMeetingOn] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [school, setSchool] = useState<any>(null)

    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user')
            if (u) {
                const user = JSON.parse(u)
                const server = fetchAPI('')
                server.query({
                    query: getOrganisation,
                    variables: {
                        userId: user._id
                    }
                }).then(res => {
                    if (res.data && res.data.school.findByUserId) {
                        setSchool(res.data.school.findByUserId)
                    }
                })
            }
        })()
    }, [])

    useEffect(() => {

        if (props.channelId !== '') {
            (
                async () => {
                    const u = await AsyncStorage.getItem('user')
                    if (u) {
                        const user = JSON.parse(u)
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            setIsOwner(true)
                        }
                        const server = fetchAPI('')
                        server.query({
                            query: totalUnreadDiscussionThreads,
                            variables: {
                                userId: user._id,
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (res.data.threadStatus.totalUnreadDiscussionThreads) {
                                setUnreadDiscussionThreads(res.data.threadStatus.totalUnreadDiscussionThreads)
                            }
                        })
                        server.query({
                            query: totalUnreadMessages,
                            variables: {
                                userId: user._id,
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (res.data.messageStatus.totalUnreadMessages) {
                                setUnreadMessages(res.data.messageStatus.totalUnreadMessages)
                            }
                        })
                        server.query({
                            query: getMeetingStatus,
                            variables: {
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
                                setMeetingOn(true)
                            } else {
                                setMeetingOn(false)
                            }
                        }).catch(err => console.log(err))
                    }
                }
            )()
        }
    }, [])

    return (
        <View style={styles.topbar} key={Math.random()}>
            {/* <Prompt
                title="Update Name"
                placeholder="Enter new channel name"
                defaultValue=""
                visible={showResetNamePromptAndroid}
                onCancel={() => {
                    setShowResetNamePromptAndroid(false);
                    setResetChannelName('');
                }}
                onSubmit={(value: any) => {
                    if (!value) {
                        // Show prompt here
                        alert("Enter channel name")
                    } else {
                        setResetChannelName(value);
                        setShowResetNamePromptAndroid(false);
                        setShowResetPasswordPromptAndroid(true);
                    }
                }
                }
            /> */}
            {/* <Prompt
                title="Update Password"
                placeholder="Enter new channel password. Leave blank for public access."
                defaultValue=""
                visible={showResetPasswordPromptAndroid}
                onCancel={() => {
                    setShowResetNamePromptAndroid(false);
                }}
                onSubmit={(password: any) => {

                    const server = fetchAPI("")
                    server.query({
                        query: doesChannelNameExist,
                        variables: {
                            name: resetChannelName
                        }
                    }).then(res => {
                        if (res.data && (res.data.channel.doesChannelNameExist !== true || resetChannelName.trim() === props.filterChoice.trim())) {
                            server.mutate({
                                mutation: updateChannel,
                                variables: {
                                    name: resetChannelName.trim(),
                                    password,
                                    channelId: props.channelId
                                }
                            }).then(res => {
                                if (res.data && res.data.channel.update) {
                                    props.loadData()
                                    alert("Channel updated!")
                                } else {
                                    alert("Something went wrong.")
                                }
                            }).catch(err => {
                                alert("Something went wrong.")
                            })
                        } else {
                            alert("Channel name in use.")
                        }
                    }).catch(err => {
                        alert("Something went wrong.")
                    })

                    setResetChannelName("");
                    setShowResetPasswordPromptAndroid(false);
                }
                }
            /> */}
            {/* <View style={{ width: '80%', height: Dimensions.get('window').height * 0.17 * 0.15, alignSelf: 'center' }} /> */}
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15, backgroundColor: '#2f2f3c' }}>
                <View style={{
                    // height: '55%',
                    flexDirection: 'row',
                    display: 'flex',
                    paddingHorizontal: 25,
                    paddingTop: 29,
                    backgroundColor: '#2f2f3c'
                    // borderBottomWidth: 1
                }}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: '#2f2f3c' }}>
                        <Image
                            key={school}
                            source={
                                school && school.logo && school.logo !== ''
                                    ?
                                    { uri: school.logo }
                                    :
                                    (

                                        require('./default-images/cues-logo-white-exclamation-hidden.jpg')
                                    )
                            }
                            style={{
                                width: school && school.logo && school.logo !== '' ?
                                    Dimensions.get('window').height * 0.14 * 0.53456 : Dimensions.get('window').height * 0.14 * 0.53456,
                                height: school && school.logo && school.logo !== '' ?
                                    Dimensions.get('window').height * 0.13 * 0.35 : Dimensions.get('window').height * 0.15 * 0.2,
                            }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                    <View
                        // key={JSON.stringify(cues)}
                        style={{
                            flex: 1, flexDirection: 'row', backgroundColor: '#2f2f3c'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: '#2f2f3c' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2f2f3c' }}
                                        onPress={() => props.openMeeting()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='videocam-outline' size={19} color={'#fff'} />
                                        </Text>
                                        {
                                            meetingOn ?
                                                <View style={styles.badge} /> : null
                                        }
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Lectures
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2f2f3c' }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='mail-outline' size={19} color={'#fff'} />
                                        </Text>
                                        {
                                            unreadMessages !== 0 ?
                                                <View style={styles.badge2} /> : null
                                        }
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Inbox
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2f2f3c' }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={18} color={'#fff'} />
                                        </Text>
                                        {
                                            unreadDiscussionThreads !== 0 ?
                                                <View style={styles.badge3} /> : null
                                        }
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Discussion
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: isOwner ? 15 : 0, backgroundColor: '#2f2f3c' }}
                                        onPress={() => props.openGrades()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='stats-chart-outline' size={18} color={'#fff'} />
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Grades
                                        </Text>
                                    </TouchableOpacity>
                                    {
                                        isOwner ?
                                            <TouchableOpacity
                                                style={{ marginRight: 0, backgroundColor: '#2f2f3c' }}
                                                onPress={() => props.openChannelSettings()}>
                                                <Text style={styles.channelText}>
                                                    <Ionicons name='settings-outline' size={18} color={'#fff'} />
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                                    Settings
                                                </Text>
                                            </TouchableOpacity> : null
                                    }
                                </View> :
                                (
                                    props.filterChoice === 'All' ?
                                        <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                                            <Text style={{ fontSize: 10, color: '#a2a2ac', textAlign: 'right' }}>
                                                Select channel to view options.
                                            </Text>
                                        </View> :
                                        <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                                            <Text style={{ fontSize: 10, color: '#a2a2ac', textAlign: 'right' }}>
                                                Your personal space.
                                            </Text>
                                        </View>
                                )
                        }
                    </View>
                </View>
                {/* <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{
                        width: '100%',
                        height: '45%',
                        flexDirection: 'column',
                        paddingTop: 2
                    }}>
                    <View style={{ flex: 1 }} />
                    <ScrollView style={{
                        width: '98.5%',
                        // paddingTop: 2,
                        paddingLeft: 25
                    }} horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        <TouchableOpacity
                            style={filterChoice === 'All' ? styles.subOutline : styles.sub}
                            onPress={() => props.setChannelFilterChoice('All')}>
                            <Text
                                style={{ color: '#a2a2ac', lineHeight: 20, fontSize: 13 }}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {
                            channelCategories.map((category: string) => {
                                return <TouchableOpacity
                                    key={Math.random()}
                                    style={filterChoice === category ? styles.subOutline : styles.sub}
                                    onPress={() => props.setChannelFilterChoice(category)}>
                                    <Text
                                        style={{ color: '#a2a2ac', lineHeight: 20, fontSize: 13 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View> */}
            </View>
        </View>
    );
}


export default React.memo(TopBar, (prev, next) => {
    return _.isEqual(prev.cues, next.cues) && _.isEqual(prev.channelFilterChoice, next.channelFilterChoice)
})

const styleObject: any = (channelId: any) => StyleSheet.create({
    topbar: {
        height: '13%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        // paddingHorizontal: 20,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        paddingTop: 25,
        maxWidth: 550,
        backgroundColor: '#2f2f3c'
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: 4,
        marginTop: 2,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    badge2: {
        position: 'absolute',
        // alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginLeft: 23,
        marginTop: 2,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    badge3: {
        position: 'absolute',
        // alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginLeft: 32,
        marginTop: 2,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    text: {
        textAlign: 'right',
        color: '#2f2f3c',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 10,
        borderColor: '#a2a2ac',
        borderWidth: 1
    },
    sub: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center',
        backgroundColor: '#2f2f3c'
    }
});
