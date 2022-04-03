// REACT
import React, { useCallback, useEffect, useState, useRef, Fragment } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    StyleSheet,
    Switch,
    TextInput,
    ScrollView,
    Animated,
    Dimensions,
    Platform,
    KeyboardEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createCue,
    createQuiz,
    getChannelCategories,
    getChannels,
    getSharedWith
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import Alert from '../components/Alert';
import QuizCreate from './QuizCreate';
import TeXToSVG from 'tex-to-svg';
import moment from 'moment';
import { Video } from 'expo-av';
// import WebViewer from '@pdftron/pdfjs-express';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
// import TextareaAutosize from 'react-textarea-autosize';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
// import { Editor } from '@tinymce/tinymce-react';
// import FormulaGuide from './FormulaGuide';
import Books from './Books';
import DropDownPicker from 'react-native-dropdown-picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import { EmojiView, InsertLink } from './ToolbarComponents';
import BottomSheet from './BottomSheet';
import DateTimePicker from '@react-native-community/datetimepicker';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleFile } from '../helpers/FileUpload';
import { handleImageUpload } from '../helpers/ImageUpload';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import ColorPicker from './ColorPicker';
// import { SafeAreaView } from 'react-native-safe-area-context';
const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');

import Reanimated from 'react-native-reanimated';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import useDynamicRefs from 'use-dynamic-refs';

