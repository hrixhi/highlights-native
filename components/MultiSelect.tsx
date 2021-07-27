import React, { useRef } from 'react'
import MultiSelect from "react-native-multiple-select";
import Alert from './Alert';

const MultiSelectComponent: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const ref: any = useRef()

    return <MultiSelect
        hideTags={false}
        items={props.subscribers}
        uniqueKey="value"
        ref={ref}
        styleRowList={{
            height: 23
        }}
        styleTextDropdown={{
            fontFamily: "overpass",
            fontSize: 11,
            color: '#a2a2ac'
        }}
        styleTextDropdownSelected={{
            fontSize: 11
        }}
        styleDropdownMenuSubsection={{
            height: 50
        }}
        styleSelectorContainer={{
            height: 250
        }}
        styleItemsContainer={{
            height: 210
        }}
        styleListContainer={{
            height: 250,
            backgroundColor: "#fff"
        }}
        onSelectedItemsChange={(sel: any) => {
            if (props.settings) {
                props.onAddNew(sel)
            } else {
                if (sel.length > props.selected.length) {
                    props.onAddNew(sel[props.selected.length]);
                } else {
                    Alert("Cannot un-share!");
                }
            }
        }}
        selectedItems={props.selected}
        selectText="Share with"
        searchInputPlaceholderText="Search..."
        altFontFamily="overpass"
        tagRemoveIconColor="#a2a2ac"
        tagBorderColor="#a2a2ac"
        tagTextColor="#a2a2ac"
        selectedItemTextColor="#2f2f3c"
        selectedItemIconColor="#2f2f3c"
        itemTextColor="#2f2f3c"
        displayKey="label"
        textColor="#2f2f3c"
        submitButtonColor={"#2f2f3c"}
        submitButtonText="Done"
    />

}

export default MultiSelectComponent