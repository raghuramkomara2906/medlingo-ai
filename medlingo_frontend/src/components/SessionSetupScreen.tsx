import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { startSessionApi } from "../api/sessionApi";

interface SessionSetupScreenProps {
  onAgreeStart?: (languages: {
    provider: string;
    patient: string;
    session?: {
      sessionId: string;
      expiresAt: string;
    };
  }) => void;
  onDecline?: () => void;
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

const SessionSetupScreen: React.FC<SessionSetupScreenProps> = ({
  onAgreeStart,
  onDecline,
}) => {
  const [providerLang] = useState('en');
  const [patientLang, setPatientLang] = useState('es');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const decline = () => {
    setPressedButton('back');
    setTimeout(() => {
      setPressedButton(null);
      if (onDecline) onDecline();
    }, 150);
  };

  const startSession = async () => {
    try {
      setPressedButton('start');
      const { session_id, expires_at } = await startSessionApi(
        true,
        providerLang,
        patientLang
      );

      setTimeout(() => {
        setPressedButton(null);
        if (onAgreeStart) {
          onAgreeStart({
            provider: providerLang,
            patient: patientLang,
            session: {
              sessionId: session_id,
              expiresAt: expires_at,
            },
          });
        }
      }, 150);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const getLanguageName = (code: string) =>
    LANGUAGES.find(l => l.code === code)?.name || 'English';

  return (
    <View style={styles.container}>

      {/* MAIN CONTENT */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>

          <Text style={styles.description}>
            Select the provider and patient languages.
          </Text>

          {/* Provider Language */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Provider's Language</Text>
            <View style={[styles.dropdown, styles.disabledDropdown]}>
              <Text style={[styles.dropdownText, styles.disabledText]}>
                {getLanguageName(providerLang)}
              </Text>
              <Text style={styles.disabledIndicator}>🔒</Text>
            </View>
          </View>

          {/* Patient Language */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Patient's Language</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowPatientDropdown(!showPatientDropdown)}
            >
              <Text style={styles.dropdownText}>{getLanguageName(patientLang)}</Text>
              <Text style={styles.dropdownArrow}>{showPatientDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPatientDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll}>
                  {LANGUAGES.map(lang => (
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

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.navButton,
                pressedButton === 'back' && styles.buttonPressed,
              ]}
              onPress={decline}
            >
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.holdButton,
                pressedButton === 'start' && styles.buttonPressed,
              ]}
              onPress={startSession}
            >
              <Text style={styles.holdButtonText}>Start Conversation</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by</Text>
        <Image
          source={require('../assets/evara-logo.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBFC',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  card: {
    width: '100%',
    maxWidth: 500,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  description: {

    fontSize: 18,
    //color: '#6F8A91',
    color: '#E47F47',    // Evara orange
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  languageSection: {
    marginBottom: spacing.lg,
  },

  languageLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#6F8A91',
    marginBottom: spacing.xs,
  },

  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D1E2E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  dropdownArrow: {
    fontSize: typography.sizes.sm,
    color: colors.gray,
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
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  dropdownItemText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },

  disabledDropdown: {
    backgroundColor: colors.grayLight,
    borderColor: colors.gray,
    opacity: 0.7,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  disabledIndicator: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  navButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },

  navButtonText: {
    color: '#4A5568',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  holdButton: {
    backgroundColor: '#56B5C4',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },

  holdButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },

  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xl * 1.5,
  },
  footerText: {
    fontSize: 10,
    color: '#8A959C',
    marginBottom: 4,
  },
  footerLogo: {
    width: 150,
    height: 40,
    opacity: 0.9,
    marginBottom: 2,
  },
});

export default SessionSetupScreen;
