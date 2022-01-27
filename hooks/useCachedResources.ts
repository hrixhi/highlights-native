import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';

export default function useCachedResources() {
    const [isLoadingComplete, setLoadingComplete] = React.useState(false);

    // Load any resources or data that we need prior to rendering the app
    React.useEffect(() => {
        async function loadResourcesAndDataAsync() {
            try {
                SplashScreen.preventAutoHideAsync();
                // Load fonts
                await Font.loadAsync({
                    inter: 'https://cues-files.s3.amazonaws.com/fonts/clarkson500.woff2',
                    overpass: 'https://cues-files.s3.amazonaws.com/fonts/clarkson400.woff2',
                    Inter: 'https://cues-files.s3.amazonaws.com/fonts/clarkson500.woff2',
                    Overpass: 'https://cues-files.s3.amazonaws.com/fonts/clarkson400.woff2',
                    Ionicons: {
                        uri: 'https://cues-files.s3.amazonaws.com/fonts/Ionicons.ttf'
                    },
                    ionicons: {
                        uri: 'https://cues-files.s3.amazonaws.com/fonts/Ionicons.ttf'
                    }
                });
            } catch (e) {
                // We might want to provide this error information to an error reporting service
                console.log(e);
            } finally {
                setLoadingComplete(true);
                SplashScreen.hideAsync();
            }
        }

        loadResourcesAndDataAsync();
    }, []);

    return isLoadingComplete;
}
