import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import RoleScreen from './RoleScreen';
import SessionSetupScreen from './SessionSetupScreen';
import AudioCaptureScreen from './AudioCaptureScreen.native';
import ThankYouScreen from './ThankYouScreen';

import { endSessionApi } from '../api/sessionApi';

// adjust path if needed
 
type Screen = 'role' | 'sessionSetup' | 'audioCapture' | 'thankYou';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role');
  const [sessionLanguages, setSessionLanguages] = useState<{ provider: string; patient: string } | null>(null);
  const [sessionData, setSessionData] = useState<{ duration: number; conversationCount: number } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const goRole = () => setCurrentScreen('role');
  const goSessionSetup = () => setCurrentScreen('sessionSetup');
  const goAudio = (data: {
    provider: string;
    patient: string;
    session?: {
      sessionId: string;
      expiresAt: string;
    };
  }) => {
    console.log("goAudio called with:", data);
  
    setSessionLanguages({
      provider: data.provider,
      patient: data.patient,
    });
  
    if (data.session?.sessionId) {
      console.log("Storing sessionId in state:", data.session.sessionId);
      setSessionId(data.session.sessionId);
    } else {
      console.log("No sessionId found on data, clearing state");
      setSessionId(null);
    }
  
    setCurrentScreen('audioCapture');
  };
  
  
  const goThankYou = async (duration: number, conversationCount: number) => {
    console.log("Ending session via goThankYou, sessionId:", sessionId);
  
    try {
      // Call our placeholder API (currently just logs).
      await endSessionApi(sessionId);
    } catch (e) {
      console.log("Error in endSessionApi:", e);
    }
  
    // Clear session info in the app
    setSessionId(null);
  
    setSessionData({ duration, conversationCount });
    setCurrentScreen('thankYou');
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'role' && (
        <RoleScreen onContinueProvider={goSessionSetup} />
      )}
      {currentScreen === 'sessionSetup' && (
        <SessionSetupScreen
          onAgreeStart={goAudio}
          onDecline={goRole}
        />
      )}
      {currentScreen === 'audioCapture' && (
        <AudioCaptureScreen 
          onBack={goSessionSetup} 
          onEndSession={goThankYou} 
          languages={sessionLanguages || undefined}
          sessionId={sessionId}        // ✅ pass it down
        />
      )}

      {currentScreen === 'thankYou' && (
        <ThankYouScreen 
          onStartNew={goRole} 
          onExit={goRole}
          sessionDuration={sessionData?.duration || 0}
          conversationCount={sessionData?.conversationCount || 0}
          languages={sessionLanguages || undefined}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;