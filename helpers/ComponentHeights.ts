export const discussionThreadsHeight = (windowHeight: number, width: number, platform: string, orientation: string) => {
    let height = 0;

    if (width < 768 && platform === 'ios') {
        height = windowHeight;
        // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = windowHeight - 210;
        // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height = windowHeight - 50;
        // Tablet landscape
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height = windowHeight - 45;
    } else {
        height = windowHeight;
    }

    return height;
};

export const selectedThreadHeight = (windowHeight: number, width: number, platform: string, orientation: string) => {
    let height = 0;

    if (width < 768 && platform === 'ios') {
        height = windowHeight - 150;
        // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = windowHeight - 100;
        // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height = windowHeight - 120;
        // Tablet landscape
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height = windowHeight - 45;
    } else {
        height = windowHeight;
    }

    return height;
};

export const messagesContainerHeight = (windowHeight: number, width: number, platform: string, orientation: string) => {
    if (width < 768) {
        return windowHeight - 52;
    } else {
        return windowHeight - 120;
    }
};
