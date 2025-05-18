
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'technician';
  approved: boolean;
  signature?: string;
  initials: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  saveSignature: (signature: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database - this would be replaced by actual backend integration
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    approved: true,
    initials: 'AU',
  },
  {
    id: '2',
    email: 'tech@example.com',
    name: 'Tehnički Korisnik',
    role: 'technician',
    approved: true,
    initials: 'TK',
  }
];

// Mock password database - in a real app, use proper password hashing
const MOCK_PASSWORDS: Record<string, string> = {
  'admin@example.com': 'admin123',
  'tech@example.com': 'tech123',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved user in localStorage (simulating persistence)
    const savedUser = localStorage.getItem('workOrderUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const foundUser = MOCK_USERS.find(u => u.email === email);
      
      if (!foundUser || MOCK_PASSWORDS[email] !== password) {
        throw new Error('Neispravna email adresa ili lozinka');
      }
      
      if (!foundUser.approved) {
        throw new Error('Vaš račun još nije odobren. Kontaktirajte administratora.');
      }
      
      setUser(foundUser);
      localStorage.setItem('workOrderUser', JSON.stringify(foundUser));
      toast({
        title: "Prijava uspješna",
        description: `Dobrodošli, ${foundUser.name}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do pogreške prilikom prijave');
      toast({
        variant: "destructive",
        title: "Greška pri prijavi",
        description: err instanceof Error ? err.message : 'Došlo je do pogreške prilikom prijave',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        throw new Error('Korisnik s ovom email adresom već postoji');
      }
      
      // In a real app, this would create a user record pending approval
      toast({
        title: "Registracija uspješna",
        description: "Vaš zahtjev je zaprimljen. Administrator će pregledati i odobriti vaš račun.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do pogreške prilikom registracije');
      toast({
        variant: "destructive",
        title: "Greška pri registraciji",
        description: err instanceof Error ? err.message : 'Došlo je do pogreške prilikom registracije',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('workOrderUser');
    toast({
      title: "Odjava uspješna",
    });
  };

  const saveSignature = (signature: string) => {
    if (user) {
      const updatedUser = { ...user, signature };
      setUser(updatedUser);
      localStorage.setItem('workOrderUser', JSON.stringify(updatedUser));
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
