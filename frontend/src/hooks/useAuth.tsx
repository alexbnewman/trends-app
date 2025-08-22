// src/hooks/useAuth.ts (Basic implementation)
import { useState, useCallback, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: false,
    loading: true,
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // This would be your actual login API call
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        const { user, token } = result.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });

        return { success: true };
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    register,
  };
};