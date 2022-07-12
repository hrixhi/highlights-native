import { useCallback, useEffect, useRef, useState } from 'react';

import type { UserFilters, UserResponse } from 'stream-chat';

import { useAppContext } from '../ChatContext/AppContext';
import { useDirectoryFilterOverlayContext } from '../ChatContext/DirectoryFilterContext';

import type { StreamChatGenerics } from '../components/ChatComponents/types';
import { fetchAPI } from '../graphql/FetchAPI';
import { getInboxDirectory } from '../graphql/QueriesAndMutations';

export type PaginatedUsers = {
    clearText: () => void;
    initialResults: UserResponse<StreamChatGenerics>[] | null;
    loading: boolean;
    loadMore: () => void;
    onChangeSearchText: (newText: string) => void;
    onFocusInput: () => void;
    removeUser: (index: number) => void;
    reset: () => void;
    results: UserResponse<StreamChatGenerics>[];
    displayUsers: UserResponse<StreamChatGenerics>[];
    searchText: string;
    selectedUserIds: string[];
    selectedUsers: UserResponse<StreamChatGenerics>[];
    setInitialResults: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[] | null>>;
    setResults: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[]>>;
    setDisplayUsers: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[]>>;
    setSearchText: React.Dispatch<React.SetStateAction<string>>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[]>>;
    toggleUser: (user: UserResponse<StreamChatGenerics>) => void;
    isCreatingGroup: boolean;
    setIsCreatingGroup: (value: boolean) => void;
    allSelected: boolean;
    toggleAllSelected: () => void;
    setExistingChannelMembers: (userIds: string[]) => void;
};

