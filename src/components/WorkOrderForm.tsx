import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SignaturePad, { SignatureMetadata } from './SignaturePad';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import ClientInfoSection from './work-order/ClientInfoSection';
import CustomerInfoSection from './work-order/CustomerInfoSection';
import WorkDetailsSection from './work-order/WorkDetailsSection';
import MaterialsSection from './work-order/MaterialsSection';
import TimeSection from './work-order/TimeSection';
import TravelSection from './work-order/TravelSection';
import SignaturesSection from './work-order/SignaturesSection';
import { 
  parseSignatureMetadata, 
  formatMinutesToDisplay,
  parseDisplayToMinutes 
} from '@/utils/workOrderParsers';

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
  technicianName?: string;
}

interface WorkOrderFormProps {
  initialData?: any;
}

const countries = [
  'Hrvatska', 'Srbija', 'Slovenija', 'Bosna i Hercegovina', 'Crna Gora', 
  'Makedonija', 'Austrija', 'Njemačka', 'Italija', 'Mađarska'
];

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ initialData }) => {
  const { user } = useAuth();
  const { data: employeeProfile } = useEmployeeProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCustomerSignatureModalOpen, setIsCustomerSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);
  const isEditMode = !!initialData;
  
  // Helper function to parse text fields into WorkItem arrays
  const parseTextToWorkItems = (text: string | null): WorkItem[] => {
    if (!text) return [{ id: '1', text: '' }];
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return [{ id: '1', text: '' }];
    
    return lines.map((line, index) => ({
      id: (index + 1).toString(),
      text: line.replace(/^•\s*/, '').trim()
    }));
  };

  // Helper function to parse materials from JSONB
  const parseMaterials = (materialsData: any): Material[] => {
    if (!materialsData || !Array.isArray(materialsData)) {
      return [{ id: '1', name: '', quantity: '', unit: '' }];
    }
    
    return materialsData.map((material, index) => ({
      id: (index + 1).toString(),
      name: material.name || '',
      quantity: material.quantity?.toString() || '',
      unit: material.unit || ''
    }));
  };

  // Helper function to parse address from combined field
  const parseAddress = (addressString: string) => {
    if (!addressString) return { street: '', city: 'Zagreb', country: 'Hrvatska' };
    
    const parts = addressString.split(', ');
    if (parts.length >= 3) {
      return {
        street: parts[0].trim(),
        city: parts[1].trim(),
        country: parts[2].trim()
      };
    } else if (parts.length === 2) {
      return {
        street: parts[0].trim(),
        city: parts[1].trim(),
        country: 'Hrvatska'
      };
    } else {
      return {
        street: addressString.trim(),
        city: 'Zagreb',
        country: 'Hrvatska'
      };
    }
  };

  // Initialize work order state based on initialData or defaults
  const getInitialWorkOrderState = (): WorkOrder => {
    if (initialData) {
      const clientAddress = parseAddress(initialData.client_company_address || '');
      const customerAddress = parseAddress(initialData.customer_company_address || '');
      
      // Parse existing signature metadata
      const existingSignatureMetadata = parseSignatureMetadata(
        initialData.signature_timestamp,
        initialData.signature_coordinates,
        initialData.signature_address
      );
      
      return {
        id: initialData.order_number || '',
        clientCompanyName: initialData.client_company_name || '',
        clientStreetAddress: clientAddress.street,
        clientCity: clientAddress.city,
        clientCountry: clientAddress.country,
        clientOib: initialData.client_oib || '',
        clientFirstName: initialData.client_first_name || '',
        clientLastName: initialData.client_last_name || '',
        clientMobile: initialData.client_mobile || '',
        clientEmail: initialData.client_email || '',
        orderForCustomer: initialData.order_for_customer || false,
        customerCompanyName: initialData.customer_company_name || '',
        customerStreetAddress: customerAddress.street,
        customerCity: customerAddress.city,
        customerCountry: customerAddress.country,
        customerOib: initialData.customer_oib || '',
        customerFirstName: initialData.customer_first_name || '',
        customerLastName: initialData.customer_last_name || '',
        customerMobile: initialData.customer_mobile || '',
        customerEmail: initialData.customer_email || '',
        description: parseTextToWorkItems(initialData.description),
        foundCondition: parseTextToWorkItems(initialData.found_condition),
        performedWork: parseTextToWorkItems(initialData.performed_work),
        technicianComment: parseTextToWorkItems(initialData.technician_comment),
        materials: parseMaterials(initialData.materials),
        date: initialData.date ? new Date(initialData.date) : new Date(),
        arrivalTime: initialData.arrival_time || '',
        completionTime: initialData.completion_time || '',
        calculatedHours: formatMinutesToDisplay(initialData.hours),
        fieldTrip: (initialData.distance && parseFloat(initialData.distance) > 0) || false,
        distance: initialData.distance ? initialData.distance.toString() : '',
        technicianSignature: initialData.technician_signature || user?.signature || '',
        customerSignature: initialData.customer_signature || '',
        customerSignerName: getCustomerSignerNameFromInitialData(initialData),
        signatureMetadata: existingSignatureMetadata,
        technicianName: user?.name || '',
      };
    }

    return {
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
      technicianName: user?.name || '',
    };
  };

  // Helper function to get customer signer name from initial data
  const getCustomerSignerNameFromInitialData = (data: any): string => {
    // First priority: use saved customer_signer_name from database if it exists
    if (data.customer_signer_name) {
      return data.customer_signer_name;
    }
    
    // Fallback: reconstruct name from client/customer data (for old work orders without saved signer name)
    if (data.order_for_customer) {
      const firstName = data.customer_first_name || data.client_first_name;
      const lastName = data.customer_last_name || data.client_last_name;
      return firstName && lastName ? `${firstName} ${lastName}` : '';
    } else {
      return data.client_first_name && data.client_last_name 
        ? `${data.client_first_name} ${data.client_last_name}` 
        : '';
    }
  };

  const [workOrder, setWorkOrder] = useState<WorkOrder>(getInitialWorkOrderState);

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
        const { data: locations } = await supabase
          .from('company_locations')
          .select('*')
          .order('created_at', { ascending: true });
        
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

  // Reset state when initialData changes
  useEffect(() => {
    setWorkOrder(getInitialWorkOrderState());
  }, [initialData]);

  // Calculate billable hours based on arrival and completion time
  const calculateBillableHours = (arrival: string, completion: string) => {
    if (!arrival || !completion) return '0h00min';
    
    const [arrivalHour, arrivalMin] = arrival.split(':').map(Number);
    const [completionHour, completionMin] = completion.split(':').map(Number);
    
    const arrivalMinutes = arrivalHour * 60 + arrivalMin;
    const completionMinutes = completionHour * 60 + completionMin;
    
    if (completionMinutes <= arrivalMinutes) return '0h00min';
    
    const diffMinutes = completionMinutes - arrivalMinutes;
    const billableMinutes = Math.ceil(diffMinutes / 30) * 30;
    
    return formatMinutesToDisplay(billableMinutes);
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

  const getRelevantAddress = () => {
    if (workOrder.orderForCustomer) {
      const customerFullAddress = `${workOrder.customerStreetAddress}, ${workOrder.customerCity}, ${workOrder.customerCountry}`.trim();
      const clientFullAddress = `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`.trim();
      return customerFullAddress.length > 4 ? customerFullAddress : clientFullAddress;
    }
    return `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`.trim();
  };

  const getFinalCustomerData = () => {
    if (workOrder.orderForCustomer) {
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

  const getAutoSignerName = () => {
    if (workOrder.orderForCustomer) {
      const firstName = workOrder.customerFirstName || workOrder.clientFirstName;
      const lastName = workOrder.customerLastName || workOrder.clientLastName;
      return firstName && lastName ? `${firstName} ${lastName}` : '';
    } else {
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

  useEffect(() => {
    // Skip automatic name generation when editing an existing work order
    // This prevents overwriting the saved customer_signer_name from the database
    if (isEditMode) {
      return;
    }
    
    const autoSignerName = getAutoSignerName();
    if (autoSignerName && autoSignerName !== workOrder.customerSignerName) {
      setWorkOrder(prev => ({ ...prev, customerSignerName: autoSignerName }));
    }
  }, [
    workOrder.orderForCustomer,
    workOrder.clientFirstName,
    workOrder.clientLastName,
    workOrder.customerFirstName,
    workOrder.customerLastName,
    isEditMode
  ]);

  // Funkcija za generiranje inicijala iz imena i prezimena
  const generateInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  // Funkcija za dobivanje sljedećeg broja radnog naloga koristeći Supabase RPC
  const getNextOrderNumber = async (): Promise<string> => {
    try {
      if (!employeeProfile?.first_name || !employeeProfile?.last_name) {
        throw new Error("Employee profile data nisu pronađeni");
      }

      const userInitials = generateInitials(employeeProfile.first_name, employeeProfile.last_name);
      console.log('Generated initials from employee profile:', userInitials, {
        firstName: employeeProfile.first_name,
        lastName: employeeProfile.last_name
      });
      
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

  const handleClientInfoChange = (field: string, value: string | boolean) => {
    setWorkOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setWorkOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setWorkOrder(prev => ({ ...prev, date: date || new Date() }));
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
        { 
          id: newId, 
          name: 'Bez potrošenog materijala', 
          quantity: '1', 
          unit: 'kom' 
        }
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
      
      const finalCustomerData = getFinalCustomerData();
      
      const isoDate = finalWorkOrder.date instanceof Date 
        ? finalWorkOrder.date.toISOString().split('T')[0] 
        : new Date(finalWorkOrder.date).toISOString().split('T')[0];
      
      // Handle signature timestamp preservation for edit mode
      let isoSignatureTimestamp;
      if (isEditMode && initialData?.signature_timestamp && !finalWorkOrder.newSignatureCreated) {
        // Preserve existing timestamp if in edit mode and no new signature was created
        isoSignatureTimestamp = initialData.signature_timestamp;
        console.log('Preserving existing signature timestamp:', isoSignatureTimestamp);
      } else if (finalWorkOrder.signatureMetadata?.timestamp) {
        // Use new signature timestamp
        const timestamp = finalWorkOrder.signatureMetadata.timestamp;
        console.log('Using new signature timestamp:', timestamp);
        
        if (timestamp.includes('T') && timestamp.includes('Z')) {
          isoSignatureTimestamp = timestamp;
        } else {
          try {
            const parts = timestamp.match(/(\d{2})\.(\d{2})\.(\d{4})\.\s+(\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
              const [, day, month, year, hour, minute, second] = parts;
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
              isoSignatureTimestamp = dateObj.toISOString();
            } else {
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
      
      const roundedDistance = finalWorkOrder.distance ? Math.round(parseFloat(finalWorkOrder.distance)) : 0;
      const minutesFromCalculatedHours = parseDisplayToMinutes(finalWorkOrder.calculatedHours);
      
      const workOrderData = {
        order_number: finalWorkOrder.orderNumber,
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
        arrival_time: finalWorkOrder.arrivalTime || null,
        completion_time: finalWorkOrder.completionTime || null,
        hours: minutesFromCalculatedHours,
        distance: roundedDistance,
        technician_signature: finalWorkOrder.technicianSignature,
        customer_signature: finalWorkOrder.customerSignature,
        customer_signer_name: finalWorkOrder.customerSignerName,
        signature_timestamp: isoSignatureTimestamp,
        signature_coordinates: signatureCoordinates,
        signature_address: finalWorkOrder.signatureMetadata?.address || (isEditMode ? initialData?.signature_address : null),
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
    
    // Remove customer signature validation for new work orders
    // Customer signature is optional during creation but will determine status
    
    if (!workOrder.customerSignerName && workOrder.customerSignature) {
      toast({
        variant: "destructive", 
        title: "Greška", 
        description: "Potrebno je ime i prezime potpisnika kad je potpis dodan",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate order_number only for new orders
      let orderNumber = workOrder.id;
      
      if (!isEditMode) {
        if (!employeeProfile.first_name || !employeeProfile.last_name) {
          throw new Error("Employee profile podaci nisu pronađeni");
        }
        orderNumber = await getNextOrderNumber();
        console.log('Generated new order number:', orderNumber);
      }
      
      const finalCustomerData = getFinalCustomerData();
      
      // Check if a new signature was created (different from initial)
      const newSignatureCreated = isEditMode && 
        initialData?.customer_signature !== workOrder.customerSignature;
      
      const finalWorkOrder = {
        ...workOrder,
        orderNumber,
        technicianSignature: user.signature || '',
        technicianName: user.name || '',
        date: workOrder.date,
        finalCustomerData,
        clientCompanyAddress: `${workOrder.clientStreetAddress}, ${workOrder.clientCity}, ${workOrder.clientCountry}`,
        customerCompanyAddress: `${finalCustomerData.street_address}, ${finalCustomerData.city}, ${finalCustomerData.country}`,
        newSignatureCreated
      };
      
      console.log('Final work order before saving:', finalWorkOrder);
      
      await saveToSupabase(finalWorkOrder);
      
      toast({
        title: isEditMode ? "Radni nalog ažuriran" : "Radni nalog spremljen",
        description: `Radni nalog ${orderNumber} je uspješno ${isEditMode ? 'ažuriran' : 'kreiran'}`,
      });
      
      // Navigate to work orders list after successful save/update
      navigate('/work-orders');
      
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
      setWorkOrder(getInitialWorkOrderState());
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
            clientStreetAddress: workOrder.clientStreetAddress,
            clientCity: workOrder.clientCity,
            clientCountry: workOrder.clientCountry,
            clientOib: workOrder.clientOib,
            clientFirstName: workOrder.clientFirstName,
            clientLastName: workOrder.clientLastName,
            clientMobile: workOrder.clientMobile,
            clientEmail: workOrder.clientEmail,
            orderForCustomer: workOrder.orderForCustomer,
          }}
          onChange={handleClientInfoChange}
          countries={countries}
        />

        {workOrder.orderForCustomer && (
          <CustomerInfoSection
            data={{
              customerCompanyName: workOrder.customerCompanyName,
              customerStreetAddress: workOrder.customerStreetAddress,
              customerCity: workOrder.customerCity,
              customerCountry: workOrder.customerCountry,
              customerOib: workOrder.customerOib,
              customerFirstName: workOrder.customerFirstName,
              customerLastName: workOrder.customerLastName,
              customerMobile: workOrder.customerMobile,
              customerEmail: workOrder.customerEmail,
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
          date={workOrder.date}
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
            disabled={isSubmitting || !user?.signature || (workOrder.customerSignature && !workOrder.customerSignerName)}
            className="relative"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Ažuriraj radni nalog' : 'Spremi radni nalog'}
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
