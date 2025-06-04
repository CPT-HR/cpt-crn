
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, List, Users, Car, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Novi radni nalog',
      description: 'Upravljanje radnim nalozima',
      icon: FileText,
      path: '/new-work-order',
      roles: ['admin', 'lead', 'technician']
    },
    {
      title: 'Radni nalozi',
      description: 'Pregled svih radnih naloga',
      icon: List,
      path: '/work-orders',
      roles: ['admin', 'lead', 'technician']
    },
    {
      title: 'Zaposlenici',
      description: 'Upravljanje zaposlenicima',
      icon: Users,
      path: '/admin#employees',
      roles: ['admin']
    },
    {
      title: 'Vozila',
      description: 'Upravljanje vozilima',
      icon: Car,
      path: '/admin#vehicles',
      roles: ['admin']
    },
    {
      title: 'Lokacije',
      description: 'Upravljanje lokacijama',
      icon: MapPin,
      path: '/admin#locations',
      roles: ['admin']
    }
  ];

  const availableItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'technician')
  );

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dobrodošli, {user?.name}</h1>
        <p className="text-muted-foreground">Odaberite akciju koju želite izvršiti</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableItems.map((item) => (
          <Link key={item.title} to={item.path}>
            <Card className="h-full transition-all hover:shadow-md hover:scale-105 cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Kliknite za pristup</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
