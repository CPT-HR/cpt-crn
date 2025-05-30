import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'admin' | 'technician' | 'lead';

type UserData = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  signature?: string;
  initials: string;
  companyAddress?: string;
  distanceMatrixApiKey?: string;
  phone?: string;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  saveSignature: (signature: string) => Promise<void>;
  saveCompanyAddress: (address: string) => Promise<void>;
  saveDistanceMatrixApiKey: (apiKey: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMounted = useRef(true);

  // Load user signature from database
  const loadUserSignature = async (userId: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from('user_signatures')
        .select('signature_data')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading signature:', error);
        return undefined;
      }
      
      return data?.signature_data;
    } catch (err) {
      console.error('Error loading signature:', err);
      return undefined;
    }
  };

  // Load user company address from localStorage (temporary storage)
  const loadUserCompanyAddress = (userId: string): string | undefined => {
    try {
      const savedAddress = localStorage.getItem(`companyAddress_${userId}`);
      return savedAddress || undefined;
    } catch (err) {
      console.error('Error loading company address:', err);
      return undefined;
    }
  };

  // Load user distance matrix API key from localStorage
  const loadUserDistanceMatrixApiKey = (userId: string): string | undefined => {
    try {
      const savedApiKey = localStorage.getItem(`distanceMatrixApiKey_${userId}`);
      return savedApiKey || undefined;
    } catch (err) {
      console.error('Error loading distance matrix API key:', err);
      return undefined;
    }
  };

  // Get user's profile data from Supabase
  const getUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user && isMounted.current) {
        const email = userData.user.email || '';
        
        // Load employee profile from database
        const { data: employeeProfile, error: profileError } = await supabase
          .from('employee_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error loading employee profile:', profileError);
        }

        console.log('Employee profile loaded:', employeeProfile);
        
        const firstName = employeeProfile?.first_name || userData.user.user_metadata?.first_name || email?.split('@')[0] || 'User';
        const lastName = employeeProfile?.last_name || userData.user.user_metadata?.last_name || '';
        const name = `${firstName} ${lastName}`.trim();
        
        // Generate initials from name
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`
          .toUpperCase()
          .substring(0, 2);
        
        // Load signature from database
        const signature = await loadUserSignature(userId);
        
        // Load company address from localStorage
        const companyAddress = loadUserCompanyAddress(userId);
        
        // Load distance matrix API key from localStorage
        const distanceMatrixApiKey = loadUserDistanceMatrixApiKey(userId);
        
        // Ensure role is properly typed
        let userRole: UserRole = 'technician';
        if (employeeProfile?.user_role === 'admin' || employeeProfile?.user_role === 'technician' || employeeProfile?.user_role === 'lead') {
          userRole = employeeProfile.user_role as UserRole;
        }
        
        const userProfile: UserData = {
          id: userId,
          email: email,
          name: name,
          firstName: firstName,
          lastName: lastName,
          role: userRole,
          approved: employeeProfile?.active || true,
          initials: initials,
          signature: signature,
          companyAddress: companyAddress,
          distanceMatrixApiKey: distanceMatrixApiKey,
          phone: employeeProfile?.phone
        };
        
        console.log('Setting user profile:', userProfile);
        setUser(userProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted.current) return;
        
        console.log('Auth state changed:', event, currentSession ? 'session exists' : 'no session');
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase auth deadlock issues
          setTimeout(() => {
            if (isMounted.current) {
              getUserProfile(currentSession.user.id);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted.current) return;
        
        console.log('Got initial session:', currentSession ? 'yes' : 'no');
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          getUserProfile(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Logging in with:', email);
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
      console.error('Login error:', err);
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast({
        title: "Odjava uspješna",
      });
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        variant: "destructive",
        title: "Greška pri odjavi",
        description: "Došlo je do pogreške prilikom odjave",
      });
    }
  };

  const saveSignature = async (signature: string): Promise<void> => {
    if (!user) {
      throw new Error('Korisnik nije prijavljen');
    }
    
    try {
      // Try to update existing signature first
      const { error: updateError } = await supabase
        .from('user_signatures')
        .update({ signature_data: signature })
        .eq('user_id', user.id);
      
      // If update fails (no existing record), insert new one
      if (updateError) {
        const { error: insertError } = await supabase
          .from('user_signatures')
          .insert({
            user_id: user.id,
            signature_data: signature
          });
        
        if (insertError) throw insertError;
      }
      
      // Update local user state
      const updatedUser = { ...user, signature };
      setUser(updatedUser);
      
      // Remove from localStorage if it exists (cleanup)
      localStorage.removeItem('userSignature');
      
      toast({
        title: "Potpis spremljen",
        description: "Vaš potpis je uspješno ažuriran u bazi podataka",
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom spremanja potpisa",
      });
      throw error;
    }
  };

  const saveCompanyAddress = async (address: string): Promise<void> => {
    if (!user) {
      throw new Error('Korisnik nije prijavljen');
    }
    
    try {
      // Save to localStorage for now (could be extended to database later)
      localStorage.setItem(`companyAddress_${user.id}`, address);
      
      // Update local user state
      const updatedUser = { ...user, companyAddress: address };
      setUser(updatedUser);
      
      toast({
        title: "Adresa spremljena",
        description: "Adresa sjedišta tvrtke je uspješno spremljena",
      });
    } catch (error) {
      console.error('Error saving company address:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom spremanja adrese",
      });
      throw error;
    }
  };

  const saveDistanceMatrixApiKey = async (apiKey: string): Promise<void> => {
    if (!user) {
      throw new Error('Korisnik nije prijavljen');
    }
    
    try {
      // Save to localStorage for now (could be extended to database later)
      localStorage.setItem(`distanceMatrixApiKey_${user.id}`, apiKey);
      
      // Update local user state
      const updatedUser = { ...user, distanceMatrixApiKey: apiKey };
      setUser(updatedUser);
      
      toast({
        title: "API ključ spremljen",
        description: "Distance Matrix API ključ je uspješno spremljen",
      });
    } catch (error) {
      console.error('Error saving distance matrix API key:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom spremanja API ključa",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      login, 
      logout, 
      saveSignature, 
      saveCompanyAddress, 
      saveDistanceMatrixApiKey 
    }}>
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
