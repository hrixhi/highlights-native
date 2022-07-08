import { gql } from '@apollo/client';
/**
 * ALL
 * MUTATIONS
 */
export const createUser = gql`
    mutation ($fullName: String!, $notificationId: String!, $displayName: String!) {
        user {
            create(fullName: $fullName, displayName: $displayName, notificationId: $notificationId) {
                _id
                fullName
                displayName
                notificationId
            }
        }
    }
`;
export const createChannel = gql`
    mutation (
        $name: String!
        $password: String
        $createdBy: String!
        $temporary: Boolean
        $colorCode: String
        $description: String
        $tags: [String!]
        $isPublic: Boolean
        $subscribers: [String!]
        $moderators: [String!]
    ) {
        channel {
            create(
                name: $name
                password: $password
                createdBy: $createdBy
                temporary: $temporary
                colorCode: $colorCode
                description: $description
                tags: $tags
                isPublic: $isPublic
                subscribers: $subscribers
                moderators: $moderators
            )
        }
    }
`;
export const duplicateChannel = gql`
    mutation (
        $channelId: String!
        $name: String!
        $password: String
        $temporary: Boolean
        $colorCode: String
        $duplicateSubscribers: Boolean
        $duplicateOwners: Boolean
    ) {
        channel {
            duplicate(
                channelId: $channelId
                name: $name
                password: $password
                temporary: $temporary
                colorCode: $colorCode
                duplicateSubscribers: $duplicateSubscribers
                duplicateOwners: $duplicateOwners
            )
        }
    }
`;
export const duplicateQuiz = gql`
    mutation ($quizId: String!) {
        cue {
            duplicateQuiz(quizId: $quizId)
        }
    }
`;

export const createCue = gql`
    mutation (
        $cue: String!
        $color: String!
        $createdBy: String!
        $shuffle: Boolean!
        $starred: Boolean!
        $channelId: String!
        $frequency: String!
        $submission: Boolean!
        $gradeWeight: String!
        $endPlayAt: String
        $customCategory: String
        $deadline: String
        $initiateAt: String
        $shareWithUserIds: [String!]
        $limitedShares: Boolean
        $allowedAttempts: String
        $availableUntil: String
        $totalPoints: String
    ) {
        cue {
            create(
                cue: $cue
                color: $color
                createdBy: $createdBy
                shuffle: $shuffle
                starred: $starred
                channelId: $channelId
                frequency: $frequency
                submission: $submission
                gradeWeight: $gradeWeight
                endPlayAt: $endPlayAt
                customCategory: $customCategory
                deadline: $deadline
                initiateAt: $initiateAt
                shareWithUserIds: $shareWithUserIds
                limitedShares: $limitedShares
                allowedAttempts: $allowedAttempts
                availableUntil: $availableUntil
                totalPoints: $totalPoints
            )
        }
    }
`;
export const markAsRead = gql`
    mutation ($userId: String!, $cueId: String!) {
        status {
            markAsRead(userId: $userId, cueId: $cueId)
        }
    }
`;
export const subscribe = gql`
    mutation ($channelId: String!, $userId: String!, $password: String) {
        subscription {
            subscribe(channelId: $channelId, userId: $userId, password: $password)
        }
    }
`;
export const createMessage = gql`
    mutation (
        $message: String!
        $userId: String!
        $channelId: String!
        $isPrivate: Boolean!
        $anonymous: Boolean!
        $parentId: String!
        $cueId: String!
        $category: String
        $title: String
    ) {
        thread {
            writeMessage(
                message: $message
                userId: $userId
                channelId: $channelId
                isPrivate: $isPrivate
                anonymous: $anonymous
                parentId: $parentId
                cueId: $cueId
                category: $category
                title: $title
            )
        }
    }
`;
export const updateUser = gql`
    mutation ($userId: String!, $displayName: String!, $fullName: String!, $avatar: String) {
        user {
            update(userId: $userId, displayName: $displayName, fullName: $fullName, avatar: $avatar)
        }
    }
`;
export const unsubscribe = gql`
    mutation ($userId: String!, $channelId: String!, $keepContent: Boolean!) {
        subscription {
            unsubscribe(userId: $userId, channelId: $channelId, keepContent: $keepContent)
        }
    }
`;
export const convertToHtml = gql`
    mutation ($docx: String!) {
        cue {
            convertDocxToHtml(docx: $docx)
        }
    }
`;
export const signup = gql`
    mutation ($email: String!, $fullName: String!, $provider: String!, $password: String, $avatar: String) {
        user {
            signup(email: $email, fullName: $fullName, provider: $provider, password: $password, avatar: $avatar)
        }
    }
`;

export const authWithProvider = gql`
    mutation ($email: String!, $fullName: String!, $provider: String!, $avatar: String) {
        user {
            authWithProvider(email: $email, fullName: $fullName, provider: $provider, avatar: $avatar) {
                user {
                    _id
                }
                error
                token
            }
        }
    }
`;
export const saveSubmissionDraft = gql`
    mutation ($userId: String!, $cueId: String!, $cue: String!) {
        cue {
            saveSubmissionDraft(userId: $userId, cueId: $cueId, cue: $cue)
        }
    }
`;
export const saveCuesToCloud = gql`
    mutation ($userId: String!, $cues: [CueInputObject!]!) {
        cue {
            saveCuesToCloud(userId: $userId, cues: $cues) {
                newId
                oldId
            }
        }
    }
`;

