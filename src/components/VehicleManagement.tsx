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
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { format } from "date-fns";
import { hr } from "date-fns/locale";

interface Vehicle {
  id: string;
  model: string | null;
  license_plate: string;
  technical_inspection: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  vehicle_id: string | null;
}

const VehicleManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    model: '',
    technical_inspection: undefined as Date | undefined
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      console.log('Fetching vehicles...');
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('license_plate');

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      console.log('Fetched vehicles:', data);
      return data as Vehicle[];
    }
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-with-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, vehicle_id')
        .eq('active', true);

      if (error) throw error;
      return data as Employee[];
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (vehicleData: typeof formData) => {
      console.log('Adding vehicle:', vehicleData);
      const { error } = await supabase
        .from('vehicles')
        .insert({
          license_plate: vehicleData.license_plate,
          model: vehicleData.model || null,
          technical_inspection: vehicleData.technical_inspection ? vehicleData.technical_inspection.toISOString().split('T')[0] : null
        });

      if (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Vozilo je uspješno dodano",
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsAddDialogOpen(false);
      setFormData({ license_plate: '', model: '', technical_inspection: undefined });
    },
    onError: (error) => {
      console.error('Error in addVehicleMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri dodavanju vozila",
      });
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, vehicleData }: { id: string; vehicleData: typeof formData }) => {
      console.log('Updating vehicle:', id, vehicleData);
      const { error } = await supabase
        .from('vehicles')
        .update({
          license_plate: vehicleData.license_plate,
          model: vehicleData.model || null,
          technical_inspection: vehicleData.technical_inspection ? vehicleData.technical_inspection.toISOString().split('T')[0] : null
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating vehicle:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Vozilo je uspješno ažurirano",
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsEditDialogOpen(false);
      setEditingVehicle(null);
      setFormData({ license_plate: '', model: '', technical_inspection: undefined });
    },
    onError: (error) => {
      console.error('Error in updateVehicleMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju vozila",
      });
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      console.log('Deleting vehicle:', vehicleId);
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Vozilo je uspješno obrisano",
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      console.error('Error in deleteVehicleMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri brisanju vozila",
      });
    }
  });

  const handleAdd = () => {
    addVehicleMutation.mutate(formData);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      model: vehicle.model || '',
      technical_inspection: vehicle.technical_inspection ? new Date(vehicle.technical_inspection) : undefined
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ id: editingVehicle.id, vehicleData: formData });
    }
  };

  const handleDelete = (vehicleId: string) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovo vozilo?')) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const getVehicleAssignment = (vehicleId: string) => {
    const assignedEmployee = employees?.find(emp => emp.vehicle_id === vehicleId);
    return assignedEmployee ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}` : null;
  };

  if (vehiclesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Upravljanje vozilima
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
              <Car className="h-5 w-5" />
              Upravljanje vozilima
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj vozilo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj novo vozilo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="license_plate">Registracija</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                      placeholder="Registracija vozila"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model vozila"
                    />
                  </div>
                  <div>
                    <Label htmlFor="technical_inspection">Tehnički pregled</Label>
                    <DatePicker
                      date={formData.technical_inspection}
                      onDateChange={(date) => setFormData(prev => ({ ...prev, technical_inspection: date }))}
                      placeholder="Odaberite datum tehničkog pregleda"
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleAdd} disabled={!formData.license_plate || addVehicleMutation.isPending}>
                    {addVehicleMutation.isPending ? 'Dodavanje...' : 'Dodaj vozilo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vehicles?.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{vehicle.license_plate}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {vehicle.model && <div>Model: {vehicle.model}</div>}
                    {vehicle.technical_inspection && (
                      <div>Tehnički pregled: {format(new Date(vehicle.technical_inspection), "dd.MM.yyyy", { locale: hr })}</div>
                    )}
                    {getVehicleAssignment(vehicle.id) && (
                      <div className="flex items-center gap-2">
                        <span>Dodijeljeno:</span>
                        <Badge variant="secondary">{getVehicleAssignment(vehicle.id)}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={deleteVehicleMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {vehicles?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nema vozila u sustavu
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi vozilo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-license_plate">Registracija</Label>
              <Input
                id="edit-license_plate"
                value={formData.license_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                placeholder="Registracija vozila"
              />
            </div>
            <div>
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Model vozila"
              />
            </div>
            <div>
              <Label htmlFor="edit-technical_inspection">Tehnički pregled</Label>
              <DatePicker
                date={formData.technical_inspection}
                onDateChange={(date) => setFormData(prev => ({ ...prev, technical_inspection: date }))}
                placeholder="Odaberite datum tehničkog pregleda"
                className="w-full"
              />
            </div>
            <Button onClick={handleUpdate} disabled={!formData.license_plate || updateVehicleMutation.isPending}>
              {updateVehicleMutation.isPending ? 'Ažuriranje...' : 'Ažuriraj vozilo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManagement;
