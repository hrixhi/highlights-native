import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '../../constants/base';

export const Message: React.FC<IconProps> = (props) => {
    const { height, width, ...rest } = props;
    return (
        <Svg height={height} viewBox={`0 0 ${height} ${width}`} width={width} {...rest}>
            <Path
                d="M95.006 78.1228L97.8894 73.9903C102.409 67.5132 105 59.899 105 51.7499C105 28.7768 84.1196 9.5 57.5 9.5C30.8806 9.5 10 28.7768 10 51.7499C10 74.7227 30.8806 93.9997 57.5 93.9997C60.8386 93.9997 64.0922 93.6937 67.2291 93.1127L68.9007 92.8031L102.886 98.6717L95.006 78.1228ZM107.838 109.167L68.9593 102.454C65.2526 103.14 61.4199 103.5 57.5 103.5C26.6694 103.5 0.5 80.9483 0.5 51.7499C0.5 22.5512 26.6694 0 57.5 0C88.3307 0 114.5 22.5512 114.5 51.7499C114.5 61.9699 111.237 71.462 105.68 79.4263L114.116 101.425C114.856 103.355 114.511 105.538 113.212 107.141C111.913 108.743 109.861 109.517 107.838 109.167Z"
                {...rest}
            />
        </Svg>
    );
};
