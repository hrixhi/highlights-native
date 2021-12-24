import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export const handleImageUpload = async (takePhoto: boolean) => {
    if (takePhoto) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("You've refused to allow this appp to access your camera!");
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: false
        });

        if (!result.cancelled) {
            // const img = await fetchImageFromUri(result.uri);

            const file = {
                name: 'default',
                // size: size.jpg,
                uri: result.uri,
                type: 'application/' + result.type
            };

            console.log('Image', file);

            const response = await fileUpload(file, 'jpg');

            const { data } = response;
            console.log('Result', data);
            if (data.status === 'success') {
                return data.url;
            } else {
                return null;
            }

            // const file = blobToFile(img, 'default.jpg');
        } else {
            alert('Upload cancelled!');
            return null;
        }
    } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("You've refused to allow this app to access your photos!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: false
        });

        if (!result.cancelled) {
            // const img = await fetchImageFromUri(result.uri);

            const file = {
                name: 'default.jpg',
                // size: size,
                uri: result.uri,
                type: 'application/' + result.type
            };

            console.log('Image', file);

            // const file = blobToFile(img, 'default.jpg');

            const response = await fileUpload(file, 'jpg');

            const { data } = response;
            console.log('Result', data);
            if (data.status === 'success') {
                return data.url;
            } else {
                return null;
            }
        } else {
            alert('Upload cancelled!');
            return null;
        }
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
