
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MockDataGeneratorProps {
  onDataGenerated?: () => void;
}

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onDataGenerated }) => {
  const { toast } = useToast();

  const generateMockEmployees = async () => {
    try {
      console.log('Attempting to create mock employees...');

      const mockEmployees = [
        {
          first_name: "Marko",
          last_name: "Kovačić", 
          email: "marko.kovacic@tvrtka.hr",
          phone: "+385 91 123 4567",
          user_role: "technician"
        },
        {
          first_name: "Ana",
          last_name: "Novak",
          email: "ana.novak@tvrtka.hr", 
          phone: "+385 92 234 5678",
          user_role: "technician"
        },
        {
          first_name: "Petar",
          last_name: "Babić",
          email: "petar.babic@tvrtka.hr",
          phone: "+385 93 345 6789", 
          user_role: "admin"
        }
      ];

      console.log('Creating mock employees with proper auth workflow...');

      // WORKFLOW: Za svaki mock zaposlenika, prvo kreiraj auth usera, zatim employee_profile
      for (const employee of mockEmployees) {
        try {
          // STEP 1: Kreiraj auth usera
          const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
          
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: employee.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: employee.first_name,
              last_name: employee.last_name,
              role: employee.user_role
            }
          });
          
          if (authError || !authData.user) {
            console.error(`Failed to create auth user for ${employee.email}:`, authError);
            continue; // Preskoči ovog zaposlenika ako auth kreiranje ne uspije
          }
          
          // STEP 2: Kreiraj employee_profile s auth user ID-em
          const employeeProfileData = {
            id: authData.user.id, // KLJUČNO: koristi id iz auth.users
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            user_role: employee.user_role,
            active: true
          };
          
          const { error: profileError } = await supabase
            .from('employee_profiles')
            .insert([employeeProfileData as any]) // as any jer mock podaci mogu imati fleksibilniju strukturu
            .select();
          
          if (profileError) {
            console.error(`Failed to create employee profile for ${employee.email}:`, profileError);
            // Pokušaj obrisati auth usera ako employee_profile kreiranje ne uspije
            try {
              await supabase.auth.admin.deleteUser(authData.user.id);
            } catch (cleanupError) {
              console.error('Failed to cleanup auth user:', cleanupError);
            }
          } else {
            console.log(`Successfully created employee: ${employee.email}`);
          }
          
        } catch (error) {
          console.error(`Error processing employee ${employee.email}:`, error);
        }
      }

      toast({
        title: "Mock zaposlenici stvoreni",
        description: "Uspješno dodani mock zaposlenici u bazu (oni koji su uspješno kreirani)",
      });

      if (onDataGenerated) {
        onDataGenerated();
      }
    } catch (error: any) {
      console.error('Error creating mock employees:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: `Došlo je do greške: ${error.message || 'Nepoznata greška'}`,
      });
    }
  };

  const generateMockVehicles = async () => {
    try {
      console.log('Attempting to create mock vehicles...');

      const mockVehicles = [
        {
          name: "Servisno vozilo 1",
          license_plate: "ZG-1234-AB",
          model: "Volkswagen Caddy",
          year: 2020
        },
        {
          name: "Servisno vozilo 2", 
          license_plate: "ZG-5678-CD",
          model: "Ford Transit",
          year: 2019
        },
        {
          name: "Terensko vozilo",
          license_plate: "ZG-9012-EF", 
          model: "Toyota Hilux",
          year: 2021
        }
      ];

      console.log('Inserting vehicles:', mockVehicles);

      const { data, error } = await supabase
        .from('vehicles')
        .insert(mockVehicles)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully created vehicles:', data);

      toast({
        title: "Mock vozila stvorena",
        description: "Uspješno dodana 3 mock vozila u bazu",
      });

      if (onDataGenerated) {
        onDataGenerated();
      }
    } catch (error: any) {
      console.error('Error creating mock vehicles:', error);
      toast({
        variant: "destructive", 
        title: "Greška",
        description: `Došlo je do greške: ${error.message || 'Nepoznata greška'}`,
      });
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      <Button onClick={generateMockEmployees} variant="outline">
        Generiraj mock zaposlenike
      </Button>
      <Button onClick={generateMockVehicles} variant="outline">
        Generiraj mock vozila
      </Button>
    </div>
  );
};

export default MockDataGenerator;
