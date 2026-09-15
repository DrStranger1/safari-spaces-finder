import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

export const pendingPropertiesKey = ['admin', 'pending-properties'] as const;

export function useAdminPendingProperties() {
  return useQuery<Property[]>({
    queryKey: pendingPropertiesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useApproveProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('properties').update({ status: 'active' }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Property approved' });
      queryClient.invalidateQueries({ queryKey: pendingPropertiesKey });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
    },
  });
}

export function useRejectProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('properties').update({ status: 'rejected' }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Property rejected' });
      queryClient.invalidateQueries({ queryKey: pendingPropertiesKey });
    },
  });
}
