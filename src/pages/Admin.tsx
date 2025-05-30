
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: string;
  signature?: string;
  company_address_street?: string;
  company_address_city?: string;
  company_address_country?: string;
  distance_matrix_api_key?: string;
  created_at: string;
  updated_at: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom dohvaćanja korisnika",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          company_address_street: updatedUser.company_address_street,
          company_address_city: updatedUser.company_address_city,
          company_address_country: updatedUser.company_address_country,
          distance_matrix_api_key: updatedUser.distance_matrix_api_key,
        })
        .eq('id', updatedUser.id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Podaci korisnika su uspješno ažurirani",
      });

      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom ažuriranja korisnika",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Korisnik je uspješno obrisan",
        });

        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Došlo je do pogreške prilikom brisanja korisnika",
        });
      }
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Upravljanje korisnicima</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Učitavanje korisnika...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Uloga</TableHead>
                  <TableHead>Datum stvaranja</TableHead>
                  <TableHead>Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>{userData.name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                        {userData.role === 'admin' ? 'Administrator' : 'Tehničar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userData.created_at).toLocaleDateString('hr-HR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userData)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(userData.id)}
                          disabled={userData.id === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uredi korisnika</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSave={handleUpdateUser}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EditUserFormProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Ime</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Uloga</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="technician">Tehničar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Ulica</Label>
        <Input
          id="street"
          value={formData.company_address_street || ''}
          onChange={(e) => setFormData({ ...formData, company_address_street: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Grad</Label>
        <Input
          id="city"
          value={formData.company_address_city || ''}
          onChange={(e) => setFormData({ ...formData, company_address_city: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Država</Label>
        <Select 
          value={formData.company_address_country || 'Hrvatska'} 
          onValueChange={(value) => setFormData({ ...formData, company_address_country: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hrvatska">Hrvatska</SelectItem>
            <SelectItem value="Slovenija">Slovenija</SelectItem>
            <SelectItem value="Bosna i Hercegovina">Bosna i Hercegovina</SelectItem>
            <SelectItem value="Srbija">Srbija</SelectItem>
            <SelectItem value="Crna Gora">Crna Gora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API ključ</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.distance_matrix_api_key || ''}
          onChange={(e) => setFormData({ ...formData, distance_matrix_api_key: e.target.value })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Odustani
        </Button>
        <Button type="submit">
          Spremi
        </Button>
      </div>
    </form>
  );
};

export default Admin;
