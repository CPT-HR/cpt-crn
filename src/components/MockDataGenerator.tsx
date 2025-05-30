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
      console.log('Attempting to create mock employees via Edge Function...');

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

      console.log('Creating mock employees using Edge Function with proper auth workflow...');

      // WORKFLOW: Koristi Edge Function koja ima service_role pristup
      // Edge Function će za svakog zaposlenika prvo kreirati auth usera, zatim employee_profile
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          employees: mockEmployees
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Greška u Edge Function: ${error.message}`);
      }

      if (!data.success) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(`Greška pri kreiranju mock zaposlenika: ${data.error}`);
      }

      // Provjeri rezultate za svaki zaposlenik
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.filter((r: any) => !r.success).length;
      
      console.log(`Mock employees creation completed: ${successCount} success, ${failCount} failed`);
      
      // Prikaži detaljne rezultate u konzoli
      data.results.forEach((result: any) => {
        if (result.success) {
          console.log(`✓ Successfully created: ${result.email}`);
        } else {
          console.log(`✗ Failed to create: ${result.email} - ${result.error}`);
        }
      });

      toast({
        title: "Mock zaposlenici stvoreni",
        description: `Uspješno dodano ${successCount} mock zaposlenika u bazu${failCount > 0 ? ` (${failCount} neuspješno)` : ''}`,
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
