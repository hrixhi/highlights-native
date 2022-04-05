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
    KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import * as AuthSession from 'expo-auth-session';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getSubscriptions,
    getSsoLink,
    getCues,
    getOrganisation,
    saveCuesToCloud,
    login,
    getCuesFromCloud,
    findUserById,
    resetPassword,
    totalInboxUnread,
    signup,
    authWithProvider,
    updateNotificationId,
    loginFromSso,
    getNotificationEvents
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

// import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // read/learn
    const version = 'learn';

    // Dev/Prod
    const env = 'DEV';

    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');

    // Categories for Home
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    // All channels
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    // All cues
    const [cues, setCues] = useState<any>({});
    const [fadeAnimation] = useState(new Animated.Value(0));

    // Open an existing Cue
    const [updateModalIndex, setUpdateModalIndex] = useState(0);
    const [updateModalKey, setUpdateModalKey] = useState('local');

    const [modalType, setModalType] = useState('');
    // const [pageNumber, setPageNumber] = useState(0);
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
    const [saveDataInProgress, setSaveDataInProgress] = useState(false);
    const [dimensions, setDimensions] = useState({ window, screen });
    const [target, setTarget] = useState('');
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState('');
    const [openChannelId, setOpenChannelId] = useState('');
    const [passwordValidError, setPasswordValidError] = useState('');

    const [tab, setTab] = useState('Agenda');
    const [showDirectory, setShowDirectory] = useState<any>(false);
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
    const [filterStart, setFilterStart] = useState<any>(new Date());
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [showAddEvent, setShowAddEvent] = useState<any>(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState<any>('');
    const [isSsoEnabled, setIsSsoEnabled] = useState(false);

    const [showNewPost, setShowNewPost] = useState(false);
    const [showNewMeeting, setShowNewMeeting] = useState(false);

    const responseListener: any = useRef();

    const [option, setOption] = useState('To Do');
    const [options] = useState(['To Do', 'Classroom', 'Search', 'Inbox', 'Account']);
    const [workspaceOptions] = useState(['Content', 'Discuss', 'Meet', 'Scores', 'Settings']);
    const [createOptions] = useState(['Content', 'Import', 'Quiz', 'Library'])

    const [createOption, setCreateOption] = useState('');
    const [userId, setUserId] = useState('');
    const [role, setRole] = useState('');

    // const [showSettings, setShowSettings] = useState(false);

    const [showHome, setShowHome] = useState(true);
    const [hideNewChatButton, setHideNewChatButton] = useState(false);
    const [hideNavbarDiscussions, setHideNavbarDiscussions] = useState(false);
    const [loadingCues, setLoadingCues] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingOrg, setLoadingOrg] = useState(true);

    const [syncingCues, setSyncingCues] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [workspaceActiveTab, setWorkspaceActiveTab] = useState('Content');
    const [createActiveTab, setCreateActiveTab] = useState('Content')
    const [disableCreateNavbar, setDisableCreateNavbar] = useState(false)

    const [closingModal, setClosingModal] = useState(false);
    const [refreshingWorkspace, setRefreshingWorkspace] = useState(false)
    const [showImportCreate, setShowImportCreate] = useState(false)

    const [showWorkspaceFilterModal, setShowWorkspaceFilterModal] = useState(false);

    const height = Dimensions.get('window').height
    const width = Dimensions.get('window').width

    const orientation = useOrientation()

    const onOrientationChange = useCallback(async () => {
        await Updates.reloadAsync();
    }, []);

    // useEffect(() => {
    //     if (selectedWorkspace && !loadDiscussionForChannelId) {
    //         setWorkspaceActiveTab('Content')
    //     } else if (selectedWorkspace && loadDiscussionForChannelId) {
    //         setWorkspaceActiveTab('Discuss')
    //     }
    // }, [selectedWorkspace, loadDiscussionForChannelId])

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
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);

                console.log("User id ", user._id);

                if (user && user._id && user._id !== '') {
                    setUserId(user._id);
                    setRole(user.role);
                    await loadDataFromCloud();
                    setupEventsNotifications(user._id)
                } else {
                    setShowLoginWindow(true)
                }
            } else {
                setShowLoginWindow(true)
            }
        })();

    }, [])

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
                                    ssoDomain: split[1]
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

                const server = fetchAPI('');
                server
                    .query({
                        query: loginFromSso,
                        variables: {
                            code: ssoCode
                        }
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
                            if (u.__typename) {
                                delete u.__typename;
                            }

                            if (u._id) {
                                setUserId(u._id)
                                setRole(u.role)
                            }

                            const sU = JSON.stringify(u);
                            await AsyncStorage.setItem('jwt_token', token);
                            await AsyncStorage.setItem('user', sU);

                            updateExpoNotificationId(u)

                            setShowLoginWindow(false);
                            loadDataFromCloud();
                            setIsLoggingIn(false);
                        } else {
                            const { error } = r.data.user.loginFromSso;
                            Alert(error);
                            setIsLoggingIn(false);
                        }
                    })
                    .catch(e => {
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

    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser: any = JSON.parse(u);
                if (parsedUser.email && parsedUser.email !== '') {
                    // do nothing
                } else {
                    setShowLoginWindow(true);
                }
            } else {
                setShowLoginWindow(true);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const user = JSON.parse(u);

                const server = fetchAPI('');

                server
                    .query({
                        query: totalInboxUnread,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data.messageStatus.totalInboxUnread) {
                            setUnreadMessages(res.data.messageStatus.totalInboxUnread);
                        }
                    });
            }
        })();
    }, []);

    const setupEventsNotifications = useCallback(async (userId: string) => {
        console.log("Setup event notifications")

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
                    allowAnnouncements: true
                }
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
            handleNotification: async n => {
                return {
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true
                };
            },
            handleError: err => console.log(err),
            handleSuccess: res => {
                // loadData()
            }
        });

        // for when user taps on a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            loadData();
        });

        const server = fetchAPI('');
        server
            .query({
                query: getNotificationEvents,
                variables: {
                    userId
                }
            })
            .then(async res => {
                if (res.data.date && res.data.date.getNotificationEvents) {

                    const scheduleNotifications: any[] = [];
                    
                    res.data.date.getNotificationEvents.map((event: any) => {

                        const start = new Date(event.start);

                        // Submissions 
                        if (!event.meeting && event.cueId !== '' && event.dateId === 'channel') {
                            // 24 hours prior, 6 hours prior and 1 hour prior

                            // console.log("Submission type");

                            const { title } = htmlStringParser(event.title);

                            const alertTitle = event.channelName && event.channelName !== '' ? event.channelName + ' - ' + title : title


                            const dayOffset = 24 * 60 * 60 * 1000; 
                            var twentyFourOffset = new Date();
                            twentyFourOffset.setTime(twentyFourOffset.getTime() - dayOffset);
                            
                            var trigger1 = new Date(event.start);
                            trigger1.setTime(trigger1.getTime() - dayOffset)
                            var trigger2 = new Date(event.start);
                            trigger2.setTime(trigger2.getTime() - (dayOffset / 4))
                            var trigger3 = new Date(event.start);
                            trigger3.setTime(trigger3.getTime() - (dayOffset / 24))

                           
                            if (trigger1 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, true),
                                        sound: true
                                    },
                                    trigger: trigger1
                                });
                            }

                            if (trigger2 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, false),
                                        sound: true
                                    },
                                    trigger: trigger2
                                });
                            }

                            if (trigger3 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title: alertTitle,
                                        subtitle: alertTimeDisplay(event.start, false),
                                        sound: true
                                    },
                                    trigger: trigger3
                                });
                            }

                        // Personal events 
                        } else if (!event.meeting && event.cueId === '' && event.dateId !== 'channel') {
                            // Same time as the actual start

                            // console.log("Personal event type");

                            const title = event.title

                            const subtitle = moment(event.start).format('h:mm a')

                            if (start > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title,
                                        subtitle,
                                        sound: true
                                    },
                                    trigger: start
                                });
                            }

                        // Meetings / Other event reminders
                        } else {

                            // console.log("Meeting/Channel event type");

                            // 15 minutes prior
                            const fifteenMinOffset =  15 * 60 * 1000; 

                            var trigger1 = new Date(event.start);
                            trigger1.setTime(trigger1.getTime() - fifteenMinOffset)

                    
                            const title = event.channelName && event.channelName !== '' ? event.channelName + ' - ' + event.title : event.title
                            
                            const subtitle = alertTimeDisplay(event.start, false)

                            if (trigger1 > new Date()) {
                                scheduleNotifications.push({
                                    content: {
                                        title,
                                        subtitle,
                                        sound: true
                                    },
                                    trigger: trigger1
                                });
                            }                       

                        }

                    })

                    // Sort all the scheduleNotifications
                    const sortedNotifications = scheduleNotifications.sort((a: any, b: any) => {
                        return a.trigger > b.trigger ? 1 : -1
                    })

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
                                    sound: true
                                },
                                trigger: lastTriggerDate
                            });
                        }
                    }



                }

            })
            .catch(err => {
                console.log(err);
                // Alert('Unable to load calendar.', 'Check connection.');

            });

    }, [])

    // const notificationScheduler = useCallback(
    //     async c => {
    //         try {
    //             if (c === undefined || c === null) {
    //                 return;
    //             }

    //             // Clean out all already scheduled notifications
    //             await Notifications.cancelAllScheduledNotificationsAsync();

    //             // This is the object where we are going to collect all notifications that can be scheduled
    //             // between two time points A and B
    //             const notificationRequests: any[] = [];

    //             // Get notification permission
    //             const settings = await Notifications.getPermissionsAsync();
    //             if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    //                 // permission granted
    //             } else {
    //                 await Notifications.requestPermissionsAsync({
    //                     ios: {
    //                         allowAlert: true,
    //                         allowBadge: true,
    //                         allowSound: true,
    //                         allowAnnouncements: true
    //                     }
    //                 });
    //                 const settings = await Notifications.getPermissionsAsync();
    //                 if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    //                     // permission granted
    //                 } else {
    //                     // leave scheduler
    //                     return;
    //                 }
    //             }

    //             // Setting notification handler
    //             Notifications.setNotificationHandler({
    //                 handleNotification: async n => {
    //                     return {
    //                         shouldShowAlert: true,
    //                         shouldPlaySound: true,
    //                         shouldSetBadge: true
    //                     };
    //                 },
    //                 handleError: err => console.log(err),
    //                 handleSuccess: res => {
    //                     // loadData()
    //                 }
    //             });

    //             // for when user taps on a notification
    //             responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    //                 loadData();
    //             });

    //             // for the ones that are on shuffle
    //             // const shuffledCues: any[] = []
    //             // const unShuffledCues: any[] = []

    //             // choose two dates - now (A) & now + 1 month (B) for timed cues
    //             const A = new Date();
    //             const B = new Date();
    //             B.setMonth(B.getMonth() + 1);

    //             // For sleep calculations
    //             // let from = new Date(sleepFrom)
    //             // let to = new Date(sleepTo)
    //             // let a = from.getHours()
    //             // let b = to.getHours()
    //             // a += (from.getMinutes() / 60)
    //             // b += (to.getMinutes() / 60)

    //             const cuesArray: any[] = [];
    //             if (c !== {}) {
    //                 Object.keys(c).map(key => {
    //                     c[key].map((cue: any, index: number) => {
    //                         cuesArray.push({
    //                             ...cue,
    //                             key,
    //                             index
    //                         });
    //                     });
    //                 });
    //             }

    //             // First filter shuffled and unshuffled cues
    //             cuesArray.map((item: any) => {
    //                 if (item.shuffle) {
    //                     if (item.frequency === '0' || !item.endPlayAt || item.endPlayAt === '') {
    //                         return;
    //                     }
    //                     // One time reminder
    //                     // must have endplayat stored
    //                     let trigger = new Date(item.endPlayAt);
    //                     if (trigger > A && trigger < B) {
    //                         // if trigger is in the next 30 days
    //                         const { title, subtitle } = htmlStringParser(item.cue);
    //                         notificationRequests.push({
    //                             content: {
    //                                 title,
    //                                 subtitle,
    //                                 sound: true
    //                             },
    //                             trigger
    //                         });
    //                     }
    //                     // shuffledCues.push(item)
    //                 } else {
    //                     if (item.frequency !== '0') {
    //                         let trigger = new Date(item.date);
    //                         let loopCheck = 0;
    //                         let end = B;
    //                         if (item.endPlayAt && item.endPlayAt !== '') {
    //                             const playLimit = new Date(item.endPlayAt);
    //                             if (playLimit < B) {
    //                                 end = playLimit;
    //                             }
    //                         }
    //                         while (trigger < end) {
    //                             if (trigger < A) {
    //                                 trigger = getNextDate(item.frequency, trigger);
    //                                 continue;
    //                             }
    //                             loopCheck++;
    //                             if (loopCheck > 64) {
    //                                 // upto 50 valid notifications can be considered
    //                                 break;
    //                             }
    //                             const { title, subtitle } = htmlStringParser(
    //                                 item.channelId && item.channelId !== '' ? item.original : item.cue
    //                             );
    //                             notificationRequests.push({
    //                                 content: {
    //                                     title,
    //                                     subtitle,
    //                                     sound: true
    //                                 },
    //                                 trigger
    //                             });
    //                             trigger = getNextDate(item.frequency, trigger);
    //                         }
    //                     } else {
    //                         // if frequency === 0
    //                         // no reminder set - do nothing
    //                     }
    //                 }
    //             });

    //             const sortedRequests: any[] = notificationRequests.sort((a: any, b: any) => {
    //                 return a.trigger - b.trigger;
    //             });
    //             if (sortedRequests.length === 0) {
    //                 // no requests to process
    //                 return;
    //             }

    //             let lastTriggerDate = new Date();
    //             lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 5);
    //             const iterateUpTo = sortedRequests.length >= 64 ? 63 : sortedRequests.length;
    //             // iOS has a limit on scheduled notifications - 64 which is why we have to
    //             // choose the first 64 notifications
    //             // After that make the user revisit the app again
    //             for (let i = 0; i < iterateUpTo; i++) {
    //                 // Schedule notification
    //                 await Notifications.scheduleNotificationAsync(sortedRequests[i]);
    //                 // The last notification in the scheduling queue has to be the one
    //                 if (i === iterateUpTo - 1) {
    //                     lastTriggerDate = new Date(sortedRequests[i].trigger);
    //                     lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 1);
    //                     const n = await Notifications.scheduleNotificationAsync({
    //                         content: {
    //                             title: 'Continue receiving notifications?',
    //                             subtitle: "Open Cues! It's been a while...",
    //                             sound: true
    //                         },
    //                         trigger: lastTriggerDate
    //                     });
    //                 }
    //             }
    //         } catch (e) {
    //             console.log(e);
    //         }
    //     },
    //     [cues, responseListener]
    // );

    console.log("Workspace active tab", workspaceActiveTab)

    const refreshUnreadInbox = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            updateInboxCount(user._id);
        }
    }, []);

    const updateInboxCount = useCallback(userId => {
        const server = fetchAPI('');
        server
            .query({
                query: totalInboxUnread,
                variables: {
                    userId,
                    channelId
                }
            })
            .then(res => {
                if (
                    res.data.messageStatus.totalInboxUnread !== undefined &&
                    res.data.messageStatus.totalInboxUnread !== null
                ) {
                    setUnreadMessages(res.data.messageStatus.totalInboxUnread);
                }
            })
            .catch(err => console.log(err));
    }, []);

    const handleRefreshWorkspace = useCallback(async (subscriptions: boolean) => {

        let user = await AsyncStorage.getItem('user');
        const unparsedCues = await AsyncStorage.getItem('cues');

        if (user && unparsedCues) {
            setRefreshingWorkspace(true)

            if (subscriptions) {
                await refreshSubscriptions()
            }

            const parsedUser = JSON.parse(user);
            const server = fetchAPI(parsedUser._id);


            const allCues: any = JSON.parse(unparsedCues)

            server
                .query({
                    query: getCuesFromCloud,
                    variables: {
                        userId: parsedUser._id
                    }
                })
                .then(async res => {
                    if (res.data.cue.getCuesFromCloud) {
                        const allCues: any = {};
                        res.data.cue.getCuesFromCloud.map((cue: any) => {
                            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : 'local';
                            delete cue.__typename;
                            if (allCues[channelId]) {
                                allCues[channelId].push({ ...cue });
                            } else {
                                allCues[channelId] = [{ ...cue }];
                            }
                        });
                        const custom: any = {};
                        if (allCues['local']) {
                            allCues['local'].map((item: any) => {
                                if (item.customCategory !== '') {
                                    if (!custom[item.customCategory]) {
                                        custom[item.customCategory] = 0;
                                    }
                                }
                            });
                        } else {
                            allCues['local'] = [];
                        }
                        const customC: any[] = [];
                        Object.keys(custom).map(item => {
                            customC.push(item);
                        });
                        customC.sort();
                        setCues(allCues);
                        setCustomCategories(customC);
                        const stringCues = JSON.stringify(allCues);
                        await AsyncStorage.setItem('cues', stringCues);
                        // await notificationScheduler(allCues);
                        setRefreshingWorkspace(false);
                    }
                })
                .catch(err => console.log(err));

            // try {
            //     const res = await server.query({
            //         query: getCues,
            //         variables: {
            //             userId: parsedUser._id
            //         }
            //     });

            //     if (res.data.cue.findByUserId) {
            //         // Here we load all new Cues
            //         // we update statuses for the cues that are already stored and add new cues to the list
            //         // (cant directly replace the store because channel cues could be modified by the user)

            //         const receivedCues = res.data.cue.findByUserId;
            //         receivedCues.map((item: any) => {
            //             const channelId = item.channelId.toString().trim();
            //             let index = -1;
            //             if (allCues[channelId]) {
            //                 index = allCues[channelId].findIndex((cue: any) => {
            //                     return cue._id.toString().trim() === item._id.toString().trim();
            //                 });
            //             }
            //             if (index === -1) {
            //                 let cue: any = {};
            //                 cue = {
            //                     ...item
            //                 };
            //                 delete cue.__typename;
            //                 if (allCues[cue.channelId]) {
            //                     allCues[cue.channelId].push(cue);
            //                 } else {
            //                     allCues[cue.channelId] = [cue];
            //                 }
            //             } else {
            //                 allCues[item.channelId][index].unreadThreads = item.unreadThreads ? item.unreadThreads : 0;
            //                 allCues[item.channelId][index].status = item.status;
            //                 allCues[item.channelId][index].folderId = item.folderId;
            //                 if (!allCues[item.channelId][index].original) {
            //                     allCues[item.channelId][index].original = item.cue;
            //                 }
            //             }
            //         });
            //         const custom: any = {};
            //         setCues(allCues);
            //         if (allCues['local']) {
            //             allCues['local'].map((item: any) => {
            //                 if (item.customCategory !== '') {
            //                     if (!custom[item.customCategory]) {
            //                         custom[item.customCategory] = 0;
            //                     }
            //                 }
            //             });
            //             const customC: any[] = [];
            //             Object.keys(custom).map(item => {
            //                 customC.push(item);
            //             });
            //             customC.sort();
            //             setCustomCategories(customC);
            //         }
            //         // await notificationScheduler(allCues);
            //         const stringCues = JSON.stringify(allCues);
            //         await AsyncStorage.setItem('cues', stringCues);
            //         setRefreshingWorkspace(false)
            //     }
            // } catch (err) {
            //     Alert(unableToRefreshCuesAlert, checkConnectionAlert);
            //     const custom: any = {};
            //     setCues(allCues);
            //     if (allCues['local']) {
            //         allCues['local'].map((item: any) => {
            //             if (item.customCategory !== '') {
            //                 if (!custom[item.customCategory]) {
            //                     custom[item.customCategory] = 0;
            //                 }
            //             }
            //         });
            //         const customC: any[] = [];
            //         Object.keys(custom).map(item => {
            //             customC.push(item);
            //         });
            //         customC.sort();
            //         setCustomCategories(customC);
            //     }
            //     setRefreshingWorkspace(false)
            // }
        }

    }, [])

    // imp
    const loadNewChannelCues = useCallback(async () => {
        setSyncingCues(true);
        let user = await AsyncStorage.getItem('user');
        const unparsedCues = await AsyncStorage.getItem('cues');
        if (user && unparsedCues) {
            const allCues = JSON.parse(unparsedCues);
            const parsedUser = JSON.parse(user);
            const server = fetchAPI(parsedUser._id);

            try {
                const res = await server.query({
                    query: getCues,
                    variables: {
                        userId: parsedUser._id
                    }
                });

                if (res.data.cue.findByUserId) {
                    // Here we load all new Cues
                    // we update statuses for the cues that are already stored and add new cues to the list
                    // (cant directly replace the store because channel cues could be modified by the user)
                    const receivedCues = res.data.cue.findByUserId;
                    receivedCues.map((item: any) => {
                        const channelId = item.channelId.toString().trim();
                        let index = -1;
                        if (allCues[channelId]) {
                            index = allCues[channelId].findIndex((cue: any) => {
                                return cue._id.toString().trim() === item._id.toString().trim();
                            });
                        }
                        if (index === -1) {
                            let cue: any = {};
                            cue = {
                                ...item
                            };
                            delete cue.__typename;
                            if (allCues[cue.channelId]) {
                                allCues[cue.channelId].push(cue);
                            } else {
                                allCues[cue.channelId] = [cue];
                            }
                        } else {
                            allCues[item.channelId][index].unreadThreads = item.unreadThreads ? item.unreadThreads : 0;
                            allCues[item.channelId][index].status = item.status;
                            allCues[item.channelId][index].folderId = item.folderId;
                            if (!allCues[item.channelId][index].original) {
                                allCues[item.channelId][index].original = item.cue;
                            }
                        }
                    });
                    const custom: any = {};
                    setCues(allCues);
                    if (allCues['local']) {
                        allCues['local'].map((item: any) => {
                            if (item.customCategory !== '') {
                                if (!custom[item.customCategory]) {
                                    custom[item.customCategory] = 0;
                                }
                            }
                        });
                        const customC: any[] = [];
                        Object.keys(custom).map(item => {
                            customC.push(item);
                        });
                        customC.sort();
                        setCustomCategories(customC);
                    }
                    // await notificationScheduler(allCues);
                    const stringCues = JSON.stringify(allCues);
                    await AsyncStorage.setItem('cues', stringCues);
                    setSyncingCues(false);
                    Animated.timing(fadeAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                }
            } catch (err) {
                console.log('Error background', err);
                Alert(unableToRefreshCuesAlert, checkConnectionAlert);
                const custom: any = {};
                setCues(allCues);
                if (allCues['local']) {
                    allCues['local'].map((item: any) => {
                        if (item.customCategory !== '') {
                            if (!custom[item.customCategory]) {
                                custom[item.customCategory] = 0;
                            }
                        }
                    });
                    const customC: any[] = [];
                    Object.keys(custom).map(item => {
                        customC.push(item);
                    });
                    customC.sort();
                    setCustomCategories(customC);
                }
                setSyncingCues(false);
                Animated.timing(fadeAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            }
        } else if (unparsedCues) {
            const custom: any = {};
            const allCues = JSON.parse(unparsedCues);
            setCues(allCues);
            // await notificationScheduler(allCues);
            if (allCues['local']) {
                allCues['local'].map((item: any) => {
                    if (item.customCategory !== '') {
                        if (!custom[item.customCategory]) {
                            custom[item.customCategory] = 0;
                        }
                    }
                });
                const customC: any[] = [];
                Object.keys(custom).map(item => {
                    customC.push(item);
                });
                customC.sort();
                setCustomCategories(customC);
            }
            setSyncingCues(false);
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, []);

    const syncOfflineDataOnInit = useCallback(async () => {
        const sC = await AsyncStorage.getItem('cues');
        // const sub = await AsyncStorage.getItem('subscriptions');

        // LOAD CUES
        if (sC) {
            await loadNewChannelCues();
        } else {
            const custom: any = {};
            let allCues: any = {};
            allCues['local'] = [...defaultCues];
            const stringSC = JSON.stringify(allCues);
            await AsyncStorage.setItem('cues', stringSC);
            allCues['local'].map((item: any) => {
                if (item.customCategory !== '') {
                    if (!custom[item.customCategory]) {
                        custom[item.customCategory] = 0;
                    }
                }
            });
            const customC: any[] = [];
            Object.keys(custom).map(item => {
                customC.push(item);
            });
            customC.sort();
            setCues(allCues);
            setCustomCategories(customC);
            // START ANIMATION
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, []);

    const updateExpoNotificationId = useCallback(async (user: any) => {

        let existingStatus = await Notifications.getPermissionsAsync();

        if (!existingStatus.granted && existingStatus.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
            // permission granted

            await Notifications.requestPermissionsAsync({
                ios: {
                allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowAnnouncements: true
                }
            });

            existingStatus = await Notifications.getPermissionsAsync();

        } 

        if (existingStatus.granted || existingStatus.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
            // const user = JSON.parse(u);
            let experienceId = undefined;
            if (!Constants.manifest) {
                // Absence of the manifest means we're in bare workflow
                experienceId = user._id + Platform.OS;
            }
            const expoToken = await Notifications.getExpoPushTokenAsync({
                experienceId
            });

            const notificationId = expoToken.data;

            console.log("Update notification id INIT", notificationId);

            if (!user.notificationId || !user.notificationId.includes(notificationId)) {
                const server = fetchAPI('');
                server.mutate({
                    mutation: updateNotificationId,
                    variables: {
                        userId: user._id,
                        notificationId:
                            user.notificationId === 'NOT_SET' || user.notificationId === 'undefined'
                                ? notificationId
                                : user.notificationId + '-BREAK-' + notificationId
                    }
                });
            }
        }

    }, [])

    // FETCH NEW DATA
    const loadData = useCallback(
        async (saveData?: boolean) => {
            try {

                let u = await AsyncStorage.getItem('user');

                // HANDLE PROFILE
                if (u) {
                    // UPDATE NOTIFICATION ID


                    const parsedUser = JSON.parse(u);
                    if (parsedUser.email) {
                        if (saveData) {
                            await saveDataInCloud();
                        } else {
                            await loadDataFromCloud();
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        [fadeAnimation]
    );

    const handleSocialAuth = (user: any) => {
        const profile = user._profile;

        const { name, email, profilePicURL } = profile;

        const server = fetchAPI('');
        server
            .mutate({
                mutation: authWithProvider,
                variables: {
                    email: email.toLowerCase(),
                    fullName: name,
                    provider: user._provider,
                    avatar: profilePicURL
                }
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
                    loadDataFromCloud();
                } else {
                    const { error } = r.data.user.authWithProvider;
                    Alert(error);
                }
            })
            .catch(e => {
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
        const server = fetchAPI('');
        server
            .mutate({
                mutation: signup,
                variables: {
                    email: email.toLowerCase(),
                    fullName,
                    password
                }
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
            .catch(e => {
                setSigningUp(false);
                console.log(e);
            });
    }, [fullName, email, password, confirmPassword]);

    const handleSsoRedirect = useCallback(() => {
        const server = fetchAPI('');

        if (!isSsoEnabled) {
            return;
        }

        let redirect = AuthSession.makeRedirectUri(
            {
                useProxy: true
            }
        ).toString();

        const split = email.toLowerCase().split('@');

        server
            .query({
                query: getSsoLink,
                variables: {
                    ssoDomain: split[1].trim(),
                    redirectURI: redirect
                }
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
            .catch(e => {
                console.log(e);
            });
    }, [email, isSsoEnabled]);

    // Move to profile page
    const handleLogin = useCallback(() => {
        setIsLoggingIn(true);
        const server = fetchAPI('');
        server
            .query({
                query: login,
                variables: {
                    email: email.toLowerCase(),
                    password
                }
            })
            .then(async (r: any) => {
                if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                    const u = r.data.user.login.user;
                    const token = r.data.user.login.token;
                    if (u.__typename) {
                        delete u.__typename;
                    }

                    if (u._id) {
                        setUserId(u._id)
                        setRole(u.role)
                    }

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);

                    updateExpoNotificationId(u)
                    setShowLoginWindow(false);
                    loadDataFromCloud();
                    setIsLoggingIn(false);

                    
                } else {
                    const { error } = r.data.user.login;
                    Alert(error);
                }
            })
            .catch(e => {
                console.log(e);
                Alert('Something went wrong. Try again.');
                setIsLoggingIn(false);
            });
    }, [email, password]);

    const timeToString = (time: any) => {
        const date = new Date(time);
        return moment(date).format('YYYY-MM-DD')
    };

    function alertTimeDisplay(dbDate: string, twentyFourOffset: boolean) {
        let date = moment(dbDate);

        if (!twentyFourOffset) { 
            return 'Today at ' + date.format('h:mm a')
        } else { 
            return 'Tomorrow at ' + date.format('h:mm a')
        } 

    }

    // imp
    const loadDataFromCloud = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            setLoadingCues(true);
            setLoadingSubs(true);
            setLoadingUser(true);
            setLoadingOrg(true);

            const user = JSON.parse(u);
            const server = fetchAPI(user._id);
            // Get User info
            server
                .query({
                    query: findUserById,
                    variables: {
                        id: user._id
                    }
                })
                .then(async res => {
                    const u = res.data.user.findById;
                    if (u) {
                        // await AsyncStorage.setItem('cueDraft', u.currentDraft);
                        delete u.currentDraft;
                        delete u.__typename;
                        const sU = JSON.stringify(u);
                        await AsyncStorage.setItem('user', sU);
                        setLoadingUser(false);
                    }
                })
                .catch(err => console.log(err));
            // Get user cues
            server
                .query({
                    query: getCuesFromCloud,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data.cue.getCuesFromCloud) {
                        const allCues: any = {};
                        res.data.cue.getCuesFromCloud.map((cue: any) => {
                            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : 'local';
                            delete cue.__typename;
                            if (allCues[channelId]) {
                                allCues[channelId].push({ ...cue });
                            } else {
                                allCues[channelId] = [{ ...cue }];
                            }
                        });
                        const custom: any = {};
                        if (allCues['local']) {
                            allCues['local'].map((item: any) => {
                                if (item.customCategory !== '') {
                                    if (!custom[item.customCategory]) {
                                        custom[item.customCategory] = 0;
                                    }
                                }
                            });
                        } else {
                            allCues['local'] = [];
                        }
                        const customC: any[] = [];
                        Object.keys(custom).map(item => {
                            customC.push(item);
                        });
                        customC.sort();
                        setCues(allCues);
                        setCustomCategories(customC);
                        const stringCues = JSON.stringify(allCues);
                        await AsyncStorage.setItem('cues', stringCues);
                        // await notificationScheduler(allCues);
                        setLoadingCues(false);
                    }
                })
                .catch(err => console.log(err));
            // Get subscription information
            server
                .query({
                    query: getSubscriptions,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data.subscription.findByUserId) {
                        const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
                            if (a.channelName < b.channelName) {
                                return -1;
                            }
                            if (a.channelName > b.channelName) {
                                return 1;
                            }
                            return 0;
                        });
                        setSubscriptions(sortedSubs);
                        const stringSub = JSON.stringify(sortedSubs);
                        await AsyncStorage.setItem('subscriptions', stringSub);
                        setLoadingSubs(false);
                    }
                })
                .catch(err => console.log(err));
            // Get org
            server
                .query({
                    query: getOrganisation,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data && res.data.school.findByUserId) {
                        const stringOrg = JSON.stringify(res.data.school.findByUserId);
                        await AsyncStorage.setItem('school', stringOrg);
                        setLoadingOrg(false);
                    } else {
                        setLoadingOrg(false);
                    }
                })
                .catch(err => console.log(err));
        }
    }, []);

    // imp
    const saveDataInCloud = useCallback(async () => {
        if (saveDataInProgress) return;

        setSaveDataInProgress(true);
        const u: any = await AsyncStorage.getItem('user');
        const parsedUser = JSON.parse(u);
        const sC: any = await AsyncStorage.getItem('cues');
        const parsedCues = JSON.parse(sC);

        const allCuesToSave: any[] = [];
        const allCues: any[] = [];

        if (parsedCues !== {}) {
            Object.keys(parsedCues).map(key => {
                parsedCues[key].map((cue: any) => {
                    const cueInput = {
                        ...cue,
                        _id: cue._id.toString(),
                        color: cue.color.toString(),
                        date: new Date(cue.date).toISOString(),
                        gradeWeight: cue.submission && cue.gradeWeight ? cue.gradeWeight.toString() : undefined,
                        endPlayAt: cue.endPlayAt && cue.endPlayAt !== '' ? new Date(cue.endPlayAt).toISOString() : '',
                        allowedAttempts:
                            cue.allowedAttempts && cue.allowedAttempts !== null ? cue.allowedAttempts.toString() : null
                    };
                    allCuesToSave.push({ ...cueInput });
                    // Deleting these because they should not be changed ...
                    // but dont delete if it is the person who has made the cue
                    // -> because those channel Cue changes are going to be propagated
                    delete cueInput.score;
                    // delete cueInput.deadline;
                    delete cueInput.graded;
                    delete cueInput.submittedAt;
                    // delete cueInput.gradeWeight;
                    // delete cueInput.submission;
                    delete cueInput.comment;

                    // this change is propagated only when the user actively changes folder structure...
                    delete cueInput.folderId;

                    delete cueInput.unreadThreads;
                    // delete cueInput.createdBy;
                    // delete cueInput.original;
                    delete cueInput.status;
                    delete cueInput.channelName;
                    delete cueInput.__typename;
                    allCues.push(cueInput);
                });
            });
        }

        const server = fetchAPI('');

        // UPDATE CUES
        server
            .mutate({
                mutation: saveCuesToCloud,
                variables: {
                    userId: parsedUser._id,
                    cues: allCues
                }
            })
            .then(async res => {
                if (res.data.cue.saveCuesToCloud) {
                    const newIds: any = res.data.cue.saveCuesToCloud;
                    const updatedCuesArray: any[] = [];
                    allCuesToSave.map((c: any) => {
                        const id = c._id;
                        const updatedItem = newIds.find((i: any) => {
                            return id.toString().trim() === i.oldId.toString().trim();
                        });
                        if (updatedItem) {
                            updatedCuesArray.push({
                                ...c,
                                _id: updatedItem.newId
                            });
                        } else {
                            updatedCuesArray.push(c);
                        }
                    });
                    const updatedCuesObj: any = {};
                    updatedCuesArray.map((c: any) => {
                        if (c.channelId && c.channelId !== '') {
                            if (updatedCuesObj[c.channelId]) {
                                updatedCuesObj[c.channelId].push(c);
                            } else {
                                updatedCuesObj[c.channelId] = [c];
                            }
                        } else {
                            if (updatedCuesObj['local']) {
                                updatedCuesObj['local'].push(c);
                            } else {
                                updatedCuesObj['local'] = [c];
                            }
                        }
                    });
                    const updatedCues = JSON.stringify(updatedCuesObj);
                    await AsyncStorage.setItem('cues', updatedCues);
                    if (newIds.length !== 0) {
                        updateCuesHelper(updatedCuesObj);
                    }
                }

                setSaveDataInProgress(false);
            })
            .catch(err => console.log(err));
    }, [cues]);

    const updateCuesHelper = useCallback(
        async (obj: any) => {
            setCues(obj);
            // await notificationScheduler(obj);
        },
        [cues]
    );

    // useEffect(() => {
    //     (async () => {
    //         await syncOfflineDataOnInit();
    //         await loadData();
    //     })();

    //     // Called when component is loaded
    // }, []);

    const openModal = useCallback(
        async (type) => {

            if (option === 'Classroom' && selectedWorkspace !== '') {
                await AsyncStorage.setItem('activeWorkspace', selectedWorkspace)
                setSelectedWorkspace('')
            }


            setModalType(type);
            // AsyncStorage.setItem('lastopened', type);
        },
        [cues, selectedWorkspace, option]
    );

    const openCueFromCalendar = useCallback(
        async (channelId, _id, by) => {

            setShowHome(false);

            const fetchAsyncCues = await AsyncStorage.getItem('cues');

            if (!fetchAsyncCues) {
                "Failed to open. Try again"
                return;
            }

            const storageCues = JSON.parse(fetchAsyncCues);



            // Get the latest cues from async storage and not state (Error in quiz) 
            let cueKey = '';
            let cueIndex = 0;

            if (storageCues !== {}) {
                Object.keys(storageCues).map(key => {
                    storageCues[key].map((cue: any, index: number) => {
                        if (cue._id === _id) {
                            cueKey = key;
                            cueIndex = index;
                        }
                    });
                });
            }

            setUpdateModalKey(cueKey);
            setUpdateModalIndex(cueIndex);
            // setPageNumber(pageNumber);
            setChannelId(channelId);

            openModal('Update');

            if (channelId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channelId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                }
            }
            setCreatedBy(by);
            setCueId(_id);

        },
        [subscriptions]
    );

    const openUpdate = useCallback(
        (key, index, pageNumber, _id, by, channId) => {
            setUpdateModalKey(key);
            setUpdateModalIndex(index);
            // setPageNumber(pageNumber);
            setChannelId(channId);
            if (channId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                }
            }
            setCreatedBy(by);
            setCueId(_id);
            openModal('Update');
            setShowHome(false);
        },
        [subscriptions, selectedWorkspace]
    );

    const reloadCueListAfterUpdate = useCallback(async () => {
        const unparsedCues = await AsyncStorage.getItem('cues');
        const u = await AsyncStorage.getItem('user');
        if (unparsedCues) {
            const allCues = JSON.parse(unparsedCues);
            const custom: any = {};
            setCues(allCues);
            if (allCues['local']) {
                allCues['local'].map((item: any) => {
                    if (item.customCategory !== '') {
                        if (!custom[item.customCategory]) {
                            custom[item.customCategory] = 0;
                        }
                    }
                });
                const customC: any[] = [];
                Object.keys(custom).map(item => {
                    customC.push(item);
                });
                customC.sort();
                setCustomCategories(customC);
            }
            // await notificationScheduler(allCues);
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
        if (u) {
            const user = JSON.parse(u);
            if (user.email) {
                await saveDataInCloud();
            }
        }
    }, []);

    const forgotPassword = useCallback(() => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: resetPassword,
                variables: {
                    email
                }
            })
            .then(res => {
                if (res.data && res.data.user.resetPassword) {
                    Alert(weHaveEmailedPasswordAlert);
                    setShowForgotPassword(false);
                } else {
                    Alert(invalidCredentialsAlert);
                }
            });
    }, [email]);

    const refreshSubscriptions = async () => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const parsedUser = JSON.parse(u);
            const server = fetchAPI(parsedUser._id);
            server
                .query({
                    query: getSubscriptions,
                    variables: {
                        userId: parsedUser._id
                    }
                })
                .then(async res => {
                    if (res.data.subscription.findByUserId) {
                        const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
                            if (a.channelName < b.channelName) {
                                return -1;
                            }
                            if (a.channelName > b.channelName) {
                                return 1;
                            }
                            return 0;
                        });
                        setSubscriptions(sortedSubs);
                        const stringSub = JSON.stringify(sortedSubs);
                        await AsyncStorage.setItem('subscriptions', stringSub);
                    }
                })
                .catch(e => {
                    alert('Could not refresh Subscriptions');
                });
        }
    };

    const markCueAsRead = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[updateModalKey].length === 0) {
            return;
        }

        const unmodified = subCues ? subCues[updateModalKey][updateModalIndex] : {};

        if (!unmodified) return;

        const modified = {
            ...unmodified,
            status: 'read'
        };

        subCues[updateModalKey][updateModalIndex] = modified;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        reloadCueListAfterUpdate();
    }, [cues, updateModalKey, updateModalIndex]);

    const closeModal = useCallback(async (submit?: boolean) => {

        setClosingModal(true);

        // Check if active workspace
        if (option === 'Classroom') {

            const activeWorkspace = await AsyncStorage.getItem('activeWorkspace');

            if (activeWorkspace) {

                setSelectedWorkspace(activeWorkspace)
            }
        }

        const cueDraftHome = await AsyncStorage.getItem('cueDraft');

        await loadData();

        setModalType('');

        // Mark as read
        if (modalType === 'Update' && !submit) {
            await markCueAsRead();
        }

        setCueId('');
        setShowHome(true);
        setCreatedBy('');

        if (modalType === 'Update') {
            setChannelId('');
        }

        setDisableCreateNavbar(false);
        setCreateActiveTab('Content')

        setClosingModal(false);


    }, [fadeAnimation, modalType, option]);

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
                return option === op ? 'search' : 'search-outline'
            case 'Inbox':
                return option === op ? 'chatbubble' : 'chatbubble-outline';
            default:
                return option === op ? 'person' : 'person-outline';
        }
    };

    const getNavBarColor = (op: string) => {
        switch (op) {
            case 'To Do':
                return option === op ? '#f2f2f2' : '#fff';
            case 'Classroom':
                return option === op ? '#f2f2f2' : '#fff';
            case 'Search':
                return option === op ? '#f2f2f2' : '#fff'
            case 'Inbox':
                return option === op ? '#f2f2f2' : '#fff';
            default:
                return option === op ? '#f2f2f2' : '#fff';
        }
    };

    const getWorkspaceNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return workspaceActiveTab === op ? 'library' : 'library-outline';
            case 'Discuss':
                return workspaceActiveTab === op ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Meet':
                return workspaceActiveTab === op ? 'videocam' : 'videocam-outline'
            case 'Scores':
                return workspaceActiveTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return workspaceActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getCreateNavbarIconName = (op: string) => {
        console.log("Create navbar op", op)
        switch (op) {
            case 'Content':
                return createActiveTab === op ? 'create' : 'create-outline';
            case 'Import':
                return createActiveTab === op ? 'share' : 'share-outline';
            case 'Quiz':
                return createActiveTab === op ? 'checkbox' : 'checkbox-outline'
            case 'Library':
                return createActiveTab === op ? 'book' : 'book-outline';
            default:
                return createActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getNavbarIconColor = (op: string) => {
        if (op === option) {
            return '#000'
        }
        return '#797979'
    }

    const getWorkspaceNavbarIconColor = (op: string) => {
        if (op === workspaceActiveTab) {
            return selectedWorkspace.split('-SPLIT-')[3]
        }
        return '#797979'
    }

    const getCreateNavbarIconColor = (op: string) => {
        if (op === createActiveTab) {
            return '#1f1f1f'
        }
        return '#797979'
    }

    const getNavbarText = (op: string) => {
        switch (op) {
            case 'To Do':
                return 'Agenda'
            case 'Classroom':
                return 'Workspace'
            case 'Search':
                return 'Search'
            case 'Inbox':
                return 'Inbox'
            default:
                return 'Account';
        }
    }

    const getWorkspaceNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Library'
            case 'Discuss':
                return 'Discussion'
            case 'Meet':
                return 'Meetings'
            case 'Scores':
                return 'Scores'
            default:
                return 'Settings';
        }
    }

    const getCreateNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Content'
            case 'Import':
                return 'Import'
            case 'Quiz':
                return 'Quiz'
            case 'Library':
                return 'Books'
            default:
                return 'Settings';
        }
    }

    const cuesArray: any[] = [];

    if (cues !== {}) {
        Object.keys(cues).map(key => {
            cues[key].map((cue: any, index: number) => {
                cuesArray.push({
                    ...cue,
                    key,
                    index
                });
            });
        });
    }

    const cuesCopy = cuesArray.sort((a: any, b: any) => {
        if (a.color < b.color) {
            return -1;
        }
        if (a.color > b.color) {
            return 1;
        }
        return 0;
    });

    let dateFilteredCues: any[] = [];
    if (filterStart && filterEnd) {
        dateFilteredCues = cuesArray.filter(item => {
            const date = new Date(item.date);
            return date >= filterStart && date <= filterEnd;
        });
    } else {
        dateFilteredCues = cuesArray;
    }

    const [searchTerm, setSearchTerm] = useState('')

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', height: '100%', flexDirection: 'row' }}>
            {/* {
                height <= width ? (
                    <View
                        style={{
                            position: 'absolute',
                            backgroundColor: '#fff',
                            // alignSelf: 'flex-end',
                            width: 0,
                            paddingTop: 12,
                            paddingBottom: Dimensions.get('window').width < 1024 ? 10 : 20,
                            paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 20,
                            flexDirection: 'column',
                            // justifyContent: 'center',
                            height: '100%',
                            // shadowColor: '#000',
                            // shadowOffset: {
                            //     width: 0,
                            //     height: 0
                            // },
                            left: 0,
                            // 0acity: 0.03,
                            // shadowRadius: 10,
                            borderColor: '#f2f2f2',
                            borderRightWidth: 1,
                            zIndex: showLoginWindow ? 40 : 100,
                            elevation: showLoginWindow ? 40 : 120,
                        }}
                    >
                        <View style={{
                            flexDirection: 'row', marginBottom: 30, marginTop: 8, paddingBottom: 20
                        }}>
                            <Image
                                source={{
                                    uri:
                                        'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg'
                                }}
                                style={{
                                    width: 76.59,
                                    height: 23,
                                    marginTop: 1
                                }}
                                resizeMode={'contain'}
                            />
                            <View style={{
                                height: 23, flex: 1, flexDirection: 'row', justifyContent: 'flex-end'
                            }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const op = 'Search'
                                        setOption(op);
                                    }}>
                                    <Text style={{
                                        lineHeight: 23,
                                        // textAlign: 'right'
                                    }}>
                                        <Ionicons
                                            name={'search-outline'}
                                            style={{ color: '#1f1f1f' }}
                                            size={23}
                                        />
                                    </Text>
                                </TouchableOpacity>
                                <View style={{ width: 15 }} />
                                <TouchableOpacity
                                    onPress={() => {
                                        const op = 'Account'
                                        setOption(op);
                                    }}>
                                    <Text style={{
                                        lineHeight: 23,
                                        // textAlign: 'right'
                                    }}>
                                        <Ionicons
                                            name={'person-circle-outline'}
                                            style={{ color: '#1f1f1f' }}
                                            size={23}
                                        />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                         <TextInput
                            // autoCompleteType="password"
                            // textContentType="text"
                            // secureTextEntry={true}
                            value={searchTerm}
                            placeholder={'Search'}
                            onChangeText={(val: any) => setSearchTerm(val)}
                            placeholderTextColor={'#1F1F1F'}
                        />
                        {options.map((op: any, ind: number) => {
                            if (op === 'Search' || op === 'Account') {
                                return
                            }
                            return (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: getNavBarColor(op),
                                        // width: '20%',
                                        flexDirection: 'row',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        marginTop: 5,
                                        borderRadius: 10,
                                        padding: 10,
                                        paddingHorizontal: 20
                                    }}
                                    key={ind}
                                    onPress={() => {
                                        setOption(op);
                                        if (op === 'Browse') {
                                            // open create
                                            setCueId('');
                                            setModalType('');
                                            setCreatedBy('');
                                            if (modalType === 'Update') {
                                                fadeAnimation.setValue(0);
                                                if (modalType === 'Update') {
                                                    setChannelId('');
                                                }
                                                loadData(true);
                                            }
                                            openModal('Create');
                                        }
                                        if (op === 'Classroom') {
                                            setModalType('');
                                            // setPageNumber(0);
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name={getNavbarIconName(op)}
                                        style={{ color: getNavbarIconColor(op), marginBottom: 0 }}
                                        size={23}
                                    />
                                    <Text style={{
                                        fontSize: 18,
                                        color: getNavbarIconColor(op),
                                        fontWeight: 'bold',
                                        fontFamily: 'Inter',
                                        paddingLeft: 10
                                    }}>
                                        {getNavbarText(op)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null
            } */}
            <View style={styles(channelId).container} key={showHome.toString() + option.toString() + tab.toString()}>
                {showLoginWindow && showSignupWindow ? (
                    <View
                        style={{
                            width: '100%',
                            height: '100%',
                            flex: 1,
                            position: 'absolute',
                            zIndex: 50,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(16,16,16, 0.7)'
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
                                paddingHorizontal: 40
                            }}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    height: '100%',
                                    paddingVertical: 40,
                                    justifyContent: 'center'
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        paddingBottom: 20
                                    }}
                                >
                                    <Image
                                        source={{
                                            uri:
                                                'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg'
                                        }}
                                        style={{
                                            width: dimensions.window.height * 0.16 * 0.53456,
                                            height: dimensions.window.height * 0.16 * 0.2
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
                                        textAlign: 'center'
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
                                        alignSelf: 'center'
                                    }}
                                >
                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
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
                                            flexDirection: 'row'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: 'white',
                                                fontSize: 12,
                                                backgroundColor: '#006aff',
                                                paddingHorizontal: 20,
                                                fontFamily: 'inter',
                                                height: 35,
                                                // width: 180,
                                                width: 175,
                                                borderRadius: 15,
                                                textTransform: 'uppercase'
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
                                            flexDirection: 'row'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: '#006AFF'
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
                            zIndex: 50
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
                                paddingHorizontal: 40
                            }}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    paddingVertical: 40,
                                    justifyContent: 'center'
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        paddingBottom: 30
                                    }}
                                >
                                    <Image
                                        source={{
                                            uri:
                                                'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg'
                                        }}
                                        style={{
                                            width: dimensions.window.height * 0.2 * 0.53456,
                                            height: dimensions.window.height * 0.2 * 0.2
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
                                        textAlign: 'center'
                                    }}
                                >
                                    {showForgotPassword
                                        ? PreferredLanguageText('temporaryPassword')
                                        : ''}
                                    {/* PreferredLanguageText('continueLeftOff')} */}
                                </Text>

                                <View
                                    style={{
                                        maxWidth: 400,
                                        width: '100%',
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        alignSelf: 'center'
                                    }}
                                >
                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
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
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Ionicons name="lock-closed" size={18} color="#006AFF" />
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
                                                    alignItems: 'center'
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
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: '#006AFF'
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
                                            paddingBottom: 10
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
                                                backgroundColor: '#006aff',
                                                borderRadius: 15,
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 15,
                                                width: 175,
                                                alignSelf: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#006aff',
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    height: 35,
                                                    // width: 180,
                                                    width: 175,
                                                    borderRadius: 15,
                                                    textTransform: 'uppercase'
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
                                                        color: '#006AFF'
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
                                                    flexDirection: 'row'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#006AFF'
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
                                        marginTop: 20
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
                    !saveDataInProgress &&
                    !syncingCues &&
                    ((option === 'Classroom' && modalType !== 'Create' && (workspaceActiveTab === 'Content' || (workspaceActiveTab === 'Discuss' && !showNewPost && !hideNavbarDiscussions) || (workspaceActiveTab === 'Meet' && selectedWorkspace.split('-SPLIT-')[2] === userId && !showNewMeeting))) ||
                        (option === 'Inbox' && !showDirectory && !hideNewChatButton) ||
                        (option === 'Channels' && !showCreate)) ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (option === 'Classroom') {
                                setCueId('');
                                setModalType('');
                                setCreatedBy('');
                                // setChannelFilterChoice('All')
                                if (modalType === 'Update') {
                                    fadeAnimation.setValue(0);
                                    if (modalType === 'Update') {
                                        setChannelId('');
                                    }
                                    loadData(true);
                                }

                                if (selectedWorkspace === '' || workspaceActiveTab === 'Content') {
                                    openModal('Create');
                                } else if (selectedWorkspace !== '' && workspaceActiveTab === 'Discuss') {
                                    setShowNewPost(true)
                                } else if (selectedWorkspace !== '' && workspaceActiveTab === 'Meet') {
                                    setShowNewMeeting(true)
                                }

                                // setShowHome(false)
                                // setMenuCollapsed(true)
                            } else if (option === 'Channels') {
                                setShowCreate(true);
                            } else {
                                setShowDirectory(true);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            marginRight: blueButtonMR(Dimensions.get('window').width, orientation, Platform.OS),
                            marginBottom: blueButtonHomeMB(Dimensions.get('window').width, orientation, Platform.OS),
                            right: 0,
                            justifyContent: 'center',
                            bottom: 0,
                            width: Dimensions.get('window').width > 350 ? 62 :  58,
                            height: Dimensions.get('window').width > 350 ? 62 :  58,
                            borderRadius: Dimensions.get('window').width > 350 ? 32 : 29,
                            backgroundColor: '#006aff',
                            borderColor: '#f2f2f2',
                            borderWidth: 0,
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 4,
                                height: 4
                            },
                            shadowOpacity: 0.12,
                            shadowRadius: 10,
                            zIndex: showLoginWindow ? 40 : 100,
                            opacity: showWorkspaceFilterModal ? 0 : 1
                        }}
                    >
                        <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                            {option === 'Classroom' && (selectedWorkspace === '' || workspaceActiveTab === 'Content') ? (
                                <Ionicons name="pencil-outline" size={Dimensions.get('window').width > 350 ? 26 : 25} />
                            ) : option === 'Channels' || (option === 'Classroom' && selectedWorkspace !== '' && (workspaceActiveTab === 'Discuss' || workspaceActiveTab === 'Meet')) ? (
                                <Ionicons name={workspaceActiveTab === 'Meet' ? "videocam-outline" : "add-outline"} size={workspaceActiveTab === 'Meet' ? 28 : Dimensions.get('window').width > 350 ? 36 : 35} />
                            ) : option === 'Inbox' ? (
                                <Ionicons name="person-add-outline" size={Dimensions.get('window').width > 350 ? 22 : 21} />
                            ) : (
                                null
                            )}
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
                            overflow: 'hidden'
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
                                marginTop: 0
                            }}
                        >
                            {loadingCues ||
                                loadingUser ||
                                loadingSubs ||
                                loadingOrg ||
                                saveDataInProgress ||
                                closingModal ||
                                syncingCues ? (
                                <View style={[styles(channelId).activityContainer, styles(channelId).horizontal]}>
                                    <ActivityIndicator color={'#1F1F1F'} />
                                </View>
                            ) : (
                                <Dashboard
                                    version={version}
                                    setTab={(val: any) => setTab(val)}
                                    tab={tab}
                                    setShowCreate={(val: any) => setShowCreate(val)}
                                    showCreate={showCreate}
                                    setShowHelp={(val: any) => setShowHelp(val)}
                                    showHelp={showHelp}
                                    showDirectory={showDirectory}
                                    setShowDirectory={(val: any) => setShowDirectory(val)}
                                    selectedWorkspace={selectedWorkspace}
                                    setSelectedWorkspace={(val: any) => setSelectedWorkspace(val)}
                                    setOption={(op: any) => setOption(op)}
                                    option={option}
                                    options={options}
                                    refreshSubscriptions={refreshSubscriptions}
                                    hideHome={() => {
                                        setShowHome(false);
                                        loadData();
                                    }}
                                    closeModal={() => {
                                        // setShowHome(true);
                                        closeModal();
                                    }}
                                    saveDataInCloud={async () => await saveDataInCloud()}
                                    reOpenProfile={() => {
                                        setModalType('');
                                        openModal('Profile');
                                    }}
                                    reloadData={() => {
                                        loadDataFromCloud();
                                    }}
                                    openCreate={() => {
                                        setCueId('');
                                        setModalType('');
                                        setCreatedBy('');
                                        if (modalType === 'Update') {
                                            fadeAnimation.setValue(0);
                                            if (modalType === 'Update') {
                                                setChannelId('');
                                            }
                                            loadData(true);
                                        }
                                        openModal('Create');
                                    }}
                                    createOption={createOption}
                                    cues={dateFilteredCues}
                                    setChannelId={(id: string) => setChannelId(id)}
                                    setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
                                    subscriptions={subscriptions}
                                    openDiscussion={() => openModal('Discussion')}
                                    openSubscribers={() => openModal('Subscribers')}
                                    openGrades={() => openModal('Grades')}
                                    openMeeting={() => openModal('Meeting')}
                                    openChannelSettings={() => openModal('ChannelSettings')}
                                    openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) =>
                                        openUpdate(index, key, pageNumber, _id, by, cId)
                                    }
                                    calendarCues={cues}
                                    openCueFromCalendar={openCueFromCalendar}
                                    key={
                                        option.toString() +
                                        showHome.toString() +
                                        tab.toString() +
                                        showDirectory.toString() +
                                        showCreate.toString() +
                                        showHelp.toString() +
                                        cues.toString()
                                    }
                                    openDiscussionFromActivity={(channelId: string) => {
                                        setOption('Classroom');
                                        setLoadDiscussionForChannelId(channelId);
                                        setWorkspaceActiveTab('Discuss')
                                    }}
                                    openChannelFromActivity={(channelId: string) => {
                                        setOption('Classroom');
                                        setOpenChannelId(channelId);
                                    }}
                                    openQAFromSearch={(channelId: any, cueId: string) => {
                                        const subscription = subscriptions.find((sub: any) => {
                                            return sub.channelId === channelId;
                                        });

                                        if (subscription) {
                                            openCueFromCalendar(channelId, cueId, subscription.channelCreatedBy);
                                            setTarget('Q&A');
                                        }
                                    }}
                                    openQAFromActivity={(channelId: any, cueId: string, by: string) => {
                                        openCueFromCalendar(channelId, cueId, by);
                                        setTarget('Q&A');
                                    }}
                                    openDiscussionFromSearch={(channelId: any) => {
                                        // Find channel Created By from subscriptions
                                        setOption('Classroom');
                                    }}
                                    openClassroom={(channelId: any) => {
                                        // Find channel Created By from subscriptions
                                        const match = subscriptions.filter((sub: any) => {
                                            return sub.channelId === channelId;
                                        });
                                        if (match && match.length !== 0) {
                                            const createdBy = match[0].channelCreatedBy;
                                            setChannelId(channelId);
                                            setChannelCreatedBy(createdBy);
                                            setCreatedBy(createdBy);
                                            openModal('Meeting');
                                            setShowHome(false);
                                        }
                                    }}
                                    loadDiscussionForChannelId={loadDiscussionForChannelId}
                                    setLoadDiscussionForChannelId={setLoadDiscussionForChannelId}
                                    openChannelId={openChannelId}
                                    setOpenChannelId={setOpenChannelId}
                                    modalType={modalType}
                                    customCategories={customCategories}
                                    closeCreateModal={() => {
                                        setModalType('');
                                        // setPageNumber(0);
                                    }}
                                    closeOnCreate={async () => {
                                        setDisableCreateNavbar(false)
                                        setCreateActiveTab('Content')
                                        setModalType('');
                                        // setPageNumber(0);
                                        await loadData(true);
                                        await loadData();
                                    }}
                                    unreadMessages={unreadMessages}
                                    refreshUnreadInbox={refreshUnreadInbox}
                                    hideNewChatButton={(hide: boolean) => setHideNewChatButton(hide)}
                                    activeWorkspaceTab={workspaceActiveTab}
                                    hideNavbarDiscussions={hideNavbarDiscussions}
                                    setHideNavbarDiscussions={(hide: boolean) => setHideNavbarDiscussions(hide)}
                                    showNewPost={showNewPost}
                                    setShowNewPost={(show: boolean) => setShowNewPost(show)}
                                    showNewMeeting={showNewMeeting}
                                    setShowNewMeeting={(show: boolean) => setShowNewMeeting(show)}
                                    refreshingWorkspace={refreshingWorkspace}
                                    onRefreshWorkspace={(subs: boolean) => handleRefreshWorkspace(subs)}
                                    // 
                                    setShowImportCreate={(showImport: boolean) => setShowImportCreate(showImport)}
                                    showImportCreate={showImportCreate}
                                    setCreateActiveTab={(tab: any) => setCreateActiveTab(tab)}
                                    createActiveTab={createActiveTab}
                                    setDisableCreateNavbar={(disable: boolean) => setDisableCreateNavbar(disable)}
                                    setShowWorkspaceFilterModal={(show: boolean) => setShowWorkspaceFilterModal(show)}
                                    setWorkspaceActiveTab={setWorkspaceActiveTab}
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
                        borderTopRightRadius: 0
                        // maxWidth: dimensions.window.width
                        // overflow: 'hidden'
                    }}
                >
                    {modalType === 'Update' ? (
                        <Update
                            version={version}
                            key={cueId.toString()}
                            customCategories={customCategories}
                            cue={cues[updateModalKey][updateModalIndex]}
                            cueIndex={updateModalIndex}
                            cueKey={updateModalKey}
                            closeModal={(submit?: boolean) => closeModal(submit)}
                            cueId={cueId}
                            createdBy={createdBy}
                            channelId={channelId}
                            channelCreatedBy={channelCreatedBy}
                            channelCues={cues[channelId]}
                            reloadCueListAfterUpdate={() => reloadCueListAfterUpdate()}
                            target={target}
                            openCue={(cueId: string) => openCueFromCalendar(channelId, cueId, channelCreatedBy)}
                            refreshCues={loadNewChannelCues}
                        // refreshAfterSubmittingQuiz={refreshAfterSubmittingQuiz}
                        />
                    ) : null}
                </View>

                {/* Create navbar */}
                {
                    modalType === 'Create' && !disableCreateNavbar ? (
                        <View
                            style={{
                                position: 'absolute',
                                backgroundColor: '#fff',
                                alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop:  Platform.OS === 'ios' ? 12 : 8,
                                paddingBottom: Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -10
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

                                if (role !== 'instructor' && op === 'Quiz') {
                                    return null
                                }

                                if (disableCreateNavbar) {
                                    return null
                                }

                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: role === 'instructor' ? '25%' : '33%',
                                            flexDirection: width < 800 ? 'column' : 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                        key={ind.toString()}
                                        onPress={() => {
                                            if (op === 'Import') {
                                                setShowImportCreate(true)
                                            } else {
                                                setCreateActiveTab(op)
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name={getCreateNavbarIconName(op)}
                                            style={{ color: getCreateNavbarIconColor(op), marginBottom: 6 }}
                                            size={23}
                                        />
                                        <Text style={{
                                           fontSize: width < 800 ? 11 : 16,
                                           lineHeight: width < 800 ? 11 : 23,
                                           color: getCreateNavbarIconColor(op),
                                           fontWeight: 'bold',
                                           fontFamily: 'Inter',
                                           marginBottom: width < 800 ? 0 : 6,
                                           paddingLeft: width < 800 ? 0 : 5
                                        }}>
                                            {getCreateNavbarText(op)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null
                }


                {
                    modalType !== 'Create' && option === 'Classroom' && selectedWorkspace !== '' && showHome && selectedWorkspace !== 'My Notes' && (workspaceActiveTab !== "Discuss" || !hideNavbarDiscussions) ? (
                        <View
                            style={{
                                position: 'absolute',
                                backgroundColor: '#fff',
                                alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop:  Platform.OS === 'ios' ? 12 : 8,
                                paddingBottom: Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -10
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
                                    return
                                }

                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: selectedWorkspace.split('-SPLIT-')[2] === userId || selectedWorkspace === 'My Notes' ? '20%' : '25%',
                                            flexDirection: width < 800 ? 'column' : 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                        key={ind}
                                        onPress={() => {
                                            setWorkspaceActiveTab(op)
                                        }}
                                    >
                                        <Ionicons
                                            name={getWorkspaceNavbarIconName(op)}
                                            style={{ color: getWorkspaceNavbarIconColor(op), marginBottom: 6 }}
                                            size={23}
                                        />
                                        <Text style={{
                                           fontSize: width < 800 ? 11 : 16,
                                           lineHeight: width < 800 ? 11 : 23,
                                           color: getWorkspaceNavbarIconColor(op),
                                           fontWeight: 'bold',
                                           fontFamily: 'Inter',
                                           marginBottom: width < 800 ? 0 : 6,
                                           paddingLeft: width < 800 ? 0 : 5
                                        }}>
                                            {getWorkspaceNavbarText(op)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null
                }

                {modalType !== 'Create' && showHome && !showLoginWindow && (option !== 'Classroom' || selectedWorkspace === "" || selectedWorkspace === 'My Notes') && (option !== 'Inbox' || !hideNewChatButton) ? (
                    <View
                        key={orientation}
                        style={{
                            position: 'absolute',
                            backgroundColor: '#fff',
                            alignSelf: 'flex-end',
                            width: '100%',
                            paddingTop:  Platform.OS === 'ios' ? 12 : 8,
                            paddingBottom: Dimensions.get('window').width < 1024 ? (Platform.OS === 'ios' ? 10 : 15) : 20,
                            paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            height: Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68,
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 0,
                                height: -10
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
                                        alignItems: 'center'
                                    }}
                                    key={ind}
                                    onPress={() => {
                                        setOption(op);
                                        if (op === 'Browse') {
                                            // open create
                                            setCueId('');
                                            setModalType('');
                                            setCreatedBy('');
                                            if (modalType === 'Update') {
                                                fadeAnimation.setValue(0);
                                                if (modalType === 'Update') {
                                                    setChannelId('');
                                                }
                                                loadData(true);
                                            }
                                            openModal('Create');
                                        }
                                        if (op === 'Classroom') {
                                            setModalType('');
                                            // setPageNumber(0);
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name={getNavbarIconName(op)}
                                        style={{ color: getNavbarIconColor(op), marginBottom: 5 }}
                                        size={23}
                                    />
                                    <Text style={{
                                        fontSize: width < 800 ? 11 : 16,
                                        lineHeight: width < 800 ? 11 : 23,
                                        color: getNavbarIconColor(op),
                                        fontWeight: 'bold',
                                        fontFamily: 'Inter',
                                        marginBottom: width < 800 ? 0 : 6,
                                        paddingLeft: width < 800 ? 0 : 5
                                    }}>
                                        {getNavbarText(op)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null}
            </View>
        </SafeAreaView >
    );
};

export default Home;

const styles = (channelId: string) =>
    StyleSheet.create({
        container: {
            // flex: 1,
            flexDirection: 'row',
            height: '100%',
            width: '100%'
        },
        all: {
            fontSize: 12,
            color: '#fff',
            fontWeight: 'bold',
            height: 25,
            paddingHorizontal: 12,
            backgroundColor: '#000000',
            lineHeight: 25,
            fontFamily: 'overpass',
            textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 12,
            color: '#fff',
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#006aff',
            lineHeight: 25,
            height: 25,
            fontFamily: 'inter',
            textTransform: 'uppercase'
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
            backgroundColor: '#ffffff'
        },
        horizontal: {
            flexDirection: 'row',
            justifyContent: 'space-around'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        }
    });
