import React, { useEffect, useRef, useState } from 'react';
import { WebView } from "react-native-webview";

const Webview: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [key, setKey] = useState(Math.random())
    const [proc, setProc] = useState(0)

    const ref: any = useRef()

    useEffect(() => {
        const id = setInterval(() => {
            setKey(Math.random())
        }, 3000)
        setProc(id)
    }, [])

    return (
        <WebView
            key={key}
            ref={ref}
            onLoad={e => {
                clearInterval(proc)
            }}
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