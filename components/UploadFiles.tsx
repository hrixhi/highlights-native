import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from './Themed';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Alert from './Alert';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const FileUpload: React.FC<any> = (props: any) => {
    const [uploading, setUploading] = useState(false);
    const onClick = useCallback(async () => {
        setUploading(true);
        const result = await DocumentPicker.getDocumentAsync();
        if (result.type === 'cancel') {
            setUploading(false);
            return;
        }
        // ImagePicker saves the taken photo to disk and returns a local URI to it
        let { name, size, uri } = result;

        let nameParts = name.split('.');
        let type = nameParts[nameParts.length - 1];
        if (
            (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') &&
            props.action !== 'message_send'
        ) {
            Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
            setUploading(false);
            return;
        }

        if (
            props.action === 'audio/video' &&
            !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
        ) {
            alert('Error! This file format is not supported. Upload mp4.');
            setUploading(false);
            return;
        }

        if (size > 26214400) {
            Alert('File size must be less than 25 mb');
            setUploading(false);
            return;
        }
        const file = {
            name: name,
            size: size,
            uri: uri,
            type: 'application/' + type
        };

        fileUpload(file, type).then(response => {
            const { data } = response;
            if (data && data.status === 'success') {
                props.onUpload(data.url, type);
                setUploading(false);
            } else {
                setUploading(false);
            }
        });
    }, []);

    const fileUpload = useCallback((file, type) => {
        const url = 'https://api.cuesapp.co/api/upload';
        const formData = new FormData();
        formData.append('attachment', file);
        formData.append('typeOfUpload', type);
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        return axios.post(url, formData, config);
    }, []);

    return (
        <View style={{ position: props.profile ? 'absolute' : 'relative', backgroundColor: props.profile ? 'none' : '#fff', }}>
            {/* style={{
                backgroundColor: '#fff',
                paddingTop: 3.5,
                paddingBottom: Dimensions.get('window').width < 768 ? 5 : 0
            }}
        > */}
            {uploading ? (
                <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Importing...</Text>
            ) : props.quiz ? (
                <Text
                    style={{
                        color: '#006AFF',
                        // lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: 12,
                        fontFamily: 'overpass'
                    }}
                    onPress={() => onClick()}
                >
                    Media
                </Text>
            ) : (
                <Text
                    style={{
                        color: '#006AFF',
                        backgroundColor: props.profile ? 'none' : '#fff',
                        lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: props.quiz ? 12 : 12,
                        fontFamily: 'overpass',
                        textTransform: 'uppercase',
                        paddingLeft: props.profile ? 0 : 10
                    }}
                    onPress={() => onClick()}
                >
                    {props.chat || props.profile ? (
                        <Ionicons name={props.profile ? "attach-outline" : "document-attach-outline"} size={props.profile ? 25 : 18}  color={props.profile ? 'white' : '#006AFF' } />
                    ) : (
                        PreferredLanguageText('import')
                    )}
                </Text>
            )}
        </View>
    );
};

export default FileUpload;
