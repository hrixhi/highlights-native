import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View } from './Themed';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getGroups, getSubscribers } from '../graphql/QueriesAndMutations';
import SubscribersList from './SubscribersList';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Subscribers: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [subscribers, setSubscribers] = useState<any[]>([])
    const [groups, setGroups] = useState<any[]>([])

    const loadSubscribers = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        let server: any = null
        let user: any = {}
        if (u) {
            user = JSON.parse(u)
            server = fetchAPI(user._id)
        } else {
            server = fetchAPI('')
        }
        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            server.query({
                query: getSubscribers,
                variables: {
                    channelId: props.channelId
                }
            }).then((res: any) => {
                if (res.data.user && res.data.user.findByChannelId) {
                    const tempSubs = res.data.user.findByChannelId.filter((s: any) => {
                        return s._id !== user._id
                    })
                    setSubscribers(tempSubs)
                }
                setLoading(false)
                modalAnimation.setValue(0)
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            }).catch((err: any) => {
                Alert("Unable to load subscribers.", "Check connection.")
                setLoading(false)
                modalAnimation.setValue(0)
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            })
            server.query({
                query: getGroups,
                variables: {
                    userId: user._id,
                    channelId: props.channelId
                }
            }).then((res: any) => {
                if (res.data && res.data.group.getGroups) {
                    setGroups(res.data.group.getGroups)
                }
            }).catch((err: any) => {
                console.log(err)
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
    }, [props.channelId, modalAnimation])

    useEffect(() => {
        loadSubscribers()
    }, [props.channelId])

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 75 : Dimensions.get('window').height;

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
            overScrollMode={'always'}
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
                        <SubscribersList
                            groups={groups}
                            channelCreatedBy={props.channelCreatedBy}
                            key={JSON.stringify(subscribers) + JSON.stringify(groups)}
                            subscribers={subscribers}
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
                            reload={() => loadSubscribers()}
                        />
                }
            </Animated.View>
        </ScrollView>
    );
}

export default Subscribers