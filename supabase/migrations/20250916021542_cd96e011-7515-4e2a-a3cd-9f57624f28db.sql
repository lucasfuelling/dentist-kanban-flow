-- Enable RLS policies for the data table

-- Policy for INSERT: Allow authenticated users to insert their own records
CREATE POLICY "Users can insert their own patient records" 
ON public.data 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy for SELECT: Allow authenticated users to view their own records
CREATE POLICY "Users can view their own patient records" 
ON public.data 
FOR SELECT 
TO authenticated
USING (true);

-- Policy for UPDATE: Allow authenticated users to update their own records
CREATE POLICY "Users can update their own patient records" 
ON public.data 
FOR UPDATE 
TO authenticated
USING (true);

-- Policy for DELETE: Allow authenticated users to delete their own records
CREATE POLICY "Users can delete their own patient records" 
ON public.data 
FOR DELETE 
TO authenticated
USING (true);

-- Storage policies for Cost_estimates bucket
-- Allow authenticated users to view files in the bucket
CREATE POLICY "Authenticated users can view cost estimates" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'Cost_estimates');

-- Allow authenticated users to upload files to the bucket
CREATE POLICY "Authenticated users can upload cost estimates" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'Cost_estimates');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update cost estimates" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'Cost_estimates');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete cost estimates" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'Cost_estimates');