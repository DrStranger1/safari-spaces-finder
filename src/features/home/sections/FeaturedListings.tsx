import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import type { HomeFeed } from '@/features/home/useHomeFeed';

interface FeaturedListingsProps {
  feed?: HomeFeed;
  loading: boolean;
  favorites: Set<string>;
  onToggleFavorite?: (propertyId: string) => void;
  onContact: (propertyId: string) => void;
  onReport: (propertyId: string) => void;
}

export default function FeaturedListings({
  feed,
  loading,
  favorites,
  onToggleFavorite,
  onContact,
  onReport,
}: FeaturedListingsProps) {
  const navigate = useNavigate();
  const featured = feed?.featured ?? [];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">🔥 Featured</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Popular in Dar es Salaam</h2>
          <p className="text-muted-foreground mt-2">Hand-picked verified properties from trusted landlords</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/search')}>
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : featured.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">No properties listed yet. Be the first landlord to list!</p>
          <Button className="mt-4" onClick={() => navigate('/signup?role=landlord')}>Start Listing</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              imageUrl={feed?.images[p.id]}
              isFavorite={favorites.has(p.id)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(p.id) : undefined}
              isVerified={feed?.verifiedOwners.has(p.owner_id)}
              onContact={() => onContact(p.id)}
              onReport={() => onReport(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
