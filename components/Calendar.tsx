import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { TextInput } from "./CustomTextInput";
import Alert from "./Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  createDate,
  deleteDate,
  getChannels,
  getEvents,
  createDateV1, editDateV1, deleteDateV1
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

  // FILTERS
  const [showFilter, setShowFilter] = useState(false);
  const [eventChannels, setEventChannels] = useState<any[]>([]);
  const [filterChannels, setFilterChannels] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filterByLectures, setFilterByLectures] = useState(false);

  const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
  const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);

  const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
  const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

  const [showRepeatTillTimeAndroid, setShowRepeatTillTimeAndroid] = useState(false);
  const [showRepeatTillDateAndroid, setShowRepeatTillDateAndroid] = useState(false);

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

    if (filterChannels.length === 0) {
        filterByChannels = total;
    } else {
        const all = [...total];
        const filter = all.filter((e: any) => filterChannels.includes(e.channelName));
        
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

}, [filterChannels, filterByLectures])

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

  const onDateClick = useCallback((title, date, dateId) => {
    Alert("Delete " + title + "?", date, [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Delete",
        onPress: async () => {
          const server = fetchAPI("");
          server
            .mutate({
              mutation: deleteDate,
              variables: {
                dateId
              }
            })
            .then(res => {
              if (res.data && res.data.date.delete) {
                Alert("Event Deleted!");
                loadEvents();
              }
            });
        }
      }
    ]);
  }, []);

  const handleCreate = useCallback(async () => {
    if (start < new Date()) {
      Alert("Event must be set in the future.");
      return;
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
              title: e.channelName ? (e.channelName + ' - ' + title) : title,
              start: new Date(e.start),
              end: new Date(e.end),
              dateId: e.dateId,
              description: e.description,
              createdBy: e.createdBy,
              channelName: e.channelName,
              recurringId: e.recurringId,
              recordMeeting: e.recordMeeting ? true : false
            });
          });

          const loadedItems: { [key: string]: any } = {};

          const allEvents : any = [];

          // Add Logic to convert to items for Agenda
          res.data.date.getCalendar.map((item: any) => {
            const strTime = timeToString(item.start);

            const { title } = htmlStringParser(item.title);

            const modifiedItem = {
              eventId: item.eventId ? item.eventId : "",
              originalTitle: title,
              title: item.channelName ? (item.channelName + ' - ' + title) : title,
              start: new Date(item.start),
              end: new Date(item.end),
              dateId: item.dateId,
              description: item.description,
              createdBy: item.createdBy,
              channelName: item.channelName,
              recurringId: item.recurringId,
              recordMeeting: item.recordMeeting ? true : false,
              meeting: item.meeting
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

  const renderFilterEvents = () => {

    return (eventChannels.length > 0 ? (
        <View style={{ marginTop: 20, paddingHorizontal: 20, backgroundColor: 'white' }} key={JSON.stringify(eventChannels)}>
            <View style={{ marginBottom: 40, backgroundColor: 'white' }}>
                  <View
                    style={{
                      width: "100%",
                      paddingBottom: 15,
                      backgroundColor: "white"
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                      Filter by Channels
                    </Text>
                </View>
              <View
                  style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "white"
                  }}>
                  <View
                      style={{
                          width: "100%",
                          backgroundColor: "white",
                          display: "flex",
                      }}>
                      <ScrollView
                          style={styles.colorBar}
                          horizontal={true}
                          showsHorizontalScrollIndicator={false}>
                          <TouchableOpacity
                              style={
                                  filterChannels.includes('') ? styles.allOutline : styles.allBlack
                              }
                              onPress={() => {
                                  const currentFilterChannels = [...filterChannels];

                                  if (currentFilterChannels.includes("")) {
                                      const filter = currentFilterChannels.filter((channel: any) => channel !== "");

                                      setFilterChannels(filter);
                                  } else {
                                      currentFilterChannels.push("");
                                      setFilterChannels(currentFilterChannels);
                                  }
                              }}>
                              <Text
                                  style={{
                                      lineHeight: 20,
                                      fontSize: 11,
                                      color: filterChannels.includes('') ? "#fff" : "#202025"
                                  }}>
                                  {PreferredLanguageText("myCues")}
                              </Text>
                          </TouchableOpacity>
                          {eventChannels.map(channel => {
                              return (
                                  <TouchableOpacity
                                      key={Math.random()}
                                      style={
                                          filterChannels.includes(channel)
                                              ? styles.allOutline
                                              : styles.allBlack
                                      }
                                      onPress={() => {
                                          const currentFilterChannels = [...filterChannels]

                                          if (currentFilterChannels.includes(channel)) {
                                              const filter = currentFilterChannels.filter((channelName: any) => channelName !== channel);
                                              setFilterChannels(filter);

                                          } else {
                                              currentFilterChannels.push(channel);
                                              setFilterChannels(currentFilterChannels);
                                          }
                                      }}>
                                      <Text
                                          style={{
                                              lineHeight: 20,
                                              fontSize: 11,
                                              color:
                                                  filterChannels.includes(channel)
                                                      ? "#fff"
                                                      : "#202025"
                                          }}>
                                          {channel}
                                      </Text>
                                  </TouchableOpacity>
                              );
                          })}
                      </ScrollView>
                  </View>
              </View>
            </View>

            <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex", backgroundColor: "#fff" }}>
              <View style={{ width: "100%", paddingTop: width < 768 ? 0 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>Lectures</Text>
              </View>
              <View
                style={{
                  backgroundColor: "white",
                  height: 40,
                  marginRight: 10
                }}>
                <Switch
                  value={filterByLectures}
                  onValueChange={() => setFilterByLectures(!filterByLectures)}
                  style={{ height: 20 }}
                  trackColor={{
                    false: "#f4f4f6",
                    true: "#3B64F8"
                  }}
                  activeThumbColor="white"
                />
              </View>
            </View>
        </View>
    ) : null)    }

  const renderStartDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              const currentDate: any = selectedDate;
              setStart(currentDate);
            }}
          />
        ) : null}
        {Platform.OS === "android" && showStartDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={start}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowStartDateAndroid(false);
              setStart(currentDate);
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
                  color: "#202025",
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
                  color: "#202025",
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
            textColor={"#202025"}
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
            textColor={"#202025"}
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
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setEnd(currentDate);
            }}
          />
        )}
        {Platform.OS === "android" && showEndDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={end}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowEndDateAndroid(false);
              setEnd(currentDate);
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
                  color: "#202025",
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
                  color: "#202025",
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
            textColor={"#202025"}
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
            textColor={"#202025"}
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
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setRepeatTill(currentDate);
            }}
          />
        ) : null}
        {Platform.OS === "android" && showRepeatTillDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={repeatTill}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowRepeatTillDateAndroid(false);
              setRepeatTill(currentDate);
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
                  color: "#202025",
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
                  color: "#202025",
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
            textColor={"#202025"}
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
            textColor={"#202025"}
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
              color: "#a2a2aa"
            }}>
            Shared with {editChannelName}
          </Text>
        </TouchableOpacity>
      </View>

    );
  }

  const renderEditEventOptions = () => {

    const { recurringId } = editEvent;
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
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          overflow: "hidden",
          height: 35,
          marginTop: 35,
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
            color: "#202025",
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
            color: "#202025",
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


    const displayDate =
      moment(new Date(item.start)).format("h:mm a") +
      " to " +
      moment(new Date(item.end)).format("h:mm a");

    return (
      <TouchableOpacity
        style={{
          height: 70,
          backgroundColor: "white",
          marginTop: 10,
          marginBottom: 15,
          marginRight: 10,
          padding: 10,
          borderRadius: 15
        }}
        onPress={() => {
          onSelectEvent(item)
        }}
      >
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={{ color: "black" }}>{displayDate}</Text>
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
        Alert(
          event.title,
          descriptionString
        );
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
          <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>Recurring</Text>
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
          <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>Repeat every</Text>
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
                  color={frequency === item.value ? "#3B64F8" : "#202025"}
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
            <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', paddingBottom: 15 }}>Lecture</Text>
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
              <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', paddingBottom: 15 }}>Record Lecture</Text>
            </View>

            <Switch
              value={recordMeeting}
              onValueChange={() => {
                setRecordMeeting(!recordMeeting);
              }}
              style={{ height: 20 }}
              trackColor={{
                false: "#f4f4f6",
                true: "#a2a2aa"
              }}
              activeThumbColor="white"
            />
          </View>
        ) : null}
      </View>
    ) : null;
  };

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
      <Text
        style={{
          width: "100%",
          textAlign: "center",
          height: 15,
          paddingBottom: 25
        }}
      >
        {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
      </Text>
      <View
        style={{
          backgroundColor: "white",
          flexDirection: "row",
          width: '100%',
          paddingBottom: 25,
          // alignItems: "center",
          // justifyContent: "space-between"
        }}
      >
        <Text
          ellipsizeMode="tail"
          style={{
            color: '#202025',
            fontSize: 11,
            paddingBottom: 20,
            textTransform: 'uppercase',
            paddingLeft: 25,
            paddingTop: 5,
            width: '50%'
          }}
        >
          {PreferredLanguageText("planner")}
        </Text>
        
        <View style={{ flexDirection: 'row', width: '50%', backgroundColor: 'white', justifyContent: "flex-end" }}>
          {showAddEvent ? null : <Text style={{
            // width: '50%',
            color: '#a2a2aa',
            fontSize: 11,
            paddingTop: 5,
            textAlign: 'right',
            paddingRight: 25,
            textTransform: 'uppercase'
          }}
            onPress={() => {
              setShowFilter(!showFilter)
            }}
          >
            {
              showFilter ? "HIDE" : "FILTER"
            }
          </Text>}

          {filterChannels.length === 0 && !filterByLectures ? null : <Text style={{
            // width: '50%',
            color: '#a2a2aa',
            fontSize: 11,
            paddingTop: 5,
            textAlign: 'right',
            paddingRight: 25,
            textTransform: 'uppercase'
          }}
            onPress={() => {
              setFilterChannels([]);
              setFilterByLectures(false) 
            }}
          >
            RESET
          </Text>}

          {showFilter ? null : <Text style={{
            // width: '50%',
            color: '#a2a2aa',
            fontSize: 11,
            paddingTop: 5,
            textAlign: 'right',
            paddingRight: 25,
            textTransform: 'uppercase'
          }}
            onPress={() => {
              setShowAddEvent(!showAddEvent)
              setEditEvent(null)
            }}
          >
            {
              showAddEvent ? PreferredLanguageText('hide') : PreferredLanguageText('add')
            }
          </Text>}
        </View>
        
        {/* {!showAddEvent ? (
          <Ionicons
            name="add-outline"
            size={25}
            color={"#202025"}
            style={{ paddingRight: 10 }}
            onPress={() => setShowAddEvent(true)}
          />
        ) : (
          <Ionicons
            name="close-outline"
            size={25}
            color={"#202025"}
            style={{ paddingRight: 10 }}
            onPress={() => setShowAddEvent(false)}
          />
		)} */}
      </View>

      {!showAddEvent ? (
        showFilter ? 
        renderFilterEvents()
        :
        (<View style={{ flex: 1 }}>
          <Agenda
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
          />
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
                  placeholder={PreferredLanguageText("new") + ' ' + PreferredLanguageText("event") + "/" + PreferredLanguageText("meeting")}
                  onChangeText={val => setTitle(val)}
                  placeholderTextColor={"#a2a2aa"}
                  required={true}
                // style={styles.input}
                />
              </View>
              <View style={{ width: Dimensions.get("window").width < 768 ? "100%" : "30%", backgroundColor: '#fff' }}>
                <TextInput
                  value={description}
                  placeholder="Description"
                  onChangeText={val => setDescription(val)}
                  placeholderTextColor={"#a2a2aa"}
                  hasMultipleLines={true}
                />
              </View>
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
                {/* <Datetime
                                            value={start}
                                            onChange={(event: any) => {
                                                const date = new Date(event)
                                                setStart(date)
                                            }}
                                        /> */}
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

            {
              channels.length > 0 && !editEvent ?
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      width: "100%",
                      paddingBottom: 15,
                      backgroundColor: "white"
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                      Event for
                      {/* <Ionicons
                                                name='school-outline' size={20} color={'#a2a2aa'} /> */}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "white"
                    }}
                  >
                    <View
                      style={{
                        width: "85%",
                        backgroundColor: "white",
                        display: "flex"
                      }}
                    >
                      <ScrollView
                        style={styles.colorBar}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                      >
                        <TouchableOpacity
                          style={
                            channelId === "" ? styles.allOutline : styles.allBlack
                          }
                          onPress={() => {
                            setChannelId("");
                          }}
                        >
                          <Text
                            style={{
                              lineHeight: 20,
                              fontSize: 11,
                              color: channelId === "" ? "#fff" : "#202025"
                            }}
                          >
                            {PreferredLanguageText("myCues")}
                          </Text>
                        </TouchableOpacity>
                        {channels.map(channel => {
                          return (
                            <TouchableOpacity
                              key={Math.random()}
                              style={
                                channelId === channel._id
                                  ? styles.allOutline
                                  : styles.allBlack
                              }
                              onPress={() => {
                                setChannelId(channel._id);
                              }}
                            >
                              <Text
                                style={{
                                  lineHeight: 20,
                                  fontSize: 11,
                                  color:
                                    channelId === channel._id ? "#fff" : "#202025"
                                }}
                              >
                                {channel.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View> : null
            }
            {editEvent && renderEditChannelName()}

            {!editEvent && renderRecurringOptions()}
            {renderMeetingOptions()}
            {channelId !== "" && <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase', paddingTop: 20 }}>
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
                disabled={isSubmitDisabled || isCreatingEvents}
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
                  {isCreatingEvents ? "SAVING" : "SAVE"}
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
    color: "#202025"
  },
  input: {
    width: "100%",
    borderBottomColor: "#f4f4f6",
    borderBottomWidth: 1,
    fontSize: 15,
    padding: 15,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20
  },
  text: {
    fontSize: 11,
    color: "#a2a2aa",
    textAlign: "left",
    paddingHorizontal: 10
  },
  timePicker: {
    width: 125,
    fontSize: 16,
    height: 45,
    color: "#202025",
    borderRadius: 10,
    marginLeft: 10
  },
  allBlack: {
    fontSize: 11,
    color: "#202025",
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
    backgroundColor: "#202025"
  }
});
