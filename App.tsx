import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
            <SafeAreaView style={styles.font}>
                <StatusBar style="dark" />
                <MenuProvider>
                    <LanguageProvider>
                        <Navigation colorScheme={colorScheme} />
                    </LanguageProvider>
                </MenuProvider>
            </SafeAreaView>
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
