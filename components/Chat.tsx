import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, LogBox, Platform, SafeAreaView, StyleSheet } from 'react-native';

import { View, Text } from './Themed';

// STACK NAVIGATOR
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, useHeaderHeight } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// STREAM
import {
    Channel,
    ChannelList,
    Chat,
    MessageInput,
    MessageList,
    OverlayProvider,
    Streami18n,
    Thread,
    useAttachmentPickerContext,
    ThemeProvider,
    useOverlayContext,
} from 'stream-chat-expo';

import { useAppContext } from '../ChatContext/AppContext';
import {
    ChannelListScreen,
    ChannelScreen,
    ScreenHeader,
    NewDirectMessagingScreen,
    NewGroupChannelAddMemberScreen,
} from './ChatComponents';
import { TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
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

const Stack = createStackNavigator();

const streami18n = new Streami18n({
    language: 'en',
});

const Inbox = (props: any) => {
    const { bottom } = useSafeAreaInsets();
    const [channel, setChannel] = useState();
    const [thread, setThread] = useState();
    const [chatError, setChatError] = useState('');
    const { chatClient } = useAppContext();

    const streamChatTheme = useStreamChatTheme();

    const { overlay } = useOverlayContext();

    return (
        <ThemeProvider theme={streamChatTheme}>
            <View
                style={{
                    height:
                        Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 135
                            : Dimensions.get('window').height - 68,
                    maxHeight:
                        Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 135
                            : Dimensions.get('window').height - 68,
                }}
            >
                {chatClient && (
                    <Chat client={chatClient} i18nInstance={streami18n}>
                        <AppOverlayProvider
                            value={{
                                subscriptions: props.subscriptions,
                                currentUserRole: props.user.role,
                            }}
                        >
                            <UserSearchProvider>
                                <Stack.Navigator
                                    initialRouteName="ChannelList"
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
                                        name="ChannelList"
                                        options={{
                                            headerShown: false,
                                        }}
                                    />

                                    <Stack.Screen
                                        component={ChannelScreen}
                                        // initialParams={
                                        //     initialChannelIdGlobalRef.current
                                        //         ? { channelId: initialChannelIdGlobalRef.current }
                                        //         : undefined
                                        // }
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
