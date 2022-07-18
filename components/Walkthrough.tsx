import React, { useState } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Profile from './Profile';

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [showSavePassword, setShowSavePassword] = useState(false);

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                maxHeight:
                    Dimensions.get('window').width < 1024
                        ? Dimensions.get('window').height - 115
                        : Dimensions.get('window').height - 52,
                backgroundColor: '#fff',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: 'hidden',
            }}
        >
            <View
                style={{
                    width: '100%',
                    // height: '100%',
                    backgroundColor: 'white',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                }}
            >
                {showSavePassword ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignSelf: 'center',
                            maxWidth: 400,
                            height: 50,
                            marginBottom: 10,
                            marginTop: 20,
                            paddingHorizontal: 10,
                        }}
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    props.setShowHelp(false);
                                    setShowSavePassword(false);
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 5,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            borderColor: '#f2f2f2',
                        }}
                    >
                        <Profile
                            closeModal={() => props.closeModal()}
                            setShowSavePassword={(val: any) => setShowSavePassword(val)}
                            showSavePassword={showSavePassword}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
        maxWidth: 1024,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 50,
        // alignSelf: 'center',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        zIndex: -1,
    },
});
