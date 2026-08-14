import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  businessName: string | null;
  baseCurrency: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    fullName: string;
    phoneNumber: string;
    password: string;
    role: string;
    businessName?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const me = await api.me();
          setUser(me as User);
        }
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      } finally {
        setIsLoading(false);
      }
    }
    void restore();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    const result = await api.login({ phoneNumber, password });
    await AsyncStorage.setItem('accessToken', result.accessToken);
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
    setUser(result.user as User);
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    setUser(null);
  };

  const register = async (data: {
    fullName: string; phoneNumber: string; password: string;
    role: string; businessName?: string;
  }) => {
    await api.register(data);
    await login(data.phoneNumber, data.password);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
