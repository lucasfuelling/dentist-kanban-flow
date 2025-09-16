-- Enable realtime for the data table
ALTER TABLE public.data REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.data;