export const submit = gql`
    mutation ($cueId: String!, $userId: String!, $cue: String!, $quizId: String) {
        cue {
            submitModification(cueId: $cueId, userId: $userId, cue: $cue, quizId: $quizId)
        }
    }
`;
export const submitGrade = gql`
    mutation ($cueId: String!, $userId: String!, $pointsScored: String!, $comment: String) {
        cue {
            submitGrade(cueId: $cueId, userId: $userId, pointsScored: $pointsScored, comment: $comment)
        }
    }
`;
export const sendDirectMessage = gql`
    mutation ($users: [String!]!, $message: String!, $channelId: String!, $userId: String!) {
        message {
            create(users: $users, message: $message, channelId: $channelId, userId: $userId)
        }
    }
`;
export const sendMessage = gql`
    mutation (
        $users: [String!]!
        $message: String!
        $channelId: String
        $userId: String!
        $groupId: String
        $groupName: String
        $groupImage: String
    ) {
        message {
            createDirect(
                users: $users
                message: $message
                channelId: $channelId
                userId: $userId
                groupId: $groupId
                groupName: $groupName
                groupImage: $groupImage
            )
        }
    }
`;
export const inviteByEmail = gql`
    mutation ($emails: [String!]!, $channelId: String!) {
        user {
            inviteByEmail(emails: $emails, channelId: $channelId)
        }
    }
`;
export const markThreadsAsRead = gql`
    mutation ($userId: String!, $threadId: String!) {
        threadStatus {
            markThreadsAsRead(userId: $userId, threadId: $threadId)
        }
    }
`;
export const markMessagesAsRead = gql`
    mutation ($userId: String!, $groupId: String!) {
        messageStatus {
            markMessagesAsRead(userId: $userId, groupId: $groupId)
        }
    }
`;

export const createDateV1 = gql`
    mutation (
        $title: String!
        $userId: String!
        $start: String!
        $end: String!
        $channelId: String
        $meeting: Boolean
        $description: String
        $recordMeeting: Boolean
        $frequency: String
        $repeatTill: String
        $repeatDays: [String!]
    ) {
        date {
            createV1(
                title: $title
                userId: $userId
                start: $start
                end: $end
                channelId: $channelId
                meeting: $meeting
                description: $description
                recordMeeting: $recordMeeting
                frequency: $frequency
                repeatTill: $repeatTill
                repeatDays: $repeatDays
            )
        }
    }
`;

export const editDateV1 = gql`
    mutation (
        $id: String!
        $title: String!
        $start: String!
        $end: String!
        $description: String
        $recordMeeting: Boolean
    ) {
        date {
            editV1(
                id: $id
                title: $title
                start: $start
                end: $end
                description: $description
                recordMeeting: $recordMeeting
            )
        }
    }
`;

export const deleteDateV1 = gql`
    mutation ($id: String!, $deleteAll: Boolean!) {
        date {
            deleteV1(id: $id, deleteAll: $deleteAll)
        }
    }
`;

export const editMeeting = gql`
    mutation ($channelId: String!, $meetingOn: Boolean!) {
        channel {
            editMeeting(channelId: $channelId, meetingOn: $meetingOn)
        }
    }
`;
export const shareCueWithMoreIds = gql`
    mutation ($userIds: [String!]!, $cueId: String!) {
        cue {
            shareCueWithMoreIds(userIds: $userIds, cueId: $cueId)
        }
    }
`;
export const unshareCueWithIds = gql`
    mutation ($userIds: [String!]!, $cueId: String!) {
        cue {
            unshareCueWithIds(userIds: $userIds, cueId: $cueId)
        }
    }
`;
export const deleteForEveryone = gql`
    mutation ($cueId: String!) {
        cue {
            deleteForEveryone(cueId: $cueId)
        }
    }
`;
export const createScheduledMeeting = gql`
    mutation ($channelId: String!, $start: String!, $end: String!) {
        attendance {
            create(channelId: $channelId, start: $start, end: $end)
        }
    }
`;
export const markAttendance = gql`
    mutation ($channelId: String!, $userId: String!) {
        attendance {
            markAttendance(channelId: $channelId, userId: $userId)
        }
    }
`;
export const modifyAttendance = gql`
    mutation ($dateId: String!, $userId: String!, $channelId: String!, $markPresent: Boolean!) {
        attendance {
            modifyAttendance(dateId: $dateId, userId: $userId, channelId: $channelId, markPresent: $markPresent)
        }
    }
`;
export const createQuiz = gql`
    mutation ($quiz: QuizInputObject!) {
        quiz {
            createQuiz(quiz: $quiz)
        }
    }
`;
export const modifyQuiz = gql`
    mutation (
        $cueId: String!
        $quiz: QuizInputObject!
        $modifiedCorrectAnswers: [String!]!
        $regradeChoices: [String!]!
    ) {
        quiz {
            modifyQuiz(
                cueId: $cueId
                quiz: $quiz
                modifiedCorrectAnswers: $modifiedCorrectAnswers
                regradeChoices: $regradeChoices
            )
        }
    }
`;

