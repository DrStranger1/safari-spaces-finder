import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type VerificationRequest = Database['public']['Tables']['verification_requests']['Row'];

const key = (userId: string | undefined) => ['verification-request', userId ?? 'anon'] as const;

/** Returns the most recent verification request for the signed-in user, or null. */
export function useLatestVerificationRequest() {
  const { user } = useAuth();
  return useQuery<VerificationRequest | null>({
    queryKey: key(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
  });
}

export function useSubmitVerificationRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<VerificationRequest, Error, { notes: string }>({
    mutationFn: async ({ notes }) => {
      if (!user) throw new Error('Sign in required.');
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({ user_id: user.id, notes })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Verification request submitted',
        description: 'An admin will review within 24 hours.',
      });
      queryClient.invalidateQueries({ queryKey: key(user?.id) });
    },
    onError: (err) => {
      toast({
        title: 'Could not submit request',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
