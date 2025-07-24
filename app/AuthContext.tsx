import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  _id: string;
  email: string;
  role: string;
  isSuperlocal?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>; // أضفنا هذه الدالة
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const initializeAuth = async () => {
    try {
      const [userData, tokenData] = await AsyncStorage.multiGet(['user', 'token']);
      
      if (userData[1] && tokenData[1]) {
        setUser(JSON.parse(userData[1]));
        setToken(tokenData[1]);
      }
    } catch (error) {
      console.error('Failed to initialize auth', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post<{
        user: User;
        token: string;
      }>('https://negevpulsapp.onrender.com/api/auth/login', {
        email,
        password
      });

      await AsyncStorage.multiSet([
        ['user', JSON.stringify(response.data.user)],
        ['token', response.data.token]
      ]);

      // تحديث الحالة مباشرة بعد تسجيل الدخول
      setUser(response.data.user);
      setToken(response.data.token);
      
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
      setToken(null);
      router.replace('/');
    } catch (error) {
      setError('Logout failed');
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated,
      login, 
      logout, 
      loading, 
      error,
      initializeAuth // أضفنا الدالة للاستخدام الخارجي
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};