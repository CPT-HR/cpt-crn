
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SignaturePad from './SignaturePad';
import { useAuth } from '@/contexts/AuthContext';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from "@/components/ui/use-toast";

interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface WorkOrder {
  id: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  location: string;
  description: string;
  performedWork: string;
  materials: Material[];
  hours: string;
  distance: string;
  technicianSignature: string;
  customerSignature: string;
  date: string;
}

let orderCounter = 1;

const WorkOrderForm: React.FC = () => {
  const { user } = useAuth();
  const [isCustomerSignatureModalOpen, setIsCustomerSignatureModalOpen] = useState(false);
  
  const [workOrder, setWorkOrder] = useState<WorkOrder>({
    id: '',
    customerName: '',
    customerAddress: '',
    customerContact: '',
    location: '',
    description: '',
    performedWork: '',
    materials: [{ id: '1', name: '', quantity: '', unit: '' }],
    hours: '',
    distance: '',
    technicianSignature: user?.signature || '',
    customerSignature: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWorkOrder({ ...workOrder, [name]: value });
  };

  const handleMaterialChange = (id: string, field: keyof Material, value: string) => {
    setWorkOrder({
      ...workOrder,
      materials: workOrder.materials.map(material => 
        material.id === id ? { ...material, [field]: value } : material
      )
    });
  };

  const addMaterial = () => {
    const newId = (workOrder.materials.length + 1).toString();
    setWorkOrder({
      ...workOrder,
      materials: [
        ...workOrder.materials,
        { id: newId, name: '', quantity: '', unit: '' }
      ]
    });
  };

  const removeMaterial = (id: string) => {
    if (workOrder.materials.length === 1) return;
    
    setWorkOrder({
      ...workOrder,
      materials: workOrder.materials.filter(material => material.id !== id)
    });
  };

  const handleCustomerSignatureSave = (signature: string) => {
    setWorkOrder({
      ...workOrder,
      customerSignature: signature
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!workOrder.customerSignature) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Potreban je potpis korisnika",
      });
      return;
    }
    
    // Generate work order number
    const year = new Date().getFullYear().toString().slice(-2);
    const generatedId = `${user.initials}${orderCounter++}/${year}`;
    
    const finalWorkOrder = {
      ...workOrder,
      id: generatedId,
      technicianSignature: user.signature || '',
      technicianName: user.name
    };
    
    // In a real app, save to database here
    
    // Generate PDF
    await generatePDF(finalWorkOrder);
    
    toast({
      title: "Radni nalog spremljen",
      description: `Radni nalog ${generatedId} je uspješno kreiran i spreman za ispis`,
    });
    
    // Reset form (except for the technician signature)
    setWorkOrder({
      id: '',
      customerName: '',
      customerAddress: '',
      customerContact: '',
      location: '',
      description: '',
      performedWork: '',
      materials: [{ id: '1', name: '', quantity: '', unit: '' }],
      hours: '',
      distance: '',
      technicianSignature: user.signature || '',
      customerSignature: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Podaci o klijentu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Naziv klijenta</Label>
                <Input 
                  id="customerName" 
                  name="customerName" 
                  value={workOrder.customerName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerContact">Kontakt broj</Label>
                <Input 
                  id="customerContact" 
                  name="customerContact" 
                  value={workOrder.customerContact} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Adresa</Label>
              <Input 
                id="customerAddress" 
                name="customerAddress" 
                value={workOrder.customerAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Podaci o radovima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lokacija objekta</Label>
              <Input 
                id="location" 
                name="location" 
                value={workOrder.location} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis kvara/problema</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={workOrder.description} 
                onChange={handleChange} 
                required 
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performedWork">Izvršeni radovi</Label>
              <Textarea 
                id="performedWork" 
                name="performedWork" 
                value={workOrder.performedWork} 
                onChange={handleChange} 
                required 
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Utrošeni materijal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workOrder.materials.map((material, index) => (
              <div key={material.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor={`material-name-${material.id}`}>Naziv materijala</Label>
                  <Input 
                    id={`material-name-${material.id}`}
                    value={material.name} 
                    onChange={(e) => handleMaterialChange(material.id, 'name', e.target.value)} 
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor={`material-quantity-${material.id}`}>Količina</Label>
                  <Input 
                    id={`material-quantity-${material.id}`}
                    value={material.quantity} 
                    onChange={(e) => handleMaterialChange(material.id, 'quantity', e.target.value)} 
                    type="number" 
                    min="0" 
                    step="0.01"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor={`material-unit-${material.id}`}>Jedinica</Label>
                  <Input 
                    id={`material-unit-${material.id}`}
                    value={material.unit} 
                    onChange={(e) => handleMaterialChange(material.id, 'unit', e.target.value)} 
                    placeholder="kom"
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => removeMaterial(material.id)}
                    disabled={workOrder.materials.length === 1}
                    className="w-full"
                  >
                    -
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" onClick={addMaterial} variant="outline" className="w-full">
              Dodaj stavku
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Vrijeme i put</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Utrošeno vrijeme (sati)</Label>
                <Input 
                  id="hours" 
                  name="hours" 
                  type="number" 
                  min="0" 
                  step="0.5" 
                  value={workOrder.hours} 
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Prijeđena udaljenost (km)</Label>
                <Input 
                  id="distance" 
                  name="distance" 
                  type="number" 
                  min="0" 
                  value={workOrder.distance}
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Potpisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Potpis tehničara</Label>
              <div className="mt-2 p-2 border rounded bg-gray-50">
                {user?.signature ? (
                  <img 
                    src={user.signature} 
                    alt="Potpis tehničara" 
                    className="max-h-20 mx-auto"
                  />
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    Potpis nije postavljen. Postavite potpis u vašim postavkama.
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Potpis klijenta</Label>
              <div 
                className="mt-2 p-2 border rounded bg-gray-50 cursor-pointer min-h-[80px] flex items-center justify-center"
                onClick={() => setIsCustomerSignatureModalOpen(true)}
              >
                {workOrder.customerSignature ? (
                  <img 
                    src={workOrder.customerSignature} 
                    alt="Potpis klijenta" 
                    className="max-h-20 mx-auto" 
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    Kliknite za dodavanje potpisa klijenta
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={!workOrder.customerSignature || !user?.signature}>
            Spremi i generiraj PDF
          </Button>
        </div>
      </form>

      <SignaturePad
        isOpen={isCustomerSignatureModalOpen}
        onClose={() => setIsCustomerSignatureModalOpen(false)}
        onSave={handleCustomerSignatureSave}
        title="Potpis klijenta"
      />
    </>
  );
};

export default WorkOrderForm;
