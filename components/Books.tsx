// REACT
import React, { useCallback, useState } from 'react';
import { Image, ActivityIndicator, Dimensions, ScrollView, TextInput as DefaultInput } from 'react-native';
import _ from 'lodash';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import { retrievePDFFromArchive } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, TouchableOpacity, View } from './Themed';
import { TextInput } from './CustomTextInput';
import alert from './Alert';
// import { Popup } from '@mobiscroll/react5';
// import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import BottomSheet from './BottomSheet';
import Reanimated from 'react-native-reanimated';

const Books: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchComplete, setSearchComplete] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [retrievingBook, setRetrievingBook] = useState<any>('');

    const fall = new Reanimated.Value(1);

    const animatedShadowOpacity = Reanimated.interpolateNode(fall, {
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    // HOOKS

    /**
     * @description Fetches results for Search term
     */
    const handleSearch = useCallback(() => {
        if (!searchTerm || searchTerm === '') {
            alert('Enter search input.');
            return;
        }
        // make request here...
        (async () => {
            setLoading(true);
            setSearchComplete(false);
            const url =
                'https://archive.org/services/search/v1/scrape?fields=title,identifier,mediatype,format,description,downloads,collection&q=';
            const response = await axios.get(
                url + encodeURIComponent(searchTerm) + '&sorts=' + encodeURIComponent('downloads desc') + '&count=1000'
            );
            const items = response.data.items;
            const filteredItems = items.filter((item: any) => {
                if (item.mediatype !== 'texts') {
                    return false;
                }
                let pdfExists = false;
                try {
                    pdfExists =
                        item.format &&
                        item.format.length > 0 &&
                        item.format.find((i: any) => {
                            return i === 'Text PDF';
                        });
                } catch (e) {
                    console.log(item.format);
                }

                let isAvailableForFree = false;

                if (
                    item.collection &&
                    (item.collection.includes('opensource') || item.collection.includes('community'))
                ) {
                    isAvailableForFree = true;
                }

                return pdfExists && isAvailableForFree;
            });
            setResults(filteredItems);
            setSearchComplete(true);
            setLoading(false);
        })();
    }, [searchTerm]);

    /**
     * @description Uploads book to Cloud and retrieves its URL
     */
    const retrieveBook = useCallback(() => {
        setRetrievingBook(true);

        // alert('Retrieving book... Large files may take a while to process');

        const server = fetchAPI('');
        server
            .query({
                query: retrievePDFFromArchive,
                variables: {
                    identifier: selectedBook.identifier,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.cue.retrievePDFFromArchive) {
                    const html = res.data.cue.retrievePDFFromArchive.toString();
                    const prefix = 'href="';
                    const suffix = '.pdf"';
                    const re = new RegExp(prefix + '.*' + suffix, 'i');
                    const matches = html.match(re);
                    let fileName = matches[0].split('.pdf')[0];
                    fileName = fileName.split('"')[fileName.split('"').length - 1];

                    axios
                        .post(`https://api.learnwithcues.com/uploadPdfToS3`, {
                            url: 'https://archive.org/download/' + selectedBook.identifier + '/' + fileName + '.pdf',
                            title: selectedBook.title + '.pdf',
                        })
                        .then((res2: any) => {
                            if (res2.data) {
                                console.log('Upload', res2.data);
                                setRetrievingBook(false);
                                setSelectedBook(null);
                                props.hideBars(false);
                                props.onUpload({
                                    url: res2.data,
                                    title: selectedBook.title,
                                    type: 'pdf',
                                });
                            }
                        })
                        .catch((e) => {
                            setRetrievingBook(false);
                            alert('Could not fetch book.');
                            console.log(e);
                        });
                }
            })
            .catch((e) => {
                setRetrievingBook(false);
                alert('Could not fetch book.');
                console.log(e);
            });
    }, [selectedBook]);

    if (retrievingBook) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} style={{ alignSelf: 'center' }} />
                <Text
                    style={{
                        marginTop: 15,
                        textAlign: 'center',
                        fontSize: 18,
                        fontFamily: 'Inter',
                    }}
                >
                    Retrieving book...
                </Text>
            </View>
        );
    }

    // MAIN RETURN
    return (
        <View
            style={{
                height: '100%',
            }}
        >
            <ScrollView
                contentContainerStyle={{
                    // flex: 1,
                    // height: '100%'
                    // paddingTop: 50,
                    paddingBottom: 150,
                }}
                // style={{ marginBottom: 150 }}
                indicatorStyle="black"
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        alignItems: 'center',
                        maxWidth: 500,
                        marginBottom: 30,
                        backgroundColor: '#fff',
                        paddingHorizontal: 10,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#f8f8f8',
                            paddingVertical: 12,
                            paddingHorizontal: 15,
                            borderRadius: 24,
                            width: Dimensions.get('window').width < 768 ? 'auto' : 300,
                            flex: 1,
                        }}
                    >
                        <Ionicons size={20} name="search-outline" color={'#000'} style={{}} />
                        <DefaultInput
                            value={searchTerm}
                            style={{
                                color: '#727272',
                                backgroundColor: '#f8f8f8',
                                fontSize: 15,
                                flex: 1,
                                fontFamily: 'Inter',
                                paddingLeft: 10,
                                paddingVertical: 5,
                            }}
                            placeholder={'Search title, author, etc.'}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={'#727272'}
                        />
                        {searchTerm !== '' ? (
                            <TouchableOpacity
                                style={{
                                    marginLeft: 'auto',
                                    backgroundColor: '#f8f8f8',
                                    width: 15,
                                }}
                                onPress={() => {
                                    setSearchTerm('');
                                }}
                            >
                                <Ionicons name="close-outline" size={20} color="#000" />
                            </TouchableOpacity>
                        ) : (
                            <View
                                style={{
                                    marginLeft: 'auto',
                                    width: 15,
                                }}
                            />
                        )}
                    </View>
                    <View
                        style={{
                            backgroundColor: '#fff',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                handleSearch();
                            }}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                marginLeft: Dimensions.get('window').width < 768 ? 10 : 30,
                            }}
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
                                SEARCH
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {loading ? (
                    <View
                        style={{
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} style={{ alignSelf: 'center' }} />
                        <Text
                            style={{
                                marginTop: 15,
                                textAlign: 'center',
                                fontSize: 18,
                                fontFamily: 'Inter',
                            }}
                        >
                            Fetching results...
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {results.length === 0 ? (
                            !searchComplete ? (
                                <Text
                                    style={{
                                        width: '100%',
                                        color: '#393939',
                                        textAlign: 'center',
                                        fontSize: 24,
                                        paddingTop: 50,
                                        paddingBottom: 50,
                                        paddingHorizontal: 20,
                                        fontFamily: 'inter',
                                        flex: 1,
                                    }}
                                >
                                    {/* Browse through over 5 million books & texts */}
                                </Text>
                            ) : (
                                <Text
                                    style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: 24,
                                        color: '#1f1f1f',
                                        paddingTop: 50,
                                        paddingBottom: 50,
                                        paddingHorizontal: 5,
                                        fontFamily: 'inter',
                                        flex: 1,
                                    }}
                                >
                                    No results found
                                </Text>
                            )
                        ) : (
                            results.map((result: any, index) => {
                                if (index >= (page - 1) * 100 && index < page * 100) {
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedBook(result);
                                                // Open the popup that has detailed information
                                                props.hideBars(true);
                                            }}
                                            style={{
                                                width: 125,
                                                height: 275,
                                                marginBottom: 30,
                                                marginHorizontal: 25,
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    height: 175,
                                                    width: 125,
                                                    shadowOffset: {
                                                        width: 2,
                                                        height: 2,
                                                    },
                                                    overflow: 'hidden',
                                                    shadowOpacity: 0.07,
                                                    shadowRadius: 7,
                                                    zIndex: 500000,
                                                    // borderWidth: 1,
                                                }}
                                            >
                                                <Image
                                                    style={{
                                                        height: 175,
                                                        width: 125,
                                                        // borderWidth: 1,
                                                    }}
                                                    source={{
                                                        uri: 'https://archive.org/services/img/' + result.identifier,
                                                    }}
                                                />
                                            </View>
                                            <Text
                                                ellipsizeMode="tail"
                                                style={{
                                                    padding: 5,
                                                    fontSize: 12,
                                                    fontFamily: 'inter',
                                                    backgroundColor: '#fff',
                                                    height: 75,
                                                    paddingTop: 10,
                                                }}
                                            >
                                                {result.title}
                                            </Text>
                                            <Text
                                                ellipsizeMode="tail"
                                                style={{
                                                    bottom: 0,
                                                    padding: 5,
                                                    height: 25,
                                                    paddingBottom: 10,
                                                    fontSize: 12,
                                                    fontFamily: 'inter',
                                                    backgroundColor: '#fff',
                                                    color: '#0061ff',
                                                }}
                                            >
                                                <Ionicons name="bookmark-outline" /> {result.downloads}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }
                            })
                        )}
                    </View>
                )}
                {results.length <= 100 || loading ? null : (
                    <View
                        style={{
                            justifyContent: 'center',
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 25,
                            marginBottom: 50,
                            paddingHorizontal: 20,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setPage(page <= 0 ? 0 : page - 1);
                            }}
                        >
                            <Text>
                                <Ionicons name="arrow-back-circle-outline" size={30} color="#007AFF" />
                            </Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'inter',
                                }}
                            >
                                {page}/{Math.floor(results.length / 100)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setPage(page * 100 > results.length ? page : page + 1);
                            }}
                        >
                            <Text>
                                <Ionicons name="arrow-forward-circle-outline" size={30} color="#007AFF" />
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            {selectedBook && !retrievingBook ? (
                <BottomSheet
                    snapPoints={[0, 600]}
                    close={() => {
                        if (retrievingBook) {
                            return;
                        }
                        setSelectedBook(null);
                        props.hideBars(false);
                    }}
                    header={false}
                    isOpen={selectedBook !== null && !retrievingBook}
                    title={selectedBook ? selectedBook.title : ''}
                    callbackNode={fall}
                    renderContent={() => (
                        <View>
                            {selectedBook ? (
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        padding: 25,
                                        backgroundColor: 'none',
                                        alignItems: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            height: 200,
                                            width: 175,
                                            shadowOffset: {
                                                width: 2,
                                                height: 2,
                                            },
                                            borderColor: '#f2f2f2',
                                            borderWidth: 1,
                                            overflow: 'hidden',
                                            shadowOpacity: 0.07,
                                            shadowRadius: 7,
                                            zIndex: 10000000001,
                                            alignSelf: 'center',
                                        }}
                                    >
                                        <Image
                                            style={{
                                                height: 245,
                                                width: 175,
                                            }}
                                            source={{
                                                uri: 'https://archive.org/services/img/' + selectedBook.identifier,
                                            }}
                                        />
                                    </View>

                                    <Text
                                        ellipsizeMode="tail"
                                        style={{
                                            marginTop: 30,
                                            bottom: 0,
                                            padding: 5,
                                            height: 25,
                                            paddingBottom: 10,
                                            fontSize: 12,
                                            fontFamily: 'inter',
                                            backgroundColor: '#ffffff',
                                            color: '#0061ff',
                                        }}
                                    >
                                        <Ionicons name="bookmark-outline" /> {selectedBook.downloads}
                                    </Text>
                                    <Text
                                        ellipsizeMode="tail"
                                        style={{
                                            padding: 5,
                                            fontSize: 12,
                                            fontFamily: 'inter',
                                            backgroundColor: '#ffffff',
                                            maxHeight: 200,
                                            paddingTop: 10,
                                        }}
                                    >
                                        {selectedBook.description}
                                    </Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={{
                                    marginTop: 20,
                                    // backgroundColor: '#007AFF',
                                    // borderRadius: 19,
                                    // width: 150,
                                    alignSelf: 'center',
                                }}
                                onPress={() => {
                                    if (retrievingBook) {
                                        return;
                                    }
                                    retrieveBook();
                                }}
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
                                    Select{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            ) : null}

            {selectedBook ? (
                <Reanimated.View
                    style={{
                        alignItems: 'center',
                        backgroundColor: 'black',
                        opacity: animatedShadowOpacity,
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
                            setSelectedBook(null);
                            props.hideBars(false);
                        }}
                    ></TouchableOpacity>
                </Reanimated.View>
            ) : null}
        </View>
    );
};

export default Books;
