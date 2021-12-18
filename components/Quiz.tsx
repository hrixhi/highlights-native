// REACT
import React, { useEffect, useState, useCallback, useRef, createRef } from 'react';
import { StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions, Switch, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import lodash from 'lodash';
import * as ImagePicker from 'expo-image-picker';

// COMPONENT
import { Text, View } from './Themed';
// import TextareaAutosize from 'react-textarea-autosize';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';

import { RadioButton } from './RadioButton';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import TeXToSVG from 'tex-to-svg';
// import parser from 'html-react-parser';
import FileUpload from './UploadFiles';
import ReactPlayer from 'react-native-video';
// import { Editor } from '@tinymce/tinymce-react';
// import FormulaGuide from './FormulaGuide';
import useDynamicRefs from 'use-dynamic-refs';

// HELPERS
import { handleFile } from '../helpers/FileUpload';

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
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);
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
                    marginBottom: 20,
                    borderColor: '#efefef'
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}>
                        Timed
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column',
                        alignItems: Dimensions.get('window').width < 768 ? 'center' : 'flex-end',
                        justifyContent: 'flex-start'
                    }}>
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
                            false: '#efefef',
                            true: '#006AFF'
                        }}
                        activeThumbColor="white"
                    />
                    {timer ? (
                        <View
                            style={{
                                borderRightWidth: 0,
                                paddingTop: 0,
                                borderColor: '#efefef',
                                flexDirection: 'row',
                                paddingTop: 10,
                                paddingLeft: Dimensions.get('window').width < 768 ? 20 : 0
                            }}>
                            <View>
                                <Menu
                                    onSelect={(hour: any) =>
                                        setDuration({
                                            ...duration,
                                            hours: hour
                                        })
                                    }>
                                    <MenuTrigger>
                                        <Text
                                            style={{
                                                // fontFamily: "inter",
                                                fontSize: 14,
                                                color: '#000000'
                                            }}>
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
                                                borderColor: '#efefef',
                                                overflow: 'scroll',
                                                maxHeight: '100%'
                                            }
                                        }}>
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
                                    }>
                                    <MenuTrigger>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#000000'
                                            }}>
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
                                                borderColor: '#efefef',
                                                overflow: 'scroll',
                                                maxHeight: '100%'
                                            }
                                        }}>
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
                    borderColor: '#efefef',
                    marginBottom: 50
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}>
                        Random Order
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'white',
                        height: 40,
                        flexDirection: 'row',
                        justifyContent: 'flex-start'
                    }}>
                    <Switch
                        value={shuffleQuiz}
                        onValueChange={() => {
                            setShuffleQuiz(!shuffleQuiz);
                        }}
                        style={{ height: 20 }}
                        trackColor={{
                            false: '#efefef',
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
                // <TextareaAutosize
                //     value={headers[index]}
                //     style={{
                //         fontFamily: 'overpass',
                //         marginBottom: 30,
                //         marginTop: 50,
                //         fontSize: 14,
                //         paddingTop: 12,
                //         paddingBottom: 12,
                //         maxWidth: '100%',
                //         borderRadius: 1,
                //         borderBottom: '1px solid #efefef',
                //         width: Dimensions.get('window').width < 768 ? '100%' : '50%'
                //     }}
                //     onChange={(e: any) => {
                //         const currentHeaders = JSON.parse(JSON.stringify(headers));
                //         currentHeaders[index] = e.target.value;
                //         setHeaders(currentHeaders);
                //     }}
                //     placeholder={'Header'}
                //     minRows={1}
                // />
                <AutoGrowingTextInput
                    value={headers[index]}
                    onChange={(event: any) => {
                        const currentHeaders = JSON.parse(JSON.stringify(headers));
                        currentHeaders[index] = event.nativeEvent.text || '';
                        setHeaders(currentHeaders);
                    }}
                    style={{
                        fontFamily: 'overpass',
                        width: '100%',
                        maxWidth: 500,
                        borderBottom: '1px solid #efefef',
                        fontSize: 14,
                        paddingTop: 13,
                        paddingBottom: 13,
                        marginTop: 12,
                        marginBottom: 20,
                        borderRadius: 1
                    }}
                    placeholder={'Header'}
                    placeholderTextColor="#66737C"
                    maxHeight={200}
                    minHeight={45}
                    enableScrollToCaret
                    // ref={}
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
                    }}>
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
        return (
            <ReactPlayer
                source={{ uri: url }}
                style={{
                    width: '100%',
                    height: type === 'mp3' || type === 'wav' ? '75px' : '360px'
                }}
            />
        );
    };

    /**
     * @description Used to insert equation into question being updated
     */
    const insertEquation = useCallback(() => {
        if (equation === '') {
            alert('Equation cannot be empty.');
            return;
        }

        let currentContent = RichText.current.getContent();

        const SVGEquation = TeXToSVG(equation); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + '</div>';

        RichText.current.setContent(currentContent);

        let audioVideoQuestion =
            problems[editQuestionNumber - 1].question[0] === '{' &&
            problems[editQuestionNumber - 1].question[problems[editQuestionNumber - 1].question.length - 1] === '}';

        if (audioVideoQuestion) {
            const currQuestion = JSON.parse(problems[editQuestionNumber - 1].question);
            const updatedQuestion = {
                ...currQuestion,
                content: RichText.current.getContent()
            };
            const newProbs = [...problems];
            newProbs[editQuestionNumber - 1].question = JSON.stringify(updatedQuestion);
            setProblems(newProbs);
        } else {
            const newProbs = [...problems];
            newProbs[editQuestionNumber - 1].question = RichText.current.getContent();
            setProblems(newProbs);
        }

        setShowEquationEditor(false);
        setEquation('');
    }, [equation, RichText, RichText.current, showEquationEditor, problems, editQuestionNumber]);

    /**
     * @description Used to insert equation into MCQ option
     */
    const insertOptionEquation = (index: number) => {
        if (optionEquations[index] === '') {
            alert('Equation cannot be empty.');
            return;
        }

        const ref: any = getRef(index.toString());

        if (!ref || !ref.current) return;

        let currentContent = ref.current.getContent();

        const SVGEquation = TeXToSVG(optionEquations[index], { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + '</div>';

        ref.current.setContent(currentContent);

        // Update option
        const newProbs = [...problems];
        newProbs[editQuestionNumber - 1].options[index].option = ref.current.getContent();
        setProblems(newProbs);

        const updateShowFormulas = [...showOptionFormulas];
        updateShowFormulas[index] = false;
        setShowOptionFormulas(updateShowFormulas);

        const updateOptionEquations = [...optionEquations];
        updateOptionEquations[index] = '';
        setOptionEquations(updateOptionEquations);
    };

    /**
     * @description Insert equation into Problem response editor
     */
    const insertResponseEquation = useCallback(
        (problemIndex: number) => {
            if (responseEquations[problemIndex] === '') {
                alert('Equation cannot be empty.');
                return;
            }

            let currentContent = problemRefs[problemIndex].current.getContent();

            const SVGEquation = TeXToSVG(responseEquations[problemIndex]); // returns svg in html format
            currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + '</div>';

            problemRefs[problemIndex].current.setContent(currentContent);

            const updatedSolution = [...solutions];
            updatedSolution[problemIndex].response = problemRefs[problemIndex].current.getContent();
            setSolutions(updatedSolution);
            props.setSolutions(updatedSolution);

            const updateShowFormulas = [...showFormulas];
            updateShowFormulas[problemIndex] = false;
            setShowFormulas(updateShowFormulas);

            const updateResponseEquations = [...responseEquations];
            updateResponseEquations[problemIndex] = '';
            setResponseEquations(updateResponseEquations);
        },
        [showFormulas, problemRefs, responseEquations, solutions]
    );

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
                    <View style={{ marginBottom: 20 }}>{renderAudioVideoPlayer(url, type)}</View>
                ) : null}
                {/* <FormulaGuide
                    equation={equation}
                    onChange={setEquation}
                    show={showEquationEditor}
                    onClose={() => setShowEquationEditor(false)}
                    onInsertEquation={insertEquation}
                /> */}
                {/* <Editor
                    onInit={(evt, editor) => (RichText.current = editor)}
                    initialValue={editQuestion && editQuestion.question ? editQuestion.question : ''}
                    apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                    init={{
                        skin: 'snow',
                        // toolbar_sticky: true,
                        // selector: 'textarea',  // change this value according to your HTML
                        // content_style: 'div { margin: 10px; border: 5px solid red; padding: 3px; }',
                        indent: false,
                        body_class: 'tinyMCEInput',
                        branding: false,
                        placeholder: 'Problem',
                        autoresize_on_init: false,
                        autoresize_min_height: 250,
                        height: 250,
                        min_height: 250,
                        paste_data_images: true,
                        images_upload_url: 'https://api.learnwithcues.com/api/imageUploadEditor',
                        mobile: {
                            plugins:
                                'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                        },
                        plugins:
                            'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                        menu: {
                            // this is the complete default configuration
                            file: { title: 'File', items: 'newdocument' },
                            edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                            insert: { title: 'Insert', items: 'link media | template hr' },
                            view: { title: 'View', items: 'visualaid' },
                            format: {
                                title: 'Format',
                                items:
                                    'bold italic underline strikethrough superscript subscript | formats | removeformat'
                            },
                            table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                            tools: { title: 'Tools', items: 'spellchecker code' }
                        },
                        setup: (editor: any) => {
                            const equationIcon =
                                '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
                            editor.ui.registry.addIcon('formula', equationIcon);

                            editor.ui.registry.addButton('formula', {
                                icon: 'formula',
                                // text: "Upload File",
                                tooltip: 'Insert equation',
                                onAction: () => {
                                    setShowEquationEditor(!showEquationEditor);
                                }
                            });

                            editor.ui.registry.addButton('upload', {
                                icon: 'upload',
                                tooltip: 'Import Audio/Video file',
                                onAction: async () => {
                                    const res = await handleFile(true);

                                    console.log('File upload result', res);

                                    if (!res || res.url === '' || res.type === '') {
                                        return;
                                    }

                                    const obj = { url: res.url, type: res.type, content: problems[index].question };

                                    const newProbs = [...problems];
                                    newProbs[index].question = JSON.stringify(obj);
                                    setProblems(newProbs);
                                    setShowImportOptions(false);
                                }
                            });
                        },
                        // menubar: 'file edit view insert format tools table tc help',
                        menubar: false,
                        statusbar: false,
                        toolbar:
                            'undo redo | bold italic underline strikethrough | formula superscript subscript | numlist bullist | forecolor backcolor permanentpen removeformat | table image upload link media | charmap emoticons ',
                        importcss_append: true,
                        image_caption: true,
                        quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                        noneditable_noneditable_class: 'mceNonEditable',
                        toolbar_mode: 'sliding',
                        content_style:
                            '.mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #1F1F1F;}',
                        // tinycomments_mode: 'embedded',
                        // content_style: '.mymention{ color: gray; }',
                        // contextmenu: 'link image table configurepermanentpen',
                        // a11y_advanced_options: true,
                        extended_valid_elements:
                            'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                        // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                        // content_css: useDarkMode ? 'dark' : 'default',
                    }}
                    onChange={(e: any) => {
                        if (audioVideoQuestion) {
                            const currQuestion = JSON.parse(problems[index].question);
                            const updatedQuestion = {
                                ...currQuestion,
                                content: e.target.getContent()
                            };
                            const newProbs = [...problems];
                            newProbs[index].question = JSON.stringify(updatedQuestion);
                            setProblems(newProbs);
                        } else {
                            // setCue(modifedText);
                            const newProbs = [...problems];
                            newProbs[index].question = e.target.getContent();
                            setProblems(newProbs);
                        }
                    }}
                /> */}
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

    let solutionRefs: any[] = [];

    if (problems.length !== solutions.length && !props.isOwner) {
        return null;
    }

    if (!props.isOwner && initialSolutions.length === 0) return null;

    problems.map((prob: any, index: number) => {
        solutionRefs.push(createRef(null));
    });

    let displayProblems = props.shuffleQuiz && !props.isOwner ? shuffledProblems : problems;

    if (loading || props.loading)
        return (
            <View
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white'
                }}>
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );

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
            }}>
            {/* {showFormulaGuide ? (
                <FormulaGuide show={showFormulaGuide} onClose={() => setShowFormulaGuide(false)} />
            ) : null} */}
            <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 25, paddingTop: 15 }}>
                {props.isOwner ? //         placeholder: 'Instructions', //         branding: false, //         indent: false, //         // toolbar_sticky: true, //         skin: 'snow', //     init={{ //     apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl" //     initialValue={initialInstructions} //     // onInit={(evt, editor) => RichText.current = editor} // <Editor
                //         autoresize_on_init: false,
                //         autoresize_min_height: 250,
                //         height: 250,
                //         min_height: 250,
                //         paste_data_images: true,
                //         images_upload_url: 'https://api.learnwithcues.com/api/imageUploadEditor',
                //         mobile: {
                //             plugins:
                //                 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                //         },
                //         plugins:
                //             'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                //         menu: {
                //             // this is the complete default configuration
                //             file: { title: 'File', items: 'newdocument' },
                //             edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                //             insert: { title: 'Insert', items: 'link media | template hr' },
                //             view: { title: 'View', items: 'visualaid' },
                //             format: {
                //                 title: 'Format',
                //                 items:
                //                     'bold italic underline strikethrough superscript subscript | formats | removeformat'
                //             },
                //             table: {
                //                 title: 'Table',
                //                 items: 'inserttable tableprops deletetable | cell row column'
                //             },
                //             tools: { title: 'Tools', items: 'spellchecker code' }
                //         },
                //         // menubar: 'file edit view insert format tools table tc help',
                //         menubar: false,
                //         statusbar: false,
                //         toolbar:
                //             'undo redo | bold italic underline strikethrough |  numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                //         importcss_append: true,
                //         image_caption: true,
                //         quickbars_selection_toolbar:
                //             'bold italic underline | quicklink h2 h3 quickimage quicktable',
                //         noneditable_noneditable_class: 'mceNonEditable',
                //         toolbar_mode: 'sliding',
                //         content_style:
                //             '.mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #1F1F1F;}',
                //         // tinycomments_mode: 'embedded',
                //         // content_style: '.mymention{ color: gray; }',
                //         // contextmenu: 'link image table configurepermanentpen',
                //         // a11y_advanced_options: true,
                //         extended_valid_elements:
                //             'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                //         // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                //         // content_css: useDarkMode ? 'dark' : 'default',
                //     }}
                //     onChange={(e: any) => {
                //         setInstructions(e.target.getContent());
                //     }}
                // />
                null : instructions !== '' ? (
                    <Text
                        style={{
                            // marginTop: 20,
                            marginBottom: 20,
                            fontSize: 15,
                            paddingTop: 12,
                            paddingBottom: 12,
                            width: '100%',
                            lineHeight: 25
                        }}>
                        {/* {parser(instructions)} */}
                        {instructions}
                    </Text>
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

                return (
                    <View
                        style={{
                            borderBottomColor: '#efefef',
                            width: '100%',
                            paddingLeft: Dimensions.get('window').width < 768 ? 10 : 0,
                            borderBottomWidth: index === problems.length - 1 ? 0 : 1,
                            marginBottom: 25
                        }}
                        key={index}>
                        {renderHeader(index)}
                        {props.isOwner && modifiedCorrectAnswerProblems[index] ? (
                            <View
                                style={{
                                    marginVertical: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 10,
                                    backgroundColor: '#f3f3f3',
                                    borderRadius: 1
                                }}>
                                {regradeChoices[index] !== '' ? (
                                    <Ionicons name="checkmark-circle-outline" size={22} color={'#53BE68'} />
                                ) : (
                                    <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                                )}
                                <Text style={{ paddingLeft: 10 }}>
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
                                    }}>
                                    <Text
                                        style={{
                                            color: '#000000',
                                            fontSize: 22,
                                            paddingBottom: Dimensions.get('window').width < 768 ? 0 : 25,
                                            width: 40,
                                            paddingTop: Dimensions.get('window').width < 768 ? 20 : 15,
                                            fontFamily: 'inter'
                                        }}>
                                        {index + 1}.
                                    </Text>

                                    {/* Question */}
                                    <View
                                        style={{
                                            flexDirection:
                                                Dimensions.get('window').width < 768 || editQuestionNumber === index + 1
                                                    ? editQuestionNumber === index + 1
                                                        ? 'column-reverse'
                                                        : 'column'
                                                    : 'row',
                                            flex: 1,
                                            justifyContent: 'space-between'
                                        }}>
                                        {props.isOwner && editQuestionNumber === index + 1 ? (
                                            <View style={{ flexDirection: 'column', width: '100%', flex: 1 }}>
                                                {editQuestionNumber === index + 1 ? (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            marginTop: 20,
                                                            marginBottom: 10,
                                                            justifyContent: 'flex-end'
                                                        }}>
                                                        {audioVideoQuestion ? (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    const updateProblems = lodash.cloneDeep(problems);
                                                                    const question = updateProblems[index].question;
                                                                    const parse = JSON.parse(question);
                                                                    updateProblems[index].question = parse.content;
                                                                    setProblems(updateProblems);
                                                                }}>
                                                                <Text
                                                                    style={{
                                                                        color: '#006AFF',
                                                                        fontFamily: 'Overpass',
                                                                        fontSize: 10
                                                                    }}>
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
                                            <View style={{ width: '100%', marginBottom: 25, flex: 1 }}>
                                                <View style={{ marginBottom: 20 }}>
                                                    {renderAudioVideoPlayer(url, type)}
                                                </View>
                                                <Text style={{ marginVertical: 20, fontSize: 14, lineHeight: 25 }}>
                                                    {/* {parser(content)} */}
                                                    {content}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text
                                                style={{
                                                    marginVertical: 20,
                                                    fontSize: 14,
                                                    width: Dimensions.get('window').width < 768 ? '100%' : '80%',
                                                    marginBottom: 25,
                                                    lineHeight: 25
                                                }}>
                                                {/* {parser(problem.question)} */}
                                                {problem.question}
                                            </Text>
                                        )}

                                        {/* Options */}
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                marginBottom: Dimensions.get('window').width < 768 ? 15 : 0,
                                                justifyContent: 'flex-end'
                                            }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'flex-end',
                                                    alignItems: 'flex-start',
                                                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 15
                                                }}>
                                                {editQuestionNumber === index + 1 ? null : !problem.required ? null : (
                                                    <Text
                                                        style={{
                                                            fontSize: 20,
                                                            fontFamily: 'inter',
                                                            color: 'black',
                                                            marginBottom: 5,
                                                            marginRight: 15,
                                                            paddingTop: 8
                                                        }}>
                                                        *
                                                    </Text>
                                                )}
                                                {!problem.questionType && !onlyOneCorrect ? (
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#a2a2ac',
                                                            paddingTop: 12,
                                                            marginRight: 15
                                                        }}>
                                                        Multiple correct answers
                                                    </Text>
                                                ) : null}
                                                <TextInput
                                                    editable={props.isOwner && editQuestionNumber === index + 1}
                                                    value={
                                                        props.isOwner && editQuestionNumber === index + 1
                                                            ? problem.points
                                                            : problem.points +
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
                                                        borderBottomColor: '#efefef',
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
                                                            style={{ marginBottom: 20, paddingTop: 6 }}>
                                                            {' '}
                                                            <Ionicons
                                                                name="cog-outline"
                                                                size={20}
                                                                style={{
                                                                    paddingTop: 4
                                                                }}
                                                                color={'#006AFF'}
                                                            />
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

                                return (
                                    <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                        <View style={{ width: 40 }}>
                                            {onlyOneCorrect && editQuestionNumber !== index + 1 ? (
                                                <TouchableOpacity
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexDirection: 'row',
                                                        marginTop: 21
                                                    }}
                                                    onPress={() => {
                                                        selectMCQOption(problem, problemIndex, i);
                                                    }}
                                                    disabled={props.isOwner}>
                                                    <RadioButton
                                                        selected={
                                                            props.isOwner
                                                                ? option.isCorrect
                                                                : solutions[problemIndex].selected[i].isSelected
                                                        }
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <input
                                                    disabled={
                                                        props.isOwner && editQuestionNumber === index + 1
                                                            ? false
                                                            : props.isOwner
                                                    }
                                                    style={{ marginTop: 22 }}
                                                    type="checkbox"
                                                    checked={
                                                        props.isOwner
                                                            ? option.isCorrect
                                                            : solutions[problemIndex].selected[i].isSelected
                                                    }
                                                    onChange={(e: any) => {
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
                                                />
                                            )}
                                        </View>
                                        {props.isOwner &&
                                        problem.questionType !== 'trueFalse' &&
                                        editQuestionNumber === index + 1 ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    maxWidth: Dimensions.get('window').width < 768 ? '80%' : 400
                                                }}>
                                                {/* <FormulaGuide
                                                    equation={optionEquations[i]}
                                                    onChange={(eq: any) => {
                                                        const updateOptionEquations = [...optionEquations];
                                                        updateOptionEquations[i] = eq;
                                                        setOptionEquations(updateOptionEquations);
                                                    }}
                                                    show={showOptionFormulas[i]}
                                                    onClose={() => {
                                                        const updateShowFormulas = [...showOptionFormulas];
                                                        updateShowFormulas[i] = !updateShowFormulas[i];
                                                        setShowOptionFormulas(updateShowFormulas);
                                                    }}
                                                    onInsertEquation={() => insertOptionEquation(i)}
                                                />
                                                <Editor
                                                    onInit={(evt, editor) => {
                                                        const currRef: any = setRef(i.toString());
                                                        if (currRef) {
                                                            currRef.current = editor;
                                                        }
                                                    }}
                                                    initialValue={
                                                        editQuestion &&
                                                        editQuestion.options &&
                                                        editQuestion.options[i] &&
                                                        editQuestion.options[i].option !== ''
                                                            ? editQuestion.options[i].option
                                                            : ''
                                                    }
                                                    apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                                                    init={{
                                                        skin: 'snow',
                                                        // toolbar_sticky: true,
                                                        statusbar: false,
                                                        branding: false,
                                                        placeholder: 'Option',
                                                        autoresize_on_init: false,
                                                        autoresize_min_height: 150,
                                                        height: 150,
                                                        min_height: 150,
                                                        paste_data_images: true,
                                                        images_upload_url:
                                                            'https://api.learnwithcues.com/api/imageUploadEditor',
                                                        mobile: {
                                                            plugins:
                                                                'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                                                        },
                                                        plugins:
                                                            'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                                                        menu: {
                                                            // this is the complete default configuration
                                                            file: { title: 'File', items: 'newdocument' },
                                                            edit: {
                                                                title: 'Edit',
                                                                items:
                                                                    'undo redo | cut copy paste pastetext | selectall'
                                                            },
                                                            insert: {
                                                                title: 'Insert',
                                                                items: 'link media | template hr'
                                                            },
                                                            view: { title: 'View', items: 'visualaid' },
                                                            format: {
                                                                title: 'Format',
                                                                items:
                                                                    'bold italic underline strikethrough superscript subscript | formats | removeformat'
                                                            },
                                                            table: {
                                                                title: 'Table',
                                                                items:
                                                                    'inserttable tableprops deletetable | cell row column'
                                                            },
                                                            tools: { title: 'Tools', items: 'spellchecker code' }
                                                        },
                                                        setup: (editor: any) => {
                                                            const equationIcon =
                                                                '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
                                                            editor.ui.registry.addIcon('formula', equationIcon);

                                                            editor.ui.registry.addButton('formula', {
                                                                icon: 'formula',
                                                                // text: "Upload File",
                                                                tooltip: 'Insert equation',
                                                                onAction: () => {
                                                                    const updateShowFormulas = [...showOptionFormulas];
                                                                    updateShowFormulas[i] = !updateShowFormulas[i];
                                                                    setShowOptionFormulas(updateShowFormulas);
                                                                }
                                                            });
                                                        },
                                                        // menubar: 'file edit view insert format tools table tc help',
                                                        menubar: false,
                                                        toolbar:
                                                            'undo redo | bold italic underline strikethrough | formula superscript subscript | numlist bullist removeformat | table image media link | charmap emoticons',
                                                        importcss_append: true,
                                                        image_caption: true,
                                                        quickbars_selection_toolbar:
                                                            'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                                        noneditable_noneditable_class: 'mceNonEditable',
                                                        toolbar_mode: 'sliding',
                                                        content_style:
                                                            '.mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #1F1F1F;}',
                                                        // tinycomments_mode: 'embedded',
                                                        // content_style: '.mymention{ color: gray; }',
                                                        // contextmenu: 'link image table configurepermanentpen',
                                                        // a11y_advanced_options: true,
                                                        extended_valid_elements:
                                                            'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                                                        // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                                        // content_css: useDarkMode ? 'dark' : 'default',
                                                    }}
                                                    onChange={(e: any) => {
                                                        const newProbs = [...problems];
                                                        newProbs[problemIndex].options[
                                                            i
                                                        ].option = e.target.getContent();
                                                        setProblems(newProbs);
                                                    }}
                                                /> */}
                                            </View>
                                        ) : (
                                            <Text
                                                style={{
                                                    width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                    fontSize: 14,
                                                    padding: Dimensions.get('window').width < 768 ? 0 : 15,
                                                    paddingTop: 12,
                                                    paddingBottom: 12,
                                                    marginTop: 5,
                                                    marginBottom: 20,
                                                    color,
                                                    lineHeight: 25
                                                }}>
                                                {/* {parser(option.option)} */}
                                                {option.option}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        {problem.questionType === 'freeResponse' ? (
                            <View
                                style={{
                                    width: '100%',
                                    paddingLeft: 40
                                }}>
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
                                        }}>
                                        {props.isOwner ? 'Free Response Answer' : solutions[problemIndex].response}
                                    </Text>
                                ) : (
                                    <View style={{ flexDirection: 'column', width: '100%' }}>
                                        <FormulaGuide
                                            equation={equation}
                                            onChange={(x: any) => {
                                                const updateResponseEquations = [...responseEquations];
                                                updateResponseEquations[problemIndex] = x;
                                                setResponseEquations(updateResponseEquations);
                                            }}
                                            show={showFormulas[problemIndex]}
                                            onClose={() => {
                                                const updateShowFormulas = [...showFormulas];
                                                updateShowFormulas[problemIndex] = !updateShowFormulas[problemIndex];
                                                setShowFormulas(updateShowFormulas);
                                            }}
                                            onInsertEquation={() => insertResponseEquation(problemIndex)}
                                        />
                                        {/* <Editor
                                            onInit={(evt, editor) => {
                                                const updateRefs = [...problemRefs];
                                                updateRefs[problemIndex].current = editor;
                                                setProblemRefs(updateRefs);
                                                solutionRefs[problemIndex].current = editor;
                                            }}
                                            initialValue={initialSolutions[problemIndex].response}
                                            apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                                            init={{
                                                skin: 'snow',
                                                // toolbar_sticky: true,
                                                indent: false,
                                                branding: false,
                                                placeholder: 'Answer',
                                                autoresize_on_init: false,
                                                autoresize_min_height: 350,
                                                height: 350,
                                                min_height: 350,
                                                paste_data_images: true,
                                                images_upload_url:
                                                    'https://api.learnwithcues.com/api/imageUploadEditor',
                                                mobile: {
                                                    plugins:
                                                        'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                                                },
                                                plugins:
                                                    'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                                                menu: {
                                                    // this is the complete default configuration
                                                    file: { title: 'File', items: 'newdocument' },
                                                    edit: {
                                                        title: 'Edit',
                                                        items: 'undo redo | cut copy paste pastetext | selectall'
                                                    },
                                                    insert: { title: 'Insert', items: 'link media | template hr' },
                                                    view: { title: 'View', items: 'visualaid' },
                                                    format: {
                                                        title: 'Format',
                                                        items:
                                                            'bold italic underline strikethrough superscript subscript | formats | removeformat'
                                                    },
                                                    table: {
                                                        title: 'Table',
                                                        items: 'inserttable tableprops deletetable | cell row column'
                                                    },
                                                    tools: { title: 'Tools', items: 'spellchecker code' }
                                                },
                                                setup: (editor: any) => {
                                                    const equationIcon =
                                                        '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
                                                    editor.ui.registry.addIcon('formula', equationIcon);

                                                    editor.ui.registry.addButton('formula', {
                                                        icon: 'formula',
                                                        // text: "Upload File",
                                                        tooltip: 'Insert equation',
                                                        onAction: () => {
                                                            const updateShowFormulas = [...showFormulas];
                                                            updateShowFormulas[problemIndex] = !updateShowFormulas[
                                                                problemIndex
                                                            ];
                                                            setShowFormulas(updateShowFormulas);
                                                        }
                                                    });
                                                },
                                                // menubar: 'file edit view insert format tools table tc help',
                                                menubar: false,
                                                toolbar:
                                                    'undo redo | bold italic underline strikethrough | formula superscript subscript | numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons ',
                                                importcss_append: true,
                                                image_caption: true,
                                                quickbars_selection_toolbar:
                                                    'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                                noneditable_noneditable_class: 'mceNonEditable',
                                                toolbar_mode: 'sliding',
                                                content_style:
                                                    '.mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #1F1F1F;}',
                                                // tinycomments_mode: 'embedded',
                                                // content_style: '.mymention{ color: gray; }',
                                                // contextmenu: 'link image table configurepermanentpen',
                                                // a11y_advanced_options: true,
                                                extended_valid_elements:
                                                    'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                                                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                                // content_css: useDarkMode ? 'dark' : 'default',
                                            }}
                                            onChange={(e: any) => {
                                                const updatedSolution = [...solutions];
                                                updatedSolution[problemIndex].response = e.target.getContent();
                                                setSolutions(updatedSolution);
                                                props.setSolutions(updatedSolution);
                                            }}
                                        /> */}
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
                                }}>
                                <Text style={{ marginRight: 10 }}>Regrade Option: </Text>
                                <Menu
                                    onSelect={(cat: any) => {
                                        const updateRegradeChoices = [...regradeChoices];
                                        updateRegradeChoices[index] = cat;
                                        setRegradeChoices(updateRegradeChoices);
                                    }}>
                                    <MenuTrigger>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#000000',
                                                width: Dimensions.get('window').width > 768 ? '100%' : 200
                                            }}>
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
                                        }}>
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
                                }}>
                                <TouchableOpacity
                                    onPress={() => resetChanges(index)}
                                    style={{ backgroundColor: 'white', borderRadius: 15, width: 120, marginRight: 30 }}>
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
                                        }}>
                                        Reset
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditQuestionNumber(0);
                                        setEditQuestion({});
                                    }}
                                    style={{ backgroundColor: 'white', borderRadius: 15, width: 120 }}>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            color: 'white',
                                            borderRadius: 15,
                                            backgroundColor: '#006AFF',
                                            fontSize: 12,
                                            width: 120,
                                            textTransform: 'uppercase'
                                        }}>
                                        DONE
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                );
            })}

            {/* Add Save Changes button here */}
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
                        style={{ backgroundColor: 'white', borderRadius: 15, width: 150 }}>
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
                            }}>
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
        // borderBottomColor: '#efefef',
        // borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
