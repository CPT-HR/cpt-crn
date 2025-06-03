
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TableName = 'employee_profiles' | 'company_locations' | 'vehicles' | 'global_settings' | 'work_orders';

interface CrudOptions<T> {
  tableName: TableName;
  onSuccess?: (action: 'create' | 'update' | 'delete', data?: T) => void;
  onError?: (error: Error, action: 'create' | 'update' | 'delete') => void;
}

export const useCrudOperations = <T extends { id: string }>({
  tableName,
  onSuccess,
  onError
}: CrudOptions<T>) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (data: Omit<T, 'id'>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .insert(data);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Podaci su uspješno spremljeni",
      });

      onSuccess?.('create');
    } catch (error: any) {
      console.error(`Error creating ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: error.message || "Došlo je do greške prilikom spremanja",
      });
      onError?.(error, 'create');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Omit<T, 'id'>>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Podaci su uspješno ažurirani",
      });

      onSuccess?.('update');
    } catch (error: any) {
      console.error(`Error updating ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: error.message || "Došlo je do greške prilikom ažuriranja",
      });
      onError?.(error, 'update');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Podaci su uspješno obrisani",
      });

      onSuccess?.('delete');
    } catch (error: any) {
      console.error(`Error deleting ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: error.message || "Došlo je do greške prilikom brisanja",
      });
      onError?.(error, 'delete');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleCreate,
    handleUpdate,
    handleDelete
  };
};
