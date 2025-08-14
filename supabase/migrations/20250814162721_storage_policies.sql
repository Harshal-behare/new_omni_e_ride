-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'scooter-images',
    'scooter-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view scooter images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload scooter images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage all scooter images" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- STORAGE POLICIES FOR SCOOTER-IMAGES BUCKET

-- Anyone can view images in the scooter-images bucket (public read)
CREATE POLICY "Public can view scooter images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'scooter-images'
    );

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload scooter images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'scooter-images' AND
        auth.uid() IS NOT NULL
    );

-- Users can update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'scooter-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'scooter-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'scooter-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can manage all images
CREATE POLICY "Admins can manage all scooter images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'scooter-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
