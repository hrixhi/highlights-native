import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Keyboard
} from "react-native";
import Alert from "../components/Alert";
import { View } from "../components/Themed";
// import Swiper from 'react-native-web-swiper'
import Swiper from "react-native-swiper";
import UpdateControls from "./UpdateControls";
import { fetchAPI } from "../graphql/FetchAPI";
import { getCueThreads, getStatuses } from "../graphql/QueriesAndMutations";
import ThreadsList from "./ThreadsList";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SubscribersList from "./SubscribersList";
import { PreferredLanguageText } from "../helpers/LanguageContext";

const Update: React.FunctionComponent<{ [label: string]: any }> = (
    props: any
) => {
    const [modalAnimation] = useState(new Animated.Value(1));
    const [cueId] = useState(props.cueId);
    const [createdBy] = useState(props.createdBy);
    const [channelCreatedBy] = useState(props.channelCreatedBy);
    const [threads, setThreads] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scroll2: any = useRef();
    const scroll3: any = useRef();
    const [channelOwner, setChannelOwner] = useState(false);

    const unableToLoadStatusesAlert = PreferredLanguageText(
        "unableToLoadStatuses"
    );
    const checkConnectionAlert = PreferredLanguageText("checkConnection");
    const unableToLoadCommentsAlert = PreferredLanguageText(
        "unableToLoadComments"
    );

    const loadThreadsAndStatuses = useCallback(async () => {
        const u = await AsyncStorage.getItem("user");
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        }
        if (Number.isNaN(Number(cueId))) {
            setLoading(true);
            const server = fetchAPI(parsedUser._id);
            server
                .query({
                    query: getCueThreads,
                    variables: {
                        cueId
                    }
                })
                .then(async res => {
                    const u = await AsyncStorage.getItem("user");
                    if (u) {
                        const parsedUser = JSON.parse(u);
                        let filteredThreads: any[] = [];
                        if (
                            parsedUser._id.toString().trim() ===
                            channelCreatedBy.toString().trim()
                        ) {
                            filteredThreads = res.data.thread.findByCueId;
                        } else {
                            filteredThreads = res.data.thread.findByCueId.filter(
                                (thread: any) => {
                                    return (
                                        !thread.isPrivate ||
                                        thread.userId === parsedUser._id
                                    );
                                }
                            );
                        }
                        setThreads(filteredThreads);
                        if (
                            parsedUser._id.toString().trim() ===
                            channelCreatedBy.toString().trim()
                        ) {
                            setChannelOwner(true);
                            server
                                .query({
                                    query: getStatuses,
                                    variables: {
                                        cueId
                                    }
                                })
                                .then(res2 => {
                                    if (
                                        res2.data.status &&
                                        res2.data.status.findByCueId
                                    ) {
                                        const subs: any[] = [];
                                        const statuses =
                                            res2.data.status.findByCueId;
                                        statuses.map((status: any) => {
                                            subs.push({
                                                displayName: status.displayName,
                                                _id: status.userId,
                                                fullName: status.status,
                                                submission: status.submission,
                                                comment: status.comment,
                                                score: status.score,
                                                graded: status.graded,
                                                userId: status.userId
                                            });
                                        });
                                        setSubscribers(subs);
                                        setLoading(false);
                                        modalAnimation.setValue(0);
                                        Animated.timing(modalAnimation, {
                                            toValue: 1,
                                            duration: 150,
                                            useNativeDriver: true
                                        }).start();
                                    } else {
                                        setLoading(false);
                                        modalAnimation.setValue(0);
                                        Animated.timing(modalAnimation, {
                                            toValue: 1,
                                            duration: 150,
                                            useNativeDriver: true
                                        }).start();
                                    }
                                })
                                .catch(err => {
                                    Alert(
                                        unableToLoadStatusesAlert,
                                        checkConnectionAlert
                                    );
                                    setLoading(false);
                                    modalAnimation.setValue(0);
                                    Animated.timing(modalAnimation, {
                                        toValue: 1,
                                        duration: 150,
                                        useNativeDriver: true
                                    }).start();
                                });
                        } else {
                            setLoading(false);
                            modalAnimation.setValue(0);
                            Animated.timing(modalAnimation, {
                                toValue: 1,
                                duration: 150,
                                useNativeDriver: true
                            }).start();
                        }
                    } else {
                        setThreads(res.data.thread.findByCueId);
                        setLoading(false);
                        modalAnimation.setValue(0);
                        Animated.timing(modalAnimation, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true
                        }).start();
                    }
                })
                .catch(err => {
                    Alert(unableToLoadCommentsAlert, checkConnectionAlert);
                    setLoading(false);
                    modalAnimation.setValue(0);
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                });
        } else {
            setLoading(false);
            modalAnimation.setValue(0);
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy]);

    useEffect(() => {
        loadThreadsAndStatuses();
    }, [props.cueId, props.channelId]);

    const windowHeight =
        Dimensions.get("window").width < 1024
            ? Dimensions.get("window").height - 85
            : Dimensions.get("window").height;
    return (
        <View
            style={{
                width: "100%",
                backgroundColor: "white",
                height: windowHeight
            }}
        >
            {loading ? (
                <View
                    style={{
                        width: "100%",
                        flex: 1,
                        justifyContent: "center",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "white",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0
                    }}
                >
                    <ActivityIndicator color={"#a2a2aa"} />
                </View>
            ) : (
                <View
                    style={{
                        width: "100%",
                        height: windowHeight
                    }}
                    key={JSON.stringify(threads)}
                >
                    <Swiper
                        key={JSON.stringify(threads)}
                        horizontal={true}
                        activeDotColor={"#0079FE"}
                        containerStyle={{
                            marginTop: 0,
                            // flex: 1
                            backgroundColor: "white"
                        }}
                        dotStyle={{
                            opacity: 1
                        }}
                        activeDotStyle={{
                            opacity: 1
                        }}
                        dotColor={"#e0e0e0"}
                        loop={false}
                        nestedScrollEnabled={true}
                        keyboardDismissMode={"on-drag"}
                        overScrollMode={"always"}
                        alwaysBounceVertical={false}
                        scrollEnabled={true}
                        loadMinimal={true}
                        loadMinimalSize={3}
                    >
                        <ScrollView
                            nestedScrollEnabled={true}
                            horizontal={false}
                            keyboardDismissMode="on-drag"
                            onScrollBeginDrag={Keyboard.dismiss}
                            onScroll={() => Keyboard.dismiss()}
                        >
                            <UpdateControls
                                key={props.reopenUpdateWindow}
                                channelId={props.channelId}
                                customCategories={props.customCategories}
                                cue={props.cue}
                                channelOwner={channelOwner}
                                cueIndex={props.cueIndex}
                                cueKey={props.cueKey}
                                createdBy={createdBy}
                                closeModal={() => {
                                    Animated.timing(modalAnimation, {
                                        toValue: 0,
                                        duration: 150,
                                        useNativeDriver: true
                                    }).start(() => props.closeModal());
                                }}
                                reloadCueListAfterUpdate={() =>
                                    props.reloadCueListAfterUpdate()
                                }
                                updateCueData={(update: any) =>
                                    props.updateCueData(update)
                                }
                            />
                            {!Number.isNaN(Number(cueId)) ||
                            !props.channelId ||
                            (props.cue.original &&
                                props.cue.original.includes("quizId")) ? (
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "white"
                                    }}
                                />
                            ) : (
                                <View
                                    key={Math.random()}
                                    style={{ backgroundColor: "white" }}
                                >
                                    <ThreadsList
                                        channelCreatedBy={
                                            props.channelCreatedBy
                                        }
                                        key={JSON.stringify(threads)}
                                        threads={threads}
                                        cueId={cueId}
                                        channelId={props.channelId}
                                        channelName={props.filterChoice}
                                        closeModal={() => props.closeModal()}
                                        reload={() => loadThreadsAndStatuses()}
                                    />
                                </View>
                            )}
                        </ScrollView>
                        {channelOwner ? (
                            <ScrollView
                                ref={scroll3}
                                contentContainerStyle={{
                                    width: "100%",
                                    height: "100%"
                                }}
                                showsVerticalScrollIndicator={false}
                                contentOffset={{ x: 0, y: 1 }}
                                key={channelOwner.toString()}
                                overScrollMode={"always"}
                                alwaysBounceVertical={true}
                                scrollEnabled={true}
                                scrollEventThrottle={1}
                                keyboardDismissMode={"on-drag"}
                            >
                                <SubscribersList
                                    key={JSON.stringify(subscribers)}
                                    subscribers={subscribers}
                                    cueId={cueId}
                                    channelName={props.filterChoice}
                                    channelId={props.channelId}
                                    closeModal={() => {
                                        Animated.timing(modalAnimation, {
                                            toValue: 0,
                                            duration: 150,
                                            useNativeDriver: true
                                        }).start(() => props.closeModal());
                                    }}
                                    reload={() => loadThreadsAndStatuses()}
                                    cue={props.cue}
                                />
                            </ScrollView>
                        ) : null}
                    </Swiper>
                </View>
            )}
        </View>
    );
};

export default Update;
