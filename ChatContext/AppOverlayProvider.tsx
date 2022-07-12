import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { OverlayBackdrop } from 'stream-chat-expo';

import { BottomSheetOverlay } from '../components/ChatComponents/BottomSheetOverlay';
import { ChannelInfoOverlay } from '../components/ChatComponents/ChannelInfoOverlay';
import { DirectoryFilterOverlay } from '../components/ChatComponents/DirectoryFilterOverlay';
import { UserInfoOverlay } from '../components/ChatComponents/UserInfoOverlay';

import { AppOverlayContext, AppOverlayContextValue } from './AppOverlayContext';

// import { BottomSheetOverlay } from '../components/BottomSheetOverlay';
// import { ChannelInfoOverlay } from '../components/ChannelInfoOverlay';
// import { UserInfoOverlay } from '../components/UserInfoOverlay';
import { BottomSheetOverlayProvider } from './BottomSheetOverlayContext';
import { ChannelInfoOverlayProvider } from './ChannelInfoOverlayContext';
import { DirectoryFilterOverlayProvider } from './DirectoryFilterContext';
import { UserInfoOverlayProvider } from './UserInfoOverlayContext';

export const AppOverlayProvider: React.FC<{
    value?: Partial<AppOverlayContextValue>;
}> = (props) => {
    const { children, value } = props;

    const [overlay, setOverlay] = useState(value?.overlay || 'none');
    const [subscriptions] = useState(value?.subscriptions || []);
    const [currentUserRole] = useState(value?.currentUserRole || 'student');
    const [user] = useState(value?.user);
    const [meetingProvider] = useState(value?.meetingProvider || '');

    const overlayOpacity = useSharedValue(0);
    const { height, width } = useWindowDimensions();

    useEffect(() => {
        const backAction = () => {
            if (overlay !== 'none') {
                setOverlay('none');
                return true;
            }

            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [overlay]);

    useEffect(() => {
        cancelAnimation(overlayOpacity);
        if (overlay !== 'none') {
            overlayOpacity.value = withTiming(1);
        } else {
            overlayOpacity.value = withTiming(0);
        }
    }, [overlay]);

    const overlayStyle = useAnimatedStyle<ViewStyle>(
        () => ({
            opacity: overlayOpacity.value,
        }),
        []
    );

    const overlayContext = {
        overlay,
        setOverlay,
        subscriptions,
        currentUserRole,
        user,
        meetingProvider,
    };

    const directoryFilterContext = {
        subscriptions,
        currentUserRole,
    };

    return (
        <AppOverlayContext.Provider value={overlayContext}>
            <BottomSheetOverlayProvider>
                <ChannelInfoOverlayProvider>
                    <UserInfoOverlayProvider>
                        <DirectoryFilterOverlayProvider value={directoryFilterContext}>
                            {children}
                            <Animated.View
                                pointerEvents={overlay === 'none' ? 'none' : 'auto'}
                                style={[StyleSheet.absoluteFill, overlayStyle]}
                            >
                                <OverlayBackdrop style={[StyleSheet.absoluteFill, { height, width }]} />
                            </Animated.View>
                            <UserInfoOverlay overlayOpacity={overlayOpacity} visible={overlay === 'userInfo'} />
                            <ChannelInfoOverlay overlayOpacity={overlayOpacity} visible={overlay === 'channelInfo'} />
                            <BottomSheetOverlay
                                overlayOpacity={overlayOpacity}
                                visible={overlay === 'addMembers' || overlay === 'confirmation'}
                            />
                            <DirectoryFilterOverlay
                                overlayOpacity={overlayOpacity}
                                visible={overlay === 'directoryFilter'}
                            />
                        </DirectoryFilterOverlayProvider>
                    </UserInfoOverlayProvider>
                </ChannelInfoOverlayProvider>
            </BottomSheetOverlayProvider>
        </AppOverlayContext.Provider>
    );
};
