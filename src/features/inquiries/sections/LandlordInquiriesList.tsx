import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageCircle, Phone, Inbox } from 'lucide-react';
import { useLandlordInquiries, useUpdateInquiryStatus } from '@/features/inquiries/useInquiries';
import { buildWhatsappUrl } from '@/lib/format';
import type { Database } from '@/integrations/supabase/types';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-primary/10 text-primary',
  replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-muted text-muted-foreground',
};

export default function LandlordInquiriesList() {
  const { data: inquiries, isLoading } = useLandlordInquiries();
  const updateStatus = useUpdateInquiryStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!inquiries || inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No inquiries yet. They'll appear here when renters reach out.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map(inq => {
        const renterName = inq.renter?.full_name || 'Anonymous renter';
        const wa = inq.renter?.phone
          ? buildWhatsappUrl(
              inq.renter.phone,
              `Hi ${renterName}, thanks for your inquiry on Pango about "${inq.property?.title ?? 'my listing'}".`,
            )
          : null;
        return (
          <Card key={inq.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{renterName}</p>
                  <p className="text-xs text-muted-foreground">
                    on{' '}
                    {inq.property ? (
                      <Link to={`/property/${inq.property.id}`} className="hover:text-primary">
                        {inq.property.title}
                      </Link>
                    ) : (
                      <span className="italic">deleted listing</span>
                    )}
                    {' · '}
                    {new Date(inq.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short',
                    })}
                  </p>
                </div>
                <Badge className={`${STATUS_STYLES[inq.status]} border capitalize`} variant="outline">
                  {inq.status}
                </Badge>
              </div>

              <p className="text-sm text-foreground whitespace-pre-wrap">{inq.message}</p>

              {(inq.move_in_date || inq.party_size) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {inq.move_in_date && <span>Move-in: {inq.move_in_date}</span>}
                  {inq.party_size && <span>Tenants: {inq.party_size}</span>}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-medium transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {inq.renter?.phone && (
                  <a
                    href={`tel:${inq.renter.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted"
                  >
                    <Phone className="w-3.5 h-3.5" /> {inq.renter.phone}
                  </a>
                )}
                <div className="ml-auto">
                  <Select
                    value={inq.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ inquiryId: inq.id, status: v as InquiryStatus })
                    }
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
