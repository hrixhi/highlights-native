export const getDropdownHeight = (numOfItems: number) => {
    const height = 60 + (numOfItems * 40)

    return (height > 260 ? 260 : height)
}

export const contentsModalHeight = (numOfCategories: number) => {
    const height = numOfCategories * 40 + 240

    return height > 600 ? 600 : height; 
}