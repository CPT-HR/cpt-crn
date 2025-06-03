
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { WorkOrder, WorkOrderRecord, Employee, Material, WorkItem } from '@/types/workOrder';
import { formatMinutesToDisplay, formatTimestampForSignature } from './workOrderParsers';

// Employee name formatting
export const getEmployeeFullName = (employee: Employee | { first_name: string; last_name: string }): string => {
  return `${employee.first_name} ${employee.last_name}`;
};

// Work order status logic
export const getWorkOrderStatus = (workOrder: { technician_signature: string | null }): { 
  label: string; 
  variant: "default" | "secondary" 
} => {
  return workOrder.technician_signature 
    ? { label: "Završen", variant: "default" }
    : { label: "U tijeku", variant: "secondary" };
};

// Permission check for editing work orders
export const canUserEditWorkOrder = (
  userRole: string | undefined,
  workOrderEmployeeId: string,
  currentEmployeeId: string | undefined
): boolean => {
  return userRole === 'admin' || workOrderEmployeeId === currentEmployeeId;
};

// Parse materials from database format to UI format
export const parseMaterials = (materials: any): Material[] => {
  if (!materials) return [];
  if (Array.isArray(materials)) {
    return materials.map((material, index) => ({
      id: material.id || index.toString(),
      name: material.name || '',
      quantity: material.quantity?.toString() || '',
      unit: material.unit || ''
    }));
  }
  return [];
};

// Parse text to work items
export const parseTextToWorkItems = (text: string | null): WorkItem[] => {
  if (!text) return [];
  return [{ id: '1', text }];
};

// Transform work order from database format to PDF format
export const transformWorkOrderForPDF = (workOrder: WorkOrderRecord): WorkOrder => {
  return {
    id: workOrder.order_number,
    clientCompanyName: workOrder.client_company_name,
    clientCompanyAddress: workOrder.client_company_address,
    clientOib: workOrder.client_oib,
    clientFirstName: workOrder.client_first_name,
    clientLastName: workOrder.client_last_name,
    clientMobile: workOrder.client_mobile,
    clientEmail: workOrder.client_email,
    orderForCustomer: workOrder.order_for_customer || false,
    customerCompanyName: workOrder.customer_company_name || '',
    customerCompanyAddress: workOrder.customer_company_address || '',
    customerOib: workOrder.customer_oib || '',
    customerFirstName: workOrder.customer_first_name || '',
    customerLastName: workOrder.customer_last_name || '',
    customerMobile: workOrder.customer_mobile || '',
    customerEmail: workOrder.customer_email || '',
    description: parseTextToWorkItems(workOrder.description),
    foundCondition: parseTextToWorkItems(workOrder.found_condition),
    performedWork: parseTextToWorkItems(workOrder.performed_work),
    technicianComment: parseTextToWorkItems(workOrder.technician_comment),
    materials: parseMaterials(workOrder.materials),
    date: format(new Date(workOrder.date), 'dd.MM.yyyy', { locale: hr }),
    arrivalTime: workOrder.arrival_time || '',
    completionTime: workOrder.completion_time || '',
    calculatedHours: formatMinutesToDisplay(workOrder.hours),
    fieldTrip: (workOrder.distance && parseFloat(workOrder.distance.toString()) > 0) || false,
    distance: workOrder.distance ? workOrder.distance.toString() : '',
    technicianSignature: workOrder.technician_signature || '',
    technicianName: workOrder.employee_profiles 
      ? getEmployeeFullName(workOrder.employee_profiles)
      : '',
    customerSignature: workOrder.customer_signature || '',
    customerSignerName: '',
    signatureMetadata: {
      timestamp: workOrder.signature_timestamp ? formatTimestampForSignature(workOrder.signature_timestamp) : undefined,
      coordinates: workOrder.signature_coordinates ? {
        latitude: (workOrder.signature_coordinates as any).x || 0,
        longitude: (workOrder.signature_coordinates as any).y || 0
      } : undefined,
      address: workOrder.signature_address || undefined
    }
  };
};

// Handle PDF download with error handling
export const handleWorkOrderPDFDownload = async (
  workOrder: WorkOrderRecord,
  generatePDF: (data: WorkOrder) => Promise<void>,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) => {
  try {
    const pdfData = transformWorkOrderForPDF(workOrder);
    await generatePDF(pdfData);
    onSuccess("PDF je uspješno preuzet");
  } catch (error) {
    console.error('Error generating PDF:', error);
    onError("Greška pri generiranju PDF-a");
  }
};
