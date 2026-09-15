import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Logs one property_views row per propertyId per mount. Only fires for
 * authed users in Step 6 — the schema supports anonymous (session_id) but
 * we keep the client minimal until we have a real use case for it.
 */
export function usePropertyViewLogger(propertyId: string | undefined) {
  const { user } = useAuth();
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!propertyId || !user) return;
    if (loggedRef.current === propertyId) return;
    loggedRef.current = propertyId;

    // Fire and forget — best-effort analytics.
    supabase
      .from('property_views')
      .insert({ property_id: propertyId, viewer_id: user.id })
      .then(() => undefined);
  }, [propertyId, user]);
}
