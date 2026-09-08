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
  (1, 'Maya', 'Lopez', 'DL-1001', '+639171010001'),
  (2, 'Jon', 'Patel', 'DL-1002', '+639171010002'),
  (3, 'Alicia', 'Nguyen', 'DL-1003', '+639171010003'),
  (4, 'Carlos', 'Rivera', 'DL-1004', '+639171010004'),
  (5, 'Sofia', 'Kim', 'DL-1005', '+639171010005'),
  (6, 'Ethan', 'Brooks', 'DL-1006', '+639171010006'),
  (7, 'Nora', 'Williams', 'DL-1007', '+639171010007'),
  (8, 'Marcus', 'Green', 'DL-1008', '+639171010008'),
  (9, 'Priya', 'Shah', 'DL-1009', '+639171010009'),
  (10, 'Daniel', 'Carter', 'DL-1010', '+639171010010');

INSERT INTO public.vehicle (
  vehicle_id, plate_number, model, driver_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'PLT2847', 'Tesla Model 3', 1),
  (2, 'PLT5634', 'Toyota Camry', 2),
  (3, 'PLT8392', 'Ford Transit Van', 3),
  (4, 'PLT4178', 'Freightliner Cascadia', 4),
  (5, 'PLT6921', 'Mercedes Sprinter', 5),
  (6, 'PLT7350', 'Volvo VNL', 6),
  (7, 'PLT2086', 'Ram ProMaster', 7),
  (8, 'PLT9143', 'Kenworth T680', 8),
  (9, 'PLT5269', 'Chevrolet Express', 9),
  (10, 'PLT6804', 'Peterbilt 579', 10);

INSERT INTO public.device (
  device_id, status, video_feed, vehicle_id
)
VALUES
  ('pi-viratrak-01', 'Online', 'rtsp://cam/1', 1),
  ('pi-viratrak-02', 'Online', 'rtsp://cam/2', 2),
  ('pi-viratrak-03', 'Offline', 'rtsp://cam/3', 3),
  ('pi-viratrak-04', 'Online', 'rtsp://cam/4', 4),
  ('pi-viratrak-05', 'Online', 'rtsp://cam/5', 5),
  ('pi-viratrak-06', 'Maintenance', 'rtsp://cam/6', 6),
  ('pi-viratrak-07', 'Online', 'rtsp://cam/7', 7),
  ('pi-viratrak-08', 'Offline', 'rtsp://cam/8', 8),
  ('pi-viratrak-09', 'Online', 'rtsp://cam/9', 9),
  ('pi-viratrak-10', 'Online', 'rtsp://cam/10', 10);

INSERT INTO public.recorded_evidence (
  event_id, timestamp, device_id
)
VALUES
  ('20260908101500-1-A1B2C3', '2026-09-08 10:15:00', 'pi-viratrak-01'),
  ('20260908074000-2-D4E5F6', '2026-09-08 07:40:00', 'pi-viratrak-02'),
  ('20260907124500-3-G7H8I9', '2026-09-07 12:45:00', 'pi-viratrak-03'),
  ('20260906162200-4-J0K1L2', '2026-09-06 16:22:00', 'pi-viratrak-01'),
  ('20260905130500-5-M3N4O5', '2026-09-05 13:05:00', 'pi-viratrak-02'),
  ('20260903102000-6-P6Q7R8', '2026-09-03 10:20:00', 'pi-viratrak-03'),
  ('20260902174500-7-S9T0U1', '2026-09-02 17:45:00', 'pi-viratrak-01'),
  ('20260831121500-8-V2W3X4', '2026-08-31 12:15:00', 'pi-viratrak-02'),
  ('20260820153000-9-Y5Z6A7', '2026-08-20 15:30:00', 'pi-viratrak-03'),
  ('20260810110500-10-B8C9D0', '2026-08-10 11:05:00', 'pi-viratrak-01'),
  ('20260715141000-11-E1F2G3', '2026-07-15 14:10:00', 'pi-viratrak-02'),
  ('20260605163500-12-H4I5J6', '2026-06-05 16:35:00', 'pi-viratrak-03');

