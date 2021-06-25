import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Text } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [scores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues)

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
                <Text
                    ellipsizeMode="tail"
                    style={{ color: '#a2a2aa', fontSize: 16, flex: 1, lineHeight: 25 }}>
                    {PreferredLanguageText('grades')}
                </Text>
            </View>
            {
                scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                cues.length === 0  ? PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    <View style={{
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
                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025', fontFamily: 'inter' }}>
                                                {title}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
                                                {cue.gradeWeight}%
                                                    </Text>
                                        </View>
                                    })
                                }
                                {
                                    cues.length === 0 ? null :
                                        <View style={styles.col} key={'total'}>
                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025', fontFamily: 'inter' }}>
                                                {PreferredLanguageText('total')}
                                                    </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
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
                                                    <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025', fontFamily: 'inter' }}>
                                                        {score.fullName}
                                                    </Text>
                                                    <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025' }}>
                                                        {score.displayName}
                                                    </Text>
                                                </View>
                                                {
                                                    cues.map((cue: any, col: number) => {
                                                        const scoreObject = score.scores.find((s: any) => {
                                                            return s.cueId.toString().trim() === cue._id.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#a2a2aa' }}>
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
                                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#a2a2aa' }}>
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
                    </View>
            }
        </View >
    );
}

export default React.memo(GradesList, (prev, next) => {
    return _.isEqual(prev.grades, next.grades)
})


const styles = StyleSheet.create({
    row: { height: 80, borderRadius: 15, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#f4f4f6', },
    col: { width: 100, justifyContent: 'center', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f6', padding: 5 }
})
