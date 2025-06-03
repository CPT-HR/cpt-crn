
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, Material, WorkItem } from '@/types/workOrder';
import { parseSignatureMetadata, formatMinutesToDisplay, parseDisplayToMinutes } from '@/utils/workOrderParsers';
import { parseTextToWorkItems, parseMaterials, parseAddress, calculateBillableHours } from '@/utils/workOrderParsers';

export const useWorkOrderForm = (initialData?: any) => {
  const { user } = useAuth();
  const { data: employeeProfile } = useEmployeeProfile();
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const isEditMode = !!initialData;

  // Helper function to get customer signer name from initial data
  const getCustomerSignerNameFromInitialData = (data: any): string => {
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
        clientCompanyAddress: initialData.client_company_address || '',
        clientOib: initialData.client_oib || '',
        clientFirstName: initialData.client_first_name || '',
        clientLastName: initialData.client_last_name || '',
        clientMobile: initialData.client_mobile || '',
        clientEmail: initialData.client_email || '',
        orderForCustomer: initialData.order_for_customer || false,
        customerCompanyName: initialData.customer_company_name || '',
        customerCompanyAddress: initialData.customer_company_address || '',
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
        date: initialData.date ? new Date(initialData.date).toLocaleDateString('hr-HR') : new Date().toLocaleDateString('hr-HR'),
        arrivalTime: initialData.arrival_time || '',
        completionTime: initialData.completion_time || '',
        calculatedHours: formatMinutesToDisplay(initialData.hours),
        fieldTrip: (initialData.distance && parseFloat(initialData.distance) > 0) || false,
        distance: initialData.distance ? initialData.distance.toString() : '',
        technicianSignature: initialData.technician_signature || user?.signature || '',
        technicianName: user?.name || '',
        customerSignature: initialData.customer_signature || '',
        customerSignerName: getCustomerSignerNameFromInitialData(initialData),
        signatureMetadata: existingSignatureMetadata,
      };
    }

    return {
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
      technicianName: user?.name || '',
    };
  };

  const [workOrder, setWorkOrder] = useState<WorkOrder>(getInitialWorkOrderState);

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
  useEffect(() => {
    const calculated = calculateBillableHours(workOrder.arrivalTime, workOrder.completionTime);
    setWorkOrder(prev => ({ ...prev, calculatedHours: calculated }));
  }, [workOrder.arrivalTime, workOrder.completionTime]);

  return {
    workOrder,
    setWorkOrder,
    companyLocations,
    globalSettings,
    isEditMode,
    user,
    employeeProfile
  };
};
