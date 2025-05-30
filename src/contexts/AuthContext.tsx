
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const userData: UserData = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            initials: (session.user.user_metadata?.name || session.user.email || '').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            role: session.user.user_metadata?.role || 'admin',
            signature: session.user.user_metadata?.signature,
            companyAddress: session.user.user_metadata?.companyAddress,
            distanceMatrixApiKey: session.user.user_metadata?.distanceMatrixApiKey
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData: UserData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          initials: (session.user.user_metadata?.name || session.user.email || '').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          role: session.user.user_metadata?.role || 'admin',
          signature: session.user.user_metadata?.signature,
          companyAddress: session.user.user_metadata?.companyAddress,
          distanceMatrixApiKey: session.user.user_metadata?.distanceMatrixApiKey
        };
        setUser(userData);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      throw new Error('Prijava neuspješna');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: 'admin' // First user is admin
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const saveSignature = async (signature: string) => {
    if (!user) return;
    
    const { error } = await supabase.auth.updateUser({
      data: { signature: signature }
    });
    
    if (error) throw error;
  };

  const saveCompanyAddress = async (address: string) => {
    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      data: { companyAddress: address }
    });
    
    if (error) throw error;
    
    console.log('Company address saved:', address);
  };

  const saveDistanceMatrixApiKey = async (apiKey: string) => {
    if (!user) return;
    
    const { error } = await supabase.auth.updateUser({
      data: { distanceMatrixApiKey: apiKey }
    });
    
    if (error) throw error;
    
    console.log('API key saved:', apiKey);
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
