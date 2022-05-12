import * as Sharing from "expo-sharing";
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework } from 'expo-file-system';
import Alert from '../components/Alert';


export async function downloadFileToDevice(url: string) {

    let downloadPath = url.split('/').reverse()[0];
    
    const res = await FileSystem.downloadAsync(url, FileSystem.documentDirectory + downloadPath).then(async ({ uri }) => {
        const mediaTypes = ['jpg', 'png', 'gif', 'heic', 'webp', 'bmp', 'mp4', 'oga', 'mov', 'mp3', 'mpeg', 'mp2', 'wav'];

        if (Platform.OS === 'ios' && mediaTypes.every(x => !uri.endsWith(x))) {
            const UTI = 'public.item';
            const shareResult = await Sharing.shareAsync(uri, {UTI});

            console.log("Download result", shareResult)
            return true
        } else  {
            const perm = await MediaLibrary.requestPermissionsAsync(true);

            if (perm.status != 'granted') {
                Alert("You need to grant permission to save media files")
                return;
            }


            if (Platform.OS === 'android') {

                const split = url.split('/')

                const extension = split[split.length - 2]

                if (extension === 'pdf') {
                    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (!permissions.granted) {
                        return;
                    }

                    try {
                        await StorageAccessFramework.createFileAsync(permissions.directoryUri, split[split.length - 1], 'application/pdf')
                        .then((r) => {
                            console.log(r);
                            return true;
                        })
                        .catch((e) => {
                            console.log(e);
                            return false;

                        });
                    } catch(e) {
                        console.log(e)
                        return false
                    }
                }

            }

            try {
                const asset = await MediaLibrary.createAssetAsync(uri);
                const album = await MediaLibrary.getAlbumAsync('Learn with Cues');
                if (album == null) {
                    await MediaLibrary.createAlbumAsync('Learn with Cues', asset, false)
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                }
                Alert('Media saved under Albums > Learn with Cues')
                return true
            } catch (e) {
                console.log("Error downloading file", e);
                Alert("Something went wrong. Try again")
                return false
            }
        }
    })
    .catch(error => {
        console.log("Error downloading file", error);
        return false
    });

   return res

    
} 