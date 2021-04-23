import React, { useCallback, useState } from 'react'
import { Text, View } from './Themed'
import axios from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { Dimensions } from 'react-native'

// const mime = require('mime-types')

const FileUpload: React.FC<any> = (props: any) => {

    const [uploading, setUploading] = useState(false)
    const onChange = useCallback((e) => {
        setUploading(true)
        e.preventDefault();
        const file = e.target.files[0]
        if (file === null) {
            setUploading(false)
            return;
        }
        //let type = mime.extension(file.type);
        let type = ''
        if (type === 'mpga') {
            type = 'mp3'
        }
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
        paddingTop: 3.5,
        paddingBottom: Dimensions.get('window').width < 768 ? 5 : 0
    }}>
        {
            uploading ? <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                Importing...
            </Text> :
                <Text>
                    Upload here...
                </Text>
            // <div style={{
            //     display: 'flex', flexDirection: 'row'
            // }}>
            //     <Ionicons name="arrow-back" color="#a2a2aa" size={17} style={{ marginRight: 10 }} onPress={() => props.back()} />
            //     <input
            //         type="file"
            //         name="import"
            //         title="Import"
            //         onChange={onChange}
            //         style={{
            //             backgroundColor: '#fff',
            //             fontFamily: 'overpass',
            //             fontSize: 12,
            //             color: '#a2a2aa',
            //             marginRight: 10,
            //             width: 170
            //         }}
            //     />
            // </div>
        }
    </View >
}

export default FileUpload