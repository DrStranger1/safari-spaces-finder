import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import type { PropertyWithImage } from './fetchPropertiesWithImages';

interface PropertyListGridProps {
  items?: PropertyWithImage[];
  isLoading?: boolean;
  emptyState: ReactNode;
  favorites: Set<string>;
  onToggleFavorite: (propertyId: string) => void;
  onContact: (propertyId: string) => void;
  onReport: (propertyId: string) => void;
}

export default function PropertyListGrid({
  items, isLoading, emptyState, favorites,
  onToggleFavorite, onContact, onReport,
}: PropertyListGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(({ property, imageUrl }) => (
        <PropertyCard
          key={property.id}
          property={property}
          imageUrl={imageUrl}
          isFavorite={favorites.has(property.id)}
          onToggleFavorite={() => onToggleFavorite(property.id)}
          onContact={() => onContact(property.id)}
          onReport={() => onReport(property.id)}
        />
      ))}
    </div>
  );
}
