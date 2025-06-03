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

export interface WorkOrderRecord extends Omit<WorkOrder, 'date' | 'materials'> {
  date: string;
  materials: any;
  employee_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}
