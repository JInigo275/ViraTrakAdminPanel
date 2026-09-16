-- Fixes the audit trigger error: record "old" has no field "password".
-- Run this once in the Supabase SQL Editor, then retry Add Driver.

BEGIN;

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
  password_changed boolean := false;
BEGIN
  actor_uuid := (select auth.uid())::text;
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

  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'users' THEN
    password_changed := (to_jsonb(OLD) -> 'password') IS DISTINCT FROM (to_jsonb(NEW) -> 'password');
  END IF;

  INSERT INTO public.system_log (
    message, log_type, timestamp, actor_id, actor_role, actor_name,
    entity_type, entity_id, operation
  ) VALUES (
    CASE
      WHEN password_changed THEN 'User updated password'
      ELSE format('%s %s %s', TG_TABLE_NAME, lower(TG_OP), coalesce(row_data ->> entity_key, 'unknown'))
    END,
    CASE WHEN password_changed THEN 'USER_PASSWORD_UPDATE' ELSE 'AUDIT_' || TG_OP END,
    now(), actor_uuid,
    coalesce(actor_user.role, (select auth.jwt() -> 'app_metadata' ->> 'role')),
    nullif(trim(coalesce(actor_user.first_name, '') || ' ' || coalesce(actor_user.last_name, '')), ''),
    TG_TABLE_NAME, row_data ->> entity_key,
    CASE WHEN password_changed THEN 'UPDATE_PASSWORD' ELSE TG_OP END
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

COMMIT;