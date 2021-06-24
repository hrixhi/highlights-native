import React, { useState, useEffect } from 'react';
import { Animated, Dimensions, Keyboard } from 'react-native';
import { Text, View } from './Themed';
import ProfileControls from './ProfileControls';

const Profile: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
            height: Dimensions.get('window').width < 1024 ? (Dimensions.get('window').height - 85) : Dimensions.get('window').height,
        }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <View style={{
                width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
                backgroundColor: 'white',
                alignSelf: 'center'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 40 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <ProfileControls
                    saveDataInCloud={() => props.saveDataInCloud()}
                    reOpenProfile={() => props.reOpenProfile()}
                    closeModal={() => props.closeModal()}
                    reloadData={() => props.reloadData()}
                />
            </View>
        </View >
    );
}

export default Profile;