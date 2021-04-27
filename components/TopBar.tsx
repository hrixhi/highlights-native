import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, ScrollView, Dimensions, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { getMeetingStatus, totalUnreadDiscussionThreads, totalUnreadMessages } from '../graphql/QueriesAndMutations';
import useColorScheme from '../hooks/useColorScheme';

const TopBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styles: any = styleObject(props.channelId)
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const colorScheme = useColorScheme();
    const [filterChoice] = useState(props.channelFilterChoice)
    const [channelCategories, setChannelCategories] = useState([])
    const [unreadDiscussionThreads, setUnreadDiscussionThreads] = useState(0)
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [meetingOn, setMeetingOn] = useState(false)
    const [hideExclaimation, setHideExclaimation] = useState(false)

    useEffect(() => {

        if (props.channelId !== '') {
            (
                async () => {
                    const u = await AsyncStorage.getItem('user')
                    if (u) {
                        const user = JSON.parse(u)
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

        const custom: any = {}
        const cat: any = []
        cues.map((cue) => {
            if (cue.customCategory && cue.customCategory !== '' && !custom[cue.customCategory]) {
                custom[cue.customCategory] = 'category'
            }
        })
        Object.keys(custom).map(key => {
            cat.push(key)
        })
        setChannelCategories(cat)
    }, [cues])

    useEffect(() => {
        const interval = setInterval(() => {
            setHideExclaimation(exclaim => !exclaim);
        }, 750);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <View style={styles.topbar} key={Math.random()}>
            <View style={{ width: '80%', height: Dimensions.get('window').height * 0.15 * 0.22, alignSelf: 'center' }} />
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15 * 0.78 }}>
                <View style={{
                    flexDirection: 'row',
                    display: 'flex'
                }}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: colorScheme === 'light' ? 'white' : '#202025' }}>
                        <Image
                            source={colorScheme === 'light' ?
                                (
                                    !hideExclaimation ? require('./default-images/cues-logo-black.jpg') : require('./default-images/cues-logo-black-exclamation-hidden.jpg')
                                )
                                :
                                (
                                    !hideExclaimation ? require('./default-images/cues-logo-white.jpg') : require('./default-images/cues-logo-white-exclamation-hidden.jpg')
                                )
                            }
                            style={{
                                width: Dimensions.get('window').height * 0.16 * 0.53456,
                                height: Dimensions.get('window').height * 0.16 * 0.2
                            }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                    <View
                        key={JSON.stringify(cues)}
                        style={{
                            flex: 1, flexDirection: 'row'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openMeeting()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='videocam-outline' size={21} color={'#a2a2aa'} />
                                        </Text>
                                        {
                                            meetingOn ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='mail-outline' size={21} color={'#a2a2aa'} />
                                        </Text>
                                        {
                                            unreadMessages !== 0 ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={19} color={'#a2a2aa'} />
                                        </Text>
                                        {
                                            unreadDiscussionThreads !== 0 ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openCalendar()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='calendar-outline' size={20} color={'#a2a2aa'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openGrades()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='stats-chart-outline' size={19} color={'#a2a2aa'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 5 }}
                                        onPress={() => props.deleteChannel()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='trash-outline' size={21} color={'#a2a2aa'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View> :
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openCalendar()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='calendar-outline' size={20} color={'#a2a2aa'} />
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => props.openWalkthrough()}
                                        style={{ marginRight: 5 }}
                                    >
                                        <Text style={styles.channelText}>
                                            <Ionicons name='help-circle-outline' size={21} color={'#a2a2aa'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                        }
                    </View>
                </View>
                <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{ width: '100%', height: '55%', paddingTop: 10 }}>
                    <ScrollView style={{
                        width: '98.5%',
                        paddingTop: 5
                    }} horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        <TouchableOpacity
                            style={filterChoice === 'All' ? styles.subOutline : styles.sub}
                            onPress={() => props.setChannelFilterChoice('All')}>
                            <Text
                                style={{ color: '#a2a2aa', lineHeight: 20 }}
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
                                        style={{ color: '#a2a2aa', lineHeight: 20 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}


export default React.memo(TopBar, (prev, next) => {
    return _.isEqual(prev.cues, next.cues) && _.isEqual(prev.channelFilterChoice, next.channelFilterChoice)
})

const styleObject: any = (channelId: any) => StyleSheet.create({
    topbar: {
        height: '15%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        paddingHorizontal: 20,
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        paddingTop: 25
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: -2,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    text: {
        textAlign: 'right',
        color: '#202025',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 10,
        borderColor: '#a2a2aa',
        borderWidth: 1
    },
    sub: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21
    }
});
