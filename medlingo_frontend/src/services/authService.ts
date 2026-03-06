// Authentication Service for MedLingo Translator
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  User,
  LoginRequest,
  RegisterRequest,
  TokenRefreshRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  AuthError
} from '../types/auth';

class AuthService {
  private baseUrl: string;
  private tokenKey = 'medlingo_auth_token';
  private refreshTokenKey = 'medlingo_refresh_token';
  private userKey = 'medlingo_user';

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        } as LoginRequest),
      });

      // Store tokens and user data
      await this.storeAuthData(response);
      
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          role: credentials.role,
          defaultLanguage: credentials.defaultLanguage,
        } as RegisterRequest),
      });

      // Store tokens and user data
      await this.storeAuthData(response);
      
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await this.getStoredToken();
      if (token) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local storage, even if server request fails
      await this.clearAuthData();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.makeRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken,
        } as TokenRefreshRequest),
      });

      // Update stored tokens
      await this.storeAuthData(response);
      
      return response;
    } catch (error) {
      // If refresh fails, clear all auth data
      await this.clearAuthData();
      throw this.handleAuthError(error);
    }
  }

  // Password Management
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
        } as PasswordResetRequest),
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await this.makeRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
        } as PasswordResetConfirm),
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await this.makeRequest('/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        } as ChangePasswordRequest),
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Token and User Management
  async getStoredToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(this.tokenKey);
      }
      return null;
    } catch (error) {
      console.warn('Failed to get stored token:', error);
      return null;
    }
  }

  async getStoredRefreshToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(this.refreshTokenKey);
      }
      return null;
    } catch (error) {
      console.warn('Failed to get stored refresh token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get stored user:', error);
      return null;
    }
  }

  async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.warn('Failed to validate token:', error);
      return false;
    }
  }

  // Private Methods
  private async storeAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.tokenKey, authResponse.token);
        localStorage.setItem(this.refreshTokenKey, authResponse.refreshToken);
        localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
      }
    } catch (error) {
      console.warn('Failed to store auth data:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
      }
    } catch (error) {
      console.warn('Failed to clear auth data:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private handleAuthError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    // Handle different types of auth errors
    if (error.message?.includes('401')) {
      return new Error('Invalid email or password');
    } else if (error.message?.includes('403')) {
      return new Error('Account is disabled or not verified');
    } else if (error.message?.includes('429')) {
      return new Error('Too many login attempts. Please try again later.');
    } else if (error.message?.includes('network')) {
      return new Error('Network error. Please check your connection.');
    }
    
    return new Error(error.message || 'Authentication failed');
  }
}

// Export singleton instance
export const authService = new AuthService(
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
);

export default AuthService;

