-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.detection_data (
  id bigint NOT NULL DEFAULT nextval('detection_events_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reported_at timestamp with time zone,
  alert_level text NOT NULL,
  triggered_metrics ARRAY NOT NULL DEFAULT '{}'::text[],
  eyes_status text NOT NULL DEFAULT ''::text,
  yawn_status text NOT NULL DEFAULT ''::text,
  head_pose_status text NOT NULL DEFAULT ''::text,
  posture_status text NOT NULL DEFAULT ''::text,
  fps real,
  device_id text NOT NULL DEFAULT 'pi-viratrak-01'::text,
  screenshot_url text,
  vehicle_id integer,
  CONSTRAINT detection_data_pkey PRIMARY KEY (id),
  CONSTRAINT detection_data_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND email !~ '\s'::text AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text),
  role text NOT NULL CHECK (role = ANY (ARRAY['Owner'::text, 'Administrator'::text, 'Supervisor'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['Active'::text, 'Deactivated'::text])),
  last_login text NOT NULL DEFAULT 'Never'::text,
  password text,
  must_change_password boolean NOT NULL DEFAULT false,
  avatar text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.driver (
  driver_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  license_number character varying NOT NULL UNIQUE,
  contact_info character varying CHECK (contact_info IS NULL OR contact_info::text ~ '^\+?[0-9]{7,15}$'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar text,
  CONSTRAINT driver_pkey PRIMARY KEY (driver_id)
);
CREATE TABLE public.vehicle (
  vehicle_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  plate_number character varying NOT NULL UNIQUE CHECK (length(plate_number::text) >= 1 AND length(plate_number::text) <= 8 AND plate_number::text = upper(plate_number::text) AND plate_number::text ~ '^[A-Z0-9]+$'::text),
  model character varying,
  driver_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  secondary_driver_id integer,
  device_id text UNIQUE,
  CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT vehicle_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id),
  CONSTRAINT vehicle_secondary_driver_id_fkey FOREIGN KEY (secondary_driver_id) REFERENCES public.driver(driver_id)
);
CREATE TABLE public.behavior_log (
  log_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  message character varying,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  alert_id integer,
  device_id text,
  vehicle_id integer,
  detection_id bigint,
  event_id text,
  CONSTRAINT behavior_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT behavior_log_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id),
  CONSTRAINT behavior_log_detection_id_fkey FOREIGN KEY (detection_id) REFERENCES public.detection_data(id)
);
CREATE TABLE public.system_log (
  systemlog_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  message character varying,
  log_type character varying,
  timestamp timestamp without time zone NOT NULL DEFAULT now(),
  device_id text,
  actor_id text,
  actor_role text,
  actor_name text,
  entity_type text,
  entity_id text,
  operation text,
  CONSTRAINT system_log_pkey PRIMARY KEY (systemlog_id)
);