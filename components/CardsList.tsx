import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Animated, Dimensions, ScrollView, RefreshControl } from 'react-native';
import Alert from '../components/Alert'
import { Text, View } from '../components/Themed';
import Card from './Card'
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';


const CardsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    // const [numCards] = useState(5)
    const [filterChoice, setFilterChoice] = useState(props.channelFilterChoice)
    let filteredCues: any[] = []
    if (filterChoice === 'All') {
        filteredCues = cues
    } else {
        filteredCues = cues.filter((cue) => {
            return cue.customCategory === filterChoice
        })
    }
    const styles = styleObject(props.channelId)
    // const pages = new Array(Math.ceil(filteredCues.length / numCards))
    // for (let i = 0; i < pages.length; i++) {
    //     pages[i] = 0
    // }

    const noChannelCuesAlert = useCallback(async () => {
        if (props.channelId && props.channelId !== '') {
            const u = await AsyncStorage.getItem("user")
            if (u) {
                const user = JSON.parse(u)
                if (user._id.toString().trim() === props.createdBy.toString().trim()) {
                    if (cues.length === 0) {
                        Alert("Click + and select this channel to broadcast a cue.")
                    }
                }
            }
        }
    }, [props.channelId, props.createdBy, cues])

    useEffect(() => {
        noChannelCuesAlert()
    }, [])

    const [refreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        await Updates.reloadAsync()
    }, []);

    return (
        <View style={{
            height: ((Dimensions.get('window').height) * 0.7) - 2,
            width: '100%',
            paddingTop: 5,
            paddingHorizontal: 20,
        }}>
            {/* <Animated.View style={{
                opacity: props.fadeAnimation,
            }}> */}
            <ScrollView
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={true}
                horizontal={false}
            >
                <RefreshControl
                    enabled={true}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
                <View style={styles.marginSmall} />
                {
                    filteredCues.map((cue: any, index: number) => {
                        return <View style={{ height: 100, paddingBottom: 12 }} key={index}>
                            <Card
                                fadeAnimation={props.fadeAnimation}
                                updateModal={() => props.openUpdate(
                                    filteredCues[index].key,
                                    filteredCues[index].index,
                                    0,
                                    filteredCues[index]._id,
                                    (filteredCues[index].createdBy ? filteredCues[index].createdBy : ''),
                                    (filteredCues[index].channelId ? filteredCues[index].channelId : '')
                                )}
                                cue={filteredCues[index]}
                                channelId={props.channelId}
                            />
                            {
                                cue.status && (cue.status !== 'read' && cue.status !== 'submitted')
                                    ? <View style={styles.blueBadge}>
                                        <Text style={{ color: 'white', lineHeight: 20, fontSize: 10, textAlign: 'center' }}>
                                            !
                                        </Text>
                                    </View>
                                    : null
                            }
                            {
                                cue.channelId && cue.unreadThreads !== 0 ?
                                    <View style={styles.badge}>
                                        <Text style={{ color: 'white', lineHeight: 20, fontSize: 10, textAlign: 'center' }}>
                                            {cue.unreadThreads}
                                        </Text>
                                    </View> : null
                            }
                        </View>
                    })
                }
                {
                    filteredCues.length === 0 ? <Text style={{ fontSize: 25, color: '#a2a2aa', textAlign: 'center' }}>
                        No cues created.
                    </Text> : null
                }
                <View style={styles.marginSmall} />
            </ScrollView>
            {/* </Animated.View> */}
        </View >
    );
}

export default CardsList
// export default React.memo(CardsList, (prev, next) => {
//     return _.isEqual(prev.cues, next.cues)
// })


const styleObject = (channelId: any) => {
    return StyleSheet.create({
        screen: {
            height: '100%',
            width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3 - 40
        },
        marginSmall: {
            height: 10
        },
        page: {
            flexDirection: 'column',
        },
        badge: {
            position: 'absolute',
            alignSelf: 'flex-end',
            width: 20,
            height: 20,
            marginTop: -2,
            borderRadius: 10,
            backgroundColor: '#d91d56',
            textAlign: 'center',
            zIndex: 50
        },
        blueBadge: {
            position: 'absolute',
            alignSelf: 'flex-end',
            width: 20,
            marginRight: 25,
            height: 20,
            marginTop: -2,
            borderRadius: 10,
            backgroundColor: '#3B64F8',
            textAlign: 'center',
            zIndex: 50
        },
    })
}
