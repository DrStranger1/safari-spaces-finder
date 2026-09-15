-- ============================================
-- PANGO Step 5 — Landlord verification requests
-- Tracks the landlord's request for the Verified badge so admins have a
-- queue to work from (instead of flipping profiles.is_verified blind).
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        public.verification_status NOT NULL DEFAULT 'pending',
  -- Landlord-supplied context (e.g. national ID number, business name).
  notes         text DEFAULT '',
  -- Admin-side
  reviewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes  text DEFAULT '',
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Allow at most ONE active (pending) request per user; older approved/rejected rows stay for history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_one_pending_per_user
  ON public.verification_requests(user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_requests(status);

DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON public.verification_requests;
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Flip profiles.is_verified when an admin approves.
CREATE OR REPLACE FUNCTION public.apply_verification_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles SET is_verified = true WHERE user_id = NEW.user_id;
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_verification_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS verification_requests_apply_approval ON public.verification_requests;
CREATE TRIGGER verification_requests_apply_approval
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.apply_verification_approval();

-- RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Owner can insert their own requests.
DROP POLICY IF EXISTS "Owners create verification requests" ON public.verification_requests;
CREATE POLICY "Owners create verification requests" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can see their own history.
DROP POLICY IF EXISTS "Owners view own verification requests" ON public.verification_requests;
CREATE POLICY "Owners view own verification requests" ON public.verification_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see everything.
DROP POLICY IF EXISTS "Admins view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins view all verification requests" ON public.verification_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins decide outcomes.
DROP POLICY IF EXISTS "Admins update verification requests" ON public.verification_requests;
CREATE POLICY "Admins update verification requests" ON public.verification_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
