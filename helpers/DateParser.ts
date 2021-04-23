export const duringSleep = (a: number, b: number, n: number) => {

    let duringSleep = false

    // am & am
    if (a <= 12 && b <= 12) {
        if (b > a) {
            if (n >= a && n <= b) {
                duringSleep = true
            }
        } else {
            if (n >= b && n <= a) {
                duringSleep = true
            }
        }
    }
    // am & pm
    else if (a <= 12 && b > 12) {
        if (n >= a && n <= b) {
            duringSleep = true
        }
    }
    // pm & am
    else if (a > 12 && b <= 12) {
        if (n > b && n < a) {
            // this is the allowed time
        } else {
            duringSleep = true
        }
    }
    // pm & pm
    else if (a > 12 && b > 12) {
        if (b > a) {
            if (n >= a && n <= b) {
                duringSleep = true
            }
        } else {
            if (n >= b && n <= a) {
                duringSleep = true
            }
        }
    }

    return duringSleep
}

export const getNextDate = (frequency: string, date: Date) => {

    let newDate = new Date(date)

    switch (frequency) {
        case "0":
            // never
            break;
        case "1-m":
            // This one not implemented. Interval too small.
            // Only for testing
            newDate.setMinutes(newDate.getMinutes() + 1)
            break;
        case "1-H":
            newDate.setHours(newDate.getHours() + 1)
            break;
        case "2-H":
            newDate.setHours(newDate.getHours() + 2)
            break;
        case "3-H":
            newDate.setHours(newDate.getHours() + 3)
            break;
        case "4-H":
            newDate.setHours(newDate.getHours() + 4)
            break;
        case "6-H":
            newDate.setHours(newDate.getHours() + 6)
            break;
        case "8-H":
            newDate.setHours(newDate.getHours() + 8)
            break;
        case "12-H":
            newDate.setHours(newDate.getHours() + 12)
            break;
        case "1-D":
            newDate.setDate(newDate.getDate() + 1)
            break;
        case "2-D":
            newDate.setDate(newDate.getDate() + 2)
            break;
        case "3-D":
            newDate.setDate(newDate.getDate() + 3)
            break;
        case "4-D":
            newDate.setDate(newDate.getDate() + 4)
            break;
        case "5-D":
            newDate.setDate(newDate.getDate() + 5)
            break;
        case "1-W":
            newDate.setDate(newDate.getDate() + 7)
            break;
        case "2-W":
            newDate.setDate(newDate.getDate() + 14)
            break;
        case "1-M":
            newDate.setMonth(newDate.getMonth() + 1)
            break;
        case "2-M":
            newDate.setMonth(newDate.getMonth() + 2)
            break;
        case "3-M":
            newDate.setMonth(newDate.getMonth() + 3)
            break;
        default:
            // add one day
            newDate.setDate(newDate.getDate() + 1)
            break;
    }

    return newDate;

}