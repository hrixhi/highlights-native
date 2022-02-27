// REACT
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import { getGrades, getGradesList, submitGrade } from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { View } from './Themed';
import GradesList from './GradesList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const Grades: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [loading, setLoading] = useState(true);
    const [cues, setCues] = useState<any[]>([]);
    const [scores, setScores] = useState<any[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const couldNotLoadSubscribersAlert = PreferredLanguageText('couldNotLoadSubscribers');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    // HOOKS

    /**
     * @description Loads Cues and User grades on Init
     */
    useEffect(() => {
        loadCuesAndScores();
    }, [props.channelId]);

    /**
     * @description Sets if user is owner
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                if (user._id.toString().trim() === props.channelCreatedBy) {
                    setIsOwner(true);
                }
            }
        })();
    }, [props.channelCreatedBy, props.channelId]);

    /**
     * @description Fetches all assignments and user grades for each
     */
    const loadCuesAndScores = useCallback(() => {
        setLoading(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getGrades,
                    variables: {
                        channelId: props.channelId
                    }
                })
                .then(res => {
                    if (res.data.channel && res.data.channel.getSubmissionCues) {
                        setCues(res.data.channel.getSubmissionCues);
                        server
                            .query({
                                query: getGradesList,
                                variables: {
                                    channelId: props.channelId
                                }
                            })
                            .then(async res2 => {
                                if (res2.data.channel.getGrades) {
                                    const u = await AsyncStorage.getItem('user');
                                    if (u) {
                                        const user = JSON.parse(u);
                                        if (
                                            user._id.toString().trim() === props.channelCreatedBy.toString().trim() ||
                                            res2.data.channel.getGrades.length === 0
                                        ) {
                                            // all scores
                                            setScores(res2.data.channel.getGrades);
                                        } else {
                                            // only user's score
                                            const score = res2.data.channel.getGrades.find((u: any) => {
                                                return u.userId.toString().trim() === user._id.toString().trim();
                                            });

                                            const { scores } = score;

                                            const updateScores = scores.map((x: any) => {
                                                const { cueId, gradeWeight, graded } = x;
                                                const findCue = res.data.channel.getSubmissionCues.find((u: any) => {
                                                    return u._id.toString() === cueId.toString();
                                                });

                                                const { releaseSubmission } = findCue;

                                                if (!releaseSubmission) {
                                                    return {
                                                        cueId,
                                                        gradeWeight,
                                                        graded: false,
                                                        score: ''
                                                    };
                                                } else {
                                                    return x;
                                                }
                                            });

                                            score.scores = updateScores;

                                            const singleScoreArray = [{ ...score }];
                                            setScores(singleScoreArray);
                                        }
                                    }
                                    setLoading(false);
                                }
                            })
                            .catch(err => {
                                console.log('Error', err);
                                Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                                setLoading(false);
                            });
                    } else {
                        setLoading(false);
                    }
                })
                .catch(err => {
                    console.log('Error', err);
                    Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [props.channelId, props.channelCreatedBy]);

    /**
     * @description Used to modify an assignment score directly
     */
     const modifyGrade = (cueId: string, userId: string, score: string) => {
        if (Number.isNaN(Number(score))) {
            Alert('Score should be a valid number');
            return;
        }

        let warning = ''

        if (Number(score) > 100) {
            warning = 'Warning- Assigned score is greater than 100'
        }

        Alert('Save grade?', warning, [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    return;
                }
            },
            {
                text: 'Yes',
                onPress: async () => {
                    handleSubmit()
                }
            }
        ]);

        function handleSubmit() {
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: submitGrade,
                    variables: {
                        cueId,
                        userId,
                        score
                    }
                })
                .then(res => {
                    if (res.data.cue.submitGrade) {
                        server
                            .query({
                                query: getGradesList,
                                variables: {
                                    channelId: props.channelId
                                }
                            })
                            .then(async res2 => {
                                if (res2.data.channel.getGrades) {
                                    const u = await AsyncStorage.getItem('user');
                                    if (u) {
                                        const user = JSON.parse(u);
                                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                                            // all scores
                                            setScores(res2.data.channel.getGrades);
                                        } else {
                                            // only user's score
                                            const score = res2.data.channel.getGrades.find((u: any) => {
                                                return u.userId.toString().trim() === user._id.toString().trim();
                                            });

                                            // if it is a quiz and not release submission then set Graded to false
                                            const { scores } = score;

                                            const updateScores = scores.map((x: any) => {
                                                const { cueId, gradeWeight, graded } = x;
                                                const findCue = res.data.channel.getSubmissionCues.find((u: any) => {
                                                    return u._id.toString() === cueId.toString();
                                                });

                                                const { releaseSubmission } = findCue;

                                                if (!releaseSubmission) {
                                                    return {
                                                        cueId,
                                                        gradeWeight,
                                                        graded: false,
                                                        score: ''
                                                    };
                                                } else {
                                                    return x;
                                                }
                                            });

                                            score.scores = updateScores;

                                            const singleScoreArray = [{ ...score }];
                                            setScores(singleScoreArray);
                                        }
                                    }
                                    setLoading(false);
                                }
                            })
                            .catch(err => {
                                console.log('Error', err);
                                Alert(couldNotLoadSubscribersAlert, checkConnectionAlert);
                                setLoading(false);
                            });
                    }
                })
                .catch(err => {
                    alert('Something went wrong. Try Again.');
                });
        }
    };

    // MAIN RETURN
    return (
        <View style={{ width: '100%', backgroundColor: '#fff' }}>
            {loading ? (
                <View
                    style={{
                        width: '100%',
                        flex: 1,
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#fff',
                        borderTopRightRadius: 0,
                        borderTopLeftRadius: 0,
                        paddingVertical: 100
                    }}>
                    {/* <ActivityIndicator color={'#1F1F1F'} /> */}
                </View>
            ) : (
                <GradesList
                    key={JSON.stringify(scores) + JSON.stringify(props.activeTab) + JSON.stringify(props.report)}
                    scores={scores}
                    cues={cues}
                    channelName={props.filterChoice}
                    isOwner={isOwner}
                    channelId={props.channelId}
                    closeModal={() => props.closeModal()}
                    reload={() => loadCuesAndScores()}
                    modifyGrade={modifyGrade}
                    openCueFromGrades={props.openCueFromGrades}
                    activeTab={props.activeTab}
                    channelColor={props.channelColor}
                    report={props.report}
                    attendance={props.attendance}
                    thread={props.thread}
                    date={props.date}
                />
            )}
        </View>
    );
};

export default Grades;
