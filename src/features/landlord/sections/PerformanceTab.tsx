import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BarChart3, Eye } from 'lucide-react';
import { useListingPerformance } from '@/features/landlord/useListingPerformance';

export default function PerformanceTab() {
  const { data, isLoading } = useListingPerformance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Add a listing to start tracking views.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Counts include both authenticated visits. Refreshed every minute.
      </p>
      {data.map(row => (
        <Card key={row.propertyId}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/property/${row.propertyId}`}
                className="font-medium hover:text-primary line-clamp-1"
              >
                {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">{row.district}</p>
            </div>
            <div className="flex items-center gap-5 shrink-0 text-right">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Eye className="w-3 h-3" /> Last 7d
                </p>
                <p className="text-lg font-semibold">{row.views7d}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Eye className="w-3 h-3" /> Last 30d
                </p>
                <p className="text-lg font-semibold">{row.views30d}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
