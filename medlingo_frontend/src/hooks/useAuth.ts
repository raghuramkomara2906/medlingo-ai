// Authentication Hook for MedLingo Translator
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { LoginCredentials, RegisterCredentials, User, AuthState } from '../types/auth';

interface UseAuthReturn extends AuthState {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Password management
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if we have stored auth data
      const storedUser = await authService.getStoredUser();
      const storedToken = await authService.getStoredToken();
      const storedRefreshToken = await authService.getStoredRefreshToken();

      if (storedUser && storedToken && storedRefreshToken) {
        // Check if token is still valid
        const isTokenValid = await authService.isTokenValid();
        
        if (isTokenValid) {
          setUser(storedUser);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setIsAuthenticated(true);
        } else {
          // Try to refresh the token
          try {
            const authResponse = await authService.refreshToken();
            setUser(authResponse.user);
            setToken(authResponse.token);
            setRefreshToken(authResponse.refreshToken);
            setIsAuthenticated(true);
          } catch (refreshError) {
            // Refresh failed, clear auth data
            await authService.logout();
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // No stored auth data
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth status check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check authentication status');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await authService.login(credentials);
      
      setUser(authResponse.user);
      setToken(authResponse.token);
      setRefreshToken(authResponse.refreshToken);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await authService.register(credentials);
      
      setUser(authResponse.user);
      setToken(authResponse.token);
      setRefreshToken(authResponse.refreshToken);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails, clear local state
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTokenAction = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await authService.refreshToken();
      
      setUser(authResponse.user);
      setToken(authResponse.token);
      setRefreshToken(authResponse.refreshToken);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed';
      setError(errorMessage);
      // If refresh fails, logout user
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.confirmPasswordReset(token, newPassword);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset confirmation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken: refreshTokenAction,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    clearError,
    checkAuthStatus,
  };
};

