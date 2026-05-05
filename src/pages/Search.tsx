import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import ReportDialog from '@/components/ReportDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Loader2, SlidersHorizontal } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

const districts = ['All', 'Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni', 'Mbezi', 'Sinza', 'Kijitonyama'];
const types = ['all', 'house', 'apartment', 'room', 'office', 'commercial'] as const;
const MAX_PRICE = 3000000;
const PRICE_PRESETS = [
  { label: 'Under 100k', max: 100000 },
  { label: 'Under 250k', max: 250000 },
  { label: 'Under 500k', max: 500000 },
  { label: 'Under 1M', max: 1000000 },
];
const QUICK_AMENITIES = ['Self-contained', 'Near main road', 'Parking', 'Water tank', 'Security'];

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
  const [reportId, setReportId] = useState<string | null>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || 'All');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || MAX_PRICE);
  const [quickFilter, setQuickFilter] = useState<string | null>(searchParams.get('feature'));

  const fetchProperties = async () => {
    setLoading(true);
    let q = supabase.from('properties').select('*').eq('status', 'active');

    if (query) q = q.or(`title.ilike.%${query}%,address.ilike.%${query}%,district.ilike.%${query}%`);
    if (district && district !== 'All') q = q.eq('district', district);
    if (type && type !== 'all') q = q.eq('property_type', type as any);
    if (maxPrice && maxPrice < MAX_PRICE) q = q.lte('price', maxPrice);
    if (quickFilter) q = q.or(`title.ilike.%${quickFilter}%,description.ilike.%${quickFilter}%`);

    q = q.order('is_promoted', { ascending: false }).order('is_featured', { ascending: false }).order('created_at', { ascending: false });

    const { data } = await q;
    setProperties(data || []);

    if (data && data.length > 0) {
      const ids = data.map(p => p.id);
      const { data: imgs } = await supabase.from('property_images').select('property_id, image_url').in('property_id', ids).order('display_order', { ascending: true });
      const imgMap: Record<string, string> = {};
      imgs?.forEach(img => { if (!imgMap[img.property_id]) imgMap[img.property_id] = img.image_url; });
      setImages(imgMap);

      const ownerIds = [...new Set(data.map(p => p.owner_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, phone, is_verified').in('user_id', ownerIds);
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
    if (maxPrice < MAX_PRICE) params.set('maxPrice', String(maxPrice));
    if (quickFilter) params.set('feature', quickFilter);
    setSearchParams(params);
  };

  const setDistrictAndApply = (d: string) => {
    setDistrict(d);
    const params = new URLSearchParams(searchParams);
    if (d === 'All') params.delete('district'); else params.set('district', d);
    setSearchParams(params);
  };

  const setPricePreset = (max: number) => {
    setMaxPrice(max);
    const params = new URLSearchParams(searchParams);
    params.set('maxPrice', String(max));
    setSearchParams(params);
  };

  const setFeature = (f: string) => {
    const next = quickFilter === f ? null : f;
    setQuickFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('feature', next); else params.delete('feature');
    setSearchParams(params);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-TZ').format(n);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 mb-4">
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

        {/* Quick location chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
          {districts.map(d => (
            <button
              key={d}
              onClick={() => setDistrictAndApply(d)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                district === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Price presets + feature chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRICE_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setPricePreset(p.max)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                maxPrice === p.max ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="w-px bg-border mx-1" />
          {QUICK_AMENITIES.map(f => (
            <button
              key={f}
              onClick={() => setFeature(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                quickFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-lg border bg-card animate-fade-in">
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
              <label className="text-sm font-medium mb-2 block">Max Price: TZS {formatPrice(maxPrice)}</label>
              <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} min={50000} max={MAX_PRICE} step={50000} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl px-6">
            <p className="text-foreground text-lg font-semibold mb-2">No properties match your filters</p>
            <p className="text-muted-foreground mb-6">Try nearby areas like Kinondoni or Sinza, or increase your budget.</p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Button variant="outline" onClick={() => { setDistrict('All'); setType('all'); setMaxPrice(MAX_PRICE); setQuery(''); setQuickFilter(null); setSearchParams({}); }}>Reset filters</Button>
              <Button onClick={() => setDistrictAndApply('Kinondoni')}>Try Kinondoni</Button>
              <Button variant="outline" onClick={() => setDistrictAndApply('Sinza')}>Try Sinza</Button>
            </div>
            <div className="pt-4 border-t inline-block">
              <p className="text-sm text-muted-foreground mb-2">Are you a landlord?</p>
              <Button size="sm" onClick={() => window.location.assign('/dashboard/new-listing')}>Be the first to list in this area</Button>
            </div>
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
                  onReport={() => setReportId(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ReportDialog propertyId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </div>
  );
}
