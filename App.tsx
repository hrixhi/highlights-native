import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, Fragment } from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation/Navigator';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from './helpers/LanguageContext';
import { MenuProvider } from 'react-native-popup-menu';

export default function App() {
    const isLoadingComplete = useCachedResources();
    const colorScheme = useColorScheme();

    // Ignore log notification by message
    LogBox.ignoreLogs(['Warning: ...']);

    //Ignore all log notifications
    LogBox.ignoreAllLogs();

    const longerSplashScreen = useCallback(async () => {
        await SplashScreen.preventAutoHideAsync();
        const a: any = new Date();
        let b: any = new Date();
        while (b - a < 1000) {
            b = new Date();
        }
        await SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        longerSplashScreen();
    }, []);

    if (!isLoadingComplete) {
        return null;
    } else {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: 'white' }} />
                <SafeAreaView style={styles.font}>
                    <StatusBar style="dark" />
                    <MenuProvider>
                        <LanguageProvider>
                            <Navigation colorScheme={colorScheme} />
                        </LanguageProvider>
                    </MenuProvider>
                </SafeAreaView>
            </Fragment>
        );
    }
}

const styles: any = StyleSheet.create({
    font: {
        maxHeight: '100%',
        backgroundColor: '#000',
        flex: 1
    }
});
