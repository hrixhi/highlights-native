// REACT
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated } from 'react-native';

// API
import { getChannelThreads, totalUnreadDiscussionThreads } from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { View } from './Themed';
import ThreadsList from './ThreadsList';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const Discussion: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId } = useAppContext();

    const [modalAnimation] = useState(new Animated.Value(1));
    const [loading, setLoading] = useState(true);
    const [threads, setThreads] = useState<any[]>([]);
    const unableToLoadDiscussionAlert = PreferredLanguageText('unableToLoadDiscussion');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    const server = useApolloClient();

    // HOOKS

    /**
     * @description Load threads on Init
     */
    useEffect(() => {
        loadThreads();
    }, [props.channelId]);

    /**
     * @description Fetches all the threads for the channel
     */
    const loadThreads = useCallback(async () => {
        setLoading(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getChannelThreads,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.thread && res.data.thread.findByChannelId) {
                        let filteredThreads: any[] = [];
                        if (userId === props.channelCreatedBy.toString().trim()) {
                            filteredThreads = res.data.thread.findByChannelId;
                        } else {
                            filteredThreads = res.data.thread.findByChannelId.filter((thread: any) => {
                                return !thread.isPrivate || thread.userId === userId;
                            });
                        }
                        setThreads(filteredThreads);
                    }
                    setLoading(false);
                    modalAnimation.setValue(0);
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                })
                .catch((err) => {
                    Alert(unableToLoadDiscussionAlert, checkConnectionAlert);
                    setLoading(false);
                    modalAnimation.setValue(0);
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                });
        } else {
            setLoading(false);
            modalAnimation.setValue(0);
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [props.channelId, modalAnimation, props.channelCreatedBy]);

    /**
     * @description Used to refresh Unread Discussion count on opening a discussion thread (Currently not used)
     */
    const refreshUnreadDiscussionCount = useCallback(async () => {
        updateDiscussionNotidCounts(userId);
    }, [props.channelId]);

    /**
     * @description Fetches total unread discussion threads
     */
    const updateDiscussionNotidCounts = useCallback(
        (userId) => {
            server
                .query({
                    query: totalUnreadDiscussionThreads,
                    variables: {
                        userId,
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (
                        res.data.threadStatus.totalUnreadDiscussionThreads !== undefined &&
                        res.data.threadStatus.totalUnreadDiscussionThreads !== null
                    ) {
                        // setUnreadDiscussionThreads(res.data.threadStatus.totalUnreadDiscussionThreads)
                    }
                })
                .catch((err) => console.log(err));
        },
        [props.channelId]
    );

    // MAIN RETURN
    return (
        <View
            style={{
                width: '100%',
                backgroundColor: '#fff',
                // marginBottom: 20,
                height: '100%',
            }}
        >
            <Animated.View
                style={{
                    opacity: modalAnimation,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0,
                }}
            >
                {loading ? (
                    <View
                        style={{
                            width: '100%',
                            paddingVertical: 100,
                            justifyContent: 'center',
                            flex: 1,
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : (
                    <ThreadsList
                        key={JSON.stringify(threads)}
                        threads={threads}
                        channelId={props.channelId}
                        closeModal={() => props.closeModal()}
                        channelCreatedBy={props.channelCreatedBy}
                        reload={() => loadThreads()}
                        refreshUnreadDiscussionCount={() => refreshUnreadDiscussionCount()}
                        setNewPostCategories={(categories: any[]) => props.setNewPostCategories(categories)}
                        showNewDiscussionPost={props.showNewDiscussionPost}
                        setShowNewDiscussionPost={props.setShowNewDiscussionPost}
                        hideNavbarDiscussions={props.hideNavbarDiscussions}
                        setHideNavbarDiscussions={props.setHideNavbarDiscussions}
                    />
                )}
            </Animated.View>
        </View>
    );
};

export default Discussion;
