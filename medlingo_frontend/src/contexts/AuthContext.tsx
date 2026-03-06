// Authentication Context for MedLingo Translator
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';

interface AuthContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Convenience hooks for specific user roles
export const useProviderAuth = () => {
  const auth = useAuthContext();
  
  if (auth.user && auth.user.role !== 'provider') {
    throw new Error('useProviderAuth can only be used by providers');
  }
  
  return auth;
};

export const usePatientAuth = () => {
  const auth = useAuthContext();
  
  if (auth.user && auth.user.role !== 'patient') {
    throw new Error('usePatientAuth can only be used by patients');
  }
  
  return auth;
};

export default AuthContext;

