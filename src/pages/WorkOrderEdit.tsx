
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import WorkOrderForm from '@/components/WorkOrderForm';

const WorkOrderEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: employeeProfile } = useEmployeeProfile();

  const { data: workOrder, isLoading, error } = useQuery({
    queryKey: ['work-order-edit', id],
    queryFn: async () => {
      if (!id) throw new Error('Work order ID is required');
      
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

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

  const canEdit = user?.role === 'admin' || workOrder.employee_profile_id === employeeProfile?.id;

  if (!canEdit) {
    return (
      <div className="container py-6">
        <div className="text-red-500">
          Nemate dozvolu za uređivanje ovog radnog naloga.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(`/work-orders/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Povratak
        </Button>
        <h1 className="text-3xl font-bold">Uredi radni nalog {workOrder.order_number}</h1>
      </div>

      <WorkOrderForm initialData={workOrder} />
    </div>
  );
};

export default WorkOrderEdit;
