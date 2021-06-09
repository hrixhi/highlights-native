import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, TouchableOpacity } from '../components/Themed';
import Alert from './Alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = useColorScheme();
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(false)
    const [userLoaded, setUserLoaded] = useState(false)
    const color = colorScheme === 'light' ? '#202025' : '#fff'

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
            }
        }
        setUserLoaded(true)
    }, [])

    useEffect(() => {
        getUser()
    }, [])

    return (
        <View style={styles.bottombar}>
            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                    style={choice === 'All' ? styles.subOutline : styles.sub}
                    onPress={() => {
                        props.handleFilterChange('All')
                        props.setChannelFilterChoice('All')
                        props.setChannelId('')
                    }}>
                    <Text
                        style={{
                            color: colorScheme === 'light' ? (
                                choice === 'All' ? 'white' : '#202025'
                            ) : (
                                choice === 'All' ? '#202025' : 'white'
                            ),
                            lineHeight: 22,
                            fontSize: 14
                        }}
                    >
                        {PreferredLanguageText('myCues')}
                    </Text>
                </TouchableOpacity>
                {
                    props.subscriptions.map((subscription: any) => {
                        return <TouchableOpacity
                            key={Math.random()}
                            style={choice === subscription.channelName ? styles.subOutline : styles.sub}
                            onPress={() => {
                                if (subscription.inactive) {
                                    Alert("Subscription inactivated by channel creator!", "Contact channel creator to gain access.")
                                    return;
                                }
                                props.setChannelFilterChoice('All')
                                props.handleFilterChange(subscription.channelName)
                                props.setChannelId(subscription.channelId)
                                props.setChannelCreatedBy(subscription.channelCreatedBy)
                            }}>
                            <Text style={{
                                color: colorScheme === 'light' ? (
                                    choice === subscription.channelName ? 'white' : '#202025'
                                ) : (
                                    choice === subscription.channelName ? '#202025' : 'white'
                                ),
                                lineHeight: 22,
                                fontFamily: 'overpass',
                                fontSize: 13
                            }}>
                                {subscription.channelName}
                            </Text>
                        </TouchableOpacity>
                    })
                }
            </ScrollView>
            <View style={{ display: 'flex', flexDirection: 'row', height: '60%' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name='book-outline' size={21} color={color} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name='add-circle' size={30} color={color} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={21} color={color} />
                        </Text>
                        {
                            !loggedIn && userLoaded ?
                                <View style={styles.badge} /> : null
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default BottomBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: Platform.OS === "ios" ? '15%' : "15%",
        width: '100%',
        display: 'flex',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 15 : 5
    },
    icons: {
        width: '33.33%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        justifyContent: 'center',
        display: 'flex'
    },
    colorBar: {
        width: '98.5%',
        height: '40%',
        flexDirection: 'row',
        paddingTop: 10
    },
    iconContainer: {
        width: '20%',
        textAlign: 'right',
    },
    badge: {
        position: 'absolute',
        alignSelf: 'center',
        width: 10,
        height: 10,
        marginLeft: 8,
        marginBottom: 10,
        marginTop: -8,
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white',
        color: colorScheme === 'light' ? 'white' : '#202025'
    },
    cusCategory: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#202025' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#202025' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white',
    }
});
