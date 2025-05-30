import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit, Car, Users, MapPin } from "lucide-react";
import MockDataGenerator from '@/components/MockDataGenerator';

// Mock pending users
const PENDING_USERS = [
  {
    id: '3',
    email: 'pending@example.com',
    name: 'Pending User',
    role: 'technician',
    approved: false,
    date: '2023-05-10',
  },
  {
    id: '4',
    email: 'another@example.com',
    name: 'Another Pending',
    role: 'technician',
    approved: false,
    date: '2023-05-12',
  }
];

interface CompanyLocation {
  id: string;
  name: string;
  street_address: string;
  city: string;
  country: string;
}

interface Vehicle {
  id: string;
  name: string;
  license_plate: string | null;
  model: string | null;
  year: number | null;
}

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location_id: string | null;
  user_role: 'admin' | 'technician' | 'lead';
  vehicle_id: string | null;
  active: boolean;
}

interface GlobalSettings {
  id: string;
  distance_matrix_api_key: string | null;
}

const countries = [
  'Hrvatska', 'Srbija', 'Slovenija', 'Bosna i Hercegovina', 'Crna Gora', 
  'Makedonija', 'Austrija', 'Njemačka', 'Italija', 'Mađarska'
];

const userRoles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'technician', label: 'Tehničar' },
  { value: 'lead', label: 'Voditelj' }
];

