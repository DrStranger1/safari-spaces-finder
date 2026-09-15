import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Inbox } from 'lucide-react';
import { useRenterInquiries } from '@/features/inquiries/useInquiries';
import { buildWhatsappUrl, formatTzs } from '@/lib/format';
import type { Database } from '@/integrations/supabase/types';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'Awaiting reply',
  replied: 'Landlord replied',
  closed: 'Closed',
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-primary/10 text-primary',
  replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-muted text-muted-foreground',
};

export default function RenterInquiriesList() {
  const { data: inquiries, isLoading } = useRenterInquiries();

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
            You haven't sent any inquiries yet. Browse listings and tap{' '}
            <strong>Message landlord</strong> to start a conversation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map(inq => {
        const wa = inq.landlord?.phone && inq.property
          ? buildWhatsappUrl(
              inq.landlord.phone,
              `Hi, I sent an inquiry on Pango about "${inq.property.title}" in ${inq.property.district}.`,
            )
          : null;

        return (
          <Card key={inq.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {inq.property ? (
                    <Link
                      to={`/property/${inq.property.id}`}
                      className="font-medium hover:text-primary line-clamp-1"
                    >
                      {inq.property.title}
                    </Link>
                  ) : (
                    <p className="font-medium italic">Listing no longer available</p>
                  )}
                  {inq.property && (
                    <p className="text-xs text-muted-foreground">
                      {inq.property.district} · TZS {formatTzs(inq.property.price)}/mo · sent{' '}
                      {new Date(inq.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  )}
                </div>
                <Badge className={`${STATUS_STYLES[inq.status]} border`} variant="outline">
                  {STATUS_LABEL[inq.status]}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{inq.message}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
                {inq.landlord?.full_name && (
                  <span className="text-muted-foreground">Landlord: {inq.landlord.full_name}</span>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Continue on WhatsApp
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
