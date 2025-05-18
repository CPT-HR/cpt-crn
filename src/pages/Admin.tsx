
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

// Mock pending users
const PENDING_USERS = [
  {
    id: '3',
    email: 'pending@example.com',
    name: 'Pending User',
    role: 'technician',
    approved: false,
    date: '2023-05-10',
  },
  {
    id: '4',
    email: 'another@example.com',
    name: 'Another Pending',
    role: 'technician',
    approved: false,
    date: '2023-05-12',
  }
];

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState(PENDING_USERS);
  
  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  const approveUser = (id: string) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    toast({
      title: "Korisnik odobren",
      description: "Korisnikov račun je uspješno odobren",
    });
  };
  
  const rejectUser = (id: string) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    toast({
      title: "Korisnik odbijen",
      description: "Zahtjev za registraciju je odbijen",
    });
  };
  
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Administracija</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Zahtjevi za registraciju</span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive">{pendingUsers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nema novih zahtjeva za registraciju
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(pendingUser => (
                <div 
                  key={pendingUser.id} 
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-medium">{pendingUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Zahtjev poslan: {new Date(pendingUser.date).toLocaleDateString('hr-HR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rejectUser(pendingUser.id)}
                    >
                      Odbij
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => approveUser(pendingUser.id)}
                    >
                      Odobri
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
