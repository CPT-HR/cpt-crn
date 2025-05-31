
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2 } from 'lucide-react';
import ManagerHierarchy from '@/components/ManagerHierarchy';

const Admin: React.FC = () => {
  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Administracija</h1>
      </div>

      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Hijerarhija voditelja
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Zaposlenici
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="mt-6">
          <ManagerHierarchy />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            Upravljanje zaposlenicima - uskoro
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
