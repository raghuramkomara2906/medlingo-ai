// Registration Screen for MedLingo Translator
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuthContext } from '../contexts/AuthContext';
import { RegisterCredentials } from '../types/auth';

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBack?: () => void;
  onLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onRegisterSuccess, 
  onBack, 
  onLogin 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'provider' | 'patient'>('provider');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthContext();

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  // Navigate to next screen if authenticated
  useEffect(() => {
    if (isAuthenticated && onRegisterSuccess) {
      onRegisterSuccess();
    }
  }, [isAuthenticated, onRegisterSuccess]);

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Please enter your name';
    }
    
    if (!email.trim()) {
      return 'Please enter your email address';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      return 'Please enter a password';
    }
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      return 'Please agree to the terms and conditions';
    }
    
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      const credentials: RegisterCredentials = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        role,
        defaultLanguage: role === 'provider' ? 'en' : 'es',
      };
      
      await register(credentials);
    } catch (err) {
      // Error is handled by the useAuth hook
      console.error('Registration failed:', err);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join MedLingo to start translating</Text>

          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>I am a:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'provider' && styles.roleButtonSelected
                  ]}
                  onPress={() => setRole('provider')}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === 'provider' && styles.roleButtonTextSelected
                  ]}>
                    👨‍⚕️ Healthcare Provider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'patient' && styles.roleButtonSelected
                  ]}
                  onPress={() => setRole('patient')}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === 'patient' && styles.roleButtonTextSelected
                  ]}>
                    👤 Patient
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isLoading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={toggleConfirmPasswordVisibility}
                  disabled={isLoading}
                >
                  <Text style={styles.eyeText}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.termsCheckbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                disabled={isLoading}
              >
                <Text style={styles.checkbox}>
                  {agreedToTerms ? '☑️' : '☐'}
                </Text>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
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
                style={[styles.registerButton, isLoading && styles.buttonDisabled]} 
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerButtonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.md,
  },
  eyeText: {
    fontSize: 16,
  },
  termsContainer: {
    marginBottom: spacing.lg,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    fontSize: 16,
    marginRight: spacing.xs,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
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
  registerButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderRadius: borderRadius.md, 
    minWidth: 100, 
    alignItems: 'center',
    flex: 1,
  },
  registerButtonText: { 
    color: colors.white, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginButtonText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});

export default RegisterScreen;

