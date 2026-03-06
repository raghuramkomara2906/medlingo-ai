import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ThankYouScreenProps {
  onStartNew?: () => void;
  onExit?: () => void;
  sessionDuration?: number;
  conversationCount?: number;
  languages?: { provider: string; patient: string };
}

const ThankYouScreen: React.FC<ThankYouScreenProps> = ({
  onStartNew,
  onExit,
  sessionDuration = 0,
  conversationCount = 0,
  languages
}) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const getLanguageName = (code: string) => {
    const map: any = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
      ko: 'Korean', ar: 'Arabic', hi: 'Hindi', ru: 'Russian'
    };
    return map[code] || code.toUpperCase();
  };

  return (
    <View style={styles.container}>

      <View style={styles.contentContainer}>

        {/* Thank You */}
        <Text style={styles.thankYouTitle}>Thank you!</Text>
        <Text style={styles.thankYouMessage}>Your session has ended successfully.</Text>

        {/* 4 Floating Summary Boxes */}
        <View style={styles.summaryGrid}>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{formatDuration(sessionDuration)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Conversations</Text>
            <Text style={styles.summaryValue}>{conversationCount}</Text>
          </View>

          {languages && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Provider</Text>
                <Text style={styles.summaryValue}>{getLanguageName(languages.provider)}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Patient</Text>
                <Text style={styles.summaryValue}>{getLanguageName(languages.patient)}</Text>
              </View>
            </>
          )}

        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.startNewBtn} onPress={onStartNew}>
            <Text style={styles.startNewText}>Start new session</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Footer */}
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
    backgroundColor: '#F4FBFC'
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },

  thankYouTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: '#3A8F9C',
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  thankYouMessage: {
    fontSize: typography.sizes.md,
    color: '#6F8A91',
    textAlign: 'center',
    marginBottom: spacing.xl
  },

  /* Floating summary grid (no parent box) */
  summaryGrid: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,        // smaller spacing between boxes
    marginBottom: spacing.xl,
  },
  
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.sm,    // smaller height
    paddingHorizontal: spacing.sm,  // smaller width feel
    borderRadius: 15,               // slightly smaller corners
    backgroundColor: '#FDEFE5',
  },
  
  summaryLabel: {
    fontSize: 13,
    color: '#E47F44',
    marginBottom: 2,
  },
  
  summaryValue: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: '#E47F47',
  },
  
  /* Buttons */
  buttonSection: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center'
  },

  startNewBtn: {
    backgroundColor: '#56B5C4',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center'
  },
  startNewText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold
  },

  exitBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    minWidth: 100,
    alignItems: 'center'
  },
  exitText: {
    color: '#4A5568',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xl * 1.5
  },
  footerText: {
    fontSize: 10,
    color: '#8A959C',
    marginBottom: 4
  },
  footerLogo: {
    width: 150,
    height: 40,
    opacity: 0.9
  }
});

export default ThankYouScreen;
