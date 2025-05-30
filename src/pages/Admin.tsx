
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";

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

interface GlobalSettings {
  id: string;
  distance_matrix_api_key: string | null;
}

const countries = [
  'Hrvatska', 'Srbija', 'Slovenija', 'Bosna i Hercegovina', 'Crna Gora', 
  'Makedonija', 'Austrija', 'Njemačka', 'Italija', 'Mađarska'
];

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState(PENDING_USERS);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // New location form
  const [newLocation, setNewLocation] = useState({
    name: '',
    street_address: '',
    city: 'Zagreb',
    country: 'Hrvatska'
  });
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  
  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  // Load company locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('company_locations')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
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
  
  // Load global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
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
      const { data, error } = await supabase
        .from('company_locations')
        .insert([newLocation])
        .select()
        .single();
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('company_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
  
  const saveGlobalSettings = async () => {
    if (!globalSettings) return;
    
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert([{
          id: globalSettings.id,
          distance_matrix_api_key: globalSettings.distance_matrix_api_key
        }]);
      
      if (error) throw error;
      
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
  
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Administracija</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Zahtjevi za registraciju</span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive">{pendingUsers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nema novih zahtjeva za registraciju
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(pendingUser => (
                <div 
                  key={pendingUser.id} 
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-medium">{pendingUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Zahtjev poslan: {new Date(pendingUser.date).toLocaleDateString('hr-HR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rejectUser(pendingUser.id)}
                    >
                      Odbij
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => approveUser(pendingUser.id)}
                    >
                      Odobri
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lokacije tvrtke</CardTitle>
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
                      placeholder="Glavni ured, Skladište..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Ulica i broj</Label>
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
                    <Select 
                      value={newLocation.country} 
                      onValueChange={(value) => setNewLocation({ ...newLocation, country: value })}
                    >
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
    </div>
  );
};

export default Admin;
