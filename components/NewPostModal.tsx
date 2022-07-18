// // REACT
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, TextInput, Dimensions, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import Alert from './Alert';
// // COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import BottomSheet from './BottomSheet';
import { TextInput as CustomTextInput } from './CustomTextInput';
import DropDownPicker from 'react-native-dropdown-picker';
import { getDropdownHeight } from '../helpers/DropdownHeight';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { handleFile } from '../helpers/FileUpload';
import { handleImageUpload } from '../helpers/ImageUpload';
import ColorPicker from './ColorPicker';
import { EmojiView, InsertLink } from './ToolbarComponents';
import Reanimated from 'react-native-reanimated';
import { disableEmailId } from '../constants/zoomCredentials';
import { useAppContext } from '../contexts/AppContext';

const emojiIcon = require('../assets/images/emojiIcon.png');
const importIcon = require('../assets/images/importIcon.png');

const customFontFamily = `@font-face {
        font-family: 'Overpass';
        src: url('https://cues-files.s3.amazonaws.com/fonts/Omnes-Pro-Regular.otf'); 
   }`;
const NewPost: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user } = useAppContext();

    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [editorFocus, setEditorFocus] = useState(false);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
    const [foreColorVisible, setForeColorVisible] = useState(false);
    const [hiliteColor, setHiliteColor] = useState('#ffffff');
    const [foreColor, setForeColor] = useState('#000000');
    const [insertLinkVisible, setInsertLinkVisible] = useState(false);
    const [insertImageVisible, setInsertImageVisible] = useState(false);

    const [title, setTitle] = useState('');
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);

    const RichText: any = useRef(null);
    const scrollRef: any = useRef();
    const [height, setHeight] = useState(100);

    const styles = styleObject();

    useEffect(() => {
        if (Dimensions.get('window').width >= 768) {
            props.setHideNavbarDiscussions(editorFocus);
        }
    }, [editorFocus]);

    useEffect(() => {
        if (RichText && RichText.current) RichText.current?.setFontName('Overpass');
    }, [RichText, RichText.current]);

    // EDITOR METHODS

    useEffect(() => {
        changeForeColor(foreColor);
    }, [foreColor]);

    useEffect(() => {
        changeHiliteColor(hiliteColor);
    }, [hiliteColor]);

    const handleUploadFile = useCallback(async () => {
        const res = await handleFile(false, userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);

        setUploadResult(res.url, res.type, res.name);
    }, [RichText, RichText.current]);

    const handleUploadAudioVideo = useCallback(async () => {
        const res = await handleFile(true, userId);

        if (!res || res.url === '' || res.type === '') {
            return;
        }

        setEditorFocus(false);

        setUploadResult(res.url, res.type, res.name);
    }, [RichText, RichText.current, userId]);

    console.log('Attachments', attachments);

    const setUploadResult = useCallback(
        (uploadURL: string, uploadType: string, updloadName: string) => {
            const updatedAttachments: any[] = [...attachments];

            updatedAttachments.push({
                url: uploadURL,
                type: uploadType,
                name: updloadName,
            });

            setAttachments(updatedAttachments);
        },
        [attachments]
    );

    const changeForeColor = useCallback(
        (h: any) => {
            RichText.current?.setForeColor(h);

            setForeColorVisible(false);
        },
        [foreColor, RichText, RichText.current]
    );

    const changeHiliteColor = useCallback(
        (h: any) => {
            RichText.current?.setHiliteColor(h);

            setHiliteColorVisible(false);
        },
        [hiliteColor, RichText, RichText.current]
    );

    /**
     * @description Height for editor
     */
    const handleHeightChange = useCallback((h: any) => {
        setHeight(h);
    }, []);

    const handleCursorPosition = useCallback(
        (scrollY: any) => {
            // Positioning scroll bar
            scrollRef.current.scrollTo({ y: scrollY - 30, animated: true });
        },
        [scrollRef, scrollRef.current]
    );

    const insertEmoji = useCallback(
        (emoji) => {
            RichText.current?.insertText(emoji);
        },
        [RichText, RichText.current]
    );

    const handleEmoji = useCallback(() => {
        Keyboard.dismiss();
        // RichText.current?.blurContentEditor();
        setEmojiVisible(!emojiVisible);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, emojiVisible]);

    const handleHiliteColor = useCallback(() => {
        Keyboard.dismiss();
        setHiliteColorVisible(!hiliteColorVisible);
        setForeColorVisible(false);
        setEmojiVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, hiliteColorVisible]);

    const handleForeColor = useCallback(() => {
        Keyboard.dismiss();
        setForeColorVisible(!foreColorVisible);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertImageVisible(false);
        setInsertLinkVisible(false);
    }, [RichText, RichText.current, foreColorVisible]);

    const handleAddImage = useCallback(() => {
        setInsertImageVisible(true);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
        setInsertLinkVisible(false);
    }, []);

    const uploadImageHandler = useCallback(
        async (takePhoto: boolean) => {
            const url = await handleImageUpload(takePhoto, userId);

            RichText.current?.focusContentEditor();

            RichText.current?.insertHTML('<div><br/></div>');

            RichText.current?.insertImage(url, 'width:300px');

            RichText.current?.insertHTML('<div><br/></div>');

            setInsertImageVisible(false);
        },
        [RichText, RichText.current, userId]
    );

    const handleInsertLink = useCallback(() => {
        setInsertLinkVisible(true);
        setInsertImageVisible(false);
        setForeColorVisible(false);
        setHiliteColorVisible(false);
        setEmojiVisible(false);
    }, [RichText, RichText.current]);

    const onInsertLink = useCallback(
        (title, link) => {
            RichText.current?.insertLink(title, link);

            Keyboard.dismiss();
            setInsertLinkVisible(false);
        },
        [RichText, RichText.current]
    );

    /**
     * @description Renders option to select Category for new discussion post
     */
    const customCategoryInput = (
        <View style={{ backgroundColor: '#ffffff', width: '100%' }}>
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
                                            borderColor: '#ccc',
                                            borderWidth: 1,
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
                                            borderWidth: 1,
                                            borderColor: '#ccc',
                                            borderRadius: 0,
                                            height: 45,
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
                                            fontSize: Dimensions.get('window').width < 768 ? 14 : 16,
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
            // <View style={{ flex: 1, height: '100%' }}>
            <View
                style={{
                    height: '100%',
                    maxHeight: '100%',
                    flex: 1,
                }}
            >
                {editorFocus ? null : (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            position: 'relative',
                            justifyContent: 'center',
                            marginBottom: 30,
                            marginTop: 10,
                            paddingHorizontal: 10,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                position: 'absolute',
                                left: 10,
                            }}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>
                                <Ionicons size={35} name="chevron-back-outline" color="#1f1f1f" />
                            </Text>
                        </TouchableOpacity>
                        <Text
                            style={{
                                paddingTop: 5,
                                fontSize: 22,
                                fontFamily: 'inter',
                            }}
                        >
                            New Post
                        </Text>
                    </View>
                )}
                <ScrollView
                    style={{
                        backgroundColor: '#ffffff',
                        width: '100%',
                        maxHeight: editorFocus ? '100%' : 'auto',
                    }}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        paddingHorizontal: 10,
                        paddingBottom: editorFocus ? 0 : Dimensions.get('window').width < 768 ? 50 : 100,
                        maxHeight: editorFocus ? '100%' : 'auto',
                    }}
                    indicatorStyle="black"
                >
                    {/* <View
                    style={{
                        maxHeight: '100%',
                        paddingHorizontal: editorFocus ? 0 : 20,
                        overflow: editorFocus ? 'hidden' : 'scroll',
                    }}
                > */}
                    <View
                        style={{
                            width: '100%',
                            overflow: editorFocus ? 'hidden' : 'scroll',
                        }}
                    >
                        {/* TITLE */}
                        {editorFocus ? null : (
                            <CustomTextInput
                                value={title}
                                // style={{
                                //     fontFamily: 'overpass',
                                //     width: '100%',
                                //     borderWidth: 1,
                                //     borderColor: '#cccccc',
                                //     // borderBottom: '1px solid #f2f2f2',
                                //     fontSize: 15,
                                //     // paddingVertical: 20,
                                //     paddingLeft: 10,
                                //     marginTop: 12,
                                //     marginBottom: 25,
                                //     borderRadius: 2,
                                //     height: 35,
                                //     color: '#000',
                                // }}
                                // minRows={1}
                                placeholder={'Title'}
                                onChangeText={(text: any) => setTitle(text)}
                                placeholderTextColor={'#797979'}
                            />
                        )}

                        {/* CONTENT */}
                        <View
                            style={{
                                borderWidth: editorFocus ? 0 : 1,
                                borderColor: '#ccc',
                                height: editorFocus ? '100%' : 300,
                            }}
                        >
                            <RichToolbar
                                style={{
                                    borderColor: '#f2f2f2',
                                    borderBottomWidth: 1,
                                    backgroundColor: '#fff',
                                    display: editorFocus ? 'flex' : 'none',
                                    maxHeight: 40,
                                    height: 40,
                                }}
                                flatContainerStyle={{
                                    paddingHorizontal: 12,
                                }}
                                editor={RichText}
                                disabled={false}
                                selectedIconTint={'#000'}
                                disabledIconTint={'#bfbfbf'}
                                actions={[
                                    actions.keyboard,
                                    'insertFile',
                                    actions.insertImage,
                                    actions.insertVideo,
                                    actions.insertLink,
                                    actions.insertBulletsList,
                                    actions.insertOrderedList,
                                    actions.checkboxList,
                                    actions.alignLeft,
                                    actions.alignCenter,
                                    actions.alignRight,
                                    actions.blockquote,
                                    actions.code,
                                    actions.line,
                                    // 'insertEmoji'
                                ]}
                                iconMap={{
                                    [actions.keyboard]: ({ tintColor }) => (
                                        <Text style={[styles.tib, { color: 'green', fontSize: 20 }]}>✓</Text>
                                    ),
                                    insertFile: importIcon,
                                    insertEmoji: emojiIcon,
                                }}
                                insertEmoji={handleEmoji}
                                insertFile={handleUploadFile}
                                insertVideo={handleUploadAudioVideo}
                                onPressAddImage={handleAddImage}
                                onInsertLink={handleInsertLink}
                            />
                            <ScrollView
                                horizontal={false}
                                style={{
                                    backgroundColor: '#fff',
                                    // maxHeight: editorFocus ? 340 : 'auto',
                                    height: '100%',
                                }}
                                keyboardDismissMode={'none'}
                                nestedScrollEnabled={true}
                                scrollEventThrottle={20}
                                indicatorStyle={'black'}
                                showsHorizontalScrollIndicator={true}
                                persistentScrollbar={true}
                                ref={scrollRef}
                            >
                                <RichEditor
                                    initialFocus={false}
                                    ref={RichText}
                                    useContainer={true}
                                    style={{
                                        width: '100%',
                                        // paddingHorizontal: 10,
                                        backgroundColor: '#fff',
                                        // borderRadius: 15,
                                        display: 'flex',
                                        // borderTopWidth: 1,
                                        // borderColor: '#f2f2f2',
                                        flex: 1,
                                        height: '100%',
                                        // minHeight: 200,
                                    }}
                                    editorStyle={{
                                        backgroundColor: '#fff',
                                        placeholderColor: '#a2a2ac',
                                        color: '#2f2f3c',
                                        cssText: customFontFamily,
                                        initialCSSText: customFontFamily,
                                        contentCSSText: 'font-size: 16px; min-height: 400px; font-family: Overpass;',
                                        // initialCSSText: 'font-size: 16px; min-height: 400px; font-family: Overpass;',
                                    }}
                                    initialContentHTML={html}
                                    initialHeight={400}
                                    onScroll={() => Keyboard.dismiss()}
                                    placeholder={'Content'}
                                    onChange={(text) => {
                                        const modifedText = text.split('&amp;').join('&');
                                        setHtml(modifedText);
                                    }}
                                    onHeightChange={handleHeightChange}
                                    onFocus={() => {
                                        setEditorFocus(true);
                                    }}
                                    onBlur={() => {
                                        setEditorFocus(false);
                                    }}
                                    allowFileAccess={true}
                                    allowFileAccessFromFileURLs={true}
                                    allowUniversalAccessFromFileURLs={true}
                                    allowsFullscreenVideo={true}
                                    allowsInlineMediaPlayback={true}
                                    allowsLinkPreview={true}
                                    allowsBackForwardNavigationGestures={true}
                                    onCursorPosition={handleCursorPosition}
                                    editorInitializedCallback={() => {
                                        RichText.current.setFontName('Overpass');
                                    }}
                                />
                            </ScrollView>

                            <RichToolbar
                                style={{
                                    borderColor: '#f2f2f2',
                                    borderTopWidth: 1,
                                    backgroundColor: '#fff',
                                    display: editorFocus ? 'flex' : 'none',
                                }}
                                flatContainerStyle={{
                                    paddingHorizontal: 12,
                                }}
                                editor={RichText}
                                disabled={false}
                                // iconTint={color}
                                selectedIconTint={'#000'}
                                disabledIconTint={'#bfbfbf'}
                                // onPressAddImage={that.onPressAddImage}
                                // iconSize={24}
                                // iconGap={10}
                                actions={[
                                    actions.undo,
                                    actions.redo,
                                    actions.setBold,
                                    actions.setItalic,
                                    actions.setUnderline,
                                    actions.setStrikethrough,
                                    actions.heading1,
                                    actions.heading3,
                                    actions.setParagraph,
                                    actions.foreColor,
                                    actions.hiliteColor,
                                    actions.setSuperscript,
                                    actions.setSubscript,
                                    // actions.removeFormat
                                    // Insert stuff
                                    // 'insertHTML',
                                    // 'fontSize'
                                ]} // default defaultActions
                                iconMap={{
                                    [actions.heading1]: ({ tintColor }) => (
                                        <Text
                                            style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}
                                        >
                                            H1
                                        </Text>
                                    ),
                                    [actions.heading3]: ({ tintColor }) => (
                                        <Text
                                            style={[
                                                styles.tib,
                                                {
                                                    color: tintColor,
                                                    fontSize: 19,
                                                    paddingBottom: 1,
                                                },
                                            ]}
                                        >
                                            H3
                                        </Text>
                                    ),
                                    [actions.setParagraph]: ({ tintColor }) => (
                                        <Text
                                            style={[styles.tib, { color: tintColor, fontSize: 19, paddingBottom: 1 }]}
                                        >
                                            p
                                        </Text>
                                    ),
                                    [actions.foreColor]: ({ tintColor }) => (
                                        <Text
                                            style={{
                                                fontSize: 19,
                                                fontWeight: 'bold',
                                                color: 'red',
                                            }}
                                        >
                                            A
                                        </Text>
                                    ),
                                    [actions.hiliteColor]: ({ tintColor }) => (
                                        <Text
                                            style={{
                                                color: 'black',
                                                fontSize: 19,
                                                backgroundColor: '#ffc701',
                                                paddingHorizontal: 2,
                                            }}
                                        >
                                            H
                                        </Text>
                                    ),
                                }}
                                hiliteColor={handleHiliteColor}
                                foreColor={handleForeColor}
                                // removeFormat={handleRemoveFormat}
                            />

                            {/* </KeyboardAvoidingView> */}
                        </View>
                    </View>

                    {/* Render attachments */}
                    {attachments.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                width: '100%',
                                maxWidth: 750,
                                marginVertical: 20,
                                paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Overpass',
                                    marginBottom: 20,
                                }}
                            >
                                Attachments
                            </Text>
                            {attachments.map((file: any, ind: number) => {
                                return (
                                    <View
                                        key={ind.toString()}
                                        style={{
                                            width: '100%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: '#cccccc',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 2,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name="attach-outline" size={24} color="#000" />
                                        <Text
                                            style={{
                                                paddingLeft: 10,
                                                fontSize: 15,
                                                fontFamily: 'Overpass',
                                                maxWidth: '80%',
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            onPress={() => {
                                                const updateAttachments = [...attachments];
                                                updateAttachments.splice(ind, 1);
                                                setAttachments(updateAttachments);
                                            }}
                                        >
                                            <Text>
                                                <Ionicons
                                                    name="close-outline"
                                                    style={{
                                                        marginLeft: 'auto',
                                                    }}
                                                    size={21}
                                                />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    {editorFocus ? null : customCategoryInput}

                    {editorFocus || props.isOwner ? null : (
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 40,
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'column',
                                    backgroundColor: '#ffffff',
                                    marginRight: 50,
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
                                            true: '#000',
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

                            <View
                                style={{
                                    flexDirection: 'column',
                                    backgroundColor: '#ffffff',
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
                                    Anonymous
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
                                        value={anonymous}
                                        onValueChange={() => {
                                            setAnonymous(!anonymous);
                                        }}
                                        thumbColor={'#f4f4f6'}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#000',
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
                        </View>
                    )}

                    {editorFocus ? null : (
                        <TouchableOpacity
                            style={{
                                marginTop: 50,
                                marginBottom: 50,
                                backgroundColor: 'white',
                                // overflow: 'hidden',
                                // height: 35,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={() => {
                                if (title === '') {
                                    Alert('Enter a title.');
                                    return;
                                }

                                if (html === '') {
                                    Alert('Content cannot be empty.');
                                    return;
                                }

                                props.onSend(
                                    title,
                                    JSON.stringify({
                                        html,
                                        attachments,
                                    }),
                                    customCategory,
                                    isPrivate,
                                    anonymous
                                );
                            }}
                            disabled={user.email === disableEmailId}
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
                                    width: 120,
                                }}
                            >
                                Create
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
                {/* </View> */}

                {/* Editor Modals */}
                {emojiVisible && (
                    <BottomSheet
                        snapPoints={[0, 350]}
                        close={() => {
                            setEmojiVisible(false);
                        }}
                        isOpen={emojiVisible}
                        title={'Select emoji'}
                        renderContent={() => <EmojiView onSelect={insertEmoji} />}
                        header={false}
                    />
                )}
                {insertImageVisible && (
                    <BottomSheet
                        snapPoints={[0, 200]}
                        close={() => {
                            setInsertImageVisible(false);
                        }}
                        isOpen={insertImageVisible}
                        title={'Insert image'}
                        renderContent={() => (
                            <View style={{ paddingHorizontal: 10, zIndex: 10000 }}>
                                <TouchableOpacity
                                    style={{
                                        marginTop: 10,
                                        alignSelf: 'center',
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#000',
                                        paddingHorizontal: 24,
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        width: 150,
                                    }}
                                    onPress={() => {
                                        uploadImageHandler(true);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontSize: 11,
                                            fontFamily: 'inter',
                                            textTransform: 'uppercase',
                                            paddingLeft: 4,
                                        }}
                                    >
                                        {' '}
                                        Camera{' '}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        marginTop: 15,
                                        alignSelf: 'center',
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#000',
                                        paddingHorizontal: 24,
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        width: 150,
                                    }}
                                    onPress={() => {
                                        uploadImageHandler(false);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontSize: 11,
                                            fontFamily: 'inter',
                                            textTransform: 'uppercase',
                                            paddingLeft: 4,
                                        }}
                                    >
                                        {' '}
                                        Gallery{' '}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        header={false}
                    />
                )}
                {insertLinkVisible && (
                    <BottomSheet
                        snapPoints={[0, 350]}
                        close={() => {
                            setInsertLinkVisible(false);
                        }}
                        isOpen={insertLinkVisible}
                        title={'Insert Link'}
                        renderContent={() => <InsertLink onInsertLink={onInsertLink} />}
                        header={false}
                    />
                )}
                {hiliteColorVisible && (
                    <BottomSheet
                        snapPoints={[0, 350]}
                        close={() => {
                            setHiliteColorVisible(false);
                        }}
                        isOpen={hiliteColorVisible}
                        title={'Highlight color'}
                        renderContent={() => (
                            <View
                                style={{
                                    paddingHorizontal: 10,
                                    paddingTop: 20,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    zIndex: 10000,
                                }}
                            >
                                <ColorPicker
                                    editorColors={true}
                                    color={hiliteColor}
                                    onChange={(color: string) => setHiliteColor(color)}
                                />
                                <TouchableOpacity
                                    style={{
                                        marginTop: 10,
                                    }}
                                    onPress={() => setHiliteColor('#ffffff')}
                                    disabled={hiliteColor === '#ffffff'}
                                >
                                    <Text
                                        style={{
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            lineHeight: 34,
                                            color: '#000',
                                        }}
                                    >
                                        {' '}
                                        Remove{' '}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        header={false}
                    />
                )}
                {foreColorVisible && (
                    <BottomSheet
                        snapPoints={[0, 350]}
                        close={() => {
                            setForeColorVisible(false);
                        }}
                        isOpen={foreColorVisible}
                        title={'Text color'}
                        renderContent={() => (
                            <View
                                style={{
                                    paddingHorizontal: 10,
                                    paddingTop: 20,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    zIndex: 10000,
                                }}
                            >
                                <ColorPicker
                                    editorColors={true}
                                    color={foreColor}
                                    onChange={(color: string) => setForeColor(color)}
                                />
                                <TouchableOpacity
                                    style={{
                                        marginTop: 10,
                                    }}
                                    onPress={() => setForeColor('#000000')}
                                    disabled={foreColor === '#000000'}
                                >
                                    <Text
                                        style={{
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            lineHeight: 34,
                                            color: '#000',
                                        }}
                                    >
                                        {' '}
                                        Remove{' '}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        header={false}
                    />
                )}

                {emojiVisible || insertImageVisible || insertLinkVisible || hiliteColorVisible || foreColorVisible ? (
                    <Reanimated.View
                        style={{
                            alignItems: 'center',
                            backgroundColor: 'black',
                            opacity: 0.3,
                            height: '100%',
                            top: 0,
                            left: 0,
                            width: '100%',
                            position: 'absolute',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'transparent',
                                width: '100%',
                                height: '100%',
                            }}
                            onPress={() => {
                                setEmojiVisible(false);
                                setInsertImageVisible(false);
                                setInsertLinkVisible(false);
                                setHiliteColorVisible(false);
                                setForeColorVisible(false);
                            }}
                        ></TouchableOpacity>
                    </Reanimated.View>
                ) : null}
            </View>
        );
    };

    // MAIN RETURN

    return renderNewPostContent();
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
            flex: 1,
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
