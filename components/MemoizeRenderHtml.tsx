import React, { useState  } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml, {
    useIMGElementProps,
    CustomBlockRenderer,
    domNodeToHTMLString
  } from 'react-native-render-html';

import _ from 'lodash';

const MemoizeRenderHtml: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const { width: contentWidth } = useWindowDimensions();

    console.log("Render Memoize HTML")
    return <RenderHtml 
        contentWidth={contentWidth}
        {...props}
    />
}

export default React.memo(MemoizeRenderHtml,  (prev, next) => {
    return _.isEqual({ 
        ...prev.source, 
        ...prev.tagsStyles, 
        ...prev.renderers 
    }, { 
        ...next.source, 
        ...next.tagsStyles, 
        ...next.renderers 
    });
})