import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

export type HomeFeed = {
  featured: Property[];
  recent: Property[];
  images: Record<string, string>;
  ownerPhones: Record<string, string>;
  verifiedOwners: Set<string>;
  stats: { properties: number; landlords: number; districts: number };
};

const HOME_DISTRICT_COUNT = 8;

async function fetchHomeFeed(): Promise<HomeFeed> {
  const [
    { data: featuredData },
    { data: recentData },
    { count: propCount },
    { count: landlordCount },
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .neq('availability_status', 'occupied')
      .eq('is_featured', true)
      .order('is_promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .neq('availability_status', 'occupied')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('availability_status', 'occupied'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true),
  ]);

  let featured = featuredData ?? [];
  const recent = recentData ?? [];

  // Backfill featured with most-recent if fewer than 6 featured exist
  if (featured.length < 6 && recent.length > 0) {
    const ids = new Set(featured.map(p => p.id));
    featured = [...featured, ...recent.filter(p => !ids.has(p.id))].slice(0, 6);
  }

  const allProps = [...featured, ...recent];
  const images: Record<string, string> = {};
  const ownerPhones: Record<string, string> = {};
  const verifiedOwners = new Set<string>();

  if (allProps.length > 0) {
    const propertyIds = [...new Set(allProps.map(p => p.id))];
    const ownerIds = [...new Set(allProps.map(p => p.owner_id))];

    const [{ data: imgs }, { data: profiles }] = await Promise.all([
      supabase
        .from('property_images')
        .select('property_id, image_url')
        .in('property_id', propertyIds)
        .order('display_order', { ascending: true }),
      supabase
        .from('profiles')
        .select('user_id, phone, is_verified')
        .in('user_id', ownerIds),
    ]);

    imgs?.forEach(img => {
      if (!images[img.property_id]) images[img.property_id] = img.image_url;
    });
    profiles?.forEach(p => {
      if (p.phone) ownerPhones[p.user_id] = p.phone;
      if (p.is_verified) verifiedOwners.add(p.user_id);
    });
  }

  return {
    featured,
    recent,
    images,
    ownerPhones,
    verifiedOwners,
    stats: {
      properties: propCount ?? 0,
      landlords: landlordCount ?? 0,
      districts: HOME_DISTRICT_COUNT,
    },
  };
}

export const homeFeedQueryKey = ['home-feed'] as const;

export function useHomeFeed() {
  return useQuery({
    queryKey: homeFeedQueryKey,
    queryFn: fetchHomeFeed,
    staleTime: 60_000,
  });
}
