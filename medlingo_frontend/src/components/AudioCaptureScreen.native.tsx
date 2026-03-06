import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { colors, spacing, borderRadius, typography } from '../theme';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { processAudioApi } from '../api/audioApi';
import * as FileSystem from 'expo-file-system/legacy';

interface ConversationEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  original: string;
  translated: string;
  timestamp: number;
  originalAudioUrl?: string;
  translatedAudioUrl?: string;
  translatedAudioBase64?: string;
  mime?: string;

  // NEW: status + recording meta
  status?: 'recording' | 'processed';
}

interface AudioCaptureScreenProps {
  onBack?: () => void;
  onEndSession?: (duration: number, conversationCount: number) => void;
  languages?: { provider: string; patient: string };
  sessionId?: string | null;
}

const AudioCaptureScreen: React.FC<AudioCaptureScreenProps> = ({
  onBack,
  onEndSession,
  languages,
  sessionId,
}) => {
  console.log('AudioCaptureScreen mounted with sessionId:', sessionId);

  const [isRecordingDoctor, setIsRecordingDoctor] = useState(false);
  const [isRecordingPatient, setIsRecordingPatient] = useState(false);
  const [isTranslatingDoctor, setIsTranslatingDoctor] = useState(false);
  const [isTranslatingPatient, setIsTranslatingPatient] = useState(false);
  const [isProcessingDoctor, setIsProcessingDoctor] = useState(false);
  const [isProcessingPatient, setIsProcessingPatient] = useState(false);
  const [doctorOut, setDoctorOut] = useState('');
  const [patientOut, setPatientOut] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [historyContainerHeight, setHistoryContainerHeight] = useState(0);
  const [historyContentHeight, setHistoryContentHeight] = useState(0);
  const [historyScrollY, setHistoryScrollY] = useState(0);

  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] =
    useState<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Track which history bubble corresponds to the *current* recording
  const [activeRecordingEntryId, setActiveRecordingEntryId] = useState<string | null>(
    null,
  );

  // Audio playback state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSessionTime(p => p + 1), 1000);

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllRecordings(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAllRecordings = async (clearBubble = false) => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {}
      setRecording(null);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    setIsRecordingDoctor(false);
    setIsRecordingPatient(false);
    setRecordingDuration(0);

    if (clearBubble && activeRecordingEntryId) {
      // remove pending bubble if we’re cancelling mid-recording
      setHistory(prev => prev.filter(e => e.id !== activeRecordingEntryId));
      setActiveRecordingEntryId(null);
    }
  };

  const formatSessionTime = () => {
    const totalSeconds = sessionTime;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLanguageName = (code: string) => {
    const map: { [k: string]: string } = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      ru: 'Russian',
    };
    return map[code] || 'English';
  };

  const startAudioRecording = async (type: 'doctor' | 'patient') => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Error', 'Microphone permission is required.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setRecordingDuration(0);
      const t = setInterval(() => setRecordingDuration(p => p + 1), 1000);
      setRecordingTimer(t);
    } catch (e) {
      if (type === 'doctor') {
        setIsRecordingDoctor(false);
        setIsTranslatingDoctor(false);
        setIsProcessingDoctor(false);
      } else {
        setIsRecordingPatient(false);
        setIsTranslatingPatient(false);
        setIsProcessingPatient(false);
      }

      let errorMessage = 'Could not access microphone. Please check permissions.';
      if (e instanceof Error) {
        if (e.message.includes('permission')) {
          errorMessage =
            'Microphone permission denied. Please allow microphone access in settings and try again.';
        } else if (e.message.includes('not available')) {
          errorMessage = 'Microphone not available. Please check if another app is using it.';
        }
      }

      Alert.alert('Microphone Error', errorMessage);
      console.error('Recording error:', e);
    }
  };

  const decodeBase64ToWav = async (base64Audio: string, prefix: string = 'tts') => {
    try {
      const fileUri = `${FileSystem.cacheDirectory}${prefix}_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Decoded Base64 → WAV saved at:', fileUri);
      return fileUri;
    } catch (err) {
      console.log('decodeBase64ToWav ERROR:', err);
      return null;
    }
  };

  const playTranslatedOutput = async (resp: any, fallbackUri: string) => {
    if (resp.audioBase64) {
      console.log('Playing translated audio via Base64 decode → WAV');
      await playBase64DecodedWav(resp.audioBase64);
      return;
    }

    if (resp.audioUrl) {
      console.log('Playing translated audio via HTTP URL:', resp.audioUrl);
      await playAudio(resp.audioUrl);
      return;
    }

    console.log('No translated audio, playing original:', fallbackUri);
    await playAudio(fallbackUri);
  };

  const stopAudioRecording = async (type: 'doctor' | 'patient') => {
    if (!recording) return;

    const recordingEntryId = activeRecordingEntryId; // snapshot

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (!uri) {
        Alert.alert('Recording Error', 'No audio file was created.');
        if (type === 'doctor') {
          setIsRecordingDoctor(false);
          setIsTranslatingDoctor(false);
          setIsProcessingDoctor(false);
        } else {
          setIsRecordingPatient(false);
          setIsTranslatingPatient(false);
          setIsProcessingPatient(false);
        }
        setRecordingDuration(0);

        if (recordingEntryId) {
          setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
          setActiveRecordingEntryId(null);
        }
        return;
      }

      let permanentAudioUri = uri;
      try {
        const timestamp = Date.now();
        const fileName = `audio_${type}_${timestamp}.m4a`;
        const permanentPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: uri,
          to: permanentPath,
        });
        permanentAudioUri = permanentPath;
        console.log(`Copied audio file to permanent location: ${permanentAudioUri}`);
      } catch (copyError) {
        console.log('Failed to copy audio file, using original URI:', copyError);
      }

      if (type === 'doctor') {
        setIsRecordingDoctor(false);
        setIsTranslatingDoctor(true);

        const providerLang = languages?.provider || 'en';
        const patientLang = languages?.patient || 'es';

        const sourceLangForSession = providerLang;
        const targetLangForSession = patientLang;

        (async () => {
          try {
            if (!uri) throw new Error('No recording URI');

            console.log('Sending doctor audio to backend (real):', {
              uri: permanentAudioUri,
              sessionId,
              sourceLang: sourceLangForSession,
              targetLang: targetLangForSession,
              role: 'physician',
            });

            const info = await FileSystem.getInfoAsync(permanentAudioUri);
            console.log('Doctor: Audio file info:', info);

            if (!info.exists || info.size === 0) {
              setIsTranslatingDoctor(false);
              setIsProcessingDoctor(false);
              setIsProcessingAudio(false);
              Alert.alert('Error', 'Audio file missing or empty. Please try again.');

              if (recordingEntryId) {
                setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
                setActiveRecordingEntryId(null);
              }
              return;
            }

            const resp = await processAudioApi({
              fileUri: permanentAudioUri,
              sessionId: sessionId || '',
              sourceLang: sourceLangForSession,
              targetLang: targetLangForSession,
              role: 'physician',
            });

            console.log('processAudioApi doctor response:', resp);

            const finalOriginal =
              resp.transcript || '[No transcript available from backend]';
            const finalTranslated =
              resp.translatedText || '[No translation available from backend]';

            setDoctorOut(
              `${finalOriginal} → ${finalTranslated} (${getLanguageName(patientLang)})`,
            );

            setIsTranslatingDoctor(false);
            setIsProcessingDoctor(true);

            // UPDATE existing bubble instead of creating new
            if (recordingEntryId) {
              setHistory(prev =>
                prev.map(entry =>
                  entry.id === recordingEntryId
                    ? {
                        ...entry,
                        status: 'processed',
                        original: finalOriginal,
                        translated: finalTranslated,
                        originalAudioUrl: permanentAudioUri,
                        translatedAudioUrl: resp.audioUrl || undefined,
                        translatedAudioBase64: resp.audioBase64 || undefined,
                        mime: resp.mime,
                        timestamp: Date.now(),
                      }
                    : entry,
                ),
              );
            }

            setIsTranslatingDoctor(false);
            setIsProcessingDoctor(false);

            try {
              await playTranslatedOutput(resp, permanentAudioUri);
            } catch (err) {
              console.log('Doctor: playback handler failed, fallback:', err);
              await playAudio(permanentAudioUri);
            }
          } catch (err) {
            console.log('Doctor audio backend error:', err);
            setIsTranslatingDoctor(false);
            setIsProcessingDoctor(false);
            setIsProcessingAudio(false);

            let msg = 'Failed to process audio.';
            if (err instanceof Error) msg = err.message;
            Alert.alert('Doctor Audio Error', msg);

            if (recordingEntryId) {
              setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
            }
          } finally {
            setIsTranslatingDoctor(false);
            setIsProcessingDoctor(false);
            setIsProcessingAudio(false);
            setActiveRecordingEntryId(null);
          }
        })();
      } else {
        setIsRecordingPatient(false);
        setIsTranslatingPatient(true);

        const providerLang = languages?.provider || 'en';
        const patientLang = languages?.patient || 'es';

        const sourceLangForSession = patientLang;
        const targetLangForSession = providerLang;

        (async () => {
          try {
            if (!uri) throw new Error('No recording URI');

            console.log('Sending patient audio to backend (real):', {
              uri: permanentAudioUri,
              sessionId,
              sourceLang: sourceLangForSession,
              targetLang: targetLangForSession,
              role: 'patient',
            });

            const info = await FileSystem.getInfoAsync(permanentAudioUri);
            console.log('Patient audio info:', info);

            if (!info.exists || info.size === 0) {
              setIsTranslatingPatient(false);
              setIsProcessingPatient(false);
              setIsProcessingAudio(false);
              Alert.alert('Error', 'Audio file missing or empty. Please try again.');

              if (recordingEntryId) {
                setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
                setActiveRecordingEntryId(null);
              }
              return;
            }

            const resp = await processAudioApi({
              fileUri: permanentAudioUri,
              sessionId: sessionId || '',
              sourceLang: sourceLangForSession,
              targetLang: targetLangForSession,
              role: 'patient',
            });

            console.log('processAudioApi patient response:', resp);

            const finalOriginal =
              resp.transcript || '[No transcript available from backend]';
            const finalTranslated =
              resp.translatedText || '[No translation available from backend]';

            setPatientOut(
              `${finalOriginal} → ${finalTranslated} (${getLanguageName(providerLang)})`,
            );

            setIsTranslatingPatient(false);
            setIsProcessingPatient(true);

            if (recordingEntryId) {
              setHistory(prev =>
                prev.map(entry =>
                  entry.id === recordingEntryId
                    ? {
                        ...entry,
                        status: 'processed',
                        original: finalOriginal,
                        translated: finalTranslated,
                        originalAudioUrl: permanentAudioUri,
                        translatedAudioUrl: resp.audioUrl || undefined,
                        translatedAudioBase64: resp.audioBase64 || undefined,
                        mime: resp.mime,
                        timestamp: Date.now(),
                      }
                    : entry,
                ),
              );
            }

            setIsTranslatingPatient(false);
            setIsProcessingPatient(false);

            try {
              await playTranslatedOutput(resp, permanentAudioUri);
            } catch (err) {
              console.log('Patient: playback handler failed, fallback:', err);
              await playAudio(permanentAudioUri);
            }
          } catch (err) {
            console.log('Patient audio backend error:', err);
            setIsTranslatingPatient(false);
            setIsProcessingPatient(false);
            setIsProcessingAudio(false);

            let msg = 'Failed to process audio.';
            if (err instanceof Error) msg = err.message;
            Alert.alert('Patient Audio Error', msg);

            if (recordingEntryId) {
              setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
            }
          } finally {
            setIsTranslatingPatient(false);
            setIsProcessingPatient(false);
            setIsProcessingAudio(false);
            setActiveRecordingEntryId(null);
          }
        })();
      }

      setRecordingDuration(0);
    } catch (e) {
      console.log('stopAudioRecording error:', e);
      if (type === 'doctor') {
        setIsRecordingDoctor(false);
        setIsTranslatingDoctor(false);
        setIsProcessingDoctor(false);
      } else {
        setIsRecordingPatient(false);
        setIsTranslatingPatient(false);
        setIsProcessingPatient(false);
      }
      setRecordingDuration(0);

      if (recordingEntryId) {
        setHistory(prev => prev.filter(e => e.id !== recordingEntryId));
        setActiveRecordingEntryId(null);
      }
    }
  };

  const playTranslatedSpeech = async (text: string, isOriginal: boolean = false) => {
    console.log(`Playing ${isOriginal ? 'original' : 'translated'} speech:`, text);

    if (!text || text.trim().length === 0) {
      setPlayingAudio(null);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      Speech.stop();
      setPlayingAudio(isOriginal ? 'original-speech' : 'translated-speech');
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setPlayingAudio(null),
        onStopped: () => setPlayingAudio(null),
        onError: () => setPlayingAudio(null),
      });
    } catch (error) {
      console.log('Speech synthesis error:', error);
      setPlayingAudio(null);
    }
  };

  const playBase64Audio = async (base64Data: string, mime = 'audio/wav') => {
    console.log('Attempting to play base64 audio');

    try {
      const fileUri = `${FileSystem.cacheDirectory}translated_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      setPlayingAudio(fileUri);

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Base64 audio playback ended');
          setPlayingAudio(null);
        }
      });

      await sound.playAsync();
      console.log('Base64 audio playback started');
    } catch (err) {
      console.error('playBase64Audio error:', err);
      setPlayingAudio(null);
    }
  };

  const playBase64DecodedWav = async (base64Audio: string) => {
    try {
      const wavUri = await decodeBase64ToWav(base64Audio, 'translated');
      if (!wavUri) {
        Alert.alert('Audio Error', 'Could not decode translated audio.');
        return;
      }

      console.log('Playing decoded WAV file:', wavUri);
      await playAudio(wavUri);
    } catch (err) {
      console.log('playBase64DecodedWav ERROR:', err);
      Alert.alert('Audio Error', 'Failed to play translated audio.');
    }
  };

  const playAudio = async (audioUrl: string) => {
    console.log('Attempting to play audio:', audioUrl);

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      setPlayingAudio(audioUrl);

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Audio playback ended');
          setPlayingAudio(null);
        }
      });

      await sound.playAsync();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.log('Audio playback failed:', error);
      setPlayingAudio(null);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingAudio(null);
  };

  // ---------- BUTTON HANDLERS ----------

  const createRecordingBubble = (speaker: 'doctor' | 'patient') => {
    const entry: ConversationEntry = {
      id: String(Date.now() + Math.random()),
      speaker,
      original: '',
      translated: '',
      timestamp: Date.now(),
      status: 'recording',
    };
    setHistory(prev => [entry, ...prev]);
    setActiveRecordingEntryId(entry.id);
  };

  const startDoctorRecording = () => {
    if (
      isRecordingPatient ||
      isRecordingDoctor ||
      isTranslatingPatient ||
      isTranslatingDoctor ||
      isProcessingPatient ||
      isProcessingDoctor
    )
      return;
    createRecordingBubble('doctor');
    setIsRecordingDoctor(true);
    setIsTranslatingDoctor(false);
    startAudioRecording('doctor');
  };

  const stopDoctorRecording = () => {
    if (!isRecordingDoctor) return;
    setIsRecordingDoctor(false);
    stopAudioRecording('doctor');
  };

  const startPatientRecording = () => {
    if (
      isRecordingPatient ||
      isRecordingDoctor ||
      isTranslatingPatient ||
      isTranslatingDoctor ||
      isProcessingPatient ||
      isProcessingDoctor
    )
      return;
    createRecordingBubble('patient');
    setIsRecordingPatient(true);
    setIsTranslatingPatient(false);
    startAudioRecording('patient');
  };

  const stopPatientRecording = () => {
    if (!isRecordingPatient) return;
    setIsRecordingPatient(false);
    stopAudioRecording('patient');
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getScrollbarMetrics = () => {
    const containerH = historyContainerHeight;
    const contentH = historyContentHeight;
    if (containerH <= 0 || contentH <= containerH) {
      return { visible: false, top: 0, height: 0 };
    }
    const minThumb = 24;
    const height = Math.max(minThumb, Math.floor((containerH * containerH) / contentH));
    const maxTop = containerH - height;
    const denom = Math.max(1, contentH - containerH);
    const ratio = Math.min(1, Math.max(0, historyScrollY / denom));
    const top = Math.floor(maxTop * ratio);
    return { visible: true, top, height };
  };

  const isLoadingOverlayVisible =
    isTranslatingDoctor ||
    isTranslatingPatient ||
    isProcessingDoctor ||
    isProcessingPatient ||
    isProcessingAudio;

  return (
    <View style={styles.container}>
      {isLoadingOverlayVisible && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Translating audio...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            stopAllRecordings(true);
            onBack && onBack();
          }}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.endBtn}
          onPress={() => {
            stopAllRecordings(true);
            onEndSession && onEndSession(sessionTime, history.length);
          }}
        >
          <Text style={styles.endBtnText}>End Conversation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionTitle}>Session In Progress</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>{formatSessionTime()}</Text>
          </View>
        </View>

        {/* Provider section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                (isProcessingDoctor || isTranslatingDoctor || isRecordingDoctor) &&
                  styles.micBtnDisabled,
                isRecordingDoctor && styles.startBtnActive,
              ]}
              onPress={startDoctorRecording}
              disabled={isProcessingDoctor || isTranslatingDoctor || isRecordingDoctor}
            >
              <Text style={styles.micBtnText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.micBtn, !isRecordingDoctor && styles.micBtnDisabled, styles.stopBtn]}
              onPress={stopDoctorRecording}
              disabled={!isRecordingDoctor}
            >
              <Text style={styles.micBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                (isProcessingPatient || isTranslatingPatient || isRecordingPatient) &&
                  styles.micBtnDisabled,
                isRecordingPatient && styles.startBtnActive,
              ]}
              onPress={startPatientRecording}
              disabled={isProcessingPatient || isTranslatingPatient || isRecordingPatient}
            >
              <Text style={styles.micBtnText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.micBtn, !isRecordingPatient && styles.micBtnDisabled, styles.stopBtn]}
              onPress={stopPatientRecording}
              disabled={!isRecordingPatient}
            >
              <Text style={styles.micBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation history */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Conversation History</Text>

          <View style={styles.historyScrollWrapper}>
            <ScrollView
              style={styles.historyScroll}
              contentContainerStyle={styles.historyScrollContent}
              showsVerticalScrollIndicator={true}
              onLayout={e => setHistoryContainerHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(_w, h) => setHistoryContentHeight(h)}
              onScroll={e => setHistoryScrollY(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            >
              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>No messages yet</Text>
              ) : (
                history.map(item => {
                  const isRecordingBubble =
                    item.status === 'recording' && item.id === activeRecordingEntryId;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.historyItem,
                        item.speaker === 'doctor' ? styles.historyDoctor : styles.historyPatient,
                      ]}
                    >
                      <Text style={styles.historyMeta}>
                        {item.speaker === 'doctor' ? 'Provider' : 'Patient'} •{' '}
                        {formatTime(item.timestamp)}
                      </Text>

                      {isRecordingBubble ? (
                        <Text style={styles.historyRecordingText}>
                          Recording… {formatRecordingTime(recordingDuration)}
                        </Text>
                      ) : (
                        <>
                          <Text style={styles.historyOriginal}>{item.original}</Text>
                          <Text style={styles.historyTranslated}>{item.translated}</Text>

                          <View style={styles.audioControls}>
                            <TouchableOpacity
                              style={styles.audioBtn}
                              onPress={() => {
                                if (playingAudio === item.originalAudioUrl) {
                                  stopAudio();
                                } else if (item.originalAudioUrl) {
                                  playAudio(item.originalAudioUrl);
                                } else {
                                  playTranslatedSpeech(item.original, true);
                                }
                              }}
                            >
                              <Text style={styles.audioBtnText}>
                                {playingAudio === item.originalAudioUrl ? '⏸️' : '▶️'} Original
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.audioBtn, styles.audioBtnTranslated]}
                              onPress={() => {
                                if (playingAudio && playingAudio.startsWith('file://')) {
                                  stopAudio();
                                  return;
                                }

                                if (item.translatedAudioBase64) {
                                  playBase64Audio(item.translatedAudioBase64, item.mime);
                                  return;
                                }

                                playTranslatedSpeech(item.translated, false);
                              }}
                            >
                              <Text style={styles.audioBtnText}>
                                {playingAudio === item.translatedAudioUrl ? '⏸️' : '▶️'} Translated
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
            {(() => {
              const m = getScrollbarMetrics();
              return m.visible ? (
                <View pointerEvents="none" style={styles.historyScrollOverlay}>
                  <View style={styles.scrollbarTrack}>
                    <View style={[styles.scrollbarThumb, { height: m.height, top: m.top }]} />
                  </View>
                </View>
              ) : null;
            })()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFFF2',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE8EA',
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.md,
  },
  backBtnText: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  timerBox: {
    backgroundColor: '#E6F3F7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#D1E2E7',
  },
  timerText: {
    fontSize: 12,
    color: '#3A8F9C',
    fontWeight: typography.weights.semibold,
  },
  endBtn: {
    backgroundColor: '#E47F47',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  endBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },

  content: { flex: 1, flexDirection: 'column' },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionTitle: {
    fontSize: typography.sizes.md,
    color: '#3A8F9C',
    fontWeight: typography.weights.semibold,
  },

  section: {
    backgroundColor: '#FFFFFFF8',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: '#E2EEF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#3A8F9C',
    marginBottom: spacing.md,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  micBtn: {
    backgroundColor: '#56B5C4',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  startBtnActive: { backgroundColor: '#3A8F9C', opacity: 1 },
  micBtnDisabled: { backgroundColor: '#B8CAD1', opacity: 0.7 },
  stopBtn: { backgroundColor: '#E47F47', opacity: 1 },
  micBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },

  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFFF8',
    borderRadius: borderRadius.md,
    margin: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2EEF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  historyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#3A8F9C',
    marginBottom: spacing.sm,
  },

  historyScrollWrapper: { flex: 1, position: 'relative', marginTop: spacing.xs },
  historyScroll: { flex: 1 },
  historyScrollContent: { paddingBottom: spacing.md },

  historyScrollOverlay: {
    position: 'absolute',
    right: spacing.xs,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  scrollbarTrack: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  scrollbarThumb: {
    position: 'absolute',
    right: 0,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#56B5C4',
  },

  historyItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  historyDoctor: {
    alignSelf: 'flex-end',
    backgroundColor: '#D9EEF2',
  },
  historyPatient: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBE6D8',
  },
  historyMeta: {
    fontSize: typography.sizes.sm,
    color: '#7D8C93',
    marginBottom: spacing.xs,
  },
  historyRecordingText: {
    fontSize: typography.sizes.md,
    color: '#3A8F9C',
  },
  historyOriginal: {
    fontSize: typography.sizes.md,
    color: '#3A8F9C',
    marginBottom: 4,
  },
  historyTranslated: {
    fontSize: typography.sizes.sm,
    color: '#E47F47',
  },
  historyEmpty: {
    fontSize: typography.sizes.md,
    color: '#97A4AA',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  audioBtn: {
    backgroundColor: '#56B5C4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnTranslated: {
    marginLeft: 'auto', // push to extreme right
  },
  audioBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    flexShrink: 1,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AudioCaptureScreen;
