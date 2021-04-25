import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import ThreadCard from './ThreadCard';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { deleteThread, getThreadWithReplies, markThreadsAsRead } from '../graphql/QueriesAndMutations';
import NewMessage from './NewMessage';
import ThreadReplyCard from './ThreadReplyCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Collapse } from 'react-collapse';
import Collapsible from 'react-native-collapsible';


const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(false)
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads))
    const [threads] = useState<any[]>(unparsedThreads.reverse())
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([])
    const styles = styleObject()
    const [showThreadCues, setShowThreadCues] = useState(false)
    const [filterChoice, setFilterChoice] = useState('All')
    const [showPost, setShowPost] = useState(false)
    const [threadId, setThreadId] = useState('')
    const [showComments, setShowComments] = useState(true)
    const [isOwner, setIsOwner] = useState(false)
    const categories: any[] = []
    const categoryObject: any = {}
    let filteredThreads: any[] = []
    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category'
        }
    })
    Object.keys(categoryObject).map((key) => {
        categories.push(key)
    })
    if (filterChoice === 'All') {
        filteredThreads = threads
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice
        })
    }

    const loadCueDiscussions = useCallback(async (tId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const user = JSON.parse(u)
            setThreadId(tId)
            setLoading(true)
            setShowThreadCues(true)
            const server = fetchAPI('')
            server.query({
                query: getThreadWithReplies,
                variables: {
                    threadId: tId
                }
            })
                .then(res => {
                    setThreadWithReplies(res.data.thread.getThreadWithReplies)
                    setLoading(false)
                })
                .catch(err => {
                    Alert("Unable to load thread.", "Check connection.")
                    setLoading(false)
                })
            server.mutate({
                mutation: markThreadsAsRead,
                variables: {
                    userId: user._id,
                    threadId: tId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }

    }, [])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem("user")
                if (u) {
                    const user = JSON.parse(u)
                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [])

    const deletePost = useCallback((threadId: string) => {
        if (!isOwner) {
            return;
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: deleteThread,
            variables: {
                threadId
            }
        }).then((res) => {
            if (res.data && res.data.thread.delete) {
                props.reload()
            } else {
                Alert("Something went wrong.")
            }
        }).catch(e => Alert("Something went wrong."))
    }, [isOwner])

    if (showPost) {
        return <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            paddingHorizontal: 20,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <NewMessage
                cueId={props.cueId}
                channelId={props.channelId}
                parentId={null}
                back={() => {
                    props.reload()
                    setShowPost(false)
                    setThreadId('')
                }}
                placeholder='Post...'
            />
        </View>
    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;
    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: props.cueId ? 'auto' : windowHeight,
            paddingHorizontal: 20,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30,
            // marginBottom: props.cueId ? 0 : 25,
            borderBottomColor: '#f4f4f6',
            borderBottomWidth: props.cueId ? 0 : 1
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showThreadCues ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                props.reload()
                                setThreadWithReplies([])
                                setShowThreadCues(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='chevron-back-outline' size={23} color={'#202025'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                        {
                            !props.cueId
                                ? <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a2a2aa', fontSize: 17, flex: 1, lineHeight: 25 }}>
                                    Discussion
                                </Text>
                                : <TouchableOpacity
                                    onPress={() => setShowComments(!showComments)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        flexDirection: 'row',
                                        // paddingTop: 40,
                                        paddingBottom: 40
                                    }}>
                                    <Text style={{
                                        color: '#a2a2aa', fontSize: 17, paddingRight: 10
                                    }}>
                                        Comments
                                </Text>
                                    <Ionicons size={17} name={showComments ? 'caret-down-circle-outline' : 'caret-forward-circle-outline'} color='#a2a2aa' />
                                </TouchableOpacity>
                        }
                        {
                            showComments ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        width: '10%',
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowPost(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        paddingRight: 10,
                                        marginTop: -1
                                    }}>
                                        <Ionicons name='create-outline' size={20} color={'#202025'} />
                                    </Text>
                                </TouchableOpacity> : null
                        }
                    </View>
            }
            <Collapsible collapsed={!showComments} >
                {
                    threads.length === 0 ?
                        <View style={{ backgroundColor: 'white', flex: 1 }}>
                            <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 25, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                {
                                    !props.cueId ? 'No posts.' : 'No comments.'
                                }
                            </Text>
                        </View>
                        : (
                            loading ?
                                <View style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    flex: 1,
                                    flexDirection: 'column',
                                    backgroundColor: 'white'
                                }}>
                                    <ActivityIndicator color={'#a2a2aa'} />
                                </View> :
                                <View style={{
                                    width: '100%',
                                    height: props.cueId ? 'auto' : windowHeight - 85,
                                    backgroundColor: 'white'
                                }}
                                    key={JSON.stringify(filteredThreads)}
                                >
                                    {
                                        !showThreadCues ?
                                            <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                horizontal={false}
                                                // style={{ height: '100%' }}
                                                contentContainerStyle={{
                                                    width: '100%',
                                                    height: props.cueId ? 'auto' : windowHeight - 85,
                                                }}
                                            >
                                                {
                                                    filteredThreads.map((thread: any, index) => {
                                                        return <View style={styles.col} key={index}>
                                                            <ThreadCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                thread={thread}
                                                                onPress={() => loadCueDiscussions(thread._id)}
                                                                channelCreatedBy={props.channelCreatedBy}
                                                            />
                                                        </View>
                                                    })
                                                }
                                            </ScrollView>
                                            :
                                            <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                keyboardDismissMode={'on-drag'}
                                                style={{ flex: 1, paddingTop: 12 }}>
                                                {
                                                    threadWithReplies.map((thread, index) => {
                                                        return <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                            <ThreadReplyCard
                                                                index={index}
                                                                deleteThread={() => deletePost(thread._id)}
                                                                isOwner={isOwner}
                                                                channelCreatedBy={props.channelCreatedBy}
                                                                thread={thread} />
                                                        </View>
                                                    })
                                                }
                                                <View style={{ backgroundColor: 'white' }}>
                                                    <NewMessage
                                                        cueId={props.cueId}
                                                        channelId={props.channelId}
                                                        parentId={threadId}
                                                        back={() => {
                                                            props.reload()
                                                            setShowPost(false)
                                                            setThreadId('')
                                                        }}
                                                        placeholder='Reply...'
                                                    />
                                                </View>
                                            </ScrollView>
                                    }
                                    {
                                        showThreadCues ? null :
                                            <View style={{
                                                width: '100%',
                                                height: 60,
                                                backgroundColor: 'white',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                            }}>
                                                {
                                                    props.cueId === null ?
                                                        <ScrollView
                                                            contentContainerStyle={{
                                                                height: 20, width: '100%'
                                                            }}
                                                            style={{}}
                                                            horizontal={true}
                                                            showsHorizontalScrollIndicator={false}
                                                        >
                                                            {
                                                                categories.length === 0 ? null :
                                                                    <TouchableOpacity
                                                                        style={filterChoice === 'All' ? styles.cusCategoryOutline : styles.cusCategory}
                                                                        onPress={() => setFilterChoice('All')}>
                                                                        <Text
                                                                            style={{
                                                                                color: '#a2a2aa',
                                                                                lineHeight: 20,
                                                                            }}
                                                                        >
                                                                            All
                                                                    </Text>
                                                                    </TouchableOpacity>
                                                            }
                                                            {
                                                                categories.map((category: string) => {
                                                                    return <TouchableOpacity
                                                                        key={Math.random()}
                                                                        style={filterChoice === category ? styles.cusCategoryOutline : styles.cusCategory}
                                                                        onPress={() => setFilterChoice(category)}>
                                                                        <Text
                                                                            style={{
                                                                                color: '#a2a2aa',
                                                                                lineHeight: 20
                                                                            }}>
                                                                            {category}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                })
                                                            }
                                                        </ScrollView> : null
                                                }
                                            </View>
                                    }
                                </View>
                        )
                }
            </Collapsible>
        </View >
    );
}

export default React.memo(ThreadsList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        marginSmall: {
            height: 10
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 100,
            paddingBottom: 20,
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row'
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        cusCategory: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a2a2aa',
            color: 'white'
        }
    })
}
