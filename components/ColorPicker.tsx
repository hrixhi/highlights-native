import React, { useCallback, useEffect, useState, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { View } from './Themed';

const ColorPicker: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorChoices = props.editorColors
        ? [
              '#BFEDD2',
              '#FBEEB8',
              '#F8CAC6',
              '#ECCAFA',
              '#C2E0F4',
              '#2DC26B',
              '#F1C40F',
              '#E03E2D',
              '#B96AD9',
              '#3598DB',
              '#169179',
              '#E67E23',
              '#BA372A',
              '#843FA1',
              '#236FA1',
              '#ECF0F1',
              '#CED4D9',
              '#95A5A6',
              '#7E8C8D',
              '#000000'
          ]
        : // ['#c7e372', '#ffc701', '#ef5a68', '#9ad0dc', '#d4ddda']
          [
              '#f44336',
              '#e91e63',
              '#9c27b0',
              '#673ab7',
              '#3f51b5',
              '#2196f3',
              '#03a9f4',
              '#00bcd4',
              '#009688',
              '#4caf50',
              '#8bc34a',
              '#cddc39',
              '#0d5d35',
              '#ffc107',
              '#ff9800',
              '#ff5722',
              '#795548',
              '#607db8'
          ];

    return (
        <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'white' }}>
            {colorChoices.map((color: string) => {
                return (
                    <TouchableOpacity style={{ width: '20%', marginBottom: 15 }} onPress={() => props.onChange(color)}>
                        <View
                            style={{
                                marginBottom: 10,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: props.color === color ? 'white' : color,
                                borderColor: color,
                                borderWidth: 2,
                                alignSelf: 'center'
                            }}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default ColorPicker;
