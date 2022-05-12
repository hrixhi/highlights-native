// REACT
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    Keyboard,
    StyleSheet,
    Switch,
    TextInput,
    Dimensions,
    ScrollView,
    Animated,
    Platform,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import lodash from 'lodash';
import moment from 'moment';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createCue,
    deleteCue,
    deleteForEveryone,
    getChannelCategories,
    getChannels,
    getQuiz,
    getSharedWith,
    markAsRead,
    shareCueWithMoreIds,
    unshareCueWithIds,
    shareWithAll,
    start,
    submit,
    modifyQuiz,
    // findBySchoolId,
    getRole,
    getOrganisation,
    duplicateQuiz,
    saveSubmissionDraft,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { Text, View, TouchableOpacity } from './Themed';
import FileUpload from './UploadFiles';
import Quiz from './Quiz';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import TeXToSVG from 'tex-to-svg';
import { Video } from 'expo-av';
import QuizGrading from './QuizGrading';
// import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
// import TextareaAutosize from 'react-textarea-autosize';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
// import parser from 'html-react-parser';
import { WebView } from 'react-native-webview';
// import Select from 'react-select';
// import { Datepicker as MobiscrollDatePicker } from '@mobiscroll/react5';
// import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
// import FormulaGuide from './FormulaGuide';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import ColorPicker from './ColorPicker';
// import { SafeAreaView } from 'react-native-safe-area-context';
const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');
import MultiSelectComponent from './MultiSelect';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet from './BottomSheet';
import { EmojiView, InsertLink } from './ToolbarComponents';
import RenderHtml from 'react-native-render-html';
import Reanimated from 'react-native-reanimated';
import useDynamicRefs from 'use-dynamic-refs';
import * as FileSystem from 'expo-file-system';

