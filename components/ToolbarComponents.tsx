import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { TextInput } from './CustomTextInput';
import Alert from './Alert';

export const EmojiView: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { onSelect } = props;
    return (
        // <View style={styles.overlay}>
        <View style={styles.view}>
            <Text style={styles.item} onPress={() => onSelect('😃')}>
                😃
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😄')}>
                😄
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😁')}>
                😁
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😆')}>
                😆
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😅')}>
                😅
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😂')}>
                😂
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤣')}>
                🤣
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😊')}>
                😊
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😇')}>
                😇
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🙂')}>
                🙂
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🙃')}>
                🙃
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😉')}>
                😉
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😌')}>
                😌
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😍')}>
                😍
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🥰')}>
                🥰
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😘')}>
                😘
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😗')}>
                😗
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😙')}>
                😙
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😚')}>
                😚
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😋')}>
                😋
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😛')}>
                😛
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😝')}>
                😝
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😜')}>
                😜
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤪')}>
                🤪
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤨')}>
                🤨
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🧐')}>
                🧐
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤓')}>
                🤓
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😎')}>
                😎
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤩')}>
                🤩
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🥳')}>
                🥳
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😏')}>
                😏
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😒')}>
                😒
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😞')}>
                😞
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😔')}>
                😔
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😟')}>
                😟
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😕')}>
                😕
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🙁')}>
                🙁
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😣')}>
                😣
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😖')}>
                😖
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😫')}>
                😫
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😩')}>
                😩
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🥺')}>
                🥺
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😢')}>
                😢
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😭')}>
                😭
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😤')}>
                😤
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😠')}>
                😠
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😡')}>
                😡
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤬')}>
                🤬
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤯')}>
                🤯
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😳')}>
                😳
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🥵')}>
                🥵
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🥶')}>
                🥶
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😱')}>
                😱
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😨')}>
                😨
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😰')}>
                😰
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😥')}>
                😥
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😓')}>
                😓
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤗')}>
                🤗
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤔')}>
                🤔
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤭')}>
                🤭
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤫')}>
                🤫
            </Text>
            <Text style={styles.item} onPress={() => onSelect('🤥')}>
                🤥
            </Text>
            <Text style={styles.item} onPress={() => onSelect('😶')}>
                😶
            </Text>
        </View>
        // </View>
    );
};

export const InsertLink: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [insertDisabled, setInsertDisabled] = useState(true);

    async function isValidHttpUrl(string: string) {
        const res = await Linking.canOpenURL(string);
        return res;
    }

    useEffect(() => {
        if (title !== '' && link !== '') {
            setInsertDisabled(false);
        } else {
            setInsertDisabled(true);
        }
    }, [title, link]);

    return (
        <View
            style={{
                paddingHorizontal: 20,
                width: '100%',
                marginTop: 10,
            }}
        >
            <View
                style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <View style={{ width: '100%', maxWidth: 600 }}>
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold',
                        }}
                    >
                        Title
                    </Text>
                    <TextInput
                        value={title}
                        placeholder={''}
                        onChangeText={(val) => setTitle(val)}
                        placeholderTextColor={'#1F1F1F'}
                        required={true}
                    />
                </View>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: '#fff',
                        maxWidth: 600,
                        // marginLeft: Dimensions.get('window').width < 768 ? 0 : 50
                    }}
                >
                    <Text
                        style={{
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            fontFamily: 'Inter',
                            color: '#000000',
                            fontWeight: 'bold',
                        }}
                    >
                        URL
                    </Text>
                    <TextInput
                        value={link}
                        placeholder="https://www.abc.com"
                        onChangeText={(val) => setLink(val)}
                        placeholderTextColor={'#a2a2ac'}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={{
                    marginTop: 20,
                    alignSelf: 'center',
                }}
                onPress={async () => {
                    const valid = await isValidHttpUrl(link);
                    if (valid) {
                        props.onInsertLink(title, link);
                    } else {
                        Alert('URL is invalid. Correct url must be of format https://www.abc.com.');
                    }
                }}
                disabled={insertDisabled}
            >
                <Text
                    style={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        borderColor: '#000',
                        borderWidth: 1,
                        color: '#fff',
                        backgroundColor: '#000',
                        fontSize: 11,
                        paddingHorizontal: 24,
                        fontFamily: 'inter',
                        overflow: 'hidden',
                        paddingVertical: 14,
                        textTransform: 'uppercase',
                        width: 150,
                    }}
                >
                    {' '}
                    Insert{' '}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// export const HighlightPicker: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

// }

const styles = StyleSheet.create({
    view: {
        alignSelf: 'center',
        flexWrap: 'wrap',
        flexDirection: 'row',
        width: Math.min(Dimensions.get('window').width, 32 * 12),
        paddingHorizontal: 10,
        zIndex: 10000,
    },
    item: {
        // height: 25,
        // width: 25,
        fontSize: 20,
        paddingHorizontal: 3,
        paddingVertical: 5,
    },
});
