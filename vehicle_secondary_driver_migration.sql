BEGIN;

ALTER TABLE public.vehicle
  ADD COLUMN IF NOT EXISTS secondary_driver_id integer;

ALTER TABLE public.vehicle
  DROP CONSTRAINT IF EXISTS vehicle_secondary_driver_id_fkey,
  DROP CONSTRAINT IF EXISTS vehicle_distinct_drivers;

ALTER TABLE public.vehicle
  ADD CONSTRAINT vehicle_secondary_driver_id_fkey
    FOREIGN KEY (secondary_driver_id)
    REFERENCES public.driver(driver_id) ON DELETE SET NULL,
  ADD CONSTRAINT vehicle_distinct_drivers
    CHECK (driver_id IS NULL OR secondary_driver_id IS NULL OR driver_id <> secondary_driver_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_secondary_driver_id
  ON public.vehicle(secondary_driver_id);

COMMIT;