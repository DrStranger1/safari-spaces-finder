-- ============================================
-- PANGO Step 6 — Property views
-- Powers renter "Recently viewed" and landlord "Performance" widgets.
-- Anonymous views are tolerated (session_id only) so we can extend later.
-- ============================================

CREATE TABLE IF NOT EXISTS public.property_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_views_viewer_time
  ON public.property_views(viewer_id, created_at DESC)
  WHERE viewer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_views_property_time
  ON public.property_views(property_id, created_at DESC);

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can log a view. Authed users must use their own id.
DROP POLICY IF EXISTS "Log property view" ON public.property_views;
CREATE POLICY "Log property view" ON public.property_views
  FOR INSERT
  WITH CHECK (
    viewer_id IS NULL
    OR viewer_id = auth.uid()
  );

-- Viewer sees their own history.
DROP POLICY IF EXISTS "Viewer sees own views" ON public.property_views;
CREATE POLICY "Viewer sees own views" ON public.property_views
  FOR SELECT USING (auth.uid() = viewer_id);

-- Property owner sees views on their listings (for the Performance tab).
DROP POLICY IF EXISTS "Owner sees views on own listings" ON public.property_views;
CREATE POLICY "Owner sees views on own listings" ON public.property_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Admins see all.
DROP POLICY IF EXISTS "Admins see all views" ON public.property_views;
CREATE POLICY "Admins see all views" ON public.property_views
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
