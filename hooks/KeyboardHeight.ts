import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

export const useKeyboard = () => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    function onKeyboardDidShow(e: KeyboardEvent) {
        setKeyboardHeight(e.endCoordinates.height);
    }

    function onKeyboardDidHide() {
        setKeyboardHeight(0);
    }

    useEffect(() => {
        const subs = [
            Keyboard.addListener('keyboardDidShow', onKeyboardDidShow),
            Keyboard.addListener('keyboardDidHide', onKeyboardDidHide),
        ];
        return () => {
            subs.forEach((s: any) => s.remove());
        };
    }, []);

    return keyboardHeight;
};
