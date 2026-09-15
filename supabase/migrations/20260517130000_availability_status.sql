-- ============================================
-- PANGO Step 4 — Availability axis
-- Separates moderation lifecycle (status) from listing availability so
-- landlords can flip Occupied without losing their published listing.
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.availability_status AS ENUM ('available', 'reserved', 'occupied');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS availability_status public.availability_status NOT NULL DEFAULT 'available';

-- Public feeds filter on this combination; index covers the hot path.
CREATE INDEX IF NOT EXISTS idx_properties_status_avail
  ON public.properties(status, availability_status);

COMMENT ON COLUMN public.properties.availability_status IS
  'Listing availability. Distinct from status (moderation lifecycle).';
