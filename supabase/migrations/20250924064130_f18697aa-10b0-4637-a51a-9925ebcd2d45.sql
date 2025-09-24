-- Make the current user an admin
-- From the auth logs, the user ID is 26df7d02-aa86-4c84-878b-bda3113ed1f6
INSERT INTO user_roles (user_id, role) 
VALUES ('26df7d02-aa86-4c84-878b-bda3113ed1f6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;