export const usePaginatedUsers = (): PaginatedUsers => {
    const { chatClient } = useAppContext();

    const [initialResults, setInitialResults] = useState<UserResponse<StreamChatGenerics>[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<UserResponse<StreamChatGenerics>[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserResponse<StreamChatGenerics>[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
    const [existingChannelMembers, setExistingChannelMembers] = useState<any>(undefined);

    const hasMoreResults = useRef(true);
    const offset = useRef(0);
    const queryInProgress = useRef(false);

    // INDETERMINATE
    const [allSelected, setAllSelected] = useState(false);

    const [directory, setDirectory] = useState<any>(undefined);
    const [displayUsers, setDisplayUsers] = useState<UserResponse<StreamChatGenerics>[]>([]);

    const { filterByCourses, selectedCourse, selectedRole, selectedGrade, selectedSection, subscriptions } =
        useDirectoryFilterOverlayContext();

    // INDETERMINATE
    const toggleAllSelected = () => {
        if (allSelected) {
            // Remove display users from selected
            let updateSelections: any[] = [...selectedUsers];
            displayUsers.map((user: any) => {
                updateSelections = updateSelections.filter((selected: any) => selected.id !== user.id);
            });

            setSelectedUsers(updateSelections);
            setSelectedUserIds(updateSelections.map((user: any) => user.id));
            setAllSelected(false);
        } else {
            // Add All
            let updateSelections: any[] = [...selectedUsers];
            displayUsers.map((user: any) => {
                const isAlreadyAdded = selectedUsers.find((selected: any) => selected.id === user.id);
                if (isAlreadyAdded) return;
                updateSelections.push(user);
            });
            setSelectedUsers(updateSelections);
            setSelectedUserIds(updateSelections.map((user: any) => user.id));
            setAllSelected(true);
        }
    };

    // Handle Select All Checkbox
    useEffect(() => {
        let allSelected = true;

        if (displayUsers.length === 0) {
            setAllSelected(false);
        }

        displayUsers.map((user: any) => {
            const isSelected = selectedUsers.find((selected: any) => selected.id === user.id);

            if (!isSelected) {
                allSelected = false;
            }
        });

        setAllSelected(allSelected);
    }, [selectedUsers, displayUsers]);

    useEffect(() => {
        if (chatClient && chatClient.userID) {
            fetchInboxDirectory();
        }
    }, [chatClient]);

    function capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Update display Users
    useEffect(() => {
        setLoading(true);

        if (!directory) {
            setDisplayUsers([]);
            setLoading(false);
            return;
        }

        const queryUsers = async (users: any[]) => {
            const userIds: string[] = [];

            users.map((user: any) => {
                // if (isAddingUsersGroup && channelMembers.includes(user._id)) return;

                userIds.push(user._id);
            });

            if (userIds.length === 0) {
                setDisplayUsers([]);
                setLoading(false);
                return;
            }

            let res: any;

            // For adding to existing groups
            if (existingChannelMembers && existingChannelMembers.length !== 0) {
                res = await chatClient?.queryUsers(
                    {
                        $and: [
                            { id: { $in: userIds } },
                            {
                                id: { $nin: existingChannelMembers },
                            },
                        ],
                    },
                    { last_active: -1 },
                    { presence: true }
                );
            } else {
                res = await chatClient?.queryUsers({ id: { $in: userIds } }, { last_active: -1 }, { presence: true });
            }

            if (res && res.users) {
                let updateUsersWithRoles: any[] = [];

                res.users.sort((a: any, b: any) => {
                    return a.name > b.name ? 1 : -1;
                });

                // ALL OTHER ROLES
                res.users.map((user: any) => {
                    if (user.cues_role !== 'parent') {
                        updateUsersWithRoles.push({
                            ...user,
                            roleDescription:
                                capitalizeFirstLetter(user.cues_role) +
                                (user.cues_role === 'student'
                                    ? ' (' + user.cues_grade + '-' + user.cues_section + ') '
                                    : ''),
                        });
                    }
                });

                // PARENTS
                users.map((user: any) => {
                    if (user.role === 'parent') {
                        const findQueriedUser = res.users.find((x: any) => x.id === user._id);

                        if (findQueriedUser) {
                            updateUsersWithRoles.push({
                                ...findQueriedUser,
                                roleDescription: user.roleDescription,
                            });
                        }
                    }
                });

                setDisplayUsers(updateUsersWithRoles);
            } else {
                // setDisplayUsersError(true);
            }
            setLoading(false);
        };

        if (directory.length === 0) {
            setDisplayUsers([]);
            setLoading(false);
        } else {
            let users: any[] = [];

            if (filterByCourses) {
                if (selectedCourse === 'All') {
                    directory.map((user: any) => {
                        if (user.courses.length > 0) {
                            users.push(user);
                        }
                    });
                } else {
                    directory.map((user: any) => {
                        if (user.courses.includes(selectedCourse)) {
                            users.push(user);
                        }
                    });
                }
            } else {
                if (selectedRole === 'All') {
                    users = directory;
                } else {
                    directory.map((user: any) => {
                        if (user.role === selectedRole) {
                            users.push(user);
                        }
                    });

                    console.log('Users after Filter role', users);

                    if ((selectedRole === 'student' || selectedRole === 'parent') && selectedGrade !== 'All') {
                        users = users.filter((user: any) => {
                            return user.grade === selectedGrade;
                        });
                    }
                    console.log('Users after Filter grade', users);

                    if ((selectedRole === 'student' || selectedRole === 'parent') && selectedSection !== 'All') {
                        users = users.filter((user: any) => {
                            return user.section === selectedSection;
                        });
                    }
                    console.log('Users after Filter section', users);
                }
            }

            if (users.length === 0) {
                setDisplayUsers([]);
                setLoading(false);
            } else {
                queryUsers(users);
            }
        }
    }, [
        directory,
        filterByCourses,
        selectedCourse,
        selectedRole,
        selectedGrade,
        selectedSection,
        subscriptions,
        chatClient,
        existingChannelMembers,
    ]);

    console.log('Selected users', selectedUsers);
    console.log('Selected User Ids', selectedUserIds);

    const reset = () => {
        setSearchText('');
        setSelectedUserIds([]);
        setSelectedUsers([]);
    };

    const addUser = (user: UserResponse<StreamChatGenerics>) => {
        setSelectedUsers([...selectedUsers, user]);
        setSelectedUserIds((prevSelectedUserIds) => {
            prevSelectedUserIds.push(user.id);
            return prevSelectedUserIds;
        });
        setSearchText('');
        setResults(initialResults || []);
    };

    const removeUser = (index: number) => {
        if (index < 0) {
            return;
        }

        setSelectedUserIds((prevSelectedUserIds) => {
            const newSelectedUserIds = prevSelectedUserIds.slice();
            newSelectedUserIds.splice(index, 1);
            return newSelectedUserIds;
        });

        setSelectedUsers((prevSelectedUsers) => {
            const newSelectedUsers = prevSelectedUsers.slice();
            newSelectedUsers.splice(index, 1);
            return newSelectedUsers;
        });
    };

    const toggleUser = (user: UserResponse<StreamChatGenerics>) => {
        if (!user.id) {
            return;
        }

        const existingIndex = selectedUserIds.indexOf(user.id);

        if (existingIndex > -1) {
            removeUser(existingIndex);
        } else {
            addUser(user);
        }
    };

    const onFocusInput = () => {
        if (!searchText) {
            setResults(initialResults || []);
            setLoading(false);
        } else {
            fetchUsers(searchText);
        }
    };

    const onChangeSearchText = (newText: string) => {
        setSearchText(newText);
        if (!newText) {
            setResults(initialResults || []);
            setLoading(false);
        } else {
            fetchUsers(newText);
        }
    };

    const fetchInboxDirectory = useCallback(() => {
        if (chatClient && chatClient.userID) {
            setLoading(true);
            console.log('chatClient ID', chatClient.userID);
            const server = fetchAPI('');
            server
                .query({
                    query: getInboxDirectory,
                    variables: {
                        userId: chatClient.userID,
                    },
                })
                .then((res: any) => {
                    if (res.data && res.data.streamChat.getInboxDirectory) {
                        setDirectory(res.data.streamChat.getInboxDirectory);
                    } else {
                        setDirectory(undefined);
                    }
                    setLoading(false);
                })
                .catch((e) => {
                    setDirectory(undefined);
                    console.log('Error', e);
                    setLoading(false);
                    return;
                });
        }
    }, [chatClient]);

    const fetchUsers = async (query = '') => {
        if (queryInProgress.current || !chatClient?.userID) return;
        setLoading(true);

        try {
            queryInProgress.current = true;

            let filter: UserFilters;

            if (existingChannelMembers) {
                filter = {
                    id: {
                        $nin: [chatClient?.userID, ...existingChannelMembers],
                    },
                    role: 'user',
                };
            } else {
                filter = {
                    id: {
                        $nin: [chatClient?.userID],
                    },
                    role: 'user',
                };
            }

            if (query) {
                filter.name = { $autocomplete: query };
            }

            if (query !== searchText) {
                offset.current = 0;
                hasMoreResults.current = true;
            } else {
                offset.current = offset.current + results.length;
            }

            if (!hasMoreResults.current) {
                queryInProgress.current = false;
                return;
            }

            const res = await chatClient?.queryUsers(
                filter,
                { name: 1 },
                {
                    limit: 15,
                    offset: offset.current,
                    presence: true,
                }
            );

            if (!res?.users) {
                queryInProgress.current = false;
                return;
            }

            // Dumb check to avoid duplicates
            if (query === searchText && results.findIndex((r) => res?.users[0].id === r.id) > -1) {
                queryInProgress.current = false;
                return;
            }

            setResults((r) => {
                if (query !== searchText) {
                    return res?.users;
                }
                return r.concat(res?.users || []);
            });

            if (res?.users.length < 15 && (offset.current === 0 || query === searchText)) {
                hasMoreResults.current = false;
            }

            if (!query && offset.current === 0) {
                setInitialResults(res?.users || []);
            }
        } catch (e) {
            // do nothing;
        }
        queryInProgress.current = false;
        setLoading(false);
    };

    const loadMore = () => {
        // fetchUsers(searchText);
    };

    return {
        clearText: () => {
            setSearchText('');
            fetchUsers('');
        },
        initialResults,
        loading,
        loadMore,
        onChangeSearchText,
        onFocusInput,
        removeUser,
        reset,
        results,
        searchText,
        selectedUserIds,
        selectedUsers,
        setInitialResults,
        setResults,
        setSearchText,
        setSelectedUsers,
        toggleUser,
        isCreatingGroup,
        setIsCreatingGroup,
        displayUsers,
        setDisplayUsers,
        allSelected,
        toggleAllSelected,
        setExistingChannelMembers,
    };
};
