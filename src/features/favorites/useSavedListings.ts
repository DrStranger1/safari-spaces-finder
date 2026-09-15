import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPropertiesWithImages, type PropertyWithImage,
} from '@/features/listings/fetchPropertiesWithImages';

export function useSavedListings() {
  const { user } = useAuth();
  return useQuery<PropertyWithImage[]>({
    queryKey: ['saved-listings', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from('favorites')
        .select('property_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      const ids = favs?.map(f => f.property_id) ?? [];
      return fetchPropertiesWithImages(ids);
    },
  });
}
