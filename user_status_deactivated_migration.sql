BEGIN;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_status_check;

UPDATE public.users
SET status = 'Deactivated'
WHERE status = 'Inactive';

ALTER TABLE public.users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('Active', 'Deactivated'));

COMMIT;