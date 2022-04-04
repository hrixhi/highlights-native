// MARGIN RIGHT WILL BE SAME FOR ALL
export const blueButtonMR = (width: number, orientation: string, platform: string) => {
    let marginRight = 0;

    if (width < 768 && platform === 'ios') {
        marginRight = 24;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        marginRight = 24;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        marginRight = 35;
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        marginRight = 35;
    } else {
        marginRight = 24;
    }

    return marginRight
}

// MARGIN BOTTOM WILL BE DIFFERENT SINCE THE BLUE BUTTONS ARE RENDERED IN DIFFERENT COMPONENTS AND THEY ALL THE DIFFERENT HEIGHTS
export const blueButtonCalendarMB = (width: number, orientation: string, platform: string) => {
    let marginBottom = 0;

    if (width < 768 && platform === 'ios') {
        marginBottom = 45;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        marginBottom = 45;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        marginBottom = 50;
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        marginBottom = 25;
    } else {
        marginBottom = 45;
    }

    return marginBottom
}




// Needs to be different from Calendar due to height differences
export const blueButtonHomeMB = (width: number, orientation: string, platform: string) => {
    let marginBottom = 0;

    if (width < 768 && platform === 'ios') {
        marginBottom = 82;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        marginBottom = 90;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        marginBottom = 86; // (96 - 10)
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        marginBottom = 91;
    } else {
        marginBottom = 82;
    }

    return marginBottom
}

// Needs to be different from Calendar & Account due to height differences
export const blueButtonAccountMB = (width: number, orientation: string, platform: string) => {
    let marginBottom = 0;

    if (width < 768 && platform === 'ios') {
        marginBottom = 45;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        marginBottom = 63;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        marginBottom = 100;
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        marginBottom = 75;
    } else {
        marginBottom = 45;
    }


    return marginBottom
}