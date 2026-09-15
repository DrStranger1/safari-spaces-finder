import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Upload, X, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PropertyType = Database['public']['Enums']['property_type'];
type ServiceType = Database['public']['Enums']['service_type'];

const DISTRICTS = ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni'];
const AMENITY_OPTIONS = [
  'Water', 'Electricity', 'Parking', 'WiFi', 'Security',
  'Generator', 'Garden', 'Balcony', 'Air Conditioning', 'Furnished',
];
const SERVICE_TYPES: ServiceType[] = [
  'hospital', 'school', 'market', 'transport', 'road', 'restaurant', 'bank', 'other',
];

const STEPS = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Location & photos' },
  { num: 3, label: 'Amenities & services' },
] as const;

interface ListingForm {
  title: string;
  description: string;
  property_type: PropertyType;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  address: string;
  district: string;
  latitude: string;
  longitude: string;
  amenities: string[];
}

interface NearbyService {
  type: ServiceType;
  name: string;
  distance: string;
}

export default function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [form, setForm] = useState<ListingForm>({
    title: '', description: '', property_type: 'apartment',
    price: '', bedrooms: '1', bathrooms: '1', area_sqm: '',
    address: '', district: 'Kinondoni',
    latitude: '-6.7924', longitude: '39.2083',
    amenities: [],
  });

  const [services, setServices] = useState<NearbyService[]>([]);

  const addService = () =>
    setServices([...services, { type: 'hospital', name: '', distance: '' }]);
  const removeService = (i: number) =>
    setServices(services.filter((_, idx) => idx !== i));

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeImage = (i: number) => setImageFiles(prev => prev.filter((_, idx) => idx !== i));

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return 'Title is required.';
      if (!form.description.trim()) return 'Description is required.';
      if (!form.price || Number(form.price) <= 0) return 'Enter a valid monthly price.';
    }
    if (s === 2) {
      if (!form.address.trim()) return 'Address is required.';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast({ title: 'Missing info', description: err, variant: 'destructive' });
      return;
    }
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Re-validate all prior steps before submit.
    for (let s = 1; s <= STEPS.length; s++) {
      const err = validateStep(s);
      if (err) {
        toast({ title: 'Missing info', description: err, variant: 'destructive' });
        setStep(s);
        return;
      }
    }
    setLoading(true);

    try {
      const { data: property, error } = await supabase.from('properties').insert({
        owner_id: user.id,
        title: form.title,
        description: form.description,
        property_type: form.property_type,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        address: form.address,
        district: form.district,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        amenities: form.amenities,
      }).select().single();

      if (error) throw error;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${property.id}/${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('property-images')
          .upload(path, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
          await supabase.from('property_images').insert({
            property_id: property.id,
            image_url: urlData.publicUrl,
            display_order: i,
          });
        }
      }

      if (services.length > 0) {
        await supabase.from('nearby_services').insert(
          services
            .filter(s => s.name)
            .map(s => ({
              property_id: property.id,
              service_type: s.type,
              name: s.name,
              distance_km: s.distance ? Number(s.distance) : null,
            })),
        );
      }

      toast({
        title: 'Listing created',
        description: 'Your property is pending admin approval.',
      });
      navigate('/dashboard');
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Could not create listing.';
      toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">New property listing</h1>

        {/* Stepper */}
        <div className="flex items-center mb-6">
          {STEPS.map((s, idx) => {
            const isDone = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                      isDone ? 'bg-primary text-primary-foreground border-primary'
                        : isActive ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${isDone ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1 — Property Details */}
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Property details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Spacious 2BR Apartment in Masaki"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Describe your property..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={form.property_type}
                      onValueChange={v => setForm({ ...form, property_type: v as PropertyType })}
                    >
                      <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['house', 'apartment', 'room', 'office', 'commercial'] as PropertyType[]).map(t => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (TZS/month)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. 500000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (m²)</Label>
                    <Input id="area" type="number" value={form.area_sqm} onChange={e => setForm({ ...form, area_sqm: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2 — Location & Photos */}
          {step === 2 && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">Location</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select value={form.district} onValueChange={v => setForm({ ...form, district: v })}>
                      <SelectTrigger id="district"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input id="lat" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input id="lng" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Photos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload images</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                  {imageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imageFiles.map((f, i) => (
                        <div key={i} className="relative w-20 h-16 rounded overflow-hidden bg-muted">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* STEP 3 — Amenities & Services */}
          {step === 3 && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">Amenities</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AMENITY_OPTIONS.map(a => (
                      <label key={a} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                        <span className="text-sm">{a}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Nearby services</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addService}>+ Add</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.map((s, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={s.type}
                          onValueChange={v => {
                            const n = [...services];
                            n[i].type = v as ServiceType;
                            setServices(n);
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(t => (
                              <SelectItem key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        className="flex-1"
                        placeholder="Name"
                        value={s.name}
                        onChange={e => {
                          const n = [...services];
                          n[i].name = e.target.value;
                          setServices(n);
                        }}
                      />
                      <Input
                        className="w-20"
                        placeholder="km"
                        type="number"
                        value={s.distance}
                        onChange={e => {
                          const n = [...services];
                          n[i].distance = e.target.value;
                          setServices(n);
                        }}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeService(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-muted-foreground">No nearby services added yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={goNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                  </>
                ) : (
                  'Submit listing'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
