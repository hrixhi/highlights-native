// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    Dimensions,
    Image,
    ActivityIndicator,
    TextInput as DefaultTextInput,
} from 'react-native';
import _ from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import moment from 'moment';

// API
import {
    submitGrade,
    getQuiz,
    gradeQuiz,
    editReleaseSubmission,
    updateAnnotation,
    modifyActiveAttemptQuiz,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import Alert from './Alert';
import { Video } from 'expo-av';
import alert from './Alert';
import QuizGrading from './QuizGrading';
import { WebView } from 'react-native-webview';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { downloadFileToDevice } from '../helpers/DownloadFile';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';
import { renderLoadingSpinner, renderWebviewError } from './LoadingSpinnersWebview';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user } = useAppContext();

    const [filterChoice, setFilterChoice] = useState('All');
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers));
    const [subscribers] = useState<any[]>(unparsedSubs.reverse());
    const categories = ['All', 'Delivered', 'Read'];
    const [showSubmission, setShowSubmission] = useState(false);
    const [submission, setSubmission] = useState<any>('');
    const [pointsScored, setPointsScored] = useState('');

    const [graded, setGraded] = useState(false);
    const [userId, setUserId] = useState('');
    const submissionViewerRef: any = useRef();
    const [comment, setComment] = useState('');
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [initiatedAt, setInitiatedAt] = useState<any>({});
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [releaseSubmission, setReleaseSubmission] = useState(false);
    const [isGraded, setIsGraded] = useState(false);
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [activeQuizAttempt, setActiveQuizAttempt] = useState(0);
    const [currentQuizAttempt, setCurrentQuizAttempt] = useState(0);
    const [problems, setProblems] = useState<any[]>([]);
    const [submittedAt, setSubmittedAt] = useState('');
    const [totalPoints, setTotalPoints] = useState('');
    const [deadline, setDeadline] = useState('');
    const [headers, setHeaders] = useState({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [showQuizGrading, setShowQuizGrading] = useState(false);
    const [feedbackPdfviewerURL, setFeedbackPdfviewerURL] = useState('');
    const videoRef: any = useRef();
    const [downloadFeedbackInProgress, setDownloadFeedbackInProgress] = useState(false);

    const server = useApolloClient();

    if (props.cue && props.cue.submission) {
        categories.push('Submitted');
        categories.push('Graded');
    }

    let filteredSubscribers: any = [];
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers;
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'read';
            });
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'not-delivered' || item.fullName === 'delivered';
            });
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'graded';
            });
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'submitted';
            });
            break;
        default:
            filteredSubscribers = subscribers;
            break;
    }
    const windowHeight =
        Dimensions.get('window').width < 1024 ? Dimensions.get('window').height : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers);
    let options = filteredSubscribers.map((sub: any) => {
        return {
            value: sub._id,
            text: sub.displayName,
            group: sub.displayName[0],
        };
    });
    options = options.sort((a: any, b: any) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
    });

    // HOOKS

    useEffect(() => {
        if (props.exportQuizScores) {
            exportScores();
            props.setExportQuizScores(false);
        }
    }, [props.exportQuizScores]);

    /**
     * @description prepares export data for Assignment grades
     */
    useEffect(() => {
        if (problems.length === 0 || subscribers.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with Overall, problem Score, problem Comments,
        let row1 = [''];

        // Add Graded
        row1.push('Status');

        // Add total
        row1.push('Total score');

        problems.forEach((prob: any, index: number) => {
            row1.push(`Question ${index + 1}: ${prob.points} points`);
            row1.push('Score + Remark');
        });

        row1.push('Submission Date');

        row1.push('Feedback');

        exportAoa.push(row1);

        // Row 2 should be correct answers
        const row2 = ['', '', ''];

        problems.forEach((prob: any, i: number) => {
            const { questionType, required, options = [] } = prob;
            let type = questionType === '' ? 'MCQ' : questionType === 'trueFalse' ? 'True/False' : 'Free Response';

            let require = required ? 'Required' : 'Optional';

            let answer = '';

            if (questionType === '') {
                answer += 'Ans: ';
                options.forEach((opt: any, index: number) => {
                    if (opt.isCorrect) {
                        answer += index + 1 + ', ';
                    }
                });
            }

            row2.push(`${type} ${answer}`);
            row2.push(`(${require})`);
        });

        exportAoa.push(row2);

        // Subscribers
        subscribers.forEach((sub: any) => {
            const subscriberRow: any[] = [];

            const { displayName, submission, submittedAt, comment, graded, score } = sub;

            subscriberRow.push(displayName);
            subscriberRow.push(graded ? 'Graded' : submittedAt !== null ? 'Submitted' : 'Not Submitted');

            if (!graded && !submittedAt) {
                exportAoa.push(subscriberRow);
                return;
            }

            subscriberRow.push(`${score}`);

            const obj = JSON.parse(submission);

            const { attempts } = obj;

            if (attempts.length === 0) return;

            let activeAttempt: any = {};

            attempts.map((attempt: any) => {
                if (attempt.isActive) {
                    activeAttempt = attempt;
                }
            });

            if (!activeAttempt) {
                return;
            }

            const { solutions = [], problemScores, problemComments } = activeAttempt;

            solutions.forEach((sol: any, i: number) => {
                let response = '';
                if ('selected' in sol) {
                    const options = sol['selected'];

                    options.forEach((opt: any, index: number) => {
                        if (opt.isSelected) response += index + 1 + ' ';
                    });
                }

                subscriberRow.push(response);

                if (problemScores && problemScores[i] !== '') {
                    subscriberRow.push(
                        `${problemScores[i]} ${
                            problemComments && problemComments[i] !== '' ? '- Remark:' + problemComments[i] : ''
                        }`
                    );
                } else {
                    subscriberRow.push('Score not assigned');
                }
            });

            subscriberRow.push(moment(new Date(Number(submittedAt))).format('MMMM Do YYYY, h:mm a'));

            subscriberRow.push(comment);

            exportAoa.push(subscriberRow);
        });

        setExportAoa(exportAoa);
    }, [problems, subscribers]);

    /**
     * @description Set if submission released from props
     */
    useEffect(() => {
        if (!props.cue) {
            return;
        }
        if (props.cue.releaseSubmission !== null && props.cue.releaseSubmission !== undefined) {
            setReleaseSubmission(props.cue.releaseSubmission);
        } else {
            setReleaseSubmission(false);
        }

        if (props.cue.gradeWeight && props.cue.gradeWeight > 0) {
            setIsGraded(true);
        } else {
            setIsGraded(false);
        }
    }, [props.cue]);

    /**
     * @description Sets whether submission is a quiz and if submission is imported
     */
    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission);
            if (obj.url !== undefined && obj.title !== undefined && obj.type !== undefined) {
                setImported(true);
                setUrl(obj.url);
                setType(obj.type);
                setTitle(obj.title);
            } else if (obj.attempts !== undefined && !props.isQuiz) {
                // Check if submission draft contains imported document
                obj.attempts.map((attempt: any, index: number) => {
                    if (attempt.isActive) {
                        setImported(true);
                        setUrl(attempt.url);
                        setType(attempt.type);
                        setTitle(attempt.title);
                    }
                });

                setSubmissionAttempts(obj.attempts);
            } else if (obj.attempts !== undefined && props.isQuiz) {
                setQuizAttempts(obj.attempts);

                // Set solutions to the active quiz attempt
                obj.attempts.map((attempt: any, index: number) => {
                    if (attempt.isActive) {
                        setActiveQuizAttempt(index);
                        setCurrentQuizAttempt(index);
                        setQuizSolutions(attempt);
                        setInitiatedAt(attempt.initiatedAt);
                        setSubmittedAt(attempt.submittedAt);
                        setGraded(attempt.isFullyGraded);
                        setShowQuizGrading(true);
                    }
                });
            }

            if (obj.initiatedAt) {
                setInitiatedAt(obj.initiatedAt);
            }
        } else {
            setImported(false);
            setUrl('');
            setType('');
            setTitle('');
        }
    }, [submission]);

    console.log('pdfViewerURL', feedbackPdfviewerURL);

    /**
     * @description Setup PDFTRON Webviewer with Submission
     */
    useEffect(() => {
        if (submissionAttempts && submissionAttempts.length > 0) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];
            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;
            const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${encodeURIComponent(url)}&cueId=${
                props.cue._id
            }&userId=${userId}&source=FEEDBACK&name=${encodeURIComponent(
                user.fullName
            )}&feedbackUser=${encodeURIComponent(user._id)}`;
            setFeedbackPdfviewerURL(pdfViewerURL);
        }

        // if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
        //     const attempt = submissionAttempts[submissionAttempts.length - 1];

        //     let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

        //     if (!url) {
        //         return;
        //     }

        //     WebViewer(
        //         {
        //             licenseKey: 'xswED5JutJBccg0DZhBM',
        //             initialDoc: url
        //         },
        //         submissionViewerRef.current
        //     ).then(async instance => {
        //         const { documentViewer, annotationManager } = instance.Core;

        //         const u = await AsyncStorage.getItem('user');
        //         if (u) {
        //             const user = JSON.parse(u);
        //             annotationManager.setCurrentUser(user.fullName);
        //         }

        //         documentViewer.addEventListener('documentLoaded', () => {
        //             // perform document operations

        //             const currAttempt = submissionAttempts[submissionAttempts.length - 1];

        //             const xfdfString = currAttempt.annotations;

        //             if (xfdfString !== '') {
        //                 annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
        //                     annotations.forEach((annotation: any) => {
        //                         annotationManager.redrawAnnotation(annotation);
        //                     });
        //                 });
        //             }
        //         });

        //         annotationManager.addEventListener(
        //             'annotationChanged',
        //             async (annotations: any, action: any, { imported }) => {
        //                 // If the event is triggered by importing then it can be ignored
        //                 // This will happen when importing the initial annotations
        //                 // from the server or individual changes from other users
        //                 if (imported) return;

        //                 const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

        //                 const currAttempt = submissionAttempts[submissionAttempts.length - 1];

        //                 currAttempt.annotations = xfdfString;

        //                 const allAttempts = [...submissionAttempts];

        //                 allAttempts[allAttempts.length - 1] = currAttempt;

        //                 await handleAnnotationsUpdate(allAttempts);
        //             }
        //         );
        //     });
        // }
    }, [
        submissionAttempts,
        submissionViewerRef,
        submissionViewerRef.current,
        viewSubmissionTab,
        props.cue,
        user,
        userId,
    ]);

    /**
     * @description if submission is a quiz then fetch Quiz
     */
    useEffect(() => {
        if (props.isQuiz) {
            const obj = JSON.parse(props.cue.original);

            setLoading(true);

            if (obj.quizId) {
                server
                    .query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.quiz.getQuiz) {
                            setProblems(res.data.quiz.getQuiz.problems);
                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {});
                            setLoading(false);
                        }
                    });
            }
        }
    }, [props.isQuiz]);

    /**
     * @description If assingment has upload Url then setup Webviewer (not used since tabs are disabled rn)
     */
    // useEffect(() => {
    //     if (url === '' || !url) {
    //         return;
    //     }
    //     console.log(url);
    //     WebViewer(
    //         {
    //             licenseKey: 'xswED5JutJBccg0DZhBM',
    //             initialDoc: url
    //         },
    //         RichText.current
    //     ).then(instance => {
    //         const { documentViewer } = instance.Core;
    //         // you can now call WebViewer APIs here...
    //         documentViewer.addEventListener('documentLoaded', () => {
    //             // perform document operations
    //         });
    //     });
    // }, [url, RichText, imported, type, submissionAttempts, viewSubmissionTab]);

    /**
     * @description Called when instructor saves grade
     */
    const handleGradeSubmit = useCallback(() => {
        if (pointsScored === '') {
            Alert('Enter a valid score for grading this assingment.');
            return;
        }

        if (Number.isNaN(Number(pointsScored))) {
            Alert('Points entered must be a valid number');
            return;
        }

        if (Number(pointsScored) > Number(totalPoints)) {
            Alert('Warning- Points assigned are greater than the total points.');
        }

        const availableUntil =
            props.cue && props.cue.availableUntil && props.cue.availableUntil !== ''
                ? new Date(props.cue.availableUntil)
                : null;

        const deadline =
            props.cue && props.cue.deadline && props.cue.deadline !== '' ? new Date(props.cue.deadline) : null;

        let warning = '';

        if (deadline && new Date() < deadline) {
            warning = 'Deadline has not passed. Students can still re-submit and may override current grading.';
        } else if (availableUntil && new Date() < availableUntil) {
            warning =
                'Late submission deadline has not passed. Students will be unable to submit after releasing scores.';
        }

        Alert('Save grade?', warning, [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    return;
                },
            },
            {
                text: 'Yes',
                onPress: async () => {
                    server
                        .mutate({
                            mutation: submitGrade,
                            variables: {
                                cueId: props.cueId,
                                userId,
                                pointsScored,
                                comment,
                            },
                        })
                        .then((res) => {
                            if (res.data.cue.submitGrade) {
                                props.reloadStatuses();
                            }
                        });
                },
            },
        ]);
    }, [pointsScored, userId, props.cueId, comment]);

    // FUNCTIONS

    /**
     * @description Modify which attempt is active for Student
     */
    const modifyActiveQuizAttempt = () => {
        server
            .mutate({
                mutation: modifyActiveAttemptQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    quizAttempt: currentQuizAttempt,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.modifyActiveAttemptQuiz) {
                    props.reload();
                }
            });
    };

    /**
     * @description On Save quiz scores
     */
    const onGradeQuiz = (problemScores: string[], problemComments: string[], score: number, comment: string) => {
        server
            .mutate({
                mutation: gradeQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    problemScores,
                    problemComments,
                    score,
                    comment,
                    quizAttempt: currentQuizAttempt,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.gradeQuiz) {
                    props.reload();
                    setShowSubmission(false);
                }
            });
    };

    /**
     * @description Handles export of data to spreadsheet
     */
    const exportScores = async () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Grades ');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        const uri = FileSystem.cacheDirectory + 'grades.xlsx';
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'MyWater data',
            UTI: 'com.microsoft.excel.xlsx',
        });
    };

    useEffect(() => {
        if (props.shareFeedback) {
            updateReleaseSubmission();
        }

        props.setShareFeedback(false);
    }, [props.shareFeedback]);

    /**
     * @description Handle release/hide grades
     */
    const updateReleaseSubmission = useCallback(() => {
        const availableUntil =
            props.cue && props.cue.availableUntil && props.cue.availableUntil !== ''
                ? new Date(props.cue.availableUntil)
                : null;

        const deadline =
            props.cue && props.cue.deadline && props.cue.deadline !== '' ? new Date(props.cue.deadline) : null;

        let warning = '';

        if (deadline && new Date() < deadline) {
            warning = 'Deadline has not passed. Students will be unable to submit after releasing scores.';
        } else if (availableUntil && new Date() < availableUntil) {
            warning =
                'Late submission deadline has not passed. Students will be unable to submit after releasing scores.';
        }

        const keyword = isGraded ? 'Grades' : 'Feedback';

        Alert(
            releaseSubmission
                ? `Hide ${keyword.toLowerCase()}? ${keyword} will be temporarily hidden from viewers.`
                : `Share ${keyword.toLowerCase()}? ${keyword} will be privately visible to viewers`,
            releaseSubmission ? '' : warning,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        props.updateCueWithReleaseSubmission(!releaseSubmission);
                    },
                },
            ]
        );
    }, [releaseSubmission, props.cueId, props, isGraded]);

    /**
     * @description Renders submission
     */
    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (
            <View style={{ width: '100%' }} key={props.reloadViewerKey}>
                {/* Render Tabs to switch between original submission and Annotations only if submission was HTML and not a file upload */}
                {/* {attempt.url !== undefined ? null : <View style={{ flexDirection: "row", width: '100%', justifyContent: 'center' }}>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        setViewSubmissionTab("mySubmission");
                    }}>
                    <Text style={viewSubmissionTab === "mySubmission" ? styles.allGrayFill : styles.all}>
                        Submission
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        setViewSubmissionTab("instructorAnnotations");
                    }}>
                    <Text style={viewSubmissionTab === "instructorAnnotations" ? styles.allGrayFill : styles.all}>
                        Feedback
                    </Text>
                </TouchableOpacity>
            </View>} */}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        marginTop: 20,
                        marginBottom: 5,
                    }}
                >
                    {attempt.title !== '' ? (
                        <Text
                            style={{
                                fontSize: 14,
                                paddingRight: 15,
                                paddingTop: 12,
                                paddingBottom: 12,
                                maxWidth: '65%',
                                fontWeight: '600',
                                width: '100%',
                            }}
                        >
                            {attempt.title}
                        </Text>
                    ) : null}
                    <View
                        style={{
                            flexDirection: 'row',
                            marginLeft: 'auto',
                        }}
                    >
                        {downloadFeedbackInProgress ? (
                            <ActivityIndicator
                                color={'#000'}
                                style={{ alignSelf: 'center', paddingLeft: 20, marginTop: 5 }}
                            />
                        ) : (
                            <TouchableOpacity
                                onPress={async () => {
                                    if (downloadFeedbackInProgress) return;

                                    setDownloadFeedbackInProgress(true);
                                    const res = await downloadFileToDevice(
                                        attempt.url ? attempt.url : attempt.annotationPDF
                                    );
                                    setDownloadFeedbackInProgress(false);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    marginTop: 5,
                                    paddingLeft: 20,
                                }}
                            >
                                <Ionicons size={22} name={'cloud-download-outline'} color="#000" />
                            </TouchableOpacity>
                        )}

                        {attempt.type !== 'mp4' &&
                        attempt.type !== 'oga' &&
                        attempt.type !== 'mov' &&
                        attempt.type !== 'wmv' &&
                        attempt.type !== 'mp3' &&
                        attempt.type !== 'mpeg' &&
                        attempt.type !== 'mp2' &&
                        attempt.type !== 'wav' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    props.setFullScreenWebviewURL(feedbackPdfviewerURL);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    marginTop: 5,
                                    paddingLeft: 20,
                                }}
                            >
                                <Ionicons size={22} name={'expand-outline'} color="#000" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {attempt.url !== undefined ? (
                    attempt.type === 'mp4' ||
                    attempt.type === 'oga' ||
                    attempt.type === 'mov' ||
                    attempt.type === 'wmv' ||
                    attempt.type === 'mp3' ||
                    attempt.type === 'mov' ||
                    attempt.type === 'mpeg' ||
                    attempt.type === 'mp2' ||
                    attempt.type === 'wav' ? (
                        <View style={{ width: '100%', marginTop: 25 }}>
                            {/* {attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 18,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null} */}
                            {/* <ReactPlayer
                                source={{ uri: attempt.url }}
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                            /> */}
                            <Video
                                ref={videoRef}
                                style={{
                                    width: '100%',
                                    height: 500,
                                }}
                                source={{
                                    uri: attempt.url,
                                }}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                            />
                        </View>
                    ) : (
                        <View style={{ width: '100%', marginTop: 25, flex: 1 }}>
                            {/* {attempt.title && attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 18,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null} */}
                            {/* <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{ height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh' }}></div> */}
                            <WebView
                                source={{ uri: feedbackPdfviewerURL }}
                                startInLoadingState={true}
                                // style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                                style={{ height: 500, width: '100%' }}
                                renderLoading={() => renderLoadingSpinner()}
                                renderError={() => renderWebviewError()}
                            />
                        </View>
                    )
                ) : (
                    <View style={{ width: '100%', marginTop: 25 }} key={viewSubmissionTab}>
                        {viewSubmissionTab === 'mySubmission' ? (
                            <Text className="mce-content-body htmlParser" style={{ width: '100%' }}>
                                {/* {parser(attempt.html)} */}
                                {attempt.html}
                            </Text>
                        ) : (
                            // <div
                            //     className="webviewer"
                            //     ref={submissionViewerRef}
                            //     style={{ height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh' }}></div>
                            <WebView
                                startInLoadingState={true}
                                source={{ uri: feedbackPdfviewerURL }}
                                style={{ height: 500, width: '100%' }}
                                renderLoading={() => renderLoadingSpinner()}
                                renderError={() => renderWebviewError()}
                                // style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    };

    // MAIN RETURN

    return (
        <View
            style={{
                backgroundColor: 'white',
                width: '100%',
                minHeight: windowHeight - 200,
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
        >
            {subscribers.length === 0 ? (
                <View style={{ backgroundColor: 'white' }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 20,
                            paddingTop: 50,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                            textAlign: 'center',
                        }}
                    >
                        {props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        // maxWidth: 1024,
                        backgroundColor: 'white',
                    }}
                    key={key}
                >
                    {/* {!props.cueId || showSubmission || !isQuiz ? null : (
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 20,
                                paddingTop: 30,
                                paddingHorizontal: 10
                            }}
                        >
                            {props.cue && props.cue.submission ? (
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        flexDirection: 'row',
                                        justifyContent:
                                            Dimensions.get('window').width < 768 ? 'space-between' : 'flex-end',
                                        marginLeft: Dimensions.get('window').width < 768 ? '0%' : 'auto'
                                    }}
                                >
                                    
                                    {isQuiz ? (
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#007AFF',
                                                fontSize: 12,
                                                borderColor: '#007AFF',
                                                borderWidth: 1,
                                                borderRadius: 15,
                                                paddingHorizontal: 20,
                                                fontFamily: 'inter',
                                                overflow: 'hidden',
                                                height: 35,
                                                textTransform: 'uppercase',
                                                marginLeft: 20
                                            }}
                                            onPress={() => {
                                                exportScores();
                                            }}
                                        >
                                            EXPORT
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    )} */}
                    {!showSubmission ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            key={filterChoice + key}
                            contentContainerStyle={{
                                width: '100%',
                                borderRadius: 1,
                                borderWidth: 0,
                                borderColor: '#f2f2f2',
                                // maxWidth: 1024,
                                paddingBottom: 150,
                                paddingHorizontal: 10,
                            }}
                            indicatorStyle="black"
                        >
                            {filteredSubscribers.map((subscriber: any, index: any) => {
                                return (
                                    <TouchableOpacity
                                        disabled={
                                            subscriber.fullName !== 'submitted' && subscriber.fullName !== 'graded'
                                        }
                                        onPress={() => {
                                            if (
                                                subscriber.fullName === 'submitted' ||
                                                subscriber.fullName === 'graded'
                                            ) {
                                                setSubmission(subscriber.submission);
                                                setSubmittedAt(subscriber.submittedAt);
                                                setDeadline(subscriber.deadline);
                                                setShowSubmission(true);
                                                setPointsScored(
                                                    subscriber.pointsScored ? subscriber.pointsScored.toString() : ''
                                                );
                                                setGraded(subscriber.graded);
                                                setComment(subscriber.comment);
                                                setUserId(subscriber.userId);
                                                setTotalPoints(subscriber.totalPoints);
                                            }
                                        }}
                                        style={{
                                            backgroundColor: '#fff',
                                            flexDirection: 'row',
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            borderBottomWidth: index === filteredSubscribers.length - 1 ? 0 : 1,
                                            width: '100%',
                                        }}
                                    >
                                        <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                            <Image
                                                style={{
                                                    height: 50,
                                                    width: 50,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                }}
                                                source={{
                                                    uri: subscriber.avatar
                                                        ? subscriber.avatar
                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                }}
                                            />
                                        </View>
                                        <View style={{ backgroundColor: '#fff', paddingLeft: 10, flex: 1 }}>
                                            <Text
                                                style={{
                                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                    marginTop: 5,
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {subscriber.displayName ? subscriber.displayName : ''}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 13, padding: 5, fontWeight: 'bold' }}
                                                ellipsizeMode="tail"
                                            >
                                                {subscriber.fullName === 'delivered' ||
                                                subscriber.fullName === 'not-delivered'
                                                    ? 'delivered'
                                                    : subscriber.fullName}
                                            </Text>
                                        </View>
                                        <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    backgroundColor: '#fff',
                                                    paddingLeft: 10,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        padding: 5,
                                                        color: '#000',
                                                        textAlign: 'center',
                                                    }}
                                                    ellipsizeMode="tail"
                                                >
                                                    {subscriber.submittedAt &&
                                                    subscriber.submittedAt !== '' &&
                                                    subscriber.deadline &&
                                                    subscriber.deadline !== '' &&
                                                    subscriber.submittedAt >= subscriber.deadline ? (
                                                        <Text
                                                            style={{
                                                                color: '#f94144',
                                                                fontSize: 12,
                                                                marginRight: 10,
                                                            }}
                                                        >
                                                            LATE
                                                        </Text>
                                                    ) : null}{' '}
                                                    {subscriber.fullName === 'submitted' ||
                                                    subscriber.fullName === 'graded' ? (
                                                        <Ionicons name="chevron-forward-outline" size={15} />
                                                    ) : null}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : // is Quiz then show the Quiz Grading Component and new version with problemScores
                    props.isQuiz && showQuizGrading ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardDismissMode={'on-drag'}
                            style={{ paddingTop: 12 }}
                            contentContainerStyle={{
                                paddingBottom: 100,
                                paddingHorizontal: 10,
                            }}
                            indicatorStyle="black"
                        >
                            {submittedAt !== '' &&
                            deadline !== '' &&
                            new Date(submittedAt) >= new Date(parseInt(deadline)) ? (
                                <View style={{ width: '100%', paddingRight: 10 }}>
                                    <View
                                        style={{
                                            borderRadius: 1,
                                            padding: 5,
                                            borderWidth: 1,
                                            borderColor: '#f94144',
                                            marginVertical: 10,
                                            width: 150,
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        <Text style={{ color: '#f94144', fontSize: 13, textAlign: 'center' }}>
                                            LATE SUBMISSION
                                        </Text>
                                    </View>
                                </View>
                            ) : null}
                            {
                                <View style={{ width: 140, marginBottom: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (showSubmission) {
                                                props.reloadStatuses();
                                            }
                                            setShowSubmission(false);
                                            setPointsScored('');
                                            setUserId('');
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name="chevron-back-outline"
                                            color="#000"
                                            size={Dimensions.get('window').width < 800 ? 23 : 26}
                                        />
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#000',
                                                fontSize: 14,
                                                paddingHorizontal: 4,
                                                fontFamily: 'inter',
                                                height: 35,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            BACK
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            }
                            <QuizGrading
                                loading={loading}
                                problems={problems}
                                solutions={quizSolutions}
                                partiallyGraded={!graded}
                                onGradeQuiz={onGradeQuiz}
                                comment={comment}
                                headers={headers}
                                isOwner={true}
                                initiatedAt={initiatedAt}
                                submittedAt={submittedAt}
                                attempts={quizAttempts}
                                activeQuizAttempt={activeQuizAttempt}
                                currentQuizAttempt={currentQuizAttempt}
                                modifyActiveQuizAttempt={modifyActiveQuizAttempt}
                                onChangeQuizAttempt={(attempt: number) => {
                                    setCurrentQuizAttempt(attempt);

                                    quizAttempts.map((att: any, index: number) => {
                                        if (index === attempt) {
                                            setQuizSolutions(att);
                                            setGraded(att.isFullyGraded);
                                            setInitiatedAt(att.initiatedAt);
                                        }
                                    });
                                }}
                            />
                        </ScrollView>
                    ) : (
                        <View>
                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                indicatorStyle="black"
                                keyboardDismissMode={'on-drag'}
                                contentContainerStyle={{
                                    paddingHorizontal: 10,
                                    paddingBottom: 200,
                                }}
                                style={{ paddingTop: 12 }}
                            >
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (showSubmission) {
                                                    props.reloadStatuses();
                                                }
                                                setShowSubmission(false);
                                                setPointsScored('');
                                                setUserId('');
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                                marginRight: 15,
                                            }}
                                        >
                                            <Text>
                                                <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: 'row', marginRight: 15 }}>
                                            <Text style={{ fontSize: 14, lineHeight: 34 }}>
                                                {moment(new Date(parseInt(submittedAt))).format('MMMM Do, h:mm a')}
                                            </Text>
                                        </View>
                                        {submittedAt !== '' && deadline !== '' && submittedAt >= deadline ? (
                                            <View
                                                style={{
                                                    marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 0,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        borderRadius: 1,
                                                        paddingVertical: 5,
                                                        paddingHorizontal: 20,
                                                        borderWidth: 1,
                                                        borderColor: '#f94144',
                                                        marginVertical: 10,
                                                        // width: 150,
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#f94144',
                                                            fontSize: 13,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        LATE
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: Dimensions.get('window').width < 768 ? 20 : 0,
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 'auto',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 25,
                                            }}
                                        >
                                            <DefaultTextInput
                                                value={pointsScored}
                                                numberOfLines={1}
                                                style={{
                                                    width: 100,
                                                    borderColor: '#cccccc',
                                                    borderWidth: 1,
                                                    fontSize: 15,
                                                    backgroundColor: '#fff',
                                                    // paddingTop: 13,
                                                    marginLeft: 10,
                                                    padding: 10,
                                                }}
                                                placeholder={'Enter pts'}
                                                onChangeText={(val) => setPointsScored(val)}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    paddingLeft: 7,
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                / {totalPoints} points
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleGradeSubmit()}
                                            style={{
                                                backgroundColor: 'white',
                                                // marginLeft: Dimensions.get('window').width < 768 ? 20 : 0,
                                            }}
                                            disabled={user.email === disableEmailId}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    borderColor: '#000',
                                                    borderWidth: 1,
                                                    color: '#fff',
                                                    backgroundColor: '#000',
                                                    fontSize: 11,
                                                    paddingHorizontal: 24,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    paddingVertical: 14,
                                                    textTransform: 'uppercase',
                                                    width: 120,
                                                }}
                                            >
                                                UPDATE
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {submissionAttempts.length > 0 && !props.isQuiz ? renderViewSubmission() : null}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default SubscribersList;

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            // flex: 1
        },
        margin: {
            height: 20,
            backgroundColor: 'white',
        },
        marginSmall: {
            height: 10,
            backgroundColor: 'white',
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            // flex: 1,
            backgroundColor: 'white',
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20,
        },
        outline: {
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        all: {
            fontSize: 14,
            color: '#000000',
            height: 24,
            paddingHorizontal: 15,
            backgroundColor: '#f8f8f8',
            lineHeight: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 14,
            color: '#fff',
            paddingHorizontal: 15,
            borderRadius: 12,
            backgroundColor: '#000000',
            lineHeight: 24,
            height: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
    });
};
