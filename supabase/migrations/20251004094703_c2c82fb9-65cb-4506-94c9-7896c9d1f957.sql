-- Create storage bucket for DSGVO documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('dsgvo_documents', 'dsgvo_documents', false);

-- RLS policies for dsgvo_documents bucket
CREATE POLICY "Admins can view DSGVO files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dsgvo_documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload DSGVO files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'dsgvo_documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete DSGVO files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'dsgvo_documents' AND has_role(auth.uid(), 'admin'));