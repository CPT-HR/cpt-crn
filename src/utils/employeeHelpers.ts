
import { Employee } from '@/types/employee';

// Employee name formatting
export const getEmployeeFullName = (employee: Employee | { first_name: string; last_name: string }): string => {
  return `${employee.first_name} ${employee.last_name}`;
};

// Get employee display name with fallback
export const getEmployeeDisplayName = (employee: Employee | null): string => {
  if (!employee) return 'N/A';
  return getEmployeeFullName(employee);
};

// Format employee for select options
export const formatEmployeeOption = (employee: Employee) => ({
  value: employee.id,
  label: getEmployeeFullName(employee)
});

// Check if employee is active
export const isEmployeeActive = (employee: Employee): boolean => {
  return employee.active === true;
};

// Get employee role display text
export const getEmployeeRoleDisplay = (role: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'lead': 'Voditelj',
    'technician': 'Tehničar'
  };
  return roleMap[role] || role;
};
