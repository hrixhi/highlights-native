import React, { useState } from "react";
import {
  Text as DefaultText,
  View as DefaultView,
  TextInput as DefaultTextInput,
  StyleSheet
} from "react-native";
import { PreferredLanguageText } from "../helpers/LanguageContext";

type FieldTypeProps = {
  hasMultipleLines?: boolean
}

type ValidationProps = {
  required?: boolean;
  errorText?: string;
  regEx?: RegExp;
};

type FooterProps = {
  footerMessage?: string;
};

export type TextInputProps = ValidationProps &
  FooterProps &
  FieldTypeProps &
  DefaultTextInput["props"];

export function TextInput(props: TextInputProps) {
  const [errorType, setErrorType] = useState(""); // Error description; Empty String if none;
  const requiredErrorText = PreferredLanguageText('required')

  const onValidateValue = (value: string) => {
    const { errorText, regEx } = props;
    if (props.required && !value) {
      setErrorType(requiredErrorText);
      return;
    }

    if (regEx) {
      const valid: boolean = value ? regEx.test(value) : true;
      if (!valid) {
        setErrorType("Invalid Input");
        return;
      }
    }

    if (errorText) {
      setErrorType(errorText);
      return;
    }

    setErrorType("");
    return;
  };

  const renderErrorMessage = () => {
    return errorType !== "" ? (
      <DefaultText style={styles.errorText}>{errorType}</DefaultText>
    ) : null;
  };

  const renderFormFooter = () => {
    const { footerMessage } = props;
    return footerMessage && !errorType ? (
      <DefaultText style={styles.footer}>{footerMessage}</DefaultText>
    ) : null;
  };

  console.log(errorType);
  return (
    <DefaultView style={styles.textInputContainer}>
      <DefaultTextInput
        style={styles.input}
        {...props}
        onBlur={() => onValidateValue(props.value || "")}
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
    width: "100%",
    borderBottomColor: "#cccccc",
    borderBottomWidth: 1,
    fontSize: 15,
    paddingTop: 13,
    paddingBottom: 13,
    marginTop: 0,
    marginBottom: 5
  },
  errorText: {
    fontSize: 10,
    color: "red",
    display: "flex",
    justifyContent: "flex-end"
  },
  footer: {
    fontSize: 10,
    display: "flex",
    justifyContent: "flex-end",
    flex: 1,
    width: "100%"
  }
});
