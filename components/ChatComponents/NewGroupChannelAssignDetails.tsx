import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Check, generateRandomId, useTheme, vw } from 'stream-chat-expo';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from './types';
import { TouchableOpacity } from '../Themed';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from './ScreenHeader';
import { UserSearchResults } from './UserResults';
import { useAppContext } from '../../ChatContext/AppContext';
import { useUserSearchContext } from '../../ChatContext/useSearchContext';

const styles = StyleSheet.create({
    absolute: { position: 'absolute' },
    container: {
        flex: 1,
    },
    gradient: {
        height: 24,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    header: {
        borderBottomWidth: 0,
    },
    inputBox: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        includeFontPadding: false, // for android vertical text centering
        padding: 0, // removal of default text input padding on android
        paddingHorizontal: 16,
        paddingTop: 0, // removal of iOS top padding for weird centering
        textAlignVertical: 'center', // for android vertical text centering
    },
    inputBoxContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    memberLength: { fontSize: 12 },
    nameText: {
        fontSize: 12,
        textAlignVertical: 'center',
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

type NewGroupChannelAssignNameScreenNavigationProp = StackNavigationProp<
    StackNavigatorParamList,
    'NewGroupChannelAssignNameScreen'
>;

export type NewGroupChannelAssignNameScreenProps = {
    navigation: NewGroupChannelAssignNameScreenNavigationProp;
};

export const NewGroupChannelAssignNameScreen: React.FC<NewGroupChannelAssignNameScreenProps> = ({ navigation }) => {
    const { chatClient } = useAppContext();
    const { selectedUserIds, selectedUsers, reset } = useUserSearchContext();

    const {
        theme: {
            colors: { bg_gradient_end, bg_gradient_start, black, border, grey, white_snow },
        },
    } = useTheme();

    const [groupName, setGroupName] = useState('');

    if (!chatClient) return null;

    const onConfirm = () => {
        if (!chatClient.user || !selectedUsers || !groupName) return;

        const channel = chatClient.channel('messaging', {
            members: [...selectedUserIds, chatClient.user?.id],
            name: groupName,
            team: chatClient.user?.schoolId,
        });

        // TODO: Maybe there is a better way to do this.
        reset();
        navigation.pop(3);
        navigation.navigate('ChannelScreen', {
            channel: channel,
        });
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                RightContent={() => <ConfirmButton disabled={!groupName} onPress={onConfirm} />}
                style={styles.header}
                titleText="Name of Group Chat"
            />
            <View style={styles.container}>
                <View
                    style={[
                        styles.inputBoxContainer,
                        {
                            backgroundColor: white_snow,
                            borderColor: border,
                        },
                    ]}
                >
                    <Text style={[styles.nameText, { color: grey }]}>NAME</Text>
                    <TextInput
                        autoFocus
                        onChangeText={setGroupName}
                        placeholder="Choose a group chat name"
                        placeholderTextColor={grey}
                        style={[
                            styles.inputBox,
                            {
                                color: black,
                            },
                        ]}
                        value={groupName}
                    />
                </View>
                <View style={styles.gradient}>
                    <Svg height={24} style={styles.absolute} width={vw(100)}>
                        <Rect fill="url(#gradient)" height={24} width={vw(100)} x={0} y={0} />
                        <Defs>
                            <LinearGradient gradientUnits="userSpaceOnUse" id="gradient" x1={0} x2={0} y1={0} y2={24}>
                                <Stop offset={1} stopColor={bg_gradient_start} stopOpacity={1} />
                                <Stop offset={0} stopColor={bg_gradient_end} stopOpacity={1} />
                            </LinearGradient>
                        </Defs>
                    </Svg>
                    <Text
                        style={[
                            styles.memberLength,
                            {
                                color: grey,
                            },
                        ]}
                    >
                        {selectedUsers.length} Members
                    </Text>
                </View>
                {selectedUsers.length >= 0 && (
                    <UserSearchResults
                        groupedAlphabetically={false}
                        removeOnPressOnly
                        results={selectedUsers}
                        showOnlineStatus={false}
                        showSelectedUsersOnly={true}
                        createGroup={true}
                    />
                )}
            </View>
        </View>
    );
};
