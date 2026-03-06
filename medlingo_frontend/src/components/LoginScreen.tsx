import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onBack?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    // Mock authentication - simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Simple mock validation
      if (username.toLowerCase() === 'admin' && password === 'password') {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    }, 1000);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Enter your credentials to continue</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => {
                  // Focus password field when Enter is pressed
                  if (password.trim()) {
                    handleLogin();
                  }
                }}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.backButton, isLoading && styles.buttonDisabled]} 
                onPress={handleBack}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.demoText}>
              Demo: username: admin, password: password
            </Text>
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
    maxWidth: 400,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: typography.sizes.xxl, 
    fontWeight: typography.weights.bold, 
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: { 
    fontSize: typography.sizes.md, 
    color: colors.textSecondary,
    textAlign: 'center', 
    marginBottom: spacing.xl
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backButton: { 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderRadius: borderRadius.md, 
    minWidth: 100, 
    alignItems: 'center', 
    backgroundColor: colors.gray 
  },
  backButtonText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
  loginButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderRadius: borderRadius.md, 
    minWidth: 100, 
    alignItems: 'center',
    flex: 1,
  },
  loginButtonText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  demoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});

export default LoginScreen;
