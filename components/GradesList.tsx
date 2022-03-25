// REACT
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from "xlsx"

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from "../components/CustomTextInput"

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';


const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [scores, setScores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues.sort((a: any, b: any) => {
        return a.deadline < b.deadline ? -1 : 1
    }))
    const styles = stylesObject(props.isOwner)
    const [exportAoa, setExportAoa] = useState<any[]>()
    const [activeCueId, setActiveCueId] = useState("")
    const [activeUserId, setActiveUserId] = useState("")
    const [activeScore, setActiveScore] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [activeTab, setActiveTab] = useState('overview');

    // HOOKS 

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (studentSearch === "") {
            setScores(JSON.parse(JSON.stringify(props.scores)))
        } else {

            const allStudents = JSON.parse(JSON.stringify(props.scores))

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase())
            })

            setScores(matches);

        }
    }, [studentSearch])

    /**
     * @description Prepare export data for Grades
     */
    useEffect(() => {

        if (props.scores.length === 0 || cues.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        cues.forEach(cue => {

            const { title } = htmlStringParser(cue.cue)

            row1.push(`${title} (${cue.gradeWeight ? cue.gradeWeight.toString() : '0'}%)`)
        })

        row1.push("Total")

        exportAoa.push(row1);

        scores.forEach((score: any) => {

            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.releaseSubmission) {
                    if (!s.submittedAt || !s.graded) {
                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight)
                    } else {
                        totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight)
                    }
                   
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

            const pointsToAdd = totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/,'') + "%" : '0'

            // Add Total here
            userRow.push(pointsToAdd)

            exportAoa.push(userRow)

        })

        setExportAoa(exportAoa)


    }, [scores, cues])

    /**
     * @description Handles exporting of grades into Spreadsheet
     */
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

    /**
     * @description Handles modifying grade
     */
    const modifyGrade = () => {
        props.modifyGrade(activeCueId, activeUserId, activeScore);
        setActiveCueId('')
        setActiveUserId('')
        setActiveScore('')
    }

    useEffect(() => {
        exportGrades()
        props.setExportScores(false)
    }, [props.exportScores])

    /**
     * @description Renders export button
     */
    const renderExportButton = () => {
        return (<View style={{ flexDirection: "row", backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', width: '100%', backgroundColor: '#fff', marginBottom: 20 }}>
                {(scores.length === 0 || cues.length === 0 || !props.isOwner) ? null :
                    <TouchableOpacity
                        onPress={() => {
                            exportGrades()
                        }}
                        style={{
                            backgroundColor: '#fff',
                            overflow: 'hidden',
                            height: 35,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            marginRight: 10
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: '#006AFF',
                            fontSize: 12,
                            borderColor: '#006AFF',
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            borderWidth: 1,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            EXPORT
                        </Text>
                    </TouchableOpacity>
                }
            </View>
        </View>)
    }

    const renderTabs = () => {
        return (<View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingBottom: 15 }}>
            <TouchableOpacity
                style={activeTab === 'overview' ? styles.selectedButton : styles.unselectedButton}
                onPress={() => {
                    setActiveTab('overview')
                }}
            >
                <Text style={activeTab === 'overview' ? styles.selectedText : styles.unselectedText}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={activeTab !== 'overview' ? styles.selectedButton : styles.unselectedButton}
                onPress={() => {
                    setActiveTab('scores')
                }}
            >
                <Text style={activeTab !== 'overview' ? styles.selectedText : styles.unselectedText}>Assignments</Text>
            </TouchableOpacity>
        </View>)
    }

    const renderPerformanceOverview = () => {
        return <View style={{ display: 'flex', flexDirection: 'column', maxWidth: 300, width: Dimensions.get('window').width < 768 ? '100%' : '50%', alignSelf: 'center', paddingTop: 0, paddingBottom: 25 }}>
            <View style={{ flexDirection: 'row',  paddingTop: 20, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 10 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 17, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Meetings
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                        {props.attendance[props.channelId] ? props.attendance[props.channelId].length : 0} / {props.date[props.channelId] ? props.date[props.channelId].length : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 10 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 17, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Posts
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                        {props.thread[props.channelId] ? props.thread[props.channelId].length : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  marginTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 10 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 17, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Assessments
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].totalAssessments : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 25 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 14, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Late
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].lateAssessments : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 25 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 14, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Graded
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].gradedAssessments : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 25 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 14, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Submitted
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].submittedAssessments : 0}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 10 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 17, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Grade
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].score : 0}%
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row',  paddingTop: 10, paddingBottom: 20, backgroundColor: 'white', }}>
                <View style={{  backgroundColor: 'white', paddingLeft: 10 }}>
                    <Text style={{
                        flexDirection: 'row',
                        color: '#1F1F1F',
                        fontSize: 17, lineHeight: 25,
                        fontFamily: 'inter'
                    }} ellipsizeMode='tail'>
                        Progress
                    </Text>
                </View>
                <View style={{  backgroundColor: 'white', paddingLeft: 10, marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                        {props.report[props.channelId] ? props.report[props.channelId].total : 0}%
                    </Text>
                </View>
            </View>
        </View>
    }

    const renderScoresList = () => {
        return (<View style={{ 
            maxHeight: Dimensions.get('window').height - 300,
        }}>
        <ScrollView
            showsHorizontalScrollIndicator={props.isOwner ? true : false}
            horizontal={props.isOwner  ? true : false}
            showsVerticalScrollIndicator={props.isOwner ? false : true}
            contentContainerStyle={{
                flexDirection: props.isOwner  ? 'column' : 'row',
                alignItems: 'center'
            }}
            nestedScrollEnabled={true}
        >
            <View style={{ minHeight: 70, flexDirection: props.isOwner  ? 'row' : 'column', overflow: 'hidden',  borderBottomWidth: (!props.isOwner && Dimensions.get('window').width) || props.isOwner < 768 ? 1 : 0, borderBottomColor: '#f2f2f2' }} key={"-"}>
                {props.isOwner ? <View style={styles.col} key={'0,0'}>
                    <CustomTextInput
                        value={studentSearch}
                        onChangeText={(val: string) => setStudentSearch(val)}
                        placeholder={"Search"}
                        placeholderTextColor={'#1F1F1F'}
                    /> 
                </View> : null}
                {
                    cues.length === 0 ? null :
                        <View style={styles.col} key={'total'}>
                            <View style={{ height: 10, marginBottom: 5 }} />
                            <Text style={{ textAlign: 'center', fontSize: 14, color: '#000000', fontFamily: 'inter', marginBottom: 5,  }}>
                                {PreferredLanguageText('total')}
                            </Text>
                            {/* <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                100%
                            </Text> */}
                        </View>
                }
                {
                    cues.map((cue: any, col: number) => {
                        const { title } = htmlStringParser(cue.cue)
                        return <TouchableOpacity style={styles.col} key={col.toString()} onPress={() => props.openCueFromGrades(cue._id)}>
                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', marginBottom: 5 }}>
                                {
                                    (new Date(cue.deadline)).toString().split(' ')[1] +
                                    ' ' +
                                    (new Date(cue.deadline)).toString().split(' ')[2]
                                }
                            </Text>
                            <Text style={{ textAlign: 'center', fontSize: 14, color: '#000000', fontFamily: 'inter', marginBottom: 5, textAlignVertical: 'center' }} numberOfLines={2} ellipsizeMode="tail">
                                {title}
                            </Text>
                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000' }}>
                                {cue.gradeWeight ? cue.gradeWeight : '0'}%
                            </Text>
                        </TouchableOpacity>
                    })
                }
                
            </View>

            {/* Search results empty */}
            {
                scores.length === 0 ? <View>
                    <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 20, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter' }}>
                        No Students.
                    </Text>
                </View> : null
            }

            <ScrollView
                showsVerticalScrollIndicator={true}
                horizontal={false}
                contentContainerStyle={{
                    // height: '100%',
                    width: '100%'
                }}
                nestedScrollEnabled={ true}
            >
                <View>
                    {
                        scores.map((score: any, row: number) => {

                            let totalPoints = 0;
                            let totalScore = 0;
                            score.scores.map((s: any) => {
                                if (s.releaseSubmission) {
                                    if (!s.submittedAt || !s.graded) {
                                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                        totalScore += Number(s.gradeWeight)
                                    } else {
                                        totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                        totalScore += Number(s.gradeWeight)
                                    }
                                   
                                }
                            })

                            return <View style={styles.row} key={row}>
                                {props.isOwner ? <View style={styles.col} >
                                    <Text style={{ textAlign: 'center', fontSize: 14, color: '#000000', fontFamily: 'inter' }}>
                                        {score.fullName}
                                    </Text>
                                </View> : null}
                                {
                                    cues.length === 0 ? null :
                                        <View style={styles.col} key={'total'}>
                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#000000', textTransform: 'uppercase' }}>
                                                {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '') : '0'}%
                                            </Text>
                                        </View>
                                }
                                {
                                    cues.map((cue: any, col: number) => {

                                        const scoreObject = score.scores.find((s: any) => {
                                            return s.cueId.toString().trim() === cue._id.toString().trim()
                                        })

                                        if (scoreObject && activeCueId === scoreObject.cueId && activeUserId === score.userId) {
                                            return <View style={styles.col}>
                                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                    <TextInput
                                                        value={activeScore}
                                                        placeholder={' / 100'}
                                                        onChangeText={val => {
                                                            setActiveScore(val)
                                                        }}
                                                        style={{ width: '50%', marginRight: 5, padding: 8, borderBottomColor: "#f2f2f2", borderBottomWidth: 1, fontSize: 12 }}
                                                        placeholderTextColor={'#1F1F1F'}
                                                    />
                                                    <TouchableOpacity onPress={() => {
                                                        modifyGrade()
                                                    }}>
                                                        <Ionicons name='checkmark-circle-outline' size={17} style={{ marginRight: 5 }} color={'#8bc34a'} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => {
                                                        setActiveCueId('')
                                                        setActiveUserId('')
                                                        setActiveScore('')
                                                    }}>
                                                        <Ionicons name='close-circle-outline' size={17} color={'#f94144'} />
                                                    </TouchableOpacity>
                                                </View>

                                            </View>
                                        }

                                        return <TouchableOpacity disabled={!props.isOwner} style={styles.col} key={row.toString() + '-' + col.toString()} onPress={() => {

                                            if (!scoreObject) return;

                                            setActiveCueId(scoreObject.cueId);
                                            setActiveUserId(score.userId);
                                            setActiveScore(scoreObject.score);
                                        }}>
                                            {!scoreObject || !scoreObject.submittedAt ? <Text style={{ textAlign: 'center', fontSize: 13, color: '#f94144', }}>
                                                {scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score.replace(/\.0+$/, '') ? scoreObject.score : (!scoreObject || !scoreObject.cueId ? "N/A" : "Missing")}
                                            </Text>
                                                :
                                                <Text style={{ textAlign: 'center', fontSize: 13, color: scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? '#f3722c' : '#000000', }}>
                                                    {
                                                        scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score ? scoreObject.score.replace(/\.0+$/, '') : (scoreObject && (new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline))) ? "Late" : 'Submitted')
                                                    }
                                                </Text>}

                                            {
                                                scoreObject && scoreObject !== undefined && scoreObject.score && scoreObject.graded && ((new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) || !scoreObject.submittedAt)) ? <Text style={{ textAlign: 'center', fontSize: 13, color: !scoreObject.submittedAt ? '#f94144' : '#f3722c', marginTop: 5, borderWidth: 0, borderColor: !scoreObject.submittedAt ? '#f94144' : '#f3722c', borderRadius: 10, width: 60, alignSelf: 'center' }}>
                                                    {!scoreObject.submittedAt ? "(Missing)" : "(Late)"}
                                                </Text> : null
                                            }
                                        </TouchableOpacity>
                                    })
                                }
                                
                            </View>
                        })
                    }
                </View>
            </ScrollView>
        </ScrollView>
        </View>)
    }

    // MAIN RETURN
    return (
        <View style={{
            backgroundColor: '#fff',
            width: '100%',
            height: '100%',
            paddingTop: 10
        }}>
            {/* {renderExportButton()} */}
            {
                props.scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 18, paddingVertical: 40, paddingHorizontal: 20, fontFamily: 'inter' }}>
                            {
                                cues.length === 0 ? (props.isOwner ? PreferredLanguageText('noGraded') : PreferredLanguageText('noGradedStudents')) : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (props.activeTab === "scores" ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        zIndex: 5000000,
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        justifyContent: props.isOwner ? 'flex-start' : 'center',
                        overflow:  props.isOwner ? 'scroll' : 'visible',
                    }}
                        key={JSON.stringify(props.scores)}
                    >
                        {/* Performance report */}
                        {props.isOwner ? null : renderTabs()}

                        {props.isOwner || activeTab !== 'overview' ? null : renderPerformanceOverview()}

                        {props.isOwner || activeTab !== 'overview' ? renderScoresList() : null}
                    </View> : null
                	)
            }
        </View >
    );
}

export default GradesList


const stylesObject: any = (isOwner: any) => StyleSheet.create({
    row: { minHeight: 70, flexDirection: isOwner  ? 'row' : 'column',  borderBottomColor: '#f2f2f2', borderBottomWidth: (!isOwner && Dimensions.get('window').width < 768) || isOwner ? 1 : 0 },
    col: { height: isOwner  ? 'auto' : 90, paddingBottom: isOwner ? 0 : 10, width: isOwner  ? (Dimensions.get('window').width < 768 ? 120 : 120) : 180, justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, borderBottomColor: '#f2f2f2', borderBottomWidth: isOwner || (Dimensions.get('window').width < 768) ? 0 : 1,  },
    selectedText: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        backgroundColor: '#000',
        lineHeight: 24,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    unselectedText: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#000',
        height: 25,
        // backgroundColor: '#000',
        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    },
    selectedButton: {
        backgroundColor: '#000',
        borderRadius: 20,
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: 2,
    },
    unselectedButton: {
        // backgroundColor: '#000',
        height: 25,
        maxHeight: 25,
        lineHeight: 24,
        borderRadius: 20,
        color: '#000000',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: 2,
    },
})
