import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getRandomMockData } from '../mockAudioData';

interface ConversationEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  original: string;
  translated: string;
  timestamp: number;
  audioUrl?: string;
  translatedAudioUrl?: string;
}

interface AudioCaptureScreenProps {
  onBack?: () => void;
  onEndSession?: (duration: number, conversationCount: number) => void;
  languages?: { provider: string; patient: string };
}

const AudioCaptureScreen: React.FC<AudioCaptureScreenProps> = ({ onBack, onEndSession, languages }) => {
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

  // Web recording state
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentRecordingType, setCurrentRecordingType] = useState<'doctor' | 'patient' | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Audio playback state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSessionTime((p) => p + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllRecordings();
      // Ensure microphone is released on component unmount
      if (audioStream) {
        audioStream.getTracks().forEach((track) => {
          track.stop();
          console.log('Microphone track stopped on unmount');
        });
        setAudioStream(null);
      }
    };
  }, []);

  const stopAllRecordings = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    setIsRecordingDoctor(false);
    setIsRecordingPatient(false);
    setRecordingDuration(0);
    setCurrentRecordingType(null);
    setMediaRecorder(null);
    setAudioChunks([]);
  };

  const formatSessionTime = () => {
    const totalSeconds = sessionTime;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLanguageName = (code: string) => {
    const map: { [k: string]: string } = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
      zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi', ru: 'Russian'
    };
    return map[code] || 'English';
  };

  const getTextInLanguage = (code: string, isPatient: boolean) => {
    const texts: { [k: string]: { doctor: string; patient: string } } = {
      en: { doctor: 'Where is the pain?', patient: 'Hello, I need help' },
      es: { doctor: '¿Dónde está el dolor?', patient: 'Hola, necesito ayuda' },
      fr: { doctor: 'Où est la douleur?', patient: "Bonjour, j'ai besoin d'aide" },
      de: { doctor: 'Wo ist der Schmerz?', patient: 'Hallo, ich brauche Hilfe' },
      it: { doctor: 'Dove è il dolore?', patient: 'Ciao, ho bisogno di aiuto' },
      pt: { doctor: 'Onde está a dor?', patient: 'Olá, preciso de ajuda' },
      zh: { doctor: '疼痛在哪里？', patient: '你好，我需要帮助' },
      ja: { doctor: '痛みはどこですか？', patient: 'こんにちは、助けが必要です' },
      ko: { doctor: '어디가 아프나요?', patient: '안녕하세요, 도움이 필요합니다' },
      ar: { doctor: 'أين الألم؟', patient: 'مرحبا، أحتاج مساعدة' },
      hi: { doctor: 'दर्द कहाँ है?', patient: 'नमस्ते, मुझे मदद चाहिए' },
      ru: { doctor: 'Где боль?', patient: 'Привет, мне нужна помощь' },
    };
    const lang = texts[code] || texts.en;
    return isPatient ? lang.patient : lang.doctor;
  };

  const startAudioRecording = async (type: 'doctor' | 'patient') => {
    try {
      // Release any existing stream first
      if (audioStream) {
        audioStream.getTracks().forEach((t) => t.stop());
        setAudioStream(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        processAudioRecording(type, audioBlob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setCurrentRecordingType(type);
      setRecordingDuration(0);
      const t = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
      setRecordingTimer(t);
    } catch (e) {
      // Reset states on error
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
        if (e.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
        } else if (e.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (e.name === 'NotSupportedError') {
          errorMessage = 'Recording not supported on this device.';
        }
      }
      
      Alert.alert('Microphone Error', errorMessage);
      // eslint-disable-next-line no-console
      console.error('Recording error:', e);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    // Stop microphone stream immediately when recording stops
    if (audioStream) {
      audioStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Microphone track stopped');
      });
      setAudioStream(null);
    }
  };

  const processAudioRecording = (type: 'doctor' | 'patient', _audio: Blob) => {

    setTimeout(() => {
      if (type === 'doctor') {
        setIsRecordingDoctor(false);
        setIsTranslatingDoctor(true);
        setTimeout(() => {
          const providerLang = languages?.provider || 'en';
          const patientLang = languages?.patient || 'es';
          const original = getTextInLanguage(providerLang, false);
          const translated = getTextInLanguage(patientLang, false);
          setDoctorOut(`${original} → ${translated} (${getLanguageName(patientLang)})`);
          setIsTranslatingDoctor(false);
          setIsProcessingDoctor(true);
          
          // Get mock data for audio - Doctor speaks in provider language, translated to patient language
          const mockData = getRandomMockData('doctor');
          const newEntry: ConversationEntry = {
            id: String(Date.now() + Math.random()),
            speaker: 'doctor',
            original: mockData.original, // Doctor's original text in provider language
            translated: mockData.translated, // Translated to patient language
            timestamp: Date.now(),
            audioUrl: mockData.audioUrl, // Original audio in provider language
            translatedAudioUrl: mockData.translatedAudioUrl, // Translated audio in patient language
          };
          
          setHistory((prev) => [newEntry, ...prev]);
          
          // Process and play translated audio (in patient's language)
          console.log('Doctor: Processing translated audio for patient language');
          console.log('Translated text:', mockData.translated);
          setIsProcessingAudio(true);
          setTimeout(() => {
            playTranslatedSpeech(mockData.translated);
            setIsProcessingAudio(false);
            setIsProcessingDoctor(false); // Re-enable doctor button
          }, 1500); // Simulate audio processing time
        }, 1200);
      } else {
        setIsRecordingPatient(false);
        setIsTranslatingPatient(true);
        setTimeout(() => {
          const providerLang = languages?.provider || 'en';
          const patientLang = languages?.patient || 'es';
          const original = getTextInLanguage(patientLang, true);
          const translated = getTextInLanguage(providerLang, true);
          setPatientOut(`${original} → ${translated} (${getLanguageName(providerLang)})`);
          setIsTranslatingPatient(false);
          setIsProcessingPatient(true);
          
          // Get mock data for audio - Patient speaks in patient language, translated to provider language
          const mockData = getRandomMockData('patient');
          const newEntry: ConversationEntry = {
            id: String(Date.now() + Math.random()),
            speaker: 'patient',
            original: mockData.original, // Patient's original text in patient language
            translated: mockData.translated, // Translated to provider language
            timestamp: Date.now(),
            audioUrl: mockData.audioUrl, // Original audio in patient language
            translatedAudioUrl: mockData.translatedAudioUrl, // Translated audio in provider language
          };
          
          setHistory((prev) => [newEntry, ...prev]);
          
          // Process and play translated audio (in provider's language)
          console.log('Patient: Processing translated audio for provider language');
          console.log('Translated text:', mockData.translated);
          setIsProcessingAudio(true);
          setTimeout(() => {
            playTranslatedSpeech(mockData.translated);
            setIsProcessingAudio(false);
            setIsProcessingPatient(false); // Re-enable patient button
          }, 1500); // Simulate audio processing time
        }, 1200);
      }
      setRecordingDuration(0);
      setCurrentRecordingType(null);
    }, 1000);
  };

  const playTranslatedSpeech = async (text: string, isOriginal: boolean = false) => {
    console.log(`Playing ${isOriginal ? 'original' : 'translated'} speech:`, text);
    
    // Validate text input
    if (!text || text.trim().length === 0) {
      console.log('No text to speak');
      setPlayingAudio(null);
      return;
    }
    
    if ('speechSynthesis' in window) {
      try {
        // Stop any current speech
        speechSynthesis.cancel();
        // Ensure speech is not paused (Safari sometimes requires resume after user gesture)
        try { speechSynthesis.resume(); } catch {}
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to use a female voice for better speech quality
        let voices = speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
          // Some browsers populate voices asynchronously
          await new Promise<void>((resolve) => {
            const onVoices = () => { resolve(); };
            window.speechSynthesis.addEventListener('voiceschanged', onVoices, { once: true });
            setTimeout(resolve, 250);
          });
          voices = speechSynthesis.getVoices();
        }
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Woman') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('Using voice:', femaleVoice.name);
        }
        
        utterance.onstart = () => {
          console.log('Speech synthesis started');
          setPlayingAudio(isOriginal ? 'original-speech' : 'translated-speech');
        };
        
        utterance.onend = () => {
          console.log('Speech synthesis ended');
          setPlayingAudio(null);
        };
        
        utterance.onerror = (event) => {
          console.log('Speech synthesis error:', event.error);
          setPlayingAudio(null);
        };
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.log('Error setting up speech synthesis:', error);
        setPlayingAudio(null);
      }
    } else {
      console.log('Speech synthesis not supported');
      setPlayingAudio(null);
    }
  };

  const playAudio = (audioUrl: string) => {
    console.log('Attempting to play audio:', audioUrl);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.muted = false;
    audio.volume = 1.0;
    audio.src = audioUrl;
    audioRef.current = audio;
    setPlayingAudio(audioUrl);
    
    audio.onloadeddata = () => {
      console.log('Audio loaded successfully');
    };
    
    audio.onended = () => {
      console.log('Audio playback ended');
      setPlayingAudio(null);
    };
    
    audio.onerror = (e) => {
      console.log('Audio playback failed:', e);
      console.log('Using text-to-speech fallback');
      
      // Fallback to text-to-speech if audio URL fails
      if ('speechSynthesis' in window) {
        const entry = history.find(h => h.translatedAudioUrl === audioUrl);
        if (entry) {
          const utterance = new SpeechSynthesisUtterance(entry.translated);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
          console.log('Text-to-speech started for:', entry.translated);
        }
      }
      setPlayingAudio(null);
    };
    
    audio.play().catch((error) => {
      console.log('Audio play failed:', error);
      console.log('Using text-to-speech fallback');
      
      // Fallback to text-to-speech
      if ('speechSynthesis' in window) {
        const entry = history.find(h => h.translatedAudioUrl === audioUrl);
        if (entry) {
          const utterance = new SpeechSynthesisUtterance(entry.translated);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
          console.log('Text-to-speech started for:', entry.translated);
        }
      }
      setPlayingAudio(null);
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(null);
  };

  const startDoctorRecording = () => {
    console.log('startDoctorRecording called');
    // Prevent multiple simultaneous recordings
    if (isRecordingPatient || isRecordingDoctor || isTranslatingPatient || isTranslatingDoctor || isProcessingPatient || isProcessingDoctor) {
      console.log('Recording blocked - another recording in progress');
      return;
    }
    console.log('Starting doctor recording...');
    setIsRecordingDoctor(true);
    setIsTranslatingDoctor(false);
    startAudioRecording('doctor');
  };
  const stopDoctorRecording = () => {
    console.log('stopDoctorRecording called, isRecordingDoctor:', isRecordingDoctor);
    if (!isRecordingDoctor) return;
    console.log('Stopping doctor recording...');
    setIsRecordingDoctor(false);
    stopAudioRecording();
  };
  const startPatientRecording = () => {
    console.log('startPatientRecording called');
    // Prevent multiple simultaneous recordings
    if (isRecordingPatient || isRecordingDoctor || isTranslatingPatient || isTranslatingDoctor || isProcessingPatient || isProcessingDoctor) {
      console.log('Recording blocked - another recording in progress');
      return;
    }
    console.log('Starting patient recording...');
    setIsRecordingPatient(true);
    setIsTranslatingPatient(false);
    startAudioRecording('patient');
  };
  const stopPatientRecording = () => {
    console.log('stopPatientRecording called, isRecordingPatient:', isRecordingPatient);
    if (!isRecordingPatient) return;
    console.log('Stopping patient recording...');
    setIsRecordingPatient(false);
    stopAudioRecording();
  };

  const renderLoaderText = () => `Translating${'.'.repeat((sessionTime % 3) + 1)}`;
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
      return { visible: false, top: 0, height: 0 } as const;
    }
    const minThumb = 24;
    const height = Math.max(minThumb, Math.floor((containerH * containerH) / contentH));
    const maxTop = containerH - height;
    const denom = Math.max(1, contentH - containerH);
    const ratio = Math.min(1, Math.max(0, historyScrollY / denom));
    const top = Math.floor(maxTop * ratio);
    return { visible: true, top, height } as const;
  };

  return (
    <View style={styles.container}>
      {/* Audio Processing Overlay */}
      {isProcessingAudio && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingSpinner}>🎵</Text>
            <Text style={styles.loadingText}>Processing Audio...</Text>
            <Text style={styles.loadingSubtext}>Generating translated speech</Text>
          </View>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { stopAllRecordings(); onBack && onBack(); }}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endBtn} onPress={() => { stopAllRecordings(); onEndSession && onEndSession(sessionTime, history.length); }}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Patient */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.micBtn, (isProcessingPatient || isTranslatingPatient || isRecordingPatient) && styles.micBtnDisabled, isRecordingPatient && styles.startBtnActive]}
            onPress={startPatientRecording}
            disabled={isProcessingPatient || isTranslatingPatient || isRecordingPatient}
            accessibilityLabel={isProcessingPatient ? 'Processing audio (patient)' : isTranslatingPatient ? 'Translating (patient)' : 'Start recording (patient)'}
            accessibilityRole="button"
          >
            <Text style={styles.micBtnText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.micBtn, !isRecordingPatient && styles.micBtnDisabled, styles.stopBtn]}
            onPress={stopPatientRecording}
            disabled={!isRecordingPatient}
            accessibilityLabel={'Stop recording (patient)'}
            accessibilityRole="button"
          >
            <Text style={styles.micBtnText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sessionRow}>
        <Text style={styles.sessionTitle}>Session In Progress</Text>
        <View style={styles.timerBox}><Text style={styles.timerText}>{formatSessionTime()}</Text></View>
      </View>
      {/* Provider */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provider</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.micBtn, (isProcessingDoctor || isTranslatingDoctor || isRecordingDoctor) && styles.micBtnDisabled, isRecordingDoctor && styles.startBtnActive]}
            onPress={startDoctorRecording}
            disabled={isProcessingDoctor || isTranslatingDoctor || isRecordingDoctor}
            accessibilityLabel={isProcessingDoctor ? 'Processing audio (provider)' : isTranslatingDoctor ? 'Translating (provider)' : 'Start recording (provider)'}
            accessibilityRole="button"
          >
            <Text style={styles.micBtnText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.micBtn, !isRecordingDoctor && styles.micBtnDisabled, styles.stopBtn]}
            onPress={stopDoctorRecording}
            disabled={!isRecordingDoctor}
            accessibilityLabel={'Stop recording (provider)'}
            accessibilityRole="button"
          >
            <Text style={styles.micBtnText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Conversation History</Text>
        <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.historyScroll}
          contentContainerStyle={styles.historyScrollContent}
          showsVerticalScrollIndicator={true}
          onLayout={(e) => setHistoryContainerHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setHistoryContentHeight(h)}
          onScroll={(e) => setHistoryScrollY((e as any).nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {history.length === 0 ? (
            <Text style={styles.historyEmpty}>No messages yet</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={[styles.historyItem, item.speaker === 'doctor' ? styles.historyDoctor : styles.historyPatient]}>
                <Text style={styles.historyMeta}>{item.speaker === 'doctor' ? 'Provider' : 'Patient'} • {formatTime(item.timestamp)}</Text>
                <Text style={styles.historyOriginal}>{item.original}</Text>
                <Text style={styles.historyTranslated}>{item.translated}</Text>
                <View style={styles.audioControls}>
                  <TouchableOpacity 
                    style={styles.audioBtn} 
                    onPress={() => playTranslatedSpeech(item.original, true)}
                  >
                            <Text style={styles.audioBtnText}>
                              {playingAudio === 'original-speech' ? '⏸️' : '▶️'} Original
                            </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.audioBtn} 
                    onPress={() => playTranslatedSpeech(item.translated, false)}
                  >
                            <Text style={styles.audioBtnText}>
                              {playingAudio === 'translated-speech' ? '⏸️' : '▶️'} Translated
                            </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
        {(() => { const m = getScrollbarMetrics(); return m.visible ? (
          <View pointerEvents='none' style={styles.historyScrollOverlay}>
            <View style={styles.scrollbarTrack}>
              <View style={[styles.scrollbarThumb, { height: m.height, top: m.top }]} />
            </View>
          </View>
        ) : null; })()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.grayLight,
  },
  backBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.gray, borderRadius: borderRadius.md },
  backBtnText: { color: colors.white, fontSize: 12 },
  headerTitle: { fontSize: typography.sizes.md, color: colors.success, fontWeight: typography.weights.semibold },
  timerBox: { backgroundColor: colors.grayLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.gray },
  timerText: { fontSize: 12, color: colors.textPrimary, fontWeight: typography.weights.semibold },
  endBtn: { backgroundColor: colors.error, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  endBtnText: { color: colors.white, fontSize: 12, fontWeight: typography.weights.semibold },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  sessionTitle: { fontSize: typography.sizes.md, color: colors.success, fontWeight: typography.weights.semibold },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, margin: spacing.md, borderWidth: 1, borderColor: colors.grayLight, shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  micBtn: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg, flex: 1, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  micBtnActive: { backgroundColor: colors.error },
  startBtnActive: { backgroundColor: colors.success, opacity: 1 },
  micBtnDisabled: { backgroundColor: colors.gray, opacity: 0.6 },
  stopBtn: { backgroundColor: colors.error, opacity: 1 },
  micBtnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  translationBox: { flex: 1, backgroundColor: colors.grayLight, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primary, minHeight: 120 },
  translationText: { fontSize: typography.sizes.md, color: colors.primary },
  loaderText: { fontSize: 12, color: colors.primary },
  historyContainer: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, margin: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.grayLight, shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  historyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  historyScroll: { flex: 1 },
  historyScrollContent: { paddingBottom: spacing.md },
  historyScrollOverlay: { position: 'absolute', right: spacing.xs, top: spacing.md + 24, bottom: spacing.md, justifyContent: 'flex-start', alignItems: 'flex-end', left: undefined },
  scrollbarTrack: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.08)' },
  scrollbarThumb: { position: 'absolute', right: 0, width: 8, borderRadius: 4, backgroundColor: colors.primary },
  historyItem: { padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm, maxWidth: '85%' },
  historyDoctor: { alignSelf: 'flex-end', backgroundColor: colors.grayLight },
  historyPatient: { alignSelf: 'flex-start', backgroundColor: colors.grayLight },
  historyMeta: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  historyOriginal: { fontSize: typography.sizes.md, color: colors.textPrimary, marginBottom: 4 },
  historyTranslated: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  historyEmpty: { fontSize: typography.sizes.md, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  audioControls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  audioBtn: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: spacing.xs, 
    borderRadius: borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  audioBtnText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    flexShrink: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  loadingSpinner: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default AudioCaptureScreen;


