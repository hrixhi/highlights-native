import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';

const Card: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#FFBA10', '#B8D41F', '#53BE6D'].reverse()
    const colorScheme = 'dark'
    const styleObject = styles(colorScheme, props.channelId, colorChoices[props.cue.color])
    const starred = props.cue.starred;
    const { title, subtitle } = htmlStringParser(props.cue.channelId && props.cue.channelId !== '' ? props.cue.original : props.cue.cue)
    const [showScore, setShowScore] = useState(false);
    const [colorCode, setColorCode] = useState('#2f2f3c');

    useEffect(() => {
        if (props.cue && props.cue.original) {
            // Hide scores if it's a quiz and !releaseSubmission
            if (props.cue.graded && !props.cue.releaseSubmission) {
                setShowScore(false)
            } else {
                setShowScore(true);
            }
        }

        // Set color code
        const matchSubscription = props.subscriptions.find((sub: any) => {
            return sub.channelName === props.cue.channelName
        })

        if (matchSubscription && matchSubscription !== undefined) {
            setColorCode(matchSubscription.colorCode)

        }
    }, [props.cue])

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                key={'textPage'}
                onPress={() => props.updateModal()}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        <View style={{
                            width: 9,
                            height: 9,
                            borderRadius: 10,
                            backgroundColor: colorCode
                        }} />

                        <Text style={styleObject.date}>
                            {props.cue.channelName ? props.cue.channelName : 'My Cues'}
                        </Text>
                        {/* {
                            props.cue.channelName ?
                                <Text style={styleObject.date}>
                                    {props.cue.channelName}
                                </Text> : null
                        } */}
                        {/* <Text style={styleObject.date}>
                            {props.cue.customCategory}
                        </Text> */}
                        {/* {
                            props.cue.submission ? <Text style={styleObject.date}>
                                <Ionicons name='share-outline' size={9} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#3B64F8') : (colorScheme === 'light' ? '#fff' : '#333333')} style={{ marginRight: 10 }} />
                            </Text> : null
                        }
                        {
                            props.cue.frequency !== '0' ?
                                <Text style={styleObject.date}>
                                    <Ionicons name='notifications-outline' size={9} color={colorScheme === 'light' ? '#fff' : '#333333'} />
                                </Text> : null
                        } */}
                        {
                            props.cue.graded && showScore ? <Text style={{
                                fontSize: 9,
                                color: '#3B64F8',
                                marginLeft: 10
                            }}>
                                {props.cue.score}%
                            </Text> : null
                        }
                        {
                            props.cue.starred ?
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -28,
                                    paddingRight: 30,
                                    position: 'absolute',
                                    width: '97%',
                                    zIndex: 20
                                }}>
                                    <Ionicons name='bookmark' size={18} color={starred ? '#d91d56' : '#fff'} />
                                </Text>
                                : null
                        }
                        {/* <View style={{
                            ...styleObject.date,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            flex: 1,
                            marginRight: 5,
                            marginTop: -5,
                            backgroundColor: colorScheme === 'light'
                                ? (starred ? '#2f2f3c' : '#fff')
                                : (starred ? 'white' : '#fff'),
                        }}>
                            {
                                props.cue.submission ? <Text>
                                    <Ionicons name='share-outline' size={11} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#3B64F8') : (colorScheme === 'light' ? '#fff' : '#333333')} style={{ marginRight: 10 }} />
                                </Text> : null
                            }
                            {
                                props.cue.frequency !== '0' ?
                                    <Text>
                                        <Ionicons name='notifications-outline' size={11} color={colorScheme === 'light' ? '#fff' : '#333333'} />
                                    </Text> : null
                            }
                        </View> */}
                        <Text style={styleObject.date2}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: '#fff',
                        width: '100%', flexDirection: 'row', flex: 1, height: '75%', paddingTop: 6
                    }}>
                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.title}>
                            {title}
                        </Text>
                        {
                            props.cue.status && (props.cue.status !== 'read' && props.cue.status !== 'submitted')
                                ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    backgroundColor: '#3B64F8',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 10,
                                    marginTop: -3,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    !
                                </Text>
                                : null
                        }
                        {
                            props.cue.channelId && props.cue.unreadThreads !== 0 ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    backgroundColor: '#d91d56',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 5,
                                    marginTop: -3,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    {props.cue.unreadThreads}
                                </Text> : <Text style={{ width: 25 }} />
                        }
                    </View>
                    {/* <Text
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={starred ? styleObject.descriptionFlip : styleObject.description}>
                        {subtitle && subtitle !== '' ? subtitle : '-'}
                    </Text> */}
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(Card, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue })
})

const styles: any = (colorScheme: any, channelId: any, col: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        maxWidth: 500
    },
    card: {
        maxWidth: 500,
        height: '100%',
        borderRadius: 15,
        padding: 13,
        paddingTop: 20,
        backgroundColor: '#fff',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 15,
        padding: 13,
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white'
    },
    descriptionFlip: {
        color: '#fff',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        height: '100%',
        backgroundColor: '#fff'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white'
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '32%',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        marginLeft: 10,
        lineHeight: 10,
        textAlign: 'right',
        flex: 1
    },
    title: {
        fontFamily: 'inter',
        fontSize: 17,
        lineHeight: 20,
        flex: 1,
        color: col
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#fff' : '#2f2f3c',
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : '#fff',
        fontFamily: 'inter',
        fontSize: 13,
        // ,
        height: '75%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        // height: '30%'
    }
});
