
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MockDataGeneratorProps {
  onDataGenerated?: () => void;
}

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onDataGenerated }) => {
  const { toast } = useToast();

  const generateMockWorkOrders = async () => {
    try {
      console.log('Generating mock work orders...');
      
      // Add your work order mock data generation logic here
      // This is a placeholder for the actual implementation
      
      toast({
        title: "Mock radni nalozi stvoreni",
        description: "Uspješno dodani mock radni nalozi",
      });

      if (onDataGenerated) {
        onDataGenerated();
      }
    } catch (error: any) {
      console.error('Error creating mock work orders:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: `Došlo je do greške: ${error.message || 'Nepoznata greška'}`,
      });
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      <Button onClick={generateMockWorkOrders} variant="outline">
        Generiraj mock radne naloge
      </Button>
    </div>
  );
};

export default MockDataGenerator;