// export const makeSubActive = gql`
//   mutation($userId: String!, $channelId: String!) {
//     subscription {
//       makeActive(userId: $userId, channelId: $channelId)
//     }
//   }
// `;
// export const makeSubInactive = gql`
//   mutation($userId: String!, $channelId: String!) {
//     subscription {
//       makeInactive(userId: $userId, channelId: $channelId)
//     }
//   }
// `;
export const startQuiz = gql`
    mutation ($userId: String!, $cueId: String!) {
        quiz {
            start(userId: $userId, cueId: $cueId)
        }
    }
`;
export const deleteThread = gql`
    mutation ($threadId: String!) {
        thread {
            delete(threadId: $threadId)
        }
    }
`;
export const updatePassword = gql`
    mutation ($userId: String!, $currentPassword: String!, $newPassword: String!) {
        user {
            updatePassword(userId: $userId, currentPassword: $currentPassword, newPassword: $newPassword)
        }
    }
`;
export const resetPassword = gql`
    mutation ($email: String!) {
        user {
            resetPassword(email: $email)
        }
    }
`;
export const updateNotificationId = gql`
    mutation ($notificationId: String!, $userId: String!) {
        user {
            updateNotificationId(userId: $userId, notificationId: $notificationId)
        }
    }
`;
export const deleteCue = gql`
    mutation ($cueId: String!) {
        cue {
            delete(cueId: $cueId)
        }
    }
`;
export const updateChannel = gql`
    mutation (
        $channelId: String!
        $password: String
        $name: String!
        $temporary: Boolean
        $owners: [String!]!
        $colorCode: String
        $meetingUrl: String
    ) {
        channel {
            update(
                channelId: $channelId
                password: $password
                name: $name
                temporary: $temporary
                owners: $owners
                colorCode: $colorCode
                meetingUrl: $meetingUrl
            )
        }
    }
`;
// export const editPersonalMeeting = gql`
// mutation($channelId: String!, $meetingOn: Boolean!, $users: [String!]!) {
//   channel {
//     editPersonalMeeting(channelId: $channelId, meetingOn: $meetingOn, users: $users)
//   }
// }
// `
export const editReleaseSubmission = gql`
    mutation ($cueId: String!, $releaseSubmission: Boolean!) {
        cue {
            editReleaseSubmission(cueId: $cueId, releaseSubmission: $releaseSubmission)
        }
    }
`;

export const deleteRecording = gql`
    mutation ($recordID: String!) {
        channel {
            deleteRecording(recordID: $recordID)
        }
    }
`;
export const meetingRequest = gql`
    mutation ($userId: String!, $isOwner: Boolean!, $channelId: String!) {
        channel {
            meetingRequest(userId: $userId, isOwner: $isOwner, channelId: $channelId)
        }
    }
`;
// export const personalMeetingRequest = gql`
// mutation($userId: String!, $users: [String!]!, $channelId: String!) {
//   channel {
//     personalMeetingRequest(userId: $userId, users: $users, channelId: $channelId)
//   }
// }
// `
export const creatFolder = gql`
    mutation ($title: String!, $cueIds: [String!]!) {
        folder {
            create(title: $title, cueIds: $cueIds)
        }
    }
`;
export const updateFolder = gql`
    mutation ($title: String!, $cueIds: [String!]!, $folderId: String!) {
        folder {
            update(title: $title, cueIds: $cueIds, folderId: $folderId)
        }
    }
`;

export const addToFolder = gql`
    mutation ($cueId: String!, $folderId: String!) {
        folder {
            addToFolder(cueId: $cueId, folderId: $folderId)
        }
    }
`;

export const removeFromFolder = gql`
    mutation ($cueId: String!, $folderId: String!) {
        folder {
            removeFromFolder(cueId: $cueId, folderId: $folderId)
        }
    }
`;

export const deleteFolder = gql`
    mutation ($folderId: String!) {
        folder {
            delete(folderId: $folderId)
        }
    }
`;

export const markActivityAsRead = gql`
    mutation ($activityId: String, $userId: String!, $markAllRead: Boolean!) {
        activity {
            markActivityAsRead(activityId: $activityId, userId: $userId, markAllRead: $markAllRead)
        }
    }
`;

export const updateAnnotation = gql`
    mutation ($cueId: String!, $userId: String!, $attempts: String!) {
        cue {
            updateAnnotation(cueId: $cueId, userId: $userId, attempts: $attempts)
        }
    }
`;
export const connectZoom = gql`
    mutation ($userId: String!, $code: String!) {
        user {
            connectZoom(code: $code, userId: $userId) {
                accountId
                email
            }
        }
    }
`;

export const updateGroup = gql`
    mutation ($groupId: String!, $users: [String!]!, $groupName: String!, $groupImage: String) {
        message {
            updateGroup(groupId: $groupId, users: $users, groupName: $groupName, groupImage: $groupImage)
        }
    }
`;
export const startInstantMeeting = gql`
    mutation (
        $channelId: String!
        $userId: String!
        $title: String!
        $description: String!
        $start: String!
        $end: String!
        $notifyUsers: Boolean!
    ) {
        channel {
            startInstantMeeting(
                channelId: $channelId
                userId: $userId
                title: $title
                description: $description
                start: $start
                end: $end
                notifyUsers: $notifyUsers
            )
        }
    }
`;
export const startInstantMeetingInbox = gql`
    mutation ($userId: String!, $start: String!, $end: String!, $users: [String!]!, $groupId: String, $topic: String) {
        message {
            startInstantMeetingInbox(
                userId: $userId
                start: $start
                end: $end
                users: $users
                topic: $topic
                groupId: $groupId
            )
        }
    }
`;
export const removeZoom = gql`
    mutation ($userId: String!) {
        user {
            removeZoom(userId: $userId)
        }
    }
`;

