import React, { useEffect, useState } from 'react';
import type { Channel as StreamChatChannel } from 'stream-chat';
import { RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    Channel,
    ChannelAvatar,
    MessageInput,
    MessageList,
    ThreadContextValue,
    useAttachmentPickerContext,
    useChannelPreviewDisplayName,
    useChatContext,
    useTheme,
    useTypingString,
} from 'stream-chat-expo';
import { Image, Platform, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppChatContext } from '../../ChatContext/AppChatContext';
import ScreenHeader from './ScreenHeader';

import type { StackNavigatorParamList, StreamChatGenerics } from './types';
import { useChannelMembersStatus } from '../../ChatHooks/useChannelMemberStatus';
import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { Text } from '../Themed';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

import zoomLogo from '../../assets/images/zoomLogo.png';
import { fileUpload, fileUploadInbox } from '../../helpers/FileUpload';

const styles = StyleSheet.create({
    flex: { flex: 1 },
});

export type ChannelScreenNavigationProp = StackNavigationProp<StackNavigatorParamList, 'ChannelScreen'>;
export type ChannelScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelScreen'>;
export type ChannelScreenProps = {
    navigation: ChannelScreenNavigationProp;
    route: ChannelScreenRouteProp;
};

export type ChannelHeaderProps = {
    channel: StreamChatChannel<StreamChatGenerics>;
};

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
    const { closePicker } = useAttachmentPickerContext();
    const membersStatus = useChannelMembersStatus(channel);
    const displayName = useChannelPreviewDisplayName(channel, 30);
    const { isOnline } = useChatContext();
    const { chatClient } = useAppChatContext();
    const navigation = useNavigation<ChannelScreenNavigationProp>();
    const typing = useTypingString();
    const { user, meetingProvider } = useAppOverlayContext();

    if (!channel || !chatClient) return null;

    const isOneOnOneConversation =
        channel && Object.values(channel.state.members).length === 2 && channel.id?.indexOf('!members-') === 0;

    return (
        <ScreenHeader
            onBack={() => {
                if (!navigation.canGoBack()) {
                    // if no previous screen was present in history, go to the list screen
                    // this can happen when opened through push notification
                    navigation.navigate('ChannelListScreen');
                }
            }}
            RightContent={() => (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    {!meetingProvider && user.zoomInfo ? (
                        <TouchableOpacity
                            style={{
                                marginRight: 15,
                            }}
                            onPress={() => {
                                navigation.navigate('NewMeetingScreen', {
                                    channel,
                                });
                            }}
                        >
                            <Text>
                                <Ionicons name={'videocam'} color={'#858688'} size={22} />
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        onPress={() => {
                            closePicker();
                            if (isOneOnOneConversation) {
                                navigation.navigate('OneOnOneChannelDetailScreen', {
                                    channel,
                                });
                            } else {
                                navigation.navigate('GroupChannelDetailsScreen', {
                                    channel,
                                });
                            }
                        }}
                    >
                        <ChannelAvatar channel={channel} />
                    </TouchableOpacity>
                </View>
            )}
            showUnreadCountBadge
            // Subtitle={isOnline ? undefined : NetworkDownIndicator}
            subtitleText={typing ? typing : membersStatus}
            titleText={displayName}
        />
    );
};

// Either provide channel or channelId.
const ChannelScreen: React.FC<ChannelScreenProps> = ({
    route: {
        params: { channel: channelFromProp, channelId, messageId },
    },
}) => {
    const { chatClient } = useAppChatContext();
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();
    const {
        theme: {
            colors: { white },
        },
    } = useTheme();

    const [channel, setChannel] = useState<StreamChatChannel<StreamChatGenerics> | undefined>(channelFromProp);

    const [selectedThread, setSelectedThread] = useState<ThreadContextValue<StreamChatGenerics>['thread']>();

    useEffect(() => {
        const initChannel = async () => {
            if (!chatClient || !channelId) return;

            console.log('INIT Channel Id', channelId);

            const newChannel = chatClient?.channel('messaging', channelId);

            console.log('New Channel', newChannel);

            if (!newChannel?.initialized) {
                await newChannel?.watch();
            }
            setChannel(newChannel);
        };

        initChannel();
    }, [channelId]);

    useFocusEffect(() => {
        setSelectedThread(undefined);
    });

    const handleFileUpload = async (file: any, channel: any) => {
        console.log('File', file);

        let nameParts = file.type.split('.');
        let type = nameParts[nameParts.length - 1];

        if (!chatClient || !chatClient.userID) return;

        const res = await fileUploadInbox(file, type, chatClient.userID);

        console.log('Image upload', res);

        const { data } = res;
        if (data.status === 'success') {
            return {
                file: data.url,
            };
            // Fallback to STREAM CDN
        }
        return undefined;
    };

    if (!channel || !chatClient) return null;

    const CustomAttachment = ({ type, title, start, end, meetingJoinLink, meetingStartLink, createdBy }) => {
        if (type === 'meeting') {
            return (
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 15,
                        backgroundColor: '#fff',
                        marginBottom: 10,
                        borderRadius: 10,
                        marginHorizontal: 10,
                    }}
                >
                    <Image
                        source={zoomLogo}
                        style={{
                            height: 37,
                            width: 37,
                            borderRadius: 75,
                            alignSelf: 'center',
                        }}
                    />

                    <View
                        style={{
                            marginLeft: 20,
                            flexDirection: 'column',
                            maxWidth: 200,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 15,
                                marginBottom: 10,
                            }}
                        >
                            {title ? title : 'Test'}
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Overpass',
                                fontSize: 12,
                            }}
                        >
                            {moment(new Date(start)).format('MMM Do, h:mm a')} -{' '}
                            {moment(new Date(end)).format('MMM Do, h:mm a')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            Linking.openURL(
                                createdBy && createdBy === chatClient.userID ? meetingStartLink : meetingJoinLink
                            );
                        }}
                        style={{
                            borderRadius: 15,
                            backgroundColor: '#000',
                            marginLeft: 20,
                            paddingHorizontal: 20,
                            paddingVertical: 9,
                        }}
                    >
                        <Text
                            style={{
                                color: '#fff',
                                fontSize: 10,
                            }}
                        >
                            JOIN
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={[styles.flex, { backgroundColor: white, paddingBottom: bottom }]}>
            <Channel
                channel={channel}
                disableTypingIndicator
                enforceUniqueReaction
                initialScrollToFirstUnreadMessage
                keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : -130}
                messageId={messageId}
                thread={selectedThread}
                Card={CustomAttachment}
                doImageUploadRequest={handleFileUpload}
                doDocUploadRequest={handleFileUpload}
            >
                <ChannelHeader channel={channel} />
                <MessageList<StreamChatGenerics>
                    onThreadSelect={(thread) => {
                        setSelectedThread(thread);
                        navigation.navigate('ThreadScreen', {
                            channel,
                            thread,
                        });
                    }}
                />
                <MessageInput />
            </Channel>
        </View>
    );
};

export default ChannelScreen;
