import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

export interface PropertyWithImage {
  property: Property;
  imageUrl?: string;
}

/**
 * Fetches the given property ids plus their first image, preserving the
 * input order (so callers like RecentlyViewed can show last-viewed first).
 */
export async function fetchPropertiesWithImages(
  ids: string[],
): Promise<PropertyWithImage[]> {
  if (ids.length === 0) return [];

  const [{ data: props }, { data: imgs }] = await Promise.all([
    supabase.from('properties').select('*').in('id', ids),
    supabase
      .from('property_images')
      .select('property_id, image_url')
      .in('property_id', ids)
      .order('display_order', { ascending: true }),
  ]);

  const propMap = new Map(props?.map(p => [p.id, p]) ?? []);
  const imgMap: Record<string, string> = {};
  imgs?.forEach(i => {
    if (!imgMap[i.property_id]) imgMap[i.property_id] = i.image_url;
  });

  return ids
    .map(id => propMap.get(id))
    .filter((p): p is Property => !!p)
    .map(p => ({ property: p, imageUrl: imgMap[p.id] }));
}
