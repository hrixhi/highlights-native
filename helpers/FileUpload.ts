import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
// const mime = require('mime-types');
import axios from 'axios';
import Alert from '../components/Alert';

const getFileSize = async (fileURI: string) => {
    const fileSizeInBytes = await FileSystem.getInfoAsync(fileURI);
    return fileSizeInBytes;
};

const isLessThanTheMB = (fileSize: number, smallerThanSizeMB: number) => {
    const isOk = fileSize / 1024 / 1024 < smallerThanSizeMB;
    return isOk;
};

export const handleFile = async (audioVideoOnly: boolean, userId: string) => {
    // e.preventDefault();
    console.log('Initiate document picker');
    if (audioVideoOnly) {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("You've refused to allow this app to access your photos!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: false
        });

        if (!result.cancelled && result.type) {
            // const img = await fetchImageFromUri(result.uri);

            // Check size first
            const fileInfo = await getFileSize(result.uri);

            if (!fileInfo.exists || !fileInfo.size) {
                Alert('Error parsing file. Try a different video.');
                return { type: '', url: '', name: '' };
            }

            if (!isLessThanTheMB(fileInfo.size, 20)) {
                Alert('File must be less than 20 mb');
                return { type: '', url: '', name: '' };
            }

            const file = {
                name: 'default.mp4',
                // size: size,
                uri: result.uri,
                type: 'application/mp4'
            };

            // const file = blobToFile(img, 'default.jpg');

            const response = await fileUpload(file, 'mp4', userId);

            const { data } = response;
            console.log('Result', data);
            if (data.status === 'success') {
                return {
                    url: data.url,
                    type: 'mp4',
                    name: 'default.mp4'
                };
            } else {
                return { type: '', url: '', name: '' };
            }
        } else {
            return { type: '', url: '', name: '' };
        }
    } else {
        const res: any = await DocumentPicker.getDocumentAsync();

        if (res.type === 'cancel' || res.type !== 'success') {
            return { type: '', url: '', name: '' };
        }

        let { name, size, uri } = res;

        let nameParts = name.split('.');
        let type = nameParts[nameParts.length - 1];
        if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
            Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
            return { type: '', url: '', name };
        }

        // const { file } = res;

        if (size > 26214400) {
            alert('File size must be less than 25 mb');
            return;
        }
        // if (file === null) {
        //     return { type: '', url: '' };
        // }

        // let type = mime.extension(file.type);

        if (type === 'video/avi') {
            type = 'avi';
        } else if (type === 'video/quicktime') {
            type = 'mov';
        }

        if (type === 'wma' || type === 'avi') {
            alert('This video format is not supported. Upload mp4 or ogg.');
            return { type: '', url: '', name: '' };
        }

        if (type === 'mpga') {
            type = 'mp3';
        }

        console.log('File type', type);

        // if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
        //     alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
        //     return { type: '', url: '' };
        // }

        if (type === 'svg') {
            alert('This file type is not supported.');
            return { type: '', url: '', name: '' };
        }

        const file = {
            name: name,
            size: size,
            uri: uri,
            type: 'application/' + type
        };

        console.log('File to upload', file);

        // return { type: '', url: '' };

        const response = await fileUpload(file, type, userId);

        const { data } = response;
        console.log('Result', data);
        if (data.status === 'success') {
            return {
                url: data.url,
                type,
                name
            };
        } else {
            return { type: '', url: '', name: '' };
        }
    }
};

const fileUpload = async (file: any, type: any, userId: string) => {
    // LIVE
    const url = 'https://api.learnwithcues.com/api/upload';
    // DEV
    // const url = "http://localhost:8081/api/upload";
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('typeOfUpload', type);
    formData.append('userId', userId);
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    };
    const res = await axios.post(url, formData, config);

    return res;
};
