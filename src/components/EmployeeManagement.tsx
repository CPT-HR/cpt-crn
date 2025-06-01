
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, UserCheck, Car, MapPin } from 'lucide-react';
import EmployeeSignatureManagement from '@/components/EmployeeSignatureManagement';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  user_role: string;
  active: boolean;
  vehicle_id: string | null;
  location_id: string | null;
  manager_id: string | null;
  signature_data: string | null;
  signature_created_at: string | null;
  signature_updated_at: string | null;
}

interface Vehicle {
  id: string;
  model: string | null;
  license_plate: string;
}

interface Location {
  id: string;
  name: string;
  street_address: string;
  city: string;
}

const EmployeeManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-management'],
    queryFn: async () => {
      console.log('Fetching employees for management...');
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', data);
      return data as Employee[];
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, model, license_plate')
        .order('license_plate');

      if (error) throw error;
      return data as Vehicle[];
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('id, name, street_address, city')
        .order('name');

      if (error) throw error;
      return data as Location[];
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ 
      employeeId, 
      updates 
    }: { 
      employeeId: string; 
      updates: Partial<Pick<Employee, 'vehicle_id' | 'location_id' | 'user_role' | 'active' | 'manager_id'>>
    }) => {
      console.log('Updating employee:', employeeId, updates);
      const { error } = await supabase
        .from('employee_profiles')
        .update(updates)
        .eq('id', employeeId);

      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Zaposlenik je uspješno ažuriran",
      });
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    },
    onError: (error) => {
      console.error('Error in updateEmployeeMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju zaposlenika",
      });
    }
  });

  const handleVehicleAssignment = (employeeId: string, vehicleId: string | null) => {
    updateEmployeeMutation.mutate({
      employeeId,
      updates: { vehicle_id: vehicleId === 'none' ? null : vehicleId }
    });
  };

  const handleLocationAssignment = (employeeId: string, locationId: string | null) => {
    updateEmployeeMutation.mutate({
      employeeId,
      updates: { location_id: locationId === 'none' ? null : locationId }
    });
  };

  const handleRoleChange = (employeeId: string, role: string) => {
    updateEmployeeMutation.mutate({
      employeeId,
      updates: { user_role: role }
    });
  };

  const handleActiveToggle = (employeeId: string, active: boolean) => {
    updateEmployeeMutation.mutate({
      employeeId,
      updates: { active }
    });
  };

  const handleManagerAssignment = (employeeId: string, managerId: string | null) => {
    updateEmployeeMutation.mutate({
      employeeId,
      updates: { manager_id: managerId === 'none' ? null : managerId }
    });
  };

  const getEmployeeFullName = (employee: Employee) => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId || !vehicles) return 'Nema vozila';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.license_plate : 'Nepoznato vozilo';
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return 'Nema lokacije';
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} - ${location.city}` : 'Nepoznata lokacija';
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId || !employees) return 'Nema voditelja';
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? getEmployeeFullName(manager) : 'Nepoznat voditelj';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'lead': return 'secondary';
      case 'technician': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'lead': return 'Voditelj';
      case 'technician': return 'Tehničar';
      default: return role;
    }
  };

  const potentialManagers = employees?.filter(emp => 
    emp.user_role === 'admin' || emp.user_role === 'lead'
  ) || [];

  if (employeesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Upravljanje zaposlenicima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Učitavanje...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Upravljanje zaposlenicima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees?.map((employee) => (
              <div key={employee.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-lg">
                        {getEmployeeFullName(employee)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.email}
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(employee.user_role)}>
                      {getRoleDisplayName(employee.user_role)}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${employee.id}`}
                        checked={employee.active}
                        onCheckedChange={(checked) => handleActiveToggle(employee.id, checked)}
                      />
                      <Label htmlFor={`active-${employee.id}`} className="text-sm">
                        {employee.active ? 'Aktivan' : 'Neaktivan'}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Uloga
                    </Label>
                    <Select 
                      value={employee.user_role} 
                      onValueChange={(value) => handleRoleChange(employee.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="lead">Voditelj</SelectItem>
                        <SelectItem value="technician">Tehničar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      Vozilo
                    </Label>
                    <Select 
                      value={employee.vehicle_id || 'none'} 
                      onValueChange={(value) => handleVehicleAssignment(employee.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nema vozila</SelectItem>
                        {vehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.license_plate}{vehicle.model && ` (${vehicle.model})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Lokacija
                    </Label>
                    <Select 
                      value={employee.location_id || 'none'} 
                      onValueChange={(value) => handleLocationAssignment(employee.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nema lokacije</SelectItem>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} - {location.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <UserCheck className="h-4 w-4" />
                      Voditelj
                    </Label>
                    <Select 
                      value={employee.manager_id || 'none'} 
                      onValueChange={(value) => handleManagerAssignment(employee.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nema voditelja</SelectItem>
                        {potentialManagers
                          .filter(manager => manager.id !== employee.id)
                          .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {getEmployeeFullName(manager)} ({getRoleDisplayName(manager.user_role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>Vozilo: {getVehicleName(employee.vehicle_id)}</div>
                    <div>Lokacija: {getLocationName(employee.location_id)}</div>
                    <div>Voditelj: {getManagerName(employee.manager_id)}</div>
                  </div>

                  <div className="pt-2 border-t">
                    <Label className="text-sm font-medium mb-2 block">Potpis tehničara:</Label>
                    <EmployeeSignatureManagement employee={employee} />
                  </div>
                </div>
              </div>
            ))}
            {employees?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nema zaposlenika u sustavu
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
