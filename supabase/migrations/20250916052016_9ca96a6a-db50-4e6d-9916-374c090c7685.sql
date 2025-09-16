-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can insert their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can update their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can delete their own patient records" ON public.data;

-- Add user_id column to data table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data' AND column_name = 'user_id') THEN
        ALTER TABLE public.data ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing records to have a user_id (for demo purposes, you may want to handle this differently)
UPDATE public.data SET user_id = auth.uid() WHERE user_id IS NULL;

-- Make user_id not nullable
ALTER TABLE public.data ALTER COLUMN user_id SET NOT NULL;

-- Create proper RLS policies for data table
CREATE POLICY "Users can view their own patient records" ON public.data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient records" ON public.data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient records" ON public.data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patient records" ON public.data
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage policies for Cost_estimates bucket
CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'Cost_estimates' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'Cost_estimates' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'Cost_estimates' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'Cost_estimates' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );