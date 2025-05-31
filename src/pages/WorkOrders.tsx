
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

const WorkOrders: React.FC = () => {
  const { user } = useAuth();

  const { data: workOrders, isLoading, error } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      console.log('Fetching work orders...');
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          employee_profiles!work_orders_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching work orders:', error);
        throw error;
      }

      console.log('Fetched work orders:', data);
      return data;
    },
    enabled: !!user
  });

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
        <Badge variant="secondary">
          {workOrders?.length || 0} naloga
        </Badge>
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
                {workOrders.map((order) => (
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
                      {order.employee_profiles?.first_name} {order.employee_profiles?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.technician_signature ? "default" : "secondary"}>
                        {order.technician_signature ? "Završen" : "U tijeku"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-sm">
                          Pregled
                        </button>
                        {(user?.role === 'admin' || order.user_id === user?.id) && (
                          <button className="text-green-600 hover:underline text-sm">
                            Uredi
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrders;
