-- Fix storage bucket policies to require authentication instead of public access

-- Drop existing public policies on Cost_estimates bucket
DROP POLICY IF EXISTS "Authenticated users can view Cost_estimates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload Cost_estimates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update Cost_estimates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete Cost_estimates" ON storage.objects;

-- Create policies that require authentication and proper user folder access
CREATE POLICY "Users can view their own cost estimates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Cost_estimates' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own cost estimates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Cost_estimates' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own cost estimates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Cost_estimates' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own cost estimates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Cost_estimates' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix dsgvo_documents bucket policies
DROP POLICY IF EXISTS "Authenticated users can view DSGVO documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload DSGVO documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete DSGVO documents" ON storage.objects;

CREATE POLICY "Admins can view DSGVO documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dsgvo_documents'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can upload DSGVO documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dsgvo_documents'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete DSGVO documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dsgvo_documents'
  AND has_role(auth.uid(), 'admin')
);