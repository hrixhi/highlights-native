// REACT
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Animated,
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import * as AuthSession from 'expo-auth-session';

// API

import {
    getSubscriptions,
    getSsoLink,
    getOrganisation,
    login,
    getCuesFromCloud,
    findUserById,
    resetPassword,
    signup,
    authWithProvider,
    updateNotificationId,
    loginFromSso,
    getNotificationEvents,
    getStreamChatUserToken,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from '../components/CustomTextInput';
import Alert from '../components/Alert';
import { Text, TouchableOpacity, View } from '../components/Themed';
import Update from '../components/Update';
// import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg';
// import SocialMediaButton from '../components/SocialMediaButton';
import Dashboard from '../components/Dashboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';

// HELPERS
import { validateEmail } from '../helpers/emailCheck';
import { PreferredLanguageText, LanguageSelect } from '../helpers/LanguageContext';
import { defaultCues } from '../helpers/DefaultData';
import { htmlStringParser } from '../helpers/HTMLParser';

import * as ScreenOrientation from 'expo-screen-orientation';
import * as Updates from 'expo-updates';

import { useOrientation } from '../hooks/useOrientation';

import { blueButtonHomeMB, blueButtonMR } from '../helpers/BlueButtonPosition';
import { StreamChat } from 'stream-chat';
import { StreamChatGenerics } from '../components/ChatComponents/types';

import { AppChatContext } from '../ChatContext/AppChatContext';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const STREAM_CHAT_API_KEY = 'fa2jhu3kqpah';

// import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');

    // Open an existing Cue

    const [activeCue, setActiveCue] = useState<any>(undefined);
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [activeChannelColor, setActiveChannelColor] = useState('#000');

    const [modalType, setModalType] = useState('');
    const [channelId, setChannelId] = useState('');
    const [cueId, setCueId] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const [channelCreatedBy, setChannelCreatedBy] = useState('');
    const [showLoginWindow, setShowLoginWindow] = useState(false);
    const [showSignupWindow, setShowSignupWindow] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSignupSubmitDisabled, setIsSignupSubmitDisabled] = useState(true);
    const [signingUp, setSigningUp] = useState(false);
    const [dimensions, setDimensions] = useState({ window, screen });
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState('');
    const [openChannelId, setOpenChannelId] = useState('');
    const [passwordValidError, setPasswordValidError] = useState('');

    const [tab, setTab] = useState('Agenda');
    const [showCreate, setShowCreate] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [emailValidError, setEmailValidError] = useState('');
    const [ssoCode, setSsoCode] = useState('');

    let cancelTokenRef: any = useRef({});

    const enterValidEmailError = PreferredLanguageText('enterValidEmail');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const weHaveEmailedPasswordAlert = PreferredLanguageText('weHaveEmailedPassword');
    const invalidCredentialsAlert = PreferredLanguageText('invalidCredentials');
    const unableToRefreshCuesAlert = PreferredLanguageText('unableToRefreshCues');
    const passwordInvalidError = PreferredLanguageText('atleast8char');
    const [selectedWorkspace, setSelectedWorkspace] = useState<any>('');
    const [isSsoEnabled, setIsSsoEnabled] = useState(false);

    const [showNewDiscussionPost, setShowNewDiscussionPost] = useState(false);
    const [showNewMeeting, setShowNewMeeting] = useState(false);

    const responseListener: any = useRef();

    const [option, setOption] = useState('To Do');
    const [options] = useState(['To Do', 'Classroom', 'Search', 'Inbox', 'Account']);
    const [workspaceOptions] = useState(['Content', 'Discuss', 'Meet', 'Scores', 'Settings']);
    const [createOptions] = useState(['Content', 'Import', 'Quiz', 'Library']);

    const [showHome, setShowHome] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [workspaceActiveTab, setWorkspaceActiveTab] = useState('Content');
    const [createActiveTab, setCreateActiveTab] = useState('Content');
    const [disableCreateNavbar, setDisableCreateNavbar] = useState(false);

    const [showImportCreate, setShowImportCreate] = useState(false);

    const [showWorkspaceFilterModal, setShowWorkspaceFilterModal] = useState(false);
    const [reloadBottomBarKey, setReloadBottomBarKey] = useState(Math.random());

    const [hideNewChatButton, setHideNewChatButton] = useState(false);
    const [hideNavbarDiscussions, setHideNavbarDiscussions] = useState(false);

    const [showNewAssignment, setShowNewAssignment] = useState(false);
    const [hideNavbarGrades, setHideNavbarGrades] = useState(false);

    const [showNewAttendance, setShowNewAttendance] = useState(false);
    const [hideNavbarAttendance, setHideNavbarAttendance] = useState(false);

    const height = Dimensions.get('window').height;
    const width = Dimensions.get('window').width;

    const [streamUserToken, setStreamUserToken] = useState('');
    const [chatClient, setChatClient] = useState<any>(undefined);

    const orientation = useOrientation();

    // IPAD BUG WHILE CHANGING TO LANDSCAPE ORIENTATION
    const onOrientationChange = useCallback(async () => {
        // await Updates.reloadAsync();
        setReloadBottomBarKey(reloadBottomBarKey);
    }, []);

    const server = useApolloClient();
    const {
        userId,
        user,
        org,
        handleSetOrg,
        subscriptions,
        handleSetUser,
        handleSetCues,
        handleSetSubscriptions,
        allCues,
        customCategories,
        handleReadCue,
        loginUser,
        refreshCues,
        refreshSubscriptions,
    } = useAppContext();

    // QUERIES

    const [fetchUser, { loading: loadingUser, error: userError, data: userData }] = useLazyQuery(findUserById, {
        variables: { id: userId },
    });

    const [fetchOrg, { loading: loadingOrg, error: orgError, data: orgData }] = useLazyQuery(getOrganisation, {
        variables: { userId },
    });

    const [fetchCues, { loading: loadingCues, error: cuesError, data: cuesData }] = useLazyQuery(getCuesFromCloud, {
        variables: { userId },
    });

    const [fetchSubs, { loading: loadingSubs, error: subsError, data: subsData }] = useLazyQuery(getSubscriptions, {
        variables: { userId },
    });

    // INIT
    useEffect(() => {
        if (userId) {
            fetchSubs();
            fetchUser();
            fetchOrg();
            fetchCues();
            fetchStreamUserToken(userId);
            setupEventsNotifications(userId);
        }
    }, [userId]);

    useEffect(() => {
        if (userData) {
            handleSetUser(userData.user.findById);
        }
    }, [userData]);

    useEffect(() => {
        if (subsData) {
            handleSetSubscriptions(subsData.subscription.findByUserId);
        }
    }, [subsData]);

    useEffect(() => {
        if (orgData) {
            handleSetOrg(orgData.school.findByUserId);
        }
    }, [orgData]);

    useEffect(() => {
        if (cuesData) {
            handleSetCues(cuesData.cue.getCuesFromCloud);
        }
    }, [cuesData]);

    useEffect(() => {
        (async () => {
            if (Dimensions.get('window').width < 768) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            } else {
                ScreenOrientation.addOrientationChangeListener(onOrientationChange);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (email === '' || !email.includes('@')) {
                setIsSsoEnabled(false);
            } else {
                const split = email.split('@');

                if (split[1] !== '') {
                    if (typeof cancelTokenRef.current != typeof undefined) {
                        cancelTokenRef.current &&
                            cancelTokenRef.current.cancel &&
                            cancelTokenRef.current.cancel('Operation canceled due to new request.');
                    }

                    //Save the cancel token for the current request
                    cancelTokenRef.current = axios.CancelToken.source();

                    try {
                        axios
                            .post(
                                `https://api.learnwithcues.com/checkSSO`,
                                {
                                    ssoDomain: split[1],
                                },
                                { cancelToken: cancelTokenRef.current.token }
                            )
                            .then((res: any) => {
                                if (res.data && res.data.ssoFound) {
                                    setIsSsoEnabled(true);
                                } else {
                                    setIsSsoEnabled(false);
                                }
                            });
                    } catch (e) {
                        console.log(e);
                        setIsSsoEnabled(false);
                    }
                }
            }
        })();
    }, [email]);

    useEffect(() => {
        (async () => {
            if (ssoCode && ssoCode !== '') {
                setIsLoggingIn(true);

                server
                    .query({
                        query: loginFromSso,
                        variables: {
                            code: ssoCode,
                        },
                    })
                    .then(async (r: any) => {
                        if (
                            r.data &&
                            r.data.user.loginFromSso &&
                            r.data.user.loginFromSso.user &&
                            r.data.user.loginFromSso.token &&
                            !r.data.user.loginFromSso.error
                        ) {
                            const u = r.data.user.loginFromSso.user;
                            const token = r.data.user.loginFromSso.token;

                            const userId = u._id;

                            const res = await loginUser(userId, token);

                            console.log('Res', res);

                            if (!res) {
                                Alert('Failed to login user. Try again.');
                            } else {
                                updateExpoNotificationId(u);
                            }

                            setIsLoggingIn(false);
                        } else {
                            const { error } = r.data.user.loginFromSso;
                            Alert(error);
                            setIsLoggingIn(false);
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        setIsLoggingIn(false);
                        Alert('Something went wrong. Try again.');
                    });
            }
        })();
    }, [ssoCode]);

    useEffect(() => {
        if (email && !validateEmail(email.toString().toLowerCase())) {
            setEmailValidError(enterValidEmailError);
            return;
        }

        setEmailValidError('');
    }, [email]);

    // FOR NATIVE AND DESKTOP APPS WE WILL SHOW LOGIN SCREEN
    useEffect(() => {
        if (!userId || userId === '') {
            setShowHome(false);
            setShowLoginWindow(true);
        } else {
            setShowHome(true);
            setShowLoginWindow(false);
        }
    }, [userId]);

    //   Validate Submit on Login state change
    useEffect(() => {
        // Login
        if (!showForgotPassword && email && password && !emailValidError && !isSsoEnabled) {
            setIsSubmitDisabled(false);
            return;
        }

        //
        if (showForgotPassword && email && !emailValidError && !isSsoEnabled) {
            setIsSubmitDisabled(false);
            return;
        }

        if (isSsoEnabled && !emailValidError) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [showForgotPassword, email, password, emailValidError, isSsoEnabled]);

    useEffect(() => {
        if (
            fullName === '' ||
            email === '' ||
            password === '' ||
            confirmPassword === '' ||
            signingUp ||
            passwordValidError
        ) {
            setIsSignupSubmitDisabled(true);
        } else {
            setIsSignupSubmitDisabled(false);
        }
    }, [fullName, email, password, confirmPassword, signingUp]);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        // window.location.reload()
        setDimensions({ window, screen });
    }, []);

    useEffect(() => {
        Dimensions.addEventListener('change', onDimensionsChange);
        return () => {
            Dimensions.removeEventListener('change', onDimensionsChange);
        };
    }, []);

    useEffect(() => {
        if (option === 'Classroom') return;

        setLoadDiscussionForChannelId('');
        setOpenChannelId('');
    }, [option]);

    function alertTimeDisplay(dbDate: string, twentyFourOffset: boolean) {
        let date = moment(dbDate);

        if (!twentyFourOffset) {
            return 'Today at ' + date.format('h:mm a');
        } else {
            return 'Tomorrow at ' + date.format('h:mm a');
        }
    }

    const setupEventsNotifications = useCallback(async (userId: string) => {
        console.log('Setup event notifications');

        await Notifications.cancelAllScheduledNotificationsAsync();

        const settings = await Notifications.getPermissionsAsync();

        if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
            // permission granted
        } else {
            await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowAnnouncements: true,
                },
            });

            const settings = await Notifications.getPermissionsAsync();

            if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
                // permission granted
            } else {
                // leave scheduler
                return;
            }
        }

        // Setting notification handler
        Notifications.setNotificationHandler({
            handleNotification: async (n) => {
                return {
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                };
            },
            handleError: (err) => console.log(err),
            handleSuccess: (res) => {
                // Refresh Data on load
                refreshCues();
                refreshSubscriptions();
            },
        });

        // for when user taps on a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            // Refresh Data on load
            refreshCues();
            refreshSubscriptions();
        });

        server
            .query({
                query: getNotificationEvents,
                variables: {
                    userId,
                },
            })
            .then(async (res) => {
                if (res.data.date && res.data.date.getNotificationEvents) {
                    const scheduleNotifications: any[] = [];

                    res.data.date.getNotificationEvents.map((event: any) => {
                        const start = new Date(event.start);

                        // Submissions
                        if (!event.meeting && event.cueId !== '' && event.dateId === 'channel') {
                            // 24 hours prior, 6 hours prior and 1 hour prior

                            // console.log("Submission type");

                            const { title } = htmlStringParser(event.title);

                            const alertTitle =
                                event.channelName && event.channelName !== ''
                                    ? event.channelName + ' - ' + title
                                    : title;

                            const dayOffset = 24 * 60 * 60 * 1000;
                            var twentyFourOffset = new Date();
                            twentyFourOffset.setTime(twentyFourOffset.getTime() - dayOffset);

                            var trigger1 = new Date(event.start);
                            trigger1.setTime(trigger1.getTime() - dayOffset);
                            var trigger2 = new Date(event.start);
                            trigger2.setTime(trigger2.getTime() - dayOffset / 4);
                            var trigger3 = new Date(event.start);
                            trigger3.setTime(trigger3.getTime() - dayOffset / 24);

                            if (trigger1 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, true),
                                        sound: true,
                                    },
                                    trigger: trigger1,
                                });
                            }

                            if (trigger2 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, false),
                                        sound: true,
                                    },
                                    trigger: trigger2,
                                });
                            }

                            if (trigger3 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, false),
                                        sound: true,
                                    },
                                    trigger: trigger3,
                                });
                            }

                            // Personal events
                        } else if (!event.meeting && event.cueId === '' && event.dateId !== 'channel') {
                            // Same time as the actual start

                            // console.log("Personal event type");

                            const title = event.title;

                            const subtitle = moment(event.start).format('h:mm a');

                            if (start > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title,
                                        subtitle,
                                        sound: true,
                                    },
                                    trigger: start,
                                });
                            }

                            // Meetings / Other event reminders
                        } else {
                            // console.log("Meeting/Channel event type");

                            // 15 minutes prior
                            const fifteenMinOffset = 15 * 60 * 1000;

                            var trigger1 = new Date(event.start);
                            trigger1.setTime(trigger1.getTime() - fifteenMinOffset);

                            const title =
                                event.channelName && event.channelName !== ''
                                    ? event.channelName + ' - ' + event.title
                                    : event.title;

                            const subtitle = alertTimeDisplay(event.start, false);

                            if (trigger1 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title,
                                        subtitle,
                                        sound: true,
                                    },
                                    trigger: trigger1,
                                });
                            }
                        }
                    });

                    // Sort all the scheduleNotifications
                    const sortedNotifications = scheduleNotifications.sort((a: any, b: any) => {
                        return a.trigger > b.trigger ? 1 : -1;
                    });

                    if (sortedNotifications.length === 0) {
                        // no requests to process
                        return;
                    }

                    let lastTriggerDate = new Date();
                    lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 5);
                    const iterateUpTo = scheduleNotifications.length >= 64 ? 63 : scheduleNotifications.length;
                    // iOS has a limit on scheduled notifications - 64 which is why we have to
                    // choose the first 64 notifications
                    // After that make the user revisit the app again
                    for (let i = 0; i < iterateUpTo; i++) {
                        // Schedule notification
                        await Notifications.scheduleNotificationAsync(scheduleNotifications[i]);
                        // The last notification in the scheduling queue has to be the one
                        if (i === iterateUpTo - 1) {
                            lastTriggerDate = new Date(scheduleNotifications[i].trigger);
                            lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 1);
                            const n = await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: 'Continue receiving notifications?',
                                    subtitle: "Open Cues! It's been a while...",
                                    sound: true,
                                },
                                trigger: lastTriggerDate,
                            });
                        }
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                // Alert('Unable to load calendar.', 'Check connection.');
            });
    }, []);

    const updateExpoNotificationId = useCallback(async (user: any) => {
        let existingStatus = await Notifications.getPermissionsAsync();

        if (
            !existingStatus.granted &&
            existingStatus.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
        ) {
            // permission granted

            await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowAnnouncements: true,
                },
            });

            existingStatus = await Notifications.getPermissionsAsync();
        }

        if (existingStatus.granted || existingStatus.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
            let experienceId = undefined;
            if (!Constants.manifest) {
                // Absence of the manifest means we're in bare workflow
                experienceId = user._id + Platform.OS;
            }
            const expoToken = await Notifications.getExpoPushTokenAsync({
                experienceId,
            });

            const notificationId = expoToken.data;

            console.log('Update notification id INIT', notificationId);

            const updatedNotificationId =
                user.notificationId === 'NOT_SET' || user.notificationId === 'undefined'
                    ? notificationId
                    : user.notificationId + '-BREAK-' + notificationId;

            if (!user.notificationId || !user.notificationId.includes(notificationId)) {
                server
                    .mutate({
                        mutation: updateNotificationId,
                        variables: {
                            userId: user._id,
                            notificationId: updatedNotificationId,
                        },
                    })
                    .then((res: any) => {
                        const updateAsyncStorageUser = {
                            ...user,
                            notificationId: updatedNotificationId,
                        };

                        AsyncStorage.setItem('user', JSON.stringify(updateAsyncStorageUser));
                    })
                    .catch((e) => {
                        console.log('error', e);
                    });
            }
        }
    }, []);

    const handleSocialAuth = (user: any) => {
        const profile = user._profile;

        const { name, email, profilePicURL } = profile;

        server
            .mutate({
                mutation: authWithProvider,
                variables: {
                    email: email.toLowerCase(),
                    fullName: name,
                    provider: user._provider,
                    avatar: profilePicURL,
                },
            })
            .then(async (r: any) => {
                if (
                    r.data.user.authWithProvider.user &&
                    r.data.user.authWithProvider.token &&
                    !r.data.user.authWithProvider.error
                ) {
                    const u = r.data.user.authWithProvider.user;
                    const token = r.data.user.authWithProvider.token;
                    if (u.__typename) {
                        delete u.__typename;
                    }

                    const userId = u._id;

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);
                    setShowLoginWindow(false);
                } else {
                    const { error } = r.data.user.authWithProvider;
                    Alert(error);
                }
            })
            .catch((e) => {
                console.log(e);
                Alert('Something went wrong. Try again.');
            });
    };

    const handleSocialAuthFailure = (err: any) => {
        console.error(err);
        Alert('Something went wrong. Try again.');
    };

    useEffect(() => {
        const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (password && !validPasswrdRegex.test(password)) {
            setPasswordValidError(passwordInvalidError);
            return;
        }

        setPasswordValidError('');
    }, [password]);

    const handleSignup = useCallback(() => {
        if (password !== confirmPassword) {
            Alert("Passwords don't match");
            return;
        }

        setSigningUp(true);

        server
            .mutate({
                mutation: signup,
                variables: {
                    email: email.toLowerCase(),
                    fullName,
                    password,
                },
            })
            .then(async (r: any) => {
                if (r.data.user.signup && r.data.user.signup === 'SUCCESS') {
                    Alert('Your account was created successfully. Sign in to begin use.');
                    setFullname('');
                    setEmail('');
                    setPassword('');
                    setShowSignupWindow(false);
                } else {
                    Alert(r.data.user.signup !== '' ? r.data.user.signup : 'Error signing up. Try again.');
                }
                setSigningUp(false);
            })
            .catch((e) => {
                setSigningUp(false);
                console.log(e);
            });
    }, [fullName, email, password, confirmPassword]);

    const handleSsoRedirect = useCallback(() => {
        if (!isSsoEnabled) {
            return;
        }

        let redirect = AuthSession.makeRedirectUri({
            useProxy: true,
        }).toString();

        const split = email.toLowerCase().split('@');

        server
            .query({
                query: getSsoLink,
                variables: {
                    ssoDomain: split[1].trim(),
                    redirectURI: redirect,
                },
            })
            .then(async (r: any) => {
                if (r.data && r.data.user.getSsoLinkNative) {
                    if (r.data.user.getSsoLinkNative !== '') {
                        // window.location.href = r.data.user.getSsoLinkNative;
                        const url = r.data.user.getSsoLinkNative;

                        let result = await AuthSession.startAsync({ authUrl: url });

                        // Alert(`Result ${result.type}`, `${JSON.stringify(result)}`)
                        if (result.type === 'success') {
                            let code = JSON.parse(JSON.stringify(result)).params.code;

                            setSsoCode(code);
                        }
                    }
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }, [email, isSsoEnabled]);

    // Move to profile page
    const handleLogin = useCallback(() => {
        setIsLoggingIn(true);

        server
            .query({
                query: login,
                variables: {
                    email: email.toLowerCase(),
                    password,
                },
            })
            .then(async (r: any) => {
                console.log('LOGIN USER RESPONSE', r.data.user.login);
                if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                    const u = r.data.user.login.user;
                    const token = r.data.user.login.token;
                    const userId = u._id;

                    const res = await loginUser(userId, token);

                    if (!res) {
                        Alert('Failed to login user. Try again.');
                    } else {
                        updateExpoNotificationId(u);
                    }
                } else {
                    const { error } = r.data.user.login;
                    Alert(error);
                }
                setIsLoggingIn(false);
            })
            .catch((e) => {
                console.log(e);
                Alert('Something went wrong. Try again.');
                setIsLoggingIn(false);
            });
    }, [email, password]);

    const fetchStreamUserToken = useCallback(async (userId: string) => {
        server
            .mutate({
                mutation: getStreamChatUserToken,
                variables: {
                    userId,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.streamChat.getUserToken !== '') {
                    setStreamUserToken(res.data.streamChat.getUserToken);
                }
            })
            .catch((e) => {
                setStreamUserToken('');
                console.log('Error', e);
            });
    }, []);

    console.log('Stream chat token', streamUserToken);

    // CHAT
    // INITIALIZE CHAT
    useEffect(() => {
        if (!streamUserToken && chatClient) {
            setChatClient(undefined);
            // Refetch user token
            return;
        }

        if (!streamUserToken || !user) {
            return;
        }

        const initChat = async (userObj: any, userToken: string) => {
            try {
                const client = StreamChat.getInstance<StreamChatGenerics>(STREAM_CHAT_API_KEY);
                // open the WebSocket connection to start receiving events
                // Updates the user in the application (will add/modify existing fields but will not overwrite/delete previously set fields unless the key is used)
                const res = await client.connectUser(
                    {
                        id: userObj._id,
                        name: userObj.fullName,
                        avatar: userObj.avatar,
                    },
                    userToken
                );

                console.log('Res', res);

                setUnreadMessages(res.me.total_unread_count);

                setChatClient(client);
            } catch (error: any) {
                console.log('Error', error);
                console.log('Status code', JSON.parse(error.message).StatusCode);
            }
        };

        if (streamUserToken && !chatClient) {
            initChat(user, streamUserToken);
        }

        return () => {
            if (chatClient) {
                chatClient.disconnectUser();
            }
        };
    }, [streamUserToken, user]);

    const openCue = useCallback(
        (channelId, cueId, createdBy) => {
            const findCue = allCues.find((cue: any) => cue._id === cueId);

            if (!findCue) {
                return;
            }

            if (channelId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channelId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                    setActiveChannelColor(sub.colorCode ? sub.colorCode : '#000');
                }

                const channelCues = allCues.filter((cue: any) => cue.channelId === channelId);

                setChannelCues(channelCues);
            }
            setChannelId(channelId);
            setActiveCue(findCue);
            setCreatedBy(createdBy);
            setCueId(cueId);
            setModalType('Update');
            setShowHome(false);
        },
        [subscriptions, allCues]
    );

    const forgotPassword = useCallback(() => {
        server
            .mutate({
                mutation: resetPassword,
                variables: {
                    email,
                },
            })
            .then((res) => {
                if (res.data && res.data.user.resetPassword) {
                    Alert(weHaveEmailedPasswordAlert);
                    setShowForgotPassword(false);
                } else {
                    Alert(invalidCredentialsAlert);
                }
            });
    }, [email]);

    const closeModal = useCallback(async () => {
        setModalType('');
        setCreateActiveTab('Content');

        // Mark as read
        if (modalType === 'Update') {
            handleReadCue(cueId);
        }

        // If Closing modal after create then need to make it visible since it will be hidden
        if (modalType === 'Create') {
            setDisableCreateNavbar(false);
        }

        setChannelCues([]);
        setActiveCue(undefined);
        setActiveChannelColor('#000');
        setCueId('');
        setCreatedBy('');
        setShowHome(true);
        setChannelId('');
    }, [modalType]);

    /**
     * @description Helpter for icon to use in navbar
     */
    const getNavbarIconName = (op: string) => {
        switch (op) {
            case 'To Do':
                return option === op ? 'calendar' : 'calendar-outline';
            case 'Classroom':
                return option === op ? 'library' : 'library-outline';
            case 'Search':
                return option === op ? 'search' : 'search-outline';
            case 'Inbox':
                return option === op ? 'chatbubble' : 'chatbubble-outline';
            default:
                return option === op ? 'person' : 'person-outline';
        }
    };

    const getWorkspaceNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return workspaceActiveTab === op ? 'library' : 'library-outline';
            case 'Discuss':
                return workspaceActiveTab === op ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Meet':
                return workspaceActiveTab === op ? 'videocam' : 'videocam-outline';
            case 'Scores':
                return workspaceActiveTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return workspaceActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getCreateNavbarIconName = (op: string) => {
        console.log('Create navbar op', op);
        switch (op) {
            case 'Content':
                return createActiveTab === op ? 'create' : 'create-outline';
            case 'Import':
                return createActiveTab === op ? 'share' : 'share-outline';
            case 'Quiz':
                return createActiveTab === op ? 'checkbox' : 'checkbox-outline';
            case 'Library':
                return createActiveTab === op ? 'book' : 'book-outline';
            default:
                return createActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getNavbarIconColor = (op: string) => {
        if (op === option) {
            return '#000';
        }
        return '#797979';
    };

    const getWorkspaceNavbarIconColor = (op: string) => {
        if (op === workspaceActiveTab) {
            return selectedWorkspace.split('-SPLIT-')[3];
        }
        return '#797979';
    };

    const getCreateNavbarIconColor = (op: string) => {
        if (op === createActiveTab) {
            return '#1f1f1f';
        }
        return '#797979';
    };

    const getNavbarText = (op: string) => {
        switch (op) {
            case 'To Do':
                return 'Plan';
            case 'Classroom':
                return 'Workspace';
            case 'Search':
                return 'Search';
            case 'Inbox':
                return 'Inbox';
            default:
                return 'Account';
        }
    };

    const getWorkspaceNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Coursework';
            case 'Discuss':
                return 'Discussion';
            case 'Meet':
                return 'Meetings';
            case 'Scores':
                return 'Scores';
            default:
                return 'Settings';
        }
    };

    const getCreateNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Content';
            case 'Import':
                return 'Import';
            case 'Quiz':
                return 'Quiz';
            case 'Library':
                return 'Books';
            default:
                return 'Settings';
        }
    };

    return (
        <AppChatContext.Provider value={{ chatClient }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', height: '100%', flexDirection: 'row' }}>
                <View
                    style={styles(channelId).container}
                    key={showHome.toString() + option.toString() + tab.toString()}
                >
                    {showLoginWindow && showSignupWindow ? (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                flex: 1,
                                position: 'absolute',
                                zIndex: 50,
                                overflow: 'hidden',
                                backgroundColor: 'rgba(16,16,16, 0.7)',
                            }}
                        >
                            <View
                                style={{
                                    position: 'absolute',
                                    zIndex: 525,
                                    display: 'flex',
                                    alignSelf: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'white',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 0,
                                    marginTop: 0,
                                    paddingHorizontal: 40,
                                }}
                            >
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    horizontal={false}
                                    contentContainerStyle={{
                                        height: '100%',
                                        paddingVertical: 40,
                                        justifyContent: 'center',
                                    }}
                                    nestedScrollEnabled={true}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            display: 'flex',
                                            paddingBottom: 20,
                                        }}
                                    >
                                        <Image
                                            source={{
                                                uri: 'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg',
                                            }}
                                            style={{
                                                width: dimensions.window.height * 0.16 * 0.53456,
                                                height: dimensions.window.height * 0.16 * 0.2,
                                            }}
                                            resizeMode={'contain'}
                                        />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#1F1F1F',
                                            fontFamily: 'overpass',
                                            paddingBottom: 20,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Get started for free.
                                    </Text>

                                    <View
                                        style={{
                                            maxWidth: 400,
                                            width: '100%',
                                            marginTop: 30,
                                            backgroundColor: 'white',
                                            justifyContent: 'center',
                                            alignSelf: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}
                                        >
                                            {PreferredLanguageText('email')}
                                        </Text>
                                        <TextInput
                                            autoCompleteType="email"
                                            textContentType="emailAddress"
                                            value={email}
                                            placeholder={''}
                                            onChangeText={(val: any) => setEmail(val)}
                                            placeholderTextColor={'#1F1F1F'}
                                            required={true}
                                            errorText={emailValidError}
                                        />
                                        <View>
                                            <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                Full Name
                                            </Text>
                                            <TextInput
                                                autoCompleteType="name"
                                                textContentType="name"
                                                value={fullName}
                                                placeholder={''}
                                                onChangeText={(val: any) => setFullname(val)}
                                                required={true}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                {PreferredLanguageText('password')}
                                            </Text>
                                            <TextInput
                                                secureTextEntry={true}
                                                autoCompleteType={'password'}
                                                textContentType="newPassword"
                                                value={password}
                                                placeholder={''}
                                                onChangeText={(val: any) => setPassword(val)}
                                                required={true}
                                                placeholderTextColor={'#1F1F1F'}
                                                errorText={passwordValidError}
                                                footerMessage={PreferredLanguageText('atleast8char')}
                                            />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                Confirm Password
                                            </Text>
                                            <TextInput
                                                secureTextEntry={true}
                                                autoCompleteType={'off'}
                                                value={confirmPassword}
                                                placeholder={''}
                                                onChangeText={(val: any) => setConfirmPassword(val)}
                                                required={true}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleSignup()}
                                            disabled={isSignupSubmitDisabled || signingUp}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 15,
                                                width: '100%',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#000',
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    height: 35,
                                                    // width: 180,
                                                    width: 175,
                                                    borderRadius: 15,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                Sign Up
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setShowSignupWindow(false)}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 15,
                                                marginBottom: 30,
                                                width: '100%',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000',
                                                }}
                                            >
                                                Back to Sign In
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    ) : null}

                    {showLoginWindow && !showSignupWindow ? (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#fff',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                zIndex: 50,
                            }}
                        >
                            <View
                                style={{
                                    zIndex: 525,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    backgroundColor: 'white',
                                    width: '100%',
                                    borderRadius: 0,
                                    marginTop: 0,
                                    paddingHorizontal: 40,
                                }}
                            >
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    horizontal={false}
                                    contentContainerStyle={{
                                        paddingVertical: 40,
                                        justifyContent: 'center',
                                    }}
                                    nestedScrollEnabled={true}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            display: 'flex',
                                            paddingBottom: 30,
                                        }}
                                    >
                                        <Image
                                            source={{
                                                uri: 'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg',
                                            }}
                                            style={{
                                                width: dimensions.window.height * 0.2 * 0.53456,
                                                height: dimensions.window.height * 0.2 * 0.2,
                                            }}
                                            resizeMode={'contain'}
                                        />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#1F1F1F',
                                            fontFamily: 'overpass',
                                            paddingBottom: showForgotPassword ? 20 : 0,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {showForgotPassword ? PreferredLanguageText('temporaryPassword') : ''}
                                        {/* PreferredLanguageText('continueLeftOff')} */}
                                    </Text>

                                    <View
                                        style={{
                                            maxWidth: 400,
                                            width: '100%',
                                            backgroundColor: 'white',
                                            justifyContent: 'center',
                                            alignSelf: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}
                                        >
                                            {PreferredLanguageText('email')}
                                        </Text>
                                        <TextInput
                                            autoCompleteType="email"
                                            textContentType="emailAddress"
                                            value={email}
                                            placeholder={''}
                                            onChangeText={(val: any) => setEmail(val)}
                                            placeholderTextColor={'#1F1F1F'}
                                            errorText={emailValidError}
                                        />
                                        {isSsoEnabled ? (
                                            <View style={{ paddingBottom: 20, marginTop: 10 }}>
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Ionicons name="lock-closed" size={18} color="#000" />
                                                    <Text style={{ paddingLeft: 7, color: '#1f1f1f', paddingTop: 3 }}>
                                                        Single sign-on enabled
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                        {showForgotPassword || isSsoEnabled ? null : (
                                            <View>
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                        {PreferredLanguageText('password')}
                                                    </Text>
                                                    {showForgotPassword ? null : (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setShowForgotPassword(true);
                                                            }}
                                                            style={{
                                                                backgroundColor: 'white',
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 14,
                                                                    color: '#000',
                                                                    fontFamily: 'Inter',
                                                                }}
                                                            >
                                                                Forgot Password?
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                <TextInput
                                                    autoCompleteType="password"
                                                    textContentType="password"
                                                    secureTextEntry={true}
                                                    value={password}
                                                    placeholder={''}
                                                    onChangeText={(val: any) => setPassword(val)}
                                                    placeholderTextColor={'#1F1F1F'}
                                                />
                                            </View>
                                        )}
                                        <View
                                            style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                paddingBottom: 10,
                                            }}
                                        >
                                            <TouchableOpacity
                                                disabled={isSubmitDisabled}
                                                onPress={() => {
                                                    if (showForgotPassword) {
                                                        forgotPassword();
                                                    } else if (isSsoEnabled) {
                                                        handleSsoRedirect();
                                                    } else {
                                                        handleLogin();
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: 'white',
                                                    marginTop: 15,
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        borderColor: '#000',
                                                        borderWidth: 1,
                                                        color: '#fff',
                                                        backgroundColor: '#000',
                                                        fontSize: 11,
                                                        paddingHorizontal:
                                                            Dimensions.get('window').width < 768 ? 15 : 24,
                                                        fontFamily: 'inter',
                                                        overflow: 'hidden',
                                                        paddingVertical: 14,
                                                        textTransform: 'uppercase',
                                                        width: 150,
                                                    }}
                                                >
                                                    {showForgotPassword
                                                        ? PreferredLanguageText('reset')
                                                        : PreferredLanguageText('login')}
                                                </Text>
                                            </TouchableOpacity>
                                            {/* Sign up button */}
                                            {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                width: '100%',
                                                marginTop: 20,
                                                flexDirection: 'row',
                                                justifyContent: 'center'
                                            }}>
                                            <Text>Not a member?</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setShowSignupWindow(true);
                                                }}
                                                style={{ marginLeft: 5 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000'
                                                    }}>
                                                    Sign up now
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )} */}

                                            {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                maxWidth: 400,
                                                width: '100%',
                                                backgroundColor: 'white',
                                                justifyContent: 'space-between',
                                                alignSelf: 'center',
                                                flexDirection: 'row',
                                                marginTop: 20
                                            }}>
                                            <SocialMediaButton
                                                provider="facebook"
                                                appId={env === 'DEV' ? '922882341942535' : '746023139417168'}
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                scope="public_profile,email">
                                                Sign in with Facebook
                                            </SocialMediaButton>

                                            <SocialMediaButton
                                                provider="google"
                                                appId="39948716442-erculsknud84na14b7mbd94f1is97477.apps.googleusercontent.com"
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                key={'google'}
                                                scope={
                                                    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
                                                }>
                                                Sign in with Google
                                            </SocialMediaButton>
                                        </View>
                                    )} */}

                                            {showForgotPassword ? (
                                                <TouchableOpacity
                                                    onPress={() => setShowForgotPassword(false)}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        height: 35,
                                                        marginTop: 15,
                                                        marginBottom: 30,
                                                        width: '100%',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000',
                                                        }}
                                                    >
                                                        Back to Sign In
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            paddingLeft: 5,
                                            paddingBottom: 5,
                                            marginTop: 20,
                                        }}
                                    >
                                        {/* <LanguageSelect /> */}
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    ) : null}
                    {showHome &&
                    !showWorkspaceFilterModal &&
                    !loadingCues &&
                    !loadingUser &&
                    !loadingSubs &&
                    !loadingOrg &&
                    ((option === 'Classroom' &&
                        modalType !== 'Create' &&
                        (workspaceActiveTab === 'Content' ||
                            (workspaceActiveTab === 'Discuss' && !showNewDiscussionPost && !hideNavbarDiscussions) ||
                            (workspaceActiveTab === 'Meet' &&
                                selectedWorkspace.split('-SPLIT-')[2] === userId &&
                                !showNewMeeting &&
                                !showNewAttendance) ||
                            (workspaceActiveTab === 'Scores' &&
                                !showNewAssignment &&
                                selectedWorkspace.split('-SPLIT-')[2] === userId))) ||
                        (option === 'Channels' && !showCreate)) ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (option === 'Classroom') {
                                    if (selectedWorkspace === '' || workspaceActiveTab === 'Content') {
                                        setModalType('Create');
                                    } else if (selectedWorkspace !== '' && workspaceActiveTab === 'Discuss') {
                                        setShowNewDiscussionPost(true);
                                        if (Dimensions.get('window').width < 768) {
                                            setHideNavbarDiscussions(true);
                                        }
                                    } else if (selectedWorkspace !== '' && workspaceActiveTab === 'Meet') {
                                        setShowNewMeeting(true);
                                    } else if (selectedWorkspace !== '' && workspaceActiveTab === 'Scores') {
                                        if (Dimensions.get('window').width < 768) {
                                            setHideNavbarGrades(true);
                                        }
                                        setShowNewAssignment(true);
                                    }
                                } else if (option === 'Channels') {
                                    setShowCreate(true);
                                }
                            }}
                            key={orientation.toString()}
                            style={{
                                position: 'absolute',
                                marginRight: blueButtonMR(Dimensions.get('window').width, orientation, Platform.OS),
                                marginBottom: blueButtonHomeMB(
                                    Dimensions.get('window').width,
                                    orientation,
                                    Platform.OS
                                ),
                                right: 0,
                                justifyContent: 'center',
                                bottom: 0,
                                width: Dimensions.get('window').width > 350 ? 62 : 58,
                                height: Dimensions.get('window').width > 350 ? 62 : 58,
                                borderRadius: Dimensions.get('window').width > 350 ? 32 : 29,
                                backgroundColor:
                                    option === 'Classroom'
                                        ? selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                            ? '#000'
                                            : selectedWorkspace.split('-SPLIT-')[3]
                                        : '#000',
                                borderColor: '#f2f2f2',
                                borderWidth: 0,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 4,
                                    height: 4,
                                },
                                shadowOpacity: 0.12,
                                shadowRadius: 10,
                                zIndex: showLoginWindow ? 40 : 100,
                                opacity: showWorkspaceFilterModal ? 0 : 1,
                            }}
                        >
                            <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                {option === 'Classroom' &&
                                (selectedWorkspace === '' || workspaceActiveTab === 'Content') ? (
                                    <Ionicons
                                        name="create-outline"
                                        size={Dimensions.get('window').width > 350 ? 26 : 25}
                                    />
                                ) : option === 'Channels' ||
                                  (option === 'Classroom' &&
                                      selectedWorkspace !== '' &&
                                      (workspaceActiveTab === 'Discuss' ||
                                          workspaceActiveTab === 'Meet' ||
                                          workspaceActiveTab === 'Scores')) ? (
                                    <Ionicons
                                        name={workspaceActiveTab === 'Meet' ? 'videocam-outline' : 'add-outline'}
                                        size={
                                            workspaceActiveTab === 'Meet'
                                                ? 28
                                                : Dimensions.get('window').width > 350
                                                ? 36
                                                : 35
                                        }
                                    />
                                ) : null}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    {showHome && !showLoginWindow ? (
                        <View
                            style={{
                                width: height > width ? '100%' : width - 0,
                                right: 0,
                                height: '100%',
                                flex: 1,
                                position: 'absolute',
                                // overflow: 'scroll',
                                zIndex: 50,
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                            }}
                        >
                            <View
                                key={option}
                                style={{
                                    position: 'absolute',
                                    zIndex: 525,
                                    display: 'flex',
                                    backgroundColor: 'white',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 0,
                                    marginTop: 0,
                                }}
                            >
                                {!user ||
                                !org ||
                                !allCues ||
                                !subscriptions ||
                                loadingCues ||
                                loadingUser ||
                                loadingSubs ||
                                loadingOrg ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            backgroundColor: 'white',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            flex: 1,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'column',
                                                alignSelf: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    marginTop: 10,
                                                }}
                                            >
                                                <ActivityIndicator size={20} color={'#1F1F1F'} />
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontFamily: 'Inter',
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    Loading...
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <Dashboard
                                        setTab={(val: any) => setTab(val)}
                                        tab={tab}
                                        setShowCreate={(val: any) => setShowCreate(val)}
                                        showCreate={showCreate}
                                        setShowHelp={(val: any) => setShowHelp(val)}
                                        showHelp={showHelp}
                                        selectedWorkspace={selectedWorkspace}
                                        setSelectedWorkspace={(val: any) => setSelectedWorkspace(val)}
                                        setOption={(op: any) => setOption(op)}
                                        option={option}
                                        options={options}
                                        closeModal={closeModal}
                                        openCreate={() => {
                                            setModalType('Create');
                                        }}
                                        openCue={openCue}
                                        key={
                                            option.toString() +
                                            showHome.toString() +
                                            tab.toString() +
                                            showCreate.toString() +
                                            showHelp.toString()
                                        }
                                        openDiscussionFromActivity={(channelId: string) => {
                                            setOption('Classroom');
                                            setLoadDiscussionForChannelId(channelId);
                                            setWorkspaceActiveTab('Discuss');
                                        }}
                                        openChannelFromActivity={(channelId: string) => {
                                            setOption('Classroom');
                                            setOpenChannelId(channelId);
                                        }}
                                        openDiscussionFromSearch={(channelId: any) => {
                                            // Find channel Created By from subscriptions
                                            setOption('Classroom');
                                        }}
                                        loadDiscussionForChannelId={loadDiscussionForChannelId}
                                        setLoadDiscussionForChannelId={setLoadDiscussionForChannelId}
                                        openChannelId={openChannelId}
                                        setOpenChannelId={setOpenChannelId}
                                        modalType={modalType}
                                        customCategories={customCategories}
                                        unreadMessages={unreadMessages}
                                        hideNewChatButton={(hide: boolean) => setHideNewChatButton(hide)}
                                        activeWorkspaceTab={workspaceActiveTab}
                                        setWorkspaceActiveTab={setWorkspaceActiveTab}
                                        hideNavbarDiscussions={hideNavbarDiscussions}
                                        setHideNavbarDiscussions={(hide: boolean) => setHideNavbarDiscussions(hide)}
                                        hideNavbarGrades={hideNavbarGrades}
                                        setHideNavbarGrades={(hide: boolean) => setHideNavbarGrades(hide)}
                                        showNewDiscussionPost={showNewDiscussionPost}
                                        setShowNewDiscussionPost={setShowNewDiscussionPost}
                                        showNewMeeting={showNewMeeting}
                                        setShowNewMeeting={(show: boolean) => setShowNewMeeting(show)}
                                        showNewAssignment={showNewAssignment}
                                        setShowNewAssignment={(show: boolean) => setShowNewAssignment(show)}
                                        setShowImportCreate={(showImport: boolean) => setShowImportCreate(showImport)}
                                        showImportCreate={showImportCreate}
                                        setCreateActiveTab={(tab: any) => setCreateActiveTab(tab)}
                                        createActiveTab={createActiveTab}
                                        setDisableCreateNavbar={(disable: boolean) => setDisableCreateNavbar(disable)}
                                        setShowWorkspaceFilterModal={(show: boolean) =>
                                            setShowWorkspaceFilterModal(show)
                                        }
                                        showNewAttendance={showNewAttendance}
                                        setShowNewAttendance={(show: boolean) => {
                                            setShowNewAttendance(show);
                                            setHideNavbarAttendance(show);
                                        }}
                                        hideNavbarAttendance={hideNavbarAttendance}
                                    />
                                )}
                            </View>
                        </View>
                    ) : null}

                    <View
                        style={{
                            // height: dimensions.window.height,
                            height: '100%',
                            width: height > width ? '100%' : width - 0,
                            marginLeft: height > width ? 0 : 0,
                            backgroundColor: 'white',
                            alignSelf: 'center',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            // maxWidth: dimensions.window.width
                            // overflow: 'hidden'
                        }}
                    >
                        {modalType === 'Update' ? (
                            <Update
                                key={cueId.toString()}
                                customCategories={customCategories}
                                cue={activeCue}
                                activeChannelColor={activeChannelColor}
                                closeModal={() => closeModal()}
                                cueId={cueId}
                                createdBy={createdBy}
                                channelId={channelId}
                                channelCreatedBy={channelCreatedBy}
                                channelCues={channelCues}
                                openCue={(cueId: string) => openCue(channelId, cueId, channelCreatedBy)}
                            />
                        ) : null}
                    </View>

                    {/* Create navbar */}
                    {modalType === 'Create' && !disableCreateNavbar ? (
                        <View
                            style={{
                                position: 'absolute',
                                backgroundColor: '#fff',
                                alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop: Platform.OS === 'ios' ? 12 : 8,
                                paddingBottom:
                                    Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -10,
                                },
                                bottom: 0,
                                right: 0,
                                shadowOpacity: 0.03,
                                shadowRadius: 12,
                                zIndex: showLoginWindow ? 40 : 100,
                                elevation: showLoginWindow ? 40 : 120,
                                borderTopColor: '#e8e8e8',
                                borderTopWidth: 1,
                            }}
                        >
                            {createOptions.map((op: any, ind: number) => {
                                if (user.role !== 'instructor' && op === 'Quiz') {
                                    return null;
                                }

                                if (disableCreateNavbar) {
                                    return null;
                                }

                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: user.role === 'instructor' ? '25%' : '33%',
                                            flexDirection: width < 800 ? 'column' : 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        key={ind.toString()}
                                        onPress={() => {
                                            if (op === 'Import') {
                                                setShowImportCreate(true);
                                            } else {
                                                setCreateActiveTab(op);
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name={getCreateNavbarIconName(op)}
                                            style={{ color: getCreateNavbarIconColor(op), marginBottom: 6 }}
                                            size={23}
                                        />
                                        <Text
                                            style={{
                                                fontSize: width < 800 ? 11 : 16,
                                                lineHeight: width < 800 ? 11 : 23,
                                                color: getCreateNavbarIconColor(op),

                                                fontFamily: 'Inter',
                                                marginBottom: width < 800 ? 0 : 6,
                                                paddingLeft: width < 800 ? 0 : 5,
                                            }}
                                        >
                                            {getCreateNavbarText(op)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null}

                    {modalType !== 'Create' &&
                    option === 'Classroom' &&
                    selectedWorkspace !== '' &&
                    showHome &&
                    selectedWorkspace !== 'My Notes' &&
                    (workspaceActiveTab !== 'Discuss' || !hideNavbarDiscussions) ? (
                        <View
                            style={{
                                position: 'absolute',
                                backgroundColor: '#fff',
                                alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop: Platform.OS === 'ios' ? 12 : 8,
                                paddingBottom:
                                    Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -10,
                                },
                                bottom: 0,
                                right: 0,
                                shadowOpacity: 0.03,
                                shadowRadius: 12,
                                zIndex: showLoginWindow ? 40 : 100,
                                elevation: showLoginWindow ? 40 : 120,
                                borderTopColor: '#e8e8e8',
                                borderTopWidth: 1,
                            }}
                            key={selectedWorkspace + orientation + workspaceActiveTab}
                        >
                            {workspaceOptions.map((op: any, ind: number) => {
                                if (selectedWorkspace.split('-SPLIT-')[2] !== userId && op === 'Settings') {
                                    return;
                                }

                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width:
                                                selectedWorkspace.split('-SPLIT-')[2] === userId ||
                                                selectedWorkspace === 'My Notes'
                                                    ? '20%'
                                                    : '25%',
                                            flexDirection: width < 800 ? 'column' : 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        key={ind}
                                        onPress={() => {
                                            setWorkspaceActiveTab(op);
                                        }}
                                    >
                                        <Ionicons
                                            name={getWorkspaceNavbarIconName(op)}
                                            style={{ color: getWorkspaceNavbarIconColor(op), marginBottom: 6 }}
                                            size={23}
                                        />
                                        <Text
                                            style={{
                                                fontSize: width < 800 ? 11 : 16,
                                                lineHeight: width < 800 ? 11 : 23,
                                                color: getWorkspaceNavbarIconColor(op),

                                                fontFamily: 'Inter',
                                                marginBottom: width < 800 ? 0 : 6,
                                                paddingLeft: width < 800 ? 0 : 5,
                                            }}
                                        >
                                            {getWorkspaceNavbarText(op)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null}

                    {modalType !== 'Create' &&
                    showHome &&
                    !showLoginWindow &&
                    (option !== 'Classroom' || selectedWorkspace === '' || selectedWorkspace === 'My Notes') &&
                    (option !== 'Inbox' || !hideNewChatButton) ? (
                        <View
                            key={orientation + reloadBottomBarKey}
                            style={{
                                position: 'absolute',
                                backgroundColor: '#fff',
                                alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop: Platform.OS === 'ios' ? 12 : 8,
                                paddingBottom:
                                    Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -10,
                                },
                                bottom: 0,
                                right: 0,
                                shadowOpacity: 0.03,
                                shadowRadius: 12,
                                zIndex: showLoginWindow ? 40 : 100,
                                elevation: showLoginWindow ? 40 : 120,
                                borderTopColor: '#e8e8e8',
                                borderTopWidth: 1,
                            }}
                        >
                            {options.map((op: any, ind: number) => {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: '20%',
                                            flexDirection: width < 800 ? 'column' : 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        key={ind}
                                        onPress={() => {
                                            setOption(op);
                                        }}
                                    >
                                        <Ionicons
                                            name={getNavbarIconName(op)}
                                            style={{ color: getNavbarIconColor(op), marginBottom: 5 }}
                                            size={23}
                                        />
                                        <Text
                                            style={{
                                                fontSize: width < 800 ? 11 : 16,
                                                lineHeight: width < 800 ? 11 : 23,
                                                color: getNavbarIconColor(op),

                                                fontFamily: 'Inter',
                                                marginBottom: width < 800 ? 0 : 6,
                                                paddingLeft: width < 800 ? 0 : 5,
                                            }}
                                        >
                                            {getNavbarText(op)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null}
                </View>
            </SafeAreaView>
        </AppChatContext.Provider>
    );
};

export default Home;

const styles = (channelId: string) =>
    StyleSheet.create({
        container: {
            // flex: 1,
            flexDirection: 'row',
            height: '100%',
            width: '100%',
        },
        all: {
            fontSize: 12,
            color: '#fff',

            height: 25,
            paddingHorizontal: 12,
            backgroundColor: '#000000',
            lineHeight: 25,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
        },
        allGrayFill: {
            fontSize: 12,
            color: '#fff',
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#000',
            lineHeight: 25,
            height: 25,
            fontFamily: 'inter',
            textTransform: 'uppercase',
        },
        activityContainer: {
            borderTopWidth: 0,
            borderBottomWidth: 0,
            borderColor: '#eeeeef',
            borderTopRightRadius: 15,
            borderTopLeftRadius: 15,
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
        },
        horizontal: {
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20,
        },
    });
