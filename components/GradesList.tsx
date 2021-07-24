import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';

import XLSX from "xlsx";
import {
    LineChart,
    PieChart
  } from "react-native-chart-kit";
// import RNFS from 'react-native-fs';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const unparsedSubmissionStatistics: any[] = JSON.parse(JSON.stringify(props.submissionStatistics))
    const [scores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues)
    const [submissionStatistics, setSubmissionStatistics] = useState<any[]>(unparsedSubmissionStatistics)
    const [exportAoa, setExportAoa] = useState<any[]>()

    useEffect(() => {

        const filterUnreleased = submissionStatistics.filter((stat: any) => {
            const { cueId } = stat;

            const findCue = cues.find((u: any) => {
                return u._id.toString() === cueId.toString();
            })

            const { cue, releaseSubmission } = findCue; 

            if (cue[0] === '{' && cue[cue.length - 1] === '}') {
                const parse = JSON.parse(cue);

                if (parse.quizId) {
                    if (!releaseSubmission) {
                        return false;
                    }
                }

            }

            return true

        })

        setSubmissionStatistics(filterUnreleased)

    }, [cues, props.submissionStatistics])

    
    // Statistics
    const [showStatistics, setShowStatistics] = useState(false);

    useEffect(() => {

        if (scores.length === 0 || cues.length === 0) {
            return;
        }
        
        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        cues.forEach(cue => {

            const { title } = htmlStringParser(cue.cue)

            row1.push(`${title} (${cue.gradeWeight}%)`)
        })

        row1.push("Total")

        exportAoa.push(row1);

        scores.forEach((score: any) => {

            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.graded) {
                    totalPoints += (Number(s.gradeWeight) * Number(s.score))
                    totalScore += Number(s.gradeWeight)
                }
            })

            let userRow = [];

            userRow.push(score.fullName)

            cues.forEach(cue => {

                const scoreObject = score.scores.find((s: any) => {
                    return s.cueId.toString().trim() === cue._id.toString().trim()
                })

                if (scoreObject && scoreObject.graded) {
                    userRow.push(scoreObject.score)
                } else {
                    userRow.push('-')
                }

            })

            const pointsToAdd = totalScore !== 0 ? (totalPoints / totalScore).toFixed(2) + "%" : '0'
            // Add Total here
            userRow.push(pointsToAdd)

            exportAoa.push(userRow)
        
        })

        setExportAoa(exportAoa)
       
    }, [scores, cues])

    const exportGrades = async () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Grades ");        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        
        const uri = FileSystem.cacheDirectory + 'grades.xlsx';
        await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
        });

        await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'MyWater data',
        UTI: 'com.microsoft.excel.xlsx'
        });

    }


    const renderGradeStatsTabs = () => {
        return (<View style={{ flexDirection: "row", backgroundColor: 'white', paddingBottom: 30 }}>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: 'white'
                }}
                onPress={() => {
                    setShowStatistics(false);
                }}>
                <Text style={!showStatistics ? styles.allGrayFill : styles.all}>
                    Scores 
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: 'white'
                }}
                onPress={() => {
                    setShowStatistics(true);
                }}>
                <Text style={showStatistics ? styles.allGrayFill : styles.all}>Statistics</Text>
            </TouchableOpacity>
    </View>)
    }

    const renderStatistics = () => {
        

        const mapCuesData: any = {};

        const mapCuesCounts: any = {};

        const mapCuesStatistics: any = {};


        cues.map((cue: any) => {

            const filteredStatistic = submissionStatistics.filter((stat: any) => stat.cueId === cue._id)

            if (filteredStatistic.length === 0) return;

            const { min, max, mean, median, std, submissionCount } = filteredStatistic[0];

            mapCuesStatistics[cue._id] = filteredStatistic[0]
            mapCuesData[cue._id] = [max, min, mean, median, std]
            mapCuesCounts[cue._id] = submissionCount

        })


        const statisticsLabels = ["Max", "Min", "Mean", "Median", "Std Dev"]


        const randomColor = () => ('#' + ((Math.random() * 0xffffff) << 0).toString(16) + '000000').slice(0, 7)

        // PIE CHART FOR GRADE WEIGHTS

        // ADD MORE COLORS HERE LATER
        const colors = ["#d91d56", "#ed7d22", "#f8d41f", "#b8d41f", "#53be6d", "#f95d6a", "#ff7c43", "#ffa600"]

        const nonZeroGradeWeight = cues.filter((cue: any) => cue.gradeWeight > 0)

        const pieChartData = nonZeroGradeWeight.map((cue: any, index: number) => {

            const { title } = htmlStringParser(cue.cue)

            let color = "";

            if (index < colors.length) {
                color = colors[index]
            } else {
                // Fallack
                color = randomColor()
            }

            return {
                gradeWeight: cue.gradeWeight,
                name: title,
                color,
                legendFontColor: "#7F7F7F",
                legendFontSize: 15,
                
            }
        })

        const chartConfig = {
            backgroundColor: '#000000',
            backgroundGradientFrom: '#1E2923',
            backgroundGradientTo: '#08130D',
            fontFamily: "inter",
            color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels:{
                fontFamily:'overpass; Arial',
            },
          }


        return (<View style={{
            width: '100%',
            backgroundColor: 'white',
            flex: 1,
            paddingLeft: Dimensions.get("window").width < 768 ? 0 : 50,
            paddingTop: 30
        }}
            key={JSON.stringify(scores)}
        >

            <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter', paddingBottom: 20, paddingLeft: 120}}>
                Grade Weightage 
            </Text> 
            <PieChart
            data={pieChartData}
            width={Dimensions.get('window').width - 50}
            height={200}
            chartConfig={chartConfig}
            accessor={"gradeWeight"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            // center={[10, 50]}
            hasLegend={true}
            />
            {/* {Object.keys(mapCuesData).map((cueId: any) => {
            
                // Get name of cue from id

                
                const filteredCue = cues.filter((cue: any) => cue._id === cueId); 

                const { title } = htmlStringParser(filteredCue[0].cue)

                const data = {
                    labels: statisticsLabels,
                    datasets: [
                      {
                        data: mapCuesData[cueId],
                        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
                        strokeWidth: 2 // optional
                      }
                    ],
                    // legend: ["Rainy Days"] // optional
                  };

                  const chartConfig = {
                    backgroundGradientFrom: '#Ffffff',
                    backgroundGradientTo: '#ffffff',
                    barPercentage: 1.3,
                    decimalPlaces: 0, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
                    propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#fff",
                    },
                    style: {
                      borderRadius: 16,
                      fontFamily: 'Bogle-Regular',
                    },
                    propsForBackgroundLines: {
                      strokeWidth: '0',
                      stroke: '#fff',
                      strokeDasharray: '0',
                    },
                    propsForLabels: {
                      fontFamily: 'Bogle-Regular',
                    },
                  };

                return (<View style={{ flexDirection: 'column', alignItems: 'center', paddingTop :30, width: Dimensions.get("window").width < 768 ? "100%" : 400}}>
                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter', paddingBottom: 20,}}>
                        {title}
                    </Text>

                    <View style={{ flexDirection: 'row',  paddingBottom: 20}}>
                    <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Max: {mapCuesStatistics[cueId].max}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Min: {mapCuesStatistics[cueId].min}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Mean: {mapCuesStatistics[cueId].mean}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Median: {mapCuesStatistics[cueId].median}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Std Dev: {mapCuesStatistics[cueId].std}%
                        </Text>
                    </View>
                    

                    <LineChart 
                        data={data}
                        width={Dimensions.get("window").width < 768 ? 300 : 400 }
                        height={300}
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
                </View>)
            })
        } */}
        </View>)
        
        


    }


    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingHorizontal: 25,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                <Text
                    ellipsizeMode="tail"
                    style={{
                        color: '#202025',
                        fontSize: 11,
                        paddingBottom: 20,
                        textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 23
                    }}>
                    {PreferredLanguageText('grades')}
                </Text>
                {(scores.length === 0 || cues.length === 0 || !props.isOwner) ?  null : <Text
                    style={{
                        color: "#a2a2aa",
                        fontSize: 11,
                        lineHeight: 25,
                        // paddingTop: 5,
                        textAlign: "right",
                        // paddingRight: 20,
                        textTransform: "uppercase"
                    }}
                    onPress={() => {
                        exportGrades()
                    }}>
                    EXPORT
                </Text>}
            </View>

            {renderGradeStatsTabs()}
            
            {
                scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                cues.length === 0 ? PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (!showStatistics ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={JSON.stringify(scores)}
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
                                    cues.map((cue: any, col: number) => {
                                        const { title } = htmlStringParser(cue.cue)
                                        return <View style={styles.col} key={col.toString()}>
                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#202025', fontFamily: 'inter' }}>
                                                {title}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#202025' }}>
                                                {cue.gradeWeight}%
                                            </Text>
                                        </View>
                                    })
                                }

                                {
                                    cues.length === 0 ? null :
                                        <View style={styles.col} key={'total'}>
                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#202025', fontFamily: 'inter' }}>
                                                {PreferredLanguageText('total')}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#202025' }}>
                                                100%
                                            </Text>
                                        </View>
                                }
                            </View>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    backgroundColor: 'white',
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View style={{
                                    backgroundColor: 'white',
                                }}>
                                    {
                                        scores.map((score: any, row: number) => {

                                            let totalPoints = 0;
                                            let totalScore = 0;
                                            score.scores.map((s: any) => {
                                                if (s.graded) {
                                                    totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                                    totalScore += Number(s.gradeWeight)
                                                }
                                            })

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 11, color: '#202025', fontFamily: 'inter' }}>
                                                        {score.fullName}
                                                    </Text>
                                                    {/* <Text style={{ textAlign: 'left', fontSize: 11, color: '#202025' }}>
                                                        {score.displayName}
                                                    </Text> */}
                                                </View>
                                                {
                                                    cues.map((cue: any, col: number) => {
                                                        const scoreObject = score.scores.find((s: any) => {
                                                            return s.cueId.toString().trim() === cue._id.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                                {
                                                                    scoreObject && scoreObject.graded ? scoreObject.score : '-'
                                                                }
                                                            </Text>
                                                        </View>
                                                    })
                                                }
                                                {
                                                    cues.length === 0 ? null :
                                                        <View style={styles.col} key={'total'}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                                                                {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2) : '0'}%
                                                            </Text>
                                                        </View>
                                                }
                                            </View>
                                        })
                                    }
                                </View>
                            </ScrollView>
                        </ScrollView>
                    </View> :  renderStatistics())
            }
        </View >
    );
}

export default React.memo(GradesList, (prev, next) => {
    return _.isEqual(prev.grades, next.grades)
})


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
})
