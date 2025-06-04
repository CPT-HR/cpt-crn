import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Plus, Download } from 'lucide-react';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from '@/components/ui/sonner';
import { 
  getEmployeeFullName, 
  getWorkOrderStatus, 
  canUserEditWorkOrder,
  transformWorkOrderForPDF
} from '@/utils/workOrderHelpers';
import { WorkOrderRecord } from '@/types/workOrder';

const WorkOrders: React.FC = () => {
  const { user } = useAuth();
  const { data: employeeProfile } = useEmployeeProfile();
  const navigate = useNavigate();

  const { data: workOrders, isLoading, error } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      console.log('Fetching work orders with employee_profile_id join...');
      
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          employee_profiles!work_orders_employee_profile_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching work orders with join:', error);
        throw error;
      }

      console.log('Fetched work orders with employee_profile_id join:', data);
      return data as WorkOrderRecord[];
    },
    enabled: !!user
  });

  const handleDownloadPDF = async (order: WorkOrderRecord) => {
    try {
      const pdfData = transformWorkOrderForPDF(order);
      await generatePDF(pdfData);
      toast("PDF je uspješno preuzet");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast("Greška pri generiranju PDF-a");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center">
          <div>Učitavanje radnih naloga...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="text-red-500">Greška pri učitavanju: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Radni nalozi</h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {workOrders?.length || 0} naloga
          </Badge>
          <Button onClick={() => navigate('/new-work-order')}>
            <Plus className="mr-2 h-4 w-4" />
            Novi nalog
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pregled radnih naloga</CardTitle>
        </CardHeader>
        <CardContent>
          {!workOrders || workOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nema radnih naloga za prikaz
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broj naloga</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Klijent</TableHead>
                  <TableHead>Tehničar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => {
                  const status = getWorkOrderStatus(order);
                  const canEdit = canUserEditWorkOrder(user?.role, order.employee_profile_id, employeeProfile?.id);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.date), 'dd.MM.yyyy', { locale: hr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.client_company_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.client_first_name} {order.client_last_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.employee_profiles 
                          ? getEmployeeFullName(order.employee_profiles)
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/work-orders/${order.id}`)}
                          >
                            Pregled
                          </Button>
                          {canEdit && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/work-orders/${order.id}/edit`)}
                            >
                              Uredi
                            </Button>
                          )}
                          {order.technician_signature && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(order)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrders;
