import React, { useCallback, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, useTheme } from 'stream-chat-expo';

import { useAppChatContext } from '../../ChatContext/AppChatContext';
import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../../ChatContext/BottomSheetOverlayContext';

import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from './types';
import { getUserActivityStatus } from '../../helpers/getUserActivityStatus';

import { Contacts, Delete, File, GoBack, GoForward, Mute, Notification, Picture, Pin } from '../../assets/chatIcons';

const styles = StyleSheet.create({
    avatarPresenceIndicator: {
        right: 5,
        top: 1,
    },
    actionContainer: {
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    actionLabelContainer: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    avatar: {
        borderRadius: 36,
        height: 72,
        width: 72,
    },
    backButton: {
        left: 0,
        paddingLeft: 16,
        position: 'absolute',
        top: 0,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    displayName: {
        fontSize: 16,
        fontWeight: '600',
        paddingTop: 16,
    },
    itemText: {
        fontSize: 14,
        paddingLeft: 16,
    },
    onlineIndicator: {
        borderRadius: 4,
        height: 8,
        width: 8,
    },
    onlineStatus: {
        fontSize: 12,
        paddingLeft: 8,
    },
    onlineStatusContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 16,
        paddingTop: 8,
    },
    spacer: {
        height: 8,
    },
    userInfoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    userName: {
        fontSize: 14,
    },
    userNameContainer: {
        alignSelf: 'stretch',
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
});

type OneOnOneChannelDetailScreenRouteProp = RouteProp<StackNavigatorParamList, 'OneOnOneChannelDetailScreen'>;

type OneOnOneChannelDetailScreenNavigationProp = StackNavigationProp<
    StackNavigatorParamList,
    'OneOnOneChannelDetailScreen'
>;

type Props = {
    navigation: OneOnOneChannelDetailScreenNavigationProp;
    route: OneOnOneChannelDetailScreenRouteProp;
};

const Spacer = () => {
    const {
        theme: {
            colors: { grey_gainsboro },
        },
    } = useTheme();
    return (
        <View
            style={[
                styles.spacer,
                {
                    backgroundColor: grey_gainsboro,
                },
            ]}
        />
    );
};

export const OneOnOneChannelDetailScreen: React.FC<Props> = ({
    navigation,
    route: {
        params: { channel },
    },
}) => {
    const {
        theme: {
            colors: { accent_green, accent_red, black, border, grey, white, white_smoke },
        },
    } = useTheme();
    const { chatClient } = useAppChatContext();
    const { setOverlay } = useAppOverlayContext();
    const { setData } = useBottomSheetOverlayContext();

    const member = Object.values(channel.state.members).find(
        (channelMember) => channelMember.user?.id !== chatClient?.user?.id
    );

    const [user, setUser] = useState(member?.user);
    const [muted, setMuted] = useState(
        chatClient?.mutedUsers &&
            chatClient?.mutedUsers?.findIndex((mutedUser) => mutedUser.target.id === user?.id) > -1
    );
    const [notificationsEnabled, setNotificationsEnabled] = useState(
        chatClient?.mutedChannels &&
            chatClient.mutedChannels.findIndex((mutedChannel) => mutedChannel.channel?.id === channel.id) > -1
    );

    const updatePresenceChanged = useCallback(
        (event: any) => {
            if (!event) return;

            const channelId = event.channel_id;

            const fetchChannel = chatClient?.channel('messaging', channelId);

            if (!fetchChannel) return;

            const member = Object.values(channel.state.members).find(
                (channelMember) => channelMember.user?.id !== chatClient?.user?.id
            );

            setUser(member?.user);
        },
        [chatClient, channel]
    );

    useEffect(() => {
        if (chatClient) {
            chatClient.on('user.presence.changed', updatePresenceChanged);

            return () => {
                chatClient.off('user.presence.changed', updatePresenceChanged);
            };
        }
    }, [chatClient]);

    /**
     * Opens confirmation sheet for deleting the conversation
     */
    const openDeleteConversationConfirmationSheet = () => {
        if (!chatClient?.user?.id) return;
        setData({
            confirmText: 'DELETE',
            onConfirm: deleteConversation,
            subtext: 'Are you sure you want to delete this conversation?',
            title: 'Delete Conversation',
        });
        setOverlay('confirmation');
    };

    /**
     * Leave the group/channel
     */
    const deleteConversation = async () => {
        await channel.delete();
        setOverlay('none');
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'ChannelListScreen',
                },
            ],
        });
    };

    function capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    if (!user) return null;

    return (
        <View style={[{ backgroundColor: white }, styles.container]}>
            <ScrollView contentContainerStyle={styles.contentContainer} style={styles.container}>
                <View style={styles.userInfoContainer}>
                    {/* Avatar */}
                    <Avatar
                        image={user.image}
                        name={user.name || user.id}
                        // online={user.online}
                        // presenceIndicatorContainerStyle={styles.avatarPresenceIndicator}
                        size={100}
                    />
                    <Text
                        style={[
                            styles.displayName,
                            {
                                color: black,
                            },
                        ]}
                    >
                        {user.name}
                    </Text>
                    <View style={styles.onlineStatusContainer}>
                        {user.online && <View style={[{ backgroundColor: accent_green }, styles.onlineIndicator]} />}
                        <Text
                            style={[
                                styles.onlineStatus,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            {user?.online ? 'Online' : getUserActivityStatus(user)}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.userNameContainer,
                            {
                                borderTopColor: border,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.userName,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            {user.name}
                        </Text>
                        <Text
                            style={[
                                styles.userName,
                                {
                                    color: grey,
                                },
                            ]}
                        >
                            {capitalizeFirstLetter(user.cues_role)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.goBack();
                        }}
                        style={styles.backButton}
                    >
                        <GoBack height={24} width={24} />
                    </TouchableOpacity>
                </View>
                <Spacer />
                {/* <TouchableOpacity
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Notification fill={grey} height={24} width={24} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Notifications
                        </Text>
                    </View>
                    <View>
                        <Switch
                            onValueChange={async () => {
                                if (notificationsEnabled) {
                                    await channel.unmute();
                                } else {
                                    await channel.mute();
                                }
                                setNotificationsEnabled((previousState) => !previousState);
                            }}
                            trackColor={{
                                false: white_smoke,
                                true: accent_green,
                            }}
                            value={notificationsEnabled}
                        />
                    </View>
                </TouchableOpacity> */}
                <TouchableOpacity
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Mute height={24} width={24} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Mute user
                        </Text>
                    </View>
                    <View>
                        <Switch
                            onValueChange={async () => {
                                if (muted) {
                                    const r = await chatClient?.unmuteUser(user.id);
                                    console.warn(r);
                                } else {
                                    const r = await chatClient?.muteUser(user.id);
                                    console.warn(r);
                                }
                                setMuted((previousState) => !previousState);
                            }}
                            trackColor={{
                                false: white_smoke,
                                true: accent_green,
                            }}
                            value={muted}
                        />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('ChannelPinnedMessagesScreen', {
                            channel,
                        });
                    }}
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Pin fill={grey} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Pinned Messages
                        </Text>
                    </View>
                    <View>
                        <GoForward fill={grey} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('ChannelImagesScreen', {
                            channel,
                        });
                    }}
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Picture fill={grey} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Photos and Videos
                        </Text>
                    </View>
                    <View>
                        <GoForward fill={grey} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('ChannelFilesScreen', {
                            channel,
                        });
                    }}
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <File pathFill={grey} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Files
                        </Text>
                    </View>
                    <View>
                        <GoForward fill={grey} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('SharedGroupsScreen', {
                            user,
                        });
                    }}
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Contacts fill={grey} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: black,
                                },
                            ]}
                        >
                            Shared Groups
                        </Text>
                    </View>
                    <View>
                        <GoForward fill={grey} />
                    </View>
                </TouchableOpacity>
                {/* <Spacer />
                <TouchableOpacity
                    onPress={openDeleteConversationConfirmationSheet}
                    style={[
                        styles.actionContainer,
                        {
                            borderBottomColor: border,
                        },
                    ]}
                >
                    <View style={styles.actionLabelContainer}>
                        <Delete fill={accent_red} height={24} width={24} />
                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: accent_red,
                                },
                            ]}
                        >
                            Delete chat
                        </Text>
                    </View>
                </TouchableOpacity> */}
            </ScrollView>
        </View>
    );
};
