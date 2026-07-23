-- ============================================================
-- Migration 013: Create Supabase Storage Bucket
-- Foremark CRM — BRD §2.1
-- ============================================================
-- BRD §2.1: "Supabase Storage — For any attachments
-- (e.g. shared documents, call recordings if added later)."
--
-- Infrastructure is set up now so it doesn't require a
-- migration later. File upload UI is Phase 2.
-- ============================================================

-- Create the private attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,                                   -- Private: authenticated users only
  10485760,                                -- 10 MB max file size
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'audio/mpeg',
    'audio/wav'
  ]
);

-- Storage RLS: Authenticated users can upload
CREATE POLICY storage_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Storage RLS: Authenticated users can read
CREATE POLICY storage_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

-- Storage RLS: Only Admin can delete
CREATE POLICY storage_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.get_user_role() = 'admin'
  );
