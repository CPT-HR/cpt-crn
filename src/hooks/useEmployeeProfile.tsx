
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEmployeeProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching employee profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, user_role, phone, email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching employee profile:', error);
        throw error;
      }

      console.log('Fetched employee profile:', data);
      return data;
    },
    enabled: !!user?.id
  });
};
