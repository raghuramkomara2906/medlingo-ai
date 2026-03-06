// Enhanced SessionSetupScreen with Database Integration
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useSession } from '../hooks/useSession';

interface SessionSetupScreenWithDBProps {
  onAgreeStart?: (languages: { provider: string; patient: string }, sessionId: string) => void;
  onDecline?: () => void;
  providerId: string; // Required for database integration
  patientId?: string; // Optional patient ID
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
];

const SessionSetupScreenWithDB: React.FC<SessionSetupScreenWithDBProps> = ({
  onAgreeStart,
  onDecline,
  providerId,
  patientId,
}) => {
  const [providerLang, setProviderLang] = useState('en');
  const [patientLang, setPatientLang] = useState('es');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  
  const { startSession, isLoading, error, clearError } = useSession();

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Session Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const decline = () => { 
    setPressedButton('back');
    setTimeout(() => {
      setPressedButton(null);
      if (onDecline) onDecline(); 
    }, 150);
  };

  const startSessionWithDB = async () => {
    if (isLoading) return;
    
    setPressedButton('start');
    
    try {
      // Start session in database
      const session = await startSession(providerId, providerLang, patientLang, patientId);
      
      // Call the original callback with session ID
      if (onAgreeStart) {
        onAgreeStart({ provider: providerLang, patient: patientLang }, session.id);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      // Error is handled by the useSession hook
    } finally {
      setTimeout(() => {
        setPressedButton(null);
      }, 150);
    }
  };

  const getLanguageName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || 'English';

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session Setup</Text>
          
          {/* Database Integration Status */}
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              {isLoading ? '🔄 Connecting to database...' : '✅ Database connected'}
            </Text>
          </View>
          
          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Provider Language</Text>
            <View style={[styles.dropdown, styles.disabledDropdown]}>
              <Text style={[styles.dropdownText, styles.disabledText]}>{getLanguageName(providerLang)}</Text>
              <Text style={styles.disabledIndicator}>🔒</Text>
            </View>
          </View>

          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Patient Language</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => {
                setShowPatientDropdown(!showPatientDropdown);
              }}
            >
              <Text style={styles.dropdownText}>{getLanguageName(patientLang)}</Text>
              <Text style={styles.dropdownArrow}>{showPatientDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showPatientDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setPatientLang(lang.code);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{lang.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[
                styles.navButton, 
                styles.declineButton,
                pressedButton === 'back' && styles.buttonPressed
              ]} 
              onPress={decline}
            >
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.holdButton,
                pressedButton === 'start' && styles.buttonPressed,
                isLoading && styles.buttonDisabled
              ]}
              onPress={startSessionWithDB}
              disabled={isLoading}
            >
              <Text style={styles.holdButtonText}>
                {isLoading ? 'Starting...' : 'Start Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  contentContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  statusSection: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center'
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: spacing.md 
  },
  navButton: { 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderRadius: borderRadius.md, 
    minWidth: 100, 
    alignItems: 'center', 
    backgroundColor: colors.gray 
  },
  declineButton: { 
    backgroundColor: colors.gray 
  },
  holdButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderRadius: borderRadius.md, 
    minWidth: 100, 
    alignItems: 'center' 
  },
  buttonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.6
  },
  navButtonText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
  holdButtonText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
  buttonPressed: { 
    transform: [{ scale: 0.95 }], 
    opacity: 0.8 
  },
  languageSection: {
    marginBottom: spacing.lg
  },
  languageLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  dropdownText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium
  },
  dropdownArrow: {
    fontSize: typography.sizes.sm,
    color: colors.gray
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray,
    marginTop: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000
  },
  dropdownScroll: {
    maxHeight: 200
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight
  },
  dropdownItemText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium
  },
  disabledDropdown: {
    backgroundColor: colors.grayLight,
    borderColor: colors.gray,
    opacity: 0.7
  },
  disabledText: {
    color: colors.textSecondary
  },
  disabledIndicator: {
    fontSize: 16,
    color: colors.textSecondary
  },
});

export default SessionSetupScreenWithDB;

