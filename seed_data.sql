/*
  ViraTrak demo seed data — Jon Patel only.
  Run schema2.sql first, then run this file whenever you want a clean demo dataset.

  Trimmed to a single driver/vehicle/device: Jon Patel / vehicle 1 / pi-viratrak-01.
  15 alert events (3 each of the 5 alert types: Yawning, Head Gaze, Eyes Closed,
  Frequent Blinking, Body Tilt), spread so every time-bucket has coverage:

    - Today            (2026-09-09) -> 2 events
    - This week        (2026-09-06 to 2026-09-09) -> 4 events (incl. today's 2 above are also "this week")
    - This month       (2026-09-01 to 2026-09-09) -> 9 events total in September
    - This year        (Jan, Feb, Mar, May, Jun, Aug 2026) -> 6 events

  Assumes "today" = 2026-09-09. Adjust the date literals below if you run this
  seed on a different date and want the "today/this week" buckets to still line up.
*/

BEGIN;

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
  id, first_name, last_name, email, role, status, last_login,
  password, must_change_password
)
VALUES (
  'usr-owner-001', 'Admin', 'User', 'admin@viratrak.com', 'Owner',
  'Active', 'Never', 'admin123', false
);

INSERT INTO public.driver (
  driver_id, first_name, last_name, license_number, contact_info
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Jon', 'Patel', 'DL-1002', '+639171010002');

INSERT INTO public.vehicle (
  vehicle_id, plate_number, model, driver_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'PLT5634', 'Toyota Camry', 1);

INSERT INTO public.device (
  device_id, status, video_feed, vehicle_id
)
VALUES
  ('pi-viratrak-01', 'Online', 'rtsp://cam/1', 1);

-- recorded_evidence: one row per event, ascending by date
INSERT INTO public.recorded_evidence (
  event_id, timestamp, device_id
)
VALUES
  ('20260105090000-1-EVT001', '2026-01-05 09:00:00', 'pi-viratrak-01'),
  ('20260214182000-1-EVT002', '2026-02-14 18:20:00', 'pi-viratrak-01'),
  ('20260325073000-1-EVT003', '2026-03-25 07:30:00', 'pi-viratrak-01'),
  ('20260510154500-1-EVT004', '2026-05-10 15:45:00', 'pi-viratrak-01'),
  ('20260620101500-1-EVT005', '2026-06-20 10:15:00', 'pi-viratrak-01'),
  ('20260815120000-1-EVT006', '2026-08-15 12:00:00', 'pi-viratrak-01'),
  ('20260901200000-1-EVT007', '2026-09-01 20:00:00', 'pi-viratrak-01'),
  ('20260902064500-1-EVT008', '2026-09-02 06:45:00', 'pi-viratrak-01'),
  ('20260903171000-1-EVT009', '2026-09-03 17:10:00', 'pi-viratrak-01'),
  ('20260904082000-1-EVT010', '2026-09-04 08:20:00', 'pi-viratrak-01'),
  ('20260906115000-1-EVT011', '2026-09-06 11:50:00', 'pi-viratrak-01'),
  ('20260907143000-1-EVT012', '2026-09-07 14:30:00', 'pi-viratrak-01'),
  ('20260908090500-1-EVT013', '2026-09-08 09:05:00', 'pi-viratrak-01'),
  ('20260909071500-1-EVT014', '2026-09-09 07:15:00', 'pi-viratrak-01'),
  ('20260909164000-1-EVT015', '2026-09-09 16:40:00', 'pi-viratrak-01');

-- detection_events: alert type cycles Yawning -> Head Gaze -> Eyes Closed -> Frequent Blinking -> Body Tilt
INSERT INTO public.detection_events (
  id, created_at, reported_at, alert_level, triggered_metrics,
  eyes_status, yawn_status, head_pose_status, posture_status,
  fps, device_id, screenshot_url
)
VALUES
  -- 1: Yawning
  (1, '2026-01-05 09:00:00+00', '2026-01-05 09:00:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  -- 2: Head Gaze
  (2, '2026-02-14 18:20:00+00', '2026-02-14 18:20:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  -- 3: Eyes Closed
  (3, '2026-03-25 07:30:00+00', '2026-03-25 07:30:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  -- 4: Frequent Blinking
  (4, '2026-05-10 15:45:00+00', '2026-05-10 15:45:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  -- 5: Body Tilt
  (5, '2026-06-20 10:15:00+00', '2026-06-20 10:15:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  -- 6: Yawning
  (6, '2026-08-15 12:00:00+00', '2026-08-15 12:00:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  -- 7: Head Gaze
  (7, '2026-09-01 20:00:00+00', '2026-09-01 20:00:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  -- 8: Eyes Closed
  (8, '2026-09-02 06:45:00+00', '2026-09-02 06:45:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  -- 9: Frequent Blinking
  (9, '2026-09-03 17:10:00+00', '2026-09-03 17:10:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  -- 10: Body Tilt
  (10, '2026-09-04 08:20:00+00', '2026-09-04 08:20:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  -- 11: Yawning
  (11, '2026-09-06 11:50:00+00', '2026-09-06 11:50:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  -- 12: Head Gaze
  (12, '2026-09-07 14:30:00+00', '2026-09-07 14:30:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  -- 13: Eyes Closed
  (13, '2026-09-08 09:05:00+00', '2026-09-08 09:05:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  -- 14: Frequent Blinking (today)
  (14, '2026-09-09 07:15:00+00', '2026-09-09 07:15:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  -- 15: Body Tilt (today)
  (15, '2026-09-09 16:40:00+00', '2026-09-09 16:40:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (1001, '2026-09-09 07:00:00+00', '2026-09-09 07:00:00+00', 'Low',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'alert', 15.8, 'pi-viratrak-01', NULL),
  (1002, '2026-09-09 08:00:00+00', '2026-09-09 08:00:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.9, 'pi-viratrak-01', NULL),
  (1003, '2026-09-09 09:00:00+00', '2026-09-09 09:00:00+00', 'High',
    ARRAY['eyes_closed', 'body_posture'], 'partially_closed', 'no', 'tilted', 'slouched', 13.7, 'pi-viratrak-01', NULL),
  (1004, '2026-09-09 10:00:00+00', '2026-09-09 10:00:00+00', 'Moderate',
    ARRAY['body_posture'], 'drowsy', 'no', 'neutral', 'leaning', 14.4, 'pi-viratrak-01', NULL),
  (1005, '2026-09-09 11:00:00+00', '2026-09-09 11:00:00+00', 'Low',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'alert', 15.6, 'pi-viratrak-01', NULL),
  (1006, '2026-09-09 12:00:00+00', '2026-09-09 12:00:00+00', 'High',
    ARRAY['eyes_closed', 'body_posture'], 'closed', 'yes', 'tilted', 'slouched', 12.8, 'pi-viratrak-01', NULL),
  (1007, '2026-09-09 13:00:00+00', '2026-09-09 13:00:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1, 'pi-viratrak-01', NULL),
  (1008, '2026-09-09 14:00:00+00', '2026-09-09 14:00:00+00', 'Low',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'alert', 15.4, 'pi-viratrak-01', NULL);

INSERT INTO public.detection (
  detection_id, timestamp, perclos, blink_rate, yawn, body_posture,
  head_pose, fatigue_score, driver_state, event_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-01-05 09:00:00', 24, 12.4, 0.86, 61, 0.28, 86.5, 'fatigued',   '20260105090000-1-EVT001', 1),
  (2, '2026-02-14 18:20:00', 18, 10.2, 0.12, 72, 0.16, 72.4, 'distracted', '20260214182000-1-EVT002', 2),
  (3, '2026-03-25 07:30:00', 15, 9.8,  0.08, 84, 0.12, 68.2, 'alert',      '20260325073000-1-EVT003', 3),
  (4, '2026-05-10 15:45:00', 31, 13.8, 0.95, 49, 0.35, 91.1, 'fatigued',   '20260510154500-1-EVT004', 4),
  (5, '2026-06-20 10:15:00', 16, 11.1, 0.18, 74, 0.14, 70.2, 'distracted', '20260620101500-1-EVT005', 5),
  (6, '2026-08-15 12:00:00', 24, 12.4, 0.86, 61, 0.28, 86.5, 'fatigued',   '20260815120000-1-EVT006', 6),
  (7, '2026-09-01 20:00:00', 18, 10.2, 0.12, 72, 0.16, 72.4, 'distracted', '20260901200000-1-EVT007', 7),
  (8, '2026-09-02 06:45:00', 15, 9.8,  0.08, 84, 0.12, 68.2, 'alert',      '20260902064500-1-EVT008', 8),
  (9, '2026-09-03 17:10:00', 31, 13.8, 0.95, 49, 0.35, 91.1, 'fatigued',   '20260903171000-1-EVT009', 9),
  (10, '2026-09-04 08:20:00', 16, 11.1, 0.18, 74, 0.14, 70.2, 'distracted', '20260904082000-1-EVT010', 10),
  (11, '2026-09-06 11:50:00', 24, 12.4, 0.86, 61, 0.28, 86.5, 'fatigued',   '20260906115000-1-EVT011', 11),
  (12, '2026-09-07 14:30:00', 18, 10.2, 0.12, 72, 0.16, 72.4, 'distracted', '20260907143000-1-EVT012', 12),
  (13, '2026-09-08 09:05:00', 15, 9.8,  0.08, 84, 0.12, 68.2, 'alert',      '20260908090500-1-EVT013', 13),
  (14, '2026-09-09 07:15:00', 31, 13.8, 0.95, 49, 0.35, 91.1, 'fatigued',   '20260909071500-1-EVT014', 14),
  (15, '2026-09-09 16:40:00', 16, 11.1, 0.18, 74, 0.14, 70.2, 'distracted', '20260909164000-1-EVT015', 15);

INSERT INTO public.detection (
  detection_id, timestamp, perclos, blink_rate, yawn, body_posture,
  head_pose, fatigue_score, driver_state, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1001, '2026-09-09 07:00:00', 8, 17.2, 0.12, 92, 0.04, 38.0, 'alert', 1001),
  (1002, '2026-09-09 08:00:00', 14, 15.1, 0.28, 78, 0.09, 52.5, 'distracted', 1002),
  (1003, '2026-09-09 09:00:00', 26, 11.4, 0.72, 54, 0.22, 79.4, 'fatigued', 1003),
  (1004, '2026-09-09 10:00:00', 19, 13.2, 0.44, 68, 0.15, 65.1, 'distracted', 1004),
  (1005, '2026-09-09 11:00:00', 11, 16.4, 0.18, 87, 0.06, 44.2, 'alert', 1005),
  (1006, '2026-09-09 12:00:00', 34, 9.7, 0.91, 41, 0.31, 94.0, 'fatigued', 1006),
  (1007, '2026-09-09 13:00:00', 22, 12.5, 0.55, 63, 0.18, 71.8, 'distracted', 1007),
  (1008, '2026-09-09 14:00:00', 9, 17.8, 0.10, 95, 0.03, 35.6, 'alert', 1008)
ON CONFLICT (detection_id) DO NOTHING;

INSERT INTO public.alert (
  alert_id, alert_level, alert_type, duration, detection_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'High',     'Yawning',            '00:00:30', 1, 1),
  (2, 'Moderate', 'Head Gaze',          '00:00:15', 2, 2),
  (3, 'Low',      'Eyes Closed',        '00:00:10', 3, 3),
  (4, 'High',     'Frequent Blinking',  '00:00:20', 4, 4),
  (5, 'Moderate', 'Body Tilt',          '00:00:18', 5, 5),
  (6, 'High',     'Yawning',            '00:00:30', 6, 6),
  (7, 'Moderate', 'Head Gaze',          '00:00:15', 7, 7),
  (8, 'Low',      'Eyes Closed',        '00:00:10', 8, 8),
  (9, 'High',     'Frequent Blinking',  '00:00:20', 9, 9),
  (10, 'Moderate','Body Tilt',          '00:00:18', 10, 10),
  (11, 'High',    'Yawning',            '00:00:30', 11, 11),
  (12, 'Moderate','Head Gaze',          '00:00:15', 12, 12),
  (13, 'Low',     'Eyes Closed',        '00:00:10', 13, 13),
  (14, 'High',    'Frequent Blinking',  '00:00:20', 14, 14),
  (15, 'Moderate','Body Tilt',          '00:00:18', 15, 15);

INSERT INTO public.device_action (
  action_id, action_type, duration, timestamp, device_id, alert_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Notify Supervisor', '00:00:05', '2026-01-05 09:01:00', 'pi-viratrak-01', 1),
  (2, 'Log Event',         '00:00:01', '2026-02-14 18:21:00', 'pi-viratrak-01', 2),
  (3, 'Save Screenshot',   '00:00:02', '2026-03-25 07:31:00', 'pi-viratrak-01', 3),
  (4, 'Notify Driver',     '00:00:04', '2026-05-10 15:46:00', 'pi-viratrak-01', 4),
  (5, 'Notify Supervisor', '00:00:05', '2026-06-20 10:16:00', 'pi-viratrak-01', 5),
  (6, 'Notify Supervisor', '00:00:05', '2026-08-15 12:01:00', 'pi-viratrak-01', 6),
  (7, 'Log Event',         '00:00:01', '2026-09-01 20:01:00', 'pi-viratrak-01', 7),
  (8, 'Save Screenshot',   '00:00:02', '2026-09-02 06:46:00', 'pi-viratrak-01', 8),
  (9, 'Notify Driver',     '00:00:04', '2026-09-03 17:11:00', 'pi-viratrak-01', 9),
  (10, 'Notify Supervisor','00:00:05', '2026-09-04 08:21:00', 'pi-viratrak-01', 10),
  (11, 'Notify Supervisor','00:00:05', '2026-09-06 11:51:00', 'pi-viratrak-01', 11),
  (12, 'Log Event',        '00:00:01', '2026-09-07 14:31:00', 'pi-viratrak-01', 12),
  (13, 'Save Screenshot',  '00:00:02', '2026-09-08 09:06:00', 'pi-viratrak-01', 13),
  (14, 'Notify Driver',    '00:00:04', '2026-09-09 07:16:00', 'pi-viratrak-01', 14),
  (15, 'Notify Supervisor','00:00:05', '2026-09-09 16:41:00', 'pi-viratrak-01', 15);

INSERT INTO public.behavior_log (
  log_id, message, timestamp, date, alert_id, device_id,
  vehicle_id, detection_id, event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Yawning metric exceeded threshold',              '2026-01-05 09:01:00', '2026-01-05', 1, 'pi-viratrak-01', 1, 1,  '20260105090000-1-EVT001'),
  (2, 'Eyes Closed metric flagged by classifier',       '2026-02-14 18:21:00', '2026-02-14', 2, 'pi-viratrak-01', 1, 2,  '20260214182000-1-EVT002'),
  (3, 'Blink rate fell below configured threshold',     '2026-03-25 07:31:00', '2026-03-25', 3, 'pi-viratrak-01', 1, 3,  '20260325073000-1-EVT003'),
  (4, 'Head pose and yawning thresholds exceeded',      '2026-05-10 15:46:00', '2026-05-10', 4, 'pi-viratrak-01', 1, 4,  '20260510154500-1-EVT004'),
  (5, 'Body posture classifier detected leaning',       '2026-06-20 10:16:00', '2026-06-20', 5, 'pi-viratrak-01', 1, 5,  '20260620101500-1-EVT005'),
  (6, 'Yawning metric exceeded threshold',              '2026-08-15 12:01:00', '2026-08-15', 6, 'pi-viratrak-01', 1, 6,  '20260815120000-1-EVT006'),
  (7, 'Eyes Closed metric flagged by classifier',       '2026-09-01 20:01:00', '2026-09-01', 7, 'pi-viratrak-01', 1, 7,  '20260901200000-1-EVT007'),
  (8, 'Blink rate fell below configured threshold',     '2026-09-02 06:46:00', '2026-09-02', 8, 'pi-viratrak-01', 1, 8,  '20260902064500-1-EVT008'),
  (9, 'Head pose and yawning thresholds exceeded',      '2026-09-03 17:11:00', '2026-09-03', 9, 'pi-viratrak-01', 1, 9,  '20260903171000-1-EVT009'),
  (10, 'Body posture classifier detected leaning',      '2026-09-04 08:21:00', '2026-09-04', 10, 'pi-viratrak-01', 1, 10, '20260904082000-1-EVT010'),
  (11, 'Yawning metric exceeded threshold',             '2026-09-06 11:51:00', '2026-09-06', 11, 'pi-viratrak-01', 1, 11, '20260906115000-1-EVT011'),
  (12, 'Eyes Closed metric flagged by classifier',      '2026-09-07 14:31:00', '2026-09-07', 12, 'pi-viratrak-01', 1, 12, '20260907143000-1-EVT012'),
  (13, 'Blink rate fell below configured threshold',    '2026-09-08 09:06:00', '2026-09-08', 13, 'pi-viratrak-01', 1, 13, '20260908090500-1-EVT013'),
  (14, 'Head pose and yawning thresholds exceeded',     '2026-09-09 07:16:00', '2026-09-09', 14, 'pi-viratrak-01', 1, 14, '20260909071500-1-EVT014'),
  (15, 'Body posture classifier detected leaning',      '2026-09-09 16:41:00', '2026-09-09', 15, 'pi-viratrak-01', 1, 15, '20260909164000-1-EVT015');

INSERT INTO public.system_log (
  systemlog_id, message, log_type, timestamp, device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard records synchronized successfully and the latest fleet data is available.', 'INFO', '2026-09-09 08:00:00', 'pi-viratrak-01'),
  (2, 'Camera calibration is required before the next monitoring session can begin.', 'WARNING', '2026-09-08 08:00:00', 'pi-viratrak-01'),
  (3, 'The monitoring device stopped responding and exceeded the configured communication timeout.', 'ERROR', '2026-09-05 09:50:00', 'pi-viratrak-01'),
  (4, 'Device firmware verification completed successfully with no issues reported.', 'INFO', '2026-07-15 09:00:00', 'pi-viratrak-01'),
  (5, 'The video feed is experiencing elevated latency that may delay behavior detection results.', 'WARNING', '2026-04-05 13:10:00', 'pi-viratrak-01');

COMMIT;