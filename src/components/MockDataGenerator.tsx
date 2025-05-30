
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface MockDataGeneratorProps {
  onDataGenerated?: () => void;
}

type TechnicianInsert = Database["public"]["Tables"]["technicians"]["Insert"];
type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onDataGenerated }) => {
  const { toast } = useToast();

  const generateMockTechnicians = async () => {
    try {
      console.log('Attempting to create mock technicians...');
      
      // First check current user and auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Korisnik nije prijavljen');
      }
      
      console.log('Current user:', user.id);

      const mockTechnicians: TechnicianInsert[] = [
        {
          first_name: "Marko",
          last_name: "Kovačić", 
          email: "marko.kovacic@tvrtka.hr",
          phone: "+385 91 123 4567",
          user_role: "technician" as const,
          active: true
        },
        {
          first_name: "Ana",
          last_name: "Novak",
          email: "ana.novak@tvrtka.hr", 
          phone: "+385 92 234 5678",
          user_role: "technician" as const,
          active: true
        },
        {
          first_name: "Petar",
          last_name: "Babić",
          email: "petar.babic@tvrtka.hr",
          phone: "+385 93 345 6789", 
          user_role: "admin" as const,
          active: true
        }
      ];

      console.log('Inserting technicians:', mockTechnicians);

      const { data, error } = await supabase
        .from('technicians')
        .insert(mockTechnicians)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully created technicians:', data);

      toast({
        title: "Mock tehničari stvoreni",
        description: "Uspješno dodana 3 mock tehničara u bazu",
      });

      if (onDataGenerated) {
        onDataGenerated();
      }
    } catch (error: any) {
      console.error('Error creating mock technicians:', error);
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
      
      // First check current user and auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Korisnik nije prijavljen');
      }
      
      console.log('Current user for vehicles:', user.id);

      const mockVehicles: VehicleInsert[] = [
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
      <Button onClick={generateMockTechnicians} variant="outline">
        Generiraj mock tehničare
      </Button>
      <Button onClick={generateMockVehicles} variant="outline">
        Generiraj mock vozila
      </Button>
    </div>
  );
};

export default MockDataGenerator;
