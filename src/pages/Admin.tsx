
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Car, MapPin } from 'lucide-react';
import VehicleManagement from '@/components/VehicleManagement';
import LocationManagement from '@/components/LocationManagement';
import EmployeeManagement from '@/components/EmployeeManagement';

const Admin: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['employees', 'vehicles', 'locations'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Administracija</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Zaposlenici
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vozila
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Lokacije
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <VehicleManagement />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <LocationManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
