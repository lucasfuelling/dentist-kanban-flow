-- Drop existing user-isolated RLS policies on data table
DROP POLICY IF EXISTS "Users can view their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can insert their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can update their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can delete their own patient records" ON public.data;

-- Create shared policies for all authenticated users on data table
CREATE POLICY "Authenticated users can view all patient records"
ON public.data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patient records"
ON public.data FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient records"
ON public.data FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete patient records"
ON public.data FOR DELETE
TO authenticated
USING (true);