import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type InquiryRow = Database['public']['Tables']['inquiries']['Row'];

export interface CreateInquiryInput {
  propertyId: string;
  message: string;
  moveInDate?: string | null;
  partySize?: number | null;
}

export function useCreateInquiry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<InquiryRow, Error, CreateInquiryInput>({
    mutationFn: async ({ propertyId, message, moveInDate, partySize }) => {
      if (!user) throw new Error('Sign in required to send an inquiry.');

      // landlord_id is set by the BEFORE INSERT trigger; we pass a placeholder
      // so the typed Insert shape is satisfied — the DB overwrites it.
      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          property_id: propertyId,
          renter_id: user.id,
          landlord_id: user.id,
          message,
          move_in_date: moveInDate ?? null,
          party_size: partySize ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as InquiryRow;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['inquiries', 'renter', user.id] });
      }
    },
  });
}
