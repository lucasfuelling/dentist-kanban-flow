-- Enable leaked password protection in auth config
-- This is typically done through the dashboard, but we can try setting it via SQL
INSERT INTO auth.config (parameter_name, value) 
VALUES ('password_check_leaked', 'true')
ON CONFLICT (parameter_name) 
DO UPDATE SET value = 'true';