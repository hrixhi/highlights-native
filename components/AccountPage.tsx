import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    ScrollView,
    Platform,
    Switch,
    Linking
} from 'react-native';
import { TouchableOpacity, View, Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';

import Walkthrough from './Walkthrough';
import Channels from './Channels';


const AccountPage: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [activeTab, setActiveTab] = useState('profile');
    const windowHeight =
        Dimensions.get('window').width < 768 ? Dimensions.get('window').height - 85 : Dimensions.get('window').height;

    const [showAddCourseModal, setShowAddCourseModal] = useState(false);

    return (
        <Animated.View
            style={{
                // opacity: modalAnimation,
                width: '100%',
                // height: windowHeight,
                height: windowHeight - 35,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}
        >
            {
                <View
                    style={{
                        flexDirection: 'row',
                        // justifyContent: 'center',
                        paddingHorizontal: 20,
                        paddingTop: 10,
                        paddingBottom: 15,
                        display: showAddCourseModal ? 'none' : 'flex'
                    }}
                >
                    <TouchableOpacity
                        style={{
                            // backgroundColor: activeTab === 'agenda' ? '#000' : '#fff',
                            paddingVertical: 6,
                            marginHorizontal: 12,
                            borderBottomColor: '#006aff',
                            borderBottomWidth: activeTab === 'profile' ? 3 : 0
                        }}
                        onPress={() => setActiveTab('profile')}
                    >
                        <Text
                            style={{
                                color: activeTab === 'profile' ? '#006aff' : '#656565',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 20 : 30
                            }}
                        >
                            Account
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            // backgroundColor: activeTab === 'activity' ? '#000' : '#fff',
                            paddingVertical: 6,
                            marginHorizontal: 12,
                            borderBottomColor: '#006aff',
                            borderBottomWidth: activeTab === 'courses' ? 3 : 0
                        }}
                        onPress={() => setActiveTab('courses')}
                    >
                        <Text
                            style={{
                                color: activeTab === 'courses' ? '#006aff' : '#656565',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 20 : 30
                            }}
                        >
                            Courses
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                    style={{
                        // position: 'absolute',
                        marginTop: 9,
                        marginLeft: 'auto'
                    }}
                    onPress={() => setShowFilterModal(!showFilterModal)}
                >
                    <Ionicons name={showFilterModal ? 'close-outline' : 'filter-outline'} size={22} color="black" />
                </TouchableOpacity> */}
                </View>
            }
            <View>
                {activeTab === 'profile' ? (
                    <Walkthrough
                        closeModal={() => {}}
                        saveDataInCloud={() => props.saveDataInCloud()}
                        reOpenProfile={() => props.reOpenProfile()}
                        reloadData={() => props.reloadData()}
                        setShowHelp={(val: any) => props.setShowHelp(val)}
                        showHelp={false}
                    />
                ) : (
                    <Channels
                        setShowCreate={(val: any) => props.setShowCreate(val)}
                        showCreate={props.showCreate}
                        closeModal={() => {}}
                        subscriptions={props.subscriptions}
                        refreshSubscriptions={props.refreshSubscriptions}
                        showAddCourseModal={showAddCourseModal}
                        closeAddCourseModal={() => setShowAddCourseModal(false)}
                    />
                )}
            </View>

            <TouchableOpacity
                onPress={() => {
                    if (activeTab === 'profile') {
                        Linking.openURL('https://www.learnwithcues.com/help')
                    } else {
                        setShowAddCourseModal(true);
                    }
                    // setShowAddEvent(true);
                }}
                style={{
                    position: 'absolute',
                    marginRight:
                        Dimensions.get('window').width >= 1100
                            ? (Dimensions.get('window').width - 1100) / 2 - 25
                            : Dimensions.get('window').width >= 768
                            ? 30
                            : 24,
                    marginBottom: Dimensions.get('window').width < 768 ? 35 : 75,
                    right: 0,
                    justifyContent: 'center',
                    bottom: 0,
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: '#006aff',
                    borderColor: '#f2f2f2',
                    borderWidth: 0,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 4,
                        height: 4
                    },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    zIndex: 50,
                    display: showAddCourseModal ? 'none' : 'flex'
                }}
            >
                <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                    <Ionicons
                        name={activeTab === 'profile' ? 'help-outline' : 'add-outline'}
                        size={activeTab === 'profile' ? 21 : 35}
                    />
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default AccountPage;
