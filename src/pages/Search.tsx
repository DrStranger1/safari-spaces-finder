import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Loader2, SlidersHorizontal } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

const districts = ['All', 'Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni'];
const types = ['all', 'house', 'apartment', 'room', 'office', 'commercial'] as const;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [ownerPhones, setOwnerPhones] = useState<Record<string, string>>({});
  const [verifiedOwners, setVerifiedOwners] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || 'All');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const fetchProperties = async () => {
    setLoading(true);
    let q = supabase.from('properties').select('*').eq('status', 'active');

    if (query) q = q.or(`title.ilike.%${query}%,address.ilike.%${query}%,district.ilike.%${query}%`);
    if (district && district !== 'All') q = q.eq('district', district);
    if (type && type !== 'all') q = q.eq('property_type', type as any);
    if (maxPrice) q = q.lte('price', Number(maxPrice));

    q = q.order('created_at', { ascending: false });

    const { data } = await q;
    setProperties(data || []);

    if (data && data.length > 0) {
      const ids = data.map(p => p.id);
      const { data: imgs } = await supabase
        .from('property_images')
        .select('property_id, image_url')
        .in('property_id', ids)
        .order('display_order', { ascending: true });

      const imgMap: Record<string, string> = {};
      imgs?.forEach(img => { if (!imgMap[img.property_id]) imgMap[img.property_id] = img.image_url; });
      setImages(imgMap);

      // Fetch owner info
      const ownerIds = [...new Set(data.map(p => p.owner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, phone, is_verified')
        .in('user_id', ownerIds);

      const phones: Record<string, string> = {};
      const verified = new Set<string>();
      profiles?.forEach(p => {
        if (p.phone) phones[p.user_id] = p.phone;
        if (p.is_verified) verified.add(p.user_id);
      });
      setOwnerPhones(phones);
      setVerifiedOwners(verified);
    }

    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
    setFavorites(new Set(data?.map(f => f.property_id)));
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) return;
    if (favorites.has(propertyId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
      setFavorites(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
      setFavorites(prev => new Set(prev).add(propertyId));
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFavorites();
  }, [searchParams, user]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (district !== 'All') params.set('district', district);
    if (type !== 'all') params.set('type', type);
    if (maxPrice) params.set('maxPrice', maxPrice);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <Button onClick={applyFilters}>Search</Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-lg border bg-card animate-fade-in">
            <div>
              <label className="text-sm font-medium mb-1 block">District</label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Price (TZS)</label>
              <Input type="number" placeholder="e.g. 500000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{properties.length} properties found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  imageUrl={images[p.id]}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={user ? () => toggleFavorite(p.id) : undefined}
                  ownerPhone={ownerPhones[p.owner_id]}
                  isVerified={verifiedOwners.has(p.owner_id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
