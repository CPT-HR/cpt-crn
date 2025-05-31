
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PenTool, Trash2, Eye } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  signature_data: string | null;
  signature_created_at: string | null;
  signature_updated_at: string | null;
}

interface EmployeeSignatureManagementProps {
  employee: Employee;
}

const EmployeeSignatureManagement: React.FC<EmployeeSignatureManagementProps> = ({ employee }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  const updateSignatureMutation = useMutation({
    mutationFn: async ({ employeeId, signature }: { employeeId: string; signature: string | null }) => {
      console.log('Updating employee signature:', employeeId);
      const { error } = await supabase
        .from('employee_profiles')
        .update({
          signature_data: signature,
          signature_updated_at: signature ? new Date().toISOString() : null
        })
        .eq('id', employeeId);

      if (error) {
        console.error('Error updating signature:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Potpis je uspješno ažuriran",
      });
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
      setIsSignatureDialogOpen(false);
      setSignatureData('');
    },
    onError: (error) => {
      console.error('Error in updateSignatureMutation:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju potpisa",
      });
    }
  });

  const handleSaveSignature = () => {
    if (signatureData) {
      updateSignatureMutation.mutate({
        employeeId: employee.id,
        signature: signatureData
      });
    }
  };

  const handleDeleteSignature = () => {
    if (window.confirm('Jeste li sigurni da želite obrisati potpis?')) {
      updateSignatureMutation.mutate({
        employeeId: employee.id,
        signature: null
      });
    }
  };

  const getEmployeeFullName = () => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  return (
    <div className="flex items-center gap-2">
      {employee.signature_data ? (
        <>
          <Badge variant="secondary" className="flex items-center gap-1">
            <PenTool className="h-3 w-3" />
            Potpis postoji
          </Badge>
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Potpis - {getEmployeeFullName()}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img 
                    src={employee.signature_data} 
                    alt="Potpis zaposlenika" 
                    className="max-w-full h-auto"
                  />
                </div>
                {employee.signature_updated_at && (
                  <div className="text-sm text-muted-foreground">
                    Zadnji put ažuriran: {new Date(employee.signature_updated_at).toLocaleString('hr-HR')}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleDeleteSignature}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Badge variant="outline">Nema potpisa</Badge>
      )}

      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PenTool className="h-4 w-4 mr-1" />
            {employee.signature_data ? 'Promijeni' : 'Dodaj'} potpis
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {employee.signature_data ? 'Promijeni' : 'Dodaj'} potpis - {getEmployeeFullName()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Potpis:</Label>
            <SignaturePad
              onSignatureChange={setSignatureData}
              existingSignature={employee.signature_data}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsSignatureDialogOpen(false)}
              >
                Odustani
              </Button>
              <Button 
                onClick={handleSaveSignature}
                disabled={!signatureData || updateSignatureMutation.isPending}
              >
                {updateSignatureMutation.isPending ? 'Spremanje...' : 'Spremi potpis'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeSignatureManagement;
