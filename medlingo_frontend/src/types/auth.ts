// Authentication Types for MedLingo Translator

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'provider' | 'patient' | 'admin';
  isActive: boolean;
  defaultLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role: 'provider' | 'patient';
  defaultLanguage?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'provider' | 'patient';
  defaultLanguage?: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Provider-specific types
export interface ProviderProfile extends User {
  role: 'provider';
  specialties?: string[];
  licenseNumber?: string;
  hospital?: string;
  department?: string;
}

export interface PatientProfile extends User {
  role: 'patient';
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
}

