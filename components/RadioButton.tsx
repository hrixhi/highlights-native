import React, { useState } from "react";
import { View } from 'react-native';

type RadioButtonProps = {
    selected?: boolean;
    style?: any;
};

export const RadioButton = (props: RadioButtonProps) => {
    return (
        <View style={[{
          height: 16,
          width: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#3b64f8',
          alignItems: 'center',
          justifyContent: 'center',
        }, props.style]}>
          {
            props.selected ?
              <View style={{
                height: 8,
                width: 8,
                borderRadius: 4,
                backgroundColor: '#3b64f8',
              }}/>
              : null
          }
        </View>
    );
  }