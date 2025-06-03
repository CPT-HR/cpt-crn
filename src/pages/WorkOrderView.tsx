
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Download } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { formatMinutesToDisplay, formatTimestampForSignature } from '@/utils/workOrderParsers';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from '@/components/ui/sonner';
import { 
  getEmployeeFullName, 
  getWorkOrderStatus, 
  canUserEditWorkOrder,
  handleWorkOrderPDFDownload
} from '@/utils/workOrderHelpers';
import { WorkOrderRecord } from '@/types/workOrder';

const WorkOrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: employeeProfile } = useEmployeeProfile();

  const { data: workOrder, isLoading, error } = useQuery({
    queryKey: ['work-order', id],
    queryFn: async () => {
      if (!id) throw new Error('Work order ID is required');
      
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
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as WorkOrderRecord;
    },
    enabled: !!id
  });

  const handleDownloadPDF = async () => {
    if (!workOrder) return;
    
    await handleWorkOrderPDFDownload(
      workOrder,
      generatePDF,
      (message) => toast(message),
      (message) => toast(message)
    );
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center">
          <div>Učitavanje radnog naloga...</div>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="container py-6">
        <div className="text-red-500">
          Greška pri učitavanju radnog naloga: {error?.message || 'Radni nalog nije pronađen'}
        </div>
      </div>
    );
  }

  const canEdit = canUserEditWorkOrder(user?.role, workOrder.employee_profile_id, employeeProfile?.id);
  const status = getWorkOrderStatus(workOrder);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/work-orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Povratak
          </Button>
          <h1 className="text-3xl font-bold">Radni nalog {workOrder.order_number}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={() => navigate(`/work-orders/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Uredi
            </Button>
          )}
          {workOrder.technician_signature && (
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Osnovne informacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Datum:</span> {format(new Date(workOrder.date), 'dd.MM.yyyy', { locale: hr })}
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge variant={status.variant} className="ml-2">
                {status.label}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Tehničar:</span> {workOrder.employee_profiles 
                ? getEmployeeFullName(workOrder.employee_profiles)
                : 'N/A'
              }
            </div>
            {workOrder.arrival_time && (
              <div>
                <span className="font-medium">Vrijeme dolaska:</span> {workOrder.arrival_time}
              </div>
            )}
            {workOrder.completion_time && (
              <div>
                <span className="font-medium">Vrijeme završetka:</span> {workOrder.completion_time}
              </div>
            )}
            {workOrder.hours && (
              <div>
                <span className="font-medium">Obračunsko vrijeme:</span> {formatMinutesToDisplay(workOrder.hours)}
              </div>
            )}
            {workOrder.distance && (
              <div>
                <span className="font-medium">Udaljenost:</span> {workOrder.distance} km
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podaci naručitelja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="font-medium">Tvrtka:</span> {workOrder.client_company_name}</div>
            <div><span className="font-medium">Adresa:</span> {workOrder.client_company_address}</div>
            <div><span className="font-medium">OIB:</span> {workOrder.client_oib}</div>
            <div><span className="font-medium">Kontakt:</span> {workOrder.client_first_name} {workOrder.client_last_name}</div>
            <div><span className="font-medium">Telefon:</span> {workOrder.client_mobile}</div>
            <div><span className="font-medium">Email:</span> {workOrder.client_email}</div>
          </CardContent>
        </Card>

        {workOrder.order_for_customer && (
          <Card>
            <CardHeader>
              <CardTitle>Podaci korisnika</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><span className="font-medium">Tvrtka:</span> {workOrder.customer_company_name}</div>
              <div><span className="font-medium">Adresa:</span> {workOrder.customer_company_address}</div>
              <div><span className="font-medium">OIB:</span> {workOrder.customer_oib}</div>
              <div><span className="font-medium">Kontakt:</span> {workOrder.customer_first_name} {workOrder.customer_last_name}</div>
              <div><span className="font-medium">Telefon:</span> {workOrder.customer_mobile}</div>
              <div><span className="font-medium">Email:</span> {workOrder.customer_email}</div>
            </CardContent>
          </Card>
        )}

        {workOrder.description && (
          <Card>
            <CardHeader>
              <CardTitle>Opis problema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap">{workOrder.description}</pre>
            </CardContent>
          </Card>
        )}

        {workOrder.found_condition && (
          <Card>
            <CardHeader>
              <CardTitle>Zatečeno stanje</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap">{workOrder.found_condition}</pre>
            </CardContent>
          </Card>
        )}

        {workOrder.performed_work && (
          <Card>
            <CardHeader>
              <CardTitle>Izvršeni radovi</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap">{workOrder.performed_work}</pre>
            </CardContent>
          </Card>
        )}

        {workOrder.technician_comment && (
          <Card>
            <CardHeader>
              <CardTitle>Napomene tehničara</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap">{workOrder.technician_comment}</pre>
            </CardContent>
          </Card>
        )}

        {workOrder.materials && Array.isArray(workOrder.materials) && workOrder.materials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Utrošeni materijal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workOrder.materials.map((material: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{material.name}</span>
                    <span>{material.quantity} {material.unit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Potpisi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Potpis tehničara</h4>
              {workOrder.technician_signature ? (
                <img 
                  src={workOrder.technician_signature} 
                  alt="Potpis tehničara" 
                  className="max-h-32 border rounded"
                />
              ) : (
                <div className="text-gray-500">Nema potpisa</div>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">Potpis klijenta</h4>
              {workOrder.customer_signature ? (
                <div className="space-y-2">
                  <img 
                    src={workOrder.customer_signature} 
                    alt="Potpis klijenta" 
                    className="max-h-32 border rounded"
                  />
                  {(workOrder.signature_timestamp || workOrder.signature_coordinates || workOrder.signature_address) && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {workOrder.signature_timestamp && (
                        <p className="font-medium">
                          Datum i vrijeme: {formatTimestampForSignature(workOrder.signature_timestamp)}
                        </p>
                      )}
                      {workOrder.signature_coordinates && typeof workOrder.signature_coordinates === 'object' && workOrder.signature_coordinates !== null && (
                        <p>
                          Koordinate: {(workOrder.signature_coordinates as any).x?.toFixed(6)}, {(workOrder.signature_coordinates as any).y?.toFixed(6)}
                        </p>
                      )}
                      {workOrder.signature_address && (
                        <p>
                          Lokacija: {workOrder.signature_address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Nema potpisa</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkOrderView;
