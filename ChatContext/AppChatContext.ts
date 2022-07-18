import React from 'react';

import type { StreamChat } from 'stream-chat';

import type { StreamChatGenerics } from '../components/ChatComponents/types';

type AppChatContextType = {
    chatClient: StreamChat<StreamChatGenerics> | null;
};

export const AppChatContext = React.createContext({} as AppChatContextType);

export const useAppChatContext = () => React.useContext(AppChatContext);
