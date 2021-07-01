import React, { useEffect, useRef, useState } from 'react';
import { WebView } from "react-native-webview";

const Webview: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const ref: any = useRef()

    return (
        <WebView
            onLoad={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.title == "") {
                    ref.current.reload();
                }
            }}
            ref={ref}
            style={{ flex: 1 }}
            scrollEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsFullscreenVideo={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            source={{
                uri: 'https://docs.google.com/viewer?url=' + encodeURI(props.url) + '&embedded=true'
            }}
        />
    );
}

export default Webview