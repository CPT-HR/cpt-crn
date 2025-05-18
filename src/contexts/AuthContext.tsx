
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'admin' | 'technician';

type UserData = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  signature?: string;
  initials: string;
};

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  saveSignature: (signature: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user's profile data from Supabase
  const getUserProfile = async (userId: string) => {
    try {
      // This would typically fetch from a profiles table, but for now we're using hardcoded roles
      // In a real app, you would create a profiles table with user roles and other info
      
      // For now, we'll assume the user with the email you created is an admin
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        const email = userData.user.email || '';
        const name = userData.user.user_metadata?.name || email?.split('@')[0] || 'User';
        
        // Generate initials from name
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        
        // For now, hardcode the first user as admin
        const userProfile: UserData = {
          id: userId,
          email: email,
          name: name,
          role: 'admin', // Default as admin for the first user
          approved: true,
          initials: initials
        };
        
        setUser(userProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Using setTimeout to avoid Supabase auth deadlock issues
          setTimeout(() => {
            getUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        getUserProfile(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Prijava uspješna",
        description: "Dobrodošli natrag!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Došlo je do pogreške prilikom prijave';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Greška pri prijavi",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Register the new user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Registracija uspješna",
        description: "Vaš zahtjev je zaprimljen. Administrator će pregledati i odobriti vaš račun.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Došlo je do pogreške prilikom registracije';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Greška pri registraciji",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Odjava uspješna",
    });
  };

  const saveSignature = (signature: string) => {
    if (user) {
      const updatedUser = { ...user, signature };
      setUser(updatedUser);
      
      // In a real app, you'd save this to a profiles table in Supabase
      // For now, just store it in localStorage to persist between sessions
      localStorage.setItem('userSignature', signature);
      
      toast({
        title: "Potpis spremljen",
        description: "Vaš potpis je uspješno ažuriran",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, register, saveSignature }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
