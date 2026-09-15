import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';
import {
  useAdminPendingProperties, useApproveProperty, useRejectProperty,
} from '@/features/admin/useAdminPendingProperties';
import { formatTzs } from '@/lib/format';

export default function PendingPropertiesTab() {
  const { data, isLoading } = useAdminPendingProperties();
  const approve = useApproveProperty();
  const reject = useRejectProperty();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No properties awaiting approval.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(p => (
        <Card key={p.id}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                <Link to={`/property/${p.id}`} className="hover:text-primary">{p.title}</Link>
              </p>
              <p className="text-sm text-muted-foreground">
                {p.district} — TZS {formatTzs(p.price)}
              </p>
              {p.report_count > 0 && (
                <Badge variant="destructive" className="mt-1 text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {p.report_count} report{p.report_count === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => approve.mutate(p.id)}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => reject.mutate(p.id)}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
