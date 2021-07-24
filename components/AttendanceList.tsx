import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from './Themed';
import _ from 'lodash'
import moment from 'moment'
import { PreferredLanguageText } from '../helpers/LanguageContext';
import DateTimePicker from "@react-native-community/datetimepicker";

import XLSX from "xlsx";
import {
    LineChart,
  } from "react-native-chart-kit";
// import RNFS from 'react-native-fs';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedPastMeetings: any[] = JSON.parse(JSON.stringify(props.pastMeetings))
    const unparsedChannelAttendances: any[] = JSON.parse(JSON.stringify(props.channelAttendances))
    const [pastMeetings, setPastMeetings] = useState<any[]>(unparsedPastMeetings)
    const [channelAttendances] = useState<any[]>(unparsedChannelAttendances)    

    const [enableFilter, setEnableFilter] = useState(false);
    const [end, setEnd] = useState(new Date());
    const [start, setStart] = useState(new Date(end.getTime() - (2630000 * 60 * 10)));

    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});

    const [showAttendanceStats, setShowAttendanceStats] = useState(false);

    const [exportAoa, setExportAoa] = useState<any[]>()

    // Time pickers IOS AND ANDROID

    const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
    const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);
  
    const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
    const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);
  

    useEffect(() => {

        if (channelAttendances.length === 0 || pastMeetings.length === 0) {
            return;
        }

        // Calculate total for each student and add it to the end
        const studentTotalMap: any = {};

        channelAttendances.forEach(att => {

            let count = 0
            pastMeetings.forEach(meeting => {

                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                })

                if (attendanceObject) count++;

            })

            studentTotalMap[att.userId] = count; 
        
        })

        // console.log(studentTotalMap)
        setAttendanceTotalMap(studentTotalMap)
        
        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        pastMeetings.forEach(meeting => {
            row1.push(moment(new Date(meeting.start)).format('MMMM Do YYYY, h:mm a'))
        })

        row1.push("Total")

        exportAoa.push(row1);

        channelAttendances.forEach(att => {

            let userRow = [];

            userRow.push(att.fullName)

            pastMeetings.forEach(meeting => {

                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                })

                if (attendanceObject) {
                    userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMMM Do YYYY, h:mm a')}`)
                } else {
                    userRow.push('-')
                }

            })

            userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`)

            exportAoa.push(userRow)
        
        })

        setExportAoa(exportAoa)

       
    }, [channelAttendances, pastMeetings])





     // Update past meetings to consider
     useEffect(() => {
        if (enableFilter) {

            const filteredPastMeetings = unparsedPastMeetings.filter(meeting => {
                return (new Date(meeting.start) > start && new Date(meeting.end) < end) 
            })

            setPastMeetings(filteredPastMeetings);
            
        } else {

            setPastMeetings(unparsedPastMeetings)
        }

    }, [enableFilter, start, end])

    const exportAttendance = async () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance ");
		    /* generate XLSX file and send to client */
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        
        const uri = FileSystem.cacheDirectory + 'attendance.xlsx';
        await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
        });

        await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'MyWater data',
        UTI: 'com.microsoft.excel.xlsx'
        });
    }


    // Filter Date time pickers

    const renderStartDateTimePicker = () => {
        return (
          <View style={{ backgroundColor: "#fff" }}>
            {Platform.OS === "ios" ? (
              <DateTimePicker
                style={styles.timePicker}
                value={start}
                mode={"date"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  const currentDate: any = selectedDate;
                  setStart(currentDate);
                }}
              />
            ) : null}
            {Platform.OS === "android" && showStartDateAndroid ? (
              <DateTimePicker
                style={styles.timePicker}
                value={start}
                mode={"date"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setShowStartDateAndroid(false);
                  setStart(currentDate);
                }}
              />
            ) : null}
            {Platform.OS === "android" ? (
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  marginTop: 12,
                  backgroundColor: "#fff",
                  marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    borderRadius: 15,
                    marginBottom: 10,
                    width: 150,
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                  onPress={() => {
                    setShowStartDateAndroid(true);
                    setShowStartTimeAndroid(false);
                    setShowEndDateAndroid(false);
                    setShowEndTimeAndroid(false);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "#202025",
                      overflow: "hidden",
                      fontSize: 10,
                      // backgroundColor: '#f4f4f6',
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      height: 35,
                      width: 150,
                      borderRadius: 15
                    }}
                  >
                    Set Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    borderRadius: 15,
                    width: 150,
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                  onPress={() => {
                    setShowStartDateAndroid(false);
                    setShowStartTimeAndroid(true);
                    setShowEndDateAndroid(false);
                    setShowEndTimeAndroid(false);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "#202025",
                      overflow: "hidden",
                      fontSize: 10,
                      // backgroundColor: '#f4f4f6',
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      height: 35,
                      width: 150,
                      borderRadius: 15
                    }}
                  >
                    Set Time
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={{ height: 10, backgroundColor: "white" }} />
            {Platform.OS === "ios" && (
              <DateTimePicker
                style={styles.timePicker}
                value={start}
                mode={"time"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setStart(currentDate);
                }}
              />
            )}
            {Platform.OS === "android" && showStartTimeAndroid && (
              <DateTimePicker
                style={styles.timePicker}
                value={start}
                mode={"time"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setShowStartTimeAndroid(false);
                  setStart(currentDate);
                }}
              />
            )}
          </View>
        );
      };
    
      const renderEndDateTimePicker = () => {
        return (
          <View style={{ backgroundColor: "#fff" }}>
            {Platform.OS === "ios" && (
              <DateTimePicker
                style={styles.timePicker}
                value={end}
                mode={"date"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setEnd(currentDate);
                }}
              />
            )}
            {Platform.OS === "android" && showEndDateAndroid ? (
              <DateTimePicker
                style={styles.timePicker}
                value={end}
                mode={"date"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setShowEndDateAndroid(false);
                  setEnd(currentDate);
                }}
              />
            ) : null}
            {Platform.OS === "android" ? (
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  marginTop: 12,
                  backgroundColor: "#fff",
                  marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    width: 150,
                    borderRadius: 15,
                    marginBottom: 10,
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                  onPress={() => {
                    setShowStartDateAndroid(false);
                    setShowStartTimeAndroid(false);
                    setShowEndDateAndroid(true);
                    setShowEndTimeAndroid(false);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "#202025",
                      overflow: "hidden",
                      fontSize: 10,
                      // backgroundColor: '#f4f4f6',
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      height: 35,
                      width: 150,
                      borderRadius: 15
                    }}
                  >
                    Set Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    borderRadius: 15,
                    width: 150,
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                  onPress={() => {
                    setShowStartDateAndroid(false);
                    setShowStartTimeAndroid(false);
                    setShowEndDateAndroid(false);
                    setShowEndTimeAndroid(true);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "#202025",
                      overflow: "hidden",
                      fontSize: 10,
                      // backgroundColor: '#f4f4f6',
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      height: 35,
                      width: 150,
                      borderRadius: 15
                    }}
                  >
                    Set Time
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
    
            <View style={{ height: 10, backgroundColor: "white" }} />
            {Platform.OS === "ios" && (
              <DateTimePicker
                style={styles.timePicker}
                value={end}
                mode={"time"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setEnd(currentDate);
                }}
              />
            )}
            {Platform.OS === "android" && showEndTimeAndroid && (
              <DateTimePicker
                style={styles.timePicker}
                value={end}
                mode={"time"}
                textColor={"#202025"}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  const currentDate: any = selectedDate;
                  setShowEndTimeAndroid(false);
                  setEnd(currentDate);
                }}
              />
            )}
          </View>
        );
      };
    

    const renderAttendanceStatsTabs = () => {
        return (<View style={{ flexDirection: "row", backgroundColor: 'white', }}>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowAttendanceStats(false);
                }}>
                <Text style={!showAttendanceStats ? styles.allGrayFill : styles.all}>
                    Students
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowAttendanceStats(true);
                }}>
                <Text style={showAttendanceStats ? styles.allGrayFill : styles.all}>Lectures</Text>
            </TouchableOpacity>
    </View>)
    }


    const renderAttendanceChart = () => {

        const studentCount = channelAttendances.length;

        const meetingLabels: any[] = [];

        const attendanceCounts:any[] = [];

        pastMeetings.map((meeting: any) => {

            const { start, dateId } = meeting

            meetingLabels.push(`${moment(new Date(start)).format('MMMM Do')}`)

            let count = 0;

            // Total count map
            channelAttendances.forEach((att: any) => {
                const filteredDateId = att.attendances.filter((x: any) => x.dateId === dateId)
                if (filteredDateId.length > 0) count++;
            })

            let percentage = (count/studentCount) * 100

            attendanceCounts.push(percentage)
            
        })

        const data = {
            labels: meetingLabels,
            datasets: [
              {
                data: attendanceCounts,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
                strokeWidth: 2 // optional
              }
            ],
            // legend: ["Rainy Days"] // optional
          };



        return (<View style={{
            width: '100%',
            backgroundColor: 'white',
            flex: 1
        }}
            key={JSON.stringify(pastMeetings)}
        >
            {/* <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter', paddingBottom: 20 }}>
                        Attendance By Lectures
            </Text> */}
            <ScrollView
                            showsHorizontalScrollIndicator={false}
                            horizontal={true}
                            contentContainerStyle={{
                                height: '100%'
                            }}
                            nestedScrollEnabled={true}
                        >
                    <LineChart 
                        data={data}
                        width={width}
                        height={500}
                        // chartConfig={chartConfig}
                        chartConfig={{
                            backgroundGradientFrom: "#fff",
                            backgroundGradientFromOpacity: 0,
                            backgroundGradientTo: "#fff",
                            backgroundGradientToOpacity: 0,
                            color: (opacity = 1) => `rgba(1, 122, 205, 1)`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
                            strokeWidth: 2, // optional, default 3
                            barPercentage: 0.5,
                            useShadowColorFromDataset: false, // optional
                            propsForBackgroundLines: {
                                strokeWidth: 1,
                                stroke: '#efefef',
                                strokeDasharray: '0',
                              },
                          }}
                    />
                </ScrollView>
        </View>)
    }

    const width = Dimensions.get("window").width;


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
                        backgroundColor: 'white',
                    }}
                    onPress={() => {
                        props.hideChannelAttendance()                  
                    }}>
                        <Text style={{
                            width: '100%',
                            fontSize: 16,
                            color: '#a2a2aa'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#202025'} style={{ marginRight: 20 }} /> 
                        </Text>
                </TouchableOpacity>
                
                {pastMeetings.length === 0 || channelAttendances.length === 0 ?  null : <Text
                    style={{
                        color: "#a2a2aa",
                        fontSize: 11,
                        lineHeight: 25,
                        // paddingTop: 5,
                        textAlign: "right",
                        // paddingRight: 20,
                        textTransform: "uppercase",
                        marginRight: 20
                    }}
                    onPress={() => {
                        setEnableFilter(!enableFilter)
                    }}>
                    {!enableFilter ? "FILTER" : "HIDE"}
                </Text>}
                {(pastMeetings.length === 0 || channelAttendances.length === 0 || !props.isOwner) ?  null : <Text
                    style={{
                        color: "#3b64f8",
                        fontSize: 11,
                        lineHeight: 25,
                        // paddingTop: 5,
                        textAlign: "right",
                        // paddingRight: 20,
                        textTransform: "uppercase"
                    }}
                    onPress={() => {
                        exportAttendance()
                    }}>
                    EXPORT
                </Text>}
            </View>

            {renderAttendanceStatsTabs()}
        

            {/* Filters Start and End */}
            {unparsedPastMeetings.length === 0 || channelAttendances.length === 0 ?  null : <View style={{ paddingTop: 30, backgroundColor: 'white' }}>

                <View style={{ display: 'flex', width: "100%", flexDirection: width < 768 ? "column" : "row", marginBottom: 30, backgroundColor: 'white' }} >


                        {!enableFilter ? null : <View
                            style={{
                                width: width < 768 ? "100%" : "30%",
                                flexDirection: "row",
                                marginTop: 12,
                                marginLeft: 0,
                                backgroundColor: 'white'
                            }}>
                                <Text style={styles.text}>{PreferredLanguageText("start")} Date</Text>

                            {renderStartDateTimePicker()}
                        </View>}
                        {!enableFilter ? null : <View
                            style={{
                                width: width < 768 ? "100%" : "30%",
                                flexDirection: "row",
                                marginTop: 12,
                                marginLeft: width < 768 ? 0 : 10,
                                backgroundColor: 'white'
                            }}>
                            <Text style={styles.text}>{PreferredLanguageText("end")} Date</Text>
                            {renderEndDateTimePicker()}
                        </View>}
                    </View>

            </View>}

            {
                channelAttendances.length === 0 || pastMeetings.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 21, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                pastMeetings.length === 0  ? "No past meetings" : "No Students"
                                // PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (!showAttendanceStats ? <View style={{
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
                                backgroundColor: 'white',
                                flexDirection: 'column'
                            }}
                            nestedScrollEnabled={true}
                        >

                            <View style={styles.row} key={"-"}>
                                <View style={styles.col} key={'0,0'} />
                                    {
                                        pastMeetings.map((meeting: any, col: number) => {
                                            const { title, start } = meeting
                                            return <View style={styles.col} key={col.toString()}>
                                                <Text style={{ textAlign: 'center', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                    {title}
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 11, color: '#202025' }}>
                                                    {moment(new Date(start)).format('MMMM Do YYYY, h:mm a')}
                                                </Text>
                                            </View>
                                        })
                                    }
                                </View>

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
                                    {
                                        channelAttendances.map((channelAttendance: any, row: number) => {

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                        {channelAttendance.fullName}
                                                    </Text>
                                                </View>
                                                {
                                                    pastMeetings.map((meeting: any, col: number) => {
                                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                                {
                                                                    attendanceObject ? "Present" : '-'
                                                                }
                                                            </Text>
                                                            {attendanceObject ? <Text style={{ textAlign: 'left', fontSize: 11, color: '#202025' }}>
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
                    </View> : renderAttendanceChart())
            }
        </View >
    );
}

export default AttendanceList

const styles = StyleSheet.create({
    row: { height: 70, borderRadius: 15, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#f4f4f6', },
    col: { width: 100, justifyContent: 'center', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f6', padding: 5 },
    allGrayFill: {
        fontSize: 11,
        overflow: "hidden",
        color: "#fff",
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#a2a2aa",
        lineHeight: 20
    },
    all: {
        fontSize: 11,
        color: "#a2a2aa",
        height: 22,
        overflow: "hidden",
        paddingHorizontal: 10,
        backgroundColor: "white",
        lineHeight: 20
    },
    text: {
        fontSize: 11,
        color: "#a2a2aa",
        textAlign: "left",
        paddingHorizontal: 10,
        width: 100
      },
      timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: "#202025",
        borderRadius: 10,
        marginLeft: 10
      },
})