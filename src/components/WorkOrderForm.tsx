import React, { useState, useEffect } from 'react';
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

interface WorkItem {
  id: string;
  text: string;
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
  description: WorkItem[];
  foundCondition: WorkItem[];
  performedWork: WorkItem[];
  technicianComment: WorkItem[];
  materials: Material[];
  date: string;
  arrivalTime: string;
  completionTime: string;
  calculatedHours: string;
  fieldTrip: boolean;
  distance: string;
  technicianSignature: string;
  customerSignature: string;
  customerSignerName: string;
  signatureMetadata?: SignatureMetadata;
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
    description: [{ id: '1', text: '' }],
    foundCondition: [{ id: '1', text: '' }],
    performedWork: [{ id: '1', text: '' }],
    technicianComment: [{ id: '1', text: '' }],
    materials: [{ id: '1', name: '', quantity: '', unit: '' }],
    date: new Date().toLocaleDateString('hr-HR'),
    arrivalTime: '',
    completionTime: '',
    calculatedHours: '0h00min',
    fieldTrip: false,
    distance: '',
    technicianSignature: user?.signature || '',
    customerSignature: '',
    customerSignerName: '',
  });

  // Calculate billable hours based on arrival and completion time
  const calculateBillableHours = (arrival: string, completion: string) => {
    if (!arrival || !completion) return '0h00min';
    
    const [arrivalHour, arrivalMin] = arrival.split(':').map(Number);
    const [completionHour, completionMin] = completion.split(':').map(Number);
    
    const arrivalMinutes = arrivalHour * 60 + arrivalMin;
    const completionMinutes = completionHour * 60 + completionMin;
    
    if (completionMinutes <= arrivalMinutes) return '0h00min';
    
    const diffMinutes = completionMinutes - arrivalMinutes;
    
    // Round up to nearest 30 minutes
    const billableMinutes = Math.ceil(diffMinutes / 30) * 30;
    
    const hours = Math.floor(billableMinutes / 60);
    const minutes = billableMinutes % 60;
    
    return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  };

  // Calculate distance using Google Maps API
  const calculateDistance = async (companyAddress: string, targetAddress: string) => {
    try {
      // Placeholder for Google Maps Distance Matrix API integration
      // This would require Google Maps API key and proper implementation
      console.log('Calculate distance between:', companyAddress, 'and', targetAddress);
      
      // For now, return empty string - would be replaced with actual API call
      // const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(companyAddress)}&destinations=${encodeURIComponent(targetAddress)}&key=${API_KEY}`);
      // const data = await response.json();
      // return data.rows[0]?.elements[0]?.distance?.text || '';
      
      return '';
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '';
    }
  };

  // Get relevant address based on logic
  const getRelevantAddress = () => {
    if (workOrder.orderForCustomer && workOrder.customerCompanyAddress) {
      return workOrder.customerCompanyAddress;
    }
    return workOrder.clientCompanyAddress;
  };

  useEffect(() => {
    const calculated = calculateBillableHours(workOrder.arrivalTime, workOrder.completionTime);
    setWorkOrder(prev => ({ ...prev, calculatedHours: calculated }));
  }, [workOrder.arrivalTime, workOrder.completionTime]);

  useEffect(() => {
    if (workOrder.fieldTrip && user?.companyAddress) {
      const targetAddress = getRelevantAddress();
      
      if (targetAddress) {
        calculateDistance(user.companyAddress, targetAddress).then(distance => {
          setWorkOrder(prev => ({ ...prev, distance }));
        });
      }
    } else if (!workOrder.fieldTrip) {
      setWorkOrder(prev => ({ ...prev, distance: '' }));
    }
  }, [workOrder.fieldTrip, workOrder.clientCompanyAddress, workOrder.customerCompanyAddress, workOrder.orderForCustomer, user?.companyAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWorkOrder({ ...workOrder, [name]: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setWorkOrder({ ...workOrder, orderForCustomer: checked });
  };

  const handleFieldTripChange = (checked: boolean) => {
    setWorkOrder({ ...workOrder, fieldTrip: checked, distance: checked ? workOrder.distance : '' });
  };

  const handleWorkItemChange = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>, id: string, value: string) => {
    setWorkOrder({
      ...workOrder,
      [section]: workOrder[section].map(item => 
        item.id === id ? { ...item, text: value } : item
      )
    });
  };

  const addWorkItem = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>) => {
    const newId = (workOrder[section].length + 1).toString();
    setWorkOrder({
      ...workOrder,
      [section]: [
        ...workOrder[section],
        { id: newId, text: '' }
      ]
    });
  };

  const removeWorkItem = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>, id: string) => {
    if (workOrder[section].length === 1) return;
    
    setWorkOrder({
      ...workOrder,
      [section]: workOrder[section].filter(item => item.id !== id)
    });
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
      
      // Convert work items to strings for database storage
      const descriptionText = finalWorkOrder.description.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const foundConditionText = finalWorkOrder.foundCondition.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const performedWorkText = finalWorkOrder.performedWork.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const technicianCommentText = finalWorkOrder.technicianComment.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      
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
        description: descriptionText,
        found_condition: foundConditionText,
        performed_work: performedWorkText,
        technician_comment: technicianCommentText,
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

    if (!workOrder.customerSignerName) {
      toast({
        variant: "destructive",
        title: "Greška", 
        description: "Potrebno je ime i prezime potpisnika",
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
        description: [{ id: '1', text: '' }],
        foundCondition: [{ id: '1', text: '' }],
        performedWork: [{ id: '1', text: '' }],
        technicianComment: [{ id: '1', text: '' }],
        materials: [{ id: '1', name: '', quantity: '', unit: '' }],
        date: new Date().toLocaleDateString('hr-HR'),
        arrivalTime: '',
        completionTime: '',
        calculatedHours: '0h00min',
        fieldTrip: false,
        distance: '',
        technicianSignature: user.signature || '',
        customerSignature: '',
        customerSignerName: '',
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
          <CardContent className="space-y-6">
            {/* Opis kvara/problema */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Opis kvara/problema</Label>
              {workOrder.description.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-10 space-y-2">
                    <Input 
                      value={item.text} 
                      onChange={(e) => handleWorkItemChange('description', item.id, e.target.value)} 
                      placeholder="Unesite opis kvara ili problema"
                      required={index === 0}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeWorkItem('description', item.id)}
                      disabled={workOrder.description.length === 1}
                      className="w-full"
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => addWorkItem('description')} variant="outline" className="w-full">
                Dodaj red
              </Button>
            </div>

            <Separator />

            {/* Zatečeno stanje */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Zatečeno stanje</Label>
              {workOrder.foundCondition.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-10 space-y-2">
                    <Input 
                      value={item.text} 
                      onChange={(e) => handleWorkItemChange('foundCondition', item.id, e.target.value)} 
                      placeholder="Opišite zatečeno stanje"
                      required={index === 0}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeWorkItem('foundCondition', item.id)}
                      disabled={workOrder.foundCondition.length === 1}
                      className="w-full"
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => addWorkItem('foundCondition')} variant="outline" className="w-full">
                Dodaj red
              </Button>
            </div>

            <Separator />

            {/* Izvršeni radovi */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Izvršeni radovi</Label>
              {workOrder.performedWork.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-10 space-y-2">
                    <Input 
                      value={item.text} 
                      onChange={(e) => handleWorkItemChange('performedWork', item.id, e.target.value)} 
                      placeholder="Opišite izvršene radove"
                      required={index === 0}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeWorkItem('performedWork', item.id)}
                      disabled={workOrder.performedWork.length === 1}
                      className="w-full"
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => addWorkItem('performedWork')} variant="outline" className="w-full">
                Dodaj red
              </Button>
            </div>

            <Separator />

            {/* Komentar tehničara */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Komentar tehničara</Label>
              {workOrder.technicianComment.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-10 space-y-2">
                    <Input 
                      value={item.text} 
                      onChange={(e) => handleWorkItemChange('technicianComment', item.id, e.target.value)} 
                      placeholder="Dodatni komentari ili napomene"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeWorkItem('technicianComment', item.id)}
                      disabled={workOrder.technicianComment.length === 1}
                      className="w-full"
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => addWorkItem('technicianComment')} variant="outline" className="w-full">
                Dodaj red
              </Button>
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
            <CardTitle className="text-xl">Vrijeme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date"
                  value={workOrder.date.split('.').reverse().join('-')}
                  onChange={(e) => setWorkOrder({...workOrder, date: new Date(e.target.value).toLocaleDateString('hr-HR')})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Vrijeme dolaska</Label>
                <Input 
                  id="arrivalTime" 
                  name="arrivalTime" 
                  type="time"
                  value={workOrder.arrivalTime}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="completionTime">Vrijeme završetka radova</Label>
                <Input 
                  id="completionTime" 
                  name="completionTime" 
                  type="time"
                  value={workOrder.completionTime}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Obračunsko vrijeme</Label>
                <div className="p-2 bg-gray-50 border rounded">
                  {workOrder.calculatedHours}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Put</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fieldTrip" 
                checked={workOrder.fieldTrip}
                onCheckedChange={handleFieldTripChange}
              />
              <Label htmlFor="fieldTrip" className="text-sm font-normal">
                Izlazak na teren
              </Label>
            </div>
            
            {workOrder.fieldTrip && (
              <div className="space-y-2">
                <Label htmlFor="distance">Prijeđena udaljenost (km)</Label>
                <Input 
                  id="distance" 
                  name="distance" 
                  type="number" 
                  min="0" 
                  value={workOrder.distance}
                  onChange={handleChange} 
                  placeholder="Unesite broj kilometara"
                  required={workOrder.fieldTrip}
                />
                {!user?.companyAddress && (
                  <p className="text-sm text-amber-600">
                    Postavite adresu sjedišta tvrtke u postavkama za automatsko računanje udaljenosti.
                  </p>
                )}
              </div>
            )}
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
                  <div className="flex flex-col items-center">
                    <img 
                      src={user.signature} 
                      alt="Potpis tehničara" 
                      className="max-h-20 mx-auto"
                    />
                    <p className="text-sm text-gray-600 mt-2">{user.name}</p>
                  </div>
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
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="customerSignerName">Ime i prezime potpisnika</Label>
                  <Input 
                    id="customerSignerName" 
                    name="customerSignerName" 
                    value={workOrder.customerSignerName}
                    onChange={handleChange}
                    placeholder="Unesite ime i prezime potpisnika"
                    required
                  />
                </div>
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
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            disabled={isSubmitting || !workOrder.customerSignature || !user?.signature || !workOrder.customerSignerName}
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
