-- Add email_sent_count column
ALTER TABLE public.data 
ADD COLUMN email_sent_count INTEGER DEFAULT 0;

-- Migrate existing data: set count to 1 where email was sent
UPDATE public.data 
SET email_sent_count = 1 
WHERE email_sent = true;

-- Drop the old boolean column
ALTER TABLE public.data 
DROP COLUMN email_sent;