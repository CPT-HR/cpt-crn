import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  street_address: string;
  city: string;
  country: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  location_id: string | null;
}

const LocationManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    city: 'Zagreb',
    country: 'Hrvatska'
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      console.log('Fetching locations...');
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching locations:', error);
        throw error;
      }

      console.log('Fetched locations:', data);
      return data as Location[];
    }
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-with-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, location_id')
        .eq('active', true);

      if (error) throw error;
      return data as Employee[];
    }
  });

  const addLocationMutation = useMutation({
    mutationFn: async (locationData: typeof formData) => {
      console.log('Adding location:', locationData);
      const { error } = await supabase
        .from('company_locations')
        .insert({
          name: locationData.name,
          street_address: locationData.street_address,
          city: locationData.city,
          country: locationData.country
        });

      if (error) {
        console.error('Error adding location:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Lokacija je uspješno dodana",
      });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsAddDialogOpen(false);
      setFormData({ name: '', street_address: '', city: 'Zagreb', country: 'Hrvatska' });
    },
    onError: (error) => {
      console.error('Error in addLocationMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri dodavanju lokacije",
      });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, locationData }: { id: string; locationData: typeof formData }) => {
      console.log('Updating location:', id, locationData);
      const { error } = await supabase
        .from('company_locations')
        .update({
          name: locationData.name,
          street_address: locationData.street_address,
          city: locationData.city,
          country: locationData.country
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Lokacija je uspješno ažurirana",
      });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      setFormData({ name: '', street_address: '', city: 'Zagreb', country: 'Hrvatska' });
    },
    onError: (error) => {
      console.error('Error in updateLocationMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju lokacije",
      });
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      console.log('Deleting location:', locationId);
      const { error } = await supabase
        .from('company_locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        console.error('Error deleting location:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Lokacija je uspješno obrisana",
      });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error) => {
      console.error('Error in deleteLocationMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri brisanju lokacije",
      });
    }
  });

  const handleAdd = () => {
    addLocationMutation.mutate(formData);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      street_address: location.street_address,
      city: location.city,
      country: location.country
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, locationData: formData });
    }
  };

  const handleDelete = (locationId: string) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu lokaciju?')) {
      deleteLocationMutation.mutate(locationId);
    }
  };

  const getLocationAssignment = (locationId: string) => {
    const assignedEmployees = employees?.filter(emp => emp.location_id === locationId) || [];
    return assignedEmployees.map(emp => `${emp.first_name} ${emp.last_name}`);
  };

  if (locationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Upravljanje lokacijama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Učitavanje...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Upravljanje lokacijama
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj lokaciju
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj novu lokaciju</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Naziv <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Naziv lokacije"
                    />
                  </div>
                  <div>
                    <Label htmlFor="street_address">Adresa <span className="text-red-500">*</span></Label>
                    <Input
                      id="street_address"
                      value={formData.street_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                      placeholder="Ulica i broj"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Grad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Grad"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Država</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Država"
                    />
                  </div>
                  <Button onClick={handleAdd} disabled={!formData.name || !formData.street_address || addLocationMutation.isPending}>
                    {addLocationMutation.isPending ? 'Dodavanje...' : 'Dodaj lokaciju'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locations?.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{location.street_address}</div>
                    <div>{location.city}, {location.country}</div>
                    {getLocationAssignment(location.id).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Dodijeljeno:</span>
                        {getLocationAssignment(location.id).map((employeeName, index) => (
                          <Badge key={index} variant="secondary">{employeeName}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(location)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(location.id)}
                    disabled={deleteLocationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {locations?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nema lokacija u sustavu
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi lokaciju</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Naziv <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Naziv lokacije"
              />
            </div>
            <div>
              <Label htmlFor="edit-street_address">Adresa <span className="text-red-500">*</span></Label>
              <Input
                id="edit-street_address"
                value={formData.street_address}
                onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                placeholder="Ulica i broj"
              />
            </div>
            <div>
              <Label htmlFor="edit-city">Grad</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Grad"
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Država</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Država"
              />
            </div>
            <Button onClick={handleUpdate} disabled={!formData.name || !formData.street_address || updateLocationMutation.isPending}>
              {updateLocationMutation.isPending ? 'Ažuriranje...' : 'Ažuriraj lokaciju'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationManagement;
