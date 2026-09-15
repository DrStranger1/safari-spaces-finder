import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type VerificationRequest = Database['public']['Tables']['verification_requests']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type AdminVerificationRow = VerificationRequest & {
  profile: Pick<ProfileRow, 'full_name' | 'phone'> | null;
};

const queueKey = ['admin', 'verification-queue'] as const;

export function useAdminVerificationQueue() {
  return useQuery<AdminVerificationRow[]>({
    queryKey: queueKey,
    queryFn: async () => {
      const { data: reqs, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      if (!reqs || reqs.length === 0) return [];

      const userIds = [...new Set(reqs.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);
      const map = new Map(
        profiles?.map(p => [p.user_id, { full_name: p.full_name, phone: p.phone }]) ?? [],
      );
      return reqs.map(r => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });
}

interface DecisionVars {
  requestId: string;
  reviewNotes?: string;
}

export function useApproveVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, DecisionVars>({
    mutationFn: async ({ requestId, reviewNotes }) => {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewer_id: user?.id ?? null,
          review_notes: reviewNotes ?? '',
        })
        .eq('id', requestId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Landlord verified' });
      queryClient.invalidateQueries({ queryKey: queueKey });
    },
    onError: (err) =>
      toast({ title: 'Could not approve', description: err.message, variant: 'destructive' }),
  });
}

export function useRejectVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, DecisionVars>({
    mutationFn: async ({ requestId, reviewNotes }) => {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewer_id: user?.id ?? null,
          review_notes: reviewNotes ?? '',
        })
        .eq('id', requestId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Verification rejected' });
      queryClient.invalidateQueries({ queryKey: queueKey });
    },
    onError: (err) =>
      toast({ title: 'Could not reject', description: err.message, variant: 'destructive' }),
  });
}
