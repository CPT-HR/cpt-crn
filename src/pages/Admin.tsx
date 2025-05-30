
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { user } = useAuth();
  
  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Administracija</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trenutni korisnik</span>
            <Badge variant="default">Administrator</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Ime:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Uloga:</strong> {user.role === 'admin' ? 'Administrator' : 'Tehničar'}</p>
            <p><strong>Potpis:</strong> {user.signature ? 'Postavljen' : 'Nije postavljen'}</p>
            <p><strong>Adresa tvrtke:</strong> {user.companyAddress || 'Nije postavljena'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
