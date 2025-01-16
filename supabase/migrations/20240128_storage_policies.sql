-- Create assignments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for assignments bucket
CREATE POLICY "Students can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'assignments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments'); 