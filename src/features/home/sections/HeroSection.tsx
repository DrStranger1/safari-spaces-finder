import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ShieldCheck, DoorOpen, ArrowRight,
  MessageCircle, Sparkles, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import TypewriterText from '@/components/TypewriterText';
import { BUDGET_PRESETS, TRUST_POINTS } from '@/lib/constants';
import { formatTzs } from '@/lib/format';
import type { HomeFeed } from '@/features/home/useHomeFeed';

interface HeroSectionProps {
  feed?: HomeFeed;
  favorites: Set<string>;
  onToggleFavorite: (propertyId: string) => void;
  onContact: (propertyId: string) => void;
}

export default function HeroSection({
  feed,
  favorites,
  onToggleFavorite,
  onContact,
}: HeroSectionProps) {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('q', searchLocation);
    if (searchBudget && searchBudget !== 'any') params.set('maxPrice', searchBudget);
    if (searchType) params.set('type', searchType);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const spotlight = useMemo(() => feed?.featured[0], [feed?.featured]);
  const spotlightImage = spotlight ? feed?.images[spotlight.id] : undefined;
  const spotlightVerified = spotlight ? feed?.verifiedOwners.has(spotlight.owner_id) ?? false : false;
  const stats = feed?.stats ?? { properties: 0, landlords: 0, districts: 8 };

  return (
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
                    {BUDGET_PRESETS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
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
                      {spotlightVerified && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorite(spotlight.id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center hover:bg-card transition"
                      aria-label="Toggle favorite"
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
                        <p className="text-3xl font-extrabold text-primary leading-none">TZS {formatTzs(spotlight.price)}</p>
                        <p className="text-xs text-muted-foreground mt-1">/month</p>
                      </div>
                      <button
                        onClick={() => onContact(spotlight.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
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
          {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
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
  );
}
