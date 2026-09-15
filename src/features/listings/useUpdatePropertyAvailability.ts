import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Availability = Database['public']['Enums']['availability_status'];

interface Vars {
  propertyId: string;
  availability: Availability;
}

const LABEL: Record<Availability, string> = {
  available: 'Listing marked as available',
  reserved: 'Listing marked as reserved',
  occupied: 'Listing marked as occupied',
};

export function useUpdatePropertyAvailability() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation<void, Error, Vars>({
    mutationFn: async ({ propertyId, availability }) => {
      const { error } = await supabase
        .from('properties')
        .update({ availability_status: availability })
        .eq('id', propertyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      toast({ title: LABEL[vars.availability] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['landlord-listings', user.id] });
      }
    },
    onError: (err) => {
      toast({ title: 'Could not update', description: err.message, variant: 'destructive' });
    },
  });
}
