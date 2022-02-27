// // REACT
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch } from 'react-native-gesture-handler';

// // COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import BottomSheet from './BottomSheet';
// import { Popup } from '@mobiscroll/react';
// import TextareaAutosize from 'react-textarea-autosize';
// import { Select } from '@mobiscroll/react';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import DropDownPicker from 'react-native-dropdown-picker';
import { getDropdownHeight } from '../helpers/DropdownHeight';

const NewPost: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [message, setMessage] = useState('');
    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    // const [dropdownHeight, setDropdownHeight] = useState(250);

    const styles = styleObject();

    const width = Dimensions.get('window').width;

    // useEffect(() => {
    //     setDropdownHeight(
    //         Object.keys(props.categoriesOptions).length * 60 + 50 > 260
    //             ? 250
    //             : Object.keys(props.categoriesOptions).length * 60 + 50
    //     );
    // }, [props.categoriesOptions]);

    // console.log('Dropdown height', dropdownHeight);

    /**
     * @description Renders option to select Category for new discussion post
     */
    const customCategoryInput = (
        <View style={{ backgroundColor: '#ffffff', marginVertical: 20, paddingHorizontal: 20 }}>
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    borderColor: '#f2f2f2'
                }}
            >
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flexDirection: width < 768 ? 'column' : 'row',
                        paddingTop: width < 768 ? 0 : 40
                    }}
                >
                    <View
                        style={{
                            // flex: 1,
                            flexDirection: 'row',
                            paddingBottom: 15,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            Category
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: 'white'
                            // alignItems: 'center'
                        }}
                    >
                        <View
                            style={{
                                maxWidth: 400,
                                width: '85%',
                                backgroundColor: 'white',
                                marginLeft: width < 768 ? 0 : 'auto'
                            }}
                        >
                            {addCustomCategory ? (
                                <View style={styles.colorBar}>
                                    <TextInput
                                        value={customCategory}
                                        style={{
                                            borderRadius: 0,
                                            borderColor: '#f2f2f2',
                                            borderBottomWidth: 1,
                                            fontSize: 14,
                                            padding: 10,
                                            paddingVertical: 15,
                                            width: '100%'
                                        }}
                                        placeholder={'Enter Category'}
                                        onChangeText={val => {
                                            setCustomCategory(val);
                                        }}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                            ) : (
                                <View
                                    style={{
                                        height: isCategoryDropdownOpen ? getDropdownHeight(props.categoriesOptions.length) : 50
                                    }}
                                >
                                    <DropDownPicker
                                        listMode={Platform.OS === "android" ? "MODAL" : "SCROLLVIEW"}
                                        open={isCategoryDropdownOpen}
                                        value={customCategory}
                                        items={props.categoriesOptions}
                                        setOpen={setIsCategoryDropdownOpen}
                                        setValue={setCustomCategory}
                                        zIndex={1000001}
                                        style={{
                                            borderWidth: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f2f2f2'
                                        }}
                                        dropDownContainerStyle={{
                                            borderWidth: 0,
                                            zIndex: 1000001,
                                            elevation: 1000001
                                        }}
                                        containerStyle={{
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 4,
                                                height: 4
                                            },
                                            shadowOpacity: !isCategoryDropdownOpen ? 0 : 0.08,
                                            shadowRadius: 12,
                                            zIndex: 1000001,
                                            elevation: 1000001
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                        <View
                            style={{
                                // width: '15%',
                                backgroundColor: 'white',
                                marginLeft: 20
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    if (addCustomCategory) {
                                        setCustomCategory('None');
                                        setAddCustomCategory(false);
                                    } else {
                                        setCustomCategory('');
                                        setAddCustomCategory(true);
                                    }
                                }}
                                style={{ backgroundColor: 'white' }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        lineHeight: 20,
                                        width: '100%',
                                        paddingTop: 15
                                    }}
                                >
                                    <Ionicons
                                        name={addCustomCategory ? 'close' : 'create-outline'}
                                        size={18}
                                        color={'#000000'}
                                    />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderNewPostContent = () => {
        return (
            <ScrollView style={{ backgroundColor: '#ffffff' }} scrollEnabled={false}>
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: 20,
                        marginVertical: 20,
                        backgroundColor: '#ffffff'
                    }}
                >
                    <AutoGrowingTextInput
                        value={message}
                        onChange={(event: any) => setMessage(event.nativeEvent.text || '')}
                        style={{
                            fontFamily: 'overpass',
                            width: '100%',
                            maxWidth: 500,
                            borderBottomColor: '#d9dcdf',
                            borderBottomWidth: 1,
                            fontSize: 14,
                            paddingTop: 13,
                            paddingBottom: 13,
                            marginTop: 12,
                            marginBottom: 20,
                            borderRadius: 1,
                            backgroundColor: '#ffffff'
                        }}
                        placeholder={'Message...'}
                        placeholderTextColor="#66737C"
                        maxHeight={200}
                        minHeight={100}
                        enableScrollToCaret
                        // ref={}
                    />
                </View>
                {customCategoryInput}
                {props.isOwner ? null : (
                    <View
                        style={{
                            flexDirection: 'column',
                            paddingHorizontal: 20,
                            marginVertical: 20,
                            minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
                            maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'Inter',
                                color: '#000000',
                                fontWeight: 'bold'
                            }}
                        >
                            Private
                        </Text>
                        <View
                            style={{
                                backgroundColor: 'white', flexDirection: 'column', alignItems: 'flex-start', paddingTop: 15
                            }}
                        >
                            <Switch
                                value={isPrivate}
                                onValueChange={() => {
                                    setIsPrivate(!isPrivate);
                                }}
                                thumbColor={'#f4f4f6'}
                                    trackColor={{
                                        false: '#f4f4f6',
                                        true: '#006AFF'
                                    }}
                                    style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 1 : 1.2 }, { scaleY: Platform.OS === 'ios' ? 1 : 1.2 }] }}
                            />
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={{
                        backgroundColor: '#006AFF',
                        borderRadius: 19,
                        width: 120,
                        alignSelf: 'center'
                    }}
                    onPress={() => {
                        props.onSend(message, customCategory, isPrivate);
                    }}
                >
                    <Text
                        style={{
                            color: 'white',
                            padding: 10,
                            textAlign: 'center',
                            fontFamily: 'inter'
                        }}
                    >
                        Create
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    // MAIN RETURN

    return (
        <BottomSheet
            isOpen={props.show}
            snapPoints={[0, Dimensions.get('window').height]}
            close={() => {
                props.onClose();
            }}
            title={'New Discussion'}
            renderContent={() => renderNewPostContent()}
            header={true}
            callbackNode={props.callbackNode}
        />
    );
};

export default NewPost;

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        marginSmall: {
            height: 10
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            flexDirection: 'row',
            backgroundColor: 'white',
            lineHeight: 25
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white'
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F'
        }
    });
};
