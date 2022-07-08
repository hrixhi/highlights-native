import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { ColorSchemeName, View, Dimensions, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NotFoundScreen from '../screens/NotFoundScreen';
import { RootStackParamList } from '../types';
import Home from '../screens/Home';
import LinkingConfiguration from './Linking';

import { OverlayProvider } from 'stream-chat-expo';
import { useStreamChatTheme } from '../ChatHooks/useStreamChatTheme';

// Main stack navigator
export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
    const streamChatTheme = useStreamChatTheme();

    return (
        <NavigationContainer linking={LinkingConfiguration} theme={DefaultTheme}>
            <OverlayProvider
                bottomInset={Dimensions.get('window').width < 1024 && Platform.OS === 'ios' ? 60 : 68}
                value={{ style: streamChatTheme }}
            >
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {/* Main app is in here */}
                    <Stack.Screen name="Root" options={{ title: 'Cues!' }}>
                        {(props) => (
                            <SafeAreaProvider>
                                <View
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#fff',
                                        flex: 1,
                                    }}
                                >
                                    <Home {...props} />
                                </View>
                            </SafeAreaProvider>
                        )}
                    </Stack.Screen>

                    {/* In case navigation ends up at a wrong location */}
                    <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
                </Stack.Navigator>
            </OverlayProvider>
        </NavigationContainer>
    );
}

// A root stack navigator is often used for displaying modals on top of all other content
const Stack = createStackNavigator<RootStackParamList>();
