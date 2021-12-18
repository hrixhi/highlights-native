import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Linking
} from "react-native";
import { TextInput } from "./CustomTextInput";
import Alert from "./Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  getChannels,
  getEvents,
  createDateV1, editDateV1, deleteDateV1, meetingRequest, markAttendance, getActivity, markActivityAsRead
} from "../graphql/QueriesAndMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { htmlStringParser } from "../helpers/HTMLParser";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { Picker } from "@react-native-picker/picker";

import { Agenda } from "react-native-calendars";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import { eventFrequencyOptions } from "../helpers/FrequencyOptions";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';


const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (
  props: any
) => {
  const [modalAnimation] = useState(new Animated.Value(1));

  const [title, setTitle] = useState("");
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60));
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [items, setItems] = useState<any>({});
  const [channels, setChannels] = useState<any[]>([]);
  const [channelId, setChannelId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(
    moment(new Date()).format("MMMM YYYY")
  );

  // v1
  const current = new Date();
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("1-W");
  const [repeatTill, setRepeatTill] = useState(new Date());
  const [isMeeting, setIsMeeting] = useState(false);
  const [recordMeeting, setRecordMeeting] = useState(false);
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  // Stores channel name of event being modified
  const [editChannelName, setEditChannelName] = useState("")
  const [isEditingEvents, setIsEditingEvents] = useState(false);
  const [isDeletingEvents, setIsDeletingEvents] = useState(false);
  const [userId, setUserId] = useState('');
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [userZoomInfo, setUserZoomInfo] = useState<any>('');
  const [unreadCount, setUnreadCount] = useState<any>(0);

  // FILTERS
  const [showFilter, setShowFilter] = useState(false);
  const [eventChannels, setEventChannels] = useState<any[]>([]);
  const [filterChannels, setFilterChannels] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filterByLectures, setFilterByLectures] = useState(false);
  const [filterByChannel, setFilterByChannel] = useState("All");

  const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
  const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);

  const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
  const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

  const [showRepeatTillTimeAndroid, setShowRepeatTillTimeAndroid] = useState(false);
  const [showRepeatTillDateAndroid, setShowRepeatTillDateAndroid] = useState(false);

  const [activeTab, setActiveTab] = useState('agenda');

  const onUpdateSelectedDate = (date: any) => {
    setCurrentMonth(moment(date.dateString).format("MMMM YYYY"));
  };

  const loadChannels = useCallback(async () => {
    const uString: any = await AsyncStorage.getItem("user");
    if (uString) {
      const user = JSON.parse(uString);
      const server = fetchAPI("");
      server
        .query({
          query: getChannels,
          variables: {
            userId: user._id
          }
        })
        .then(res => {
          if (res.data.channel.findByUserId) {
            setChannels(res.data.channel.findByUserId);
          }
        })
        .catch(err => { });
    }
  }, []);

  useEffect(() => {

    let total = [...allItems];

    // Filter the meetings first 
    if (filterByLectures) {
      total = total.filter((e: any) => e.meeting)
    }

    let filterByChannels = [];

    if (filterByChannel === "All") {
      filterByChannels = total;
    } else {
      const all = [...total];
      const filter = all.filter((e: any) => filterByChannel === e.channelName);

      filterByChannels = filter;
    }

    // Now we have the filtered events so we need to put them in an object for Calendar
    const loadedItems: { [key: string]: any } = {};

    filterByChannels.map((item: any) => {
      const strTime = timeToString(item.start);

      if (!loadedItems[strTime]) {
        loadedItems[strTime] = [item];
      } else {
        const existingItems = loadedItems[strTime];
        loadedItems[strTime] = [...existingItems, item];
      }

    })

    // Selected date (current date) should never be empty, otherwise Calendar will keep loading
    const todayStr = timeToString(new Date());

    if (!loadedItems[todayStr]) {
      loadedItems[todayStr] = [];
    }

    setItems(loadedItems);

  }, [filterByChannel, filterByLectures])

  /**
     * @description Fetch user activity
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);

                setUserId(user._id);
                if (user.zoomInfo) {
                    setUserZoomInfo(user.zoomInfo);
                }
                const server = fetchAPI(user._id);
                server
                    .query({
                        query: getActivity,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.activity.getActivity) {
                            const tempActivity = res.data.activity.getActivity.reverse();
                            let unread = 0;
                            tempActivity.map((act: any) => {
                                if (act.status === 'unread') {
                                    unread++;
                                }
                            });
                            setUnreadCount(unread);
                            setActivity(tempActivity);
                            setAllActivity(tempActivity);
                        }
                    });
            }
        })();
    }, []);


  useEffect(() => {
    if (title !== "" && end > start) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [title, start, end]);

  // use effect for edit events
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.originalTitle);
      setDescription(editEvent.description)
      setStart(new Date(editEvent.start))
      setEnd(new Date(editEvent.end))
      setEditChannelName(editEvent.channelName)

      if (editEvent.dateId !== "channel" && editEvent.createdBy) {
        setIsMeeting(true)
        if (editEvent.recordMeeting) {
          setRecordMeeting(true)
        }
      }

    } else {

      setTitle("");
      setDescription("")
      const current = new Date()
      setStart(new Date())
      setEnd(new Date(current.getTime() + 1000 * 60 * 60))
      setEditChannelName("")
    }
  }, [editEvent])

  	/**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
	}
	
  const renderActivity = () => {
	  return (<View
		style={{
			width: '100%',
			backgroundColor: 'white'
		}}>
      <InsetShadow
                            shadowColor={'#000'}
                            shadowOffset={2}
                            shadowOpacity={0.12}
                            shadowRadius={10}
                            elevation={500000}
                            containerStyle={{
                                height: 'auto'
                            }}>
		<ScrollView
			horizontal={false}
			showsVerticalScrollIndicator={true}
		>
			{activity.map((act: any, index) => {
				const { cueId, channelId, createdBy, target, threadId } = act;

				if (props.activityChannelId !== '') {
					if (props.activityChannelId !== act.channelId) {
						return;
					}
				}

				const date = new Date(act.date);

				if (props.filterStart && props.filterEnd) {
					const start = new Date(props.filterStart);
					if (date < start) {
						return;
					}
					const end = new Date(props.filterEnd);
					if (date > end) {
						return;
					}
				}

				return (
					<TouchableOpacity
						onPress={async () => {
							const uString: any = await AsyncStorage.getItem(
								'user'
							);
							if (uString) {
								const user = JSON.parse(uString);
								const server = fetchAPI('');
								server.mutate({
									mutation: markActivityAsRead,
									variables: {
										activityId: act._id,
										userId: user._id,
										markAllRead: false
									}
								});
							}

							// Opens the cue from the activity
							if (
								cueId !== null &&
								cueId !== '' &&
								channelId !== '' &&
								createdBy !== '' &&
								target === 'CUE'
							) {
								props.openCueFromCalendar(
									channelId,
									cueId,
									createdBy
								);
							}

							if (target === 'DISCUSSION') {
								if (threadId && threadId !== '') {
									await AsyncStorage.setItem(
										'openThread',
										threadId
									);
								}

								props.openDiscussion(channelId);
							}

							if (
								target === 'CHANNEL_SUBSCRIBED' ||
								target === 'CHANNEL_MODERATOR_ADDED' ||
								target === 'CHANNEL_MODERATOR_REMOVED'
							) {
								props.openChannel(channelId);
							}

							if (target === 'Q&A') {
								if (threadId && threadId !== '') {
									await AsyncStorage.setItem(
										'openThread',
										threadId
									);
								}

								props.openQA(channelId, cueId, createdBy);
							}
						}}
						style={{
							flexDirection: 'row',
							borderColor: '#efefef',
							borderBottomWidth:
								index === activity.length - 1 ? 0 : 1,
							width: '100%',
							paddingVertical: 5,
							backgroundColor: 'white',
              height: 90,
              borderLeftWidth: 3,
							borderLeftColor: act.colorCode
              
						}}>
						<View
							style={{
								flex: 1,
								backgroundColor: 'white',
								paddingLeft: Dimensions.get('window').width < 768 ? 10 : 20,
							}}>
							<Text
								style={{
									fontSize: 15,
									padding: 5,
									fontFamily: 'inter',
									marginTop: 5
								}}
								ellipsizeMode="tail">
								{act.channelName}
							</Text>
							<Text
								style={{
									fontSize: 12,
									padding: 5,
									lineHeight: 18,
									fontWeight: 'bold'
								}}
								numberOfLines={2}
								ellipsizeMode="tail">
								{act.title} - {act.subtitle}
							</Text>
						</View>
						<View
							style={{
								backgroundColor: 'white',
								padding: 0,
								flexDirection: 'row',
								alignSelf: 'center',
								paddingRight: 10,
								alignItems: 'center'
							}}>
							<Text
								style={{
									fontSize: 13,
									padding: 5,
									lineHeight: 13
								}}
								ellipsizeMode="tail">
								{act.status === 'unread' ? (
									<Ionicons
										name="alert-circle-outline"
										color="#f94144"
										size={18}
									/>
								) : null}
							</Text>
							<Text
								style={{
									fontSize: 12,
									padding: 5,
									lineHeight: 13,
									fontWeight: 'bold'
								}}
								ellipsizeMode="tail">
								{emailTimeDisplay(act.date)}
							</Text>
							<Text
								style={{
									fontSize: 13,
									padding: 5,
									lineHeight: 13
								}}
								ellipsizeMode="tail">
								<Ionicons
									name="chevron-forward-outline"
									size={18}
									color="#006AFF"
								/>
							</Text>
						</View>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
    </InsetShadow>
	</View>)
  }

//   const onDateClick = useCallback((title, date, dateId) => {
//     Alert("Delete " + title + "?", date, [
//       {
//         text: "Cancel",
//         style: "cancel"
//       },
//       {
//         text: "Delete",
//         onPress: async () => {
//           const server = fetchAPI("");
//           server
//             .mutate({
//               mutation: deleteDate,
//               variables: {
//                 dateId
//               }
//             })
//             .then(res => {
//               if (res.data && res.data.date.delete) {
//                 Alert("Event Deleted!");
//                 loadEvents();
//               }
//             });
//         }
//       }
//     ]);
//   }, []);

  const handleCreate = useCallback(async () => {
    if (start < new Date()) {
      Alert("Event must be set in the future.");
      return;
    } else if (title === "") {
      Alert("New Event/Lecture cannot be empty.");
      return;
    } else if (start > end) {
      Alert("End time must be greater than start time.");
      return
    }
    if (recurring) {
      if (start > repeatTill) {
        Alert("Repeat until must be set in the future.");
        return
      }
    }

    setIsCreatingEvents(true);

    const meeting = channelId && channelId !== "" ? isMeeting : false;

    const freq = recurring ? frequency : ""

    const repeat = recurring ? repeatTill.toUTCString() : ""

    const u = await AsyncStorage.getItem("user");
    if (u) {
      const user = JSON.parse(u);

      const server = fetchAPI("");
      server
        .mutate({
          mutation: createDateV1,
          variables: {
            title,
            userId: user._id,
            start: start.toUTCString(),
            end: end.toUTCString(),
            channelId,
            meeting,
            description,
            recordMeeting,
            frequency: freq,
            repeatTill: repeat
          }
        })
        .then(res => {
          loadEvents();
          setTitle("");
          setRepeatTill(new Date())
          setIsMeeting(false);
          setDescription("");
          setFrequency("1-W");
          setRecurring(false);
          setRecordMeeting(false);
          setIsCreatingEvents(false);
          setShowAddEvent(false)
        })
        .catch(err => {
          setIsCreatingEvents(false);
          console.log(err)
        });
    }
  }, [title, start, end, channelId, recordMeeting, isMeeting, repeatTill, frequency, recurring, isSubmitDisabled, isCreatingEvents]);


  const handleEdit = useCallback(async () => {

    setIsEditingEvents(true);

    const server = fetchAPI("");
    server
      .mutate({
        mutation: editDateV1,
        variables: {
          id: editEvent.eventId,
          title,
          start: start.toUTCString(),
          end: end.toUTCString(),
          description,
          recordMeeting,
        }
      })
      .then(res => {
        loadEvents();
        setTitle("");
        setRepeatTill(new Date())
        setIsMeeting(false);
        setDescription("");
        setFrequency("1-W");
        setRecurring(false);
        setRecordMeeting(false);
        setIsEditingEvents(false);
        setEditEvent(null)
        setShowAddEvent(false)

      })
      .catch(err => {
        setIsEditingEvents(false);
        console.log(err)
      });

  }, [editEvent, title, start, end, description, isMeeting, recordMeeting]);

  const handleDelete = useCallback(async (deleteAll: boolean) => {

    const { eventId, recurringId } = editEvent;

    setIsDeletingEvents(true);

    const server = fetchAPI("");
    server
      .mutate({
        mutation: deleteDateV1,
        variables: {
          id: !deleteAll ? eventId : recurringId,
          deleteAll
        }
      })
      .then(res => {
        const updated = new Date();
        loadEvents();
        setTitle("");
        setRepeatTill(new Date())
        setIsMeeting(false);
        setDescription("");
        setFrequency("1-W");
        setRecurring(false);
        setRecordMeeting(false);
        setIsDeletingEvents(false);
        setEditEvent(null)
        setShowAddEvent(false)
      })
      .catch(err => {
        setIsDeletingEvents(false);
        console.log(err)
      });

  }, [title, start, end, description, isMeeting, recordMeeting]);

  const loadEvents = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    let parsedUser: any = {};
    if (u) {
      parsedUser = JSON.parse(u);
    } else {
      return;
    }

    const server = fetchAPI("");
    server
      .query({
        query: getEvents,
        variables: {
          userId: parsedUser._id
        }
      })
      .then(res => {
        if (res.data.date && res.data.date.getCalendar) {

          const channelsSet = new Set();

          const parsedEvents: any[] = [];
          res.data.date.getCalendar.map((e: any) => {
            const { title } = htmlStringParser(e.title);

            channelsSet.add(e.channelName);

            parsedEvents.push({
              eventId: e.eventId ? e.eventId : "",
              originalTitle: title,
              title: e.channelName ? (e.channelName  + ' - ' + title) : title,
              start: new Date(e.start),
              end: new Date(e.end),
              dateId: e.dateId,
              description: e.description,
              createdBy: e.createdBy,
              channelName: e.channelName,
              recurringId: e.recurringId,
              recordMeeting: e.recordMeeting ? true : false,
              meeting: e.meeting,
              channelId: e.channelId,
              cueId: e.cueId
            });
          });

          const loadedItems: { [key: string]: any } = {};

          const allEvents: any = [];

          // Add Logic to convert to items for Agenda
          res.data.date.getCalendar.map((item: any) => {
            const strTime = timeToString(item.start);

            const { title } = htmlStringParser(item.title);

            const modifiedItem = {
              eventId: item.eventId ? item.eventId : "",
              originalTitle: title,
              title: item.channelName ? (item.channelName  + ' - ' + title) : title,
              start: new Date(item.start),
              end: new Date(item.end),
              dateId: item.dateId,
              description: item.description,
              createdBy: item.createdBy,
              channelName: item.channelName,
              recurringId: item.recurringId,
              recordMeeting: item.recordMeeting ? true : false,
              meeting: item.meeting,
              channelId: item.channelId,
              cueId: item.cueId
            }

            allEvents.push(modifiedItem);

            if (!loadedItems[strTime]) {
              loadedItems[strTime] = [modifiedItem];
            } else {
              const existingItems = loadedItems[strTime];
              loadedItems[strTime] = [...existingItems, modifiedItem];
            }
          });

          // Selected date (current date) should never be empty, otherwise Calendar will keep loading
          const todayStr = timeToString(new Date());

          if (!loadedItems[todayStr]) {
            loadedItems[todayStr] = [];
          }

          setEventChannels(Array.from(channelsSet))
          setItems(loadedItems);
          setAllItems(allEvents)
        }

        modalAnimation.setValue(0);
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      })
      .catch(err => {
        console.log(err);
        Alert("Unable to load calendar.", "Check connection.");

        modalAnimation.setValue(0);
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      });
  }, [, modalAnimation]);

  const roundSeconds = (time: Date) => {
    time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
    time.setSeconds(0, 0)

    return time
  }
  
  const renderStartDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              const currentDate: any = selectedDate;
              const roundedValue = roundSeconds(currentDate)

              setStart(roundedValue);
            }}
          />
        ) : null}
        {Platform.OS === "android" && showStartDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              const roundedValue = roundSeconds(currentDate)
              setShowStartDateAndroid(false);
              setStart(roundedValue);
            }}
          />
        ) : null}
        {Platform.OS === "android" ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 12,
              backgroundColor: "#fff",
              marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                marginBottom: 10,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowStartDateAndroid(true);
                setShowStartTimeAndroid(false);
                setShowEndDateAndroid(false);
                setShowEndTimeAndroid(false);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowStartDateAndroid(false);
                setShowStartTimeAndroid(true);
                setShowEndDateAndroid(false);
                setShowEndTimeAndroid(false);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ height: 10, backgroundColor: "white" }} />
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setStart(currentDate);
            }}
          />
        )}
        {Platform.OS === "android" && showStartTimeAndroid && (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowStartTimeAndroid(false);
              setStart(currentDate);
            }}
          />
        )}
      </View>
    );
  };

  const renderEndDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={end}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              const roundedValue = roundSeconds(currentDate)
              setEnd(roundedValue);
            }}
          />
        )}
        {Platform.OS === "android" && showEndDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={end}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowEndDateAndroid(false);

              const roundedValue = roundSeconds(currentDate)

              setEnd(roundedValue);
            }}
          />
        ) : null}
        {Platform.OS === "android" ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 12,
              backgroundColor: "#fff",
              marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                width: 150,
                borderRadius: 15,
                marginBottom: 10,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowStartDateAndroid(false);
                setShowStartTimeAndroid(false);
                setShowEndDateAndroid(true);
                setShowEndTimeAndroid(false);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowStartDateAndroid(false);
                setShowStartTimeAndroid(false);
                setShowEndDateAndroid(false);
                setShowEndTimeAndroid(true);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 10, backgroundColor: "white" }} />
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={end}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setEnd(currentDate);
            }}
          />
        )}
        {Platform.OS === "android" && showEndTimeAndroid && (
          <DateTimePicker
            style={styles.timePicker}
            value={end}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowEndTimeAndroid(false);
              setEnd(currentDate);
            }}
          />
        )}
      </View>
    );
  };

  const renderRepeatTillDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            style={styles.timePicker}
            value={repeatTill}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              const roundedValue = roundSeconds(currentDate)
              setRepeatTill(roundedValue);
            }}
          />
        ) : null}
        {Platform.OS === "android" && showRepeatTillDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={repeatTill}
            mode={"date"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;

              const roundedValue = roundSeconds(currentDate)

              setShowRepeatTillDateAndroid(false);
              setRepeatTill(roundedValue);
            }}
          />
        ) : null}
        {Platform.OS === "android" ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 12,
              backgroundColor: "#fff",
              marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                marginBottom: 10,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowRepeatTillDateAndroid(true);
                setShowRepeatTillTimeAndroid(false);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowRepeatTillDateAndroid(false);
                setShowRepeatTillTimeAndroid(true);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#2f2f3c",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}
              >
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ height: 10, backgroundColor: "white" }} />
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={repeatTill}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setRepeatTill(currentDate);
            }}
          />
        )}
        {Platform.OS === "android" && showRepeatTillTimeAndroid && (
          <DateTimePicker
            style={styles.timePicker}
            value={repeatTill}
            mode={"time"}
            textColor={"#2f2f3c"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowRepeatTillTimeAndroid(false);
              setRepeatTill(currentDate);
            }}
          />
        )}
      </View>
    );
  };

  const renderEditChannelName = () => {

    return editChannelName && (
      <View style={{ maxWidth: width < 768 ? "100%" : "33%", backgroundColor: '#fff', marginBottom: 20 }}>
        <TouchableOpacity
          key={Math.random()}
          disabled={true}
          // style={styles.allOutline}
          style={{ backgroundColor: '#fff' }}
          onPress={() => {
            return;
          }}>
          <Text
            style={{
              lineHeight: 20,
              fontSize: 15,
              color: "#a2a2ac"
            }}>
            Shared with {editChannelName}
          </Text>
        </TouchableOpacity>
      </View>

    );
  }

  const renderEditEventOptions = () => {

    const { recurringId, start, end, channelId } = editEvent;

    const date = new Date();

    return (<View
      style={{
        width: Dimensions.get("window").width < 768 ? "100%" : "10%",
        flexDirection: Dimensions.get("window").width < 768 ? "column" : "row",
        display: "flex",
        marginBottom: 50,
        alignItems: Dimensions.get("window").width < 768 ? "center" : "flex-start",
        backgroundColor: 'white',
        // paddingLeft: 7
        // justifyContent: 'center'
      }}>
        {
                (date > new Date(start) && date < new Date(end)) ?
                    <TouchableOpacity
                        style={{
                          backgroundColor: "white",
                          overflow: "hidden",
                          height: 35,
                          marginTop: 35,
                          borderRadius: 15,
                        }}
                        onPress={async () => {

                            const uString: any = await AsyncStorage.getItem("user");

                            const user = JSON.parse(uString)

                            const server = fetchAPI('')
                            server.mutate({
                                mutation: meetingRequest,
                                variables: {
                                    userId: user._id,
                                    channelId,
                                    isOwner: true
                                }
                            }).then(res => {
                                if (res.data && res.data.channel.meetingRequest !== 'error') {
                                  Linking.openURL(res.data.channel.meetingRequest);
                                } else {
                                    Alert("Classroom not in session. Waiting for instructor.")
                                }
                            }).catch(err => {
                                Alert("Something went wrong.")
                            })
                        }}>
                        <Text
                            style={{
                                textAlign: "center",
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#3B64F8',
                                paddingHorizontal: 25,
                                fontFamily: "inter",
                                height: 35,
                                width: 200,
                                borderRadius: 15,
                                textTransform: "uppercase"
                            }}>
                            Enter Classroom
                        </Text>
                    </TouchableOpacity>
                    : null
            }
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          overflow: "hidden",
          height: 35,
          marginTop: 25,
          borderRadius: 15,
          // marginBottom: 20
        }}
        onPress={() => handleEdit()}
        disabled={isSubmitDisabled || isEditingEvents || isDeletingEvents}>
        <Text
          style={{
            textAlign: "center",
            lineHeight: 35,
            color: "white",
            fontSize: 11,
            backgroundColor: '#3B64F8',
            paddingHorizontal: 25,
            fontFamily: "inter",
            height: 35,
            width: 200,
            borderRadius: 15,
            textTransform: "uppercase"
          }}>
          {isEditingEvents ? "EDITING..." : "EDIT"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          overflow: "hidden",
          height: 35,
          marginTop: 25,
          marginLeft: Dimensions.get("window").width < 768 ? 0 : 20,
          borderRadius: 15,
        }}
        onPress={() => handleDelete(false)}
        disabled={isDeletingEvents || isEditingEvents}>
        <Text
          style={{
            textAlign: "center",
            lineHeight: 35,
            color: "#2f2f3c",
            fontSize: 11,
            backgroundColor: "#f4f4f6",
            paddingHorizontal: 25,
            fontFamily: "inter",
            height: 35,
            width: 200,
            borderRadius: 15,
            textTransform: "uppercase"
          }}>
          {isDeletingEvents ? "DELETING..." : "DELETE"}
        </Text>
      </TouchableOpacity>

      {recurringId && recurringId !== "" ? <TouchableOpacity
        style={{
          backgroundColor: "white",
          overflow: "hidden",
          height: 35,
          marginTop: 25,
          marginLeft: Dimensions.get("window").width < 768 ? 0 : 20,
          borderRadius: 15,
        }}
        onPress={() => handleDelete(true)}
        disabled={isDeletingEvents || isEditingEvents}>
        <Text
          style={{
            textAlign: "center",
            lineHeight: 35,
            color: "#2f2f3c",
            fontSize: 11,
            backgroundColor: "#f4f4f6",
            paddingHorizontal: 25,
            fontFamily: "inter",
            height: 35,
            width: 200,
            borderRadius: 15,
            textTransform: "uppercase"
          }}>
          {isDeletingEvents ? "DELETING..." : "DELETE ALL"}
        </Text>
      </TouchableOpacity> : null
      }
    </View>)
  }


  useEffect(() => {
    loadEvents();
    loadChannels();
  }, []);

  const loadItemsForMonth = (month: any) => {
    const itemsWithEmptyDates: { [label: string]: any } = {};
    for (let i = -90; i < 90; i++) {
      const time = month.timestamp + i * 24 * 60 * 60 * 1000;
      const strTime = timeToString(time);

      if (!items[strTime]) {
        itemsWithEmptyDates[strTime] = [];
      }
    }

    Object.keys(items).forEach(key => {
      itemsWithEmptyDates[key] = items[key];
    });

    // Selected date (current date) should never be empty, otherwise Calendar will keep loading
    const todayStr = timeToString(new Date());

    if (!itemsWithEmptyDates[todayStr]) {
      itemsWithEmptyDates[todayStr] = [];
    }

    setItems(itemsWithEmptyDates);
  };

  const timeToString = (time: any) => {
    const date = new Date(time);
    return date.toISOString().split("T")[0];
  };

  const renderItem = (item: any) => {
    const { title } = htmlStringParser(item.title);



    let colorCode = "#202025";

    const matchSubscription = props.subscriptions.find((sub: any) => {
      return sub.channelName === item.channelName
    })

    if (matchSubscription && matchSubscription !== undefined) {
      colorCode = matchSubscription.colorCode
    }

    const displayDate = datesEqual(item.start, item.end) ? moment(new Date(item.start)).format("h:mm a") : moment(new Date(item.start)).format("h:mm a") + " to " + moment(new Date(item.end)).format("h:mm a")

    return (
      <TouchableOpacity
        style={{
          height: 80,
          backgroundColor: "white",
          marginTop: 10,
          marginBottom: 15,
          marginRight: Dimensions.get('window').width > 768 ? 20 : 10,
          padding: 10,
          borderRadius: 15,
          shadowOffset: {
            width: 1,
            height: 1
          },
          // overflow: 'hidden',
          shadowOpacity: 0.03,
          shadowRadius: 16,
          zIndex: 500000
        }}
        onPress={() => {
          onSelectEvent(item)
        }}
      >
        <Text style={{
          fontFamily: "inter",
          fontSize: 14,
          width: "100%",
          paddingTop: 5,
          color: colorCode,
        }} numberOfLines={1}>{item.title}</Text>

        <Text style={{ color: "black", marginTop: item.description !== "" ? 5 : 15, }} >{displayDate} </Text>

        <Text style={{
          paddingTop: 5,
          color: '#a2a2ac'
        }} numberOfLines={1}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const rowHasChanged = (r1: any, r2: any) => {
    return r1 !== r2;
  };

  const datesEqual = (date1: string, date2: string) => {
    const one = new Date(date1);
    const two = new Date(date2);

    if (one > two) return false;
    else if (one < two) return false;
    else return true
  }

  const onSelectEvent = async (event: any) => {
    const uString: any = await AsyncStorage.getItem("user");
    // Only allow edit if event is not past
    if (uString) {
      const user = JSON.parse(uString);

      const timeString = datesEqual(event.start, event.end) ? moment(new Date(event.start)).format("MMMM Do YYYY, h:mm a") : moment(new Date(event.start)).format("MMMM Do YYYY, h:mm a") + " to " + moment(new Date(event.end)).format("MMMM Do YYYY, h:mm a")

      const descriptionString = event.description ? event.description + "- " + timeString : "" + timeString

      if (user._id === event.createdBy && new Date(event.end) > new Date() && event.eventId) {
        setEditEvent(event)
        setShowAddEvent(true)
      } else if (user._id === event.createdBy && new Date(event.end) < new Date() && event.eventId) {
        // console.log("Delete prompt should come")
        Alert("Delete " + event.title + "?", descriptionString, [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              return;
            }
          },
          {
            text: "Delete",
            onPress: async () => {
              const server = fetchAPI("");
              server
                .mutate({
                  mutation: deleteDateV1,
                  variables: {
                    id: event.eventId,
                    deleteAll: false
                  }
                })
                .then(res => {
                  if (res.data && res.data.date.deleteV1) {
                    Alert("Event Deleted!");
                    loadEvents();
                  }
                });
            }
          }
        ]);
      } else {
        const date = new Date();

                if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                    Alert(
                        event.title,
                        "Enter classroom?",
                        [
                            {
                                text: "No",
                                style: "cancel",
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: "Yes",
                                onPress: async () => {
                                    const uString: any = await AsyncStorage.getItem("user");

                                    const user = JSON.parse(uString)

                                    const server = fetchAPI('')
                                    server.mutate({
                                        mutation: meetingRequest,
                                        variables: {
                                            userId: user._id,
                                            channelId: event.channelId,
                                            isOwner: false
                                        }
                                    }).then(res => {
                                        if (res.data && res.data.channel.meetingRequest !== 'error') {
                                            server
                                                .mutate({
                                                    mutation: markAttendance,
                                                    variables: {
                                                        userId: user._id,
                                                        channelId: event.channelId
                                                    }
                                                })
                                            Linking.openURL(res.data.channel.meetingRequest);
                                        } else {
                                            Alert("Classroom not in session. Waiting for instructor.")
                                        }
                                    }).catch(err => {
                                        Alert("Something went wrong.")
                                    })
                                }
                            }
                        ]
                    );
                } else if (event.cueId !== "") {
                    props.openCueFromCalendar(event.channelId, event.cueId, event.createdBy)
                } else {
                    Alert(
                        event.title,
                        descriptionString
                    );
                }
      }

    }


  }

  const windowHeight =
    Dimensions.get("window").width < 1024
      ? Dimensions.get("window").height - 85
      : Dimensions.get("window").height;

  const yesterday = moment().subtract(1, "day");
  const disablePastDt = (current: any) => {
    return current.isAfter(yesterday);
  };

  const width = Dimensions.get("window").width;



  const renderRecurringOptions = () => (
    <View style={{ flexDirection: width < 768 ? "column" : "row", backgroundColor: "#fff" }}>
      <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex", backgroundColor: "#fff" }}>
        <View style={{ width: "100%", paddingTop: width < 768 ? 0 : 40, paddingBottom: 15, backgroundColor: "white" }}>
          <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Recurring</Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            height: 40,
            marginRight: 10
          }}>
          <Switch
            value={recurring}
            onValueChange={() => setRecurring(!recurring)}
            style={{ height: 20 }}
            trackColor={{
              false: "#f4f4f6",
              true: "#3B64F8"
            }}
            activeThumbColor="white"
          />
        </View>
      </View>

      {recurring ? <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex" }}>
        <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 40, paddingBottom: 15, backgroundColor: "white" }}>
          <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Repeat every</Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            display: "flex",
            // height: 40,
            // marginRight: 10
          }}>
          <Picker
            style={styles.picker}
            itemStyle={{
              fontSize: 15
            }}
            selectedValue={frequency}
            onValueChange={(itemValue: any) => {
              setFrequency(itemValue)
            }}>
            {eventFrequencyOptions.map((item: any, index: number) => {
              return (
                <Picker.Item
                  color={frequency === item.value ? "#3B64F8" : "#2f2f3c"}
                  label={item.value === "" ? "Once" : item.label}
                  value={item.value}
                  key={index}
                />
              );
            })}
          </Picker>
        </View>
      </View> : null}

      {recurring ? <View style={{
        width: Dimensions.get("window").width < 768 ? "100%" : "30%",
        flexDirection: Platform.OS === "ios" ? "row" : "column",
        paddingTop: 12,
        backgroundColor: "#fff",
        marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
      }}>
        <Text style={styles.text}>
          Repeat until

          {/* {PreferredLanguageText("repeatTill")}{" "} */}
          {Platform.OS === "android"
            ? ": " +
            moment(new Date(repeatTill)).format("MMMM Do YYYY, h:mm a")
            : null}
        </Text>
        <View
          style={{
            width: Dimensions.get("window").width < 768 ? "100%" : "30%",
            flexDirection: Platform.OS === "ios" ? "row" : "column",
            backgroundColor: "#fff",
            marginTop: 12,
            marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
          }}>
          {renderRepeatTillDateTimePicker()}
        </View>
      </View> : null}


    </View>
  )

  const renderMeetingOptions = () => {
    return channelId !== "" || editChannelName !== "" ? (
      <View style={{ width: "100%", flexDirection: "row", marginTop: 40, paddingBottom: 15, backgroundColor: "#fff" }}>
        {!editEvent ? <View
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white",
            width: "50%"
          }}>
          <View style={{ width: "100%", backgroundColor: "white", }}>
            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', paddingBottom: 15 }}>Lecture</Text>
          </View>

          <View
            style={{
              backgroundColor: "white",
              height: 40,
              marginRight: 10
            }}>
            <Switch
              value={isMeeting}
              onValueChange={() => {
                setIsMeeting(!isMeeting);
              }}
              style={{ height: 20 }}
              trackColor={{
                false: "#f4f4f6",
                true: "#3B64F8"
              }}
              disabled={editEvent}
              activeThumbColor="white"
            />
          </View>
        </View> : null}
        {isMeeting ? (
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
              width: "50%"
            }}>
            <View style={{ width: "100%", backgroundColor: "white", }}>
              <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', paddingBottom: 15 }}>Record Lecture</Text>
            </View>

            <Switch
              value={recordMeeting}
              onValueChange={() => {
                setRecordMeeting(!recordMeeting);
              }}
              style={{ height: 20 }}
              trackColor={{
                false: "#f4f4f6",
                true: "#a2a2ac"
              }}
              activeThumbColor="white"
            />
          </View>
        ) : null}
      </View>
    ) : null;
  };

  let eventForChannelName = ''
    
    if (channelId === "") {
        eventForChannelName = "My Cues"
    } else {
        const filter = channels.filter((channel: any) => {
            return channel._id === channelId
        })

        eventForChannelName = filter[0].name
    }


  return (
    <Animated.View
      style={{
        opacity: modalAnimation,
        width: "100%",
        height: windowHeight,
        backgroundColor: "white",
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0
      }}
    >

			{/* <View style={{ 
				flexDirection: 'row',
				justifyContent: 'center',
				paddingTop: 10,
				paddingBottom: 15,
				shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 7
                },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                borderBottomColor: '#efefef',
                borderBottomWidth: activeTab === 'activity' ? 1 : 0
			}}>
		  		<TouchableOpacity style={{
					  backgroundColor: activeTab === 'agenda' ? '#000' : '#fff',
					  paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16
				  }}
				  onPress={() => setActiveTab('agenda')}
				  >
					<Text style={{
						color: activeTab === 'agenda' ? '#fff' : '#000',
						fontFamily: 'System', fontWeight: '500'
					}}>
						To Do
					</Text>
				</TouchableOpacity> 
				<TouchableOpacity style={{
					backgroundColor: activeTab === 'activity' ? '#000' : '#fff',
					paddingVertical: 8, paddingHorizontal: 12,  borderRadius: 16
				}}
				onPress={() => setActiveTab('activity')}
				>
					<Text style={{
						color: activeTab === 'activity' ? '#fff' : '#000',
						fontFamily: 'System', fontWeight: '500'
					}}>
						Activity
					</Text>
				</TouchableOpacity>
	  </View> */}

    <View style={{ 
				flexDirection: 'row',
        // justifyContent: 'center',
        paddingHorizontal: 20,
				paddingTop: 10,
				paddingBottom: 15,
			}}>
		  		<TouchableOpacity style={{
					  // backgroundColor: activeTab === 'agenda' ? '#000' : '#fff',
            paddingVertical: 6, marginHorizontal: 12, 
            borderBottomColor: '#006aff',
            borderBottomWidth: activeTab === 'agenda' ? 3 : 0
				  }}
				  onPress={() => setActiveTab('agenda')}
				  >
					<Text style={{
						color: activeTab === 'agenda' ? '#006aff' : '#656565',
            fontFamily: 'Inter', fontWeight: 'bold', fontSize: 30,
					}}>
						To do
					</Text>
				</TouchableOpacity> 
				<TouchableOpacity style={{
					// backgroundColor: activeTab === 'activity' ? '#000' : '#fff',
          paddingVertical: 6, marginHorizontal: 12,
          borderBottomColor: '#006aff',  
          borderBottomWidth: activeTab === 'activity' ? 3 : 0
				}}
				onPress={() => setActiveTab('activity')}
				>
					<Text style={{
						color: activeTab === 'activity' ? '#006aff' : '#656565',
						fontFamily: 'Inter', fontWeight: 'bold', fontSize: 30
					}}>
						Activity
					</Text>
				</TouchableOpacity>
	  </View>


      {!showAddEvent ? (
          (<View style={{ flex: 1, marginBottom: Dimensions.get('window').width < 1024 ? 12 : 0 }} key={activeTab.toString()}>
           {activeTab === 'agenda' ? <Agenda
              showClosingKnob={true}
              items={items}
              loadItemsForMonth={loadItemsForMonth}
              selected={new Date().toISOString().split("T")[0]}
              renderItem={renderItem}
              rowHasChanged={rowHasChanged}
              pastScrollRange={12}
              futureScrollRange={12}
              theme={{
                agendaKnobColor: "#F4F4F6", // knob color
                agendaTodayColor: "#3B64F8", // today in list
                todayTextColor: "#3B64F8",
                selectedDayBackgroundColor: "#3B64F8", // calendar sel date
                dotColor: "#3B64F8" // dots
              }}
              onDayPress={onUpdateSelectedDate}
            /> : renderActivity()}
          </View>)
      ) : (
        <ScrollView
          style={{
            width: "100%",
            // height: windowHeight,
            backgroundColor: "white",
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,

          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          scrollEventThrottle={1}
          keyboardDismissMode={"on-drag"}
          overScrollMode={"never"}
          nestedScrollEnabled={true}
        >
          <View
            style={{
              backgroundColor: "white",
              width: "100%",
              height: "100%",
              paddingHorizontal: 20,
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0
            }}
          >
            <View
              style={{
                flexDirection:
                  Dimensions.get("window").width < 768 ? "column" : "row",
                paddingBottom: 40,
                backgroundColor: "white"
              }}
            >
              <View
                style={{
                  width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                  backgroundColor: "#fff"
                }}
              >
                <TextInput
                  value={title}
                  placeholder={
                    'Event'
                  }
                  onChangeText={val => setTitle(val)}
                  placeholderTextColor={"#a2a2ac"}
                  required={true}
                // style={styles.input}
                />
              </View>
              <View style={{ width: Dimensions.get("window").width < 768 ? "100%" : "30%", backgroundColor: '#fff', marginLeft: Dimensions.get("window").width < 768 ? 0 : 50 }}>
                <TextInput
                  value={description}
                  placeholder="Description"
                  onChangeText={val => setDescription(val)}
                  placeholderTextColor={"#a2a2ac"}
                  hasMultipleLines={true}
                />
              </View>
            </View>
            <View style={{ backgroundColor: '#fff', width: '100%', marginBottom: 50}}>
            <View
                style={{
                  width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                  flexDirection: Platform.OS === "ios" ? "row" : "column",
                  paddingTop: 12,
                  backgroundColor: "#fff",
                  marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
                }}
              >
                <Text style={styles.text}>
                  {PreferredLanguageText("start")}{" "}
                  {Platform.OS === "android"
                    ? ": " +
                    moment(new Date(start)).format("MMMM Do YYYY, h:mm a")
                    : null}
                </Text>
                {renderStartDateTimePicker()}
              </View>
              <View
                style={{
                  width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                  flexDirection: Platform.OS === "ios" ? "row" : "column",
                  backgroundColor: "#fff",
                  marginTop: 12,
                  marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
                }}
              >
                <Text style={styles.text}>
                  {PreferredLanguageText("end")}{" "}
                  {Platform.OS === "android"
                    ? ": " + moment(new Date(end)).format("MMMM Do YYYY, h:mm a")
                    : null}
                </Text>
                {renderEndDateTimePicker()}
              </View>
            </View>

            
            {editEvent && renderEditChannelName()}

            {!editEvent && renderRecurringOptions()}
            {renderMeetingOptions()}
            {channelId !== "" && <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', paddingTop: 20 }}>
              Attendances will only be captured for scheduled lectures.
            </Text>}
            {!editEvent ? <View
              style={{
                width: Dimensions.get("window").width < 768 ? "100%" : "30%",
                flexDirection: "row",
                backgroundColor: "#fff",
                display: "flex",
                justifyContent: "center"
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  overflow: "hidden",
                  height: 35,
                  marginTop: 15,
                  borderRadius: 15,
                  width: "100%",
                  justifyContent: "center",
                  flexDirection: "row",
                  marginBottom: 100,
                  marginTop: 40,
                }}
                onPress={() => handleCreate()}
                disabled={isCreatingEvents}
              >
                <Text
                  style={{
                    textAlign: "center",
                    lineHeight: 35,
                    color: "white",
                    overflow: "hidden",
                    fontSize: 11,
                    backgroundColor: '#3B64F8',
                    paddingHorizontal: 25,
                    fontFamily: "inter",
                    height: 35,

                    width: 150,
                    borderRadius: 15,
                  }}
                >
                  {isCreatingEvents ? "ADDING..." : "ADD"}
                </Text>
              </TouchableOpacity>
            </View> : null}
            {editEvent ? renderEditEventOptions() : null}

          </View>
        </ScrollView>
      )}
    </Animated.View>
  );
};

export default CalendarX;

const styles: any = StyleSheet.create({
  eventTitle: {
    fontFamily: "inter",
    fontSize: 14,
    // ,
    height: "44%",
    width: "100%",
    paddingTop: 5,
    color: "#2f2f3c"
  },
  input: {
    width: "100%",
    borderBottomColor: "#f4f4f6",
    borderBottomWidth: 1,
    fontSize: 15,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20
  },
  text: {
    fontSize: 11,
    color: "#a2a2ac",
    textAlign: "left",
    paddingHorizontal: 10
  },
  timePicker: {
    width: 125,
    fontSize: 16,
    height: 45,
    color: "#2f2f3c",
    borderRadius: 10,
    marginLeft: 10
  },
  allBlack: {
    fontSize: 11,
    color: "#2f2f3c",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allOutline: {
    fontSize: 11,
    color: "#FFF",
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#2f2f3c"
  }
});
