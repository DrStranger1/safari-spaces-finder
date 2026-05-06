import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, MapPin, ShieldCheck, Home, Building2, DoorOpen, Briefcase, ArrowRight,
  Loader2, Quote, MessageCircle, BadgeCheck, Wallet, Zap, Star, Sparkles, Heart,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import TypewriterText from '@/components/TypewriterText';
import PropertyCard from '@/components/PropertyCard';
import ReportDialog from '@/components/ReportDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'];

const propertyTypes = [
  { icon: DoorOpen, label: 'Rooms', sub: 'Single & shared', type: 'room', highlight: true },
  { icon: Building2, label: 'Apartments', sub: '1–3 bedroom', type: 'apartment' },
  { icon: Home, label: 'Houses', sub: 'Family homes', type: 'house' },
  { icon: Briefcase, label: 'Offices', sub: 'For business', type: 'office' },
];

const districts = [
  { name: 'Kinondoni', avg: '350k' },
  { name: 'Sinza', avg: '250k' },
  { name: 'Mbezi', avg: '300k' },
  { name: 'Ilala', avg: '400k' },
  { name: 'Temeke', avg: '180k' },
  { name: 'Ubungo', avg: '220k' },
  { name: 'Kigamboni', avg: '280k' },
  { name: 'Mikocheni', avg: '500k' },
];

const budgets = [
  { label: 'Under 100k', value: '100000' },
  { label: 'Under 250k', value: '250000' },
  { label: 'Under 500k', value: '500000' },
  { label: 'Under 1M', value: '1000000' },
  { label: 'Any budget', value: '' },
];

