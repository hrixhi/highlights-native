import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import useColorScheme from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';

const Card: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#F8D41F', '#B8D41F', '#53BE6D'].reverse()
    const colorScheme = useColorScheme();
    const styleObject = styles(colorScheme, props.channelId)
    const starred = props.cue.starred;
    const { title, subtitle } = htmlStringParser(props.cue.channelId && props.cue.channelId !== '' ? props.cue.original : props.cue.cue)

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                key={'textPage'}
                onPress={() => props.updateModal()}
                style={starred ? styleObject.flipCard : styleObject.card}>
                <View style={starred ? styleObject.flipText : styleObject.text}>
                    <View style={starred ? styleObject.flipDateContainer : styleObject.dateContainer}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 10,
                            marginTop: 1,
                            backgroundColor: colorChoices[props.cue.color]
                        }} />
                        <Text style={styleObject.date}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text>
                        {
                            props.cue.channelName ?
                                <Text style={styleObject.date}>
                                    {props.cue.channelName}
                                </Text> : null
                        }
                        <Text style={styleObject.date}>
                            {props.cue.customCategory}
                        </Text>
                        {
                            props.cue.graded ? <Text style={{
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
                                    marginTop: -22,
                                    paddingRight: 30,
                                    position: 'absolute',
                                    width: '97%',
                                    zIndex: 20
                                }}>
                                    <Ionicons name='bookmark' size={18} color={starred ? '#d91d56' : '#a2a2aa'} />
                                </Text>
                                : null
                        }
                        <View style={{
                            ...styleObject.date,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            flex: 1,
                            marginRight: 5,
                            marginTop: -5,
                            backgroundColor: colorScheme === 'light'
                                ? (starred ? '#202025' : '#f4f4f6')
                                : (starred ? 'white' : '#a2a2aa'),
                        }}>
                            {
                                props.cue.submission ? <Text>
                                    <Ionicons name='share-outline' size={11} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#3B64F8') : (colorScheme === 'light' ? '#a2a2aa' : '#333333')} style={{ marginRight: 10 }} />
                                </Text> : null
                            }
                            {
                                props.cue.frequency !== '0' ?
                                    <Text>
                                        <Ionicons name='notifications-outline' size={11} color={colorScheme === 'light' ? '#a2a2aa' : '#333333'} />
                                    </Text> : null
                            }
                        </View>
                    </View>
                    <Text
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={starred ? styleObject.titleFlip : styleObject.title}>
                        {title}
                    </Text>
                    <Text
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={starred ? styleObject.descriptionFlip : styleObject.description}>
                        {subtitle && subtitle !== '' ? subtitle : '-'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(Card, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue })
})

const styles: any = (colorScheme: any, channelId: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        maxWidth: 400
    },
    card: {
        maxWidth: 400,
        height: '100%',
        borderRadius: 20,
        padding: 13,
        backgroundColor: colorScheme === 'light' ? '#f4f4f6' : '#a2a2aa',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 13,
        color: '#f4f4f6',
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white'
    },
    descriptionFlip: {
        color: '#a2a2aa',
        fontSize: 13,
        height: '30%'
    },
    text: {
        height: '100%',
        backgroundColor: colorScheme === 'light' ? '#f4f4f6' : '#a2a2aa'
    },
    flipText: {
        height: '100%',
        color: '#f4f4f6',
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white'
    },
    dateContainer: {
        fontSize: 10,
        color: colorScheme === 'light' ? '#a2a2aa' : '#f4f4f6',
        height: '22%',
        backgroundColor: colorScheme === 'light' ? '#f4f4f6' : '#a2a2aa',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '22%',
        display: 'flex',
        flexDirection: 'row',
        color: '#f4f4f6',
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#a2a2aa' : '#333333',
        marginLeft: 10
    },
    title: {
        fontFamily: 'inter',
        fontSize: 14,
        // ,
        height: '44%',
        width: '100%',
        paddingTop: 5,
        color: colorScheme === 'light' ? '#202025' : 'white'
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#fff' : '#202025',
        backgroundColor: colorScheme === 'light' ? '#202025' : '#fff',
        fontFamily: 'inter',
        fontSize: 14,
        // ,
        height: '44%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        color: colorScheme === 'light' ? '#a2a2aa' : '#333333',
        height: '30%'
    }
});
