// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { Image, Linking, Platform, StyleSheet, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    updatePassword,
    updateUser,
    removeZoom,
    findUserById,
    updateNotificationId
} from '../graphql/QueriesAndMutations';
import * as Updates from 'expo-updates';

// COMPONENTS
import { Text, View, TouchableOpacity } from './Themed';
// import { ScrollView } from "react-native-gesture-handler";
import Alert from '../components/Alert';
import { TextInput } from './CustomTextInput';
import FileUpload from './UploadFiles';
import BottomSheet from './BottomSheet';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
// import { LanguageSelect } from '../helpers/LanguageContext';
import { zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { handleImageUpload } from '../helpers/ImageUpload'
import Reanimated from 'react-native-reanimated';

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [avatar, setAvatar] = useState<any>(undefined);
    const [zoomInfo, setZoomInfo] = useState<any>(undefined);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [fullName, setFullName] = useState('');
    const [userFound, setUserFound] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [passwordValidError, setPasswordValidError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [newPasswordValidError, setNewPasswordValidError] = useState('');
    const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
    const [currentFullName, setCurrentFullName] = useState('');
    const [currentDisplayName, setCurrentDisplayName] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState<any>(undefined);
    const [showSavePassword, setShowSavePassword] = useState(false);
    const [reloadFormKey, setReloadFormKey] = useState(Math.random());
    const [meetingProvider, setMeetingProvider] = useState('');
    const [uploadProfilePicVisible, setUploadProfilePicVisible] = useState(false);
    const [appVersion, setAppVersion] = useState('');

    // Alerts
    const passwordUpdatedAlert = PreferredLanguageText('passwordUpdated');
    const incorrectCurrentPasswordAlert = PreferredLanguageText('incorrectCurrentPassword');
    const passwordDoesNotMatchAlert = PreferredLanguageText('passwordDoesNotMatch');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const profileUpdatedAlert = PreferredLanguageText('profileUpdated');
    const passwordInvalidError = PreferredLanguageText('atleast8char');

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0]
    });

    // HOOKS

    useEffect(() => {
        if (Constants.manifest && Constants.manifest.version) {
            setAppVersion(Constants.manifest.version)
        }
    }, [Constants, Constants.manifest])

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {
            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '');
            }
        })();
    }, []);

    /**
     * @description Fetch user on Init
     */
    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        setReloadFormKey(Math.random());
    }, [showSavePassword]);

    /**
     * @description Validate if submit is enabled after every state change
     */
    useEffect(() => {
        // Reset Password state
        if (
            showSavePassword &&
            currentPassword &&
            newPassword &&
            confirmNewPassword &&
            !newPasswordValidError &&
            !confirmNewPasswordError
        ) {
            setIsSubmitDisabled(false);
            return;
        }

        // Logged in
        if (
            !showSavePassword &&
            fullName &&
            displayName &&
            (fullName !== currentFullName || displayName !== currentDisplayName || avatar !== currentAvatar)
        ) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [
        email,
        fullName,
        displayName,
        avatar,
        currentAvatar,
        confirmPassword,
        passwordValidError,
        confirmPasswordError,
        showSavePassword,
        currentPassword,
        newPassword,
        confirmNewPassword,
        newPasswordValidError,
        confirmNewPasswordError,
        currentDisplayName,
        currentFullName
    ]);

    /**
     * @description Validates new password
     */
    useEffect(() => {
        const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (newPassword && !validPasswrdRegex.test(newPassword)) {
            setNewPasswordValidError(passwordInvalidError);
            return;
        }

        setNewPasswordValidError('');
    }, [newPassword]);

    /**
     * @description Verifies if confirm new password matches new password
     */
    useEffect(() => {
        if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
            setConfirmNewPasswordError(passwordDoesNotMatchAlert);
            return;
        }

        setConfirmNewPasswordError('');
    }, [newPassword, confirmNewPassword]);

    /**
     * 
     */
    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, userId);

            if (url && url !== '') {
                setAvatar(url)
            }

            setUploadProfilePicVisible(false);
        },
        [userId]
    );

    /**
     * @description Handles submit new password or Update user profile
     */
    const handleSubmit = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (!u) {
            return;
        }
        const user = JSON.parse(u);
        const server = fetchAPI('');

        if (showSavePassword) {
            // reset password
            server
                .mutate({
                    mutation: updatePassword,
                    variables: {
                        userId: user._id,
                        currentPassword,
                        newPassword
                    }
                })
                .then(res => {
                    if (res.data && res.data.user.updatePassword) {
                        Alert(passwordUpdatedAlert);
                        setShowSavePassword(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmNewPassword('')
                        // props.reOpenProfile();
                    } else {
                        Alert(incorrectCurrentPasswordAlert);
                    }
                })
                .catch(err => {
                    Alert(somethingWentWrongAlert);
                });
            return;
        }

        server
            .mutate({
                mutation: updateUser,
                variables: {
                    displayName,
                    fullName,
                    userId: user._id,
                    avatar
                }
            })
            .then(async res => {
                if (res.data && res.data.user.update) {
                    user.fullName = fullName;
                    user.displayName = displayName;
                    user.avatar = avatar;
                    const updatedUser = JSON.stringify(user);
                    await AsyncStorage.setItem('user', updatedUser);
                    Alert('Profile updated!');
                    props.reOpenProfile();
                } else {
                    Alert(somethingWentWrongAlert);
                }
            })
            .catch(e => Alert(somethingWentWrongAlert));
        //}
    }, [email, avatar, displayName, fullName, confirmPassword, showSavePassword, newPassword, currentPassword]);

    /**
     * @description Loads User profile
     */
    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            if (parsedUser.email) {
                setEmail(parsedUser.email);
                setDisplayName(parsedUser.displayName);
                setFullName(parsedUser.fullName);
                setAvatar(parsedUser.avatar ? parsedUser.avatar : undefined);
                setCurrentAvatar(parsedUser.avatar ? parsedUser.avatar : undefined);
                setUserId(parsedUser._id);
                setZoomInfo(parsedUser.zoomInfo ? parsedUser.zoomInfo : undefined);
                setCurrentDisplayName(parsedUser.displayName);
                setCurrentFullName(parsedUser.fullName);
            }
            setUserFound(true);
        }
    }, []);

    const logout = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            const server = fetchAPI('');
            server
                .query({
                    query: findUserById,
                    variables: {
                        id: parsedUser._id
                    }
                })
                .then(async r => {
                    if (r.data && r.data.user.findById) {
                        const user = r.data.user.findById;
                        const LoadedNotificationId = user.notificationId;
                        let experienceId = undefined;
                        if (!Constants.manifest) {
                            // Absence of the manifest means we're in bare workflow
                            experienceId = parsedUser._id + Platform.OS;
                        }
                        const expoToken = await Notifications.getExpoPushTokenAsync({
                            experienceId
                        });
                        const notificationId = expoToken.data;
                        if (LoadedNotificationId && LoadedNotificationId.includes(notificationId)) {
                            const notificationIds = LoadedNotificationId.split('-BREAK-');
                            const newNotifIds: any[] = [];
                            notificationIds.map((notif: any) => {
                                if (notif !== notificationId) {
                                    newNotifIds.push(notif);
                                }
                            });
                            server
                                .mutate({
                                    mutation: updateNotificationId,
                                    variables: {
                                        userId: parsedUser._id,
                                        notificationId:
                                            newNotifIds.join('-BREAK-') === '' ? 'NOT_SET' : newNotifIds.join('-BREAK-')
                                    }
                                })
                                .then(async res => {
                                    handleClean();
                                })
                                .catch(err => {
                                    console.log(err);
                                    handleClean();
                                });
                        } else {
                            handleClean();
                        }
                    } else {
                        handleClean();
                    }
                })
                .catch(err => {
                    handleClean();
                });
        } else {
            handleClean();
        }
    }, []);

    const handleClean = useCallback(async () => {
        await AsyncStorage.clear();
        await Updates.reloadAsync();
        await Notifications.cancelAllScheduledNotificationsAsync();
    }, []);
    /**
     * @description Handles Zoom Auth => Connect user's zoom profile to Cues
     */
    const handleZoomAuth = useCallback(async () => {
        let url = '';

        if (zoomInfo) {
            // de-auth
            // TBD
            url = '';
        } else {
            // auth
            url = 'https://app.learnwithcues.com/zoom_auth';
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Linking.openURL(url);
        } else {
            window.open(url, '_blank');
        }
    }, [zoomInfo, userId]);

    const handleZoomRemove = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (!u) {
            return;
        }
        const user = JSON.parse(u);
        const server = fetchAPI('');

        if (zoomInfo) {
            // reset password
            server
                .mutate({
                    mutation: removeZoom,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data && res.data.user.removeZoom) {
                        const user = JSON.parse(u);
                        user.zoomInfo = undefined;
                        const updatedUser = JSON.stringify(user);
                        await AsyncStorage.setItem('user', updatedUser);
                        Alert('Zoom account disconnected!');
                        setZoomInfo(null);
                    } else {
                        Alert('Failed to disconnect Zoom. Try again.');
                    }
                })
                .catch(err => {
                    Alert(somethingWentWrongAlert);
                });
            return;
        }
    }, [zoomInfo, userId]);

    // MAIN RETURN

    return (
        <View style={styles.screen} key={reloadFormKey.toString()}>
            <ScrollView
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    alignSelf: 'center',
                    flexDirection: 'row'
                    // paddingHorizontal: 20
                }}
                contentContainerStyle={{
                    // height: '100%',
                    paddingHorizontal: 20,
                    flex: 1,
                    flexDirection: 'column',
                    paddingBottom: 50
                    // maxHeight:
                    //     Dimensions.get('window').width < 1024
                    //         ? Dimensions.get('window').height - 104
                    //         : Dimensions.get('window').height - 52
                }}
                showsVerticalScrollIndicator={true}
                key={reloadFormKey.toString()}
            >
                {showSavePassword ? <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                        alignSelf: 'center',
                        maxWidth: 400,
                        height: 50,
                        marginTop: 20,
                        // paddingHorizontal: 10
                    }}>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowSavePassword(false);
                            }}
                            style={{
                                paddingRight: 20,
                                paddingTop: 5,
                                alignSelf: 'flex-start'
                            }}>
                            <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                <Ionicons name="arrow-back-outline" size={35} color={'#1F1F1F'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View> : null}
                {showSavePassword ? (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            paddingTop: Dimensions.get('window').width < 768 ? 25 : 50,
                            paddingBottom: 20,
                            // flex: 1,
                            maxWidth: 400,
                            alignSelf: 'center'
                        }}
                        key={reloadFormKey.toString()}
                    >
                        {/* <Text
                            style={{
                                fontSize: 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                                alignSelf: 'center',
                                paddingBottom: 50
                            }}
                        >
                            Change Password
                        </Text> */}
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('currentPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="password"
                            textContentType="password"
                            value={currentPassword}
                            placeholder={''}
                            onChangeText={val => setCurrentPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            {PreferredLanguageText('newPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="off"
                            textContentType="newPassword"
                            value={newPassword}
                            placeholder={''}
                            onChangeText={val => setNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={newPasswordValidError}
                            footerMessage={PreferredLanguageText('atleast8char')}
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            {PreferredLanguageText('confirmNewPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="off"
                            value={confirmNewPassword}
                            placeholder={''}
                            onChangeText={val => setConfirmNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={confirmNewPasswordError}
                        />
                    </View>
                ) : (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            // paddingTop: Dimensions.get('window').width < 768 ? 25 : 50,
                            paddingBottom: 20,
                            maxWidth: 400,
                            alignSelf: 'center',
                            flexDirection: 'column'
                        }}
                        key={reloadFormKey.toString()}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 0 }}>
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    // marginTop: 20,
                                    alignSelf: 'center'
                                }}
                                source={{ uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                            />
                            {avatar && avatar !== '' ? (
                                <TouchableOpacity
                                    onPress={() => setAvatar(undefined)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        marginLeft: 10
                                    }}
                                >
                                    <Text>
                                        <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setUploadProfilePicVisible(true)}
                                    style={{
                                        position: 'absolute',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#006AFF',
                                            lineHeight: 35,
                                            textAlign: 'right',
                                            fontSize: 12,
                                            fontFamily: 'overpass',
                                            textTransform: 'uppercase',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        <Ionicons name={"attach-outline"} size={30} color={'white'} />
                                        {/* {PreferredLanguageText('import')} */}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* {
                            !props.showSavePassword ? 
                                <TouchableOpacity
                                    onPress={() => handleSubmit()}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row'
                                    }}
                                    disabled={isSubmitDisabled}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: '#006AFF',
                                            fontSize: 12,
                                            fontFamily: 'inter',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Save 
                                    </Text>
                                </TouchableOpacity> : null
                        } */}

                        <Text
                            style={{
                                marginTop: 20,
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            {PreferredLanguageText('email')}
                        </Text>
                        <TextInput
                            editable={false}
                            value={email}
                            autoCompleteType="off"
                            placeholder={''}
                            onChangeText={val => setEmail(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                            style={{
                                paddingLeft: 5,
                                borderBottomWidth: 0,
                                paddingVertical: 10
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            {PreferredLanguageText('fullName')}
                        </Text>
                        <TextInput
                            // editable={false}
                            textContentType="name"
                            autoCompleteType="off"
                            value={fullName}
                            placeholder={''}
                            onChangeText={val => setFullName(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                            style={{
                                paddingLeft: 5,
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2'
                            }}
                        />
                    </View>
                )}
                <View
                    style={{
                        // flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        maxWidth: 400,
                        alignSelf: 'center'
                    }}
                >
                    <TouchableOpacity
                        onPress={() => handleSubmit()}
                        style={{
                            backgroundColor: '#006AFF',
                            width: 175,
                            borderRadius: 15,
                            overflow: 'hidden',
                            height: 35,
                            // marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignSelf: 'center'
                        }}
                        disabled={isSubmitDisabled}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#006AFF',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                borderRadius: 15,
                                width: 175,
                                textTransform: 'uppercase'
                            }}
                        >
                            {props.showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save')}
                        </Text>
                    </TouchableOpacity>

                    {!showSavePassword ? <TouchableOpacity
                        onPress={() => setShowSavePassword(!showSavePassword)}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 20,
                            // width: "100%",
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                color: '#006AFF',
                                borderWidth: 1,
                                borderRadius: 15,
                                borderColor: '#006AFF',
                                backgroundColor: '#fff',
                                fontSize: 12,
                                width: 175,
                                textTransform: 'uppercase'
                            }}
                        >
                            Reset password
                        </Text>
                    </TouchableOpacity> : null}

                    {showSavePassword || meetingProvider !== '' ? null : !zoomInfo ? (
                        <TouchableOpacity
                            onPress={() => handleZoomAuth()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#006AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 12,
                                    width: 175,
                                    textTransform: 'uppercase'
                                }}
                            >
                                Connect Zoom
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                Alert('Disconnect your Zoom account from Cues?', '', [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                        onPress: () => {
                                            return;
                                        }
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: () => handleZoomRemove()
                                    }
                                ]);
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#006AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 12,
                                    width: 175,
                                    textTransform: 'uppercase'
                                }}
                            >
                                Disconnect Zoom
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* {
                        !showSavePassword ? <TouchableOpacity
                            onPress={() => {
                               logout()
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 20,
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#006AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 12,
                                    width: 175,
                                    textTransform: 'uppercase'
                                }}
                            >
                                Sign out
                            </Text> 
                        </TouchableOpacity> : null
                    } */}

                    {showSavePassword ? null : (
                        <TouchableOpacity
                            onPress={() => logout()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 20,
                                marginBottom: 10,
                                // width: '100%',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'center',
                            }}
                        >
                            {/* <Ionicons name="log-out-outline" color="#006AFF" style={{ marginRight: 10 }} size={18} /> */}
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#006AFF',
                                    textAlign: 'center'
                                }}
                            >
                                Sign Out
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* {props.showHelp || props.showSaveCue ? null : (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                paddingBottom: 20,
                                width: '100%',
                                marginTop: 30,
                                marginBottom: 100
                            }}>
                            <LanguageSelect />
                        </View>
                    )} */}
                </View>
                <View style={{ display: 'flex', alignItems: 'center', marginTop: 35, justifyContent: 'center' }}>
                    {
                        !showSavePassword ? <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 10, color: '#797979' }}>
                            Version {appVersion}
                        </Text> : null
                    }
                    {
                        !showSavePassword ? <TouchableOpacity style={{}} onPress={() => Linking.openURL('https://www.learnwithcues.com/privacypolicy.pdf')}>
                            <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 10, color: '#797979' }}>
                                Privacy Policy
                            </Text></TouchableOpacity> : null
                    }
                    {
                        !showSavePassword ? <TouchableOpacity style={{}} onPress={() => Linking.openURL('https://www.learnwithcues.com/eula.pdf')}>
                            <Text style={{ fontSize: 12, textAlign: 'center', color: '#797979' }}>
                                Terms of Use
                            </Text></TouchableOpacity> : null
                    }
                </View>
                {/* </View> */}
                {/* </View> */}
            </ScrollView>
            {uploadProfilePicVisible && (
                <BottomSheet
                    snapPoints={[0, 250]}
                    close={() => {
                        setUploadProfilePicVisible(false);
                    }}
                    isOpen={uploadProfilePicVisible}
                    title={'Insert image'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10 }}>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#006AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center'
                                }}
                                onPress={() => {
                                    uploadImageHandler(true);
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#fff'
                                    }}
                                >
                                    {' '}
                                    Camera{' '}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#006AFF',
                                    borderRadius: 19,
                                    width: 150,
                                    alignSelf: 'center'
                                }}
                                onPress={() => {
                                    uploadImageHandler(false);
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        lineHeight: 34,
                                        color: '#fff'
                                    }}
                                >
                                    {' '}
                                    Gallery{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    header={false}
                />
            )}
            {uploadProfilePicVisible ? (
                <Reanimated.View
                    style={{
                        alignItems: 'center',
                        backgroundColor: 'black',
                        opacity: 0.3,
                        height: '100%',
                        top: 0,
                        left: 0,
                        width: '100%',
                        position: 'absolute'
                    }}
                >
                    <TouchableOpacity style={{
                        backgroundColor: 'transparent',
                        width: '100%',
                        height: '100%',
                    }}
                        onPress={() => setUploadProfilePicVisible(false)}
                    >
                    </TouchableOpacity>
                </Reanimated.View>
            ) : null}
        </View>
    );
};

export default ProfileControls;

const styles = StyleSheet.create({
    screen: {
        width: '100%',
        backgroundColor: 'white',
        justifyContent: 'center',
        flexDirection: 'row'
        // flex: 1
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    all: {
        fontSize: 14,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 14,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 15
    }
});
