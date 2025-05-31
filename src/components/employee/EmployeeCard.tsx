
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmployeeSignatureManagement } from './EmployeeSignatureManagement';
import { Mail, User, MapPin } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  location_name?: string;
  signature_data: string | null;
  signature_created_at: string | null;
  signature_updated_at: string | null;
}

interface EmployeeCardProps {
  employee: Employee;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'technician':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {employee.first_name} {employee.last_name}
          </span>
          <Badge variant={getRoleBadgeVariant(employee.role)}>
            {employee.role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          {employee.email}
        </div>
        
        {employee.location_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {employee.location_name}
          </div>
        )}
        
        <div className="pt-2">
          <EmployeeSignatureManagement employee={employee} />
        </div>
      </CardContent>
    </Card>
  );
};
