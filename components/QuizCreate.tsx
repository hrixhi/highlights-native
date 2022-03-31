// REACT
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Dimensions, TextInput as DefaultTextInput, Keyboard, StyleSheet } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import lodash from 'lodash';
import { Ionicons } from '@expo/vector-icons';

// COMPONENTS
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';

import { Text, TouchableOpacity, View } from '../components/Themed';
import Alert from '../components/Alert';
import useDynamicRefs from 'use-dynamic-refs';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';

// import Board, { Repository } from "react-native-dnd-board";


// HELPER
import { PreferredLanguageText } from '../helpers/LanguageContext';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { handleFile } from '../helpers/FileUpload';

// CONSTANTS
const questionTypeOptions = [
    {
        label: 'MCQ',
        value: ''
    },
    {
        label: 'Free response',
        value: 'freeResponse'
    },
    {
        label: 'True/False',
        value: 'trueFalse'
    },
    {
        label: "Drag & Drop",
        value: "dragdrop"
    },
    {
        label: "Hotspot",
        value: "hotspot"
    }
];

const questionTypeLabels = {
    '': 'MCQ',
    freeResponse: 'Free response',
    trueFalse: 'True/False',
    dragdrop: 'Drag Drop',
    hotspot: 'Hotspot'
};

const requiredOptions = [
    {
        label: 'Required',
        value: 'required'
    },
    {
        label: 'Optional',
        value: 'optional'
    }
];

