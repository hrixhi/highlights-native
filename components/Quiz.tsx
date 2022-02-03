// REACT
import React, { useEffect, useState, useCallback, useRef, createRef } from 'react';
import {
    StyleSheet,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Switch,
    Keyboard,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import lodash from 'lodash';

// COMPONENT
import { Text, View } from './Themed';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import FileUpload from './UploadFiles';
import useDynamicRefs from 'use-dynamic-refs';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';

const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');

const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [problems, setProblems] = useState<any[]>(props.problems.slice());
    const [headers, setHeaders] = useState<any>(props.headers);
    const [instructions, setInstructions] = useState(props.instructions);
    const [initialInstructions, setInitialInstructions] = useState(props.instructions);
    const [solutions, setSolutions] = useState<any>([]);
    const [initialSolutions, setInitialSolutions] = useState<any>([]);
    const [shuffledProblems, setShuffledProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0
    });
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [editQuestion, setEditQuestion] = useState<any>({});
    const [modifiedCorrectAnswerProblems, setModifiedCorrectAnswerProblems] = useState<any[]>([]);
    const [regradeChoices, setRegradeChoices] = useState<any[]>([]);
    const [timer, setTimer] = useState(false);
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(props.shuffleQuiz);
    const [problemRefs, setProblemRefs] = useState<any[]>(props.problems.map(() => createRef(null)));
    const [showFormulas, setShowFormulas] = useState<any[]>(props.problems.map((prob: any) => false));
    const [responseEquations, setResponseEquations] = useState<any[]>(props.problems.map((prob: any) => ''));
    const [getRef, setRef] = useDynamicRefs();
    const [optionEquations, setOptionEquations] = useState<any[]>([]);
    const [showOptionFormulas, setShowOptionFormulas] = useState<any[]>([]);
    const regradeOptions: any = {
        awardCorrectBoth: 'Award points for both corrected and previously correct answers (no scores will be reduced)',
        onlyAwardPointsForNew: "Only award points for new correct answer (some students' scores may be deducted)",
        giveEveryoneFullCredit: 'Give everyone full credit',
        noRegrading: 'Update question without regrading.'
    };
    let RichText: any = useRef();
    const [editorFocus, setEditorFocus] = useState(false);
    const [optionEditorRefs, setOptionEditorRefs] = useState<boolean[]>([]);
    const [solutionEditorRefs, setSolutionEditorRefs] = useState<boolean[]>([]);

    console.log('Quiz component props', props);

    // HOOKS

    /**
     * @description Loads Quiz properties from props
     */
    useEffect(() => {
        setHeaders(props.headers);
        setInstructions(props.instructions);
        setInitialInstructions(props.instructions);
        setShuffleQuiz(props.shuffleQuiz);
        if (props.duration) {
            setTimer(true);

            let hours = Math.floor(props.duration / 3600);

            let minutes = Math.floor((props.duration - hours * 3600) / 60);

            setDuration({
                hours,
                minutes,
                seconds: 0
            });
        } else {
            setTimer(false);
        }
    }, [props.headers, props.instructions, props.shuffleQuiz, props.duration]);

    /**
     * @description Over here the solutions object for Quiz is first set and updated based on changes...
     */
    useEffect(() => {
        if (props.isOwner) return;

        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions);

            // Load initial solutions for free-response text editors
            if (initialSolutions.length === 0) {
                setInitialSolutions(lodash.cloneDeep(props.solutions));
            }
        } else {
            const solutionInit: any = [];
            problems.map((problem: any) => {
                if (!problem.questionType || problem.questionType === 'trueFalse') {
                    const arr: any = [];

                    problem.options.map((i: any) => {
                        arr.push({
                            options: i.option,
                            isSelected: false
                        });
                    });

                    solutionInit.push({
                        selected: arr
                    });
                } else {
                    solutionInit.push({
                        response: ''
                    });
                }
            });
            setSolutions(solutionInit);
            props.setSolutions(solutionInit);
        }
    }, [problems, props.solutions, props.setSolutions, props.isOwner]);

    /**
     * @description Shuffle problems
     */
    useEffect(() => {
        if (props.shuffleQuiz && !props.isOwner) {
            setLoading(true);
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated;
            });

            setProblems(updatedProblemsWithIndex);

            const headerPositions = Object.keys(headers);

            // Headers not at index 0
            const filteredHeaderPositions = headerPositions.filter((pos: any) => pos > 0);

            // If headers then we only shuffle the questions between each header
            if (filteredHeaderPositions.length > 0) {
                let arrayOfArrays = [];

                let start = 0;

                for (let i = 0; i <= filteredHeaderPositions.length; i++) {
                    if (i === filteredHeaderPositions.length) {
                        const subArray = updatedProblemsWithIndex.slice(start, updatedProblemsWithIndex.length);
                        arrayOfArrays.push(subArray);
                    } else {
                        const subArray = updatedProblemsWithIndex.slice(start, Number(filteredHeaderPositions[i]));
                        arrayOfArrays.push(subArray);
                        start = Number(filteredHeaderPositions[i]);
                    }
                }

                let shuffled: any = [];

                for (let i = 0; i < arrayOfArrays.length; i++) {
                    const s = shuffle(arrayOfArrays[i]);
                    shuffled.push(s);
                }

                const shuffledArray = shuffled.flat();

                setShuffledProblems(shuffledArray);
            } else {
                const shuffledArray = shuffle(updatedProblemsWithIndex);

                setShuffledProblems(shuffledArray);
            }
        } else {
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated;
            });

            setProblems(updatedProblemsWithIndex);
        }
        setLoading(false);
    }, [props.shuffleQuiz, headers]);

    /**
     * @description Keeps track of which problems have been modified by Owner
     */
    useEffect(() => {
        // Determine if a problem has changed or is same as before
        const modified = problems.map((prob: any, index: number) => {
            // Only regrade MCQs and True and False
            if (prob.questionType === '' || prob.questionType === 'trueFalse') {
                const options: any[] = prob.options;

                const unmodifiedOptions: any[] = props.unmodifiedProblems[index].options;

                let modifiedCorrectAnswer = false;

                options.map((o: any, i: number) => {
                    if (o.isCorrect !== unmodifiedOptions[i].isCorrect) {
                        modifiedCorrectAnswer = true;
                    }
                });

                return modifiedCorrectAnswer;
            }

            return false;
        });

        setModifiedCorrectAnswerProblems(modified);
    }, [problems]);

    /**
     * @description Initiates modified and regrade choices on Init
     */
    useEffect(() => {
        let initialModified = props.problems.map(() => false);
        let initialRegradeChoices = props.problems.map(() => '');

        setModifiedCorrectAnswerProblems(initialModified);
        setRegradeChoices(initialRegradeChoices);
    }, [props.problems]);

    // FUNCTIONS
    /**
     * @description Render timer for Quiz
     */
    const renderTimer = () => {
        const hours: any[] = [0, 1, 2, 3, 4, 5, 6];
        const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        return (
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                    paddingTop: 20,
                    marginBottom: 50,
                    borderColor: '#f2f2f2'
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}
                    >
                        Timed
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column',
                        alignItems: Dimensions.get('window').width < 768 ? 'center' : 'flex-end',
                        justifyContent: 'flex-start'
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
                        style={{ height: 20 }}
                        trackColor={{
                            false: '#f2f2f2',
                            true: '#006AFF'
                        }}
                        activeThumbColor="white"
                    />
                    {timer ? (
                        <View
                            style={{
                                borderRightWidth: 0,
                                paddingTop: 0,
                                borderColor: '#f2f2f2',
                                flexDirection: 'row',
                                paddingTop: 10,
                                paddingLeft: Dimensions.get('window').width < 768 ? 20 : 0
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
                                                fontSize: 14,
                                                color: '#000000'
                                            }}
                                        >
                                            {duration.hours} H <Ionicons name="chevron-down-outline" size={15} />{' '}
                                            &nbsp;&nbsp;:&nbsp;&nbsp;
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
                                                fontSize: 14,
                                                color: '#000000'
                                            }}
                                        >
                                            {duration.minutes} m <Ionicons name="chevron-down-outline" size={15} />
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
        );
    };

    /**
     * @description Renders Shuffle quiz option for editing quiz
     */
    const renderShuffleQuizOption = () => {
        return (
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                    paddingTop: 20,
                    borderColor: '#f2f2f2',
                    marginBottom: 50
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}
                    >
                        Random Order
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        height: 40,
                        flexDirection: 'row',
                        justifyContent: 'flex-start'
                    }}
                >
                    <Switch
                        value={shuffleQuiz}
                        onValueChange={() => {
                            setShuffleQuiz(!shuffleQuiz);
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
        );
    };

    /**
     * @description Helper methods to shuffle array
     */
    function shuffle(input: any[]) {
        const array = [...input];

        var currentIndex = array.length,
            randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    /**
     * @description Renders the headers for each question
     */
    const renderHeader = (index: number) => {
        if (index in headers) {
            return props.isOwner ? (
                <AutoGrowingTextInput
                    value={headers[index]}
                    onChange={(event: any) => {
                        const currentHeaders = JSON.parse(JSON.stringify(headers));
                        currentHeaders[index] = event.nativeEvent.text || '';
                        setHeaders(currentHeaders);
                    }}
                    style={{
                        fontFamily: 'overpass',
                        maxWidth: '100%',
                        marginBottom: 10,
                        marginTop: 10,
                        paddingTop: 13,
                        paddingBottom: 13,
                        fontSize: 14,
                        // borderBottom: '1px solid #C1C9D2'
                        borderBottomWidth: 1,
                        borderBottomColor: '#f2f2f2'
                    }}
                    placeholder={'Header'}
                    placeholderTextColor="#66737C"
                    maxHeight={200}
                    minHeight={45}
                    enableScrollToCaret
                />
            ) : (
                <Text
                    style={{
                        marginBottom: 30,
                        marginTop: 50,
                        fontSize: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        fontWeight: '600',
                        width: '100%'
                    }}
                >
                    {headers[index]}
                </Text>
            );
        }

        return null;
    };

    /**
     * @description Renders Audio/Video player for quiz problems
     */
    const renderAudioVideoPlayer = (url: string, type: string) => {
        console.log('Video URL', url);
        return (
            <Video
                // ref={audioRef}
                style={{
                    width: '100%',
                    height: 250
                }}
                source={{
                    uri: url
                }}
                useNativeControls
                resizeMode="contain"
                isLooping
                // onPlaybackStatusUpdate={status => setStatus(() => status)}
            />
        );
    };

    /**
     * @description Renders Rich editor for Question
     */
    const renderQuestionEditor = (index: number) => {
        if (editQuestionNumber === 0) return null;

        let audioVideoQuestion =
            problems[index].question[0] === '{' &&
            problems[index].question[problems[index].question.length - 1] === '}';

        let url = '';
        let type = '';
        let content = '';

        if (audioVideoQuestion) {
            const parse = JSON.parse(problems[index].question);

            url = parse.url;
            content = parse.content;
            type = parse.type;
        }

        return (
            <View style={{ width: '100%', marginBottom: props.isOwner ? 0 : 10, paddingBottom: 25 }}>
                {audioVideoQuestion || !showImportOptions ? null : (
                    <View style={{ paddingVertical: 10 }}>
                        <FileUpload
                            action={'audio/video'}
                            back={() => setShowImportOptions(false)}
                            onUpload={(u: any, t: any) => {
                                const obj = { url: u, type: t, content: '' };
                                const newProbs = [...problems];
                                newProbs[index].question = JSON.stringify(obj);
                                setProblems(newProbs);
                                setShowImportOptions(false);
                            }}
                        />
                    </View>
                )}
                {audioVideoQuestion ? (
                    <View style={{ marginVertical: 20 }}>{renderAudioVideoPlayer(url, type)}</View>
                ) : null}
                <View>
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
                            actions.undo,
                            actions.redo,
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
                            'insertEmoji'
                        ]}
                        iconMap={{
                            [actions.keyboard]: ({ tintColor }) => (
                                <Text style={{ color: 'green', fontSize: 20 }}>✓</Text>
                            ),
                            [actions.insertVideo]: importIcon,
                            insertEmoji: emojiIcon,
                            [actions.heading1]: ({ tintColor }) => (
                                <Text
                                    style={{
                                        color: tintColor,
                                        fontSize: 19,
                                        paddingBottom: 1
                                    }}
                                >
                                    H1
                                </Text>
                            ),
                            [actions.heading3]: ({ tintColor }) => (
                                <Text
                                    style={{
                                        color: tintColor,
                                        fontSize: 19,
                                        paddingBottom: 1
                                    }}
                                >
                                    H3
                                </Text>
                            ),
                            [actions.setParagraph]: ({ tintColor }) => (
                                <Text
                                    style={{
                                        color: tintColor,
                                        fontSize: 19,
                                        paddingBottom: 1
                                    }}
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
                        hiliteColor={() => props.handleHiliteColor(RichText)}
                        foreColor={() => props.handleForeColor(RichText)}
                        insertEmoji={() => props.handleEmoji(RichText)}
                        onPressAddImage={() => props.handleAddImage(RichText)}
                        onInsertLink={() => props.handleInsertLink(RichText)}
                    />
                    <ScrollView
                        horizontal={false}
                        style={{
                            backgroundColor: '#f2f2f2',
                            minHeight: 150,
                            borderColor: '#f2f2f2',
                            borderWidth: editorFocus ? 1 : 0
                        }}
                        keyboardDismissMode={'none'}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={20}
                        indicatorStyle={'black'}
                        showsHorizontalScrollIndicator={true}
                        persistentScrollbar={true}
                    >
                        <RichEditor
                            ref={RichText}
                            useContainer={true}
                            style={{
                                width: '100%',
                                paddingHorizontal: 10,
                                backgroundColor: '#fff',
                                display: 'flex',
                                flex: 1,
                                height: '100%',
                                minHeight: 150,
                                borderColor: '#f2f2f2',
                                borderBottomWidth: 1
                            }}
                            editorStyle={{
                                backgroundColor: '#fff',
                                placeholderColor: '#a2a2ac',
                                color: '#2f2f3c',
                                contentCSSText: 'font-size: 16px; min-height: 150px;'
                            }}
                            initialContentHTML={editQuestion && editQuestion.question ? editQuestion.question : ''}
                            initialHeight={150}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder={'Problem'}
                            onChange={text => {
                                const modifedText = text.split('&amp;').join('&');

                                if (audioVideoQuestion) {
                                    const currQuestion = JSON.parse(problems[index].question);
                                    const updatedQuestion = {
                                        ...currQuestion,
                                        content: modifedText
                                    };
                                    const newProbs = [...problems];
                                    newProbs[index].question = JSON.stringify(updatedQuestion);
                                    setProblems(newProbs);
                                    props.setProblems(newProbs);
                                } else {
                                    // setCue(modifedText);
                                    const newProbs = [...problems];
                                    newProbs[index].question = modifedText;
                                    setProblems(newProbs);
                                    props.setProblems(newProbs);
                                }
                            }}
                            onFocus={() => setEditorFocus(true)}
                            onBlur={() => setEditorFocus(false)}
                            allowFileAccess={true}
                            allowFileAccessFromFileURLs={true}
                            allowUniversalAccessFromFileURLs={true}
                            allowsFullscreenVideo={true}
                            allowsInlineMediaPlayback={true}
                            allowsLinkPreview={true}
                            allowsBackForwardNavigationGestures={true}
                        />
                    </ScrollView>
                </View>
            </View>
        );
    };

    /**
     * @description Revert changes for a question
     */
    const resetChanges = (questionNumber: number) => {
        const currentProblems = lodash.cloneDeep(problems);
        const unmodifiedProblems = lodash.cloneDeep(props.unmodifiedProblems);

        const updateProblems = currentProblems.map((problem: any, index: number) => {
            if (index === questionNumber) {
                const unmodified: any = { ...unmodifiedProblems[index] };
                unmodified['problemIndex'] = index;
                return unmodified;
            }
            return problem;
        });

        setProblems([...updateProblems]);

        setEditQuestionNumber(0);
        setEditQuestion({});
    };

    /**
     * @description Select MCQ
     */
    const selectMCQOption = (problem: any, problemIndex: number, optionIndex: number) => {
        if (props.isOwner) return;

        let onlyOneCorrect = true;

        if (!problem.questionType) {
            let noOfCorrect = 0;

            problem.options.map((option: any) => {
                if (option.isCorrect) noOfCorrect++;
            });

            if (noOfCorrect > 1) onlyOneCorrect = false;
        }
        // Check if one correct or multiple correct
        const updatedSolution = [...solutions];

        if (onlyOneCorrect && !updatedSolution[problemIndex].selected[optionIndex].isSelected) {
            problem.options.map((option: any, optionIndex: any) => {
                updatedSolution[problemIndex].selected[optionIndex].isSelected = false;
            });
        }

        updatedSolution[problemIndex].selected[optionIndex].isSelected = !updatedSolution[problemIndex].selected[
            optionIndex
        ].isSelected;

        setSolutions(updatedSolution);
        props.setSolutions(updatedSolution);
    };

    // let solutionRefs: any[] = [];
    console.log('Quiz Problems', problems);
    console.log('Solutions', solutions);

    if (problems.length !== solutions.length && !props.isOwner) {
        return <View />;
    }

    if (!props.isOwner && initialSolutions.length === 0) return null;

    let displayProblems = props.shuffleQuiz && !props.isOwner ? shuffledProblems : problems;

    console.log('Problems', displayProblems);

    if (loading || props.loading) {
        return (
            <View
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white'
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    let optionRefs: any[] = [];
    let solutionRefs: any[] = [];

    if (editQuestionNumber !== 0) {
        problems[editQuestionNumber - 1].options.map((_: any, index: number) => {
            optionRefs.push(getRef(index.toString()));
        });
    }

    problems.map((prob: any, index: number) => {
        solutionRefs.push(getRef(index.toString()));
    });

    // MAIN RETURN
    return (
        <View
            style={{
                width: '100%',
                backgroundColor: 'white',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingTop: 15,
                flexDirection: 'column',
                justifyContent: 'flex-start'
            }}
        >
            <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 25, paddingTop: 15 }}>
                {props.isOwner ? (
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
                                'insertEmoji'
                            ]}
                            iconMap={{
                                [actions.keyboard]: ({ tintColor }) => (
                                    <Text style={[{ color: 'green', fontSize: 20 }]}>✓</Text>
                                ),
                                [actions.insertVideo]: importIcon,
                                insertEmoji: emojiIcon,
                                [actions.heading1]: ({ tintColor }) => (
                                    <Text
                                        style={[
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
                            hiliteColor={() => props.handleHiliteColor(RichText)}
                            foreColor={() => props.handleForeColor(RichText)}
                            insertEmoji={() => props.handleEmoji(RichText)}
                            onPressAddImage={() => props.handleAddImage(RichText)}
                            onInsertLink={() => props.handleInsertLink(RichText)}
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
                            nestedScrollEnabled={true}
                            scrollEventThrottle={20}
                            indicatorStyle={'black'}
                            showsHorizontalScrollIndicator={true}
                            persistentScrollbar={true}
                        >
                            <RichEditor
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
                                initialContentHTML={instructions}
                                initialHeight={120}
                                onScroll={() => Keyboard.dismiss()}
                                placeholder={'Quiz instructions'}
                                onChange={text => {
                                    const modifedText = text.split('&amp;').join('&');
                                    setInstructions(modifedText);
                                }}
                                onFocus={() => setEditorFocus(true)}
                                onBlur={() => setEditorFocus(false)}
                                allowFileAccess={true}
                                allowFileAccessFromFileURLs={true}
                                allowUniversalAccessFromFileURLs={true}
                                allowsFullscreenVideo={true}
                                allowsInlineMediaPlayback={true}
                                allowsLinkPreview={true}
                                allowsBackForwardNavigationGestures={true}
                            />
                        </ScrollView>
                    </View>
                ) : instructions !== '' ? (
                    <RenderHtml
                        source={{
                            html: instructions
                        }}
                        defaultTextProps={{
                            selectable: true
                        }}
                    />
                ) : null}
            </View>

            {props.isOwner ? renderTimer() : null}
            {props.isOwner ? renderShuffleQuizOption() : null}

            {displayProblems.map((problem: any, index: any) => {
                const { problemIndex } = problem;

                if (problemIndex === undefined || problemIndex === null) return;

                let onlyOneCorrect = true;

                if (!problem.questionType) {
                    let noOfCorrect = 0;

                    problem.options.map((option: any) => {
                        if (option.isCorrect) noOfCorrect++;
                    });

                    if (noOfCorrect > 1) onlyOneCorrect = false;
                }

                let audioVideoQuestion =
                    problem.question[0] === '{' && problem.question[problem.question.length - 1] === '}';

                let url = '';
                let content = '';
                let type = '';

                if (audioVideoQuestion) {
                    const parse = JSON.parse(problem.question);

                    url = parse.url;
                    content = parse.content;
                    type = parse.type;
                }

                const solutionRef: any = setRef(index.toString());

                return (
                    <View
                        style={{
                            borderBottomColor: '#f2f2f2',
                            width: '100%',
                            paddingLeft: Dimensions.get('window').width < 768 ? 10 : 0,
                            borderBottomWidth: index === problems.length - 1 ? 0 : 1,
                            marginBottom: 25
                        }}
                        key={index}
                    >
                        {renderHeader(index)}
                        {props.isOwner && modifiedCorrectAnswerProblems[index] ? (
                            <View
                                style={{
                                    marginTop: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 10,
                                    backgroundColor: '#f3f3f3',
                                    borderRadius: 1
                                }}
                            >
                                {regradeChoices[index] !== '' ? (
                                    <Text style={{ maxWidth: '10%' }}>
                                        <Ionicons name="checkmark-circle-outline" size={22} color={'#53BE68'} />
                                    </Text>
                                ) : (
                                    <Text style={{ maxWidth: '10%' }}>
                                        <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                                    </Text>
                                )}
                                <Text style={{ paddingLeft: 10, maxWidth: '90%' }}>
                                    {regradeChoices[index] !== ''
                                        ? regradeChoices[index] === 'noRegrading'
                                            ? 'Question will not be regraded'
                                            : 'Question will be re-graded for all existing submissions'
                                        : 'Correct Answer modified. Select regrade option for those who have already taken the quiz.'}
                                </Text>
                            </View>
                        ) : null}
                        <View style={{ width: '100%' }}>
                            <View style={{ width: '100%' }}>
                                <View
                                    style={{
                                        paddingTop: 15,
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        width: '100%'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000000',
                                            fontSize: 22,
                                            paddingBottom: Dimensions.get('window').width < 768 ? 0 : 25,
                                            width: 40,
                                            paddingTop: Dimensions.get('window').width < 768 ? 20 : 15,
                                            fontFamily: 'inter'
                                        }}
                                    >
                                        {index + 1}.
                                    </Text>

                                    <View
                                        style={{
                                            flexDirection:
                                                Dimensions.get('window').width < 768 || editQuestionNumber === index + 1
                                                    ? editQuestionNumber === index + 1
                                                        ? 'column-reverse'
                                                        : 'column'
                                                    : 'row',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        {props.isOwner && editQuestionNumber === index + 1 ? (
                                            <View style={{ flexDirection: 'column', width: '100%' }}>
                                                {editQuestionNumber === index + 1 ? (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            marginTop: 20,
                                                            marginBottom: 10,
                                                            justifyContent: 'flex-end'
                                                        }}
                                                    >
                                                        {audioVideoQuestion ? (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    const updateProblems = lodash.cloneDeep(problems);
                                                                    const question = updateProblems[index].question;
                                                                    const parse = JSON.parse(question);
                                                                    updateProblems[index].question = parse.content;
                                                                    setProblems(updateProblems);
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        color: '#006AFF',
                                                                        fontFamily: 'Overpass',
                                                                        fontSize: 10
                                                                    }}
                                                                >
                                                                    {' '}
                                                                    Remove upload
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ) : null}
                                                    </View>
                                                ) : null}

                                                {renderQuestionEditor(editQuestionNumber - 1)}
                                            </View>
                                        ) : audioVideoQuestion ? (
                                            <View style={{ width: '100%', marginBottom: 25 }}>
                                                <View style={{ marginVertical: 20 }}>
                                                    {renderAudioVideoPlayer(url, type)}
                                                </View>
                                                <RenderHtml
                                                    source={{
                                                        html: content
                                                    }}
                                                    defaultTextProps={{
                                                        selectable: true
                                                    }}
                                                />
                                            </View>
                                        ) : (
                                            <View style={{ paddingTop: 15 }}>
                                                <RenderHtml
                                                    source={{
                                                        html: problem.question
                                                    }}
                                                    defaultTextProps={{
                                                        selectable: true
                                                    }}
                                                />
                                            </View>
                                        )}

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                marginBottom: Dimensions.get('window').width < 768 ? 15 : 0,
                                                justifyContent: 'flex-end'
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'flex-end',
                                                    alignItems: 'flex-start',
                                                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 15
                                                }}
                                            >
                                                {editQuestionNumber === index + 1 ? null : !problem.required ? null : (
                                                    <Text
                                                        style={{
                                                            fontSize: 20,
                                                            fontFamily: 'inter',
                                                            color: 'black',
                                                            marginBottom: 5,
                                                            marginRight: 15,
                                                            paddingTop: 12
                                                        }}
                                                    >
                                                        *
                                                    </Text>
                                                )}
                                                {!problem.questionType && !onlyOneCorrect ? (
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#a2a2ac',
                                                            paddingTop: 15,
                                                            paddingLeft: 5,
                                                            marginRight: 15
                                                        }}
                                                    >
                                                        Multiple correct answers
                                                    </Text>
                                                ) : null}
                                                <TextInput
                                                    editable={props.isOwner && editQuestionNumber === index + 1}
                                                    value={
                                                        props.isOwner && editQuestionNumber === index + 1
                                                            ? problem.points.toString()
                                                            : problem.points.toString() +
                                                              ' ' +
                                                              (Number(problem.points) === 1 ? 'Point' : ' Points')
                                                    }
                                                    style={{
                                                        fontSize: 14,
                                                        padding: 15,
                                                        paddingTop: 12,
                                                        paddingBottom: 12,
                                                        width: 120,
                                                        marginRight: editQuestionNumber === index + 1 ? 20 : 0,
                                                        textAlign: 'center',
                                                        fontWeight: editQuestionNumber === index + 1 ? 'normal' : '700',
                                                        borderBottomColor: '#f2f2f2',
                                                        borderBottomWidth: editQuestionNumber === index + 1 ? 1 : 0
                                                    }}
                                                    onChangeText={val => {
                                                        if (Number.isNaN(Number(val))) return;
                                                        const newProbs = [...problems];
                                                        newProbs[index].points = Number(val);
                                                        setProblems(newProbs);
                                                    }}
                                                    placeholder={'Enter points'}
                                                    placeholderTextColor={'#1F1F1F'}
                                                />
                                                {!props.isOwner ||
                                                    (editQuestionNumber === index + 1 ? null : (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setEditQuestionNumber(index + 1);
                                                                let initialAudioVideo =
                                                                    problems[index].question[0] === '{' &&
                                                                    problems[index].question[
                                                                        problems[index].question.length - 1
                                                                    ] === '}';

                                                                let initialContent = '';

                                                                if (initialAudioVideo) {
                                                                    const parse = JSON.parse(problems[index].question);
                                                                    initialContent = parse.content;
                                                                } else {
                                                                    initialContent = problems[index].question;
                                                                }

                                                                const currentProblems: any[] = lodash.cloneDeep(
                                                                    problems
                                                                );

                                                                setEditQuestion({
                                                                    ...currentProblems[index],
                                                                    question: initialContent
                                                                });

                                                                const currProblemOptions: any[] =
                                                                    currentProblems[index].options;

                                                                const updateShowFormulas: any[] = [];

                                                                const updateOptionEquations: any[] = [];

                                                                currProblemOptions.map((option: any) => {
                                                                    updateShowFormulas.push(false);
                                                                    updateOptionEquations.push('');
                                                                });

                                                                setShowFormulas(updateShowFormulas);
                                                                setOptionEquations(updateOptionEquations);
                                                            }}
                                                            style={{ marginBottom: 20, paddingTop: 8 }}
                                                        >
                                                            <Text>
                                                                <Ionicons
                                                                    name="cog-outline"
                                                                    size={20}
                                                                    style={{
                                                                        paddingTop: 4
                                                                    }}
                                                                    color={'#006AFF'}
                                                                />
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {(!problem.questionType || problem.questionType === 'trueFalse') &&
                            problem.options.map((option: any, i: any) => {
                                let color = '#000000';
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8';
                                }

                                const currRef: any = setRef(i.toString());

                                return (
                                    <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                        <View style={{ width: 40, paddingTop: 17 }}>
                                            {onlyOneCorrect && editQuestionNumber !== index + 1 ? (
                                                <BouncyCheckbox
                                                    style={{}}
                                                    isChecked={
                                                        props.isOwner
                                                            ? option.isCorrect
                                                            : solutions[problemIndex].selected[i].isSelected
                                                    }
                                                    onPress={e => {
                                                        selectMCQOption(problem, problemIndex, i);
                                                    }}
                                                    disabled={props.isOwner}
                                                />
                                            ) : (
                                                <BouncyCheckbox
                                                    style={{}}
                                                    isChecked={
                                                        props.isOwner
                                                            ? option.isCorrect
                                                            : solutions[problemIndex].selected[i].isSelected
                                                    }
                                                    onPress={e => {
                                                        if (props.isOwner) {
                                                            const updatedProbs = [...problems];
                                                            if (problem.questionType === 'trueFalse') {
                                                                updatedProbs[problemIndex].options[0].isCorrect = false;
                                                                updatedProbs[problemIndex].options[1].isCorrect = false;
                                                            }
                                                            updatedProbs[problemIndex].options[
                                                                i
                                                            ].isCorrect = !updatedProbs[problemIndex].options[i]
                                                                .isCorrect;
                                                            setProblems(updatedProbs);
                                                        } else {
                                                            selectMCQOption(problem, problemIndex, i);
                                                        }
                                                    }}
                                                    disabled={
                                                        props.isOwner && editQuestionNumber === index + 1
                                                            ? false
                                                            : props.isOwner
                                                    }
                                                />
                                            )}
                                        </View>
                                        {props.isOwner &&
                                        problem.questionType !== 'trueFalse' &&
                                        editQuestionNumber === index + 1 ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    maxWidth: Dimensions.get('window').width < 768 ? '80%' : 400,
                                                    flex: 1,
                                                    paddingTop: 10
                                                }}
                                            >
                                                <RichToolbar
                                                    style={{
                                                        borderColor: '#f2f2f2',
                                                        borderBottomWidth: 1,
                                                        backgroundColor: '#fff',
                                                        maxHeight: 40,
                                                        height: 40,
                                                        display: optionEditorRefs[i] ? 'flex' : 'none'
                                                    }}
                                                    flatContainerStyle={{
                                                        paddingHorizontal: 12
                                                    }}
                                                    editor={currRef}
                                                    disabled={false}
                                                    selectedIconTint={'#006AFF'}
                                                    disabledIconTint={'#bfbfbf'}
                                                    actions={[
                                                        actions.keyboard,
                                                        actions.undo,
                                                        actions.redo,
                                                        actions.setBold,
                                                        actions.setItalic,
                                                        actions.setUnderline,
                                                        actions.insertBulletsList,
                                                        actions.insertOrderedList,
                                                        actions.heading1,
                                                        actions.heading3,
                                                        actions.setParagraph,
                                                        actions.foreColor,
                                                        actions.hiliteColor,
                                                        'insertEmoji'
                                                    ]}
                                                    iconMap={{
                                                        [actions.keyboard]: ({ tintColor }) => (
                                                            <Text style={{ color: 'green', fontSize: 20 }}>✓</Text>
                                                        ),
                                                        [actions.insertVideo]: importIcon,
                                                        insertEmoji: emojiIcon,
                                                        [actions.heading1]: ({ tintColor }) => (
                                                            <Text
                                                                style={{
                                                                    color: tintColor,
                                                                    fontSize: 19,
                                                                    paddingBottom: 1
                                                                }}
                                                            >
                                                                H1
                                                            </Text>
                                                        ),
                                                        [actions.heading3]: ({ tintColor }) => (
                                                            <Text
                                                                style={{
                                                                    color: tintColor,
                                                                    fontSize: 19,
                                                                    paddingBottom: 1
                                                                }}
                                                            >
                                                                H3
                                                            </Text>
                                                        ),
                                                        [actions.setParagraph]: ({ tintColor }) => (
                                                            <Text
                                                                style={{
                                                                    color: tintColor,
                                                                    fontSize: 19,
                                                                    paddingBottom: 1
                                                                }}
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
                                                    hiliteColor={() => props.handleHiliteColor(currRef)}
                                                    foreColor={() => props.handleForeColor(currRef)}
                                                    insertEmoji={() => props.handleEmoji(currRef)}
                                                    onInsertLink={() => props.handleInsertLink(currRef)}
                                                />
                                                <ScrollView
                                                    horizontal={false}
                                                    style={{
                                                        backgroundColor: '#f2f2f2',
                                                        // maxHeight: editorFocus ? 340 : 'auto',
                                                        height: 100,
                                                        borderColor: '#f2f2f2',
                                                        borderWidth: optionEditorRefs[i] ? 1 : 0,
                                                        width: '100%'
                                                    }}
                                                    keyboardDismissMode={'none'}
                                                    // ref={scrollRef}
                                                    nestedScrollEnabled={true}
                                                    scrollEventThrottle={20}
                                                    indicatorStyle={'black'}
                                                    showsHorizontalScrollIndicator={true}
                                                    persistentScrollbar={true}
                                                >
                                                    <RichEditor
                                                        // key={reloadEditorKey.toString()}
                                                        ref={currRef}
                                                        useContainer={true}
                                                        style={{
                                                            width: '100%',
                                                            paddingHorizontal: 10,
                                                            backgroundColor: '#fff',
                                                            display: 'flex',
                                                            flex: 1,
                                                            height: '100%',
                                                            minHeight: 100,
                                                            borderColor: '#f2f2f2',
                                                            borderBottomWidth: 1
                                                        }}
                                                        editorStyle={{
                                                            backgroundColor: '#fff',
                                                            placeholderColor: '#a2a2ac',
                                                            color: '#2f2f3c',
                                                            contentCSSText: 'font-size: 16px; min-height: 100px;'
                                                        }}
                                                        initialContentHTML={
                                                            editQuestion &&
                                                            editQuestion.options &&
                                                            editQuestion.options[i] &&
                                                            editQuestion.options[i].option !== ''
                                                                ? editQuestion.options[i].option
                                                                : ''
                                                        }
                                                        initialHeight={100}
                                                        onScroll={() => Keyboard.dismiss()}
                                                        placeholder={'Option ' + (i + 1)}
                                                        onChange={text => {
                                                            const modifedText = text.split('&amp;').join('&');

                                                            const newProbs = [...problems];
                                                            newProbs[problemIndex].options[i].option = modifedText;
                                                            setProblems(newProbs);
                                                        }}
                                                        // onHeightChange={handleHeightChange}
                                                        onFocus={() => {
                                                            const updateOptionEditorRefs: boolean[] = [
                                                                ...optionEditorRefs
                                                            ];
                                                            updateOptionEditorRefs[i] = true;
                                                            setOptionEditorRefs(updateOptionEditorRefs);
                                                        }}
                                                        onBlur={() => {
                                                            const updateOptionEditorRefs: boolean[] = [
                                                                ...optionEditorRefs
                                                            ];
                                                            updateOptionEditorRefs[i] = false;
                                                            setOptionEditorRefs(updateOptionEditorRefs);
                                                        }}
                                                        allowFileAccess={true}
                                                        allowFileAccessFromFileURLs={true}
                                                        allowUniversalAccessFromFileURLs={true}
                                                        allowsFullscreenVideo={true}
                                                        allowsInlineMediaPlayback={true}
                                                        allowsLinkPreview={true}
                                                        allowsBackForwardNavigationGestures={true}
                                                        // onCursorPosition={handleCursorPosition}
                                                    />
                                                </ScrollView>
                                            </View>
                                        ) : (
                                            <View
                                                style={{
                                                    paddingTop: 10,
                                                    width: '100%',
                                                    height: '100%',
                                                    flex: 1
                                                }}
                                            >
                                                <RenderHtml
                                                    source={{
                                                        html: option.option
                                                    }}
                                                    defaultTextProps={{
                                                        selectable: true
                                                    }}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        {problem.questionType === 'freeResponse' ? (
                            <View
                                style={{
                                    width: '100%',
                                    paddingLeft: props.isOwner ? 40 : 0
                                }}
                            >
                                {props.isOwner ? (
                                    <Text
                                        style={{
                                            marginTop: 20,
                                            fontSize: 14,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            // width: '50%',
                                            // maxWidth: "100%",
                                            color: props.isOwner ? '#a2a2ac' : '#000000',
                                            marginBottom: props.isOwner ? 50 : 30
                                        }}
                                    >
                                        {props.isOwner ? 'Free Response Answer' : solutions[problemIndex].response}
                                    </Text>
                                ) : (
                                    <View style={{ flexDirection: 'column', width: '100%' }}>
                                        <RichToolbar
                                            style={{
                                                borderColor: '#f2f2f2',
                                                borderBottomWidth: 1,
                                                backgroundColor: '#fff',
                                                maxHeight: 40,
                                                height: 40,
                                                display: solutionEditorRefs[problemIndex] ? 'flex' : 'none'
                                            }}
                                            flatContainerStyle={{
                                                paddingHorizontal: 12
                                            }}
                                            editor={solutionRef}
                                            disabled={false}
                                            selectedIconTint={'#006AFF'}
                                            disabledIconTint={'#bfbfbf'}
                                            actions={[
                                                actions.keyboard,
                                                actions.undo,
                                                actions.redo,
                                                actions.setBold,
                                                actions.setItalic,
                                                actions.setUnderline,
                                                actions.insertBulletsList,
                                                actions.insertOrderedList,
                                                actions.heading1,
                                                actions.heading3,
                                                actions.setParagraph,
                                                actions.foreColor,
                                                actions.hiliteColor,
                                                'insertEmoji'
                                            ]}
                                            iconMap={{
                                                [actions.keyboard]: ({ tintColor }) => (
                                                    <Text style={{ color: 'green', fontSize: 20 }}>✓</Text>
                                                ),
                                                [actions.insertVideo]: importIcon,
                                                insertEmoji: emojiIcon,
                                                [actions.heading1]: ({ tintColor }) => (
                                                    <Text
                                                        style={{
                                                            color: tintColor,
                                                            fontSize: 19,
                                                            paddingBottom: 1
                                                        }}
                                                    >
                                                        H1
                                                    </Text>
                                                ),
                                                [actions.heading3]: ({ tintColor }) => (
                                                    <Text
                                                        style={{
                                                            color: tintColor,
                                                            fontSize: 19,
                                                            paddingBottom: 1
                                                        }}
                                                    >
                                                        H3
                                                    </Text>
                                                ),
                                                [actions.setParagraph]: ({ tintColor }) => (
                                                    <Text
                                                        style={{
                                                            color: tintColor,
                                                            fontSize: 19,
                                                            paddingBottom: 1
                                                        }}
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
                                            hiliteColor={() => props.handleHiliteColor(solutionRef)}
                                            foreColor={() => props.handleForeColor(solutionRef)}
                                            insertEmoji={() => props.handleEmoji(solutionRef)}
                                            onInsertLink={() => props.handleInsertLink(solutionRef)}
                                        />
                                        <ScrollView
                                            horizontal={false}
                                            style={{
                                                backgroundColor: '#f2f2f2',
                                                height: 150,
                                                borderColor: '#f2f2f2',
                                                borderWidth: 1
                                            }}
                                            keyboardDismissMode={'none'}
                                            // ref={scrollRef}
                                            nestedScrollEnabled={true}
                                            scrollEventThrottle={20}
                                            indicatorStyle={'black'}
                                            showsHorizontalScrollIndicator={true}
                                            persistentScrollbar={true}
                                        >
                                            <RichEditor
                                                // key={reloadEditorKey.toString()}
                                                ref={solutionRef}
                                                useContainer={true}
                                                style={{
                                                    width: '100%',
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff',
                                                    display: 'flex',
                                                    flex: 1,
                                                    height: '100%',
                                                    minHeight: 150,
                                                    borderColor: '#f2f2f2',
                                                    borderBottomWidth: 1
                                                }}
                                                editorStyle={{
                                                    backgroundColor: '#fff',
                                                    placeholderColor: '#a2a2ac',
                                                    color: '#2f2f3c',
                                                    contentCSSText: 'font-size: 16px; min-height: 100px;'
                                                }}
                                                initialContentHTML={initialSolutions[problemIndex].response}
                                                initialHeight={100}
                                                onScroll={() => Keyboard.dismiss()}
                                                placeholder={'Free response'}
                                                onChange={text => {
                                                    const modifedText = text.split('&amp;').join('&');

                                                    const updatedSolution = [...solutions];
                                                    updatedSolution[problemIndex].response = modifedText;
                                                    setSolutions(updatedSolution);
                                                    props.setSolutions(updatedSolution);
                                                }}
                                                // onHeightChange={handleHeightChange}
                                                onFocus={() => {
                                                    const updateSolutionEditorRefs: boolean[] = [
                                                        ...solutionEditorRefs
                                                    ];
                                                    updateSolutionEditorRefs[problemIndex] = true;
                                                    setSolutionEditorRefs(updateSolutionEditorRefs);
                                                }}
                                                onBlur={() => {
                                                    const updateSolutionEditorRefs: boolean[] = [
                                                        ...solutionEditorRefs
                                                    ];
                                                    updateSolutionEditorRefs[problemIndex] = false;
                                                    setSolutionEditorRefs(updateSolutionEditorRefs);
                                                }}
                                                allowFileAccess={true}
                                                allowFileAccessFromFileURLs={true}
                                                allowUniversalAccessFromFileURLs={true}
                                                allowsFullscreenVideo={true}
                                                allowsInlineMediaPlayback={true}
                                                allowsLinkPreview={true}
                                                allowsBackForwardNavigationGestures={true}
                                                // onCursorPosition={handleCursorPosition}
                                            />
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {props.isOwner && modifiedCorrectAnswerProblems[index] && editQuestionNumber !== index + 1 ? (
                            <Text style={{ fontSize: 14, fontWeight: '800', paddingLeft: 20, marginBottom: 20 }}>
                                {regradeChoices[index] === '' ? '' : regradeOptions[regradeChoices[index]]}
                            </Text>
                        ) : null}

                        {props.isOwner && modifiedCorrectAnswerProblems[index] && editQuestionNumber === index + 1 ? (
                            <View
                                style={{
                                    paddingVertical: 20,
                                    paddingLeft: Dimensions.get('window').width < 768 ? 20 : 40,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ marginRight: 10 }}>Regrade Option: </Text>
                                <Menu
                                    onSelect={(cat: any) => {
                                        const updateRegradeChoices = [...regradeChoices];
                                        updateRegradeChoices[index] = cat;
                                        setRegradeChoices(updateRegradeChoices);
                                    }}
                                >
                                    <MenuTrigger>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#000000',
                                                width: Dimensions.get('window').width > 768 ? '100%' : 200
                                            }}
                                        >
                                            {regradeChoices[index] === ''
                                                ? 'Select Option'
                                                : regradeOptions[regradeChoices[index]]}
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
                                                borderColor: '#f4f4f6',
                                                overflow: 'scroll',
                                                maxHeight: '100%',
                                                width: Dimensions.get('window').width < 768 ? 300 : 400
                                            }
                                        }}
                                    >
                                        {Object.keys(regradeOptions).map((option: any, i: number) => {
                                            return (
                                                <MenuOption value={option}>
                                                    <Text>
                                                        {i + 1}: {regradeOptions[option]}
                                                    </Text>
                                                </MenuOption>
                                            );
                                        })}
                                    </MenuOptions>
                                </Menu>
                            </View>
                        ) : null}

                        {props.isOwner && editQuestionNumber === index + 1 ? (
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    paddingTop: 25,
                                    paddingBottom: 50,
                                    paddingLeft: Dimensions.get('window').width < 768 ? 20 : 40
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => resetChanges(index)}
                                    style={{ backgroundColor: 'white', borderRadius: 15, width: 120, marginRight: 30 }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            color: '#006AFF',
                                            borderWidth: 1,
                                            borderRadius: 15,
                                            borderColor: '#006AFF',
                                            backgroundColor: '#fff',
                                            fontSize: 12,
                                            width: 120,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Reset
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditQuestionNumber(0);
                                        setEditQuestion({});
                                    }}
                                    style={{
                                        width: 120,
                                        borderRadius: 15,
                                        backgroundColor: '#006AFF'
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
                                            // backgroundColor: '#006AFF',
                                            fontSize: 12,
                                            // width: 120,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        DONE
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                );
            })}

            {props.isOwner ? (
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                    <TouchableOpacity
                        onPress={() => {
                            props.modifyQuiz(
                                instructions,
                                problems,
                                headers,
                                modifiedCorrectAnswerProblems,
                                regradeChoices,
                                timer,
                                duration,
                                shuffleQuiz
                            );
                        }}
                        style={{ backgroundColor: 'white', borderRadius: 15, width: 150 }}
                    >
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
                            UPDATE QUIZ
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
};

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f2f2f2',
        // borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
