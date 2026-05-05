import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Bed, Bath, Maximize, Phone, Mail, ArrowLeft, Heart, Hospital, Bus, ShoppingCart, Route, Loader2, ShieldCheck, MessageCircle, Sparkles, TrendingDown, Flag, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReportDialog from '@/components/ReportDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];
type NearbyService = Database['public']['Tables']['nearby_services']['Row'];

const serviceIcons: Record<string, any> = {
  hospital: Hospital,
  transport: Bus,
  market: ShoppingCart,
  road: Route,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [services, setServices] = useState<NearbyService[]>([]);
  const [owner, setOwner] = useState<{ full_name: string; phone: string | null; is_verified: boolean } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [areaAvg, setAreaAvg] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [{ data: prop }, { data: imgs }, { data: svc }] = await Promise.all([
        supabase.from('properties').select('*').eq('id', id).single(),
        supabase.from('property_images').select('image_url').eq('property_id', id).order('display_order'),
        supabase.from('nearby_services').select('*').eq('property_id', id),
      ]);
      setProperty(prop);
      setImages(imgs?.map(i => i.image_url) || []);
      setServices(svc || []);

      if (prop) {
        const { data: ownerProfile } = await supabase.from('profiles').select('full_name, phone, is_verified').eq('user_id', prop.owner_id).single();
        setOwner(ownerProfile);

        // Area average for same district + type
        const { data: comps } = await supabase
          .from('properties')
          .select('price')
          .eq('status', 'active')
          .eq('district', prop.district)
          .eq('property_type', prop.property_type);
        if (comps && comps.length > 1) {
          const avg = comps.reduce((s, c) => s + Number(c.price), 0) / comps.length;
          setAreaAvg(avg);
        }
      }

      if (user) {
        const { data: fav } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('property_id', id).maybeSingle();
        setIsFavorite(!!fav);
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: id });
    }
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-TZ').format(n);

  const whatsappUrl = owner?.phone
    ? `https://wa.me/${owner.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hi, I saw your property in ${property?.district} on Pango (${property?.title}). Is it still available?`)}`
    : null;

  const dealPct = areaAvg && property ? Math.round((1 - Number(property.price) / areaAvg) * 100) : 0;
  const isGoodDeal = dealPct >= 10;
  const reportCount = (property as any)?.report_count ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg mb-4">Property not found.</p>
          <Button asChild variant="outline"><Link to="/search"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Search</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <img src={images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No images</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & details */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl md:text-3xl font-bold">{property.title}</h1>
                    {property.is_promoted && (
                      <Badge className="bg-amber-500 text-white border-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Promoted
                      </Badge>
                    )}
                    {owner?.is_verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1 cursor-help">
                              <ShieldCheck className="w-3 h-3" /> Verified by Pango
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Verified landlords have confirmed phone numbers and submitted identity details.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {isGoodDeal && (
                      <Badge className="bg-blue-600 text-white border-0 flex items-center gap-1 shadow">
                        <TrendingDown className="w-3 h-3" /> Good Deal · {dealPct}% below {property.district} average
                      </Badge>
                    )}
                    {reportCount === 0 && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> No issues reported
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {property.address}, {property.district}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {new Date(property.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {owner?.is_verified && <span className="text-emerald-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Recently verified</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {user && (
                    <Button variant="outline" size="icon" onClick={toggleFavorite}>
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => setReportOpen(true)} aria-label="Report listing">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-sm py-1 px-3 capitalize">{property.property_type}</Badge>
                {property.bedrooms > 0 && <Badge variant="outline" className="text-sm py-1 px-3"><Bed className="w-3.5 h-3.5 mr-1" /> {property.bedrooms} Bed</Badge>}
                {property.bathrooms > 0 && <Badge variant="outline" className="text-sm py-1 px-3"><Bath className="w-3.5 h-3.5 mr-1" /> {property.bathrooms} Bath</Badge>}
                {property.area_sqm && <Badge variant="outline" className="text-sm py-1 px-3"><Maximize className="w-3.5 h-3.5 mr-1" /> {property.area_sqm} m²</Badge>}
              </div>

              {areaAvg !== null && (
                <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                  <span className="text-muted-foreground">Average rent for {property.property_type}s in {property.district}: </span>
                  <span className="font-semibold text-foreground">TZS {formatPrice(Math.round(areaAvg))}/mo</span>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <h3 className="font-display text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map(a => <Badge key={a} variant="outline">{a}</Badge>)}
                  </div>
                </div>
              )}

              {services.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3">Nearby Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map(s => {
                      const Icon = serviceIcons[s.service_type] || MapPin;
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            {s.distance_km && <p className="text-xs text-muted-foreground">{s.distance_km} km away</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map */}
              {property.latitude && property.longitude && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3">Location</h3>
                  <div className="aspect-video rounded-xl overflow-hidden border">
                    <iframe
                      title="Property Location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01}%2C${property.latitude - 0.01}%2C${property.longitude + 0.01}%2C${property.latitude + 0.01}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-3xl font-bold text-primary">
                  TZS {formatPrice(property.price)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                {owner && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        {owner.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{owner.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {owner.is_verified ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Verified landlord
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unverified</span>
                          )}
                        </div>
                        {owner.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {owner.phone.slice(0, 5)}••••{owner.phone.slice(-2)} · Sign in to view full
                          </p>
                        )}
                      </div>
                    </div>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" /> WhatsApp Landlord
                      </a>
                    )}
                    {owner.phone && user && (
                      <Button className="w-full" asChild>
                        <a href={`tel:${owner.phone}`}><Phone className="w-4 h-4 mr-2" /> Call {owner.phone}</a>
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`mailto:?subject=Inquiry about ${property.title}`}><Mail className="w-4 h-4 mr-2" /> Send Email</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ReportDialog propertyId={property.id} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
