
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t py-4">
      <div className="container text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Sustav za radne naloge
      </div>
    </footer>
  );
};

export default Footer;
