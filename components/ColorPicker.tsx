import React from 'react';
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
              '#000000',
          ]
        : // ['#c7e372', '#ffc701', '#ef5a68', '#9ad0dc', '#d4ddda']
          [
              '#0450b4',
              '#046dc8',
              '#1184a7',
              '#15a2a2',
              '#6fb1a0',
              '#b4418e',
              '#d94a8c',
              '#ea515f',
              '#fe7434',
              '#f48c06',
          ];

    return (
        <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'white' }}>
            {colorChoices.map((color: string, ind: number) => {
                return (
                    <TouchableOpacity
                        key={ind.toString()}
                        style={{ width: '20%', marginBottom: 15 }}
                        onPress={() => props.onChange(color)}
                    >
                        <View
                            style={{
                                marginBottom: 10,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: props.color === color ? 'white' : color,
                                borderColor: color,
                                borderWidth: 2,
                                alignSelf: 'center',
                            }}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default ColorPicker;
