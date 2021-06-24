import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Datetime from 'react-datetime';
import { shuffleFrequencyOptions } from '../helpers/FrequencyOptions';

const Menu: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 200
        }}>
            <Animated.View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                opacity: modalAnimation,
            }}>
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}>
                        <View style={{ height: '100%', justifyContent: 'center', backgroundColor: 'white', width: '50%', paddingRight: 7.5 }}>
                            <Text style={styles.text}>
                                Remind <Ionicons name='shuffle-outline' size={15} /> every
                        </Text>
                        </View>
                        <View style={{ height: '100%', justifyContent: 'center', backgroundColor: 'white', width: '50%', paddingLeft: 7.5 }}>
                            <Picker
                                style={styles.picker}
                                itemStyle={{
                                    width: 110,
                                    fontSize: 15
                                }}
                                selectedValue={props.randomShuffleFrequency}
                                onValueChange={(itemValue: any) =>
                                    props.setRandomShuffleFrequency(itemValue)
                                }
                            >
                                {
                                    shuffleFrequencyOptions.map((item: any, index: number) => {
                                        return <Picker.Item
                                            color={props.randomShuffleFrequency === item.value ? '#3B64F8' : "#202025"}
                                            label={item.label}
                                            value={item.value}
                                            key={index}
                                        />
                                    })
                                }
                            </Picker>
                        </View>
                    </View>
                </View>
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    paddingTop: 50
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}>
                        <Text style={{
                            fontSize: 15,
                            color: '#a2a2aa',
                            textAlign: 'right',
                            paddingHorizontal: 10,
                            paddingLeft: 0
                        }}>
                            <Ionicons name='bed-outline' size={15} />  from
                    </Text>
                        {/* <Datetime
                            value={props.sleepFrom}
                            initialViewMode={'time'}
                            dateFormat={false}
                            onChange={(event: any) => {
                                const date = new Date(event)
                                props.setSleepFrom(date)
                            }}
                        /> */}
                        <Text style={{
                            fontSize: 15,
                            color: '#a2a2aa',
                            textAlign: 'center',
                            paddingHorizontal: 10
                        }}>
                            to
                    </Text>
                        {/* <Datetime
                            dateFormat={false}
                            value={props.sleepTo}
                            initialViewMode={'time'}
                            onChange={(event: any) => {
                                const date = new Date(event)
                                props.setSleepTo(event)
                            }}
                        /> */}
                    </View>
                </View>
            </Animated.View>
        </View >
    );
}

export default Menu

const styles = StyleSheet.create({
    row: {
        width: '100%',
        height: '50%',
        display: 'flex',
        flexDirection: 'row'
    },
    col1: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        // border: 'none',
        width: 100
    },
    timePicker: {
        width: 200,
        fontSize: 15,
        // height: 45,
        // color: '#202025'
    },
    text: {
        fontSize: 15,
        color: '#a2a2aa',
        textAlign: 'right',
    }
});
