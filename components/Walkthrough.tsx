import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, Switch, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import Swiper from 'react-native-web-swiper'
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from "react-native-youtube-iframe";

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [isInstructor, setIsInstructor] = useState(false)
    const [index, setIndex] = useState(0)

    const loadIsInstructor = useCallback(async () => {
        const choice = await AsyncStorage.getItem("isInstructor")
        if (choice) {
            setIsInstructor(choice === 'false' ? false : true)
        } else {
            await AsyncStorage.setItem("isInstructor", "false")
        }
    }, [])

    useEffect(() => {
        loadIsInstructor()
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    const headings: any[] = ["1. Introduction", "2. Working with Content", "3. Meetings", "4. Text-based Communication", "5. Testing & Grading", "6. Miscellaneous"]
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;

    return (
        <View style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: '#fff',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'white',
                    padding: 15,
                    opacity: modalAnimation,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    alignSelf: 'center'
                }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 20 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View
                    style={{
                        width: '100%',
                        height: 80,
                        backgroundColor: 'white',
                        flexDirection: 'row'
                    }}>
                    <View style={{
                        flex: 1, backgroundColor: 'white',
                    }}>
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 23,
                                color: "#202025",
                                fontFamily: "inter", paddingLeft: 10
                            }}
                        >
                            {headings[index]}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                            <View style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10
                            }}>
                                <Switch
                                    value={isInstructor}
                                    onValueChange={async () => {
                                        const updatedVal = !isInstructor;
                                        await AsyncStorage.setItem("isInstructor", updatedVal.toString())
                                        setIsInstructor(updatedVal)
                                    }}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#a2a2aa'
                                    }}
                                    activeThumbColor='white'
                                />
                            </View>
                            <Text style={{
                                fontSize: 14,
                                color: '#a2a2aa',
                                textAlign: 'left',
                                paddingTop: 7
                            }}>
                                Instructor
                        </Text>
                        </View>
                    </View>
                </View>
                <Swiper
                    key={isInstructor.toString()}
                    onIndexChanged={(ind) => {
                        setIndex(ind)
                    }}
                    vertical={false}
                    from={index}
                    minDistanceForAction={0.1}
                    controlsProps={{
                        dotsTouchable: true,
                        prevPos: 'left',
                        nextPos: 'right',
                        nextTitle: '›',
                        nextTitleStyle: { color: '#a2a2aa', fontSize: 60, fontFamily: 'overpass' },
                        prevTitle: '‹',
                        prevTitleStyle: { color: '#a2a2aa', fontSize: 60, fontFamily: 'overpass' },
                        dotActiveStyle: { backgroundColor: '#3B64F8' }
                    }}
                >
                    {/* Introduction */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "hQYMW3nvP-w" : "t-XBYlugTz8"}
                        />
                    </View>
                    {/* Working with Content */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "XwZRc4TLaRI" : "kkcAXw30xvk"}
                        />
                    </View>
                    {/* Meetings */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "i4L0eJE7DVI" : "S_AaSO0Qcq4"}
                        />
                    </View>
                    {/* Text-based Communication */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "0zYHoTEYwSs" : "vIy-kIg2DgM"}
                        />
                    </View>
                    {/* Testing & Grading */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "uUB9rux8N6w" : "wmS8N2LczaA"}
                        />
                    </View>
                    {/* Miscellaneous */}
                    <View style={styles.screen} key={Math.random()}>
                        <YoutubePlayer
                            height={windowHeight - 100}
                            videoId={isInstructor ? "R3W5_f0-VqI" : "S8N5w6uwD-8"}
                        />
                    </View>
                </Swiper>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 15,
                        borderRadius: 15,
                        width: '100%', justifyContent: 'center', flexDirection: 'row',
                    }} 
                    onPress={() => Linking.openURL('https://www.cuesapp.co')}              
                >
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        overflow: 'hidden',
                        fontSize: 12,
                        backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 200,
                        borderRadius: 15,
                    }}>
                        CONTACT SUPPORT
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View >
    );
}

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: Dimensions.get('window').width < 1024 ? '100%' : '80%',
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
});