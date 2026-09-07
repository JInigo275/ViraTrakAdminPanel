/*
  Audit trail and role-scoped visibility for application changes.
  Run after schema2.sql and schema2_rls.sql.
*/

BEGIN;

ALTER TABLE public.system_log
  ADD COLUMN IF NOT EXISTS actor_id text,
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS actor_name text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS operation text;

CREATE INDEX IF NOT EXISTS idx_system_log_actor_role_timestamp
  ON public.system_log(actor_role, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_log_actor_id_timestamp
  ON public.system_log(actor_id, timestamp DESC);

-- The trigger is the only browser-side write path. The function is kept in a
-- private schema and is executable only by PostgreSQL as a trigger function.
CREATE SCHEMA IF NOT EXISTS audit;

CREATE OR REPLACE FUNCTION audit.record_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  row_data jsonb;
  actor_user public.users%ROWTYPE;
  actor_uuid text;
  entity_key text;
BEGIN
  actor_uuid := (select auth.uid())::text;
  -- Service-role jobs have no end-user JWT. They must write an attributed
  -- audit row explicitly when the caller is known (for example create-user).
  IF actor_uuid IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT * INTO actor_user FROM public.users WHERE id = actor_uuid;
  row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  entity_key := CASE TG_TABLE_NAME
    WHEN 'users' THEN 'id'
    WHEN 'driver' THEN 'driver_id'
    WHEN 'vehicle' THEN 'vehicle_id'
    WHEN 'device' THEN 'device_id'
    WHEN 'recorded_evidence' THEN 'event_id'
    WHEN 'detection_events' THEN 'id'
    WHEN 'detection' THEN 'detection_id'
    WHEN 'alert' THEN 'alert_id'
    WHEN 'device_action' THEN 'action_id'
    WHEN 'behavior_log' THEN 'log_id'
    ELSE 'id'
  END;

  INSERT INTO public.system_log (
    message, log_type, timestamp, actor_id, actor_role, actor_name,
    entity_type, entity_id, operation
  ) VALUES (
    format('%s %s %s', TG_TABLE_NAME, lower(TG_OP), coalesce(row_data ->> entity_key, 'unknown')),
    'AUDIT_' || TG_OP,
    now(),
    actor_uuid,
    coalesce(actor_user.role, (select auth.jwt() -> 'app_metadata' ->> 'role')),
    nullif(trim(coalesce(actor_user.first_name, '') || ' ' || coalesce(actor_user.last_name, '')), ''),
    TG_TABLE_NAME,
    row_data ->> entity_key,
    TG_OP
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION audit.record_row_change() FROM PUBLIC;

DO $triggers$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'driver', 'vehicle', 'device', 'recorded_evidence',
    'detection_events', 'detection', 'alert', 'device_action', 'behavior_log'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s_changes ON public.%1$I', table_name);
    EXECUTE format(
      'CREATE TRIGGER audit_%1$s_changes AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION audit.record_row_change()',
      table_name
    );
  END LOOP;
END;
$triggers$;

ALTER TABLE public.system_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated users can read system_log" ON public.system_log;
DROP POLICY IF EXISTS "authenticated users can write system_log" ON public.system_log;
DROP POLICY IF EXISTS "role-scoped audit log read" ON public.system_log;
DROP POLICY IF EXISTS "authenticated users can record own login" ON public.system_log;

CREATE POLICY "role-scoped audit log read"
  ON public.system_log FOR SELECT TO authenticated
  USING (
    (
      select coalesce(
        (
          select u.role
          from public.users u
          where u.id = auth.uid()::text
             or lower(u.email) = lower((select auth.jwt() ->> 'email'))
          limit 1
        ),
        auth.jwt() -> 'app_metadata' ->> 'role'
      )
    ) = 'Owner'
    OR (
      (
        select coalesce(
          (
            select u.role
            from public.users u
            where u.id = auth.uid()::text
               or lower(u.email) = lower((select auth.jwt() ->> 'email'))
            limit 1
          ),
          auth.jwt() -> 'app_metadata' ->> 'role'
        )
      ) = 'Administrator'
      AND actor_role IN ('Administrator', 'Supervisor')
    )
    OR (
      (
        select coalesce(
          (
            select u.role
            from public.users u
            where u.id = auth.uid()::text
               or lower(u.email) = lower((select auth.jwt() ->> 'email'))
            limit 1
          ),
          auth.jwt() -> 'app_metadata' ->> 'role'
        )
      ) = 'Supervisor'
      AND actor_role = 'Supervisor'
    )
    -- Hardware/system diagnostics do not have an end-user actor.
    OR actor_role IS NULL
  );

CREATE POLICY "authenticated users can record own login"
  ON public.system_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (select auth.uid())::text
    AND actor_role = (
      select coalesce(
        (
          select u.role
          from public.users u
          where u.id = auth.uid()::text
             or lower(u.email) = lower((select auth.jwt() ->> 'email'))
          limit 1
        ),
        auth.jwt() -> 'app_metadata' ->> 'role'
      )
    )
    AND operation = 'LOGIN'
    AND entity_type = 'AUTH'
    AND log_type = 'AUTH_LOGIN'
  );

REVOKE UPDATE, DELETE ON public.system_log FROM authenticated;
GRANT SELECT ON public.system_log TO authenticated;
GRANT INSERT ON public.system_log TO authenticated;

COMMIT;
