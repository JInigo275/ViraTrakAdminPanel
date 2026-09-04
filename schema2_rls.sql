/*
  RLS policies for schema2.sql.

  Before using the app, create each operator in Supabase Auth and set the
  user's app_metadata.role to Owner, Administrator, or Supervisor. Do not put
  a service-role key in the browser.
*/

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_log ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

DROP POLICY IF EXISTS "authenticated users can read users" ON public.users;
DROP POLICY IF EXISTS "managers can create users" ON public.users;
DROP POLICY IF EXISTS "users can update their profile" ON public.users;
DROP POLICY IF EXISTS "managers can delete users" ON public.users;
CREATE POLICY "authenticated users can read users"
  ON public.users FOR SELECT TO authenticated
  USING (
    email = (select auth.jwt() ->> 'email')
    OR (select auth.jwt() -> 'app_metadata' ->> 'role') IN ('Owner', 'Administrator')
  );
CREATE POLICY "managers can create users"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') IN ('Owner', 'Administrator'));
CREATE POLICY "users can update their profile"
  ON public.users FOR UPDATE TO authenticated
  USING (
    email = (select auth.jwt() ->> 'email')
    OR (select auth.jwt() -> 'app_metadata' ->> 'role') IN ('Owner', 'Administrator')
  )
  WITH CHECK (
    email = (select auth.jwt() ->> 'email')
    OR (select auth.jwt() -> 'app_metadata' ->> 'role') IN ('Owner', 'Administrator')
  );
CREATE POLICY "managers can delete users"
  ON public.users FOR DELETE TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') IN ('Owner', 'Administrator'));

-- All operational data is readable by signed-in operators. Writes are kept
-- behind Supabase Auth; device ingestion should use a server-side credential.
DO $policies$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'driver', 'vehicle', 'device', 'recorded_evidence', 'detection_events',
    'detection', 'alert', 'device_action', 'behavior_log', 'system_log'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated users can read %1$s" ON public.%1$I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated users can write %1$s" ON public.%1$I', table_name);
    EXECUTE format('CREATE POLICY "authenticated users can read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', table_name);
    EXECUTE format('CREATE POLICY "authenticated users can write %1$s" ON public.%1$I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END;
$policies$;

COMMIT;
