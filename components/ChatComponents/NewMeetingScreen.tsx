import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Dimensions, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList, StreamChatGenerics } from './types';

import { useTheme, vw } from 'stream-chat-expo';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../ChatContext/AppContext';
import ScreenHeader from './ScreenHeader';
import { Ionicons } from '@expo/vector-icons';

import DateTimePicker from '@react-native-community/datetimepicker';
import Alert from '../Alert';
import { fetchAPI } from '../../graphql/FetchAPI';
import { startChatMeeting } from '../../graphql/QueriesAndMutations';
import moment from 'moment';

type NewMeetingRouteProp = RouteProp<StackNavigatorParamList, 'NewMeetingScreen'>;

type NewMeetingProps = {
    route: NewMeetingRouteProp;
};

type NewMeetingScreenNavigationProps = StackNavigationProp<StackNavigatorParamList, 'NewMeetingScreen'>;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    createGroupButtonContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 16,
    },
    createGroupButtonText: {
        fontSize: 14,
        fontWeight: '700',
        paddingLeft: 8,
    },
    emptyMessageContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    inputBox: {
        // flex: 1,
        width: '100%',
        fontSize: 14,
        includeFontPadding: false, // for android vertical text centering
        padding: 0, // removal of default text input padding on android
        paddingHorizontal: 16,
        paddingTop: 0, // removal of iOS top padding for weird centering
        textAlignVertical: 'center', // for android vertical text centering
    },
    inputBoxContainer: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: 'row',
        marginHorizontal: 10,

        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    noChats: { fontSize: 12 },
    searchContainer: {
        borderBottomWidth: 1,
        flexDirection: 'row',
    },
    searchContainerLeft: {
        fontSize: 12,
        paddingHorizontal: 16,
        paddingVertical: 20,
        textAlignVertical: 'center',
    },
    searchContainerMiddle: {
        flex: 1,
        justifyContent: 'center',
    },
    searchContainerRight: {
        justifyContent: 'flex-end',
        paddingBottom: 16,
        paddingRight: 16,
    },
    selectedUsersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timePicker: {
        width: 125,
        fontSize: 16,
        height: 45,
        color: 'black',
        borderRadius: 10,
        marginLeft: 10,
    },
    header: {
        borderBottomWidth: 0,
    },
});

type ConfirmButtonProps = {
    disabled?: boolean;
    onPress?: () => void;
};

const ConfirmButton: React.FC<ConfirmButtonProps> = (props) => {
    const { disabled, onPress } = props;
    const {
        theme: {
            colors: { accent_blue, grey },
        },
    } = useTheme();

    return (
        <TouchableOpacity disabled={disabled} onPress={onPress}>
            <Ionicons name={'checkmark-outline'} color={!disabled ? accent_blue : grey} size={20} />
        </TouchableOpacity>
    );
};

