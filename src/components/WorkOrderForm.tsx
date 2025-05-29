
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import SignaturePad, { SignatureMetadata } from './SignaturePad';
import { useAuth } from '@/contexts/AuthContext';
import { generatePDF } from '@/utils/pdfGenerator';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface WorkOrder {
  id: string;
  clientCompanyName: string;
  clientCompanyAddress: string;
  clientOib: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
  orderForCustomer: boolean;
  customerCompanyName: string;
  customerCompanyAddress: string;
  customerOib: string;
  customerFirstName: string;
  customerLastName: string;
  customerMobile: string;
  customerEmail: string;
  description: string;
  foundCondition: string;
  performedWork: string;
  technicianComment: string;
  materials: Material[];
  hours: string;
  distance: string;
  technicianSignature: string;
  customerSignature: string;
  signatureMetadata?: SignatureMetadata;
  date: string;
}

let orderCounter = 1;

const WorkOrderForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCustomerSignatureModalOpen, setIsCustomerSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [workOrder, setWorkOrder] = useState<WorkOrder>({
    id: '',
    clientCompanyName: '',
    clientCompanyAddress: '',
    clientOib: '',
    clientFirstName: '',
    clientLastName: '',
    clientMobile: '',
    clientEmail: '',
    orderForCustomer: false,
    customerCompanyName: '',
    customerCompanyAddress: '',
    customerOib: '',
    customerFirstName: '',
    customerLastName: '',
    customerMobile: '',
    customerEmail: '',
    description: '',
    foundCondition: '',
    performedWork: '',
    technicianComment: '',
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

  const handleCheckboxChange = (checked: boolean) => {
    setWorkOrder({ ...workOrder, orderForCustomer: checked });
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

  const handleCustomerSignatureSave = (signature: string, metadata: SignatureMetadata) => {
    setWorkOrder({
      ...workOrder,
      customerSignature: signature,
      signatureMetadata: metadata
    });
  };

  const saveToSupabase = async (finalWorkOrder: any) => {
    try {
      if (!user) throw new Error("Korisnik nije prijavljen");
      
      // Convert Point data for PostgreSQL
      const signatureCoordinates = finalWorkOrder.signatureMetadata?.coordinates 
        ? `(${finalWorkOrder.signatureMetadata.coordinates.longitude},${finalWorkOrder.signatureMetadata.coordinates.latitude})`
        : null;
      
      // Complete type assertion to handle both the table name and insert operation
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny.from('work_orders').insert({
        order_number: finalWorkOrder.id,
        client_company_name: finalWorkOrder.clientCompanyName,
        client_company_address: finalWorkOrder.clientCompanyAddress,
        client_oib: finalWorkOrder.clientOib,
        client_first_name: finalWorkOrder.clientFirstName,
        client_last_name: finalWorkOrder.clientLastName,
        client_mobile: finalWorkOrder.clientMobile,
        client_email: finalWorkOrder.clientEmail,
        order_for_customer: finalWorkOrder.orderForCustomer,
        customer_company_name: finalWorkOrder.customerCompanyName,
        customer_company_address: finalWorkOrder.customerCompanyAddress,
        customer_oib: finalWorkOrder.customerOib,
        customer_first_name: finalWorkOrder.customerFirstName,
        customer_last_name: finalWorkOrder.customerLastName,
        customer_mobile: finalWorkOrder.customerMobile,
        customer_email: finalWorkOrder.customerEmail,
        description: finalWorkOrder.description,
        performed_work: finalWorkOrder.performedWork,
        materials: finalWorkOrder.materials,
        hours: parseFloat(finalWorkOrder.hours),
        distance: parseFloat(finalWorkOrder.distance),
        technician_signature: finalWorkOrder.technicianSignature,
        technician_name: finalWorkOrder.technicianName,
        customer_signature: finalWorkOrder.customerSignature,
        signature_timestamp: finalWorkOrder.signatureMetadata?.timestamp || new Date().toISOString(),
        signature_coordinates: signatureCoordinates,
        signature_address: finalWorkOrder.signatureMetadata?.address,
        date: finalWorkOrder.date,
        user_id: user.id,
      });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
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
    
    setIsSubmitting(true);
    
    try {
      // Generate work order number
      const year = new Date().getFullYear().toString().slice(-2);
      const generatedId = `${user.initials}${orderCounter++}/${year}`;
      
      const finalWorkOrder = {
        ...workOrder,
        id: generatedId,
        technicianSignature: user.signature || '',
        technicianName: user.name
      };
      
      // Save to Supabase
      await saveToSupabase(finalWorkOrder);
      
      // Generate PDF
      await generatePDF(finalWorkOrder);
      
      toast({
        title: "Radni nalog spremljen",
        description: `Radni nalog ${generatedId} je uspješno kreiran i spreman za ispis`,
      });
      
      // Reset form (except for the technician signature)
      setWorkOrder({
        id: '',
        clientCompanyName: '',
        clientCompanyAddress: '',
        clientOib: '',
        clientFirstName: '',
        clientLastName: '',
        clientMobile: '',
        clientEmail: '',
        orderForCustomer: false,
        customerCompanyName: '',
        customerCompanyAddress: '',
        customerOib: '',
        customerFirstName: '',
        customerLastName: '',
        customerMobile: '',
        customerEmail: '',
        description: '',
        foundCondition: '',
        performedWork: '',
        technicianComment: '',
        materials: [{ id: '1', name: '', quantity: '', unit: '' }],
        hours: '',
        distance: '',
        technicianSignature: user.signature || '',
        customerSignature: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom spremanja radnog naloga",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Podaci o naručitelju</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCompanyName">Ime tvrtke</Label>
                <Input 
                  id="clientCompanyName" 
                  name="clientCompanyName" 
                  value={workOrder.clientCompanyName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientOib">OIB</Label>
                <Input 
                  id="clientOib" 
                  name="clientOib" 
                  value={workOrder.clientOib} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCompanyAddress">Adresa tvrtke</Label>
              <Input 
                id="clientCompanyAddress" 
                name="clientCompanyAddress" 
                value={workOrder.clientCompanyAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientFirstName">Ime</Label>
                <Input 
                  id="clientFirstName" 
                  name="clientFirstName" 
                  value={workOrder.clientFirstName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientLastName">Prezime</Label>
                <Input 
                  id="clientLastName" 
                  name="clientLastName" 
                  value={workOrder.clientLastName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientMobile">Broj mobitela</Label>
                <Input 
                  id="clientMobile" 
                  name="clientMobile" 
                  value={workOrder.clientMobile} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input 
                  id="clientEmail" 
                  name="clientEmail" 
                  type="email" 
                  value={workOrder.clientEmail} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="orderForCustomer" 
                checked={workOrder.orderForCustomer}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="orderForCustomer" className="text-sm font-normal">
                Naručitelj naručuje radove za korisnika
              </Label>
            </div>
          </CardContent>
        </Card>

        {workOrder.orderForCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Podaci o korisniku</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerCompanyName">Ime tvrtke</Label>
                  <Input 
                    id="customerCompanyName" 
                    name="customerCompanyName" 
                    value={workOrder.customerCompanyName} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerOib">OIB</Label>
                  <Input 
                    id="customerOib" 
                    name="customerOib" 
                    value={workOrder.customerOib} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCompanyAddress">Adresa tvrtke</Label>
                <Input 
                  id="customerCompanyAddress" 
                  name="customerCompanyAddress" 
                  value={workOrder.customerCompanyAddress} 
                  onChange={handleChange} 
                  required={workOrder.orderForCustomer}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerFirstName">Ime</Label>
                  <Input 
                    id="customerFirstName" 
                    name="customerFirstName" 
                    value={workOrder.customerFirstName} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerLastName">Prezime</Label>
                  <Input 
                    id="customerLastName" 
                    name="customerLastName" 
                    value={workOrder.customerLastName} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerMobile">Broj mobitela</Label>
                  <Input 
                    id="customerMobile" 
                    name="customerMobile" 
                    value={workOrder.customerMobile} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input 
                    id="customerEmail" 
                    name="customerEmail" 
                    type="email" 
                    value={workOrder.customerEmail} 
                    onChange={handleChange} 
                    required={workOrder.orderForCustomer}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Podaci o radovima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Opis kvara/problema</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={workOrder.description} 
                onChange={handleChange} 
                required 
                className="min-h-[100px] resize-y"
                placeholder="• Unesite opis kvara ili problema&#10;• Dodajte novi red za svaku stavku&#10;• Koristite natuknice za lakše čitanje"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foundCondition">Zatečeno stanje</Label>
              <Textarea 
                id="foundCondition" 
                name="foundCondition" 
                value={workOrder.foundCondition} 
                onChange={handleChange} 
                required 
                className="min-h-[100px] resize-y"
                placeholder="• Opišite zatečeno stanje&#10;• Dodajte novi red za svaku stavku&#10;• Koristite natuknice za lakše čitanje"
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
                className="min-h-[100px] resize-y"
                placeholder="• Opišite izvršene radove&#10;• Dodajte novi red za svaku stavku&#10;• Koristite natuknice za lakše čitanje"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technicianComment">Komentar tehničara</Label>
              <Textarea 
                id="technicianComment" 
                name="technicianComment" 
                value={workOrder.technicianComment} 
                onChange={handleChange} 
                className="min-h-[100px] resize-y"
                placeholder="• Dodatni komentari ili napomene&#10;• Dodajte novi red za svaku stavku&#10;• Koristite natuknice za lakše čitanje"
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
                  <div className="flex flex-col items-center">
                    <img 
                      src={workOrder.customerSignature} 
                      alt="Potpis klijenta" 
                      className="max-h-20 mx-auto" 
                    />
                    {workOrder.signatureMetadata && (
                      <div className="text-[10px] text-gray-500 mt-2 text-center max-w-full">
                        <p>Datum i vrijeme: {workOrder.signatureMetadata.timestamp}</p>
                        {workOrder.signatureMetadata.coordinates && (
                          <p>
                            Koordinate: {workOrder.signatureMetadata.coordinates.latitude.toFixed(6)}, {workOrder.signatureMetadata.coordinates.longitude.toFixed(6)}
                          </p>
                        )}
                        {workOrder.signatureMetadata.address && (
                          <p className="truncate">
                            Adresa: {workOrder.signatureMetadata.address}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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
          <Button 
            type="submit" 
            disabled={isSubmitting || !workOrder.customerSignature || !user?.signature}
            className="relative"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
