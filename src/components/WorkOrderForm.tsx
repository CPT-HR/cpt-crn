
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SignaturePad, { SignatureMetadata } from './SignaturePad';
import { generatePDF } from '@/utils/pdfGenerator';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import ClientInfoSection from './work-order/ClientInfoSection';
import CustomerInfoSection from './work-order/CustomerInfoSection';
import WorkDetailsSection from './work-order/WorkDetailsSection';
import MaterialsSection from './work-order/MaterialsSection';
import TimeSection from './work-order/TimeSection';
import TravelSection from './work-order/TravelSection';
import SignaturesSection from './work-order/SignaturesSection';
import { useWorkOrderForm } from '@/hooks/useWorkOrderForm';
import { WorkOrder, Material, WorkItem } from '@/types/workOrder';
import { parseDisplayToMinutes } from '@/utils/workOrderParsers';

interface WorkOrderFormProps {
  initialData?: any;
}

interface ClientData {
  clientCompanyName: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
  clientOib: string;
  orderForCustomer: boolean;
}

interface CustomerData {
  customerCompanyName: string;
  customerFirstName: string;
  customerLastName: string;
  customerMobile: string;
  customerEmail: string;
  customerOib: string;
}

const countries = [
  'Hrvatska', 'Srbija', 'Slovenija', 'Bosna i Hercegovina', 'Crna Gora', 
  'Makedonija', 'Austrija', 'Njemačka', 'Italija', 'Mađarska'
];

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ initialData }) => {
  const { toast } = useToast();
  const [isCustomerSignatureModalOpen, setIsCustomerSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  
  const {
    workOrder,
    setWorkOrder,
    companyLocations,
    globalSettings,
    isEditMode,
    user,
    employeeProfile
  } = useWorkOrderForm(initialData);

  // Mock data for work order
  const mockWorkOrderData = {
    clientCompanyName: 'Informatika d.o.o.',
    clientCompanyAddress: 'Ilica 42, Zagreb, Hrvatska',
    clientOib: '12345678901',
    clientFirstName: 'Marija',
    clientLastName: 'Horvat',
    clientMobile: '+385 91 123 4567',
    clientEmail: 'marija.horvat@informatika.hr',
    orderForCustomer: true,
    customerCompanyName: 'Trgovina Sunce d.o.o.',
    customerCompanyAddress: 'Maksimirska 15, Zagreb, Hrvatska',
    customerOib: '98765432109',
    customerFirstName: 'Ivo',
    customerLastName: 'Perić',
    customerMobile: '+385 92 987 6543',
    customerEmail: 'ivo.peric@sunce.hr',
    description: [
      { id: '1', text: 'Računalo se ne pali' },
      { id: '2', text: 'Moguć problem s napajanjem' }
    ],
    foundCondition: [
      { id: '1', text: 'Oštećeno napajanje' },
      { id: '2', text: 'Prašina u kućištu' }
    ],
    performedWork: [
      { id: '1', text: 'Zamjena napajanja' },
      { id: '2', text: 'Čišćenje računala' }
    ],
    technicianComment: [
      { id: '1', text: 'Preporučuje se redovito održavanje' }
    ],
    materials: [
      { id: '1', name: 'Napajanje 500W', quantity: '1', unit: 'kom' },
      { id: '2', name: 'Kompresijski sprej', quantity: '1', unit: 'kom' }
    ],
    arrivalTime: '09:00',
    completionTime: '11:30',
    fieldTrip: true,
    distance: '15',
    customerSignerName: 'Ivo Perić'
  };

  // Calculate distance using distancematrix.ai API with rounding to whole number
  const calculateDistance = async (companyAddress: string, targetAddress: string) => {
    try {
      console.log('Calculating distance between:', companyAddress, 'and', targetAddress);
      
      if (!globalSettings?.distance_matrix_api_key) {
        console.log('No API key found for distance calculation');
        return '';
      }
      
      const response = await fetch(`https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${encodeURIComponent(companyAddress)}&destinations=${encodeURIComponent(targetAddress)}&key=${globalSettings.distance_matrix_api_key}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch distance data');
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const distanceText = data.rows[0].elements[0].distance?.text;
        const distanceValue = parseFloat(distanceText?.replace(/[^\d.]/g, '')) || 0;
        const roundedDistance = Math.round(distanceValue);
        console.log('Distance calculated and rounded:', roundedDistance);
        return roundedDistance.toString();
      } else {
        console.log('Distance calculation failed:', data);
        return '';
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '';
    }
  };

  // Funkcija za dobivanje sljedećeg broja radnog naloga koristeći Supabase RPC
  const getNextOrderNumber = async (userInitials: string): Promise<string> => {
    try {
      console.log('Getting next order number for user initials:', userInitials);
      
      const { data, error } = await supabase.rpc('get_next_order_number', {
        user_initials: userInitials
      });
      
      if (error) {
        console.error('Error getting next order number:', error);
        throw error;
      }
      
      console.log('Generated order number:', data);
      return data;
    } catch (error) {
      console.error('Error in getNextOrderNumber:', error);
      throw error;
    }
  };

  // Event handlers
  const handleClientInfoChange = (field: string, value: string | boolean) => {
    setWorkOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setWorkOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setWorkOrder(prev => ({ ...prev, date: date ? date.toLocaleDateString('hr-HR') : new Date().toLocaleDateString('hr-HR') }));
  };

  const handleTimeChange = (field: 'arrivalTime' | 'completionTime', value: string) => {
    setWorkOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkItemChange = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>, id: string, value: string) => {
    setWorkOrder(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, text: value } : item
      )
    }));
  };

  const addWorkItem = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>) => {
    const newId = (workOrder[section].length + 1).toString();
    setWorkOrder(prev => ({
      ...prev,
      [section]: [
        ...prev[section],
        { id: newId, text: '' }
      ]
    }));
  };

  const removeWorkItem = (section: keyof Pick<WorkOrder, 'description' | 'foundCondition' | 'performedWork' | 'technicianComment'>, id: string) => {
    if (workOrder[section].length === 1) return;
    
    setWorkOrder(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const handleMaterialChange = (id: string, field: keyof Material, value: string) => {
    setWorkOrder(prev => ({
      ...prev,
      materials: prev.materials.map(material => 
        material.id === id ? { ...material, [field]: value } : material
      )
    }));
  };

  const addMaterial = () => {
    const newId = (workOrder.materials.length + 1).toString();
    setWorkOrder(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        { id: newId, name: '', quantity: '', unit: '' }
      ]
    }));
  };

  const removeMaterial = (id: string) => {
    if (workOrder.materials.length === 1) return;
    
    setWorkOrder(prev => ({
      ...prev,
      materials: prev.materials.filter(material => material.id !== id)
    }));
  };

  const handleFieldTripChange = (checked: boolean) => {
    setWorkOrder(prev => ({ ...prev, fieldTrip: checked, distance: checked ? prev.distance : '' }));
  };

  const handleCustomerSignatureSave = (signature: string, metadata: SignatureMetadata) => {
    setWorkOrder(prev => ({
      ...prev,
      customerSignature: signature,
      signatureMetadata: metadata
    }));
  };

  // Save to Supabase function
  const saveToSupabase = async (finalWorkOrder: any) => {
    try {
      console.log('Saving work order to Supabase...', finalWorkOrder);
      
      if (!employeeProfile) throw new Error("Employee profile nije pronađen");
      if (!user?.id) throw new Error("User ID nije pronađen");
      
      const signatureCoordinates = finalWorkOrder.signatureMetadata?.coordinates 
        ? `(${finalWorkOrder.signatureMetadata.coordinates.longitude},${finalWorkOrder.signatureMetadata.coordinates.latitude})`
        : null;
      
      const descriptionText = finalWorkOrder.description.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const foundConditionText = finalWorkOrder.foundCondition.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const performedWorkText = finalWorkOrder.performedWork.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      const technicianCommentText = finalWorkOrder.technicianComment.map((item: WorkItem) => `• ${item.text}`).filter((text: string) => text.length > 2).join('\n');
      
      const isoDate = finalWorkOrder.date instanceof Date 
        ? finalWorkOrder.date.toISOString().split('T')[0] 
        : new Date(finalWorkOrder.date).toISOString().split('T')[0];
      
      const workOrderData = {
        order_number: finalWorkOrder.orderNumber,
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
        arrival_time: finalWorkOrder.arrivalTime || null,
        completion_time: finalWorkOrder.completionTime || null,
        hours: parseDisplayToMinutes(finalWorkOrder.calculatedHours),
        distance: finalWorkOrder.distance ? parseFloat(finalWorkOrder.distance) : 0,
        technician_signature: finalWorkOrder.technicianSignature,
        customer_signature: finalWorkOrder.customerSignature,
        signature_timestamp: finalWorkOrder.signatureMetadata?.timestamp || null,
        signature_coordinates: signatureCoordinates,
        signature_address: finalWorkOrder.signatureMetadata?.address || null,
        date: isoDate,
        employee_profile_id: employeeProfile.id,
        user_id: user.id,
      };

      console.log('Work order data to insert:', workOrderData);
      
      if (isEditMode && initialData?.id) {
        // Update existing work order
        const { error } = await supabase
          .from('work_orders')
          .update(workOrderData)
          .eq('id', initialData.id);
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      } else {
        // Insert new work order
        const { error } = await supabase
          .from('work_orders')
          .insert(workOrderData);
        
        if (error) {
          console.error('Supabase insertion error:', error);
          throw error;
        }
      }
      
      console.log('Work order saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !employeeProfile) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Potrebna je prijava i employee profile",
      });
      return;
    }
    
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
      // Generate order_number only for new orders
      let orderNumber = workOrder.id;
      
      if (!isEditMode) {
        if (!user.initials) {
          throw new Error("User initials nisu pronađeni");
        }
        orderNumber = await getNextOrderNumber(user.initials);
        console.log('Generated new order number:', orderNumber);
      }
      
      // Check if a new signature was created (different from initial)
      const newSignatureCreated = isEditMode && 
        initialData?.customer_signature !== workOrder.customerSignature;
      
      const finalWorkOrder = {
        ...workOrder,
        orderNumber,
        technicianSignature: user.signature || '',
        technicianName: user.name || '',
        newSignatureCreated
      };
      
      console.log('Final work order before saving:', finalWorkOrder);
      
      await saveToSupabase(finalWorkOrder);
      
      // For PDF use order_number as id
      const finalWorkOrderForPDF = {
        ...finalWorkOrder,
        id: orderNumber,
      };
      
      await generatePDF(finalWorkOrderForPDF);
      
      toast({
        title: isEditMode ? "Radni nalog ažuriran" : "Radni nalog spremljen",
        description: `Radni nalog ${orderNumber} je uspješno ${isEditMode ? 'ažuriran' : 'kreiran'} i spreman za ispis`,
      });
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      let errorMessage = "Došlo je do pogreške prilikom spremanja radnog naloga";
      
      if (error?.code === '22007' || error?.code === '22008') {
        errorMessage = "Greška s formatom datuma ili vremena. Molimo pokušajte ponovo.";
      } else if (error?.code === '23505') {
        errorMessage = "Radni nalog s tim brojem već postoji.";
      } else if (error?.message) {
        errorMessage = `Greška: ${error.message}`;
      }
      
      toast({
        variant: "destructive",
        title: "Greška",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMockDataChange = (checked: boolean) => {
    setUseMockData(checked);
    if (checked) {
      setWorkOrder(prev => ({
        ...prev,
        ...mockWorkOrderData,
        date: prev.date,
        technicianSignature: prev.technicianSignature,
        customerSignature: prev.customerSignature,
        signatureMetadata: prev.signatureMetadata
      }));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {!isEditMode && (
          <Card className="border-dashed border-amber-400 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useMockData" 
                  checked={useMockData}
                  onCheckedChange={handleMockDataChange}
                />
                <Label htmlFor="useMockData" className="text-sm font-normal text-amber-800">
                  Koristi mock podatke (privremena funkcionalnost za testiranje)
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        <ClientInfoSection
          data={{
            clientCompanyName: workOrder.clientCompanyName,
            clientFirstName: workOrder.clientFirstName,
            clientLastName: workOrder.clientLastName,
            clientMobile: workOrder.clientMobile,
            clientEmail: workOrder.clientEmail,
            clientOib: workOrder.clientOib,
            orderForCustomer: workOrder.orderForCustomer,
          }}
          onChange={handleClientInfoChange}
          countries={countries}
        />

        {workOrder.orderForCustomer && (
          <CustomerInfoSection
            data={{
              customerCompanyName: workOrder.customerCompanyName,
              customerFirstName: workOrder.customerFirstName,
              customerLastName: workOrder.customerLastName,
              customerMobile: workOrder.customerMobile,
              customerEmail: workOrder.customerEmail,
              customerOib: workOrder.customerOib,
            }}
            onChange={handleCustomerInfoChange}
            countries={countries}
          />
        )}

        <WorkDetailsSection
          data={{
            description: workOrder.description,
            foundCondition: workOrder.foundCondition,
            performedWork: workOrder.performedWork,
            technicianComment: workOrder.technicianComment,
          }}
          onWorkItemChange={handleWorkItemChange}
          onAddWorkItem={addWorkItem}
          onRemoveWorkItem={removeWorkItem}
        />

        <MaterialsSection
          materials={workOrder.materials}
          onMaterialChange={handleMaterialChange}
          onAddMaterial={addMaterial}
          onRemoveMaterial={removeMaterial}
        />

        <TimeSection
          date={new Date(workOrder.date)}
          arrivalTime={workOrder.arrivalTime}
          completionTime={workOrder.completionTime}
          calculatedHours={workOrder.calculatedHours}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
        />

        <TravelSection
          fieldTrip={workOrder.fieldTrip}
          distance={workOrder.distance}
          onFieldTripChange={handleFieldTripChange}
          onDistanceChange={(value) => setWorkOrder(prev => ({ ...prev, distance: value }))}
          companyLocationsCount={companyLocations.length}
          hasDistanceApiKey={!!globalSettings?.distance_matrix_api_key}
        />

        <SignaturesSection
          technicianSignature={workOrder.technicianSignature}
          technicianName={workOrder.technicianName || ''}
          customerSignature={workOrder.customerSignature}
          customerSignerName={workOrder.customerSignerName}
          signatureMetadata={workOrder.signatureMetadata}
          orderForCustomer={workOrder.orderForCustomer}
          onCustomerSignerNameChange={(value) => setWorkOrder(prev => ({ ...prev, customerSignerName: value }))}
          onCustomerSignatureClick={() => setIsCustomerSignatureModalOpen(true)}
        />

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            disabled={isSubmitting || !workOrder.customerSignature || !user?.signature || !workOrder.customerSignerName}
            className="relative"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Ažuriraj radni nalog' : 'Spremi i generiraj PDF'}
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
