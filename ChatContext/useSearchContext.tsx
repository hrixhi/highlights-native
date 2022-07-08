import React, { PropsWithChildren, useContext } from 'react';
import { usePaginatedUsers, PaginatedUsers } from '../ChatHooks/usePaginatedUsers';

export type UserSearchContextValue = PaginatedUsers;

export const UserSearchContext = React.createContext({} as UserSearchContextValue);

export const UserSearchProvider = ({
    children,
    value,
}: PropsWithChildren<{
    value?: UserSearchContextValue;
}>) => {
    const paginatedUsers = usePaginatedUsers();

    const userSearchContext = { ...paginatedUsers, ...value };

    return (
        <UserSearchContext.Provider value={userSearchContext as UserSearchContextValue}>
            {children}
        </UserSearchContext.Provider>
    );
};

export const useUserSearchContext = () => useContext(UserSearchContext) as unknown as UserSearchContextValue;
