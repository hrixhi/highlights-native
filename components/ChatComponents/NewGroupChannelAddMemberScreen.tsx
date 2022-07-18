import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ArrowRight, Search, useTheme } from 'stream-chat-expo';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList, StreamChatGenerics } from './types';

import { useAppChatContext } from '../../ChatContext/AppChatContext';
import { useUserSearchContext } from '../../ChatContext/useSearchContext';
import ScreenHeader from './ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useAppOverlayContext } from '../../ChatContext/AppOverlayContext';
import { UserSearchResults } from './UserResults';
import { UserGridItem } from './UserGridItem';

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
    // flatList: { paddingBottom: 16 },

    navigationButton: {
        paddingRight: 8,
    },
    userGridItemContainer: { marginHorizontal: 8, width: 64 },
    flatList: { paddingBottom: 16 },
});

type RightArrowButtonProps = {
    disabled?: boolean;
    onPress?: () => void;
};

const RightArrowButton: React.FC<RightArrowButtonProps> = (props) => {
    const { disabled, onPress } = props;

    const {
        theme: {
            colors: { accent_blue },
        },
    } = useTheme();

    return (
        <TouchableOpacity disabled={disabled} onPress={onPress} style={styles.navigationButton}>
            <ArrowRight pathFill={disabled ? 'transparent' : accent_blue} />
        </TouchableOpacity>
    );
};

export type NewGroupChannelAddMemberScreenNavigationProp = StackNavigationProp<
    StackNavigatorParamList,
    'NewGroupChannelAddMemberScreen'
>;

type Props = {
    navigation: NewGroupChannelAddMemberScreenNavigationProp;
};

export const NewGroupChannelAddMemberScreen: React.FC<Props> = ({ navigation }) => {
    const {
        theme: {
            colors: { accent_blue, black, border, grey, white },
        },
    } = useTheme();
    const { chatClient } = useAppChatContext();

    const { setOverlay } = useAppOverlayContext();

    const { onChangeSearchText, onFocusInput, removeUser, reset, searchText, selectedUsers } = useUserSearchContext();

    console.log('selected users', selectedUsers);

    const onRightArrowPress = () => {
        if (selectedUsers.length === 0) return;
        navigation.navigate('NewGroupChannelAssignNameScreen');
    };

    if (!chatClient) return null;

    return (
        <View style={styles.container}>
            <ScreenHeader
                onBack={reset}
                RightContent={() => (
                    <RightArrowButton disabled={selectedUsers.length === 0} onPress={onRightArrowPress} />
                )}
                titleText="New Group"
                subtitleText={selectedUsers.length + ' users selected'}
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
            <View
                style={{
                    maxHeight: 150,
                }}
            >
                <FlatList
                    data={selectedUsers}
                    horizontal
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={({ index, item: user }) => (
                        <View style={styles.userGridItemContainer}>
                            <UserGridItem
                                onPress={() => {
                                    removeUser(index);
                                }}
                                user={user}
                            />
                        </View>
                    )}
                    style={selectedUsers.length ? styles.flatList : {}}
                />
            </View>

            {/* Show Active filter */}

            {/* Show User List */}
            <UserSearchResults createGroup={true} />
        </View>
    );
};
