import React, { useContext } from 'react';

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay = 'addMembers' | 'alert' | 'channelInfo' | 'confirmation' | 'none' | 'userInfo' | 'directoryFilter';

export type AppOverlayContextValue = {
    overlay: Overlay;
    setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
    user: any;
    meetingProvider: string;
    currentUserRole: string;
    subscriptions: any[];
};
export const AppOverlayContext = React.createContext<AppOverlayContextValue>({} as AppOverlayContextValue);

export type AppOverlayProviderProps = {
    value?: Partial<AppOverlayContextValue>;
};

export const useAppOverlayContext = () => useContext(AppOverlayContext);
