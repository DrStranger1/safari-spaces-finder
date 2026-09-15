import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle, Loader2, Send, ShieldCheck, Phone, MapPin, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateInquiry } from './useCreateInquiry';
import { buildWhatsappUrl } from '@/lib/format';

interface InquiryDialogProps {
  propertyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = 'form' | 'success';

async function fetchInquiryContext(propertyId: string) {
  const { data: property } = await supabase
    .from('properties')
    .select('id, title, district, owner_id')
    .eq('id', propertyId)
    .single();
  if (!property) return null;

  const { data: landlord } = await supabase
    .from('profiles')
    .select('full_name, phone, is_verified')
    .eq('user_id', property.owner_id)
    .single();

  return { property, landlord };
}

export default function InquiryDialog({
  propertyId, open, onOpenChange,
}: InquiryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createInquiry = useCreateInquiry();

  const [step, setStep] = useState<DialogStep>('form');
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [partySize, setPartySize] = useState('');

  const { data: ctx, isLoading } = useQuery({
    queryKey: ['inquiry-context', propertyId],
    queryFn: () => fetchInquiryContext(propertyId!),
    enabled: !!propertyId && open,
    staleTime: 60_000,
  });

  // Reset state whenever the dialog closes or switches property.
  useEffect(() => {
    if (!open) {
      setStep('form');
      setMessage('');
      setMoveInDate('');
      setPartySize('');
    }
  }, [open]);

  // Prefill a friendly default message once we know the property.
  useEffect(() => {
    if (open && ctx?.property && !message) {
      setMessage(
        `Hi, I'm interested in "${ctx.property.title}" in ${ctx.property.district}. Is it still available? When can I view it?`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ctx?.property?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !user) return;
    if (!message.trim()) {
      toast({ title: 'Please add a short message.', variant: 'destructive' });
      return;
    }
    try {
      await createInquiry.mutateAsync({
        propertyId,
        message: message.trim(),
        moveInDate: moveInDate || null,
        partySize: partySize ? Number(partySize) : null,
      });
      setStep('success');
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Could not send inquiry.';
      toast({ title: 'Something went wrong', description, variant: 'destructive' });
    }
  };

  const property = ctx?.property;
  const landlord = ctx?.landlord;
  const whatsappUrl = landlord?.phone && property
    ? buildWhatsappUrl(
        landlord.phone,
        `Hi, I just sent an inquiry on Pango about "${property.title}" in ${property.district}. Looking forward to hearing from you.`,
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading || !property ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : step === 'form' ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center font-display text-xl">
                Message the landlord
              </DialogTitle>
              <DialogDescription className="text-center">
                We'll send your inquiry to the landlord and reveal their WhatsApp
                so you can continue the conversation directly.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-3 my-4 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{property.title}</p>
                <p className="text-xs text-muted-foreground">{property.district}, Dar es Salaam</p>
              </div>
              {landlord?.is_verified && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px] shrink-0">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inquiry-message">Your message</Label>
                <Textarea
                  id="inquiry-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, is this still available? When can I view it?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inquiry-movein">Move-in date</Label>
                  <Input
                    id="inquiry-movein"
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry-party">Tenants</Label>
                  <Input
                    id="inquiry-party"
                    type="number"
                    min={1}
                    max={20}
                    placeholder="e.g. 2"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-5 gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInquiry.isPending}>
                {createInquiry.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send inquiry
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center font-display text-xl">
                Inquiry sent
              </DialogTitle>
              <DialogDescription className="text-center">
                The landlord has been notified. You can continue on WhatsApp now —
                we've also saved this in <strong>My Inquiries</strong> in your dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-4 my-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                  {landlord?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{landlord?.full_name ?? 'Landlord'}</p>
                  {landlord?.is_verified && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px] mt-0.5">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified by Pango
                    </Badge>
                  )}
                </div>
              </div>
              {landlord?.phone && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono">{landlord.phone}</span>
                  </div>
                  <a href={`tel:${landlord.phone}`} className="text-xs text-primary hover:underline">
                    Call
                  </a>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" /> Continue on WhatsApp
                </a>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  This landlord hasn't added a WhatsApp number. They'll reply via the platform.
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
