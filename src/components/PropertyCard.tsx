import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Bed, Bath, Heart, ShieldCheck, MessageCircle, Sparkles, Flag } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertyCardProps {
  property: Property;
  imageUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  ownerPhone?: string;
  isVerified?: boolean;
  onReport?: () => void;
}

export default function PropertyCard({ property, imageUrl, isFavorite, onToggleFavorite, ownerPhone, isVerified, onReport }: PropertyCardProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-TZ').format(price);

  const whatsappUrl = ownerPhone
    ? `https://wa.me/${ownerPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hi, I saw your property in ${property.district} on Pango (${property.title}). Is it still available?`)}`
    : null;

  const reportCount = (property as any).report_count ?? 0;

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="w-8 h-8" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {property.is_promoted && (
              <Badge className="bg-amber-500 text-white border-0 flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3" /> Promoted
              </Badge>
            )}
          </div>

          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
              aria-label="Toggle favorite"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
          )}

          <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
            <Badge className="bg-primary text-primary-foreground border-0 capitalize">
              {property.property_type}
            </Badge>
            {isVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1 cursor-help">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Verified by Pango — landlord has confirmed phone number and submitted ID.
                </TooltipContent>
              </Tooltip>
            )}
            {property.is_featured && (
              <Badge className="bg-rose-500 text-white border-0">🔥 Featured</Badge>
            )}
          </div>
        </div>

        <Link to={`/property/${property.id}`}>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{property.title}</h3>
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
            <div className="flex items-end justify-between pt-1">
              <p className="text-2xl font-extrabold text-primary leading-none">
                TZS {formatPrice(property.price)}
                <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
              </p>
              {reportCount === 0 && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> No issues
                </span>
              )}
            </div>
          </CardContent>
        </Link>

        <div className="px-4 pb-4 pt-0 flex items-center gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          ) : (
            <div className="flex-1" />
          )}
          {onReport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); onReport(); }}
                  className="w-10 h-10 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Report listing"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Report this listing</TooltipContent>
            </Tooltip>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
