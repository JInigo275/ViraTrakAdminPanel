/* Run after schema2.sql in the Supabase SQL Editor. */

BEGIN;

-- Normalize existing values before adding strict constraints.
UPDATE public.users
SET first_name = regexp_replace(trim(first_name), '\s+', ' ', 'g'),
    last_name = regexp_replace(trim(last_name), '\s+', ' ', 'g'),
    email = lower(trim(email));
UPDATE public.driver
SET first_name = regexp_replace(trim(first_name), '\s+', ' ', 'g'),
    last_name = regexp_replace(trim(last_name), '\s+', ' ', 'g'),
    contact_info = regexp_replace(trim(contact_info), '[^0-9+]', '', 'g');
UPDATE public.vehicle
SET plate_number = upper(regexp_replace(trim(plate_number), '[^A-Za-z0-9]', '', 'g'));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_name_format_check,
  DROP CONSTRAINT IF EXISTS users_email_format_check;
ALTER TABLE public.driver
  DROP CONSTRAINT IF EXISTS driver_name_format_check,
  DROP CONSTRAINT IF EXISTS driver_phone_format_check;
ALTER TABLE public.vehicle
  DROP CONSTRAINT IF EXISTS vehicle_plate_format_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_name_format_check CHECK (first_name ~ '^[A-Za-z][A-Za-z'' -]*$' AND last_name ~ '^[A-Za-z][A-Za-z'' -]*$'),
  ADD CONSTRAINT users_email_format_check CHECK (email = lower(email) AND email !~ '\s' AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
ALTER TABLE public.driver
  ADD CONSTRAINT driver_name_format_check CHECK (first_name ~ '^[A-Za-z][A-Za-z'' -]*$' AND last_name ~ '^[A-Za-z][A-Za-z'' -]*$'),
  ADD CONSTRAINT driver_phone_format_check CHECK (contact_info IS NULL OR contact_info ~ '^\+?[0-9]{7,15}$');
ALTER TABLE public.vehicle
  ADD CONSTRAINT vehicle_plate_format_check CHECK (plate_number = upper(plate_number) AND plate_number ~ '^[A-Z0-9]+$');

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON public.users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_plate_upper_unique ON public.vehicle (upper(plate_number));

COMMIT;