const Admin: React.FC = () => {
  const { technician } = useAuth();
  const [pendingUsers, setPendingUsers] = useState(PENDING_USERS);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [mockDataGenerated, setMockDataGenerated] = useState(false);
  
  // New location form
  const [newLocation, setNewLocation] = useState({
    name: '',
    street_address: '',
    city: 'Zagreb',
    country: 'Hrvatska'
  });
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  
  // New vehicle form
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    license_plate: '',
    model: '',
    year: new Date().getFullYear()
  });
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  
  // New technician form
  const [newTechnician, setNewTechnician] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location_id: '',
    user_role: 'technician' as 'admin' | 'technician' | 'lead',
    vehicle_id: ''
  });
  const [isAddingTechnician, setIsAddingTechnician] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [isEditingTechnician, setIsEditingTechnician] = useState(false);
  
  // Redirect non-admin users
  if (!technician || technician.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  // Debug current technician
  useEffect(() => {
    const debugUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user data:', currentUser);
      console.log('User metadata:', currentUser?.user_metadata);
      console.log('Technician role from context:', technician?.role);
    };
    debugUser();
  }, [technician]);
  
  // Load company locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        console.log('Fetching company locations...');
        const { data, error } = await supabase
          .from('company_locations')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching locations:', error);
          throw error;
        }
        
        console.log('Locations fetched successfully:', data);
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Nije moguće učitati lokacije tvrtke",
        });
      } finally {
        setIsLoadingLocations(false);
      }
    };
    
    fetchLocations();
  }, []);
  
  // Load vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        console.log('Fetching vehicles...');
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching vehicles:', error);
          throw error;
        }
        
        console.log('Vehicles fetched successfully:', data);
        setVehicles(data || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Nije moguće učitati vozila",
        });
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    
    fetchVehicles();
  }, []);
  
  // Load technicians
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        console.log('Fetching technicians...');
        const { data, error } = await supabase
          .from('technicians')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching technicians:', error);
          throw error;
        }
        
        console.log('Technicians fetched successfully:', data);
        setTechnicians(data || []);
      } catch (error) {
        console.error('Error fetching technicians:', error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Nije moguće učitati tehničare",
        });
      } finally {
        setIsLoadingTechnicians(false);
      }
    };
    
    fetchTechnicians();
  }, []);
  
  // Load global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        console.log('Fetching global settings...');
        const { data, error } = await supabase
          .from('global_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching global settings:', error);
          throw error;
        }
        
        console.log('Global settings fetched:', data);
        setGlobalSettings(data);
      } catch (error) {
        console.error('Error fetching global settings:', error);
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Nije moguće učitati globalne postavke",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    fetchGlobalSettings();
  }, []);
  
  // Helper function to refresh technicians data
  const refreshTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error refreshing technicians:', error);
    }
  };

  // Helper function to refresh vehicles data
  const refreshVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
    }
  };
  
  const approveUser = (id: string) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    toast({
      title: "Korisnik odobren",
      description: "Korisnikov račun je uspješno odobren",
    });
  };
  
  const rejectUser = (id: string) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    toast({
      title: "Korisnik odbijen",
      description: "Zahtjev za registraciju je odbijen",
    });
  };
  
  const addLocation = async () => {
    if (!newLocation.name.trim() || !newLocation.street_address.trim()) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Naziv i adresa su obavezni",
      });
      return;
    }
    
    setIsAddingLocation(true);
    try {
      console.log('Adding new location:', newLocation);
      
      const { data, error } = await supabase
        .from('company_locations')
        .insert([newLocation])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding location:', error);
        throw error;
      }
      
      console.log('Location added successfully:', data);
      setLocations([...locations, data]);
      setNewLocation({
        name: '',
        street_address: '',
        city: 'Zagreb',
        country: 'Hrvatska'
      });
      
      toast({
        title: "Lokacija dodana",
        description: "Nova lokacija tvrtke je uspješno dodana",
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće dodati lokaciju",
      });
    } finally {
      setIsAddingLocation(false);
    }
  };
  
  const deleteLocation = async (id: string) => {
    try {
      console.log('Deleting location:', id);
      const { error } = await supabase
        .from('company_locations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting location:', error);
        throw error;
      }
      
      console.log('Location deleted successfully');
      setLocations(locations.filter(loc => loc.id !== id));
      toast({
        title: "Lokacija obrisana",
        description: "Lokacija tvrtke je uspješno obrisana",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće obrisati lokaciju",
      });
    }
  };
  
  const addVehicle = async () => {
    if (!newVehicle.name.trim()) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Naziv vozila je obavezan",
      });
      return;
    }
    
    setIsAddingVehicle(true);
    try {
      console.log('Adding new vehicle:', newVehicle);
      
      const vehicleData = {
        ...newVehicle,
        license_plate: newVehicle.license_plate || null,
        model: newVehicle.model || null,
        year: newVehicle.year || null
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle added successfully:', data);
      setVehicles([...vehicles, data]);
      setNewVehicle({
        name: '',
        license_plate: '',
        model: '',
        year: new Date().getFullYear()
      });
      
      toast({
        title: "Vozilo dodano",
        description: "Novo vozilo je uspješno dodano",
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće dodati vozilo",
      });
    } finally {
      setIsAddingVehicle(false);
    }
  };
  
  const deleteVehicle = async (id: string) => {
    try {
      console.log('Deleting vehicle:', id);
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle deleted successfully');
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      toast({
        title: "Vozilo obrisano",
        description: "Vozilo je uspješno obrisano",
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće obrisati vozilo",
      });
    }
  };
  
  const addTechnician = async () => {
    if (!newTechnician.first_name.trim() || !newTechnician.last_name.trim() || !newTechnician.email.trim()) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Ime, prezime i email su obavezni",
      });
      return;
    }
    
    setIsAddingTechnician(true);
    try {
      console.log('Adding new technician:', newTechnician);
      
      const technicianData = {
        ...newTechnician,
        phone: newTechnician.phone || null,
        location_id: newTechnician.location_id || null,
        vehicle_id: newTechnician.vehicle_id || null
      };
      
      const { data, error } = await supabase
        .from('technicians')
        .insert([technicianData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding technician:', error);
        throw error;
      }
      
      console.log('Technician added successfully:', data);
      setTechnicians([...technicians, data]);
      setNewTechnician({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        location_id: '',
        user_role: 'technician',
        vehicle_id: ''
      });
      
      toast({
        title: "Tehničar dodan",
        description: "Novi tehničar je uspješno dodan",
      });
    } catch (error) {
      console.error('Error adding technician:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće dodati tehničara",
      });
    } finally {
      setIsAddingTechnician(false);
    }
  };
  
  const updateTechnician = async () => {
    if (!editingTechnician) return;
    
    setIsEditingTechnician(true);
    try {
      console.log('Updating technician:', editingTechnician);
      
      const { data, error } = await supabase
        .from('technicians')
        .update({
          first_name: editingTechnician.first_name,
          last_name: editingTechnician.last_name,
          email: editingTechnician.email,
          phone: editingTechnician.phone,
          location_id: editingTechnician.location_id,
          user_role: editingTechnician.user_role,
          vehicle_id: editingTechnician.vehicle_id,
          active: editingTechnician.active
        })
        .eq('id', editingTechnician.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating technician:', error);
        throw error;
      }
      
      console.log('Technician updated successfully:', data);
      setTechnicians(technicians.map(tech => tech.id === editingTechnician.id ? data : tech));
      setEditingTechnician(null);
      
      toast({
        title: "Tehničar ažuriran",
        description: "Podaci tehničara su uspješno ažurirani",
      });
    } catch (error) {
      console.error('Error updating technician:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće ažurirati tehničara",
      });
    } finally {
      setIsEditingTechnician(false);
    }
  };
  
  const deleteTechnician = async (id: string) => {
    try {
      console.log('Deleting technician:', id);
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting technician:', error);
        throw error;
      }
      
      console.log('Technician deleted successfully');
      setTechnicians(technicians.filter(tech => tech.id !== id));
      toast({
        title: "Tehničar obrisan",
        description: "Tehničar je uspješno obrisan",
      });
    } catch (error) {
      console.error('Error deleting technician:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće obrisati tehničara",
      });
    }
  };
  
  const saveGlobalSettings = async () => {
    if (!globalSettings) return;
    
    setIsSavingSettings(true);
    try {
      console.log('Saving global settings:', globalSettings);
      
      if (globalSettings.id) {
        // Update postojeći zapis
        const { error } = await supabase
          .from('global_settings')
          .update({
            distance_matrix_api_key: globalSettings.distance_matrix_api_key
          })
          .eq('id', globalSettings.id);
        
        if (error) {
          console.error('Error updating global settings:', error);
          throw error;
        }
      } else {
        // Insert novi zapis
        const { data, error } = await supabase
          .from('global_settings')
          .insert([{
            distance_matrix_api_key: globalSettings.distance_matrix_api_key
          }])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting global settings:', error);
          throw error;
        }
        
        console.log('New global settings inserted:', data);
        setGlobalSettings(data);
      }
      
      console.log('Global settings saved successfully');
      toast({
        title: "Postavke spremljene",
        description: "Globalne postavke su uspješno spremljene",
      });
    } catch (error) {
      console.error('Error saving global settings:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće spremiti postavke",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };
  
  const getLocationName = (locationId: string | null) => {
    if (!locationId || locationId === 'none') return 'Nije dodijeljeno';
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Nepoznato';
  };
  
  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId || vehicleId === 'none') return 'Nije dodijeljeno';
    const vehicle = vehicles.find(veh => veh.id === vehicleId);
    return vehicle ? vehicle.name : 'Nepoznato';
  };
  
  const generateMockData = async () => {
    try {
      // Generate mock technicians (including admin as technician)
      const mockTechnicians = [
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

      // Generate mock vehicles
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

      // Insert technicians
      const { error: techError } = await supabase
        .from('technicians')
        .insert(mockTechnicians);

      if (techError) throw techError;

      // Insert vehicles
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert(mockVehicles);

      if (vehicleError) throw vehicleError;

      // Refresh data
      await Promise.all([refreshTechnicians(), refreshVehicles()]);
      setMockDataGenerated(true);

      toast({
        title: "Mock podaci stvoreni",
        description: "Uspješno dodani mock tehničari i vozila",
      });
    } catch (error) {
      console.error('Error generating mock data:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom stvaranja mock podataka",
      });
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Administracija</h1>
      
      {/* Mock data generation - TEMPORARY FEATURE */}
      {!mockDataGenerated && (
        <Card className="mb-6 border-dashed border-amber-400 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-amber-800">Generiraj mock podatke</h3>
                <p className="text-sm text-amber-700">Privremena funkcionalnost za dodavanje test podataka</p>
              </div>
              <Button onClick={generateMockData} variant="outline" className="border-amber-400">
                Generiraj mock podatke
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock Data Generator Component */}
      <MockDataGenerator 
        onDataGenerated={async () => {
          await Promise.all([refreshTechnicians(), refreshVehicles()]);
        }}
      />

      <Tabs defaultValue="locations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="locations">Lokacije tvrtke</TabsTrigger>
          <TabsTrigger value="technicians">Tehničari</TabsTrigger>
          <TabsTrigger value="vehicles">Vozila</TabsTrigger>
          <TabsTrigger value="settings">Globalne postavke</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Upravljanje lokacijama tvrtke
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingLocations ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <h3 className="font-medium">{location.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {location.street_address}, {location.city}, {location.country}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLocation(location.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {locations.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nema dodanih lokacija tvrtke
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Dodaj novu lokaciju</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locationName">Naziv lokacije</Label>
                        <Input
                          id="locationName"
                          value={newLocation.name}
                          onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                          placeholder="Sjedište, Skladište..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">Adresa</Label>
                        <Input
                          id="streetAddress"
                          value={newLocation.street_address}
                          onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                          placeholder="Ilica 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Grad</Label>
                        <Input
                          id="city"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                          placeholder="Zagreb"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Država</Label>
                        <Select value={newLocation.country} onValueChange={(value) => setNewLocation({ ...newLocation, country: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={addLocation}
                      disabled={isAddingLocation}
                      className="mt-4"
                    >
                      {isAddingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj lokaciju
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Upravljanje tehničarima
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTechnicians ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ime i prezime</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Lokacija</TableHead>
                          <TableHead>Uloga</TableHead>
                          <TableHead>Vozilo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Akcije</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {technicians.map((technician) => (
                          <TableRow key={technician.id}>
                            <TableCell>{technician.first_name} {technician.last_name}</TableCell>
                            <TableCell>{technician.email}</TableCell>
                            <TableCell>{technician.phone || 'Nije uneseno'}</TableCell>
                            <TableCell>{getLocationName(technician.location_id)}</TableCell>
                            <TableCell>
                              <Badge variant={technician.user_role === 'admin' ? 'default' : 'secondary'}>
                                {userRoles.find(role => role.value === technician.user_role)?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{getVehicleName(technician.vehicle_id)}</TableCell>
                            <TableCell>
                              <Badge variant={technician.active ? 'default' : 'destructive'}>
                                {technician.active ? 'Aktivan' : 'Neaktivan'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingTechnician(technician)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent>
                                    <SheetHeader>
                                      <SheetTitle>Uredi tehničara</SheetTitle>
                                      <SheetDescription>
                                        Uredite podatke tehničara
                                      </SheetDescription>
                                    </SheetHeader>
                                    {editingTechnician && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="editFirstName">Ime</Label>
                                            <Input
                                              id="editFirstName"
                                              value={editingTechnician.first_name}
                                              onChange={(e) => setEditingTechnician({
                                                ...editingTechnician,
                                                first_name: e.target.value
                                              })}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="editLastName">Prezime</Label>
                                            <Input
                                              id="editLastName"
                                              value={editingTechnician.last_name}
                                              onChange={(e) => setEditingTechnician({
                                                ...editingTechnician,
                                                last_name: e.target.value
                                              })}
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editEmail">Email</Label>
                                          <Input
                                            id="editEmail"
                                            type="email"
                                            value={editingTechnician.email}
                                            onChange={(e) => setEditingTechnician({
                                              ...editingTechnician,
                                              email: e.target.value
                                            })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editPhone">Telefon</Label>
                                          <Input
                                            id="editPhone"
                                            value={editingTechnician.phone || ''}
                                            onChange={(e) => setEditingTechnician({
                                              ...editingTechnician,
                                              phone: e.target.value
                                            })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editLocation">Lokacija</Label>
                                          <Select
                                            value={editingTechnician.location_id || 'none'}
                                            onValueChange={(value) => setEditingTechnician({
                                              ...editingTechnician,
                                              location_id: value === 'none' ? null : value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Odaberite lokaciju" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Bez lokacije</SelectItem>
                                              {locations.map((location) => (
                                                <SelectItem key={location.id} value={location.id}>
                                                  {location.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editRole">Uloga</Label>
                                          <Select
                                            value={editingTechnician.user_role}
                                            onValueChange={(value: 'admin' | 'technician' | 'lead') => setEditingTechnician({
                                              ...editingTechnician,
                                              user_role: value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {userRoles.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                  {role.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editVehicle">Vozilo</Label>
                                          <Select
                                            value={editingTechnician.vehicle_id || 'none'}
                                            onValueChange={(value) => setEditingTechnician({
                                              ...editingTechnician,
                                              vehicle_id: value === 'none' ? null : value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Odaberite vozilo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Bez vozila</SelectItem>
                                              {vehicles.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                                  {vehicle.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editActive">Status</Label>
                                          <Select
                                            value={editingTechnician.active ? 'active' : 'inactive'}
                                            onValueChange={(value) => setEditingTechnician({
                                              ...editingTechnician,
                                              active: value === 'active'
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">Aktivan</SelectItem>
                                              <SelectItem value="inactive">Neaktivan</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button 
                                          onClick={updateTechnician}
                                          disabled={isEditingTechnician}
                                          className="w-full"
                                        >
                                          {isEditingTechnician && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Spremi promjene
                                        </Button>
                                      </div>
                                    )}
                                  </SheetContent>
                                </Sheet>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTechnician(technician.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {technicians.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nema dodanih tehničara
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Dodaj novog tehničara</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="techFirstName">Ime</Label>
                        <Input
                          id="techFirstName"
                          value={newTechnician.first_name}
                          onChange={(e) => setNewTechnician({ ...newTechnician, first_name: e.target.value })}
                          placeholder="Ime"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="techLastName">Prezime</Label>
                        <Input
                          id="techLastName"
                          value={newTechnician.last_name}
                          onChange={(e) => setNewTechnician({ ...newTechnician, last_name: e.target.value })}
                          placeholder="Prezime"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="techEmail">Email</Label>
                        <Input
                          id="techEmail"
                          type="email"
                          value={newTechnician.email}
                          onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="techPhone">Telefon</Label>
                        <Input
                          id="techPhone"
                          value={newTechnician.phone}
                          onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                          placeholder="+385 99 123 4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="techLocation">Lokacija</Label>
                        <Select 
                          value={newTechnician.location_id || 'none'} 
                          onValueChange={(value) => setNewTechnician({ ...newTechnician, location_id: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Odaberite lokaciju" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Bez lokacije</SelectItem>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="techRole">Uloga</Label>
                        <Select 
                          value={newTechnician.user_role} 
                          onValueChange={(value: 'admin' | 'technician' | 'lead') => setNewTechnician({ ...newTechnician, user_role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {userRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="techVehicle">Vozilo</Label>
                        <Select 
                          value={newTechnician.vehicle_id || 'none'} 
                          onValueChange={(value) => setNewTechnician({ ...newTechnician, vehicle_id: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Odaberite vozilo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Bez vozila</SelectItem>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={addTechnician}
                      disabled={isAddingTechnician}
                      className="mt-4"
                    >
                      {isAddingTechnician && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj tehničara
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Upravljanje vozilima
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingVehicles ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <h3 className="font-medium">{vehicle.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.model && `${vehicle.model} `}
                            {vehicle.year && `(${vehicle.year}) `}
                            {vehicle.license_plate && `• ${vehicle.license_plate}`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVehicle(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {vehicles.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nema dodanih vozila
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Dodaj novo vozilo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleName">Naziv vozila</Label>
                        <Input
                          id="vehicleName"
                          value={newVehicle.name}
                          onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                          placeholder="Kombi 1, Auto 2..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licensePlate">Registarska oznaka</Label>
                        <Input
                          id="licensePlate"
                          value={newVehicle.license_plate}
                          onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                          placeholder="ZG-1234-AB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel">Model</Label>
                        <Input
                          id="vehicleModel"
                          value={newVehicle.model}
                          onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                          placeholder="Volkswagen Crafter"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear">Godina</Label>
                        <Input
                          id="vehicleYear"
                          type="number"
                          value={newVehicle.year}
                          onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
                          placeholder="2023"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={addVehicle}
                      disabled={isAddingVehicle}
                      className="mt-4"
                    >
                      {isAddingVehicle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj vozilo
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Globalne postavke</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="distanceApiKey">Distance Matrix API ključ</Label>
                      <Input
                        id="distanceApiKey"
                        type="password"
                        value={globalSettings?.distance_matrix_api_key || ''}
                        onChange={(e) => setGlobalSettings(prev => prev ? {
                          ...prev,
                          distance_matrix_api_key: e.target.value
                        } : { id: '', distance_matrix_api_key: e.target.value })}
                        placeholder="Unesite Distance Matrix API ključ"
                      />
                      <p className="text-sm text-muted-foreground">
                        API ključ za automatsko računanje udaljenosti. Možete dobiti besplatan API ključ na distancematrix.ai
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={saveGlobalSettings}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Spremi postavke
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
