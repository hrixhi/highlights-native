import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, TouchableOpacity } from '../components/Themed';
import Alert from './Alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = useColorScheme();
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(true)
    const [userLoaded, setUserLoaded] = useState(false)
    const iconColor = colorScheme === 'light' ? '#202025' : '#fff'

    const [channelCategories, setChannelCategories] = useState([])
    const [filterChoice] = useState(props.channelFilterChoice)
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())

    useEffect(() => {
        const custom: any = {}
        const cat: any = []
        cues.map((cue) => {
            if (cue.customCategory && cue.customCategory !== '' && !custom[cue.customCategory]) {
                custom[cue.customCategory] = 'category'
            }
        })
        Object.keys(custom).map(key => {
            cat.push(key)
        })
        setChannelCategories(cat)
    }, [cues])

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
            }
            else {
                setLoggedIn(false)
            }
        }
        setUserLoaded(true)
    }, [])

    useEffect(() => {
        (
            async () => await getUser()
        )()
    }, [])

    return (
        <View style={styles.bottombar}>
            <View style={styles.colorBar}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ width: '50%', paddingLeft: 20, flexDirection: 'row', justifyContent: 'center' }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex' }}>
                                <Menu
                                    onSelect={(subscription: any) => {
                                        if (subscription === 'My Cues') {
                                            props.handleFilterChange('All')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            return
                                        }
                                        props.setChannelFilterChoice('All')
                                        props.handleFilterChange(subscription.channelName)
                                        props.setChannelId(subscription.channelId)
                                        props.setChannelCreatedBy(subscription.channelCreatedBy)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 17 }}>
                                            {choice === 'All' ? 'My Cues' : choice}<Ionicons name='caret-down' size={17} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'My Cues'}>
                                            <Text style={{ color: '#202025' }}>
                                                My Cues
                                            </Text>
                                        </MenuOption>
                                        {
                                            props.subscriptions.map((subscription: any) => {
                                                return <MenuOption
                                                    value={subscription}>
                                                    <Text style={{ color: '#202025' }}>
                                                        {subscription.channelName}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 9, color: '#a2a2aa', paddingTop: 7, textAlign: 'center' }}>
                                Channel
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: '50%', paddingRight: 20, flexDirection: 'row', justifyContent: 'center' }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex' }}>
                                <Menu
                                    onSelect={(category: any) => {
                                        props.setChannelFilterChoice(category)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 17, color: '#a2a2aa' }}>
                                            {filterChoice}<Ionicons name='caret-down' size={17} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <Text style={{ color: '#202025' }}>
                                                {PreferredLanguageText('myCues')}
                                            </Text>
                                        </MenuOption>
                                        {
                                            channelCategories.map((category: any) => {
                                                return <MenuOption
                                                    value={category}>
                                                    <Text style={{ color: '#202025' }}>
                                                        {category}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 9, color: '#a2a2aa', paddingTop: 7, textAlign: 'center' }}>
                                Category
                            </Text>
                        </View>
                    </View>
                </View>
                {/* <View style={{ flexDirection: 'row', width: '100%' }}>
                    <ScrollView
                        horizontal={true}
                        contentContainerStyle={{ paddingRight: 15 }}
                        showsHorizontalScrollIndicator={false} style={{ paddingLeft: 15 }}>
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
                                    fontSize: 13
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
                </View>
                <Text style={{ fontSize: 9, color: '#a2a2aa', paddingTop: 7, paddingLeft: 25 }}>
                    My Channels
                </Text> */}
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%', paddingHorizontal: 10, paddingTop: 7 }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name='radio-outline' size={21} color={iconColor} />
                        </Text>
                        <Text style={{ fontSize: 9, color: iconColor, textAlign: 'center' }}>
                            Channels
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCalendar()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name='calendar-outline' size={21} color={iconColor} />
                        </Text>
                        <Text style={{ fontSize: 9, textAlign: 'center', color: iconColor }}>
                            Planner
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 40, marginTop: -3 }}>
                            <Ionicons name='add-circle' size={40} color={iconColor} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={21} color={iconColor} />
                        </Text>
                        <Text style={{ fontSize: 9, color: iconColor, textAlign: 'center' }}>
                            {
                                !loggedIn && userLoaded ?
                                    'Sign Up' : 'Profile'
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name='help-circle-outline' size={21} color={iconColor} />
                        </Text>
                        <Text style={{ fontSize: 9, color: iconColor, textAlign: 'center' }}>
                            Help
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default BottomBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: "20%",
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderColor: colorScheme !== 'light' ? '#333333' : '#eeeeee'
    },
    icons: {
        width: '20%',
        display: 'flex',
        // alignContent: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
        textAlign: 'center', paddingTop: 5
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        // display: 'flex',
        // flexDirection: 'column',
        textAlign: 'center'
    },
    colorBar: {
        width: '98.5%',
        height: '50%',
        // flexDirection: 'row',
        paddingTop: 18
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
