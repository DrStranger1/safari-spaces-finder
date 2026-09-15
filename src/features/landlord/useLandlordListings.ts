import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Property = Database['public']['Tables']['properties']['Row'];

export const landlordListingsKey = (userId: string | undefined) =>
  ['landlord-listings', userId ?? 'anon'] as const;

export function useLandlordListings() {
  const { user } = useAuth();
  return useQuery<Property[]>({
    queryKey: landlordListingsKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useDeleteListing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (propertyId) => {
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Listing deleted' });
      queryClient.invalidateQueries({ queryKey: landlordListingsKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
    },
    onError: (err) => {
      toast({ title: 'Could not delete', description: err.message, variant: 'destructive' });
    },
  });
}
