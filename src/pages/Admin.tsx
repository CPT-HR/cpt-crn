
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MockDataGenerator from "@/components/MockDataGenerator";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  user_role: string;
  location_id: string | null;
  vehicle_id: string | null;
}

const Admin = () => {
  const [newEmployee, setNewEmployee] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    user_role: "technician",
    location_id: "",
    vehicle_id: ""
  });
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching employees:", error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Došlo je do greške pri učitavanju zaposlenika.",
        });
      } else {
        setEmployees(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Creating employee via Edge Function with proper auth workflow...');

      const response = await supabase.functions.invoke('create-employee', {
        body: {
          employees: [newEmployee]
        }
      });

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw new Error(`Greška u Edge Function: ${response.error.message}`);
      }

      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (!data.success) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(`Greška pri kreiranju zaposlenika: ${data.error}`);
      }

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.success) {
          console.log(`✓ Successfully created: ${result.email}`);
          
          toast({
            title: "Zaposlenik uspješno dodan",
            description: `${newEmployee.first_name} ${newEmployee.last_name} je uspješno dodan u sustav`,
          });

          setNewEmployee({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            user_role: "technician",
            location_id: "",
            vehicle_id: ""
          });

          await refreshEmployees();
        } else {
          console.log(`✗ Failed to create: ${result.email} - ${result.error}`);
          
          const errorMessage = result.error === 'Korisnik već postoji' 
            ? 'Korisnik već postoji – nije moguće dodati zaposlenika s istim emailom.'
            : `Greška pri dodavanju zaposlenika: ${result.error}`;
          
          toast({
            variant: "destructive",
            title: "Greška pri dodavanju zaposlenika",
            description: errorMessage,
          });
        }
      }

    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: `Došlo je do greške: ${error.message || 'Nepoznata greška'}`,
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <MockDataGenerator onDataGenerated={refreshEmployees} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Dodaj novog zaposlenika</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="first_name">Ime</Label>
              <Input type="text" id="first_name" name="first_name" value={newEmployee.first_name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="last_name">Prezime</Label>
              <Input type="text" id="last_name" name="last_name" value={newEmployee.last_name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" name="email" value={newEmployee.email} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input type="text" id="phone" name="phone" value={newEmployee.phone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="user_role">Uloga</Label>
              <Select onValueChange={(value) => handleChange({ target: { name: 'user_role', value } } as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Odaberi ulogu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Serviser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit">Dodaj zaposlenika</Button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Lista zaposlenika</h2>
          {loading ? (
            <p>Učitavanje...</p>
          ) : (
            <ul className="space-y-2">
              {employees.map((employee) => (
                <li key={employee.id} className="bg-gray-100 p-2 rounded">
                  <strong>{employee.first_name} {employee.last_name}</strong> - {employee.email} ({employee.user_role})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
