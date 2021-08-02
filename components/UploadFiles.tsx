import React, { useCallback, useState } from 'react'
import { Text, TouchableOpacity, View } from './Themed'
import axios from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { Dimensions } from 'react-native'
import * as DocumentPicker from 'expo-document-picker';
import Alert from './Alert'

const FileUpload: React.FC<any> = (props: any) => {

    const [uploading, setUploading] = useState(false)
    const onClick = useCallback(async () => {
        setUploading(true)
        const result = await DocumentPicker.getDocumentAsync()
        if (result.type === 'cancel') {
            setUploading(false)
            return;
        }
        // ImagePicker saves the taken photo to disk and returns a local URI to it
        let { name, size, uri } = result;


        let nameParts = name.split('.');
        let type = nameParts[nameParts.length - 1];
        if ((type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') && props.action !== 'message_send') {
            Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.')
            setUploading(false)
            return
        }
        if (size > 26214400) {
            Alert('File size must be less than 25 mb')
            setUploading(false)
            return
        }
        const file = {
            name: name,
            size: size,
            uri: uri,
            type: "application/" + type
        };

        fileUpload(file, type).then(response => {
            const { data } = response;
            if (data.status === "success") {
                props.onUpload(data.url, type);
                setUploading(false)
            } else {
                setUploading(false)
            }
        });
    }, [])

    const fileUpload = useCallback((file, type) => {
        const url = "https://api.cuesapp.co/api/upload";
        const formData = new FormData();
        formData.append("attachment", file);
        formData.append("typeOfUpload", type);
        const config = {
            headers: {
                "content-type": "multipart/form-data"
            }
        };
        return axios.post(url, formData, config);
    }, [])

    return <View style={{
        backgroundColor: '#fff',
        paddingTop: 3.5,
        paddingBottom: Dimensions.get('window').width < 768 ? 5 : 0
    }}>
        {
            uploading ? <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                Importing...
            </Text> :
                <View style={{ flexDirection: 'row', width: 220, backgroundColor: 'white' }}>
                    <Ionicons
                        name="arrow-back"
                        color="#a2a2ac"
                        size={17} style={{ marginRight: 20 }}
                        onPress={() => props.back()} />
                    <TouchableOpacity
                        onPress={() => onClick()}
                        style={{ backgroundColor: 'white', borderRadius: 15, }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 25,
                            color: '#2f2f3c',
                            fontSize: 11,
                            backgroundColor: '#f4f4f6',
                            borderRadius: 10,
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            overflow: 'hidden',
                            height: 25
                        }}>
                            CHOOSE FILE
                        </Text>
                    </TouchableOpacity>
                </View>
        }
    </View >
}

export default FileUpload