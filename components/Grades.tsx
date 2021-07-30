import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView } from 'react-native';
import Alert from '../components/Alert'
import { View } from './Themed';
// import { } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getGrades, getGradesList, getSubmissionStatistics, submitGrade } from '../graphql/QueriesAndMutations';
import GradesList from './GradesList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const Grades: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [cues, setCues] = useState<any[]>([])
    const [scores, setScores] = useState<any[]>([])
    const [submissionStatistics, setSubmissionStatistics] = useState<any[]>([])
    const [isOwner, setIsOwner] = useState(false);

    const couldNotLoadSubscribersAlert = PreferredLanguageText('couldNotLoadSubscribers');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem("user");
            if (u) {
                const user = JSON.parse(u);
                if (user._id.toString().trim() === props.channelCreatedBy) {
                    setIsOwner(true);
                }
            }
        })();
    }, [props.channelCreatedBy, props.channelId]);

    const loadCuesAndScores = useCallback(() => {
        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getGrades,
                variables: {
                    channelId: props.channelId
                }
            })
                .then(res => {
                    if (res.data.channel && res.data.channel.getSubmissionCues) {
                        setCues(res.data.channel.getSubmissionCues)
                        server.query({
                            query: getGradesList,
                            variables: {
                                channelId: props.channelId
                            }
                        }).then(async (res2) => {
                            if (res2.data.channel.getGrades) {
                                const u = await AsyncStorage.getItem('user')
                                if (u) {
                                    const user = JSON.parse(u)
                                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                                        // all scores
                                        setScores(res2.data.channel.getGrades)
                                    } else {
                                        // only user's score
                                        const score = res2.data.channel.getGrades.find((u: any) => {
                                            return u.userId.toString().trim() === user._id.toString().trim()
                                        })

                                        // if it is a quiz and not release submission then set Graded to false
                                       
                                        const { scores } = score;

                                        const updateScores = scores.map((x: any) => {

                                            const { cueId, gradeWeight, graded, } = x;
                                            const findCue = res.data.channel.getSubmissionCues.find((u: any) => {
                                                return u._id.toString() === cueId.toString()
                                            });

                                            const { cue, releaseSubmission } = findCue;

                                            if (!releaseSubmission) {
                                                return {
                                                        cueId,
                                                        gradeWeight,
                                                        graded: false,
                                                        score: ""
                                                    }
                                            } else {
                                                return x
                                            }

                                        })

                                        score.scores = updateScores;

                                        const singleScoreArray = [{ ...score }]
                                        setScores(singleScoreArray)
                                    }

                                }
                                setLoading(false)
                                modalAnimation.setValue(0)
                                Animated.timing(modalAnimation, {
                                    toValue: 1,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start();
                            }
                        }).catch(err => {
                            Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                            setLoading(false)
                            modalAnimation.setValue(0)
                            Animated.timing(modalAnimation, {
                                toValue: 1,
                                duration: 150,
                                useNativeDriver: true
                            }).start();
                        })
                    } else {
                        setLoading(false)
                        modalAnimation.setValue(0)
                        Animated.timing(modalAnimation, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true
                        }).start();
                    }
                })
                .catch((err) => {
                    Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [props.channelId, modalAnimation, props.channelCreatedBy])

    const loadSubmissionStatistics = useCallback(() => {

        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getSubmissionStatistics,
                variables: {
                    channelId: props.channelId
                }
            }).then(res => {
                if (res.data.channel && res.data.channel.getSubmissionCuesStatistics) {
                    setSubmissionStatistics(res.data.channel.getSubmissionCuesStatistics)
                }
            })

        }

    }, [props.channelId, modalAnimation, props.channelCreatedBy])


    useEffect(() => {
        loadCuesAndScores()
        loadSubmissionStatistics()
    }, [props.channelId])

    const modifyGrade = (cueId: string, userId: string, score: string) => {
        if (Number.isNaN(Number(score))) {
            Alert('Score should be a valid number')
            return
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: submitGrade,
            variables: {
                cueId,
                userId,
                score,
            }
        }).then(res => {
            if (res.data.cue.submitGrade) {
                // Fetch scores again and statistics again

                server.query({
                    query: getGradesList,
                    variables: {
                        channelId: props.channelId
                    }
                }).then(async (res2) => {
                    if (res2.data.channel.getGrades) {
                        const u = await AsyncStorage.getItem('user')
                        if (u) {
                            const user = JSON.parse(u)
                            if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                                // all scores
                                setScores(res2.data.channel.getGrades)
                            } else {
                                // only user's score
                                const score = res2.data.channel.getGrades.find((u: any) => {
                                    return u.userId.toString().trim() === user._id.toString().trim()
                                })

                                // if it is a quiz and not release submission then set Graded to false
                               
                                    const { scores } = score;

                                    const updateScores = scores.map((x: any) => {

                                        const { cueId, gradeWeight, graded, } = x;
                                        const findCue = res.data.channel.getSubmissionCues.find((u: any) => {
                                            return u._id.toString() === cueId.toString()
                                        });

                                        const { cue, releaseSubmission } = findCue;

                                        if (!releaseSubmission) {
                                            return {
                                                    cueId,
                                                    gradeWeight,
                                                    graded: false,
                                                    score: ""
                                                }
                                        } else {
                                            return x
                                        }
                                    })

                                    score.scores = updateScores;

                                const singleScoreArray = [{ ...score }]
                                setScores(singleScoreArray)
                            }

                        }
                        setLoading(false)
                        modalAnimation.setValue(0)
                        Animated.timing(modalAnimation, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true
                        }).start();
                    }
                    loadSubmissionStatistics()
                }).catch(err => {
                    Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })

            }
        }).catch((err) => {
            alert('Something went wrong. Try Again.')
        })

    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;
    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: 'white',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={'on-drag'}
            overScrollMode={'always'}
            nestedScrollEnabled={true}
        >
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}>
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}>
                            <ActivityIndicator color={'#a2a2ac'} />
                        </View>
                        :
                        <GradesList
                            key={JSON.stringify(scores)}
                            scores={scores}
                            cues={cues}
                            channelName={props.filterChoice}
                            channelId={props.channelId}
                            isOwner={isOwner}
                            closeModal={() => {
                                Animated.timing(modalAnimation, {
                                    toValue: 0,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start(() => props.closeModal())
                            }}
                            reload={() => loadCuesAndScores()}
                            submissionStatistics={submissionStatistics}
                            modifyGrade={modifyGrade}
                        />
                }
            </Animated.View>
        </ScrollView>
    );
}

export default Grades