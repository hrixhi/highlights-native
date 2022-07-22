import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Text, View } from './Themed';

export const renderLoadingSpinner = () => {
    return (
        <View
            style={{
                position: 'absolute',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: 'white',
            }}
        >
            <View
                style={{
                    flexDirection: 'column',
                    alignSelf: 'center',
                    alignItems: 'center',
                }}
            >
                <View>
                    <ActivityIndicator size={30} color={'#1f1f1f'} />
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                            marginTop: 10,
                        }}
                    >
                        Loading Viewer...
                    </Text>
                </View>
            </View>
        </View>
    );
};

export const renderLoadingSpinnerFormula = () => {
    return (
        <View
            style={{
                position: 'absolute',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: 'white',
            }}
        >
            <View
                style={{
                    flexDirection: 'column',
                    alignSelf: 'center',
                    alignItems: 'center',
                }}
            >
                <View>
                    <ActivityIndicator size={30} color={'#1f1f1f'} />
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                            marginTop: 10,
                        }}
                    >
                        Loading Equation Editor...
                    </Text>
                </View>
            </View>
        </View>
    );
};

export const renderWebviewError = () => {
    return (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
            <View
                style={{
                    flexDirection: 'column',
                    alignSelf: 'center',
                    alignItems: 'center',
                    marginTop: 100,
                }}
            >
                <View
                    style={{
                        marginTop: 10,
                    }}
                >
                    <Ionicons name={'cloud-offline-outline'} size={24} color={'#1f1f1f'} />
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                            marginTop: 10,
                        }}
                    >
                        Failed to load. Check connection.
                    </Text>
                </View>
            </View>
        </View>
    );
};
