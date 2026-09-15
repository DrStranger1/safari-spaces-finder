import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ListingPerformance {
  propertyId: string;
  title: string;
  district: string;
  views7d: number;
  views30d: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function useListingPerformance() {
  const { user } = useAuth();

  return useQuery<ListingPerformance[]>({
    queryKey: ['listing-performance', user?.id ?? 'anon'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, district')
        .eq('owner_id', user!.id);

      if (!properties || properties.length === 0) return [];
      const propIds = properties.map(p => p.id);

      const thirtyDaysAgo = new Date(Date.now() - 30 * DAY).toISOString();
      const { data: views } = await supabase
        .from('property_views')
        .select('property_id, created_at')
        .in('property_id', propIds)
        .gte('created_at', thirtyDaysAgo);

      const sevenDaysAgo = Date.now() - 7 * DAY;
      const counts = new Map<string, { v7: number; v30: number }>();
      for (const v of views ?? []) {
        const bucket = counts.get(v.property_id) ?? { v7: 0, v30: 0 };
        bucket.v30 += 1;
        if (new Date(v.created_at).getTime() >= sevenDaysAgo) bucket.v7 += 1;
        counts.set(v.property_id, bucket);
      }

      return properties.map(p => ({
        propertyId: p.id,
        title: p.title,
        district: p.district,
        views7d: counts.get(p.id)?.v7 ?? 0,
        views30d: counts.get(p.id)?.v30 ?? 0,
      }));
    },
  });
}
