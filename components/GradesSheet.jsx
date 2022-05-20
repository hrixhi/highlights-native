import React from 'react';
import {
    Animated,
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
} from 'react-native';

import { htmlStringParser } from '../helpers/HTMLParser';
import { TextInput as CustomTextInput } from '../components/CustomTextInput';
import { Ionicons } from '@expo/vector-icons';

const CELL_WIDTH = 100;
const CELL_HEIGHT = 60;

const black = '#000';
const white = '#fff';

const styles = StyleSheet.create({
    container: { backgroundColor: white },
    header: { flexDirection: 'row', borderTopWidth: 1, borderColor: black },
    identity: { position: 'absolute', width: CELL_WIDTH },
    body: { marginLeft: CELL_WIDTH },
    cell: {
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: black,
    },
    column: { flexDirection: 'column' },
});

class Sheet extends React.Component {
    constructor(props: {}) {
        super(props);

        this.headerScrollView = null;
        this.scrollPosition = new Animated.Value(0);
        this.scrollEvent = Animated.event([{ nativeEvent: { contentOffset: { x: this.scrollPosition } } }], {
            useNativeDriver: false,
        });

        console.log('props.cues.length', props.cues.length);

        this.state = { count: this.props.scores.length, columnCount: this.props.cues.length + 1, loading: false };
    }

    handleScroll = (e) => {
        if (this.headerScrollView) {
            let scrollX = e.nativeEvent.contentOffset.x;
            this.headerScrollView.scrollTo({ x: scrollX, animated: false });
        }
    };

    scrollLoad = () => this.setState({ loading: false });

    handleScrollEndReached = () => {
        if (!this.state.loading) {
            this.setState({ loading: true }, () => setTimeout(this.scrollLoad, 500));
        }
    };

    formatCell(value) {
        return (
            <View key={value} style={styles.cell}>
                <Text>{value}</Text>
            </View>
        );
    }

