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
  event_id text NOT NULL,
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
  event_id text,
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
  event_id text,
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

-- ============================================================
-- 5. SEED DATA FOR THE APP
-- ============================================================

-- Admin account used by the dashboard login flow
INSERT INTO public.users (
  id,
  first_name,
  last_name,
  email,
  role,
  status,
  last_login,
  password,
  must_change_password
)
VALUES (
  'usr-owner-001',
  'Admin',
  'User',
  'admin@viratrak.com',
  'Owner',
  'Active',
  'Never',
  'admin123',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Drivers
INSERT INTO public.driver (
  driver_id,
  first_name,
  last_name,
  license_number,
  contact_info
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Maya', 'Lopez', 'DL-1001', '+1-555-0101'),
  (2, 'Jon', 'Patel', 'DL-1002', '+1-555-0102'),
  (3, 'Alicia', 'Nguyen', 'DL-1003', '+1-555-0103')
ON CONFLICT (driver_id) DO NOTHING;

-- Vehicles linked to drivers
INSERT INTO public.vehicle (
  vehicle_id,
  plate_number,
  model,
  driver_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'PLT-2847', 'Tesla Model 3', 1),
  (2, 'PLT-5634', 'Toyota Camry', 2),
  (3, 'PLT-8392', 'Ford Transit Van', 3)
ON CONFLICT (vehicle_id) DO NOTHING;

-- Devices attached to vehicles
INSERT INTO public.device (
  device_id,
  status,
  video_feed,
  vehicle_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Online', 'rtsp://cam/1', 1),
  (2, 'Online', 'rtsp://cam/2', 2),
  (3, 'Offline', 'rtsp://cam/3', 3)
ON CONFLICT (device_id) DO NOTHING;

-- Recorded evidence entries
INSERT INTO public.recorded_evidence (
  event_id,
  timestamp,
  device_id
)
VALUES
  ('20260715143200-1-A1B2C3', '2026-07-15 14:32:00', 1),
  ('20260715111800-2-D4E5F6', '2026-07-15 11:18:00', 2),
  ('20260715094500-3-G7H8I9', '2026-07-15 09:45:00', 3),
  ('20260714162200-4-J0K1L2', '2026-07-14 16:22:00', 1)
ON CONFLICT (event_id) DO NOTHING;

-- Detection events tied to evidence
INSERT INTO public.detection (
  detection_id,
  timestamp,
  perclos,
  blink_rate,
  yawn,
  body_posture,
  head_pose,
  fatigue_score,
  driver_state,
  event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-07-15 14:32:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260715143200-1-A1B2C3'),
  (2, '2026-07-15 11:18:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260715111800-2-D4E5F6'),
  (3, '2026-07-15 09:45:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260715094500-3-G7H8I9'),
  (4, '2026-07-14 16:22:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260714162200-4-J0K1L2')
ON CONFLICT (detection_id) DO NOTHING;

-- Alerts derived from detections
INSERT INTO public.alert (
  alert_id,
  alert_level,
  alert_type,
  duration,
  detection_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'High', 'Yawning', '00:00:30', 1),
  (2, 'Moderate', 'Eyes Closed', '00:00:15', 2),
  (3, 'Low', 'Micro Sleep', '00:00:10', 3),
  (4, 'High', 'Head Pose', '00:00:20', 4)
ON CONFLICT (alert_id) DO NOTHING;

-- Device actions for the alerts
INSERT INTO public.device_action (
  action_id,
  action_type,
  duration,
  timestamp,
  device_id,
  alert_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Notify Supervisor', '00:00:05', '2026-07-15 14:33:00', 1, 1),
  (2, 'Log Event', '00:00:01', '2026-07-15 11:20:00', 2, 2)
ON CONFLICT (action_id) DO NOTHING;

-- Behavior logs for dashboard visibility
INSERT INTO public.behavior_log (
  log_id,
  message,
  timestamp,
  date,
  alert_id,
  device_id,
  vehicle_id,
  detection_id,
  event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Yawning metric exceeded threshold', '2026-07-15 14:33:00', '2026-07-15', 1, 1, 1, 1, '20260715143200-1-A1B2C3'),
  (2, 'Eyes Closed metric flagged by classifier', '2026-07-15 11:20:00', '2026-07-15', 2, 2, 2, 2, '20260715111800-2-D4E5F6')
ON CONFLICT (log_id) DO NOTHING;

-- System logs for dashboard and system pages
INSERT INTO public.system_log (
  systemlog_id,
  message,
  log_type,
  timestamp,
  device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard data synchronized', 'INFO', '2026-07-15 14:35:00', 1),
  (2, 'Camera calibration required', 'WARNING', '2026-07-15 10:15:00', 2),
  (3, 'Device communication timeout', 'ERROR', '2026-07-15 09:50:00', 3)
ON CONFLICT (systemlog_id) DO NOTHING;

COMMIT;