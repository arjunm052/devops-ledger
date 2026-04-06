-- Public bucket for post/cover images; objects scoped by first path segment = auth.uid()
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "post-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "post-images author insert own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "post-images author update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "post-images author delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND split_part(name, '/', 1) = auth.uid()::text
);
