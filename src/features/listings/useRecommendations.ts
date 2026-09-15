import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPropertiesWithImages, type PropertyWithImage,
} from '@/features/listings/fetchPropertiesWithImages';

const LIMIT = 6;

/**
 * Lightweight recommendation engine: surfaces properties in districts the
 * renter has already favorited, excluding ones they already saved. Falls
 * back to featured listings when there are no favorites yet.
 */
export function useRecommendations() {
  const { user } = useAuth();

  return useQuery<PropertyWithImage[]>({
    queryKey: ['recommendations', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user!.id);
      const favIds = (favs ?? []).map(f => f.property_id);

      // Find the districts those favorites live in.
      let districts: string[] = [];
      if (favIds.length > 0) {
        const { data: favProps } = await supabase
          .from('properties')
          .select('district')
          .in('id', favIds);
        districts = [...new Set((favProps ?? []).map(p => p.district).filter(Boolean))];
      }

      let query = supabase
        .from('properties')
        .select('id')
        .eq('status', 'active')
        .neq('availability_status', 'occupied')
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(LIMIT);

      if (districts.length > 0) query = query.in('district', districts);
      if (favIds.length > 0) query = query.not('id', 'in', `(${favIds.join(',')})`);
      // Fall back to featured if no favorites yet.
      if (favIds.length === 0) query = query.eq('is_featured', true);

      const { data: rows } = await query;
      const ids = (rows ?? []).map(r => r.id);
      return fetchPropertiesWithImages(ids);
    },
  });
}
