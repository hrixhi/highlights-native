import React, { useContext, useState, PropsWithChildren } from 'react';

import type { ChannelContextValue } from 'stream-chat-expo';

import type { StreamChatGenerics } from '../components/ChatComponents/types';

const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const sections = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
];
const filterRoleOptionsInstructor = [
    {
        value: 'All',
        label: 'All Roles',
    },
    {
        value: 'student',
        label: 'Student',
    },
    {
        value: 'instructor',
        label: 'Instructor',
    },
    {
        value: 'admin',
        label: 'Admin',
    },
    {
        value: 'parent',
        label: 'Parents',
    },
];

const filterRoleOptionsStudent = [
    {
        value: 'All',
        label: 'All Roles',
    },
    {
        value: 'student',
        label: 'Student',
    },
    {
        value: 'instructor',
        label: 'Instructor',
    },
    {
        value: 'admin',
        label: 'Admin',
    },
];

const gradeOptions = grades.map((g: any) => {
    return {
        value: g,
        label: g,
    };
});
const filterGradeOptions = [
    {
        value: 'All',
        label: 'All Grades',
    },
    ...gradeOptions,
];
const sectionOptions = sections.map((s: any) => {
    return {
        value: s,
        label: s,
    };
});
const filterSectionOptions = [
    {
        value: 'All',
        label: 'All Sections',
    },
    ...sectionOptions,
];

export type DirectoryFilterContextValue = {
    currentUserRole: string;
    subscriptions: any[];
    filterByCourses: boolean;
    selectedCourse: string;
    selectedRole: string;
    selectedGrade: string;
    selectedSection: string;
    setFilterByCourses: (value: boolean) => void;
    setSelectedCourse: (value: string) => void;
    setSelectedRole: (value: string) => void;
    setSelectedGrade: (value: string) => void;
    setSelectedSection: (value: string) => void;
    filterRoleOptions: any[];
    filterGradeOptions: any[];
    filterSectionOptions: any[];
    reset: () => void;
};

export const DirectoryFilterOverlayContext = React.createContext({} as DirectoryFilterContextValue);

export const DirectoryFilterOverlayProvider = ({
    children,
    value,
}: PropsWithChildren<{
    value?: Partial<DirectoryFilterContextValue>;
}>) => {
    const [currentUserRole] = useState(value?.currentUserRole);
    const [filterByCourses, setFilterByCourses] = useState(true);
    // All
    const [subscriptions] = useState(value?.subscriptions);
    const [selectedCourse, setSelectedCourse] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedSection, setSelectedSection] = useState('All');

    const reset = () => {
        setFilterByCourses(true);
        setSelectedCourse('All');
        setSelectedRole('All');
        setSelectedGrade('All');
        setSelectedSection('All');
    };

    const directoryFilterOverlayContext = {
        currentUserRole,
        subscriptions,
        filterByCourses,
        selectedCourse,
        selectedRole,
        selectedGrade,
        selectedSection,
        setFilterByCourses,
        setSelectedCourse,
        setSelectedRole,
        setSelectedGrade,
        setSelectedSection,
        filterRoleOptions: currentUserRole === 'student' ? filterRoleOptionsStudent : filterRoleOptionsInstructor,
        filterGradeOptions,
        filterSectionOptions,
        reset,
    };
    return (
        <DirectoryFilterOverlayContext.Provider value={directoryFilterOverlayContext as DirectoryFilterContextValue}>
            {children}
        </DirectoryFilterOverlayContext.Provider>
    );
};

export const useDirectoryFilterOverlayContext = () =>
    useContext(DirectoryFilterOverlayContext) as unknown as DirectoryFilterContextValue;
