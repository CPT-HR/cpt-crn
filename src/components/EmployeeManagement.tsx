
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { EmployeeCard } from './employee/EmployeeCard';

const EmployeeManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('technician');
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const { data: employees, isLoading: isLoadingEmployees, error: errorEmployees } = useQuery({
    queryKey: ['employees-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          user_role,
          location_id,
          company_locations (name),
          signature_data,
          signature_created_at,
          signature_updated_at
        `)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return data.map(employee => ({
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: employee.user_role,
        location_name: employee.company_locations?.name,
        signature_data: employee.signature_data,
        signature_created_at: employee.signature_created_at,
        signature_updated_at: employee.signature_updated_at
      }));
    },
  });

  const { data: locations, isLoading: isLoadingLocations, error: errorLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching locations:', error);
        throw error;
      }

      return data;
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('employee_profiles')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            user_role: role,
            location_id: locationId,
          },
        ]);

      if (error) {
        console.error('Error creating employee:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Zaposlenik je uspješno kreiran",
      });
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('technician');
      setLocationId(undefined);
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Error in createEmployeeMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri kreiranju zaposlenika",
      });
      setIsCreating(false);
    }
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Dodaj novog zaposlenika
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Ime"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Prezime"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select onValueChange={setRole} defaultValue="technician">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Uloga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="technician">Serviser</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setLocationId(value === 'null' ? undefined : value)} defaultValue={locationId || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lokacija (opcionalno)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nema lokacije</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={isCreating} onClick={() => createEmployeeMutation.mutate()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dodaj zaposlenika
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees?.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
};

export default EmployeeManagement;
