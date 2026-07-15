-- ViraTrak: Consolidated Schema Migration
-- Purpose: Remove legacy/duplicate tables (drivers, alerts, logs) that were
--          superseded by the normalized ERD tables (driver, alert, behavior_log,
--          system_log). Keep `users` since it serves a separate concern
--          (dashboard authentication / admin accounts) with no ERD equivalent.
--
-- Safe to re-run: all statements are idempotent (IF EXISTS / IF NOT EXISTS).

BEGIN;

-- ============================================================
-- 1. DROP LEGACY / DENORMALIZED TABLES
-- ============================================================
-- These stored driver/vehicle/alert data as flat text fields instead of
-- proper foreign keys, and duplicate what the ERD tables below already model.
-- No other table has a real FK pointing at these, so CASCADE is just a
-- safety net in case of stray constraints.

DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;

-- ============================================================
-- 2. KEEP: users (admin/dashboard auth — no ERD overlap)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['Owner'::text, 'Administrator'::text, 'Supervisor'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['Active'::text, 'Inactive'::text])),
  last_login text NOT NULL DEFAULT 'Never'::text,
  password text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT false,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 3. ERD-NORMALIZED CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.driver (
  driver_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  license_number character varying NOT NULL UNIQUE,
  contact_info character varying,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT driver_pkey PRIMARY KEY (driver_id)
);

CREATE TABLE IF NOT EXISTS public.vehicle (
  vehicle_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  plate_number character varying NOT NULL UNIQUE,
  model character varying,
  driver_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT vehicle_driver_id_fkey FOREIGN KEY (driver_id)
    REFERENCES public.driver(driver_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.device (
  device_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  status character varying,
  video_feed character varying,
  vehicle_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT device_pkey PRIMARY KEY (device_id),
  CONSTRAINT device_vehicle_id_fkey FOREIGN KEY (vehicle_id)
    REFERENCES public.vehicle(vehicle_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.recorded_evidence (
  event_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  device_id integer,
  CONSTRAINT recorded_evidence_pkey PRIMARY KEY (event_id),
  CONSTRAINT recorded_evidence_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.detection (
  detection_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  perclos double precision,
  blink_rate double precision,
  yawn double precision,
  body_posture double precision,
  head_pose double precision,
  fatigue_score double precision,
  driver_state character varying,
  event_id integer,
  CONSTRAINT detection_pkey PRIMARY KEY (detection_id),
  CONSTRAINT detection_event_id_fkey FOREIGN KEY (event_id)
    REFERENCES public.recorded_evidence(event_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.alert (
  alert_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  alert_level character varying,
  alert_type character varying,
  duration time without time zone,
  detection_id integer,
  CONSTRAINT alert_pkey PRIMARY KEY (alert_id),
  CONSTRAINT alert_detection_id_fkey FOREIGN KEY (detection_id)
    REFERENCES public.detection(detection_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.device_action (
  action_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  action_type character varying,
  duration time without time zone,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  device_id integer,
  alert_id integer,
  CONSTRAINT device_action_pkey PRIMARY KEY (action_id),
  CONSTRAINT device_action_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL,
  CONSTRAINT device_action_alert_id_fkey FOREIGN KEY (alert_id)
    REFERENCES public.alert(alert_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.behavior_log (
  log_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  message character varying,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  alert_id integer,
  device_id integer,
  vehicle_id integer,
  detection_id integer,
  event_id integer,
  CONSTRAINT behavior_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT behavior_log_alert_id_fkey FOREIGN KEY (alert_id)
    REFERENCES public.alert(alert_id) ON DELETE SET NULL,
  CONSTRAINT behavior_log_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL,
  CONSTRAINT behavior_log_vehicle_id_fkey FOREIGN KEY (vehicle_id)
    REFERENCES public.vehicle(vehicle_id) ON DELETE SET NULL,
  CONSTRAINT behavior_log_detection_id_fkey FOREIGN KEY (detection_id)
    REFERENCES public.detection(detection_id) ON DELETE SET NULL,
  CONSTRAINT behavior_log_event_id_fkey FOREIGN KEY (event_id)
    REFERENCES public.recorded_evidence(event_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.system_log (
  systemlog_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  message character varying,
  log_type character varying,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  device_id integer,
  CONSTRAINT system_log_pkey PRIMARY KEY (systemlog_id),
  CONSTRAINT system_log_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL
);

-- ============================================================
-- 4. HELPFUL INDEXES ON FK COLUMNS (Postgres doesn't auto-index these)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vehicle_driver_id ON public.vehicle(driver_id);
CREATE INDEX IF NOT EXISTS idx_device_vehicle_id ON public.device(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_recorded_evidence_device_id ON public.recorded_evidence(device_id);
CREATE INDEX IF NOT EXISTS idx_detection_event_id ON public.detection(event_id);
CREATE INDEX IF NOT EXISTS idx_alert_detection_id ON public.alert(detection_id);
CREATE INDEX IF NOT EXISTS idx_device_action_device_id ON public.device_action(device_id);
CREATE INDEX IF NOT EXISTS idx_device_action_alert_id ON public.device_action(alert_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_alert_id ON public.behavior_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_device_id ON public.behavior_log(device_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_vehicle_id ON public.behavior_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_detection_id ON public.behavior_log(detection_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_event_id ON public.behavior_log(event_id);
CREATE INDEX IF NOT EXISTS idx_system_log_device_id ON public.system_log(device_id);

COMMIT;