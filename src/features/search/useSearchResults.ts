import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyType = Database['public']['Enums']['property_type'];

export interface SearchFilters {
  q?: string;
  district?: string;
  type?: string;
  maxPrice?: number;
  feature?: string;
}

export interface SearchResults {
  properties: Property[];
  images: Record<string, string>;
  verifiedOwners: Set<string>;
}

async function runSearch(filters: SearchFilters): Promise<SearchResults> {
  let query = supabase
    .from('properties')
    .select('*')
    .eq('status', 'active')
    .neq('availability_status', 'occupied');

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,address.ilike.%${filters.q}%,district.ilike.%${filters.q}%`,
    );
  }
  if (filters.district && filters.district !== 'All') {
    query = query.eq('district', filters.district);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('property_type', filters.type as PropertyType);
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.feature) {
    query = query.or(`title.ilike.%${filters.feature}%,description.ilike.%${filters.feature}%`);
  }

  query = query
    .order('is_promoted', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: properties, error } = await query;
  if (error) throw new Error(error.message);
  const rows = properties ?? [];

  const images: Record<string, string> = {};
  const verifiedOwners = new Set<string>();

  if (rows.length > 0) {
    const ids = rows.map(p => p.id);
    const ownerIds = [...new Set(rows.map(p => p.owner_id))];

    const [{ data: imgs }, { data: profiles }] = await Promise.all([
      supabase
        .from('property_images')
        .select('property_id, image_url')
        .in('property_id', ids)
        .order('display_order', { ascending: true }),
      supabase
        .from('profiles')
        .select('user_id, is_verified')
        .in('user_id', ownerIds),
    ]);

    imgs?.forEach(img => {
      if (!images[img.property_id]) images[img.property_id] = img.image_url;
    });
    profiles?.forEach(p => {
      if (p.is_verified) verifiedOwners.add(p.user_id);
    });
  }

  return { properties: rows, images, verifiedOwners };
}

export function useSearchResults(filters: SearchFilters) {
  return useQuery<SearchResults>({
    queryKey: ['search', filters],
    queryFn: () => runSearch(filters),
    staleTime: 30_000,
  });
}
