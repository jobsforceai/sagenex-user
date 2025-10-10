'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = Cookies.get('authToken');
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to access Cookies", error);
    } finally {
      setLoading(false); // Set loading to false after checking
    }
  }, []);

  const login = (newToken: string) => {
    Cookies.set('authToken', newToken, { secure: true, sameSite: 'strict' });
    setToken(newToken);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('authToken');
    setToken(null);
    router.push('/login');
  };

  const isAuthenticated = !loading && !!token;

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
