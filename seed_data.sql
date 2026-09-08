/*
  ViraTrak demo seed data.
  Run schema2.sql first, then run this file whenever you want a clean demo dataset.

  Dataset intentionally limited to 3 drivers/vehicles/devices:
  Maya Lopez / vehicle 1 / pi-viratrak-01, Jon Patel / vehicle 2 / pi-viratrak-02,
  Alicia Nguyen / vehicle 3 / pi-viratrak-03. Every driver has a populated alert
  history. Timestamps are spread from January through September 2026, rotating
  across different days of the week and months of the year for graphing.
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
  (1, 'Maya', 'Lopez', 'DL-1001', '+639171010001'),
  (2, 'Jon', 'Patel', 'DL-1002', '+639171010002'),
  (3, 'Alicia', 'Nguyen', 'DL-1003', '+639171010003');

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
  ('20260105064500-1-EVT001', '2026-01-05 06:45:00', 'pi-viratrak-01'),
  ('20260113081500-2-EVT002', '2026-01-13 08:15:00', 'pi-viratrak-02'),
  ('20260121103000-3-EVT003', '2026-01-21 10:30:00', 'pi-viratrak-03'),
  ('20260129120000-1-EVT004', '2026-01-29 12:00:00', 'pi-viratrak-01'),
  ('20260206142000-2-EVT005', '2026-02-06 14:20:00', 'pi-viratrak-02'),
  ('20260214164000-3-EVT006', '2026-02-14 16:40:00', 'pi-viratrak-03'),
  ('20260222181000-1-EVT007', '2026-02-22 18:10:00', 'pi-viratrak-01'),
  ('20260302200500-2-EVT008', '2026-03-02 20:05:00', 'pi-viratrak-02'),
  ('20260310075000-3-EVT009', '2026-03-10 07:50:00', 'pi-viratrak-03'),
  ('20260318111500-1-EVT010', '2026-03-18 11:15:00', 'pi-viratrak-01'),
  ('20260326064500-2-EVT011', '2026-03-26 06:45:00', 'pi-viratrak-02'),
  ('20260403081500-3-EVT012', '2026-04-03 08:15:00', 'pi-viratrak-03'),
  ('20260411103000-1-EVT013', '2026-04-11 10:30:00', 'pi-viratrak-01'),
  ('20260419120000-2-EVT014', '2026-04-19 12:00:00', 'pi-viratrak-02'),
  ('20260427142000-3-EVT015', '2026-04-27 14:20:00', 'pi-viratrak-03'),
  ('20260505164000-1-EVT016', '2026-05-05 16:40:00', 'pi-viratrak-01'),
  ('20260513181000-2-EVT017', '2026-05-13 18:10:00', 'pi-viratrak-02'),
  ('20260521200500-3-EVT018', '2026-05-21 20:05:00', 'pi-viratrak-03'),
  ('20260529075000-1-EVT019', '2026-05-29 07:50:00', 'pi-viratrak-01'),
  ('20260606111500-2-EVT020', '2026-06-06 11:15:00', 'pi-viratrak-02'),
  ('20260614064500-3-EVT021', '2026-06-14 06:45:00', 'pi-viratrak-03'),
  ('20260622081500-1-EVT022', '2026-06-22 08:15:00', 'pi-viratrak-01'),
  ('20260630103000-2-EVT023', '2026-06-30 10:30:00', 'pi-viratrak-02'),
  ('20260708120000-3-EVT024', '2026-07-08 12:00:00', 'pi-viratrak-03'),
  ('20260716142000-1-EVT025', '2026-07-16 14:20:00', 'pi-viratrak-01'),
  ('20260724164000-2-EVT026', '2026-07-24 16:40:00', 'pi-viratrak-02'),
  ('20260801181000-3-EVT027', '2026-08-01 18:10:00', 'pi-viratrak-03'),
  ('20260809200500-1-EVT028', '2026-08-09 20:05:00', 'pi-viratrak-01'),
  ('20260817075000-2-EVT029', '2026-08-17 07:50:00', 'pi-viratrak-02'),
  ('20260825111500-3-EVT030', '2026-08-25 11:15:00', 'pi-viratrak-03'),
  ('20260902064500-1-EVT031', '2026-09-02 06:45:00', 'pi-viratrak-01');

INSERT INTO public.detection_events (
  id, created_at, reported_at, alert_level, triggered_metrics,
  eyes_status, yawn_status, head_pose_status, posture_status,
  fps, device_id, screenshot_url
)
VALUES
  (1, '2026-01-05 06:45:00+00', '2026-01-05 06:45:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (2, '2026-01-13 08:15:00+00', '2026-01-13 08:15:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (3, '2026-01-21 10:30:00+00', '2026-01-21 10:30:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (4, '2026-01-29 12:00:00+00', '2026-01-29 12:00:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (5, '2026-02-06 14:20:00+00', '2026-02-06 14:20:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (6, '2026-02-14 16:40:00+00', '2026-02-14 16:40:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (7, '2026-02-22 18:10:00+00', '2026-02-22 18:10:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (8, '2026-03-02 20:05:00+00', '2026-03-02 20:05:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (9, '2026-03-10 07:50:00+00', '2026-03-10 07:50:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (10, '2026-03-18 11:15:00+00', '2026-03-18 11:15:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (11, '2026-03-26 06:45:00+00', '2026-03-26 06:45:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (12, '2026-04-03 08:15:00+00', '2026-04-03 08:15:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (13, '2026-04-11 10:30:00+00', '2026-04-11 10:30:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (14, '2026-04-19 12:00:00+00', '2026-04-19 12:00:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (15, '2026-04-27 14:20:00+00', '2026-04-27 14:20:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (16, '2026-05-05 16:40:00+00', '2026-05-05 16:40:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (17, '2026-05-13 18:10:00+00', '2026-05-13 18:10:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (18, '2026-05-21 20:05:00+00', '2026-05-21 20:05:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (19, '2026-05-29 07:50:00+00', '2026-05-29 07:50:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (20, '2026-06-06 11:15:00+00', '2026-06-06 11:15:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (21, '2026-06-14 06:45:00+00', '2026-06-14 06:45:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (22, '2026-06-22 08:15:00+00', '2026-06-22 08:15:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (23, '2026-06-30 10:30:00+00', '2026-06-30 10:30:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (24, '2026-07-08 12:00:00+00', '2026-07-08 12:00:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (25, '2026-07-16 14:20:00+00', '2026-07-16 14:20:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (26, '2026-07-24 16:40:00+00', '2026-07-24 16:40:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (27, '2026-08-01 18:10:00+00', '2026-08-01 18:10:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (28, '2026-08-09 20:05:00+00', '2026-08-09 20:05:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.2,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (29, '2026-08-17 07:50:00+00', '2026-08-17 07:50:00+00', 'High',
    ARRAY['head_pose','yawning'], 'partially_closed', 'yes', 'severe', 'slouched', 11.9,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (30, '2026-08-25 11:15:00+00', '2026-08-25 11:15:00+00', 'Moderate',
    ARRAY['body_posture'], 'open', 'no', 'neutral', 'leaning', 13.6,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (31, '2026-09-02 06:45:00+00', '2026-09-02 06:45:00+00', 'High',
    ARRAY['eyes_closed','yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop');

INSERT INTO public.detection (
  detection_id, timestamp, perclos, blink_rate, yawn, body_posture,
  head_pose, fatigue_score, driver_state, event_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-01-05 06:45:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260105064500-1-EVT001', 1),
  (2, '2026-01-13 08:15:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260113081500-2-EVT002', 2),
  (3, '2026-01-21 10:30:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260121103000-3-EVT003', 3),
  (4, '2026-01-29 12:00:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260129120000-1-EVT004', 4),
  (5, '2026-02-06 14:20:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260206142000-2-EVT005', 5),
  (6, '2026-02-14 16:40:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260214164000-3-EVT006', 6),
  (7, '2026-02-22 18:10:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260222181000-1-EVT007', 7),
  (8, '2026-03-02 20:05:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260302200500-2-EVT008', 8),
  (9, '2026-03-10 07:50:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260310075000-3-EVT009', 9),
  (10, '2026-03-18 11:15:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260318111500-1-EVT010', 10),
  (11, '2026-03-26 06:45:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260326064500-2-EVT011', 11),
  (12, '2026-04-03 08:15:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260403081500-3-EVT012', 12),
  (13, '2026-04-11 10:30:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260411103000-1-EVT013', 13),
  (14, '2026-04-19 12:00:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260419120000-2-EVT014', 14),
  (15, '2026-04-27 14:20:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260427142000-3-EVT015', 15),
  (16, '2026-05-05 16:40:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260505164000-1-EVT016', 16),
  (17, '2026-05-13 18:10:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260513181000-2-EVT017', 17),
  (18, '2026-05-21 20:05:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260521200500-3-EVT018', 18),
  (19, '2026-05-29 07:50:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260529075000-1-EVT019', 19),
  (20, '2026-06-06 11:15:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260606111500-2-EVT020', 20),
  (21, '2026-06-14 06:45:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260614064500-3-EVT021', 21),
  (22, '2026-06-22 08:15:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260622081500-1-EVT022', 22),
  (23, '2026-06-30 10:30:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260630103000-2-EVT023', 23),
  (24, '2026-07-08 12:00:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260708120000-3-EVT024', 24),
  (25, '2026-07-16 14:20:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260716142000-1-EVT025', 25),
  (26, '2026-07-24 16:40:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260724164000-2-EVT026', 26),
  (27, '2026-08-01 18:10:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260801181000-3-EVT027', 27),
  (28, '2026-08-09 20:05:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260809200500-1-EVT028', 28),
  (29, '2026-08-17 07:50:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260817075000-2-EVT029', 29),
  (30, '2026-08-25 11:15:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260825111500-3-EVT030', 30),
  (31, '2026-09-02 06:45:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260902064500-1-EVT031', 31);

INSERT INTO public.alert (
  alert_id, alert_level, alert_type, duration, detection_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'High', 'Yawning', '00:00:30', 1, 1),
  (2, 'Moderate', 'Head Gaze', '00:00:15', 2, 2),
  (3, 'Low', 'Eyes Closed', '00:00:10', 3, 3),
  (4, 'High', 'Frequent Blinking', '00:00:20', 4, 4),
  (5, 'Moderate', 'Body Tilt', '00:00:18', 5, 5),
  (6, 'High', 'Yawning', '00:00:30', 6, 6),
  (7, 'Moderate', 'Head Gaze', '00:00:15', 7, 7),
  (8, 'Low', 'Eyes Closed', '00:00:10', 8, 8),
  (9, 'High', 'Frequent Blinking', '00:00:20', 9, 9),
  (10, 'Moderate', 'Body Tilt', '00:00:18', 10, 10),
  (11, 'High', 'Yawning', '00:00:30', 11, 11),
  (12, 'Moderate', 'Head Gaze', '00:00:15', 12, 12),
  (13, 'Low', 'Eyes Closed', '00:00:10', 13, 13),
  (14, 'High', 'Frequent Blinking', '00:00:20', 14, 14),
  (15, 'Moderate', 'Body Tilt', '00:00:18', 15, 15),
  (16, 'High', 'Yawning', '00:00:30', 16, 16),
  (17, 'Moderate', 'Head Gaze', '00:00:15', 17, 17),
  (18, 'Low', 'Eyes Closed', '00:00:10', 18, 18),
  (19, 'High', 'Frequent Blinking', '00:00:20', 19, 19),
  (20, 'Moderate', 'Body Tilt', '00:00:18', 20, 20),
  (21, 'High', 'Yawning', '00:00:30', 21, 21),
  (22, 'Moderate', 'Head Gaze', '00:00:15', 22, 22),
  (23, 'Low', 'Eyes Closed', '00:00:10', 23, 23),
  (24, 'High', 'Frequent Blinking', '00:00:20', 24, 24),
  (25, 'Moderate', 'Body Tilt', '00:00:18', 25, 25),
  (26, 'High', 'Yawning', '00:00:30', 26, 26),
  (27, 'Moderate', 'Head Gaze', '00:00:15', 27, 27),
  (28, 'Low', 'Eyes Closed', '00:00:10', 28, 28),
  (29, 'High', 'Frequent Blinking', '00:00:20', 29, 29),
  (30, 'Moderate', 'Body Tilt', '00:00:18', 30, 30),
  (31, 'High', 'Yawning', '00:00:30', 31, 31);

INSERT INTO public.device_action (
  action_id, action_type, duration, timestamp, device_id, alert_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Notify Supervisor', '00:00:05', '2026-01-05 06:46:00', 'pi-viratrak-01', 1),
  (2, 'Log Event', '00:00:01', '2026-01-13 08:16:00', 'pi-viratrak-02', 2),
  (3, 'Save Screenshot', '00:00:02', '2026-01-21 10:31:00', 'pi-viratrak-03', 3),
  (4, 'Notify Driver', '00:00:04', '2026-01-29 12:01:00', 'pi-viratrak-01', 4),
  (5, 'Notify Supervisor', '00:00:05', '2026-02-06 14:21:00', 'pi-viratrak-02', 5),
  (6, 'Notify Supervisor', '00:00:05', '2026-02-14 16:41:00', 'pi-viratrak-03', 6),
  (7, 'Log Event', '00:00:01', '2026-02-22 18:11:00', 'pi-viratrak-01', 7),
  (8, 'Save Screenshot', '00:00:02', '2026-03-02 20:06:00', 'pi-viratrak-02', 8),
  (9, 'Notify Driver', '00:00:04', '2026-03-10 07:51:00', 'pi-viratrak-03', 9),
  (10, 'Notify Supervisor', '00:00:05', '2026-03-18 11:16:00', 'pi-viratrak-01', 10),
  (11, 'Notify Supervisor', '00:00:05', '2026-03-26 06:46:00', 'pi-viratrak-02', 11),
  (12, 'Log Event', '00:00:01', '2026-04-03 08:16:00', 'pi-viratrak-03', 12),
  (13, 'Save Screenshot', '00:00:02', '2026-04-11 10:31:00', 'pi-viratrak-01', 13),
  (14, 'Notify Driver', '00:00:04', '2026-04-19 12:01:00', 'pi-viratrak-02', 14),
  (15, 'Notify Supervisor', '00:00:05', '2026-04-27 14:21:00', 'pi-viratrak-03', 15),
  (16, 'Notify Supervisor', '00:00:05', '2026-05-05 16:41:00', 'pi-viratrak-01', 16),
  (17, 'Log Event', '00:00:01', '2026-05-13 18:11:00', 'pi-viratrak-02', 17),
  (18, 'Save Screenshot', '00:00:02', '2026-05-21 20:06:00', 'pi-viratrak-03', 18),
  (19, 'Notify Driver', '00:00:04', '2026-05-29 07:51:00', 'pi-viratrak-01', 19),
  (20, 'Notify Supervisor', '00:00:05', '2026-06-06 11:16:00', 'pi-viratrak-02', 20),
  (21, 'Notify Supervisor', '00:00:05', '2026-06-14 06:46:00', 'pi-viratrak-03', 21),
  (22, 'Log Event', '00:00:01', '2026-06-22 08:16:00', 'pi-viratrak-01', 22),
  (23, 'Save Screenshot', '00:00:02', '2026-06-30 10:31:00', 'pi-viratrak-02', 23),
  (24, 'Notify Driver', '00:00:04', '2026-07-08 12:01:00', 'pi-viratrak-03', 24),
  (25, 'Notify Supervisor', '00:00:05', '2026-07-16 14:21:00', 'pi-viratrak-01', 25),
  (26, 'Notify Supervisor', '00:00:05', '2026-07-24 16:41:00', 'pi-viratrak-02', 26),
  (27, 'Log Event', '00:00:01', '2026-08-01 18:11:00', 'pi-viratrak-03', 27),
  (28, 'Save Screenshot', '00:00:02', '2026-08-09 20:06:00', 'pi-viratrak-01', 28),
  (29, 'Notify Driver', '00:00:04', '2026-08-17 07:51:00', 'pi-viratrak-02', 29),
  (30, 'Notify Supervisor', '00:00:05', '2026-08-25 11:16:00', 'pi-viratrak-03', 30),
  (31, 'Notify Supervisor', '00:00:05', '2026-09-02 06:46:00', 'pi-viratrak-01', 31);

INSERT INTO public.behavior_log (
  log_id, message, timestamp, date, alert_id, device_id,
  vehicle_id, detection_id, event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Yawning metric exceeded threshold', '2026-01-05 06:46:00', '2026-01-05', 1, 'pi-viratrak-01', 1, 1, '20260105064500-1-EVT001'),
  (2, 'Eyes Closed metric flagged by classifier', '2026-01-13 08:16:00', '2026-01-13', 2, 'pi-viratrak-02', 2, 2, '20260113081500-2-EVT002'),
  (3, 'Blink rate fell below configured threshold', '2026-01-21 10:31:00', '2026-01-21', 3, 'pi-viratrak-03', 3, 3, '20260121103000-3-EVT003'),
  (4, 'Head pose and yawning thresholds exceeded', '2026-01-29 12:01:00', '2026-01-29', 4, 'pi-viratrak-01', 1, 4, '20260129120000-1-EVT004'),
  (5, 'Body posture classifier detected leaning', '2026-02-06 14:21:00', '2026-02-06', 5, 'pi-viratrak-02', 2, 5, '20260206142000-2-EVT005'),
  (6, 'Yawning metric exceeded threshold', '2026-02-14 16:41:00', '2026-02-14', 6, 'pi-viratrak-03', 3, 6, '20260214164000-3-EVT006'),
  (7, 'Eyes Closed metric flagged by classifier', '2026-02-22 18:11:00', '2026-02-22', 7, 'pi-viratrak-01', 1, 7, '20260222181000-1-EVT007'),
  (8, 'Blink rate fell below configured threshold', '2026-03-02 20:06:00', '2026-03-02', 8, 'pi-viratrak-02', 2, 8, '20260302200500-2-EVT008'),
  (9, 'Head pose and yawning thresholds exceeded', '2026-03-10 07:51:00', '2026-03-10', 9, 'pi-viratrak-03', 3, 9, '20260310075000-3-EVT009'),
  (10, 'Body posture classifier detected leaning', '2026-03-18 11:16:00', '2026-03-18', 10, 'pi-viratrak-01', 1, 10, '20260318111500-1-EVT010'),
  (11, 'Yawning metric exceeded threshold', '2026-03-26 06:46:00', '2026-03-26', 11, 'pi-viratrak-02', 2, 11, '20260326064500-2-EVT011'),
  (12, 'Eyes Closed metric flagged by classifier', '2026-04-03 08:16:00', '2026-04-03', 12, 'pi-viratrak-03', 3, 12, '20260403081500-3-EVT012'),
  (13, 'Blink rate fell below configured threshold', '2026-04-11 10:31:00', '2026-04-11', 13, 'pi-viratrak-01', 1, 13, '20260411103000-1-EVT013'),
  (14, 'Head pose and yawning thresholds exceeded', '2026-04-19 12:01:00', '2026-04-19', 14, 'pi-viratrak-02', 2, 14, '20260419120000-2-EVT014'),
  (15, 'Body posture classifier detected leaning', '2026-04-27 14:21:00', '2026-04-27', 15, 'pi-viratrak-03', 3, 15, '20260427142000-3-EVT015'),
  (16, 'Yawning metric exceeded threshold', '2026-05-05 16:41:00', '2026-05-05', 16, 'pi-viratrak-01', 1, 16, '20260505164000-1-EVT016'),
  (17, 'Eyes Closed metric flagged by classifier', '2026-05-13 18:11:00', '2026-05-13', 17, 'pi-viratrak-02', 2, 17, '20260513181000-2-EVT017'),
  (18, 'Blink rate fell below configured threshold', '2026-05-21 20:06:00', '2026-05-21', 18, 'pi-viratrak-03', 3, 18, '20260521200500-3-EVT018'),
  (19, 'Head pose and yawning thresholds exceeded', '2026-05-29 07:51:00', '2026-05-29', 19, 'pi-viratrak-01', 1, 19, '20260529075000-1-EVT019'),
  (20, 'Body posture classifier detected leaning', '2026-06-06 11:16:00', '2026-06-06', 20, 'pi-viratrak-02', 2, 20, '20260606111500-2-EVT020'),
  (21, 'Yawning metric exceeded threshold', '2026-06-14 06:46:00', '2026-06-14', 21, 'pi-viratrak-03', 3, 21, '20260614064500-3-EVT021'),
  (22, 'Eyes Closed metric flagged by classifier', '2026-06-22 08:16:00', '2026-06-22', 22, 'pi-viratrak-01', 1, 22, '20260622081500-1-EVT022'),
  (23, 'Blink rate fell below configured threshold', '2026-06-30 10:31:00', '2026-06-30', 23, 'pi-viratrak-02', 2, 23, '20260630103000-2-EVT023'),
  (24, 'Head pose and yawning thresholds exceeded', '2026-07-08 12:01:00', '2026-07-08', 24, 'pi-viratrak-03', 3, 24, '20260708120000-3-EVT024'),
  (25, 'Body posture classifier detected leaning', '2026-07-16 14:21:00', '2026-07-16', 25, 'pi-viratrak-01', 1, 25, '20260716142000-1-EVT025'),
  (26, 'Yawning metric exceeded threshold', '2026-07-24 16:41:00', '2026-07-24', 26, 'pi-viratrak-02', 2, 26, '20260724164000-2-EVT026'),
  (27, 'Eyes Closed metric flagged by classifier', '2026-08-01 18:11:00', '2026-08-01', 27, 'pi-viratrak-03', 3, 27, '20260801181000-3-EVT027'),
  (28, 'Blink rate fell below configured threshold', '2026-08-09 20:06:00', '2026-08-09', 28, 'pi-viratrak-01', 1, 28, '20260809200500-1-EVT028'),
  (29, 'Head pose and yawning thresholds exceeded', '2026-08-17 07:51:00', '2026-08-17', 29, 'pi-viratrak-02', 2, 29, '20260817075000-2-EVT029'),
  (30, 'Body posture classifier detected leaning', '2026-08-25 11:16:00', '2026-08-25', 30, 'pi-viratrak-03', 3, 30, '20260825111500-3-EVT030'),
  (31, 'Yawning metric exceeded threshold', '2026-09-02 06:46:00', '2026-09-02', 31, 'pi-viratrak-01', 1, 31, '20260902064500-1-EVT031');

INSERT INTO public.system_log (
  systemlog_id, message, log_type, timestamp, device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard records synchronized successfully and the latest fleet data is available.', 'INFO', '2026-09-08 10:20:00', 'pi-viratrak-01'),
  (2, 'Camera calibration is required before the next monitoring session can begin.', 'WARNING', '2026-09-08 08:00:00', 'pi-viratrak-02'),
  (3, 'The monitoring device stopped responding and exceeded the configured communication timeout.', 'ERROR', '2026-09-07 09:50:00', 'pi-viratrak-03'),
  (4, 'Device firmware verification completed successfully with no issues reported.', 'INFO', '2026-07-15 09:00:00', 'pi-viratrak-01'),
  (5, 'The video feed is experiencing elevated latency that may delay behavior detection results.', 'WARNING', '2026-06-05 13:10:00', 'pi-viratrak-02'),
  (6, 'The monitoring device entered maintenance mode for scheduled service and diagnostics.', 'INFO', '2026-05-03 10:25:00', 'pi-viratrak-03'),
  (7, 'The event screenshot could not be uploaded, so visual evidence may be unavailable.', 'ERROR', '2026-04-02 17:50:00', 'pi-viratrak-01'),
  (8, 'The camera connection was restored and live monitoring resumed normally.', 'INFO', '2026-03-31 12:25:00', 'pi-viratrak-02'),
  (9, 'Device storage is nearing its configured limit; archived recordings should be reviewed.', 'WARNING', '2026-02-20 15:40:00', 'pi-viratrak-03'),
  (10, 'Scheduled device health check completed successfully; all monitored components are operational.', 'INFO', '2026-01-10 11:15:00', 'pi-viratrak-01');

COMMIT;