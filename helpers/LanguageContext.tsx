import React, { useState, useEffect } from "react";
// import Select from 'react-select';
import {  StyleSheet } from 'react-native';
import { Text as DefaultText, View as DefaultView, TouchableOpacity } from "../components/Themed";
import { Picker } from '@react-native-picker/picker';
import useColorScheme from '../hooks/useColorScheme';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const languageOptions = [
    {value: 'en', label : "English"} ,
    {value: 'hin', label: "हिंदी" },
    {value: 'guj', label: "ગુજરાતી"}
]

const EnglishBank: {[key: string]: string} = {
    login: "Login", // Done
    continueLeftOff: "Continue where you left off.", // Done
    email: "Email", // Done
    password: "Password", // Done
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password", // Done
    skipForNow: "Skip for now",  // Done
    temporaryPassword: "We'll send you a temporary password.", // Done
    back: "back", // Done
    reset: "Reset", // Done
    new: "New", // Done,
    newGroup: "New Group",
    noGroups: "No groups.",
    formula: "Formula", // Done
    hide: "Hide", // Done
    import: "import", // Done
    quiz: "Quiz", // Done
    title: 'Title', // Done
    myCues: 'My Cues', // Done
    category: "Category", // Done
    priority: "Priority", // Done
    remindEvery: "Remind every", // Done
    remindOn: "Remind on", // Done
    remindTill: "Remind Till", // Done
    save: "Save", // Done
    share: "Share", // Done
    channel: "Channel", // Done
    create: 'Create', // Done
    channels: "Channels", // Done
    submissionRequired: "Submission Required", // Done
    deadline: "Deadline", // Done
    graded: "Graded", // Done
    percentageOverall: "(% of overall grade)", // Done
    none: 'None', // Done
    viewShared: "View Shared", // Done
    viewSubmission: "View Submission",
    viewAttendance: "View Attendance",
    inviteByEmail: "Invite by Email", 
    myNotes: "My notes", // Done
    mySubmission: "My Submission", // Done
    status: "Status", // DOne
    noStatuses: "No statuses.",
    unableToLoadStatuses: "Unable to load statuses.",
    noStudents: "No students.",
    update: "Update", // Done
    forward: "Forward", 
    read: "Read", // Done
    notDelivered: "Not delivered", // Done
    delivered: "Delivered", // Done
    all: "All", // Done
    planner: "Planner", // DOne
    event: "Event", // Done
    subscribe: 'Subscribe', // Done
    profile: "Profile", // DOne
    fullName: "Full Name", // Done
    displayName: "Display Name", // Done
    currentPassword: "Current Password", // DOne
    newPassword: "New Password", // Done
    atleast8char: 'At least 8 characters, 1 uppercase letter, 1 number & 1 symbol', // Done
    confirmNewPassword: "Confirm New Password", // Done
    logout: "Logout", // Done
    enrolmentPassword: "Enrolment password",
    backUp: 'Back up', // Done
    createAccount: 'Create an account to save your work to the cloud.', // Done
    signUp: 'Sign up', // Done
    classroom: 'Classroom',
    initiateMeeting: 'Initiate meeting & allow participants',
    enterClassroom: 'Enter Classroom', // Done
    upcoming: 'Upcoming', // DOne
    start: 'Start', // Done
    end: 'End', // Done
    noMeeting: 'No meetings scheduled', // Done
    noAttendances: 'No attendances', // Done
    attendance: 'Attendance',
    noMessages: 'No messages.',
    message: 'Message',
    joinedAt: 'Joined at', // Done
    noPastMeetings: 'No past meetings.',
    attendedBy: 'Attended By',
    past: 'Past', // Done
    options: 'Options', // Done
    option: 'Option', // Done
    comments: 'Comments', // Done
    noComments: 'No comments.', // Done
    noPosts: 'No posts.', // Done
    delete: 'Delete', // Done
    deleteForEveryone: 'Delete For Everyone', // Done
    submit: 'Submit', // Done
    submitted: 'Submitted', // Done
    submissionEnded: 'Submissions ended', // Done
    ended: 'ended', // Done
    resubmit: 'Resubmit', // Done
    signupToSubmit: 'Signup to submit', // Done
    private: 'Private', // Done
    post: 'Post', // Done
    anonymous: 'anonymous', // Done
    grades: 'Grades', // Done
    noGraded: 'No graded assignments.',
    total: 'Total', // Done
    test: 'Test', // Done
    discussion: 'Discussion', // Done
    send: 'Send',
    reply: 'Reply', // Done
    add: 'Add',
    addUsers: "Add users", // Done
    score: 'Score', // Done
    internetRequired: 'Internet connection required to initialise.',
    removeFromChannel: "REMOVE FROM CHANNEL", //
    inbox: 'Inbox',
    noCuesCreated: 'No cues created.',
    present: 'Present',
    addChoice: 'Add Choice',
    addProblem: 'Add Problem',
    problem: 'Problem',
    enterPoints: 'Enter points',
    // Alerts
    savedLocally: 'Your changes will be saved locally but not in the cloud.',
    quizzesCanOnly: 'Quizzes can only be shared with channels created by you. Select a channel from the options below to share the quiz with and then try again.',
    newCategory: 'New Category',
    gradersRemarks: "Grader's Remarks",
    startQuiz: 'start quiz',
    optional: 'Optional',
    required: 'Required',
    due: "Due",
    classroomNotInSession: "Classroom not in session. You will be notified when initiated.",
    incorrectPassword: 'Incorrect password.',
    alreadySubscribed: "Already subscribed.",
    somethingWentWrong: 'Something went wrong.',
    checkConnection: "Check Connection",
    doesNotExists: "Does not exist.",
    invalidChannelName: "Invalid channel name.",
    nameAlreadyInUse: "Name already in use.",
    changesNotSaved: "Changes not saved.",
    enterOneProblem: "Enter at least one problem.",
    invalidDuration: "Invalid duration.",
    fillMissingProblems: "Fill out missing problems.",
    enterNumericPoints: "Enter numeric points for all questions.",
    mustHaveOneOption: "Each problem must have at least one option.",
    fillMissingOptions: "Fill out missing options.",
    eachOptionOneCorrect: "Each problem must have at least one correct answer.",
    noStudentSelected: "No student selected!",
    selectWhoToShare: "Select who to share with. Re-select channel to select all members.",
    clearQuestion: "Clear?",
    cannotUndo: "This action cannot be undone.",
    enterContent: 'Enter content.',
    enterTitle: 'Enter title.',
    unableToLoadDiscussion: "Unable to load discussion.",
    unableToLoadSubscribers: "Unable to load subscribers.",
    meetingMustBeFuture: 'Meeting must be set in future',
    unableToPost: "Unable to post.",
    passwordUpdated: "Password updated!",
    incorrectCurrentPassword: "Incorrect value for current password.",
    passwordDoesNotMatch: "Password doesn't match",
    profileUpdated: "Profile updated!",
    usersAdded: "Users Added!",
    userRemoved: "User removed",
    alreadyUnsubscribed: "Already unsubscribed",
    emailInviteSent: "Email invite sent.",
    unableToLoadMessages: "Unable to load messages.",
    userSubscriptionActivated: "User subscription activated!",
    userSubscriptionInactivated: "User subscription inactivated!",
    makeActive: 'Make active',
    makeInactive: 'Make inactive',
    unableToLoadThread: 'Unable to load thread.',
    unableToLoadComments: 'Unable to load comments',
    unableToStartQuiz: 'Unable to start quiz!',
    deadlineHasPassed: 'Deadline has passed.',
    cueDeleted: 'Cue Deleted',
    submissionFailed: 'Submission Failed.',
    submissionComplete: 'Submission Complete',
    ifYouStartTimedQuiz: 'If you started a timed quiz, your last recorded edit will be recorded.',
    tryAgainLater: 'Try again later.',
    sharedAlert: 'Shared!',
    enterValidEmail: 'Enter a valid email.',
    eraseContentLeaveChannel: "Erase content and leave channel?",
    thisActionWillIrreversibly: "This action will irreversibly remove shared content, comunication and any notes directly taken inside ",
    eraseContentAndUnsubscrbe: 'Erase Content & Unsubscribe',
    weHaveEmailedPassword: 'We have emailed you a new password!',
    invalidCredentials: "Invalid credentials. Ensure email is correct.",
    unableToRefreshCues: "Unable to refresh channel cues.",
    leaveChannel: "Leave Channel",
    areYouSureUnsubscribe: "Are you sure you want to unsubscribe from ",
    keepContentAndUnsubscribe: "Keep Content & Unsubscribe",
    clickPlusAndSelect: 'Click + and select this channel to broadcast a cue.',
}