export const updateAnnotationsFromViewer = gql`
    mutation ($userId: String!, $cueId: String!, $annotations: String!, $source: String!) {
        user {
            updateAnnotationsFromViewer(userId: $userId, cueId: $cueId, annotations: $annotations, source: $source)
        }
    }
`;
export const addUsersByEmail = gql`
    mutation ($channelId: String!, $userId: String!, $emails: [String!]!) {
        channel {
            addUsersByEmail(channelId: $channelId, userId: $userId, emails: $emails) {
                success
                failed
                error
            }
        }
    }
`;
/**
 * ALL
 * QUERIES
 */
export const findUserById = gql`
    query ($id: String!) {
        user {
            findById(id: $id) {
                _id
                fullName
                avatar
                displayName
                zoomInfo {
                    accountId
                }
                notificationId
                randomShuffleFrequency
                sleepFrom
                sleepTo
                email
                currentDraft
                role
                allowQuizCreation
                userCreatedOrg
            }
        }
    }
`;
export const getChannels = gql`
    query ($userId: String!) {
        channel {
            findByUserId(userId: $userId) {
                _id
                name
                colorCode
            }
        }
    }
`;
export const getCues = gql`
    query ($userId: String!) {
        cue {
            findByUserId(userId: $userId) {
                _id
                cue
                color
                channelId
                folderId
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
                initiateAt
                gradeWeight
                graded
                score
                comment
                status
                submittedAt
                releaseSubmission
                active
                limitedShares
                allowedAttempts
                availableUntil
                totalPoints
            }
        }
    }
`;
export const getSubscriptions = gql`
    query ($userId: String!) {
        subscription {
            findByUserId(userId: $userId) {
                _id
                channelName
                channelId
                channelCreatedBy
                inactive
                colorCode
            }
        }
    }
`;
export const checkChannelStatus = gql`
    query ($channelId: String!) {
        channel {
            getChannelStatus(channelId: $channelId)
        }
    }
`;
export const checkChannelStatusForCode = gql`
    query ($accessCode: String!) {
        channel {
            getChannelStatusForCode(accessCode: $accessCode)
        }
    }
`;
export const getChannelThreads = gql`
    query ($channelId: String!) {
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
                fullName
                avatar
                isPrivate
                anonymous
                title
            }
        }
    }
`;
export const getCueThreads = gql`
    query ($cueId: String!) {
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
                fullName
                avatar
                isPrivate
                anonymous
            }
        }
    }
`;
export const getThreadWithReplies = gql`
    query ($threadId: String!) {
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
                fullName
                isPrivate
                avatar
                anonymous
                title
                views
                edited
            }
        }
    }
`;
export const getThreadCategories = gql`
    query ($channelId: String!) {
        thread {
            getChannelThreadCategories(channelId: $channelId)
        }
    }
`;
export const getChannelCategories = gql`
    query ($channelId: String!) {
        channel {
            getChannelCategories(channelId: $channelId)
        }
    }
`;
export const getSubscribers = gql`
    query ($channelId: String!) {
        user {
            findByChannelId(channelId: $channelId) {
                _id
                email
                zoomInfo {
                    accountId
                }
                avatar
                displayName
                fullName
                unreadMessages
                groupId
            }
        }
    }
`;

export const getChannelModerators = gql`
    query ($channelId: String!) {
        channel {
            getChannelModerators(channelId: $channelId) {
                _id
                email
                zoomInfo {
                    accountId
                }
                avatar
                displayName
                fullName
                unreadMessages
                groupId
            }
        }
    }
`;
export const getStatuses = gql`
    query ($cueId: String!) {
        status {
            findByCueId(cueId: $cueId) {
                displayName
                userId
                status
                fullName
                avatar
                email
                submission
                score
                submittedAt
                deadline
                graded
                comment
                releaseSubmission
                totalPoints
                pointsScored
            }
        }
    }
`;
export const login = gql`
    query ($email: String!, $password: String!) {
        user {
            login(email: $email, password: $password) {
                user {
                    _id
                    role
                    notificationId
                }
                error
                token
            }
        }
    }
`;
export const getCuesFromCloud = gql`
    query ($userId: String!) {
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
                folderId
                endPlayAt
                channelName
                starred
                createdBy
                shuffle
                original
                submission
                deadline
                initiateAt
                gradeWeight
                score
                graded
                comment
                status
                submittedAt
                releaseSubmission
                active
                limitedShares
                allowedAttempts
                annotations
                availableUntil
                totalPoints
            }
        }
    }
`;
export const getGrades = gql`
    query ($channelId: String!) {
        channel {
            getSubmissionCues(channelId: $channelId) {
                _id
                cue
                gradeWeight
                releaseSubmission
                initiateAt
                deadline
                submittedAt
                availableUntil
            }
        }
    }
`;
export const getGradesList = gql`
    query ($channelId: String!, $userId: String!) {
        channel {
            getGrades(channelId: $channelId, userId: $userId) {
                userId
                displayName
                fullName
                email
                avatar
                scores {
                    cueId
                    score
                    gradeWeight
                    graded
                    submittedAt
                    releaseSubmission
                }
            }
        }
    }
`;
// export const getSubmissionStatistics = gql`
//   query($channelId: String!) {
//     channel {
//       getSubmissionCuesStatistics(channelId: $channelId) {
//         max
//         min
//         mean
//         median
//         std
//         submissionCount
//         cueId
//       }
//     }
//   }
// `;
export const getMessages = gql`
    query ($groupId: String!) {
        message {
            getMessagesThread(groupId: $groupId) {
                groupId
                _id
                sentBy
                message
                displayName
                fullName
                avatar
                sentAt
            }
        }
    }
`;

