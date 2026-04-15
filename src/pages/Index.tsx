import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Shield, Home, Building2, DoorOpen, Briefcase, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

const propertyTypes = [
  { icon: Home, label: 'Houses', type: 'house' },
  { icon: Building2, label: 'Apartments', type: 'apartment' },
  { icon: DoorOpen, label: 'Rooms', type: 'room' },
  { icon: Briefcase, label: 'Offices', type: 'office' },
];

const districts = [
  'Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni',
];

const steps = [
  { step: '01', title: 'Search', desc: 'Browse properties by area, price, or type in Dar es Salaam.' },
  { step: '02', title: 'Explore', desc: 'View photos, amenities, maps, and nearby services.' },
  { step: '03', title: 'Connect', desc: 'Contact verified landlords directly and move in.' },
];

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    navigate(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <MapPin className="w-4 h-4" /> Dar es Salaam, Tanzania
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Find Your Perfect <span className="text-primary">Pango</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Discover verified rental properties — houses, apartments, rooms, and offices across Dar es Salaam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by area or property name..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button size="lg" className="h-12" onClick={handleSearch}>
                Search <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Browse by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {propertyTypes.map(({ icon: Icon, label, type }) => (
            <button
              key={type}
              onClick={() => navigate(`/search?type=${type}`)}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Districts */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Popular Areas</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => navigate(`/search?district=${d}`)}
                className="px-5 py-2.5 rounded-full border bg-card hover:border-primary hover:text-primary transition-all font-medium text-sm"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">How Pango Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="text-center space-y-3">
              <span className="inline-block text-4xl font-bold text-primary/20">{step}</span>
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center space-y-4">
          <Shield className="w-10 h-10 text-primary-foreground mx-auto opacity-80" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
            Own a Property?
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto">
            List your property on Pango and reach thousands of renters in Dar es Salaam. Verification ensures trust.
          </p>
          <Button variant="secondary" size="lg" onClick={() => navigate('/signup')}>
            Start Listing <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Home className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Pango</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Pango. Making renting simple in Dar es Salaam.</p>
        </div>
      </footer>
    </div>
  );
}
