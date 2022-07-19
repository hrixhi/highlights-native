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

import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppClient } from './hooks/initClient';
import { AppContextProvider } from './contexts/AppContext';
import { apiURL } from './constants/zoomCredentials';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';
import * as Updates from 'expo-updates';
import { updateNotificationId } from './graphql/QueriesAndMutations';

Sentry.init({
    dsn: 'https://ab6789029b074fea84e0d6e2df55746e@o1165395.ingest.sentry.io/6255085',
    enableInExpoDevelopment: false,
    debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

export default function App() {
    const isLoadingComplete = useCachedResources();
    const colorScheme = useColorScheme();

    let client: any;

    LogBox.ignoreLogs(['Require cycle: node_modules/victory']);

    // Ignore log notification by message
    // LogBox.ignoreLogs(['Warning: ...']);

    // //Ignore all log notifications
    // LogBox.ignoreAllLogs();

    const { userId, isConnecting, sortByWorkspace, recentSearches, setUserId } = useAppClient();

    const httpLink = new HttpLink({
        uri: apiURL,
    });

    // const clearExpoTokens = async () => {
    //     // Clear token on session timeout

    //     // return client.query({ query: GET_TOKEN_QUERY }).then((response) => {
    //     //   // extract your accessToken from your response data and return it
    //     //   const { accessToken } = response.data;
    //     //   return accessToken;
    //     // });
    // };

    const withUserInfo = setContext(async () => {
        const token = await AsyncStorage.getItem('jwt_token');
        const u = await AsyncStorage.getItem('user');

        if (u && token) {
            const user: any = await JSON.parse(u);
            return { token, userId: user._id };
        }

        return {
            token: '',
            userId: '',
        };
    });

    const logoutUser = async () => {
        const u = await AsyncStorage.getItem('user');

        await Notifications.cancelAllScheduledNotificationsAsync();

        if (u) {
            const user: any = await JSON.parse(u);

            const LoadedNotificationId = user.notificationId;

            let experienceId = undefined;

            if (!Constants.manifest) {
                // Absence of the manifest means we're in bare workflow
                experienceId = userId + Platform.OS;
            }

            const expoToken = await Notifications.getExpoPushTokenAsync({
                experienceId,
            });
            const notificationId = expoToken.data;

            if (LoadedNotificationId && LoadedNotificationId.includes(notificationId)) {
                const notificationIds = LoadedNotificationId.split('-BREAK-');
                const newNotifIds: any[] = [];
                notificationIds.map((notif: any) => {
                    if (notif !== notificationId) {
                        newNotifIds.push(notif);
                    }
                });
                client
                    .mutate({
                        mutation: updateNotificationId,
                        variables: {
                            userId,
                            notificationId:
                                newNotifIds.join('-BREAK-') === '' ? 'NOT_SET' : newNotifIds.join('-BREAK-'),
                        },
                    })
                    .then(async (res: any) => {
                        await AsyncStorage.clear();
                        Updates.reloadAsync();
                    })
                    .catch(async (err: any) => {
                        console.log(err);
                        await AsyncStorage.clear();
                        Updates.reloadAsync();
                    });
            } else {
                await AsyncStorage.clear();
                Updates.reloadAsync();
            }
        } else {
            await AsyncStorage.clear();
            Updates.reloadAsync();
        }
    };

    const withToken = new ApolloLink((operation, forward) => {
        const { token, userId } = operation.getContext();
        operation.setContext(() => ({
            headers: {
                Authorization: token ? token : '',
                userId,
            },
        }));
        return forward(operation);
    });

    const resetToken = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
            console.log('Graphql Errors', graphQLErrors);
        }
        if (graphQLErrors) {
            for (let err of graphQLErrors) {
                if (err.message === 'NOT_AUTHENTICATED') {
                    // alert('Session Timed out. You will be logged out.');
                    // timeoutMessageDisplayed = true;
                    // setUserId('');
                    logoutUser();
                    return;
                }
            }
        }
        if (networkError) {
            console.log(networkError);
        }
    });

    // CURRENTLY DISABLING CACHE, WILL USE IN FUTURE
    const defaultOptions = {
        watchQuery: {
            fetchPolicy: 'network-only',
        },
        query: {
            fetchPolicy: 'network-only',
        },
    };

    client = new ApolloClient({
        cache: new InMemoryCache(),
        link: from([withUserInfo, withToken.concat(resetToken), httpLink]),
        defaultOptions,
    });

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

    console.log('USER ID IN APP', userId);

    if (!isLoadingComplete || isConnecting) {
        return null;
    } else {
        return (
            <ApolloProvider client={client}>
                <AppContextProvider
                    value={{
                        userId,
                        sortByWorkspace,
                        recentSearches,
                    }}
                    key={userId}
                >
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
                </AppContextProvider>
            </ApolloProvider>
        );
    }
}

const styles: any = StyleSheet.create({
    font: {
        maxHeight: '100%',
        backgroundColor: '#fff',
        flex: 1,
    },
});
