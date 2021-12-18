import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput } from 'react-native';
import Alert from '../components/Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { sendDirectMessage } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RichEditor } from 'react-native-pell-rich-editor';
import FileUpload from './UploadFiles';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const NewMessage: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [message, setMessage] = useState('')
    let RichText: any = useRef()
    const now = new Date()

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [sendingThread, setSendingThread] = useState(false)
    const [showImportOptions, setShowImportOptions] = useState(false)

    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    useEffect(() => {
        if (message[0] === '{' && message[message.length - 1] === '}') {
            const obj = JSON.parse(message)
            setImported(true)
            setUrl(obj.url)
            setType(obj.type)
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [message])


    const createDirectMessage = useCallback(async () => {

        setSendingThread(true)
        const u = await AsyncStorage.getItem('user')
        if (!message || message === '' || !u) {
            setSendingThread(false)
            return
        }
        if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') == '<div></div>') {
            setSendingThread(false)
            return
        }
        const user = JSON.parse(u)
        const users: any[] = props.addUserId ? (
            [user._id, ...props.users]
        ) : props.users
        let saveCue = ''
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = message
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: sendDirectMessage,
            variables: {
                users,
                message: saveCue,
                channelId: props.channelId,
                userId: user._id
            }
        }).then(res => {
            setSendingThread(false)
            if (res.data.message.create) {
                props.back()
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })
    }, [props.users, message, props.channelId, imported, type, title, url])


    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            flexDirection: "column",
            // borderTopWidth: 1, 
            // borderColor: '#dddddd',
        }}>
            <View style={styles.date} onTouchStart={() => Keyboard.dismiss()}>
                <Text style={{
                    color: '#a2a2ac',
                    fontSize: 11,
                    lineHeight: 30,
                    flex: 1
                }}>
                    {
                        now.toString().split(' ')[1] +
                        ' ' +
                        now.toString().split(' ')[2] +
                        ', ' +
                        now.toString().split(' ')[3]
                    }
                </Text>
                {
                    showImportOptions && !imported ? null :
                        <TouchableOpacity
                            onPress={() => {
                                if (imported) {
                                    setMessage('')
                                    setTitle('')
                                    setUrl('')
                                    setType('')
                                }
                                setShowImportOptions(!showImportOptions)
                            }}
                            style={{ alignSelf: 'flex-end', flex: 1, backgroundColor: '#fff' }}
                        >
                            <Text style={{
                                color: '#a2a2ac',
                                fontSize: 11,
                                lineHeight: 30,
                                textAlign: 'right',
                                paddingRight: 10,
                            }}>
                                {
                                    imported ? 'CLEAR' : 'IMPORT'
                                }
                            </Text>
                        </TouchableOpacity>
                }
            </View>

            <View style={{ paddingVertical: 10, backgroundColor: '#fff' }}>
                {/* {
                    showImportOptions && !imported ?
                        <Ionicons name='arrow-back' size={13} color={'a2a2aa'} onPress={() => setShowImportOptions(false)} style={{ marginRight: 10, marginTop: 10 }} />
                        : null
                } */}
                {
                    showImportOptions && !imported ?
                        <FileUpload
                            action={'message_send'}
                            back={() => setShowImportOptions(false)}
                            onUpload={(u: any, t: any) => {
                                console.log(t)
                                const obj = { url: u, type: t, title }
                                setMessage(JSON.stringify(obj))
                                setShowImportOptions(false)
                            }}
                        /> : null
                }
            </View>

            <View style={{
                display: 'flex', flexDirection: 'row', backgroundColor: 'white'
            }}>

                {
                    imported ?
                        <View style={{ backgroundColor: 'white', flex: 1, width: window.screen.width < 1024 ? '100%' : '80%' , }}>
                            <View style={{ width: '100%', alignSelf: 'flex-start', marginLeft: '10%', backgroundColor: '#fff', flexDirection: 'column' }}>
                                <TextInput
                                    value={title}
                                    style={styles.input}
                                    placeholder={'File Title'}
                                    onChangeText={val => setTitle(val)}
                                    placeholderTextColor={'#a2a2ac'}
                                />
                            </View>
                            <View style={{ backgroundColor: '#fff' }}>
                                <Text style={{ width: '100%', color: '#a2a2ac', fontSize: 22, marginLeft: '10%', paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='document-outline' size={50} color='#a2a2ac' />
                                </Text>
                            </View>
                        </View>
                        : <View style={{
                            width: window.screen.width < 1024 ? '100%' : '80%' ,
                            // minHeight: 100,
                            maxWidth: 500,
                            backgroundColor: 'white',
                            paddingBottom: 10,

                        }}>
                            <RichEditor
                                disabled={false}
                                containerStyle={{
                                    backgroundColor: '#f4f4f6',
                                    borderRadius: 15,
                                    padding: 3,
                                    paddingTop: 5,
                                    paddingBottom: 10,
                                }}
                                ref={RichText}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f4f4f6',
                                    borderRadius: 15,
                                    minHeight: 50
                                }}
                                editorStyle={{
                                    backgroundColor: '#f4f4f6',
                                    placeholderColor: '#a2a2ac',
                                    color: '#2f2f3c',
                                    contentCSSText: 'font-size: 13px;'
                                }}
                                initialContentHTML={props.message}
                                onScroll={() => Keyboard.dismiss()}
                                placeholder={props.placeholder}
                                onChange={(text) => {
                                    const modifedText = text.split('&amp;').join('&')
                                    setMessage(modifedText)
                                }}
                                onBlur={() => Keyboard.dismiss()}
                                allowFileAccess={true}
                                allowFileAccessFromFileURLs={true}
                                allowUniversalAccessFromFileURLs={true}
                                allowsFullscreenVideo={true}
                                allowsInlineMediaPlayback={true}
                                allowsLinkPreview={true}
                                allowsBackForwardNavigationGestures={true}
                            />
                        </View>
                }

                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        paddingTop: 10,
                        marginBottom: 0,
                    }}>
                    <TouchableOpacity
                        disabled={sendingThread}
                        onPress={() => {
                            createDirectMessage()
                        }}
                        style={{
                            borderRadius: 15,
                            backgroundColor: 'white'
                        }}>
                        <Ionicons name='send' size={23} color={'#2f2f3c'} />
                    </TouchableOpacity>
                </View>
            </View>
            {/* <View style={styles.footer}>

            </View> */}
        </View >
    );
}

export default NewMessage

const styles: any = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'white'
    },
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
        lineHeight: 18
    },
    date: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        paddingTop: 10,
        // paddingBottom: 4,
        backgroundColor: 'white',
        maxWidth: 500,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    col1: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    text: {
        fontSize: 11,
        color: '#a2a2ac',
        textAlign: 'left'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    all: {
        fontSize: 11,
        color: '#a2a2ac',
        height: 20,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 11,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    }
})