INSERT INTO public.detection_events (
  id, created_at, reported_at, alert_level, triggered_metrics,
  eyes_status, yawn_status, head_pose_status, posture_status,
  fps, device_id, screenshot_url
)
VALUES
  (1, '2026-09-08 10:15:00+00', '2026-09-08 10:15:00+00', 'High',
    ARRAY['eyes_closed', 'yawning'], 'closed', 'yes', 'tilted', 'slouched', 12.4,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (2, '2026-09-08 07:40:00+00', '2026-09-08 07:40:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'drowsy', 'no', 'neutral', 'leaning', 14.1,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (3, '2026-09-07 12:45:00+00', '2026-09-07 12:45:00+00', 'Low',
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
  (7, '2026-09-02 17:45:00+00', '2026-09-02 17:45:00+00', 'High',
    ARRAY['distraction', 'head_pose'], 'open', 'no', 'turned', 'alert', 12.8,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (8, '2026-08-31 12:15:00+00', '2026-08-31 12:15:00+00', 'Moderate',
    ARRAY['lane_drift'], 'open', 'no', 'tilted', 'alert', 14.8,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop'),
  (9, '2026-08-20 15:30:00+00', '2026-08-20 15:30:00+00', 'Low',
    ARRAY['hard_braking'], 'open', 'no', 'neutral', 'alert', 15.5,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop'),
  (10, '2026-08-10 11:05:00+00', '2026-08-10 11:05:00+00', 'High',
    ARRAY['drowsiness'], 'drowsy', 'yes', 'tilted', 'slouched', 11.7,
    'pi-viratrak-01', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop'),
  (11, '2026-07-15 14:10:00+00', '2026-07-15 14:10:00+00', 'Moderate',
    ARRAY['eyes_closed'], 'partially_closed', 'no', 'neutral', 'leaning', 13.9,
    'pi-viratrak-02', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop'),
  (12, '2026-06-05 16:35:00+00', '2026-06-05 16:35:00+00', 'Low',
    ARRAY['micro_sleep'], 'closed', 'no', 'neutral', 'alert', 15.1,
    'pi-viratrak-03', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop');

INSERT INTO public.detection (
  detection_id, timestamp, perclos, blink_rate, yawn, body_posture,
  head_pose, fatigue_score, driver_state, event_id, detection_event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '2026-09-08 10:15:00', 0.24, 12.4, 0.86, 0.61, 0.28, 86.5, 'fatigued', '20260908101500-1-A1B2C3', 1),
  (2, '2026-09-08 07:40:00', 0.18, 10.2, 0.12, 0.72, 0.16, 72.4, 'distracted', '20260908074000-2-D4E5F6', 2),
  (3, '2026-09-07 12:45:00', 0.15, 9.8, 0.08, 0.84, 0.12, 68.2, 'alert', '20260907124500-3-G7H8I9', 3),
  (4, '2026-09-06 16:22:00', 0.31, 13.8, 0.95, 0.49, 0.35, 91.1, 'fatigued', '20260906162200-4-J0K1L2', 4),
  (5, '2026-09-05 13:05:00', 0.16, 11.1, 0.18, 0.74, 0.14, 70.2, 'distracted', '20260905130500-5-M3N4O5', 5),
  (6, '2026-09-03 10:20:00', 0.11, 8.9, 0.05, 0.88, 0.08, 61.4, 'alert', '20260903102000-6-P6Q7R8', 6),
  (7, '2026-09-02 17:45:00', 0.27, 14.2, 0.32, 0.58, 0.31, 82.7, 'distracted', '20260902174500-7-S9T0U1', 7),
  (8, '2026-08-31 12:15:00', 0.19, 10.7, 0.11, 0.69, 0.22, 75.8, 'distracted', '20260831121500-8-V2W3X4', 8),
  (9, '2026-08-20 15:30:00', 0.09, 7.8, 0.04, 0.91, 0.06, 55.3, 'alert', '20260820153000-9-Y5Z6A7', 9),
  (10, '2026-08-10 11:05:00', 0.29, 13.1, 0.77, 0.52, 0.33, 88.9, 'fatigued', '20260810110500-10-B8C9D0', 10),
  (11, '2026-07-15 14:10:00', 0.21, 11.8, 0.16, 0.66, 0.19, 78.6, 'drowsy', '20260715141000-11-E1F2G3', 11),
  (12, '2026-06-05 16:35:00', 0.13, 9.2, 0.06, 0.86, 0.11, 64.1, 'alert', '20260605163500-12-H4I5J6', 12);

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
  (6, 'Low', 'Yawning', '00:00:08', 6, 6),
  (7, 'High', 'Head Gaze', '00:00:25', 7, 7),
  (8, 'Moderate', 'Eyes Closed', '00:00:12', 8, 8),
  (9, 'Low', 'Frequent Blinking', '00:00:06', 9, 9),
  (10, 'High', 'Body Tilt', '00:00:22', 10, 10),
  (11, 'Moderate', 'Yawning', '00:00:14', 11, 11),
  (12, 'Low', 'Head Gaze', '00:00:09', 12, 12);

INSERT INTO public.device_action (
  action_id, action_type, duration, timestamp, device_id, alert_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Notify Supervisor', '00:00:05', '2026-09-08 10:16:00', 'pi-viratrak-01', 1),
  (2, 'Log Event', '00:00:01', '2026-09-08 07:41:00', 'pi-viratrak-02', 2),
  (3, 'Notify Driver', '00:00:04', '2026-09-06 16:23:00', 'pi-viratrak-01', 4),
  (4, 'Save Screenshot', '00:00:02', '2026-09-05 13:06:00', 'pi-viratrak-02', 5),
  (5, 'Notify Supervisor', '00:00:05', '2026-09-03 10:21:00', 'pi-viratrak-03', 6),
  (6, 'Log Event', '00:00:01', '2026-09-02 17:46:00', 'pi-viratrak-01', 7),
  (7, 'Notify Driver', '00:00:04', '2026-08-31 12:16:00', 'pi-viratrak-02', 8),
  (8, 'Save Screenshot', '00:00:02', '2026-08-20 15:31:00', 'pi-viratrak-03', 9),
  (9, 'Notify Supervisor', '00:00:05', '2026-08-10 11:06:00', 'pi-viratrak-01', 10),
  (10, 'Log Event', '00:00:01', '2026-08-10 11:07:00', 'pi-viratrak-01', 10);

INSERT INTO public.behavior_log (
  log_id, message, timestamp, date, alert_id, device_id,
  vehicle_id, detection_id, event_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Yawning metric exceeded threshold', '2026-09-08 10:16:00', '2026-09-08', 1, 'pi-viratrak-01', 1, 1, '20260908101500-1-A1B2C3'),
  (2, 'Eyes Closed metric flagged by classifier', '2026-09-08 07:41:00', '2026-09-08', 2, 'pi-viratrak-02', 2, 2, '20260908074000-2-D4E5F6'),
  (3, 'Head pose and yawning thresholds exceeded', '2026-09-06 16:23:00', '2026-09-06', 4, 'pi-viratrak-01', 1, 4, '20260906162200-4-J0K1L2'),
  (4, 'Body posture classifier detected leaning', '2026-09-05 13:06:00', '2026-09-05', 5, 'pi-viratrak-02', 2, 5, '20260905130500-5-M3N4O5'),
  (5, 'Blink rate fell below configured threshold', '2026-09-03 10:21:00', '2026-09-03', 6, 'pi-viratrak-03', 3, 6, '20260903102000-6-P6Q7R8'),
  (6, 'Driver distraction event recorded', '2026-09-02 17:46:00', '2026-09-02', 7, 'pi-viratrak-01', 1, 7, '20260902174500-7-S9T0U1'),
  (7, 'Lane drift detected during route segment', '2026-08-31 12:16:00', '2026-08-31', 8, 'pi-viratrak-02', 2, 8, '20260831121500-8-V2W3X4'),
  (8, 'Hard braking event recorded by device', '2026-08-20 15:31:00', '2026-08-20', 9, 'pi-viratrak-03', 3, 9, '20260820153000-9-Y5Z6A7'),
  (9, 'Drowsiness score exceeded alert threshold', '2026-08-10 11:06:00', '2026-08-10', 10, 'pi-viratrak-01', 1, 10, '20260810110500-10-B8C9D0'),
  (10, 'Follow-up action logged by supervisor', '2026-08-10 11:08:00', '2026-08-10', 10, 'pi-viratrak-01', 1, 10, '20260810110500-10-B8C9D0');

INSERT INTO public.system_log (
  systemlog_id, message, log_type, timestamp, device_id
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Dashboard records synchronized successfully and the latest fleet data is available.', 'INFO', '2026-09-08 10:20:00', 'pi-viratrak-01'),
  (2, 'Camera calibration is required before the next monitoring session can begin.', 'WARNING', '2026-09-08 08:00:00', 'pi-viratrak-02'),
  (3, 'The monitoring device stopped responding and exceeded the configured communication timeout.', 'ERROR', '2026-09-07 09:50:00', 'pi-viratrak-03'),
  (4, 'Device firmware verification completed successfully with no issues reported.', 'INFO', '2026-09-06 16:30:00', 'pi-viratrak-04'),
  (5, 'The video feed is experiencing elevated latency that may delay behavior detection results.', 'WARNING', '2026-09-05 13:10:00', 'pi-viratrak-05'),
  (6, 'The monitoring device entered maintenance mode for scheduled service and diagnostics.', 'INFO', '2026-09-03 10:25:00', 'pi-viratrak-06'),
  (7, 'The event screenshot could not be uploaded, so visual evidence may be unavailable.', 'ERROR', '2026-09-02 17:50:00', 'pi-viratrak-07'),
  (8, 'The camera connection was restored and live monitoring resumed normally.', 'INFO', '2026-08-31 12:25:00', 'pi-viratrak-08'),
  (9, 'Device storage is nearing its configured limit; archived recordings should be reviewed.', 'WARNING', '2026-08-20 15:40:00', 'pi-viratrak-09'),
  (10, 'Scheduled device health check completed successfully; all monitored components are operational.', 'INFO', '2026-08-10 11:15:00', 'pi-viratrak-10');

COMMIT;
