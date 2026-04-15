
-- Drop the overly broad select policy
DROP POLICY "Anyone can view property images" ON storage.objects;

-- Create a more specific policy that doesn't allow listing
CREATE POLICY "Anyone can view property images by path" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] IS NOT NULL);
