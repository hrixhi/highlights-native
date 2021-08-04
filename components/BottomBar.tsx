import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
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
import DateTimePicker from '@react-native-community/datetimepicker';


const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = 'dark';
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(true)
    const [userLoaded, setUserLoaded] = useState(false)
    const iconColor = '#fff'

    const [channelCategories, setChannelCategories] = useState([])
    const [filterChoice, setChannelFilterChoice] = useState(props.channelFilterChoice)
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

    useEffect(() => {
        setChannelFilterChoice(props.channelFilterChoice)
    }, [props.channelFilterChoice])

    const getUser = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            console.log('parsedUser', parsedUser)
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
    }, [props])

    return (
        <View style={styles.bottombar}>
            <View style={styles.colorBar}>
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#2f2f3c' }}>
                    <View style={{ paddingLeft: 20, flexDirection: 'row', backgroundColor: '#2f2f3c' }}>
                        <View style={{ backgroundColor: '#2f2f3c' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', display: 'flex', backgroundColor: '#2f2f3c', paddingLeft: 5 }}>
                                <Menu
                                    onSelect={(subscription: any) => {
                                        if (subscription === 'All') {
                                            props.handleFilterChange('All')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            props.closeModal()
                                            return
                                        }
                                        if (subscription === 'My Cues') {
                                            props.handleFilterChange('MyCues')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            props.closeModal()
                                            return
                                        }
                                        props.setChannelFilterChoice('All')
                                        props.handleFilterChange(subscription.channelName)
                                        props.setChannelId(subscription.channelId)
                                        props.setChannelCreatedBy(subscription.channelCreatedBy)
                                        props.closeModal()
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#fff' }}>
                                            {choice === 'MyCues' ? 'My Cues' : choice}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6',
                                            // height: '100%',
                                            maxHeight: Dimensions.get('window').height - 150,
                                        }
                                    }}>
                                        <View style={{ backgroundColor: '#fff', maxHeight: Dimensions.get('window').height - 150, }}>
                                            <ScrollView contentContainerStyle={{ backgroundColor: '#fff' }}>
                                                <MenuOption
                                                    value={'All'}>
                                                    <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff' }}>
                                                        <View style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 10,
                                                            marginTop: 1,
                                                            backgroundColor: "#fff"
                                                        }} />
                                                        <Text style={{ marginLeft: 5, color: '#2f2f3c' }}>
                                                            All
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                                <MenuOption
                                                    value={'My Cues'}>
                                                    <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff' }}>
                                                        <View style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 10,
                                                            marginTop: 1,
                                                            backgroundColor: "#000"
                                                        }} />
                                                        <Text style={{ marginLeft: 5, color: '#2f2f3c' }}>
                                                            My Cues
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                                {
                                                    props.subscriptions.map((subscription: any) => {
                                                        return <MenuOption
                                                            value={subscription}>
                                                            <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff' }}>
                                                                <View style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: 10,
                                                                    marginTop: 1,
                                                                    backgroundColor: subscription.colorCode,
                                                                }} />
                                                                <Text style={{ marginLeft: 5, color: '#2f2f3c' }}>
                                                                    {subscription.channelName}
                                                                </Text>
                                                            </View>
                                                        </MenuOption>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#fff', paddingTop: 7, textAlign: 'center', paddingLeft: 0 }}>
                                Channel
                            </Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', backgroundColor: '#2f2f3c', paddingLeft: 20 }}>
                        <View style={{ backgroundColor: '#2f2f3c' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#2f2f3c' }}>
                                <Menu
                                    onSelect={(category: any) => {
                                        props.setChannelFilterChoice(category)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#a2a2ac' }}>
                                            {filterChoice}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6',
                                            // height: '100%',
                                            maxHeight: Dimensions.get('window').height - 150,
                                        }
                                    }}>
                                        <View style={{ backgroundColor: '#fff', maxHeight: Dimensions.get('window').height - 150, }}>
                                            <ScrollView contentContainerStyle={{ backgroundColor: '#fff' }}>
                                                <MenuOption
                                                    value={'All'}>
                                                    <Text style={{ color: '#2f2f3c' }}>
                                                        All
                                                    </Text>
                                                </MenuOption>
                                                {
                                                    channelCategories.map((category: any) => {
                                                        return <MenuOption
                                                            value={category}>
                                                            <Text style={{ color: '#2f2f3c' }}>
                                                                {category}
                                                            </Text>
                                                        </MenuOption>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#a2a2ac', paddingTop: 7, textAlign: 'center' }}>
                                Category
                            </Text>
                        </View>
                    </View>
                    {
                        props.filterStart && props.filterEnd ?
                            <View style={{
                                // borderWidth: 1,
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                backgroundColor: '#2f2f3c',
                                paddingRight: 5
                            }}>
                                <View style={{ backgroundColor: '#2f2f3c' }}>
                                    <DateTimePicker
                                        value={props.filterStart}
                                        mode={'date'}
                                        style={{ width: 75 }}
                                        textColor={'#fff'}
                                        onChange={(event: any, selectedDate: any) => {
                                            const currentDate: any = selectedDate;
                                            props.setFilterStart(currentDate)
                                            if (currentDate > props.filterEnd) {
                                                props.setFilterEnd(currentDate)
                                            }
                                        }}
                                    />
                                </View>
                                <View style={{ backgroundColor: '#2f2f3c' }}>
                                    <DateTimePicker
                                        style={{ width: 75 }}
                                        value={props.filterEnd}
                                        mode={'date'}
                                        textColor={'#fff'}
                                        onChange={(event: any, selectedDate: any) => {
                                            const currentDate: any = selectedDate;
                                            props.setFilterStart(currentDate)
                                            if (currentDate < props.filterStart) {
                                                props.setFilterStart(currentDate)
                                            }
                                        }}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#2f2f3c' }}
                                    onPress={() => {
                                        props.setFilterStart(null)
                                        props.setFilterEnd(null)
                                    }}
                                >
                                    <Text style={{ color: '#fff', lineHeight: 35 }}>
                                        <Ionicons name='close-outline' size={20} color={'#fff'} />
                                    </Text>
                                </TouchableOpacity>
                            </View> :
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: '#2f2f3c', paddingRight: 20 }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#2f2f3c' }}
                                    onPress={() => {
                                        const prev = new Date()
                                        prev.setDate(prev.getDate() - 7)
                                        props.setFilterStart(prev)
                                        props.setFilterEnd(new Date())
                                    }}
                                >
                                    <Text style={{ color: '#fff', lineHeight: 30 }}>
                                        Select Dates
                                    </Text>
                                </TouchableOpacity>
                            </View>
                    }
                </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%', paddingHorizontal: 10, paddingTop: 7, backgroundColor: '#2f2f3c' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 24 }}>
                            <Ionicons name='school-outline' size={24} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                            Channels
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCalendar()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 24 }}>
                            <Ionicons name='calendar-outline' size={24} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                            Planner
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 50, marginTop: -5 }}>
                            <Ionicons name='add-circle' size={50} color={'#fff'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 26 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={26} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                            {!loggedIn && userLoaded ? 'Sign Up' : 'Profile'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 26 }}>
                            <Ionicons name='help-circle-outline' size={26} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
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
        height: "21%",
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderColor: '#a2a2ac',
        backgroundColor: '#2f2f3c'
    },
    icons: {
        width: '20%',
        display: 'flex',
        // alignContent: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
        textAlign: 'center', paddingTop: 5,
        backgroundColor: '#2f2f3c'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        // display: 'flex',
        // flexDirection: 'column',
        textAlign: 'center',
        backgroundColor: '#2f2f3c'
    },
    colorBar: {
        width: '98.5%',
        height: '50%',
        // flexDirection: 'row',
        paddingTop: 18,
        backgroundColor: '#2f2f3c'
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
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white',
        color: colorScheme === 'light' ? 'white' : '#2f2f3c'
    },
    cusCategory: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2f2f3c' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2f2f3c' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white',
    }
});