const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue, setCue] = useState('');
    const [cueDraft, setCueDraft] = useState('<h1>Title</h1><br/><h3>Body</h3>');
    const [shuffle, setShuffle] = useState(false);
    const [starred] = useState(false);
    const [notify, setNotify] = useState(false);
    const [color, setColor] = useState(0);
    const [frequency, setFrequency] = useState('0');
    const [customCategory, setCustomCategory] = useState('None');
    const [localCustomCategories] = useState(props.customCategories);
    const [customCategories, setCustomCategories] = useState(props.customCategories);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [channelOptions, setChannelOptions] = useState<any[]>([]);
    const [showOptions, setShowOptions] = useState(false);
    const [channelId, setChannelId] = useState<any>('');
    const [selectedChannel, setSelectedChannel] = useState<any>('My Notes');
    const [endPlayAt, setEndPlayAt] = useState(new Date(current.getTime() + 1000 * 60 * 60));
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true);
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const [modalAnimation] = useState(new Animated.Value(0));
    let RichText: any = useRef();
    let quizInstructionsEditorRef: any = useRef();
    let editorRef: any = useRef();
    const scrollRef: any = useRef();
    const [init, setInit] = useState(false);
    const [role, setRole] = useState('');
    const [allowQuizCreation, setAllowQuizCreation] = useState(false);
    const [submission, setSubmission] = useState(false);
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24));
    const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()));

    const [showDeadlineTimeAndroid, setShowDeadlineTimeAndroid] = useState(false);
    const [showDeadlineDateAndroid, setShowDeadlineDateAndroid] = useState(false);

    const [showInitiateAtTimeAndroid, setShowInitiateAtTimeAndroid] = useState(false);
    const [showInitiateAtDateAndroid, setShowInitiateAtDateAndroid] = useState(false);

    const [allowLateSubmission, setAllowLateSubmission] = useState(false);
    const [availableUntil, setAvailableUntil] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 48));

    const [showAvailableUntilTimeAndroid, setShowAvailableUntilTimeAndroid] = useState(false);
    const [showAvailableUntilDateAndroid, setShowAvailableUntilDateAndroid] = useState(false);

    const [showBooks, setShowBooks] = useState(props.option === 'Browse' ? true : false);
    const [gradeWeight, setGradeWeight] = useState<any>(0);
    const [graded, setGraded] = useState(false);
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    const [selected, setSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [headers, setHeaders] = useState<any>({});
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [timer, setTimer] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0
    });
    const [equation, setEquation] = useState('y = x + 1');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [quizInstructions, setQuizInstructions] = useState('');
    const [initialQuizInstructions, setInitialQuizInstructions] = useState('');
    const [initialDuration, setInitialDuration] = useState(null);
    const [limitedShare, setLimitedShare] = useState(false);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
    const [attempts, setAttempts] = useState('1');
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');
    const [dimensions, setDimensions] = useState({ window, screen });
    const [userId, setUserId] = useState('');
    const width = dimensions.window.width;
    const hours: any[] = [0, 1, 2, 3, 4, 5, 6];
    const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    let categoriesOptions = [
        {
            value: 'None',
            label: 'None'
        }
    ];
    customCategories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            label: category
        });
    });
    const [createPdfviewerURL, setCreatePdfviewerURL] = useState('');
    // NATIVE DROPDOWNS
    const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [height, setHeight] = useState(100);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [editorFocus, setEditorFocus] = useState(false);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
    const [foreColorVisible, setForeColorVisible] = useState(false);
    const [hiliteColor, setHiliteColor] = useState('#ffffff');
    const [foreColor, setForeColor] = useState('#000000');
    const [insertLinkVisible, setInsertLinkVisible] = useState(false);
    const [insertImageVisible, setInsertImageVisible] = useState(false);
    const [quizEditorRef, setQuizEditorRef] = useState<any>(null);
    const videoRef: any = useRef();
    const scrollViewRef: any = useRef();
    const [getRef, setRef] = useDynamicRefs();
    const [quizOptionEditorIndex, setQuizOptionEditorIndex] = useState('')


    let testEditorRef: any = {}

    // Alerts
    const enterOneProblemAlert = PreferredLanguageText('enterOneProblem');
    const invalidDurationAlert = PreferredLanguageText('invalidDuration');
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems');
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints');
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions');
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const enterContentAlert = PreferredLanguageText('enterContent');
    const enterTitleAlert = PreferredLanguageText('enterTitle');

    // HOOK

    console.log('URL', url);

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0]
    });


    /**
     * @description Event listener for dimensions change
     */
    useEffect(() => {
        Dimensions.addEventListener('change', onDimensionsChange);
        return () => {
            Dimensions.removeEventListener('change', onDimensionsChange);
        };
    }, []);

    /**
     * @description Show import file directly from the navbar
     */
    useEffect(() => {
        if (props.showImportCreate) {
            handleUploadFile()
            props.setShowImportCreate(false)
        }
    }, [props.showImportCreate])

    /**
     * @description 
     */
    useEffect(() => {
        setIsQuiz(false);
        setSubmission(false)
        setShowBooks(false)

        if (props.createActiveTab === 'Quiz') {
            setIsQuiz(true);
            setSubmission(true)
        } else if (props.createActiveTab === 'Library') {
            setShowBooks(true);
        } else if (props.createActiveTab === 'Content') {
        }
    }, [props.createActiveTab])

    /**
     * @description Sets import options based on Cue content if JSON object
     */
    useEffect(() => {
        if (isQuiz) {
            return;
        }

        if (cue[0] === '{' && cue[cue.length - 1] === '}') {
            const obj = JSON.parse(cue);
            setImported(true);
            setUrl(obj.url);
            setType(obj.type);
            setTitle(obj.title);
        } else {
            setImported(false);
            setUrl('');
            setType('');
            setTitle('');
        }
    }, [cue, isQuiz]);

    useEffect(() => {

        console.log("Set create option", props.createOption)

        if (props.createOption === 'books') {
            setShowBooks(true)
        } else if (props.createOption === 'quiz') {
            console.log('set as quiz')
            setIsQuiz(true);
            setSubmission(true);
        }
    }, [props.createOption])

    /**
     * @description Loads webviewer for Imports
     */
    useEffect(() => {
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

        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const parsedUser = JSON.parse(u);

                const pdfViewerURL = `https://app.learnwithcues.com/pdfviewer?url=${encodeURIComponent(url)}&source=CREATE&name=${encodeURIComponent(
                    parsedUser.fullName
                )}`;

                setCreatePdfviewerURL(pdfViewerURL);

                console.log('pdfViewerURL', pdfViewerURL);
            }
        })();

        // WebViewer(
        //     {
        //         licenseKey: 'xswED5JutJBccg0DZhBM',
        //         initialDoc: url,
        //         enableReadOnlyMode: true
        //     },

        //     RichText.current
        // ).then(instance => {
        //     const { documentViewer } = instance.Core;

        //     if (!documentViewer) return;
        //     // you can now call WebViewer APIs here...
        //     documentViewer.addEventListener('documentLoaded', () => {
        //         // perform document operations
        //     });
        // });
    }, [url, RichText, imported, type, showOptions]);

    /**
     * @description Sets user role
     */
    useEffect(() => {
        (async () => {
            const uString: any = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(uString);
            if (parsedUser.role) {
                setRole(parsedUser.role);
            }
            if (parsedUser.allowQuizCreation) {
                setAllowQuizCreation(parsedUser.allowQuizCreation)
            }
            if (parsedUser._id) {
                setUserId(parsedUser._id);
            }
        })();
    });

    /**
     * @description Loads channel categories and subscribers for Create
     */
    useEffect(() => {
        loadChannelCategoriesAndSubscribers();
    }, [channelId]);

    /**
     * @description Loads Channels for user
     */
    useEffect(() => {
        loadChannels();
    }, []);

    /**
     * @description Store draft of Cue and Quiz in Async Storage
     */
    useEffect(() => {
        console.log("Init", init);
        if (!init) {
            return;
        }
        console.log("Cue", cue);
        let saveCue = '';
        if (imported) {
            const obj = {
                type,
                url,
                title
            };
            saveCue = JSON.stringify(obj);
        } else if (isQuiz) {
            // Loop over entire quiz and save only the questions which are valid
            console.log("problems to store", problems)
            const validProblems = problems.filter((prob: any) => isCurrentQuestionValid(prob));

            const quiz = {
                title,
                problems: validProblems,
                timer,
                duration,
                headers,
                quizInstructions
            };

            const saveQuiz = JSON.stringify(quiz);

            console.log("Store quizDraft", saveQuiz)

            storeDraft('quizDraft', saveQuiz);
        } else {
            saveCue = cue;
        }

        console.log("Store draft", saveCue)
        if (saveCue && saveCue !== '') {
            storeDraft('cueDraft', saveCue);
        } else {
            storeDraft('cueDraft', '');
        }
    }, [cue, init, type, imported, url, title, problems, timer, duration, headers, quizInstructions]);

    console.log("Problems", problems)
    /**
     * @description Loads Drafts on Init
     */
    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft');
                console.log("Cue draft", h);

                if (h !== null) {
                    setCue(h);
                    setCueDraft(h);
                }
                const quizDraft = await AsyncStorage.getItem('quizDraft');
                if (quizDraft !== null) {
                    console.log("Quiz Draft on init", quizDraft)

                    const { duration, timer, problems, title, headers, quizInstructions } = JSON.parse(quizDraft);
                    setDuration(duration);
                    setInitialDuration(duration);
                    setTimer(timer);
                    setProblems(problems);
                    // setTitle(title);
                    setQuizTitle(title);
                    setHeaders(headers);
                    setQuizInstructions(quizInstructions);
                    setInitialQuizInstructions(quizInstructions);
                }
                setInit(true)
            } catch (e) {
                console.log(e);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, []);

    console.log("create option", props.createOption)

    console.log("Is quiz", isQuiz)

    useEffect(() => {
        if (selectedChannel === 'My Notes') {
            setSelectedChannel('My Notes');
            setChannelId('');
            setCustomCategories(localCustomCategories);
            setCustomCategory('None');
            setAddCustomCategory(false);
            setSubmission(false);
            setGradeWeight(0);
            setGraded(false);
            setSelected([]);
            setSubscribers([]);
            // setProblems([]);
            // console.log('Set not quiz')
            // setIsQuiz(false);
            setTimer(false);
        } else {
            // const match = channels.find((c: any) => {
            //     return c._id === selectedChannel;
            // });
            // setSelectedChannel(match._id);
            setChannelId(selectedChannel);
            setAddCustomCategory(false);
            setCustomCategory('None');
            setSubmission(isQuiz ? true : false);
            setGradeWeight(0);
            setGraded(false);
        }
    }, [selectedChannel]);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        setDimensions({ window, screen });
    }, []);

    console.log('Window dimensions', dimensions);

    /**
     * @description Used to insert equation into Editor HTML
     */
    const insertEquation = useCallback(() => {
        if (equation === '') {
            Alert('Equation cannot be empty.');
            return;
        }

        let currentContent = editorRef.current.getContent();

        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + '<br/></div>';

        editorRef.current.setContent(currentContent);

        setShowEquationEditor(false);
        setEquation('');
    }, [equation, RichText, RichText.current, cue]);

    /**
     * @description Validates Quiz for Creation
     */
    /**
     * @description Validates Quiz for Creation
     */
     const isQuizValid = useCallback(() => {
        let error = false;
        if (problems.length === 0) {
            Alert(enterOneProblemAlert);
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert);
                return;
            }
        }
        problems.map((problem: any, problemIndex: number) => {

            if (problem.question === "" && (problem.questionType !== 'textEntry' && problem.questionType !== 'inlineChoice' && problem.questionType !== 'highlightText')) {
                alert(`Question ${problemIndex + 1} has no content.`)
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
            // if (problem.questionType === 'dragdrop') {

            //     // At least 2 groups
            //     if (problem.dragDropHeaders.length < 2) {
            //         alert(`Question ${problemIndex + 1} must have at least 2 Drag & Drop groups.`)
            //         return false;
            //     }
                
            //     let groupHeaderMissing = false 
            //     let labelMissing = false
            //     let groupEmpty = false

            //     problem.dragDropHeaders.map((header: string) => {
            //         if (!header) {
            //             groupHeaderMissing = true
            //         }
            //     });

            //     if (groupHeaderMissing) {
            //         alert(`Group header is missing in Question ${problemIndex + 1}.`)
            //         return false;
            //     }

            //     problem.dragDropData.map((items: any[]) => {

            //         if (items.length === 0) {
            //             groupEmpty = true
            //         }

            //         items.map((label: any) => {
            //             if (label.content === '') {
            //                 labelMissing = true
            //             }
            //         })

            //     });

            //     if (labelMissing) {
            //         alert(`Item missing in Question ${problemIndex + 1}.`)
            //         return false;
            //     }

            //     if (groupEmpty) {
            //         alert(`Each group must have at least 1 item in Question ${problemIndex + 1}.`)
            //         return false;
            //     }

            // }

            // // Hotspot
            // if (problem.questionType === 'hotspot') {
            //     if(problem.imgUrl === '' || !problem.imgUrl) {
            //         Alert(`Hotspot image is missing in Question ${problemIndex + 1}.`)
            //         setIsSubmitting(false);
            //         error = true;
            //     }
            //     if(!problem.hotspots || problem.hotspots.length === 0) {
            //         Alert(`You must place at least two hotspot marker on the image in Question ${problemIndex + 1}.`);
            //         setIsSubmitting(false);
            //         error = true;
            //     }
                
            //     let hasCorrectAnswer = false;

            //     problem.hotspotOptions.map((option: any) => {

            //         if (option.isCorrect) {
            //             hasCorrectAnswer = true;
            //         }

            //     })

            //     if (!hasCorrectAnswer) {
            //         Alert(`Hotspot question ${problemIndex + 1} must have at least correct choice.`);
            //         return;
            //     }
            // }

            // // Highlight Text
            // if (problem.questionType === 'highlightText') {

            //     const el = document.createElement('html');
            //     el.innerHTML = problem.highlightTextHtml;
            //     const spans: HTMLCollection = el.getElementsByTagName('span');
    
            //     let spanIdCounter = 0;
            //     let correctAnswers = 0;
    
            //     for (let i = 0; i < spans.length; i++) {
            //         const span = spans.item(i);
    
            //         if (span.style.backgroundColor === 'rgb(97, 189, 109)') {
            //             spanIdCounter += 1;
            //             correctAnswers += 1;
            //         } else if (span.style.backgroundColor === 'rgb(247, 218, 100)') {
            //             spanIdCounter += 1;
            //         }
            //     }
    
            //     if (spanIdCounter < 2) {
            //         Alert(`You must set at least two Hot text choices in Question ${index + 1}.`);
            //         return;
            //     }
                
            //     if (correctAnswers === 0) {
            //         Alert(`You must set at least one Hot text choice as correct in Question ${index + 1}.`);
            //         return;
            //     }
            // }

            // // Inline Choice
            // if (problem.questionType === 'inlineChoice') {
            //     if (problem.inlineChoiceHtml === '') {
            //         alert(`Question ${problemIndex + 1} has no content.`)
            //         return;
            //     }
    
            //     if (problem.inlineChoiceOptions.length === 0) {
            //         alert(`Question ${problemIndex + 1} must have at lease one dropdown.`)
            //         return;
            //     }
                
            //     let lessThan2DropdownValues = false
            //     let missingDropdownValue = false;
            //     let missingCorrectAnswer = false;
    
            //     if (problem.inlineChoiceOptions.length > 0) {
            //         problem.inlineChoiceOptions.map((choices: any[]) => {
            //             if (choices.length < 2) {
            //                 lessThan2DropdownValues = true
            //             }
    
            //             let hasCorrect = false
            //             choices.map((choice: any) => {
            //                 if (choice.isCorrect) {
            //                     hasCorrect = true
            //                 }
    
            //                 if (choice.option === '') {
            //                     missingDropdownValue = true
            //                 }
            //             })
    
            //             if (!hasCorrect) {
            //                 missingCorrectAnswer = true
            //             }
    
            //         })
    
            //         if (lessThan2DropdownValues) {
            //             alert(`Each dropdown in question ${problemIndex + 1} must have at lease two options.`)
            //             return;
            //         }
    
            //         if (missingDropdownValue) {
            //             alert(`Each dropdown option must have a value in question ${problemIndex + 1}.`)
            //             return;
            //         }
    
            //         if (missingCorrectAnswer) {
            //             alert(`Each dropdown must have a correct answer in question ${problemIndex + 1}.`)
            //             return;
            //         }
            //     }
    
            // }

            // // Text Entry
            // if (problem.questionType === 'textEntry') {
            //     if (problem.textEntryHtml === '') {
            //         alert(`Question ${problemIndex + 1} has no content.`)
            //         return;
            //     }

            //     if (problem.textEntryOptions.length === 0) {
            //         alert(`Text entry question ${problemIndex + 1} must have at lease one entry.`)
            //         return;
            //     }

            //     let missingEntryAnswer = false;
            //     let missingEntryPoints = false;
            //     let pointsNotANumber = false;

            //     problem.textEntryOptions.map((choice: any, problemIndex: number) => {
            //         if (choice.option === '') {
            //             missingEntryAnswer = true;
            //         }

            //         if (choice.points === '') {
            //             missingEntryPoints = true
            //         }

            //         if (Number.isNaN(Number(choice.points))) {
            //             pointsNotANumber = true
            //         }

            //     })

            //     if (missingEntryAnswer) {
            //         alert(`Each Text entry option must have an answer in question ${problemIndex + 1}.`)
            //         return;
            //     }

            //     if (missingEntryPoints) {
            //         alert(`Each Text entry must have points in question ${problemIndex + 1}.`)
            //         return;
            //     }

            //     if (pointsNotANumber) {
            //         alert(`Each Text entry must have numeric points in question ${problemIndex + 1}.`)
            //         return;
            //     }

            // }

            // // Multipart 
            // if (problem.questionType === 'multipart') {
            //     if (problem.multipartQuestions[0] === '' || problem.multipartQuestions[1] === '') {
            //         alert(`Part A and Part B questions cannot be empty in question ${problemIndex + 1}`);
            //         return;
            //     }

            //     // Part A
            //     let hasOneCorrect = false;
            //     let hasMissingOption = false;

            //     // At least two choices
            //     if (problem.multipartOptions[0].length < 2) {
            //         alert(`Part A must have at least two choices in question ${problemIndex + 1}`)
            //         return;
            //     }

            //     problem.multipartOptions[0].map((option: any) => {
            //         if (option.isCorrect) {
            //             hasOneCorrect = true
            //         }

            //         if (option.option === '') {
            //             hasMissingOption = true;
            //         }
            //     })

            //     if (!hasOneCorrect) {
            //         alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`)
            //         return;
            //     }

            //     if (hasMissingOption) {
            //         alert(`Part A option is empty in question ${problemIndex + 1}`)
            //     }

            //     if (problem.multipartOptions[0].length < 2) {
            //         alert(`Part A must have at least two choices in question ${problemIndex + 1}`)
            //         return;
            //     }

            //     // Part B
            //     problem.multipartOptions[1].map((option: any) => {
            //         if (option.isCorrect) {
            //             hasOneCorrect = true
            //         }

            //         if (option.option === '') {
            //             hasMissingOption = true;
            //         }
            //     })

            //     if (!hasOneCorrect) {
            //         alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`)
            //         return;
            //     }

            //     if (hasMissingOption) {
            //         alert(`Part A option is empty in question ${problemIndex + 1}`)
            //     }
            // }

            // // Equation Editor
            // if (problem.questionType === 'equationEditor') {
            //     if (problem.correctEquations[0] === '') {
            //         alert('Correct equation cannot be empty.')
            //         return;
            //     }
            // }
    
            // // Match table grid
            // if (problem.questionType === 'matchTableGrid') {
    
            //     let missingColHeader = false;
            //     let missingRowHeader = false;
            //     let missingCorrect = false;
    
            //     problem.matchTableHeaders.map((header: string) => {
            //         if (header === '') {
            //             missingColHeader = true;
            //         }
            //     })
    
            //     if (missingColHeader) {
            //         alert(`Column header cannot be empty in question ${problemIndex + 1}.`)
            //         return;
            //     }
    
            //     problem.matchTableOptions.map((rowHeader: string) => {
            //         if (rowHeader === '') {
            //             missingRowHeader = true
            //         }
            //     })
    
            //     if (missingRowHeader) {
            //         alert(`Row header cannot be empty in question ${problemIndex + 1}.`)
            //         return;
            //     }
    
            //     problem.matchTableChoices.map((row: any) => {
            //         let hasCorrect = false;
    
            //         if (missingCorrect) {
            //             return;
            //         }
    
            //         row.map((option: boolean) => {
            //             if (option) {
            //                 hasCorrect = true
            //             }
            //         })
    
            //         if (!hasCorrect) {
            //             missingCorrect = true
            //         }
            //     })
    
            //     if (missingCorrect) {
            //         alert(`Each row must have a correct response in question ${problemIndex + 1}.`)
            //         return;
            //     }
            // }
        });
        if (error) {
            // Alert
            return false;
        } else {
            return true;
        }
    }, [duration, problems]);

    /**
     * @description Handles creating new Quiz
     */
    const createNewQuiz = useCallback(() => {
        setIsSubmitting(true);
        setCreatingQuiz(true);
        let error = false;
        if (problems.length === 0) {
            Alert(enterOneProblemAlert);
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert);
                return;
            }
        }
        problems.map(problem => {
            if (problem.question === '' || problem.question === 'formula:') {
                Alert(fillMissingProblemsAlert);
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(enterNumericPointsAlert);
                error = true;
            }
            let optionFound = false;

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert('Problem must have at least 2 options');
                setIsSubmitting(false);
                error = true;
            }

            // If MCQ, check if any options repeat:
            if (!problem.questionType || problem.questionType === 'trueFalse') {
                const keys: any = {};

                problem.options.map((option: any) => {
                    if (option.option === '' || option.option === 'formula:') {
                        Alert(fillMissingOptionsAlert);
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.option in keys) {
                        Alert('Option repeated in a question');
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.isCorrect) {
                        optionFound = true;
                    }

                    keys[option.option] = 1;
                });

                if (!optionFound) {
                    Alert(eachOptionOneCorrectAlert);
                    setIsSubmitting(false);
                    error = true;
                }
            }
        });
        if (error) {
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if (quizTitle === '') {
            Alert(enterTitleAlert);
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && deadline < new Date()) {
            Alert('Submission deadline must be in future');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && allowLateSubmission && availableUntil < deadline) {
            Alert('Late submission date must be set after deadline.');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && deadline < initiateAt) {
            Alert('Available from time must be set before deadline', '');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        const server = fetchAPI('');
        const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;
        server
            .mutate({
                mutation: createQuiz,
                variables: {
                    quiz: {
                        problems,
                        duration: timer ? durationMinutes.toString() : null,
                        shuffleQuiz,
                        instructions: quizInstructions,
                        headers: JSON.stringify(headers)
                    }
                }
            })
            .then(res => {
                setCreatingQuiz(false);
                setIsSubmitting(false);
                if (res.data && res.data.quiz.createQuiz !== 'error') {
                    setCreatingQuiz(false);
                    storeDraft('quizDraft', '');
                    handleCreate(res.data.quiz.createQuiz);
                }
            })
            .catch(e => {
                console.log('Error', e);
                setCreatingQuiz(false);
            });
    }, [
        problems,
        cue,
        modalAnimation,
        customCategory,
        props.saveDataInCloud,
        isQuiz,
        gradeWeight,
        deadline,
        initiateAt,
        submission,
        imported,
        selected,
        subscribers,
        shuffle,
        frequency,
        starred,
        color,
        notify,
        quizTitle,
        type,
        url,
        timer,
        duration,
        props.closeModal,
        channelId,
        endPlayAt,
        playChannelCueIndef,
        shuffleQuiz,
        quizInstructions,
        headers,
        availableUntil,
        allowLateSubmission,
    ]);

    // EDITOR METHODS

    useEffect(() => {
        changeForeColor(foreColor);
    }, [foreColor]);

    useEffect(() => {
        changeHiliteColor(hiliteColor);
    }, [hiliteColor]);

    const handleUploadFile = useCallback(async () => {
        const res = await handleFile(false, userId);

        console.log('File upload result', res);

        if (!res || res.url === '' || res.type === '') {
            props.showImportCreate(false)
            return;
        }

        setEditorFocus(false);


        updateAfterFileImport(res.url, res.type);
    }, [RichText, RichText.current, userId]);

    const handleUploadAudioVideo = useCallback(async () => {
        const res = await handleFile(true, userId);

        console.log('File upload result', res);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);

        updateAfterFileImport(res.url, res.type);
    }, [RichText, RichText.current, userId]);

    const changeForeColor = useCallback(
        (h: any) => {
            if (quizOptionEditorIndex) {
                const currRef: any = getRef(quizOptionEditorIndex)
                currRef.current?.setForeColor(h);
                setQuizOptionEditorIndex('')
            } else if (quizEditorRef) {
                quizEditorRef.current?.setForeColor(h);
                setQuizEditorRef(null)
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
                const currRef: any = getRef(quizOptionEditorIndex)

                currRef.current?.setHiliteColor(h);
                setQuizOptionEditorIndex('')
            } else if (quizEditorRef) {
                quizEditorRef.current?.setHiliteColor(h);
                setQuizEditorRef(null)
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
        emoji => {
            if (quizOptionEditorIndex) {
                const currRef: any = getRef(quizOptionEditorIndex)
                currRef.current?.insertText(emoji)
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

            setQuizOptionEditorIndex(optionIndex)
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

            setQuizOptionEditorIndex(optionIndex)

            // Get current ref
            const currRef: any = getRef(optionIndex)

            console.log("CurrRef", currRef.current)

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

            setQuizOptionEditorIndex(optionIndex)
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

        console.log("Editor ref", editorRef)

        if (editorRef) {
            setQuizEditorRef(editorRef);
            testEditorRef = editorRef
        }
    }, []);

    const handleAddImageQuizOptions = useCallback((optionIndex: any) => {
        setInsertImageVisible(true);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertLinkVisible(false);

        setQuizOptionEditorIndex(optionIndex)
    }, []);

    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, userId);
            // const url = "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1.00xw:0.669xh;0,0.190xh&resize=1200:*"

            let editorRef: any = {}

            if (url && url !== '') {

                if (quizOptionEditorIndex) {

                    editorRef = getRef(quizOptionEditorIndex);

                } else if (quizEditorRef && quizEditorRef.current) {

                    editorRef = quizEditorRef

                } else {

                    editorRef = RichText

                }

                console.log("Editor ref", editorRef)

                editorRef.current?.focusContentEditor()

                editorRef.current?.insertHTML('<div><br/></div>')

                editorRef.current?.insertImage(url, 'width:300px');

                editorRef.current?.insertHTML('<div><br/></div>')

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

    /**
     * @description Loads channel Categories and subscribers for Create optins
     */
    const loadChannelCategoriesAndSubscribers = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');

        const userId = JSON.parse(uString);
        if (userId.role) {
            setRole(userId.role);
        }
        if (channelId === '') {
            setCustomCategories(localCustomCategories);
            return;
        }
        const server = fetchAPI('');
        // get categories
        server
            .query({
                query: getChannelCategories,
                variables: {
                    channelId
                }
            })
            .then(res => {
                if (res.data.channel && res.data.channel.getChannelCategories) {
                    if (role === 'instructor') {
                        const categories = new Set();

                        res.data.channel.getChannelCategories.map((category: any) => {
                            console.log('Channel category', category);
                            categories.add(category);
                        });

                        categories.add('Assignments');
                        categories.add('Homeworks');
                        categories.add('Quizzes');
                        categories.add('Syllabus');
                        categories.add('Textbook');
                        categories.add('Videos');

                        const withDefaultCategories = Array.from(categories);

                        setCustomCategories(withDefaultCategories);
                    } else {
                        setCustomCategories(res.data.channel.getChannelCategories);
                    }
                }
            })
            .catch(err => { });
        // get subscribers
        server
            .query({
                query: getSharedWith,
                variables: {
                    channelId,
                    cueId: null
                }
            })
            .then((res: any) => {
                if (res.data && res.data.cue.getSharedWith) {
                    const subscribers: any[] = res.data.cue.getSharedWith;

                    const format = subscribers.map((sub: any) => {
                        return {
                            value: sub.value,
                            label: sub.label
                        };
                    });

                    const withoutOwner: any = [];
                    const withoutOwnerIds: any = [];

                    format.map((i: any) => {
                        if (userId._id !== i.value) {
                            withoutOwner.push(i);
                            withoutOwnerIds.push(i.value);
                        }
                    });
                    setSubscribers(withoutOwner);
                    console.log('Subscribers', withoutOwner);
                    // clear selected
                    setSelected(withoutOwnerIds);
                    console.log('Selected', withoutOwnerIds);
                }
            })
            .catch((err: any) => console.log(err));
    }, [channelId, localCustomCategories, role]);

    /**
     * @description Loads all the channels for user to create for
     */
    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');
            server
                .query({
                    query: getChannels,
                    variables: {
                        userId: user._id
                    }
                })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                        const options = [
                            {
                                value: 'My Notes',
                                label: 'My Notes'
                            }
                        ];

                        res.data.channel.findByUserId.map((channel: any) => {
                            options.push({
                                value: channel._id,
                                label: channel.name
                            });
                        });

                        setChannelOptions(options);
                    }
                })
                .catch(err => { });
        }
        // setInit(true);
    }, []);

    // Don't save question if no question entered
    const isCurrentQuestionValid = (problem: any) => {
        if (problem.question === '') {
            return false;
        }

        return true;
    };

    /**
     * @description Helper to set content in draft
     */
    const storeDraft = useCallback(async (type, value) => {
        await AsyncStorage.setItem(type, value);
    }, []);

    /**
     * @description Update cue with URL and file type after file is uploaded
     */
    const updateAfterFileImport = useCallback(
        (uploadURL, uploadType) => {
            const obj = { url: uploadURL, type: uploadType, title };
            setCue(JSON.stringify(obj));
        },
        [title]
    );

    console.log("createPdfviewerURL", createPdfviewerURL)

    /**
     * @description Handles creation of Cue
     */
    const handleCreate = useCallback(
        async (quizId?: string) => {
            setIsSubmitting(true);

            if (isSubmitting) return;

            if (!quizId && (cue === null || cue.toString().trim() === '')) {
                Alert(enterContentAlert);
                setIsSubmitting(false);
                return;
            }

            if ((imported && title === '') || (isQuiz && quizTitle === '')) {
                Alert(enterTitleAlert);
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && deadline < new Date()) {
                Alert('Submission deadline must be in future');
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && deadline < initiateAt) {
                Alert('Available from time must be set before deadline', '');
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && allowLateSubmission && availableUntil < deadline) {
                Alert('Late submission date must be set after deadline.')
                setIsSubmitting(false);
                return;
            }

            let saveCue = '';
            if (quizId) {
                const obj: any = {
                    quizId,
                    title: quizTitle
                };
                if (timer) {
                    obj.initiatedAt = null;
                }
                saveCue = JSON.stringify(obj);
            } else if (imported) {
                const obj = {
                    type,
                    url,
                    title
                };
                saveCue = JSON.stringify(obj);
            } else {
                saveCue = cue;
            }

            // LOCAL CUE
            if (channelId === '') {
                let subCues: any = {};
                try {
                    const value = await AsyncStorage.getItem('cues');
                    if (value) {
                        subCues = JSON.parse(value);
                    }
                } catch (e) { }

                let localCues: any[] = subCues['local'] ? subCues['local'] : [];

                let _id = localCues.length;

                while (true) {
                    const duplicateId = localCues.findIndex((item: any) => {
                        return item._id === _id;
                    });
                    if (duplicateId === -1) {
                        break;
                    } else {
                        _id++;
                    }
                }
                subCues['local'] = [
                    ...localCues,
                    {
                        _id,
                        cue: saveCue,
                        date: new Date(),
                        color,
                        shuffle,
                        frequency,
                        starred,
                        customCategory: customCategory === 'None' ? '' : customCategory,
                        endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
                    }
                ];
                const stringifiedCues = JSON.stringify(subCues);
                await AsyncStorage.setItem('cues', stringifiedCues);
                storeDraft('cueDraft', '');
                props.closeOnCreate();
            } else {
                // CHANNEL CUE
                const uString = await AsyncStorage.getItem('user');
                if (!uString) {
                    return;
                }

                const userName = await JSON.parse(uString);
                let ownerarray: any = selected;
                const userSubscriptions = await AsyncStorage.getItem('subscriptions');
                if (userSubscriptions) {
                    const list = JSON.parse(userSubscriptions);
                    list.map((i: any) => {
                        if (i.channelId === channelId) {
                            ownerarray.push(i.channelCreatedBy);
                        }
                    });
                    setSelected(ownerarray);
                }

                const user = JSON.parse(uString);
                const server = fetchAPI('');

                const variables = {
                    cue: saveCue,
                    starred,
                    color: color.toString(),
                    channelId,
                    frequency,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    shuffle,
                    createdBy: user._id,
                    gradeWeight: gradeWeight.toString(),
                    submission: submission || isQuiz,
                    deadline: submission || isQuiz ? deadline.toISOString() : '',
                    initiateAt: submission || isQuiz ? initiateAt.toISOString() : '',
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                    shareWithUserIds: !limitedShare ? null : selected,
                    limitedShares: limitedShare,
                    allowedAttempts: attempts,
                    availableUntil: (submission || isQuiz) && allowLateSubmission ? availableUntil.toISOString() : ''
                };

                server
                    .mutate({
                        mutation: createCue,
                        variables
                    })
                    .then(res => {
                        if (res.data.cue.create) {
                            Animated.timing(modalAnimation, {
                                toValue: 0,
                                duration: 150,
                                useNativeDriver: true
                            }).start(() => {
                                storeDraft('cueDraft', '');
                                setIsSubmitting(false);
                                props.closeModal();
                            });
                        }
                    })
                    .catch(err => {
                        setIsSubmitting(false);
                        Alert(somethingWentWrongAlert, checkConnectionAlert);
                    });
            }
        },
        [
            cue,
            modalAnimation,
            customCategory,
            props.saveDataInCloud,
            isQuiz,
            timer,
            duration,
            gradeWeight,
            deadline,
            initiateAt,
            submission,
            imported,
            selected,
            subscribers,
            shuffle,
            frequency,
            starred,
            color,
            notify,
            title,
            type,
            url,
            props.closeModal,
            channelId,
            endPlayAt,
            playChannelCueIndef,
            allowLateSubmission,
            availableUntil,
            quizTitle
        ]
    );

    /**
     * @description Clears cue content and imports
     */
    const clearAll = useCallback(() => {
        Alert(clearQuestionAlert, cannotUndoAlert, [
            {
                text: 'Cancel',
                style: 'cancel'
            },
            {
                text: 'Clear',
                onPress: () => {
                    setCue('<h1>Title</h1>');
                    setCueDraft('');
                    setImported(false);
                    setQuizInstructions('');
                    setUrl('');
                    setType('');
                    setTitle('');
                    setProblems([]);
                    setIsQuiz(false);
                    setTimer(false);
                    setShowEquationEditor(false);
                    setEquation('');
                }
            }
        ]);
    }, []);

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
                                setShowInitiateAtDateAndroid(false)
                                return
                            };
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
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
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
                                borderColor: '#006AFF',
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
                                    color: '#006AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15
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
                                flexDirection: 'row'
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
                                    color: '#006AFF',
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
                                setShowInitiateAtTimeAndroid(false)
                                return
                            };
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
                            if (!selectedDate) return;
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
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
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
                                borderColor: '#006AFF',
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
                                    color: '#006AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15
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
                                flexDirection: 'row'
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
                                    color: '#006AFF',
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
                                setShowDeadlineTimeAndroid(false)
                                return
                            };
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
                    marginLeft: 'auto'
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
                            if (currentDate < deadline) {
                                Alert('Late submission date must be set after deadline.')
                                return
                            };
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
                                setShowAvailableUntilDateAndroid(false)
                                return
                            };
                            const currentDate: any = selectedDate;
                            if (currentDate < deadline) {
                                Alert('Late submission date must be set after deadline.')
                                return
                            };
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
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
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
                                borderColor: '#006AFF',
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
                                    color: '#006AFF',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15
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
                                flexDirection: 'row'
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
                                    color: '#006AFF',
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

                            if (currentDate < deadline) {
                                Alert('Late submission date must be set after deadline.')
                                return
                            };

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
                                setShowAvailableUntilTimeAndroid(false)
                                return
                            };
                            const currentDate: any = selectedDate;
                            setShowAvailableUntilTimeAndroid(false);
                            setAvailableUntil(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    console.log("Props.showImportCreate", props.showImportCreate)

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                flex: 1
            }}
            keyboardVerticalOffset={dimensions.window.width < 768 ? (Platform.OS === 'ios' ? 50 : 30) : 30}
        >
            <View style={{ flex: 1 }}>
                <Animated.View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        opacity: modalAnimation,
                        // maxWidth: 900,
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        display: editorFocus && !isQuiz ? 'none' : 'flex',
                        zIndex: 500000,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            // paddingBottom: showOptions ? 20 : 0,
                            height: 50,
                            width: '100%',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                paddingTop: 5,
                                // marginRight: 20
                                position: 'absolute',
                                left: 0,
                                paddingLeft: 10
                            }}
                            onPress={() => {
                                if (showOptions) {
                                    setShowOptions(false);
                                    props.setDisableCreateNavbar(false)
                                } else {
                                    props.closeModal();
                                }
                            }}
                        >
                            <Text>
                                <Ionicons name="arrow-back-outline" size={35} color={'#1F1F1F'} />
                            </Text>
                        </TouchableOpacity>


                        <View style={{ position: 'absolute', right: 0, paddingTop: 10, display: 'flex', flexDirection: 'row' }}>
                            {/* QUIZ BUTTON FOR INSTRUCTORS */}
                            {/* {!imported && !showOptions && !isQuiz && !showBooks ? (
                                <TouchableOpacity
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => {
                                        setShowBooks(!showBooks);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 28,
                                            color: '#000',
                                            marginTop: 2,
                                            fontSize: 12,
                                            borderRadius: 15,
                                            // paddingHorizontal: 10,
                                            marginRight: 15,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            // height: 30, 
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Browse Books
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {allowQuizCreation &&
                            !imported &&
                            !showOptions &&
                            !showBooks &&
                            props.version !== 'read' ? (
                                <TouchableOpacity
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => {
                                        if (isQuiz) {
                                            clearAll();
                                            setEditorFocus(false);
                                            return;
                                        }
                                        setIsQuiz(true);
                                        setSubmission(true);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 28,
                                            color: '#000',
                                            marginTop: 2,
                                            fontSize: 12,
                                            borderRadius: 15,
                                            // paddingHorizontal: 10,
                                            marginRight: 15,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            // height: 30,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {isQuiz ? 'Clear' : 'Create Quiz'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null} */}
                            {showOptions || showBooks ? null : (
                                <TouchableOpacity
                                    onPress={async () => {
                                        // Validation for quiz before next
                                        if (isQuiz) {
                                            const validateQuiz = isQuizValid();

                                            if (!validateQuiz) return false;
                                        }

                                        // Update editor initial value
                                        const h = await AsyncStorage.getItem('cueDraft');
                                        if (h !== null) {
                                            setCueDraft(h);
                                        }

                                        props.setDisableCreateNavbar(true)
                                        setShowOptions(true);

                                        scrollViewRef.current?.scrollTo({
                                            y: 0,
                                            // animated: true,
                                        });
                                    }}
                                    disabled={isSubmitting}
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                        // marginLeft: 15
                                    }}
                                >
                                    <Text
                                        style={{
                                            // textAlign: 'center',
                                            // lineHeight: 28,
                                            // color: '#006AFF',
                                            // // backgroundColor: '#006AFF',
                                            // marginTop: 2,
                                            // fontSize: 12,
                                            // borderRadius: 15,
                                            // paddingHorizontal: 10,
                                            // fontFamily: 'inter',
                                            // overflow: 'hidden',
                                            // // height: 30,
                                            // textTransform: 'uppercase'
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#006AFF',
                                            borderRadius: 17,
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase',
                                            marginRight: 5
                                        }}
                                    >
                                        NEXT
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
                <Animated.View
                    style={{
                        display: isQuiz || imported || showBooks || showOptions ? 'flex' : 'none',
                        height: '100%'
                    }}
                >
                    <ScrollView
                        nestedScrollEnabled={true}
                        ref={scrollViewRef} style={{ flexDirection: 'column', paddingHorizontal: 20 }} indicatorStyle="black">
                        {showOptions ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    marginHorizontal: 10,
                                    alignSelf: 'center',
                                    paddingTop: 20
                                }}
                            >
                                {channels.length !== 0 ? (
                                    <View
                                        style={{
                                            display: 'flex'
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                borderRightWidth: 0,
                                                borderColor: '#f2f2f2',
                                                paddingTop: width < 768 ? 0 : 40
                                            }}
                                        >
                                            <View
                                                style={{
                                                    // flex: 1,
                                                    // flexDirection: 'row',
                                                    flexDirection: 'column',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}
                                                >
                                                    For
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    marginLeft: width < 768 ? 0 : 'auto'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        display: 'flex',
                                                        height: isChannelDropdownOpen ? getDropdownHeight(channelOptions.length) : 50,
                                                        maxWidth: 400
                                                    }}
                                                >
                                                    <DropDownPicker
                                                        listMode={Platform.OS === "android" ? "MODAL" : "SCROLLVIEW"}
                                                        open={isChannelDropdownOpen}
                                                        value={selectedChannel}
                                                        items={channelOptions}
                                                        setOpen={setIsChannelDropdownOpen}
                                                        setValue={setSelectedChannel}
                                                        zIndex={1000001}
                                                        style={{
                                                            borderWidth: 0,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#f2f2f2'
                                                        }}
                                                        dropDownContainerStyle={{
                                                            borderWidth: 0,
                                                            zIndex: 1000001,
                                                            elevation: 1000001
                                                        }}
                                                        containerStyle={{
                                                            shadowColor: '#000',
                                                            shadowOffset: {
                                                                width: 1,
                                                                height: 3
                                                            },
                                                            shadowOpacity: !isChannelDropdownOpen ? 0 : 0.08,
                                                            shadowRadius: 12,
                                                            zIndex: 1000001,
                                                            elevation: 1000001
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {channelId !== '' ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        // flex: 1,
                                                        flexDirection: 'row',
                                                        paddingBottom: 15,
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'Inter'
                                                        }}
                                                    >
                                                        Restrict Access
                                                    </Text>
                                                </View>
                                                <View>
                                                    <View
                                                        style={{
                                                            backgroundColor: 'white',
                                                            height: 40,
                                                            marginRight: 10,
                                                            flexDirection: 'row',
                                                            justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                        }}
                                                    >
                                                        <Switch
                                                            value={limitedShare}
                                                            onValueChange={() => {
                                                                setLimitedShare(!limitedShare);
                                                            }}
                                                            thumbColor={'#f4f4f6'}
                                                            trackColor={{
                                                                false: '#f4f4f6',
                                                                true: '#006AFF'
                                                            }}
                                                            style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                        />
                                                    </View>
                                                    {channelId !== '' && limitedShare ? (
                                                        <View
                                                            style={{
                                                                paddingTop: width < 768 ? 10 : 0,
                                                                backgroundColor: 'white',
                                                                marginLeft: width < 768 ? 0 : 'auto'
                                                            }}
                                                        >
                                                            <View
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    display: 'flex',
                                                                    height: isUsersDropdownOpen ? getDropdownHeight(subscribers.length) : 50,
                                                                    maxWidth: 400
                                                                }}
                                                            >
                                                                {/* <label>
                                                                    <Select
                                                                        touchUi={true}
                                                                        placeholder="Select..."
                                                                        themeVariant="light"
                                                                        value={selected}
                                                                        data={subscribers}
                                                                        selectMultiple={true}
                                                                        onChange={(val: any) => {
                                                                            setSelected(val.value);
                                                                        }}
                                                                        responsive={{
                                                                            small: {
                                                                                display: 'bubble'
                                                                            },
                                                                            medium: {
                                                                                touchUi: false
                                                                            }
                                                                        }}
                                                                        minWidth={[60, 320]}
                                                                    />
                                                                </label> */}
                                                                <DropDownPicker
                                                                    listMode={Platform.OS === "android" ? "MODAL" : "SCROLLVIEW"}
                                                                    multiple={true}
                                                                    open={isUsersDropdownOpen}
                                                                    value={selected}
                                                                    items={subscribers}
                                                                    setOpen={setIsUsersDropdownOpen}
                                                                    setValue={setSelected}
                                                                    zIndex={999999}
                                                                    style={{
                                                                        borderWidth: 0,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor: '#f2f2f2'
                                                                    }}
                                                                    dropDownContainerStyle={{
                                                                        borderWidth: 0,
                                                                        zIndex: 999999
                                                                    }}
                                                                    containerStyle={{
                                                                        shadowColor: '#000',
                                                                        shadowOffset: {
                                                                            width: 1,
                                                                            height: 3
                                                                        },
                                                                        shadowOpacity: !isUsersDropdownOpen ? 0 : 0.08,
                                                                        shadowRadius: 12,
                                                                        zIndex: 999999
                                                                    }}
                                                                />
                                                            </View>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>
                                        ) : null}

                                        {channelId !== '' ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        // flex: 1,
                                                        flexDirection: 'row',
                                                        paddingBottom: 15,
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'Inter'
                                                        }}
                                                    >
                                                        {PreferredLanguageText('submissionRequired')}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <View
                                                        style={{
                                                            backgroundColor: 'white',
                                                            height: 40,
                                                            marginRight: 10,
                                                            flexDirection: 'row',
                                                            justifyContent: width < 768 ? 'flex-start' : 'flex-end'
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
                                                                true: '#006AFF'
                                                            }}
                                                            style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                        />
                                                    </View>
                                                    <View style={{ width: '100%', marginBottom: 15 }}>

                                                        {submission ? (
                                                            <View
                                                                style={{
                                                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                                                    flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                                                    paddingTop: 12,
                                                                    backgroundColor: '#fff',
                                                                    // marginLeft: 'auto',
                                                                    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start'
                                                                }}
                                                            >
                                                                <Text style={styles.text}>Available {Platform.OS === 'android'
                                                                    ? ': ' + moment(new Date(initiateAt)).format('MMMM Do YYYY, h:mm a')
                                                                    : null}</Text>
                                                                {renderInitiateAtDateTimePicker()}
                                                            </View>
                                                        ) : null}
                                                    </View>

                                                    {/* Add it here */}

                                                    <View style={{ width: '100%' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            {submission ? (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                                                        backgroundColor: 'white',
                                                                        alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start'
                                                                    }}
                                                                >
                                                                    <Text style={styles.text}>
                                                                        {PreferredLanguageText('deadline')} {Platform.OS === 'android'
                                                                            ? ': ' + moment(new Date(deadline)).format('MMMM Do YYYY, h:mm a')
                                                                            : null}
                                                                    </Text>
                                                                    {renderDeadlineDateTimePicker()}
                                                                </View>
                                                            ) : null}
                                                        </View>

                                                        {/* Add it here */}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}
                                        {submission ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        // flex: 1,
                                                        flexDirection: 'row',
                                                        paddingBottom: 15,
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'Inter'
                                                        }}
                                                    >
                                                        Graded
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <View>
                                                        <View
                                                            style={{
                                                                backgroundColor: 'white',
                                                                height: 40,
                                                                marginRight: 10,
                                                                flexDirection: 'row',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                            }}
                                                        >
                                                            <Switch
                                                                value={graded}
                                                                onValueChange={() => setGraded(!graded)}
                                                                thumbColor={'#f4f4f6'}
                                                                trackColor={{
                                                                    false: '#f4f4f6',
                                                                    true: '#006AFF'
                                                                }}
                                                                style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View style={{ marginLeft: 'auto' }}>
                                                        {graded ? (
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent:
                                                                        width < 768 ? 'flex-start' : 'flex-end',
                                                                    backgroundColor: 'white',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <TextInput
                                                                    value={gradeWeight}
                                                                    style={{
                                                                        // width: '25%',
                                                                        borderBottomColor: '#f2f2f2',
                                                                        borderBottomWidth: 1,
                                                                        fontSize: 14,
                                                                        padding: 15,
                                                                        paddingVertical: 12,
                                                                        marginTop: 0
                                                                    }}
                                                                    placeholder={'0-100'}
                                                                    onChangeText={val => setGradeWeight(val)}
                                                                    placeholderTextColor={'#1F1F1F'}
                                                                />
                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        color: '#1F1F1F',
                                                                        textAlign: 'left',
                                                                        paddingHorizontal: 10,
                                                                        fontFamily: 'Inter'
                                                                    }}
                                                                >
                                                                    {PreferredLanguageText('percentageOverall')}
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}
                                        {/* Late Submissions */}
                                        {submission ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        // flex: 1,
                                                        flexDirection: 'row',
                                                        paddingBottom: 15,
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'Inter'
                                                        }}
                                                    >
                                                        Late Submission
                                                    </Text>
                                                </View>
                                                <View>
                                                    <View>
                                                        <View
                                                            style={{
                                                                backgroundColor: 'white',
                                                                height: 40,
                                                                marginRight: 10,
                                                                flexDirection: 'row',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                            }}
                                                        >
                                                            <Switch
                                                                value={allowLateSubmission}
                                                                onValueChange={() =>
                                                                    setAllowLateSubmission(!allowLateSubmission)
                                                                }
                                                                thumbColor={'#f4f4f6'}
                                                                trackColor={{
                                                                    false: '#f4f4f6',
                                                                    true: '#006AFF'
                                                                }}
                                                                style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View>
                                                        {allowLateSubmission ? (
                                                            <View
                                                                style={{
                                                                    width: '100%',
                                                                    display: 'flex',
                                                                    flexDirection: Platform.OS === 'ios' ? 'row' : 'column',
                                                                    backgroundColor: 'white',
                                                                    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
                                                                    paddingTop: Platform.OS === 'ios' ? 0 : 10
                                                                }}
                                                            >
                                                                <Text style={styles.text}>Ends on {Platform.OS === 'android'
                                                                    ? ': ' + moment(new Date(availableUntil)).format('MMMM Do YYYY, h:mm a')
                                                                    : null}</Text>
                                                                {renderAvailableUntilDateTimePicker()}
                                                                {/* <MobiscrollDatePicker
                                                                    controls={['date', 'time']}
                                                                    touchUi={true}
                                                                    theme="ios"
                                                                    value={availableUntil}
                                                                    themeVariant="light"
                                                                    // inputComponent="input"
                                                                    inputProps={{
                                                                        placeholder: 'Please Select...'
                                                                    }}
                                                                    onChange={(event: any) => {
                                                                        const date = new Date(event.value);
                                                                        if (date < deadline) return;
                                                                        const roundValue = roundSeconds(date);
                                                                        setAvailableUntil(roundValue);
                                                                    }}
                                                                    responsive={{
                                                                        xsmall: {
                                                                            controls: ['date', 'time'],
                                                                            display: 'bottom',
                                                                            touchUi: true
                                                                        },
                                                                        medium: {
                                                                            controls: ['date', 'time'],
                                                                            display: 'anchored',
                                                                            touchUi: false
                                                                        }
                                                                    }}
                                                                /> */}
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}

                                        {/* Allowed attempts */}

                                        {submission && isQuiz ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        // flex: 1,
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white',
                                                        paddingBottom: 15
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'Inter'
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
                                                            justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                        }}
                                                    >
                                                        <Switch
                                                            value={unlimitedAttempts}
                                                            onValueChange={() => {
                                                                if (!unlimitedAttempts) {
                                                                    setAttempts('');
                                                                } else {
                                                                    setAttempts('1');
                                                                }
                                                                setUnlimitedAttempts(!unlimitedAttempts);
                                                            }}
                                                            thumbColor={'#f4f4f6'}
                                                            trackColor={{
                                                                false: '#f4f4f6',
                                                                true: '#006AFF'
                                                            }}
                                                            style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                        />
                                                    </View>
                                                    {!unlimitedAttempts ? (
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                backgroundColor: 'white',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Text style={styles.text}>Allowed attempts</Text>
                                                            <TextInput
                                                                value={attempts}
                                                                style={{
                                                                    width: '25%',
                                                                    borderBottomColor: '#F8F9FA',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 14,
                                                                    padding: 15,
                                                                    paddingVertical: 12,
                                                                    marginTop: 0
                                                                }}
                                                                placeholder={''}
                                                                onChangeText={val => {
                                                                    if (Number.isNaN(Number(val))) return;
                                                                    setAttempts(val);
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                ) : null}

                                <View
                                    style={{
                                        display: 'flex'
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            borderRightWidth: 0,
                                            borderColor: '#f2f2f2'
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '100%',
                                                backgroundColor: 'white',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: channels.length === 0 && width < 768 ? 0 : 40
                                            }}
                                        >
                                            <View
                                                style={{
                                                    // flex: 1,
                                                    flexDirection: 'row',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}
                                                >
                                                    {PreferredLanguageText('category')}
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    backgroundColor: 'white'
                                                    // alignItems: 'center'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        maxWidth: 400,
                                                        width: '85%',
                                                        backgroundColor: 'white',
                                                        marginLeft: width < 768 ? 0 : 'auto'
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
                                                                    fontSize: 14,
                                                                    padding: 10,
                                                                    paddingVertical: 15,
                                                                    width: '100%'
                                                                }}
                                                                placeholder={'Enter Category'}
                                                                onChangeText={val => {
                                                                    setCustomCategory(val);
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                        </View>
                                                    ) : (
                                                        <View
                                                            style={{
                                                                height: isCategoryDropdownOpen ? getDropdownHeight(categoriesOptions.length) : 50,
                                                                marginBottom: isCategoryDropdownOpen ? 20 : 0
                                                            }}
                                                        >
                                                            <DropDownPicker
                                                                listMode={Platform.OS === "android" ? "MODAL" : "SCROLLVIEW"}
                                                                open={isCategoryDropdownOpen}
                                                                value={customCategory}
                                                                items={categoriesOptions}
                                                                setOpen={setIsCategoryDropdownOpen}
                                                                setValue={setCustomCategory}
                                                                zIndex={1000001}
                                                                style={{
                                                                    borderWidth: 0,
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor: '#f2f2f2'
                                                                }}
                                                                dropDownContainerStyle={{
                                                                    borderWidth: 0,
                                                                    zIndex: 1000001,
                                                                    elevation: 1000001
                                                                }}
                                                                containerStyle={{
                                                                    shadowColor: '#000',
                                                                    shadowOffset: {
                                                                        width: 1,
                                                                        height: 3
                                                                    },
                                                                    shadowOpacity: !isCategoryDropdownOpen ? 0 : 0.08,
                                                                    shadowRadius: 8,
                                                                    zIndex: 1000001,
                                                                    elevation: 1000001
                                                                }}
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                                <View
                                                    style={{
                                                        // width: '15%',
                                                        backgroundColor: 'white',
                                                        marginLeft: 20
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
                                                                textAlign: 'center',
                                                                lineHeight: 20,
                                                                width: '100%',
                                                                paddingTop: 15
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
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            width: '100%',
                                            borderRightWidth: 0,
                                            borderColor: '#f2f2f2',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40,
                                            alignItems: width < 1024 ? 'flex-start' : 'center',
                                            paddingBottom: 15
                                        }}
                                    >
                                        <View
                                            style={{
                                                // flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter',
                                                    paddingBottom: 15
                                                }}
                                            >
                                                {PreferredLanguageText('priority')}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 10 }}>
                                                <ScrollView
                                                    style={{ ...styles.colorBar, height: 25 }}
                                                    horizontal={true}
                                                    showsHorizontalScrollIndicator={false}
                                                >
                                                    {colorChoices.map((c: string, i: number) => {
                                                        return (
                                                            <View
                                                                style={
                                                                    color === i
                                                                        ? styles.colorContainerOutline
                                                                        : styles.colorContainer
                                                                }
                                                                key={Math.random()}
                                                            >
                                                                <TouchableOpacity
                                                                    style={{
                                                                        width: 12,
                                                                        height: 12,
                                                                        borderRadius: 6,
                                                                        backgroundColor: colorChoices[i]
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
                                </View>
                                {/* <View
                                    style={{
                                        width: '100%',
                                        flexDirection: 'column'
                                    }}>
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}>
                                        <View
                                            style={{
                                                // flex: 1,
                                                flexDirection: 'row',
                                                paddingBottom: 15,
                                                backgroundColor: 'white'
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter'
                                                }}>
                                                Remind
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
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
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: '#f2f2f2',
                                                    true: '#006AFF'
                                                }}
                                                activeThumbColor="white"
                                            />
                                        </View>
                                    </View>
                                    {notify ? (
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: 40
                                            }}>
                                            <View
                                                style={{
                                                    // flex: 1,
                                                    flexDirection: 'row',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Repeat Reminder
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        height: 40,
                                                        marginRight: 10,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                    }}>
                                                    <Switch
                                                        value={!shuffle}
                                                        onValueChange={() => setShuffle(!shuffle)}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f2f2f2',
                                                            true: '#006AFF'
                                                        }}
                                                        activeThumbColor="white"
                                                    />
                                                </View>
                                                {!shuffle ? (
                                                    <View
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white',
                                                            alignItems: 'center'
                                                        }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#1F1F1F',
                                                                textAlign: 'right',
                                                                paddingRight: 10,
                                                                fontFamily: 'Inter'
                                                            }}>
                                                            {PreferredLanguageText('remindEvery')}
                                                        </Text>
                                                        <label style={{ width: 140 }}>
                                                            <Select
                                                                touchUi={true}
                                                                themeVariant="light"
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
                                                        </label>
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white'
                                                        }}>
                                                        <View>
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: '#1F1F1F',
                                                                    textAlign: 'right',
                                                                    paddingRight: 10,
                                                                    marginTop: 5
                                                                }}>
                                                                {PreferredLanguageText('RemindOn')}
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
                                                                    placeholder: 'Please Select...'
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
                                                                        touchUi: true
                                                                    },
                                                                    medium: {
                                                                        controls: ['date', 'time'],
                                                                        display: 'anchored',
                                                                        touchUi: false
                                                                    }
                                                                }}
                                                            />
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ) : null}
                                    {notify && !shuffle ? (
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: 40
                                            }}>
                                            <View
                                                style={{
                                                    // flex: 1,
                                                    flexDirection: 'row',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Remind Indefinitely
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        height: 40,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                        marginRight: 10
                                                    }}>
                                                    <Switch
                                                        value={playChannelCueIndef}
                                                        onValueChange={() =>
                                                            setPlayChannelCueIndef(!playChannelCueIndef)
                                                        }
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f2f2f2',
                                                            true: '#006AFF'
                                                        }}
                                                        activeThumbColor="white"
                                                    />
                                                </View>
                                                {playChannelCueIndef ? null : (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white'
                                                        }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindTill')}
                                                        </Text>
                                                        <MobiscrollDatePicker
                                                            controls={['date', 'time']}
                                                            touchUi={true}
                                                            theme="ios"
                                                            value={endPlayAt}
                                                            themeVariant="light"
                                                            inputProps={{
                                                                placeholder: 'Please Select...'
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
                                                                    touchUi: true
                                                                },
                                                                medium: {
                                                                    controls: ['date', 'time'],
                                                                    display: 'anchored',
                                                                    touchUi: false
                                                                }
                                                            }}
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ) : null}
                                </View> */}
                                {/* Timed Quiz */}
                                {isQuiz ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}
                                    >
                                        <View
                                            style={{
                                                // flex: 1,
                                                flexDirection: 'row',
                                                paddingBottom: 15,
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter'
                                                }}
                                            >
                                                Timed
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    marginRight: 10,
                                                    flexDirection: 'row',
                                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                }}
                                            >
                                                <Switch
                                                    value={timer}
                                                    onValueChange={() => {
                                                        if (timer) {
                                                            setDuration({
                                                                hours: 1,
                                                                minutes: 0,
                                                                seconds: 0
                                                            });
                                                        }
                                                        setTimer(!timer);
                                                    }}
                                                    thumbColor={'#f4f4f6'}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#006AFF'
                                                    }}
                                                    style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                />
                                            </View>
                                            {timer ? (
                                                <View
                                                    style={{
                                                        borderRightWidth: 0,
                                                        paddingTop: 0,
                                                        borderColor: '#f2f2f2',
                                                        flexDirection: 'row',
                                                        marginLeft: 'auto'
                                                    }}
                                                >
                                                    <View>
                                                        <Menu
                                                            onSelect={(hour: any) =>
                                                                setDuration({
                                                                    ...duration,
                                                                    hours: hour
                                                                })
                                                            }
                                                        >
                                                            <MenuTrigger>
                                                                <Text
                                                                    style={{
                                                                        // fontFamily: "inter",
                                                                        fontSize: 15,
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    {duration.hours} H{' '}
                                                                    <Ionicons name="chevron-down-outline" size={15} />{' '}
                                                                    &nbsp; &nbsp;: &nbsp; &nbsp;
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions
                                                                customStyles={{
                                                                    optionsContainer: {
                                                                        padding: 10,
                                                                        borderRadius: 15,
                                                                        shadowOpacity: 0,
                                                                        borderWidth: 1,
                                                                        borderColor: '#f2f2f2',
                                                                        overflow: 'scroll',
                                                                        maxHeight: '100%'
                                                                    }
                                                                }}
                                                            >
                                                                {hours.map((hour: any) => {
                                                                    return (
                                                                        <MenuOption value={hour}>
                                                                            <Text>{hour}</Text>
                                                                        </MenuOption>
                                                                    );
                                                                })}
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View>
                                                    <View>
                                                        <Menu
                                                            onSelect={(min: any) =>
                                                                setDuration({
                                                                    ...duration,
                                                                    minutes: min
                                                                })
                                                            }
                                                        >
                                                            <MenuTrigger>
                                                                <Text
                                                                    style={{
                                                                        // fontFamily: "inter",
                                                                        fontSize: 15,
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    {duration.minutes} m{' '}
                                                                    <Ionicons name="chevron-down-outline" size={15} />
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions
                                                                customStyles={{
                                                                    optionsContainer: {
                                                                        padding: 10,
                                                                        borderRadius: 15,
                                                                        shadowOpacity: 0,
                                                                        borderWidth: 1,
                                                                        borderColor: '#f2f2f2',
                                                                        overflow: 'scroll',
                                                                        maxHeight: '100%'
                                                                    }
                                                                }}
                                                            >
                                                                {minutes.map((min: any) => {
                                                                    return (
                                                                        <MenuOption value={min}>
                                                                            <Text>{min}</Text>
                                                                        </MenuOption>
                                                                    );
                                                                })}
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                ) : null}

                                {/* if Quiz then ask Shuffle */}
                                {isQuiz ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}
                                    >
                                        <View
                                            style={{
                                                // flex: 1,
                                                flexDirection: 'row',
                                                paddingBottom: 15,
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter'
                                                }}
                                            >
                                                Random Order
                                            </Text>
                                        </View>
                                        <View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    flexDirection: 'row',
                                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                    marginRight: 10
                                                }}
                                            >
                                                <Switch
                                                    value={shuffleQuiz}
                                                    onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                                                    thumbColor={'#f4f4f6'}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#006AFF'
                                                    }}
                                                    style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ) : (
                            <View style={{ marginBottom: 200 }}>
                                {imported || isQuiz ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            borderRightWidth: 0,
                                            borderColor: '#f2f2f2',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 10
                                        }}
                                    >
                                        <AutoGrowingTextInput
                                            value={isQuiz ? quizTitle : title}
                                            onChange={(event: any) => {
                                                if (isQuiz) {
                                                    setQuizTitle(event.nativeEvent.text || '')
                                                } else {
                                                    setTitle(event.nativeEvent.text || '')
                                                }

                                            }}
                                            style={{
                                                fontFamily: 'overpass',
                                                // width: 300,
                                                flex: 1,
                                                marginRight: 20,
                                                maxWidth: 400,
                                                // borderBottom: '1px solid #f2f2f2',
                                                borderBottomWidth: 1,
                                                borderColor: '#f2f2f2',
                                                fontSize: 14,
                                                paddingTop: 13,
                                                paddingBottom: 13,
                                                marginTop: 12,
                                                marginBottom: 15,
                                                borderRadius: 1
                                            }}
                                            placeholder={'Title'}
                                            placeholderTextColor="#66737C"
                                            maxHeight={200}
                                            minHeight={45}
                                            enableScrollToCaret
                                        // ref={}
                                        />
                                        {!isQuiz ? (
                                            <TouchableOpacity
                                                style={{
                                                    marginLeft: 'auto',
                                                    paddingTop: 15,
                                                    marginRight: 10
                                                    // flex: 1
                                                }}
                                                onPress={() => clearAll()}
                                            >
                                                {/* <Text
                                                    style={{
                                                        fontSize: 15,
                                                        lineHeight: 34,
                                                        fontFamily: 'inter',
                                                        color: '#006AFF'
                                                    }}
                                                >
                                                    CLEAR
                                                </Text> */}
                                                <Ionicons size={22} name={'trash-outline'} color="#006AFF" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                ) : null}
                                <View
                                    style={{
                                        width: '100%',
                                        minHeight: isQuiz ? 0 : 500,
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {isQuiz ? (
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <View
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flexDirection: 'row',
                                                    width: '100%'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 600,
                                                        paddingTop: 15,
                                                        borderColor: '#f2f2f2',
                                                        borderBottomWidth: 1
                                                    }}
                                                >
                                                    <RichToolbar
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            maxHeight: 40,
                                                            height: 40,
                                                            display: editorFocus ? 'flex' : 'none'
                                                        }}
                                                        flatContainerStyle={{
                                                            paddingHorizontal: 12
                                                        }}
                                                        editor={RichText}
                                                        disabled={false}
                                                        selectedIconTint={'#006AFF'}
                                                        disabledIconTint={'#bfbfbf'}
                                                        actions={[
                                                            actions.keyboard,
                                                            actions.setBold,
                                                            actions.setItalic,
                                                            actions.setUnderline,
                                                            actions.insertImage,
                                                            actions.insertLink,
                                                            actions.insertBulletsList,
                                                            actions.insertOrderedList,
                                                            actions.heading1,
                                                            actions.heading3,
                                                            actions.setParagraph,
                                                            actions.foreColor,
                                                            actions.hiliteColor,
                                                            // 'insertEmoji'
                                                        ]}
                                                        iconMap={{
                                                            [actions.keyboard]: ({ tintColor }) => (
                                                                <Text
                                                                    style={[
                                                                        styles.tib,
                                                                        { color: 'green', fontSize: 20 }
                                                                    ]}
                                                                >
                                                                    ✓
                                                                </Text>
                                                            ),
                                                            [actions.insertVideo]: importIcon,
                                                            insertEmoji: emojiIcon,
                                                            [actions.heading1]: ({ tintColor }) => (
                                                                <Text
                                                                    style={[
                                                                        styles.tib,
                                                                        {
                                                                            color: tintColor,
                                                                            fontSize: 19,
                                                                            paddingBottom: 1
                                                                        }
                                                                    ]}
                                                                >
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
                                                                            paddingBottom: 1
                                                                        }
                                                                    ]}
                                                                >
                                                                    H3
                                                                </Text>
                                                            ),
                                                            [actions.setParagraph]: ({ tintColor }) => (
                                                                <Text
                                                                    style={[
                                                                        styles.tib,
                                                                        {
                                                                            color: tintColor,
                                                                            fontSize: 19,
                                                                            paddingBottom: 1
                                                                        }
                                                                    ]}
                                                                >
                                                                    p
                                                                </Text>
                                                            ),
                                                            [actions.foreColor]: ({ tintColor }) => (
                                                                <Text
                                                                    style={{
                                                                        fontSize: 19,
                                                                        fontWeight: 'bold',
                                                                        color: 'red'
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
                                                                        paddingHorizontal: 2
                                                                    }}
                                                                >
                                                                    H
                                                                </Text>
                                                            )
                                                        }}
                                                        hiliteColor={handleHiliteColor}
                                                        foreColor={handleForeColor}
                                                        insertEmoji={handleEmoji}
                                                        onPressAddImage={() => handleAddImage(null)}
                                                        onInsertLink={() => handleInsertLink(null)}
                                                    />
                                                    <ScrollView
                                                        horizontal={false}
                                                        style={{
                                                            backgroundColor: '#f2f2f2',
                                                            height: 120,
                                                            borderColor: '#f2f2f2',
                                                            borderWidth: editorFocus ? 1 : 0
                                                        }}
                                                        keyboardDismissMode={'none'}
                                                        ref={scrollRef}
                                                        nestedScrollEnabled={true}
                                                        scrollEventThrottle={20}
                                                        indicatorStyle={'black'}
                                                        showsHorizontalScrollIndicator={true}
                                                        persistentScrollbar={true}
                                                        onLayout={(event: any) => {
                                                            const { x, y, height, width } = event.nativeEvent.layout;
                                                            setScrollViewHeight(height);
                                                        }}
                                                    >
                                                        <RichEditor
                                                            key={reloadEditorKey.toString()}
                                                            ref={RichText}
                                                            useContainer={true}
                                                            style={{
                                                                width: '100%',
                                                                paddingHorizontal: 10,
                                                                backgroundColor: '#fff',
                                                                display: 'flex',
                                                                flex: 1,
                                                                height: '100%',
                                                                minHeight: 120,
                                                                borderBottomColor: '#f2f2f2',
                                                                borderBottomWidth: 1
                                                            }}
                                                            editorStyle={{
                                                                backgroundColor: '#fff',
                                                                placeholderColor: '#a2a2ac',
                                                                color: '#2f2f3c',
                                                                contentCSSText: 'font-size: 16px; min-height: 120;'
                                                            }}
                                                            initialContentHTML={quizInstructions}
                                                            initialHeight={120}
                                                            onScroll={() => Keyboard.dismiss()}
                                                            placeholder={'Quiz instructions'}
                                                            onChange={text => {
                                                                const modifedText = text.split('&amp;').join('&');
                                                                setQuizInstructions(modifedText);
                                                            }}
                                                            // onHeightChange={handleHeightChange}
                                                            onHeightChange={(height: React.SetStateAction<number>) => {
                                                                console.log("Set height", height)
                                                                setHeight(height);
                                                                if (height >= scrollViewHeight) {
                                                                    setTimeout(() => {
                                                                        scrollViewRef && scrollViewRef?.current?.scrollToEnd();
                                                                    });
                                                                }
                                                            }}
                                                            onFocus={() => {
                                                                setQuizEditorRef({})
                                                                setEditorFocus(true)
                                                            }}
                                                            onBlur={() => setEditorFocus(false)}
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
                                                </View>
                                            </View>
                                            <QuizCreate
                                                problems={problems}
                                                headers={headers}
                                                setProblems={(p: any) => setProblems(p)}
                                                setHeaders={(h: any) => setHeaders(h)}
                                                // Pass in Methods to open
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
                                            />
                                        </View>
                                    ) : imported ? (
                                        type === 'mp4' ||
                                            type === 'oga' ||
                                            type === 'mov' ||
                                            type === 'wmv' ||
                                            type === 'mp3' ||
                                            type === 'mov' ||
                                            type === 'mpeg' ||
                                            type === 'mp2' ||
                                            type === 'wav' ? (
                                            <Video
                                                ref={videoRef}
                                                style={{
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                                source={{
                                                    uri: url
                                                }}
                                                useNativeControls
                                                resizeMode="contain"
                                                isLooping
                                            />
                                        ) : (
                                            <View
                                                key={url + JSON.stringify(showOptions)}
                                                style={{ flex: 1, paddingTop: 20 }}
                                            >
                                                {/* <div
                                                    className="webviewer"
                                                    ref={RichText}
                                                    style={{
                                                        height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh',
                                                        borderWidth: 1,
                                                        borderColor: '#f2f2f2',
                                                        borderRadius: 1
                                                    }}></div> */}
                                                <WebView source={{ uri: createPdfviewerURL }} />
                                            </View>
                                        )
                                    ) : null}
                                </View>
                            </View>
                        )}

                        {!showOptions ? null : (
                            <View style={styles.footer}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        height: 50,
                                        paddingTop: 10
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={async () => {
                                            if (isQuiz) {
                                                if (channelId === '') {
                                                    Alert('Select a channel to share quiz.');
                                                    return;
                                                }
                                                createNewQuiz();
                                            } else {
                                                await handleCreate();
                                            }
                                        }}
                                        disabled={isSubmitting || creatingQuiz}
                                        style={{
                                            borderRadius: 15,
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        {channelId === '' ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#006AFF',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    height: 35,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {isSubmitting ? 'Creating...' : 'Create'}
                                            </Text>
                                        ) : (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#006AFF',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    height: 35,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {isSubmitting ? 'Creating...' : 'CREATE'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        {/* Collapsible ends here */}
                    </ScrollView>

                    {showBooks ? (
                        <Books
                            onUpload={(obj: any) => {
                                setCue(JSON.stringify(obj));
                                // setShowBooks(false);
                                props.setCreateActiveTab('Content')
                            }}
                            hideBars={(show: boolean) => setEditorFocus(show)}
                        />
                    ) : null}
                </Animated.View>
                <View
                    style={{
                        display: isQuiz || imported || showBooks || showOptions ? 'none' : 'flex',
                        height: '100%',
                        // marginTop: editorFocus ? 0 : 10
                    }}
                >
                    {isQuiz || imported || showBooks || showOptions ? null : (
                        <View style={{ height: '100%' }}>
                            <RichToolbar
                                style={{
                                    borderColor: '#f2f2f2',
                                    borderBottomWidth: 1,
                                    backgroundColor: '#fff',
                                    display: editorFocus ? 'flex' : 'none',
                                    maxHeight: 40,
                                    height: 40
                                }}
                                flatContainerStyle={{
                                    paddingHorizontal: 12
                                }}
                                editor={RichText}
                                disabled={false}
                                selectedIconTint={'#006AFF'}
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
                                    insertEmoji: emojiIcon
                                }}
                                insertEmoji={handleEmoji}
                                insertVideo={handleUploadAudioVideo}
                                insertFile={handleUploadFile}
                                onPressAddImage={() => handleAddImage(null)}
                                onInsertLink={() => handleInsertLink(null)}
                            />
                            <ScrollView
                                horizontal={false}
                                style={{
                                    backgroundColor: '#f2f2f2',
                                    // maxHeight: editorFocus ? 340 : 'auto',
                                    height: '100%'
                                }}
                                keyboardDismissMode={'none'}
                                ref={scrollRef}
                                nestedScrollEnabled={true}
                                scrollEventThrottle={20}
                                indicatorStyle={'black'}
                                showsHorizontalScrollIndicator={true}
                                persistentScrollbar={true}
                            // onContentSizeChange={(contentWidth, contentHeight) => {
                            //     scrollRef.current?.scrollToEnd({ animated: false });
                            // }}
                            >
                                <RichEditor
                                    key={reloadEditorKey.toString()}
                                    ref={RichText}
                                    useContainer={true}
                                    style={{
                                        width: '100%',
                                        paddingHorizontal: 10,
                                        backgroundColor: '#fff',
                                        // borderRadius: 15,
                                        minHeight: '100%',
                                        display: isQuiz || imported ? 'none' : 'flex',
                                        // borderTopWidth: 1,
                                        // borderColor: '#f2f2f2',
                                        marginBottom: editorFocus ? 0 : 200,
                                        flex: 1,
                                        height: '100%'
                                    }}
                                    editorStyle={{
                                        backgroundColor: '#fff',
                                        placeholderColor: '#a2a2ac',
                                        color: '#2f2f3c',
                                        contentCSSText: 'font-size: 16px; min-height: 400px;'
                                    }}
                                    initialContentHTML={cueDraft}
                                    initialHeight={400}
                                    onScroll={() => Keyboard.dismiss()}
                                    placeholder={PreferredLanguageText('title')}
                                    onChange={text => {
                                        console.log("Set cue", text)
                                        const modifedText = text.split('&amp;').join('&');
                                        setCue(modifedText);
                                    }}

                                    onHeightChange={handleHeightChange}
                                    onFocus={() => setEditorFocus(true)}
                                    onBlur={() => setEditorFocus(false)}
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

                            {/* <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={{
                                    flex: 1
                                }}
                                keyboardVerticalOffset={100}
                            > */}
                            <RichToolbar
                                style={{
                                    borderColor: '#f2f2f2',
                                    borderTopWidth: 1,
                                    backgroundColor: '#fff',
                                    display: editorFocus ? 'flex' : 'none'
                                }}
                                flatContainerStyle={{
                                    paddingHorizontal: 12
                                }}
                                editor={RichText}
                                disabled={false}
                                // iconTint={color}
                                selectedIconTint={'#006AFF'}
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
                                    actions.setSubscript
                                    // actions.removeFormat
                                    // Insert stuff
                                    // 'insertHTML',
                                    // 'fontSize'
                                ]} // default defaultActions
                                iconMap={{
                                    [actions.heading1]: ({ tintColor }) => (
                                        <Text
                                            style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}
                                        >
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
                                                    paddingBottom: 1
                                                }
                                            ]}
                                        >
                                            H3
                                        </Text>
                                    ),
                                    [actions.setParagraph]: ({ tintColor }) => (
                                        <Text
                                            style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}
                                        >
                                            p
                                        </Text>
                                    ),
                                    [actions.foreColor]: ({ tintColor }) => (
                                        <Text
                                            style={{
                                                fontSize: 19,
                                                fontWeight: 'bold',
                                                color: 'red'
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
                                                paddingHorizontal: 2
                                            }}
                                        >
                                            H
                                        </Text>
                                    )
                                }}
                                hiliteColor={handleHiliteColor}
                                foreColor={handleForeColor}
                            // removeFormat={handleRemoveFormat}
                            />

                            {/* </KeyboardAvoidingView> */}
                        </View>
                    )}
                </View>
            </View>
            {emojiVisible || insertImageVisible || insertLinkVisible || hiliteColorVisible || foreColorVisible ? (
                <Reanimated.View
                    style={{
                        alignItems: 'center',
                        backgroundColor: 'black',
                        opacity: 0.3,
                        height: '100%',
                        top: 0,
                        left: 0,
                        width: '100%',
                        position: 'absolute'
                    }}
                >
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => {
                            setEmojiVisible(false)
                            setInsertImageVisible(false)
                            setInsertLinkVisible(false)
                            setHiliteColorVisible(false)
                            setForeColorVisible(false)
                        }}>
                    </TouchableOpacity>
                </Reanimated.View>
            ) : null}
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
                    callbackNode={fall}
                />
            )}
            {insertImageVisible && (
                <BottomSheet
                    snapPoints={[0, 200]}
                    close={() => {
                        setInsertImageVisible(false);
                    }}
                    isOpen={insertImageVisible}
                    title={'Insert image'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10 }}>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#006AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center'
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
                                        color: '#fff'
                                    }}
                                >
                                    {' '}
                                    Camera{' '}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#006AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center'
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
                                        color: '#fff'
                                    }}
                                >
                                    {' '}
                                    Gallery{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                    callbackNode={fall}
                />
            )}
            {insertLinkVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
                    close={() => {
                        setInsertLinkVisible(false);
                    }}
                    isOpen={insertLinkVisible}
                    title={'Insert Link'}
                    renderContent={() => <InsertLink onInsertLink={onInsertLink} />}
                    header={false}
                    callbackNode={fall}
                />
            )}
            {hiliteColorVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
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
                                alignItems: 'center'
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={hiliteColor}
                                onChange={(color: string) => setHiliteColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10
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
                                        color: '#006AFF'
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                    callbackNode={fall}
                />
            )}
            {foreColorVisible && (
                <BottomSheet
                    snapPoints={[0, 350]}
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
                                alignItems: 'center'
                            }}
                        >
                            <ColorPicker
                                editorColors={true}
                                color={foreColor}
                                onChange={(color: string) => setForeColor(color)}
                            />
                            <TouchableOpacity
                                style={{
                                    marginTop: 10
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
                                        color: '#006AFF'
                                    }}
                                >
                                    {' '}
                                    Remove{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                    callbackNode={fall}
                />
            )}
        </KeyboardAvoidingView>
    );
};

export default Create;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 30,
        lineHeight: 18,
        marginBottom: 250
    },
    colorContainer: {
        lineHeight: 25,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 10,
        paddingHorizontal: 4,
        backgroundColor: 'white'
    },
    colorContainerOutline: {
        lineHeight: 25,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 10,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 0,
        marginBottom: 20
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 25
    },
    text: {
        fontSize: 14,
        color: '#1F1F1F',
        textAlign: 'left',
        paddingRight: 10,
        fontFamily: 'Inter'
    },
    all: {
        fontSize: 12,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10
    }
});
