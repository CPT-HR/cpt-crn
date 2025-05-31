
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
import { Users, UserCheck } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  user_role: string;
  manager_id: string | null;
  email: string;
}

const ManagerHierarchy: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees-hierarchy'],
    queryFn: async () => {
      console.log('Fetching employees for hierarchy...');
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, user_role, manager_id, email')
        .eq('active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', data);
      return data as Employee[];
    }
  });

  const assignManagerMutation = useMutation({
    mutationFn: async ({ employeeId, managerId }: { employeeId: string; managerId: string | null }) => {
      console.log('Assigning manager:', { employeeId, managerId });
      const { error } = await supabase
        .from('employee_profiles')
        .update({ manager_id: managerId })
        .eq('id', employeeId);

      if (error) {
        console.error('Error assigning manager:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Voditelj je uspješno dodijeljen",
      });
      queryClient.invalidateQueries({ queryKey: ['employees-hierarchy'] });
      setSelectedEmployee('');
      setSelectedManager('');
    },
    onError: (error) => {
      console.error('Error in assignManagerMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri dodjeljivanju voditelja",
      });
    }
  });

  const handleAssignManager = () => {
    if (!selectedEmployee) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Molimo odaberite zaposlenika",
      });
      return;
    }

    assignManagerMutation.mutate({
      employeeId: selectedEmployee,
      managerId: selectedManager === 'none' ? null : selectedManager
    });
  };

  const getEmployeeFullName = (employee: Employee) => {
    return `${employee.first_name} ${employee.last_name}`;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hijerarhija voditelja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Učitavanje...</div>
        </CardContent>
      </Card>
    );
  }

  const potentialManagers = employees?.filter(emp => 
    emp.user_role === 'admin' || emp.user_role === 'lead'
  ) || [];

  const technicians = employees?.filter(emp => 
    emp.user_role === 'technician' || emp.user_role === 'lead'
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Dodijeli voditelja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Zaposlenik
              </label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite zaposlenika" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {getEmployeeFullName(employee)} ({getRoleDisplayName(employee.user_role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Voditelj
              </label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite voditelja (opcijsko)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nema voditelja</SelectItem>
                  {potentialManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {getEmployeeFullName(manager)} ({getRoleDisplayName(manager.user_role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAssignManager}
            disabled={assignManagerMutation.isPending || !selectedEmployee}
            className="w-full md:w-auto"
          >
            {assignManagerMutation.isPending ? 'Spremanje...' : 'Dodijeli voditelja'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Trenutna hijerarhija
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees?.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">
                      {getEmployeeFullName(employee)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {employee.email}
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(employee.user_role)}>
                    {getRoleDisplayName(employee.user_role)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Voditelj:
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getManagerName(employee.manager_id)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerHierarchy;
