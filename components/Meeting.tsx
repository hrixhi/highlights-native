import React, { useState, useEffect, useCallback } from 'react';
import { Animated, Dimensions, Switch, StyleSheet } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Jutsu } from 'react-jutsu'
import { fetchAPI } from '../graphql/FetchAPI';
// import Datetime from 'react-datetime';
import { createScheduledMeeting, editMeeting, getAttendances, getMeetingStatus, getPastDates, getUpcomingDates, markAttendance } from '../graphql/QueriesAndMutations';
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import { ScrollView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [room] = useState(props.channelId)
    const [name, setName] = useState('')
    const [password] = useState(props.channelCreatedBy)
    const [isOwner, setIsOwner] = useState(false)
    const [meetingOn, setMeetingOn] = useState(false)
    const [start, setStart] = useState(new Date())
    const [end, setEnd] = useState(new Date())
    const [meetingEndText, setMeetingEndText] = useState('Classroom not in session.')
    const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
    const [pastMeetings, setPastMeetings] = useState<any[]>([])
    const [showAttendances, setShowAttendances] = useState(false)
    const [attendances, setAttendances] = useState<any[]>([])

    const loadAttendances = useCallback((dateId) => {
        const server = fetchAPI('')
        server.query({
            query: getAttendances,
            variables: {
                dateId
            }
        }).then(res => {
            if (res.data && res.data.attendance.getAttendances) {
                setShowAttendances(true)
                setAttendances(res.data.attendance.getAttendances)
            }
        })
    }, [])

    const loadSchedule = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getUpcomingDates,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data && res.data.attendance.getUpcomingDates) {
                setUpcomingMeetings(res.data.attendance.getUpcomingDates)
            }
        })
    }, [props.channelId])

    const loadPastSchedule = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getPastDates,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data && res.data.attendance.getPastDates) {
                setPastMeetings(res.data.attendance.getPastDates)
            }
        })
    }, [])

    useEffect(() => {
        loadSchedule()
    }, [])

    const loadMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getMeetingStatus,
            variables: {
                channelId: props.channelId
            }
        }).then(async res => {
            if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
                setMeetingOn(true)
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    server.mutate({
                        mutation: markAttendance,
                        variables: {
                            userId: user._id,
                            channelId: props.channelId
                        }
                    }).then(res => {
                        // do nothing...
                        // attendance marked
                    })
                }
            } else {
                setMeetingOn(false)
            }
        }).catch(err => console.log(err))
    }, [props.channelId])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setName(user.displayName)
                    if (user._id.toString().trim() === props.channelCreatedBy) {
                        setIsOwner(true)
                        loadPastSchedule()
                    }
                }
            }
        )()
        loadMeetingStatus()
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [props.channelCreatedBy, props.channelId])
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height

    const updateMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editMeeting,
            variables: {
                channelId: props.channelId,
                meetingOn: !meetingOn
            }
        }).then(res => {
            if (res.data && res.data.channel && res.data.channel.editMeeting) {
                loadMeetingStatus()
            }
        }).catch(e => console.log(e))
    }, [meetingOn, props.channelId])

    const handleCreate = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: createScheduledMeeting,
            variables: {
                channelId: props.channelId,
                start: start.toISOString(),
                end: end.toISOString()
            }
        }).then(res => {
            if (res.data && res.data.attendance.create) {
                loadSchedule()
            }
        })
    }, [start, end, props.channelId])

    if (name === '') {
        return null
    }

    const toolbarButtons = [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'etherpad', 'sharedvideo', 'raisehand',
        'videoquality', 'filmstrip',
        'tileview', 'download', 'security'
    ]
    if (isOwner) {
        toolbarButtons.push('mute-everyone', 'mute-video-everyone', 'stats', 'settings', 'livestreaming')
    }

    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: '#fff',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                padding: 20,
                opacity: modalAnimation,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                alignSelf: 'center'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', paddingTop: 5 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                    <Text
                        ellipsizeMode="tail"
                        style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
                        Classroom
                    </Text>
                </View>
                <View style={{ backgroundColor: 'white', flex: 1 }}>
                    {
                        isOwner ?
                            <View style={{ backgroundColor: '#fff' }}>
                                <View style={{ width: '100%', paddingTop: 20, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                        Initiate Meeting & Allow Participants
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10
                                }}>
                                    <Switch
                                        value={meetingOn}
                                        onValueChange={() => updateMeetingStatus()}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#3B64F8'
                                        }}
                                        thumbColor='white'
                                    />
                                </View>
                            </View> : null
                    }
                    {/* {
                        meetingOn ?
                            <View>
                                <Text
                                    style={{ color: '#a2a2aa', fontSize: 13, lineHeight: 20, marginVertical: 25 }}
                                >
                                    Switching from this window to any other window within Cues will revoke your participation from the classroom. {'\n'}
                                        To continue using Cues without exiting the classroom, open it in a
                                        {/* <a href='https://web.cuesapp.co' style={{ color: '#3B64F8' }} target='_blank'> 
                                            new tab
                                            {/* </a> 
                                             and continue working simultaneously.
                                </Text>
                            </View> : null
                    } */}
                    {
                        meetingOn ?
                            <Text>
                                meeting on
                        </Text>
                            // <Jutsu
                            //     containerStyles={{
                            //         width: '100%',
                            //         height: 500,
                            //         marginTop: isOwner ? 20 : 70,
                            //         borderRadius: 20
                            //     }}
                            //     configOverwrite={{
                            //         // disableInviteFunctions: true,
                            //         startWithAudioMuted: true,
                            //         startWithVideoMuted: true,
                            //         prejoinPageEnabled: false,
                            //         disableProfile: true,
                            //         remoteVideoMenu:
                            //         {
                            //             disableKick: !isOwner,
                            //         },
                            //         toolbarButtons,
                            //     }}
                            //     interfaceConfigOverwrite={{
                            //         TOOLBAR_BUTTONS: toolbarButtons,
                            //         SHOW_JITSI_WATERMARK: false,
                            //         showJitsiWatermark: false,
                            //         SHOW_POWERED_BY: false,
                            //         SHOW_PROMOTIONAL_CLOSE_PAGE: false
                            //     }}
                            //     // domain='cuesapp.co'
                            //     roomName={room}
                            //     displayName={name}
                            //     subject={props.channelName}
                            //     password={password}
                            //     onMeetingEnd={() => {
                            //         if (isOwner) {
                            //             updateMeetingStatus();
                            //         }
                            //         setMeetingOn(false);
                            //         setMeetingEndText('Meeting exited.');
                            //     }}
                            //     loadingComponent={<p>loading ...</p>}
                            //     errorComponent={<p>Oops, something went wrong</p>}
                            //      />
                            : <View style={{ backgroundColor: 'white', flex: 1, paddingBottom: 25, borderBottomColor: '#f4f4f6', borderBottomWidth: 1 }}>
                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    {meetingEndText}
                                </Text>
                            </View>
                    }
                    {
                        !isOwner ? <View style={{ backgroundColor: '#fff' }}>
                            <Text
                                ellipsizeMode="tail"
                                style={{ color: '#a2a2aa', fontSize: 17, lineHeight: 25, marginVertical: 25 }}>
                                Upcoming
                            </Text>
                        </View> : null
                    }
                    {
                        isOwner ?
                            <View style={{
                                backgroundColor: '#fff',
                                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                marginBottom: 40,
                                marginTop: 25
                            }}>
                                <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '30%', backgroundColor: '#fff' }}>
                                    <Text
                                        ellipsizeMode="tail"
                                        style={{ color: '#a2a2aa', fontSize: 17, lineHeight: 25, marginBottom: 25, marginTop: 10 }}>
                                        Upcoming
                            </Text>
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                    backgroundColor: '#fff',
                                    marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                                }}>
                                    <Text style={styles.text}>
                                        Start
                                </Text>
                                    <DateTimePicker
                                        style={styles.timePicker}
                                        value={start}
                                        mode={'date'}
                                        textColor={'#202025'}
                                        onChange={(event, selectedDate) => {
                                            const currentDate: any = selectedDate;
                                            setStart(currentDate)
                                        }}
                                    />
                                    <View style={{ height: 10, backgroundColor: 'white' }} />
                                    <DateTimePicker
                                        style={styles.timePicker}
                                        value={start}
                                        mode={'time'}
                                        textColor={'#202025'}
                                        onChange={(event, selectedDate) => {
                                            const currentDate: any = selectedDate;
                                            setStart(currentDate)
                                        }}
                                    />
                                    {/* <Datetime
                                        value={start}
                                        onChange={(event: any) => {
                                            const date = new Date(event)
                                            setStart(date)
                                        }}
                                    /> */}
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                    flexDirection: 'row',
                                    paddingTop: 12,
                                    backgroundColor: '#fff',
                                    marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                                }}>
                                    <Text style={styles.text}>
                                        End
                                </Text>
                                    <View style={{ width: 6, backgroundColor: '#fff' }} />
                                    {/* <Datetime
                                        value={end}
                                        onChange={(event: any) => {
                                            const date = new Date(event)
                                            setEnd(date)
                                        }}
                                    /> */}
                                    <DateTimePicker
                                        style={styles.timePicker}
                                        value={end}
                                        mode={'date'}
                                        textColor={'#202025'}
                                        onChange={(event, selectedDate) => {
                                            const currentDate: any = selectedDate;
                                            setEnd(currentDate)
                                        }}
                                    />
                                    <View style={{ height: 10, backgroundColor: 'white' }} />
                                    <DateTimePicker
                                        style={styles.timePicker}
                                        value={end}
                                        mode={'time'}
                                        textColor={'#202025'}
                                        onChange={(event, selectedDate) => {
                                            const currentDate: any = selectedDate;
                                            setEnd(currentDate)
                                        }}
                                    />
                                </View>
                                <View style={{
                                    backgroundColor: '#fff',
                                    width: Dimensions.get('window').width < 768 ? '100%' : '10%',
                                    flexDirection: 'row',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            marginTop: 15,
                                            borderRadius: 15,
                                            width: '100%', justifyContent: 'center', flexDirection: 'row',
                                        }}
                                        onPress={() => handleCreate()}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: '#202025',
                                            overflow: 'hidden',
                                            fontSize: 12,
                                            backgroundColor: '#f4f4f6',
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            width: 150,
                                            borderRadius: 15,
                                        }}>
                                            ADD
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View> : null
                    }
                    {
                        upcomingMeetings.length === 0 ?
                            <View style={{ backgroundColor: 'white', flex: 1 }}>
                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    No meetings scheduled.
                                </Text>
                            </View>
                            :
                            upcomingMeetings.map((date: any, index: any) => {
                                return <View style={styles.col} key={index}>
                                    <SubscriberCard
                                        hideChevron={true}
                                        fadeAnimation={props.fadeAnimation}
                                        subscriber={{
                                            displayName: (new Date(date.start)).toString() + ' to ' + (new Date(date.end)).toString(),
                                            fullName: 'scheduled'
                                        }}
                                        onPress={() => { }}
                                        status={!props.cueId ? false : true}
                                    />
                                </View>
                            })

                    }
                    {
                        isOwner ?
                            <View style={{ borderTopColor: '#f4f4f6', borderTopWidth: 1, marginTop: 25, backgroundColor: '#fff' }}>
                                <View style={{ paddingVertical: 15, backgroundColor: '#fff' }}>
                                    {
                                        showAttendances ?
                                            <TouchableOpacity
                                                key={Math.random()}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'white'
                                                }}
                                                onPress={() => {
                                                    setShowAttendances(false)
                                                    setAttendances([])
                                                }}>
                                                <Text style={{
                                                    width: '100%',
                                                    fontSize: 17,
                                                    color: '#a2a2aa'
                                                }}>
                                                    <Ionicons name='chevron-back-outline' size={17} color={'#202025'} style={{ marginRight: 10 }} /> Attended By
                                                </Text>
                                            </TouchableOpacity>
                                            : <Text
                                                ellipsizeMode="tail"
                                                style={{ color: '#a2a2aa', fontSize: 17, lineHeight: 25, marginVertical: 25 }}>
                                                Past
                                        </Text>}
                                </View>
                                {

                                    showAttendances ?
                                        <View style={{ backgroundColor: '#fff' }}>
                                            {
                                                attendances.length === 0 ?
                                                    <View style={{ backgroundColor: 'white', flex: 1, }}>
                                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                            No attendances.
                                                        </Text>
                                                    </View>
                                                    :
                                                    attendances.map((att: any, index: any) => {
                                                        return <View style={styles.col} key={index}>
                                                            <SubscriberCard
                                                                hideChevron={true}
                                                                fadeAnimation={props.fadeAnimation}
                                                                subscriber={{
                                                                    displayName: att.displayName,
                                                                    fullName: 'Joined at ' + (new Date(att.joinedAt)).toString()
                                                                }}
                                                                onPress={() => { }}
                                                                status={!props.cueId ? false : true}
                                                            />
                                                        </View>
                                                    })
                                            }
                                        </View>
                                        : (pastMeetings.length === 0 ?
                                            <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                    No past meetings.
                                                </Text>
                                            </View>
                                            :
                                            pastMeetings.map((date: any, index: any) => {
                                                return <View style={styles.col} key={index}>
                                                    <SubscriberCard
                                                        chat={!props.cueId}
                                                        fadeAnimation={props.fadeAnimation}
                                                        subscriber={{
                                                            displayName: (new Date(date.start)).toString() + ' to ' + (new Date(date.end)).toString(),
                                                            fullName: 'ended'
                                                        }}
                                                        onPress={() => {
                                                            // load attendances
                                                            loadAttendances(date.dateId)
                                                            setShowAttendances(true)
                                                        }}
                                                        status={!props.cueId ? false : true}
                                                    />
                                                </View>
                                            }))

                                }
                            </View> : null
                    }
                </View>
            </Animated.View>
        </ScrollView >
    );
}

export default Meeting;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
    text: {
        fontSize: 12,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10,
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 20,
        // flex: 1,
        backgroundColor: 'white'
    },
    timePicker: {
        width: 125,
        fontSize: 17,
        height: 45,
        color: '#202025',
        borderRadius: 10,
        marginLeft: 10
    },
});