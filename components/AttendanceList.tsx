import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from './Themed';
import _ from 'lodash'
import moment from 'moment'
import { PreferredLanguageText } from '../helpers/LanguageContext';

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedPastMeetings: any[] = JSON.parse(JSON.stringify(props.pastMeetings))
    const unparsedChannelAttendances: any[] = JSON.parse(JSON.stringify(props.channelAttendances))
    const [pastMeetings] = useState<any[]>(unparsedPastMeetings)
    const [channelAttendances] = useState<any[]>(unparsedChannelAttendances)    

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingHorizontal: 20,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                <TouchableOpacity
                    key={Math.random()}
                    style={{
                        flex: 1,
                        backgroundColor: 'white'
                    }}
                    onPress={() => {
                        props.hideChannelAttendance()                  
                    }}>
                        <Text style={{
                            width: '100%',
                            fontSize: 16,
                            color: '#a2a2aa'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#202025'} style={{ marginRight: 10 }} /> {PreferredLanguageText('attendance')}
                        </Text>
                </TouchableOpacity>
            </View>
            {
                channelAttendances.length === 0 || pastMeetings.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                pastMeetings.length === 0  ? "No past meetings" : "No Students"
                                // PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={JSON.stringify(channelAttendances)}
                    >
                        <ScrollView
                            showsHorizontalScrollIndicator={false}
                            horizontal={true}
                            contentContainerStyle={{
                                height: '100%'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    height: '100%',
                                    backgroundColor: 'white',
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View style={{
                                    backgroundColor: 'white',
                                }}>
                                    <View style={styles.row} key={"-"}>
                                        <View style={styles.col} key={'0,0'} />
                                        {
                                            pastMeetings.map((meeting: any, col: number) => {
                                                const { title, start } = meeting
                                                return <View style={styles.col} key={col.toString()}>
                                                    <Text style={{ textAlign: 'center', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                        {title}
                                                    </Text>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
                                                        {moment(new Date(start)).format('MMMM Do YYYY, h:mm a')}
                                                    </Text>
                                                </View>
                                            })
                                        }

                                    </View>
                                    {
                                        channelAttendances.map((channelAttendance: any, row: number) => {

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                        {channelAttendance.fullName}
                                                    </Text>
                                                    <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025' }}>
                                                        {channelAttendance.displayName}
                                                    </Text>
                                                </View>
                                                {
                                                    pastMeetings.map((meeting: any, col: number) => {
                                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#a2a2aa' }}>
                                                                {
                                                                    attendanceObject ? "Present" : '-'
                                                                }
                                                            </Text>
                                                            {attendanceObject ? <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025' }}>
                                                                {PreferredLanguageText('joinedAt') + ' ' + moment(new Date(attendanceObject.joinedAt)).format('h:mm a')}
                                                            </Text> : null}
                                                            
                                                        </View>
                                                    })
                                                }
                                                
                                            </View>
                                        })
                                    }
                                </View>
                            </ScrollView>
                        </ScrollView>
                    </View>
            }
        </View >
    );
}

export default AttendanceList

const styles = StyleSheet.create({
    row: { height: 80, borderRadius: 15, marginBottom: 20, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#f4f4f6', },
    col: { width: 100, justifyContent: 'center', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f6', padding: 5 }
})