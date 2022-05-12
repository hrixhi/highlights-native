export const newEventModalHeight = (windowHeight: number, width: number, platform: string, orientation: string) => {

    let height = 0;

    if (width < 768 && platform === 'ios') {
        height = windowHeight;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = windowHeight - 10;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height = windowHeight - 50;
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height = windowHeight - 45;
    } else {
        height = windowHeight;
    }

    return height
}

export const filterEventModalHeight = (width: number, platform: string, orientation: string) => {
    
    let height = '';

    if (width < 768 && platform === 'ios') {
        height = '55%';
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = '55%';
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height =  '40%';
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height =  '40%';
    } else {
        height = '45%';
    }

    return height

}

export const filterActivityModalHeight = (width: number, platform: string, orientation: string) => {
    
    let height = '';

    if (width < 768 && platform === 'ios') {
        height = '45%';
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = '43%';
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height =  '35%';
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height =  '30%';
    } else {
        height = '40%';
    }

    return height

}

export const filterLibraryModalHeight = (width: number, platform: string, orientation: string) => {

    let height = '';

    if (width < 768 && platform === 'ios') {
        height = '55%';
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = '50%';
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height =  '40%';
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height =  '35%';
    } else {
        height = '40%';
    }

    return height

}

export const channelPasswordModalHeight = (width: number, platform: string, orientation: string) => {

    let height = '';

    if (width < 768 && platform === 'ios') {
        height =  '70%'
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = '70%'
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height =  '80%'
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height =  '90%';
    } else {
        height = '30%';
    }

    return height

}

export const newCourseModalHeight = (windowHeight: number, width: number, platform: string, orientation: string) => {

    let height = 0;

    if (width < 768 && platform === 'ios') {
        height = windowHeight;
    // Android Phone
    } else if (width < 768 && platform === 'android') {
        height = windowHeight;
    // Tablet potrait
    } else if (orientation === 'PORTRAIT' && width > 768) {
        height = windowHeight;
    // Tablet landscape 
    } else if (orientation === 'LANDSCAPE' && width > 768) {
        height = windowHeight ;
    } else {
        height = windowHeight;
    }

    return height
}