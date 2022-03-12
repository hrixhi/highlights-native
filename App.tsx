import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, Fragment } from 'react';
import { StyleSheet, LogBox, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation/Navigator';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from './helpers/LanguageContext';
import { MenuProvider } from 'react-native-popup-menu';

import * as Sentry from 'sentry-expo';

Sentry.init({
    dsn: 'https://ab6789029b074fea84e0d6e2df55746e@o1165395.ingest.sentry.io/6255085',
    enableInExpoDevelopment: true,
    debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});



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
        Sentry.Native.captureException(new Error('Oops!'))
        longerSplashScreen();
    }, []);

    if (!isLoadingComplete) {
        return null;
    } else {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: 'white' }} />
                <SafeAreaView style={styles.font}>
                    <StatusBar style={'dark'} />
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
        backgroundColor: '#fff',
        flex: 1
    }
});