    formatColumn = (section) => {
        let { item } = section;
        let cells = [];

        console.log('Item', item);

        if (item.key === 'total') {
            for (let i = 0; i < this.state.count; i++) {
                const score = this.props.scores[i];

                let totalPoints = 0;
                let totalScore = 0;
                score.scores.map((s: any) => {
                    if (s.releaseSubmission) {
                        if (!s.submittedAt || !s.graded) {
                            // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                            totalScore += Number(s.gradeWeight);
                        } else {
                            totalPoints += Number(s.gradeWeight) * Number(s.score);
                            totalScore += Number(s.gradeWeight);
                        }
                    }
                });

                cells.push(
                    <View style={styles.cell}>
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 13,
                                color: '#000000',
                                textTransform: 'uppercase',
                            }}
                        >
                            {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '') : '0'}%
                        </Text>
                    </View>
                );
            }
        } else {
            const cue = this.props.cues[item.key];

            for (let i = 0; i < this.state.count; i++) {
                const score = this.props.scores[i];

                const scoreObject = score.scores.find((s: any) => {
                    return s.cueId.toString().trim() === cue._id.toString().trim();
                });

                if (
                    scoreObject &&
                    this.props.activeCueId === scoreObject.cueId &&
                    this.props.activeUserId === score.userId
                ) {
                    cells.push(
                        <View style={styles.cell}>
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                }}
                            >
                                <TextInput
                                    value={this.props.activeScore}
                                    placeholder={' / 100'}
                                    onChangeText={(val) => {
                                        this.props.setActiveScore(val);
                                    }}
                                    style={{
                                        width: '50%',
                                        marginRight: 5,
                                        padding: 8,
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                        fontSize: 12,
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        this.props.modifyGrade();
                                    }}
                                >
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={17}
                                        style={{ marginRight: 5 }}
                                        color={'#8bc34a'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        this.props.setActiveCueId('');
                                        this.props.setActiveUserId('');
                                        this.props.setActiveScore('');
                                    }}
                                >
                                    <Ionicons name="close-circle-outline" size={17} color={'#f94144'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }

                cells.push(
                    <View style={styles.cell}>
                        <TouchableOpacity
                            style={styles.col}
                            // key={row.toString() + '-' + col.toString()}
                            onPress={() => {
                                if (!scoreObject) return;

                                this.props.setActiveCueId(scoreObject.cueId);
                                this.props.setActiveUserId(score.userId);
                                this.props.setActiveScore(scoreObject.score);
                            }}
                        >
                            {!scoreObject || !scoreObject.submittedAt ? (
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 13,
                                        color: '#f94144',
                                    }}
                                >
                                    {scoreObject &&
                                    scoreObject !== undefined &&
                                    scoreObject.graded &&
                                    scoreObject.score.replace(/\.0+$/, '')
                                        ? scoreObject.score
                                        : !scoreObject || !scoreObject.cueId
                                        ? 'N/A'
                                        : 'Missing'}
                                </Text>
                            ) : (
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 13,
                                        color:
                                            scoreObject &&
                                            new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline)
                                                ? '#f3722c'
                                                : '#000000',
                                    }}
                                >
                                    {scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score
                                        ? scoreObject.score.replace(/\.0+$/, '')
                                        : scoreObject &&
                                          new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline)
                                        ? 'Late'
                                        : 'Submitted'}
                                </Text>
                            )}

                            {scoreObject &&
                            scoreObject !== undefined &&
                            scoreObject.score &&
                            scoreObject.graded &&
                            (new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline) ||
                                !scoreObject.submittedAt) ? (
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 13,
                                        color: !scoreObject.submittedAt ? '#f94144' : '#f3722c',
                                        marginTop: 5,
                                        borderWidth: 0,
                                        borderColor: !scoreObject.submittedAt ? '#f94144' : '#f3722c',
                                        borderRadius: 10,
                                        width: 60,
                                        alignSelf: 'center',
                                    }}
                                >
                                    {!scoreObject.submittedAt ? '(Missing)' : '(Late)'}
                                </Text>
                            ) : null}
                        </TouchableOpacity>
                    </View>
                );

                // cells.push(<View style={styles.cell}></View>);
            }
        }

        return <View style={styles.column}>{cells}</View>;
    };

    formatHeader() {
        let cols = [];
        for (let i = 0; i < this.state.columnCount; i++) {
            console.log('i', i);

            if (i === 0) {
                // Insert
                cols.push(
                    <View key={'Total'} style={styles.cell}>
                        <Text>Total</Text>
                    </View>
                );
            } else {
                const cue = this.props.cues[i - 1];

                const { title } = htmlStringParser(cue.cue);

                console.log('title', title);

                cols.push(
                    <View key={'Cue' + i.toString()} style={styles.cell}>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                            }}
                            key={i.toString()}
                            onPress={() => props.openCueFromGrades(cue._id)}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: '#000000',
                                    marginBottom: 5,
                                }}
                            >
                                {new Date(cue.deadline).toString().split(' ')[1] +
                                    ' ' +
                                    new Date(cue.deadline).toString().split(' ')[2]}
                            </Text>
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'inter',
                                    marginBottom: 5,
                                    textAlignVertical: 'center',
                                }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                {title}
                            </Text>
                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000' }}>
                                {cue.gradeWeight ? cue.gradeWeight : '0'}%
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }
        }

        return (
            <View style={styles.header}>
                <View style={styles.cell}>
                    <CustomTextInput
                        value={this.props.studentSearch}
                        onChangeText={(val: string) => this.props.setStudentSearch(val)}
                        placeholder={'Search'}
                        placeholderTextColor={'#1F1F1F'}
                    />
                </View>
                <ScrollView
                    ref={(ref) => (this.headerScrollView = ref)}
                    horizontal={true}
                    scrollEnabled={false}
                    scrollEventThrottle={16}
                >
                    {cols}
                </ScrollView>
            </View>
        );
    }

    formatIdentityColumn() {
        let cells = [];

        console.log('State.count', this.state.count);
        for (let i = 0; i < this.state.count; i++) {
            const score = this.props.scores[i];

            cells.push(
                <View key={'User' + i.toString()} style={styles.cell}>
                    <Image
                        style={{
                            height: 37,
                            width: 37,
                            borderRadius: 75,
                            alignSelf: 'center',
                        }}
                        source={{
                            uri:
                                score.avatar && score.avatar !== undefined
                                    ? score.avatar
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                        }}
                    />
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'inter',
                        }}
                    >
                        {score.fullName}
                    </Text>
                </View>
            );
        }

        return <View style={styles.identity}>{cells}</View>;
    }

    formatBody() {
        let data = [];

        data.push({ key: 'total' });

        for (let i = 0; i < this.state.columnCount - 1; i++) {
            data.push({ key: i });
        }

        return (
            <View>
                {this.formatIdentityColumn()}
                <FlatList
                    style={styles.body}
                    horizontal={true}
                    data={data}
                    renderItem={this.formatColumn}
                    stickyHeaderIndices={[0]}
                    onScroll={this.scrollEvent}
                    scrollEventThrottle={16}
                    extraData={this.state}
                />
            </View>
        );
    }

    formatRowForSheet = (section) => {
        let { item } = section;

        return item.render;
    };

    componentDidMount() {
        this.listener = this.scrollPosition.addListener((position) => {
            this.headerScrollView.scrollTo({ x: position.value, animated: false });
        });
    }

    render() {
        let body = this.formatBody();

        let data = [{ key: 'body', render: body }];

        return (
            <View style={styles.container}>
                {this.formatHeader()}
                <FlatList
                    data={data}
                    renderItem={this.formatRowForSheet}
                    onEndReached={this.handleScrollEndReached}
                    onEndReachedThreshold={0.005}
                />
                {/* {this.state.loading && <ActivityIndicator />} */}
            </View>
        );
    }
}

export default Sheet;
