// REACT
import React from 'react';
import { Keyboard } from 'react-native';

// COMPONENTS
import { View } from './Themed';
import ProfileControls from './ProfileControls';

const Profile: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // MAIN RETURN
    return (
        <View
            style={{
                width: '100%',
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}
            onTouchMove={() => Keyboard.dismiss()}>
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: 0,
                    backgroundColor: 'white'
                }}>
                <ProfileControls
                    saveDataInCloud={() => props.saveDataInCloud()}
                    reOpenProfile={() => props.reOpenProfile()}
                    closeModal={() => props.closeModal()}
                    reloadData={() => props.reloadData()}
                    setShowSavePassword={(val: any) => props.setShowSavePassword(val)}
                    showSavePassword={props.showSavePassword}
                />
            </View>
        </View>
    );
};

export default Profile;