const trustPoints = [
  { icon: BadgeCheck, title: 'Verified landlords', desc: 'ID & phone confirmed by Pango.' },
  { icon: MessageCircle, title: 'Direct WhatsApp', desc: 'Talk to landlords instantly.' },
  { icon: Wallet, title: 'No broker fees', desc: 'Zero hidden charges. Ever.' },
  { icon: Zap, title: 'Find a place fast', desc: 'Most renters connect within 48 hrs.' },
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchType, setSearchType] = useState('');

  const [featured, setFeatured] = useState<Property[]>([]);
  const [recent, setRecent] = useState<Property[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [ownerPhones, setOwnerPhones] = useState<Record<string, string>>({});
  const [verifiedOwners, setVerifiedOwners] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState<string | null>(null);
  const [stats, setStats] = useState({ properties: 0, landlords: 0, districts: 8 });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: featuredData }, { data: recentData }, { count: propCount }, { count: landlordCount }] = await Promise.all([
        supabase.from('properties').select('*').eq('status', 'active').eq('is_featured', true).order('is_promoted', { ascending: false }).order('created_at', { ascending: false }).limit(6),
        supabase.from('properties').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(6),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      ]);

      let feat = featuredData || [];
      if (feat.length < 6 && recentData) {
        const ids = new Set(feat.map(p => p.id));
        feat = [...feat, ...recentData.filter(p => !ids.has(p.id))].slice(0, 6);
      }
      setFeatured(feat);
      setRecent(recentData || []);
      setStats(s => ({ ...s, properties: propCount || 0, landlords: landlordCount || 0 }));

      const all = [...feat, ...(recentData || [])];
      if (all.length > 0) {
        const ids = [...new Set(all.map(p => p.id))];
        const { data: imgs } = await supabase.from('property_images').select('property_id, image_url').in('property_id', ids).order('display_order', { ascending: true });
        const imgMap: Record<string, string> = {};
        imgs?.forEach(img => { if (!imgMap[img.property_id]) imgMap[img.property_id] = img.image_url; });
        setImages(imgMap);

        const ownerIds = [...new Set(all.map(p => p.owner_id))];
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

      if (user) {
        const { data: favs } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
        setFavorites(new Set(favs?.map(f => f.property_id)));
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('q', searchLocation);
    if (searchBudget) params.set('maxPrice', searchBudget);
    if (searchType) params.set('type', searchType);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const spotlight = useMemo(() => featured[0], [featured]);
  const spotlightImage = spotlight ? images[spotlight.id] : undefined;
  const spotlightPhone = spotlight ? ownerPhones[spotlight.owner_id] : undefined;
  const spotlightWa = spotlightPhone
    ? `https://wa.me/${spotlightPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hi, I saw your property in ${spotlight?.district} on Pango (${spotlight?.title}). Is it still available?`)}`
    : null;

  const formatPrice = (n: number) => new Intl.NumberFormat('en-TZ').format(n);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO — split layout */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* LEFT */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <MapPin className="w-3.5 h-3.5 text-primary" /> Dar es Salaam, Tanzania
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.1]">
                <TypewriterText
                  text="Find a house in Dar in minutes — no brokers, no stress"
                  highlightText="no brokers, no stress"
                  highlightClassName="text-primary"
                  speed={40}
                />
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                <span className="italic text-primary/90 font-medium">Pata nyumba kwa urahisi.</span>{' '}
                Verified rental properties across Dar es Salaam. Connect directly with landlords via WhatsApp.
              </p>

              {/* Premium search container */}
              <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
                <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_auto] gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Sinza, Mbezi, Kinondoni…"
                      className="pl-10 h-12 border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Select value={searchBudget} onValueChange={setSearchBudget}>
                    <SelectTrigger className="h-12 border-0 bg-muted/40 focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map(b => <SelectItem key={b.label} value={b.value || 'any'} onSelect={() => setSearchBudget(b.value)}>{b.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="h-12 border-0 bg-muted/40 focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="lg" className="h-12 px-6 shadow-glow-primary" onClick={handleSearch}>
                    <Search className="w-4 h-4 md:mr-1" />
                    <span className="hidden md:inline">Search</span>
                  </Button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="shadow-md" onClick={() => navigate('/search?type=room')}>
                  <DoorOpen className="w-4 h-4 mr-1" /> Find a Room Now
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/search')}>
                  Browse All Listings <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Trust stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.properties}+</p>
                  <p className="text-xs text-muted-foreground">Active listings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.landlords}+</p>
                  <p className="text-xs text-muted-foreground">Verified landlords</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.districts}</p>
                  <p className="text-xs text-muted-foreground">Districts covered</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Featured property preview */}
            <div className="relative hidden lg:block">
              {spotlight && spotlightImage ? (
                <div className="relative animate-float-slow">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/10 rounded-3xl blur-2xl" />
                  <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={spotlightImage} alt={spotlight.title} className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow">
                          <Sparkles className="w-3 h-3" /> Featured
                        </span>
                        {verifiedOwners.has(spotlight.owner_id) && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => user && toggleFavorite(spotlight.id)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center hover:bg-card transition"
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(spotlight.id) ? 'fill-primary text-primary' : 'text-foreground'}`} />
                      </button>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-1">{spotlight.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> {spotlight.district}, Dar es Salaam
                          </p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <p className="text-3xl font-extrabold text-primary leading-none">TZS {formatPrice(spotlight.price)}</p>
                          <p className="text-xs text-muted-foreground mt-1">/month</p>
                        </div>
                        {spotlightWa && (
                          <a href={spotlightWa} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold transition">
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                          </a>
                        )}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => navigate(`/property/${spotlight.id}`)}>
                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-3xl bg-muted animate-pulse" />
              )}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustPoints.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/50">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE BY TYPE */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold">What are you looking for?</h2>
          <p className="text-muted-foreground mt-2">Pick a category to start searching</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {propertyTypes.map(({ icon: Icon, label, sub, type, highlight }) => (
            <button
              key={type}
              onClick={() => navigate(`/search?type=${type}`)}
              className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border bg-card hover:border-primary hover:-translate-y-1 hover:shadow-soft transition-all text-left ${
                highlight ? 'ring-1 ring-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''
              }`}
            >
              {highlight && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">POPULAR</span>
              )}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
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
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <p className="text-muted-foreground">No properties listed yet. Be the first landlord to list!</p>
            <Button className="mt-4" onClick={() => navigate('/signup')}>Start Listing</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => (
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
        )}
      </section>

      {/* DARK TRUST SECTION */}
      <section className="relative bg-[hsl(220_25%_10%)] text-[hsl(40_20%_94%)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Trust & safety</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Why renters trust Pango</h2>
            <p className="text-[hsl(40_20%_94%/0.7)] mt-3 text-lg">
              Every listing on Pango is built on a foundation of verification, transparency, and direct communication. No middlemen, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Verified by Pango', desc: 'Landlords confirm phone & ID before listing. Look for the green badge.' },
              { icon: MessageCircle, title: 'Talk directly', desc: 'WhatsApp the landlord — no agents, no commissions, no waiting.' },
              { icon: BadgeCheck, title: 'Reported & reviewed', desc: 'Suspicious listings flagged by users are reviewed within 24 hours.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="text-[hsl(40_20%_94%/0.7)] text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY ADDED */}
      {recent.length > 0 && (
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
                imageUrl={images[p.id]}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={user ? () => toggleFavorite(p.id) : undefined}
                ownerPhone={ownerPhones[p.owner_id]}
                isVerified={verifiedOwners.has(p.owner_id)}
                onReport={() => setReportId(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* POPULAR AREAS */}
      <section className="bg-muted/40 py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">📍 Browse by area</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Popular neighborhoods</h2>
            <p className="text-muted-foreground mt-2">Explore Dar es Salaam by district</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {districts.map((d) => (
              <button
                key={d.name}
                onClick={() => navigate(`/search?district=${d.name}`)}
                className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary hover:shadow-soft hover:-translate-y-0.5 transition-all text-left"
              >
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">avg TZS {d.avg}/mo</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">💬 Testimonials</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Wateja wetu wanasema</h2>
          <p className="text-muted-foreground mt-2">Real stories from renters in Dar</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: 'Nilipata chumba ndani ya siku 2 — bila broker, bila stress!', name: 'Mwajuma H.', area: 'Kinondoni', initials: 'MH', rating: 5 },
            { quote: 'WhatsApp contact made it so easy to reach the landlord directly.', name: 'David M.', area: 'Sinza', initials: 'DM', rating: 5 },
            { quote: 'Verified badge gave me confidence. Nyumba nzuri kwa bei nzuri.', name: 'Neema K.', area: 'Mbezi', initials: 'NK', rating: 5 },
          ].map(t => (
            <div key={t.name} className="p-6 rounded-2xl border bg-card hover:shadow-soft transition space-y-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <Quote className="w-6 h-6 text-primary/30" />
              <p className="text-foreground leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.area}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">⚡ How Pango works</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">From search to keys, in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {[
            { step: '01', icon: Search, title: 'Search', desc: 'Browse properties by area, price, or type in Dar es Salaam.' },
            { step: '02', icon: Home, title: 'Explore', desc: 'View photos, amenities, maps, and nearby services.' },
            { step: '03', icon: MessageCircle, title: 'Connect', desc: 'WhatsApp the verified landlord directly and move in.' },
          ].map(({ step, icon: Icon, title, desc }, i) => (
            <div key={step} className="relative group">
              <div className="p-8 rounded-2xl border bg-card hover:shadow-soft hover:-translate-y-1 transition-all h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-5xl font-display font-bold text-primary/15">{step}</span>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
              {i < 2 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-primary/40 z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[hsl(15_90%_48%)] rounded-3xl p-8 md:p-14 text-center space-y-5 shadow-glow-primary">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative">
            <ShieldCheck className="w-12 h-12 text-primary-foreground mx-auto opacity-90" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mt-4">
              Own a property? List it free.
            </h2>
            <p className="text-primary-foreground/90 max-w-md mx-auto mt-3">
              Reach thousands of verified renters in Dar es Salaam. No commissions, no broker fees.
            </p>
            <Button variant="secondary" size="lg" className="mt-6" onClick={() => navigate('/signup')}>
              Start Listing <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Pango</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Pango. Making renting simple in Dar es Salaam.</p>
        </div>
      </footer>

      <ReportDialog propertyId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </div>
  );
}
