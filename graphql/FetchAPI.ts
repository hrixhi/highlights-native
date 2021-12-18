import ApolloClient from 'apollo-boost';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export const fetchAPI = (userId: any) => {
    // const uri = 'http://localhost:8081/';
    const uri = 'https://api.learnwithcues.com';

    const logoutUser = async () => {
        await AsyncStorage.clear();
        await Updates.reloadAsync();
    };

    return new ApolloClient({
        uri,
        headers: {
            userId
        },
        fetchOptions: {
            credentials: 'include'
        },
        request: async operation => {
            const token = await AsyncStorage.getItem('jwt_token');
            operation.setContext({
                headers: {
                    authorization: token || ''
                }
            });
        },
        onError: ({ graphQLErrors, networkError }) => {
            if (graphQLErrors) {
                for (let err of graphQLErrors) {
                    if (err.message === 'NOT_AUTHENTICATED') {
                        alert('Session Timed out. You will be logged out.');
                        logoutUser();
                        return;
                    }
                }
            }
            if (networkError) {
                // logoutUser();
                console.log(networkError);
            }
        }
    });
};
