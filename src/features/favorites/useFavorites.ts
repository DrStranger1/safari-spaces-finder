import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const favoritesKey = (userId: string | undefined) => ['favorites', userId ?? 'anon'] as const;

async function fetchFavorites(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', userId);
  return new Set(data?.map(f => f.property_id) ?? []);
}

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: favoritesKey(user?.id),
    queryFn: () => fetchFavorites(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = favoritesKey(user?.id);

  return useMutation({
    mutationFn: async ({
      propertyId,
      isFavorite,
    }: {
      propertyId: string;
      isFavorite: boolean;
    }) => {
      if (!user) throw new Error('not signed in');
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, property_id: propertyId });
      }
    },
    onMutate: async ({ propertyId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Set<string>>(key) ?? new Set<string>();
      const next = new Set(prev);
      if (isFavorite) next.delete(propertyId);
      else next.add(propertyId);
      queryClient.setQueryData(key, next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
