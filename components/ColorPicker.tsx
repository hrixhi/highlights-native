import React, { useCallback, useEffect, useState, useRef } from 'react';
import { TouchableOpacity } from "react-native";
import { View } from "./Themed";

const ColorPicker: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#0d5d35", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607db8"]

    return (<View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'white' }}>
        {colorChoices.map((color: string) => {
            return (<TouchableOpacity style={{ width: '20%' }} onPress={() => props.onChange(color)}>
                <View style={{ marginBottom: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: props.color === color ? "white" : color, borderColor: color, borderWidth: 2 }} />
            </TouchableOpacity>)
        })}
    </View>)


}

export default ColorPicker
