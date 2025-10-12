-- Add new columns to system_configurations table
ALTER TABLE public.system_configurations
ADD COLUMN dentist_name TEXT,
ADD COLUMN logo_url TEXT;

-- Create public storage bucket for practice assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice_assets', 'practice_assets', true);

-- RLS Policy: Allow admins to upload practice assets
CREATE POLICY "Admins can upload practice assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'practice_assets' 
  AND has_role(auth.uid(), 'admin')
);

-- RLS Policy: Allow public read access to practice assets
CREATE POLICY "Public can view practice assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'practice_assets');

-- RLS Policy: Allow admins to delete practice assets
CREATE POLICY "Admins can delete practice assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'practice_assets' 
  AND has_role(auth.uid(), 'admin')
);