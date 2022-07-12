import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
    State,
    TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withDecay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import {
    Avatar,
    CircleClose,
    Delete,
    MessageIcon,
    useChatContext,
    User,
    UserMinus,
    useTheme,
    vh,
} from 'stream-chat-expo';

import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../../ChatContext/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../../ChatContext/UserInfoOverlayContext';

import type { StreamChatGenerics } from './types';

import { UserResponse } from 'stream-chat';
import { useAppContext } from '../../ChatContext/AppContext';
import { useDirectoryFilterOverlayContext } from '../../ChatContext/DirectoryFilterContext';
import { getDropdownHeight } from '../../helpers/DropdownHeight';
import DropDownPicker from 'react-native-dropdown-picker';

dayjs.extend(relativeTime);

const styles = StyleSheet.create({
    avatarPresenceIndicator: {
        right: 5,
        top: 1,
    },
    channelName: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingBottom: 4,
    },
    channelStatus: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    containerInner: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        width: '100%',
    },
    detailsContainer: {
        alignItems: 'center',
        paddingTop: 24,
    },
    lastRow: {
        alignItems: 'center',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        flexDirection: 'row',
    },
    row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row' },
    rowInner: { padding: 16 },
    rowText: {
        fontSize: 14,
        fontWeight: '700',
    },
    userItemContainer: {
        marginHorizontal: 8,
        paddingBottom: 24,
        paddingTop: 16,
        width: 64,
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingTop: 4,
        textAlign: 'center',
    },
    text: {
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        color: '#000000',
        marginBottom: Dimensions.get('window').width < 768 ? 10 : 0,
        fontFamily: 'Inter',
        fontWeight: 'bold',
    },
});

export type DirectoryFilterOverlayProps = {
    overlayOpacity: Animated.SharedValue<number>;
    visible: boolean;
};

const screenHeight = vh(100);
const halfScreenHeight = vh(50);

const filterByOptions = [
    {
        value: 'courses',
        text: 'Course',
    },
    {
        value: 'role',
        text: 'Role',
    },
];

