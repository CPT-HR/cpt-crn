
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  user_role: 'admin' | 'lead' | 'technician';
  active: boolean;
  location_id?: string;
  vehicle_id?: string;
  manager_id?: string;
  signature_data?: string | null;
  signature_created_at?: string | null;
  signature_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeProfile extends Employee {
  employee_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_role: 'admin' | 'lead' | 'technician';
  active: boolean;
  location_id?: string;
  vehicle_id?: string;
  manager_id?: string;
}
