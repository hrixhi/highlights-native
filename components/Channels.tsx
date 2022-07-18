// REACT
import React from 'react';
import { Keyboard } from 'react-native';

// COMPONENTS
import { View } from './Themed';
import ChannelControls from './ChannelControls';

const Channels: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <ChannelControls
                closeModal={() => props.closeModal()}
                setShowCreate={(val: any) => props.setShowCreate(val)}
                // showCreate={props.showCreate}
                showAddCourseModal={props.showAddCourseModal}
                closeAddCourseModal={props.closeAddCourseModal}
            />
        </View>
    );
};

export default Channels;
