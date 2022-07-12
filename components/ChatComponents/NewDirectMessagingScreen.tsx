import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Search, useTheme } from 'stream-chat-expo';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList, StreamChatGenerics } from './types';

import { useAppContext } from '../../ChatContext/AppContext';
import { useUserSearchContext } from '../../ChatContext/useSearchContext';
import ScreenHeader from './ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { UserSearchResults } from './UserResults';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    createGroupButtonContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 16,
    },
    createGroupButtonText: {
        fontSize: 14,
        fontWeight: '700',
        paddingLeft: 8,
    },
    emptyMessageContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    inputBox: {
        // flex: 1,
        width: '100%',
        fontSize: 14,
        includeFontPadding: false, // for android vertical text centering
        padding: 0, // removal of default text input padding on android
        paddingHorizontal: 16,
        paddingTop: 0, // removal of iOS top padding for weird centering
        textAlignVertical: 'center', // for android vertical text centering
    },
    inputBoxContainer: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: 'row',
        marginHorizontal: 10,

        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    noChats: { fontSize: 12 },
    searchContainer: {
        borderBottomWidth: 1,
        flexDirection: 'row',
    },
    searchContainerLeft: {
        fontSize: 12,
        paddingHorizontal: 16,
        paddingVertical: 20,
        textAlignVertical: 'center',
    },
    searchContainerMiddle: {
        flex: 1,
        justifyContent: 'center',
    },
    searchContainerRight: {
        justifyContent: 'flex-end',
        paddingBottom: 16,
        paddingRight: 16,
    },
    selectedUsersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});

const EmptyMessagesIndicator = () => {
    const {
        theme: {
            colors: { grey },
        },
    } = useTheme();
    return (
        <View style={styles.emptyMessageContainer}>
            <Text
                style={[
                    styles.noChats,
                    {
                        color: grey,
                    },
                ]}
            >
                No chats here yet...
            </Text>
        </View>
    );
};

export type NewDirectMessagingScreenNavigationProp = StackNavigationProp<
    StackNavigatorParamList,
    'NewDirectMessagingScreen'
>;

export type NewDirectMessagingScreenProps = {
    navigation: NewDirectMessagingScreenNavigationProp;
};

export const NewDirectMessagingScreen: React.FC<NewDirectMessagingScreenProps> = ({ navigation }) => {
    const {
        theme: {
            colors: { accent_blue, black, border, grey, white },
        },
    } = useTheme();
    const { chatClient } = useAppContext();

    const { setOverlay } = useAppOverlayContext();

    const { onChangeSearchText, onFocusInput, removeUser, reset, searchText, selectedUsers } = useUserSearchContext();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // The screen is focused
            // Call any action
            console.log('Focus hook called');
            reset();
        });

        // Return the function to unsubscribe from the event so it gets removed on unmount
        return unsubscribe;
    }, [navigation]);

    if (!chatClient) return null;

    return (
        <View style={styles.container}>
            <ScreenHeader
                onBack={reset}
                titleText="New Chat"
                RightContent={() => (
                    <TouchableOpacity
                        onPress={() => {
                            navigation.push('NewGroupChannelAddMemberScreen');
                        }}
                        // style={styles.createGroupButtonContainer}
                    >
                        <Text>
                            <Ionicons name={'people-outline'} size={23} />
                        </Text>
                    </TouchableOpacity>
                )}
            />
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 8,
                    backgroundColor: '#fff',
                }}
            >
                <View
                    style={[
                        styles.inputBoxContainer,
                        {
                            backgroundColor: white,
                            borderColor: border,

                            // marginBottom: selectedUsers.length === 0 ? 8 : 16,
                        },
                    ]}
                >
                    <Search pathFill={black} />
                    <TextInput
                        onChangeText={onChangeSearchText}
                        onFocus={onFocusInput}
                        placeholder="Search"
                        placeholderTextColor={grey}
                        style={[
                            styles.inputBox,
                            {
                                color: black,
                            },
                        ]}
                        value={searchText}
                    />
                </View>

                <TouchableOpacity
                    style={{
                        paddingHorizontal: 10,
                    }}
                    onPress={() => {
                        setOverlay('directoryFilter');
                    }}
                >
                    <Text>
                        <Ionicons name={'filter-outline'} size={Dimensions.get('window').width < 800 ? 23 : 26} />
                    </Text>
                </TouchableOpacity>
            </View>
            {/* {!searchText && selectedUsers.length === 0 && (
                <TouchableOpacity
                    onPress={() => {
                        navigation.push('NewGroupChannelAddMemberScreen');
                    }}
                    style={styles.createGroupButtonContainer}
                >
                    <Text>
                        <Ionicons name={'people-outline'} size={20} />
                    </Text>

                    <Text
                        style={[
                            styles.createGroupButtonText,
                            {
                                color: black,
                            },
                        ]}
                    >
                        Create a Group
                    </Text>
                </TouchableOpacity>
            )} */}

            {/* Show Active filter */}

            {/* Show User List */}
            <UserSearchResults createGroup={false} />
        </View>
    );
};
