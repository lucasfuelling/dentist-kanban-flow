-- Add the new reminder template column
ALTER TABLE system_configurations 
ADD COLUMN email_template_reminder text;

-- Rename the existing column for clarity
ALTER TABLE system_configurations 
RENAME COLUMN email_template TO email_template_first;