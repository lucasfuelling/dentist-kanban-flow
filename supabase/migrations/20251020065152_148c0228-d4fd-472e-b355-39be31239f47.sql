-- Update RLS policies on system_configurations to allow all authenticated users to view
-- Keep admin-only permissions for insert, update, delete

-- Drop existing view policy
DROP POLICY IF EXISTS "Admins can view configurations" ON public.system_configurations;

-- Create new policy allowing all authenticated users to view
CREATE POLICY "All users can view configurations"
ON public.system_configurations FOR SELECT
TO authenticated
USING (true);

-- Keep existing admin-only policies for modifications (no changes needed)
-- These should already exist:
-- "Admins can insert configurations"
-- "Admins can update configurations" 
-- "Admins can delete configurations"