import { Dimensions } from 'react-native';

export const paddingResponsive = () => {
    if (Dimensions.get('window').width < 768) {
        return 10;
    } else if (Dimensions.get('window').width < 1024) {
        return 20;
    } else {
        return 20;
    }
};
