import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignaturePad, { SignatureMetadata } from './SignaturePad';
import { DatePicker } from './DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { generatePDF } from '@/utils/pdfGenerator';
import { useToast } from "@/hooks/use-toast";
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
  clientStreetAddress: string;
  clientCity: string;
  clientCountry: string;
  clientOib: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
  orderForCustomer: boolean;
  customerCompanyName: string;
  customerStreetAddress: string;
  customerCity: string;
  customerCountry: string;
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
  date: Date;
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

const countries = [
  'Hrvatska', 'Srbija', 'Slovenija', 'Bosna i Hercegovina', 'Crna Gora', 
  'Makedonija', 'Austrija', 'Njemačka', 'Italija', 'Mađarska'
];

let orderCounter = 1;

const WorkOrderForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCustomerSignatureModalOpen, setIsCustomerSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);
  
  const [workOrder, setWorkOrder] = useState<WorkOrder>({
    id: '',
    clientCompanyName: '',
    clientStreetAddress: '',
    clientCity: 'Zagreb',
    clientCountry: 'Hrvatska',
    clientOib: '',
    clientFirstName: '',
    clientLastName: '',
    clientMobile: '',
    clientEmail: '',
    orderForCustomer: false,
    customerCompanyName: '',
    customerStreetAddress: '',
    customerCity: 'Zagreb',
    customerCountry: 'Hrvatska',
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
    date: new Date(), // Postavi na današnji datum
    arrivalTime: '',
    completionTime: '',
    calculatedHours: '0h00min',
    fieldTrip: false,
    distance: '',
    technicianSignature: user?.signature || '',
    customerSignature: '',
    customerSignerName: '',
  });

  // Mock data for work order
  const mockWorkOrderData = {
    clientCompanyName: 'Informatika d.o.o.',
    clientStreetAddress: 'Ilica 42',
    clientCity: 'Zagreb',
    clientCountry: 'Hrvatska',
    clientOib: '12345678901',
    clientFirstName: 'Marija',
    clientLastName: 'Horvat',
    clientMobile: '+385 91 123 4567',
    clientEmail: 'marija.horvat@informatika.hr',
    orderForCustomer: true,
    customerCompanyName: 'Trgovina Sunce d.o.o.',
    customerStreetAddress: 'Maksimirska 15',
    customerCity: 'Zagreb',
    customerCountry: 'Hrvatska',
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

  // Load company locations and global settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company locations
        const { data: locations } = await supabase
          .from('company_locations')
          .select('*')
          .order('created_at', { ascending: true });
        
        // Fetch global settings
        const { data: settings } = await supabase
          .from('global_settings')
          .select('*')
          .limit(1)
          .single();
        
        setCompanyLocations(locations || []);
        setGlobalSettings(settings);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

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
        
        // FIXED: Round to whole number using mathematical rounding
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

  // ISPRAVLJENA LOGIKA: svi podaci se uzimaju isključivo od korisnika - ako nema podataka korisnika uzimaju se podaci naručitelja
  const getRelevantAddress = () => {
    if (workOrder.orderForCustomer) {
      // Ako je označeno "nalog za korisnika", uzmi adresu korisnika ako postoji
      const customerFullAddress = `${workOrder.customerStreetAddress}, ${workOrder.customerCity}, ${workOrder.customerCountry}`.trim();
      const clientFullAddress = `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`.trim();
      return customerFullAddress.length > 4 ? customerFullAddress : clientFullAddress;
    }
    // Ako nije označeno "nalog za korisnika", uzmi adresu naručitelja
    return `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`.trim();
  };

  // ISPRAVLJENA LOGIKA: funkcija za dobivanje finalnih podataka korisnika
  const getFinalCustomerData = () => {
    if (workOrder.orderForCustomer) {
      // SVI PODACI se uzimaju isključivo od korisnika - ako nema podataka korisnika uzimaju se podaci naručitelja
      return {
        company_name: workOrder.customerCompanyName || workOrder.clientCompanyName,
        street_address: workOrder.customerStreetAddress || workOrder.clientStreetAddress,
        city: workOrder.customerCity || workOrder.clientCity,
        country: workOrder.customerCountry || workOrder.clientCountry,
        oib: workOrder.customerOib || workOrder.clientOib,
        first_name: workOrder.customerFirstName || workOrder.clientFirstName,
        last_name: workOrder.customerLastName || workOrder.clientLastName,
        mobile: workOrder.customerMobile || workOrder.clientMobile,
        email: workOrder.customerEmail || workOrder.clientEmail,
      };
    } else {
      // Ako nije nalog za korisnika, koristi podatke naručitelja
      return {
        company_name: workOrder.clientCompanyName,
        street_address: workOrder.clientStreetAddress,
        city: workOrder.clientCity,
        country: workOrder.clientCountry,
        oib: workOrder.clientOib,
        first_name: workOrder.clientFirstName,
        last_name: workOrder.clientLastName,
        mobile: workOrder.clientMobile,
        email: workOrder.clientEmail,
      };
    }
  };

  // Funkcija za automatsko popunjavanje imena potpisnika prema istoj logici
  const getAutoSignerName = () => {
    if (workOrder.orderForCustomer) {
      // Ako je nalog za korisnika, uzmi ime i prezime korisnika ako postoji, inače naručitelja
      const firstName = workOrder.customerFirstName || workOrder.clientFirstName;
      const lastName = workOrder.customerLastName || workOrder.clientLastName;
      return firstName && lastName ? `${firstName} ${lastName}` : '';
    } else {
      // Ako nije nalog za korisnika, uzmi ime i prezime naručitelja
      return workOrder.clientFirstName && workOrder.clientLastName 
        ? `${workOrder.clientFirstName} ${workOrder.clientLastName}` 
        : '';
    }
  };

  useEffect(() => {
    const calculated = calculateBillableHours(workOrder.arrivalTime, workOrder.completionTime);
    setWorkOrder(prev => ({ ...prev, calculatedHours: calculated }));
  }, [workOrder.arrivalTime, workOrder.completionTime]);

  useEffect(() => {
    if (workOrder.fieldTrip && companyLocations.length > 0 && globalSettings?.distance_matrix_api_key) {
      const targetAddress = getRelevantAddress();
      
      if (targetAddress && targetAddress.length > 4) {
        // Use first company location for distance calculation
        const companyLocation = companyLocations[0];
        const companyAddress = `${companyLocation.street_address}, ${companyLocation.city}, ${companyLocation.country}`;
        
        console.log('Starting distance calculation...', { from: companyAddress, to: targetAddress });
        calculateDistance(companyAddress, targetAddress).then(distance => {
          console.log('Distance calculation result:', distance);
          if (distance) {
            setWorkOrder(prev => ({ ...prev, distance }));
          }
        });
      } else {
        console.log('Missing target address for distance calculation');
      }
    } else if (!workOrder.fieldTrip) {
      setWorkOrder(prev => ({ ...prev, distance: '' }));
    }
  }, [workOrder.fieldTrip, workOrder.clientStreetAddress, workOrder.clientCity, workOrder.clientCountry, workOrder.customerStreetAddress, workOrder.customerCity, workOrder.customerCountry, workOrder.orderForCustomer, companyLocations, globalSettings]);

  // Automatsko popunjavanje imena potpisnika kad se promijene podaci
  useEffect(() => {
    const autoSignerName = getAutoSignerName();
    if (autoSignerName && autoSignerName !== workOrder.customerSignerName) {
      setWorkOrder(prev => ({ ...prev, customerSignerName: autoSignerName }));
    }
  }, [
    workOrder.orderForCustomer,
    workOrder.clientFirstName,
    workOrder.clientLastName,
    workOrder.customerFirstName,
    workOrder.customerLastName
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWorkOrder({ ...workOrder, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setWorkOrder({ ...workOrder, [name]: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setWorkOrder({ ...workOrder, orderForCustomer: checked });
  };

  const handleFieldTripChange = (checked: boolean) => {
    setWorkOrder({ ...workOrder, fieldTrip: checked, distance: checked ? workOrder.distance : '' });
  };

  const handleDateChange = (date: Date | undefined) => {
    setWorkOrder({ ...workOrder, date: date || new Date() });
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
      console.log('Saving work order to Supabase...', finalWorkOrder);
      
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
      
      // ISPRAVLJENA LOGIKA: koristi novu funkciju za finalne podatke korisnika
      const finalCustomerData = getFinalCustomerData();
      
      // FIX: Convert date to ISO format for PostgreSQL
      const isoDate = finalWorkOrder.date instanceof Date 
        ? finalWorkOrder.date.toISOString().split('T')[0] 
        : new Date(finalWorkOrder.date).toISOString().split('T')[0];
      
      // FIX: Ensure signature timestamp is in proper ISO format
      let isoSignatureTimestamp;
      if (finalWorkOrder.signatureMetadata?.timestamp) {
        // If timestamp is in Croatian format like "30.05.2025. 04:21:25", convert it
        const timestamp = finalWorkOrder.signatureMetadata.timestamp;
        console.log('Original signature timestamp:', timestamp);
        
        // Check if it's already in ISO format
        if (timestamp.includes('T') && timestamp.includes('Z')) {
          isoSignatureTimestamp = timestamp;
        } else {
          // Convert from Croatian format to ISO
          try {
            // Parse Croatian format: "30.05.2025. 04:21:25"
            const parts = timestamp.match(/(\d{2})\.(\d{2})\.(\d{4})\.\s+(\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
              const [, day, month, year, hour, minute, second] = parts;
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
              isoSignatureTimestamp = dateObj.toISOString();
            } else {
              // Fallback: try to parse as regular date
              isoSignatureTimestamp = new Date(timestamp).toISOString();
            }
          } catch (error) {
            console.error('Error parsing timestamp:', error);
            isoSignatureTimestamp = new Date().toISOString();
          }
        }
      } else {
        isoSignatureTimestamp = new Date().toISOString();
      }
      
      console.log('Final work order date (ISO):', isoDate);
      console.log('Signature timestamp (ISO):', isoSignatureTimestamp);
      
      // FIX: Round distance to whole number
      const roundedDistance = finalWorkOrder.distance ? Math.round(parseFloat(finalWorkOrder.distance)) : 0;
      
      const workOrderData = {
        order_number: finalWorkOrder.id,
        client_company_name: finalWorkOrder.clientCompanyName,
        client_company_address: `${finalWorkOrder.clientStreetAddress}, ${finalWorkOrder.clientCity}, ${finalWorkOrder.clientCountry}`,
        client_oib: finalWorkOrder.clientOib,
        client_first_name: finalWorkOrder.clientFirstName,
        client_last_name: finalWorkOrder.clientLastName,
        client_mobile: finalWorkOrder.clientMobile,
        client_email: finalWorkOrder.clientEmail,
        order_for_customer: finalWorkOrder.orderForCustomer,
        customer_company_name: finalCustomerData.company_name,
        customer_company_address: `${finalCustomerData.street_address}, ${finalCustomerData.city}, ${finalCustomerData.country}`,
        customer_oib: finalCustomerData.oib,
        customer_first_name: finalCustomerData.first_name,
        customer_last_name: finalCustomerData.last_name,
        customer_mobile: finalCustomerData.mobile,
        customer_email: finalCustomerData.email,
        description: descriptionText,
        found_condition: foundConditionText,
        performed_work: performedWorkText,
        technician_comment: technicianCommentText,
        materials: finalWorkOrder.materials,
        hours: parseFloat(finalWorkOrder.calculatedHours.replace(/[^\d.]/g, '')) || 0,
        distance: roundedDistance, // Use rounded distance
        technician_signature: finalWorkOrder.technicianSignature,
        technician_name: finalWorkOrder.technicianName,
        customer_signature: finalWorkOrder.customerSignature,
        signature_timestamp: isoSignatureTimestamp, // Use properly converted ISO format
        signature_coordinates: signatureCoordinates,
        signature_address: finalWorkOrder.signatureMetadata?.address,
        date: isoDate, // Use ISO format for date
        user_id: user.id,
      };

      console.log('Work order data to insert:', workOrderData);
      
      const { error } = await supabase
        .from('work_orders')
        .insert(workOrderData);
      
      if (error) {
        console.error('Supabase insertion error:', error);
        throw error;
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
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Potrebna je prijava",
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
      // Generate work order number
      const year = new Date().getFullYear().toString().slice(-2);
      const generatedId = `${user.initials}${orderCounter++}/${year}`;
      
      // ISPRAVLJENA LOGIKA: koristi novu funkciju za finalne podatke
      const finalCustomerData = getFinalCustomerData();
      
      const finalWorkOrder = {
        ...workOrder,
        id: generatedId,
        technicianSignature: user.signature || '',
        technicianName: user.name,
        date: workOrder.date, // Keep as Date object for now, will be converted in saveToSupabase
        // Dodaj finalne podatke korisnika u workOrder objekt za PDF generaciju
        finalCustomerData,
        // Dodaj kombiniranu adresu za kompatibilnost s postojećim kodom
        clientCompanyAddress: `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`,
        customerCompanyAddress: `${finalCustomerData.street_address}, ${finalCustomerData.city}, ${finalCustomerData.country}`
      };
      
      console.log('Final work order before saving:', finalWorkOrder);
      
      // Save to Supabase
      await saveToSupabase(finalWorkOrder);
      
      // For PDF generation, convert date to Croatian format
      const finalWorkOrderForPDF = {
        ...finalWorkOrder,
        date: workOrder.date.toLocaleDateString('hr-HR')
      };
      
      // Generate PDF
      await generatePDF(finalWorkOrderForPDF);
      
      toast({
        title: "Radni nalog spremljen",
        description: `Radni nalog ${generatedId} je uspješno kreiran i spreman za ispis`,
      });
      
      // Reset form (except for the technician signature)
      setWorkOrder({
        id: '',
        clientCompanyName: '',
        clientStreetAddress: '',
        clientCity: 'Zagreb',
        clientCountry: 'Hrvatska',
        clientOib: '',
        clientFirstName: '',
        clientLastName: '',
        clientMobile: '',
        clientEmail: '',
        orderForCustomer: false,
        customerCompanyName: '',
        customerStreetAddress: '',
        customerCity: 'Zagreb',
        customerCountry: 'Hrvatska',
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
        date: new Date(),
        arrivalTime: '',
        completionTime: '',
        calculatedHours: '0h00min',
        fieldTrip: false,
        distance: '',
        technicianSignature: user?.signature || '',
        customerSignature: '',
        customerSignerName: '',
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Better error handling with more specific messages
      let errorMessage = "Došlo je do pogreške prilikom spremanja radnog naloga";
      
      if (error?.code === '22007' || error?.code === '22008') {
        errorMessage = "Greška s formatom datuma ili vremena. Molimo pokušajte ponovo.";
      } else if (error?.code === '23505') {
        errorMessage = "Radni nalog s tim brojem već postoji.";
      } else if (error?.message) {
        errorMessage = `Greška: ${error.message}`;
      }
      
      console.error('Detailed error information:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      });
      
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
    } else {
      // Reset to empty form (keep only basic data)
      setWorkOrder({
        id: '',
        clientCompanyName: '',
        clientStreetAddress: '',
        clientCity: 'Zagreb',
        clientCountry: 'Hrvatska',
        clientOib: '',
        clientFirstName: '',
        clientLastName: '',
        clientMobile: '',
        clientEmail: '',
        orderForCustomer: false,
        customerCompanyName: '',
        customerStreetAddress: '',
        customerCity: 'Zagreb',
        customerCountry: 'Hrvatska',
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
        date: new Date(),
        arrivalTime: '',
        completionTime: '',
        calculatedHours: '0h00min',
        fieldTrip: false,
        distance: '',
        technicianSignature: user?.signature || '',
        customerSignature: '',
        customerSignerName: '',
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Mock data checkbox - TEMPORARY FEATURE */}
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
            
            <div className="space-y-4">
              <Label className="text-base font-medium">Adresa tvrtke</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="clientStreetAddress">Ulica i broj</Label>
                  <Input 
                    id="clientStreetAddress" 
                    name="clientStreetAddress" 
                    value={workOrder.clientStreetAddress} 
                    onChange={handleChange} 
                    placeholder="Ilica 1"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCity">Grad</Label>
                  <Input 
                    id="clientCity" 
                    name="clientCity" 
                    value={workOrder.clientCity} 
                    onChange={handleChange} 
                    placeholder="Zagreb"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCountry">Država</Label>
                  <Select value={workOrder.clientCountry} onValueChange={(value) => handleSelectChange('clientCountry', value)}>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerOib">OIB</Label>
                  <Input 
                    id="customerOib" 
                    name="customerOib" 
                    value={workOrder.customerOib} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base font-medium">Adresa tvrtke</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="customerStreetAddress">Ulica i broj</Label>
                    <Input 
                      id="customerStreetAddress" 
                      name="customerStreetAddress" 
                      value={workOrder.customerStreetAddress} 
                      onChange={handleChange} 
                      placeholder="Ilica 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCity">Grad</Label>
                    <Input 
                      id="customerCity" 
                      name="customerCity" 
                      value={workOrder.customerCity} 
                      onChange={handleChange} 
                      placeholder="Zagreb"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCountry">Država</Label>
                    <Select value={workOrder.customerCountry} onValueChange={(value) => handleSelectChange('customerCountry', value)}>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerFirstName">Ime</Label>
                  <Input 
                    id="customerFirstName" 
                    name="customerFirstName" 
                    value={workOrder.customerFirstName} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerLastName">Prezime</Label>
                  <Input 
                    id="customerLastName" 
                    name="customerLastName" 
                    value={workOrder.customerLastName} 
                    onChange={handleChange} 
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
                <Label>Datum</Label>
                <DatePicker
                  date={workOrder.date}
                  onDateChange={handleDateChange}
                  placeholder="Odaberite datum"
                  className="w-full"
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
                {companyLocations.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Admin treba postaviti lokacije tvrtke u administraciji za automatsko računanje udaljenosti.
                  </p>
                )}
                {!globalSettings?.distance_matrix_api_key && companyLocations.length > 0 && (
                  <p className="text-sm text-amber-600">
                    Admin treba postaviti Distance Matrix API ključ u administraciji za automatsko računanje udaljenosti.
                  </p>
                )}
                {companyLocations.length > 0 && globalSettings?.distance_matrix_api_key && (
                  <p className="text-sm text-green-600">
                    Udaljenost se automatski računa pomoću distancematrix.ai API-ja.
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
                    placeholder="Automatski se popunjava na osnovu unesenih podataka"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Ime se automatski popunjava na osnovu podataka {workOrder.orderForCustomer ? 'korisnika (ili naručitelja ako nema podataka korisnika)' : 'naručitelja'}
                  </p>
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
