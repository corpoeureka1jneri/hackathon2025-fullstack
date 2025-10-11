"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: 'client' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simple demo auth - in real app, this would call an API
    const validUsers = [
      { username: 'client', password: 'client', role: 'client' as const },
      { username: 'admin', password: 'admin', role: 'admin' as const },
    ];

    const validUser = validUsers.find(u => u.username === username && u.password === password);

    if (validUser) {
      const userData = { username: validUser.username, role: validUser.role };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
