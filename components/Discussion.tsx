import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View } from './Themed';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getChannelThreads } from '../graphql/QueriesAndMutations';
import ThreadsList from './ThreadsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const Discussion: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [threads, setThreads] = useState<any[]>([])
    const unableToLoadDiscussionAlert = PreferredLanguageText('unableToLoadDiscussion')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')

    const loadThreads = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        }

        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI(parsedUser._id)
            server.query({
                query: getChannelThreads,
                variables: {
                    channelId: props.channelId
                }
            })
                .then(res => {
                    if (res.data.thread && res.data.thread.findByChannelId) {
                        let filteredThreads: any[] = []
                        if (parsedUser._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            filteredThreads = res.data.thread.findByChannelId;
                        } else {
                            filteredThreads = res.data.thread.findByChannelId.filter((thread: any) => {
                                return !thread.isPrivate || (thread.userId === parsedUser._id)
                            })
                        }
                        setThreads(filteredThreads)
                    }
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
                .catch((err) => {
                    Alert(unableToLoadDiscussionAlert, checkConnectionAlert)
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [props.channelId, modalAnimation, props.channelCreatedBy])

    useEffect(() => {
        loadThreads()
    }, [props.channelId])

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;
    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: 'white',
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={'on-drag'}
            overScrollMode={'never'}
            nestedScrollEnabled={true}
        >
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 30,
                borderTopLeftRadius: 30
            }}>
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white'
                        }}>
                            <ActivityIndicator color={'#a2a2aa'} />
                        </View>
                        :
                        <ThreadsList
                            key={JSON.stringify(threads)}
                            threads={threads}
                            cueId={null}
                            channelName={props.filterChoice}
                            channelId={props.channelId}
                            closeModal={() => {
                                Animated.timing(modalAnimation, {
                                    toValue: 0,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start(() => props.closeModal())
                            }}
                            channelCreatedBy={props.channelCreatedBy}
                            reload={() => loadThreads()}
                        />
                }
            </Animated.View>
        </ScrollView>
    );
}

export default Discussion