const requiredLabels = {
    required: 'Required',
    optional: 'Optional'
};

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : []);
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [editQuestion, setEditQuestion] = useState<any>({});
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);
    const [getRef, setRef] = useDynamicRefs();
    const [optionEquations, setOptionEquations] = useState<any[]>([]);
    const [optionEditorRefs, setOptionEditorRefs] = useState<boolean[]>([]);
    const [showOptionFormulas, setShowOptionFormulas] = useState<any[]>([]);
    let RichText: any = useRef();

    const [emojiVisible, setEmojiVisible] = useState(false);
    const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
    const [foreColorVisible, setForeColorVisible] = useState(false);
    const [hiliteColor, setHiliteColor] = useState('#ffffff');
    const [foreColor, setForeColor] = useState('#000000');
    const [insertLinkVisible, setInsertLinkVisible] = useState(false);
    const [insertImageVisible, setInsertImageVisible] = useState(false);
    const [questionEditorFocus, setQuestionEditorFocus] = useState(false);
    const [repository, setRepository] = useState(null);

    useEffect(() => {
        setProblems(props.problems)
    }, [props.problems])

    // HOOKS

    /**
     * @description Reset formulas when edit question changes
     */
    useEffect(() => {
        if (editQuestionNumber === 0) {
            setShowOptionFormulas([]);
            setOptionEquations([]);
            setOptionEditorRefs([]);
        }
    }, [editQuestionNumber]);

    const handleUploadVideoQuestion = useCallback(async (index: number) => {
        const res = await handleFile(true, props.userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        const obj = { url: res.url, type: res.type, content: problems[index].question };

        const newProbs = [...problems];
        newProbs[index].question = JSON.stringify(obj);

        setProblems(newProbs)
        props.setProblems(newProbs)

    }, [props.userId, problems])

    // EDITOR METHODS

    /**
     * @description Renders Audio/Video player
     */
    const renderAudioVideoPlayer = (url: string, type: string) => {
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
     * @description Renders Question editor
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
            <View>
                {audioVideoQuestion ? (
                    <View style={{ marginBottom: 20 }}>{renderAudioVideoPlayer(url, type)}</View>
                ) : null}
                <View>
                    <RichToolbar
                        style={{
                            backgroundColor: '#fff',
                            maxHeight: 40,
                            height: 40,
                            display: questionEditorFocus ? 'flex' : 'none'
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
                            actions.insertVideo,
                            actions.insertLink,
                            actions.insertBulletsList,
                            actions.insertOrderedList,
                            actions.heading1,
                            actions.heading3,
                            actions.setParagraph,
                            actions.setSuperscript,
                            actions.setSubscript,
                            actions.foreColor,
                            actions.hiliteColor,
                            // 'insertEmoji',
                        ]}
                        iconMap={{
                            [actions.keyboard]: ({ tintColor }) => (
                                <Text style={{ color: 'green', fontSize: 20 }}>✓</Text>
                            ),
                            // [actions.insertVideo]: importIcon,
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
                            ),
                        }}
                        hiliteColor={() => props.handleHiliteColor(RichText)}
                        foreColor={() => props.handleForeColor(RichText)}
                        insertEmoji={() => props.handleEmoji(RichText)}
                        onPressAddImage={() => props.handleAddImage(RichText)}
                        onInsertLink={() => props.handleInsertLink(RichText)}
                        insertVideo={() => {
                            handleUploadVideoQuestion(index)
                        }}
                    />
                    <ScrollView
                        horizontal={false}
                        style={{
                            backgroundColor: '#f2f2f2',
                            // maxHeight: editorFocus ? 340 : 'auto',
                            minHeight: 150,
                            borderColor: '#f2f2f2',
                            borderWidth: questionEditorFocus ? 1 : 0
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
                            // onHeightChange={handleHeightChange}
                            onFocus={() => setQuestionEditorFocus(true)}
                            onBlur={() => setQuestionEditorFocus(false)}
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
            </View>
        );
    };

    /**
     * @description Remove header associated with question when the question is removed
     */
    const removeHeadersOnDeleteProblem = (index: number) => {
        const headerPositions = Object.keys(headers);

        const headerIndicesToUpdate = headerPositions.filter((i: any) => i > index);

        const currentHeaders = JSON.parse(JSON.stringify(headers));

        delete currentHeaders[index];

        headerIndicesToUpdate.forEach((i: any) => {
            // Set i - 1

            const currHeaderValue = headers[i];

            delete currentHeaders[i];

            currentHeaders[i - 1] = currHeaderValue;
        });

        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);
    };

    /**
     * @description Add a header to a question
     */
    const addHeader = (index: number) => {
        // Use headers as an object with key as index values
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        currentHeaders[index] = '';
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);
    };

    /**
     * @description Remove header from a question
     */
    const removeHeader = (index: number) => {
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        delete currentHeaders[index];
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);
    };

    /**
     * @description Renders the Header for question at index
     */
    const renderHeaderOption = (index: number) => {
        return (
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                {index in headers ? (
                    <View style={{ flexDirection: 'row', width: '100%', marginTop: 50, marginBottom: 20 }}>
                        <View style={{ width: Dimensions.get('window').width < 768 ? '80%' : '50%' }}>
                            <AutoGrowingTextInput
                                value={headers[index]}
                                onChange={(event: any) => {
                                    const currentHeaders = JSON.parse(JSON.stringify(headers));
                                    currentHeaders[index] = event.nativeEvent.text || '';
                                    setHeaders(currentHeaders);
                                    props.setHeaders(currentHeaders);
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
                        </View>
                        <View style={{ paddingTop: 35, paddingLeft: 20 }}>
                            <Text
                                style={{
                                    color: '#006AFF',
                                    fontFamily: 'Overpass',
                                    fontSize: 10
                                }}
                                onPress={() => {
                                    removeHeader(index);
                                }}
                            >
                                Remove
                            </Text>
                        </View>
                    </View>
                ) : editQuestionNumber === index + 1 ? (
                    <TouchableOpacity
                        onPress={() => addHeader(index)}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 15,
                            marginBottom: 15,
                            // width: "100%",
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}
                    >
                        <Text
                            style={{
                                color: '#006AFF',
                                borderWidth: 1,
                                borderRadius: 15,
                                borderColor: '#006AFF',
                                backgroundColor: '#fff',
                                fontSize: 12,
                                textAlign: 'center',
                                lineHeight: 34,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase',
                                width: 175
                            }}
                        >
                            Add Header
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    /**
     * @description Checks if current question is valid before proceeding to modifying different question
     */
    const isCurrentQuestionValid = (index: number) => {
        if (editQuestionNumber === 0) return true;

        const currentQuestion = problems[index];

        if (currentQuestion.question === '') {
            alert(`Question ${index + 1} has no content.`);
            return false;
        }

        if (currentQuestion.points === '') {
            alert(`Enter points for Question ${index + 1}.`);
            return false;
        }

        if (currentQuestion.questionType === '' && currentQuestion.options.length < 2) {
            alert(`Create at least 2 options for Question ${index + 1}.`);
            return false;
        }

        if (currentQuestion.questionType === '' || currentQuestion.questionType === 'trueFalse') {
            let error = false;

            const keys: any = {};

            let optionFound = false;

            currentQuestion.options.map((option: any) => {
                if (option.option === '' || option.option === 'formula:') {
                    alert(`Fill missing option for Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.option in keys) {
                    alert(`Option repeated in a Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.isCorrect) {
                    optionFound = true;
                }

                keys[option.option] = 1;
            });

            if (!optionFound || error) {
                alert(`Select a correct answer for Question ${index + 1}.`);
                return false;
            }
        }

        return true;
    };


    // const onCardPress = card => {
    //     console.log('Card ID: ', card.id);
    // };

    // const onDragEnd = (fromColumnId, toColumnId, row) => {
    //     //
    //     console.log("From col id", fromColumnId)
    //     console.log("To col id", toColumnId)
    //     console.log("row", row)
    //     // OVER HERE !!!
    // };

    // const renderCard = ({ item }) => {
    //     return (
    //         <View style={styles.card}>
    //             <Text>{item.name}</Text>
    //             <TouchableOpacity
    //                 hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    //             //   onPress={() => deleteCard(item.id)}
    //             >
    //                 <Text>✕</Text>
    //             </TouchableOpacity>
    //         </View>
    //     );
    // };

    // const renderColumn = ({ item, columnComponent, layoutProps }) => {
    //     return (
    //         <View style={styles.column} {...layoutProps}>
    //             <View style={styles.columnHeader}>
    //                 <Text style={styles.columnName}>{item.name}</Text>
    //                 <TouchableOpacity
    //                     hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    //                 // onPress={() => deleteColumn(item.id)}
    //                 >
    //                     <Text>✕</Text>
    //                 </TouchableOpacity>
    //             </View>
    //             {columnComponent}
    //             <TouchableOpacity
    //                 style={styles.addCard}
    //             //   onPress={() => addCard(item.id)}
    //             >
    //                 <Text>+ Add Card</Text>
    //             </TouchableOpacity>
    //         </View>
    //     );
    // };

    // Create refs for current question options
    // let optionRefs: any[] = [];

    // if (editQuestionNumber !== 0) {
    //     problems[editQuestionNumber - 1].options.map((_: any, index: number) => {
    //         optionRefs.push(getRef(index.toString()));
    //     });
    // }

    // MAIN RETURN

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                borderTopLeftRadius: 0,
                maxWidth: 900,
                borderTopRightRadius: 0,
                marginTop: 35,
                paddingTop: 25,
                flexDirection: 'column',
                justifyContent: 'flex-start'
            }}
        >
            {/* Insert HEADER FOR INDEX 0 */}
            {problems.map((problem: any, index: any) => {
                const { questionType } = problem;

                // Dropdown doesn't accept empty strings
                let dropdownQuestionType = questionType !== '' ? questionType : 'mcq';

                let requiredDropdown = problem.required ? 'required' : 'optional';

                // Audio/Video question

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

                const dragdropData = []

                if (problem.dragDropData) {
                    problem.dragDropData.map((groups: any[], groupIndex: number) => {

                        const rows: any[] = [];

                        groups.map((label: any) => {
                            rows.push({
                                id: label.id,
                                name: label.content
                            })
                        })

                        dragdropData.push({
                            id: groupIndex,
                            name: problem.dragDropHeaders[groupIndex],
                            rows
                        })
                    })
                }


                return (
                    <View
                        style={{
                            borderBottomColor: '#f2f2f2',
                            borderBottomWidth: index === problems.length - 1 ? 0 : 1,
                            paddingBottom: 25,
                            width: '100%'
                        }}
                    >
                        {renderHeaderOption(index)}
                        <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 15 }}>
                            <View
                                style={{
                                    paddingTop: 15,
                                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                    flex: 1
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#000000',
                                       fontSize: Dimensions.get('window').width < 800 ? 22 : 26,
                                        paddingBottom: 25,
                                        width: 40,
                                        paddingTop: 15,
                                        fontFamily: 'inter'
                                    }}
                                >
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
                                        flex: 1
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                            flex: 1,
                                            paddingRight: Dimensions.get('window').width < 768 ? 0 : 20
                                        }}
                                    >
                                        <View style={{ width: '100%' }}>
                                            {editQuestionNumber === index + 1 ? (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        marginTop: audioVideoQuestion ? 10 : 0,
                                                        marginBottom: audioVideoQuestion ? 10 : 0,
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
                                                                props.setProblems(updateProblems);
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
                                                                Clear
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                </View>
                                            ) : null}
                                            {editQuestionNumber === index + 1 ? (
                                                renderQuestionEditor(index)
                                            ) : audioVideoQuestion ? (
                                                <View style={{}}>
                                                    <View style={{ marginBottom: 20 }}>
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
                                                <RenderHtml
                                                    source={{
                                                        html: problem.question
                                                    }}
                                                    defaultTextProps={{
                                                        selectable: true
                                                    }}
                                                />
                                            )}
                                        </View>
                                    </View>

                                    {/* Options */}
                                    <View
                                        style={{
                                            flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                            // width: '100%',
                                            maxWidth: 900,
                                            marginTop: Dimensions.get('window').width < 768 ? 0 : 0,
                                            marginBottom: Dimensions.get('window').width < 768 ? 20 : 0
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row' }}>
                                            {editQuestionNumber === index + 1 ? (
                                                <View
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        paddingTop: Dimensions.get('window').width < 768 ? 0 : 15,
                                                        alignItems: 'flex-start',
                                                        paddingBottom: Dimensions.get('window').width < 768 ? 0 : 30
                                                    }}
                                                >
                                                    <Menu
                                                        onSelect={(questionType: any) => {
                                                            const updatedProblems = [...problems];
                                                            updatedProblems[index].questionType = questionType;
                                                            // Clear Options
                                                            if (questionType === 'freeResponse') {
                                                                updatedProblems[index].options = [];
                                                            } else if (questionType === 'trueFalse') {
                                                                updatedProblems[index].options = [];
                                                                updatedProblems[index].options.push({
                                                                    option: 'True',
                                                                    isCorrect: false
                                                                });
                                                                updatedProblems[index].options.push({
                                                                    option: 'False',
                                                                    isCorrect: false
                                                                });
                                                            }

                                                            // hotspots
                                                            updatedProblems[index].hotspots = []
                                                            updatedProblems[index].imgUrl = ''

                                                            if (questionType === 'dragdrop') {
                                                                updatedProblems[index].questionType = 'dragdrop'
                                                                updatedProblems[index].options = []
                                                                updatedProblems[index].dragDropData = [
                                                                    [
                                                                        {
                                                                            id: '1',
                                                                            content: 'Item 1'
                                                                        },
                                                                        {
                                                                            id: '2',
                                                                            content: 'Item 2'
                                                                        },
                                                                    ],
                                                                    [
                                                                        {
                                                                            id: '3',
                                                                            content: 'Item 3'
                                                                        },
                                                                        {
                                                                            id: '4',
                                                                            content: 'Item 4'
                                                                        },
                                                                    ]
                                                                ]

                                                                updatedProblems[index].dragDropHeaders = ['Group 1', 'Group 2']

                                                                const dragdropData: any[] = [];

                                                                updatedProblems[index].dragDropData.map((groups: any[], groupIndex: number) => {

                                                                    const rows: any[] = [];

                                                                    groups.map((label: any) => {
                                                                        rows.push({
                                                                            id: label.id,
                                                                            name: label.content,
                                                                            description: label.content
                                                                        })
                                                                    })

                                                                    dragdropData.push({
                                                                        id: (groupIndex + 1),
                                                                        name: updatedProblems[index].dragDropHeaders[groupIndex],
                                                                        rows
                                                                    })
                                                                })


                                                                // setRepository(new Repository(dragdropData))


                                                            } else {
                                                                // clear data if not drag and drop
                                                                updatedProblems[index].dragDropData = []
                                                                updatedProblems[index].dragDropHeaders = []
                                                                updatedProblems[index].options = []
                                                            }

                                                            if (questionType === 'hotspot') {
                                                                updatedProblems[index].options = []
                                                            }

                                                            setProblems(updatedProblems);
                                                            props.setProblems(updatedProblems);
                                                        }}
                                                        style={{ paddingRight: 20, paddingLeft: 20 }}
                                                    >
                                                        <MenuTrigger>
                                                            <Text
                                                                style={{
                                                                    fontFamily: 'inter',
                                                                    fontSize: 14,
                                                                    color: '#2F2F3C'
                                                                }}
                                                            >
                                                                {questionType === ''
                                                                    ? 'MCQ'
                                                                    : questionTypeLabels[questionType]}
                                                                <Ionicons name="caret-down" size={14} />
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
                                                                    maxHeight: '100%'
                                                                }
                                                            }}
                                                        >
                                                            {questionTypeOptions.map((item: any) => {
                                                                return (
                                                                    <MenuOption value={item.value}>
                                                                        <Text>
                                                                            {item.value === '' ? 'MCQ' : item.label}
                                                                        </Text>
                                                                    </MenuOption>
                                                                );
                                                            })}
                                                        </MenuOptions>
                                                    </Menu>
                                                </View>
                                            ) : null}

                                            {editQuestionNumber === index + 1 ? (
                                                <View
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        paddingTop: Dimensions.get('window').width < 768 ? 0 : 15,
                                                        paddingLeft: 20,
                                                        alignItems: 'flex-start',
                                                        paddingBottom: Dimensions.get('window').width < 768 ? 0 : 30
                                                    }}
                                                >
                                                    <Menu
                                                        onSelect={(val: any) => {
                                                            const updatedProblems = [...problems];
                                                            updatedProblems[index].required = val === 'required';
                                                            setProblems(updatedProblems);
                                                            props.setProblems(updatedProblems);
                                                        }}
                                                        style={{ paddingRight: 20, paddingLeft: 20 }}
                                                    >
                                                        <MenuTrigger>
                                                            <Text
                                                                style={{
                                                                    fontFamily: 'inter',
                                                                    fontSize: 14,
                                                                    color: '#2F2F3C'
                                                                }}
                                                            >
                                                                {requiredLabels[requiredDropdown]}
                                                                <Ionicons name="caret-down" size={14} />
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
                                                                    maxHeight: '100%'
                                                                }
                                                            }}
                                                        >
                                                            {requiredOptions.map((item: any) => {
                                                                return (
                                                                    <MenuOption value={item.value}>
                                                                        <Text>{item.label}</Text>
                                                                    </MenuOption>
                                                                );
                                                            })}
                                                        </MenuOptions>
                                                    </Menu>

                                                    {/* <label style={{ width: 160 }}>
                                                <Select
                                                    touchUi={true}
                                                    cssClass="customDropdown"
                                                    value={requiredDropdown}
                                                    rows={requiredOptions.length}
                                                    data={requiredOptions}
                                                    themeVariant="light"
                                                    onChange={(val: any) => {
                                                        const updatedProblems = [...problems]
                                                        console.log("Change", val)
                                                        updatedProblems[index].required = (val.value === "required")
                                                        setProblems(updatedProblems)
                                                        props.setProblems(updatedProblems)
                                                    }}
                                                    responsive={{
                                                        small: {
                                                            display: 'bubble'
                                                        },
                                                        medium: {
                                                            touchUi: false,
                                                        }
                                                    }}
                                                />
                                            </label> */}
                                                </View>
                                            ) : null}
                                        </View>
                                        {Dimensions.get('window').width < 768 ? null : <View style={{ flex: 1 }} />}
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                paddingTop: 15,
                                                marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 'none'
                                            }}
                                        >
                                            {editQuestionNumber === index + 1 ? null : !problem.required ? null : (
                                                <Text
                                                    style={{
                                                        fontSize: 20,
                                                        fontFamily: 'inter',
                                                        color: 'black',
                                                        marginBottom: 5,
                                                        marginRight: 10,
                                                        paddingTop: 8
                                                    }}
                                                >
                                                    *
                                                </Text>
                                            )}
                                            <DefaultTextInput
                                                value={
                                                    editQuestionNumber === index + 1
                                                        ? problem.points
                                                        : (problem.points === '' ? 'Enter' : problem.points) +
                                                        ' ' +
                                                        (Number(problem.points) === 1 ? 'Point' : 'Points')
                                                }
                                                editable={editQuestionNumber === index + 1}
                                                style={{
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: 12,
                                                    paddingBottom: 12,
                                                    width: 120,
                                                    marginLeft: editQuestionNumber === index + 1 ? 20 : 0,
                                                    textAlign: 'center',
                                                    marginBottom:
                                                        Dimensions.get('window').width < 768 ||
                                                            editQuestionNumber !== index + 1
                                                            ? 0
                                                            : 30,
                                                    fontWeight: editQuestionNumber === index + 1 ? 'normal' : '700',
                                                    borderBottomColor: '#f2f2f2',
                                                    borderBottomWidth: editQuestionNumber === index + 1 ? 1 : 0
                                                }}
                                                placeholder={PreferredLanguageText('enterPoints')}
                                                onChangeText={val => {
                                                    if (Number.isNaN(Number(val))) return;
                                                    const newProbs = [...problems];
                                                    newProbs[index].points = val;
                                                    setProblems(newProbs);
                                                    props.setProblems(newProbs);
                                                }}
                                                placeholderTextColor={'#a2a2ac'}
                                            />

                                            <View
                                                style={{
                                                    paddingTop: editQuestionNumber === index + 1 ? 10 : 5,
                                                    flexDirection: 'row',
                                                    alignItems: 'flex-end',
                                                    marginBottom:
                                                        Dimensions.get('window').width < 768 ||
                                                            editQuestionNumber !== index + 1
                                                            ? 0
                                                            : 30
                                                }}
                                            >
                                                {editQuestionNumber === index + 1 ? (
                                                    <View style={{ flexDirection: 'row', paddingLeft: 20 }}>
                                                        <Ionicons
                                                            name="trash-outline"
                                                            color={'#006aff'}
                                                            onPress={() => {
                                                                Alert(`Delete Question ${editQuestionNumber} ?`, '', [
                                                                    {
                                                                        text: 'Cancel',
                                                                        style: 'cancel'
                                                                    },
                                                                    {
                                                                        text: 'Clear',
                                                                        onPress: () => {
                                                                            setEditQuestion({});
                                                                            setEditQuestionNumber(0);
                                                                            const updatedProblems = [...problems];
                                                                            updatedProblems.splice(index, 1);
                                                                            removeHeadersOnDeleteProblem(index + 1);
                                                                            setProblems(updatedProblems);
                                                                            props.setProblems(updatedProblems);
                                                                        }
                                                                    }
                                                                ]);
                                                            }}
                                                            size={23}
                                                        />
                                                    </View>
                                                ) : (
                                                    <Ionicons
                                                        name="cog-outline"
                                                        color={'#006AFF'}
                                                        style={{
                                                            paddingTop: 4
                                                        }}
                                                        onPress={() => {
                                                            if (isCurrentQuestionValid(editQuestionNumber - 1)) {
                                                                setEditQuestionNumber(index + 1);
                                                                // set edit question the one from problems array

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
                                                                //
                                                            }
                                                        }}
                                                        size={20}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        {problem.questionType === 'freeResponse' ? (
                            <Text
                                style={{
                                    marginTop: 20,
                                    fontSize: 15,
                                    marginLeft: 20,
                                    paddingTop: 12,
                                    paddingLeft: Dimensions.get('window').width < 768 ? 0 : 40,
                                    paddingBottom: 40,
                                    width: '100%',
                                    color: '#a2a2ac',
                                    marginBottom: 20
                                }}
                            >
                                Free Response Answer
                            </Text>
                        ) : null}

                        {problem.options.map((option: any, i: any) => {

                            const currRef: any = props.setRef(i.toString());

                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginTop: 10,
                                        backgroundColor: 'none',
                                        width: '100%'
                                    }}
                                >
                                    <View style={{ paddingTop: 25, width: 40 }}>
                                        <BouncyCheckbox
                                            style={{}}
                                            isChecked={option.isCorrect}
                                            onPress={e => {
                                                const updatedProblems = [...problems];
                                                if (questionType === 'trueFalse') {
                                                    updatedProblems[index].options[0].isCorrect = false;
                                                    updatedProblems[index].options[1].isCorrect = false;
                                                }
                                                updatedProblems[index].options[i].isCorrect = !updatedProblems[index]
                                                    .options[i].isCorrect;
                                                setProblems(updatedProblems);
                                                props.setProblems(updatedProblems);
                                            }}
                                            disabled={editQuestionNumber !== index + 1}
                                        />
                                    </View>
                                    <View
                                        style={{
                                            width: Dimensions.get('window').width < 768 ? '100%' : '70%',
                                            paddingRight: 30,
                                            paddingBottom: 10
                                        }}
                                    >
                                        {
                                            <View style={{ width: '100%', marginBottom: 10, paddingTop: 20 }}>
                                                {questionType === 'trueFalse' || editQuestionNumber !== index + 1 ? (
                                                    <RenderHtml
                                                        source={{
                                                            html: option.option
                                                        }}
                                                        defaultTextProps={{
                                                            selectable: true
                                                        }}
                                                    />
                                                ) : (
                                                    <View>
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
                                                                actions.insertImage,
                                                                actions.insertBulletsList,
                                                                actions.insertOrderedList,
                                                                actions.heading1,
                                                                actions.heading3,
                                                                actions.setParagraph,
                                                                actions.setSuperscript,
                                                                actions.setSubscript,
                                                                actions.foreColor,
                                                                actions.hiliteColor,
                                                                // 'insertEmoji',
                                                            ]}
                                                            iconMap={{
                                                                [actions.keyboard]: ({ tintColor }) => (
                                                                    <Text style={{ color: 'green', fontSize: 20 }}>
                                                                        ✓
                                                                    </Text>
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
                                                            hiliteColor={() => props.handleHiliteColorOptions((i.toString()))}
                                                            foreColor={() => props.handleForeColorOptions((i.toString()))}
                                                            insertEmoji={() => props.handleEmojiOptions((i.toString()))}
                                                            onPressAddImage={() => props.handleAddImageQuizOptions((i.toString()))}
                                                        />
                                                        <ScrollView
                                                            horizontal={false}
                                                            style={{
                                                                backgroundColor: '#f2f2f2',
                                                                // maxHeight: editorFocus ? 340 : 'auto',
                                                                // height: 100,
                                                                borderColor: '#f2f2f2',
                                                                borderWidth: optionEditorRefs[i] ? 1 : 0
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
                                                                    contentCSSText:
                                                                        'font-size: 16px; min-height: 100px;'
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
                                                                    newProbs[index].options[i].option = modifedText;
                                                                    setProblems(newProbs);
                                                                    props.setProblems(newProbs);
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
                                                                    props.resetEditorOptionIndex()
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
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'flex-end',
                                                                paddingBottom: 10,
                                                                paddingTop: 20
                                                            }}
                                                        >
                                                            {questionType === 'trueFalse' ? null : (
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: '#fff',
                                                                    }}
                                                                    onPress={() => {
                                                                        const updatedProblems = lodash.cloneDeep(
                                                                            problems
                                                                        );
                                                                        updatedProblems[index].options.splice(i, 1);
                                                                        setProblems(updatedProblems);
                                                                        props.setProblems(updatedProblems);
                                                                        setEditQuestion(updatedProblems[index]);

                                                                        const updateOptionEquations: any[] = optionEquations.splice(
                                                                            i,
                                                                            1
                                                                        );
                                                                        setOptionEquations(updateOptionEquations);

                                                                        const updateOptionEditorRefs: boolean[] = optionEditorRefs.splice(
                                                                            i,
                                                                            1
                                                                        );

                                                                        setOptionEditorRefs(updateOptionEditorRefs);

                                                                        const updateShowFormulas: any[] = showOptionFormulas.splice(
                                                                            i,
                                                                            1
                                                                        );
                                                                        setShowOptionFormulas(updateShowFormulas);
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            paddingTop: showOptionFormulas[i] ? 10 : 0,
                                                                            color: '#006AFF',
                                                                            fontFamily: 'Overpass',
                                                                            fontSize: 10,
                                                                            paddingRight: 10
                                                                        }}
                                                                    >
                                                                        Remove
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        }
                                    </View>
                                </View>
                            );
                        })}

                        {/* Only show Add Choice if questionType is MCQ ("") */}

                        {questionType === '' && editQuestionNumber === index + 1 ? (
                            <TouchableOpacity
                                onPress={() => {
                                    const updatedProblems = [...problems];
                                    updatedProblems[index].options.push({
                                        option: '',
                                        isCorrect: false
                                    });
                                    setProblems(updatedProblems);
                                    props.setProblems(updatedProblems);

                                    const updateOptionEquations: any[] = [...optionEquations];
                                    updateOptionEquations.push('');
                                    setOptionEquations(updateOptionEquations);

                                    const updateOptionEditorRefs: boolean[] = [...optionEditorRefs];
                                    updateOptionEditorRefs.push(false);
                                    setOptionEditorRefs(updateOptionEditorRefs);

                                    const updateShowFormulas: any[] = [...showOptionFormulas];
                                    updateShowFormulas.push(false);
                                    setShowOptionFormulas(updateShowFormulas);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 15,
                                    alignSelf: 'center'
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#006AFF',
                                        borderWidth: 1,
                                        borderRadius: 15,
                                        borderColor: '#006AFF',
                                        backgroundColor: '#fff',
                                        fontSize: 12,
                                        textAlign: 'center',
                                        lineHeight: 34,
                                        paddingHorizontal: 20,
                                        fontFamily: 'inter',
                                        height: 35,
                                        textTransform: 'uppercase',
                                        width: 175
                                    }}
                                >
                                    Add Choice
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ height: 30 }} />
                        )}
                    </View>
                );
            })}
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingBottom: 100
                }}
            >
                <TouchableOpacity
                    onPress={() => {
                        if (!isCurrentQuestionValid(editQuestionNumber - 1)) {
                            return;
                        }
                        const updatedProblems = [
                            ...problems,
                            { question: '', options: [], points: '', questionType: '', required: true }
                        ];
                        setEditQuestionNumber(problems.length + 1);
                        setEditQuestion({ question: '', options: [] });
                        setProblems(updatedProblems);
                        props.setProblems(updatedProblems);
                    }}
                    style={{
                        borderRadius: 15,
                        backgroundColor: 'white'
                    }}
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
                            width: 175,
                            textTransform: 'uppercase'
                        }}
                    >
                        Add Question
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default QuizCreate;


const styles = StyleSheet.create({
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    hederName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    board: {
        paddingVertical: 16,
        backgroundColor: '#E0E8EF',
    },
    column: {
        backgroundColor: '#F8FAFB',
        marginLeft: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
    },
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    columnName: {
        fontWeight: 'bold',
    },
    addColumn: {
        marginRight: 12,
        padding: 12,
        minWidth: 200,
    },
    card: {
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F6F7FB',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(233, 233, 233)',
        borderRadius: 4,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F5F6F8',
    },
})