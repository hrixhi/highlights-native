import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Avatar, CheckSend, Close, Search, useTheme, vw } from 'stream-chat-expo';

import type { Channel, UserResponse } from 'stream-chat';

import { StreamChatGenerics } from './types';

import { useUserSearchContext } from '../../ChatContext/useSearchContext';
import { useDirectoryFilterOverlayContext } from '../../ChatContext/DirectoryFilterContext';
import { useNavigation } from '@react-navigation/native';
import { useAppChatContext } from '../../ChatContext/AppChatContext';
import { usePaginatedUsers } from '../../ChatHooks/usePaginatedUsers';
// import { Search } from '../../icons/Search';

const styles = StyleSheet.create({
    absolute: { position: 'absolute' },
    emptyResultIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 28,
    },
    emptyResultIndicatorText: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 28,
    },
    flex: { flex: 1 },
    gradient: {
        height: 24,
        paddingHorizontal: 8,
        paddingVertical: 5,
        flexDirection: 'row',
    },
    matches: { fontSize: 12 },
    searchResultContainer: {
        alignItems: 'center',
        borderBottomWidth: 1,
        flexDirection: 'row',
        paddingLeft: 8,
        paddingRight: 16,
        paddingVertical: 12,
    },
    searchResultUserDetails: {
        flex: 1,
        paddingLeft: 8,
    },
    searchResultUserLastOnline: { fontSize: 12, marginTop: 3 },
    searchResultUserName: { fontSize: 14, fontWeight: '700' },
    sectionHeader: {
        fontSize: 14.5,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
});

