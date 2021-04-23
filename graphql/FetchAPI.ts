import ApolloClient from 'apollo-boost';

export const fetchAPI = (userId: any) => {

    const uri = 'https://api.cuesapp.co/'
    // const uri = 'http://192.168.1.107:8081/'

    return new ApolloClient({
        uri,
        headers: {
            userId
        }
    });

}