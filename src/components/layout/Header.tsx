
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, NavIconLink } from './Navigation';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
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
            <NavLink to="/work-orders" currentPath={location.pathname}>
              Radni nalozi
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <NavIconLink to="/admin" currentPath={location.pathname} title="Administracija">
                <Users size={20} />
              </NavIconLink>
            )}
          </nav>
          
          <span className="text-sm text-gray-500 hidden md:inline-block">
            {user?.name}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Odjava
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