export const NewMeetingScreen: React.FC<NewMeetingProps> = ({
    route: {
        params: { channel },
    },
}) => {
    const { chatClient } = useAppContext();

    const [instantMeetingTitle, setInstantMeetingTitle] = useState('');
    const [instantMeetingDescription, setInstantMeetingDescription] = useState('');
    const [instantMeetingStart, setInstantMeetingStart] = useState<any>(new Date());
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>(
        new Date(instantMeetingStart.getTime() + 1000 * 60 * 60)
    );

    const [showStartTimeAndroid, setShowStartTimeAndroid] = useState(false);
    const [showStartDateAndroid, setShowStartDateAndroid] = useState(false);

    const [showEndTimeAndroid, setShowEndTimeAndroid] = useState(false);
    const [showEndDateAndroid, setShowEndDateAndroid] = useState(false);

    const navigation = useNavigation<NewMeetingScreenNavigationProps>();

    if (!chatClient) return null;

    const [members] = useState(
        Object.values(channel?.state.members).filter(({ user }) => user?.id !== chatClient.userID)
    );
    const [groupName, setGroupName] = useState(channel.data?.name);
    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const renderStartDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingStart}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setInstantMeetingStart(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showStartDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingStart}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowStartDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowStartDateAndroid(false);

                            const roundedValue = roundSeconds(currentDate);

                            setInstantMeetingStart(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                            }}
                            onPress={() => {
                                setShowStartDateAndroid(true);
                                setShowStartTimeAndroid(false);
                                setShowEndDateAndroid(false);
                                setShowEndTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                                marginLeft: 50,
                            }}
                            onPress={() => {
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(true);
                                setShowEndDateAndroid(false);
                                setShowEndTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingStart}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setInstantMeetingStart(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showStartTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingStart}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowStartTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowStartTimeAndroid(false);
                            setInstantMeetingStart(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const renderEndDateTimePicker = () => {
        return (
            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginLeft: 'auto' }}>
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            const roundedValue = roundSeconds(currentDate);
                            setInstantMeetingEnd(roundedValue);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndDateAndroid ? (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'date'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowEndDateAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowEndDateAndroid(false);

                            const roundedValue = roundSeconds(currentDate);

                            setInstantMeetingEnd(roundedValue);
                        }}
                    />
                ) : null}
                {Platform.OS === 'android' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 12,
                            backgroundColor: '#fff',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                            }}
                            onPress={() => {
                                setShowEndDateAndroid(true);
                                setShowEndTimeAndroid(false);
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                overflow: 'hidden',
                                height: 35,
                                borderRadius: 15,
                                marginBottom: 10,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: '#000',
                                marginLeft: 50,
                            }}
                            onPress={() => {
                                setShowEndDateAndroid(false);
                                setShowEndTimeAndroid(true);
                                setShowStartDateAndroid(false);
                                setShowStartTimeAndroid(false);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: '#000',
                                    overflow: 'hidden',
                                    fontSize: 12,
                                    fontFamily: 'inter',
                                    height: 35,
                                    borderRadius: 15,
                                }}
                            >
                                Set Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={{ height: 10, backgroundColor: 'white' }} />
                {Platform.OS === 'ios' && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) return;
                            const currentDate: any = selectedDate;
                            setInstantMeetingEnd(currentDate);
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndTimeAndroid && (
                    <DateTimePicker
                        themeVariant="light"
                        style={styles.timePicker}
                        value={instantMeetingEnd}
                        mode={'time'}
                        textColor={'#2f2f3c'}
                        onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                                setShowEndTimeAndroid(false);
                                return;
                            }
                            const currentDate: any = selectedDate;
                            setShowEndTimeAndroid(false);
                            setInstantMeetingEnd(currentDate);
                        }}
                    />
                )}
            </View>
        );
    };

    const reset = () => {
        setInstantMeetingTitle('');
        let newStart = new Date();
        setInstantMeetingStart(newStart);
        setInstantMeetingEnd(new Date(newStart.getTime() + 1000 * 60 * 60));
    };

    const createInstantMeeting = useCallback(() => {
        if (instantMeetingTitle === '') {
            Alert('A topic must be set for the meeting. ');
            return;
        } else if (instantMeetingEnd < new Date()) {
            Alert('Meeting end time must be set in the future.');
            return;
        } else if (instantMeetingStart > instantMeetingEnd) {
            Alert('Meeting end time must be set after the start time.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startChatMeeting,
                variables: {
                    userId: chatClient.userID,
                    topic: instantMeetingTitle,
                    start: instantMeetingStart.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId: channel.id,
                },
            })
            .then(async (res) => {
                console.log('Res', res);
                if (res.data && res.data.streamChat.startChatMeeting) {
                    const { title, meetingId, meetingProvider, meetingJoinLink, meetingStartLink, start, end } =
                        res.data.streamChat.startChatMeeting;

                    // Create new Message with custom attachment
                    const message = await channel.sendMessage({
                        text: 'New meeting',
                        attachments: [
                            {
                                type: 'meeting',
                                title,
                                meetingId,
                                meetingProvider,
                                meetingJoinLink,
                                meetingStartLink,
                                start,
                                end,
                                createdBy: chatClient.userID,
                            },
                        ],
                    });

                    console.log('New Message', message);

                    reset();

                    navigation.goBack();
                } else {
                    Alert('Failed to create meeting. Try again.');
                }
            })
            .catch((err) => {
                console.log('Error', err);
                Alert('Failed to create meeting.');
            });
    }, [instantMeetingTitle, instantMeetingStart, instantMeetingEnd]);

    return (
        <View style={styles.container}>
            <ScreenHeader
                // RightContent={() => <ConfirmButton disabled={!groupName} onPress={onConfirm} />}
                onBack={reset}
                style={styles.header}
                titleText={'Meeting with ' + (groupName ? groupName : members[0].user?.name)}
            />
            <View style={styles.container}>
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: 20,
                        marginVertical: 20,
                        maxWidth: 600,
                        alignSelf: 'center',
                        width: '100%',
                    }}
                >
                    <View style={{ width: '100%', maxWidth: 600, marginTop: 20 }}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Topic
                        </Text>
                        <View
                            style={{
                                marginTop: 10,
                                marginBottom: 10,
                            }}
                        >
                            <TextInput
                                style={{
                                    padding: 10,
                                    fontSize: 15,
                                    backgroundColor: '#ffffff',
                                    borderColor: '#cccccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                }}
                                value={instantMeetingTitle}
                                placeholder={''}
                                onChangeText={(val) => setInstantMeetingTitle(val)}
                                placeholderTextColor={'#1F1F1F'}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            width: '100%',
                            maxWidth: 600,
                            flexDirection: 'column',
                            marginTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Start{' '}
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(instantMeetingStart)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        <View style={{ marginTop: 10, marginBottom: 10, marginLeft: 'auto' }}>
                            {renderStartDateTimePicker()}
                        </View>
                    </View>

                    <View
                        style={{
                            width: '100%',
                            maxWidth: 600,
                            flexDirection: 'column',
                            marginTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            End{' '}
                            {Platform.OS === 'android'
                                ? ': ' + moment(new Date(instantMeetingEnd)).format('MMMM Do YYYY, h:mm a')
                                : null}
                        </Text>
                        <View style={{ marginTop: 10, marginBottom: 10, marginLeft: 'auto' }}>
                            {renderEndDateTimePicker()}
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            createInstantMeeting();
                        }}
                        style={{
                            backgroundColor: 'white',
                            marginTop: 20,
                            // width: "100%",
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        // disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            Start Meeting
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
