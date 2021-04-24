import { gql } from '@apollo/client';
/**
 * ALL
 * MUTATIONS
 */
export const createUser = gql`
mutation($fullName: String!, $notificationId: String!, $displayName: String!) {
    user {
        create(fullName: $fullName, displayName: $displayName, notificationId: $notificationId) {
            _id
            fullName
            displayName
            notificationId
        }
    }
}
`
export const createChannel = gql`
mutation($name: String!, $password: String, $createdBy: String!) {
    channel {
        create(name: $name, password: $password, createdBy: $createdBy)
    }
}
`
export const createCue = gql`
mutation($cue: String!, $color: String!, $createdBy: String!, $shuffle: Boolean!, $starred: Boolean!, $channelId: String!, $frequency: String!, $submission: Boolean!, $gradeWeight: String!, $endPlayAt: String, $customCategory: String, $deadline: String, $shareWithUserIds: [String!]) {
    cue {
        create(cue: $cue, color: $color, createdBy: $createdBy, shuffle: $shuffle, starred: $starred, channelId: $channelId, frequency: $frequency, submission: $submission, gradeWeight: $gradeWeight, endPlayAt: $endPlayAt, customCategory: $customCategory, deadline: $deadline, shareWithUserIds: $shareWithUserIds)
    }
}
`
export const markAsRead = gql`
mutation($userId: String!, $cueId: String!) {
    status {
        markAsRead(userId: $userId,cueId: $cueId)
    }
}
`
export const subscribe = gql`
mutation($name: String!, $userId: String!, $password: String) {
    subscription {
        subscribe(name: $name, userId: $userId, password: $password)
    }
}
`
export const createMessage = gql`
mutation($message: String!, $userId: String!, $channelId: String!, $isPrivate: Boolean!, $anonymous: Boolean!, $parentId: String!, $cueId: String!, $category: String) {
    thread {
        writeMessage(message: $message, userId: $userId, channelId: $channelId, isPrivate: $isPrivate, anonymous: $anonymous, parentId: $parentId, cueId: $cueId, category: $category)
    }
}
`
export const updateUser = gql`
mutation($userId: String!, $displayName: String!, $fullName: String!) {
    user {
        update(userId: $userId, displayName: $displayName, fullName: $fullName)
    }
}
`
export const unsubscribe = gql`
mutation($userId: String!, $channelId: String!, $keepContent: Boolean!) {
    subscription {
        unsubscribe(userId: $userId, channelId: $channelId, keepContent: $keepContent) 
    }
}
`
export const convertToHtml = gql`
mutation($docx: String!) {
    cue {
        convertDocxToHtml(docx: $docx)
    }
}
`
export const signup = gql`
mutation($email: String!, $userId: String!, $password: String!, $fullName: String!, $displayName: String!) {
    user {
        signup(email: $email, userId: $userId, password: $password, fullName: $fullName, displayName: $displayName) 
    }
}
`
export const saveCuesToCloud = gql`
mutation($userId: String!, $cues: [CueInputObject!]!) {
    cue {
        saveCuesToCloud(userId: $userId, cues: $cues) {
            newId
            oldId
        }
    }
}
`
export const saveConfigToCloud = gql`
mutation($userId: String!, $randomShuffleFrequency: String!, $sleepFrom: String!, $sleepTo: String!, $currentDraft: String) {
    user {
        saveConfigToCloud(userId: $userId, randomShuffleFrequency: $randomShuffleFrequency, sleepTo: $sleepTo, sleepFrom: $sleepFrom, currentDraft: $currentDraft)
    }
}
`
export const submit = gql`
mutation($cueId: String!, $userId: String!, $cue: String!, $quizId: String) {
    cue {
        submitModification(cueId: $cueId, userId: $userId, cue: $cue, quizId: $quizId)
    }
}
`
export const submitGrade = gql`
mutation ($cueId: String!, $userId: String!, $score: String!, $comment: String) {
    cue {
        submitGrade(cueId: $cueId, userId: $userId, score: $score, comment: $comment)
    }
}
`
export const sendDirectMessage = gql`
mutation($users: [String!]!, $message: String!, $channelId: String!) {
    message {
        create(users: $users, message: $message, channelId: $channelId)
    }
}
`
export const inviteByEmail = gql`
mutation($emails: [String!]!, $channelId: String!) {
    user {
        inviteByEmail(emails: $emails, channelId: $channelId)
    }
}
`
export const markThreadsAsRead = gql`
mutation($userId: String!, $threadId: String!) {
    threadStatus {
        markThreadsAsRead(userId: $userId, threadId: $threadId)
    }
}
`
export const markMessagesAsRead = gql`
mutation($userId: String!, $groupId: String!) {
    messageStatus {
        markMessagesAsRead(userId: $userId, groupId: $groupId)
    }
}
`
export const createDate = gql`
mutation($title: String!, $userId: String!, $start: String!, $end: String!) {
    date {
        create(title: $title, start: $start, end: $end, userId: $userId)
    }
}
`
export const editMeeting = gql`
mutation($channelId: String!, $meetingOn: Boolean!) {
    channel {
        editMeeting(channelId: $channelId, meetingOn: $meetingOn)
    }
}
`
export const shareCueWithMoreIds = gql`
mutation($userId: String!, $cueId: String!) {
    cue {
        shareCueWithMoreIds(userId: $userId, cueId: $cueId)
    }
}
`
export const deleteDate = gql`
mutation($dateId: String!) {
    date {
        delete(dateId: $dateId)
    }
}
`
export const deleteForEveryone = gql`
mutation($cueId: String!) {
    cue {
        deleteForEveryone(cueId: $cueId)
    }
}
`
export const createScheduledMeeting = gql`
mutation($channelId: String!, $start: String!, $end: String!) {
    attendance {
        create(channelId: $channelId, start: $start, end: $end)
    }
}
`
export const markAttendance = gql`
mutation($channelId: String!, $userId: String!) {
    attendance {
        markAttendance(channelId: $channelId, userId: $userId)
    }
}
`
export const createQuiz = gql`
mutation($quiz: QuizInputObject!) {
    quiz {
        createQuiz(quiz: $quiz)
    }
}
`
export const makeSubActive = gql`
mutation($userId: String!, $channelId: String!) {
    subscription {
        makeActive(userId: $userId, channelId: $channelId)
    }
}
`
export const makeSubInactive = gql`
mutation($userId: String!, $channelId: String!) {
    subscription {
        makeInactive(userId: $userId, channelId: $channelId)
    }
}
`
export const start = gql`
mutation($userId: String!, $cueId: String!, $cue: String!) {
    quiz {
        start(userId: $userId, cueId: $cueId, cue: $cue)
    }
}
`
export const deleteThread = gql`
mutation($threadId: String!) {
    thread {
        delete(threadId: $threadId) 
    }
}
`
export const updatePassword = gql`
mutation($userId: String!, $currentPassword: String!, $newPassword: String!) {
    user {
        updatePassword(userId: $userId, currentPassword: $currentPassword, newPassword: $newPassword)
    } 
}
`
export const resetPassword = gql`
mutation($email: String!) {
    user {
        resetPassword(email: $email)
    }
}
`
export const updateNotificationId = gql`
mutation($notificationId: String!, $userId: String!) {
    user {
        updateNotificationId(userId: $userId, notificationId: $notificationId) 
    }
}
`
/**
 * ALL
 * QUERIES
 */
