-- Add email sent tracking columns to the data table
ALTER TABLE public.data 
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;