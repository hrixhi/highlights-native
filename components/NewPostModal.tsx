// // REACT
// import React, { useState } from 'react';
// import { StyleSheet, Switch, TextInput, Dimensions } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // COMPONENTS
// import { View, Text, TouchableOpacity } from './Themed';
// import { Popup } from '@mobiscroll/react';
// import TextareaAutosize from 'react-textarea-autosize';
// import { Select } from '@mobiscroll/react';

// const NewPost: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
//     const [message, setMessage] = useState('');
//     const [customCategory, setCustomCategory] = useState('None');
//     const [addCustomCategory, setAddCustomCategory] = useState(false);
//     const [isPrivate, setIsPrivate] = useState(false);
//     const styles = styleObject();

//     /**
//      * @description Renders option to select Category for new discussion post
//      */
//     const customCategoryInput = (
//         <View style={{ backgroundColor: '#f2f2f7', marginVertical: 20, paddingHorizontal: 20 }}>
//             <View style={{ flexDirection: 'column', backgroundColor: '#f2f2f7' }}>
//                 <Text style={{ fontSize: 11, textTransform: 'uppercase', fontFamily: 'overpass' }}>CATEGORY</Text>
//                 <View
//                     style={{
//                         width: '100%',
//                         flexDirection: 'row',
//                         backgroundColor: '#f2f2f7',
//                         alignItems: 'center',
//                         marginTop: 10
//                     }}>
//                     <View style={{ backgroundColor: '#f2f2f7', marginRight: 10 }}>
//                         {addCustomCategory ? (
//                             <View style={styles.colorBar}>
//                                 <TextInput
//                                     value={customCategory}
//                                     style={{
//                                         borderRadius: 0,
//                                         borderColor: '#f2f2f7',
//                                         borderBottomWidth: 1,
//                                         fontSize: 14,
//                                         height: '2.75em',
//                                         padding: '1em'
//                                     }}
//                                     placeholder={'Enter Category'}
//                                     onChangeText={val => {
//                                         setCustomCategory(val);
//                                     }}
//                                     placeholderTextColor={'#1F1F1F'}
//                                 />
//                             </View>
//                         ) : (
//                             <label style={{ width: 180, backgroundColor: 'white' }}>
//                                 <Select
//                                     themeVariant="light"
//                                     touchUi={true}
//                                     onChange={(val: any) => {
//                                         setCustomCategory(val.value);
//                                     }}
//                                     responsive={{
//                                         small: {
//                                             display: 'bubble'
//                                         },
//                                         medium: {
//                                             touchUi: false
//                                         }
//                                     }}
//                                     value={customCategory}
//                                     rows={props.categories.length + 1}
//                                     data={props.categoriesOptions}
//                                 />
//                             </label>
//                         )}
//                     </View>
//                     <View style={{ backgroundColor: '#f2f2f7' }}>
//                         <TouchableOpacity
//                             onPress={() => {
//                                 if (addCustomCategory) {
//                                     setCustomCategory('None');
//                                     setAddCustomCategory(false);
//                                 } else {
//                                     setCustomCategory('');
//                                     setAddCustomCategory(true);
//                                 }
//                             }}
//                             style={{ backgroundColor: '#f2f2f7' }}>
//                             <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
//                                 <Ionicons
//                                     name={addCustomCategory ? 'close' : 'create-outline'}
//                                     size={18}
//                                     color={'#1F1F1F'}
//                                 />
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </View>
//     );

//     // MAIN RETURN

//     return (
//         <Popup
//             isOpen={props.show}
//             buttons={[
//                 {
//                     text: 'SEND',
//                     handler: function(event) {
//                         props.onSend(message, customCategory, isPrivate);
//                     }
//                 },
//                 {
//                     text: 'CANCEL',
//                     handler: function(event) {
//                         props.onClose();
//                     }
//                 }
//             ]}
//             theme="ios"
//             themeVariant="light"
//             onClose={() => props.onClose()}
//             responsive={{
//                 small: {
//                     display: 'bottom'
//                 },
//                 medium: {
//                     // Custom breakpoint
//                     display: 'center'
//                 }
//             }}>
//             <View
//                 style={{
//                     flexDirection: 'column',
//                     paddingHorizontal: 20,
//                     marginVertical: 20,
//                     minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
//                     maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
//                     backgroundColor: '#f2f2f7'
//                 }}>
//                 <Text
//                     style={{
//                         fontSize: 13,
//                         textTransform: 'uppercase',
//                         fontFamily: 'inter'
//                     }}>
//                     NEW POST
//                 </Text>
//                 <TextareaAutosize
//                     value={message}
//                     placeholder="Message..."
//                     minRows={3}
//                     style={{
//                         fontFamily: 'overpass',
//                         marginTop: 20,
//                         fontSize: 14,
//                         borderRadius: 1,
//                         padding: 12,
//                         width: '100%',
//                         maxWidth: '100%',
//                         borderBottom: '1px solid #f2f2f7'
//                     }}
//                     onChange={(e: any) => {
//                         setMessage(e.target.value);
//                     }}
//                 />
//             </View>
//             {customCategoryInput}
//             {props.isOwner ? null : (
//                 <View
//                     style={{
//                         flexDirection: 'column',
//                         paddingHorizontal: 20,
//                         marginVertical: 20,
//                         minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
//                         maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
//                         backgroundColor: '#f2f2f7'
//                     }}>
//                     <Text
//                         style={{
//                             fontSize: 11,
//                             textTransform: 'uppercase',
//                             fontFamily: 'overpass'
//                         }}>
//                         PRIVATE
//                     </Text>
//                     <View
//                         style={{
//                             backgroundColor: '#f2f2f7',
//                             height: 40,
//                             marginRight: 10,
//                             marginTop: 10
//                         }}>
//                         <Switch
//                             value={isPrivate}
//                             onValueChange={() => {
//                                 setIsPrivate(!isPrivate);
//                             }}
//                             style={{ height: 20 }}
//                             trackColor={{
//                                 false: '#F8F9FA',
//                                 true: '#006AFF'
//                             }}
//                             activeThumbColor="white"
//                         />
//                     </View>
//                 </View>
//             )}
//         </Popup>
//     );
// };

// export default NewPost;

// const styleObject = () => {
//     return StyleSheet.create({
//         screen: {
//             flex: 1
//         },
//         marginSmall: {
//             height: 10
//         },
//         row: {
//             flexDirection: 'row',
//             display: 'flex',
//             width: '100%',
//             backgroundColor: 'white'
//         },
//         col: {
//             width: '100%',
//             height: 70,
//             marginBottom: 15,
//             backgroundColor: 'white'
//         },
//         colorBar: {
//             width: '100%',
//             height: '10%',
//             flexDirection: 'row'
//         },
//         channelOption: {
//             width: '33.333%'
//         },
//         channelText: {
//             textAlign: 'center',
//             overflow: 'hidden'
//         },
//         cusCategory: {
//             fontSize: 14,
//             backgroundColor: 'white',
//             paddingHorizontal: 10,
//             height: 22
//         },
//         cusCategoryOutline: {
//             fontSize: 14,
//             backgroundColor: 'white',
//             paddingHorizontal: 10,
//             height: 22,
//             borderRadius: 1,
//             borderWidth: 1,
//             borderColor: '#1F1F1F',
//             color: 'white'
//         },
//         allOutline: {
//             fontSize: 12,
//             color: '#1F1F1F',
//             height: 22,
//             paddingHorizontal: 10,
//             backgroundColor: 'white',
//             borderRadius: 12,
//             borderWidth: 1,
//             borderColor: '#1F1F1F'
//         }
//     });
// };
