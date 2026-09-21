-- Additive relationships for schema2.sql.
-- Run after schema2.sql. This file does not alter existing columns.

BEGIN;

CREATE TABLE IF NOT EXISTS public.device (
  device_id text PRIMARY KEY,
  vehicle_id integer UNIQUE REFERENCES public.vehicle(vehicle_id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Keep updated_at current on row updates.
-- Assumes public.set_updated_at() already exists in schema2.sql;
-- comment out this trigger if it doesn't.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_device_updated_at'
  ) THEN
    CREATE TRIGGER trg_device_updated_at
      BEFORE UPDATE ON public.device
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

INSERT INTO public.device (device_id)
SELECT DISTINCT device_id
FROM public.detection_data
WHERE device_id IS NOT NULL
ON CONFLICT (device_id) DO NOTHING;

-- Add FKs using NOT VALID + VALIDATE so the ALTER only takes a brief lock;
-- existing rows are checked afterward without blocking writes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detection_data_device_id_fkey'
  ) THEN
    ALTER TABLE public.detection_data
      ADD CONSTRAINT detection_data_device_id_fkey
      FOREIGN KEY (device_id) REFERENCES public.device(device_id) ON DELETE SET NULL
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'behavior_log_detection_id_fkey'
  ) THEN
    ALTER TABLE public.behavior_log
      ADD CONSTRAINT behavior_log_detection_id_fkey
      FOREIGN KEY (detection_id) REFERENCES public.detection_data(id) ON DELETE SET NULL
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_log_actor_id_fkey'
  ) THEN
    ALTER TABLE public.system_log
      ADD CONSTRAINT system_log_actor_id_fkey
      FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- Validate each constraint that isn't already valid. If orphaned rows exist,
-- this raises a clear error instead of silently skipping the constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'detection_data_device_id_fkey' AND NOT convalidated
  ) THEN
    ALTER TABLE public.detection_data VALIDATE CONSTRAINT detection_data_device_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'behavior_log_detection_id_fkey' AND NOT convalidated
  ) THEN
    ALTER TABLE public.behavior_log VALIDATE CONSTRAINT behavior_log_detection_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'system_log_actor_id_fkey' AND NOT convalidated
  ) THEN
    ALTER TABLE public.system_log VALIDATE CONSTRAINT system_log_actor_id_fkey;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_detection_data_device_created_at
  ON public.detection_data (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavior_log_detection_id
  ON public.behavior_log (detection_id);

CREATE INDEX IF NOT EXISTS idx_system_log_actor_id
  ON public.system_log (actor_id);

COMMIT;