export const findUserById = gql`
query($id: String!) {
    user {
        findById(id: $id) {
            _id
            fullName
            displayName
            notificationId
            randomShuffleFrequency
            sleepFrom
            sleepTo
            email
            currentDraft
        }
    }
}
`
export const getChannels = gql`
query($userId: String!) {
    channel {
        findByUserId(userId: $userId) {
            _id
            name
        }
    }
}
`
export const getCues = gql`
query($userId: String!) {
    cue {
        findByUserId(userId: $userId) {
            _id
            cue
            color
            channelId
            customCategory
            frequency
            date
            unreadThreads
            endPlayAt
            channelName
            starred
            createdBy
            shuffle
            original
            submission
            deadline
            gradeWeight
            graded
            score
            comment
            status
            submittedAt
        }
    }
}
`
export const getSubscriptions = gql`
query($userId: String!) {
    subscription {
        findByUserId(userId: $userId) {
            _id
            channelName
            channelId
            channelCreatedBy
            inactive
        }
    }
}
`
export const checkChannelStatus = gql`
query($name: String!) {
    channel {
        getChannelStatus(name: $name)
    }
}
`
export const getChannelThreads = gql`
query($channelId: String!) {
    thread {
        findByChannelId(channelId: $channelId) {
            _id
            message
            channelId
            cueId
            unreadThreads
            parentId
            category
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getCueThreads = gql`
query($cueId: String!) {
    thread {
        findByCueId(cueId: $cueId) {
            _id
            message
            channelId
            cueId
            parentId
            category
            unreadThreads
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getThreadWithReplies = gql`
query($threadId: String!) {
    thread {
        getThreadWithReplies(threadId: $threadId) {
            _id
            message
            channelId
            cueId
            parentId
            category
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getThreadCategories = gql`
query($channelId: String!) {
    thread {
        getChannelThreadCategories(channelId: $channelId) 
    }
}
`
export const getChannelCategories = gql`
query($channelId: String!) {
    channel {
        getChannelCategories(channelId: $channelId) 
    }
}
`
export const getSubscribers = gql`
query($channelId: String!) {
    user {
        findByChannelId(channelId: $channelId) {
            _id
            displayName
            fullName
            unreadMessages
            groupId
        }
    }
}
`
export const getStatuses = gql`
query($cueId: String!) {
    status {
        findByCueId(cueId: $cueId) {
            displayName
            userId
            status
            fullName
            email
            submission
            score
            graded
            comment
        }
    }
}
`
export const login = gql`
query($email: String!, $password: String!) {
    user {
        login(email: $email, password: $password) {
            _id
        } 
    }
}
`
export const getCuesFromCloud = gql`
query($userId: String!) {
    cue {
        getCuesFromCloud(userId: $userId) {
            _id
            cue
            color
            channelId
            customCategory
            unreadThreads
            frequency
            date
            endPlayAt
            channelName
            starred
            createdBy
            shuffle
            original
            submission
            deadline
            gradeWeight
            score
            graded
            comment
            status
            submittedAt
        }
    }
}
`
export const getGrades = gql`
query($channelId: String!) {
    channel {
        getSubmissionCues(channelId: $channelId) {
            _id
            cue
            gradeWeight
        }
    }
}
`
export const getGradesList = gql`
query($channelId: String!) {
    channel {
        getGrades(channelId: $channelId) {
            userId
            displayName
            fullName
            email
            scores {
                cueId
                score
                gradeWeight
                graded
            }
        }
    }
}
`
export const getMessages = gql`
query($users: [String!]!) {
    message {
        getMessagesThread(users: $users) {
            groupId
            sentBy
            message
            displayName
            sentAt
        }
    }
}
`
export const getEvents = gql`
query($userId: String!) {
    date {
        getCalendar(userId: $userId) {
            dateId
            title
            start
            end
            channelName
        }
    }
}
`
export const totalUnreadDiscussionThreads = gql`
query($userId: String!, $channelId: String!) {
   threadStatus {
        totalUnreadDiscussionThreads(userId: $userId, channelId: $channelId)
   } 
}
`
export const totalUnreadMessages = gql`
query($userId: String!, $channelId: String!) {
   messageStatus {
        totalUnreadMessages(userId: $userId, channelId: $channelId)
   } 
}
`
export const getMeetingStatus = gql`
query($channelId: String!) {
    channel { 
        getMeetingStatus(channelId: $channelId)
    }
}
`
export const getSharedWith = gql`
query($cueId: String, $channelId: String!) {
    cue {
        getSharedWith(cueId: $cueId, channelId: $channelId) {
            value
            label
            isFixed
        }
    }
}
`
export const getGroups = gql`
query($userId: String!, $channelId: String!) {
    group {
        getGroups(userId: $userId, channelId: $channelId) {
            _id
            users
            unreadMessages
            userNames {
                displayName
            }
        }
    }
}
`
export const getUpcomingDates = gql`
query($channelId: String!) {
    attendance {
        getUpcomingDates(channelId: $channelId) {
            start
            end
        }
    }
}
`
export const getPastDates = gql`
query($channelId: String!) {
    attendance {
        getPastDates(channelId: $channelId) {
            start
            end
            dateId
        }
    }
}
`
export const getAttendances = gql`
query($dateId: String!) {
    attendance {
        getAttendances(dateId: $dateId) {
            displayName
            joinedAt
        }
    }
}
`
export const getQuiz = gql`
query($quizId: String!) {
    quiz {
        getQuiz(quizId: $quizId) {
            duration
            problems {
                question
                points
                options {
                    option
                    isCorrect
                }
            }
        }
    }
}
`
export const isSubInactive = gql`
query($userId: String!, $channelId: String!) {
    subscription {
        isSubInactive(userId: $userId, channelId: $channelId)
    }
}
`