const HindiBank: {[key: string]: string} = {
    login: "लॉग इन करें",
    continueLeftOff: "जारी रखें जहां आपने छोड़ा था।",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    forgotPassword: "पासवर्ड भूल गए",
    skipForNow: "अभी के लिए जाने दे",
    temporaryPassword: "हम आपको एक अस्थायी पासवर्ड भेजेंगे।",
    back: "वापस",
    reset: "रीसेट",
    new: "नवीन",
    newGroup: "नया समूह",
    noGroups: 'कोई समूह नहीं',
    formula: "सूत्र",
    hide: "छिपाना",
    import: "आयात",
    quiz: "प्रश्नोत्तरी",
    title: "शीर्षक",
    myCues: 'मेरे Cues',
    category: "वर्ग",
    priority: "वरीयता",
    remindEvery: "कितनी बार याद दिलाएं",
    remindOn: "किस दिन याद दिलाएं",
    remindTill: "यह दिन तक याद दिलाना",
    save: "बचाओ",
    share: "शेयर",
    channel: "चैनल",
    create: 'नया बनाओ',
    channels: "चैनलों",
    submissionRequired: "प्रस्तुत करना आवश्यक है",
    deadline: "समयसीमा",
    graded: "ग्रेड दिया गया",
    percentageOverall: "(पूरा ग्रेड का %)",
    none: 'कोई नहीं',
    viewShared: "साझा देखें",
    viewSubmission: "सबमिशन देखें",
    viewAttendance: "उपस्थिति देखें",
    inviteByEmail: "ईमेल द्वारा आमंत्रित करें",
    myNotes: "मेरी टिप्पणियाँ",
    mySubmission: "मेरा सबमिशन",
    status: "स्थिति",
    noStatuses: "कोई स्थिति नहीं",
    unableToLoadStatuses: "स्थिति लोड करने में असमर्थ",
    noStudents: "कोई छात्र नहीं",
    update: "अपडेट करें",
    forward: "आगे",
    read: "पढ लिया",
    notDelivered: "डिलीवर नहीं हु",
    delivered: "डिलीवर हुआ",
    all: "सब",
    planner: "योजनाकर्ता",
    event: "प्रतिस्पर्धा",
    subscribe: "सदस्य बनें",
    profile: "प्रोफ़ाइल",
    fullName: "पूरा नाम",
    displayName: "प्रयोक्ता नाम",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    atleast8char: "कम से कम 8 अक्षर, 1 बड़ा अक्षर, 1 नंबर और 1 प्रतीक",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    logout: "लॉग आउट",
    enrolmentPassword: 'पासवर्ड',
    backUp: "बैकअप",
    createAccount: "अपने काम को क्लाउड पर सहेजने के लिए एक खाता बनाएँ।",
    signUp: 'सयन ऑप कराओ',
    classroom: 'क्लास रूम',
    initiateMeeting: 'बैठक की शुरुआत करें और प्रतिभागियों को अनुमति दें',
    enterClassroom: 'कक्षा में प्रवेश करें',
    upcoming: 'आगामी',
    start: 'शुरू',
    end: 'समाप्त',
    noMeeting: 'कोई बैठक नहीं',
    noAttendances: 'कोई उपस्थिति नहीं',
    attendance: 'उपस्थिति',
    noMessages: 'कोई संदेश नहीं',
    message: 'संदेश',
    joinedAt: 'शामिल हुए ',
    noPastMeetings: 'कोई पिछली बैठक नहीं',
    attendedBy: 'भाग लिया',
    past: 'अतीत',
    options: 'विकल्प',
    option: 'विकल्प',
    comments: 'टिप्पणियाँ',
    noComments: 'कोई टिप्पणी नहीं',
    noPosts: 'कोई पोस्ट नहीं',
    delete: 'हटाना',
    deleteForEveryone: 'सभी के लिए डिलीट करें',
    submit: 'प्रस्तुत कर',
    submitted: 'सबमिट करा',
    submissionEnded: 'प्रस्तुतियाँ समाप्त हो गईं',
    ended: 'समाप्त',
    resubmit: 'फिर से प्रस्तुत कर',
    signupToSubmit: 'सबमिट करने के लिए साइनअप करें',
    private: 'निजी',
    post: 'पोस्ट',
    anonymous: 'गुमनाम',
    grades: 'ग्रेड देखें',
    noGraded: 'कोई ग्रेडेड असाइनमेंट नहीं।',
    total: 'संपूर्ण',
    test: 'परीक्षा',
    discussion: 'विचार-विमर्श',
    send: 'भेजें',
    reply: 'जवाब', 
    add: '',
    addUsers: 'उपयोगकर्ताओं को जोड़ें',
    score: 'स्कोर',
    internetRequired: 'आरंभ करने के लिए इंटरनेट कनेक्शन आवश्यक है।',
    removeFromChannel: 'चैनल से हटाओ',
    inbox: 'इनबॉक्स',
    noCuesCreated: 'कोई Cues नहीं बनाया गया।',
    present: 'मौजूद',
    addChoice: 'विकल्प जोड़ें',
    addProblem: 'नया प्रश्न',
    problem: 'प्रश्न',
    enterPoints: 'अंक दर्ज करें',

    savedLocally: 'आपके परिवर्तन स्थानीय रूप से सहेजे जाएंगे लेकिन क्लाउड में नहीं।',
    quizzesCanOnly: 'क्विज़ को केवल आपके द्वारा बनाए गए चैनलों के साथ साझा किया जा सकता है। क्विज़ को साझा करने के लिए नीचे दिए विकल्पों में से एक चैनल चुनें और फिर पुनः प्रयास करें।',
    gradersRemarks: 'ग्रेडर की टिप्पणी',
    startQuiz: 'प्रश्नोत्तरी शुरू करें',
    optional: 'आवश्यक नहीं',
    required: 'आवश्यक',
    due: 'समयसीमा',
    classroomNotInSession: "कक्षा सत्र में नहीं है। आरंभ किए जाने पर आपको सूचित किया जाएगा।",
    incorrectPassword: "गलत पासवर्ड",
    alreadySubscribed: "पहले से सदस्य",
    somethingWentWrong: 'कुछ गड़बड़ हो गई।',
    checkConnection: "कनेक्शन जांचें।",
    doesNotExists: "अस्तित्व में नहीं है।",
    invalidChannelName: "चैनल का नाम उपलब्ध नहीं है।",
    nameAlreadyInUse: "नाम पहले से प्रयोग में है।",
    changesNotSaved: "परिवर्तन अपलोड नहीं किए गए।",
    enterOneProblem: "कम से कम एक समस्या दर्ज करें।",
    invalidDuration: "अमान्य अवधि।",
    fillMissingProblems: "खाली समस्या को भरें।",
    enterNumericPoints: "सभी प्रश्नों के लिए संख्यात्मक अंक दर्ज करें।",
    mustHaveOneOption: "प्रत्येक समस्या में कम से कम एक विकल्प होना चाहिए।",
    fillMissingOptions: "छूटे हुए विकल्पों को भरें।",
    eachOptionOneCorrect: "प्रत्येक समस्या का कम से कम एक सही उत्तर होना चाहिए।",
    noStudentSelected: "कोई छात्र चयनित नहीं!",
    selectWhoToShare: "चुनें कि किसके साथ साझा करना है। सभी सदस्यों को चुनने के लिए चैनल को फिर से चुनें।",
    clearQuestion: "साफ़ करें?",
    cannotUndo: "इस क्रिया को पूर्ववत नहीं किया जा सकता है।",
    enterContent: 'सामग्री दर्ज करें।',
    enterTitle: 'शीर्षक दर्ज करें।',
    unableToLoadDiscussion: "विचार-विमर्श लोड नहीं कर सका",
    unableToLoadSubscribers: "सब्सक्राइबर्स लोड नहीं कर सका",
    meetingMustBeFuture: 'बैठक भविष्य में होनी चाहिए',
    unableToPost: "पोस्ट नहीं कर सका",
    passwordUpdated: "पासवर्ड अपडेट किया गया!",
    incorrectCurrentPassword: "वर्तमान पासवर्ड के लिए गलत मान",
    passwordDoesNotMatch: "पासवर्ड मेल नहीं खाता",
    profileUpdated: "प्रोफ़ाइल अपडेट हो गया",
    usersAdded: "उपयोगकर्ता जोड़ा!",
    userRemoved: "उपयोगकर्ता को हटा दिया गया",
    alreadyUnsubscribed: "पहले ही सदस्यता समाप्त कर दी गई है।",
    emailInviteSent: "ईमेल आमंत्रण भेजा गया।",
    unableToLoadMessages: "संदेश लोड करने में असमर्थ.",
    userSubscriptionActivated: "उपयोगकर्ता सदस्यता सक्रिय!",
    userSubscriptionInactivated: "उपयोगकर्ता सदस्यता निष्क्रिय!",
    makeActive: 'सक्रिय बनाओ',
    makeInactive: 'निष्क्रिय बनाओ',
    unableToLoadThread: 'वार्तालाप लोड नहीं कर सका',
    unableToLoadComments: 'टिप्पणियां लोड करने में असमर्थ',
    unableToStartQuiz: 'प्रश्नोत्तरी शुरू करने में असमर्थ!',
    deadlineHasPassed: 'समय सीमा बीत चुकी है।',
    cueDeleted: 'Cue हटाया गया',
    submissionFailed: 'सबमिशन फेल',
    submissionComplete: 'सबमिशन पूर्ण',
    ifYouStartTimedQuiz: 'यदि आपने एक समयबद्ध प्रश्नोत्तरी शुरू की है, तो आपका अंतिम रिकॉर्ड किया गया संपादन रिकॉर्ड किया जाएगा।',
    tryAgainLater: 'बाद में प्रयास करें।',
    sharedAlert: 'भेज दिया!',
    enterValidEmail: 'एक मान्य ईमेल पता दर्ज करें',
    eraseContentLeaveChannel: "सामग्री मिटाएँ और चैनल छोड़ दें?",
    thisActionWillIrreversibly: "यह कार्रवाई अपरिवर्तनीय रूप से साझा सामग्री, संचार और सीधे अंदर ले गए किसी भी नोट को हटा देगी ",
    eraseContentAndUnsubscrbe: 'सामग्री मिटाएं और सदस्यता समाप्त करें',
    weHaveEmailedPassword: 'हमने आपको एक नया पासवर्ड ईमेल किया है!',
    invalidCredentials: "अवैध प्रत्यय पत्र। सुनिश्चित करें कि ईमेल सही है।",
    unableToRefreshCues: 'नया Cues डाउनलोड नहीं कर सका',
    leaveChannel: "चैनल छोड़ें",
    areYouSureUnsubscribe: "क्या आप वाकई से सदस्यता समाप्त करना चाहते हैं - ",
    keepContentAndUnsubscribe: "सामग्री रखें और सदस्यता समाप्त करें",
    clickPlusAndSelect: '+ क्लिक करें और संकेत बनाने के लिए इस चैनल का चयन करें।',
}

