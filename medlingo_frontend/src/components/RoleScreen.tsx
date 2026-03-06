import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface RoleScreenProps {
  onContinueProvider?: () => void;
}

const RoleScreen: React.FC<RoleScreenProps> = ({ onContinueProvider }) => {
  return (
    <View style={styles.container}>

      {/* Center content wrapper */}
      <View style={styles.centerWrapper}>
        
        {/* medLingo */}
        <Text style={styles.title}>medLingo</Text>

        {/* Subtitle */}
        <Text style={styles.healthcareSubtitle}>
          Healthcare Communication Assistant
        </Text>
        

        {/* No extra line here */}
        <Text style={styles.sessionSubtitle}>To start the session</Text>

        {/* CTA */}
        <TouchableOpacity style={styles.primaryButton} onPress={onContinueProvider}>
          <Text style={styles.buttonText}>Continue as Provider</Text>
        </TouchableOpacity>
      </View>

      {/* Footer with logo */}
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
    justifyContent: 'space-between',
  },

  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',  // ensures perfect vertical center
    paddingHorizontal: spacing.lg,
  },

  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#3A8F9C',
    marginBottom: spacing.sm,   // smaller gap
  },
  

  
  healthcareSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    //color: '#6F8A91',
    color: '#E47F47',    // Evara orange
    textAlign: 'center',
    marginBottom: spacing.xl,    // MORE spacing here
    paddingHorizontal: spacing.md,
  },

  sessionSubtitle: {
    fontSize: 15,
    //color: '#E47F47',    // Evara orange
    color: '#6F8A91',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  

  primaryButton: {
    backgroundColor: '#56B5C4',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    width: 150,   // bigger but still clean
    height: 40,
    opacity: 0.9,
    marginBottom: 2,
  },

  footerBrand: {
    fontSize: 12,
    color: '#7399A2',
    fontWeight: '500',
  },
});

export default RoleScreen;
