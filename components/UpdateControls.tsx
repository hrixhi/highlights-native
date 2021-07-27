import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Keyboard,
  StyleSheet,
  Switch,
  TextInput,
  Dimensions,
  ScrollView,
  Animated,
  Button,
  Linking,
  Platform
} from "react-native";
import Alert from "../components/Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { timedFrequencyOptions } from "../helpers/FrequencyOptions";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  createCue,
  deleteCue,
  deleteForEveryone,
  getChannelCategories,
  getChannels,
  getQuiz,
  getSharedWith,
  markAsRead,
  shareCueWithMoreIds,
  start,
  submit
} from "../graphql/QueriesAndMutations";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import FileUpload from "./UploadFiles";
import DateTimePicker from "@react-native-community/datetimepicker";
import Quiz from "./Quiz";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import TeXToSVG from "tex-to-svg";
import Collapsible from "react-native-collapsible";
import * as DocumentPicker from "expo-document-picker";
import * as Updates from "expo-updates";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import { Video } from "expo-av";
import moment from "moment";
import MultiSelectComponent from "./MultiSelect";
import Webview from "./Webview";
import QuizGrading from './QuizGrading';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';


const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
  const current = new Date();
  const [cue, setCue] = useState(props.cue.cue);
  const [shuffle, setShuffle] = useState(props.cue.shuffle);
  const [starred, setStarred] = useState(props.cue.starred);
  const [color, setColor] = useState(props.cue.color);
  const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false);
  const [frequency, setFrequency] = useState(props.cue.frequency);
  const [customCategory, setCustomCategory] = useState(props.cue.customCategory);
  const [customCategories, setCustomCategories] = useState(props.customCategories);
  const [addCustomCategory, setAddCustomCategory] = useState(false);
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
  const [isOwner, setIsOwner] = useState(false);
  const stopPlay =
    props.cue.endPlayAt && props.cue.endPlayAt !== ""
      ? props.cue.endPlayAt === "Invalid Date"
        ? new Date()
        : new Date(props.cue.endPlayAt)
      : new Date();
  const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay);
  const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
    props.cue.endPlayAt && props.cue.endPlayAt !== "" ? false : true
  );
  const now = new Date(props.cue.date);
  const RichText: any = useRef();
  const [height, setHeight] = useState(100);
  const [showOriginal, setShowOriginal] = useState(props.cue.channelId && props.cue.channelId !== "" ? true : false);
  const colorChoices: any[] = ["#d91d56", "#ED7D22", "#F8D41F", "#B8D41F", "#53BE6D"].reverse();
  const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
  const dead =
    props.cue.deadline && props.cue.deadline !== ""
      ? props.cue.deadline === "Invalid Date"
        ? new Date(current.getTime() + 1000 * 60 * 60 * 24)
        : new Date(props.cue.deadline)
      : new Date(current.getTime() + 1000 * 60 * 60 * 24);

  const initiate =
    props.cue.initiateAt && props.cue.initiateAt !== ""
      ? props.cue.initiateAt === "Invalid Date"
        ? new Date()
        : new Date(props.cue.initiateAt)
      : new Date();
  const [deadline, setDeadline] = useState<Date>(dead);
  const [initiateAt, setInitiateAt] = useState<Date>(initiate)
  const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0);
  const [score] = useState<any>(props.cue.score ? props.cue.score : 0);
  const [graded, setGraded] = useState(props.cue.gradeWeight && props.cue.gradeWeight !== 0 ? true : false);
  const currentDate = new Date();
  const [submitted, setSubmitted] = useState(false);
  const [userSetupComplete, setUserSetupComplete] = useState(false);
  const [imported, setImported] = useState(false);
  const [url, setUrl] = useState("");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [submissionImported, setSubmissionImported] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [submissionType, setSubmissionType] = useState("");
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [key, setKey] = useState(Math.random());
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [shareWithChannelId, setShareWithChannelId] = useState("");
  const [selected, setSelected] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [expandMenu, setExpandMenu] = useState(false);
  const [original, setOriginal] = useState(props.cue.original)
  // quiz options
  const [isQuiz, setIsQuiz] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [quizId, setQuizId] = useState("");
  const [loading, setLoading] = useState(true);
  const [initiatedAt, setInitiatedAt] = useState<any>(null);
  const [isQuizTimed, setIsQuizTimed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [initDuration, setInitDuration] = useState(0);
  const [equation, setEquation] = useState("y = x + 1");
  const [showEquationEditor, setShowEquationEditor] = useState(false);
  const [handlingSubmit, setHandlingSubmit] = useState(false);
  const [shuffleQuiz, setShuffleQuiz] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [headers, setHeaders] = useState({})
  const [cueGraded] = useState(props.cue.graded);
  const [quizSolutions, setQuizSolutions] = useState<any>({});
  const [isV0Quiz, setIsV0Quiz] = useState(false);
  const [comment] = useState(props.cue.comment)
  const [frequencyName, setFrequencyName] = useState('Day')
  const [shareWithChannelName, setShareWithChannelName] = useState('')

  const [showInitiateAtTimeAndroid, setShowInitiateAtTimeAndroid] = useState(false);
  const [showInitiateAtDateAndroid, setShowInitiateAtDateAndroid] = useState(false);

  const [showDeadlineTimeAndroid, setShowDeadlineTimeAndroid] = useState(false);
  const [showDeadlineDateAndroid, setShowDeadlineDateAndroid] = useState(false);

  const [showEndPlayAtTimeAndroid, setShowEndPlayAtTimeAndroid] = useState(false);
  const [showEndPlayAtDateAndroid, setShowEndPlayAtDateAndroid] = useState(false);

  const [cueFullyLoaded, setCueFullyLoaded] = useState(false);

  const unableToStartQuizAlert = PreferredLanguageText("unableToStartQuiz");
  const deadlineHasPassedAlert = PreferredLanguageText("deadlineHasPassed");
  const enterTitleAlert = PreferredLanguageText("enterTitle");
  const cueDeletedAlert = PreferredLanguageText("cueDeleted");
  const submissionFailedAlert = PreferredLanguageText("submissionFailed");
  const ifYouStartTimedQuizAlert = PreferredLanguageText("ifYouStartTimedQuiz");
  const submissionCompleteAlert = PreferredLanguageText("submissionComplete");
  const tryAgainLaterAlert = PreferredLanguageText("tryAgainLater");
  const somethingWentWrongAlert = PreferredLanguageText("somethingWentWrong");
  const clearQuestionAlert = PreferredLanguageText("clearQuestion");
  const cannotUndoAlert = PreferredLanguageText("cannotUndo");
  const sharedAlert = PreferredLanguageText("sharedAlert");
  const checkConnectionAlert = PreferredLanguageText("checkConnection");

  const insertEquation = useCallback(() => {
    const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
    RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
    setShowEquationEditor(false);
    setEquation("");
    // setReloadEditorKey(Math.random())
  }, [equation, RichText, RichText.current, cue]);

  const diff_seconds = (dt2: any, dt1: any) => {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    return Math.abs(Math.round(diff));
  };

  useEffect(() => {
    if (!isQuizTimed || initiatedAt === null || initiatedAt === "" || isOwner) {
      // not a timed quiz or its not been initiated
      return;
    }
    let now = new Date();
    now.setMinutes(now.getMinutes() - 1);
    let current = new Date();
    if (now >= deadline) {
      // deadline crossed
      return;
    }
    if (duration === 0) {
      return;
    }
    const remainingTime = duration - diff_seconds(initiatedAt, current);
    if (remainingTime <= 0) {
      // duration has been set correctly yet no time remaining
      if (!props.cue.submittedAt || props.cue.submittedAt === "") {
        handleSubmit();
      }
    } else {
      setInitDuration(remainingTime); // set remaining duration in seconds
    }
  }, [initiatedAt, duration, deadline, isQuizTimed, props.cue.submittedAt, isOwner]);

  const loadChannelsAndSharedWith = useCallback(async () => {
    const uString: any = await AsyncStorage.getItem("user");
    if (uString) {
      const user = JSON.parse(uString);
      const server = fetchAPI("");

      if (props.channelId) {
        server
          .query({
            query: getChannelCategories,
            variables: {
              channelId: props.channelId
            }
          })
          .then(res => {
            if (res.data.channel && res.data.channel.getChannelCategories) {
              setCustomCategories(res.data.channel.getChannelCategories);
              setKey(key)
            }
          })
          .catch(err => { });
      }

      server
        .query({
          query: getChannels,
          variables: {
            userId: user._id
          }
        })
        .then(res => {
          if (res.data.channel.findByUserId) {
            setChannels(res.data.channel.findByUserId);
            setKey(key)
          }
        })
        .catch(err => { });
      if (user._id.toString().trim() === props.cue.createdBy && props.cue.channelId && props.cue.channelId !== "") {
        // owner
        server
          .query({
            query: getSharedWith,
            variables: {
              channelId: props.cue.channelId,
              cueId: props.cue._id
            }
          })
          .then((res: any) => {
            if (res.data && res.data.cue.getSharedWith) {
              const sharedWith = res.data.cue.getSharedWith;
              const shared: any[] = [];
              const ids: any[] = [];
              sharedWith.map((s: any) => {
                shared.push({
                  value: s.value,
                  label: s.label
                });
                if (s.isFixed) {
                  ids.push(s.value);
                }
              });
              setSubscribers(shared);
              setSelected(ids);
              setKey(key)
            }
          })
          .catch((err: any) => console.log(err));
      }
    }
  }, [props.cue, props.channelId]);

  useEffect(() => {
    loadChannelsAndSharedWith();
  }, []);

  useEffect(() => {
    if (props.cue.channelId && props.cue.channelId !== "") {
      const data1 = original;
      const data2 = cue;
      if (data2 && data2[0] && data2[0] === "{" && data2[data2.length - 1] === "}") {
        const obj = JSON.parse(data2);
        setSubmissionImported(true);
        setSubmissionUrl(obj.url);
        setSubmissionType(obj.type);
        if (loading) {
          setSubmissionTitle(obj.title);
        }
      } else {
        setSubmissionImported(false);
        setSubmissionUrl("");
        setSubmissionType("");
        setSubmissionTitle("");
      }
      if (data1 && data1[0] && data1[0] === "{" && data1[data1.length - 1] === "}") {
        const obj = JSON.parse(data1);
        if (obj.quizId) {
          // if (isQuiz) {
          //   return;
          // }
          if (!loading) {
            return;
          }
          setShowOptions(true);
          // load quiz here and set problems
          const server = fetchAPI("");
          server
            .query({
              query: getQuiz,
              variables: {
                quizId: obj.quizId
              }
            })
            .then(res => {
              if (res.data && res.data.quiz.getQuiz) {
                setQuizId(obj.quizId);
                const solutionsObject = cue ? JSON.parse(cue) : {};
                if (solutionsObject.solutions) {
                  setSolutions(solutionsObject.solutions);
                  setQuizSolutions(solutionsObject);
                }
                setProblems(res.data.quiz.getQuiz.problems);
                if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                  setDuration(res.data.quiz.getQuiz.duration * 60);
                  setIsQuizTimed(true);
                }
                if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== "") {
                  const init = new Date(solutionsObject.initiatedAt);
                  setInitiatedAt(init);
                }
                setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? true : false)
                setTitle(obj.title);
                setIsQuiz(true);
                setInstructions(res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : '')
                setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                setLoading(false);
                props.resetCueUpdateCount()
              }
            });
        } else {
          setImported(true);
          setUrl(obj.url);
          setType(obj.type);
          if (loading) {
            setTitle(obj.title);
          }
          setKey(Math.random());
        }
      } else {
        setType("");
        setTitle("");
        setImported(false);
        setUrl("");
      }
    } else {
      const data = cue;
      if (data && data[0] && data[0] === "{" && data[data.length - 1] === "}") {
        const obj = JSON.parse(data);
        setSubmissionImported(true);
        setSubmissionUrl(obj.url);
        setSubmissionType(obj.type);
        setSubmissionTitle(obj.title);
      } else {
        setSubmissionImported(false);
        setSubmissionUrl("");
        setSubmissionType("");
        setSubmissionTitle("");
      }
    }
    setLoading(false);
    setCueFullyLoaded(true);
  }, [props.cue, cue, original, loading]);

  // Important for new Quiz version with problemScores and comments
  useEffect(() => {
    if (quizSolutions) {
      if (quizSolutions.problemScores) {
        setIsV0Quiz(false)
      } else {
        setIsV0Quiz(true)
      }
    }
  }, [quizSolutions])

  const handleHeightChange = useCallback((h: any) => {
    setHeight(h);
  }, []);

  const cameraCallback = useCallback(async () => {
    const cameraSettings = await ImagePicker.getCameraPermissionsAsync();
    if (!cameraSettings.granted) {
      await ImagePicker.requestCameraPermissionsAsync();
      const updatedCameraSettings = await ImagePicker.getCameraPermissionsAsync();
      if (!updatedCameraSettings.granted) {
        return;
      }
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: true
    });
    if (!result.cancelled) {
      const dir = FileSystem.documentDirectory + "images";
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, {
          intermediates: true
        });
      }
      const fileName = Math.round(Math.random() * 100).toString();
      FileSystem.copyAsync({
        from: result.uri,
        to: dir + "/" + fileName + ".jpg"
      })
        .then(r => {
          ImageManipulator.manipulateAsync(dir + "/" + fileName + ".jpg", [], {
            compress: 0.25,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          })
            .then(res => {
              RichText.current.insertImage(
                "data:image/jpeg;base64," + res.base64,
                "border-radius: 10px; max-width: 400px; width: 100%;"
              );
              // setReloadEditorKey(Math.random())
            })
            .catch(err => {
              Alert("Unable to load image.");
            });
        })
        .catch(err => {
          Alert("Something went wrong.");
        });
    }
  }, [RichText, RichText.current]);

  const galleryCallback = useCallback(async () => {
    const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!gallerySettings.granted) {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!updatedGallerySettings.granted) {
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: true
    });
    if (!result.cancelled) {
      const dir = FileSystem.documentDirectory + "images";
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, {
          intermediates: true
        });
      }
      const fileName = Math.round(Math.random() * 100).toString();
      FileSystem.copyAsync({
        from: result.uri,
        to: dir + "/" + fileName + ".jpg"
      })
        .then(r => {
          ImageManipulator.manipulateAsync(dir + "/" + fileName + ".jpg", [], {
            compress: 0.25,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          })
            .then(res => {
              RichText.current.insertImage(
                "data:image/jpeg;base64," + res.base64,
                "border-radius: 10px; max-width: 400px; width: 100%;"
              );
            })
            .catch(err => {
              Alert("Unable to load image.");
            });
        })
        .catch(err => {
          Alert("Something went wrong.");
        });
    }
  }, [RichText, RichText.current]);

  const initQuiz = useCallback(async () => {
    let now = new Date();
    if (now >= deadline) {
      Alert(unableToStartQuizAlert, deadlineHasPassedAlert);
      return;
    }
    if (now < initiateAt) {
      Alert("Quiz not available")
      return;
    }
    const u = await AsyncStorage.getItem("user");
    if (u) {
      const user = JSON.parse(u);
      const now = new Date();
      const server = fetchAPI("");
      const saveCue = JSON.stringify({
        solutions,
        initiatedAt: now
      });
      server
        .mutate({
          mutation: start,
          variables: {
            cueId: props.cue._id,
            userId: user._id,
            cue: saveCue
          }
        })
        .then(res => {
          if (res.data.quiz.start) {
            setInitiatedAt(now);
          }
        })
        .catch(err => console.log(err));
      // save time to cloud first
      // after saving time in cloud, save it locally, set initiatedAt
      // quiz gets triggered
    }
  }, [props.cue._id, solutions, deadline, initiateAt]);

  const fileUpload = useCallback(async () => {
    const file = await DocumentPicker.getDocumentAsync();
  }, []);

  const handleUpdate = useCallback(async () => {
    let subCues: any = {};
    try {
      const value = await AsyncStorage.getItem("cues");
      if (value) {
        subCues = JSON.parse(value);
      }
    } catch (e) { }
    if (subCues[props.cueKey].length === 0) {
      return;
    }
    let saveCue = "";
    if (isQuiz) {
      saveCue = JSON.stringify({
        solutions,
        initiatedAt
      });
    } else if (submissionImported) {
      const obj = {
        type: submissionType,
        url: submissionUrl,
        title: submissionTitle
      };
      saveCue = JSON.stringify(obj);
    } else {
      saveCue = cue;
    }
    const submittedNow = new Date();
    subCues[props.cueKey][props.cueIndex] = {
      _id: props.cue._id,
      cue: saveCue,
      date: props.cue.date,
      color,
      shuffle,
      frequency,
      starred,
      customCategory,
      // Channel controls
      channelId: props.cue.channelId,
      createdBy: props.cue.createdBy,
      endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : "",
      channelName: props.cue.channelName,
      original: props.cue.original,
      status: "read",
      graded: props.cue.graded,
      gradeWeight,
      submission,
      unreadThreads: props.cue.unreadThreads,
      score,
      comment: props.cue.comment,
      submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
      deadline: submission ? deadline.toISOString() : ""
    };
    const stringifiedCues = JSON.stringify(subCues);
    await AsyncStorage.setItem("cues", stringifiedCues);
    props.reloadCueListAfterUpdate();
  }, [
    cue,
    customCategory,
    shuffle,
    frequency,
    starred,
    color,
    playChannelCueIndef,
    notify,
    submissionImported,
    submission,
    deadline,
    gradeWeight,
    submitted,
    submissionTitle,
    submissionType,
    submissionUrl,
    isQuiz,
    props.closeModal,
    props.cueIndex,
    props.cueKey,
    props.cue,
    endPlayAt,
    props,
    solutions,
    initiatedAt
  ]);

  const handleDelete = useCallback(async () => {
    Alert("Delete cue?", "", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          return;
        }
      },
      {
        text: "Okay",
        onPress: async () => {
          const server = fetchAPI("");
          if (props.cue.channelId && isOwner) {
            server
              .mutate({
                mutation: deleteForEveryone,
                variables: {
                  cueId: props.cue._id
                }
              })
              .then(res => {
                if (res.data.cue.deleteForEveryone) {
                  Alert(cueDeletedAlert);
                }
              });
          }

          if (!props.cue.channelId) {
            server.mutate({
              mutation: deleteCue,
              variables: {
                cueId: props.cue._id
              }
            });
          }

          let subCues: any = {};
          try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
              subCues = JSON.parse(value);
            }
          } catch (e) { }
          if (subCues[props.cueKey].length === 0) {
            return;
          }
          const updatedCues: any[] = [];
          subCues[props.cueKey].map((i: any, j: any) => {
            if (j !== props.cueIndex) {
              updatedCues.push({ ...i });
            }
          });
          subCues[props.cueKey] = updatedCues;
          const stringifiedCues = JSON.stringify(subCues);
          await AsyncStorage.setItem("cues", stringifiedCues);
          props.closeModal("delete");
        }
      }
    ]);
  }, [props.cueIndex, props.closeModal, props.cueKey, props.cue, isOwner]);

  const handleSubmit = useCallback(async () => {
    if (!isQuiz && submissionImported && submissionTitle === "") {
      Alert(enterTitleAlert);
      return;
    }

    // Here check if required questions have been answered

    let requiredMissing = false;

    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      const solution = solutions[i];

      if ((!problem.questionType || problem.questionType === "") && problem.required) {
        // Check completeness for MCQs

        const { selected } = solution;

        let selectionMade = false;

        selected.forEach((selection: any) => {
          if (selection.isSelected) selectionMade = true;
        })

        if (!selectionMade) {
          requiredMissing = true;
        }

      } else if (problem.questionType === "freeResponse" && problem.required) {
        // Check completeness for free response

        const { response } = solution;

        if (response === "") {
          requiredMissing = true;
        }

      } else {
        // Optional
      }
    }

    if (requiredMissing) {
      Alert("A required question is missing a response.");
      return;
    }


    Alert("Submit?", "", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          return;
        }
      },
      {
        text: "Okay",
        onPress: async () => {
          const u: any = await AsyncStorage.getItem("user");
          let now = new Date();
          // one minute of extra time to submit
          // one minute of extra time to submit
          // one minute of extra time to submit
          now.setMinutes(now.getMinutes() - 1);
          if (isQuiz) {
            if (now >= deadline) {
              Alert(submissionFailedAlert, ifYouStartTimedQuizAlert);
              return;
            }
            // over here check that all options have been selected
            // TO DO
          } else {
            if (now >= deadline) {
              Alert(submissionFailedAlert, deadlineHasPassedAlert);
              return;
            }
          }
          if (u) {
            const parsedUser = JSON.parse(u);
            if (!parsedUser.email || parsedUser.email === "") {
              // cannot submit
              return;
            }
            let saveCue = "";
            if (isQuiz) {
              saveCue = JSON.stringify({
                solutions,
                initiatedAt
              });
            } else if (submissionImported) {
              const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
              };
              saveCue = JSON.stringify(obj);
            } else {
              if (cue === "") {
                // submission cannot be empty
                return;
              }
              saveCue = cue;
            }

            console.log(saveCue);

            const server = fetchAPI("");
            server
              .mutate({
                mutation: submit,
                variables: {
                  cue: saveCue,
                  cueId: props.cue._id,
                  userId: parsedUser._id,
                  quizId: isQuiz ? quizId : null
                }
              })
              .then(res => {
                if (res.data.cue.submitModification) {
                  Alert(submissionCompleteAlert, new Date().toString(), [
                    {
                      text: "Okay",
                      onPress: async () => {
                        await Updates.reloadAsync();
                        setHandlingSubmit(false);
                      }
                    }
                  ]);
                }
              })
              .catch(err => {
                Alert(somethingWentWrongAlert, tryAgainLaterAlert);
              });
          }
        }
      }
    ]);
  }, [
    props.cue,
    cue,
    submissionTitle,
    submissionType,
    submissionUrl,
    submissionImported,
    isQuiz,
    quizId,
    initiatedAt,
    solutions,
    deadline
  ]);

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("user");
      if (u && props.cue.createdBy) {
        const parsedUser = JSON.parse(u);
        if (parsedUser._id.toString().trim() === props.cue.createdBy.toString().trim()) {
          setIsOwner(true);
        }
        if (parsedUser.email && parsedUser.email !== "") {
          setUserSetupComplete(true);
        }
        setKey(key)
      }
    })();
  }, [props.cue]);

  useEffect(() => {
    // Update Cue Data
    props.updateCueData({
      cue,
      shuffle,
      frequency,
      starred,
      color,
      submitted,
      markedAsRead,
      submissionTitle,
      submissionImported,
      submissionType,
      isQuiz,
      submission,
      deadline,
      initiateAt,
      solutions,
      initiatedAt,
      customCategory,
      endPlayAt,
      playChannelCueIndef,
      notify,
      title,
      url,
      imported,
      type,
      original,
      cueFullyLoaded,
    });
  }, [
    cue,
    shuffle,
    frequency,
    starred,
    color,
    props.cueIndex,
    submitted,
    // markedAsRead,
    submissionTitle,
    submissionImported,
    submissionType,
    // isQuiz,
    submission,
    deadline,
    initiateAt,
    solutions,
    initiatedAt,
    customCategory,
    props.cueKey,
    endPlayAt,
    playChannelCueIndef,
    notify,
    imported, url, type, title, original,
    cueFullyLoaded
  ]);

  const updateStatusAsRead = useCallback(async () => {
    if (props.cue.status && props.cue.status !== "read" && !markedAsRead) {
      const u = await AsyncStorage.getItem("user");
      if (u) {
        const user = JSON.parse(u);
        const server = fetchAPI("");
        server
          .mutate({
            mutation: markAsRead,
            variables: {
              cueId: props.cue._id,
              userId: user._id
            }
          })
          .then(res => {
            if (res.data.status.markAsRead) {
              setMarkedAsRead(true);
              setKey(key)
              // Mark as read
              // props.markCueAsRead()
            }
          })
          .catch(err => { });
      }
    }
  }, [props.cue, markedAsRead]);

  const clearAll = useCallback(() => {
    Alert(clearQuestionAlert, cannotUndoAlert, [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Clear",
        onPress: () => {
          if (props.showOriginal) {
            setImported(false)
            setOriginal('')
            setUrl('')
            setType('')
            setTitle('')
          } else {
            setSubmissionImported(false)
            setCue('')
            setSubmissionUrl('')
            setSubmissionType('')
            setSubmissionTitle('')
          }
          setReloadEditorKey(Math.random());
        }
      }
    ]);
  }, [props.showOriginal]);

  const shareCue = useCallback(async () => {
    let saveCue = "";
    if (submissionImported) {
      const obj = {
        type: submissionType,
        url: submissionUrl,
        title: submissionTitle
      };
      saveCue = JSON.stringify(obj);
    } else {
      saveCue = cue;
    }

    let tempOriginal = ''
    if (imported) {
      const obj = {
        type,
        url,
        title
      }
      tempOriginal = JSON.stringify(obj)
    } else {
      tempOriginal = original
    }

    const server = fetchAPI("");
    server
      .mutate({
        mutation: createCue,
        variables: {
          cue: props.cue.channelId ? tempOriginal : saveCue,
          starred,
          color: color.toString(),
          channelId: shareWithChannelId,
          frequency,
          customCategory,
          shuffle,
          createdBy: props.cue.createdBy,
          gradeWeight: gradeWeight.toString(),
          submission,
          deadline: submission ? deadline.toISOString() : "",
          endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ""
        }
      })
      .then(res => {
        if (res.data.cue.create) {
          Alert(sharedAlert, "Cue has been successfully shared.");
        }
      })
      .catch(err => {
        Alert(somethingWentWrongAlert, checkConnectionAlert);
      });
  }, [
    submissionImported,
    submissionTitle,
    submissionType,
    submissionUrl,
    title, url, imported, original, type,
    cue,
    starred,
    color,
    frequency,
    customCategory,
    shuffle,
    gradeWeight,
    submission,
    deadline,
    notify,
    playChannelCueIndef,
    endPlayAt,
    shareWithChannelId,
    props.cue
  ]);

  const onAddNew = useCallback(
    userId => {
      const server = fetchAPI("");
      server
        .mutate({
          mutation: shareCueWithMoreIds,
          variables: {
            cueId: props.cue._id,
            userId
          }
        })
        .then(res => {
          if (res.data && res.data.cue.shareCueWithMoreIds) {
            loadChannelsAndSharedWith();
          }
        })
        .catch(err => console.log(err));
      const updatedSelected: any[] = [...selected];
      updatedSelected.push(userId);
      setSelected(updatedSelected);
    },
    [subscribers, props.cue, selected]
  );

  useEffect(() => {
    updateStatusAsRead();
  }, [props.cue.status]);

  const download = useCallback(
    async (original: boolean) => {
      Linking.openURL(original ? url : submissionUrl);
    },
    [submissionUrl, url, submissionTitle, submissionType, type, title]
  );

  const renderInitiateAtDateTimePicker = () => {
    return (<View style={{ backgroundColor: '#fff' }}>
      {Platform.OS === "ios" ? <DateTimePicker
        style={styles.timePicker}
        value={initiateAt}
        mode={'date'}
        textColor={'#202025'}
        onChange={(event: any, selectedDate: any) => {
          const currentDate: any = selectedDate;
          setInitiateAt(currentDate)
        }}
        minimumDate={new Date()}
      /> : null}
      {Platform.OS === "android" && showInitiateAtDateAndroid ? <DateTimePicker
        style={styles.timePicker}
        value={initiateAt}
        mode={'date'}
        textColor={'#202025'}
        onChange={(event: any, selectedDate: any) => {
          if (!selectedDate) return;
          const currentDate: any = selectedDate;
          setShowInitiateAtDateAndroid(false);
          setInitiateAt(currentDate)
        }}
        minimumDate={new Date()}
      /> : null}

      {Platform.OS === "android" ? <View style={{
        width: '100%',
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: '#fff',
        marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
      }}>

        <TouchableOpacity
          style={{
            backgroundColor: 'white',
            overflow: 'hidden',
            height: 35,
            borderRadius: 15,
            marginBottom: 10,
            width: 150, justifyContent: 'center', flexDirection: 'row',
          }}
          onPress={() => {
            setShowInitiateAtDateAndroid(true)
            setShowInitiateAtTimeAndroid(false)
          }}
        >
          <Text style={{
            textAlign: 'center',
            lineHeight: 35,
            color: '#202025',
            overflow: 'hidden',
            fontSize: 10,
            // backgroundColor: '#f4f4f6',
            paddingHorizontal: 25,
            fontFamily: 'inter',
            height: 35,
            width: 150,
            borderRadius: 15,
          }}>
            Set Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: 'white',
            overflow: 'hidden',
            height: 35,
            borderRadius: 15,
            width: 150, justifyContent: 'center', flexDirection: 'row',
          }}
          onPress={() => {
            setShowInitiateAtDateAndroid(false)
            setShowInitiateAtTimeAndroid(true)
          }}
        >
          <Text style={{
            textAlign: 'center',
            lineHeight: 35,
            color: '#202025',
            overflow: 'hidden',
            fontSize: 10,
            // backgroundColor: '#f4f4f6',
            paddingHorizontal: 25,
            fontFamily: 'inter',
            height: 35,
            width: 150,
            borderRadius: 15,
          }}>
            Set Time
          </Text>
        </TouchableOpacity>
      </View> : null}

      <View style={{ height: 10, backgroundColor: 'white' }} />
      {Platform.OS === "ios" ? <DateTimePicker
        style={styles.timePicker}
        value={initiateAt}
        mode={'time'}
        textColor={'#202025'}
        onChange={(event: any, selectedDate: any) => {
          const currentDate: any = selectedDate;
          setInitiateAt(currentDate)
        }}
        minimumDate={new Date()}
      /> : null}
      {Platform.OS === "android" && showInitiateAtTimeAndroid ? <DateTimePicker
        style={styles.timePicker}
        value={initiateAt}
        mode={'time'}
        textColor={'#202025'}
        onChange={(event: any, selectedDate: any) => {
          if (!selectedDate) return;
          const currentDate: any = selectedDate;
          setShowInitiateAtTimeAndroid(false);
          setInitiateAt(currentDate)

        }}
        minimumDate={new Date()}
      /> : null}
    </View>)
  }

  const renderDeadlineDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            style={styles.timePicker}
            value={deadline}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              const currentDate: any = selectedDate;
              setDeadline(currentDate);
            }}
            minimumDate={new Date()}
          />
        ) : null}
        {Platform.OS === "android" && showDeadlineDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={deadline}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowDeadlineDateAndroid(false);
              setDeadline(currentDate);
            }}
            minimumDate={new Date()}
          />
        ) : null}

        {Platform.OS === "android" ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 12,
              backgroundColor: "#fff",
              marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
            }}>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                marginBottom: 10,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowDeadlineDateAndroid(true);
                setShowDeadlineTimeAndroid(false);
              }}>
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#202025",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}>
                Set Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowDeadlineDateAndroid(false);
                setShowDeadlineTimeAndroid(true);
              }}>
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#202025",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}>
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 10, backgroundColor: "white" }} />
        {Platform.OS === "ios" ? (
          <DateTimePicker
            style={styles.timePicker}
            value={deadline}
            mode={"time"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              const currentDate: any = selectedDate;
              setDeadline(currentDate);
            }}
            minimumDate={new Date()}
          />
        ) : null}
        {Platform.OS === "android" && showDeadlineTimeAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={deadline}
            mode={"time"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowDeadlineTimeAndroid(false);
              setDeadline(currentDate);
            }}
            minimumDate={new Date()}
          />
        ) : null}
      </View>
    );
  };

  const renderEndPlayAtDateTimePicker = () => {
    return (
      <View style={{ backgroundColor: "#fff" }}>
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={endPlayAt}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              const currentDate: any = selectedDate;
              setEndPlayAt(currentDate);
            }}
            minimumDate={new Date()}
          />
        )}

        {Platform.OS === "android" && showEndPlayAtDateAndroid ? (
          <DateTimePicker
            style={styles.timePicker}
            value={endPlayAt}
            mode={"date"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowEndPlayAtDateAndroid(false);
              setEndPlayAt(currentDate);
            }}
            minimumDate={new Date()}
          />
        ) : null}

        {Platform.OS === "android" ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 12,
              backgroundColor: "#fff",
              marginLeft: Dimensions.get("window").width < 768 ? 0 : 10
            }}>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                marginBottom: 10,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowEndPlayAtDateAndroid(true);
                setShowEndPlayAtTimeAndroid(false);
              }}>
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#202025",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}>
                Set Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                borderRadius: 15,
                width: 150,
                justifyContent: "center",
                flexDirection: "row"
              }}
              onPress={() => {
                setShowEndPlayAtDateAndroid(false);
                setShowEndPlayAtTimeAndroid(true);
              }}>
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#202025",
                  overflow: "hidden",
                  fontSize: 10,
                  // backgroundColor: '#f4f4f6',
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15
                }}>
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 10, backgroundColor: "white" }} />
        {Platform.OS === "ios" && (
          <DateTimePicker
            style={styles.timePicker}
            value={endPlayAt}
            mode={"time"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              const currentDate: any = selectedDate;
              setEndPlayAt(currentDate);
            }}
            minimumDate={new Date()}
          />
        )}
        {Platform.OS === "android" && showEndPlayAtTimeAndroid && (
          <DateTimePicker
            style={styles.timePicker}
            value={endPlayAt}
            mode={"time"}
            textColor={"#202025"}
            onChange={(event: any, selectedDate: any) => {
              if (!selectedDate) return;
              const currentDate: any = selectedDate;
              setShowEndPlayAtTimeAndroid(false);
              setEndPlayAt(currentDate);
            }}
            minimumDate={new Date()}
          />
        )}
      </View>
    );
  };

  const renderRichToolbar = () => {
    return (props.cue.channelId && props.cue.channelId !== '' && !isOwner && props.showOriginal) || (props.showOriginal && showImportOptions) || isQuiz ? (
      <View style={{ height: 0, backgroundColor: "#fff" }} />
    ) : (((props.cue.graded && submission && !isOwner) || (currentDate > deadline && submission)) && !props.showOriginal) || (!props.showOriginal && showImportOptions) ? (
      <View style={{ height: 0, backgroundColor: "#fff" }} />
    ) : (
      <RichToolbar
        key={reloadEditorKey.toString() + props.showOriginal.toString()}
        style={{
          flexWrap: "wrap",
          backgroundColor: "white",
          height: 28,
          overflow: "visible"
        }}
        iconSize={12}
        editor={RichText}
        disabled={false}
        iconTint={"#a2a2aa"}
        selectedIconTint={"#a2a2aa"}
        disabledIconTint={"#a2a2aa"}
        actions={
          (!props.showOriginal && submissionImported) || (imported && props.showOriginal)
            ? ['']
            : [
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.insertBulletsList,
              actions.insertOrderedList,
              actions.checkboxList,
              actions.insertLink,
              actions.insertImage,
              "insertCamera",
              "clear",
              actions.undo,
              actions.redo,
            ]
        }
        iconMap={{
          ["insertCamera"]: ({ tintColor }) => <Ionicons name="camera-outline" size={15} color={tintColor} />,
          ["clear"]: ({ tintColor }) => (
            <Ionicons name="trash-outline" size={13} color={tintColor} onPress={() => clearAll()} />
          )
        }}
        onPressAddImage={galleryCallback}
        insertCamera={cameraCallback}
      />
    )
  };

  const renderEquationEditor = () => {
    return showEquationEditor ? (
      <View
        style={{
          width: "100%",
          flexDirection: width < 768 ? "column" : "row",
          paddingBottom: 20
        }}>
        <View
          style={{
            borderColor: "#f4f4f6",
            borderWidth: 1,
            borderRadius: 15,
            padding: 10,
            minWidth: 200,
            maxWidth: "50%"
          }}></View>
        <TouchableOpacity
          style={{
            justifyContent: "center",
            paddingHorizontal: 20,
            maxWidth: "10%"
          }}
          onPress={() => insertEquation()}>
          <Ionicons name="add-circle-outline" color="#a2a2aa" size={20} />
        </TouchableOpacity>
        <View
          style={{
            minWidth: "40%",
            flex: 1,
            paddingVertical: 5,
            justifyContent: "center"
          }}>
          <Text
            style={{
              flex: 1,
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            ^ → Superscript, _ → Subscript, int → Integral, sum → Summation, prod → Product, sqrt → Square root, bar →
            Bar over letter, alpha, beta, ... omega → Small Greek letter, Alpha, Beta, ... Omega → Capital Greek letter
          </Text>
        </View>
      </View>
    ) : null;
  };

  const renderCueTabs = () => (
    <View style={{ flexDirection: "row", backgroundColor: '#fff' }}>
      <TouchableOpacity
        style={{
          justifyContent: "center",
          flexDirection: "column",
          backgroundColor: '#fff'
        }}
        onPress={() => {
          props.setShowOriginal(true);
          props.setShowOptions(false)
          props.setShowComments(false)
        }}>
        <Text style={!props.showOptions && props.showOriginal && !props.showComments ? styles.allGrayFill : styles.all}>
          {PreferredLanguageText("viewShared")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          justifyContent: "center",
          flexDirection: "column",
          backgroundColor: '#fff'
        }}
        onPress={() => {
          props.setShowOptions(true)
          props.setShowOriginal(true);
          props.setShowComments(false)
        }}>
        <Text style={props.showOptions ? styles.allGrayFill : styles.all}>
          Details
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          justifyContent: "center",
          flexDirection: "column",
          backgroundColor: '#fff'
        }}
        onPress={() => {
          props.setShowComments(true)
          props.setShowOriginal(true);
          props.setShowOptions(false)
        }}>
        <Text style={props.showComments ? styles.allGrayFill : styles.all}>
          Comments
        </Text>
      </TouchableOpacity>
      {(isOwner && submission) || isQuiz ? null : (
        <TouchableOpacity
          style={{
            justifyContent: "center",
            flexDirection: "column",
            backgroundColor: '#fff'
          }}
          onPress={() => {
            props.setShowOriginal(false);
            props.setShowOptions(false)
            props.setShowComments(false)
          }}>
          <Text style={!props.showOriginal && !props.viewStatus ? styles.allGrayFill : styles.all}>
            {submission ? PreferredLanguageText("mySubmission") : PreferredLanguageText("myNotes")}
          </Text>
        </TouchableOpacity>
      )}
      {/* Add Status button here */}
      {!isOwner ? null : (
        <TouchableOpacity
          style={{
            justifyContent: "center",
            flexDirection: "column",
            backgroundColor: '#fff'
          }}
          onPress={() => {
            props.setShowOriginal(false);
            setIsQuiz(false);
            props.setShowOptions(false)
            props.setShowComments(true)
            props.changeViewStatus();
          }}>
          <Text style={props.viewStatus ? styles.allGrayFill : styles.all}>Responses</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderQuizTimerOrUploadOptions = () => {
    return isQuiz && !props.cue.graded ? (
      isQuizTimed && (!props.cue.submittedAt || props.cue.submittedAt !== "") ? (
        initiatedAt && initDuration !== 0 && props.cue.submittedAt === "" ? (
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "flex-end",
              backgroundColor: "#fff"
            }}>
            <CountdownCircleTimer
              size={120}
              key={initDuration}
              children={({ remainingTime }: any) => {
                if ((!remainingTime || remainingTime === 0) && !handlingSubmit) {
                  setHandlingSubmit(true);
                  handleSubmit();
                }
                const hours = Math.floor(remainingTime / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                const seconds = remainingTime % 60;
                return (
                  <Text
                    style={{
                      color: "#3B64F8"
                    }}>
                    {hours}h {minutes}m {seconds}s
                  </Text>
                );
              }}
              isPlaying={true}
              duration={duration}
              initialRemainingTime={initDuration}
              colors="#3B64F8"
            />
          </View>
        ) : null
      ) : null
    ) : (imported &&
      (type === "mp4" || type === "mp3" || type === "mov" || type === "mpeg" || type === "mp2" || type === "wav")) ||
      props.cue.graded ? null : (
      <View
        style={{
          marginLeft: 25,
          marginTop: 20,
          alignSelf: "flex-start",
          backgroundColor: "#fff",
          flexDirection: "row"
        }}>
        {/* <TouchableOpacity style={{ backgroundColor: "white", marginRight: 20 }} onPress={() => download(true)}>
          <Ionicons
            style={{ alignSelf: "center" }}
            name="reload-outline"
            color="#a2a2aa"
            size={20}
            onPress={() => setWebviewKey(Math.random())}
          />
          <Text
            style={{
              fontSize: 9,
              color: "#a2a2aa",
              textAlign: "center"
            }}>
            Reload
          </Text>
        </TouchableOpacity> */}

        {/* <a download={true} href={url} style={{ textDecoration: 'none' }}> */}
        <TouchableOpacity style={{ backgroundColor: "white" }} onPress={() => download(true)}>
          <Ionicons name="cloud-download-outline" color="#a2a2aa" size={20} style={{ alignSelf: "center" }} />
          <Text
            style={{
              fontSize: 9,
              color: "#a2a2aa",
              textAlign: "center"
            }}>
            Download
          </Text>
        </TouchableOpacity>
        {
          isOwner ?
            <TouchableOpacity
              style={{
                marginLeft: 15,
                backgroundColor: '#fff'
              }}
              onPress={() => clearAll()}
            >
              <Ionicons name="trash-outline" color="#a2a2aa" size={20} style={{ alignSelf: 'center' }} />
              <Text
                style={{
                  fontSize: 9,
                  color: "#a2a2aa",
                  textAlign: "center"
                }}>
                Remove
              </Text>
            </TouchableOpacity> : null
        }
        {/* </a> */}
      </View>
    );
  };

  const renderCueRemarks = () => {
    return !props.showOriginal && props.cue.graded && props.cue.comment ? (
      <View>
        <Text
          style={{
            color: "#202025",
            fontSize: 14,
            paddingBottom: 25,
            marginLeft: "5%"
          }}>
          {PreferredLanguageText("gradersRemarks")}
        </Text>
        <TextInput
          value={props.cue.comment}
          style={{
            height: 200,
            backgroundColor: "#f4f4f6",
            borderRadius: 10,
            fontSize: 15,
            padding: 15,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
          }}
          editable={false}
          placeholder={"Optional"}
          placeholderTextColor={"#a2a2aa"}
          multiline={true}
        />
      </View>
    ) : null;
  };

  const renderMainCueContent = () => (
    <View
      style={{
        width: "100%",
        minHeight: 475,
        backgroundColor: "white"
      }}>
      {!props.showOriginal ? null : isQuiz ? (
        isQuizTimed && !isOwner ? (
          initiatedAt ? (
            <View style={{ width: '100%', backgroundColor: '#fff', paddingBottom: 50 }}>
              <Quiz
                // disable quiz if graded or deadline has passed
                submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "" ? true : false}
                graded={props.cue.graded}
                hasEnded={currentDate >= deadline}
                solutions={solutions}
                problems={problems}
                setSolutions={(s: any) => setSolutions(s)}
                shuffleQuiz={shuffleQuiz}
                instructions={instructions}
                headers={headers}
              />
              {renderFooter()}
            </View>
          ) : (
            <View>
              <View style={{ backgroundColor: "#fff" }}>
                <TouchableOpacity
                  onPress={() => initQuiz()}
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    justifyContent: "center",
                    flexDirection: "row",
                    marginBottom: 50
                  }}>
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "#202025",
                      fontSize: 11,
                      overflow: "hidden",
                      backgroundColor: "#f4f4f6",
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      height: 35,
                      width: 200,
                      borderRadius: 15,
                      textTransform: "uppercase"
                    }}>
                    {PreferredLanguageText("startQuiz")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <View style={{ width: '100%', backgroundColor: '#fff', paddingBottom: 50 }}>
            <Quiz
              // disable quiz if graded or deadline has passed
              submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "" ? true : false}
              graded={props.cue.graded}
              hasEnded={currentDate >= deadline}
              solutions={solutions}
              problems={problems}
              setSolutions={(s: any) => setSolutions(s)}
              shuffleQuiz={shuffleQuiz}
              instructions={instructions}
              headers={headers}
            />
            {renderFooter()}
          </View>
        )
      ) : imported ? (
        type === "mp4" || type === "mp3" || type === "mov" || type === "mpeg" || type === "mp2" || type === "wav" ? (
          <View
            style={{
              backgroundColor: "#fff",
              height: 300
            }}>
            <Video
              isMuted={false}
              style={{
                width: "100%",
                height: 300
              }}
              source={{
                uri: url
              }}
              volume={1}
              useNativeControls={true}
              resizeMode="contain"
              isLooping={false}
            />
          </View>
        ) : (
          url && url !== '' ?
            <View key={url} style={{ zIndex: 1, height: 50000 }}>
              <Webview
                fullScreen={true}
                url={url}
                key={url}
              />
            </View> : null
        )
      ) : (
        renderRichEditorOriginalCue()
      )}
      {props.showOriginal ? null : submissionImported ? (
        submissionType === "mp4" ||
          submissionType === "mp3" ||
          submissionType === "mov" ||
          submissionType === "mpeg" ||
          submissionType === "mp2" ||
          submissionType === "wav" ? (
          <View
            style={{
              backgroundColor: "#fff",
              height: 300
            }}>
            <Video
              // ref={RichText}
              style={{
                width: "100%",
                height: 300
              }}
              source={{
                uri: submissionUrl
              }}
              isMuted={false}
              volume={1}
              useNativeControls={true}
              resizeMode="contain"
              isLooping={false}
            />
          </View>
        ) : (
          submissionUrl && submissionUrl !== '' ?
            <View key={submissionUrl} style={{ zIndex: 1, height: 50000 }}>
              <Webview
                fullScreen={true}
                key={submissionUrl}
                url={submissionUrl}
              />
            </View> : null
        )
      ) : (
        <View style={{ width: '100%', backgroundColor: '#fff', paddingBottom: 50 }}>
          {renderRichEditorModified()}
          {renderFooter()}
        </View>
      )}
    </View>
  );

  const renderRichEditorOriginalCue = () => (
    <RichEditor
      key={props.showOriginal.toString() + reloadEditorKey.toString()}
      disabled={!isOwner}
      containerStyle={{
        height: height,
        backgroundColor: "#f4f4f6",
        padding: 3,
        paddingTop: 5,
        paddingBottom: 10,
        borderRadius: 15
      }}
      ref={RichText}
      style={{
        width: "100%",
        backgroundColor: "#f4f4f6",
        minHeight: 475,
        borderRadius: 15
      }}
      editorStyle={{
        backgroundColor: "#f4f4f6",
        placeholderColor: "#a2a2aa",
        color: "#202025",
        contentCSSText: "font-size: 15px;"
      }}
      initialContentHTML={original}
      onScroll={() => Keyboard.dismiss()}
      placeholder={"Title"}
      onChange={text => {
        const modifedText = text.split("&amp;").join("&");
        setOriginal(modifedText);
      }}
      onHeightChange={handleHeightChange}
      onBlur={() => Keyboard.dismiss()}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      allowsFullscreenVideo={true}
      allowsInlineMediaPlayback={true}
      allowsLinkPreview={true}
      allowsBackForwardNavigationGestures={true}
    />
  );

  const renderRichEditorModified = () => (
    <RichEditor
      key={props.showOriginal.toString() + reloadEditorKey.toString()}
      containerStyle={{
        height: height,
        backgroundColor: "#f4f4f6",
        padding: 3,
        paddingTop: 5,
        paddingBottom: 10,
        borderRadius: 15
      }}
      disabled={(props.cue.graded && submission) || (currentDate > deadline && submission)}
      ref={RichText}
      style={{
        width: "100%",
        backgroundColor: "#f4f4f6",
        minHeight: 475,
        borderRadius: 15
      }}
      editorStyle={{
        backgroundColor: "#f4f4f6",
        placeholderColor: "#a2a2aa",
        color: "#202025",
        contentCSSText: "font-size: 15px;"
      }}
      initialContentHTML={cue}
      onScroll={() => Keyboard.dismiss()}
      placeholder={props.cue.channelId && props.cue.channelId !== '' ? (submission ? "Submission" : "Notes") : "Title"}
      onChange={text => {
        const modifedText = text.split("&amp;").join("&");
        setCue(modifedText);
      }}
      onHeightChange={handleHeightChange}
      onBlur={() => Keyboard.dismiss()}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      allowsFullscreenVideo={true}
      allowsInlineMediaPlayback={true}
      allowsLinkPreview={true}
      allowsBackForwardNavigationGestures={true}
    />
  );

  const renderShareWithOptions = () => {
    return props.cue.channelId && props.cue.channelId !== "" && isOwner ? (
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 40,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            Shared with
          </Text>
        </View>
        <View
          style={{
            // height: 350,
            flexDirection: "column",
            paddingTop: 25,
            overflow: "scroll",
            backgroundColor: "white"
          }}>
          <ScrollView
            style={{
              width: "100%",
              padding: 5,
              backgroundColor: "#fff"
            }}>
            <MultiSelectComponent
              selected={selected}
              onAddNew={(e: any) => {
                onAddNew(e)
              }}
              subscribers={subscribers}
            />
          </ScrollView>
        </View>
      </View>
    ) : null;
  };

  const renderSubmissionRequiredOptions = () => {
    return props.cue.channelId !== "" ? (
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%",
          backgroundColor: "white"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 60,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            {PreferredLanguageText("submissionRequired")}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "white"
          }}>
          {isOwner ? (
            <View
              style={{
                backgroundColor: "white",
                height: 40,
                paddingRight: 10
              }}>
              <Switch
                disabled={isQuiz}
                value={submission}
                onValueChange={() => {
                  setSubmission(!submission);
                }}
                style={{
                  height: 20,
                  marginRight: "auto"
                }}
                trackColor={{
                  false: "#f4f4f6",
                  true: "#a2a2aa"
                }}
                thumbColor="white"
              />
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff"
              }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#a2a2aa"
                }}>
                {!submission ? PreferredLanguageText("no") : null}
              </Text>
            </View>
          )}

          <View style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', width: '100%' }}>



            {submission ? (
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: Platform.OS === "android" ? "column" : "row",
                  backgroundColor: "white",
                  paddingTop: 10,
                  paddingBottom: 10
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#a2a2aa",
                    textAlign: "left",
                    paddingRight: 10
                  }}>
                  Available
                  {Platform.OS === "android" && isOwner ? ": " + moment(new Date(initiateAt)).format("MMMM Do YYYY, h:mm a") : null}
                </Text>
                {isOwner ? (
                  renderInitiateAtDateTimePicker()
                ) : (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#a2a2aa",
                      textAlign: "left"
                    }}>
                    {initiateAt.toLocaleString()}
                  </Text>
                )}
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff"
                }}
              />
            )}

            {submission ? (
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: Platform.OS === "android" ? "column" : "row",
                  backgroundColor: "white"
                }}>

                <Text
                  style={{
                    fontSize: 11,
                    color: "#a2a2aa",
                    textAlign: "left",
                    paddingRight: 10
                  }}>Deadline
                  {Platform.OS === "android" && isOwner ? ": " + moment(new Date(deadline)).format("MMMM Do YYYY, h:mm a") : null}
                </Text>
                {isOwner ? (
                  renderDeadlineDateTimePicker()
                ) : (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#a2a2aa",
                      textAlign: "left"
                    }}>
                    {deadline.toLocaleString()}
                  </Text>
                )}
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff"
                }}
              />
            )}
          </View>
        </View>
      </View>
    ) : null;
  };

  const renderGradeOptions = () => {
    return submission ? (
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%",
          backgroundColor: "white"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 40,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            Grade Weight
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "white"
          }}>
          <View
            style={{
              backgroundColor: "white",
              height: 40,
              paddingRight: 10
            }}>
            <Switch
              disabled={!isOwner}
              value={graded}
              onValueChange={() => setGraded(!graded)}
              style={{
                height: 20,
                marginRight: "auto"
              }}
              trackColor={{
                false: "#f4f4f6",
                true: "#a2a2aa"
              }}
              thumbColor="white"
            />
          </View>
          {graded ? (
            <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                backgroundColor: "white",
                marginTop: 10
              }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#a2a2aa",
                  textAlign: "left",
                  paddingRight: 10,
                  paddingLeft: 10
                }}>
                {PreferredLanguageText("percentageOverall")}
              </Text>
              {isOwner ? (
                <TextInput
                  value={gradeWeight}
                  style={styles.input}
                  placeholder={"0-100"}
                  onChangeText={val => setGradeWeight(val)}
                  placeholderTextColor={"#a2a2aa"}
                />
              ) : (
                <Text
                  style={{
                    color: "#a2a2aa",
                    textAlign: "left",
                    fontSize: 11
                  }}>
                  {gradeWeight}
                </Text>
              )}
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff"
              }}
            />
          )}
        </View>
      </View>
    ) : null;
  };

  const renderCategoryOptions = () => {
    return (props.cue.channelId && props.cue.channelId !== "" && isOwner) ||
      !props.cue.channelId ||
      props.cue.channelId === "" ? (
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%",
          borderRightWidth: 0,
          borderColor: "#f4f4f6"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 40,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            {PreferredLanguageText("category")}
          </Text>
        </View>
        {props.cue.channelId && !props.channelOwner ? (
          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              backgroundColor: "white"
            }}>
            <View
              style={{
                width: "85%",
                backgroundColor: "white"
              }}>
              <View style={styles.colorBar}>
                <TouchableOpacity style={styles.allGrayOutline} onPress={() => { }}>
                  <Text
                    style={{
                      color: "#a2a2aa",
                      lineHeight: 20,
                      fontSize: 11
                    }}>
                    {props.cue.customCategory === "" ? PreferredLanguageText("none") : props.cue.customCategory}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              backgroundColor: "white"
            }}>
            <View
              style={{
                width: "90%",
                backgroundColor: "white"
              }}>
              {addCustomCategory ? (
                <View style={styles.colorBar}>
                  <TextInput
                    value={customCategory}
                    style={styles.allGrayOutline}
                    placeholder={"Enter Category"}
                    onChangeText={val => {
                      setCustomCategory(val);
                    }}
                    placeholderTextColor={"#a2a2aa"}
                  />
                </View>
              ) : (
                <Menu
                  onSelect={(cat: any) => setCustomCategory(cat)}>
                  <MenuTrigger>
                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2aa' }}>
                      {customCategory === '' ? 'None' : customCategory}<Ionicons name='caret-down' size={14} />
                    </Text>
                  </MenuTrigger>
                  <MenuOptions customStyles={{
                    optionsContainer: {
                      padding: 10,
                      borderRadius: 15,
                      shadowOpacity: 0,
                      borderWidth: 1,
                      borderColor: '#f4f4f6'
                    }
                  }}>
                    <MenuOption
                      value={''}>
                      <Text>
                        None
                      </Text>
                    </MenuOption>
                    {
                      customCategories.map((category: any) => {
                        return <MenuOption
                          value={category}>
                          <Text>
                            {category}
                          </Text>
                        </MenuOption>
                      })
                    }
                  </MenuOptions>
                </Menu>
              )}
            </View>
            <View
              style={{
                width: "10%",
                backgroundColor: "white"
              }}>
              <TouchableOpacity
                onPress={() => {
                  if (addCustomCategory) {
                    setCustomCategory("");
                    setAddCustomCategory(false);
                  } else {
                    setCustomCategory("");
                    setAddCustomCategory(true);
                  }
                }}
                style={{
                  backgroundColor: "white"
                }}>
                <Text
                  style={{
                    textAlign: "right",
                    lineHeight: 20,
                    width: "100%"
                  }}>
                  <Ionicons name={addCustomCategory ? "close" : "add"} size={20} color={"#a2a2aa"} />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ) : null;
  };

  const renderPriorityOptions = () => (
    <View
      style={{
        width: width < 768 ? "100%" : "33.33%",
        borderRightWidth: 0,
        borderColor: "#f4f4f6"
      }}>
      <View
        style={{
          width: "100%",
          paddingTop: 40,
          paddingBottom: 15,
          backgroundColor: "white"
        }}>
        <Text
          style={{
            fontSize: 11,
            color: "#a2a2aa",
            textTransform: 'uppercase'
          }}>
          {PreferredLanguageText("priority")}
        </Text>
      </View>
      <View
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "white"
        }}>
        <View
          style={{
            width: "100%",
            backgroundColor: "white"
          }}>
          <ScrollView
            style={{
              ...styles.colorBar,
              height: 25
            }}
            horizontal={true}
            showsHorizontalScrollIndicator={false}>
            {colorChoices.map((c: string, i: number) => {
              return (
                <TouchableOpacity
                  style={color == i ? styles.colorContainerOutline : styles.colorContainer}
                  key={Math.random()}
                  onPress={() => {
                    setColor(i);
                  }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 9,
                      backgroundColor: colorChoices[i]
                    }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderForwardOptions = () => {
    return channels.length === 0 ? null : (
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%",
          borderRightWidth: 0,
          borderColor: "#f4f4f6",
          backgroundColor: "white"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 40,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            {/* {PreferredLanguageText("share")} */}
            Forward
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "white"
          }}>
          <View
            style={{
              width: "90%",
              backgroundColor: "white"
            }}>
            <Menu
              onSelect={(channel: any) => {
                if (channel === '') {
                  setShareWithChannelId('')
                  setShareWithChannelName('')
                } else {
                  setShareWithChannelId(channel._id)
                  setShareWithChannelName(channel.name)
                }
              }}>
              <MenuTrigger>
                <Text style={{ fontFamily: 'inter', fontSize: 14, color: shareWithChannelName === '' ? '#a2a2aa' : '#202025' }}>
                  {shareWithChannelName === '' ? 'None' : shareWithChannelName}<Ionicons name='caret-down' size={14} />
                </Text>
              </MenuTrigger>
              <MenuOptions customStyles={{
                optionsContainer: {
                  padding: 10,
                  borderRadius: 15,
                  shadowOpacity: 0,
                  borderWidth: 1,
                  borderColor: '#f4f4f6'
                }
              }}>
                <MenuOption
                  value={''}>
                  <Text>
                    None
                  </Text>
                </MenuOption>
                {
                  channels.map((channel: any) => {
                    return <MenuOption
                      value={channel}>
                      <Text>
                        {channel.name}
                      </Text>
                    </MenuOption>
                  })
                }
              </MenuOptions>
            </Menu>
          </View>
          <View
            style={{
              width: "10%",
              backgroundColor: "white"
            }}>
            <TouchableOpacity
              disabled={shareWithChannelId === ""}
              onPress={() => shareCue()}
              style={{
                backgroundColor: "white"
              }}>
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 20,
                  width: "100%"
                }}>
                <Ionicons
                  name={"arrow-redo-outline"}
                  size={20}
                  color={shareWithChannelId === "" ? "#a2a2aa" : "#202025"}
                />
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderReminderOptions = () => (
    <View
      style={{
        width: "100%",
        paddingTop: 15,
        flexDirection: width < 768 ? "column" : "row",
        backgroundColor: "white"
      }}>
      <View
        style={{
          width: width < 768 ? "100%" : "33.33%",
          backgroundColor: "white"
        }}>
        <View
          style={{
            width: "100%",
            paddingTop: 40,
            paddingBottom: 15,
            backgroundColor: "white"
          }}>
          <Text
            style={{
              fontSize: 11,
              color: "#a2a2aa",
              textTransform: 'uppercase'
            }}>
            Reminder
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            width: "100%",
            height: 40,
            paddingRight: 10
          }}>
          <Switch
            value={notify}
            onValueChange={() => {
              if (notify) {
                // setShuffle(false)
                setFrequency("0");
              } else {
                // setShuffle(true)
                setFrequency("1-D");
              }
              setPlayChannelCueIndef(true);
              setNotify(!notify);
            }}
            style={{
              height: 20,
              marginRight: "auto"
            }}
            trackColor={{
              false: "#f4f4f6",
              true: "#3B64F8"
            }}
            thumbColor="white"
          />
        </View>
      </View>
      {notify ? (
        <View
          style={{
            width: width < 768 ? "100%" : "33.33%",
            backgroundColor: "white"
          }}>
          <View
            style={{
              width: "100%",
              paddingTop: 40,
              paddingBottom: 15,
              backgroundColor: "white"
            }}>
            <Text
              style={{
                fontSize: 11,
                color: "#a2a2aa",
                textTransform: 'uppercase'
              }}>
              Recurring
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#fff"
            }}>
            <View
              style={{
                backgroundColor: "white",
                height: 40,
                paddingRight: 10
              }}>
              <Switch
                value={!shuffle}
                onValueChange={() => setShuffle(!shuffle)}
                style={{
                  height: 20,
                  marginRight: "auto"
                }}
                trackColor={{
                  false: "#f4f4f6",
                  true: "#a2a2aa"
                }}
                thumbColor="white"
              />
            </View>
            {!shuffle ? (
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: "white"
                }}>
                <Text style={styles.text}>{PreferredLanguageText("remindEvery")}</Text>
                <Menu
                  onSelect={(cat: any) => {
                    setFrequency(cat.value)
                    setFrequencyName(cat.label)
                  }}>
                  <MenuTrigger>
                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2aa' }}>
                      {frequencyName}<Ionicons name='caret-down' size={14} />
                    </Text>
                  </MenuTrigger>
                  <MenuOptions customStyles={{
                    optionsContainer: {
                      padding: 10,
                      borderRadius: 15,
                      shadowOpacity: 0,
                      borderWidth: 1,
                      borderColor: '#f4f4f6'
                    }
                  }}>
                    {
                      timedFrequencyOptions.map((item: any) => {
                        return <MenuOption
                          value={item}>
                          <Text>
                            {item.value === '0' && channelId !== '' ? 'Once' : item.label}
                          </Text>
                        </MenuOption>
                      })
                    }
                  </MenuOptions>
                </Menu>
              </View>
            ) : (
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: Platform.OS === "android" ? "column" : "row",
                  backgroundColor: "white"
                }}>
                <Text style={styles.text}>
                  {PreferredLanguageText("remindOn")}
                  {Platform.OS === "android" ? ": " + moment(new Date(endPlayAt)).format("MMMM Do YYYY, h:mm a") : null}
                </Text>
                {renderEndPlayAtDateTimePicker()}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: "#fff" }} />
      )}
      {notify && !shuffle ? (
        <View
          style={{
            width: width < 768 ? "100%" : "33.33%",
            backgroundColor: "#fff"
          }}>
          <View
            style={{
              width: "100%",
              paddingTop: 40,
              paddingBottom: 15,
              backgroundColor: "white"
            }}>
            <Text
              style={{
                fontSize: 11,
                color: "#a2a2aa",
                textTransform: 'uppercase'
              }}>
              Indefinite
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#fff"
            }}>
            <View
              style={{
                backgroundColor: "white",
                height: 40,
                paddingRight: 10
              }}>
              <Switch
                value={playChannelCueIndef}
                onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                style={{
                  height: 20,
                  marginRight: "auto"
                }}
                trackColor={{
                  false: "#f4f4f6",
                  true: "#a2a2aa"
                }}
                thumbColor="white"
              />
            </View>
            {playChannelCueIndef ? (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff"
                }}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: Platform.OS === "android" ? "column" : "row",
                  backgroundColor: "white"
                }}>
                <Text style={styles.text}>
                  {PreferredLanguageText("remindTill")}
                  {Platform.OS === "android" ? ": " + moment(new Date(endPlayAt)).format("MMMM Do YYYY, h:mm a") : null}
                </Text>
                {renderEndPlayAtDateTimePicker()}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: "#fff" }} />
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          height: 50,
          paddingTop: 10
        }}>
        {isOwner || !props.cue.channelId || props.cue.channelId === "" ? (
          <TouchableOpacity
            onPress={() => handleDelete()}
            style={{
              backgroundColor: "white",
              borderRadius: 15
            }}>
            <Text
              style={{
                textAlign: "center",
                lineHeight: 35,
                color: "white",
                fontSize: 11,
                backgroundColor: "#3B64F8",
                borderRadius: 15,
                paddingHorizontal: 25,
                fontFamily: "inter",
                overflow: "hidden",
                height: 35,
                textTransform: "uppercase"
              }}>
              {isOwner
                ? props.cue.channelId && props.cue.channelId !== ""
                  ? PreferredLanguageText("deleteForEveryone")
                  : PreferredLanguageText("delete")
                : PreferredLanguageText("delete")}
            </Text>
          </TouchableOpacity>
        ) : null}
        {!isOwner && props.cue.channelId && props.cue.channelId !== "" && submission ? (
          <TouchableOpacity
            disabled={
              // if user has not signed up
              !userSetupComplete ||
              // deadline has passed & its not an initiated timed quiz
              (currentDate >= deadline && !(isQuiz && isQuizTimed && initiatedAt)) ||
              // graded
              props.cue.graded ||
              // if timed quiz not initiated
              (isQuiz && isQuizTimed && !initiatedAt) ||
              // if quiz submitted already
              (isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "")
            }
            onPress={() => handleSubmit()}
            style={{
              backgroundColor: "white",
              borderRadius: 15
            }}>
            <Text
              style={{
                textAlign: "center",
                lineHeight: 35,
                color: "white",
                fontSize: 11,
                backgroundColor: "#3B64F8",
                borderRadius: 15,
                paddingHorizontal: 25,
                fontFamily: "inter",
                overflow: "hidden",
                height: 35,
                textTransform: 'uppercase'
              }}>
              {userSetupComplete
                ? (props.cue.submittedAt && props.cue.submittedAt !== "") || submitted
                  ? props.cue.graded
                    ? PreferredLanguageText("graded")
                    : isQuiz
                      ? PreferredLanguageText("submitted")
                      : currentDate < deadline
                        ? PreferredLanguageText("resubmit")
                        : PreferredLanguageText("submissionEnded")
                  : currentDate < deadline
                    ? PreferredLanguageText("submit")
                    : PreferredLanguageText("submissionEnded")
                : PreferredLanguageText("signupToSubmit")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const width = Dimensions.get("window").width;

  if (loading) {
    return null;
  }

  if (initiateAt > new Date() && !isOwner) {

    return (<View style={{ minHeight: Dimensions.get('window').height }}>
      <View style={{ backgroundColor: 'white', flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 21, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', textAlign: 'center', }}>
          Available from {moment(initiateAt).format('MMMM Do YYYY, h:mm a')}
        </Text>
      </View>
    </View>)
  }

  console.log(props.cue)

  if (props.cue.submission && props.cue.submittedAt !== null && !props.cue.releaseSubmission && !isOwner) {
    return (<View style={{ minHeight: Dimensions.get('window').height }}>
      <View style={{ backgroundColor: 'white', flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 21, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', textAlign: 'center', }}>
          Your instructor has not made this submission available.
        </Text>
      </View>
    </View>)
  }


  return (
    <View
      style={{
        width: "100%",
        // height: Dimensions.get('window').height - 85,
        backgroundColor: "white",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        paddingHorizontal: 25
        // overflow: 'hidden'
      }}>
      <Animated.View
        style={{
          width: "100%",
          backgroundColor: "white",
          opacity: 1,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
          // height: '100%'
        }}>
        <Text
          style={{
            width: "100%",
            textAlign: "center",
            height: 15,
            paddingBottom: 30
          }}>
          {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
        </Text>
        {props.cue.channelId && props.cue.channelId !== "" ? (
          <View
            style={{
              width: "100%",
              marginBottom: 5,
              backgroundColor: "#fff"
            }}>
            <View style={{ backgroundColor: 'white', flex: 1, flexDirection: 'row', paddingBottom: 10 }}>
              {props.cue.graded && props.cue.score !== undefined && props.cue.score !== null && !isQuiz ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: "white",
                    height: 22,
                    overflow: "hidden",
                    paddingHorizontal: 10,
                    marginLeft: 10,
                    borderRadius: 10,
                    backgroundColor: "#3B64F8",
                    lineHeight: 20,
                    paddingTop: 1
                  }}>
                  {props.cue.score}%
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => setStarred(!starred)}
                style={{
                  backgroundColor: "white",
                  flex: 1,
                  marginTop: -20,
                  // paddingRight: 25
                }}>
                <Text
                  style={{
                    textAlign: "right",
                    lineHeight: 34,
                    marginTop: 0,
                    backgroundColor: 'white'
                  }}>
                  <Ionicons name="bookmark" size={34} color={starred ? "#d91d56" : "#a2a2aa"} />
                </Text>
              </TouchableOpacity>
            </View>
            {renderCueTabs()}
          </View>
        ) : (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{
                justifyContent: "center",
                flexDirection: "column",
                backgroundColor: '#fff'
              }}
              onPress={() => {
                props.setShowOptions(false)
                // props.setShowOptions(false)
              }}
            >
              <Text style={!props.showOptions ? styles.allGrayFill : styles.all}>
                {PreferredLanguageText("viewShared")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                justifyContent: "center",
                flexDirection: "column",
                backgroundColor: '#fff'
              }}
              onPress={() => {
                props.setShowOptions(true)
              }}>
              <Text style={props.showOptions ? styles.allGrayFill : styles.all}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStarred(!starred)}
              style={{
                backgroundColor: "white",
                flex: 1
              }}>
              <Text
                style={{
                  textAlign: "right",
                  lineHeight: 34,
                  marginTop: -25,
                  paddingBottom: 25,
                  width: "100%"
                }}>
                <Ionicons name="bookmark" size={34} color={starred ? "#d91d56" : "#a2a2aa"} />
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {
          props.showOptions || props.showComments ? null :
            <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: Dimensions.get("window").width < 768 ? "column-reverse" : "row",
                paddingBottom: 4,
                backgroundColor: "white"
              }}
              onTouchStart={() => Keyboard.dismiss()}>
              <View
                style={{
                  flexDirection: submissionImported || showImportOptions ? "row" : "column",
                  flex: 1,
                  backgroundColor: "#fff"
                }}>
                {renderRichToolbar()}
                {(!props.showOriginal && props.cue.submission && !submissionImported && showImportOptions)
                  || (props.showOriginal && showImportOptions && isOwner) ? (
                  <FileUpload
                    back={() => setShowImportOptions(false)}
                    onUpload={(u: any, t: any) => {
                      const obj = {
                        url: u,
                        type: t,
                        title: props.showOriginal ? title : submissionTitle
                      };
                      if (props.showOriginal) {
                        setOriginal(JSON.stringify(obj))
                      } else {
                        setCue(JSON.stringify(obj))
                      }
                      setShowImportOptions(false);
                    }}
                  />
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: 'flex-end',
                  backgroundColor: "#fff",
                  marginTop: 10
                }}>
                {!props.showOriginal &&
                  props.cue.submission &&
                  currentDate < deadline &&
                  !submissionImported &&
                  !showImportOptions &&
                  !props.cue.graded && !isQuiz ? (
                  <Text
                    style={{
                      color: "#a2a2aa",
                      fontSize: 11,
                      lineHeight: 30,
                      textAlign: "right",
                      // paddingRight: 10,
                      paddingLeft: 10,
                      textTransform: "uppercase"
                    }}
                    onPress={() => {
                      setShowImportOptions(true);
                      fileUpload();
                    }}>
                    {PreferredLanguageText("import")} {Dimensions.get("window").width < 768 ? "" : "|  "}
                  </Text>
                ) :
                  (props.showOriginal && !isOwner) || // viewing import as non import
                    (props.showOriginal && isOwner && imported) ||  // viewing import as owner
                    (!props.showOriginal && isOwner && (props.cue.channelId && props.cue.channelId !== '')) || // no submission as owner
                    (!props.showOriginal && submissionImported && !isOwner) ||  // submitted as non owner
                    (!props.showOriginal && !submission && (props.cue.channelId && props.cue.channelId !== '')) || // my notes
                    isQuiz
                    ? null :
                    (
                      <Text style={{
                        color: '#a2a2aa',
                        fontSize: 11,
                        lineHeight: 30,
                        textAlign: 'right',
                        paddingLeft: 10,
                        // paddingRight: 10,
                        textTransform: 'uppercase'
                      }}
                        onPress={() => setShowImportOptions(true)}
                      >
                        {PreferredLanguageText('import')}     {Dimensions.get('window').width < 768 ? '' : '   '}
                      </Text>
                    )}
                {/* <Text
              style={{
                color: "#a2a2aa",
                fontSize: 11,
                lineHeight: 30,
                flex: 1,
                textAlign: "right",
                marginRight: 10
              }}>
              {now.toString().split(" ")[1] + " " + now.toString().split(" ")[2] + ", " + now.toString().split(" ")[3]}
            </Text> */}
              </View>
            </View>
        }
        {renderEquationEditor()}
        <View style={{ backgroundColor: 'white' }}>
          {
            props.showComments || props.showOptions ? null :
              <View style={{ backgroundColor: '#fff' }}>
                {props.showOriginal && (imported || isQuiz) ? (
                  <View
                    style={{
                      flexDirection: "row",
                      marginRight: 0,
                      marginLeft: 0,
                      backgroundColor: "#fff"
                    }}>
                    <View
                      style={{
                        width: "65%",
                        alignSelf: "flex-start",
                        backgroundColor: "#fff"
                      }}>
                      <TextInput
                        editable={isOwner}
                        value={title}
                        style={styles.input}
                        placeholder={"Title"}
                        onChangeText={val => setTitle(val)}
                        placeholderTextColor={"#a2a2aa"}
                      />
                    </View>
                    {renderQuizTimerOrUploadOptions()}
                  </View>
                ) : null}
                {renderCueRemarks()}
                {!props.showOriginal && submissionImported && !isQuiz ? (
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "white"
                    }}>
                    <View
                      style={{
                        width: "85%",
                        alignSelf: "flex-start",
                        backgroundColor: "white"
                      }}>
                      <TextInput
                        value={submissionTitle}
                        style={styles.input}
                        placeholder={"Title"}
                        onChangeText={val => setSubmissionTitle(val)}
                        placeholderTextColor={"#a2a2aa"}
                      />
                    </View>
                    {props.cue.submittedAt && props.cue.submittedAt !== "" ? (
                      <View
                        style={{
                          width: 175,
                          marginLeft: 25,
                          marginTop: 5,
                          alignSelf: "flex-start"
                        }}>
                        {/* <a download={true} href={submissionUrl} style={{ textDecoration: 'none' }}> */}
                        <TouchableOpacity style={{ backgroundColor: "white" }} onPress={() => download(true)}>
                          <Ionicons name="cloud-download-outline" color="#a2a2aa" size={20} style={{ alignSelf: "center" }} />
                          <Text
                            style={{
                              fontSize: 9,
                              color: "#a2a2aa",
                              textAlign: "center"
                            }}>
                            Download
                          </Text>
                        </TouchableOpacity>
                        {/* </a> */}
                        {
                          props.cue.graded || (currentDate > deadline) ? null :
                            <TouchableOpacity
                              style={{
                                marginLeft: 15,
                                backgroundColor: '#fff'
                              }}
                              onPress={() => clearAll()}
                            >
                              <Ionicons name="trash-outline" color="#a2a2aa" size={20} style={{ alignSelf: 'center' }} />
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: "#a2a2aa",
                                  textAlign: "center"
                                }}>
                                Remove
                              </Text>
                            </TouchableOpacity>
                        }
                      </View>
                    ) : <TouchableOpacity
                      style={{
                        marginLeft: 15,
                        paddingTop: 10,
                        backgroundColor: '#fff'
                      }}
                      onPress={() => clearAll()}
                    >
                      <Ionicons name="trash-outline" color="#a2a2aa" size={20} style={{ alignSelf: 'center' }} />
                      <Text
                        style={{
                          fontSize: 9,
                          color: "#a2a2aa",
                          textAlign: "center"
                        }}>
                        Remove
                      </Text>
                    </TouchableOpacity>}
                  </View>
                ) : null}
                {submissionImported || imported ? (
                  // This is because the toolbar wont have an editor to connect with if the file is imported
                  <RichEditor
                    key={props.showOriginal.toString() + reloadEditorKey.toString()}
                    disabled={true}
                    containerStyle={{
                      display: "none"
                    }}
                    ref={RichText}
                    style={{
                      display: "none"
                    }}
                  />
                ) : null}
                {isQuiz && cueGraded && !isV0Quiz ? <QuizGrading
                  problems={problems}
                  solutions={quizSolutions}
                  partiallyGraded={false}
                  //  onGradeQuiz={onGradeQuiz}
                  comment={comment}
                  isOwner={false}
                  headers={headers}
                /> : renderMainCueContent()}
                {/* <TouchableOpacity
                  onPress={() => setShowOptions(!showOptions)}
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    // marginTop: 20,
                    backgroundColor: "#fff",
                    borderTopColor: "#f4f4f6",
                    // borderTopWidth: 1,
                    marginTop: 20,
                    paddingTop: 20,
                    paddingBottom: 20
                  }}>
                  <Text style={{
                    lineHeight: 23,
                    marginRight: 10,
                    color: '#a2a2aa',
                    fontSize: 11,
                    textTransform: 'uppercase'
                  }}>
                    {PreferredLanguageText('options') + '       '}
                  </Text>
                  <Text style={{ lineHeight: 21 }}>
                    <Ionicons size={14} name={showOptions ? 'caret-down-outline' : 'caret-forward-outline'} color='#a2a2aa' />
                  </Text>
                </TouchableOpacity> */}
              </View>
          }
          <Collapsible collapsed={!props.showOptions} key={props.showOptions.toString()}>
            <View
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column"
              }}>
              {props.cue.channelId ? (
                <View
                  style={{
                    display: "flex",
                    flexDirection: width < 768 ? "column" : "row"
                  }}>
                  {renderShareWithOptions()}
                  {renderSubmissionRequiredOptions()}
                  {renderGradeOptions()}
                </View>
              ) : null}
              <View
                style={{
                  display: "flex",
                  flexDirection: width < 768 ? "column" : "row"
                }}>
                {renderCategoryOptions()}
                {renderPriorityOptions()}
                {renderForwardOptions()}
              </View>
            </View>
            {renderReminderOptions()}
            {isQuiz && isOwner ? <View style={{ width: width < 768 ? '100%' : '33.33%', backgroundColor: 'white' }}>
              <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                <Text style={{ fontSize: 11, color: '#a2a2aa', textTransform: 'uppercase' }}>
                  Shuffle Questions
                </Text>
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
                <View style={{
                  backgroundColor: 'white',
                  height: 40,
                  marginRight: 10
                }}>
                  <Switch
                    value={shuffleQuiz}
                    disabled={true}
                    onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                    style={{ height: 20 }}
                    trackColor={{
                      false: '#f4f4f6',
                      true: '#a2a2aa'
                    }}
                    thumbColor='white'
                  />
                </View>
              </View>
            </View> : null}
            {/* {renderFooter()} */}
          </Collapsible>
        </View>
      </Animated.View>
    </View>
  );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
  timePicker: {
    width: 125,
    fontSize: 16,
    height: 45,
    color: "#202025",
    borderRadius: 10,
    marginLeft: 10
  },
  cuesInput: {
    width: "100%",
    backgroundColor: "#f4f4f6",
    borderRadius: 15,
    fontSize: 21,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: "4%"
  },
  footer: {
    width: "100%",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "row",
    marginTop: 80,
    lineHeight: 18
  },
  colorContainer: {
    // lineHeight: 20,
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    marginHorizontal: 7,
    padding: 4,
    backgroundColor: "white"
  },
  colorContainerOutline: {
    lineHeight: 20,
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    marginHorizontal: 7,
    paddingHorizontal: 5,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#a2a2aa"
  },
  input: {
    width: "100%",
    borderBottomColor: "#f4f4f6",
    borderBottomWidth: 1,
    fontSize: 15,
    padding: 15,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 5,
    marginBottom: 20
  },
  date: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    paddingBottom: 4,
    backgroundColor: "white"
  },
  colorBar: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "white",
    lineHeight: 20
  },
  shuffleContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-end",
    backgroundColor: "white",
    paddingTop: 40
  },
  col1: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "white",
    paddingRight: 7.5
  },
  col2: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "white",
    paddingLeft: 7.5
  },
  picker: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "white",
    overflow: "hidden",
    fontSize: 11,
    textAlign: "center",
    width: 100,
    height: 200,
    alignSelf: "center",
    marginTop: -20,
    borderRadius: 3
  },
  text: {
    fontSize: 11,
    color: "#a2a2aa",
    textAlign: "left",
    paddingHorizontal: 10
  },
  all: {
    fontSize: 11,
    color: "#a2a2aa",
    height: 22,
    overflow: "hidden",
    paddingHorizontal: 10,
    backgroundColor: "white",
    lineHeight: 20
  },
  allOutline: {
    fontSize: 11,
    backgroundColor: "#202025",
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  allBlack: {
    fontSize: 11,
    color: "#202025",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allGrayFill: {
    fontSize: 11,
    overflow: "hidden",
    color: "#fff",
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#a2a2aa",
    lineHeight: 20
  },
  allGrayOutline: {
    fontSize: 11,
    color: "#a2a2aa",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a2a2aa",
    lineHeight: 20
  },
  color1: {
    backgroundColor: "#d91d56"
  },
  color2: {
    backgroundColor: "#ED7D22"
  },
  color3: {
    backgroundColor: "#F8D41F"
  },
  color4: {
    backgroundColor: "#B8D41F"
  },
  color5: {
    backgroundColor: "#53BE6D"
  },
  outline: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a2a2aa",
    fontSize: 11
  }
});
