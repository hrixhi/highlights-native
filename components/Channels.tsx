// REACT
import React from 'react';
import { ScrollView, Keyboard } from 'react-native';

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
                borderTopLeftRadius: 0
            }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            {/* <ScrollView
                style={{
                    width: '100%',
                    paddingHorizontal: 0,
                    backgroundColor: 'white'
                }}
            > */}
            <ChannelControls
                subscriptions={props.subscriptions}
                closeModal={() => props.closeModal()}
                refreshSubscriptions={props.refreshSubscriptions}
                setShowCreate={(val: any) => props.setShowCreate(val)}
                // showCreate={props.showCreate}
                showAddCourseModal={props.showAddCourseModal}
                closeAddCourseModal={props.closeAddCourseModal}
            />
            {/* </ScrollView> */}
        </View>
    );
};

export default Channels;
