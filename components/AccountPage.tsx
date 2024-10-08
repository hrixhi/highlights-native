import React, { useState } from 'react';
import { Animated, Dimensions, Platform, Linking } from 'react-native';
import { TouchableOpacity, View, Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';

import Walkthrough from './Walkthrough';
import Channels from './Channels';
import { blueButtonAccountMB, blueButtonMR } from '../helpers/BlueButtonPosition';
import { useOrientation } from '../hooks/useOrientation';

const AccountPage: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showAddCourseModal, setShowAddCourseModal] = useState(false);
    const orientation = useOrientation();

    let windowHeight = 0;

    // iPhone
    if (Dimensions.get('window').width < 768 && Platform.OS === 'ios') {
        windowHeight = Dimensions.get('window').height - 115;
        // Android Phone
    } else if (Dimensions.get('window').width < 768 && Platform.OS === 'android') {
        windowHeight = Dimensions.get('window').height - 30;
        // Tablet potrait
    } else if (orientation === 'PORTRAIT' && Dimensions.get('window').width > 768) {
        windowHeight = Dimensions.get('window').height - 30;
        // Tablet landscape
    } else if (orientation === 'LANDSCAPE' && Dimensions.get('window').width > 768) {
        windowHeight = Dimensions.get('window').height - 60;
    } else {
        windowHeight = Dimensions.get('window').height - 30;
    }

    return (
        <Animated.View
            style={{
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
        >
            {
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        paddingTop: 10,
                        paddingBottom: 15,
                        display: showAddCourseModal ? 'none' : 'flex',
                        width: '100%',
                        paddingLeft: 25,
                    }}
                >
                    {/* Back button */}

                    <TouchableOpacity
                        style={{
                            paddingTop: 6,
                            paddingBottom: 4,
                            marginHorizontal: 12,
                            borderBottomColor: '#000',
                            borderBottomWidth: activeTab === 'profile' ? 2 : 0,
                        }}
                        onPress={() => setActiveTab('profile')}
                    >
                        <Text
                            style={{
                                color: activeTab === 'profile' ? '#000' : '#656565',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 22 : 26,
                            }}
                        >
                            Profile
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            paddingTop: 6,
                            paddingBottom: 4,
                            marginHorizontal: 12,
                            borderBottomColor: '#000',
                            borderBottomWidth: activeTab === 'courses' ? 2 : 0,
                        }}
                        onPress={() => setActiveTab('courses')}
                    >
                        <Text
                            style={{
                                color: activeTab === 'courses' ? '#000' : '#656565',
                                fontFamily: 'Inter',
                                fontWeight: 'bold',
                                fontSize: Dimensions.get('window').width < 768 ? 22 : 26,
                            }}
                        >
                            Courses
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            <View>
                {activeTab === 'profile' ? (
                    <Walkthrough
                        closeModal={() => {}}
                        setShowHelp={(val: any) => props.setShowHelp(val)}
                        showHelp={false}
                    />
                ) : (
                    <Channels
                        setShowCreate={(val: any) => props.setShowCreate(val)}
                        showCreate={props.showCreate}
                        closeModal={() => {
                            setShowAddCourseModal(false);
                        }}
                        showAddCourseModal={showAddCourseModal}
                        closeAddCourseModal={() => setShowAddCourseModal(false)}
                    />
                )}
            </View>

            {showAddCourseModal ? null : (
                <TouchableOpacity
                    onPress={() => {
                        if (activeTab === 'profile') {
                            Linking.openURL('https://www.learnwithcues.com/help');
                        } else {
                            setShowAddCourseModal(true);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        marginRight: blueButtonMR(Dimensions.get('window').width, orientation, Platform.OS),
                        marginBottom: blueButtonAccountMB(Dimensions.get('window').width, orientation, Platform.OS),
                        right: 0,
                        justifyContent: 'center',
                        bottom: 0,
                        width: Dimensions.get('window').width > 350 ? 62 : 58,
                        height: Dimensions.get('window').width > 350 ? 62 : 58,
                        borderRadius: Dimensions.get('window').width > 350 ? 31 : 29,
                        backgroundColor: '#000',
                        borderColor: '#f2f2f2',
                        borderWidth: 0,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 4,
                            height: 4,
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 10,
                        zIndex: 50,
                        display: showAddCourseModal ? 'none' : 'flex',
                    }}
                >
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        <Ionicons
                            name={activeTab === 'profile' ? 'help-outline' : 'add-outline'}
                            size={
                                activeTab === 'profile'
                                    ? Dimensions.get('window').width > 350
                                        ? 25
                                        : 23
                                    : Dimensions.get('window').width > 350
                                    ? 36
                                    : 35
                            }
                        />
                    </Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default AccountPage;
