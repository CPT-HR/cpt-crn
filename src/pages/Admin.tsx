
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_role: 'admin' | 'technician' | 'lead';
  active: boolean;
  created_at: string;
}

interface Vehicle {
  id: string;
  name: string;
  license_plate?: string;
  model?: string;
  year?: number;
}

interface CompanyLocation {
  id: string;
  name: string;
  street_address: string;
  city: string;
  country: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'employees' | 'vehicles' | 'locations'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    user_role: 'technician' as 'admin' | 'technician' | 'lead'
  });

  // Vehicle form state
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    license_plate: '',
    model: '',
    year: ''
  });

  // Location form state
  const [locationForm, setLocationForm] = useState({
    name: '',
    street_address: '',
    city: 'Zagreb',
    country: 'Hrvatska'
  });

  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [employeesRes, vehiclesRes, locationsRes] = await Promise.all([
        supabase.from('employee_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('company_locations').select('*').order('created_at', { ascending: false })
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (locationsRes.error) throw locationsRes.error;

      setEmployees(employeesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom učitavanja podataka",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Employee operations
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employee_profiles')
          .update(employeeForm)
          .eq('id', editingEmployee);
        
        if (error) throw error;
        
        toast({
          title: "Zaposlenik ažuriran",
          description: "Podaci zaposlenika su uspješno ažurirani",
        });
      } else {
        // Note: New employees should be created through auth registration
        toast({
          variant: "destructive",
          title: "Informacija",
          description: "Novi zaposlenici se kreiraju kroz registraciju",
        });
        return;
      }
      
      setEmployeeForm({ first_name: '', last_name: '', phone: '', user_role: 'technician' });
      setEditingEmployee(null);
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja",
      });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEmployeeForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      phone: employee.phone || '',
      user_role: employee.user_role
    });
    setEditingEmployee(employee.id);
  };

  const handleToggleEmployeeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('employee_profiles')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Status ažuriran",
        description: `Zaposlenik je ${!currentStatus ? 'aktiviran' : 'deaktiviran'}`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja statusa",
      });
    }
  };

  // Vehicle operations
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        ...vehicleForm,
        year: vehicleForm.year ? parseInt(vehicleForm.year) : null
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle);
        
        if (error) throw error;
        
        toast({
          title: "Vozilo ažurirano",
          description: "Podaci vozila su uspješno ažurirani",
        });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData]);
        
        if (error) throw error;
        
        toast({
          title: "Vozilo dodano",
          description: "Novo vozilo je uspješno dodano",
        });
      }
      
      setVehicleForm({ name: '', license_plate: '', model: '', year: '' });
      setEditingVehicle(null);
      loadData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja",
      });
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleForm({
      name: vehicle.name,
      license_plate: vehicle.license_plate || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || ''
    });
    setEditingVehicle(vehicle.id);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovo vozilo?')) return;
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Vozilo obrisano",
        description: "Vozilo je uspješno obrisano",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja",
      });
    }
  };

  // Location operations
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('company_locations')
          .update(locationForm)
          .eq('id', editingLocation);
        
        if (error) throw error;
        
        toast({
          title: "Lokacija ažurirana",
          description: "Podaci lokacije su uspješno ažurirani",
        });
      } else {
        const { error } = await supabase
          .from('company_locations')
          .insert([locationForm]);
        
        if (error) throw error;
        
        toast({
          title: "Lokacija dodana",
          description: "Nova lokacija je uspješno dodana",
        });
      }
      
      setLocationForm({ name: '', street_address: '', city: 'Zagreb', country: 'Hrvatska' });
      setEditingLocation(null);
      loadData();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja",
      });
    }
  };

  const handleEditLocation = (location: CompanyLocation) => {
    setLocationForm({
      name: location.name,
      street_address: location.street_address,
      city: location.city,
      country: location.country
    });
    setEditingLocation(location.id);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovu lokaciju?')) return;
    
    try {
      const { error } = await supabase
        .from('company_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Lokacija obrisana",
        description: "Lokacija je uspješno obrisana",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja",
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Nemate dozvolu za pristup ovoj stranici.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Administracija</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'employees' 
              ? 'border-b-2 border-brand text-brand' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Zaposlenici
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'vehicles' 
              ? 'border-b-2 border-brand text-brand' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Vozila
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'locations' 
              ? 'border-b-2 border-brand text-brand' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Lokacije
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {editingEmployee && (
            <Card>
              <CardHeader>
                <CardTitle>Uredi zaposlenika</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Ime</Label>
                      <Input
                        id="first_name"
                        value={employeeForm.first_name}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Prezime</Label>
                      <Input
                        id="last_name"
                        value={employeeForm.last_name}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_role">Uloga</Label>
                      <Select value={employeeForm.user_role} onValueChange={(value: 'admin' | 'technician' | 'lead') => setEmployeeForm(prev => ({ ...prev, user_role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="technician">Tehničar</SelectItem>
                          <SelectItem value="lead">Voditelj</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Spremi</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingEmployee(null);
                      setEmployeeForm({ first_name: '', last_name: '', phone: '', user_role: 'technician' });
                    }}>
                      Odustani
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Lista zaposlenika</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ime i prezime</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Uloga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.user_role === 'admin' ? 'default' : 'secondary'}>
                          {employee.user_role === 'admin' ? 'Administrator' : 
                           employee.user_role === 'lead' ? 'Voditelj' : 'Tehničar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.active ? 'default' : 'destructive'}>
                          {employee.active ? 'Aktivan' : 'Neaktivan'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={employee.active ? "destructive" : "default"}
                            onClick={() => handleToggleEmployeeStatus(employee.id, employee.active)}
                          >
                            {employee.active ? 'Deaktiviraj' : 'Aktiviraj'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingVehicle ? 'Uredi vozilo' : 'Dodaj novo vozilo'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVehicleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_name">Naziv vozila</Label>
                    <Input
                      id="vehicle_name"
                      value={vehicleForm.name}
                      onChange={(e) => setVehicleForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Registarska oznaka</Label>
                    <Input
                      id="license_plate"
                      value={vehicleForm.license_plate}
                      onChange={(e) => setVehicleForm(prev => ({ ...prev, license_plate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Godina</Label>
                    <Input
                      id="year"
                      type="number"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    {editingVehicle ? 'Ažuriraj' : 'Dodaj'} vozilo
                  </Button>
                  {editingVehicle && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingVehicle(null);
                      setVehicleForm({ name: '', license_plate: '', model: '', year: '' });
                    }}>
                      Odustani
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista vozila</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Registracija</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Godina</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.name}</TableCell>
                      <TableCell>{vehicle.license_plate || '-'}</TableCell>
                      <TableCell>{vehicle.model || '-'}</TableCell>
                      <TableCell>{vehicle.year || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingLocation ? 'Uredi lokaciju' : 'Dodaj novu lokaciju'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location_name">Naziv lokacije</Label>
                  <Input
                    id="location_name"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street_address">Adresa</Label>
                  <Input
                    id="street_address"
                    value={locationForm.street_address}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, street_address: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Grad</Label>
                    <Input
                      id="city"
                      value={locationForm.city}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Zemlja</Label>
                    <Input
                      id="country"
                      value={locationForm.country}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    {editingLocation ? 'Ažuriraj' : 'Dodaj'} lokaciju
                  </Button>
                  {editingLocation && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingLocation(null);
                      setLocationForm({ name: '', street_address: '', city: 'Zagreb', country: 'Hrvatska' });
                    }}>
                      Odustani
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista lokacija</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Adresa</TableHead>
                    <TableHead>Grad</TableHead>
                    <TableHead>Zemlja</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>{location.street_address}</TableCell>
                      <TableCell>{location.city}</TableCell>
                      <TableCell>{location.country}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;
