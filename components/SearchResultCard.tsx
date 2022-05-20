// REACT
import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import moment from 'moment';
import Alert from './Alert';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import { disableEmailId } from '../constants/zoomCredentials';

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark';
    const styleObject = styles(colorScheme, props.colorCode || 'black', props.option);

    /**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    return (
        // <View style={styleObject.swiper}>
        <TouchableOpacity
            key={'textPage'}
            onPress={() => {
                props.onPress();
            }}
            style={styleObject.swiper}
        >
            <View style={styleObject.text}>
                <View style={styleObject.dateContainer}>
                    {props.option === 'Content' || props.option === 'Discussion' ? (
                        <View
                            style={{
                                backgroundColor: props.colorCode || 'black',
                                width: 8,
                                height: 8,
                                borderRadius: 12,
                                marginRight: 7,
                            }}
                        />
                    ) : null}
                    {props.channelName !== '' && props.option !== 'Courses' ? (
                        <Text style={styleObject.date}>{props.channelName}</Text>
                    ) : props.option === 'Messages' ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {props.messageSenderAvatar ? (
                                <Image
                                    source={{
                                        uri: props.messageSenderAvatar,
                                    }}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 24,
                                        marginRight: 10,
                                    }}
                                    // resizeMode="contain"
                                />
                            ) : null}
                            <Text style={styleObject.date}>{props.messageSenderName}</Text>
                        </View>
                    ) : (
                        <Text style={styleObject.date}> </Text>
                    )}
                </View>
                <View
                    style={{
                        backgroundColor: '#fff',
                        width: '100%',
                        flexDirection: 'row',
                        flex: 1,
                        // height: '70%',
                    }}
                >
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 15,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: props.option === 'Messages' ? 6 : 10,
                                color: '#000000',
                            }}
                        >
                            {props.title}
                        </Text>
                        {props.option === 'Content' || props.option === 'Messages' || props.option === 'Discussion' ? (
                            <Text
                                style={{
                                    fontSize: 12,
                                    padding: 5,
                                    lineHeight: 13,
                                    fontWeight: 'bold',
                                }}
                                ellipsizeMode="tail"
                            >
                                {emailTimeDisplay(props.createdAt)}
                            </Text>
                        ) : null}
                        {props.option === 'Courses' && !props.subscribed ? (
                            <View style={{ paddingLeft: 10, paddingRight: 10 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert('Subscribe to ' + props.channelName + '?', '', [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    return;
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: () => props.handleSub(),
                                            },
                                        ]);
                                    }}
                                    style={{ marginTop: 1 }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text style={{}}>
                                        <Ionicons name="enter-outline" size={24} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
        // </View>
    );
};

export default SearchResultCard;

const styles: any = (colorScheme: any, col: any, option: any) =>
    StyleSheet.create({
        swiper: {
            height: 75,
            maxWidth: '100%',
            backgroundColor: '#fff',
            // borderColor: col,
            // borderLeftWidth: 3,
            flexDirection: 'column',
            shadowColor: '#000000',
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 1,
            elevation: 0,
            zIndex: 500000,
            // borderTopColor: '#efefef',
            // borderTopWidth: 1,
            borderBottomColor: '#efefef',
            borderBottomWidth: 1,
            paddingLeft: 7,
            paddingVertical: option === 'Messages' ? 2 : 5,
        },
        // card: {
        //     height: '100%',
        //     // borderTop
        //     width: '100%',
        //     padding: 7,
        //     paddingHorizontal: 10,
        //     backgroundColor: '#fff',
        // },
        text: {
            height: '100%',
            // borderTop
            width: '100%',
            padding: 7,
            paddingHorizontal: 10,
            backgroundColor: '#fff',
        },
        dateContainer: {
            // height: '30%',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            // paddingTop: 10,
        },
        date: {
            fontSize: 12,
            color: '#1F1F1F',
            // lineHeight: 12,
            textAlign: 'left',
            // paddingVertical: 2,
            flex: 1,
        },
        title: {
            fontFamily: 'overpass',
            fontSize: 14,
            lineHeight: 20,
            flex: 1,
            marginTop: 5,
            color: '#000000',
        },
    });
