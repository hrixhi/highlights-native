import React, { useEffect, useState } from 'react';
import { Dimensions, LogBox, Platform, SafeAreaView } from 'react-native';

import { View, Text } from './Themed';

// STACK NAVIGATOR
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// STREAM
import { Chat, Streami18n, ThemeProvider, useOverlayContext } from 'stream-chat-expo';

import { useAppChatContext } from '../ChatContext/AppChatContext';
import {
    ChannelListScreen,
    ChannelScreen,
    NewDirectMessagingScreen,
    NewGroupChannelAddMemberScreen,
    NewMeetingScreen,
} from './ChatComponents';
import { useStreamChatTheme } from '../ChatHooks/useStreamChatTheme';
import { AppOverlayProvider } from '../ChatContext/AppOverlayProvider';
import { UserSearchProvider } from '../ChatContext/useSearchContext';
import { NewGroupChannelAssignNameScreen } from './ChatComponents/NewGroupChannelAssignDetails';
import { OneOnOneChannelDetailScreen } from './ChatComponents/OneOnOneChannelDetailScreen';
import { GroupChannelDetailsScreen } from './ChatComponents/GroupChannelDetailScreen';
import { ChannelImagesScreen } from './ChatComponents/ChannelImagesScreen';
import { ChannelFilesScreen } from './ChatComponents/ChannelFilesScreen';
import { ChannelPinnedMessagesScreen } from './ChatComponents/ChannelPinnedMessagesScreen';
import { SharedGroupsScreen } from './ChatComponents/SharedGroupsScreen';
import { ThreadScreen } from './ChatComponents/ThreadScreen';
import { ExistingChannelAddMembersScreen } from './ChatComponents/ExistingChannelAddMembersScreen';
import { useAppContext } from '../contexts/AppContext';
import { navigateToChannel } from '../ChatHooks/RootNavigation';

const Stack = createStackNavigator();

const streami18n = new Streami18n({
    language: 'en',
});

const Inbox = (props: any) => {
    const { chatClient } = useAppChatContext();

    const streamChatTheme = useStreamChatTheme();

    const { overlay } = useOverlayContext();

    const { subscriptions, user, meetingProvider, openChannelId, setOpenChannelId, openMessageId, setOpenMessageId } =
        useAppContext();

    return (
        <ThemeProvider theme={streamChatTheme}>
            <View
                style={{
                    height:
                        Dimensions.get('window').width < 768
                            ? Dimensions.get('window').height - (Platform.OS === 'ios' ? 135 : 70)
                            : Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 100
                            : Dimensions.get('window').height - 113,
                }}
            >
                {chatClient && (
                    <Chat client={chatClient} i18nInstance={streami18n}>
                        <AppOverlayProvider
                            value={{
                                subscriptions: subscriptions,
                                currentUserRole: user.role,
                                user: user,
                                meetingProvider: meetingProvider,
                            }}
                        >
                            <UserSearchProvider>
                                <Stack.Navigator
                                    initialRouteName={'ChannelListScreen'}
                                    screenOptions={{
                                        headerStyle: {
                                            backgroundColor: '#fff',
                                            borderBottomWidth: 0,
                                        },
                                        headerTintColor: '#000',
                                        headerTitleStyle: {
                                            fontWeight: 'bold',
                                            fontFamily: 'Inter',
                                            fontSize: 20,
                                        },
                                    }}
                                >
                                    {/* INIT SCREEN WITH CHANNEL LIST */}
                                    <Stack.Screen
                                        component={ChannelListScreen}
                                        name="ChannelListScreen"
                                        options={{
                                            headerShown: false,
                                        }}
                                    />

                                    <Stack.Screen
                                        component={ChannelScreen}
                                        // initialParams={{
                                        //     channelId: channelIdFromSearch,
                                        //     messageId: messageIdFromSearch,
                                        // }}
                                        name="ChannelScreen"
                                        options={{
                                            gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        component={NewDirectMessagingScreen}
                                        name="NewDirectMessagingScreen"
                                        options={{
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        component={NewGroupChannelAddMemberScreen}
                                        name="NewGroupChannelAddMemberScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={NewGroupChannelAssignNameScreen}
                                        name="NewGroupChannelAssignNameScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={OneOnOneChannelDetailScreen}
                                        name="OneOnOneChannelDetailScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={GroupChannelDetailsScreen}
                                        name="GroupChannelDetailsScreen"
                                        options={{ headerShown: false }}
                                    />

                                    <Stack.Screen
                                        component={ChannelImagesScreen}
                                        name="ChannelImagesScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={ChannelFilesScreen}
                                        name="ChannelFilesScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={ChannelPinnedMessagesScreen}
                                        name="ChannelPinnedMessagesScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={SharedGroupsScreen}
                                        name="SharedGroupsScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={ThreadScreen}
                                        name="ThreadScreen"
                                        options={{
                                            gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        component={NewMeetingScreen}
                                        name="NewMeetingScreen"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        component={ExistingChannelAddMembersScreen}
                                        name="ExistingChannelAddMembersScreen"
                                        options={{ headerShown: false }}
                                    />
                                </Stack.Navigator>
                            </UserSearchProvider>
                        </AppOverlayProvider>
                    </Chat>
                )}
            </View>
        </ThemeProvider>
    );
};

export default Inbox;
