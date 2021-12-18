// REACT
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark';
    const styleObject = styles(colorScheme, props.colorCode);
    return (
        <View style={styleObject.swiper}>
            <TouchableOpacity
                key={'textPage'}
                onPress={() => {
                    props.onPress();
                }}
                style={styleObject.card}>
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
                            width: '100%',
                            flex: 1,
                            height: '100%',
                            flexDirection: 'row'
                        }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 12,
                                    lineHeight: 20,
                                    flex: 1,
                                    marginTop: 5,
                                    color: '#000000'
                                }}>
                                {props.title}
                            </Text>
                            {props.option === 'Channels' && !props.subscribed ? (
                                <View style={{ paddingLeft: 10 }}>
                                    <TouchableOpacity onPress={() => props.handleSub()} style={{ marginTop: 1 }}>
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
        </View>
    );
};

export default SearchResultCard;

const styles: any = (colorScheme: any, col: any) =>
    StyleSheet.create({
        swiper: {
            height: '100%',
            backgroundColor: '#fff',
            borderRadius: 1,
            maxWidth: 130,
            width: 130,
            borderColor: col,
            borderLeftWidth: 3,
            flexDirection: 'row',
            shadowOffset: {
                width: 2,
                height: 2
            },
            overflow: 'hidden',
            shadowOpacity: 0.07,
            shadowRadius: 7,
            zIndex: 500000
        },
        card: {
            height: '100%',
            width: 130,
            minWidth: 130,
            padding: 10,
            paddingHorizontal: 10,
            backgroundColor: '#fff'
        },
        text: {
            backgroundColor: 'white'
        },
        dateContainer: {
            fontSize: 10,
            marginBottom: 5,
            color: '#efefef',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'row'
        },
        date: {
            fontSize: 9,
            color: colorScheme === 'light' ? '#efefef' : '#1F1F1F',
            lineHeight: 10
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
