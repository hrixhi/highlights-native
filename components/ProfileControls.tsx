import React, { useState, useEffect, useCallback } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Text, View, TouchableOpacity } from "./Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  signup,
  updatePassword,
  updateUser
} from "../graphql/QueriesAndMutations";
import { validateEmail } from "../helpers/emailCheck";
import Alert from "../components/Alert";
import * as Updates from "expo-updates";
import { TextInput } from "./CustomTextInput";
import {
  PreferredLanguageText,
  LanguageSelect
} from "../helpers/LanguageContext";

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (
  props: any
) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSavePassword, setShowSavePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  // Signup Validation
  const [emailValidError, setEmailValidError] = useState("");
  const [passwordValidError, setPasswordValidError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Change Password Validation
  const [newPasswordValidError, setNewPasswordValidError] = useState("");
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("");

  // Current Profile Change Validation
  // Store existing fullname and displayname to see if anything has changed when updating profile
  const [currentFullName, setCurrentFullName] = useState("");
  const [currentDisplayName, setCurrentDisplayName] = useState("");

  // Alerts
  const passwordUpdatedAlert = PreferredLanguageText("passwordUpdated");
  const incorrectCurrentPasswordAlert = PreferredLanguageText(
    "incorrectCurrentPassword"
  );
  const passwordDoesNotMatchAlert = PreferredLanguageText(
    "passwordDoesNotMatch"
  );
  const somethingWentWrongAlert = PreferredLanguageText("somethingWentWrong");
  const profileUpdatedAlert = PreferredLanguageText("profileUpdated");
  const enterValidEmailError = PreferredLanguageText("enterValidEmail");
  const passwordInvalidError = PreferredLanguageText("atleast8char");

  const handleSubmit = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    if (!u) {
      return;
    }
    const user = JSON.parse(u);
    const server = fetchAPI("");

    if (showSavePassword) {
      // reset password
      server
        .mutate({
          mutation: updatePassword,
          variables: {
            userId: user._id,
            currentPassword,
            newPassword
          }
        })
        .then(res => {
          if (res.data && res.data.user.updatePassword) {
            Alert(passwordUpdatedAlert);
            props.reOpenProfile();
          } else {
            Alert(incorrectCurrentPasswordAlert);
          }
        })
        .catch(err => {
          Alert(somethingWentWrongAlert);
        });
      return;
    }

    if (!loggedIn) {
      server
        .mutate({
          mutation: signup,
          variables: {
            email: email
              .toString()
              .trim()
              .toLowerCase(),
            password: password.toString(),
            fullName: fullName.toString().trim(),
            displayName: displayName.toString().trim(),
            userId: user._id
          }
        })
        .then(async res => {
          if (res.data.user.signup === "") {
            const user = JSON.parse(u);
            user.email = email;
            user.fullName = fullName;
            user.displayName = displayName;
            const updatedUser = JSON.stringify(user);
            await AsyncStorage.setItem("user", updatedUser);
            props.saveDataInCloud();
            props.reOpenProfile();
          } else {
            // Error
            Alert(res.data.user.signup || somethingWentWrongAlert);
          }
        });
    } else {
      // save data
      server
        .mutate({
          mutation: updateUser,
          variables: {
            displayName,
            fullName,
            userId: user._id
          }
        })
        .then(async res => {
          if (res.data && res.data.user.update) {
            user.fullName = fullName;
            user.displayName = displayName;
            const updatedUser = JSON.stringify(user);
            await AsyncStorage.setItem("user", updatedUser);
            Alert(profileUpdatedAlert);
            props.reOpenProfile();
          } else {
            Alert(somethingWentWrongAlert);
          }
        })
        .catch(e => Alert(somethingWentWrongAlert));
    }
  }, [
    loggedIn,
    email,
    password,
    displayName,
    fullName,
    confirmPassword,
    showSavePassword,
    newPassword,
    currentPassword
  ]);

  const getUser = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    if (u) {
      const parsedUser = JSON.parse(u);
      if (parsedUser.email) {
        setLoggedIn(true);
        setEmail(parsedUser.email);
        setDisplayName(parsedUser.displayName);
        setFullName(parsedUser.fullName);

        setCurrentDisplayName(parsedUser.displayName);
        setCurrentFullName(parsedUser.fullName);
      }
      setUserFound(true);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.clear();
    await Updates.reloadAsync();
  }, []);

  useEffect(() => {
    getUser();
  }, []);

  //   Validate if submit is enabled after every state change
  useEffect(() => {
    // Reset Password state
    if (
      showSavePassword &&
      currentPassword &&
      newPassword &&
      confirmNewPassword &&
      !newPasswordValidError &&
      !confirmNewPasswordError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // Logged in
    if (
      !showSavePassword &&
      loggedIn &&
      fullName &&
      displayName &&
      (fullName !== currentFullName || displayName !== currentDisplayName)
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // Not logged in
    if (
      !loggedIn &&
      email &&
      fullName &&
      displayName &&
      password &&
      confirmPassword &&
      !emailValidError &&
      !passwordValidError &&
      !confirmPasswordError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [
    loggedIn,
    email,
    fullName,
    displayName,
    password,
    confirmPassword,
    emailValidError,
    passwordValidError,
    confirmPasswordError,
    showSavePassword,
    currentPassword,
    newPassword,
    confirmNewPassword,
    newPasswordValidError,
    confirmNewPasswordError,
    currentDisplayName,
    currentFullName
  ]);

  useEffect(() => {
    if (email && !validateEmail(email.toString().toLowerCase())) {
      setEmailValidError(enterValidEmailError);
      return;
    }

    setEmailValidError("");
  }, [email]);

  useEffect(() => {
    const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (password && !validPasswrdRegex.test(password)) {
      setPasswordValidError(passwordInvalidError);
      return;
    }

    setPasswordValidError("");
  }, [password]);

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError(passwordDoesNotMatchAlert);
      return;
    }

    setConfirmPasswordError("");
  }, [password, confirmPassword]);

  useEffect(() => {
    const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (newPassword && !validPasswrdRegex.test(newPassword)) {
      setNewPasswordValidError(passwordInvalidError);
      return;
    }

    setNewPasswordValidError("");
  }, [newPassword]);

  useEffect(() => {
    if (
      newPassword &&
      confirmNewPassword &&
      newPassword !== confirmNewPassword
    ) {
      setConfirmNewPasswordError(passwordDoesNotMatchAlert);
      return;
    }

    setConfirmNewPasswordError("");
  }, [newPassword, confirmNewPassword]);

  if (!userFound) {
    return (
      <View style={styles.screen} key={1}>
        <View style={{ width: "100%", backgroundColor: "white" }}>
          <View style={styles.colorBar}>
            <Text style={{ fontSize: 25, color: "#a2a2aa" }}>
              {PreferredLanguageText("internetRequiried")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} key={1}>
      <ScrollView
        style={{ width: "100%", backgroundColor: "white" }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 30,
            color: "#202025",
            fontFamily: "inter",
            paddingBottom: 15,
            textAlign: "center",
            paddingTop: 30
          }}
        >
          {!loggedIn
            ? PreferredLanguageText("backUp")
            : PreferredLanguageText("profile")}
        </Text>
        <Text
          style={{
            fontSize: 20,
            color: "#a2a2aa",
            fontFamily: "overpass",
            paddingBottom: 25,
            textAlign: "center"
          }}
        >
          {!loggedIn ? PreferredLanguageText("createAccount") : ""}
        </Text>
        {showSavePassword ? (
          <View
            style={{
              width: "100%",
              backgroundColor: "white",
              paddingTop: 20,
              paddingBottom: 20
            }}
          >
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("currentPassword")}
            </Text>

            <TextInput
              secureTextEntry={true}
              editable={true}
              value={currentPassword}
              placeholder={""}
              onChangeText={val => setCurrentPassword(val)}
              placeholderTextColor={"#a2a2aa"}
            />
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("newPassword")}
            </Text>
            <TextInput
              secureTextEntry={true}
              value={newPassword}
              placeholder={""}
              onChangeText={val => setNewPassword(val)}
              placeholderTextColor={"#a2a2aa"}
              errorText={newPasswordValidError}
              footerMessage={PreferredLanguageText("atleast8char")}
            />
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("confirmNewPassword")}
            </Text>
            <TextInput
              secureTextEntry={true}
              value={confirmNewPassword}
              placeholder={""}
              onChangeText={val => setConfirmNewPassword(val)}
              placeholderTextColor={"#a2a2aa"}
              errorText={confirmNewPasswordError}
            />
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              backgroundColor: "white",
              paddingTop: 20,
              paddingBottom: 20
            }}
          >
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("email")}
            </Text>
            <TextInput
              secureTextEntry={false}
              editable={!loggedIn}
              value={email}
              placeholder={""}
              onChangeText={val => setEmail(val)}
              placeholderTextColor={"#a2a2aa"}
              required={true}
            />
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("fullName")}
            </Text>
            <TextInput
              secureTextEntry={false}
              value={fullName}
              placeholder={""}
              onChangeText={val => setFullName(val)}
              placeholderTextColor={"#a2a2aa"}
              required={true}
            />
            <Text style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}>
              {PreferredLanguageText("displayName")}
            </Text>
            <TextInput
              secureTextEntry={false}
              value={displayName}
              placeholder={""}
              onChangeText={val => setDisplayName(val)}
              placeholderTextColor={"#a2a2aa"}
              required={true}
            />
            {loggedIn ? null : (
              <View style={{ backgroundColor: "#fff" }}>
                <Text
                  style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}
                >
                  {PreferredLanguageText("password")}
                </Text>
                <TextInput
                  value={password}
                  placeholder={""}
                  onChangeText={val => setPassword(val)}
                  placeholderTextColor={"#a2a2aa"}
                  secureTextEntry={true}
                  required={true}
                  footerMessage={PreferredLanguageText("atleast8char")}
                  errorText={passwordValidError}
                />
                <Text
                  style={{ color: "#202025", fontSize: 14, paddingBottom: 10 }}
                >
                  {PreferredLanguageText("confirmPassword")}
                </Text>
                <TextInput
                  value={confirmPassword}
                  placeholder={""}
                  onChangeText={val => setConfirmPassword(val)}
                  placeholderTextColor={"#a2a2aa"}
                  secureTextEntry={true}
                  required={true}
                  errorText={confirmPasswordError}
                />
              </View>
            )}
          </View>
        )}
        <View
          style={{
            // flex: 1,
            backgroundColor: "white",
            justifyContent: "center",
            // display: 'flex',
            // height: 50,
            marginTop: 0,
            marginBottom: 200
          }}
        >
          {loggedIn ? (
            <TouchableOpacity
              onPress={() => setShowSavePassword(!showSavePassword)}
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                marginTop: 15,
                borderRadius: 15,
                width: "100%",
                justifyContent: "center",
                flexDirection: "row"
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#202025",
                  overflow: "hidden",
                  fontSize: 12,
                  backgroundColor: "#f4f4f6",
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15,
                  textTransform: "uppercase"
                }}
              >
                {showSavePassword
                  ? PreferredLanguageText("back")
                  : PreferredLanguageText("password")}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 20, backgroundColor: "#fff" }} />
          )}
          <TouchableOpacity
            onPress={() => handleSubmit()}
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              height: 35,
              borderRadius: 15,
              marginTop: 15,
              width: "100%",
              justifyContent: "center",
              flexDirection: "row"
            }}
            disabled={isSubmitDisabled}
          >
            <Text
              style={{
                textAlign: "center",
                lineHeight: 35,
                color: "white",
                fontSize: 12,
                backgroundColor: "#3B64F8",
                paddingHorizontal: 25,
                fontFamily: "inter",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                textTransform: "uppercase"
              }}
            >
              {loggedIn
                ? showSavePassword
                  ? PreferredLanguageText("update")
                  : PreferredLanguageText("save")
                : PreferredLanguageText("signUp")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              if (loggedIn) {
                logout();
              } else {
                await Updates.reloadAsync();
              }
            }}
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              height: 35,
              borderRadius: 15,
              marginTop: 15,
              width: "100%",
              justifyContent: "center",
              flexDirection: "row",
              marginBottom: 50
            }}
          >
            <Text
              style={{
                textAlign: "center",
                lineHeight: 35,
                color: "#202025",
                overflow: "hidden",
                fontSize: 12,
                backgroundColor: "#f4f4f6",
                paddingHorizontal: 25,
                fontFamily: "inter",
                height: 35,
                width: 150,
                borderRadius: 15,
                textTransform: "uppercase"
              }}
            >
              {loggedIn
                ? PreferredLanguageText("logout")
                : PreferredLanguageText("login")}
            </Text>
          </TouchableOpacity>
          <LanguageSelect />
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileControls;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 30,
    width: "100%",
    height: Dimensions.get("window").height - 85,
    backgroundColor: "white"
  },
  outline: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a2a2aa"
  },
  all: {
    fontSize: 15,
    color: "#a2a2aa",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allOutline: {
    fontSize: 15,
    color: "#a2a2aa",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a2a2aa"
  },
  colorBar: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "white",
    marginBottom: "15%",
    lineHeight: 18,
    paddingTop: 15
  }
});
