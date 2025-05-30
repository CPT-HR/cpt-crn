import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SignaturePad from './SignaturePad';

interface Material {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

interface WorkOrderData {
  orderNumber: string;
  date: Date;
  clientCompanyName: string;
  clientCompanyAddress: string;
  clientOib: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
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
  materials: Material[];
  hours: number;
  distance: number;
  orderForCustomer: boolean;
  technicianComment: string;
  technicianSignature: string;
  customerSignature: string;
}

const WorkOrderForm: React.FC = () => {
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: 1, unit: '', price: 0 });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOrderForCustomer, setIsOrderForCustomer] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<WorkOrderData>({
    orderNumber: '',
    date: new Date(),
    clientCompanyName: '',
    clientCompanyAddress: '',
    clientOib: '',
    clientFirstName: '',
    clientLastName: '',
    clientMobile: '',
    clientEmail: '',
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
    materials: [],
    hours: 0,
    distance: 0,
    orderForCustomer: false,
    technicianComment: '',
    technicianSignature: '',
    customerSignature: ''
  });

  useEffect(() => {
    if (date) {
      setFormData(prev => ({ ...prev, date: date }));
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleMaterialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unit || !newMaterial.price) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Svi podaci o materijalu su obavezni",
      });
      return;
    }

    setIsAddingMaterial(true);

    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { ...newMaterial }]
    }));

    setNewMaterial({ name: '', quantity: 1, unit: '', price: 0 });
    setIsAddingMaterial(false);
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => {
      const newMaterials = [...prev.materials];
      newMaterials.splice(index, 1);
      return { ...prev, materials: newMaterials };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Morate biti prijavljeni da biste stvorili radni nalog",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting work order with data:', formData);
      
      const workOrderData = {
        order_number: formData.orderNumber,
        date: format(formData.date, 'yyyy-MM-dd'),
        user_id: user.id,
        client_company_name: formData.clientCompanyName,
        client_company_address: formData.clientCompanyAddress,
        client_oib: formData.clientOib,
        client_first_name: formData.clientFirstName,
        client_last_name: formData.clientLastName,
        client_mobile: formData.clientMobile,
        client_email: formData.clientEmail,
        customer_company_name: formData.customerCompanyName || null,
        customer_company_address: formData.customerCompanyAddress || null,
        customer_oib: formData.customerOib || null,
        customer_first_name: formData.customerFirstName || null,
        customer_last_name: formData.customerLastName || null,
        customer_mobile: formData.customerMobile || null,
        customer_email: formData.customerEmail || null,
        description: formData.description || null,
        found_condition: formData.foundCondition || null,
        performed_work: formData.performedWork || null,
        materials: formData.materials.length > 0 ? formData.materials : null,
        hours: formData.hours || null,
        distance: formData.distance || null,
        order_for_customer: formData.orderForCustomer,
        technician_comment: formData.technicianComment || null,
        technician_signature: formData.technicianSignature || null,
        customer_signature: formData.customerSignature || null
      };

      console.log('Prepared data for Supabase:', workOrderData);

      const { data, error } = await supabase
        .from('work_orders')
        .insert([workOrderData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Work order created successfully:', data);

      toast({
        title: "Radni nalog stvoren",
        description: `Radni nalog ${formData.orderNumber} je uspješno stvoren`,
      });

      // Reset form
      setFormData({
        orderNumber: '',
        date: new Date(),
        clientCompanyName: '',
        clientCompanyAddress: '',
        clientOib: '',
        clientFirstName: '',
        clientLastName: '',
        clientMobile: '',
        clientEmail: '',
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
        materials: [],
        hours: 0,
        distance: 0,
        orderForCustomer: false,
        technicianComment: '',
        technicianSignature: '',
        customerSignature: ''
      });

    } catch (error: any) {
      console.error('Error creating work order:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: `Greška: ${error.message || 'Nepoznata greška'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novi radni nalog</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Osnovni podaci */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">Broj naloga</Label>
              <Input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "yyyy-MM-dd") : <span>Odaberite datum</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Podaci o klijentu */}
          <h4 className="font-medium">Podaci o klijentu</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientCompanyName">Naziv tvrtke</Label>
              <Input
                type="text"
                id="clientCompanyName"
                name="clientCompanyName"
                value={formData.clientCompanyName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientCompanyAddress">Adresa tvrtke</Label>
              <Input
                type="text"
                id="clientCompanyAddress"
                name="clientCompanyAddress"
                value={formData.clientCompanyAddress}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientOib">OIB tvrtke</Label>
              <Input
                type="text"
                id="clientOib"
                name="clientOib"
                value={formData.clientOib}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientFirstName">Ime</Label>
              <Input
                type="text"
                id="clientFirstName"
                name="clientFirstName"
                value={formData.clientFirstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientLastName">Prezime</Label>
              <Input
                type="text"
                id="clientLastName"
                name="clientLastName"
                value={formData.clientLastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientMobile">Mobitel</Label>
              <Input
                type="text"
                id="clientMobile"
                name="clientMobile"
                value={formData.clientMobile}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Podaci o kupcu (opcionalno) */}
          <h4 className="font-medium">Podaci o kupcu (ako se razlikuju od klijenta)</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="orderForCustomer"
                name="orderForCustomer"
                checked={formData.orderForCustomer}
                onCheckedChange={(checked) => {
                  setIsOrderForCustomer(checked || false);
                  setFormData(prev => ({ ...prev, orderForCustomer: checked || false }));
                }}
              />
              <Label htmlFor="orderForCustomer">Radni nalog se odnosi na kupca koji nije klijent</Label>
            </div>

            {formData.orderForCustomer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerCompanyName">Naziv tvrtke</Label>
                  <Input
                    type="text"
                    id="customerCompanyName"
                    name="customerCompanyName"
                    value={formData.customerCompanyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerCompanyAddress">Adresa tvrtke</Label>
                  <Input
                    type="text"
                    id="customerCompanyAddress"
                    name="customerCompanyAddress"
                    value={formData.customerCompanyAddress}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerOib">OIB tvrtke</Label>
                  <Input
                    type="text"
                    id="customerOib"
                    name="customerOib"
                    value={formData.customerOib}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerFirstName">Ime</Label>
                  <Input
                    type="text"
                    id="customerFirstName"
                    name="customerFirstName"
                    value={formData.customerFirstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerLastName">Prezime</Label>
                  <Input
                    type="text"
                    id="customerLastName"
                    name="customerLastName"
                    value={formData.customerLastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerMobile">Mobitel</Label>
                  <Input
                    type="text"
                    id="customerMobile"
                    name="customerMobile"
                    value={formData.customerMobile}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Opis radova */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Opis radova</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="foundCondition">Zatečeno stanje</Label>
              <Textarea
                id="foundCondition"
                name="foundCondition"
                value={formData.foundCondition}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Izvedeni radovi */}
          <div>
            <Label htmlFor="performedWork">Izvedeni radovi</Label>
            <Textarea
              id="performedWork"
              name="performedWork"
              value={formData.performedWork}
              onChange={handleInputChange}
            />
          </div>

          {/* Materijali */}
          <div>
            <h4 className="font-medium flex items-center justify-between">
              Utrošeni materijali
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingMaterial(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj materijal
              </Button>
            </h4>

            {isAddingMaterial && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                <div>
                  <Label htmlFor="materialName">Naziv</Label>
                  <Input
                    type="text"
                    id="materialName"
                    name="name"
                    value={newMaterial.name}
                    onChange={handleMaterialInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="materialQuantity">Količina</Label>
                  <Input
                    type="number"
                    id="materialQuantity"
                    name="quantity"
                    value={newMaterial.quantity}
                    onChange={handleMaterialInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="materialUnit">Jedinica</Label>
                  <Input
                    type="text"
                    id="materialUnit"
                    name="unit"
                    value={newMaterial.unit}
                    onChange={handleMaterialInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="materialPrice">Cijena</Label>
                  <Input
                    type="number"
                    id="materialPrice"
                    name="price"
                    value={newMaterial.price}
                    onChange={handleMaterialInputChange}
                  />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addMaterial} disabled={isAddingMaterial}>
                  Dodaj
                </Button>
              </div>
            )}

            {formData.materials.length > 0 && (
              <div className="mt-4">
                <ul className="space-y-2">
                  {formData.materials.map((material, index) => (
                    <li key={index} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        {material.name} - {material.quantity} {material.unit} (Cijena: {material.price})
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Vrijeme i udaljenost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Utrošeno vrijeme (sati)</Label>
              <Input
                type="number"
                id="hours"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="distance">Udaljenost (km)</Label>
              <Input
                type="number"
                id="distance"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Komentar tehničara */}
          <div>
            <Label htmlFor="technicianComment">Komentar tehničara</Label>
            <Textarea
              id="technicianComment"
              name="technicianComment"
              value={formData.technicianComment}
              onChange={handleInputChange}
            />
          </div>

          {/* Potpisi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Potpis tehničara</Label>
              <SignaturePad onSignature={(signature) => setFormData(prev => ({ ...prev, technicianSignature: signature || '' }))} />
            </div>
            <div>
              <Label>Potpis kupca</Label>
              <SignaturePad onSignature={(signature) => setFormData(prev => ({ ...prev, customerSignature: signature || '' }))} />
            </div>
          </div>

          {/* Gumb za slanje */}
          <Button disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Stvori radni nalog
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkOrderForm;
