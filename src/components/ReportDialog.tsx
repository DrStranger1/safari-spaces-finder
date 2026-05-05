import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Flag } from 'lucide-react';

const REASONS = ['Fake listing', 'Wrong price', 'Already rented', 'Suspicious / scam', 'Inappropriate content', 'Other'];

export default function ReportDialog({ propertyId, open, onOpenChange }: { propertyId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!propertyId || !reason) return;
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to report a listing.' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({ property_id: propertyId, reporter_id: user.id, reason, details });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit report', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Thank you', description: 'Our team will review this listing within 24 hours.' });
    setReason(''); setDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" /> Report Listing</DialogTitle>
          <DialogDescription>Help keep Pango safe. Tell us what's wrong with this listing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Additional details (optional)" value={details} onChange={e => setDetails(e.target.value)} rows={4} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || submitting} variant="destructive">{submitting ? 'Submitting…' : 'Submit Report'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
