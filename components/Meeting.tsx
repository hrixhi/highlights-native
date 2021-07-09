import React, { useState, useEffect, useCallback } from 'react';
import { Animated, Dimensions, Switch, StyleSheet, Linking, Platform, Image } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Jutsu } from 'react-jutsu'
import { fetchAPI } from '../graphql/FetchAPI';
// import Datetime from 'react-datetime';
import { createScheduledMeeting, editMeeting, getAttendances, getMeetingLink, getMeetingStatus, getPastDates, getUpcomingDates, markAttendance, getAttendancesForChannel, deleteDateV1, deleteRecording, getRecordings } from '../graphql/QueriesAndMutations';
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
    const [name, setName] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [meetingOn, setMeetingOn] = useState(false)
    const [pastAttendances, setPastAttendances] = useState<any[]>([])
    const [pastMeetings, setPastMeetings] = useState<any[]>([])
    const [showAttendances, setShowAttendances] = useState(false)
    const [attendances, setAttendances] = useState<any[]>([])
    const [meetingLink, setMeetingLink] = useState('')
    const [reloadKey, setReloadKey] = useState(Math.random())

    const [channelAttendances, setChannelAttendances] = useState<any[]>([])
    const [viewChannelAttendance, setViewChannelAttendance] = useState(false)
    const classroomNotInSession = PreferredLanguageText('classroomNotInSession')
    const [showPastMeetings, setShowPastMeetings] = useState(false);

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

    useEffect(() => {
        const server = fetchAPI('')
        server.query({
            query: getRecordings,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data && res.data.channel.getRecordings) {
                setPastMeetings(res.data.channel.getRecordings)
            }
        })
    }, [props.channelId, meetingOn, reloadKey])

    useEffect(() => {
        loadChannelAttendances()
        setPastMeetings([])
        setShowAttendances(false)
        setIsOwner(false)
        loadPastSchedule()
        setViewChannelAttendance(false)
    }, [props.channelId])

    const loadPastSchedule = useCallback(() => {
        const server = fetchAPI("");
        server
            .query({
                query: getPastDates,
                variables: {
                    channelId: props.channelId
                }
            })
            .then(res => {
                if (res.data && res.data.attendance.getPastDates) {
                    setPastAttendances(res.data.attendance.getPastDates);
                }
            });
    }, [props.channelId]);

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

    const renderPastMeetings = () => {
        return (pastMeetings.length === 0 ?
            <View style={{ backgroundColor: 'white', flex: 1 }}>
                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                    {PreferredLanguageText('noPastMeetings')}
                </Text>
            </View>
            :
            pastMeetings.map((date: any, index: any) => {
                return <View style={styles.col} key={index}>
                    <View
                        style={styles.swiper}
                    >
                        <View
                            key={'textPage'}
                            style={styles.card}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (Platform.OS == 'web') {
                                        window.open(date.url, '_blank');
                                    } else {
                                        Linking.openURL(date.url)
                                    }
                                }}
                                style={{ flexDirection: 'row', backgroundColor: '#f4f4f6', width: '90%' }}>
                                <Image
                                    height={45}
                                    width={75}
                                    style={{ height: 45, width: 75, borderRadius: 5 }}
                                    source={{ uri: date.thumbnail }}
                                    resizeMode={'contain'}
                                />
                                <View style={{ backgroundColor: '#f4f4f6', width: '100%', flexDirection: 'row', display: 'flex', marginLeft: 20 }}>
                                    <Text ellipsizeMode={'tail'}
                                        numberOfLines={1}
                                        style={styles.title}>
                                        {moment(new Date(date.startTime)).format('MMMM Do YYYY, h:mm a')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {
                                isOwner ?
                                    <TouchableOpacity style={{ backgroundColor: '#f4f4f6', width: '10%' }}
                                        onPress={() => {
                                            Alert("Delete past lecture ?", "", [
                                                {
                                                    text: "Cancel",
                                                    style: "cancel",
                                                    onPress: () => {
                                                        return;
                                                    }
                                                },
                                                {
                                                    text: "Delete",
                                                    onPress: async () => {
                                                        const server = fetchAPI("");
                                                        server
                                                            .mutate({
                                                                mutation: deleteRecording,
                                                                variables: {
                                                                    recordID: date.recordID
                                                                }
                                                            })
                                                            .then(res => {
                                                                if (res.data && res.data.channel.deleteRecording) {
                                                                    Alert("Recording Deleted!");
                                                                    setReloadKey(Math.random())
                                                                }
                                                            });
                                                    }
                                                }
                                            ]);
                                        }}
                                    >
                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 16, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                            <Ionicons name='trash-outline' size={17} color='#d91d56' />
                                        </Text>
                                    </TouchableOpacity>
                                    : null
                            }
                        </View>
                    </View>
                </View>
            }))
    }

    const mainClassroomView = (<ScrollView style={{
        width: '100%',
        // height: windowHeight,
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: 20,
    }}>
        <Text style={{ width: '100%', textAlign: 'center', paddingTop: 5 }}>
            {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
        </Text>
        <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
            <Text
                ellipsizeMode="tail"
                style={{
                    color: '#202025',
                    fontSize: 11,
                    // paddingBottom: 20,
                    textTransform: "uppercase",
                    // paddingLeft: 10,
                    flex: 1,
                    lineHeight: 25
                }}
            >
                {PreferredLanguageText('classroom')}
            </Text>
        </View>
        <View style={{ backgroundColor: 'white', flex: 1, marginBottom: 50 }}>
            {
                isOwner ?
                    <View style={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <View style={{ width: '100%', backgroundColor: 'white', flex: 1, justifyContent: 'flex-start', flexDirection: 'row' }}>
                            <Text style={{ fontSize: 15, color: '#a2a2aa' }}>
                                {PreferredLanguageText('initiateMeeting')}
                            </Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start', backgroundColor: 'white' }}>
                            <Switch
                                value={meetingOn}
                                onValueChange={() => updateMeetingStatus()}
                                style={{ height: 30, marginTop: 10 }}
                                trackColor={{
                                    false: '#f4f4f6',
                                    true: '#3B64F8'
                                }}
                                thumbColor='white'
                            />
                        </View>
                    </View> : null
            }
            {
                isOwner ?
                    <Text style={{ fontSize: 12, color: '#a2a2aa', paddingTop: 10 }}>
                        Restart switch if you are unable to join.
                    </Text> : null
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
                    width: '100%', justifyContent: 'flex-start', flexDirection: 'row',
                    marginBottom: 20,
                    marginTop: 30
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
            <Text style={{ fontSize: 12, color: '#a2a2aa', marginBottom: 10 }}>
                Enabled only when classroom in session.
            </Text>
            <TouchableOpacity
                onPress={async () => {
                    setViewChannelAttendance(true)
                }}
                style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 30,
                    width: '100%', justifyContent: 'flex-start', flexDirection: 'row',
                    marginBottom: 20
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
                    // width: 200,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                }}>
                    {PreferredLanguageText('viewAttendance')}
                </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#a2a2aa', marginBottom: 20 }}>
                Attendances will only be captured for scheduled lectures.
            </Text>


            {

                <View style={{ borderTopColor: '#f4f4f6', borderTopWidth: 1, marginTop: 25, backgroundColor: 'white' }}>
                    <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25, backgroundColor: 'white' }}>
                        {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowPastMeetings(!showPastMeetings)}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            // paddingTop: 10,
                            paddingBottom: 40,
                            backgroundColor: 'white'
                        }}>
                        <Text style={{
                            lineHeight: 23,
                            marginRight: 10,
                            color: '#a2a2aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            backgroundColor: 'white'
                        }}>
                            RECORDINGS
                        </Text>
                        <Text style={{ lineHeight: 21 }}>
                            <Ionicons size={14} name={showPastMeetings ? 'caret-down-outline' : 'caret-forward-outline'} color='#a2a2aa' />
                        </Text>
                    </TouchableOpacity>
                    {

                        showAttendances ?
                            <View>
                                {
                                    attendances.length === 0 ?
                                        <View style={{ backgroundColor: 'white', flex: 1 }}>
                                            <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
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
                            : (showPastMeetings ? renderPastMeetings() : null)
                    }
                </View>
            }
        </View>
    </ScrollView >)

    const attendanceListView = (<AttendanceList
        key={JSON.stringify(channelAttendances)}
        channelAttendances={channelAttendances}
        pastMeetings={pastAttendances}
        channelName={props.filterChoice}
        isOwner={isOwner}
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
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        paddingBottom: Platform.OS === "android" ? 50 : 0
    },
    text: {
        fontSize: 12,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10,
    },
    col: {
        width: '100%',
        height: 70,
        marginBottom: 15,
        // flex: 1,
        backgroundColor: 'white'
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: '#202025',
        borderRadius: 10,
        marginLeft: 10
    },
    swiper: {
        height: 70,
        width: 350,
        maxWidth: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'white'
    },
    card: {
        height: '100%',
        width: 350,
        maxWidth: '100%',
        flexDirection: 'row',
        borderRadius: 15,
        padding: 13,
        backgroundColor: '#f4f4f6',
    },
    meetingText: {
        display: 'flex',
        flexDirection: 'column',
        // flex: 1,
        backgroundColor: '#f4f4f6',
        color: '#202025'
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        paddingTop: 5,
        color: '#202025',
        flex: 1
    },
    description: {
        fontSize: 13,
        color: '#a2a2aa',
        // height: '30%',
    },

});