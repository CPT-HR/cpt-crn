
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

  const fetchUserData = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        initials: data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        role: data.role,
        signature: data.signature,
        companyAddress: data.company_address_street && data.company_address_city 
          ? `${data.company_address_street}, ${data.company_address_city}, ${data.company_address_country}`
          : undefined,
        distanceMatrixApiKey: data.distance_matrix_api_key
      };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user);
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
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      if (authError) throw authError;

      if (authData.user) {
        // Check if this is the first user (should be admin)
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        const role = count === 0 ? 'admin' : 'technician';

        // Create user record in our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authData.user.id,
            name: name,
            email: email,
            role: role
          });

        if (userError) {
          console.error('Error creating user record:', userError);
        }
      }
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
    
    const { error } = await supabase
      .from('users')
      .update({ signature: signature })
      .eq('id', user.id);
    
    if (error) throw error;
  };

  const saveCompanyAddress = async (address: string) => {
    if (!user) return;

    const parts = address.split(', ');
    const { error } = await supabase
      .from('users')
      .update({
        company_address_street: parts[0] || '',
        company_address_city: parts[1] || '',
        company_address_country: parts[2] || 'Hrvatska'
      })
      .eq('id', user.id);
    
    if (error) throw error;
    
    console.log('Company address saved:', address);
  };

  const saveDistanceMatrixApiKey = async (apiKey: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('users')
      .update({ distance_matrix_api_key: apiKey })
      .eq('id', user.id);
    
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
