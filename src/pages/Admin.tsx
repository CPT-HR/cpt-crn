
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  
  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  useEffect(() => {
    // Load all registered users
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    setAllUsers(registeredUsers);
  }, []);
  
  const deleteUser = (userId: string) => {
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "Korisnik obrisan",
      description: "Korisnik je uspješno obrisan iz sustava",
    });
  };
  
  const changeUserRole = (userId: string, newRole: string) => {
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    setAllUsers(updatedUsers);
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // If changing current user's role, update current session
    if (userId === user.id) {
      const updatedCurrentUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
    }
    
    toast({
      title: "Uloga promijenjena",
      description: `Korisnikova uloga je promijenjena na ${newRole}`,
    });
  };
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Administracija</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Svi korisnici</span>
            <Badge variant="secondary">{allUsers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nema registriranih korisnika
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Uloga</TableHead>
                  <TableHead>Potpis</TableHead>
                  <TableHead>Adresa tvrtke</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map(userItem => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      {userItem.name}
                      {userItem.id === user.id && (
                        <Badge variant="outline" className="ml-2">Vi</Badge>
                      )}
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                        {userItem.role === 'admin' ? 'Administrator' : 'Tehničar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userItem.signature ? (
                        <Badge variant="outline">Ima potpis</Badge>
                      ) : (
                        <span className="text-muted-foreground">Nema potpis</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {userItem.companyAddress ? (
                        <span className="text-sm">{userItem.companyAddress}</span>
                      ) : (
                        <span className="text-muted-foreground">Nije postavljena</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {userItem.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => changeUserRole(userItem.id, 'admin')}
                          >
                            Učini admin
                          </Button>
                        )}
                        {userItem.role === 'admin' && userItem.id !== user.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => changeUserRole(userItem.id, 'technician')}
                          >
                            Ukloni admin
                          </Button>
                        )}
                        {userItem.id !== user.id && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteUser(userItem.id)}
                          >
                            Obriši
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
