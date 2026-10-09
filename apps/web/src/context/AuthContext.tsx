import type { IUser, UpdateProfileRequest } from '@ocj/contracts';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authRepository } from '../app/api/client';
import { useAuthStore } from '../features/auth/auth.store';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateProfile: (payload: UpdateProfileRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const hasBootstrappedLegacySession = useRef(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const clearSession = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    clear();
    socketService.disconnect();
  }, [clear]);

  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
      return;
    }
    socketService.disconnect();
  }, [accessToken]);

  useEffect(() => {
    if (hasBootstrappedLegacySession.current) {
      return;
    }

    hasBootstrappedLegacySession.current = true;
    const legacyToken = localStorage.getItem('token');
    const legacyRefreshToken = localStorage.getItem('refreshToken');
    if (!accessToken && legacyToken && legacyRefreshToken) {
      setTokens({ accessToken: legacyToken, refreshToken: legacyRefreshToken });
    }
  }, [accessToken, setTokens]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    } else {
      localStorage.removeItem('token');
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      if (user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const me = await authRepository.me();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, setUser, user]);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authRepository.login({ email, password });
    setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
  }, [setSession]);

  const register = React.useCallback(async (username: string, email: string, password: string) => {
    const res = await authRepository.register({ username, email, password });
    if (res.accessToken && res.refreshToken && res.user) {
      setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
    }
  }, [setSession]);

  const updateProfile = React.useCallback(async (payload: UpdateProfileRequest) => {
    const updatedUser = await authRepository.updateMe(payload);
    setUser(updatedUser);
  }, [setUser]);

  const logout = React.useCallback(async () => {
    try {
      await authRepository.logout({ refreshToken });
    } catch {
      void 0;
    } finally {
      clearSession();
    }
  }, [clearSession, refreshToken]);

  const value = useMemo<AuthContextType>(() => {
    return {
      user,
      token: accessToken,
      loading,
      login,
      register,
      updateProfile,
      logout,
    };
  }, [accessToken, loading, login, logout, register, updateProfile, user]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
