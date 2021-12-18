import * as DocumentPicker from 'expo-document-picker';
const mime = require('mime-types');
import axios from 'axios';

export const handleFile = async (audioVideoOnly: boolean) => {
    // e.preventDefault();
    const res: any = await DocumentPicker.getDocumentAsync();

    if (res.type === 'cancel' || res.type !== 'success') {
        return { type: '', url: '' };
    }

    const { file } = res;

    if (file.size > 26214400) {
        alert('File size must be less than 25 mb');
        return;
    }
    if (file === null) {
        return { type: '', url: '' };
    }

    let type = mime.extension(file.type);

    if (file.type === 'video/avi') {
        type = 'avi';
    } else if (file.type === 'video/quicktime') {
        type = 'mov';
    }

    if (type === 'wma' || type === 'avi') {
        alert('This video format is not supported. Uplaod mp4 or ogg.');
        return { type: '', url: '' };
    }

    if (type === 'mpga') {
        type = 'mp3';
    }

    console.log('File type', type);

    if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
        alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
        return { type: '', url: '' };
    }

    if (
        audioVideoOnly &&
        !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
    ) {
        alert('Error! Only audio/video files can be imported.');
        return { type: '', url: '' };
    }

    if (type === 'svg') {
        alert('This file type is not supported.');
        return { type: '', url: '' };
    }

    const response = await fileUpload(file, type);

    const { data } = response;
    if (data.status === 'success') {
        return {
            url: data.url,
            type
        };
    } else {
        return { type: '', url: '' };
    }
};

const fileUpload = async (file: any, type: any) => {
    // LIVE
    const url = 'https://api.learnwithcues.com/api/upload';
    // DEV
    // const url = "http://localhost:8081/api/upload";
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('typeOfUpload', type);
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    };
    const res = await axios.post(url, formData, config);

    return res;
};
