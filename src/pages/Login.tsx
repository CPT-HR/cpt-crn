
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous error when component mounts or dependencies change
    setLoginError(null);
    
    // If user is already logged in, redirect to dashboard
    // This check helps prevent redirect loops by ensuring auth is not still loading
    if (user && !isLoading) {
      console.log('User is logged in, redirecting to dashboard');
      navigate('/');
    }
  }, [user, navigate, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null); // Clear any previous errors
    console.log('Login form submitted');
    
    try {
      await login(email, password);
      // Don't navigate here - let the useEffect handle it once auth state updates
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error instanceof Error ? error.message : 'Greška prilikom prijave');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Prijava</CardTitle>
          <CardDescription className="text-center">
            Unesite email i lozinku za pristup aplikaciji
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="korisnik@tvrtka.hr" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Lozinka</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            {loginError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {loginError}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full relative" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Prijava u tijeku...' : 'Prijavi se'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Nemate račun?{' '}
              <Link to="/register" className="text-brand underline">
                Registracija
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
