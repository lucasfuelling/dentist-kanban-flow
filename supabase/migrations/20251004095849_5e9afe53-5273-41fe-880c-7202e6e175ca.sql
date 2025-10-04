-- Fix RLS policies to require authentication and prevent public access

-- 1. Fix 'data' table policies - ensure they only apply to authenticated users
DROP POLICY IF EXISTS "Users can view their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can insert their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can update their own patient records" ON public.data;
DROP POLICY IF EXISTS "Users can delete their own patient records" ON public.data;

CREATE POLICY "Users can view their own patient records" 
ON public.data 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient records" 
ON public.data 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient records" 
ON public.data 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patient records" 
ON public.data 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix 'system_configurations' table - ensure SELECT is admin-only and all policies are for authenticated users
DROP POLICY IF EXISTS "Admins can view configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "Admins can insert configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "Admins can update configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "Admins can delete configurations" ON public.system_configurations;

CREATE POLICY "Admins can view configurations" 
ON public.system_configurations 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert configurations" 
ON public.system_configurations 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update configurations" 
ON public.system_configurations 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete configurations" 
ON public.system_configurations 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. Fix 'user_roles' table - ensure all policies require authentication
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));