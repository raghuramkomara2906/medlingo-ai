// Enhanced App with Authentication
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import RoleScreen from './RoleScreen';
// import LoginScreenWithAuth from './LoginScreenWithAuth'; // Kept for future use
// import RegisterScreen from './RegisterScreen'; // Kept for future use
import SessionSetupScreenWithDB from './SessionSetupScreenWithDB';
import AudioCaptureScreen from './AudioCaptureScreen.web';
import ThankYouScreen from './ThankYouScreen';

type Screen = 'role' | 'sessionSetup' | 'audioCapture' | 'thankYou';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role');
  const [sessionLanguages, setSessionLanguages] = useState<{ provider: string; patient: string } | null>(null);
  const [sessionData, setSessionData] = useState<{ duration: number; conversationCount: number } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { user, isAuthenticated, isLoading } = useAuthContext();

  // Navigation functions
  const goRole = () => setCurrentScreen('role');
  const goSessionSetup = () => setCurrentScreen('sessionSetup');
  const goAudio = (languages: { provider: string; patient: string }, newSessionId?: string) => {
    setSessionLanguages(languages);
    if (newSessionId) {
      setSessionId(newSessionId);
    }
    setCurrentScreen('audioCapture');
  };
  const goThankYou = (duration: number, conversationCount: number) => {
    setSessionData({ duration, conversationCount });
    setCurrentScreen('thankYou');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>🔄</div>
          <div style={styles.loadingText}>Loading...</div>
        </div>
      </SafeAreaView>
    );
  }

  // Show role selection if not authenticated - skip login, go directly to session setup
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {currentScreen === 'role' && (
          <RoleScreen onContinueProvider={goSessionSetup} />
        )}
        {currentScreen === 'sessionSetup' && (
          <SessionSetupScreenWithDB
            onAgreeStart={goAudio}
            onDecline={goRole}
            providerId={''}
            patientId={undefined}
          />
        )}
        {currentScreen === 'audioCapture' && (
          <AudioCaptureScreen 
            onBack={goSessionSetup} 
            onEndSession={goThankYou} 
            languages={sessionLanguages || undefined}
            sessionId={sessionId}
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
  }

  // Show authenticated app
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'sessionSetup' && (
        <SessionSetupScreenWithDB
          onAgreeStart={goAudio}
          onDecline={goRole}
          providerId={user?.id || ''}
          patientId={user?.role === 'patient' ? user.id : undefined}
        />
      )}
      {currentScreen === 'audioCapture' && (
        <AudioCaptureScreen 
          onBack={goSessionSetup} 
          onEndSession={goThankYou} 
          languages={sessionLanguages || undefined}
          sessionId={sessionId}
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingSpinner: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default App;

