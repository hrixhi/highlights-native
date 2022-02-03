// REACT
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';

import Alert from './Alert';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark';
    const styleObject = styles(colorScheme, props.colorCode || 'black');
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
                        {props.channelName !== '' && props.option !== 'Channels' ? (
                            <Text style={styleObject.date}>{props.channelName}</Text>
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
                            height: '70%',
                        }}
                    >
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 13,
                                    lineHeight: 20,
                                    flex: 1,
                                    marginTop: 7,
                                    color: '#000000',
                                }}
                            >
                                {props.title}
                            </Text>
                            {props.option === 'Channels' && !props.subscribed ? (
                                <View style={{ paddingLeft: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert('Subscribe to ' + props.channelName + '?', '', [
                                                {
                                                    text: 'Cancel',
                                                    style: 'cancel',
                                                    onPress: () => {
                                                        return;
                                                    }
                                                },
                                                {
                                                    text: 'Yes',
                                                    onPress: () => props.handleSub()
                                                }
                                            ]);
                                        }}
                                        style={{ marginTop: 1 }}
                                    >
                                        <Text style={{}}>
                                            <Ionicons name="enter-outline" size={18} color="#006AFF" />
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

const styles: any = (colorScheme: any, col: any) =>
    StyleSheet.create({
        swiper: {
            height: 60,
            backgroundColor: '#fff',
            borderColor: col,
            borderLeftWidth: 3,
            flexDirection: 'column',
            shadowColor: '#000000',
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 1,
            elevation: 0,
            zIndex: 500000,
            borderTopColor: '#efefef',
            borderTopWidth: 1,
            borderBottomColor: '#efefef',
            borderBottomWidth: 1,
            marginBottom: 15,
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
            height: '30%',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        },
        date: {
            fontSize: 10,
            color: '#1F1F1F',
            lineHeight: 12,
            textAlign: 'left',
            paddingVertical: 2,
            flex: 1,
        },
        title: {
            fontFamily: 'overpass',
            fontSize: 12,
            lineHeight: 20,
            flex: 1,
            marginTop: 5,
            color: '#000000'
        }
    });
