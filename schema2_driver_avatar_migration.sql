/*
  Migration for per-driver profile photos.
  Run this after schema2.sql on an existing Supabase project.
*/

BEGIN;

ALTER TABLE public.driver
  ADD COLUMN IF NOT EXISTS avatar text;

COMMIT;
