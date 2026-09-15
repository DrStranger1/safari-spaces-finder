import { Badge } from '@/components/ui/badge';
import { Clock, Lock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Availability = Database['public']['Enums']['availability_status'];

interface AvailabilityBadgeProps {
  status: Availability;
  className?: string;
}

/**
 * Renders a status pill ONLY for non-default states. 'available' is the
 * implicit baseline so we don't add visual noise to every card.
 */
export default function AvailabilityBadge({ status, className }: AvailabilityBadgeProps) {
  if (status === 'available') return null;

  if (status === 'reserved') {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 ${className ?? ''}`}
      >
        <Clock className="w-3 h-3" /> Reserved
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-muted text-muted-foreground flex items-center gap-1 ${className ?? ''}`}
    >
      <Lock className="w-3 h-3" /> Occupied
    </Badge>
  );
}
