import React, { useState, useEffect, useRef } from 'react';
import BottomSheet from 'reanimated-bottom-sheet';
import { View, TouchableOpacity, Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const CustomBottomSheet: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const sheetRef: any = useRef();
    const [callbackNode, setCallbackNode] = useState<any>(null);

    const [reloadKey, setReloadKey] = useState('');

    useEffect(() => {
        // console.log('On change callback node', callbackNode);
        setCallbackNode(props.callbackNode);
    }, [props.callbackNode]);

    useEffect(() => {
        if (props.isOpen && sheetRef && sheetRef.current) {
            sheetRef.current.snapTo(1);
        } else if (!props.isOpen && sheetRef && sheetRef.current) {
            sheetRef.current.snapTo(0);
        }
    }, [props.isOpen, sheetRef]);

    useEffect(() => {
        setReloadKey(props.reloadKey);
    }, [props.reloadKey]);

    const renderContent = () => {
        return (
            <View
                key={reloadKey}
                style={{
                    width: '100%',
                    height: '100%',
                    elevation: 1,
                    shadowOffset: {
                        width: 7,
                        height: -7
                    },
                    zIndex: 1000,
                    // overflow: 'hidden',
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    backgroundColor: '#fff'
                    // borderWidth: 1,
                    // borderColor: '#f2f2f2',
                }}
            >
                {/* Closing knob */}
                {!props.header && !props.tabs ? (
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                        <View
                            style={{
                                height: 5,
                                width: 100,
                                borderRadius: 3,
                                backgroundColor: '#f2f2f2',
                                marginTop: 10
                            }}
                        />
                    </View>
                ) : null}

                

                {props.header || props.tabs ? (
                    <View style={{ paddingTop: 20, paddingHorizontal: 20, backgroundColor: '#fff' }}>
                        <View
                            style={{
                                paddingBottom: 20,
                                backgroundColor: '#fff',
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    sheetRef.current.snapTo(0);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    borderRadius: 20,
                                    width: Dimensions.get('window').width < 768 ? 30 : 35,
                                    height: Dimensions.get('window').width < 768 ? 30: 35,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    // shadowOffset: {
                                    //     width: 3,
                                    //     height: 3
                                    // },
                                    // // overflow: 'hidden',
                                    // elevation: 5,
                                    // shadowOpacity: 0.12,
                                    // shadowRadius: 8
                                }}
                            >
                                <Ionicons size={Dimensions.get('window').width < 768 ? 26 : 30} name="close-outline" />
                            </TouchableOpacity>
                            {props.title ? <Text style={{ fontFamily: 'Inter', fontSize: Dimensions.get('window').width < 768 ? 20 : 24, fontWeight: 'bold', paddingTop: 5 }}>
                                {props.title}
                            </Text> : props.tabs ? props.tabs : <View  style={{ height: 20 }} />}


                        </View>
                    </View>
                ) : null}
                {!props.header ? (
                    <Text
                        style={{
                            fontFamily: 'Inter',
                            fontSize: Dimensions.get('window').width < 768 ? 20 : 24,
                            fontWeight: 'bold',
                            paddingTop: 5,
                            textAlign: 'center',
                            marginTop: 10,
                            marginBottom: 10,
                            paddingHorizontal: 20
                            // color: '#006aff'
                        }}
                    >
                        {props.title}
                    </Text>
                ) : null}
                <View style={{ width: '100%', height: '100%', backgroundColor: 'white' }}>{props.renderContent()}</View>
            </View>
        );
    };

    return (
        <BottomSheet
            ref={sheetRef}
            snapPoints={props.snapPoints}
            borderRadius={props.header ? 0 : 20}
            onCloseEnd={() => props.close()}
            renderContent={renderContent}
            callbackNode={callbackNode}
        />
    );
};

export default React.memo(CustomBottomSheet);
