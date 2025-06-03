import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Plus, UserCheck, UserX } from 'lucide-react';
import { Employee, EmployeeFormData } from '@/types/employee';
import { getEmployeeFullName, getEmployeeRoleDisplay } from '@/utils/employeeHelpers';
import { useCrudOperations } from '@/hooks/useCrudOperations';

const EmployeeManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    user_role: 'technician',
    location_id: '',
    vehicle_id: '',
    manager_id: '',
  });

  const { handleCreate, handleUpdate, isLoading } = useCrudOperations<Employee>({
    tableName: 'employee_profiles',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDialogOpen(false);
      resetForm();
    }
  });

  const { data: employees, error, isError, isFetching } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data as Employee[];
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      user_role: 'technician',
      location_id: '',
      vehicle_id: '',
      manager_id: '',
    });
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      await handleUpdate(editingEmployee.id, formData);
    } else {
      await handleCreate(formData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      user_role: employee.user_role,
      location_id: employee.location_id || '',
      vehicle_id: employee.vehicle_id || '',
      manager_id: employee.manager_id || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Confirm before delete
    if (window.confirm("Jeste li sigurni da želite obrisati ovog zaposlenika?")) {
      // Call the delete function
      // await deleteEmployee(id);
    }
  };

  if (isFetching) {
    return <div>Učitavanje zaposlenika...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Upravljanje zaposlenicima</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj zaposlenika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEmployee ? 'Uredi zaposlenika' : 'Dodaj zaposlenika'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right">Ime</Label>
                  <Input
                    type="text"
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right">Prezime</Label>
                  <Input
                    type="text"
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user_role" className="text-right">Uloga</Label>
                  <Select value={formData.user_role} onValueChange={(value) => setFormData({ ...formData, user_role: value as any })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Odaberite ulogu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="lead">Voditelj</SelectItem>
                      <SelectItem value="technician">Tehničar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {editingEmployee ? 'Ažuriraj' : 'Spremi'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ime i prezime</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Uloga</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{getEmployeeFullName(employee)}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{getEmployeeRoleDisplay(employee.user_role)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Uredi
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Obriši
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeeManagement;