export const getEvents = gql`
    query ($userId: String!) {
        date {
            getCalendar(userId: $userId) {
                eventId
                dateId
                title
                start
                end
                channelName
                description
                createdBy
                recurringId
                recordMeeting
                meeting
                channelId
                cueId
                submitted
                zoomMeetingId
                zoomStartUrl
                zoomJoinUrl
                zoomRegistrationJoinUrl
                zoomMeetingScheduledBy
                zoomMeetingCreatorProfile
                meetingLink
            }
        }
    }
`;

export const getNotificationEvents = gql`
    query ($userId: String!) {
        date {
            getNotificationEvents(userId: $userId) {
                eventId
                dateId
                title
                start
                end
                channelName
                description
                createdBy
                recurringId
                recordMeeting
                meeting
                channelId
                cueId
                submitted
                zoomMeetingId
                zoomStartUrl
                zoomJoinUrl
                zoomMeetingScheduledBy
                zoomMeetingCreatorProfile
                meetingLink
            }
        }
    }
`;

export const getUnreadQACount = gql`
    query ($userId: String!, $cueId: String!) {
        threadStatus {
            getUnreadQACount(userId: $userId, cueId: $cueId)
        }
    }
`;
export const totalUnreadDiscussionThreads = gql`
    query ($userId: String!, $channelId: String!) {
        threadStatus {
            totalUnreadDiscussionThreads(userId: $userId, channelId: $channelId)
        }
    }
`;
export const totalUnreadMessages = gql`
    query ($userId: String!, $channelId: String!) {
        messageStatus {
            totalUnreadMessages(userId: $userId, channelId: $channelId)
        }
    }
`;

export const totalInboxUnread = gql`
    query ($userId: String!) {
        messageStatus {
            totalInboxUnread(userId: $userId)
        }
    }
`;
export const getMeetingStatus = gql`
    query ($channelId: String!) {
        channel {
            getMeetingStatus(channelId: $channelId)
        }
    }
`;
export const getSharedWith = gql`
    query ($cueId: String, $channelId: String!) {
        cue {
            getSharedWith(cueId: $cueId, channelId: $channelId) {
                value
                label
                sharedWith
            }
        }
    }
`;
export const getGroups = gql`
    query ($userId: String!, $channelId: String!) {
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
`;
export const getChats = gql`
    query ($userId: String!) {
        group {
            getChats(userId: $userId) {
                _id
                users
                unreadMessages
                userNames {
                    fullName
                    avatar
                    _id
                }
                lastMessage
                lastMessageTime
                name
                image
                createdBy
            }
        }
    }
`;
export const getUpcomingDates = gql`
    query ($channelId: String!) {
        attendance {
            getUpcomingDates(channelId: $channelId) {
                start
                end
            }
        }
    }
`;
export const getPastDates = gql`
    query ($channelId: String!) {
        attendance {
            getPastDates(channelId: $channelId) {
                start
                end
                dateId
                title
                recordingLink
            }
        }
    }
`;
export const getAttendances = gql`
    query ($dateId: String!) {
        attendance {
            getAttendances(dateId: $dateId) {
                displayName
                joinedAt
            }
        }
    }
`;
export const getAttendancesByUser = gql`
    query ($userId: String!) {
        attendance {
            getAttendancesByUser(userId: $userId) {
                channelId
                joinedAt
                date {
                    start
                    end
                }
            }
        }
    }
`;
export const getAllPastDates = gql`
    query ($userId: String!) {
        date {
            getPastDates(userId: $userId) {
                start
                end
                channelId
            }
        }
    }
`;
export const findThreadsByUserId = gql`
    query ($userId: String!) {
        thread {
            findByUserId(userId: $userId) {
                message
                channelId
                parentId
            }
        }
    }
`;
export const getAttendancesForChannel = gql`
    query ($channelId: String!) {
        attendance {
            getAttendancesForChannel(channelId: $channelId) {
                userId
                displayName
                fullName
                email
                avatar
                attendances {
                    userId
                    dateId
                    joinedAt
                }
            }
        }
    }
`;
export const getQuiz = gql`
    query ($quizId: String!) {
        quiz {
            getQuiz(quizId: $quizId) {
                shuffleQuiz
                duration
                problems {
                    question
                    questionType
                    points
                    options {
                        option
                        isCorrect
                    }
                    required
                    dragDropData {
                        id
                        content
                    }
                    dragDropHeaders
                    hotspots {
                        x
                        y
                    }
                    hotspotOptions {
                        option
                        isCorrect
                    }
                    imgUrl
                    highlightTextChoices
                    highlightTextHtml
                    inlineChoiceHtml
                    inlineChoiceOptions {
                        option
                        isCorrect
                    }
                    textEntryHtml
                    textEntryOptions {
                        option
                        type
                        points
                    }
                    multipartQuestions
                    multipartOptions {
                        option
                        isCorrect
                    }
                    correctEquations
                    maxCharCount
                    matchTableChoices
                    matchTableHeaders
                    matchTableOptions
                }
                instructions
                headers
            }
        }
    }
`;

