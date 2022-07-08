import React from 'react';

import type { StreamChat } from 'stream-chat';

import type { StreamChatGenerics } from '../components/ChatComponents/types';

type AppContextType = {
    chatClient: StreamChat<StreamChatGenerics> | null;
};

export const AppContext = React.createContext({} as AppContextType);

export const useAppContext = () => React.useContext(AppContext);
