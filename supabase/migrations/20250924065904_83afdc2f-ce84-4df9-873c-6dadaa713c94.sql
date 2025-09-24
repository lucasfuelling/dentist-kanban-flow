-- Make the current authenticated user an admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('26df7d02-aa86-4c84-878b-bda3113ed1f6', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;