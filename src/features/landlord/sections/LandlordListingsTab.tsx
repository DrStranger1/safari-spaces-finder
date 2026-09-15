import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLandlordListings, useDeleteListing } from '@/features/landlord/useLandlordListings';
import { useUpdatePropertyAvailability } from '@/features/listings/useUpdatePropertyAvailability';
import { formatTzs } from '@/lib/format';
import type { Database } from '@/integrations/supabase/types';

type Availability = Database['public']['Enums']['availability_status'];

export default function LandlordListingsTab() {
  const navigate = useNavigate();
  const { data: properties, isLoading } = useLandlordListings();
  const deleteListing = useDeleteListing();
  const updateAvailability = useUpdatePropertyAvailability();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't listed any properties yet.</p>
          <Button onClick={() => navigate('/dashboard/new-listing')}>
            <Plus className="w-4 h-4 mr-2" /> Create your first listing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map(p => (
        <Card key={p.id}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/property/${p.id}`} className="font-semibold hover:text-primary line-clamp-1">
                {p.title}
              </Link>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant={
                    p.status === 'active' ? 'default'
                      : p.status === 'pending' ? 'secondary'
                      : 'destructive'
                  }
                >
                  {p.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{p.district}</span>
                <span className="text-sm font-medium text-primary">TZS {formatTzs(p.price)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={p.availability_status}
                onValueChange={(v) =>
                  updateAvailability.mutate({ propertyId: p.id, availability: v as Availability })
                }
              >
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteListing.mutate(p.id)}
                aria-label="Delete listing"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
