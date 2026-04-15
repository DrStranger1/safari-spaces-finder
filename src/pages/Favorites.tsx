import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

export default function Favorites() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: favs } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
      const ids = favs?.map(f => f.property_id) || [];
      setFavoriteIds(new Set(ids));

      if (ids.length > 0) {
        const { data } = await supabase.from('properties').select('*').in('id', ids);
        setProperties(data || []);

        const { data: imgs } = await supabase.from('property_images').select('property_id, image_url').in('property_id', ids).order('display_order');
        const imgMap: Record<string, string> = {};
        imgs?.forEach(img => { if (!imgMap[img.property_id]) imgMap[img.property_id] = img.image_url; });
        setImages(imgMap);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const removeFavorite = async (propertyId: string) => {
    if (!user) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
    setFavoriteIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
    setProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Saved Properties</h1>
        {properties.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No saved properties yet.</p>
            <Button onClick={() => navigate('/search')}>Browse Properties</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                imageUrl={images[p.id]}
                isFavorite={true}
                onToggleFavorite={() => removeFavorite(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
