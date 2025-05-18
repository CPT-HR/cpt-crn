
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-bold text-xl text-brand">
              Radni nalozi
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/" currentPath={location.pathname}>
                Novi nalog
              </NavLink>
              <NavLink to="/settings" currentPath={location.pathname}>
                Postavke
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" currentPath={location.pathname}>
                  Administracija
                </NavLink>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden md:inline-block">
              {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Odjava
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sustav za radne naloge
        </div>
      </footer>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  currentPath: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, currentPath, children }) => {
  const isActive = to === '/' 
    ? currentPath === '/' 
    : currentPath.startsWith(to);
    
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-brand ${
        isActive ? 'text-brand' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  );
};

export default Layout;