export const DirectoryFilterOverlay = (props: DirectoryFilterOverlayProps) => {
    const { overlayOpacity, visible } = props;

    const { overlay, setOverlay } = useAppOverlayContext();

    const [showSelectChannelDropdown, setShowSelectChannelDropdown] = useState(false);
    const [showSelectRoleDropdown, setShowSelectRoleDropdown] = useState(false);
    const [showSelectGradeDropdown, setShowSelectGradeDropdown] = useState(false);
    const [showSelectSectionDropdown, setShowSelectSectionDropdonw] = useState(false);
    const [courseDropdownOptions, setCourseDropdownOptions] = useState<any[]>([]);

    const {
        subscriptions,
        filterByCourses,
        selectedCourse,
        selectedRole,
        selectedGrade,
        selectedSection,
        setFilterByCourses,
        setSelectedCourse,
        setSelectedRole,
        setSelectedGrade,
        setSelectedSection,
        filterRoleOptions,
        filterGradeOptions,
        filterSectionOptions,
        reset,
    } = useDirectoryFilterOverlayContext();

    const {
        theme: {
            colors: { accent_red, black, border, grey, white },
        },
    } = useTheme();

    const offsetY = useSharedValue(0);
    const translateY = useSharedValue(0);
    const viewHeight = useSharedValue(0);

    const showScreen = useSharedValue(0);
    const fadeScreen = (show: boolean) => {
        'worklet';
        if (show) {
            offsetY.value = 0;
            translateY.value = 0;
        }
        showScreen.value = show
            ? withTiming(1, {
                  duration: 150,
                  easing: Easing.in(Easing.ease),
              })
            : withTiming(
                  0,
                  {
                      duration: 150,
                      easing: Easing.out(Easing.ease),
                  },
                  () => {
                      //   runOnJS()();
                  }
              );
    };

    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
        }
        fadeScreen(!!visible);
    }, [visible]);

    useEffect(() => {
        if (subscriptions) {
            let subOptions = [
                {
                    value: 'All',
                    label: 'All Courses',
                },
            ];

            subscriptions.map((sub: any) => {
                subOptions.push({
                    label: sub.channelName,
                    value: sub.channelId,
                });
            });
            setCourseDropdownOptions(subOptions);
        }
    }, [subscriptions]);

    const onPan = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onActive: (evt) => {
            translateY.value = offsetY.value + evt.translationY;
            overlayOpacity.value = interpolate(translateY.value, [0, halfScreenHeight], [1, 0.75], Extrapolate.CLAMP);
        },
        onFinish: (evt) => {
            const finalYPosition = evt.translationY + evt.velocityY * 0.1;

            if (finalYPosition > halfScreenHeight && translateY.value > 0) {
                cancelAnimation(translateY);
                overlayOpacity.value = withTiming(
                    0,
                    {
                        duration: 200,
                        easing: Easing.out(Easing.ease),
                    },
                    () => {
                        runOnJS(setOverlay)('none');
                    }
                );
                translateY.value =
                    evt.velocityY > 1000
                        ? withDecay({
                              velocity: evt.velocityY,
                          })
                        : withTiming(screenHeight, {
                              duration: 200,
                              easing: Easing.out(Easing.ease),
                          });
            } else {
                translateY.value = withTiming(0);
                overlayOpacity.value = withTiming(1);
            }
        },
        onStart: () => {
            cancelAnimation(translateY);
            offsetY.value = translateY.value;
        },
    });

    const panStyle = useAnimatedStyle<ViewStyle>(() => ({
        transform: [
            {
                translateY: translateY.value > 0 ? translateY.value : 0,
            },
        ],
    }));

    const showScreenStyle = useAnimatedStyle<ViewStyle>(() => ({
        transform: [
            {
                translateY: interpolate(showScreen.value, [0, 1], [viewHeight.value / 2, 0]),
            },
        ],
    }));

    if (!visible) return null;

    return (
        <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
            <PanGestureHandler
                enabled={overlay === 'directoryFilter'}
                maxPointers={1}
                minDist={10}
                onGestureEvent={onPan}
            >
                <Animated.View style={StyleSheet.absoluteFillObject}>
                    {/* <TapGestureHandler
                        maxDist={32}
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                            if (state === State.END) {
                                setOverlay('none');
                            }
                        }}
                    > */}
                    <Animated.View
                        onLayout={({
                            nativeEvent: {
                                layout: { height },
                            },
                        }) => {
                            viewHeight.value = height;
                        }}
                        style={[styles.container, panStyle]}
                    >
                        <Animated.View style={[styles.containerInner, { backgroundColor: white }, showScreenStyle]}>
                            <SafeAreaView>
                                <View
                                    style={{
                                        // alignItems: 'center',
                                        paddingTop: 24,
                                        paddingHorizontal: 20,
                                    }}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            paddingBottom: 4,
                                            paddingHorizontal: 30,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Filter Directory
                                    </Text>
                                    <View
                                        style={{
                                            marginTop: 20,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 20,
                                            backgroundColor: '#f8f8f8',
                                            // maxWidth: 200,
                                            width: '100%',
                                        }}
                                    >
                                        {filterByOptions.map((tab: any, ind: number) => {
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor:
                                                            (tab.value === 'courses' && filterByCourses) ||
                                                            (tab.value !== 'courses' && !filterByCourses)
                                                                ? '#000'
                                                                : '#f8f8f8',
                                                        borderRadius: 20,
                                                        paddingLeft: 14,
                                                        paddingRight: 14,
                                                        paddingTop: 10,
                                                        paddingBottom: 10,
                                                        minWidth: 60,
                                                        width: '50%',
                                                    }}
                                                    onPress={() => {
                                                        setFilterByCourses(tab.value === 'courses');
                                                    }}
                                                    key={ind.toString()}
                                                >
                                                    <Text
                                                        style={{
                                                            color:
                                                                (tab.value === 'courses' && filterByCourses) ||
                                                                (tab.value !== 'courses' && !filterByCourses)
                                                                    ? '#fff'
                                                                    : '#000',
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {(tab.value === 'courses' && filterByCourses) ||
                                                        (tab.value !== 'courses' && !filterByCourses)
                                                            ? 'Filter by ' + tab.text
                                                            : tab.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {filterByCourses && (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                                display: 'flex',
                                                maxWidth: 600,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',
                                                    paddingTop: 40,
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <Text style={styles.text}>Select Course</Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    zIndex: showSelectChannelDropdown ? 1 : 0,
                                                }}
                                            >
                                                <DropDownPicker
                                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'MODAL'}
                                                    open={showSelectChannelDropdown}
                                                    value={selectedCourse}
                                                    items={courseDropdownOptions}
                                                    scrollViewProps={{
                                                        nestedScrollEnabled: true,
                                                    }}
                                                    setOpen={setShowSelectChannelDropdown}
                                                    setValue={setSelectedCourse}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: '#ccc',
                                                        borderRadius: 0,
                                                        height: 45,
                                                        // elevation: !showSelectChannelDropdown ? 0 : 2
                                                    }}
                                                    dropDownContainerStyle={{
                                                        borderWidth: 0,
                                                        // elevation: !showSelectChannelDropdown ? 0 : 2
                                                    }}
                                                    containerStyle={{
                                                        shadowColor: '#000',
                                                        shadowOffset: {
                                                            width: 1,
                                                            height: 3,
                                                        },
                                                        shadowOpacity: !showSelectChannelDropdown ? 0 : 0.08,
                                                        shadowRadius: 12,
                                                    }}
                                                    textStyle={{
                                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                        fontFamily: 'overpass',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {!filterByCourses && (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                                display: 'flex',
                                                maxWidth: 600,
                                                // marginBottom: 20,
                                                // marginTop: 30,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',
                                                    paddingTop: 40,
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <Text style={styles.text}>Select Role</Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    zIndex: showSelectRoleDropdown ? 10000 : 0,
                                                    // marginRight: 10
                                                }}
                                            >
                                                <DropDownPicker
                                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'MODAL'}
                                                    open={showSelectRoleDropdown}
                                                    value={selectedRole}
                                                    items={filterRoleOptions}
                                                    scrollViewProps={{
                                                        nestedScrollEnabled: true,
                                                    }}
                                                    setOpen={setShowSelectRoleDropdown}
                                                    setValue={setSelectedRole}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: '#ccc',
                                                        borderRadius: 0,
                                                        height: 45,
                                                    }}
                                                    dropDownContainerStyle={{
                                                        borderWidth: 0,
                                                        zIndex: 100000,
                                                    }}
                                                    containerStyle={{
                                                        shadowColor: '#000',
                                                        shadowOffset: {
                                                            width: 1,
                                                            height: 3,
                                                        },
                                                        shadowOpacity: !showSelectRoleDropdown ? 0 : 0.08,
                                                        shadowRadius: 12,
                                                    }}
                                                    textStyle={{
                                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                        fontFamily: 'overpass',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {!filterByCourses && (selectedRole === 'parent' || selectedRole === 'student') && (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                                display: 'flex',
                                                maxWidth: 600,
                                                marginTop: 30,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',

                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <Text style={styles.text}>Select Grade</Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    zIndex: showSelectGradeDropdown ? 10000 : 0,
                                                    // marginRight: 10
                                                }}
                                            >
                                                <DropDownPicker
                                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'MODAL'}
                                                    open={showSelectGradeDropdown}
                                                    value={selectedGrade}
                                                    items={filterGradeOptions}
                                                    scrollViewProps={{
                                                        nestedScrollEnabled: true,
                                                    }}
                                                    setOpen={setShowSelectGradeDropdown}
                                                    setValue={setSelectedGrade}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: '#ccc',
                                                        borderRadius: 0,
                                                        height: 45,
                                                    }}
                                                    dropDownContainerStyle={{
                                                        borderWidth: 0,
                                                        zIndex: 100000,
                                                    }}
                                                    containerStyle={{
                                                        shadowColor: '#000',
                                                        shadowOffset: {
                                                            width: 1,
                                                            height: 3,
                                                        },
                                                        shadowOpacity: !showSelectGradeDropdown ? 0 : 0.08,
                                                        shadowRadius: 12,
                                                    }}
                                                    textStyle={{
                                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                        fontFamily: 'overpass',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {!filterByCourses && (selectedRole === 'parent' || selectedRole === 'student') && (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                                display: 'flex',
                                                maxWidth: 600,
                                                marginTop: 30,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',

                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <Text style={styles.text}>Select Section</Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    zIndex: showSelectSectionDropdown ? 10000 : 0,
                                                    // marginRight: 10
                                                }}
                                            >
                                                <DropDownPicker
                                                    listMode={Platform.OS === 'android' ? 'MODAL' : 'MODAL'}
                                                    open={showSelectSectionDropdown}
                                                    value={selectedSection}
                                                    items={filterSectionOptions}
                                                    scrollViewProps={{
                                                        nestedScrollEnabled: true,
                                                    }}
                                                    setOpen={setShowSelectSectionDropdonw}
                                                    setValue={setSelectedSection}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: '#ccc',
                                                        borderRadius: 0,
                                                        height: 45,
                                                    }}
                                                    dropDownContainerStyle={{
                                                        borderWidth: 0,
                                                        zIndex: 100000,
                                                    }}
                                                    containerStyle={{
                                                        shadowColor: '#000',
                                                        shadowOffset: {
                                                            width: 1,
                                                            height: 3,
                                                        },
                                                        shadowOpacity: !showSelectSectionDropdown ? 0 : 0.08,
                                                        shadowRadius: 12,
                                                    }}
                                                    textStyle={{
                                                        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                                        fontFamily: 'overpass',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    <TapGestureHandler
                                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                                            reset();
                                            setOverlay('none');
                                        }}
                                    >
                                        <View
                                            style={[
                                                styles.row,
                                                {
                                                    borderTopColor: border,
                                                    marginTop: 50,
                                                },
                                            ]}
                                        >
                                            <View style={styles.rowInner}>
                                                <CircleClose pathFill={accent_red} />
                                            </View>
                                            <Text style={[styles.rowText, { color: accent_red }]}>Reset</Text>
                                        </View>
                                    </TapGestureHandler>
                                </View>
                            </SafeAreaView>
                        </Animated.View>
                    </Animated.View>
                    {/* </TapGestureHandler> */}
                </Animated.View>
            </PanGestureHandler>
        </Animated.View>
    );
};