const GujaratiBank: {[key: string]: string} = {
    login: "લોગીન કરો",
    continueLeftOff: "તમે જ્યાંથી છોડ્યું હતું ત્યાં થી શરૂ કરો",
    email: "ઇમેઇલ",
    password: "પાસવર્ડ",
    confirmPassword: "પાસવર્ડની પુષ્ટિ કરો",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા છો",
    skipForNow: "હમણાં માટે અવગણો",
    temporaryPassword: "અમે તમને હંગામી પાસવર્ડ મોકલીશું.",
    back: "પાછા",
    reset: "ફરીથી સેટ કરો",
    new: "નવું",
    newGroup: "નવું સમૂહ",
    noGroups: 'કોઈ જૂથો નથી',
    formula: "સૂત્ર",
    hide: "છુપાવો",
    import: "આયાત કરો",
    quiz: "ક્વિઝ",
    title: "શીર્ષક",
    myCues: 'મારા Cues',
    category: "કેટેગરી",
    priority: "પ્રાથમિકતા",
    remindEvery: "દરેક સમયે યાદ કરાઓ",
    remindOn: "આ દિવસે યાદ અપાવો",
    remindTill: "આ સમય સુધી યાદ અપાવો",
    save: "સાચવો",
    share: "શેર કરો",
    channel: "ચેનલ",
    create: 'નવું બનાવો',
    channels: "ચેનલો",
    submissionRequired: "સબમિશન આવશ્યક છે",
    deadline: "ડેડલાઈન",
    graded: "ગ્રેડ આપ્યો",
    percentageOverall: "(% ઓવરઓલ ગ્રેડ)",
    none: 'કંઈ નહીં',
    viewShared: "શેર જુઓ",
    viewSubmission: "સબમિશન જુઓ",
    viewAttendance: "હાજરી જુઓ",
    inviteByEmail: "ઇમેઇલ દ્વારા આમંત્રિત કરો",
    myNotes: "મારી નોંધો",
    mySubmission: 'મારું સબમિશન',
    status: "સ્થિતિ",
    noStatuses: "કોઈ સ્થિતિ નથી",
    unableToLoadStatuses: "સ્થિતિઓ લોડ કરવામાં અસમર્થ",
    noStudents: "કોઈ વિદ્યાર્થીઓ નાથી",
    update: "અપડેટ",
    forward: "આગળ",
    read: "વાંચ્યું છે",
    notDelivered: "ડિલીવર નથી થયું",
    delivered: "ડિલીવર થયું",
    all: "બધું જ",
    planner: "આયોજક",
    event: "ઘટના",
    subscribe: "સબ્સ્ક્રાઇબ કરો",
    profile: "પ્રોફાઇલ",
    fullName: "પૂરું નામ",
    displayName: "વપરાશકર્તા નામ",
    currentPassword: "વર્તમાન પાસવર્ડ",
    newPassword: 'નવો પાસવર્ડ',
    atleast8char: 'ઓછામાં ઓછા 8 અક્ષરો, 1 અપરકેસ અક્ષર, 1 નંબર અને 1 પ્રતીક',
    confirmNewPassword: "નવો પાસવર્ડની પુષ્ટિ કરો",
    logout: 'લૉગ આઉટ',
    enrolmentPassword: 'પાસવર્ડ',
    backUp: 'બેકઅપ',
    createAccount: 'તમારા કામને ક્લાઉડ પર સાચવવા માટે એક એકાઉન્ટ બનાવો',
    signUp: 'સાઇન અપ કરો',
    classroom: 'વર્ગ ખંડ',
    initiateMeeting: 'મીટિંગની શરૂઆત કરો અને સહભાગીઓને મંજૂરી આપો',
    enterClassroom: 'વર્ગ ખંડ માં પ્રવેશ કરો',
    upcoming: 'આગામી',
    start: 'શરૂઆત', 
    end: 'અંત',
    noMeeting: 'કોઇ મીટિંગ નિર્ધારિત નથી',
    noAttendances: 'કોઈ હાજરી નહિ',
    attendance: 'હાજરી',
    noMessages: 'કોઈ સંદેશા નથી',
    message: 'સંદેશ',
    joinedAt: 'જોડાયા',
    noPastMeetings: 'કોઈ ભૂતકાળની મીટિંગ્સ નથી',
    attendedBy: 'હાજરી આપી હતી',
    past: 'ભૂતકાળ',
    options: 'વિકલ્પ',
    option: 'વિકલ્પ',
    comments: 'ટિપ્પણી',
    noComments: 'કોઈ ટિપ્પણી નથી',
    noPosts: 'કોઈ પોસ્ટ નથી',
    delete: 'કાઢી નાખો',
    deleteForEveryone: 'બધા માટે ડિલીટ કરો',
    submit: 'સબમિટ કરો',
    submitted: 'સબમિટ કર્યું',
    submissionEnded: 'સબમિટ સમાપ્ત છે',
    ended: 'સમાપ્ત',
    resubmit: 'ફરીથી સબમિટ કરો',
    signupToSubmit: 'સબમિટ કરવા માટે સાઇનઅપ કરો',
    private: 'ખાનગી',
    post: 'પોસ્ટ',
    anonymous: 'અનામી',
    grades: 'ગ્રેડ જુઓ',
    noGraded: 'કોઈ વર્ગીકૃત સોંપણીઓ નથી.',
    total: 'કુલ',
    test: 'પરીક્ષા',
    discussion: 'વિચાર વિમર્શ',
    send: 'મોકલો',
    reply: 'જવાબ',
    add: '',
    addUsers: 'વપરાશકર્તાઓ ઉમેરો',
    score: 'સ્કોર',
    internetRequired: 'પ્રારંભ કરવા માટે ઇન્ટરનેટ કનેક્શન જરૂરી છે.',
    removeFromChannel: 'ચેનલમાંથી બહાર કરો',
    inbox: 'ઇનબોક્સ',
    noCuesCreated: 'કોઈ Cues બનાવ્યાં નથી',
    present: 'હાજર',
    addChoice: 'નવો વિકલ્પ',
    addProblem: 'નવો પ્રશ્ન',
    problem: 'પ્રશ્ન',
    enterPoints: 'પોઇન્ટ દાખલ કરો',

    savedLocally: 'તમારા ફેરફારો ઇન્ટરને નહીં પરંતુ સ્થાનિક રૂપે સાચવવામાં આવશે.',
    quizzesCanOnly: 'ક્વિઝ ફક્ત તમારા દ્વારા બનાવેલ ચેનલો સાથે જ શેર કરી શકાય છે. ક્વિઝને શેર કરવા માટે નીચેના વિકલ્પોમાંથી ચેનલ પસંદ કરો અને પછી ફરીથી પ્રયાસ કરો.',
    gradersRemarks: "ગ્રેડરની ટિપ્પણી",
    startQuiz: 'ક્વિઝ પ્રારંભ કરો',
    optional: 'જરૂરી નથી',
    required: 'જરૂરી',
    due: 'સમયમર્યાદા',
    classroomNotInSession: 'વર્ગખંડ સત્રમાં નથી. જ્યારે તમે પ્રારંભ કરશો ત્યારે તમને સૂચિત કરવામાં આવશે.',
    incorrectPassword: "ખોટો પાસવર્ડ",
    alreadySubscribed: "પહેલેથી સબ્સ્ક્રાઇબ કર્યું છે.",
    somethingWentWrong: 'કંઈક ખોટું થયું.',
    checkConnection: "ઇન્ટરનેટ કનેક્શન તપાસો.",
    doesNotExists: "અસ્તિત્વમાં નથી.",
    invalidChannelName: "ચેનલ નામ ઉપલબ્ધ નથી",
    nameAlreadyInUse: "નામ પહેલેથી ઉપયોગમાં છે",
    changesNotSaved: "ફેરફારો અપલોડ થયા નથી",
    enterOneProblem: "ઓછામાં ઓછી એક સમસ્યા દાખલ કરો.",
    invalidDuration: "અમાન્ય અવધિ.",
    fillMissingProblems: "ખાલી સમસ્યાઓ ભરો.",
    enterNumericPoints: "બધા પ્રશ્નો માટે સંખ્યાત્મક બિંદુઓ દાખલ કરો.",
    mustHaveOneOption: "દરેક સમસ્યામાં ઓછામાં ઓછો એક વિકલ્પ હોવો આવશ્યક છે.",
    fillMissingOptions: "ખાલી વિકલ્પો ભરો.",
    eachOptionOneCorrect: "દરેક સમસ્યાના ઓછામાં ઓછા એક સાચા જવાબ હોવા જોઈએ.",
    noStudentSelected: "કોઈ વિદ્યાર્થી select કરાયો નથી!",
    selectWhoToShare: "કોની સાથે શેર કરવું તે પસંદ કરો. બધા સભ્યો પસંદ કરવા માટે ચેનલ ફરીથી પસંદ કરો.",
    clearQuestion: "Clear?",
    cannotUndo: "આ ક્રિયા પૂર્વવત્ કરી શકાતી નથી.",
    enterContent: 'સામગ્રી દાખલ કરો.',
    enterTitle: 'શીર્ષક દાખલ કરો.',
    unableToLoadDiscussion: "વિચાર વિમર્શ લોડ કરી શકાઈ નથી",
    unableToLoadSubscribers: "સબ્સ્ક્રાઇબર્સ લોડ કરી શક્યાં નથી",
    meetingMustBeFuture: 'બેઠક ભવિષ્યમાં હોવી જ જોઇએ',
    unableToPost: "પોસ્ટ કરી શક્યા નથી",
    passwordUpdated: "પાસવર્ડ અપડેટ થયો!",
    incorrectCurrentPassword: "વર્તમાન પાસવર્ડ માટે ખોટું મૂલ્ય.",
    passwordDoesNotMatch: "પાસવર્ડ મેળ ખાતો નથી",
    profileUpdated: "પ્રોફાઇલ અપડેટ થઈ",
    usersAdded: "વપરાશકર્તાઓ ઉમેર્યું!",
    userRemoved: "વપરાશકર્તા દૂર કર્યું",
    alreadyUnsubscribed: "પહેલેથી અનસબ્સ્ક્રાઇબ કર્યું.",
    emailInviteSent: "ઇમેઇલ આમંત્રણ મોકલ્યું.",
    unableToLoadMessages: "સંદેશા લોડ કરવામાં અસમર્થ.",
    userSubscriptionActivated: "વપરાશકર્તા સબ્સ્ક્રિપ્શન સક્રિય કર્યું!",
    userSubscriptionInactivated: "વપરાશકર્તા સબ્સ્ક્રિપ્શન નિષ્ક્રિય!",
    makeActive: 'સક્રિય કરો',
    makeInactive: 'નિષ્ક્રિય કરો',
    unableToLoadThread: "વાતચીત લોડ કરવામાં અસમર્થ.",
    unableToLoadComments: "ટિપ્પણી લોડ કરવામાં અસમર્થs",
    unableToStartQuiz: 'ક્વિઝ શરૂ કરવામાં અસમર્થ!',
    deadlineHasPassed: 'સમયમર્યાદા પસાર થઈ ગઈ.',
    cueDeleted: 'Cue કાળી નાખ્યું',
    submissionFailed: 'સબમિશન નિષ્ફળ.',
    submissionComplete: 'સબમિશન પૂર્ણ',
    ifYouStartTimedQuiz: 'જો તમે સમયસર ક્વિઝ શરૂ કરો છો, તો તમારું છેલ્લું રેકોર્ડ કરેલું સંપાદન રેકોર્ડ કરવામાં આવશે.',
    tryAgainLater: 'પછીથી ફરી પ્રયાસ કરો.',
    sharedAlert: 'મોકલ્યો!',
    enterValidEmail: 'યોગ્ય ઇમેલ એડ્રેસ આપો',
    eraseContentLeaveChannel: "सामग्री मिटाएँ और चैनल छोड़ दें?",
    thisActionWillIrreversibly: "यह कार्रवाई अपरिवर्तनीय रूप से साझा सामग्री, संचार और किसी भी नोट को सीधे अंदर ले जाएगी ",
    eraseContentAndUnsubscrbe: 'सामग्री मिटाएं और सदस्यता समाप्त करें',
    weHaveEmailedPassword: 'हमने आपको एक नया पासवर्ड ईमेल किया है!',
    invalidCredentials: "अवैध प्रत्यय पत्र। सुनिश्चित करें कि ईमेल सही है।",
    unableToRefreshCues: "નવું Cues ડાઉનલોડ કરી શક્યાં નથી",
    leaveChannel: "ચેનલ છોડો",
    areYouSureUnsubscribe: "શું તમે ખરેખર આમાંથી અનસબ્સ્ક્રાઇબ કરવા માંગો છો? ",
    keepContentAndUnsubscribe: "સામગ્રી રાખો અને અનસબ્સ્ક્રાઇબ કરો",
    clickPlusAndSelect: 'Cue બનાવવા માટે + ક્લિક કરો અને આ ચેનલને પસંદ કરો.',
}

