import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flag, AlertTriangle, X } from 'lucide-react';
import {
  useAdminReports, useDismissReport, useDeactivateListing,
} from '@/features/admin/useAdminReports';

export default function ReportsQueueTab() {
  const { data, isLoading } = useAdminReports();
  const dismiss = useDismissReport();
  const deactivate = useDeactivateListing();

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
          <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No open reports. Nice.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(group => (
        <Card key={group.propertyId}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/property/${group.propertyId}`}
                  className="font-medium hover:text-primary line-clamp-1"
                >
                  {group.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {group.district} · {group.status}
                </p>
              </div>
              <Badge variant="destructive" className="text-[11px] gap-1 shrink-0">
                <AlertTriangle className="w-3 h-3" />
                {group.reports.length} open / {group.reportCount} lifetime
              </Badge>
            </div>

            <div className="rounded-md border divide-y">
              {group.reports.map(r => (
                <div key={r.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.reason}</p>
                    {r.details && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                        {r.details}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(r.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => dismiss.mutate(r.id)}
                    aria-label="Dismiss report"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deactivate.mutate(group.propertyId)}
              >
                Deactivate listing
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
