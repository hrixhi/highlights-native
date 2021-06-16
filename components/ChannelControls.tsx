import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, View, TouchableOpacity } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkChannelStatus, createChannel, createUser, subscribe, updateUser } from '../graphql/QueriesAndMutations';
import Alert from '../components/Alert'
import { uniqueNamesGenerator, colors } from 'unique-names-generator'
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [option, setOption] = useState('Subscribe')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [userFound, setUserFound] = useState(false)

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    // Alert messages
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const changesNotSavedAlert = PreferredLanguageText('changesNotSaved')

    useEffect(() => {
        if (option === "Subscribe") {
            if (!passwordRequired && name) {
                setIsSubmitDisabled(false);
                return;
            } else if (passwordRequired && name && password) {
                setIsSubmitDisabled(false);
                return;
            }

        } else {
            if (name) {
                setIsSubmitDisabled(false)
                return;
            }

        }

        setIsSubmitDisabled(true);

    }, [name, password, passwordRequired, option])

    const handleSubscribe = useCallback(async () => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        const server = fetchAPI('')
        server.mutate({
            mutation: subscribe,
            variables: {
                userId: user._id,
                name,
                password
            }
        })
            .then(res => {
                if (res.data.subscription && res.data.subscription.subscribe) {
                    const subscriptionStatus = res.data.subscription.subscribe
                    switch (subscriptionStatus) {
                        case "subscribed":
                            props.closeModal()
                            break;
                        case "incorrect-password":
                            Alert(incorrectPasswordAlert)
                            break;
                        case "already-subbed":
                            Alert(alreadySubscribedAlert)
                            break;
                        case "error":
                            Alert(somethingWrongAlert, checkConnectionAlert)
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert)
                            break;
                    }
                }
            })
            .catch(err => {
                Alert(somethingWrongAlert, checkConnectionAlert)
            })

    }, [name, password, props.closeModal])

    const handleSubmit = useCallback(async () => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        if (option === 'Subscribe') {

            if (name.toString().trim() === '') {
                return
            }

            if (passwordRequired === true) {
                handleSubscribe()
            } else {
                const server = fetchAPI('')
                server.query({
                    query: checkChannelStatus,
                    variables: {
                        name
                    }
                }).then(res => {
                    if (res.data.channel && res.data.channel.getChannelStatus) {
                        const channelStatus = res.data.channel.getChannelStatus
                        switch (channelStatus) {
                            case "public":
                                handleSubscribe()
                                break;
                            case "private":
                                setPasswordRequired(true)
                                break;
                            case "non-existant":
                                Alert(doesNotExistAlert)
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert)
                                break
                        }
                    }
                }).catch(err => {
                    Alert(somethingWrongAlert, checkConnectionAlert)
                })
            }
        } else if (option === 'Create') {

            if (name.toString().trim() === '') {
                return
            }

            const server = fetchAPI('')
            server.mutate({
                mutation: createChannel,
                variables: {
                    name,
                    password,
                    createdBy: user._id
                }
            })
                .then(res => {
                    if (res.data.channel.create) {
                        const channelCreateStatus = res.data.channel.create
                        switch (channelCreateStatus) {
                            case "created":
                                props.closeModal()
                                break;
                            case "invalid-name":
                                Alert(invalidChannelNameAlert)
                                break;
                            case "exists":
                                Alert(nameAlreadyInUseAlert)
                                break;
                            case "error":
                                Alert(somethingWrongAlert, checkConnectionAlert)
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert)
                                break;
                        }
                    }
                })
                .catch(err => {
                    Alert(somethingWrongAlert, checkConnectionAlert)
                })
        } else if (option === 'Profile') {
            if (displayName.toString().trim() === '' || fullName.toString().trim() === '') {
                return;
            }
            const u = await AsyncStorage.getItem('user')
            if (u) {
                const parsedUser = JSON.parse(u)
                parsedUser["displayName"] = displayName.toString().trim()
                parsedUser["fullName"] = fullName.toString().trim()
                const server = fetchAPI('')
                server.mutate({
                    mutation: updateUser,
                    variables: {
                        userId: parsedUser._id,
                        displayName,
                        fullName
                    }
                }).then(async (res) => {
                    if (res.data.user && res.data.user.update) {
                        const updatedValue = JSON.stringify(parsedUser)
                        await AsyncStorage.setItem('user', updatedValue)
                        props.closeModal()
                    }
                }).catch(err => {
                    Alert(changesNotSavedAlert, checkConnectionAlert)
                })
            }
        }

    }, [option, name, password, props.closeModal, passwordRequired, displayName, fullName])

    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        const server = fetchAPI('')
        if (u) {
            const parsedUser = JSON.parse(u)
            setDisplayName(parsedUser.displayName)
            setFullName(parsedUser.fullName)
            setUserFound(true)
        } else {
            const fullName = uniqueNamesGenerator({
                dictionaries: [colors]
            }) + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();
            const displayName = fullName
            let experienceId = undefined;
            if (!Constants.manifest) {
                // Absence of the manifest means we're in bare workflow
                experienceId = '@username/example';
            }
            const expoToken = await Notifications.getExpoPushTokenAsync({
                experienceId,
            });
            const notificationId = expoToken.data
            server.mutate({
                mutation: createUser,
                variables: {
                    fullName,
                    displayName,
                    notificationId
                }
            })
                .then(async res => {
                    const u = res.data.user.create
                    if (u.__typename) {
                        delete u.__typename
                    }
                    const sU = JSON.stringify(u)
                    await AsyncStorage.setItem('user', sU)
                    setDisplayName(u.displayName)
                    setFullName(u.fullName)
                    setUserFound(true)
                })
                .catch(err => {
                    Alert("Unable to register user.", "Check connection.")
                })
        }
    }, [])

    useEffect(() => {
        loadUser()
    }, [])

    if (!userFound) {
        return <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <Text style={{
                        fontSize: 25, color: '#a2a2aa'
                    }}>
                        {PreferredLanguageText('internetRequired')}
                    </Text>
                </View>
            </View>
        </View>
    }

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <Text
                    style={{
                        fontSize: 30,
                        color: "#202025",
                        fontFamily: "inter",
                        paddingBottom: 15,
                        textAlign: "center",
                        paddingTop: 30
                    }}
                >
                    {PreferredLanguageText('channels')}
                </Text>
                <View style={styles.colorBar}>
                    <TouchableOpacity
                        style={option === 'Subscribe' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Subscribe')
                        }}>
                        <Text style={{ color: '#a2a2aa', lineHeight: 20 }}>
                            {PreferredLanguageText('subscribe')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={option === 'Create' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Create')
                        }}>
                        <Text style={{ color: '#a2a2aa', lineHeight: 20 }}>
                            {PreferredLanguageText('create')}
                        </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        style={option === 'Profile' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Profile')
                        }}>
                        <Text style={{ color: '#a2a2aa', lineHeight: 20 }}>
                            Profile
                        </Text>
                    </TouchableOpacity> */}
                </View>
                {
                    option === 'Profile' ?
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Display Name
                            </Text>
                            <TextInput
                                value={displayName}
                                placeholder={''}
                                onChangeText={val => setDisplayName(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Full Name
                            </Text>
                            <TextInput
                                value={fullName}
                                placeholder={''}
                                onChangeText={val => setFullName(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                        </View>
                        :
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                {PreferredLanguageText('channel')}
                            </Text>
                            <TextInput
                                value={name}
                                placeholder={''}
                                onChangeText={val => {
                                    setName(val)
                                    setPasswordRequired(false)
                                }}
                                placeholderTextColor={'#a2a2aa'}
                                required={true}
                                footerMessage={'case sensitive'}
                            />
                        </View>
                }
                {
                    (option === 'Subscribe' && passwordRequired) || option === 'Create' ?
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                style={styles.input}
                                placeholder={option === 'Subscribe' ? '' : `(${PreferredLanguageText('optional')})`}
                                onChangeText={val => setPassword(val)}
                                placeholderTextColor={'#a2a2aa'}
                                secureTextEntry={true}
                                required={option === "Subscribe" ? true : false}
                            />
                        </View>
                        : (
                            option === 'Subscribe' && !passwordRequired ?
                                <View
                                    style={{ height: 115, width: '100%', backgroundColor: 'white' }}
                                /> : null
                        )
                }
                <View
                    style={{
                        // flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        // display: 'flex',
                        flexDirection: 'row',
                        // height: 50,
                        marginTop: 75
                    }}>
                    {
                        option === 'About' ? null :
                            <TouchableOpacity
                                onPress={() => handleSubmit()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 15
                                }}
                                disabled={isSubmitDisabled}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 35,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#3B64F8',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                    {option === 'Subscribe' ? PreferredLanguageText('subscribe') : PreferredLanguageText('create')}
                                </Text>
                            </TouchableOpacity>
                    }
                </View>
            </View>
        </View>
    );
}

export default ChannelControls;

const styles = StyleSheet.create({
    screen: {
        padding: 15,
        paddingHorizontal: 30,
        width: '100%',
        height: Dimensions.get('window').height - 85,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    },
    all: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 15
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});
