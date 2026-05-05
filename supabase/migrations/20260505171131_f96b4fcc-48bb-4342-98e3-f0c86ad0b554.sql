
DROP POLICY IF EXISTS "Anyone can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
