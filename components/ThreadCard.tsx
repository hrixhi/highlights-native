import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ThreadCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(true)
    const [color, setColor] = useState('#a2a2aa');
    const [subtitle, setSubtitle] = useState('')

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState('')


    useEffect(() => {
        if (props.thread.message[0] === '{' && props.thread.message[props.thread.message.length - 1] === '}') {
            const obj = JSON.parse(props.thread.message)
            setImported(true)
            setUrl(obj.url)
            setTitle(obj.title)
            setType(obj.type)
        } else {
            const { title: t, subtitle: s } = htmlStringParser(props.thread.message)
            setTitle(t)
            setSubtitle(s)
            setImported(false)
            setUrl('')
            setType('')
        }
    }, [props.thread.message])

    const loadColor = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const unparsedUser = JSON.parse(u)
            if (props.channelCreatedBy.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#0079f3')
            } else if (unparsedUser._id.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#333333')
            }
        }
        setLoading(false)
    }, [props.thread, props.channelOwner])

    useEffect(() => {
        loadColor()
    }, [])

    if (loading) {
        return null
    }

    const styleObject = styles(color)

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                onPress={() => props.onPress()}
                key={'textPage'}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        <Text style={styleObject.date}>
                            {
                                (new Date(props.thread.time)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.thread.time)).toString().split(' ')[2]
                            }
                        </Text>
                        {
                            props.thread.isPrivate ?
                                <Text style={styleObject.date}>
                                    <Ionicons name='eye-off-outline' color={'#a2a2aa'} />
                                </Text> : null
                        }
                        <Text style={{
                            fontSize: 10,
                            color,
                            marginRight: 5,
                            flex: 1,
                            textAlign: 'right'
                        }}>
                            {props.thread.anonymous ? 'Anonymous' : props.thread.displayName}
                        </Text>
                    </View>
                    {
                        imported ?
                            <View style={{ backgroundColor: '#f4f4f6', flex: 1, flexDirection: 'row' }}>
                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 17, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='document-outline' size={17} color='#a2a2aa' /> {title}.{type}
                                </Text>
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.titleArrow}>
                                    <Ionicons name="chevron-forward-outline" color="#a2a2aa" size={20} style={{ marginTop: 4 }} />
                                </Text>
                            </View>
                            : <View style={{ backgroundColor: '#f4f4f6', width: '100%', flexDirection: 'row', display: 'flex', height: '44%' }}>
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.title}>
                                    {title}
                                </Text>
                                {
                                    props.thread.unreadThreads !== 0 ?
                                        <Text style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            backgroundColor: '#d91d56',
                                            textAlign: 'center',
                                            zIndex: 150,
                                            marginLeft: 10,
                                            marginTop: 7,
                                            color: 'white', lineHeight: 20, fontSize: 10
                                        }}>
                                            {props.thread.unreadThreads}
                                        </Text> : null
                                }
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.titleArrow}>
                                    <Ionicons name="chevron-forward-outline" color="#a2a2aa" size={20} style={{ marginTop: 4 }} />
                                </Text>
                            </View>
                    }
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.description}>
                        {subtitle}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(ThreadCard, (prev, next) => {
    return _.isEqual({ ...prev.thread }, { ...next.thread })
})

const styles: any = () => StyleSheet.create({
    swiper: {
        height: 80,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'white'
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 150,
        marginLeft: 10
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 13,
        backgroundColor: '#f4f4f6',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f4f4f6'
    },
    dateContainer: {
        fontSize: 10,
        height: '22%',
        backgroundColor: '#f4f4f6',
        display: 'flex',
        flexDirection: 'row'
    },
    date: {
        fontSize: 10,
        color: '#a2a2aa',
        marginLeft: 5
    },
    title: {
        fontFamily: 'inter',
        fontSize: 14,
        paddingTop: 5,
        color: '#202025',
        flex: 1
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 14,
        paddingTop: 5,
        color: '#202025',
        marginLeft: 10
    },
    description: {
        fontSize: 13,
        color: '#a2a2aa',
        height: '30%',
    },
    color: {
        width: 10,
        height: 10,
        borderRadius: 10,
        marginTop: 1
    }
});
