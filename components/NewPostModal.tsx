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
import { useOrientation } from '../hooks/useOrientation';

const NewPost: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [message, setMessage] = useState('');
    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    // const [dropdownHeight, setDropdownHeight] = useState(250);

    const orientation = useOrientation();

    const styles = styleObject();

    const width = Dimensions.get('window').width;

    /**
     * @description Renders option to select Category for new discussion post
     */
    const customCategoryInput = (
        <View style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: 600 }}>
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    borderColor: '#f2f2f2',
                }}
            >
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flexDirection: 'column',
                        paddingTop: 30,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingBottom: 15,
                            backgroundColor: 'white',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Category
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: 'white',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <View
                            style={{
                                width: '90%',
                                backgroundColor: 'white',
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
                                            width: '100%',
                                        }}
                                        placeholder={'Enter Category'}
                                        onChangeText={(val) => {
                                            setCustomCategory(val);
                                        }}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                            ) : (
                                <View
                                    style={{
                                        height: isCategoryDropdownOpen
                                            ? getDropdownHeight(props.categoriesOptions.length)
                                            : 50,
                                        marginBottom: 10,
                                        zIndex: isCategoryDropdownOpen ? 1 : 0,
                                    }}
                                >
                                    <DropDownPicker
                                        listMode={Platform.OS === 'android' ? 'MODAL' : 'SCROLLVIEW'}
                                        open={isCategoryDropdownOpen}
                                        value={customCategory}
                                        items={props.categoriesOptions}
                                        setOpen={setIsCategoryDropdownOpen}
                                        setValue={setCustomCategory}
                                        // zIndex={1000001}
                                        style={{
                                            borderWidth: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f2f2f2',
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        dropDownContainerStyle={{
                                            borderWidth: 0,
                                            // elevation: !showFrequencyDropdown ? 0 : 2
                                        }}
                                        containerStyle={{
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 1,
                                                height: 3,
                                            },
                                            shadowOpacity: !isCategoryDropdownOpen ? 0 : 0.08,
                                            shadowRadius: 12,
                                        }}
                                        textStyle={{
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 15,
                                            fontFamily: 'overpass',
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                        <View
                            style={{
                                backgroundColor: 'white',
                                marginLeft: 'auto',
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
                                        paddingTop: 15,
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
            <ScrollView
                style={{
                    backgroundColor: '#ffffff',
                    width: '100%',
                }}
                scrollEnabled={false}
                contentContainerStyle={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    paddingHorizontal: 20,
                    marginTop: orientation === 'PORTRAIT' && width > 768 ? 50 : 0,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 600,
                    }}
                >
                    <AutoGrowingTextInput
                        value={message}
                        onChange={(event: any) => setMessage(event.nativeEvent.text || '')}
                        style={{
                            fontFamily: 'overpass',
                            width: '100%',
                            maxWidth: 600,
                            borderBottomColor: '#f2f2f2',
                            borderBottomWidth: 1,
                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
                            paddingTop: 13,
                            paddingBottom: 13,
                            marginTop: 12,
                            marginBottom: 20,
                            borderRadius: 1,
                            backgroundColor: '#ffffff',
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
                            backgroundColor: '#ffffff',
                            width: '100%',
                            maxWidth: 600,
                            marginTop: 40,
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
                            Private
                        </Text>
                        <View
                            style={{
                                backgroundColor: 'white',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                paddingTop: 15,
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
                                    true: '#007AFF',
                                }}
                                style={{
                                    transform: [
                                        { scaleX: Platform.OS === 'ios' ? 1 : 1.2 },
                                        { scaleY: Platform.OS === 'ios' ? 1 : 1.2 },
                                    ],
                                }}
                            />
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={{
                        backgroundColor: '#007AFF',
                        borderRadius: 19,
                        width: 120,
                        alignSelf: 'center',
                        marginTop: 50,
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
                            fontFamily: 'inter',
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
            flex: 1,
        },
        marginSmall: {
            height: 10,
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white',
        },
        colorBar: {
            width: '100%',
            flexDirection: 'row',
            backgroundColor: 'white',
            lineHeight: 25,
        },
        channelOption: {
            width: '33.333%',
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        cusCategory: {
            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F',
        },
    });
};