type UserSearchResultsProps = {
    createGroup?: boolean;
    groupedAlphabetically?: boolean;
    removeOnPressOnly?: boolean;
    results?: UserResponse<StreamChatGenerics>[];
    showOnlineStatus?: boolean;
    toggleSelectedUser?: (user: UserResponse<StreamChatGenerics>) => void;
    showSelectedUsersOnly?: boolean;
};

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({
    createGroup = false,
    groupedAlphabetically = true,
    removeOnPressOnly = false,
    results: resultsProp,
    showOnlineStatus = true,
    showSelectedUsersOnly = false,
    toggleSelectedUser,
}) => {
    const {
        loading,
        loadMore,
        results: resultsContext,
        searchText,
        selectedUserIds,
        toggleUser,
        displayUsers,
        toggleAllSelected,
        allSelected,
    } = useUserSearchContext();

    const { filterByCourses, selectedCourse, selectedRole, selectedGrade, selectedSection, subscriptions } =
        useDirectoryFilterOverlayContext();

    const [displayUsersSections, setDisplayUsersSections] = useState<
        Array<{
            data: UserResponse<StreamChatGenerics>[];
            title: string;
        }>
    >([]);

    const [searchSections, setSearchSections] = useState<
        Array<{
            data: UserResponse<StreamChatGenerics>[];
            title: string;
        }>
    >([]);

    const [selectedCourseLabel, setSelectedCourseLabel] = useState('');

    const navigation = useNavigation();

    const { chatClient } = useAppChatContext();

    const {
        theme: {
            colors: {
                accent_blue,
                bg_gradient_end,
                bg_gradient_start,
                black,
                border,
                grey,
                grey_gainsboro,
                white_smoke,
                white_snow,
            },
        },
    } = useTheme();

    const results = resultsProp || resultsContext;
    const resultsLength = results.length;

    const displayUsersLength = displayUsers.length;

    const startChat = useCallback(
        async (user: any) => {
            if (!chatClient) return;

            const channel: Channel<StreamChatGenerics> = await chatClient.channel('messaging', {
                members: [user.id, chatClient.userID],
                team: chatClient.user.schoolId,
            });

            if (!channel || !channel.id) {
                await channel.create();
            }

            console.log('Start chat channel', channel.id);

            navigation.goBack();

            navigation.navigate('ChannelScreen', {
                channelId: channel.id,
            });
        },
        [chatClient]
    );

    useEffect(() => {
        if (selectedCourse !== 'All' && subscriptions) {
            const findSelected = subscriptions.find((sub: any) => sub.channelId === selectedCourse);

            if (findSelected) {
                setSelectedCourseLabel(findSelected.channelName);
            }
        }
    }, [selectedCourse, subscriptions]);

    useEffect(() => {
        const newSections: {
            [key: string]: {
                data: UserResponse<StreamChatGenerics>[];
                title: string;
            };
        } = {};

        results.forEach((user) => {
            const initial = user.name?.slice(0, 1).toUpperCase();

            if (!initial) return;

            if (!newSections[initial]) {
                newSections[initial] = {
                    data: [user],
                    title: initial,
                };
            } else {
                newSections[initial].data.push(user);
            }
        });
        setSearchSections(Object.values(newSections));
    }, [resultsLength]);

    useEffect(() => {
        const newSections: {
            [key: string]: {
                data: UserResponse<StreamChatGenerics>[];
                title: string;
            };
        } = {};

        displayUsers.forEach((user) => {
            const initial = user.name?.slice(0, 1).toUpperCase();

            if (!initial) return;

            if (!newSections[initial]) {
                newSections[initial] = {
                    data: [user],
                    title: initial,
                };
            } else {
                newSections[initial].data.push(user);
            }
        });
        setDisplayUsersSections(Object.values(newSections));
    }, [displayUsersLength, allSelected]);

    function capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    return (
        <View style={[styles.flex, { backgroundColor: white_snow }]}>
            {/* Header for search results */}
            {groupedAlphabetically && searchText !== '' && searchSections.length > 0 && (
                <View style={styles.gradient}>
                    <Svg height={24} style={styles.absolute} width={vw(100)}>
                        <Rect fill="url(#gradient)" height={24} width={vw(100)} x={0} y={0} />
                        <Defs>
                            <LinearGradient gradientUnits="userSpaceOnUse" id="gradient" x1={0} x2={0} y1={0} y2={24}>
                                <Stop offset={1} stopColor={bg_gradient_start} stopOpacity={1} />
                                <Stop offset={0} stopColor={bg_gradient_end} stopOpacity={1} />
                            </LinearGradient>
                        </Defs>
                    </Svg>
                    <Text
                        style={[
                            styles.matches,
                            {
                                color: grey,
                            },
                        ]}
                    >
                        {searchText !== '' ? `Matches for "${searchText}"` : ''}
                    </Text>
                </View>
            )}
            {/* Header for Browse Directory */}
            {groupedAlphabetically && !searchText && displayUsersSections.length > 0 && (
                <View style={styles.gradient}>
                    {/* <Svg height={24} style={styles.absolute} width={vw(100)}>
                        <Rect fill="url(#gradient)" height={24} width={vw(100)} x={0} y={0} />
                        <Defs>
                            <LinearGradient gradientUnits="userSpaceOnUse" id="gradient" x1={0} x2={0} y1={0} y2={24}>
                                <Stop offset={1} stopColor={bg_gradient_start} stopOpacity={1} />
                                <Stop offset={0} stopColor={bg_gradient_end} stopOpacity={1} />
                            </LinearGradient>
                        </Defs>
                    </Svg> */}
                    <Text
                        style={[
                            styles.matches,
                            {
                                color: grey,
                            },
                        ]}
                    >
                        Directory {' > '}{' '}
                        {filterByCourses
                            ? selectedCourse === 'All'
                                ? 'All courses'
                                : 'Courses > ' + selectedCourseLabel
                            : ''}{' '}
                        {!filterByCourses
                            ? selectedRole === 'All'
                                ? 'All users'
                                : capitalizeFirstLetter(selectedRole)
                            : ''}
                        {selectedRole === 'student' || selectedRole === 'instructor'
                            ? ' > ' + (selectedGrade === 'All' ? 'All Grades' : selectedGrade)
                            : ''}
                        {selectedRole === 'student' || selectedRole === 'instructor'
                            ? ' > ' + (selectedSection === 'All' ? 'All Sections' : selectedSection)
                            : ''}
                    </Text>

                    {createGroup ? (
                        <View
                            style={{
                                marginLeft: 'auto',
                            }}
                        >
                            <TouchableOpacity onPress={() => toggleAllSelected()}>
                                <Text
                                    style={{
                                        fontSize: 12,
                                    }}
                                >
                                    {allSelected ? 'Unselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="small" />
            ) : (
                <SectionList
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={() => (
                        <View style={styles.emptyResultIndicator}>
                            <Search fill={grey_gainsboro} scale={5} />
                            <Text style={[{ color: grey }, styles.emptyResultIndicatorText]}>
                                {loading ? 'Loading...' : 'No user matches these keywords...'}
                            </Text>
                        </View>
                    )}
                    onEndReached={searchText !== '' ? loadMore : () => {}}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                                if (!createGroup) {
                                    startChat(item);
                                    return;
                                }

                                if (toggleSelectedUser) {
                                    toggleSelectedUser(item);
                                } else {
                                    toggleUser(item);
                                }
                            }}
                            style={[
                                styles.searchResultContainer,
                                {
                                    backgroundColor: white_snow,
                                    borderBottomColor: border,
                                },
                            ]}
                        >
                            <Avatar id={item?.id} image={item.image} name={item.name} size={40} />
                            <View style={styles.searchResultUserDetails}>
                                <Text
                                    style={[
                                        styles.searchResultUserName,
                                        {
                                            color: black,
                                        },
                                    ]}
                                >
                                    {item.name}
                                </Text>
                                <Text
                                    style={[
                                        styles.searchResultUserLastOnline,
                                        {
                                            color: grey,
                                        },
                                    ]}
                                >
                                    {item.roleDescription}
                                </Text>
                                {/* {showOnlineStatus && item.last_active && (
                                    <Text
                                        style={[
                                            styles.searchResultUserLastOnline,
                                            {
                                                color: grey,
                                            },
                                        ]}
                                    >
                                        Last online {dayjs(item.last_active).calendar()}
                                    </Text>
                                )} */}
                            </View>
                            {selectedUserIds.indexOf(item.id) > -1 && (
                                <>
                                    {removeOnPressOnly ? (
                                        <Close pathFill={black} />
                                    ) : (
                                        <CheckSend pathFill={accent_blue} />
                                    )}
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    renderSectionHeader={({ section: { title } }) => {
                        if (searchText || !groupedAlphabetically) {
                            return null;
                        }

                        return (
                            <Text
                                key={title}
                                style={[
                                    styles.sectionHeader,
                                    {
                                        backgroundColor: white_smoke,
                                        color: grey,
                                    },
                                ]}
                            >
                                {title}
                            </Text>
                        );
                    }}
                    sections={searchText === '' && !showSelectedUsersOnly ? displayUsersSections : searchSections}
                    stickySectionHeadersEnabled
                />
            )}
        </View>
    );
};
