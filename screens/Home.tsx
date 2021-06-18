import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Animated, ActivityIndicator, Dimensions, Image, Platform } from 'react-native';
import { TextInput } from "../components/CustomTextInput";
import Alert from '../components/Alert'
import BottomBar from '../components/BottomBar';
import CardsList from '../components/CardsList';
import { Text, TouchableOpacity, View } from '../components/Themed';
import TopBar from '../components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import Menu from '../components/Menu'
import Constants from 'expo-constants';
import Create from '../components/Create';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Update from '../components/Update';
import { uniqueNamesGenerator, colors } from 'unique-names-generator'
import { defaultCues, defaultRandomShuffleFrequency, defaultSleepInfo } from '../helpers/DefaultData'
import Walkthrough from '../components/Walkthrough';
import Channels from '../components/Channels';
import { fetchAPI } from '../graphql/FetchAPI';
import { createUser, getSubscriptions, getCues, unsubscribe, saveConfigToCloud, saveCuesToCloud, login, getCuesFromCloud, findUserById, resetPassword, updateNotificationId } from '../graphql/QueriesAndMutations';
import Discussion from '../components/Discussion';
import Subscribers from '../components/Subscribers';
import Profile from '../components/Profile';
import { validateEmail } from '../helpers/emailCheck';
import { getNextDate } from '../helpers/DateParser';
import Grades from '../components/Grades';
import Calendar from '../components/Calendar';
import Meeting from '../components/Meeting';
import * as Notifications from 'expo-notifications';
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText, LanguageSelect } from '../helpers/LanguageContext';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

  const [init, setInit] = useState(false)
  const [filterChoice, setFilterChoice] = useState('All')
  const [customCategories, setCustomCategories] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [cues, setCues] = useState<any>({})
  const [sleepFrom, setSleepFrom] = useState(new Date())
  const [sleepTo, setSleepTo] = useState(new Date())
  const [randomShuffleFrequency, setRandomShuffleFrequency] = useState('1-D')
  const [reLoading, setReLoading] = useState(true)
  const [fadeAnimation] = useState(new Animated.Value(0))
  const sheetRef: any = useRef(null);
  const [updateModalIndex, setUpdateModalIndex] = useState(0)
  const [updateModalKey, setUpdateModalKey] = useState('local')
  const [modalType, setModalType] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [channelId, setChannelId] = useState('')
  const [cueId, setCueId] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [channelCreatedBy, setChannelCreatedBy] = useState('')
  const [channelFilterChoice, setChannelFilterChoice] = useState('All')
  const [showLoginWindow, setShowLoginWindow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reopenUpdateWindow, setReopenUpdateWindow] = useState(Math.random())
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [firstOpened, setFirstOpened] = useState(new Date())
  const responseListener: any = useRef()

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true)

  const [saveDataInProgress, setSaveDataInProgress] = useState(false)

  // Login Validation
  const [emailValidError, setEmailValidError] = useState("");

  const enterValidEmailError = PreferredLanguageText('enterValidEmail')
  const alreadyUnsubscribedAlert = PreferredLanguageText('alreadyUnsubscribed')
  const checkConnectionAlert = PreferredLanguageText('checkConnection')
  const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrongAlert')
  const eraseContentLeaveChannelAlert = PreferredLanguageText('eraseContentLeaveChannel')
  const thisActionWillIrreversiblyAlert = PreferredLanguageText('thisActionWillIrreversibly')
  const eraseContentAndUnsubscrbeAlert = PreferredLanguageText('eraseContentAndUnsubscrbe')
  const weHaveEmailedPasswordAlert = PreferredLanguageText('weHaveEmailedPassword')
  const invalidCredentialsAlert = PreferredLanguageText('invalidCredentials')
  const unableToRefreshCuesAlert = PreferredLanguageText('unableToRefreshCues')
  const leaveChannelAlert = PreferredLanguageText('leaveChannel')
  const areYouSureUnsubscribeAlert = PreferredLanguageText('areYouSureUnsubscribe')
  const keepContentAndUnsubscribeAlert = PreferredLanguageText('keepContentAndUnsubscribe')

  const onDimensionsChange = useCallback(({ w, s }: any) => {
    // window.location.reload()
  }, []);

  useEffect(() => {
    if (email && !validateEmail(email.toString().toLowerCase())) {
      setEmailValidError(enterValidEmailError);
      return;
    }

    setEmailValidError("");
  }, [email]);

  //   Validate Submit on Login state change
  useEffect(() => {

    // Login
    if (
      !showForgotPassword &&
      email &&
      password &&
      !emailValidError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // 
    if (showForgotPassword && email && !emailValidError) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [
    showForgotPassword,
    email,
    password,
    emailValidError,
  ]);

  useEffect(() => {
    Dimensions.addEventListener("change", onDimensionsChange);
    return () => {
      Dimensions.removeEventListener("change", onDimensionsChange);
    };
  }, [])

  useEffect(() => {
    (
      async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
          const parsedUser: any = JSON.parse(u)
          if (parsedUser.email && parsedUser.email !== '') {
            // do nothing
          } else {
            setShowLoginWindow(true)
          }
        } else {
          setShowLoginWindow(true)
        }
      }
    )()
  }, [])

  const storeMenu = useCallback(async () => {
    try {
      await AsyncStorage.setItem('sleepFrom', sleepFrom.toString())
      await AsyncStorage.setItem('sleepTo', sleepTo.toString())
      await AsyncStorage.setItem('randomShuffleFrequency', randomShuffleFrequency)
    } catch (e) {
      // error storing
      console.log(e)
    }
  }, [randomShuffleFrequency, sleepTo, sleepFrom])

  const loadNewChannelCues = useCallback(async () => {
    let user = await AsyncStorage.getItem('user')
    const unparsedCues = await AsyncStorage.getItem('cues')
    if (user && unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
      const parsedUser = JSON.parse(user)
      const server = fetchAPI(parsedUser._id)

      try {

        const res = await server.query({
          query: getCues,
          variables: {
            userId: parsedUser._id
          }
        })

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
                return cue._id.toString().trim() === item._id.toString().trim()
              })
            }
            if (index === -1) {
              let cue: any = {}
              cue = {
                ...item
              }
              delete cue.__typename
              if (allCues[cue.channelId]) {
                allCues[cue.channelId].push(cue)
              } else {
                allCues[cue.channelId] = [cue]
              }
            } else {
              allCues[item.channelId][index].unreadThreads = item.unreadThreads ? item.unreadThreads : 0;
              allCues[item.channelId][index].status = item.status;
              if (!allCues[item.channelId][index].original) {
                allCues[item.channelId][index].original = item.cue;
              }
            }
          })
          const custom: any = {}
          setCues(allCues)
          if (allCues['local']) {
            allCues['local'].map((item: any) => {
              if (item.customCategory !== "") {
                if (!custom[item.customCategory]) {
                  custom[item.customCategory] = 0
                }
              }
            })
            const customC: any[] = []
            Object.keys(custom).map((item) => {
              customC.push(item)
            })
            customC.sort()
            setCustomCategories(customC)
          }
          const stringCues = JSON.stringify(allCues)
          await AsyncStorage.setItem("cues", stringCues)
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
          }).start();
          setReLoading(false)
        }

      } catch (err) {

        // Alert(unableToRefreshCuesAlert, checkConnectionAlert)
        const custom: any = {}
        setCues(allCues)
        if (allCues['local']) {
          allCues['local'].map((item: any) => {
            if (item.customCategory !== "") {
              if (!custom[item.customCategory]) {
                custom[item.customCategory] = 0
              }
            }
          })
          const customC: any[] = []
          Object.keys(custom).map((item) => {
            customC.push(item)
          })
          customC.sort()
          setCustomCategories(customC)
        }
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
        setReLoading(false)
      }
    } else if (unparsedCues) {
      const custom: any = {}
      const allCues = JSON.parse(unparsedCues)
      setCues(allCues)
      if (allCues['local']) {
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCustomCategories(customC)
      }
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
      setReLoading(false)
    }
  }, [])

  const unsubscribeChannel = useCallback(() => {
    Alert(
      leaveChannelAlert,
      areYouSureUnsubscribeAlert + filterChoice + "?",
      [
        {
          text: "Cancel", style: "cancel"
        },
        {
          text: keepContentAndUnsubscribeAlert, onPress: async () => {
            let user = await AsyncStorage.getItem('user')
            if (user) {
              const parsedUser = JSON.parse(user)
              const server = fetchAPI('')
              server.mutate({
                mutation: unsubscribe,
                variables: {
                  userId: parsedUser._id,
                  channelId,
                  keepContent: true
                }
              }).then(res => {
                if (res.data.subscription && res.data.subscription.unsubscribe) {
                  setChannelId('')
                  setFilterChoice('All')
                  closeModal()
                  loadData()
                } else {
                  Alert(alreadyUnsubscribedAlert)
                }
              }).catch(err => {
                Alert(somethingWentWrongAlert, checkConnectionAlert)
              })
            }
          }
        }
      ]
    );
  }, [channelId, filterChoice])

  const deleteChannel = useCallback(() => {
    Alert(
      eraseContentLeaveChannelAlert,
      thisActionWillIrreversiblyAlert + filterChoice + ".",
      [
        {
          text: "Cancel", style: "cancel"
        },
        {
          text: eraseContentAndUnsubscrbeAlert, onPress: async () => {
            let user = await AsyncStorage.getItem('user')
            if (user) {
              const parsedUser = JSON.parse(user)
              const server = fetchAPI('')
              server.mutate({
                mutation: unsubscribe,
                variables: {
                  userId: parsedUser._id,
                  channelId,
                  keepContent: false
                }
              }).then(async res => {
                if (res.data.subscription && res.data.subscription.unsubscribe) {
                  let subCues: any = {}
                  try {
                    const value = await AsyncStorage.getItem('cues')
                    if (value) {
                      subCues = JSON.parse(value)
                      if (subCues[channelId]) {
                        delete subCues[channelId]
                      }
                      const stringifiedCues = JSON.stringify(subCues)
                      await AsyncStorage.setItem('cues', stringifiedCues)
                    }
                  } catch (e) {
                    return
                  }
                  setChannelId('')
                  setFilterChoice('All')
                  closeModal()
                  loadData()
                } else {
                  Alert(alreadyUnsubscribedAlert)
                }
              }).catch(err => {
                Alert(somethingWentWrongAlert, checkConnectionAlert)
              })
            }
          }
        },
      ]
    );
  }, [channelId, filterChoice])

  const notificationScheduler = useCallback(async () => {

    try {

      // Clean out all already scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync()

      // This is the object where we are going to collect all notifications that can be scheduled
      // between two time points A and B 
      const notificationRequests: any[] = []

      // Get notification permission
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
            shouldSetBadge: true
          }
        },
        handleError: (err) => console.log(err),
        handleSuccess: (res) => loadData()
      })

      // for when user taps on a notification   
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        loadData()
      });

      // for the ones that are on shuffle
      // const shuffledCues: any[] = []
      // const unShuffledCues: any[] = []

      // choose two dates - now (A) & now + 1 month (B) for timed cues
      const A = new Date()
      const B = new Date()
      B.setMonth(B.getMonth() + 1)

      // For sleep calculations
      // let from = new Date(sleepFrom)
      // let to = new Date(sleepTo)
      // let a = from.getHours()
      // let b = to.getHours()
      // a += (from.getMinutes() / 60)
      // b += (to.getMinutes() / 60)

      const cuesArray: any[] = []
      if (cues !== {}) {
        Object.keys(cues).map((key) => {
          cues[key].map((cue: any, index: number) => {
            cuesArray.push({
              ...cue,
              key,
              index
            })
          })
        })
      }

      // First filter shuffled and unshuffled cues
      cuesArray.map((item: any) => {
        if (item.shuffle) {
          if (item.frequency === "0" || !item.endPlayAt || item.endPlayAt === '') {
            return;
          }
          // One time reminder
          // must have endplayat stored
          let trigger = new Date(item.endPlayAt)
          if (trigger > A && trigger < B) {
            // if trigger is in the next 30 days
            const { title, subtitle } = htmlStringParser(item.cue)
            notificationRequests.push({
              content: {
                title,
                subtitle,
                sound: true
              },
              trigger,
            })
          }
          // shuffledCues.push(item)
        } else {
          if (item.frequency !== "0") {
            let trigger = new Date(item.date)
            let loopCheck = 0;
            let end = B
            if (item.endPlayAt && item.endPlayAt !== '') {
              const playLimit = new Date(item.endPlayAt)
              if (playLimit < B) {
                end = playLimit
              }
            }
            while (trigger < end) {
              if (trigger < A) {
                trigger = getNextDate(item.frequency, trigger)
                continue;
              }
              loopCheck++
              if (loopCheck > 64) {
                // upto 50 valid notifications can be considered
                break;
              }
              const { title, subtitle } = htmlStringParser(item.cue)
              notificationRequests.push({
                content: {
                  title,
                  subtitle,
                  sound: true
                },
                trigger,
              })
              trigger = getNextDate(item.frequency, trigger)
            }
          } else {
            // if frequency === 0 
            // no reminder set - do nothing
          }
        }
      })

      const sortedRequests: any[] = notificationRequests.sort((a: any, b: any) => {
        return a.trigger - b.trigger
      })
      if (sortedRequests.length === 0) {
        // no requests to process
        return
      }

      let lastTriggerDate = new Date()
      lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 5)
      const iterateUpTo = sortedRequests.length >= 64 ? 63 : sortedRequests.length
      // iOS has a limit on scheduled notifications - 64 which is why we have to 
      // choose the first 64 notifications
      // After that make the user revisit the app again
      for (let i = 0; i < iterateUpTo; i++) {
        // Schedule notification
        await Notifications.scheduleNotificationAsync(sortedRequests[i])
        // The last notification in the scheduling queue has to be the one
        if (i === (iterateUpTo - 1)) {
          lastTriggerDate = new Date(sortedRequests[i].trigger)
          lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 1)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Continue receiving notifications?',
              subtitle: 'Open Cues! It\'s been a while...',
              sound: true,
            },
            trigger: lastTriggerDate
          })
        }
      }

    } catch (e) {
      console.log(e)
    }

  }, [randomShuffleFrequency, sleepFrom, sleepTo, firstOpened, cues, responseListener])

  const loadData = useCallback(async (saveData?: boolean) => {
    setReLoading(true)
    try {

      const version = 'v0.9'
      const server = fetchAPI('')
      const fO = await AsyncStorage.getItem(version)
      const first = await AsyncStorage.getItem("first")

      // LOAD FIRST OPENED
      if (fO === undefined || fO === null) {
        try {
          await AsyncStorage.clear()
          await AsyncStorage.setItem(version, 'SET')
        } catch (e) {
        }
      }

      if (first === undefined || first === null) {
        const now = new Date()
        const fOString = now.toString()
        await AsyncStorage.setItem(version, fOString)
        setFirstOpened(new Date(now))
      } else {
        setFirstOpened(new Date(first))
      }

      let u = await AsyncStorage.getItem('user')
      const f = await AsyncStorage.getItem('randomShuffleFrequency')
      const sF = await AsyncStorage.getItem('sleepFrom')
      const sT = await AsyncStorage.getItem('sleepTo')
      const sC = await AsyncStorage.getItem('cues')
      const sub = await AsyncStorage.getItem('subscriptions')

      // LOAD USER OR CREATE A NEW ONE IF NOT FOUND
      if (!u) {
        const fullName = uniqueNamesGenerator({
          dictionaries: [colors]
        }) + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();
        const displayName = fullName
        let experienceId = undefined;
        if (!Constants.manifest) {
          // Absence of the manifest means we're in bare workflow
          experienceId = Math.random().toString();
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
          })
          .catch(err => {
            // no message needed here
          })
        // OPEN LOGIN WINDOW
      } else {
        // update notification Id if its missing...
        const user = JSON.parse(u)
        if (user.notificationId === 'NOT_SET') {
          let experienceId = undefined;
          if (!Constants.manifest) {
            // Absence of the manifest means we're in bare workflow
            experienceId = user._id + Platform.OS;
          }
          const expoToken = await Notifications.getExpoPushTokenAsync({
            experienceId,
          });
          const notificationId = expoToken.data
          server.mutate({
            mutation: updateNotificationId,
            variables: {
              userId: user._id,
              notificationId
            }
          }).then(async res => {
            if (res.data && res.data.user.updateNotificationId) {
              user.notificationId = notificationId;
              const sU = JSON.stringify(user)
              await AsyncStorage.setItem('user', sU)
            }
          }).catch(err => console.log(err))
        }
      }
      // LOAD RANDOM SHUFFLE FREQUENCY
      if (f) {
        setRandomShuffleFrequency(f)
      } else {
        setRandomShuffleFrequency(defaultRandomShuffleFrequency)
        await AsyncStorage.setItem('randomShuffleFrequency', defaultRandomShuffleFrequency)
      }
      // LOAD SLEEP FROM
      if (sF) {
        setSleepFrom(new Date(sF))
      } else {
        const SF = defaultSleepInfo().from
        setSleepFrom(SF)
        const SFString = SF.toString()
        await AsyncStorage.setItem('sleepFrom', SFString)
      }
      // LOAD SLEEP TO
      if (sT) {
        setSleepTo(new Date(sT))
      } else {
        const ST = defaultSleepInfo().to
        setSleepTo(ST)
        const STString = ST.toString()
        await AsyncStorage.setItem('sleepTo', STString)
      }
      // LOAD SUBSCRIPTIONS
      if (sub) {
        const parsedSubscriptions = JSON.parse(sub)
        if (u) {
          const parsedUser = JSON.parse(u)
          server.query({
            query: getSubscriptions,
            variables: {
              userId: parsedUser._id
            }
          })
            .then(async res => {
              if (res.data.subscription.findByUserId) {
                setSubscriptions(res.data.subscription.findByUserId)
                const stringSub = JSON.stringify(res.data.subscription.findByUserId)
                await AsyncStorage.setItem('subscriptions', stringSub)
              } else {
                setSubscriptions(parsedSubscriptions)
              }
            })
            .catch(res => {
              // no message needed here
              // No internet connection, use existing subscription categories
              setSubscriptions(parsedSubscriptions)
            })
        } else {
          // no user, 
          setSubscriptions(parsedSubscriptions)
        }
      } else {
        const stringSub = JSON.stringify(subscriptions)
        await AsyncStorage.setItem('subscriptions', stringSub)
      }
      // LOAD CUES
      if (sC) {
        await loadNewChannelCues()
      } else {
        const custom: any = {}
        let allCues: any = {}
        allCues['local'] = [...defaultCues]
        const stringSC = JSON.stringify(allCues)
        await AsyncStorage.setItem('cues', stringSC)
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCues(allCues)
        setCustomCategories(customC)
        // START ANIMATION
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      }
      // OPEN WALKTHROUGH IF FIRST TIME LOAD
      if (!init && Dimensions.get('window').width >= 1024) {
        openModal('Create')
      }
      // HANDLE PROFILE
      if (u) {
        const parsedUser = JSON.parse(u)
        if (parsedUser.email) {
          if (init || saveData) {
            await saveDataInCloud()
          } else {
            await loadDataFromCloud()
          }
        }
      }
      // INITIALISED FIRST TIME
      if (!init) {
        setInit(true)
      }
      // LOADED
      if (!sC) {
        setReLoading(false)
      }

      await notificationScheduler()

    } catch (e) {
      console.log(e)
    }
  }, [fadeAnimation, init])

  // Move to profile page
  const handleLogin = useCallback(() => {
    const server = fetchAPI('')
    server.query({
      query: login,
      variables: {
        email: email.toLowerCase(),
        password
      }
    }).then(async (r: any) => {

      const oldUser = await AsyncStorage.getItem("user")
      if (oldUser) {
        const oldUserObj = JSON.parse(oldUser)
        server.mutate({
          mutation: updateNotificationId,
          variables: {
            userId: oldUserObj._id,
            notificationId: 'NOT_SET'
          }
        })
      }

      if (r.data.user.login.user && !r.data.user.login.error) {
        const u = r.data.user.login.user
        if (u.__typename) {
          delete u.__typename
        }
        const sU = JSON.stringify(u)
        await AsyncStorage.setItem('user', sU)
        setShowLoginWindow(false)
        loadDataFromCloud()
      } else {
        const { error } = r.data.user.login;
        Alert(error);
      }
    }).catch(e => console.log(e))
  }, [email, password])

  const loadDataFromCloud = useCallback(async () => {
    const u = await AsyncStorage.getItem('user')
    if (u) {
      const user = JSON.parse(u)
      const server = fetchAPI(user._id)
      // Get User info
      server.query({
        query: findUserById,
        variables: {
          id: user._id
        }
      }).then(async (res) => {
        const u = res.data.user.findById;
        if (u) {
          // SAVE USER
          setRandomShuffleFrequency(u.randomShuffleFrequency)
          setSleepFrom(new Date(u.sleepFrom))
          setSleepTo(new Date(u.sleepTo))
          await AsyncStorage.setItem('cueDraft', u.currentDraft)
          delete u.currentDraft;
          delete u.__typename
          const sU = JSON.stringify(u)
          await AsyncStorage.setItem('user', sU)
          // UPDATE NOTIFICAITON
          let experienceId = undefined;
          if (!Constants.manifest) {
            // Absence of the manifest means we're in bare workflow
            experienceId = u._id + Platform.OS;
          }
          const expoToken = await Notifications.getExpoPushTokenAsync({
            experienceId,
          });
          const notificationId = expoToken.data
          // UPDATE NOTIFICATION IDS AFTER LOGGING IN
          if (u.notificationId && !u.notificationId.includes(notificationId)) {
            let experienceId = undefined;
            if (!Constants.manifest) {
              // Absence of the manifest means we're in bare workflow
              experienceId = u._id + Platform.OS;
            }
            const expoToken = await Notifications.getExpoPushTokenAsync({
              experienceId,
            });
            const notificationId = expoToken.data
            server.mutate({
              mutation: updateNotificationId,
              variables: {
                userId: user._id,
                notificationId: u.notificationId === 'NOT_SET' ? notificationId : (u.notificationId + '-BREAK-' + notificationId)
              }
            })
          }
        }
      }).catch(err => console.log(err))
      // Get user cues
      server.query({
        query: getCuesFromCloud,
        variables: {
          userId: user._id
        }
      }).then(async (res) => {
        if (res.data.cue.getCuesFromCloud) {
          const allCues: any = {}
          res.data.cue.getCuesFromCloud.map((cue: any) => {
            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : "local"
            delete cue.__typename
            if (allCues[channelId]) {
              allCues[channelId].push({ ...cue })
            } else {
              allCues[channelId] = [{ ...cue }]
            }
          })
          const custom: any = {}
          allCues['local'].map((item: any) => {
            if (item.customCategory !== "") {
              if (!custom[item.customCategory]) {
                custom[item.customCategory] = 0
              }
            }
          })
          const customC: any[] = []
          Object.keys(custom).map((item) => {
            customC.push(item)
          })
          customC.sort()
          setCues(allCues)
          setCustomCategories(customC)
          const stringCues = JSON.stringify(allCues)
          await AsyncStorage.setItem('cues', stringCues)
        }
      }).catch(err => console.log(err))
      // Get subscription information
      server.query({
        query: getSubscriptions,
        variables: {
          userId: user._id
        }
      })
        .then(async res => {
          if (res.data.subscription.findByUserId) {
            setSubscriptions(res.data.subscription.findByUserId)
            const stringSub = JSON.stringify(res.data.subscription.findByUserId)
            await AsyncStorage.setItem('subscriptions', stringSub)
          }
        })
        .catch(err => console.log(err))
    }
  }, [])

  const saveDataInCloud = useCallback(async () => {

    if (saveDataInProgress) return;

    setSaveDataInProgress(true);

    const draft = await AsyncStorage.getItem('cueDraft')
    const f: any = await AsyncStorage.getItem('randomShuffleFrequency')
    const sF: any = await AsyncStorage.getItem('sleepFrom')
    const sT: any = await AsyncStorage.getItem('sleepTo')
    const u: any = await AsyncStorage.getItem('user')
    const parsedUser = JSON.parse(u)
    const sC: any = await AsyncStorage.getItem('cues')
    const parsedCues = JSON.parse(sC)
    const sub: any = await AsyncStorage.getItem('subscriptions')
    const parsedSubscriptions = JSON.parse(sub)

    const allCuesToSave: any[] = []
    const allCues: any[] = []

    if (parsedCues !== {}) {
      Object.keys(parsedCues).map((key) => {
        parsedCues[key].map((cue: any) => {
          const cueInput = {
            ...cue,
            _id: cue._id.toString(),
            color: cue.color.toString(),
            date: (new Date(cue.date)).toISOString(),
            gradeWeight: cue.submission ? cue.gradeWeight.toString() : undefined,
            endPlayAt: cue.endPlayAt && cue.endPlayAt !== '' ? (new Date(cue.endPlayAt)).toISOString() : '',
          }
          allCuesToSave.push({ ...cueInput })
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
          delete cueInput.unreadThreads;
          // delete cueInput.createdBy;
          delete cueInput.original;
          delete cueInput.status;
          delete cueInput.channelName;
          delete cueInput.__typename
          allCues.push(cueInput)
        })
      })
    }

    const server = fetchAPI('')
    // UPDATE CUE CONFIG
    server.mutate({
      mutation: saveConfigToCloud,
      variables: {
        randomShuffleFrequency: f,
        sleepFrom: sF,
        sleepTo: sT,
        currentDraft: draft ? draft : '',
        subscriptions: parsedSubscriptions,
        userId: parsedUser._id
      }
    }).then(res => {
    }).catch(err => console.log(err))

    // UPDATE CUES
    server.mutate({
      mutation: saveCuesToCloud,
      variables: {
        userId: parsedUser._id,
        cues: allCues
      }
    }).then(async res => {
      if (res.data.cue.saveCuesToCloud) {
        const newIds: any = res.data.cue.saveCuesToCloud;
        const updatedCuesArray: any[] = []
        allCuesToSave.map((c: any) => {
          const id = c._id;
          const updatedItem = newIds.find((i: any) => {
            return id.toString().trim() === i.oldId.toString().trim()
          })
          if (updatedItem) {
            updatedCuesArray.push({
              ...c,
              _id: updatedItem.newId
            })
          } else {
            updatedCuesArray.push(c)
          }
        })

        const updatedCuesObj: any = {};
        updatedCuesArray.map((c: any) => {
          if (c.channelId && c.channelId !== '') {
            if (updatedCuesObj[c.channelId]) {
              updatedCuesObj[c.channelId].push(c)
            } else {
              updatedCuesObj[c.channelId] = [c]
            }
          } else {
            if (updatedCuesObj["local"]) {
              updatedCuesObj["local"].push(c)
            } else {
              updatedCuesObj["local"] = [c]
            }
          }
        });
        // (async () => {
        const updatedCues = JSON.stringify(updatedCuesObj)
        await AsyncStorage.setItem('cues', updatedCues)
        // })();
        if (newIds.length !== 0) {
          // setCues(updatedCuesObj)
          updateCuesHelper(updatedCuesObj)
          // setReopenUpdateWindow(Math.random())
        }
      }

      setSaveDataInProgress(false)

    }).catch(err => console.log(err))
  }, [cues, setCues])

  const updateCuesHelper = useCallback((obj: any) => {
    setCues(obj)
  }, [setCues, cues])

  useEffect(() => {
    // Called when component is loaded
    loadData()
  }, [])

  const handleFilterChange = useCallback((choice) => {
    setPageNumber(0)
    fadeAnimation.setValue(0)
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start();
    setFilterChoice(choice)
  }, [fadeAnimation])

  const openModal = useCallback((type) => {
    setModalType(type)
  }, [sheetRef, cues])

  const openUpdate = useCallback((key, index, pageNumber, _id, by, channId) => {
    setUpdateModalKey(key)
    setUpdateModalIndex(index)
    setPageNumber(pageNumber)
    setChannelId(channId)
    setCreatedBy(by)
    setCueId(_id)
    openModal('Update')
  }, [])

  const reloadCueListAfterUpdate = useCallback(async () => {
    const unparsedCues = await AsyncStorage.getItem('cues')
    const u = await AsyncStorage.getItem('user')
    if (unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
      const custom: any = {}
      setCues(allCues)
      if (allCues['local']) {
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCustomCategories(customC)
      }
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    }
    if (u) {
      const user = JSON.parse(u)
      if (user.email) {
        await saveDataInCloud()
      }
    }
  }, [])

  const forgotPassword = useCallback(() => {

    if (email === '' || !validateEmail(email)) {
      Alert('Enter a valid email.')
      return;
    }

    const server = fetchAPI('')
    server.mutate({
      mutation: resetPassword,
      variables: {
        email
      }
    }).then(res => {
      if (res.data && res.data.user.resetPassword) {
        Alert(weHaveEmailedPasswordAlert)
        setShowForgotPassword(false)
      } else {
        Alert(invalidCredentialsAlert);
      }
    })
  }, [email])

  const closeModal = useCallback(() => {
    setCueId('')
    setModalType('')
    setCreatedBy('')
    setChannelFilterChoice('All')
    if (modalType === 'Create' || modalType === 'Update') {
      fadeAnimation.setValue(0)
      if (modalType === 'Update' && filterChoice === 'All-Channels') {
        setChannelId('')
      }
    }
    loadData(true)
  }, [sheetRef, fadeAnimation, modalType, filterChoice])

  const modalContent = modalType === 'Menu' ? <Menu
    sleepFrom={sleepFrom}
    sleepTo={sleepTo}
    randomShuffleFrequency={randomShuffleFrequency}
    setRandomShuffleFrequency={(option: any) => {
      setRandomShuffleFrequency(option)
      storeMenu()
    }}
    setSleepFrom={(date: any) => {
      setSleepFrom(date)
      storeMenu()
    }}
    setSleepTo={(date: any) => {
      setSleepTo(date)
      storeMenu()
    }}
  /> :
    (modalType === 'Create' ? <Create
      key={JSON.stringify(customCategories)}
      customCategories={customCategories}
      closeModal={() => {
        closeModal()
        setPageNumber(0)
      }}
    />
      :
      (modalType === 'Update' ? <Update
        key={cueId.toString()}
        customCategories={customCategories}
        cue={cues[updateModalKey][updateModalIndex]}
        cueIndex={updateModalIndex}
        cueKey={updateModalKey}
        closeModal={() => closeModal()}
        cueId={cueId}
        createdBy={createdBy}
        channelId={channelId}
        filterChoice={filterChoice}
        channelCreatedBy={channelCreatedBy}
        reloadCueListAfterUpdate={() => reloadCueListAfterUpdate()}
        reopenUpdateWindow={reopenUpdateWindow}
      />
        :
        (modalType === 'Walkthrough' ? <Walkthrough
        />
          : (
            modalType === 'Channels' ? <Channels
              closeModal={() => closeModal()}
            /> : (
              modalType === 'Discussion' ? <Discussion
                closeModal={() => closeModal()}
                channelId={channelId}
                filterChoice={filterChoice}
                channelCreatedBy={channelCreatedBy}
              />
                : (
                  modalType === 'Subscribers' ? <Subscribers
                    closeModal={() => closeModal()}
                    channelId={channelId}
                    channelCreatedBy={channelCreatedBy}
                    filterChoice={filterChoice}
                  /> :
                    (
                      modalType === 'Profile' ? <Profile
                        closeModal={() => closeModal()}
                        saveDataInCloud={async () => await saveDataInCloud()}
                        reOpenProfile={() => {
                          setModalType('')
                          openModal('Profile')
                        }}
                        reloadData={() => {
                          loadData()
                          openModal('Walkthrough')
                        }}
                      /> :
                        (
                          modalType === 'Grades' ? <Grades
                            closeModal={() => closeModal()}
                            channelId={channelId}
                            channelCreatedBy={channelCreatedBy}
                            filterChoice={filterChoice}
                          />
                            : (
                              modalType === 'Calendar' ? <Calendar />
                                : (
                                  modalType === 'Meeting' ? <Meeting
                                    channelId={channelId}
                                    channelName={filterChoice}
                                    channelCreatedBy={channelCreatedBy}
                                  />
                                    : null
                                )
                            )
                        )
                    )
                )
            )
          )
        )
      )
    )

  const cuesArray: any[] = []
  let filteredCues: any[] = []
  if (cues !== {}) {
    Object.keys(cues).map((key) => {
      cues[key].map((cue: any, index: number) => {
        cuesArray.push({
          ...cue,
          key,
          index
        })
      })
    })
  }
  const cuesCopy = cuesArray.sort((a: any, b: any) => {
    if (a.color < b.color) {
      return -1;
    }
    if (a.color > b.color) {
      return 1;
    }
    return 0;
  })
  if (filterChoice === 'All') {
    filteredCues = cuesCopy.filter((item) => {
      return !item.channelId || item.channelId === ''
    })
  } else if (filterChoice === 'All-Channels') {
    filteredCues = cuesCopy.filter((item) => {
      return item.channelId && item.channeId !== ''
    })
  } else if (channelId !== '') {
    filteredCues = cuesCopy.filter((item) => {
      return item.channelName === filterChoice
    })
  } else {
    filteredCues = cuesCopy.filter((item) => {
      return item.customCategory === filterChoice
    })
  }

  if (!init) {
    return null;
  }

  const alertText = PreferredLanguageText('savedLocally');

  return (
    <View style={styles.container}>
      {
        showLoginWindow ? <View style={{
          width: '100%',
          height: Dimensions.get('window').height,
          flex: 1,
          position: 'absolute',
          zIndex: 50,
          backgroundColor: 'rgba(16,16,16, 0.7)'
        }}
        >
          <View style={{
            position: 'absolute',
            zIndex: 525,
            display: 'flex',
            alignSelf: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            width: Dimensions.get('window').width < 768 ? '100%' : 480,
            height: Dimensions.get('window').width < 768 ? '100%' : 'auto',
            borderRadius: Dimensions.get('window').width < 768 ? 0 : 20,
            marginTop: Dimensions.get('window').width < 768 ? 0 : 75,
            padding: 40,
            paddingTop: 0
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              display: 'flex',
              paddingTop: 50,
              paddingBottom: 30,
              backgroundColor: 'white'
            }}>
              <Image
                source={require('../components/default-images/cues-logo-black-exclamation-hidden.jpg')}
                style={{
                  width: Dimensions.get('window').height * 0.16 * 0.53456,
                  height: Dimensions.get('window').height * 0.16 * 0.2
                }}
                resizeMode={'contain'}
              />
            </View>
            <Text style={{ fontSize: 30, color: '#202025', fontFamily: 'inter', paddingBottom: 15, maxWidth: 400, textAlign: 'center' }}>
              {
                showForgotPassword ? '' : PreferredLanguageText('login')
              }
            </Text>
            <Text style={{ fontSize: 18, color: '#a2a2aa', fontFamily: 'overpass', paddingBottom: 25, maxWidth: 400, textAlign: 'center' }}>
              {
                showForgotPassword ? PreferredLanguageText('temporaryPassword') : PreferredLanguageText('continueLeftOff')
              }
            </Text>
            <View style={{
              maxWidth: 400,
              backgroundColor: 'white',
              justifyContent: 'center',
              paddingTop: 25
            }}>
              <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
                {PreferredLanguageText('email')}
              </Text>
              <TextInput
                value={email}
                placeholder={''}
                onChangeText={(val: any) => setEmail(val)}
                placeholderTextColor={'#a2a2aa'}
                errorText={emailValidError}
              />
              {
                showForgotPassword ? null :
                  <View style={{
                    backgroundColor: 'white',
                  }}>
                    <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 5 }}>
                      {PreferredLanguageText('password')}
                    </Text>
                    <TextInput
                      secureTextEntry={true}
                      value={password}
                      placeholder={''}
                      onChangeText={(val: any) => setPassword(val)}
                      placeholderTextColor={'#a2a2aa'}
                    />
                  </View>
              }
              <View
                style={{
                  // flex: 1,
                  backgroundColor: 'white',
                  justifyContent: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: 10,
                  marginTop: 20,
                }}>
                <TouchableOpacity
                  disabled={isSubmitDisabled}
                  onPress={() => {
                    if (showForgotPassword) {
                      forgotPassword()
                    } else {
                      handleLogin()
                    }
                  }}
                  style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                  }}>
                  <Text style={{
                    textAlign: 'center',
                    lineHeight: 35,
                    color: 'white',
                    fontSize: 12,
                    backgroundColor: '#3B64F8',
                    paddingHorizontal: 25,
                    overflow: 'hidden',
                    fontFamily: 'inter',
                    height: 35,
                    width: 180,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                  }}>
                    {
                      showForgotPassword ? PreferredLanguageText('reset') : PreferredLanguageText('login')
                    }
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowForgotPassword(!showForgotPassword)}
                  style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                  }}>
                  <Text style={{
                    textAlign: 'center',
                    lineHeight: 35,
                    color: '#202025',
                    fontSize: 12,
                    backgroundColor: '#f4f4f6',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    overflow: 'hidden',
                    height: 35,
                    width: 180,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                  }}>
                    {
                      showForgotPassword ? PreferredLanguageText('back') : PreferredLanguageText('forgotPassword')
                    }
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowLoginWindow(false)
                    Alert(alertText);
                  }}
                  style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    marginBottom: 30,
                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                  }}>
                  <Text style={{
                    textAlign: 'center',
                    lineHeight: 35,
                    color: '#202025',
                    fontSize: 12,
                    backgroundColor: '#f4f4f6',
                    overflow: 'hidden',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 35,
                    width: 180,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                  }}>
                    {PreferredLanguageText('skipForNow')}
                  </Text>
                </TouchableOpacity>
                <LanguageSelect />
              </View>
            </View>
          </View>
        </View> : null
      }
      <View style={{
        width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3,
        height: Dimensions.get('window').height,
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRightColor: '#f4f4f6',
        borderRightWidth: Dimensions.get('window').width < 1024 ? 0 : 2
      }}>
        <TopBar
          key={JSON.stringify(channelFilterChoice) + JSON.stringify(filteredCues) + JSON.stringify(modalType) + JSON.stringify(filterChoice)}
          openChannels={() => openModal('Channels')}
          cues={filteredCues}
          filterChoice={filterChoice}
          channelId={channelId}
          channelFilterChoice={channelFilterChoice}
          channelCreatedBy={channelCreatedBy}
          loadData={() => loadData()}
          setChannelFilterChoice={(choice: any) => setChannelFilterChoice(choice)}
          openDiscussion={() => openModal('Discussion')}
          openSubscribers={() => openModal('Subscribers')}
          openGrades={() => openModal('Grades')}
          unsubscribe={() => unsubscribeChannel()}
          openWalkthrough={() => openModal('Walkthrough')}
          deleteChannel={() => deleteChannel()}
          openCalendar={() => openModal('Calendar')}
          openMeeting={() => openModal('Meeting')}
        />
        {
          reLoading ? <View style={[styles.activityContainer, styles.horizontal]}>
            <ActivityIndicator color={'#a2a2aa'} />
          </View>
            : <View style={[styles.activityContainer, styles.horizontal]}>
              <CardsList
                pageNumber={pageNumber}
                fadeAnimation={fadeAnimation}
                key={JSON.stringify(filterChoice) + JSON.stringify(channelId) + JSON.stringify(filteredCues) + JSON.stringify(channelFilterChoice)}
                cues={filteredCues}
                channelId={channelId}
                createdBy={channelCreatedBy}
                filterChoice={filterChoice}
                openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) => openUpdate(index, key, pageNumber, _id, by, cId)}
                channelFilterChoice={channelFilterChoice}
              />
            </View>
        }
        <BottomBar
          openCreate={() => openModal('Create')}
          openChannels={() => openModal('Channels')}
          openProfile={() => openModal('Profile')}
          filterChoice={filterChoice}
          handleFilterChange={(choice: any) => handleFilterChange(choice)}
          key={Math.random()}
          customCategories={customCategories}
          subscriptions={subscriptions}
          setChannelId={(id: string) => setChannelId(id)}
          setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
          setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
        />
      </View >
      {
        modalType === '' ? <View
          style={{
            width: Dimensions.get('window').width < 1024 ? 0 : Dimensions.get('window').width * 0.7,
            height: Dimensions.get('window').height,
            // paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 30,
            paddingTop: 0,
            // backgroundColor: '#f4f4f6',
            backgroundColor: '#fff',
            position: Dimensions.get('window').width < 1024 ? 'absolute' : 'relative'
          }}
        /> :
          <View style={{
            width: Dimensions.get('window').width < 1024 ? '100%' : Dimensions.get('window').width * 0.7,
            height: Dimensions.get('window').height,
            // paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 30,
            paddingTop: 0,
            // backgroundColor: '#f4f4f6',
            backgroundColor: '#fff',
            position: Dimensions.get('window').width < 1024 ? 'absolute' : 'relative'
          }}>
            {
              Dimensions.get('window').width < 1024 ?
                <View style={{ backgroundColor: '#fff', height: 30 }} /> :
                <View style={{ backgroundColor: '#fff', height: 0 }} />
            }
            {modalContent}
            {
              Dimensions.get('window').width < 1024 ?
                <TouchableOpacity
                  onPress={() => closeModal()}
                  style={{ height: 45, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#a2a2aa', width: '100%' }}>
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, lineHeight: 15, marginTop: 12, color: '#a2a2aa' }}>
                    <Ionicons name='chevron-back-outline' size={15} /> {PreferredLanguageText('back')}
                  </Text>
                </TouchableOpacity> :
                <View style={{ backgroundColor: '#fff', height: 0 }} />
            }
          </View>
      }
    </View>
  );
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  activityContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#f4f4f6',
    height: Platform.OS === "ios" ? '70%' : '70%',
    width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : (Dimensions.get('window').width * 0.3) - 5,
    justifyContent: "center",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around"
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