export const LanguageContext = React.createContext<{[label: string]: any}>({});

export const LanguageProvider: React.FC<React.ReactNode> = ({ children }) => {

    // BY DEFAULT ENGLISH
    const [language, setLanguage] = useState('en');

    const retrieveSavedLang = async () => {
        const storedLang: string = await AsyncStorage.getItem('preferred_lang') || "en";
        console.log(storedLang);
        setLanguage(storedLang);
        return;
    };

    useEffect(() => {
        retrieveSavedLang()
    }, [])

    console.log(language);
    return (<LanguageContext.Provider value={{
        language,
        changeLanguage: async (lang: string) => {
            setLanguage(lang);
            await AsyncStorage.setItem('preferred_lang', lang);
        }
    }}>
        {children}
    </LanguageContext.Provider>)
}

export function PreferredLanguageText(textKey: string) {   
    const { language } = React.useContext(LanguageContext);

    switch (language) {
        case 'en':
            return EnglishBank[textKey] || "";
        case 'hin':
            return HindiBank[textKey] || "";
        case 'guj':
            return GujaratiBank[textKey] || "";
        default: 
            return "";
    }
}

export function LanguageSelect() {

    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const colorScheme = useColorScheme();
    const color = colorScheme === 'light' ? '#202025' : '#fff'

    return <LanguageContext.Consumer>
      {context => {

          const { language } = context;
          

        //   const selectedLanguage = languageOptions.filter(lang => lang.value === language)[0];

        return (!showLanguageDropdown ?
             <Ionicons name='language-outline' size={30} color={'202025'} style={{ marginRight:5 }} onPress={() => setShowLanguageDropdown(true)}/> 
             : (<DefaultView style={{
            backgroundColor: 'white',
            width: "100%"
        }}>
            <DefaultText style={styles.text}>
                Language Preference
            </DefaultText>
            <Picker
                style={styles.picker}
                itemStyle={{
                    fontSize: 17
                }}
                selectedValue={language}
                onValueChange={(lang: any) =>
                   { context.changeLanguage(lang)
                    setShowLanguageDropdown(false)}
                }>
                {
                    languageOptions.map((item: any, index: number) => {
                        return <Picker.Item
                            color={language === item.value ? '#3B64F8' : "#202025"}
                            label={item.label}
                            value={item.value}
                            key={index}
                        />
                    })
                }
            </Picker>
        </DefaultView>)

        // return (<DefaultView 
        //     // style={{ display: "flex", backgroundColor: 'white', alignItems: "center", }}
        // >
        //     {showLanguageDropdown ? <DefaultView style={styles.languageSelectContainer}>
        //         <Picker
        //             selectedValue={language}
        //             style={{ height: 28,  borderRadius: 10,
        //                 // border: "1px solid #A2A2AA",
        //                 fontSize: 12,
        //                 flex: 1
        //              }}
        //             onValueChange={(itemValue, itemIndex) => context.changeLanguage(itemValue)}
        //         >
        //             {
        //                 languageOptions.map(lang => (<Picker.Item label={lang.label} value={lang.value} />))
        //             }
        //         </Picker>
        //         <Ionicons
        //             name='close-outline'
        //             style={{ display: 'flex', alignItems: 'center', paddingLeft: 10}}
        //             onPress={() => {
        //                 setShowLanguageDropdown(false)
        //             }}
        //         />
        //     </DefaultView>
        //     : 
        //     (
        //         <Ionicons name='language-outline' size={30} color={color} style={{ marginRight:5 }} onPress={() => setShowLanguageDropdown(true)}/>
        //     )}
        // </DefaultView>
        )
      }}
    </LanguageContext.Consumer>
}


export default LanguageContext;

const styles = StyleSheet.create({
    languageSelectContainer: {
        width: 140,
        height: 40,
        // display: "flex",
        // justifyContent: "center",
        // alignContent: 'center',
        // flexDirection: "row", 
    },  
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        width: 100,
        height: 200,
        alignSelf: 'center',
        marginTop: 0,
        borderRadius: 3
    },
    text: {
        fontSize: 12,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10
    },

})