export const gradeQuiz = gql`
    mutation (
        $userId: String!
        $cueId: String!
        $problemScores: [String!]!
        $problemComments: [String!]!
        $score: Float!
        $comment: String
        $quizAttempt: Float
    ) {
        cue {
            gradeQuiz(
                userId: $userId
                cueId: $cueId
                problemScores: $problemScores
                problemComments: $problemComments
                score: $score
                comment: $comment
                quizAttempt: $quizAttempt
            )
        }
    }
`;
export const modifyActiveAttemptQuiz = gql`
    mutation ($userId: String!, $cueId: String!, $quizAttempt: Float!) {
        cue {
            modifyActiveAttemptQuiz(userId: $userId, cueId: $cueId, quizAttempt: $quizAttempt)
        }
    }
`;
export const resetAccessCode = gql`
    mutation ($channelId: String!) {
        channel {
            resetAccessCode(channelId: $channelId)
        }
    }
`;
export const regenZoomMeeting = gql`
    mutation ($userId: String!, $dateId: String!) {
        date {
            regenZoomMeeting(userId: $userId, dateId: $dateId) {
                eventId
                dateId
                title
                start
                end
                channelName
                description
                createdBy
                recurringId
                recordMeeting
                meeting
                channelId
                cueId
                submitted
                zoomMeetingId
                zoomStartUrl
                zoomJoinUrl
                zoomMeetingScheduledBy
                zoomMeetingCreatorProfile
            }
        }
    }
`;
export const deleteChannel = gql`
    mutation ($channelId: String!) {
        channel {
            deleteById(channelId: $channelId)
        }
    }
`;
export const shareWithAll = gql`
    mutation ($cueId: String!) {
        cue {
            shareWithAll(cueId: $cueId)
        }
    }
`;
export const editPastMeeting = gql`
    mutation ($dateId: String!, $title: String!, $recordingLink: String) {
        date {
            editPastMeeting(dateId: $dateId, title: $title, recordingLink: $recordingLink)
        }
    }
`;

export const updateThread = gql`
    mutation ($threadId: String!, $message: String!, $anonymous: Boolean!) {
        thread {
            updateThread(threadId: $threadId, message: $message, anonymous: $anonymous)
        }
    }
`;

export const createGradebookEntry = gql`
    mutation ($gradebookEntryInput: NewGradebookEntryInput!) {
        gradebook {
            create(gradebookEntryInput: $gradebookEntryInput)
        }
    }
`;

export const editGradebookEntry = gql`
    mutation ($gradebookEntryInput: NewGradebookEntryInput!, $entryId: String!) {
        gradebook {
            edit(gradebookEntryInput: $gradebookEntryInput, entryId: $entryId)
        }
    }
`;

export const deleteGradebookEntry = gql`
    mutation ($entryId: String!) {
        gradebook {
            delete(entryId: $entryId)
        }
    }
`;

export const createStandards = gql`
    mutation ($standardsInput: NewStandardsInput!) {
        standards {
            create(standardsInput: $standardsInput)
        }
    }
`;

export const updateStandardsScore = gql`
    mutation ($standardId: String!, $userId: String!, $points: Float!, $override: Boolean!) {
        standards {
            updateStandardScore(standardId: $standardId, userId: $userId, points: $points, override: $override)
        }
    }
`;

export const revertOverriddenStandardScore = gql`
    mutation ($standardId: String!, $userId: String!) {
        standards {
            revertOverriddenStandardScore(standardId: $standardId, userId: $userId)
        }
    }
`;

export const handleUpdateGradebookScore = gql`
    mutation ($userId: String!, $entryId: String!, $gradebookEntry: Boolean!, $score: Float!) {
        gradebook {
            handleUpdateGradebookScore(
                userId: $userId
                entryId: $entryId
                gradebookEntry: $gradebookEntry
                score: $score
            )
        }
    }
`;

export const handleReleaseSubmission = gql`
    mutation ($entryId: String!, $gradebookEntry: Boolean!, $releaseSubmission: Boolean!) {
        gradebook {
            handleReleaseSubmission(
                entryId: $entryId
                gradebookEntry: $gradebookEntry
                releaseSubmission: $releaseSubmission
            )
        }
    }
`;

export const handleEditStandard = gql`
    mutation ($standardId: String!, $title: String!, $description: String!, $category: String!) {
        standards {
            editStandard(standardId: $standardId, title: $title, description: $description, category: $category)
        }
    }
`;

export const handleDeleteStandard = gql`
    mutation ($standardId: String!) {
        standards {
            deleteStandard(standardId: $standardId)
        }
    }
`;

