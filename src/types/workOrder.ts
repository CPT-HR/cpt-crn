
import { SignatureMetadata } from '@/components/SignaturePad';

export interface WorkItem {
  id: string;
  text: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface WorkOrder {
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
  date: Date; // Changed from string to Date
  arrivalTime: string;
  completionTime: string;
  calculatedHours: string;
  fieldTrip: boolean;
  distance: string;
  technicianSignature: string;
  customerSignature: string;
  customerSignerName: string;
  technicianName: string;
  signatureMetadata?: SignatureMetadata;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  signature_data?: string | null;
  signature_created_at?: string | null;
  signature_updated_at?: string | null;
}

export interface WorkOrderRecord {
  id: string;
  order_number: string;
  date: string;
  client_company_name: string;
  client_first_name: string;
  client_last_name: string;
  client_company_address: string;
  client_oib: string;
  client_mobile: string;
  client_email: string;
  order_for_customer: boolean;
  customer_company_name: string;
  customer_company_address: string;
  customer_oib: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_mobile: string;
  customer_email: string;
  description: string;
  found_condition: string;
  performed_work: string;
  technician_comment: string;
  materials: any;
  arrival_time: string;
  completion_time: string;
  hours: number;
  distance: number;
  technician_signature: string | null;
  customer_signature: string | null;
  signature_timestamp: string | null;
  signature_coordinates: any;
  signature_address: string | null;
  employee_profile_id: string;
  employee_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}
