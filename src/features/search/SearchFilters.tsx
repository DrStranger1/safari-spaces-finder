import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import {
  DAR_DISTRICTS, MAX_PRICE, PRICE_PRESETS, QUICK_AMENITIES,
} from '@/lib/constants';
import { formatTzs } from '@/lib/format';

const ALL_DISTRICTS = ['All', ...DAR_DISTRICTS] as const;
const TYPES = ['all', 'house', 'apartment', 'room', 'office', 'commercial'] as const;

export interface FilterState {
  q: string;
  district: string;
  type: string;
  maxPrice: number;
  feature: string | null;
}

interface SearchFiltersProps {
  draft: FilterState;
  applied: FilterState;
  onDraftChange: (next: FilterState) => void;
  onSubmit: () => void;
  onPatchAndSubmit: (patch: Partial<FilterState>) => void;
}

export default function SearchFilters({
  draft, applied, onDraftChange, onSubmit, onPatchAndSubmit,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-10"
            value={draft.q}
            onChange={(e) => onDraftChange({ ...draft, q: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
        </div>
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} aria-label="Toggle filters">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        <Button onClick={onSubmit}>Search</Button>
      </div>

      {/* District chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
        {ALL_DISTRICTS.map(d => (
          <button
            key={d}
            onClick={() => onPatchAndSubmit({ district: d })}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              applied.district === d
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:border-primary'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Price + feature chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRICE_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onPatchAndSubmit({ maxPrice: p.max })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              applied.maxPrice === p.max
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:border-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="w-px bg-border mx-1" />
        {QUICK_AMENITIES.map(f => (
          <button
            key={f}
            onClick={() => onPatchAndSubmit({ feature: applied.feature === f ? null : f })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              applied.feature === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:border-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-lg border bg-card animate-fade-in">
          <div>
            <label className="text-sm font-medium mb-1 block">District</label>
            <Select value={draft.district} onValueChange={(v) => onDraftChange({ ...draft, district: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={draft.type} onValueChange={(v) => onDraftChange({ ...draft, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Max Price: TZS {formatTzs(draft.maxPrice)}
            </label>
            <Slider
              value={[draft.maxPrice]}
              onValueChange={(v) => onDraftChange({ ...draft, maxPrice: v[0] })}
              min={50_000}
              max={MAX_PRICE}
              step={50_000}
            />
          </div>
        </div>
      )}
    </>
  );
}
