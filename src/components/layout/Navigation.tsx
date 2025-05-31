
import React from 'react';
import { Link } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  currentPath: string;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, currentPath, children }) => {
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

interface NavIconLinkProps {
  to: string;
  currentPath: string;
  children: React.ReactNode;
  title: string;
}

export const NavIconLink: React.FC<NavIconLinkProps> = ({ to, currentPath, children, title }) => {
  const isActive = currentPath.startsWith(to);
    
  return (
    <Link
      to={to}
      title={title}
      className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${
        isActive ? 'text-brand bg-gray-50' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  );
};
