// REACT
import React, { useState } from 'react';
import { Text as DefaultText, View as DefaultView, TextInput as DefaultTextInput, StyleSheet, Dimensions } from 'react-native';
import { PreferredLanguageText } from '../helpers/LanguageContext';

type FieldTypeProps = {
    hasMultipleLines?: boolean;
};

type ValidationProps = {
    required?: boolean;
    errorText?: string;
    regEx?: RegExp;
};

type FooterProps = {
    footerMessage?: string;
};

export type TextInputProps = ValidationProps & FooterProps & FieldTypeProps & DefaultTextInput['props'];

export function TextInput(props: TextInputProps) {
    const [errorType, setErrorType] = useState(''); // Error description; Empty String if none;
    const [focused, setFocused] = useState(false);

    const requiredErrorText = PreferredLanguageText('required');
    const onValidateValue = (value: string) => {
        const { errorText, regEx } = props;
        if (props.required && !value) {
            setErrorType(requiredErrorText);
            return;
        }

        if (regEx) {
            const valid: boolean = value ? regEx.test(value) : true;
            if (!valid) {
                setErrorType('Invalid Input');
                return;
            }
        }

        if (errorText) {
            setErrorType(errorText);
            return;
        }

        setErrorType('');
        return;
    };

    const renderErrorMessage = () => {
        return errorType ? <DefaultText style={styles.errorText}>{errorType}</DefaultText> : null;
    };

    const renderFormFooter = () => {
        const { footerMessage } = props;
        return footerMessage && !errorType ? <DefaultText style={styles.footer}>{footerMessage}</DefaultText> : null;
    };

    return (
        <DefaultView style={styles.textInputContainer}>
            <DefaultTextInput
                onFocus={() => setFocused(true)}
                style={focused ? styles.focusedInput : styles.input}
                {...props}
                onBlur={() => {
                    onValidateValue(props.value || '')
                    setFocused(false)
                }}
                multiline={props.hasMultipleLines}
                numberOfLines={props.hasMultipleLines ? 3 : 1}
            />
            {renderFormFooter()}
            {renderErrorMessage()}
        </DefaultView>
    );
}

const styles = StyleSheet.create({
    textInputContainer: {
        marginTop: 10,
        marginBottom: 20
    },
    input: {
        width: '100%',
        borderColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 0,
        marginBottom: 5,
        paddingHorizontal: 10
    },
    focusedInput: {
        width: '100%',
        borderColor: '#e4e6eb',
        borderBottomWidth: 1,
        fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 0,
        marginBottom: 5,
        paddingHorizontal: 10
    },
    errorText: {
        width: '100%',
        fontSize: Dimensions.get('window').width < 768 ? 10 : 11,
        color: 'red',
        textAlign: 'right'
    },
    footer: {
        width: '100%',
        fontSize: Dimensions.get('window').width < 768 ? 10 : 11,
        textAlign: 'right'
    }
});
