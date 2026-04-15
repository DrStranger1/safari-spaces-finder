import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Heart, ShieldCheck, MessageCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertyCardProps {
  property: Property;
  imageUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  ownerPhone?: string;
  isVerified?: boolean;
}

export default function PropertyCard({ property, imageUrl, isFavorite, onToggleFavorite, ownerPhone, isVerified }: PropertyCardProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-TZ').format(price);

  const whatsappUrl = ownerPhone
    ? `https://wa.me/${ownerPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your property: ${property.title} (${property.district})`)}`
    : null;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="w-8 h-8" />
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </button>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground border-0">
            {property.property_type}
          </Badge>
          {isVerified && (
            <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified
            </Badge>
          )}
        </div>
      </div>
      <Link to={`/property/${property.id}`}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{property.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> {property.district}, Dar es Salaam
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms}</span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              TZS {formatPrice(property.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
        </CardContent>
      </Link>
      {whatsappUrl && (
        <div className="px-4 pb-4 pt-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Landlord
          </a>
        </div>
      )}
    </Card>
  );
}
