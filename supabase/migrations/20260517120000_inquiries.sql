-- ============================================
-- PANGO Step 3 — Inquiries
-- Stores renter-initiated contact requests on properties. WhatsApp/phone
-- handoff becomes secondary: the platform owns the record of intent.
-- ============================================

-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM ('new', 'replied', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  renter_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message       text NOT NULL,
  move_in_date  date,
  party_size    int,
  status        public.inquiry_status NOT NULL DEFAULT 'new',
  contact_revealed boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property  ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_renter    ON public.inquiries(renter_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_landlord  ON public.inquiries(landlord_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status    ON public.inquiries(status);

-- 3. Auto-populate landlord_id from the property owner so clients can't spoof it.
--    Runs BEFORE INSERT; ignores whatever the client passed.
CREATE OR REPLACE FUNCTION public.set_inquiry_landlord_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT owner_id INTO NEW.landlord_id
  FROM public.properties
  WHERE id = NEW.property_id;

  IF NEW.landlord_id IS NULL THEN
    RAISE EXCEPTION 'Property % not found', NEW.property_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_inquiry_landlord_id() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS inquiries_set_landlord ON public.inquiries;
CREATE TRIGGER inquiries_set_landlord
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_inquiry_landlord_id();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Renters insert their own inquiries. landlord_id is forced by the trigger,
-- so the renter only supplies property_id + message (+ optional fields).
DROP POLICY IF EXISTS "Renters can submit inquiries" ON public.inquiries;
CREATE POLICY "Renters can submit inquiries" ON public.inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = renter_id);

-- Renters see their own inquiries.
DROP POLICY IF EXISTS "Renters view own inquiries" ON public.inquiries;
CREATE POLICY "Renters view own inquiries" ON public.inquiries
  FOR SELECT USING (auth.uid() = renter_id);

-- Landlords see inquiries on their properties.
DROP POLICY IF EXISTS "Landlords view inquiries on their properties" ON public.inquiries;
CREATE POLICY "Landlords view inquiries on their properties" ON public.inquiries
  FOR SELECT USING (auth.uid() = landlord_id);

-- Admins see all.
DROP POLICY IF EXISTS "Admins view all inquiries" ON public.inquiries;
CREATE POLICY "Admins view all inquiries" ON public.inquiries
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Landlords can update status (new/replied/closed) on their own inquiries.
DROP POLICY IF EXISTS "Landlords update own inquiries" ON public.inquiries;
CREATE POLICY "Landlords update own inquiries" ON public.inquiries
  FOR UPDATE USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);
