import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import ReportDialog from '@/components/ReportDialog';
import InquiryDialog from '@/features/inquiries/InquiryDialog';
import SearchFilters, { type FilterState } from '@/features/search/SearchFilters';
import { useSearchResults } from '@/features/search/useSearchResults';
import { useFavorites, useToggleFavorite } from '@/features/favorites/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/features/auth/useAuthPrompt';
import { MAX_PRICE } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function paramsToFilters(params: URLSearchParams): FilterState {
  const max = Number(params.get('maxPrice'));
  return {
    q: params.get('q') ?? '',
    district: params.get('district') ?? 'All',
    type: params.get('type') ?? 'all',
    maxPrice: Number.isFinite(max) && max > 0 ? max : MAX_PRICE,
    feature: params.get('feature'),
  };
}

function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.district && f.district !== 'All') p.set('district', f.district);
  if (f.type && f.type !== 'all') p.set('type', f.type);
  if (f.maxPrice && f.maxPrice < MAX_PRICE) p.set('maxPrice', String(f.maxPrice));
  if (f.feature) p.set('feature', f.feature);
  return p;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { openAuthPrompt } = useAuthPrompt();

  const applied = useMemo(() => paramsToFilters(searchParams), [searchParams]);
  const [draft, setDraft] = useState<FilterState>(applied);

  const { data, isLoading } = useSearchResults({
    q: applied.q || undefined,
    district: applied.district,
    type: applied.type,
    maxPrice: applied.maxPrice < MAX_PRICE ? applied.maxPrice : undefined,
    feature: applied.feature ?? undefined,
  });
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favSet = favorites ?? new Set<string>();

  const [reportId, setReportId] = useState<string | null>(null);
  const [inquiryPropertyId, setInquiryPropertyId] = useState<string | null>(null);

  const apply = () => setSearchParams(filtersToParams(draft));
  const patchAndApply = (patch: Partial<FilterState>) => {
    const next = { ...applied, ...patch };
    setDraft(next);
    setSearchParams(filtersToParams(next));
  };

  const handleToggleFavorite = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('save');
      return;
    }
    toggleFavorite.mutate({ propertyId, isFavorite: favSet.has(propertyId) });
  };

  const handleContact = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('inquire');
      return;
    }
    setInquiryPropertyId(propertyId);
  };

  const handleReport = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('report');
      return;
    }
    setReportId(propertyId);
  };

  const resetAll = () => {
    const next: FilterState = { q: '', district: 'All', type: 'all', maxPrice: MAX_PRICE, feature: null };
    setDraft(next);
    setSearchParams({});
  };

  const properties = data?.properties ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <SearchFilters
          draft={draft}
          applied={applied}
          onDraftChange={setDraft}
          onSubmit={apply}
          onPatchAndSubmit={patchAndApply}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl px-6">
            <p className="text-foreground text-lg font-semibold mb-2">No properties match your filters</p>
            <p className="text-muted-foreground mb-6">
              Try nearby areas like Kinondoni or Sinza, or increase your budget.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Button variant="outline" onClick={resetAll}>Reset filters</Button>
              <Button onClick={() => patchAndApply({ district: 'Kinondoni' })}>Try Kinondoni</Button>
              <Button variant="outline" onClick={() => patchAndApply({ district: 'Sinza' })}>Try Sinza</Button>
            </div>
            <div className="pt-4 border-t inline-block">
              <p className="text-sm text-muted-foreground mb-2">Are you a landlord?</p>
              <Button size="sm" onClick={() => window.location.assign('/signup?role=landlord')}>
                Be the first to list in this area
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  imageUrl={data?.images[p.id]}
                  isFavorite={favSet.has(p.id)}
                  onToggleFavorite={() => handleToggleFavorite(p.id)}
                  isVerified={data?.verifiedOwners.has(p.owner_id)}
                  onContact={() => handleContact(p.id)}
                  onReport={() => handleReport(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ReportDialog
        propertyId={reportId}
        open={!!reportId}
        onOpenChange={(o) => !o && setReportId(null)}
      />
      <InquiryDialog
        propertyId={inquiryPropertyId}
        open={!!inquiryPropertyId}
        onOpenChange={(o) => !o && setInquiryPropertyId(null)}
      />
    </div>
  );
}
