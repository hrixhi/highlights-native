// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Dimensions, Image } from 'react-native';
import _ from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import moment from 'moment';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    submitGrade,
    getQuiz,
    gradeQuiz,
    editReleaseSubmission,
    updateAnnotation,
    modifyActiveAttemptQuiz
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import Alert from './Alert';
import ReactPlayer from 'react-native-video';
import alert from './Alert';
import QuizGrading from './QuizGrading';
import { htmlStringParser } from '../helpers/HTMLParser';
// import parser from 'html-react-parser';
import { WebView } from 'react-native-webview';
// import { Select } from '@mobiscroll/react';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [filterChoice, setFilterChoice] = useState('All');
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers));
    const [subscribers] = useState<any[]>(unparsedSubs.reverse());
    const categories = ['All', 'Delivered', 'Read'];
    const [showSubmission, setShowSubmission] = useState(false);
    const [submission, setSubmission] = useState<any>('');
    const [score, setScore] = useState('0');
    const [graded, setGraded] = useState(false);
    const [userId, setUserId] = useState('');
    const RichText: any = useRef();
    const submissionViewerRef: any = useRef();
    const [comment, setComment] = useState('');
    const [isQuiz, setIsQuiz] = useState(false);
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
    const [deadline, setDeadline] = useState('');
    const [headers, setHeaders] = useState({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [showQuizGrading, setShowQuizGrading] = useState(false);
    const [feedbackPdfviewerURL, setFeedbackPdfviewerURL] = useState('');

    if (props.cue && props.cue.submission) {
        categories.push('Submitted');
        categories.push('Graded');
    }
    const styles = styleObject();
    let filteredSubscribers: any = [];
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers;
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'read';
            });
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'not-delivered' || item.fullName === 'delivered';
            });
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'graded';
            });
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter(item => {
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
            group: sub.displayName[0]
        };
    });
    options = options.sort((a: any, b: any) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
    });

    // HOOKS

    useEffect(() => {
        if (props.cue.original[0] === '{' && props.cue.original[props.cue.original.length - 1] === '}') {
            const obj = JSON.parse(props.cue.original);

            if (obj.quizId) {
                setIsQuiz(true);
            }
        }
    }, [props.cue]);

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
            let type = questionType === '' ? 'MCQ' : 'Free Response';

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
            } else if (
                obj.attempts !== undefined &&
                obj.submissionDraft !== undefined &&
                obj.quizResponses === undefined
            ) {
                // Check if submission draft contains imported document
                if (obj.submissionDraft[0] === '{' && obj.submissionDraft[obj.submissionDraft.length - 1] === '}') {
                    let parse = JSON.parse(obj.submissionDraft);

                    if (parse.url !== undefined && parse.title !== undefined && parse.type !== undefined) {
                        setImported(true);
                        setUrl(parse.url);
                        setType(parse.type);
                        setTitle(parse.title);
                    }
                }

                setSubmissionAttempts(obj.attempts);
            } else if (obj.attempts !== undefined && obj.quizResponses !== undefined) {
                setIsQuiz(true);
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

    /**
     * @description Setup PDFTRON Webviewer with Submission
     */
    useEffect(() => {
        console.log('Load submission url');

        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const parsedUser = JSON.parse(u);

                if (submissionAttempts && submissionAttempts.length > 0) {
                    const attempt = submissionAttempts[submissionAttempts.length - 1];
                    let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;
                    console.log('URL', url);
                    const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${url}&cueId=${
                        props.cue._id
                    }&userId=${userId}&source=FEEDBACK&name=${encodeURIComponent(parsedUser.fullName)}`;
                    setFeedbackPdfviewerURL(pdfViewerURL);
                }
            }
        })();
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
    }, [submissionAttempts, submissionViewerRef, submissionViewerRef.current, viewSubmissionTab, props.cue]);

    /**
     * @description if submission is a quiz then fetch Quiz
     */
    useEffect(() => {
        if (isQuiz) {
            const obj = JSON.parse(props.cue.original);

            setLoading(true);

            if (obj.quizId) {
                const server = fetchAPI('');
                server
                    .query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.quiz.getQuiz) {
                            setProblems(res.data.quiz.getQuiz.problems);
                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {});
                            setLoading(false);
                        }
                    });
            }
        }
    }, [isQuiz]);

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
     * @description Save instructor annotations to cloud
     */
    const handleAnnotationsUpdate = useCallback(
        (attempts: any) => {
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: updateAnnotation,
                    variables: {
                        cueId: props.cueId,
                        userId,
                        attempts: JSON.stringify(attempts)
                    }
                })
                .then(res => {
                    if (res.data.cue.updateAnnotation) {
                        // props.reload()
                        // setShowSubmission(false)
                    }
                })
                .catch(e => {
                    console.log('Error', e);
                    Alert('Could not save annotation.');
                });
        },
        [userId, props.cueId]
    );

    /**
     * @description Called when instructor saves grade
     */
    const handleGradeSubmit = useCallback(() => {
        if (score === '') {
            Alert('Enter a valid score');
            return;
        }

        if (Number.isNaN(Number(score))) {
            Alert('Score must be a number');
            return;
        }

        if (Number(score) > 100) {
            Alert('Warning- Assigned score is greater than 100');
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
                }
            },
            {
                text: 'Yes',
                onPress: async () => {
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: submitGrade,
                            variables: {
                                cueId: props.cueId,
                                userId,
                                score,
                                comment
                            }
                        })
                        .then(res => {
                            if (res.data.cue.submitGrade) {
                                props.reloadStatuses();
                            }
                        });
                }
            }
        ]);
    }, [score, userId, props.cueId, comment, props]);

    // FUNCTIONS

    /**
     * @description Modify which attempt is active for Student
     */
    const modifyActiveQuizAttempt = () => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: modifyActiveAttemptQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    quizAttempt: currentQuizAttempt
                }
            })
            .then(res => {
                if (res.data && res.data.cue.modifyActiveAttemptQuiz) {
                    props.reload();
                }
            });
    };

    /**
     * @description On Save quiz scores
     */
    const onGradeQuiz = (problemScores: string[], problemComments: string[], score: number, comment: string) => {
        const server = fetchAPI('');
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
                    quizAttempt: currentQuizAttempt
                }
            })
            .then(res => {
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
            encoding: FileSystem.EncodingType.Base64
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'MyWater data',
            UTI: 'com.microsoft.excel.xlsx'
        });
    };

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
                    }
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        const server = fetchAPI('');
                        server
                            .mutate({
                                mutation: editReleaseSubmission,
                                variables: {
                                    cueId: props.cueId,
                                    releaseSubmission: !releaseSubmission
                                }
                            })
                            .then((res: any) => {
                                if (res.data && res.data.cue.editReleaseSubmission) {
                                    props.updateCueWithReleaseSubmission(!releaseSubmission);
                                    setReleaseSubmission(!releaseSubmission);
                                } else {
                                    alert('Something went wrong');
                                }
                            })
                            .catch(err => {
                                console.log(err);
                                alert('Something went wrong');
                            });
                    }
                }
            ]
        );
    }, [releaseSubmission, props.cueId, props, isGraded]);

    /**
     * @description Renders submission
     */
    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (
            <View style={{ width: '100%', marginTop: 20 }}>
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
                            {attempt.title !== '' ? (
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
                            ) : null}
                            <ReactPlayer
                                source={{ uri: attempt.url }}
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                        </View>
                    ) : (
                        <View style={{ width: '100%', marginTop: 25 }}>
                            {attempt.title !== '' ? (
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
                            ) : null}
                            {/* <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{ height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh' }}></div> */}
                            <WebView
                                src={feedbackPdfviewerURL}
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
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
                                src={feedbackPdfviewerURL}
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
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
                borderTopLeftRadius: 0
            }}
        >
            {subscribers.length === 0 ? (
                <View style={{ backgroundColor: 'white', flex: 1 }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 20,
                            paddingTop: 50,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                            flex: 1,
                            textAlign: 'center'
                        }}
                    >
                        {props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        maxWidth: 900,
                        backgroundColor: 'white',
                        flex: 1
                    }}
                    key={key}
                >
                    {!props.cueId || showSubmission ? null : (
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
                            {/* <label style={{ width: Dimensions.get('window').width < 768 ? 140 : 160 }}>
                                <Select
                                    touchUi={true}
                                    themeVariant="light"
                                    value={filterChoice}
                                    onChange={(val: any) => {
                                        setFilterChoice(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble'
                                        },
                                        medium: {
                                            touchUi: false
                                        }
                                    }}
                                    data={categories.map((category: any) => {
                                        return {
                                            value: category,
                                            text: category
                                        };
                                    })}
                                />
                            </label> */}
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
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            flexDirection: 'row'
                                        }}
                                    >
                                        {releaseSubmission ? (
                                            <TouchableOpacity
                                                onPress={() => updateReleaseSubmission()}
                                                style={{
                                                    borderRadius: 15,
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        lineHeight: 34,
                                                        color: '#006AFF',
                                                        fontSize: 12,
                                                        borderColor: '#006AFF',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        paddingHorizontal: 20,
                                                        fontFamily: 'inter',
                                                        overflow: 'hidden',
                                                        height: 35,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    Hide {isGraded ? 'Grades' : 'Feedback'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => updateReleaseSubmission()}
                                                style={{
                                                    borderRadius: 15,
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        lineHeight: 34,
                                                        color: '#006AFF',
                                                        fontSize: 12,
                                                        borderColor: '#006AFF',
                                                        borderRadius: 15,
                                                        backgroundColor: '#fff',
                                                        borderWidth: 1,
                                                        paddingHorizontal: 20,
                                                        fontFamily: 'inter',
                                                        overflow: 'hidden',
                                                        height: 35,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    Share {isGraded ? 'Grades' : 'Feedback'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {isQuiz ? (
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#006AFF',
                                                fontSize: 12,
                                                borderColor: '#006AFF',
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
                    )}
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
                                maxWidth: 900,
                                marginBottom: 50,
                                paddingHorizontal: 10
                            }}
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
                                                setScore(subscriber.score ? subscriber.score.toString() : '');
                                                setGraded(subscriber.graded);
                                                setComment(subscriber.comment);
                                                setUserId(subscriber.userId);
                                            }
                                        }}
                                        style={{
                                            backgroundColor: '#fff',
                                            flexDirection: 'row',
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            borderBottomWidth: index === filteredSubscribers.length - 1 ? 0 : 1,
                                            width: '100%'
                                        }}
                                    >
                                        <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                            <Image
                                                style={{
                                                    height: 35,
                                                    width: 35,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    alignSelf: 'center'
                                                }}
                                                source={{
                                                    uri: subscriber.avatar
                                                        ? subscriber.avatar
                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                                }}
                                            />
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                    marginTop: 5
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {subscriber.displayName ? subscriber.displayName : ''}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 12, padding: 5, fontWeight: 'bold' }}
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
                                                    paddingLeft: 10
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        padding: 5,
                                                        color: '#006AFF',
                                                        textAlign: 'center'
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
                                                                marginRight: 10
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
                    isQuiz && showQuizGrading ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardDismissMode={'on-drag'}
                            style={{ flex: 1, paddingTop: 12 }}
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
                                            marginLeft: 'auto'
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
                                            setScore('0');
                                            setUserId('');
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Ionicons name="chevron-back-outline" color="#006AFF" size={23} />
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#006AFF',
                                                fontSize: 14,
                                                paddingHorizontal: 4,
                                                fontFamily: 'inter',
                                                height: 35,
                                                textTransform: 'uppercase'
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
                                keyboardDismissMode={'on-drag'}
                                contentContainerStyle={{
                                    paddingHorizontal: 10
                                }}
                                style={{ flex: 1, paddingTop: 12 }}
                            >
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                                        flex: 1
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                            marginBottom: 10
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (showSubmission) {
                                                    props.reloadStatuses();
                                                }
                                                setShowSubmission(false);
                                                setScore('0');
                                                setUserId('');
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                                marginRight: 15
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
                                                    marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 0
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
                                                        marginLeft: 'auto'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#f94144',
                                                            fontSize: 13,
                                                            textAlign: 'center'
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
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto'
                                        }}
                                    >
                                        <TextInput
                                            value={score}
                                            numberOfLines={1}
                                            style={{
                                                width: 75,
                                                borderBottomColor: '#f2f2f2',
                                                borderBottomWidth: 1,
                                                fontSize: 14,
                                                // paddingTop: 13,
                                                marginLeft: 10,
                                                padding: 10,
                                                marginRight: 20
                                            }}
                                            placeholder={'Score 0-100'}
                                            onChangeText={val => setScore(val)}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                        <TouchableOpacity
                                            onPress={() => handleGradeSubmit()}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginLeft: Dimensions.get('window').width < 768 ? 20 : 0
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    borderColor: '#006AFF',
                                                    fontSize: 12,
                                                    color: '#006AFF',
                                                    borderWidth: 1,
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    height: 35,
                                                    borderRadius: 15,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                UPDATE
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    {imported && !isQuiz ? (
                                        <View style={{ flex: 1 }}>
                                            <TextInput
                                                editable={false}
                                                value={title}
                                                style={styles.input}
                                                placeholder={'Title'}
                                                onChangeText={val => setTitle(val)}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                                {submissionAttempts.length > 0 && !isQuiz ? renderViewSubmission() : null}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default React.memo(SubscribersList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads);
});

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: 20,
            backgroundColor: 'white'
        },
        marginSmall: {
            height: 10,
            backgroundColor: 'white'
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            // flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        },
        outline: {
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white'
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white'
        },
        all: {
            fontSize: 14,
            color: '#000000',
            height: 24,
            paddingHorizontal: 15,
            backgroundColor: '#f2f2f2',
            lineHeight: 24,
            fontFamily: 'inter'
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
            fontFamily: 'inter'
            // textTransform: 'uppercase'
        }
    });
};
