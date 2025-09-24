-- Get current user and make them admin
-- First check if current user already has admin role, if not add it
DO $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    -- Only proceed if there is a current user
    IF current_user_id IS NOT NULL THEN
        -- Insert admin role for current user if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (current_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;