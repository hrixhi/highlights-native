import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
    withTiming,
} from 'react-native-reanimated';
import { Avatar, CircleClose, MessageIcon, useChatContext, User, UserMinus, useTheme, vh } from 'stream-chat-expo';

import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../../ChatContext/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../../ChatContext/UserInfoOverlayContext';

import type { StreamChatGenerics } from './types';

import { UserResponse } from 'stream-chat';
import { useAppChatContext } from '../../ChatContext/AppChatContext';
import { AddUser, RemoveUser } from '../../assets/chatIcons';
import { toggleAdminRole } from '../../graphql/QueriesAndMutations';
import Alert from '../Alert';
import { useApolloClient } from '@apollo/client';

dayjs.extend(relativeTime);

const avatarSize = 64;

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
});

const screenHeight = vh(100);
const halfScreenHeight = vh(50);

export type UserInfoOverlayProps = {
    overlayOpacity: Animated.SharedValue<number>;
    visible?: boolean;
};

export const UserInfoOverlay = (props: UserInfoOverlayProps) => {
    const { overlayOpacity, visible } = props;
    const { chatClient } = useAppChatContext();
    const { overlay, setOverlay } = useAppOverlayContext();
    const { client } = useChatContext<StreamChatGenerics>();
    const { setData } = useBottomSheetOverlayContext();
    const { data, reset } = useUserInfoOverlayContext();

    const [channelRole, setChannelRole] = useState<string>('');

    const { channel, member, navigation } = data || {};

    const {
        theme: {
            colors: { accent_red, accent_blue, black, border, grey, white },
        },
    } = useTheme();

    const server = useApolloClient();

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
                      runOnJS(reset)();
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
        if (!member || !chatClient) return;

        console.log('Member inside User info overlay', member);

        if (member.role === 'owner') {
            setChannelRole('owner');
        } else if (member.is_moderator) {
            setChannelRole('moderator');
        } else {
            setChannelRole('member');
        }
    }, [member, chatClient]);

    const handleRemoveUser = useCallback(
        async (userId: string) => {
            if (!channel) return;

            await channel.removeMembers([userId]);
        },
        [channel]
    );

    const handleToggleAdmin = useCallback(
        (userId: string, alreadyAdmin: boolean) => {
            if (!channel) return;

            server
                .mutate({
                    mutation: toggleAdminRole,
                    variables: {
                        groupId: channel.id,
                        userId,
                        alreadyAdmin,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.streamChat.toggleAdminRole) {
                        Alert('Updated user successfully.');
                    }
                })
                .catch((e) => {
                    console.log('Error', e);
                    return;
                });
        },
        [channel]
    );

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

    const self = channel
        ? Object.values(channel.state.members).find((channelMember) => channelMember.user?.id === client.user?.id)
        : undefined;

    if (!self || !member) {
        return null;
    }

    // console.log('self', self);

    // console.log('Channel', channel);

    console.log('Channel Role', channelRole);

    if (!channel) return null;

    const channelCreatorId =
        channel.data && (channel.data.created_by_id || (channel.data.created_by as UserResponse)?.id);

    return (
        <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
            <PanGestureHandler enabled={overlay === 'channelInfo'} maxPointers={1} minDist={10} onGestureEvent={onPan}>
                <Animated.View style={StyleSheet.absoluteFillObject}>
                    <TapGestureHandler
                        maxDist={32}
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                            if (state === State.END) {
                                setOverlay('none');
                            }
                        }}
                    >
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
                                <View>
                                    {channel && (
                                        <>
                                            <View style={styles.detailsContainer}>
                                                <Text numberOfLines={1} style={[styles.channelName, { color: black }]}>
                                                    {member.user?.name || member.user?.id || ''}
                                                </Text>
                                                <Text style={[styles.channelStatus, { color: grey }]}>
                                                    {member.user?.online
                                                        ? 'Online'
                                                        : `Last Seen ${dayjs(member.user?.last_active).fromNow()}`}
                                                </Text>
                                                <View style={styles.userItemContainer}>
                                                    <Avatar
                                                        image={member.user?.image}
                                                        name={member.user?.name || member.user?.id}
                                                        online={member.user?.online}
                                                        presenceIndicatorContainerStyle={styles.avatarPresenceIndicator}
                                                        size={avatarSize}
                                                    />
                                                </View>
                                            </View>
                                            <TapGestureHandler
                                                onHandlerStateChange={async ({ nativeEvent: { state } }) => {
                                                    if (state === State.END) {
                                                        if (!client.user?.id) return;

                                                        const members = [client.user.id, member.user?.id || ''];

                                                        // Check if the channel already exists.
                                                        const channels = await client.queryChannels({
                                                            distinct: true,
                                                            members,
                                                        });

                                                        const newChannel =
                                                            channels.length === 1
                                                                ? channels[0]
                                                                : client.channel('messaging', {
                                                                      members,
                                                                  });
                                                        setOverlay('none');
                                                        if (navigation) {
                                                            navigation.navigate('OneOnOneChannelDetailScreen', {
                                                                channel: newChannel,
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                <View
                                                    style={[
                                                        styles.row,
                                                        {
                                                            borderTopColor: border,
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.rowInner}>
                                                        <User pathFill={grey} />
                                                    </View>
                                                    <Text style={[styles.rowText, { color: black }]}>View info</Text>
                                                </View>
                                            </TapGestureHandler>
                                            <TapGestureHandler
                                                onHandlerStateChange={async ({ nativeEvent: { state } }) => {
                                                    if (state === State.END) {
                                                        if (!client.user?.id) return;

                                                        const members = [client.user.id, member.user?.id || ''];

                                                        // Check if the channel already exists.
                                                        const channels = await client.queryChannels({
                                                            distinct: true,
                                                            members,
                                                        });

                                                        const newChannel =
                                                            channels.length === 1
                                                                ? channels[0]
                                                                : client.channel('messaging', {
                                                                      members,
                                                                  });

                                                        setOverlay('none');
                                                        if (navigation) {
                                                            navigation.navigate('ChannelScreen', {
                                                                channel: newChannel,
                                                                channelId: newChannel.id,
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                <View
                                                    style={[
                                                        styles.row,
                                                        {
                                                            borderTopColor: border,
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.rowInner}>
                                                        <MessageIcon pathFill={grey} />
                                                    </View>
                                                    <Text style={[styles.rowText, { color: black }]}>Message</Text>
                                                </View>
                                            </TapGestureHandler>
                                            {channelCreatorId === chatClient?.user?.id && channelRole === 'member' ? (
                                                <TapGestureHandler
                                                    onHandlerStateChange={({ nativeEvent: { state } }) => {
                                                        if (state === State.END) {
                                                            setData({
                                                                confirmText: 'MAKE ADMIN',
                                                                onConfirm: () => {
                                                                    if (member.user?.id) {
                                                                        handleToggleAdmin(member.user.id, false);
                                                                    }
                                                                    setOverlay('none');
                                                                },
                                                                subtext: `Are you sure you want to make ${
                                                                    member.user?.name
                                                                } admin for ${channel?.data?.name || 'group'}?`,
                                                                title: 'Make Admin',
                                                            });
                                                            setOverlay('confirmation');
                                                        }
                                                    }}
                                                >
                                                    <View
                                                        style={[
                                                            styles.row,
                                                            {
                                                                borderTopColor: border,
                                                            },
                                                        ]}
                                                    >
                                                        <View style={styles.rowInner}>
                                                            <AddUser fill={accent_blue} height={24} width={24} />
                                                        </View>
                                                        <Text style={[styles.rowText, { color: accent_blue }]}>
                                                            Make Group Admin
                                                        </Text>
                                                    </View>
                                                </TapGestureHandler>
                                            ) : null}
                                            {channelCreatorId === chatClient?.user?.id &&
                                            channelRole === 'moderator' ? (
                                                <TapGestureHandler
                                                    onHandlerStateChange={({ nativeEvent: { state } }) => {
                                                        if (state === State.END) {
                                                            setData({
                                                                confirmText: 'REMOVE',
                                                                onConfirm: () => {
                                                                    if (member.user?.id) {
                                                                        handleToggleAdmin(member.user.id, true);
                                                                    }
                                                                    setOverlay('none');
                                                                },
                                                                subtext: `Are you sure you want to remove Admin rights for ${member.user?.name}?`,
                                                                title: 'Remove Admin Rights',
                                                            });
                                                            setOverlay('confirmation');
                                                        }
                                                    }}
                                                >
                                                    <View
                                                        style={[
                                                            styles.row,
                                                            {
                                                                borderTopColor: border,
                                                            },
                                                        ]}
                                                    >
                                                        <View style={styles.rowInner}>
                                                            <UserMinus pathFill={accent_red} />
                                                        </View>
                                                        <Text style={[styles.rowText, { color: accent_red }]}>
                                                            Remove Admin Rights
                                                        </Text>
                                                    </View>
                                                </TapGestureHandler>
                                            ) : null}
                                            {channelCreatorId === chatClient?.user?.id ? (
                                                <TapGestureHandler
                                                    onHandlerStateChange={({ nativeEvent: { state } }) => {
                                                        if (state === State.END) {
                                                            setData({
                                                                confirmText: 'REMOVE',
                                                                onConfirm: () => {
                                                                    if (member.user?.id) {
                                                                        handleRemoveUser(member.user.id);
                                                                    }
                                                                    setOverlay('none');
                                                                },
                                                                subtext: `Are you sure you want to remove User from ${
                                                                    channel?.data?.name || 'group'
                                                                }?`,
                                                                title: 'Remove User',
                                                            });
                                                            setOverlay('confirmation');
                                                        }
                                                    }}
                                                >
                                                    <View
                                                        style={[
                                                            styles.row,
                                                            {
                                                                borderTopColor: border,
                                                            },
                                                        ]}
                                                    >
                                                        <View style={styles.rowInner}>
                                                            <UserMinus pathFill={accent_red} />
                                                        </View>
                                                        <Text style={[styles.rowText, { color: accent_red }]}>
                                                            Remove From Group
                                                        </Text>
                                                    </View>
                                                </TapGestureHandler>
                                            ) : null}
                                            <TapGestureHandler
                                                onHandlerStateChange={({ nativeEvent: { state } }) => {
                                                    if (state === State.END) {
                                                        setOverlay('none');
                                                    }
                                                }}
                                            >
                                                <View
                                                    style={[
                                                        styles.lastRow,
                                                        {
                                                            borderBottomColor: border,
                                                            borderTopColor: border,
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.rowInner}>
                                                        <CircleClose pathFill={grey} />
                                                    </View>
                                                    <Text style={[styles.rowText, { color: black }]}>Cancel</Text>
                                                </View>
                                            </TapGestureHandler>
                                        </>
                                    )}
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </TapGestureHandler>
                </Animated.View>
            </PanGestureHandler>
        </Animated.View>
    );
};
