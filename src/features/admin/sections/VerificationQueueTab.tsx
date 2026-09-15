import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck, Phone } from 'lucide-react';
import {
  useAdminVerificationQueue, useApproveVerification, useRejectVerification,
} from '@/features/admin/useAdminVerificationQueue';

export default function VerificationQueueTab() {
  const { data, isLoading } = useAdminVerificationQueue();
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

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
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No verification requests in the queue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(req => {
        const note = noteDraft[req.id] ?? '';
        return (
          <Card key={req.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {req.profile?.full_name || 'Unknown landlord'}
                  </p>
                  {req.profile?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {req.profile.phone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted{' '}
                    {new Date(req.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {req.notes && (
                <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                  {req.notes}
                </div>
              )}

              <Textarea
                rows={2}
                placeholder="Internal review notes (optional, shared with landlord on rejection)"
                value={note}
                onChange={(e) => setNoteDraft(prev => ({ ...prev, [req.id]: e.target.value }))}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject.mutate({ requestId: req.id, reviewNotes: note })}
                  disabled={reject.isPending}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => approve.mutate({ requestId: req.id, reviewNotes: note })}
                  disabled={approve.isPending}
                >
                  <ShieldCheck className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
