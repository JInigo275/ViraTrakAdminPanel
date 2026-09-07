/*
Schema Uploaded: Sep 3, 2026
*/

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['Owner'::text, 'Administrator'::text, 'Supervisor'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['Active'::text, 'Inactive'::text])),
  last_login text NOT NULL DEFAULT 'Never'::text,
  password text,
  must_change_password boolean NOT NULL DEFAULT false,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

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
  device_id text NOT NULL,
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
  device_id text,
  CONSTRAINT recorded_evidence_pkey PRIMARY KEY (event_id),
  CONSTRAINT recorded_evidence_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.detection_events (
  id bigserial NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reported_at timestamptz,
  alert_level text NOT NULL,
  triggered_metrics text[] NOT NULL DEFAULT '{}'::text[],
  eyes_status text NOT NULL DEFAULT ''::text,
  yawn_status text NOT NULL DEFAULT ''::text,
  head_pose_status text NOT NULL DEFAULT ''::text,
  posture_status text NOT NULL DEFAULT ''::text,
  fps real,
  device_id text NOT NULL DEFAULT 'pi-viratrak-01'::text,
  screenshot_url text,
  CONSTRAINT detection_events_pkey PRIMARY KEY (id)
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
  detection_event_id bigint,
  CONSTRAINT detection_pkey PRIMARY KEY (detection_id),
  CONSTRAINT detection_event_id_fkey FOREIGN KEY (event_id)
    REFERENCES public.recorded_evidence(event_id) ON DELETE SET NULL,
  CONSTRAINT detection_detection_event_id_fkey FOREIGN KEY (detection_event_id)
    REFERENCES public.detection_events(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.alert (
  alert_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  alert_level character varying,
  alert_type character varying,
  duration time without time zone,
  detection_id integer,
  detection_event_id bigint,
  CONSTRAINT alert_pkey PRIMARY KEY (alert_id),
  CONSTRAINT alert_detection_id_fkey FOREIGN KEY (detection_id)
    REFERENCES public.detection(detection_id) ON DELETE SET NULL,
  CONSTRAINT alert_detection_event_id_fkey FOREIGN KEY (detection_event_id)
    REFERENCES public.detection_events(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.device_action (
  action_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  action_type character varying,
  duration time without time zone,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  device_id text,
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
  device_id text,
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
  device_id text,
  CONSTRAINT system_log_pkey PRIMARY KEY (systemlog_id),
  CONSTRAINT system_log_device_id_fkey FOREIGN KEY (device_id)
    REFERENCES public.device(device_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_driver_id ON public.vehicle(driver_id);
CREATE INDEX IF NOT EXISTS idx_device_vehicle_id ON public.device(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_recorded_evidence_device_id ON public.recorded_evidence(device_id);
CREATE INDEX IF NOT EXISTS idx_detection_events_created_at ON public.detection_events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_events_device_id ON public.detection_events USING btree (device_id);
CREATE INDEX IF NOT EXISTS idx_detection_events_alert_level ON public.detection_events USING btree (alert_level);
CREATE INDEX IF NOT EXISTS idx_detection_events_device_time ON public.detection_events USING btree (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_event_id ON public.detection(event_id);
CREATE INDEX IF NOT EXISTS idx_detection_detection_event_id ON public.detection(detection_event_id);
CREATE INDEX IF NOT EXISTS idx_alert_detection_id ON public.alert(detection_id);
CREATE INDEX IF NOT EXISTS idx_alert_detection_event_id ON public.alert(detection_event_id);
CREATE INDEX IF NOT EXISTS idx_device_action_device_id ON public.device_action(device_id);
CREATE INDEX IF NOT EXISTS idx_device_action_alert_id ON public.device_action(alert_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_alert_id ON public.behavior_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_device_id ON public.behavior_log(device_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_vehicle_id ON public.behavior_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_detection_id ON public.behavior_log(detection_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_event_id ON public.behavior_log(event_id);
CREATE INDEX IF NOT EXISTS idx_system_log_device_id ON public.system_log(device_id);

-- Clear prior demo data so this file can be rerun without stale rows.
TRUNCATE TABLE
  public.device_action,
  public.behavior_log,
  public.system_log,
  public.alert,
  public.detection,
  public.detection_events,
  public.recorded_evidence,
  public.device,
  public.vehicle,
  public.driver,
  public.users
RESTART IDENTITY CASCADE;

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

INSERT INTO public.driver (
  driver_id,
  first_name,
  last_name,
  license_number,
  contact_info
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Maya', 'Lopez', 'DL-1001', '+15550101'),
  (2, 'Jon', 'Patel', 'DL-1002', '+15550102'),
  (3, 'Alicia', 'Nguyen', 'DL-1003', '+15550103')
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO public.vehicle (
  vehicle_id,
  plate_number,
  model,
  driver_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'PLT2847', 'Tesla Model 3', 1),
  (2, 'PLT5634', 'Toyota Camry', 2),
  (3, 'PLT8392', 'Ford Transit Van', 3)
ON CONFLICT (vehicle_id) DO NOTHING;

INSERT INTO public.device (
  device_id,
  status,
  video_feed,
  vehicle_id
)
VALUES
  ('pi-viratrak-01', 'Online', 'rtsp://cam/1', 1),
  ('pi-viratrak-02', 'Online', 'rtsp://cam/2', 2),
  ('pi-viratrak-03', 'Offline', 'rtsp://cam/3', 3)
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO public.recorded_evidence (
  event_id,
  timestamp,
  device_id
)
VALUES
  ('20260907143200-1-A1B2C3', '2026-09-07 14:32:00', 'pi-viratrak-01'),
  ('20260907111800-2-D4E5F6', '2026-09-07 11:18:00', 'pi-viratrak-02'),
  ('20260907094500-3-G7H8I9', '2026-09-07 09:45:00', 'pi-viratrak-03'),
  ('20260906162200-4-J0K1L2', '2026-09-06 16:22:00', 'pi-viratrak-01')
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO public.detection_events (
  id,
  created_at,
  reported_at,
  alert_level,
  triggered_metrics,
  eyes_status,
  yawn_status,
  head_pose_status,
  posture_status,
  fps,
  device_id,
  screenshot_url
)
VALUES
  (1, '2026-09-07 14:32:00+00', '2026-09-07 14:32:00+00', 'High', ARRAY['eyes_closed', 'yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4, 'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (2, '2026-09-07 11:18:00+00', '2026-09-07 11:18:00+00', 'Moderate', ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1, 'pi-viratrak-02', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (3, '2026-09-07 09:45:00+00', '2026-09-07 09:45:00+00', 'Low', ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2, 'pi-viratrak-03', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (4, '2026-09-06 16:22:00+00', '2026-09-06 16:22:00+00', 'High', ARRAY['head_pose', 'yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9, 'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

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
  event_id,
  detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-09-07 14:32:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260907143200-1-A1B2C3', 1),
  (2, '2026-09-07 11:18:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260907111800-2-D4E5F6', 2),
  (3, '2026-09-07 09:45:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260907094500-3-G7H8I9', 3),
  (4, '2026-09-06 16:22:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260906162200-4-J0K1L2', 4)
ON CONFLICT (detection_id) DO NOTHING;

INSERT INTO public.alert (
  alert_id,
  alert_level,
  alert_type,
  duration,
  detection_id,
  detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'High', 'Yawning', '00:00:30', 1, 1),
  (2, 'Moderate', 'Eyes Closed', '00:00:15', 2, 2),
  (3, 'Low', 'Micro Sleep', '00:00:10', 3, 3),
  (4, 'High', 'Head Pose', '00:00:20', 4, 4)
ON CONFLICT (alert_id) DO NOTHING;

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
  (1, 'Notify Supervisor', '00:00:05', '2026-07-15 14:33:00', 'pi-viratrak-01', 1),
  (2, 'Log Event', '00:00:01', '2026-07-15 11:20:00', 'pi-viratrak-02', 2)
ON CONFLICT (action_id) DO NOTHING;

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
  (1, 'Yawning metric exceeded threshold', '2026-09-07 14:33:00', '2026-09-07', 1, 'pi-viratrak-01', 1, 1, '20260907143200-1-A1B2C3'),
  (2, 'Eyes Closed metric flagged by classifier', '2026-09-07 11:20:00', '2026-09-07', 2, 'pi-viratrak-02', 2, 2, '20260907111800-2-D4E5F6')
ON CONFLICT (log_id) DO NOTHING;

INSERT INTO public.system_log (
  systemlog_id,
  message,
  log_type,
  timestamp,
  device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard data synchronized', 'INFO', '2026-09-07 14:35:00', 'pi-viratrak-01'),
  (2, 'Camera calibration required', 'WARNING', '2026-09-07 10:15:00', 'pi-viratrak-02'),
  (3, 'Device communication timeout', 'ERROR', '2026-09-07 09:50:00', 'pi-viratrak-03')
ON CONFLICT (systemlog_id) DO NOTHING;

COMMIT;