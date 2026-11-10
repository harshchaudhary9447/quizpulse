'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  quickLoginAs: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem('quizpulse_access_token');
        const storedUser = localStorage.getItem('quizpulse_user');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await api.get('/auth/me');
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('quizpulse_user', JSON.stringify(res.data.user));
          }
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        localStorage.removeItem('quizpulse_access_token');
        localStorage.removeItem('quizpulse_refresh_token');
        localStorage.removeItem('quizpulse_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, accessToken, refreshToken } = res.data;

    localStorage.setItem('quizpulse_access_token', accessToken);
    localStorage.setItem('quizpulse_refresh_token', refreshToken);
    localStorage.setItem('quizpulse_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);

    // Route based on role
    if (loggedInUser.role === 'ADMIN') {
      router.push('/admin/platform');
    } else if (loggedInUser.role === 'TEACHER') {
      router.push('/teacher/quizzes');
    } else {
      router.push('/quizzes');
    }

    return loggedInUser;
  };

  const register = async ({ email, password, name, role = 'STUDENT' }) => {
    const res = await api.post('/auth/register', { email, password, name, role });
    const { user: registeredUser, accessToken, refreshToken } = res.data;

    localStorage.setItem('quizpulse_access_token', accessToken);
    localStorage.setItem('quizpulse_refresh_token', refreshToken);
    localStorage.setItem('quizpulse_user', JSON.stringify(registeredUser));

    setUser(registeredUser);

    if (registeredUser.role === 'TEACHER') {
      router.push('/teacher/quizzes');
    } else {
      router.push('/quizzes');
    }

    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('quizpulse_access_token');
      localStorage.removeItem('quizpulse_refresh_token');
      localStorage.removeItem('quizpulse_user');
      setUser(null);
      router.push('/login');
    }
  };

  const quickLoginAs = async (role) => {
    const accounts = {
      ADMIN: { email: 'admin@quizpulse.com', password: 'Admin123!' },
      TEACHER: { email: 'teacher1@quizpulse.com', password: 'Teacher123!' },
      STUDENT: { email: 'student1@quizpulse.com', password: 'Student123!' },
    };
    const acc = accounts[role];
    if (acc) {
      return login(acc.email, acc.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickLoginAs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