// HELPERS
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { handleFile } from '../helpers/FileUpload';
import { handleImageUpload } from '../helpers/ImageUpload';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { htmlStringParser } from '../helpers/HTMLParser';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { downloadFileToDevice } from '../helpers/DownloadFile';

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue] = useState(props.cue.cue);
    const [initialSubmissionDraft, setInitialSubmissionDraft] = useState('');
    const [shuffle, setShuffle] = useState(props.cue.shuffle);
    const [starred, setStarred] = useState(props.cue.starred);
    const [color, setColor] = useState(props.cue.color);
    const [notify, setNotify] = useState(props.cue.frequency !== '0' ? true : false);
    const [frequency, setFrequency] = useState(props.cue.frequency);
    const [customCategory, setCustomCategory] = useState('None');
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [initializedCustomCategories, setInitializedCustomCategories] = useState(false);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [markedAsRead, setMarkedAsRead] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const stopPlay =
        props.cue.endPlayAt && props.cue.endPlayAt !== ''
            ? props.cue.endPlayAt === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60)
                : new Date(props.cue.endPlayAt)
            : new Date(current.getTime() + 1000 * 60 * 60);
    const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay);
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
        props.cue.endPlayAt && props.cue.endPlayAt !== '' ? false : true
    );
    const RichText: any = useRef();
    const editorRef: any = useRef();
    const scrollRef: any = useRef();

    const submissionViewerRef: any = useRef();
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
    const [limitedShares, setLimitedShares] = useState(props.cue.limitedShares ? props.cue.limitedShares : false);
    const dead =
        props.cue.deadline && props.cue.deadline !== ''
            ? props.cue.deadline === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60 * 24)
                : new Date(props.cue.deadline)
            : new Date(current.getTime() + 1000 * 60 * 60 * 24);
    const initiate =
        props.cue.initiateAt && props.cue.initiateAt !== ''
            ? props.cue.initiateAt === 'Invalid Date'
                ? new Date()
                : new Date(props.cue.initiateAt)
            : new Date();
    const until =
        props.cue.availableUntil && props.cue.availableUntil !== ''
            ? props.cue.availableUntil === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60 * 48)
                : new Date(props.cue.availableUntil)
            : new Date(current.getTime() + 1000 * 60 * 60 * 48);
    const [allowLateSubmission, setAllowLateSubmission] = useState(
        props.cue.availableUntil && props.cue.availableUntil !== ''
    );
    const [availableUntil, setAvailableUntil] = useState<Date>(until);
    const [deadline, setDeadline] = useState<Date>(dead);
    const [initiateAt, setInitiateAt] = useState<Date>(initiate);
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0);
    const [graded, setGraded] = useState(props.cue.gradeWeight);
    const currentDate = new Date();
    const [submitted, setSubmitted] = useState(false);
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [submissionImported, setSubmissionImported] = useState(false);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submissionType, setSubmissionType] = useState('');
    const [submissionTitle, setSubmissionTitle] = useState('');
    const [key, setKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [shareWithChannelId, setShareWithChannelId] = useState('None');
    const [selected, setSelected] = useState<any[]>([]);
    const [originalSelected, setOriginalSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [original, setOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [initialOriginal, setInitialOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [comment] = useState(props.cue.comment);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(!props.cue.allowedAttempts);
    const [allowedAttempts, setAllowedAttemps] = useState(
        !props.cue.allowedAttempts ? '' : props.cue.allowedAttempts.toString()
    );
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [submissionDraft, setSubmissionDraft] = useState('');
    const [updatingCueContent, setUpdatingCueContent] = useState(false);
    const [updatingCueDetails, setUpdatingCueDetails] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(
        (props.cue.submittedAt !== null && props.cue.submittedAt !== undefined) ||
            (props.cue.graded && props.cue.releaseSubmission) ||
            new Date(props.cue.deadline)
    );
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [remainingAttempts, setRemainingAttempts] = useState<any>(null);
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [unmodifiedProblems, setUnmodifiedProblems] = useState<any[]>([]);
    const [totalQuizPoints, setTotalQuizPoints] = useState(0);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [quizId, setQuizId] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchingQuiz, setFetchingQuiz] = useState(false);
    const [initiatedAt, setInitiatedAt] = useState<any>(null);
    const [isQuizTimed, setIsQuizTimed] = useState(false);
    const [duration, setDuration] = useState(0);
    const [initDuration, setInitDuration] = useState(0);
    const [equation, setEquation] = useState('y = x + 1');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [headers, setHeaders] = useState({});
    const [cueGraded] = useState(props.cue.graded);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [loadingAfterModifyingQuiz, setLoadingAfterModifyingQuiz] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedChannelOwner, setSelectedChannelOwner] = useState<any>(undefined);
    const [submissionSavedAt, setSubmissionSavedAt] = useState(new Date());
    const [failedToSaveSubmission, setFailedToSaveSubmission] = useState(false);
    const [userId, setUserId] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isShareWithDropdownOpen, setIsShareWithDropdownOpen] = useState(false);
    const [isFrequencyDropdownOpen, setIsFrequencyDropdownOpen] = useState(false);
    const width = Dimensions.get('window').width;
    const videoRef: any = useRef();

    const [originalPdfviewerURL, setOriginalPdfviewerURL] = useState('');
    const [submissionPdfviewerURL, setSubmissionPdfviewerURL] = useState('');
    const [height, setHeight] = useState(100);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [editorFocus, setEditorFocus] = useState(false);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
    const [foreColorVisible, setForeColorVisible] = useState(false);
    const [hiliteColor, setHiliteColor] = useState('#ffffff');
    const [foreColor, setForeColor] = useState('#000000');
    const [insertLinkVisible, setInsertLinkVisible] = useState(false);
    const [insertImageVisible, setInsertImageVisible] = useState(false);

    const [showDeadlineTimeAndroid, setShowDeadlineTimeAndroid] = useState(false);
    const [showDeadlineDateAndroid, setShowDeadlineDateAndroid] = useState(false);

    const [showInitiateAtTimeAndroid, setShowInitiateAtTimeAndroid] = useState(false);
    const [showInitiateAtDateAndroid, setShowInitiateAtDateAndroid] = useState(false);

    const [showAvailableUntilTimeAndroid, setShowAvailableUntilTimeAndroid] = useState(false);
    const [showAvailableUntilDateAndroid, setShowAvailableUntilDateAndroid] = useState(false);
    const [isRestrictAccessDropdownOpen, setIsRestrictAccessDropdownOpen] = useState(false);

    const [quizEditorRef, setQuizEditorRef] = useState<any>(null);

    const [showTwoMinuteAlert, setShowTwoMinuteAlert] = useState(false);
    const [twoMinuteAlertDisplayed, setTwoMinuteAlertDisplayed] = useState(false);
    const [submittingQuizEndTime, setSubmittingQuizEndTime] = useState(false);

    const [getRef, setRef] = useDynamicRefs();
    const [quizOptionEditorIndex, setQuizOptionEditorIndex] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadOriginalInProgress, setDownloadOriginalInProgress] = useState(false);
    const [downloadSubmissionInProgress, setDownloadSubmissionInProgress] = useState(false);

    const [showTextEntryInput, setShowTextEntryInput] = useState(false);
    const [textEntryValue, setTextEntryValue] = useState('');
    const [textEntryInputType, setTextEntryInputType] = useState('default');

    // ALERTS
    const unableToStartQuizAlert = PreferredLanguageText('unableToStartQuiz');
    const cueDeletedAlert = PreferredLanguageText('cueDeleted');
    const submissionCompleteAlert = PreferredLanguageText('submissionComplete');
    const tryAgainLaterAlert = PreferredLanguageText('tryAgainLater');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const sharedAlert = PreferredLanguageText('sharedAlert');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems');
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints');
    // const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions');
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect');

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    // HOOKS

    /**
     * @description Load User on Init
     */
    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (showTwoMinuteAlert && !twoMinuteAlertDisplayed) {
            Alert('Two minutes left. Quiz will auto-submit when timer ends.');
            setShowTwoMinuteAlert(false);
            setTwoMinuteAlertDisplayed(true);
        }
    }, [showTwoMinuteAlert, twoMinuteAlertDisplayed]);

    // SHARE WITH ANY OTHER CHANNEL IN INSTITUTE
    // useEffect(() => {
    //     if (role === 'instructor' && school) {
    //         const server = fetchAPI('');
    //         server
    //             .query({
    //                 query: findBySchoolId,
    //                 variables: {
    //                     schoolId: school._id
    //                 }
    //             })
    //             .then((res: any) => {
    //                 if (res.data && res.data.channel.findBySchoolId) {
    //                     res.data.channel.findBySchoolId.sort((a, b) => {
    //                         if (a.name < b.name) {
    //                             return -1;
    //                         }
    //                         if (a.name > b.name) {
    //                             return 1;
    //                         }
    //                         return 0;
    //                     });
    //                     const c = res.data.channel.findBySchoolId.filter((item: any) => {
    //                         return item.createdBy.toString().trim() !== userId.toString().trim();
    //                     });
    //                     setOtherChannels(c);
    //                     const otherChannelOwnersMap: any = {};
    //                     const otherChannelOwners: any[] = [];
    //                     c.map((channel: any) => {
    //                         if (!otherChannelOwnersMap[channel.createdBy]) {
    //                             otherChannelOwnersMap[channel.createdBy] = channel.createdByUsername;
    //                         }
    //                     });
    //                     Object.keys(otherChannelOwnersMap).map((key: any) => {
    //                         otherChannelOwners.push({
    //                             id: key,
    //                             name: otherChannelOwnersMap[key]
    //                         });
    //                     });
    //                     setChannelOwners(otherChannelOwners);
    //                 }
    //             });
    //     }
    // }, [role, school, userId]);

    /**
     * @description Load channels and share with
     */
    useEffect(() => {
        loadChannelsAndSharedWith();
    }, []);

    /**
     * @description Load categories for Update dropdown
     */
    useEffect(() => {
        let options = [
            {
                value: 'None',
                label: 'None',
            },
        ];

        customCategories.map((category: any) => {
            options.push({
                value: category,
                label: category,
            });
        });

        setCategoryOptions(options);
    }, [customCategories]);

    /**
     * @description Set custom category on init
     */
    useEffect(() => {
        if (props.cue.customCategory === '') {
            setCustomCategory('None');
            return;
        }

        setCustomCategory(props.cue.customCategory);
    }, [props.cue]);

    /**
     * @description Load PDFTron Webviewer for submission
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const parsedUser = JSON.parse(u);
                if (submissionAttempts && submissionAttempts.length > 0) {
                    const attempt = submissionAttempts[submissionAttempts.length - 1];
                    let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;
                    const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${encodeURIComponent(
                        url
                    )}&cueId=${props.cue._id}&userId=${parsedUser._id}&source=VIEW_SUBMISSION&name=${encodeURIComponent(
                        parsedUser.fullName
                    )}`;
                    setSubmissionPdfviewerURL(pdfViewerURL);
                }
            }
        })();
    }, [viewSubmission, viewSubmissionTab, submissionAttempts, props.showOriginal, props.cue]);

    /**
     * @description Used to detect ongoing quiz and
     */
    useEffect(() => {
        let now = new Date();
        now.setMinutes(now.getMinutes() - 1);
        if (
            submission &&
            !isQuizTimed &&
            ((!allowLateSubmission && now >= deadline) || (allowLateSubmission && now >= availableUntil))
        ) {
            props.setViewSubmission(true);
            return;
        }

        if (!isQuizTimed || initiatedAt === null || initiatedAt === '' || isOwner) {
            // not a timed quiz or its not been initiated
            return;
        }
        let current = new Date();
        if ((!allowLateSubmission && now >= deadline) || (allowLateSubmission && now >= availableUntil)) {
            // deadline crossed or late submission over
            return;
        }
        if (duration === 0) {
            return;
        }
        const remainingTime = duration - diff_seconds(initiatedAt, current);
        if (remainingTime <= 0 && !submittingQuizEndTime) {
            // Submit quiz when time runs out
            submitQuizEndTime();
        } else {
            setInitDuration(remainingTime); // set remaining duration in seconds
        }
    }, [
        initiatedAt,
        duration,
        deadline,
        isQuizTimed,
        isOwner,
        allowLateSubmission,
        availableUntil,
        submittingQuizEndTime,
        submission,
        props.showOriginal,
    ]);

    /**
     * @description If cue contains a Quiz, then need to fetch the quiz and set State
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = original;
            const data2 = props.cue.cue;

            if (!data2 || !data2[0] || data2[0] !== '{' || data2[data2.length - 1] !== '}') {
                setSubmissionImported(false);
                setSubmissionUrl('');
                setSubmissionType('');
                setSubmissionTitle('');
            }

            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    if (!loading) {
                        return;
                    }
                    setFetchingQuiz(true);

                    // load quiz here and set problems
                    const server = fetchAPI('');
                    server
                        .query({
                            query: getQuiz,
                            variables: {
                                quizId: obj.quizId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.quiz.getQuiz) {
                                setQuizId(obj.quizId);

                                const solutionsObject = cue ? JSON.parse(cue) : {};

                                if (solutionsObject.solutions) {
                                    setSolutions(solutionsObject.solutions);
                                    setQuizSolutions(solutionsObject);
                                }

                                if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== '') {
                                    const init = new Date(solutionsObject.initiatedAt);
                                    setInitiatedAt(init);
                                }

                                // NEW SCHEMA V1: QUIZ RESPONSES STORED AS quizResponses
                                if (
                                    solutionsObject.quizResponses !== undefined &&
                                    solutionsObject.quizResponses !== ''
                                ) {
                                    const parseQuizResponses = JSON.parse(solutionsObject.quizResponses);

                                    setSolutions(parseQuizResponses.solutions);

                                    if (
                                        parseQuizResponses.initiatedAt !== undefined &&
                                        parseQuizResponses.initiatedAt !== null
                                    ) {
                                        const init = new Date(parseQuizResponses.initiatedAt);
                                        setInitiatedAt(init);
                                    }
                                }

                                if (solutionsObject.attempts !== undefined) {
                                    setQuizAttempts(solutionsObject.attempts);

                                    // FInd the active one and set it to quizSolutions
                                    solutionsObject.attempts.map((attempt: any) => {
                                        if (attempt.isActive) {
                                            setQuizSolutions(attempt);
                                        }
                                    });
                                }

                                // Set remaining attempts
                                if (props.cue.allowedAttempts !== null) {
                                    setRemainingAttempts(
                                        solutionsObject.attempts
                                            ? props.cue.allowedAttempts - solutionsObject.attempts.length
                                            : props.cue.allowedAttempts
                                    );
                                }

                                setProblems(res.data.quiz.getQuiz.problems);

                                const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);
                                setUnmodifiedProblems(deepCopy);

                                let totalPoints = 0;

                                res.data.quiz.getQuiz.problems.map((problem: any) => {
                                    totalPoints += Number(problem.points);
                                });

                                setTotalQuizPoints(totalPoints);

                                if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                                    setDuration(res.data.quiz.getQuiz.duration * 60);
                                    setIsQuizTimed(true);
                                }

                                setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? true : false);
                                setTitle(obj.title);
                                setIsQuiz(true);
                                setInstructions(
                                    res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : ''
                                );
                                setHeaders(
                                    res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {}
                                );
                                setFetchingQuiz(false);
                                setLoading(false);
                            }
                        })
                        .catch((e) => console.log('error', e));
                } else {
                    setImported(true);
                    setType(obj.type);
                    if (loading) {
                        setTitle(obj.title);
                    }
                    setUrl(obj.url);
                    setKey(Math.random());
                }
            } else {
                setImported(false);
                setUrl('');
                setType('');
                setTitle('');
            }
        } else {
            const data = props.cue.cue;
            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data);
                setSubmissionImported(true);
                setSubmissionUrl(obj.url);
                setSubmissionType(obj.type);
                setSubmissionTitle(obj.title);
            } else {
                setSubmissionImported(false);
                setSubmissionUrl('');
                setSubmissionType('');
                setSubmissionTitle('');
            }
        }
        setLoading(false);
    }, [props.cue, cue, loading, original]);

    /**
     * @description Imports for local cues
     */
    useEffect(() => {
        if (!props.cue.channelId) {
            if (original && original[0] && original[0] === '{' && original[original.length - 1] === '}') {
                const obj = JSON.parse(original);
                setImported(true);
                setUrl(obj.url);
                setType(obj.type);
                setTitle(obj.title);
            }
        }
    }, [original]);

    /**
     * @description Initialize submission Draft + Submission import title, url, type for new SCHEMA
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data = cue;

            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data);

                // New Schema
                if (obj.submissionDraft !== undefined) {
                    if (obj.submissionDraft[0] === '{' && obj.submissionDraft[obj.submissionDraft.length - 1] === '}') {
                        let parse = JSON.parse(obj.submissionDraft);

                        if (parse.url !== undefined && parse.title !== undefined && parse.type !== undefined) {
                            setSubmissionImported(true);
                            setSubmissionUrl(parse.url);
                            setSubmissionType(parse.type);
                            setSubmissionTitle(parse.title);
                        }

                        setSubmissionDraft(obj.submissionDraft);
                    } else {
                        setInitialSubmissionDraft(obj.submissionDraft);
                        setSubmissionDraft(obj.submissionDraft);
                    }
                }

                if (obj.attempts) {
                    setSubmissionAttempts(obj.attempts);
                    props.setSubmissionAttempts(obj.attempts);
                }
            }
        }
    }, [cue, props.cue.channelId]);

    /**
     * @description Update cue status as Read on opening
     */
    useEffect(() => {
        updateStatusAsRead();
    }, [props.cue.status]);

    /**
     * @description
     */
    useEffect(() => {
        setViewSubmission(props.viewSubmission);
    }, [props.viewSubmission]);

    /**
     * @description Handle Save when props.save
     */
    useEffect(() => {
        if (props.save) {
            Alert('Save changes?', '', [
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
                        await handleUpdateContent();
                        await handleUpdateDetails();
                        await handleRestrictAccessUpdate();
                    },
                },
            ]);
            props.setSave(false);
        }
    }, [props.save, props.channelOwner, props.showOriginal]);

    /**
     * @description Handle Save when props.save
     */
    useEffect(() => {
        if (props.submit) {
            handleSubmit();
            props.setSubmit(false);
        }
    }, [props.submit]);

    /**
     * @description Handle Delete when props.del
     */
    useEffect(() => {
        if (props.del) {
            handleDelete();
            props.setDelete(false);
        }
    }, [props.del]);

    /**
     * @description Setup PDFTron Webviewer for Cue content
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const parsedUser = JSON.parse(u);

                if (props.showOriginal) {
                    if (url === '' || !url) {
                        return;
                    }

                    if (
                        type === 'mp4' ||
                        type === 'oga' ||
                        type === 'mov' ||
                        type === 'wmv' ||
                        type === 'mp3' ||
                        type === 'mov' ||
                        type === 'mpeg' ||
                        type === 'mp2' ||
                        type === 'wav'
                    ) {
                        return;
                    }

                    const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${encodeURIComponent(
                        url
                    )}&cueId=${props.cue._id}&userId=${parsedUser._id}&source=${
                        !props.channelId ? 'MY_NOTES' : 'UPDATE'
                    }&name=${encodeURIComponent(parsedUser.fullName)}`;
                    setOriginalPdfviewerURL(pdfViewerURL);
                } else {
                    if (submissionUrl === '' || !submissionUrl) {
                        return;
                    }

                    if (
                        submissionType === 'mp4' ||
                        submissionType === 'oga' ||
                        submissionType === 'mov' ||
                        submissionType === 'wmv' ||
                        submissionType === 'mp3' ||
                        submissionType === 'mov' ||
                        submissionType === 'mpeg' ||
                        submissionType === 'mp2' ||
                        submissionType === 'wav'
                    ) {
                        return;
                    }

                    const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${submissionUrl}&cueId=${
                        props.cue._id
                    }&userId=${parsedUser._id}&source=CREATE_SUBMISSION&name=${encodeURIComponent(
                        parsedUser.fullName
                    )}`;
                    setOriginalPdfviewerURL(pdfViewerURL);
                }
            }
        })();
    }, [
        url,
        RichText,
        imported,
        submissionImported,
        props.showOriginal,
        props.showOptions,
        submissionUrl,
        type,
        submissionType,
        props.cue,
        props.channelId,
    ]);

    /**
     * @description Set is owner based on Channel owner prop
     */
    useEffect(() => {
        setIsOwner(props.channelOwner);
    }, [props.channelOwner]);

    /**
     * @description Clear submission imported if submissionDraft is set to ""
     */
    useEffect(() => {
        if (submissionDraft === '' && submissionImported) {
            setSubmissionImported(false);
            setSubmissionUrl('');
            setSubmissionType('');
            setSubmissionTitle('');
        }
    }, [submissionDraft]);

    /**
     * @description Sync user submission responses to cloud (IMP since submissions should be saved in real time)
     */
    useEffect(() => {
        handleUpdateCue();
    }, [
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft,
    ]);

    /**
     * @description Handle bookmark (Not used right now)
     */
    useEffect(() => {
        handleUpdateStarred();
    }, [starred]);

    /**
     * @description Update submission response in Editor on Tab change
     */
    useEffect(() => {
        setInitialSubmissionDraft(submissionDraft);
    }, [props.showOriginal, props.showComments, props.showOptions, props.viewSubmission]);

    /**
     * @description Update original value in Editor on Tab change
     */
    useEffect(() => {
        setInitialOriginal(original);
    }, [props.showOriginal, props.showComments, props.showOptions]);

    /**
     * @description Called when new user selected in share with dropdown
     */
    const onAddNew = useCallback(
        (userId) => {
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: shareCueWithMoreIds,
                    variables: {
                        cueId: props.cue._id,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.cue.shareCueWithMoreIds) {
                        loadChannelsAndSharedWith();
                    }
                })
                .catch((err) => console.log(err));
            const updatedSelected: any[] = [...selected];
            updatedSelected.push(userId);
            setSelected(updatedSelected);
        },
        [subscribers, props.cue, selected]
    );

    /**
     * @description Loads all the channel categories and list of people cue has been shared with
     */
    const loadChannelsAndSharedWith = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');

            if (props.channelId) {
                server
                    .query({
                        query: getChannelCategories,
                        variables: {
                            channelId: props.channelId,
                        },
                    })
                    .then((res) => {
                        if (res.data.channel && res.data.channel.getChannelCategories) {
                            setCustomCategories(res.data.channel.getChannelCategories);
                            setInitializedCustomCategories(true);
                        }
                    })
                    .catch((err) => {});
            } else {
                setCustomCategories(props.customCategories);
                setInitializedCustomCategories(true);
            }

            server
                .query({
                    query: getChannels,
                    variables: {
                        userId: user._id,
                    },
                })
                .then((res) => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                    }
                })
                .catch((err) => {});
            if (props.channelOwner && props.cue.channelId && props.cue.channelId !== '') {
                // owner
                server
                    .query({
                        query: getSharedWith,
                        variables: {
                            channelId: props.cue.channelId,
                            cueId: props.cue._id,
                        },
                    })
                    .then((res: any) => {
                        if (res.data && res.data.cue.getSharedWith) {
                            const format = res.data.cue.getSharedWith.map((sub: any) => {
                                return {
                                    value: sub.value,
                                    label: sub.label,
                                };
                            });

                            setSubscribers(format);

                            // clear selected
                            const sel = res.data.cue.getSharedWith.filter((item: any) => {
                                return item.sharedWith;
                            });

                            const formatSel = sel.map((sub: any) => {
                                return sub.value;
                            });

                            setSelected(formatSel);
                            setOriginalSelected(formatSel);
                        }
                    })
                    .catch((err: any) => console.log(err));
            }
        }
    }, [props.cue, props.channelId]);

    const reactSelectStyles = {
        multiValue: (base: any, state: any) => {
            return { ...base, backgroundColor: '#0096Fb', borderRadius: 11 };
        },
        multiValueLabel: (base: any, state: any) => {
            return state.data.isFixed
                ? { ...base, fontWeight: 'bold', color: 'white', paddingRight: 6 }
                : { ...base, color: 'white' };
        },
        multiValueRemove: (base: any, state: any) => {
            return state.data.isFixed ? { ...base, display: 'none' } : base;
        },
    };

    /**
     * @description Update cue with URL and Filetype after upload
     */
    const updateAfterFileImport = useCallback(
        (u: any, t: any) => {
            if (props.showOriginal) {
                setOriginal(
                    JSON.stringify({
                        url: u,
                        type: t,
                        title,
                    })
                );
            } else {
                setSubmissionDraft(
                    JSON.stringify({
                        url: u,
                        type: t,
                        title: submissionTitle,
                        annotations: '',
                    })
                );
                setSubmissionImported(true);
                setSubmissionType(t);
                setSubmissionUrl(u);
            }
            setShowImportOptions(false);
        },
        [title, submissionTitle, props.showOriginal]
    );

    // EDITOR METHODS

    useEffect(() => {
        changeForeColor(foreColor);
    }, [foreColor]);

    useEffect(() => {
        changeHiliteColor(hiliteColor);
    }, [hiliteColor]);

    const handleUploadFile = useCallback(async () => {
        const res = await handleFile(false, userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);
        props.setEditorFocus(false);

        updateAfterFileImport(res.url, res.type);
    }, [RichText, RichText.current]);

    const handleUploadAudioVideo = useCallback(async () => {
        const res = await handleFile(true, userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);
        props.setEditorFocus(false);

        updateAfterFileImport(res.url, res.type);
    }, [RichText, RichText.current, userId]);

    const changeForeColor = useCallback(
        (h: any) => {
            if (quizOptionEditorIndex) {
                const currRef: any = getRef(quizOptionEditorIndex);
                currRef.current?.setForeColor(h);
                setQuizOptionEditorIndex('');
            } else if (quizEditorRef) {
                quizEditorRef.current?.setForeColor(h);
                setQuizEditorRef(null);
            } else {
                RichText.current?.setForeColor(h);
            }

            setForeColorVisible(false);
        },
        [foreColor, RichText, RichText.current, quizEditorRef, quizOptionEditorIndex]
    );

    const changeHiliteColor = useCallback(
        (h: any) => {
            if (quizOptionEditorIndex) {
                const currRef: any = getRef(quizOptionEditorIndex);

                currRef.current?.setHiliteColor(h);
                setQuizOptionEditorIndex('');
            } else if (quizEditorRef) {
                quizEditorRef.current?.setHiliteColor(h);
                setQuizEditorRef(null);
            } else {
                RichText.current?.setHiliteColor(h);
            }

            setHiliteColorVisible(false);
        },
        [hiliteColor, RichText, RichText.current, quizEditorRef, quizOptionEditorIndex]
    );

    /**
     * @description Height for editor
     */
    const handleHeightChange = useCallback((h: any) => {
        setHeight(h);
    }, []);

    const handleCursorPosition = useCallback(
        (scrollY: any) => {
            // Positioning scroll bar
            scrollRef.current.scrollTo({ y: scrollY - 30, animated: true });
        },
        [scrollRef, scrollRef.current]
    );

    const insertEmoji = useCallback(
        (emoji) => {
            if (quizOptionEditorIndex) {
                const currRef: any = getRef(quizOptionEditorIndex);
                currRef.current?.insertText(emoji);
            } else if (quizEditorRef) {
                quizEditorRef.current?.insertText(emoji);
            } else {
                RichText.current?.insertText(emoji);
            }
        },
        [RichText, RichText.current, quizEditorRef, quizOptionEditorIndex]
    );

    const handleEmoji = useCallback(
        (editorRef: any) => {
            Keyboard.dismiss();
            // RichText.current?.blurContentEditor();
            setEmojiVisible(!emojiVisible);
            setForeColorVisible(false);
            setHiliteColorVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            if (editorRef) {
                setQuizEditorRef(editorRef);
            }
        },
        [RichText, RichText.current, emojiVisible]
    );

    const handleEmojiOptions = useCallback(
        (optionIndex: any) => {
            Keyboard.dismiss();
            // RichText.current?.blurContentEditor();
            setEmojiVisible(!emojiVisible);
            setForeColorVisible(false);
            setHiliteColorVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            setQuizOptionEditorIndex(optionIndex);
        },
        [RichText, RichText.current, emojiVisible]
    );

    const handleHiliteColor = useCallback(
        (editorRef: any) => {
            Keyboard.dismiss();
            setHiliteColorVisible(!hiliteColorVisible);
            setForeColorVisible(false);
            setEmojiVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            if (editorRef) {
                setQuizEditorRef(editorRef);
            }
        },
        [RichText, RichText.current, hiliteColorVisible]
    );

    const handleHiliteColorOptions = useCallback(
        (optionIndex: any) => {
            Keyboard.dismiss();
            setHiliteColorVisible(!hiliteColorVisible);
            setForeColorVisible(false);
            setEmojiVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            setQuizOptionEditorIndex(optionIndex);

            // Get current ref
            const currRef: any = getRef(optionIndex);
        },
        [RichText, RichText.current, hiliteColorVisible]
    );

    const handleForeColor = useCallback(
        (editorRef: any) => {
            Keyboard.dismiss();
            setForeColorVisible(!foreColorVisible);
            setHiliteColorVisible(false);
            setEmojiVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            if (editorRef) {
                setQuizEditorRef(editorRef);
            }
        },
        [RichText, RichText.current, foreColorVisible]
    );

    const handleForeColorOptions = useCallback(
        (optionIndex: any) => {
            Keyboard.dismiss();
            setForeColorVisible(!foreColorVisible);
            setHiliteColorVisible(false);
            setEmojiVisible(false);
            setInsertImageVisible(false);
            setInsertLinkVisible(false);

            setQuizOptionEditorIndex(optionIndex);
        },
        [RichText, RichText.current, foreColorVisible]
    );

    // const handleRemoveFormat = useCallback(() => {
    //     RichText.current?.setHiliteColor('#ffffff');
    //     RichText.current?.setForeColor('#000000');
    //     // RichText.current?.setFontSize(3);
    // }, [RichText, RichText.current]);

    const handleAddImage = useCallback((editorRef: any) => {
        setInsertImageVisible(true);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertLinkVisible(false);

        if (editorRef) {
            setQuizEditorRef(editorRef);
        }
    }, []);

    const handleAddImageQuizOptions = useCallback((optionIndex: any) => {
        setInsertImageVisible(true);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertLinkVisible(false);

        setQuizOptionEditorIndex(optionIndex);
    }, []);

    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, userId);
            // const url = "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1.00xw:0.669xh;0,0.190xh&resize=1200:*"

            let editorRef: any = {};

            if (url && url !== '') {
                if (quizOptionEditorIndex) {
                    editorRef = getRef(quizOptionEditorIndex);
                } else if (quizEditorRef && quizEditorRef.current) {
                    editorRef = quizEditorRef;
                } else {
                    editorRef = RichText;
                }

                editorRef.current?.focusContentEditor();

                editorRef.current?.insertHTML('<div><br/></div>');

                editorRef.current?.insertImage(url, 'width:300px');

                editorRef.current?.insertHTML('<div><br/></div>');
            }

            setInsertImageVisible(false);
        },
        [RichText, RichText.current, quizEditorRef, userId, quizOptionEditorIndex]
    );

    const handleInsertLink = useCallback(
        (editorRef: any) => {
            setInsertLinkVisible(true);
            setInsertImageVisible(false);
            setForeColorVisible(false);
            setHiliteColorVisible(false);
            setEmojiVisible(false);

            if (editorRef) {
                setQuizEditorRef(editorRef);
            }
        },
        [RichText, RichText.current]
    );

    const onInsertLink = useCallback(
        (title, link) => {
            if (quizEditorRef && quizEditorRef.current) {
                quizEditorRef.current?.insertLink(title, link);
            } else {
                RichText.current?.insertLink(title, link);
            }

            Keyboard.dismiss();
            setInsertLinkVisible(false);
        },
        [RichText, RichText.current, quizEditorRef]
    );

    console.log('Show Text Entry', showTextEntryInput);

    const renderTextEntryInputModal = () => {
        return (
            <View
                style={{
                    paddingHorizontal: 30,
                    paddingTop: 50,
                    // height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                }}
            >
                <TextInput
                    value={textEntryValue}
                    keyboardType={textEntryInputType}
                    onChangeText={(text: string) => {
                        setTextEntryValue(text);
                    }}
                    placeholder={''}
                    style={{
                        borderBottomColor: '#f2f2f2',
                        borderBottomWidth: 1,
                        fontSize: 18,
                        padding: 8,
                        // height: 50
                        width: '100%',
                        marginBottom: 30,
                    }}
                    onSubmitEditing={(e) => {
                        setShowTextEntryInput(false);
                        Keyboard.dismiss();
                    }}
                    autoFocus={true}
                />
                <TouchableOpacity
                    style={{
                        width: 120,
                        borderRadius: 15,
                        backgroundColor: '#007AFF',
                        marginTop: 20,
                    }}
                    onPress={() => {
                        setShowTextEntryInput(false);
                        Keyboard.dismiss();
                    }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            color: 'white',
                            // borderRadius: 15,
                            // backgroundColor: '#007AFF',
                            fontSize: 12,
                            // width: 120,
                            textTransform: 'uppercase',
                        }}
                    >
                        Done
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    /**
     * @description Insert equation into Cue
     */
    const insertEquation = useCallback(() => {
        let currentContent = editorRef.current.getContent();

        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + '<br/></div>';

        editorRef.current.setContent(currentContent);
        setShowEquationEditor(false);
        setEquation('');
    }, [equation, RichText, RichText.current, cue]);

    /**
     * @description Fetch user organization and role
     */
    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            setUserId(parsedUser._id);
        }
    }, []);

    /**
     * @description Initialize the quiz (Timed quiz)
     */
    const initQuiz = useCallback(async () => {
        // Need to update this for late submission

        // Late submission not allowed then no submission after deadline has passed
        if (
            (!allowLateSubmission && new Date() > deadline) ||
            // If late submission allowed, then available until should be the new deadline
            (allowLateSubmission && new Date() > availableUntil) ||
            // Once release Submission that means assignment should be locked
            props.cue.releaseSubmission
        ) {
            Alert(unableToStartQuizAlert, 'Submission period has ended.');
            return;
        }

        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            const now = new Date();
            const server = fetchAPI('');
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt: now,
            });
            server
                .mutate({
                    mutation: start,
                    variables: {
                        cueId: props.cue._id,
                        userId: user._id,
                        cue: saveCue,
                    },
                })
                .then((res) => {
                    if (res.data.quiz.start) {
                        setInitiatedAt(now);
                    }
                })
                .catch((err) => console.log(err));
            // save time to cloud first
            // after saving time in cloud, save it locally, set initiatedAt
            // quiz gets triggered
        }
    }, [props.cue._id, solutions, deadline, availableUntil, allowLateSubmission]);

    /**
     * @description Handle cue content for Submissions and Quiz responses
     */
    const handleUpdateCue = useCallback(async () => {
        if (isSubmitting) return;

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        const currCueValue: any = currCue.cue;

        // If there are no existing submissions then initiate cue obj
        let submissionObj = {
            submissionDraft: '',
            attempts: [],
        };

        let quizObj = {
            quizResponses: {},
            attempts: [],
        };

        let updatedCue = '';

        if (isQuiz) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                quizObj = JSON.parse(currCueValue);
            }

            quizObj.quizResponses = JSON.stringify({
                solutions,
                initiatedAt,
            });

            updatedCue = JSON.stringify(quizObj);
        } else if (submissionImported) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            const updatedDraft = JSON.parse(submissionDraft);
            // Submission draft will also have annotations so preserve those

            const obj = {
                ...updatedDraft,
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle,
            };

            submissionObj.submissionDraft = JSON.stringify(obj);

            updatedCue = JSON.stringify(submissionObj);
        } else {
            if (currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            submissionObj.submissionDraft = submissionDraft;

            updatedCue = JSON.stringify(submissionObj);
        }

        if (!userId) return;

        const server = fetchAPI(userId);
        server
            .mutate({
                mutation: saveSubmissionDraft,
                variables: {
                    cueId: props.cue._id,
                    userId,
                    cue: updatedCue,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.saveSubmissionDraft) {
                    setSubmissionSavedAt(new Date());
                    setFailedToSaveSubmission(false);
                } else {
                    setFailedToSaveSubmission(true);
                }
            })
            .catch((e) => {
                console.log('Failed to save submission', e);
                setFailedToSaveSubmission(true);
            });
    }, [
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft,
        isSubmitting,
        props.cue,
        userId,
    ]);

    /**
     * @description Update bookmark
     */
    const handleUpdateStarred = useCallback(async () => {
        try {
            let subCues: any = {};

            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }

            if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
                return;
            }

            const currCue = subCues[props.cueKey][props.cueIndex];

            const saveCue = {
                ...currCue,
                starred,
            };

            subCues[props.cueKey][props.cueIndex] = saveCue;

            const stringifiedCues = JSON.stringify(subCues);
            await AsyncStorage.setItem('cues', stringifiedCues);
            props.reloadCueListAfterUpdate();
        } catch (e) {}
    }, [starred]);

    /**
     * @description Handle update Cue content (Channel owner)
     */
    const handleUpdateContent = useCallback(async () => {
        setUpdatingCueContent(true);

        if (!props.cue.channelId) {
            let subCues: any = {};
            try {
                const value = await AsyncStorage.getItem('cues');
                if (value) {
                    subCues = JSON.parse(value);
                }
                if (subCues[props.cueKey].length === 0) {
                    return;
                }

                let tempOriginal = '';
                if (imported) {
                    if (title === '') {
                        Alert('Title cannot be empty');
                        setUpdatingCueContent(false);
                        return;
                    }

                    const obj = {
                        type,
                        url,
                        title,
                    };
                    tempOriginal = JSON.stringify(obj);
                } else {
                    tempOriginal = original;
                }

                const currCue = subCues[props.cueKey][props.cueIndex];

                const saveCue = {
                    ...currCue,
                    cue: tempOriginal,
                };

                subCues[props.cueKey][props.cueIndex] = saveCue;

                const stringifiedCues = JSON.stringify(subCues);
                await AsyncStorage.setItem('cues', stringifiedCues);
                props.reloadCueListAfterUpdate();

                // Update initial Value for Editor
                setInitialOriginal(tempOriginal);
                setUpdatingCueContent(false);
            } catch (e) {
                console.log('Error', e);
            }

            return;
        }

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            console.log('Value', value?.length);
            if (value) {
                subCues = JSON.parse(value);
            }

            let tempOriginal = '';
            if (imported) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const obj = {
                    type,
                    url,
                    title,
                };
                tempOriginal = JSON.stringify(obj);
            } else if (isQuiz) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const parse = JSON.parse(original);
                const obj = {
                    quizId: parse.quizId,
                    title,
                };
                tempOriginal = JSON.stringify(obj);
            } else {
                tempOriginal = original;
            }

            const currCue = subCues[props.cueKey][props.cueIndex];

            const saveCue = {
                ...currCue,
                original: tempOriginal,
            };

            subCues[props.cueKey][props.cueIndex] = saveCue;

            const stringifiedCues = JSON.stringify(subCues);
            await AsyncStorage.setItem('cues', stringifiedCues);
            props.reloadCueListAfterUpdate();

            // Update initial Value for Editor
            setInitialOriginal(tempOriginal);
            setUpdatingCueContent(false);
        } catch (e) {}
        if (subCues[props.cueKey].length === 0) {
            return;
        }
    }, [title, original, imported, type, url, isQuiz]);

    /**
     * @description Handle changes to restrict access
     */
    const handleRestrictAccessUpdate = useCallback(async () => {
        // If restrict access initially and it is now turned off
        const server = fetchAPI('');

        if (props.cue.limitedShares && !limitedShares) {
            server
                .mutate({
                    mutation: shareWithAll,
                    variables: {
                        cueId: props.cue._id,
                    },
                })
                .then((res: any) => {
                    loadChannelsAndSharedWith();
                })
                .catch((e: any) => {
                    console.log('Error', e);
                });
        } else if (limitedShares) {
            const toAdd: string[] = [];
            const toRemove: string[] = [];

            originalSelected.map((userId: string) => {
                if (!selected.includes(userId)) {
                    toRemove.push(userId);
                }
            });

            selected.map((userId: string) => {
                if (!originalSelected.includes(userId)) {
                    toAdd.push(userId);
                }
            });

            if (toAdd.length > 0) {
                server
                    .mutate({
                        mutation: shareCueWithMoreIds,
                        variables: {
                            userIds: toAdd,
                            cueId: props.cue._id,
                        },
                    })
                    .then((res: any) => {})
                    .catch((e: any) => {
                        console.log('Error', e);
                    });
            }

            if (toRemove.length > 0) {
                server
                    .mutate({
                        mutation: unshareCueWithIds,
                        variables: {
                            userIds: toRemove,
                            cueId: props.cue._id,
                        },
                    })
                    .then((res: any) => {})
                    .catch((e: any) => {
                        console.log('Error', e);
                    });
            }

            setOriginalSelected(selected);
        }
    }, [props.cue, originalSelected, selected, limitedShares]);

    /**
     * @description Handle update cue details
     */
    const handleUpdateDetails = useCallback(async () => {
        setUpdatingCueDetails(true);
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        // Perform validation for dates
        if (submission && isOwner) {
            if (initiateAt > deadline) {
                Alert('Deadline must be after available date');
                return;
            }

            if (allowLateSubmission && availableUntil < deadline) {
                Alert('Late Submission date must be after deadline');
                return;
            }
        }

        const saveCue = {
            ...currCue,
            color,
            shuffle,
            frequency,
            customCategory: customCategory === 'None' ? '' : customCategory,
            gradeWeight,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            submission,
            deadline: submission ? deadline.toISOString() : '',
            initiateAt: submission ? initiateAt.toISOString() : '',
            allowedAttempts: unlimitedAttempts ? null : allowedAttempts,
            availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : '',
            limitedShares,
        };

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        props.reloadCueListAfterUpdate();

        setUpdatingCueDetails(false);
    }, [
        submission,
        deadline,
        initiateAt,
        gradeWeight,
        customCategory,
        endPlayAt,
        color,
        frequency,
        notify,
        allowedAttempts,
        unlimitedAttempts,
        allowLateSubmission,
        availableUntil,
        isOwner,
        graded,
        limitedShares,
    ]);

    /**
     * @description Handle delete cue
     */
    const handleDelete = useCallback(async () => {
        const { title } = htmlStringParser(original);

        Alert(`Delete '${title}'?`, '', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    props.setDelete(false);
                    return;
                },
            },
            {
                text: 'Okay',
                onPress: async () => {
                    const server = fetchAPI('');
                    if (props.cue.channelId && isOwner) {
                        server
                            .mutate({
                                mutation: deleteForEveryone,
                                variables: {
                                    cueId: props.cue._id,
                                },
                            })
                            .then((res) => {
                                if (res.data.cue.deleteForEveryone) {
                                    Alert('Deleted successfully.');
                                }
                            });
                    }

                    if (!props.cue.channelId) {
                        server.mutate({
                            mutation: deleteCue,
                            variables: {
                                cueId: props.cue._id,
                            },
                        });
                    }

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem('cues');
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) {}
                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }
                    const updatedCues: any[] = [];
                    subCues[props.cueKey].map((i: any, j: any) => {
                        if (j !== props.cueIndex) {
                            updatedCues.push({ ...i });
                        }
                    });
                    subCues[props.cueKey] = updatedCues;
                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem('cues', stringifiedCues);
                    props.closeModal();
                },
            },
        ]);
    }, [props.cueIndex, props.closeModal, props.cueKey, props.cue, isOwner, original]);

    /**
     * @description Submit quiz when time gets over
     */
    /**
     * @description Submit quiz when time gets over
     */
    const submitQuizEndTime = useCallback(async () => {
        setSubmittingQuizEndTime(true);
        setIsSubmitting(true);
        const u: any = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            if (!parsedUser.email || parsedUser.email === '') {
                // cannot submit
                return;
            }
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt,
            });

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: submit,
                    variables: {
                        cue: saveCue,
                        cueId: props.cue._id,
                        userId: parsedUser._id,
                        quizId,
                    },
                })
                .then((res) => {
                    if (res.data.cue.submitModification) {
                        Alert(submissionCompleteAlert, new Date().toString(), [
                            {
                                text: 'Okay',
                                onPress: () => props.closeModal(true),
                            },
                        ]);
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                    setIsSubmitting(false);
                });
        }
    }, [cue, props.cue, isQuiz, quizId, initiatedAt, solutions]);

    const submitResponse = useCallback(() => {
        let now = new Date();
        // one minute of extra time to submit
        now.setMinutes(now.getMinutes() - 1);

        Alert(
            now >= deadline ? 'Submit Late?' : 'Submit?',
            now >= deadline ? 'The deadline for this submission has already passed' : '',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Okay',
                    onPress: async () => {
                        setIsSubmitting(true);
                        const u: any = await AsyncStorage.getItem('user');
                        if (u) {
                            const parsedUser = JSON.parse(u);
                            if (!parsedUser.email || parsedUser.email === '') {
                                // cannot submit
                                return;
                            }
                            let saveCue = '';
                            if (isQuiz) {
                                saveCue = JSON.stringify({
                                    solutions,
                                    initiatedAt,
                                });
                            } else if (submissionImported) {
                                saveCue = JSON.stringify({
                                    url: submissionUrl,
                                    type: submissionType,
                                    title: submissionTitle,
                                    annotations: '',
                                });
                            } else {
                                saveCue = submissionDraft;
                            }

                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: submit,
                                    variables: {
                                        cue: saveCue,
                                        cueId: props.cue._id,
                                        userId: parsedUser._id,
                                        quizId: isQuiz ? quizId : null,
                                    },
                                })
                                .then((res: any) => {
                                    if (res.data.cue.submitModification) {
                                        // setIsSubmitting(false);
                                        Alert(submissionCompleteAlert, new Date().toString(), [
                                            {
                                                text: 'Okay',
                                                onPress: () => props.closeModal(true),
                                            },
                                        ]);
                                    } else {
                                        Alert('Submission failed. Try again. ');
                                        setIsSubmitting(false);
                                    }
                                })
                                .catch((err: any) => {
                                    setIsSubmitting(false);
                                    Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                                });
                        }
                    },
                },
            ]
        );
    }, [
        props.cue,
        cue,
        submissionTitle,
        submissionType,
        submissionUrl,
        submissionImported,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,
        deadline,
        submissionDraft,
    ]);

    /**
     * @description Handle Submit for Submissions and Quizzes
     */
    const handleSubmit = useCallback(async () => {
        if (!isQuiz && submissionImported && submissionTitle === '') {
            Alert('Your submission has no title');
            return;
        }

        // Here check if required questions have been answered

        let requiredMissing = false;
        let requiredMissingQuestions = [];

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const solution = solutions[i];

            if (
                (!problem.questionType || problem.questionType === '' || problem.questionType === 'trueFalse') &&
                problem.required
            ) {
                // Check completeness for MCQs

                const { selected } = solution;

                let selectionMade = false;

                selected.forEach((selection: any) => {
                    if (selection.isSelected) selectionMade = true;
                });

                if (!selectionMade) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'freeResponse' && problem.required) {
                // Check completeness for free response
                const { response } = solution;

                if (response === '') {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'dragdrop' && problem.required) {
                // Drag & Drop
                let atleaseOneResponse = false;

                const { dragDropChoices } = solution;

                dragDropChoices.map((group: any[]) => {
                    if (group.length > 0) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'hotspot' && problem.required) {
                // Hotspot
                let atleaseOneResponse = false;

                const { hotspotSelection } = solution;

                hotspotSelection.map((selected: boolean) => {
                    if (selected) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'highlightText' && problem.required) {
                // Hot text
                let atleaseOneResponse = false;

                const { highlightTextSelection } = solution;

                highlightTextSelection.map((selected: boolean) => {
                    if (selected) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'inlineChoice' && problem.required) {
                // Inline choice
                let missing = false;

                const { inlineChoiceSelection } = solution;

                inlineChoiceSelection.map((selected: string) => {
                    if (selected === '') {
                        missing = true;
                    }
                });

                if (missing) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'textEntry' && problem.required) {
                // Text Entry
                let missing = false;

                const { textEntrySelection } = solution;

                textEntrySelection.map((selected: string) => {
                    if (selected === '') {
                        missing = true;
                    }
                });

                if (missing) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'equationEditor' && problem.required) {
                // Equation Editor
                const { equationResponse } = solution;

                if (equationResponse === '') {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'multipart' && problem.required) {
                // Multipart
                let missingResponse = false;

                const { multipartSelection } = solution;

                multipartSelection.map((part: any) => {
                    if (missingResponse) return;

                    let hasAnswer = false;

                    part.map((option: boolean) => {
                        if (option) {
                            hasAnswer = true;
                        }
                    });

                    if (!hasAnswer) {
                        missingResponse = true;
                    }
                });

                if (missingResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else if (problem.questionType === 'matchTableGrid' && problem.required) {
                // Match Table grid
                let missingResponse = false;

                const { matchTableSelection } = solution;

                matchTableSelection.map((row: any[]) => {
                    if (missingResponse) return;

                    let hasAnswer = false;

                    row.map((option: boolean) => {
                        if (option) {
                            hasAnswer = true;
                        }
                    });

                    if (!hasAnswer) {
                        missingResponse = true;
                    }
                });

                if (missingResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(i + 1);
                }
            } else {
                // Optional
            }
        }

        let missingString = '';

        if (requiredMissing && requiredMissingQuestions.length === 1) {
            missingString = 'Required question ' + requiredMissingQuestions[0] + ' is missing a response.';
        } else if (requiredMissing && requiredMissingQuestions.length > 1) {
            missingString = 'Required questions ' + requiredMissingQuestions.join(', ') + ' are missing responses.';
        }

        if (requiredMissing) {
            Alert(missingString, 'Would you still like to submit?', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Yes',
                    onPress: () => {
                        submitResponse();
                    },
                },
            ]);
        } else {
            submitResponse();
        }
    }, [
        props.cue,
        cue,
        submissionTitle,
        submissionType,
        submissionUrl,
        submissionImported,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,
        deadline,
        submissionDraft,
    ]);

    /**
     * @description update Cue status as read
     */
    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== 'read' && !markedAsRead) {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                const server = fetchAPI('');
                server
                    .mutate({
                        mutation: markAsRead,
                        variables: {
                            cueId: props.cue._id,
                            userId: user._id,
                        },
                    })
                    .then((res) => {
                        if (res.data.status.markAsRead) {
                            setMarkedAsRead(true);
                        }
                    })
                    .catch((err) => {});
            }
        }
    }, [props.cue, markedAsRead]);

    /**
     * @description Clear all cue content and imports
     */
    const clearAll = useCallback(() => {
        Alert(clearQuestionAlert, cannotUndoAlert, [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Clear',
                onPress: () => {
                    if (props.showOriginal) {
                        setOriginal('');
                        setInitialOriginal('');
                        setImported(false);
                        setUrl('');
                        setType('');
                        setTitle('');
                    } else {
                        setSubmissionImported(false);
                        setSubmissionDraft('');
                        setInitialSubmissionDraft('');
                        setSubmissionUrl('');
                        setSubmissionType('');
                        setSubmissionTitle('');
                    }
                },
            },
        ]);
    }, [props.showOriginal]);

    /**
     * @description Share cue
     */
    const shareCue = useCallback(async () => {
        const variables = {
            cue: props.cue.channelId ? props.cue.original : props.cue.cue,
            starred: props.cue.starred,
            channelId: shareWithChannelId,
            createdBy: props.cue.createdBy,
            color: color.toString(),
            shuffle,
            frequency,
            customCategory: customCategory === 'None' ? '' : customCategory,
            gradeWeight: graded ? gradeWeight.toString() : '0',
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            submission,
            deadline: submission ? deadline.toISOString() : '',
            initiateAt: submission ? initiateAt.toISOString() : '',
            allowedAttempts: unlimitedAttempts ? '' : allowedAttempts,
            availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : '',
            limitedShares,
            shareWithUserIds: limitedShares ? [props.cue.createdBy] : null,
        };

        const server = fetchAPI('');

        if (
            props.cue.channelId &&
            props.cue.original &&
            props.cue.original[0] === '{' &&
            props.cue.original[props.cue.original.length - 1] === '}' &&
            props.cue.original.includes('quizId')
        ) {
            const parseCue = JSON.parse(props.cue.original);

            if (parseCue.quizId) {
                server
                    .mutate({
                        mutation: duplicateQuiz,
                        variables: {
                            quizId: parseCue.quizId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.cue.duplicateQuiz) {
                            if (!res.data.cue.duplicateQuiz) {
                                Alert('Something went wrong. Try again.');
                                return;
                            }

                            variables.cue = JSON.stringify({
                                quizId: res.data.cue.duplicateQuiz,
                                title: parseCue.title,
                            });
                            server
                                .mutate({
                                    mutation: createCue,
                                    variables,
                                })
                                .then((res1) => {
                                    if (res1.data.cue.create) {
                                        Alert(sharedAlert, 'Cue has been successfully shared.');
                                    }
                                })
                                .catch((err) => {
                                    console.log('Err', err);
                                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                                });
                        }
                    });
            }
        } else {
            server
                .mutate({
                    mutation: createCue,
                    variables,
                })
                .then((res1) => {
                    if (res1.data.cue.create) {
                        Alert(sharedAlert, 'Cue has been successfully shared.');
                    }
                })
                .catch((err) => {
                    console.log('Err', err);
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        }
    }, [
        cue,
        starred,
        color,
        frequency,
        customCategory,
        shuffle,
        gradeWeight,
        submission,
        deadline,
        initiateAt,
        allowLateSubmission,
        availableUntil,
        notify,
        playChannelCueIndef,
        endPlayAt,
        shareWithChannelId,
        props.cue,
        unlimitedAttempts,
        limitedShares,
        allowedAttempts,
        graded,
    ]);

    /**
     * @description Share cue with subscribers dropdown change
     */
    const onChange = useCallback(
        (value, { action, option, removedValue }) => {
            switch (action) {
                case 'remove-value':
                case 'pop-value':
                    if (removedValue.isFixed) {
                        return;
                    }
                    break;
                case 'select-option':
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: shareCueWithMoreIds,
                            variables: {
                                cueId: props.cue._id,
                                userId: option.value,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.cue.shareCueWithMoreIds) {
                                loadChannelsAndSharedWith();
                            }
                        })
                        .catch((err) => console.log(err));
                    return;

                case 'clear':
                    value = subscribers.filter((v) => v.isFixed);
                    break;
            }
            setSelected(value);
        },
        [subscribers, props.cue]
    );

    // FUNCTIONS

    /**
     * @description Helper method to calculate difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        return Math.abs(Math.round(diff));
    };

    const omitDeep = (obj: any, key: string) => {
        const keys = Object.keys(obj);
        const newObj: any = {};
        keys.forEach((i) => {
            if (i !== key) {
                const val = obj[i];
                if (Array.isArray(val)) newObj[i] = omitDeepArrayWalk(val, key);
                else if (typeof val === 'object' && val !== null) newObj[i] = omitDeep(val, key);
                else newObj[i] = val;
            }
        });
        return newObj;
    };

    const omitDeepArrayWalk = (arr: any[], key: string) => {
        return arr.map((val) => {
            if (Array.isArray(val)) return omitDeepArrayWalk(val, key);
            else if (typeof val === 'object') return omitDeep(val, key);
            return val;
        });
    };

    /**
     * @description Update quiz
     */
    const updateQuiz = (
        instructions: string,
        problems: any,
        headers: any,
        modifiedCorrectAnswerProblems: boolean[],
        regradeChoices: string[],
        timer: boolean,
        duration: any,
        shuffleQuiz: boolean
    ) => {
        Alert('Update Quiz?', '', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    return;
                },
            },
            {
                text: 'Okay',
                onPress: async () => {
                    setLoadingAfterModifyingQuiz(true);
                    const server = fetchAPI('');

                    // Update title as well
                    handleUpdateContent();

                    // VALIDATION:
                    // Check if any question without a correct answer

                    let error = false;
                    problems.map((problem: any, problemIndex: number) => {
                        if (
                            problem.question === '' &&
                            problem.questionType !== 'textEntry' &&
                            problem.questionType !== 'inlineChoice' &&
                            problem.questionType !== 'highlightText'
                        ) {
                            alert(`Question ${problemIndex + 1} has no content.`);
                            error = true;
                        }

                        if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                            Alert(`Enter numeric points for Question ${problemIndex + 1}.`);
                            error = true;
                        }
                        let optionFound = false;

                        // If MCQ then > 2 options
                        if (!problem.questionType && problem.options.length < 2) {
                            Alert(`Question ${problemIndex + 1} must have at least 2 options.`);
                            setIsSubmitting(false);
                            error = true;
                        }

                        // If MCQ, check if any options repeat:
                        if (!problem.questionType || problem.questionType === 'trueFalse') {
                            const keys: any = {};

                            problem.options.map((option: any) => {
                                if (option.option === '' || option.option === 'formula:') {
                                    Alert(`Fill out missing options in question ${problemIndex + 1}.`);
                                    setIsSubmitting(false);
                                    error = true;
                                }

                                if (option.option in keys) {
                                    Alert(`Option repeated in question ${problemIndex + 1}.`);
                                    setIsSubmitting(false);
                                    error = true;
                                }

                                if (option.isCorrect) {
                                    optionFound = true;
                                }

                                keys[option.option] = 1;
                            });

                            if (!optionFound) {
                                Alert(`Question ${problemIndex + 1} must have at least one correct answer.`);
                                setIsSubmitting(false);
                                error = true;
                            }
                        }

                        // Drag and Drop
                        if (problem.questionType === 'dragdrop') {
                            let groupHeaderMissing = false;
                            let labelMissing = false;
                            let groupEmpty = false;

                            problem.dragDropHeaders.map((header: string) => {
                                if (!header) {
                                    groupHeaderMissing = true;
                                }
                            });

                            if (groupHeaderMissing) {
                                alert(`Group header is missing in Question ${problemIndex + 1}.`);
                                return false;
                            }

                            problem.dragDropData.map((items: any[]) => {
                                if (items.length === 0) {
                                    groupEmpty = true;
                                }

                                items.map((label: any) => {
                                    if (label.content === '') {
                                        labelMissing = true;
                                    }
                                });
                            });

                            if (labelMissing) {
                                alert(`Item missing in Question ${problemIndex + 1}.`);
                                return false;
                            }

                            if (groupEmpty) {
                                alert(`Each group must have at least 1 item in Question ${problemIndex + 1}.`);
                                return false;
                            }
                        }

                        // Hotspot
                        if (problem.questionType === 'hotspot') {
                            if (problem.imgUrl === '' || !problem.imgUrl) {
                                Alert(`Hotspot image is missing in Question ${problemIndex + 1}.`);
                                setIsSubmitting(false);
                                error = true;
                            }
                            if (!problem.hotspots || problem.hotspots.length === 0) {
                                Alert(
                                    `You must place at least two hotspot marker on the image in Question ${
                                        problemIndex + 1
                                    }.`
                                );
                                setIsSubmitting(false);
                                error = true;
                            }

                            let hasCorrectAnswer = false;

                            problem.hotspotOptions.map((option: any) => {
                                if (option.isCorrect) {
                                    hasCorrectAnswer = true;
                                }
                            });

                            if (!hasCorrectAnswer) {
                                Alert(`Hotspot question ${problemIndex + 1} must have at least correct choice.`);
                                return;
                            }
                        }

                        // Highlight Text
                        if (problem.questionType === 'highlightText') {
                            if (problem.highlightTextChoices.length < 2) {
                                Alert(
                                    `You must set multiple highlight text choices and mark one as correct in Question ${
                                        problemIndex + 1
                                    }.`
                                );
                                return;
                            }

                            let atleastOneCorrect = false;

                            problem.highlightTextChoices.map((choice: boolean) => {
                                if (choice) {
                                    atleastOneCorrect = true;
                                }
                            });

                            if (!atleastOneCorrect) {
                                Alert(
                                    `You must set at least one highlight text choice as correct in Question ${
                                        problemIndex + 1
                                    }.`
                                );
                                return;
                            }
                        }

                        // Inline Choice
                        if (problem.questionType === 'inlineChoice') {
                            if (problem.inlineChoiceHtml === '') {
                                alert(`Question ${problemIndex + 1} has no content.`);
                                return;
                            }

                            if (problem.inlineChoiceOptions.length === 0) {
                                alert(`Question ${problemIndex + 1} must have at lease one dropdown.`);
                                return;
                            }

                            let lessThan2DropdownValues = false;
                            let missingDropdownValue = false;
                            let missingCorrectAnswer = false;

                            if (problem.inlineChoiceOptions.length > 0) {
                                problem.inlineChoiceOptions.map((choices: any[]) => {
                                    if (choices.length < 2) {
                                        lessThan2DropdownValues = true;
                                    }

                                    let hasCorrect = false;
                                    choices.map((choice: any) => {
                                        if (choice.isCorrect) {
                                            hasCorrect = true;
                                        }

                                        if (choice.option === '') {
                                            missingDropdownValue = true;
                                        }
                                    });

                                    if (!hasCorrect) {
                                        missingCorrectAnswer = true;
                                    }
                                });

                                if (lessThan2DropdownValues) {
                                    alert(
                                        `Each dropdown in question ${problemIndex + 1} must have at lease two options.`
                                    );
                                    return;
                                }

                                if (missingDropdownValue) {
                                    alert(`Each dropdown option must have a value in question ${problemIndex + 1}.`);
                                    return;
                                }

                                if (missingCorrectAnswer) {
                                    alert(`Each dropdown must have a correct answer in question ${problemIndex + 1}.`);
                                    return;
                                }
                            }
                        }

                        // Text Entry
                        if (problem.questionType === 'textEntry') {
                            if (problem.textEntryHtml === '') {
                                alert(`Question ${problemIndex + 1} has no content.`);
                                return;
                            }

                            if (problem.textEntryOptions.length === 0) {
                                alert(`Text entry question ${problemIndex + 1} must have at lease one entry.`);
                                return;
                            }

                            let missingEntryAnswer = false;
                            let missingEntryPoints = false;
                            let pointsNotANumber = false;

                            problem.textEntryOptions.map((choice: any, problemIndex: number) => {
                                if (choice.option === '') {
                                    missingEntryAnswer = true;
                                }

                                if (choice.points === '') {
                                    missingEntryPoints = true;
                                }

                                if (Number.isNaN(Number(choice.points))) {
                                    pointsNotANumber = true;
                                }
                            });

                            if (missingEntryAnswer) {
                                alert(`Each Text entry option must have an answer in question ${problemIndex + 1}.`);
                                return;
                            }

                            if (missingEntryPoints) {
                                alert(`Each Text entry must have points in question ${problemIndex + 1}.`);
                                return;
                            }

                            if (pointsNotANumber) {
                                alert(`Each Text entry must have numeric points in question ${problemIndex + 1}.`);
                                return;
                            }
                        }

                        // Multipart
                        if (problem.questionType === 'multipart') {
                            if (problem.multipartQuestions[0] === '' || problem.multipartQuestions[1] === '') {
                                alert(`Part A and Part B questions cannot be empty in question ${problemIndex + 1}`);
                                return;
                            }

                            // Part A
                            let hasOneCorrect = false;
                            let hasMissingOption = false;

                            // At least two choices
                            if (problem.multipartOptions[0].length < 2) {
                                alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
                                return;
                            }

                            problem.multipartOptions[0].map((option: any) => {
                                if (option.isCorrect) {
                                    hasOneCorrect = true;
                                }

                                if (option.option === '') {
                                    hasMissingOption = true;
                                }
                            });

                            if (!hasOneCorrect) {
                                alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`);
                                return;
                            }

                            if (hasMissingOption) {
                                alert(`Part A option is empty in question ${problemIndex + 1}`);
                            }

                            if (problem.multipartOptions[0].length < 2) {
                                alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
                                return;
                            }

                            // Part B
                            problem.multipartOptions[1].map((option: any) => {
                                if (option.isCorrect) {
                                    hasOneCorrect = true;
                                }

                                if (option.option === '') {
                                    hasMissingOption = true;
                                }
                            });

                            if (!hasOneCorrect) {
                                alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`);
                                return;
                            }

                            if (hasMissingOption) {
                                alert(`Part A option is empty in question ${problemIndex + 1}`);
                            }
                        }

                        // Equation Editor
                        if (problem.questionType === 'equationEditor') {
                            if (problem.correctEquations[0] === '') {
                                alert('Correct equation cannot be empty.');
                                return;
                            }
                        }

                        // Match table grid
                        if (problem.questionType === 'matchTableGrid') {
                            let missingColHeader = false;
                            let missingRowHeader = false;
                            let missingCorrect = false;

                            problem.matchTableHeaders.map((header: string) => {
                                if (header === '') {
                                    missingColHeader = true;
                                }
                            });

                            if (missingColHeader) {
                                alert(`Column header cannot be empty in question ${problemIndex + 1}.`);
                                return;
                            }

                            problem.matchTableOptions.map((rowHeader: string) => {
                                if (rowHeader === '') {
                                    missingRowHeader = true;
                                }
                            });

                            if (missingRowHeader) {
                                alert(`Row header cannot be empty in question ${problemIndex + 1}.`);
                                return;
                            }

                            problem.matchTableChoices.map((row: any) => {
                                let hasCorrect = false;

                                if (missingCorrect) {
                                    return;
                                }

                                row.map((option: boolean) => {
                                    if (option) {
                                        hasCorrect = true;
                                    }
                                });

                                if (!hasCorrect) {
                                    missingCorrect = true;
                                }
                            });

                            if (missingCorrect) {
                                alert(`Each row must have a correct response in question ${problemIndex + 1}.`);
                                return;
                            }
                        }

                        // Check if any regrade choice has not been selected
                        modifiedCorrectAnswerProblems.map((prob: boolean, index: number) => {
                            if (prob && regradeChoices[index] === '') {
                                Alert('Select regrade option for any questions with modified correct answers.');
                                error = true;
                            }
                        });
                    });

                    if (error) {
                        setLoadingAfterModifyingQuiz(false);
                        return;
                    }

                    // Points should be a string not a number

                    const sanitizeProblems = problems.map((prob: any) => {
                        const { options } = prob;
                        const sanitizeOptions = options.map((option: any) => {
                            const clone = option;

                            delete clone.__typename;

                            return clone;
                        });

                        delete prob.__typename;
                        delete prob.problemIndex;
                        return {
                            ...prob,
                            points: prob.points.toString(),
                            options: sanitizeOptions,
                        };
                    });

                    const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;

                    let variables = {
                        cueId: props.cue._id,
                        quiz: {
                            instructions,
                            problems: sanitizeProblems,
                            headers: JSON.stringify(headers),
                            duration: timer ? durationMinutes.toString() : null,
                            shuffleQuiz,
                        },
                        modifiedCorrectAnswers: modifiedCorrectAnswerProblems.map((o: any) => (o ? 'yes' : 'no')),
                        regradeChoices: regradeChoices.map((choice: string) => (choice === '' ? 'none' : choice)),
                    };

                    const sanitizeWithoutTypename = omitDeep(variables, '__typename');

                    console.log('SanitizeWithoutTypename', sanitizeWithoutTypename);

                    server
                        .mutate({
                            mutation: modifyQuiz,
                            variables: {
                                cueId: props.cue._id,
                                quiz: {
                                    instructions,
                                    problems: sanitizeProblems,
                                    headers: JSON.stringify(headers),
                                    duration: timer ? durationMinutes.toString() : null,
                                    shuffleQuiz,
                                },
                                modifiedCorrectAnswers: modifiedCorrectAnswerProblems.map((o: any) =>
                                    o ? 'yes' : 'no'
                                ),
                                regradeChoices: regradeChoices.map((choice: string) =>
                                    choice === '' ? 'none' : choice
                                ),
                            },
                        })
                        .then((res: any) => {
                            if (res.data && res.data.quiz.modifyQuiz) {
                                const server = fetchAPI('');
                                server
                                    .query({
                                        query: getQuiz,
                                        variables: {
                                            quizId,
                                        },
                                    })
                                    .then((res) => {
                                        if (res.data && res.data.quiz.getQuiz) {
                                            setProblems(res.data.quiz.getQuiz.problems);
                                            const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);
                                            setUnmodifiedProblems(deepCopy);
                                            setInstructions(
                                                res.data.quiz.getQuiz.instructions
                                                    ? res.data.quiz.getQuiz.instructions
                                                    : ''
                                            );
                                            setHeaders(
                                                res.data.quiz.getQuiz.headers
                                                    ? JSON.parse(res.data.quiz.getQuiz.headers)
                                                    : {}
                                            );
                                            setLoadingAfterModifyingQuiz(false);
                                            setDuration(res.data.quiz.getQuiz.duration * 60);
                                            setShuffleQuiz(
                                                res.data.quiz.getQuiz.shuffleQuiz
                                                    ? res.data.quiz.getQuiz.shuffleQuiz
                                                    : false
                                            );
                                            alert('Quiz updated successfully');
                                            // Refresh all subscriber scores since there could be regrades
                                            props.reloadStatuses();
                                        }
                                    });
                            }
                        })
                        .catch((err) => console.log(err));
                },
            },
        ]);
    };

    if (loading || loadingAfterModifyingQuiz || fetchingQuiz) {
        return null;
    }

    /**
     * @description QUIZ TIMER OR DOWNLOAD/REFRESH IF UPLOADED
     */
    const renderQuizTimerOrUploadOptions = () => {
        return props.showOriginal && (imported || isQuiz) ? (
            <View style={{ flexDirection: 'column', paddingHorizontal: 10 }}>
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                        marginBottom: Dimensions.get('window').width < 768 ? 10 : 25,
                    }}
                >
                    {imported ? (
                        <View
                            style={{
                                marginBottom: 15,
                                // marginLeft: 'auto',
                                flexDirection: 'row',
                                alignItems: 'center',
                                width: '100%',
                            }}
                        >
                            {
                                <AutoGrowingTextInput
                                    value={title}
                                    editable={isOwner || !props.cue.channelId}
                                    onChange={(event: any) => setTitle(event.nativeEvent.text || '')}
                                    style={{
                                        fontFamily: 'overpass',
                                        width: '100%',
                                        maxWidth: '65%',
                                        borderBottomWidth: isOwner || !props.cue.channelId ? 1 : 0,
                                        borderBottomColor: '#f2f2f2',
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        paddingTop: 13,
                                        paddingBottom: 13,
                                        marginRight: 10,
                                        // marginTop: 12,
                                        //
                                        borderRadius: 1,
                                    }}
                                    placeholder={'Title'}
                                    placeholderTextColor="#66737C"
                                    maxHeight={200}
                                    minHeight={45}
                                    enableScrollToCaret
                                    // ref={}
                                />
                            }
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginLeft: 'auto',
                                }}
                            >
                                {isOwner || !props.cue.channelId ? (
                                    <TouchableOpacity
                                        onPress={() => clearAll()}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                        }}
                                    >
                                        <Ionicons size={22} name={'trash-outline'} color="#007AFF" />
                                    </TouchableOpacity>
                                ) : null}

                                {
                                    <TouchableOpacity
                                        onPress={async () => {
                                            // Linking.openURL(props.showOriginal ? url : submissionUrl)

                                            if (downloadOriginalInProgress) return;

                                            setDownloadOriginalInProgress(true);
                                            const res = await downloadFileToDevice(
                                                props.showOriginal ? url : submissionUrl
                                            );
                                            setDownloadOriginalInProgress(false);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            paddingLeft: 20,
                                            opacity: downloadOriginalInProgress ? 0.5 : 1,
                                        }}
                                        disabled={downloadOriginalInProgress}
                                    >
                                        <Ionicons size={22} name={'cloud-download-outline'} color="#007AFF" />
                                    </TouchableOpacity>
                                }

                                {props.showOriginal &&
                                type !== 'mp4' &&
                                type !== 'oga' &&
                                type !== 'mov' &&
                                type !== 'wmv' &&
                                type !== 'mp3' &&
                                type !== 'mpeg' &&
                                type !== 'mp2' &&
                                type !== 'wav' ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            props.setFullScreenWebviewURL(
                                                props.showOriginal ? originalPdfviewerURL : submissionPdfviewerURL
                                            );
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            paddingLeft: 20,
                                        }}
                                    >
                                        <Ionicons size={22} name={'expand-outline'} color="#007AFF" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    ) : (
                        <Text
                            style={{
                                fontSize: 18,
                                paddingRight: 15,
                                paddingTop: 20,
                                marginBottom: 10,
                                maxWidth: Dimensions.get('window').width < 768 ? '100%' : 300,
                                fontWeight: '600',
                                width: '100%',
                                fontFamily: 'Inter',
                            }}
                        >
                            {title}
                        </Text>
                    )}
                    {isQuiz ? renderQuizDetails() : null}
                </View>

                {isQuiz ? (
                    isQuizTimed ? (
                        initiatedAt && initDuration !== 0 ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                                }}
                            >
                                <CountdownCircleTimer
                                    size={120}
                                    key={initDuration}
                                    children={({ remainingTime }: any) => {
                                        if ((!remainingTime || remainingTime === 0) && !submittingQuizEndTime) {
                                            submitQuizEndTime();
                                        }

                                        if (remainingTime === 120 && !twoMinuteAlertDisplayed) {
                                            setShowTwoMinuteAlert(true);
                                        }

                                        const hours = Math.floor(remainingTime / 3600);
                                        const minutes = Math.floor((remainingTime % 3600) / 60);
                                        const seconds = remainingTime % 60;
                                        return <Text>{`${hours}h ${minutes}m ${seconds}s`}</Text>;
                                    }}
                                    isPlaying={true}
                                    duration={duration}
                                    initialRemainingTime={initDuration}
                                    colors="#007AFF"
                                />
                            </View>
                        ) : null
                    ) : null
                ) : props.cue.graded ? null : null}
            </View>
        ) : null;
    };

    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);

        return time;
    };

    const renderInitiateAtDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={initiateAt}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);

                            setInitiateAt(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showInitiateAtDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={initiateAt}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowInitiateAtDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowInitiateAtDateAndroid(false);
                            setInitiateAt(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#007AFF',
                            }}
                            onPress={() => {
                                setShowInitiateAtDateAndroid(true);
                                setShowInitiateAtTimeAndroid(false);
                                setShowDeadlineDateAndroid(false);
                                setShowDeadlineTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                setShowInitiateAtDateAndroid(false);
                                setShowInitiateAtTimeAndroid(true);
                                setShowDeadlineDateAndroid(false);
                                setShowDeadlineTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={initiateAt}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setInitiateAt(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showInitiateAtTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={initiateAt}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowInitiateAtTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowInitiateAtTimeAndroid(false);
                            setInitiateAt(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderDeadlineDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={deadline}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setDeadline(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showDeadlineDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={deadline}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowDeadlineDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowDeadlineDateAndroid(false);

                            const roundedValue = roundSeconds(currentDate);

                            setDeadline(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#007AFF',
                            }}
                            onPress={() => {
                                setShowInitiateAtDateAndroid(false);
                                setShowInitiateAtTimeAndroid(false);
                                setShowDeadlineDateAndroid(true);
                                setShowDeadlineTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                setShowInitiateAtDateAndroid(false);
                                setShowInitiateAtTimeAndroid(false);
                                setShowDeadlineDateAndroid(false);
                                setShowDeadlineTimeAndroid(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={deadline}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setDeadline(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showDeadlineTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={deadline}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowDeadlineTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowDeadlineTimeAndroid(false);
                            setDeadline(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderAvailableUntilDateTimePicker = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    marginLeft: 'auto',
                    // paddingTop: width < 768 ? 10 : 0
                }}
            >
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={availableUntil}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setAvailableUntil(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' && showAvailableUntilDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={availableUntil}
                        mode={'date'}
                        textColor={'#1f1f1f'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowAvailableUntilDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setShowAvailableUntilDateAndroid(false);
                            setAvailableUntil(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#007AFF',
                            }}
                            onPress={() => {
                                setShowAvailableUntilDateAndroid(true);
                                setShowAvailableUntilTimeAndroid(false);
                                // setShowEndDateAndroid(false);
                                // setShowEndTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                width: 150,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                setShowAvailableUntilDateAndroid(false);
                                setShowAvailableUntilTimeAndroid(true);
                                // setShowEndDateAndroid(false);
                                // setShowEndTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#007AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={availableUntil}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setAvailableUntil(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showAvailableUntilTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={availableUntil}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowAvailableUntilTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowAvailableUntilTimeAndroid(false);
                            setAvailableUntil(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    /**
     * @description Renders message when quiz is done
     */
    const renderQuizEndedMessage = () => {
        return (
            <View style={{ backgroundColor: 'white', flex: 1 }}>
                <Text
                    style={{
                        width: '100%',
                        color: '#1F1F1F',
                        fontSize: 20,
                        paddingTop: 200,
                        paddingBottom: 100,
                        paddingHorizontal: 5,
                        fontFamily: 'inter',
                        flex: 1,
                        textAlign: 'center',
                    }}
                >
                    Quiz submission ended. {remainingAttempts === 0 ? 'No attempts left. ' : ''}{' '}
                    {props.cue.releaseSubmission ? 'Quiz grades released by instructor. ' : ''}
                </Text>
            </View>
        );
    };

    /**
     * @description Render quiz submission history
     */
    const renderQuizSubmissionHistory = () => {
        const quizAttempted = quizAttempts.length > 0;

        const latestSubmission = quizAttempts[quizAttempts.length - 1];

        return (
            <View
                style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <View>
                    {quizAttempted ? (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 14 : 16, paddingLeft: 5 }}>
                                Submitted at {moment(new Date(latestSubmission.submittedAt)).format('MMMM Do, h:mm a')}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <Ionicons name="alert-circle-outline" size={22} color={'#D91D56'} />
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 14 : 16, paddingLeft: 5 }}>
                                Not Attempted
                            </Text>
                        </View>
                    )}
                </View>

                {props.cue.graded && props.cue.releaseSubmission ? (
                    <View>
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                paddingTop: 40,
                                paddingBottom: 15,
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15,
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Render submission history
     */
    const renderSubmissionHistory = () => {
        return (
            <View
                style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <View style={{ flexDirection: 'column' }}>
                    {props.cue.submittedAt && props.cue.submittedAt !== '' && viewSubmission ? (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 0 }}>
                            <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 14 : 16, paddingLeft: 5 }}>
                                {moment(new Date(props.cue.submittedAt)).format('MMMM Do, h:mm a')}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <Ionicons name="alert-circle-outline" size={22} color={'#D91D56'} />
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 14 : 16, paddingLeft: 5 }}>
                                No Submission
                            </Text>
                        </View>
                    )}

                    {!isOwner && props.cue.submittedAt !== '' && new Date(props.cue.submittedAt) >= deadline ? (
                        <View style={{ marginTop: 15, paddingLeft: 5 }}>
                            <Text
                                style={{
                                    color: '#f94144',
                                    fontSize: 18,
                                    fontFamily: 'Inter',
                                    // textAlign: 'center'
                                }}
                            >
                                LATE
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* View Submission button here */}
                {props.cue.graded && props.cue.releaseSubmission && viewSubmission ? (
                    <View style={{ paddingLeft: 20 }}>
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                // paddingTop: 20,
                                paddingBottom: 15,
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15,
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Render Quiz details
     */
    const renderQuizDetails = () => {
        let hours = Math.floor(duration / 3600);

        let minutes = Math.floor((duration - hours * 3600) / 60);

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: 20,
                    marginBottom: 10,
                    marginLeft: Dimensions.get('window').width < 768 ? '0%' : 'auto',
                }}
            >
                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                        paddingBottom: 7,
                    }}
                >
                    {problems.length} {problems.length === 1 ? 'Question' : 'Questions'}
                </Text>

                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                        paddingBottom: 7,
                    }}
                >
                    {totalQuizPoints} Points
                </Text>

                {duration === 0 ? (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            paddingBottom: 7,
                        }}
                    >
                        No Time Limit
                    </Text>
                ) : (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            paddingBottom: 7,
                        }}
                    >
                        {hours} H {minutes} min
                    </Text>
                )}

                {!isOwner ? (
                    <Text
                        style={{
                            fontFamily: 'Inter',
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            paddingBottom: 7,
                        }}
                    >
                        {allowedAttempts && allowedAttempts !== null
                            ? 'Attempts left: ' + (remainingAttempts >= 0 ? remainingAttempts : '0')
                            : 'Unlimited Attempts'}
                    </Text>
                ) : null}
            </View>
        );
    };

    const renderTimedQuiz = () => {
        return initiatedAt ? (
            <View style={{ width: '100%', flexDirection: 'column' }}>
                {isQuiz && !isOwner && !initiatedAt ? renderQuizSubmissionHistory() : null}
                <Quiz
                    // disable quiz if graded or deadline has passed
                    isOwner={isOwner}
                    submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== '' ? true : false}
                    graded={props.cue.graded}
                    hasEnded={currentDate >= deadline}
                    solutions={solutions}
                    problems={problems}
                    setSolutions={(s: any) => setSolutions(s)}
                    shuffleQuiz={shuffleQuiz}
                    instructions={instructions}
                    headers={headers}
                    modifyQuiz={updateQuiz}
                    unmodifiedProblems={unmodifiedProblems}
                    duration={duration}
                    remainingAttempts={remainingAttempts}
                    quizAttempts={quizAttempts}
                    handleAddImage={handleAddImage}
                    handleInsertLink={handleInsertLink}
                    handleHiliteColor={handleHiliteColor}
                    handleForeColor={handleForeColor}
                    handleEmoji={handleEmoji}
                    userId={userId}
                    setRef={setRef}
                    handleAddImageQuizOptions={handleAddImageQuizOptions}
                    handleHiliteColorOptions={handleHiliteColorOptions}
                    handleForeColorOptions={handleForeColorOptions}
                    handleEmojiOptions={handleEmojiOptions}
                    resetEditorOptionIndex={() => setQuizOptionEditorIndex('')}
                    // Handle Text entry inputs
                    showTextEntryInput={showTextEntryInput}
                    setShowTextEntryInput={() => setShowTextEntryInput(true)}
                    setTextEntryInputType={(inputType: string) => setTextEntryInputType(inputType)}
                    textEntryValue={textEntryValue}
                    setTextEntryValue={(value: string) => setTextEntryValue(value)}
                />
                {renderSubmissionDraftStatus()}
                {renderFooter()}
            </View>
        ) : (
            <View>
                {isQuiz && !isOwner && !initiatedAt ? renderQuizSubmissionHistory() : null}
                <View>
                    <TouchableOpacity
                        onPress={() => initQuiz()}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            marginVertical: 50,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#007AFF',
                                borderColor: '#007AFF',
                                borderWidth: 1,
                                fontSize: 12,
                                backgroundColor: '#fff',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                width: 200,
                                borderRadius: 15,
                                textTransform: 'uppercase',
                            }}
                        >
                            {PreferredLanguageText('startQuiz')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderUntimedQuiz = () => {
        return (
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: 100,
                    paddingHorizontal: 10,
                }}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollEnabled={true}
                scrollEventThrottle={1}
                // keyboardDismissMode={'on-drag'}
                overScrollMode={'always'}
                nestedScrollEnabled={true}
            >
                <View style={{ width: '100%', flexDirection: 'column' }}>
                    {isQuiz && !isOwner && !initiatedAt ? renderQuizSubmissionHistory() : null}
                    <Quiz
                        isOwner={isOwner}
                        submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== '' ? true : false}
                        graded={props.cue.graded || currentDate >= deadline}
                        solutions={solutions}
                        problems={problems}
                        setSolutions={(s: any) => setSolutions(s)}
                        shuffleQuiz={shuffleQuiz}
                        instructions={instructions}
                        headers={headers}
                        modifyQuiz={updateQuiz}
                        unmodifiedProblems={unmodifiedProblems}
                        duration={duration}
                        remainingAttempts={remainingAttempts}
                        quizAttempts={quizAttempts}
                        // New
                        handleAddImage={handleAddImage}
                        handleInsertLink={handleInsertLink}
                        handleHiliteColor={handleHiliteColor}
                        handleForeColor={handleForeColor}
                        handleEmoji={handleEmoji}
                        userId={userId}
                        setRef={setRef}
                        handleAddImageQuizOptions={handleAddImageQuizOptions}
                        handleHiliteColorOptions={handleHiliteColorOptions}
                        handleForeColorOptions={handleForeColorOptions}
                        handleEmojiOptions={handleEmojiOptions}
                        resetEditorOptionIndex={() => setQuizOptionEditorIndex('')}
                        // Handle Text entry
                        showTextEntryInput={showTextEntryInput}
                        setShowTextEntryInput={() => setShowTextEntryInput(true)}
                        setTextEntryInputType={(inputType: string) => setTextEntryInputType(inputType)}
                        textEntryValue={textEntryValue}
                        setTextEntryValue={(value: string) => setTextEntryValue(value)}
                    />
                    {renderSubmissionDraftStatus()}
                    {renderFooter()}
                </View>
            </ScrollView>
        );
    };

    const renderCueCreationImports = () => {
        return imported ? (
            type === 'mp4' ||
            type === 'oga' ||
            type === 'mov' ||
            type === 'wmv' ||
            type === 'mp3' ||
            type === 'mov' ||
            type === 'mpeg' ||
            type === 'mp2' ||
            type === 'wav' ? (
                <View style={{ width: '100%' }}>
                    <Video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: 500,
                        }}
                        source={{
                            uri: url,
                        }}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                    />
                </View>
            ) : (
                <View key={url + props.showOriginal.toString() + props.reloadViewerKey} style={{ minHeight: 550 }}>
                    <WebView source={{ uri: originalPdfviewerURL }} />
                </View>
            )
        ) : null;
    };

    const renderSubmissionImportsTitle = () => {
        return !props.showOriginal && submissionImported && !isQuiz && !viewSubmission ? (
            <View style={{ flexDirection: 'row', paddingTop: 10, marginBottom: 20 }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignSelf: 'flex-start',
                        marginLeft: 0,
                    }}
                >
                    <TextInput
                        value={submissionTitle}
                        style={styles.input}
                        placeholder={'Title'}
                        onChangeText={(val) => setSubmissionTitle(val)}
                        placeholderTextColor={'#1F1F1F'}
                    />
                </View>
                {props.cue.submittedAt && props.cue.submittedAt !== '' ? (
                    <View
                        style={{
                            alignSelf: 'flex-end',
                            flexDirection: 'row',
                        }}
                    >
                        {props.cue.graded || currentDate > deadline ? null : (
                            <TouchableOpacity
                                onPress={() => clearAll()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    marginTop: 5,
                                }}
                            >
                                {/* <Text
                                    style={{
                                        lineHeight: 34,
                                        textTransform: 'uppercase',
                                        fontSize: 12,
                                        fontFamily: 'overpass',
                                        color: '#007AFF'
                                    }}
                                >
                                    Erase
                                </Text> */}
                                <Ionicons size={22} name={'trash-outline'} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                        {submissionType !== 'mp4' &&
                        submissionType !== 'oga' &&
                        submissionType !== 'mov' &&
                        submissionType !== 'wmv' &&
                        submissionType !== 'mp3' &&
                        submissionType !== 'mpeg' &&
                        submissionType !== 'mp2' &&
                        submissionType !== 'wav' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    props.setFullScreenWebviewURL(originalPdfviewerURL);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    marginTop: 5,
                                    paddingLeft: 20,
                                }}
                            >
                                <Ionicons size={22} name={'expand-outline'} color="#007AFF" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : (
                    <View
                        style={{
                            // marginTop: 20,
                            alignSelf: 'flex-end',
                            flexDirection: 'row',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => clearAll()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                marginLeft: 15,
                                marginTop: 5,
                            }}
                        >
                            {/* <Text
                                style={{
                                    lineHeight: 34,
                                    textTransform: 'uppercase',
                                    fontSize: 12,
                                    fontFamily: 'overpass',
                                    color: '#007AFF'
                                }}
                            >
                                Erase
                            </Text> */}
                            <Ionicons size={22} name={'trash-outline'} color="#007AFF" />
                        </TouchableOpacity>
                        {submissionType !== 'mp4' &&
                        submissionType !== 'oga' &&
                        submissionType !== 'mov' &&
                        submissionType !== 'wmv' &&
                        submissionType !== 'mp3' &&
                        submissionType !== 'mpeg' &&
                        submissionType !== 'mp2' &&
                        submissionType !== 'wav' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    props.setFullScreenWebviewURL(originalPdfviewerURL);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    marginTop: 5,
                                    paddingLeft: 20,
                                }}
                            >
                                <Ionicons size={22} name={'expand-outline'} color="#007AFF" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            </View>
        ) : null;
    };

    const renderSubmissionImports = () => {
        return !props.showOriginal && submissionImported && !viewSubmission ? (
            submissionType === 'mp4' ||
            submissionType === 'oga' ||
            submissionType === 'mov' ||
            submissionType === 'wmv' ||
            submissionType === 'mp3' ||
            submissionType === 'mov' ||
            submissionType === 'mpeg' ||
            submissionType === 'mp2' ||
            submissionType === 'wav' ? (
                <View style={{ width: '100%' }}>
                    {/* <ReactPlayer url={submissionUrl} controls={true} width={'100%'} height={'100%'} /> */}
                    <Video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: 500,
                        }}
                        source={{
                            uri: submissionUrl,
                        }}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                    />
                    {renderSubmissionDraftStatus()}
                    {/* {renderFooter()} */}
                </View>
            ) : (
                <View
                    style={{ minHeight: 550 }}
                    key={
                        JSON.stringify(submissionImported) +
                        JSON.stringify(originalPdfviewerURL) +
                        props.reloadViewerKey
                    }
                >
                    <WebView
                        // style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                        source={{ uri: originalPdfviewerURL }}
                    />
                    {renderSubmissionDraftStatus()}
                    {/* {renderFooter()} */}
                </View>
            )
        ) : null;
    };

    /**
     * @description Renders main cue content
     */
    const renderMainCueContent = () => {
        return (
            <View
                style={{
                    width: '100%',
                    // minHeight: 475,
                    height: '100%',
                    paddingTop: 0,
                    backgroundColor: 'white',
                }}
            >
                <View style={{ flexDirection: 'column', width: '100%' }}>{renderQuizTimerOrUploadOptions()}</View>
                {(!props.showOriginal && viewSubmission) || loading
                    ? null
                    : isQuiz
                    ? isQuizTimed && !isOwner
                        ? renderTimedQuiz()
                        : renderUntimedQuiz()
                    : renderCueCreationImports()}

                {renderSubmissionImportsTitle()}
                {renderSubmissionImports()}

                {props.showOriginal ? null : (
                    <View
                        style={{ width: '100%', paddingBottom: 50, display: 'flex', flexDirection: 'column', flex: 1 }}
                    >
                        {!viewSubmission ? null : (
                            <View
                                key={
                                    JSON.stringify(submissionImported) +
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(props.showOriginal) +
                                    props.reloadViewerKey
                                }
                            >
                                {renderViewSubmission()}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    /**
     * @description Render cue content
     */
    const renderRichEditorOriginalCue = () => {
        if (fetchingQuiz || isQuiz) return null;

        if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
            return (
                <ScrollView
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingHorizontal: 10,
                    }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    // keyboardDismissMode={'on-drag'}
                    overScrollMode={'always'}
                    nestedScrollEnabled={true}
                >
                    <RenderHtml
                        source={{
                            html: initialOriginal,
                        }}
                        defaultTextProps={{
                            selectable: true,
                        }}
                    />
                </ScrollView>
            );
        }

        return (
            <View style={{ width: '100%', height: '100%' }}>
                <View
                    style={{
                        display: 'flex',
                        height: '100%',
                        // marginTop: editorFocus ? 0 : 10
                    }}
                >
                    <View style={{ height: '100%' }}>
                        <RichToolbar
                            style={{
                                borderColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                backgroundColor: '#fff',
                                display: editorFocus ? 'flex' : 'none',
                                maxHeight: 40,
                                height: 40,
                            }}
                            flatContainerStyle={{
                                paddingHorizontal: 12,
                            }}
                            editor={RichText}
                            disabled={false}
                            selectedIconTint={'#007AFF'}
                            disabledIconTint={'#bfbfbf'}
                            actions={[
                                actions.keyboard,
                                'insertFile',
                                actions.insertImage,
                                actions.insertVideo,
                                actions.insertLink,
                                actions.insertBulletsList,
                                actions.insertOrderedList,
                                actions.checkboxList,
                                actions.alignLeft,
                                actions.alignCenter,
                                actions.alignRight,
                                actions.blockquote,
                                actions.code,
                                actions.line,
                                // 'insertEmoji'
                            ]}
                            iconMap={{
                                [actions.keyboard]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: 'green', fontSize: 20 }]}>✓</Text>
                                ),
                                insertFile: importIcon,
                                insertEmoji: emojiIcon,
                            }}
                            insertEmoji={handleEmoji}
                            insertFile={handleUploadFile}
                            insertVideo={handleUploadAudioVideo}
                            onPressAddImage={handleAddImage}
                            onInsertLink={handleInsertLink}
                        />
                        <ScrollView
                            horizontal={false}
                            style={{
                                backgroundColor: Platform.OS === 'android' ? '#fff' : '#f2f2f2',
                                // maxHeight: editorFocus ? 340 : 'auto',
                                height: '100%',
                            }}
                            keyboardDismissMode={'none'}
                            ref={scrollRef}
                            nestedScrollEnabled={true}
                            scrollEventThrottle={20}
                            indicatorStyle={'black'}
                            showsHorizontalScrollIndicator={true}
                            persistentScrollbar={true}
                        >
                            <RichEditor
                                key={reloadEditorKey.toString()}
                                // containerStyle={{
                                //     height,
                                //     backgroundColor: '#fff',
                                //     padding: 3,
                                //     paddingTop: 5,
                                //     paddingBottom: 10,
                                //     // borderRadius: 15,
                                //     display: isQuiz || imported ? 'none' : 'flex'
                                // }}
                                ref={RichText}
                                useContainer={true}
                                style={{
                                    width: '100%',
                                    paddingHorizontal: 10,
                                    backgroundColor: '#fff',
                                    // borderRadius: 15,
                                    minHeight: '100%',
                                    display: 'flex',
                                    // borderTopWidth: 1,
                                    // borderColor: '#f2f2f2',
                                    marginBottom: editorFocus ? 0 : 200,
                                    flex: 1,
                                    height: '100%',
                                }}
                                editorStyle={{
                                    backgroundColor: '#fff',
                                    placeholderColor: '#a2a2ac',
                                    color: '#2f2f3c',
                                    contentCSSText: 'font-size: 16px; min-height: 400px;',
                                }}
                                initialContentHTML={original}
                                initialHeight={400}
                                onScroll={() => Keyboard.dismiss()}
                                placeholder={PreferredLanguageText('title')}
                                onChange={(text) => {
                                    const modifedText = text.split('&amp;').join('&');
                                    setOriginal(modifedText);
                                }}
                                onHeightChange={handleHeightChange}
                                onFocus={() => {
                                    props.setEditorFocus(true);
                                    setEditorFocus(true);
                                }}
                                onBlur={() => {
                                    props.setEditorFocus(false);
                                    setEditorFocus(false);
                                }}
                                allowFileAccess={true}
                                allowFileAccessFromFileURLs={true}
                                allowUniversalAccessFromFileURLs={true}
                                allowsFullscreenVideo={true}
                                allowsInlineMediaPlayback={true}
                                allowsLinkPreview={true}
                                allowsBackForwardNavigationGestures={true}
                                onCursorPosition={handleCursorPosition}
                            />
                        </ScrollView>

                        <RichToolbar
                            style={{
                                borderColor: '#f2f2f2',
                                borderTopWidth: 1,
                                backgroundColor: '#fff',
                                display: editorFocus ? 'flex' : 'none',
                            }}
                            flatContainerStyle={{
                                paddingHorizontal: 12,
                            }}
                            editor={RichText}
                            disabled={false}
                            // iconTint={color}
                            selectedIconTint={'#007AFF'}
                            disabledIconTint={'#bfbfbf'}
                            // onPressAddImage={that.onPressAddImage}
                            // iconSize={24}
                            // iconGap={10}
                            actions={[
                                actions.undo,
                                actions.redo,
                                actions.setBold,
                                actions.setItalic,
                                actions.setUnderline,
                                actions.setStrikethrough,
                                actions.heading1,
                                actions.heading3,
                                actions.setParagraph,
                                actions.foreColor,
                                actions.hiliteColor,
                                actions.setSuperscript,
                                actions.setSubscript,
                                // actions.removeFormat
                                // Insert stuff
                                // 'insertHTML',
                                // 'fontSize'
                            ]} // default defaultActions
                            iconMap={{
                                [actions.heading1]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                        H1
                                    </Text>
                                ),
                                [actions.heading3]: ({ tintColor }) => (
                                    <Text
                                        style={[
                                            styles.tib,
                                            {
                                                color: tintColor,
                                                fontSize: 19,
                                                paddingBottom: 1,
                                            },
                                        ]}
                                    >
                                        H3
                                    </Text>
                                ),
                                [actions.setParagraph]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                        p
                                    </Text>
                                ),
                                [actions.foreColor]: ({ tintColor }) => (
                                    <Text
                                        style={{
                                            fontSize: 19,
                                            fontWeight: 'bold',
                                            color: 'red',
                                        }}
                                    >
                                        A
                                    </Text>
                                ),
                                [actions.hiliteColor]: ({ tintColor }) => (
                                    <Text
                                        style={{
                                            color: 'black',
                                            fontSize: 19,
                                            backgroundColor: '#ffc701',
                                            paddingHorizontal: 2,
                                        }}
                                    >
                                        H
                                    </Text>
                                ),
                            }}
                            hiliteColor={handleHiliteColor}
                            foreColor={handleForeColor}
                            // removeFormat={handleRemoveFormat}
                        />

                        {/* </KeyboardAvoidingView> */}
                    </View>
                </View>

                {/* {renderSaveCueButton()} */}
            </View>
        );
    };

    /**
     * @description Renders submission
     * Make sure that when the deadline has passed that the viewSubmission is set to true by default and that (Re-Submit button is not there)
     */
    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        let now = new Date();
        now.setMinutes(now.getMinutes() - 1);
        if (!attempt) {
            return (
                <View>
                    {props.showOptions ||
                    props.showComments ||
                    isOwner ||
                    props.showOriginal ||
                    props.viewStatus ||
                    !submission ||
                    isQuiz
                        ? null
                        : renderSubmissionHistory()}

                    {(!allowLateSubmission && now >= deadline) || (allowLateSubmission && now >= availableUntil) ? (
                        <View style={{}}>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 20,
                                    paddingTop: 200,
                                    paddingBottom: 100,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                    // flex: 1,
                                    textAlign: 'center',
                                }}
                            >
                                Submission deadline has passed.
                            </Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        return (
            <View style={{ width: '100%', marginTop: 20, flex: 1, height: '100%', flexDirection: 'column' }}>
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
                {props.showOptions ||
                props.showComments ||
                isOwner ||
                props.showOriginal ||
                props.viewStatus ||
                !submission ||
                isQuiz
                    ? null
                    : renderSubmissionHistory()}
                {attempt && attempt.url !== undefined ? (
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
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
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
                                    {
                                        <TouchableOpacity
                                            onPress={async () => {
                                                if (downloadSubmissionInProgress) return;

                                                setDownloadSubmissionInProgress(true);
                                                const res = await downloadFileToDevice(attempt.url);
                                                console.log('Download result', res);
                                                setDownloadSubmissionInProgress(false);
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                                marginTop: 5,
                                                paddingLeft: 20,
                                                opacity: downloadSubmissionInProgress ? 0.5 : 1,
                                            }}
                                            disabled={downloadSubmissionInProgress}
                                        >
                                            <Ionicons size={22} name={'cloud-download-outline'} color="#007AFF" />
                                        </TouchableOpacity>
                                    }
                                </View>
                            </View>
                            {/* <ReactPlayer url={attempt.url} controls={true} width={'100%'} height={'100%'} /> */}
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
                        // Add expand button outline here
                        <View
                            style={{ width: '100%', marginTop: 25 }}
                            key={
                                JSON.stringify(viewSubmission) +
                                JSON.stringify(attempt) +
                                JSON.stringify(props.showOriginal) +
                                JSON.stringify(props.showOptions) +
                                JSON.stringify(submissionAttempts) +
                                props.reloadViewerKey
                            }
                        >
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
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
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
                                    {
                                        <TouchableOpacity
                                            onPress={async () => {
                                                if (downloadSubmissionInProgress) return;

                                                setDownloadSubmissionInProgress(true);
                                                const res = await downloadFileToDevice(attempt.url);
                                                console.log('Download result', res);
                                                setDownloadSubmissionInProgress(false);
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                                marginTop: 5,
                                                paddingLeft: 20,
                                                opacity: downloadSubmissionInProgress ? 0.5 : 1,
                                            }}
                                            disabled={downloadSubmissionInProgress}
                                        >
                                            <Ionicons size={22} name={'cloud-download-outline'} color="#007AFF" />
                                        </TouchableOpacity>
                                    }

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
                                                props.setFullScreenWebviewURL(submissionPdfviewerURL);
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                                marginTop: 5,
                                                paddingLeft: 20,
                                            }}
                                        >
                                            <Ionicons size={22} name={'expand-outline'} color="#007AFF" />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>

                            {/* <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                key={
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(attempt) +
                                    JSON.stringify(props.showOriginal) +
                                    JSON.stringify(submissionAttempts)
                                }
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}></div> */}
                            <WebView
                                key={
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(attempt) +
                                    JSON.stringify(props.showOriginal) +
                                    JSON.stringify(submissionAttempts) +
                                    props.reloadViewerKey
                                }
                                // style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                                source={{ uri: submissionPdfviewerURL }}
                                style={{ height: 550, width: '100%', flex: 1 }}
                            />
                        </View>
                    )
                ) : (
                    <View
                        style={{ width: '100%', marginTop: 25, flex: 1 }}
                        key={JSON.stringify(attempt) + props.reloadViewerKey}
                    >
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
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
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
                                {
                                    <TouchableOpacity
                                        onPress={async () => {
                                            if (downloadOriginalInProgress) return;

                                            setDownloadSubmissionInProgress(true);
                                            const res = await downloadFileToDevice(attempt.url);
                                            console.log('Download result', res);
                                            setDownloadSubmissionInProgress(false);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            paddingLeft: 20,
                                            opacity: downloadSubmissionInProgress ? 0.5 : 1,
                                        }}
                                        disabled={downloadSubmissionInProgress}
                                    >
                                        <Ionicons size={22} name={'cloud-download-outline'} color="#007AFF" />
                                    </TouchableOpacity>
                                }

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
                                            props.setFullScreenWebviewURL(submissionPdfviewerURL);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginTop: 5,
                                            paddingLeft: 20,
                                        }}
                                    >
                                        <Ionicons size={22} name={'expand-outline'} color="#007AFF" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                        {viewSubmissionTab === 'mySubmission' ? (
                            <Text className="mce-content-body htmlParser" style={{ width: '100%', color: 'black' }}>
                                {/* {parser(attempt.html)} */}
                                {attempt.html}
                            </Text>
                        ) : (
                            // <div
                            //     className="webviewer"
                            //     ref={submissionViewerRef}
                            //     style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                            //     key={viewSubmissionTab}></div>
                            <WebView
                                // key={viewSubmissionTab}
                                source={{ uri: submissionPdfviewerURL }}
                                style={{ height: 550, width: '100%', flex: 1 }}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    };

    /**
     * @description Rich editor for Submissions
     */
    const renderRichEditorModified = () => {
        return (
            <View style={{ width: '100%', height: '100%' }}>
                <View
                    style={{
                        display: 'flex',
                        height: '100%',
                        // marginTop: editorFocus ? 0 : 10
                    }}
                >
                    <View style={{ height: '100%' }}>
                        <RichToolbar
                            style={{
                                borderColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                backgroundColor: '#fff',
                                display: editorFocus ? 'flex' : 'none',
                                maxHeight: 40,
                                height: 40,
                            }}
                            flatContainerStyle={{
                                paddingHorizontal: 12,
                            }}
                            editor={RichText}
                            disabled={false}
                            selectedIconTint={'#007AFF'}
                            disabledIconTint={'#bfbfbf'}
                            actions={[
                                actions.keyboard,
                                'insertFile',
                                actions.insertImage,
                                actions.insertVideo,
                                actions.insertLink,
                                actions.insertBulletsList,
                                actions.insertOrderedList,
                                actions.checkboxList,
                                actions.alignLeft,
                                actions.alignCenter,
                                actions.alignRight,
                                actions.blockquote,
                                actions.code,
                                actions.line,
                                // 'insertEmoji'
                            ]}
                            iconMap={{
                                [actions.keyboard]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: 'green', fontSize: 20 }]}>✓</Text>
                                ),
                                insertFile: importIcon,
                                insertEmoji: emojiIcon,
                            }}
                            insertEmoji={handleEmoji}
                            insertVideo={handleUploadFile}
                            insertFile={handleUploadFile}
                            onPressAddImage={handleAddImage}
                            onInsertLink={handleInsertLink}
                            insertVideo={handleUploadAudioVideo}
                        />
                        <ScrollView
                            horizontal={false}
                            style={{
                                backgroundColor: Platform.OS === 'android' ? '#fff' : '#f2f2f2',
                                // maxHeight: editorFocus ? 340 : 'auto',
                                height: '100%',
                            }}
                            keyboardDismissMode={'none'}
                            ref={scrollRef}
                            nestedScrollEnabled={true}
                            scrollEventThrottle={20}
                            indicatorStyle={'black'}
                            showsHorizontalScrollIndicator={true}
                            persistentScrollbar={true}
                        >
                            <RichEditor
                                key={reloadEditorKey.toString()}
                                // containerStyle={{
                                //     height,
                                //     backgroundColor: '#fff',
                                //     padding: 3,
                                //     paddingTop: 5,
                                //     paddingBottom: 10,
                                //     // borderRadius: 15,
                                //     display: isQuiz || imported ? 'none' : 'flex'
                                // }}
                                ref={RichText}
                                useContainer={true}
                                style={{
                                    width: '100%',
                                    paddingHorizontal: 10,
                                    backgroundColor: '#fff',
                                    // borderRadius: 15,
                                    minHeight: '100%',
                                    display: 'flex',
                                    // borderTopWidth: 1,
                                    // borderColor: '#f2f2f2',
                                    marginBottom: editorFocus ? 0 : 200,
                                    flex: 1,
                                    height: '100%',
                                }}
                                editorStyle={{
                                    backgroundColor: '#fff',
                                    placeholderColor: '#a2a2ac',
                                    color: '#2f2f3c',
                                    contentCSSText: 'font-size: 16px; min-height: 400px;',
                                }}
                                initialContentHTML={initialSubmissionDraft}
                                initialHeight={400}
                                onScroll={() => Keyboard.dismiss()}
                                placeholder={'Submission Title'}
                                onChange={(text) => {
                                    const modifedText = text.split('&amp;').join('&');
                                    setSubmissionDraft(modifedText);
                                }}
                                onHeightChange={handleHeightChange}
                                onFocus={() => {
                                    props.setEditorFocus(true);
                                    setEditorFocus(true);
                                }}
                                onBlur={() => {
                                    props.setEditorFocus(false);
                                    setEditorFocus(false);
                                }}
                                allowFileAccess={true}
                                allowFileAccessFromFileURLs={true}
                                allowUniversalAccessFromFileURLs={true}
                                allowsFullscreenVideo={true}
                                allowsInlineMediaPlayback={true}
                                allowsLinkPreview={true}
                                allowsBackForwardNavigationGestures={true}
                                onCursorPosition={handleCursorPosition}
                            />
                        </ScrollView>

                        <RichToolbar
                            style={{
                                borderColor: '#f2f2f2',
                                borderTopWidth: 1,
                                backgroundColor: '#fff',
                                display: editorFocus ? 'flex' : 'none',
                            }}
                            flatContainerStyle={{
                                paddingHorizontal: 12,
                            }}
                            editor={RichText}
                            disabled={false}
                            // iconTint={color}
                            selectedIconTint={'#007AFF'}
                            disabledIconTint={'#bfbfbf'}
                            // onPressAddImage={that.onPressAddImage}
                            // iconSize={24}
                            // iconGap={10}
                            actions={[
                                actions.undo,
                                actions.redo,
                                actions.setBold,
                                actions.setItalic,
                                actions.setUnderline,
                                actions.setStrikethrough,
                                actions.heading1,
                                actions.heading3,
                                actions.setParagraph,
                                actions.foreColor,
                                actions.hiliteColor,
                                actions.setSuperscript,
                                actions.setSubscript,
                                // actions.removeFormat
                                // Insert stuff
                                // 'insertHTML',
                                // 'fontSize'
                            ]} // default defaultActions
                            iconMap={{
                                [actions.heading1]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                        H1
                                    </Text>
                                ),
                                [actions.heading3]: ({ tintColor }) => (
                                    <Text
                                        style={[
                                            styles.tib,
                                            {
                                                color: tintColor,
                                                fontSize: 19,
                                                paddingBottom: 1,
                                            },
                                        ]}
                                    >
                                        H3
                                    </Text>
                                ),
                                [actions.setParagraph]: ({ tintColor }) => (
                                    <Text style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}>
                                        p
                                    </Text>
                                ),
                                [actions.foreColor]: ({ tintColor }) => (
                                    <Text
                                        style={{
                                            fontSize: 19,
                                            fontWeight: 'bold',
                                            color: 'red',
                                        }}
                                    >
                                        A
                                    </Text>
                                ),
                                [actions.hiliteColor]: ({ tintColor }) => (
                                    <Text
                                        style={{
                                            color: 'black',
                                            fontSize: 19,
                                            backgroundColor: '#ffc701',
                                            paddingHorizontal: 2,
                                        }}
                                    >
                                        H
                                    </Text>
                                ),
                            }}
                            hiliteColor={handleHiliteColor}
                            foreColor={handleForeColor}
                            // removeFormat={handleRemoveFormat}
                        />
                    </View>
                </View>
            </View>
            // <Editor
            //     onInit={(evt, editor) => (editorRef.current = editor)}
            //     initialValue={initialSubmissionDraft}
            //     disabled={
            //         props.cue.releaseSubmission ||
            //         (!allowLateSubmission && new Date() > deadline) ||
            //         (allowLateSubmission && new Date() > availableUntil)
            //     }
            //     apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
            //     init={{
            //         skin: 'snow',
            //         branding: false,
            //         placeholder: 'Content...',
            //         readonly:
            //             props.cue.releaseSubmission ||
            //             (!allowLateSubmission && new Date() > deadline) ||
            //             (allowLateSubmission && new Date() > availableUntil),
            //         min_height: 500,
            //         paste_data_images: true,
            //         images_upload_url: 'https://api.learnwithcues.com/api/imageUploadEditor',
            //         mobile: {
            //             plugins:
            //                 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
            //         },
            //         plugins:
            //             'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
            //         menu: {
            //             // this is the complete default configuration
            //             file: { title: 'File', items: 'newdocument' },
            //             edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
            //             insert: { title: 'Insert', items: 'link media | template hr' },
            //             view: { title: 'View', items: 'visualaid' },
            //             format: {
            //                 title: 'Format',
            //                 items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'
            //             },
            //             table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
            //             tools: { title: 'Tools', items: 'spellchecker code' }
            //         },
            //         setup: (editor: any) => {
            //             const equationIcon =
            //                 '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
            //             editor.ui.registry.addIcon('formula', equationIcon);

            //             editor.ui.registry.addButton('formula', {
            //                 icon: 'formula',
            //                 // text: "Upload File",
            //                 tooltip: 'Insert equation',
            //                 onAction: () => {
            //                     setShowEquationEditor(!showEquationEditor);
            //                 }
            //             });

            //             editor.ui.registry.addButton('upload', {
            //                 icon: 'upload',
            //                 tooltip: 'Import File (pdf, docx, media, etc.)',
            //                 onAction: async () => {
            //                     const res = await handleFile(false);

            //                     if (!res || res.url === '' || res.type === '') {
            //                         return;
            //                     }

            //                     updateAfterFileImport(res.url, res.type);
            //                 }
            //             });
            //         },
            //         // menubar: 'file edit view insert format tools table tc help',
            //         menubar: false,
            //         toolbar:
            //             props.cue.releaseSubmission ||
            //             (!allowLateSubmission && new Date() > deadline) ||
            //             (allowLateSubmission && new Date() > availableUntil)
            //                 ? false
            //                 : 'undo redo | bold italic underline strikethrough | table image upload link media | forecolor backcolor |  numlist bullist checklist | fontselect fontSizeselect formatselect | formula superscript subscript charmap emoticons | alignleft aligncenter alignright alignjustify | casechange permanentpen formatpainter removeformat pagebreak | preview print | outdent indent ltr rtl ',
            //         importcss_append: true,
            //         image_caption: true,
            //         quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            //         noneditable_noneditable_class: 'mceNonEditable',
            //         toolbar_mode: 'sliding',
            //         tinycomments_mode: 'embedded',
            //         content_style: '.mymention{ color: gray; }',
            //         // contextmenu: 'link image imagetools table configurepermanentpen',
            //         a11y_advanced_options: true,
            //         extended_valid_elements:
            //             'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
            //         // skin: useDarkMode ? 'oxide-dark' : 'oxide',
            //         // content_css: useDarkMode ? 'dark' : 'default',
            //     }}
            //     onChange={(e: any) => setSubmissionDraft(e.target.getContent())}
            // />
        );
    };

    /**
     * @description Share with component
     */
    const renderShareWithOptions = () => {
        return props.cue.channelId !== '' && isOwner ? (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    flexDirection: 'column',
                    paddingTop: 40,
                }}
            >
                <View
                    style={{
                        paddingBottom: 15,
                        backgroundColor: 'white',
                        flex: 1,
                        flexDirection: 'row',
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                            // textTransform: 'uppercase'
                        }}
                    >
                        {props.cue.channelId && props.cue.channelId !== '' ? 'Restrict Access' : 'Saved In'}
                    </Text>
                </View>
                <View>
                    {props.cue.channelId !== '' ? (
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        height: 40,
                                        marginRight: 10,
                                    }}
                                >
                                    <Switch
                                        value={limitedShares}
                                        onValueChange={() => {
                                            setLimitedShares(!limitedShares);
                                        }}
                                        thumbColor={'#f4f4f6'}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#007AFF',
                                        }}
                                        style={{
                                            transform: [
                                                { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                                { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                            ],
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    ) : null}
                    {limitedShares ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                marginTop: 25,
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    height: isRestrictAccessDropdownOpen ? getDropdownHeight(subscribers.length) : 50,
                                }}
                            >
                                <DropDownPicker
                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                    multiple={true}
                                    open={isRestrictAccessDropdownOpen}
                                    value={selected}
                                    items={subscribers}
                                    setOpen={setIsRestrictAccessDropdownOpen}
                                    setValue={(val: any) => {
                                        setSelected(val);
                                    }}
                                    style={{
                                        borderWidth: 0,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#f2f2f2',
                                        // elevation: !showFrequencyDropdown ? 0 : 2
                                    }}
                                    dropDownContainerStyle={{
                                        borderWidth: 0,
                                        // elevation: !showFrequencyDropdown ? 0 : 2
                                    }}
                                    containerStyle={{
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 1,
                                            height: 3,
                                        },
                                        shadowOpacity: !isRestrictAccessDropdownOpen ? 0 : 0.08,
                                        shadowRadius: 12,
                                    }}
                                    textStyle={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                                        fontFamily: 'overpass',
                                    }}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Submission required component
     */
    const renderSubmissionRequiredOptions = () => {
        return props.cue.channelId !== '' ? (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    maxWidth: props.isOwner ? 600 : 'auto',
                }}
            >
                <View
                    style={{
                        width: '100%',
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: 'white',
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        {PreferredLanguageText('submissionRequired')}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'column',
                        backgroundColor: 'white',
                    }}
                >
                    {isOwner ? (
                        <View
                            style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10,
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Switch
                                disabled={isQuiz}
                                value={submission}
                                onValueChange={() => {
                                    setSubmission(!submission);
                                }}
                                thumbColor={'#f4f4f6'}
                                trackColor={{
                                    false: '#f4f4f6',
                                    true: '#007AFF',
                                }}
                                style={{
                                    transform: [
                                        { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                        { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                    ],
                                }}
                            />
                        </View>
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: '#fff',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {!submission ? PreferredLanguageText('no') : null}
                            </Text>
                        </View>
                    )}

                    <View style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', width: '100%' }}>
                        {submission ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: Platform.OS === 'android' ? 'column' : 'row',
                                    backgroundColor: 'white',
                                    alignItems: Platform.OS === 'android' ? 'flex-start' : 'center',
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                        paddingRight: 10,
                                    }}
                                >
                                    Available
                                    {Platform.OS === 'android' && isOwner
                                        ? ': ' + moment(new Date(initiateAt)).format('MMMM Do YYYY, h:mm a')
                                        : null}
                                </Text>
                                {isOwner ? (
                                    renderInitiateAtDateTimePicker()
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {moment(new Date(initiateAt)).format('MMMM Do, h:mm a')}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#fff',
                                }}
                            />
                        )}

                        {submission ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: Platform.OS === 'android' ? 'column' : 'row',
                                    backgroundColor: 'white',
                                    alignItems: Platform.OS === 'android' ? 'flex-start' : 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                        paddingRight: 10,
                                    }}
                                >
                                    Deadline
                                    {Platform.OS === 'android' && isOwner
                                        ? ': ' + moment(new Date(deadline)).format('MMMM Do YYYY, h:mm a')
                                        : null}
                                </Text>
                                {isOwner ? (
                                    renderDeadlineDateTimePicker()
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {moment(new Date(deadline)).format('MMMM Do, h:mm a')}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#fff',
                                }}
                            />
                        )}
                    </View>
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Grade weight component
     */
    const renderGradeOptions = () => {
        return submission ? (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    flexDirection: 'column',
                    paddingTop: 40,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        paddingBottom: 15,
                        backgroundColor: 'white',
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        Grade Weight
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    {isOwner ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                flex: 1,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10,
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={graded}
                                    onValueChange={() => setGraded(!graded)}
                                    thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#007AFF',
                                    }}
                                    style={{
                                        transform: [
                                            { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                            { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                        ],
                                    }}
                                />
                            </View>
                        </View>
                    ) : null}
                    {graded ? (
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white',
                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                alignItems: 'center',
                                marginLeft: isOwner ? 'auto' : 0,
                            }}
                        >
                            {isOwner ? (
                                <TextInput
                                    value={gradeWeight.toString()}
                                    style={{
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0,
                                        width: 80,
                                    }}
                                    placeholder={'0-100'}
                                    onChangeText={(val) => setGradeWeight(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            ) : null}
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingHorizontal: isOwner ? 10 : 0,
                                    fontFamily: 'Overpass',
                                }}
                            >
                                {!isOwner ? gradeWeight : null} {PreferredLanguageText('percentageOverall')}
                            </Text>
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Overpass',
                            }}
                        >
                            0%
                        </Text>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Late submission option
     */
    const renderLateSubmissionOptions = () => {
        return submission ? (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    flexDirection: 'column',
                    paddingTop: 40,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: 'white',
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        Late Submission
                    </Text>
                </View>
                <View style={{}}>
                    {isOwner ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10,
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={allowLateSubmission}
                                    onValueChange={() => setAllowLateSubmission(!allowLateSubmission)}
                                    thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#007AFF',
                                    }}
                                    style={{
                                        transform: [
                                            { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                            { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                        ],
                                    }}
                                />
                            </View>
                        </View>
                    ) : null}
                    {allowLateSubmission ? (
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                backgroundColor: 'white',
                                alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
                                paddingTop: Platform.OS === 'ios' ? 0 : 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'inter',
                                }}
                            >
                                {!isOwner
                                    ? allowLateSubmission
                                        ? 'Allowed until  ' + moment(new Date(availableUntil)).format('MMMM Do, h:mm a')
                                        : 'No'
                                    : Platform.OS === 'android'
                                    ? 'Allowed until: ' + moment(new Date(availableUntil)).format('MMMM Do, h:mm a')
                                    : 'Allowed until'}
                            </Text>
                            {isOwner && allowLateSubmission ? renderAvailableUntilDateTimePicker() : null}
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Overpass',
                            }}
                        >
                            No
                        </Text>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Number of attempts component
     */
    const renderAttemptsOptions = () => {
        return isQuiz ? (
            !isOwner ? (
                <View
                    style={{
                        width: '100%',
                        maxWidth: props.isOwner ? 600 : 'auto',
                        flexDirection: 'column',
                        paddingTop: 40,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Allowed Attempts
                        </Text>
                    </View>

                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            backgroundColor: 'white',
                            justifyContent: 'flex-start',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#1F1F1F',
                                textAlign: 'right',
                                paddingRight: 10,
                                fontFamily: 'Overpass',
                            }}
                        >
                            {unlimitedAttempts ? 'Unlimited' : allowedAttempts}
                        </Text>
                    </View>
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        maxWidth: props.isOwner ? 600 : 'auto',
                        flexDirection: 'column',
                        paddingTop: 40,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Unlimited Attempts
                        </Text>
                    </View>
                    <View>
                        <View
                            style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10,
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Switch
                                value={unlimitedAttempts}
                                onValueChange={() => {
                                    if (!unlimitedAttempts) {
                                        setAllowedAttemps('');
                                    } else {
                                        setAllowedAttemps('1');
                                    }
                                    setUnlimitedAttempts(!unlimitedAttempts);
                                }}
                                thumbColor={'#f4f4f6'}
                                trackColor={{
                                    false: '#f4f4f6',
                                    true: '#007AFF',
                                }}
                                style={{
                                    transform: [
                                        { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                        { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                    ],
                                }}
                            />
                        </View>

                        {!unlimitedAttempts ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                                    backgroundColor: 'white',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={styles.text}>Allowed attempts</Text>
                                <TextInput
                                    value={allowedAttempts}
                                    style={{
                                        width: 100,
                                        textAlign: 'center',
                                        borderBottomColor: '#F8F9FA',
                                        borderBottomWidth: 1,
                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                        marginLeft: 10,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0,
                                    }}
                                    placeholder={''}
                                    onChangeText={(val) => {
                                        if (Number.isNaN(Number(val))) return;
                                        setAllowedAttemps(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            </View>
                        ) : null}
                    </View>
                </View>
            )
        ) : null;
    };

    /**
     * @description Category component
     */
    const renderCategoryOptions = () => {
        if (!initializedCustomCategories) return;

        return (props.cue.channelId && props.cue.channelId !== '' && isOwner) ||
            !props.channelId ||
            props.channelId === '' ? (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    borderRightWidth: 0,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    paddingTop: 40,
                    paddingBottom: 20,
                    borderColor: '#f2f2f2',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: 15,
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        {PreferredLanguageText('category')}
                    </Text>
                </View>
                <View style={{ width: '100%' }}>
                    {props.cue.channelId && !props.channelOwner ? (
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white',
                            }}
                        >
                            <View style={{ width: '100%', backgroundColor: 'white' }}>
                                <View style={styles.colorBar}>
                                    <TouchableOpacity style={styles.allGrayOutline} onPress={() => {}}>
                                        <Text
                                            style={{
                                                color: '#000000',
                                                lineHeight: 20,
                                                fontSize: 12,
                                            }}
                                        >
                                            {props.cue.customCategory === ''
                                                ? PreferredLanguageText('none')
                                                : props.cue.customCategory}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                // alignItems: 'center',
                                backgroundColor: 'white',
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    width: '90%',
                                    height: isCategoryDropdownOpen ? getDropdownHeight(categoryOptions.length) : 50,
                                }}
                            >
                                {addCustomCategory ? (
                                    <View style={styles.colorBar}>
                                        <TextInput
                                            value={customCategory}
                                            style={{
                                                borderRadius: 0,
                                                borderColor: '#f2f2f2',
                                                borderBottomWidth: 1,
                                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                padding: 10,
                                                paddingVertical: 15,
                                                width: '100%',
                                            }}
                                            placeholder={'Enter Category'}
                                            onChangeText={(val) => {
                                                setCustomCategory(val);
                                            }}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                    </View>
                                ) : (
                                    <DropDownPicker
                                        listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                        open={isCategoryDropdownOpen}
                                        value={customCategory}
                                        items={categoryOptions}
                                        setOpen={setIsCategoryDropdownOpen}
                                        setValue={setCustomCategory}
                                        style={{
                                            borderWidth: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f2f2f2',
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        dropDownContainerStyle={{
                                            borderWidth: 0,
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        containerStyle={{
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 1,
                                                height: 3,
                                            },
                                            shadowOpacity: !isCategoryDropdownOpen ? 0 : 0.08,
                                            shadowRadius: 12,
                                        }}
                                        textStyle={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                                            fontFamily: 'overpass',
                                        }}
                                    />
                                )}
                            </View>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    marginLeft: 'auto',
                                    paddingTop: 20,
                                    paddingRight: Dimensions.get('window').width < 768 ? 10 : 0,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        if (addCustomCategory) {
                                            setCustomCategory('None');
                                            setAddCustomCategory(false);
                                        } else {
                                            setCustomCategory('');
                                            setAddCustomCategory(true);
                                        }
                                    }}
                                    style={{ backgroundColor: 'white' }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'right',
                                            lineHeight: 20,
                                            width: '100%',
                                        }}
                                    >
                                        <Ionicons
                                            name={addCustomCategory ? 'close' : 'create-outline'}
                                            size={18}
                                            color={'#000000'}
                                        />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Priority component
     */
    const renderPriorityOptions = () => {
        return (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    borderRightWidth: 0,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    paddingTop: 40,
                    paddingBottom: 50,
                    borderColor: '#f2f2f2',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: 15,
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        {PreferredLanguageText('priority')}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                    }}
                >
                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                        <ScrollView
                            style={{ ...styles.colorBar, height: 20 }}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                        >
                            {colorChoices.map((c: string, i: number) => {
                                return (
                                    <View
                                        style={color == i ? styles.colorContainerOutline : styles.colorContainer}
                                        key={Math.random()}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: colorChoices[i],
                                            }}
                                            onPress={() => {
                                                setColor(i);
                                            }}
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * @description Share component
     */
    const renderForwardOptions = () => {
        const filterChannelsWithoutCurrent = channels.filter((channel: any) => channel._id !== props.channelId);

        const channelOptions = [{ _id: 'None', name: 'None' }, ...filterChannelsWithoutCurrent];

        return channels.length === 0 || !isOwner ? null : (
            <View
                style={{
                    width: '100%',
                    maxWidth: props.isOwner ? 600 : 'auto',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    borderRightWidth: 0,
                    borderColor: '#f2f2f2',
                    paddingTop: 40,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: 15,
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        Forward
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            height: isShareWithDropdownOpen ? getDropdownHeight(channelOptions.length) : 50,
                            width: '90%',
                            marginBottom: 20,
                        }}
                    >
                        <DropDownPicker
                            listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                            open={isShareWithDropdownOpen}
                            value={shareWithChannelId}
                            items={channelOptions.map((channel: any) => {
                                return {
                                    value: channel._id,
                                    label: channel.name,
                                };
                            })}
                            setOpen={setIsShareWithDropdownOpen}
                            setValue={setShareWithChannelId}
                            style={{
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                                // elevation: !showFrequencyDropdown ? 0 : 2
                            }}
                            dropDownContainerStyle={{
                                borderWidth: 0,
                                // elevation: !showFrequencyDropdown ? 0 : 2
                            }}
                            containerStyle={{
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 1,
                                    height: 3,
                                },
                                shadowOpacity: !isShareWithDropdownOpen ? 0 : 0.08,
                                shadowRadius: 12,
                            }}
                            textStyle={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                                fontFamily: 'overpass',
                            }}
                        />
                    </View>
                    <View
                        style={{
                            marginLeft: 'auto',
                            paddingTop: 20,
                            paddingRight: Dimensions.get('window').width < 768 ? 10 : 0,
                        }}
                    >
                        <TouchableOpacity
                            disabled={shareWithChannelId === 'None'}
                            onPress={() => {
                                Alert(
                                    'Forward cue?',
                                    'All unsaved changes in Details will also reflect in the forwarded cue.',
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
                                            onPress: () => {
                                                shareCue();
                                            },
                                        },
                                    ]
                                );
                            }}
                            style={{ backgroundColor: 'white' }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 20,
                                    width: '100%',
                                }}
                            >
                                <Ionicons
                                    name={'share-outline'}
                                    size={18}
                                    color={shareWithChannelId === 'None' ? '#000000' : '#007AFF'}
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * @description Reminder component
     */
    const renderReminderOptions = () => {
        return (
            <View
                style={{
                    width: '100%',
                    paddingTop: 15,
                    flexDirection: 'column',
                }}
            >
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Remind
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            // width: "100%",
                            height: 40,
                        }}
                    >
                        <Switch
                            value={notify}
                            onValueChange={() => {
                                if (notify) {
                                    setFrequency('0');
                                } else {
                                    setFrequency('1-D');
                                }
                                setPlayChannelCueIndef(true);
                                setNotify(!notify);
                            }}
                            thumbColor={'#f4f4f6'}
                            trackColor={{
                                false: '#f4f4f6',
                                true: '#007AFF',
                            }}
                            style={{
                                transform: [
                                    { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                    { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                ],
                            }}
                        />
                    </View>
                </View>
                {notify ? (
                    <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                        <View
                            style={{
                                // width: 300,
                                flex: 1,
                                flexDirection: 'row',
                                paddingBottom: 15,
                                backgroundColor: 'white',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Repeat Reminder
                            </Text>
                        </View>
                        <View style={{}}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    alignSelf: width < 768 ? 'flex-start' : 'flex-end',
                                }}
                            >
                                <Switch
                                    value={!shuffle}
                                    onValueChange={() => setShuffle(!shuffle)}
                                    thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#007AFF',
                                    }}
                                    style={{
                                        transform: [
                                            { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                            { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                        ],
                                    }}
                                />
                            </View>
                            {!shuffle ? (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                            color: '#1F1F1F',
                                            textAlign: 'right',
                                            paddingRight: 10,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {PreferredLanguageText('remindEvery')}
                                    </Text>
                                    {/* <label style={{ width: 140 }}>
                                        <MobiscrollSelect
                                            theme="ios"
                                            themeVariant="light"
                                            touchUi={true}
                                            value={frequency}
                                            rows={timedFrequencyOptions.length}
                                            onChange={(val: any) => {
                                                setFrequency(val.value);
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false
                                                }
                                            }}
                                            data={timedFrequencyOptions.map((freq: any) => {
                                                return {
                                                    value: freq.value,
                                                    text: freq.label
                                                };
                                            })}
                                        />
                                    </label> */}
                                    <DropDownPicker
                                        open={isFrequencyDropdownOpen}
                                        value={frequency}
                                        items={timedFrequencyOptions.map((freq: any) => {
                                            return {
                                                value: freq.value,
                                                label: freq.label,
                                            };
                                        })}
                                        setOpen={setIsFrequencyDropdownOpen}
                                        setValue={setFrequency}
                                        style={{
                                            borderWidth: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f2f2f2',
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        dropDownContainerStyle={{
                                            borderWidth: 0,
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        containerStyle={{
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 1,
                                                height: 3,
                                            },
                                            shadowOpacity: !isFrequencyDropdownOpen ? 0 : 0.08,
                                            shadowRadius: 12,
                                        }}
                                        textStyle={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                                            fontFamily: 'overpass',
                                        }}
                                    />
                                    {/* <Menu
                                        onSelect={(cat: any) => {
                                            setFrequency(cat.value)
                                            setFrequencyName(cat.label)
                                        }}>
                                        <MenuTrigger>
                                            <Text style={{
                                                fontSize: 12,
                                                color: "#1F1F1F",
                                                textAlign: "right",
                                                paddingRight: 10,
                                                paddingTop: 3
                                            }}>
                                                {frequencyName}<Ionicons name='chevron-down-outline' size={15} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#f2f2f2',
                                                overflow: 'scroll',
                                                maxHeight: '100%'
                                            }
                                        }}>
                                            {
                                                timedFrequencyOptions.map((item: any) => {
                                                    return <MenuOption
                                                        value={item}>
                                                        <Text>
                                                            {item.value === '0' && props.channelId !== '' ? 'Once' : item.label}
                                                        </Text>
                                                    </MenuOption>
                                                })
                                            }
                                        </MenuOptions>
                                    </Menu> */}
                                </View>
                            ) : (
                                <View
                                    style={{
                                        width: '100%',
                                        flex: 1,
                                        flexDirection: 'row',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <View
                                            style={{
                                                height: 5,
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: '#1F1F1F',
                                                textAlign: 'right',
                                                paddingRight: 10,
                                                marginTop: 5,
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {PreferredLanguageText('remindOn')}
                                        </Text>
                                    </View>
                                    <View>
                                        <MobiscrollDatePicker
                                            controls={['date', 'time']}
                                            touchUi={true}
                                            theme="ios"
                                            value={endPlayAt}
                                            themeVariant="light"
                                            inputProps={{
                                                placeholder: 'Please Select...',
                                            }}
                                            onChange={(event: any) => {
                                                const date = new Date(event.value);
                                                if (date < new Date()) return;

                                                setEndPlayAt(date);
                                            }}
                                            responsive={{
                                                xsmall: {
                                                    controls: ['date', 'time'],
                                                    display: 'bottom',
                                                    touchUi: true,
                                                },
                                                medium: {
                                                    controls: ['date', 'time'],
                                                    display: 'anchored',
                                                    touchUi: false,
                                                },
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
                {notify && !shuffle ? (
                    <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                flex: 1,
                                paddingBottom: 15,
                                backgroundColor: 'white',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Remind Indefinitely
                            </Text>
                        </View>
                        <View>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                    flexDirection: 'row',
                                }}
                            >
                                <Switch
                                    value={playChannelCueIndef}
                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                    thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#007AFF',
                                    }}
                                    style={{
                                        transform: [
                                            { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                            { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                        ],
                                    }}
                                />
                            </View>
                            {playChannelCueIndef ? null : (
                                <View
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Text style={styles.text}>{PreferredLanguageText('remindTill')}</Text>
                                    <MobiscrollDatePicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={endPlayAt}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Please Select...',
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            if (date < new Date()) return;

                                            setEndPlayAt(date);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true,
                                            },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderSubmissionDraftStatus = () => {
        if (isOwner) {
            return null;
        }

        const format = moment(submissionSavedAt).format('h:mm a');

        if (failedToSaveSubmission) {
            return (
                <View
                    style={{
                        paddingVertical: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="close-outline" color={'#F94144'} size={22} />
                    <Text
                        style={{
                            fontFamily: 'overpass',
                            paddingLeft: 5,
                            paddingTop: 4,
                            fontSize: 14,
                        }}
                    >
                        Failed to save. Last saved at {format}. Check Internet connection.
                    </Text>
                </View>
            );
        } else {
            return (
                <View
                    style={{
                        paddingVertical: 20,
                        flexDirection: 'row',
                    }}
                >
                    <Ionicons name="checkmark-outline" color={'#35AC78'} size={22} />
                    <Text
                        style={{
                            fontFamily: 'overpass',
                            paddingLeft: 5,
                            paddingTop: 4,
                            fontSize: 14,
                        }}
                    >
                        Saved at {format}
                    </Text>
                </View>
            );
        }
    };

    /**
     * @description Buttons for Submission
     */
    const renderFooter = () => {
        return (
            <View
                key={
                    JSON.stringify(isQuiz) +
                    JSON.stringify(isQuizTimed) +
                    JSON.stringify(loading) +
                    JSON.stringify(submission) +
                    JSON.stringify(props.cue.channelId) +
                    JSON.stringify(initiatedAt)
                }
                style={styles.footer}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        // height: 50,
                        paddingTop: 10,
                        backfaceVisibility: 'hidden',
                    }}
                >
                    {!isOwner && props.cue.channelId && props.cue.channelId !== '' && submission ? (
                        <TouchableOpacity
                            disabled={
                                // Late submission not allowed then no submission after deadline has passed
                                (!allowLateSubmission && new Date() > deadline) ||
                                // If late submission allowed, then available until should be the new deadline
                                (allowLateSubmission && new Date() > availableUntil) ||
                                // Once release Submission that means assignment should be locked
                                props.cue.releaseSubmission ||
                                // if timed quiz not initiated
                                (isQuiz && isQuizTimed && !initiatedAt) ||
                                // If no more remaining attempts for quiz
                                (isQuiz && remainingAttempts === 0) ||
                                isSubmitting
                            }
                            onPress={() => handleSubmit()}
                            style={{ borderRadius: 15, backfaceVisibility: 'hidden' }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#007AFF',
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    height: 35,
                                    textTransform: 'uppercase',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {(!allowLateSubmission && new Date() > deadline) ||
                                (allowLateSubmission && new Date() > availableUntil) ||
                                (isQuiz && remainingAttempts === 0) ||
                                (props.cue.releaseSubmission && !props.cue.graded)
                                    ? 'Submission Ended'
                                    : props.cue.graded && !isQuiz
                                    ? PreferredLanguageText('graded')
                                    : isSubmitting
                                    ? 'Submitting...'
                                    : PreferredLanguageText('submit')}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    if (initiateAt > new Date() && !isOwner) {
        return (
            <View style={{ minHeight: Dimensions.get('window').height }}>
                <View style={{ backgroundColor: 'white', flex: 1 }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 20,
                            paddingTop: 200,
                            paddingBottom: 100,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                            flex: 1,
                            textAlign: 'center',
                        }}
                    >
                        Available from {moment(initiateAt).format('MMMM Do YYYY, h:mm a')}
                    </Text>
                </View>
            </View>
        );
    }

    const wrapMainCueContentWithScrollView = () => {
        return isQuiz || imported || !props.showOriginal ? (
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: 100,
                    paddingHorizontal: 10,
                }}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollEnabled={true}
                scrollEventThrottle={1}
                // keyboardDismissMode={'on-drag'}
                overScrollMode={'always'}
                nestedScrollEnabled={true}
            >
                {renderMainCueContent()}
            </ScrollView>
        ) : (
            renderRichEditorOriginalCue()
        );
    };

    // MAIN RETURN
    return (
        <View
            style={{
                width: '100%',
                backgroundColor: 'white',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                // paddingBottom: 50,
                height: '100%',
            }}
        >
            {(props.showOriginal &&
                ((remainingAttempts !== 0 &&
                    !(!allowLateSubmission && new Date() > deadline) &&
                    !(allowLateSubmission && new Date() > availableUntil) &&
                    !props.cue.releaseSubmission &&
                    !isOwner &&
                    isQuiz) ||
                    !isQuiz ||
                    isOwner)) ||
            (!props.showOriginal && !props.showOptions && !props.viewStatus) ? (
                wrapMainCueContentWithScrollView()
            ) : (
                <Animated.View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        opacity: 1,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        height: '100%',
                        flex: 1,
                    }}
                >
                    {props.cue.channelId && props.cue.channelId !== '' ? (
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                            }}
                        >
                            {!isOwner &&
                            props.cue.graded &&
                            props.cue.score !== undefined &&
                            props.cue.score !== null &&
                            !isQuiz &&
                            props.cue.releaseSubmission &&
                            (props.showOriginal || props.showOptions) ? (
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: 'white',
                                        height: 22,
                                        paddingHorizontal: 10,
                                        borderRadius: 15,
                                        backgroundColor: '#007AFF',
                                        lineHeight: 20,
                                        paddingTop: 1,
                                        marginBottom: 5,
                                        marginTop: 20,
                                    }}
                                >
                                    {props.cue.score}%
                                </Text>
                            ) : null}
                            {!isOwner &&
                            props.cue.submittedAt !== '' &&
                            new Date(props.cue.submittedAt) >= deadline &&
                            props.showOriginal ? (
                                <View style={{ marginTop: 20, marginBottom: 5, paddingLeft: 20 }}>
                                    <Text
                                        style={{
                                            color: '#f94144',
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            textAlign: 'center',
                                        }}
                                    >
                                        LATE
                                    </Text>
                                </View>
                            ) : null}
                            {/* <TouchableOpacity
                            onPress={() => setStarred(!starred)}
                            style={{
                                backgroundColor: "white",
                                flex: 1
                            }}>
                            <Text
                                style={{
                                    textAlign: "right",
                                    lineHeight: 34,
                                    marginTop: -31,
                                    // paddingRight: 25,
                                    width: "100%"
                                }}>
                                <Ionicons name="bookmark" size={40} color={starred ? "#f94144" : "#1F1F1F"} />
                            </Text>
                        </TouchableOpacity> */}
                        </View>
                    ) : null}
                    <ScrollView
                        contentContainerStyle={{
                            paddingBottom: 150,
                            paddingHorizontal: 10,
                        }}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="black"
                        scrollEnabled={true}
                        scrollEventThrottle={1}
                        // keyboardDismissMode={'on-drag'}
                        overScrollMode={'always'}
                        nestedScrollEnabled={true}
                    >
                        {props.showOptions || props.showComments ? null : (
                            <View>
                                <View style={{ flexDirection: 'column', width: '100%' }}>
                                    {renderQuizTimerOrUploadOptions()}
                                </View>
                                {isQuiz && !isOwner && !initiatedAt ? renderQuizSubmissionHistory() : null}
                                {isQuiz && cueGraded && props.cue.releaseSubmission ? (
                                    <QuizGrading
                                        problems={problems}
                                        solutions={quizSolutions}
                                        partiallyGraded={false}
                                        comment={comment}
                                        isOwner={false}
                                        headers={headers}
                                        attempts={quizAttempts}
                                        //
                                        handleAddImage={handleAddImage}
                                        handleInsertLink={handleInsertLink}
                                        handleHiliteColor={handleHiliteColor}
                                        handleForeColor={handleForeColor}
                                        handleEmoji={handleEmoji}
                                    />
                                ) : (remainingAttempts === 0 ||
                                      props.cue.releaseSubmission ||
                                      (!allowLateSubmission && new Date() > deadline) ||
                                      (allowLateSubmission && new Date() > availableUntil)) &&
                                  !isOwner &&
                                  isQuiz ? (
                                    renderQuizEndedMessage()
                                ) : // renderMainCueContent()
                                null}
                            </View>
                        )}
                        {props.showOptions ? (
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    paddingLeft: Dimensions.get('window').width < 768 ? 10 : 15,
                                }}
                            >
                                {props.cue.channelId ? (
                                    <View
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        {renderShareWithOptions()}
                                        {renderSubmissionRequiredOptions()}
                                        {renderGradeOptions()}
                                        {renderLateSubmissionOptions()}
                                        {renderAttemptsOptions()}
                                    </View>
                                ) : null}

                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                >
                                    {renderForwardOptions()}
                                    {renderCategoryOptions()}
                                    {renderPriorityOptions()}
                                </View>
                                {/* {renderReminderOptions()} */}
                            </View>
                        ) : null}
                    </ScrollView>
                </Animated.View>
            )}

            {!props.showOriginal &&
            !props.showOptions &&
            !viewSubmission &&
            !submissionImported &&
            !isQuiz &&
            !isOwner &&
            !cueGraded &&
            !props.cue.releaseSubmission &&
            !(
                remainingAttempts === 0 ||
                props.cue.releaseSubmission ||
                (!allowLateSubmission && new Date() > deadline) ||
                (allowLateSubmission && new Date() > availableUntil)
            ) ? (
                <React.Fragment>
                    {props.cue.releaseSubmission ||
                    (!allowLateSubmission && new Date() > deadline) ||
                    (allowLateSubmission && new Date() > availableUntil)
                        ? null
                        : renderRichEditorModified()}
                    {renderSubmissionDraftStatus()}
                    {/* {renderFooter()} */}
                </React.Fragment>
            ) : null}

            {showTextEntryInput && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setShowTextEntryInput(false);
                        Keyboard.dismiss();
                    }}
                    isOpen={showTextEntryInput}
                    title={(textEntryInputType === 'numeric' ? 'Numeric' : 'Text') + ' Entry'}
                    renderContent={() => renderTextEntryInputModal()}
                    header={false}
                />
            )}

            {emojiVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setEmojiVisible(false);
                    }}
                    isOpen={emojiVisible}
                    title={'Select emoji'}
                    renderContent={() => <EmojiView onSelect={insertEmoji} />}
                    header={false}
                />
            )}
            {insertImageVisible && (
                <BottomSheet
                    snapPoints={[0, isQuiz ? 250 : 200]}
                    close={() => {
                        setInsertImageVisible(false);
                    }}
                    isOpen={insertImageVisible}
                    title={'Insert image'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10, zIndex: 10000 }}>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#007AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center',
                                }}
                                onPress={() => {
                                    uploadImageHandler(true);
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#fff',
                                    }}
                                >
                                    {' '}
                                    Camera{' '}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#007AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center',
                                }}
                                onPress={() => {
                                    uploadImageHandler(false);
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#fff',
                                    }}
                                >
                                    {' '}
                                    Gallery{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}
            {insertLinkVisible && (
                <BottomSheet
                    snapPoints={[0, isQuiz ? 400 : 350]}
                    close={() => {
                        setInsertLinkVisible(false);
                    }}
                    isOpen={insertLinkVisible}
                    title={'Insert Link'}
                    renderContent={() => <InsertLink onInsertLink={onInsertLink} />}
                    header={false}
                />
            )}
            {hiliteColorVisible && (
                <BottomSheet
                    snapPoints={[0, isQuiz ? 400 : 350]}
                    close={() => {
                        setHiliteColorVisible(false);
                    }}
                    isOpen={hiliteColorVisible}
                    title={'Highlight color'}
                    renderContent={() => (
                        <View
                            style={{
                                paddingHorizontal: 10,
                                paddingTop: 20,
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 10000,
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={hiliteColor}
                                onChange={(color: string) => setHiliteColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={() => setHiliteColor('#ffffff')}
                                disabled={hiliteColor === '#ffffff'}
                            >
                                <Text
                                    style={{
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#007AFF',
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}
            {foreColorVisible && (
                <BottomSheet
                    snapPoints={[0, isQuiz ? 400 : 350]}
                    close={() => {
                        setForeColorVisible(false);
                    }}
                    isOpen={foreColorVisible}
                    title={'Text color'}
                    renderContent={() => (
                        <View
                            style={{
                                paddingHorizontal: 10,
                                paddingTop: 20,
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 10000,
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={foreColor}
                                onChange={(color: string) => setForeColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={() => setForeColor('#000000')}
                                disabled={foreColor === '#000000'}
                            >
                                <Text
                                    style={{
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#007AFF',
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}

            {showTextEntryInput ||
            emojiVisible ||
            insertImageVisible ||
            insertLinkVisible ||
            hiliteColorVisible ||
            foreColorVisible ? (
                <Reanimated.View
                    style={{
                        alignItems: 'center',
                        backgroundColor: 'black',
                        opacity: 0.3,
                        height: '100%',
                        top: 0,
                        left: 0,
                        width: '100%',
                        position: 'absolute',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => {
                            setEmojiVisible(false);
                            setInsertImageVisible(false);
                            setInsertLinkVisible(false);
                            setHiliteColorVisible(false);
                            setForeColorVisible(false);
                            setShowTextEntryInput(false);
                        }}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}
        </View>
    );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: Dimensions.get('window').width < 768 ? 40 : 80,
        marginBottom: Dimensions.get('window').width < 768 ? 40 : 80,
        lineHeight: 18,
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    input: {
        width: '80%',
        // flex: 1,
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        paddingTop: 12,
        paddingBottom: 12,
        // marginTop: 5,
        // marginBottom: 20,
        // maxWidth: 210
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20,
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#000000',
        fontWeight: 'bold',
        height: 25,
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,
        backgroundColor: '#fff',
        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#fff',
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        lineHeight: 25,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase',
    },
    allGrayOutline: {
        fontSize: 12,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
        lineHeight: 20,
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10,
    },
});
