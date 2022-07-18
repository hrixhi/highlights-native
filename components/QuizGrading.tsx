import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    useWindowDimensions,
    Image,
} from 'react-native';
import { Text, View } from './Themed';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import MathJax from 'react-native-mathjax';
import { disableEmailId } from '../constants/zoomCredentials';
import { useAppContext } from '../contexts/AppContext';

const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user } = useAppContext();

    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions);
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores);
    const [problemComments, setProblemComments] = useState<any[]>(
        props.solutions.problemComments ? props.solutions.problemComments : []
    );
    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState('');
    const [comment, setComment] = useState(props.comment ? props.comment : '');
    const [headers, setHeaders] = useState<any>(props.headers);
    const { width: contentWidth } = useWindowDimensions();

    if (!props.solutions) {
        return null;
    }

    // HOOKS

    /**
     * @description Set headers from Props
     */
    useEffect(() => {
        setHeaders(props.headers);
    }, [props.headers]);

    /**
     * @description Loads Scores and Comments from props
     */
    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score);
        });
        setCurrentScore(currentScore);
        setSolutions(props.solutions.solutions);
        setProblemScores(props.solutions.problemScores);
        setProblemComments(props.solutions.problemComments ? props.solutions.problemComments : []);

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];
            props.solutions.solutions.forEach((sol: any) => comments.push(''));
            setProblemComments(comments);
        }
    }, [props.solutions]);

    /**
     * @description Calculates total possible score for quiz
     */
    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        });
        setTotalPossible(total);
    }, [props.problems]);

    /**
     * @description Sets current score and calculates percentage
     */
    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score);
        });

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2));
    }, [problemScores, totalPossible]);

    // FUNCTIONS

    /**
     * @description Helper method to calculate time difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {
        const diff = dt2.getTime() - dt1.getTime();

        const Seconds_from_T1_to_T2 = diff / 1000;
        return Math.abs(Seconds_from_T1_to_T2);
    };

    /**
     * @description Renders Audio/Video player
     */
    const renderAudioVideoPlayer = (url: string, type: string) => {
        return (
            <Video
                style={{
                    width: '100%',
                    height: 250,
                }}
                source={{
                    uri: url,
                }}
                useNativeControls
                resizeMode="contain"
                isLooping
            />
        );
    };

    /**
     * @description Renders Attempt history for Quiz
     */
    const renderAttemptHistory = () => {
        return (
            <View
                style={{
                    width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
                    marginTop: 40,
                    marginBottom: 80,
                }}
            >
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Attempt History</Text>
                </View>
                <View style={styles.row}>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    />
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Attempt
                        </Text>
                    </View>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Time
                        </Text>
                    </View>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Score
                        </Text>
                    </View>
                    {props.isOwner ? (
                        <View
                            style={{
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 7,
                                width: props.isOwner ? '20%' : '25%',
                            }}
                        >
                            <Text
                                style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}
                            >
                                Status
                            </Text>
                        </View>
                    ) : null}
                </View>
                {props.attempts.map((attempt: any, index: number) => {
                    let duration =
                        attempt.initiatedAt !== null
                            ? diff_seconds(new Date(attempt.submittedAt), new Date(attempt.initiatedAt))
                            : 0;

                    let hours = duration !== 0 ? Math.floor(duration / 3600) : 0;

                    let minutes = duration !== 0 ? Math.floor((duration - hours * 3600) / 60) : 0;

                    let seconds = duration !== 0 ? Math.ceil(duration - hours * 3600 - minutes * 60) : 0;

                    return (
                        <View style={styles.row}>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                {attempt.isActive ? (
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name="checkmark-outline"
                                            size={Dimensions.get('window').width < 768 ? 23 : 18}
                                            color={'#53BE68'}
                                        />
                                        <Text
                                            style={{
                                                fontSize: Dimensions.get('window').width < 768 ? 13 : 14,
                                                paddingLeft: 5,
                                            }}
                                        >
                                            KEPT
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                {props.isOwner ? (
                                    <TouchableOpacity onPress={() => props.onChangeQuizAttempt(index)}>
                                        <Text
                                            style={{
                                                fontSize: Dimensions.get('window').width < 768 ? 13 : 14,
                                                color: '#007AFF',
                                            }}
                                        >
                                            Attempt {index + 1}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                        Attempt {index + 1}
                                    </Text>
                                )}
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                    {duration !== 0
                                        ? `${hours !== 0 ? '' + hours + ' H ' : ''} ${
                                              minutes !== 0 ? '' + minutes + ' min' : ''
                                          }  ${seconds !== 0 ? '' + seconds + ' sec' : ''}`
                                        : '-'}
                                </Text>
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                    {attempt.score} / {totalPossible}
                                </Text>
                            </View>
                            {props.isOwner ? (
                                <View
                                    style={{
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: 7,
                                        width: props.isOwner ? '20%' : '25%',
                                    }}
                                >
                                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                        {attempt.isFullyGraded ? 'Graded' : 'Not Graded'}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        );
    };

    /**
     * @description Renders Header for question at index
     */
    const renderHeader = (index: number) => {
        if (index in headers) {
            return (
                <Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 14, fontWeight: '600' }}>
                    {headers[index]}
                </Text>
            );
        }
        return null;
    };

    if (props.loading)
        return (
            <View
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                }}
            >
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
                paddingHorizontal: 10,
                flexDirection: 'column',
                justifyContent: 'flex-start',
            }}
        >
            {props.isOwner ? (
                <View
                    style={{
                        display: 'flex',
                        flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f2f2f2',
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: Dimensions.get('window').width < 1024 ? 20 : 0,
                        }}
                    >
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14, fontFamily: 'Inter' }}>
                            {props.problems.length} {props.problems.length === 1 ? 'Question' : 'Questions'}
                        </Text>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14, fontFamily: 'Inter' }}>
                            {totalPossible} Points
                        </Text>
                    </View>

                    <View style={{}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    paddingHorizontal: 10,
                                    borderRadius: 1,
                                    color: '#000',
                                    lineHeight: 20,
                                    paddingTop: 1,
                                }}
                            >
                                {percentage}%
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 1,
                                    color: '#000',
                                    lineHeight: 20,
                                    paddingTop: 1,
                                }}
                            >
                                {currentScore}/{totalPossible}
                            </Text>
                            {props.isOwner ? (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        marginBottom: 10,
                                        paddingLeft: 20,
                                        lineHeight: 22,
                                        textTransform: 'uppercase',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {props.partiallyGraded ? 'In progress' : 'Graded'}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            ) : null}

            {renderAttemptHistory()}

            {props.isOwner ? (
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Attempt {props.currentQuizAttempt + 1}</Text>
                </View>
            ) : null}

            {props.problems.map((problem: any, index: any) => {
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
                            borderBottomColor: '#f2f2f2',
                            borderBottomWidth: index === props.problems.length - 1 ? 0 : 1,
                            marginBottom: 25,
                        }}
                        key={index}
                    >
                        {renderHeader(index)}
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                            <View
                                style={{
                                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                    width: '100%',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#000000',
                                        fontSize: Dimensions.get('window').width < 800 ? 22 : 26,
                                        paddingBottom: 25,
                                        width: 40,
                                        paddingTop: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    {index + 1}.
                                </Text>

                                {/* Question */}
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        flex: 1,
                                    }}
                                >
                                    {/* Scoring */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0,
                                            marginBottom: Dimensions.get('window').width > 768 ? 20 : 0,
                                            marginLeft: 'auto',
                                            paddingTop: 7,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', marginRight: 20 }}>
                                            {!problem.required ? null : (
                                                <Text
                                                    style={{
                                                        fontSize: 20,
                                                        fontFamily: 'inter',
                                                        color: 'black',
                                                        marginBottom: 5,
                                                        marginRight: 10,
                                                        paddingTop: 10,
                                                    }}
                                                >
                                                    *
                                                </Text>
                                            )}
                                        </View>
                                        {!props.isOwner ? null : (
                                            <TextInput
                                                editable={props.isOwner ? true : false}
                                                value={problemScores[index].toString()}
                                                onChangeText={(val: any) => {
                                                    if (Number.isNaN(Number(val))) return;
                                                    const updateProblemScores = [...problemScores];
                                                    updateProblemScores[index] = val;
                                                    if (Number(val) > Number(problem.points)) {
                                                        alert('Assigned score exceeds total points');
                                                    }
                                                    setProblemScores(updateProblemScores);
                                                }}
                                                style={{
                                                    width: 120,
                                                    borderBottomColor: '#f2f2f2',
                                                    borderBottomWidth: 1,
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingBottom: 12,
                                                    marginTop: 5,
                                                    height: 40,
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        )}
                                        {!props.isOwner ? null : (
                                            <TextInput
                                                editable={false}
                                                value={'/ ' + problem.points}
                                                style={{
                                                    width: 100,
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingBottom: 12,
                                                    marginTop: 5,
                                                    paddingRight: 30,
                                                    height: 40,
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        )}
                                        {!props.isOwner ? (
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    marginTop: 5,
                                                    marginBottom: 10,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingRight: 30,
                                                    textAlign: 'right',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {Number(problemScores[index]).toFixed(1).replace(/\.0+$/, '')} /{' '}
                                                {Number(problem.points).toFixed(1).replace(/\.0+$/, '')}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View />
                                </View>
                            </View>
                        </View>

                        {audioVideoQuestion ? (
                            <View style={{ width: '100%', marginBottom: 10, paddingTop: 10, flex: 1 }}>
                                {renderAudioVideoPlayer(url, type)}
                                <View
                                    style={{
                                        paddingTop: 10,
                                        width: '100%',
                                        height: '100%',
                                        flex: 1,
                                    }}
                                >
                                    <RenderHtml
                                        contentWidth={contentWidth}
                                        source={{
                                            html: content,
                                        }}
                                        defaultTextProps={{
                                            selectable: false,
                                        }}
                                        // renderers={renderers}
                                        renderers={{
                                            img: ({ TDefaultRenderer, ...rendererProps }) => {
                                                const node = rendererProps.tnode.domNode;

                                                const attribs = node.attribs;

                                                if (attribs && attribs['data-eq']) {
                                                    const formula = '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                    console.log('Formula', formula);

                                                    return (
                                                        <View
                                                            style={{
                                                                minWidth: 100,
                                                            }}
                                                        >
                                                            <MathJax
                                                                html={formula}
                                                                mathJaxOptions={{
                                                                    messageStyle: 'none',
                                                                    extensions: [
                                                                        'tex2jax.js',
                                                                        'MathMenu.js',
                                                                        'MathZoom.js',
                                                                    ],
                                                                    jax: ['input/TeX', 'output/HTML-CSS'],
                                                                    tex2jax: {
                                                                        inlineMath: [
                                                                            ['$', '$'],
                                                                            ['\\(', '\\)'],
                                                                        ],
                                                                        displayMath: [
                                                                            ['$$', '$$'],
                                                                            ['\\[', '\\]'],
                                                                        ],
                                                                        processEscapes: false,
                                                                    },
                                                                    SVG: {
                                                                        useGlobalCache: false,
                                                                    },
                                                                    TeX: {
                                                                        extensions: [
                                                                            'AMSmath.js',
                                                                            'AMSsymbols.js',
                                                                            'noErrors.js',
                                                                            'noUndefined.js',
                                                                            'AMSmath.js',
                                                                            'AMSsymbols.js',
                                                                            'autoload-all.js',
                                                                        ],
                                                                    },
                                                                }}
                                                            />
                                                        </View>
                                                    );
                                                }

                                                return (
                                                    <Image
                                                        source={{
                                                            uri: attribs.src,
                                                        }}
                                                        style={{
                                                            maxWidth: Dimensions.get('window').width,
                                                            width: 300,
                                                            height: 300,
                                                            flex: 1,
                                                        }}
                                                        resizeMode={'contain'}
                                                    />
                                                );
                                            },
                                        }}
                                        tagsStyles={{
                                            p: {
                                                lineHeight: 50,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View
                                style={{
                                    paddingTop: 10,
                                    width: '100%',
                                    height: '100%',
                                    flex: 1,
                                }}
                            >
                                <RenderHtml
                                    contentWidth={contentWidth}
                                    source={{
                                        html: problem.question,
                                    }}
                                    defaultTextProps={{
                                        selectable: false,
                                    }}
                                    // renderers={renderers}
                                    renderers={{
                                        img: ({ TDefaultRenderer, ...rendererProps }) => {
                                            const node = rendererProps.tnode.domNode;

                                            const attribs = node.attribs;

                                            if (attribs && attribs['data-eq']) {
                                                const formula = '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                console.log('Formula', formula);

                                                return (
                                                    <View
                                                        style={{
                                                            minWidth: 100,
                                                        }}
                                                    >
                                                        <MathJax
                                                            html={formula}
                                                            mathJaxOptions={{
                                                                messageStyle: 'none',
                                                                extensions: [
                                                                    'tex2jax.js',
                                                                    'MathMenu.js',
                                                                    'MathZoom.js',
                                                                ],
                                                                jax: ['input/TeX', 'output/HTML-CSS'],
                                                                tex2jax: {
                                                                    inlineMath: [
                                                                        ['$', '$'],
                                                                        ['\\(', '\\)'],
                                                                    ],
                                                                    displayMath: [
                                                                        ['$$', '$$'],
                                                                        ['\\[', '\\]'],
                                                                    ],
                                                                    processEscapes: false,
                                                                },
                                                                SVG: {
                                                                    useGlobalCache: false,
                                                                },
                                                                TeX: {
                                                                    extensions: [
                                                                        'AMSmath.js',
                                                                        'AMSsymbols.js',
                                                                        'noErrors.js',
                                                                        'noUndefined.js',
                                                                        'AMSmath.js',
                                                                        'AMSsymbols.js',
                                                                        'autoload-all.js',
                                                                    ],
                                                                },
                                                            }}
                                                        />
                                                    </View>
                                                );
                                            }

                                            return (
                                                <Image
                                                    source={{
                                                        uri: attribs.src,
                                                    }}
                                                    style={{
                                                        maxWidth: Dimensions.get('window').width,
                                                        width: 300,
                                                        height: 300,
                                                        flex: 1,
                                                    }}
                                                    resizeMode={'contain'}
                                                />
                                            );
                                        },
                                    }}
                                    tagsStyles={{
                                        p: {
                                            lineHeight: 50,
                                            fontSize: 16,
                                        },
                                    }}
                                />
                            </View>
                        )}

                        {(!problem.questionType || problem.questionType === 'trueFalse') &&
                            problem.options.map((option: any, i: any) => {
                                let selected = solutions[index].selected[i].isSelected;
                                let isCorrectAnswer = option.isCorrect;

                                let color = '#000000';
                                let background = 'none';

                                if (selected && isCorrectAnswer) {
                                    color = '#35ac78';
                                    background = '#d4f3e5';
                                } else if (selected && !isCorrectAnswer) {
                                    color = '#f94144';
                                    background = '#ffe6f3';
                                } else if (!selected && isCorrectAnswer) {
                                    color = '#35ac78';
                                    background = '#d4f3e5';
                                }

                                return (
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 10,
                                                marginTop: 20,
                                            }}
                                        >
                                            <View style={{}}>
                                                <BouncyCheckbox
                                                    style={{}}
                                                    isChecked={solutions[index].selected[i].isSelected}
                                                    onPress={(e) => {
                                                        return;
                                                    }}
                                                    disabled={true}
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                    fontSize: 14,
                                                    paddingHorizontal: 15,
                                                    color,
                                                    lineHeight: 25,
                                                    backgroundColor: selected || isCorrectAnswer ? background : '#fff',
                                                    borderColor: selected || isCorrectAnswer ? color : 'none',
                                                    borderWidth: selected || isCorrectAnswer ? 1 : 0,
                                                    padding: 7,
                                                    borderRadius: 5,
                                                }}
                                            >
                                                <RenderHtml
                                                    contentWidth={contentWidth}
                                                    source={{
                                                        html: option.option,
                                                    }}
                                                    defaultTextProps={{
                                                        selectable: false,
                                                    }}
                                                    // renderers={renderers}
                                                    renderers={{
                                                        img: ({ TDefaultRenderer, ...rendererProps }) => {
                                                            const node = rendererProps.tnode.domNode;

                                                            const attribs = node.attribs;

                                                            if (attribs && attribs['data-eq']) {
                                                                const formula =
                                                                    '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                                console.log('Formula', formula);

                                                                return (
                                                                    <View
                                                                        style={{
                                                                            minWidth: 100,
                                                                        }}
                                                                    >
                                                                        <MathJax
                                                                            html={formula}
                                                                            mathJaxOptions={{
                                                                                messageStyle: 'none',
                                                                                extensions: [
                                                                                    'tex2jax.js',
                                                                                    'MathMenu.js',
                                                                                    'MathZoom.js',
                                                                                ],
                                                                                jax: ['input/TeX', 'output/HTML-CSS'],
                                                                                tex2jax: {
                                                                                    inlineMath: [
                                                                                        ['$', '$'],
                                                                                        ['\\(', '\\)'],
                                                                                    ],
                                                                                    displayMath: [
                                                                                        ['$$', '$$'],
                                                                                        ['\\[', '\\]'],
                                                                                    ],
                                                                                    processEscapes: false,
                                                                                },
                                                                                SVG: {
                                                                                    useGlobalCache: false,
                                                                                },
                                                                                TeX: {
                                                                                    extensions: [
                                                                                        'AMSmath.js',
                                                                                        'AMSsymbols.js',
                                                                                        'noErrors.js',
                                                                                        'noUndefined.js',
                                                                                        'AMSmath.js',
                                                                                        'AMSsymbols.js',
                                                                                        'autoload-all.js',
                                                                                    ],
                                                                                },
                                                                            }}
                                                                        />
                                                                    </View>
                                                                );
                                                            }

                                                            return (
                                                                <Image
                                                                    source={{
                                                                        uri: attribs.src,
                                                                    }}
                                                                    style={{
                                                                        maxWidth: Dimensions.get('window').width,
                                                                        width: 300,
                                                                        height: 300,
                                                                        flex: 1,
                                                                    }}
                                                                    resizeMode={'contain'}
                                                                />
                                                            );
                                                        },
                                                    }}
                                                    tagsStyles={{
                                                        p: {
                                                            lineHeight: 50,
                                                            fontSize: 16,
                                                        },
                                                    }}
                                                />
                                            </View>
                                        </View>
                                        {/* Correct */}
                                        <View
                                            style={{
                                                paddingLeft: 30,
                                                marginBottom: 0,
                                                marginTop: 0,
                                            }}
                                        >
                                            {selected || isCorrectAnswer ? (
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: 'Overpass',
                                                        paddingLeft: 15,
                                                        textTransform: 'uppercase',
                                                        flexDirection: 'column',
                                                        color: '#007AFF',
                                                    }}
                                                >
                                                    {selected && isCorrectAnswer
                                                        ? 'Correct response'
                                                        : selected && !isCorrectAnswer
                                                        ? props.isOwner
                                                            ? 'Student response'
                                                            : 'Your response'
                                                        : 'Missing Correct answer'}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })}

                        {/* Hotspots */}
                        {problem.questionType === 'hotspot' ? (
                            <View
                                style={{
                                    width: '100%',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        width: Dimensions.get('window').width < 768 ? 300 : 400,
                                        height: Dimensions.get('window').width < 768 ? 300 : 400,
                                    }}
                                >
                                    <Image
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'relative',
                                        }}
                                        resizeMode="stretch"
                                        source={{
                                            uri: problem.imgUrl,
                                        }}
                                    />
                                    {
                                        // Render all the markers
                                        problem.hotspotOptions.map((option: any, ind: number) => {
                                            const spot = problem.hotspots[ind];

                                            const isSelected = solutions[index].hotspotSelection[ind];
                                            const optionIsCorrect = problem.hotspotOptions[ind].isCorrect;

                                            let backgroundColor = '#fff';
                                            let borderColor = '#007AFF';
                                            let color = '#007AFF';

                                            if (isSelected && !optionIsCorrect) {
                                                backgroundColor = '#ffe6f3';
                                                borderColor = '#f94144';
                                                color = '#f94144';
                                            } else if (isSelected && optionIsCorrect) {
                                                backgroundColor = '#d4f3e5';
                                                borderColor = '#35ac78';
                                                color = '#35ac78';
                                            } else if (!isSelected && optionIsCorrect) {
                                                backgroundColor = '#007AFF';
                                                borderColor = '#007AFF';
                                                color = '#fff';
                                            }

                                            return (
                                                <View
                                                    style={{
                                                        position: 'absolute',
                                                        top: `${spot.y}%`,
                                                        left: `${spot.x}%`,
                                                        backgroundColor,
                                                        height: 25,
                                                        width: 25,
                                                        borderColor,
                                                        borderWidth: 1,
                                                        borderRadius: 12.5,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color,
                                                            lineHeight: 25,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {ind + 1}
                                                    </Text>
                                                </View>
                                            );
                                        })
                                    }
                                </View>
                            </View>
                        ) : null}

                        {/*  Hotspot Labels */}
                        {problem.questionType === 'hotspot' ? (
                            <View
                                style={{
                                    paddingTop: 50,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    {problem.hotspotOptions.map((option: any, ind: number) => {
                                        const isSelected = solutions[index].hotspotSelection[ind];

                                        const optionIsCorrect = option.isCorrect;

                                        // let classNameHighlight = 'highlightTextOption';

                                        // let backgroundColor = '#e6f0ff'
                                        let borderColor = '#fff';
                                        let color = '#000';

                                        if (isSelected && !optionIsCorrect) {
                                            // backgroundColor = '#ffe6f3';
                                            borderColor = '#f94144';
                                            color = '#f94144';
                                        } else if (isSelected && optionIsCorrect) {
                                            // backgroundColor = '#d4f3e5';
                                            borderColor = '#35ac78';
                                            color = '#35ac78';
                                        } else if (!isSelected && optionIsCorrect) {
                                            // backgroundColor = '#007AFF'
                                            borderColor = '#007AFF';
                                            color = '#007AFF';
                                        }

                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginRight: 20,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                <BouncyCheckbox
                                                    style={{}}
                                                    disableBuiltInState={true}
                                                    isChecked={isSelected}
                                                    onPress={(e) => {
                                                        return;
                                                    }}
                                                    disabled={true}
                                                />

                                                {
                                                    <View
                                                        style={{
                                                            borderRadius: 8,
                                                            padding: 7,
                                                            // backgroundColor,
                                                            borderColor,
                                                            borderWidth: 2,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'Overpass',
                                                                color,
                                                            }}
                                                        >
                                                            {ind + 1}. {option.option}
                                                        </Text>
                                                    </View>
                                                }
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

                        {problem.questionType === 'dragdrop' ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    paddingTop: 20,
                                }}
                            >
                                {problem.dragDropHeaders.map((header: string, groupIndex: number) => {
                                    //
                                    return (
                                        <View
                                            style={{
                                                width: 240,
                                                marginRight: 30,
                                                padding: 20,
                                                borderWidth: 1,
                                                borderColor: '#ccc',
                                                borderRadius: 15,
                                                marginBottom: Dimensions.get('window').width < 768 ? 30 : 30,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    marginBottom: 20,
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {header}
                                            </Text>

                                            {solutions[index].dragDropChoices[groupIndex].map((label: any) => {
                                                return (
                                                    <View
                                                        style={{
                                                            // width: 200,
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            paddingVertical: 16,
                                                            paddingHorizontal: 10,
                                                            marginRight: 20,
                                                            marginBottom: 20,
                                                            borderRadius: 10,
                                                            // backgroundColor: '#f8f8f8',
                                                            borderWidth: 1,
                                                            borderColor: '#ccc',
                                                            shadowOffset: {
                                                                width: 2,
                                                                height: 2,
                                                            },
                                                            overflow: 'hidden',
                                                            shadowOpacity: 0.07,
                                                            shadowRadius: 7,
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={'ellipsis-vertical-outline'}
                                                            size={16}
                                                            color="#1f1f1f"
                                                        />
                                                        <Text
                                                            style={{
                                                                // width: '100%',
                                                                marginLeft: 5,
                                                            }}
                                                        >
                                                            {label.content}
                                                        </Text>
                                                        <View
                                                            style={{
                                                                marginLeft: 'auto',
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name={
                                                                    label.correct
                                                                        ? 'checkmark-circle-outline'
                                                                        : 'close-circle-outline'
                                                                }
                                                                size={16}
                                                                color={label.correct ? '#35AC78' : '#ff0000'}
                                                            />
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'highlightText' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {
                                    <RenderHtml
                                        contentWidth={contentWidth}
                                        source={{
                                            html: problem.highlightTextHtml,
                                        }}
                                        defaultTextProps={{
                                            selectable: false,
                                        }}
                                        // renderers={renderers}
                                        renderers={{
                                            span: ({ TDefaultRenderer, ...rendererProps }) => {
                                                const highlightTextChoices = problem.highlightTextChoices;
                                                const highlightTextSelection = solutions[index].highlightTextSelection;

                                                const node = rendererProps.tnode.domNode;

                                                // console.log("T Node domNode", node)

                                                if (!node.attribs.id) {
                                                    // Default return;
                                                    return <TDefaultRenderer {...rendererProps} />;
                                                }

                                                if (!node.attribs.id) {
                                                    return <span>{node.children[0].data}</span>;
                                                }

                                                let classNameHighlight = 'highlightTextOption';
                                                let borderColor = '#e6f0ff';
                                                let backgroundColor = '#e6f0ff';
                                                let color = '#007AFF';

                                                if (
                                                    highlightTextSelection[Number(node.attribs.id)] &&
                                                    !highlightTextChoices[Number(node.attribs.id)]
                                                ) {
                                                    classNameHighlight = 'highlightTextWrong';
                                                    borderColor = '#f94144';
                                                    backgroundColor = '#ffe6f3';
                                                    color = '#f94144';
                                                } else if (
                                                    highlightTextSelection[Number(node.attribs.id)] &&
                                                    highlightTextChoices[Number(node.attribs.id)]
                                                ) {
                                                    classNameHighlight = 'highlightTextCorrect';
                                                    borderColor = '#35ac78';
                                                    backgroundColor = '#d4f3e5';
                                                    color = '#35ac78';
                                                } else if (
                                                    !highlightTextSelection[Number(node.attribs.id)] &&
                                                    highlightTextChoices[Number(node.attribs.id)]
                                                ) {
                                                    classNameHighlight = 'highlightTextActive';
                                                    borderColor = '#007AFF';
                                                    backgroundColor = '#007AFF';
                                                    color = '#fff';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            borderColor,
                                                            backgroundColor,
                                                            borderRadius: 10,
                                                            paddingHorizontal: 8,
                                                            paddingTop: 7,
                                                            marginVertical: 5,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                color,
                                                                fontSize: 16,
                                                                flexWrap: 'wrap',
                                                                // marginVertical: 5
                                                            }}
                                                        >
                                                            {node.children[0].data}
                                                        </Text>
                                                    </View>
                                                );
                                            },
                                        }}
                                        tagsStyles={{
                                            p: {
                                                lineHeight: 50,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                }
                            </View>
                        ) : null}

                        {/* Inline Choice */}
                        {problem.questionType === 'inlineChoice' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {
                                    <RenderHtml
                                        contentWidth={contentWidth}
                                        source={{
                                            html: problem.inlineChoiceHtml,
                                        }}
                                        defaultTextProps={{
                                            selectable: false,
                                        }}
                                        renderers={{
                                            span: ({ TDefaultRenderer, ...rendererProps }) => {
                                                const inlineChoiceOptions = problem.inlineChoiceOptions;

                                                let inlineChoiceSelection = solutions[index].inlineChoiceSelection;

                                                const node = rendererProps.tnode.domNode;

                                                if (!node.attribs.id) {
                                                    // Default return;
                                                    return <TDefaultRenderer {...rendererProps} />;
                                                }

                                                let isCorrect = false;

                                                inlineChoiceOptions[Number(node.attribs.id)].map(
                                                    (option: any, optionIndex: number) => {
                                                        if (
                                                            option.option ===
                                                                inlineChoiceSelection[Number(node.attribs.id)] &&
                                                            option.isCorrect
                                                        ) {
                                                            isCorrect = true;
                                                        }
                                                    }
                                                );

                                                return (
                                                    <View
                                                        style={{
                                                            width: Dimensions.get('window').width < 768 ? 120 : 200,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            borderWidth: 2,
                                                            borderColor: isCorrect ? '#35ac78' : '#f94144',
                                                            paddingHorizontal: 10,
                                                            marginHorizontal: 5,
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#000000',
                                                                maxWidth: '80%',
                                                                textAlign: 'center',
                                                                paddingTop: 7,
                                                                paddingBottom: 10,
                                                            }}
                                                            ellipsizeMode="tail"
                                                            numberOfLines={1}
                                                        >
                                                            {inlineChoiceSelection[Number(node.attribs.id)]
                                                                ? inlineChoiceSelection[Number(node.attribs.id)]
                                                                : 'No selection'}
                                                        </Text>
                                                        <View
                                                            style={{
                                                                paddingLeft: 5,
                                                                marginLeft: 'auto',
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name="chevron-down-outline"
                                                                style={{
                                                                    paddingLeft: 3,
                                                                }}
                                                                size={15}
                                                            />
                                                        </View>
                                                    </View>
                                                );
                                            },
                                        }}
                                        tagsStyles={{
                                            p: {
                                                lineHeight: 50,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                }
                            </View>
                        ) : null}

                        {/* Text Entry */}
                        {problem.questionType === 'textEntry' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {
                                    <RenderHtml
                                        contentWidth={contentWidth}
                                        source={{
                                            html: problem.textEntryHtml,
                                        }}
                                        defaultTextProps={{
                                            selectable: false,
                                        }}
                                        renderers={{
                                            span: ({ TDefaultRenderer, ...rendererProps }) => {
                                                const textEntryOptions = problem.textEntryOptions;

                                                let responses;

                                                if (!props.isOwner) {
                                                    responses = solutions[index].textEntrySelection;
                                                }

                                                const node = rendererProps.tnode.domNode;

                                                if (!node.attribs.id) {
                                                    // Default return;
                                                    return <TDefaultRenderer {...rendererProps} />;
                                                }

                                                const option = textEntryOptions[Number(node.attribs.id)];

                                                const value =
                                                    solutions[index].textEntrySelection[Number(node.attribs.id)];

                                                let isCorrect =
                                                    value.toString().trim().toLowerCase() ===
                                                    option.option.toString().trim().toLowerCase();

                                                return (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            width: 100,
                                                            // height: 50,
                                                            paddingVertical: 8,
                                                            paddingHorizontal: 10,
                                                            borderWidth: 2,
                                                            borderColor: isCorrect ? '#35ac78' : '#f94144',
                                                            marginBottom: 5,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                // width: '90%'
                                                                textAlign: 'center',
                                                            }}
                                                            ellipsizeMode="tail"
                                                            numberOfLines={1}
                                                        >
                                                            {solutions[index].textEntrySelection[
                                                                Number(node.attribs.id)
                                                            ]
                                                                ? solutions[index].textEntrySelection[
                                                                      Number(node.attribs.id)
                                                                  ]
                                                                : 'No value'}
                                                        </Text>
                                                        {!props.isOwner ? (
                                                            <View
                                                                style={{
                                                                    paddingLeft: 5,
                                                                    marginLeft: 'auto',
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="pencil-outline"
                                                                    size={16}
                                                                    color="#1f1f1f"
                                                                />
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                );
                                            },
                                        }}
                                        tagsStyles={{
                                            p: {
                                                lineHeight: 50,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                }
                            </View>
                        ) : null}

                        {problem.questionType === 'multipart' ? (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    paddingBottom: 30,
                                    // paddingLeft: Dimensions.get("window").width < 768 ? 0 : 40
                                }}
                            >
                                {problem.multipartOptions.map((part: any, partIndex: number) => {
                                    const alphabet = [
                                        'A',
                                        'B',
                                        'C',
                                        'D',
                                        'E',
                                        'F',
                                        'G',
                                        'H',
                                        'I',
                                        'J',
                                        'K',
                                        'L',
                                        'M',
                                        'N',
                                        'O',
                                        'P',
                                        'Q',
                                        'R',
                                        'S',
                                        'T',
                                        'U',
                                        'V',
                                        'W',
                                        'X',
                                        'Y',
                                        'Z',
                                    ];

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    fontFamily: 'Overpass',
                                                    marginTop: 30,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                Part {alphabet[partIndex]}
                                            </Text>

                                            <RenderHtml
                                                contentWidth={contentWidth}
                                                source={{
                                                    html: problem.multipartQuestions[partIndex],
                                                }}
                                                defaultTextProps={{
                                                    selectable: false,
                                                }}
                                                // renderers={renderers}
                                                renderers={{
                                                    img: ({ TDefaultRenderer, ...rendererProps }) => {
                                                        const node = rendererProps.tnode.domNode;

                                                        const attribs = node.attribs;

                                                        if (attribs && attribs['data-eq']) {
                                                            const formula =
                                                                '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                            console.log('Formula', formula);

                                                            return (
                                                                <View
                                                                    style={{
                                                                        minWidth: 100,
                                                                    }}
                                                                >
                                                                    <MathJax
                                                                        html={formula}
                                                                        mathJaxOptions={{
                                                                            messageStyle: 'none',
                                                                            extensions: [
                                                                                'tex2jax.js',
                                                                                'MathMenu.js',
                                                                                'MathZoom.js',
                                                                            ],
                                                                            jax: ['input/TeX', 'output/HTML-CSS'],
                                                                            tex2jax: {
                                                                                inlineMath: [
                                                                                    ['$', '$'],
                                                                                    ['\\(', '\\)'],
                                                                                ],
                                                                                displayMath: [
                                                                                    ['$$', '$$'],
                                                                                    ['\\[', '\\]'],
                                                                                ],
                                                                                processEscapes: false,
                                                                            },
                                                                            SVG: {
                                                                                useGlobalCache: false,
                                                                            },
                                                                            TeX: {
                                                                                extensions: [
                                                                                    'AMSmath.js',
                                                                                    'AMSsymbols.js',
                                                                                    'noErrors.js',
                                                                                    'noUndefined.js',
                                                                                    'AMSmath.js',
                                                                                    'AMSsymbols.js',
                                                                                    'autoload-all.js',
                                                                                ],
                                                                            },
                                                                        }}
                                                                    />
                                                                </View>
                                                            );
                                                        }

                                                        return (
                                                            <Image
                                                                source={{
                                                                    uri: attribs.src,
                                                                }}
                                                                style={{
                                                                    maxWidth: Dimensions.get('window').width,
                                                                    width: 300,
                                                                    height: 300,
                                                                    flex: 1,
                                                                }}
                                                                resizeMode={'contain'}
                                                            />
                                                        );
                                                    },
                                                }}
                                                tagsStyles={{
                                                    p: {
                                                        lineHeight: 50,
                                                        fontSize: 16,
                                                    },
                                                }}
                                            />

                                            {part.map((option: any, optionIndex: number) => {
                                                let selected =
                                                    solutions[index].multipartSelection[partIndex][optionIndex];
                                                let isCorrectAnswer = option.isCorrect;

                                                let color = '#000000';
                                                let background = 'none';

                                                if (selected && isCorrectAnswer) {
                                                    color = '#35ac78';
                                                    background = '#d4f3e5';
                                                } else if (selected && !isCorrectAnswer) {
                                                    color = '#f94144';
                                                    background = '#ffe6f3';
                                                } else if (!selected && isCorrectAnswer) {
                                                    color = '#35ac78';
                                                    background = '#d4f3e5';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            flexDirection:
                                                                Dimensions.get('window').width < 768 ? 'column' : 'row',
                                                            alignItems:
                                                                Dimensions.get('window').width < 768
                                                                    ? 'flex-start'
                                                                    : 'center',
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                marginBottom: 10,
                                                                marginTop: 20,
                                                                maxWidth:
                                                                    Dimensions.get('window').width < 768
                                                                        ? '80%'
                                                                        : '50%',
                                                            }}
                                                        >
                                                            <BouncyCheckbox
                                                                style={{}}
                                                                isChecked={
                                                                    solutions[index].multipartSelection[partIndex][
                                                                        optionIndex
                                                                    ]
                                                                }
                                                                onPress={(e) => {
                                                                    // Num of correct
                                                                    return;
                                                                }}
                                                                disableBuiltInState={true}
                                                                disabled={true}
                                                            />

                                                            <View
                                                                style={{
                                                                    fontSize: 14,
                                                                    paddingHorizontal: 15,
                                                                    color,
                                                                    lineHeight: 25,
                                                                    backgroundColor:
                                                                        selected || isCorrectAnswer
                                                                            ? background
                                                                            : '#fff',
                                                                    borderColor:
                                                                        selected || isCorrectAnswer ? color : 'none',
                                                                    borderWidth: selected || isCorrectAnswer ? 1 : 0,
                                                                    padding: 7,
                                                                    borderRadius: 5,
                                                                }}
                                                            >
                                                                <RenderHtml
                                                                    contentWidth={contentWidth}
                                                                    source={{
                                                                        html: option.option,
                                                                    }}
                                                                    defaultTextProps={{
                                                                        selectable: false,
                                                                    }}
                                                                    // renderers={renderers}
                                                                    renderers={{
                                                                        img: ({
                                                                            TDefaultRenderer,
                                                                            ...rendererProps
                                                                        }) => {
                                                                            const node = rendererProps.tnode.domNode;

                                                                            const attribs = node.attribs;

                                                                            if (attribs && attribs['data-eq']) {
                                                                                const formula =
                                                                                    '$' +
                                                                                    decodeURIComponent(
                                                                                        attribs['data-eq'] + '$'
                                                                                    );
                                                                                console.log('Formula', formula);

                                                                                return (
                                                                                    <View
                                                                                        style={{
                                                                                            minWidth: 100,
                                                                                        }}
                                                                                    >
                                                                                        <MathJax
                                                                                            html={formula}
                                                                                            mathJaxOptions={{
                                                                                                messageStyle: 'none',
                                                                                                extensions: [
                                                                                                    'tex2jax.js',
                                                                                                    'MathMenu.js',
                                                                                                    'MathZoom.js',
                                                                                                ],
                                                                                                jax: [
                                                                                                    'input/TeX',
                                                                                                    'output/HTML-CSS',
                                                                                                ],
                                                                                                tex2jax: {
                                                                                                    inlineMath: [
                                                                                                        ['$', '$'],
                                                                                                        ['\\(', '\\)'],
                                                                                                    ],
                                                                                                    displayMath: [
                                                                                                        ['$$', '$$'],
                                                                                                        ['\\[', '\\]'],
                                                                                                    ],
                                                                                                    processEscapes:
                                                                                                        false,
                                                                                                },
                                                                                                SVG: {
                                                                                                    useGlobalCache:
                                                                                                        false,
                                                                                                },
                                                                                                TeX: {
                                                                                                    extensions: [
                                                                                                        'AMSmath.js',
                                                                                                        'AMSsymbols.js',
                                                                                                        'noErrors.js',
                                                                                                        'noUndefined.js',
                                                                                                        'AMSmath.js',
                                                                                                        'AMSsymbols.js',
                                                                                                        'autoload-all.js',
                                                                                                    ],
                                                                                                },
                                                                                            }}
                                                                                        />
                                                                                    </View>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <Image
                                                                                    source={{
                                                                                        uri: attribs.src,
                                                                                    }}
                                                                                    style={{
                                                                                        maxWidth:
                                                                                            Dimensions.get('window')
                                                                                                .width,
                                                                                        width: 300,
                                                                                        height: 300,
                                                                                        flex: 1,
                                                                                    }}
                                                                                    resizeMode={'contain'}
                                                                                />
                                                                            );
                                                                        },
                                                                    }}
                                                                    tagsStyles={{
                                                                        p: {
                                                                            lineHeight: 50,
                                                                            fontSize: 16,
                                                                        },
                                                                    }}
                                                                />
                                                            </View>
                                                        </View>
                                                        <View
                                                            style={{
                                                                paddingLeft:
                                                                    Dimensions.get('window').width < 768 ? 30 : 10,
                                                                marginBottom:
                                                                    Dimensions.get('window').width < 768 ? 0 : 10,
                                                                marginTop:
                                                                    Dimensions.get('window').width < 768 ? 0 : 20,
                                                            }}
                                                        >
                                                            {selected || isCorrectAnswer ? (
                                                                <Text
                                                                    style={{
                                                                        fontSize: 12,
                                                                        fontFamily: 'Overpass',
                                                                        paddingLeft: 15,
                                                                        textTransform: 'uppercase',
                                                                        flexDirection: 'column',
                                                                        color: '#007AFF',
                                                                    }}
                                                                >
                                                                    {selected && isCorrectAnswer
                                                                        ? 'Correct response'
                                                                        : selected && !isCorrectAnswer
                                                                        ? props.isOwner
                                                                            ? 'Student response'
                                                                            : 'Your response'
                                                                        : 'Missing Correct answer'}
                                                                </Text>
                                                            ) : null}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'matchTableGrid' ? (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    marginTop: 20,
                                    paddingBottom: 30,
                                }}
                            >
                                {/* Header row */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingLeft: 0,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '33%',
                                        }}
                                    />
                                    {problem.matchTableHeaders.map((header: any, headerIndex: number) => {
                                        return (
                                            <View
                                                style={{
                                                    width: '33%',
                                                    borderWidth: 1,
                                                    borderColor: '#DDD',
                                                    paddingVertical: 15,
                                                    paddingHorizontal: 7,
                                                    height: '100%',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        width: '100%',
                                                    }}
                                                >
                                                    {header}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                {/* Rows */}
                                {problem.matchTableChoices.map((choiceRow: any, rowIndex: number) => {
                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingLeft: 0,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '33%',
                                                    borderWidth: 1,
                                                    borderColor: '#DDD',
                                                    paddingVertical: 15,
                                                    paddingHorizontal: 7,
                                                    height: '100%',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        width: '100%',
                                                    }}
                                                >
                                                    {problem.matchTableOptions[rowIndex]}
                                                </Text>
                                            </View>
                                            {choiceRow.map((choice: boolean, choiceIndex: number) => {
                                                let borderColor = '#DDD';
                                                let background = 'none';

                                                const selected =
                                                    solutions[index].matchTableSelection[rowIndex][choiceIndex];

                                                if (choice) {
                                                    borderColor = '#35ac78';
                                                    background = '#d4f3e5';
                                                } else if (!choice && selected) {
                                                    borderColor = '#f94144';
                                                    background = '#ffe6f3';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            width: '33%',
                                                            borderWidth: 1,
                                                            borderColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            height: '100%',
                                                            backgroundColor: background,
                                                        }}
                                                    >
                                                        <BouncyCheckbox
                                                            style={{
                                                                padding: 0,
                                                                margin: 0,
                                                            }}
                                                            isChecked={
                                                                solutions[index].matchTableSelection[rowIndex][
                                                                    choiceIndex
                                                                ]
                                                            }
                                                            onPress={(e) => {
                                                                return;
                                                            }}
                                                            disabled={true}
                                                            disableBuiltInState={true}
                                                        />
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'freeResponse' ? (
                            <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                <Text
                                    style={{
                                        color: solutions[index].response !== '' ? 'black' : '#f94144',
                                        paddingTop: 20,
                                        paddingBottom: 40,
                                        lineHeight: 25,
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                    }}
                                >
                                    {solutions[index].response && solutions[index].response !== '' ? (
                                        <View
                                            style={{
                                                paddingTop: 10,
                                                width: '100%',
                                                flex: 1,
                                            }}
                                        >
                                            <RenderHtml
                                                contentWidth={contentWidth}
                                                source={{
                                                    html: solutions[index].response,
                                                }}
                                                defaultTextProps={{
                                                    selectable: false,
                                                }}
                                                // renderers={renderers}
                                                renderers={{
                                                    img: ({ TDefaultRenderer, ...rendererProps }) => {
                                                        const node = rendererProps.tnode.domNode;

                                                        const attribs = node.attribs;

                                                        if (attribs && attribs['data-eq']) {
                                                            const formula =
                                                                '$' + decodeURIComponent(attribs['data-eq'] + '$');
                                                            console.log('Formula', formula);

                                                            return (
                                                                <View
                                                                    style={{
                                                                        minWidth: 100,
                                                                    }}
                                                                >
                                                                    <MathJax
                                                                        html={formula}
                                                                        mathJaxOptions={{
                                                                            messageStyle: 'none',
                                                                            extensions: [
                                                                                'tex2jax.js',
                                                                                'MathMenu.js',
                                                                                'MathZoom.js',
                                                                            ],
                                                                            jax: ['input/TeX', 'output/HTML-CSS'],
                                                                            tex2jax: {
                                                                                inlineMath: [
                                                                                    ['$', '$'],
                                                                                    ['\\(', '\\)'],
                                                                                ],
                                                                                displayMath: [
                                                                                    ['$$', '$$'],
                                                                                    ['\\[', '\\]'],
                                                                                ],
                                                                                processEscapes: false,
                                                                            },
                                                                            SVG: {
                                                                                useGlobalCache: false,
                                                                            },
                                                                            TeX: {
                                                                                extensions: [
                                                                                    'AMSmath.js',
                                                                                    'AMSsymbols.js',
                                                                                    'noErrors.js',
                                                                                    'noUndefined.js',
                                                                                    'AMSmath.js',
                                                                                    'AMSsymbols.js',
                                                                                    'autoload-all.js',
                                                                                ],
                                                                            },
                                                                        }}
                                                                    />
                                                                </View>
                                                            );
                                                        }

                                                        return (
                                                            <Image
                                                                source={{
                                                                    uri: attribs.src,
                                                                }}
                                                                style={{
                                                                    maxWidth: Dimensions.get('window').width,
                                                                    width: 300,
                                                                    height: 300,
                                                                    flex: 1,
                                                                }}
                                                                resizeMode={'contain'}
                                                            />
                                                        );
                                                    },
                                                }}
                                                tagsStyles={{
                                                    p: {
                                                        lineHeight: 50,
                                                        fontSize: 16,
                                                    },
                                                }}
                                            />
                                        </View>
                                    ) : (
                                        'No response'
                                    )}
                                </Text>
                            </View>
                        ) : null}

                        {!props.isOwner && problemComments[index] === '' ? null : (
                            <View style={{ width: '100%', marginBottom: 40 }}>
                                {props.isOwner ? (
                                    <AutoGrowingTextInput
                                        value={problemComments[index]}
                                        onChange={(event: any) => {
                                            const updateProblemComments = [...problemComments];
                                            updateProblemComments[index] = event.nativeEvent.text || '';
                                            setProblemComments(updateProblemComments);
                                        }}
                                        style={{
                                            fontFamily: 'overpass',
                                            maxWidth: 400,
                                            marginBottom: 10,
                                            marginTop: 10,
                                            // borderRadius: 10,
                                            borderBottomWidth: 1,
                                            borderStyle: 'solid',
                                            borderColor: '#CCC',
                                            paddingTop: 13,
                                            paddingBottom: 13,
                                            fontSize: 14,
                                            paddingLeft: 13,
                                        }}
                                        placeholder={'Remark'}
                                        placeholderTextColor="#66737C"
                                        maxHeight={200}
                                        minHeight={80}
                                        enableScrollToCaret
                                        // ref={}
                                    />
                                ) : (
                                    <View
                                        style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}
                                    >
                                        <Text style={{ color: '#007AFF', fontSize: 13 }}>{problemComments[index]}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}
            {!props.isOwner && !comment ? null : (
                <View style={{ width: '100%', paddingVertical: 50, borderTopWidth: 1, borderColor: '#f2f2f2' }}>
                    {!props.isOwner ? <Text style={{ width: '100%', textAlign: 'left' }}>Feedback</Text> : null}
                    {props.isOwner ? (
                        <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '80%', maxWidth: 600 }}>
                            <AutoGrowingTextInput
                                value={comment}
                                onChange={(event: any) => setComment(event.nativeEvent.text || '')}
                                style={{
                                    fontFamily: 'overpass',
                                    maxWidth: 400,
                                    marginBottom: 10,
                                    marginTop: 10,
                                    borderBottomWidth: 1,
                                    borderStyle: 'solid',
                                    borderColor: '#CCC',
                                    paddingTop: 13,
                                    paddingBottom: 13,
                                    fontSize: 14,
                                    paddingLeft: 13,
                                }}
                                placeholder={'Feedback'}
                                placeholderTextColor="#66737C"
                                maxHeight={200}
                                minHeight={80}
                                enableScrollToCaret
                            />
                        </View>
                    ) : (
                        <Text
                            style={{ color: '#007AFF', fontSize: 14, width: '100%', textAlign: 'left', marginTop: 40 }}
                        >
                            {comment}
                        </Text>
                    )}
                </View>
            )}

            {/* Add Submit button here */}
            {props.isOwner ? (
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        display: 'flex',
                        marginTop: 25,
                        marginBottom: 25,
                        paddingBottom: 100,
                    }}
                >
                    {props.isOwner && props.currentQuizAttempt !== props.activeQuizAttempt ? (
                        <TouchableOpacity
                            onPress={() => props.modifyActiveQuizAttempt()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                marginBottom: 20,
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                MAKE ACTIVE
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
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
                                width: 150,
                            }}
                        >
                            SAVE
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
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20,
    },
    row: {
        minHeight: 50,
        flexDirection: 'row',
        overflow: 'hidden',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
    },
    col: { width: '25%', justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7 },
});
