import React, { createContext, useContext, useState } from 'react';

export interface UserData {
  id: string;
  email: string;
  name: string;
  initials: string;
  signature?: string;
  companyAddress?: string;
  distanceMatrixApiKey?: string;
}

interface AuthContextProps {
  user: UserData | null;
  login: (user: UserData) => void;
  logout: () => void;
  saveSignature: (signature: string) => Promise<void>;
  saveCompanyAddress: (address: string) => Promise<void>;
  saveDistanceMatrixApiKey: (apiKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (user: UserData) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const saveSignature = async (signature: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, signature: signature };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const saveCompanyAddress = async (address: string) => {
    if (!user) return;

    const updatedUser = { ...user, companyAddress: address };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const saveDistanceMatrixApiKey = async (apiKey: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, distanceMatrixApiKey: apiKey };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    saveSignature,
    saveCompanyAddress,
    saveDistanceMatrixApiKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
