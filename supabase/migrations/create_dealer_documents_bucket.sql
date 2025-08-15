-- Create dealer-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dealer-documents',
  'dealer-documents', 
  true, -- Set to true for public access to documents
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dealer-documents bucket

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload dealer documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dealer-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own dealer documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dealer-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own dealer documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dealer-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own dealer documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dealer-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all dealer documents
CREATE POLICY "Admins can view all dealer documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dealer-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can delete any dealer documents
CREATE POLICY "Admins can delete any dealer documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dealer-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