export const loginFromSso = gql`
    query ($code: String!) {
        user {
            loginFromSso(code: $code) {
                user {
                    _id
                    role
                    notificationId
                }
                error
                token
            }
        }
    }
`;
// export const isSubInactive = gql`
//   query($userId: String!, $channelId: String!) {
//     subscription {
//       isSubInactive(userId: $userId, channelId: $channelId)
//     }
// }
// `
export const getMeetingLink = gql`
    query ($channelId: String!, $userId: String!) {
        channel {
            getMeetingLink(channelId: $channelId, userId: $userId)
        }
    }
`;
export const doesChannelNameExist = gql`
    query ($name: String!) {
        channel {
            doesChannelNameExist(name: $name)
        }
    }
`;
// export const getPersonalMeetingLink = gql`
// query($userId: String!, $users: [String!]!) {
//   channel {
//     getPersonalMeetingLink(users: $users, userId: $userId)
//   }
// }
// `
// export const getPersonalMeetingLinkStatus = gql`
// query($users: [String!]!) {
//   channel {
//     getPersonalMeetingLinkStatus(users: $users)
//   }
// }
// `
export const getRecordings = gql`
    query ($channelId: String!) {
        channel {
            getRecordings(channelId: $channelId) {
                recordID
                url
                startTime
                endTime
                thumbnail
            }
        }
    }
`;
export const getOrganisation = gql`
    query ($userId: String!) {
        school {
            findByUserId(userId: $userId) {
                logo
                _id
                allowStudentChannelCreation
                streamId
                meetingProvider
            }
        }
    }
`;
export const getRole = gql`
    query ($userId: String!) {
        user {
            getRole(userId: $userId)
        }
    }
`;
export const isChannelTemporary = gql`
    query ($channelId: String!) {
        channel {
            isChannelTemporary(channelId: $channelId)
        }
    }
`;
export const findChannelById = gql`
    query ($channelId: String!) {
        channel {
            findById(channelId: $channelId) {
                name
                password
                temporary
                channelCreator
                owners
                description
                accessCode
                tags
                isPublic
                meetingUrl
            }
        }
    }
`;
export const getUserCount = gql`
    query ($schoolId: String!) {
        user {
            getSchoolUsers(schoolId: $schoolId) {
                email
                displayName
                fullName
                avatar
                _id
                role
                grade
                section
                inactive
                lastLoginAt
            }
        }
    }
`;
export const getChannelColorCode = gql`
    query ($channelId: String!) {
        channel {
            getChannelColorCode(channelId: $channelId)
        }
    }
`;

export const findBySchoolId = gql`
    query ($schoolId: String!) {
        channel {
            findBySchoolId(schoolId: $schoolId) {
                name
                _id
                password
                createdBy
                createdByUsername
                channelCreator
                createdByAvatar
                numSubs
                role
                meetingOn
                owners
            }
        }
    }
`;
export const getSharableLink = gql`
    query ($channelId: String!, $moderator: Boolean!) {
        channel {
            getSharableLink(channelId: $channelId, moderator: $moderator)
        }
    }
`;
export const getActivity = gql`
    query ($userId: String!) {
        activity {
            getActivity(userId: $userId) {
                _id
                title
                subtitle
                body
                channelName
                channelId
                status
                colorCode
                date
                cueId
                createdBy
                target
                threadId
            }
        }
    }
`;
export const getPerformanceReport = gql`
    query ($userId: String!) {
        user {
            getPerformanceReport(userId: $userId) {
                channelId
                channelName
                score
                total
                channelCreatedBy
                submittedAssessments
                lateAssessments
                gradedAssessments
                totalAssessments
                upcomingAssessmentDate
            }
        }
    }
`;
export const getSearch = gql`
    query ($userId: String!, $term: String!) {
        user {
            search(userId: $userId, term: $term)
        }
    }
`;
export const getAllUsers = gql`
    query ($userId: String!) {
        user {
            getAllUsers(userId: $userId) {
                _id
                email
                fullName
                avatar
                role
                grade
                section
                zoomInfo {
                    accountId
                }
                channelIds
            }
        }
    }
`;

export const getFolder = gql`
    query ($folderId: String!) {
        folder {
            findById(folderId: $folderId) {
                title
                cueIds
            }
        }
    }
`;

export const getChannelFolders = gql`
    query ($channelId: String!) {
        folder {
            getFoldersForChannel(channelId: $channelId) {
                _id
                title
            }
        }
    }
`;

export const getFolderCues = gql`
    query ($folderId: String!, $userId: String!) {
        folder {
            getCuesById(folderId: $folderId, userId: $userId) {
                _id
                cue
                color
                channelId
                folderId
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
                initiateAt
                gradeWeight
                graded
                score
                comment
                status
                submittedAt
                releaseSubmission
                active
                limitedShares
                allowedAttempts
                availableUntil
            }
        }
    }
`;
export const getGroup = gql`
    query ($users: [String!]!) {
        message {
            getGroupId(users: $users)
        }
    }
`;
export const getReleaseSubmissionStatus = gql`
    query ($cueId: String!) {
        cue {
            getReleaseSubmissionStatus(cueId: $cueId)
        }
    }
`;
export const retrievePDFFromArchive = gql`
    query ($identifier: String!) {
        cue {
            retrievePDFFromArchive(identifier: $identifier)
        }
    }
`;
export const getChannelsOutside = gql`
    query ($userId: String!) {
        channel {
            getChannelsOutside(userId: $userId) {
                name
                _id
                password
                createdBy
                createdByUsername
                channelCreator
                createdByAvatar
                numSubs
                role
                meetingOn
                owners
            }
        }
    }
`;
export const getOngoingMeetings = gql`
    query ($userId: String!, $channelId: String!) {
        channel {
            ongoingMeetings(userId: $userId, channelId: $channelId) {
                title
                description
                startUrl
                joinUrl
                start
                end
                error
            }
        }
    }
`;

// PDF Viewer stuff;

export const fetchAnnotationsForViewer = gql`
    query ($userId: String!, $cueId: String!) {
        user {
            fetchAnnotationsForViewer(userId: $userId, cueId: $cueId) {
                _id
                cue
                date
                original
                submission
                releaseSubmission
                annotations
            }
        }
    }
`;

export const getSsoLink = gql`
    query ($ssoDomain: String!, $redirectURI: String!) {
        user {
            getSsoLinkNative(ssoDomain: $ssoDomain, redirectURI: $redirectURI)
        }
    }
`;

