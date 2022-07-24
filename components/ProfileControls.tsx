// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { Image, Linking, Platform, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// API
import { updatePassword, updateUser, removeZoom, updateNotificationId } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, View, TouchableOpacity } from './Themed';
import Alert from '../components/Alert';
import { TextInput } from './CustomTextInput';
import BottomSheet from './BottomSheet';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { disableEmailId } from '../constants/zoomCredentials';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { handleImageUpload } from '../helpers/ImageUpload';
import Reanimated from 'react-native-reanimated';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user, userId, org, handleSetUser, logoutUser } = useAppContext();

    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<any>(undefined);
    const [zoomInfo, setZoomInfo] = useState<any>(undefined);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [fullName, setFullName] = useState('');
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
    const [uploadProfilePicVisible, setUploadProfilePicVisible] = useState(false);
    const [appVersion, setAppVersion] = useState('');

    // Alerts
    const passwordUpdatedAlert = PreferredLanguageText('passwordUpdated');
    const incorrectCurrentPasswordAlert = PreferredLanguageText('incorrectCurrentPassword');
    const passwordDoesNotMatchAlert = PreferredLanguageText('passwordDoesNotMatch');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const passwordInvalidError = PreferredLanguageText('atleast8char');

    const server = useApolloClient();

    // HOOKS

    useEffect(() => {
        if (Constants.manifest && Constants.manifest.version) {
            setAppVersion(Constants.manifest.version);
        }
    }, [Constants, Constants.manifest]);

    /**
     * @description Fetch user on Init
     */
    useEffect(() => {
        setEmail(user.email);
        setDisplayName(user.displayName);
        setFullName(user.fullName);
        setAvatar(user.avatar ? user.avatar : undefined);
        setCurrentAvatar(user.avatar ? user.avatar : undefined);
        setZoomInfo(user.zoomInfo ? user.zoomInfo : undefined);
        setCurrentDisplayName(user.displayName);
        setCurrentFullName(user.fullName);
    }, [user]);

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
        currentFullName,
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
                setAvatar(url);
            }

            setUploadProfilePicVisible(false);
        },
        [userId]
    );

    /**
     * @description Handles submit new password or Update user profile
     */
    const handleSubmit = useCallback(async () => {
        if (showSavePassword) {
            // reset password
            server
                .mutate({
                    mutation: updatePassword,
                    variables: {
                        userId,
                        currentPassword,
                        newPassword,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.user.updatePassword) {
                        Alert(passwordUpdatedAlert);
                        setShowSavePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                    } else {
                        Alert(incorrectCurrentPasswordAlert);
                    }
                })
                .catch((err) => {
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
                    userId,
                    avatar,
                },
            })
            .then(async (res) => {
                if (res.data && res.data.user.update) {
                    user.fullName = fullName;
                    user.displayName = displayName;
                    user.avatar = avatar;
                    handleSetUser({
                        ...user,
                        fullName,
                        displayName,
                        avatar,
                    });
                    Alert('Profile updated!');
                } else {
                    Alert(somethingWentWrongAlert);
                }
            })
            .catch((e) => Alert(somethingWentWrongAlert));
        //}
    }, [email, avatar, displayName, fullName, confirmPassword, showSavePassword, newPassword, currentPassword]);

    const logout = async () => {
        const LoadedNotificationId = user.notificationId;
        let experienceId = undefined;
        if (!Constants.manifest) {
            // Absence of the manifest means we're in bare workflow
            experienceId = userId + Platform.OS;
        }
        const expoToken = await Notifications.getExpoPushTokenAsync({
            experienceId,
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
                        userId,
                        notificationId: newNotifIds.join('-BREAK-') === '' ? 'NOT_SET' : newNotifIds.join('-BREAK-'),
                    },
                })
                .then(async (res: any) => {
                    logoutUser();
                })
                .catch((err: any) => {
                    console.log(err);
                    logoutUser();
                });
        } else {
            logoutUser();
        }
    };

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

        Alert(
            'You will be redirected to a web browser to Connect with Zoom.',
            'After connecting you must restart this app to begin using Zoom within Cues.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Okay',
                    onPress: () => {
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            Linking.openURL(url);
                        } else {
                            window.open(url, '_blank');
                        }
                    },
                },
            ]
        );
    }, [zoomInfo, userId]);

    const handleZoomRemove = useCallback(async () => {
        if (zoomInfo) {
            // reset password
            server
                .mutate({
                    mutation: removeZoom,
                    variables: {
                        userId,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.user.removeZoom) {
                        handleSetUser({
                            ...user,
                            zoomInfo: undefined,
                        });
                        Alert('Zoom account disconnected!');
                        setZoomInfo(null);
                    } else {
                        Alert('Failed to disconnect Zoom. Try again.');
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert);
                });
            return;
        }
    }, [zoomInfo, userId]);

    // MAIN RETURN

    return (
        <View style={styles.screen}>
            <ScrollView
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    alignSelf: 'center',
                    flexDirection: 'row',
                    // paddingHorizontal: 20
                }}
                contentContainerStyle={{
                    // height: '100%',
                    paddingHorizontal: 20,
                    flex: 1,
                    flexDirection: 'column',
                    paddingBottom: 50,
                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 50,
                    // maxHeight:
                    //     Dimensions.get('window').width < 1024
                    //         ? Dimensions.get('window').height - 104
                    //         : Dimensions.get('window').height - 52
                }}
                showsVerticalScrollIndicator={true}
            >
                {showSavePassword ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignSelf: 'center',
                            maxWidth: 400,
                            height: 50,
                            marginTop: 20,
                            // paddingHorizontal: 10
                        }}
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSavePassword(false);
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 5,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name="arrow-back-outline" size={35} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
                {showSavePassword ? (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            paddingTop: Dimensions.get('window').width < 768 ? 25 : 50,
                            paddingBottom: 20,
                            maxWidth: 400,
                            alignSelf: 'center',
                        }}
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
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
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
                            onChangeText={(val) => setCurrentPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                        />
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
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
                            onChangeText={(val) => setNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={newPasswordValidError}
                            footerMessage={PreferredLanguageText('atleast8char')}
                        />
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('confirmNewPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="off"
                            value={confirmNewPassword}
                            placeholder={''}
                            onChangeText={(val) => setConfirmNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={confirmNewPasswordError}
                        />
                    </View>
                ) : (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            paddingBottom: 20,
                            maxWidth: 400,
                            alignSelf: 'center',
                            flexDirection: 'column',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingTop: 0,
                            }}
                        >
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    // marginTop: 20,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
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
                                        marginLeft: 10,
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
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#007AFF',
                                            lineHeight: 35,
                                            textAlign: 'right',
                                            fontSize: 12,
                                            fontFamily: 'overpass',
                                            textTransform: 'uppercase',
                                            backgroundColor: 'transparent',
                                        }}
                                    >
                                        <Ionicons name={'attach-outline'} size={30} color={'white'} />
                                        {/* {PreferredLanguageText('import')} */}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text
                            style={{
                                marginTop: 20,
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('email')}
                        </Text>
                        <TextInput
                            editable={false}
                            value={email}
                            autoCompleteType="off"
                            placeholder={''}
                            onChangeText={(val) => setEmail(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                            style={{
                                paddingLeft: 5,
                                borderBottomWidth: 0,
                                paddingVertical: 10,
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
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
                            onChangeText={(val) => setFullName(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                        />
                    </View>
                )}
                <View
                    style={{
                        // flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        maxWidth: 400,
                        alignSelf: 'center',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => handleSubmit()}
                        style={{
                            // marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignSelf: 'center',
                        }}
                        disabled={isSubmitDisabled || user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            {props.showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save')}
                        </Text>
                    </TouchableOpacity>

                    {!showSavePassword ? (
                        <TouchableOpacity
                            onPress={() => setShowSavePassword(!showSavePassword)}
                            style={{
                                backgroundColor: 'white',
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                Reset password
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    {showSavePassword || (org.meetingProvider && org.meetingProvider !== '') ? null : !zoomInfo ? (
                        <TouchableOpacity
                            onPress={() => handleZoomAuth()}
                            style={{
                                backgroundColor: 'white',
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
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
                                        },
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: () => handleZoomRemove(),
                                    },
                                ]);
                            }}
                            style={{
                                backgroundColor: 'white',
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                Disconnect Zoom
                            </Text>
                        </TouchableOpacity>
                    )}

                    {showSavePassword ? null : (
                        <TouchableOpacity
                            onPress={() => logout()}
                            style={{
                                backgroundColor: 'white',
                                marginTop: 30,
                                marginBottom: 10,
                                // width: '100%',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'center',
                            }}
                        >
                            {/* <Ionicons name="log-out-outline" color="#007AFF" style={{ marginRight: 10 }} size={18} /> */}
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#000',
                                    textAlign: 'center',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Sign Out
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{ display: 'flex', alignItems: 'center', marginTop: 35, justifyContent: 'center' }}>
                    {!showSavePassword ? (
                        <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 10, color: '#797979' }}>
                            Version {appVersion}
                        </Text>
                    ) : null}
                    {!showSavePassword ? (
                        <TouchableOpacity
                            style={{}}
                            onPress={() => Linking.openURL('https://www.learnwithcues.com/privacypolicy.pdf')}
                        >
                            <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 10, color: '#797979' }}>
                                Privacy Policy
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    {!showSavePassword ? (
                        <TouchableOpacity
                            style={{}}
                            onPress={() => Linking.openURL('https://www.learnwithcues.com/eula.pdf')}
                        >
                            <Text style={{ fontSize: 12, textAlign: 'center', color: '#797979' }}>Terms of Use</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                {/* </View> */}
                {/* </View> */}
            </ScrollView>
            {uploadProfilePicVisible && (
                <BottomSheet
                    snapPoints={[0, 280]}
                    close={() => {
                        setUploadProfilePicVisible(false);
                    }}
                    isOpen={uploadProfilePicVisible}
                    title={'Import profile picture'}
                    renderContent={() => (
                        <View style={{ paddingHorizontal: 10 }}>
                            <TouchableOpacity
                                style={{
                                    marginTop: Dimensions.get('window').width < 768 ? 10 : 20,
                                    alignSelf: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#000',
                                    paddingHorizontal: 24,
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    width: 150,
                                }}
                                onPress={() => {
                                    uploadImageHandler(true);
                                }}
                            >
                                <Ionicons name="camera-outline" size={16} color={'#fff'} />
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        color: '#fff',
                                        fontSize: 11,
                                        fontFamily: 'inter',
                                        textTransform: 'uppercase',
                                        paddingLeft: 4,
                                    }}
                                >
                                    {' '}
                                    Camera{' '}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    marginTop: 15,
                                    alignSelf: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#000',
                                    paddingHorizontal: 24,
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    width: 150,
                                }}
                                onPress={() => {
                                    uploadImageHandler(false);
                                }}
                            >
                                <Ionicons name="image-outline" size={16} color={'#fff'} />
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        color: '#fff',
                                        fontSize: 11,
                                        fontFamily: 'inter',
                                        textTransform: 'uppercase',
                                        paddingLeft: 4,
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
                        position: 'absolute',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => setUploadProfilePicVisible(false)}
                    ></TouchableOpacity>
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
        paddingTop: 20,
        height: Dimensions.get('window').height - 60 - 60,
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 15,
    },
});
