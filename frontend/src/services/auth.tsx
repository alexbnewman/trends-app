// src/services/auth.tsx
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refresh_token?: string;
  };
  error?: string;
}

class AuthService {
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';
  private userKey = 'user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Check if token is expired (basic JWT check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      if (response.data.success) {
        const { user, token, refresh_token } = response.data.data;
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        if (refresh_token) {
          localStorage.setItem(this.refreshTokenKey, refresh_token);
        }
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  // Register
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      if (response.data.success) {
        const { user, token, refresh_token } = response.data.data;
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        if (refresh_token) {
          localStorage.setItem(this.refreshTokenKey, refresh_token);
        }
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(this.refreshTokenKey);
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
      });

      if (response.data.success) {
        const { token, refresh_token } = response.data.data;
        localStorage.setItem(this.tokenKey, token);
        if (refresh_token) {
          localStorage.setItem(this.refreshTokenKey, refresh_token);
        }
        return true;
      }
      
      return false;
    } catch {
      this.logout(); // Clear invalid tokens
      return false;
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { email });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset failed'
      };
    }
  }

  // Update profile
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, updates, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });

      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed'
      };
    }
  }
}

export default new AuthService();