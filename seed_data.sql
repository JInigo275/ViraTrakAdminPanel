/*
  ViraTrak demo seed data.
  Run schema2.sql first, then run this file whenever you want a clean demo dataset.
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
  (1, 'Maya', 'Lopez', 'DL-1001', '+15550101'),
  (2, 'Jon', 'Patel', 'DL-1002', '+15550102'),
  (3, 'Alicia', 'Nguyen', 'DL-1003', '+15550103');

INSERT INTO public.vehicle (
  vehicle_id, plate_number, model, driver_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'PLT2847', 'Tesla Model 3', 1),
  (2, 'PLT5634', 'Toyota Camry', 2),
  (3, 'PLT8392', 'Ford Transit Van', 3);

INSERT INTO public.device (
  device_id, status, video_feed, vehicle_id
)
VALUES
  ('pi-viratrak-01', 'Online', 'rtsp://cam/1', 1),
  ('pi-viratrak-02', 'Online', 'rtsp://cam/2', 2),
  ('pi-viratrak-03', 'Offline', 'rtsp://cam/3', 3);

INSERT INTO public.recorded_evidence (
  event_id, timestamp, device_id
)
VALUES
  ('20260907143200-1-A1B2C3', '2026-09-07 14:32:00', 'pi-viratrak-01'),
  ('20260907111800-2-D4E5F6', '2026-09-07 11:18:00', 'pi-viratrak-02'),
  ('20260907094500-3-G7H8I9', '2026-09-07 09:45:00', 'pi-viratrak-03'),
  ('20260906162200-4-J0K1L2', '2026-09-06 16:22:00', 'pi-viratrak-01'),
  ('20260905130500-5-M3N4O5', '2026-09-05 13:05:00', 'pi-viratrak-02'),
  ('20260903102000-6-P6Q7R8', '2026-09-03 10:20:00', 'pi-viratrak-03'),
  ('20260901174500-7-S9T0U1', '2026-09-01 17:45:00', 'pi-viratrak-01'),
  ('20260814121500-8-V2W3X4', '2026-08-14 12:15:00', 'pi-viratrak-02'),
  ('20260618153000-9-Y5Z6A7', '2026-06-18 15:30:00', 'pi-viratrak-03'),
  ('20260409110500-10-B8C9D0', '2026-04-09 11:05:00', 'pi-viratrak-01'),
  ('20260212141000-11-E1F2G3', '2026-02-12 14:10:00', 'pi-viratrak-02'),
  ('20260120163500-12-H4I5J6', '2026-01-20 16:35:00', 'pi-viratrak-03');

INSERT INTO public.detection_events (
  id, created_at, reported_at, alert_level, triggered_metrics,
  eyes_status, yawn_status, head_pose_status, posture_status,
  fps, device_id, screenshot_url
)
VALUES
  (1, '2026-09-07 14:32:00+00', '2026-09-07 14:32:00+00', 'High',
    ARRAY['eyes_closed', 'yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (2, '2026-09-07 11:18:00+00', '2026-09-07 11:18:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (3, '2026-09-07 09:45:00+00', '2026-09-07 09:45:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (4, '2026-09-06 16:22:00+00', '2026-09-06 16:22:00+00', 'High',
    ARRAY['head_pose', 'yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (5, '2026-09-05 13:05:00+00', '2026-09-05 13:05:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (6, '2026-09-03 10:20:00+00', '2026-09-03 10:20:00+00', 'Low',
    ARRAY['blink_rate'], 'open', 'no', 'neutral', 'alert', 15.8,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (7, '2026-09-01 17:45:00+00', '2026-09-01 17:45:00+00', 'High',
    ARRAY['distraction', 'head_pose'], 'open', 'no', 'turned', 'alert', 12.8,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (8, '2026-08-14 12:15:00+00', '2026-08-14 12:15:00+00', 'Moderate',
    ARRAY['lane_drift'], 'open', 'no', 'tilted', 'alert', 14.8,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (9, '2026-06-18 15:30:00+00', '2026-06-18 15:30:00+00', 'Low',
    ARRAY['hard_braking'], 'open', 'no', 'neutral', 'alert', 15.5,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (10, '2026-04-09 11:05:00+00', '2026-04-09 11:05:00+00', 'High',
    ARRAY['drowsiness'], 'drowsy', 'yes', 'tilted', 'slouched', 11.7,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (11, '2026-02-12 14:10:00+00', '2026-02-12 14:10:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'partially_closed', 'no', 'neutral', 'leaning', 13.9,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (12, '2026-01-20 16:35:00+00', '2026-01-20 16:35:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.1,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop');

INSERT INTO public.detection (
  detection_id, timestamp, perclos, blink_rate, yawn, body_posture,
  head_pose, fatigue_score, driver_state, event_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-09-07 14:32:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260907143200-1-A1B2C3', 1),
  (2, '2026-09-07 11:18:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260907111800-2-D4E5F6', 2),
  (3, '2026-09-07 09:45:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260907094500-3-G7H8I9', 3),
  (4, '2026-09-06 16:22:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260906162200-4-J0K1L2', 4),
  (5, '2026-09-05 13:05:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260905130500-5-M3N4O5', 5),
  (6, '2026-09-03 10:20:00', 0.11, 8.9, 0.05, 0.88, 0.08, 61.4, 'alert', '20260903102000-6-P6Q7R8', 6),
  (7, '2026-09-01 17:45:00', 0.27, 14.2, 0.32, 0.58, 0.31, 82.7, 'distracted', '20260901174500-7-S9T0U1', 7),
  (8, '2026-08-14 12:15:00', 0.19, 10.7, 0.11, 0.69, 0.22, 75.8, 'distracted', '20260814121500-8-V2W3X4', 8),
  (9, '2026-06-18 15:30:00', 0.09, 7.8, 0.04, 0.91, 0.06, 55.3, 'alert', '20260618153000-9-Y5Z6A7', 9),
  (10, '2026-04-09 11:05:00', 0.29, 13.1, 0.77, 0.52, 0.33, 88.9, 'fatigued', '20260409110500-10-B8C9D0', 10),
  (11, '2026-02-12 14:10:00', 0.21, 11.8, 0.16, 0.66, 0.19, 78.6, 'drowsy', '20260212141000-11-E1F2G3', 11),
  (12, '2026-01-20 16:35:00', 0.13, 9.2, 0.06, 0.86, 0.11, 64.1, 'alert', '20260120163500-12-H4I5J6', 12);

INSERT INTO public.alert (
  alert_id, alert_level, alert_type, duration, detection_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'High', 'Yawning', '00:00:30', 1, 1),
  (2, 'Moderate', 'Eyes Closed', '00:00:15', 2, 2),
  (3, 'Low', 'Micro Sleep', '00:00:10', 3, 3),
  (4, 'High', 'Head Pose', '00:00:20', 4, 4),
  (5, 'Moderate', 'Body Posture', '00:00:18', 5, 5),
  (6, 'Low', 'Blink Rate', '00:00:08', 6, 6),
  (7, 'High', 'Distraction', '00:00:25', 7, 7),
  (8, 'Moderate', 'Lane Drift', '00:00:12', 8, 8),
  (9, 'Low', 'Hard Braking', '00:00:06', 9, 9),
  (10, 'High', 'Drowsiness', '00:00:22', 10, 10),
  (11, 'Moderate', 'Eyes Closed', '00:00:14', 11, 11),
  (12, 'Low', 'Micro Sleep', '00:00:09', 12, 12);

INSERT INTO public.device_action (
  action_id, action_type, duration, timestamp, device_id, alert_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Notify Supervisor', '00:00:05', '2026-09-07 14:33:00', 'pi-viratrak-01', 1),
  (2, 'Log Event', '00:00:01', '2026-09-07 11:20:00', 'pi-viratrak-02', 2);

INSERT INTO public.behavior_log (
  log_id, message, timestamp, date, alert_id, device_id,
  vehicle_id, detection_id, event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Yawning metric exceeded threshold', '2026-09-07 14:33:00', '2026-09-07', 1, 'pi-viratrak-01', 1, 1, '20260907143200-1-A1B2C3'),
  (2, 'Eyes Closed metric flagged by classifier', '2026-09-07 11:20:00', '2026-09-07', 2, 'pi-viratrak-02', 2, 2, '20260907111800-2-D4E5F6');

INSERT INTO public.system_log (
  systemlog_id, message, log_type, timestamp, device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard data synchronized', 'INFO', '2026-09-07 14:35:00', 'pi-viratrak-01'),
  (2, 'Camera calibration required', 'WARNING', '2026-09-07 10:15:00', 'pi-viratrak-02'),
  (3, 'Device communication timeout', 'ERROR', '2026-09-07 09:50:00', 'pi-viratrak-03');

COMMIT;
