import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform
} from "react-native";
import { TextInput } from "./CustomTextInput";
import Alert from "./Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  createDate,
  deleteDate,
  getChannels,
  getEvents
} from "../graphql/QueriesAndMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { htmlStringParser } from "../helpers/HTMLParser";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";

import { Agenda } from "react-native-calendars";
import { PreferredLanguageText } from "../helpers/LanguageContext";

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

  const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
  const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);

  const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
  const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

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
        .catch(err => {});
    }
  }, []);

  useEffect(() => {
    if (title !== "" && end > start) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [title, start, end]);

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

    const u = await AsyncStorage.getItem("user");
    if (u) {
      const user = JSON.parse(u);
      const server = fetchAPI("");
      server
        .mutate({
          mutation: createDate,
          variables: {
            title,
            userId: user._id,
            start: start.toUTCString(),
            end: end.toUTCString(),
            channelId
          }
        })
        .then(res => {
          loadEvents();
          setTitle("");
          setShowAddEvent(false);
        })
        .catch(err => console.log(err));
    }
  }, [title, start, end, channelId]);

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
          const parsedEvents: any[] = [];
          res.data.date.getCalendar.map((e: any) => {
            const { title } = htmlStringParser(e.title);
            console.log(title);
            parsedEvents.push({
              title: e.channelName ? e.channelName + " - " + title : title,
              start: new Date(e.start),
              end: new Date(e.end),
              dateId: e.dateId
            });
          });

          const loadedItems: { [key: string]: any } = {};

          // Add Logic to convert to items for Agenda
          res.data.date.getCalendar.map((item: any) => {
            const strTime = timeToString(item.start);

            console.log(strTime);

            if (!loadedItems[strTime]) {
              loadedItems[strTime] = [item];
            } else {
              const existingItems = loadedItems[strTime];
              loadedItems[strTime] = [...existingItems, item];
            }
          });
          // Selected date (current date) should never be empty, otherwise Calendar will keep loading
          const todayStr = timeToString(new Date());

          if (!loadedItems[todayStr]) {
            loadedItems[todayStr] = [];
          }

          setItems(loadedItems);
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

  const renderStartDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff"}}>
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
      <View style={{ backgroundColor: "#fff"}}>
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

    const displayTitle = item.channelName
      ? item.channelName + " - " + title
      : title;

    const displayDate =
      moment(new Date(item.start)).format("h:mm a") +
      " to " +
      moment(new Date(item.end)).format("h:mm a");

    return (
      <TouchableOpacity
        style={{
          height: 80,
          backgroundColor: "white",
          marginTop: 10,
          marginBottom: 10,
          marginRight: 10,
          padding: 10,
          borderRadius: 20
        }}
        onPress={() => {
          if (item.dateId !== "channel") {
            onDateClick(
              displayTitle,
              moment(new Date(item.start)).format("MMMM Do YYYY, h:mm a") +
                " to " +
                moment(new Date(item.end)).format("MMMM Do YYYY, h:mm a"),
              item.dateId
            );
          } else {
            Alert(
              displayTitle,
              moment(new Date(item.start)).format("MMMM Do YYYY, h:mm a") +
                " to " +
                moment(new Date(item.end)).format("MMMM Do YYYY, h:mm a")
            );
          }
        }}
      >
        <Text style={styles.eventTitle}>{displayTitle}</Text>
        <Text style={{ color: "black" }}>{displayDate}</Text>
      </TouchableOpacity>
    );
  };

  const rowHasChanged = (r1: any, r2: any) => {
    return r1 !== r2;
  };

  const windowHeight =
    Dimensions.get("window").width < 1024
      ? Dimensions.get("window").height - 85
      : Dimensions.get("window").height;

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
          paddingBottom: 25,
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Text
          ellipsizeMode="tail"
          style={{
            color: "#a2a2aa",
            fontSize: 16,
            flex: 1,
            lineHeight: 25,
            paddingLeft: 10
            // paddingHorizontal: 20
          }}
        >
          {PreferredLanguageText("planner")}
        </Text>
        <Text
          ellipsizeMode="tail"
          style={{
            color: "black",
            fontSize: 16,
            flex: 1,
            lineHeight: 25,
            // paddingHorizontal: 0,
            marginTop: 10
          }}
        >
          {currentMonth}
        </Text>
        {!showAddEvent ? (
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
        )}
      </View>

      {!showAddEvent ? (
        <View style={{ flex: 1 }}>
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
        </View>
      ) : (
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
                placeholder={PreferredLanguageText("event")}
                onChangeText={val => setTitle(val)}
                placeholderTextColor={"#a2a2aa"}
                required={true}
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
            <View
              style={{
                width: Dimensions.get("window").width < 768 ? "100%" : "10%",
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
                  flexDirection: "row"
                }}
                onPress={() => handleCreate()}
                disabled={isSubmitDisabled}
              >
                <Text
                  style={{
                    textAlign: "center",
                    lineHeight: 35,
                    color: "#202025",
                    overflow: "hidden",
                    fontSize: 12,
                    backgroundColor: "#f4f4f6",
                    paddingHorizontal: 25,
                    fontFamily: "inter",
                    height: 35,
                    width: 150,
                    borderRadius: 15
                  }}
                >
                  ADD
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                width: "100%",
                paddingBottom: 15,
                backgroundColor: "white"
              }}
            >
              <Text style={{ fontSize: 12, color: "#a2a2aa" }}>
                {PreferredLanguageText("channel")}
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
                        fontSize: 12,
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
                            fontSize: 12,
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
          </View>
        </View>
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
    fontSize: 12,
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
    fontSize: 12,
    color: "#202025",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allOutline: {
    fontSize: 12,
    color: "#FFF",
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#202025"
  }
});
