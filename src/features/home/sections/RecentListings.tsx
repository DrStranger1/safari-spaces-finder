import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import type { HomeFeed } from '@/features/home/useHomeFeed';

interface RecentListingsProps {
  feed?: HomeFeed;
  favorites: Set<string>;
  onToggleFavorite?: (propertyId: string) => void;
  onContact: (propertyId: string) => void;
  onReport: (propertyId: string) => void;
}

export default function RecentListings({
  feed,
  favorites,
  onToggleFavorite,
  onContact,
  onReport,
}: RecentListingsProps) {
  const navigate = useNavigate();
  const recent = feed?.recent ?? [];
  if (recent.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">🕐 Just listed</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Recently added</h2>
          <p className="text-muted-foreground mt-2">Fresh listings posted in the last few days</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/search')}>
          See more <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recent.map(p => (
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
    </section>
  );
}
