import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Loader2, Clock, XCircle, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLatestVerificationRequest, useSubmitVerificationRequest,
} from '@/features/verification/useVerificationRequest';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

async function fetchProfileVerification(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.is_verified ?? false;
}

export default function VerificationTab() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');

  const { data: isVerified } = useQuery({
    queryKey: ['profile-verified', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: () => fetchProfileVerification(user!.id),
  });

  const { data: latest, isLoading } = useLatestVerificationRequest();
  const submit = useSubmitVerificationRequest();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Already verified
  if (isVerified) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">You're verified</p>
            <p className="text-sm text-muted-foreground mt-1">
              The green Verified badge appears on every listing you publish.
            </p>
          </div>
          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
            <Sparkles className="w-3 h-3 mr-1" /> Trusted by Pango
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // 2. Pending review
  if (latest?.status === 'pending') {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Verification in review</p>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted{' '}
              {new Date(latest.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              . Most reviews complete within 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Rejected — let them resubmit
  const wasRejected = latest?.status === 'rejected';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate({ notes }, { onSuccess: () => setNotes('') });
  };

  return (
    <div className="space-y-4">
      {wasRejected && (
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Previous request was rejected</p>
              {latest.review_notes && (
                <p className="text-xs text-muted-foreground">Reviewer notes: {latest.review_notes}</p>
              )}
              <p className="text-xs text-muted-foreground">You can submit a new request below.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Request landlord verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Verified landlords stand out across Pango. We confirm your identity off-platform
            (typically via WhatsApp + national ID). Share anything that will help us reach
            you — national ID number, business name, or your preferred contact time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-notes">Notes for the reviewer</Label>
              <Textarea
                id="verify-notes"
                rows={4}
                placeholder="e.g. National ID 12345678901234, owner of Sinza Apartments, reachable Mon–Fri 9am–5pm."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Submit request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
