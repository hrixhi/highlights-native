import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { ColorSchemeName, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NotFoundScreen from '../screens/NotFoundScreen';
import { RootStackParamList } from '../types';
import Home from '../screens/Home';
import LinkingConfiguration from './Linking';

// Main stack navigator
export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
    return (
        <NavigationContainer linking={LinkingConfiguration} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* Main app is in here */}
                <Stack.Screen
                    name="Root"
                    options={{ title: 'Cues!' }}
                    component={() => (
                        <SafeAreaProvider>
                            <View
                                style={{
                                    height: '100%',
                                    width: '100%',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    backgroundColor: '#fff',
                                    flex: 1
                                }}
                            >
                                <Home />
                            </View>
                        </SafeAreaProvider>
                    )}
                />

                {/* In case navigation ends up at a wrong location */}
                <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// A root stack navigator is often used for displaying modals on top of all other content
const Stack = createStackNavigator<RootStackParamList>();
