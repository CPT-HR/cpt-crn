
import React, { createContext, useContext, useState } from 'react';

export interface UserData {
  id: string;
  email: string;
  name: string;
  initials: string;
  role?: string;
  signature?: string;
  companyAddress?: string;
  distanceMatrixApiKey?: string;
}

interface AuthContextProps {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  saveSignature: (signature: string) => Promise<void>;
  saveCompanyAddress: (address: string) => Promise<void>;
  saveDistanceMatrixApiKey: (apiKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Ensure all properties are loaded from localStorage
      return {
        ...parsedUser,
        companyAddress: parsedUser.companyAddress || '',
        distanceMatrixApiKey: parsedUser.distanceMatrixApiKey || ''
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if this user exists in localStorage users list
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingUser = registeredUsers.find((u: UserData) => u.email === email);
      
      if (existingUser) {
        setUser(existingUser);
        localStorage.setItem('user', JSON.stringify(existingUser));
      } else {
        throw new Error('Korisnik ne postoji');
      }
    } catch (error) {
      throw new Error('Prijava neuspješna');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Get existing users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Check if user already exists
      const existingUser = registeredUsers.find((u: UserData) => u.email === email);
      if (existingUser) {
        throw new Error('Korisnik s tim emailom već postoji');
      }
      
      // Determine role - first user is admin, others are technicians
      const role = registeredUsers.length === 0 ? 'admin' : 'technician';
      
      const newUser: UserData = {
        id: Date.now().toString(),
        email: email,
        name: name,
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase(),
        role: role
      };
      
      // Add to registered users list
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Set as current user
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
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
    
    // Update in registered users list too
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = registeredUsers.findIndex((u: UserData) => u.id === user.id);
    if (userIndex !== -1) {
      registeredUsers[userIndex] = updatedUser;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }
  };

  const saveCompanyAddress = async (address: string) => {
    if (!user) return;

    const updatedUser = { ...user, companyAddress: address };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update in registered users list too
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = registeredUsers.findIndex((u: UserData) => u.id === user.id);
    if (userIndex !== -1) {
      registeredUsers[userIndex] = updatedUser;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }
    
    console.log('Company address saved:', address);
    console.log('Updated user:', updatedUser);
  };

  const saveDistanceMatrixApiKey = async (apiKey: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, distanceMatrixApiKey: apiKey };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update in registered users list too
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = registeredUsers.findIndex((u: UserData) => u.id === user.id);
    if (userIndex !== -1) {
      registeredUsers[userIndex] = updatedUser;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }
    
    console.log('API key saved:', apiKey);
    console.log('Updated user:', updatedUser);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
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