export const searchMessages = gql`
    query ($term: String!, $userId: String!) {
        message {
            searchMessages(term: $term, userId: $userId)
        }
    }
`;

export const searchThreads = gql`
    query ($term: String!, $channelId: String!) {
        thread {
            searchThreads(term: $term, channelId: $channelId) {
                _id
                message
                channelId
                cueId
                parentId
                category
                time
                userId
                displayName
                fullName
                isPrivate
                avatar
                anonymous
                title
                views
                searchTitle
            }
        }
    }
`;

export const getCourseStudents = gql`
    query ($channelId: String!) {
        channel {
            getCourseStudents(channelId: $channelId) {
                _id
                fullName
                email
                avatar
            }
        }
    }
`;

export const getGradebookInstructor = gql`
    query ($channelId: String!) {
        gradebook {
            getGradebook(channelId: $channelId) {
                entries {
                    title
                    gradeWeight
                    deadline
                    totalPoints
                    cueId
                    gradebookEntryId
                    releaseSubmission
                    scores {
                        userId
                        submitted
                        pointsScored
                        score
                        submittedAt
                        lateSubmission
                    }
                }
                totals {
                    userId
                    totalPointsPossible
                    pointsScored
                    score
                    gradingScaleOutcome
                }
                users {
                    userId
                    fullName
                    avatar
                }
            }
        }
    }
`;

export const getAssignmentAnalytics = gql`
    query ($channelId: String!) {
        gradebook {
            getAssignmentAnalytics(channelId: $channelId) {
                title
                totalPoints
                deadline
                cueId
                gradebookEntryId
                gradeWeight
                releaseSubmission
                max
                min
                mean
                median
                std
                maxPts
                minPts
                meanPts
                medianPts
                stdPts
                sharedWith
                submitted
                graded
                topPerformers {
                    userId
                    score
                    pointsScored
                    fullName
                    avatar
                }
                bottomPerformers {
                    userId
                    score
                    pointsScored
                    fullName
                    avatar
                }
            }
        }
    }
`;

export const getStudentAnalytics = gql`
    query ($channelId: String!, $userId: String!) {
        gradebook {
            getStudentScores(channelId: $channelId, userId: $userId) {
                score
                sharedWith
                graded
                submitted
                progress
                scores {
                    score
                    gradebookEntryId
                    cueId
                    pointsScored
                }
            }
        }
    }
`;

export const getStandardsBasedGradingScale = gql`
    query ($channelId: String!) {
        channel {
            getStandardsBasedGradingScale(channelId: $channelId) {
                _id
                name
                range {
                    name
                    start
                    end
                    points
                    description
                }
            }
        }
    }
`;

export const getStandardsGradebook = gql`
    query ($channelId: String!) {
        standards {
            getStandardsGradebook(channelId: $channelId) {
                entries {
                    _id
                    title
                    description
                    category
                    scores {
                        userId
                        points
                        mastery
                        masteryPoints
                        overridden
                    }
                }
                totals {
                    category
                    scores {
                        userId
                        points
                        mastery
                        masteryPoints
                    }
                }
                users {
                    userId
                    avatar
                    fullName
                }
            }
        }
    }
`;

export const getStandardsInsights = gql`
    query ($channelId: String!, $standardId: String!, $userId: String!) {
        standards {
            getStandardsInsights(channelId: $channelId, standardId: $standardId, userId: $userId) {
                scores {
                    _id
                    points
                    createdAt
                    overridden
                }
                total
                mastery
                masteryPoints
                overridden
            }
        }
    }
`;

export const getCourseGradingScale = gql`
    query ($channelId: String!) {
        channel {
            getCourseGradingScale(channelId: $channelId) {
                _id
                name
                range {
                    name
                    start
                    end
                    points
                    description
                }
            }
        }
    }
`;

export const getGradebookStudent = gql`
    query ($channelId: String!, $userId: String!) {
        gradebook {
            getGradebookStudent(channelId: $channelId, userId: $userId) {
                entries {
                    title
                    gradeWeight
                    deadline
                    availableUntil
                    totalPoints
                    cueId
                    gradebookEntryId
                    releaseSubmission
                    submitted
                    pointsScored
                    score
                    initiateAt
                    lateSubmission
                    submittedAt
                }
                total {
                    totalPointsPossible
                    pointsScored
                    score
                    gradingScaleOutcome
                    totalAssessments
                    submitted
                    notSubmitted
                    lateSubmissions
                    graded
                    courseProgress
                }
            }
        }
    }
`;

export const getStandardsGradebookStudent = gql`
    query ($channelId: String!, $userId: String!) {
        standards {
            getStandardsGradebookStudent(channelId: $channelId, userId: $userId) {
                entries {
                    _id
                    title
                    description
                    category
                    points
                    mastery
                    masteryPoints
                    overridden
                }
                totals {
                    category
                    points
                    mastery
                    masteryPoints
                    overridden
                }
            }
        }
    }
`;

export const getStandardsCategories = gql`
    query ($channelId: String!) {
        standards {
            getStandardsCategories(channelId: $channelId)
        }
    }
`;
export const getStreamChatUserToken = gql`
    mutation ($userId: String!) {
        streamChat {
            getUserToken(userId: $userId)
        }
    }
`;
export const getInboxDirectory = gql`
    query ($userId: String!) {
        streamChat {
            getInboxDirectory(userId: $userId) {
                _id
                fullName
                avatar
                role
                grade
                section
                roleDescription
                courses
            }
        }
    }
`;
