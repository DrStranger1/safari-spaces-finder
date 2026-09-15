import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPropertiesWithImages, type PropertyWithImage,
} from '@/features/listings/fetchPropertiesWithImages';

const RECENT_LIMIT = 12;
const FETCH_BUFFER = 60; // pull more rows to dedupe by property_id

export function useRecentlyViewed() {
  const { user } = useAuth();

  return useQuery<PropertyWithImage[]>({
    queryKey: ['recently-viewed', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from('property_views')
        .select('property_id, created_at')
        .eq('viewer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(FETCH_BUFFER);

      if (!rows || rows.length === 0) return [];

      // Dedupe by property_id, preserving most-recent order.
      const seen = new Set<string>();
      const ordered: string[] = [];
      for (const row of rows) {
        if (seen.has(row.property_id)) continue;
        seen.add(row.property_id);
        ordered.push(row.property_id);
        if (ordered.length >= RECENT_LIMIT) break;
      }

      return fetchPropertiesWithImages(ordered);
    },
  });
}
