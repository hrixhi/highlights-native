import React, { useState, useEffect, useCallback } from 'react';
import { Animated, Dimensions, Switch, StyleSheet, Linking } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Jutsu } from 'react-jutsu'
import { fetchAPI } from '../graphql/FetchAPI';
// import Datetime from 'react-datetime';
import { createScheduledMeeting, editMeeting, getAttendances, getMeetingLink, getMeetingStatus, getPastDates, getUpcomingDates, markAttendance, getAttendancesForChannel } from '../graphql/QueriesAndMutations';
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import { ScrollView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import Alert from './Alert';
import moment from 'moment';
// import JitsiMeet, { JitsiMeetView } from 'react-native-jitsi-meet';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import AttendanceList from "./AttendanceList";

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [room] = useState(props.channelId)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [password] = useState(props.channelCreatedBy)
    const [isOwner, setIsOwner] = useState(false)
    const [meetingOn, setMeetingOn] = useState(false)
    const [start, setStart] = useState(new Date())
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60))

    const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
    const [pastMeetings, setPastMeetings] = useState<any[]>([])
    const [showAttendances, setShowAttendances] = useState(false)
    const [attendances, setAttendances] = useState<any[]>([])
    const [meetingLink, setMeetingLink] = useState('')
    const [channelAttendances, setChannelAttendances] = useState<any[]>([])
    const [viewChannelAttendance, setViewChannelAttendance] = useState(false)

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    const meetingMustBeFutureAlert = PreferredLanguageText('meetingMustBeFuture')
    const classroomNotInSession = PreferredLanguageText('classroomNotInSession')

    const [meetingEndText, setMeetingEndText] = useState(classroomNotInSession)

    useEffect(() => {
        if (end > start) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);

    }, [start, end])


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

    const loadChannelAttendances = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getAttendancesForChannel,
            variables: {
                channelId: props.channelId
            }
        }).then(async res => {
            if (res.data && res.data.attendance.getAttendancesForChannel) {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        // all attendances
                        setChannelAttendances(res.data.attendance.getAttendancesForChannel)
                    } else {
                        // only user's attendances
                        const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
                            return u.userId.toString().trim() === user._id.toString().trim()
                        })
                        const userAttendances = [{ ...attendances }]
                        setChannelAttendances(userAttendances)
                    }
                }
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
    }, [props.channelId])

    useEffect(() => {
        loadSchedule()
        loadChannelAttendances()
        setPastMeetings([])
        setShowAttendances(false)
        setIsOwner(false)
        loadPastSchedule()
        setViewChannelAttendance(false)
    }, [props.channelId])

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

                    server.query({
                        query: getMeetingLink,
                        variables: {
                            userId: user._id,
                            channelId: props.channelId
                        }
                    }).then(res => {
                        if (res && res.data.channel.getMeetingLink && res.data.channel.getMeetingLink !== 'error') {
                            setMeetingLink(res.data.channel.getMeetingLink)
                        }
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

        if (start < new Date()) {
            Alert(meetingMustBeFutureAlert);
            return;
        }

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

    const mainClassroomView = (<ScrollView style={{
        width: '100%',
        height: windowHeight,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20
    }}>
        {/* <Animated.View style={{
            width: '100%',
            backgroundColor: 'white',
            padding: 20,
            opacity: modalAnimation,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            alignSelf: 'center'
        }}> */}
        <Text style={{ width: '100%', textAlign: 'center', paddingTop: 5 }}>
            {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
        </Text>
        <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
            <Text
                ellipsizeMode="tail"
                style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
                {PreferredLanguageText('classroom')}
            </Text>
        </View>
        <View style={{ backgroundColor: 'white', flex: 1 }}>
            {
                isOwner ?
                    <View style={{ backgroundColor: '#fff' }}>
                        <View style={{ width: '100%', paddingTop: 20, backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                {PreferredLanguageText('initiateMeeting')}
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
            <TouchableOpacity
                onPress={async () => {
                    if (meetingOn) {
                        Linking.openURL(meetingLink);

                        // Mark attendance her
                        const u = await AsyncStorage.getItem('user')
                        if (u) {
                            const user = JSON.parse(u)

                            const server = fetchAPI('')
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
                        Alert(classroomNotInSession)
                    }
                }}
                style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row',
                    marginBottom: 20
                }}>
                <Text style={{
                    overflow: 'hidden',
                    textAlign: 'center',
                    lineHeight: 35,
                    color: meetingOn ? '#fff' : '#202025',
                    fontSize: 12,
                    backgroundColor: meetingOn ? '#3B64F8' : '#f4f4f6',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 35,
                    width: 200,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                }}>
                    {PreferredLanguageText('enterClassroom')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={async () => {
                    setViewChannelAttendance(true)
                }}
                style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row',
                    marginBottom: 100
                }}>
                <Text style={{
                    overflow: 'hidden',
                    textAlign: 'center',
                    lineHeight: 35,
                    color: '#202025',
                    fontSize: 12,
                    backgroundColor: '#f4f4f6',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 35,
                    width: 200,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                }}>
                    {PreferredLanguageText('viewAttendance')}
                </Text>
            </TouchableOpacity>
            {
                !isOwner ? <View style={{ borderColor: '#f4f4f6', borderTopWidth: 1, backgroundColor: '#fff' }}>
                    <Text
                        ellipsizeMode="tail"
                        style={{ color: '#a2a2aa', fontSize: 17, lineHeight: 25, marginVertical: 25 }}>
                        {PreferredLanguageText('upcoming')}
                    </Text>
                </View> : null
            }
            {
                isOwner ?
                    <View style={{
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        marginBottom: 40,
                        borderColor: '#f4f4f6', borderTopWidth: 1,
                        paddingTop: 25
                    }}>
                        <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '30%', backgroundColor: '#fff' }}>
                            <Text
                                ellipsizeMode="tail"
                                style={{ color: '#a2a2aa', fontSize: 17, lineHeight: 25, marginBottom: 25, marginTop: 10 }}>
                                {PreferredLanguageText('upcoming')}
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
                                {PreferredLanguageText('start')}
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
                                {PreferredLanguageText('end')}
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
                                disabled={isSubmitDisabled}
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
                            {PreferredLanguageText('noMeeting')}
                        </Text>
                    </View>
                    :
                    upcomingMeetings.map((date: any, index: any) => {
                        return <View style={styles.col} key={index}>
                            <SubscriberCard
                                hideChevron={true}
                                fadeAnimation={props.fadeAnimation}
                                subscriber={{
                                    displayName: moment(new Date(date.start)).format('MMMM Do YYYY, h:mm a') + ' to ' + moment(new Date(date.end)).format('MMMM Do YYYY, h:mm a'),
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
                                        {PreferredLanguageText('past')}
                                    </Text>}
                        </View>
                        {

                            showAttendances ?
                                <View style={{ backgroundColor: '#fff' }}>
                                    {
                                        attendances.length === 0 ?
                                            <View style={{ backgroundColor: 'white', flex: 1, }}>
                                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                    {PreferredLanguageText('noAttendances')}
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
                                                            fullName: PreferredLanguageText('joinedAt') + ' ' + moment(new Date(att.joinedAt)).format('MMMM Do YYYY, h:mm a')
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
                                            {PreferredLanguageText('noPastMeetings')}
                                        </Text>
                                    </View>
                                    :
                                    pastMeetings.map((date: any, index: any) => {
                                        return <View style={styles.col} key={index}>
                                            <SubscriberCard
                                                chat={!props.cueId}
                                                fadeAnimation={props.fadeAnimation}
                                                subscriber={{
                                                    displayName: moment(new Date(date.start)).format('MMMM Do YYYY, h:mm a') + ' to ' + moment(new Date(date.end)).format('MMMM Do YYYY, h:mm a'),
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
        {/* </Animated.View> */}
    </ScrollView >)

    const attendanceListView = (<AttendanceList
        key={JSON.stringify(channelAttendances)}
        channelAttendances={channelAttendances}
        pastMeetings={pastMeetings}
        channelName={props.filterChoice}
        channelId={props.channelId}
        closeModal={() => {
            Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            }).start(() => props.closeModal())
        }}
        hideChannelAttendance={() => {
            setViewChannelAttendance(false)
        }}
        reload={() => loadChannelAttendances()}
    />)

    return !viewChannelAttendance ? mainClassroomView : attendanceListView

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