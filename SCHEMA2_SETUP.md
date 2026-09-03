# Schema2 Setup Guide

## Overview
The ViraTrak Admin Panel has been updated to work with the normalized ERD schema (schema2.sql). The UI components remain unchanged; the API layer handles all mapping between the new database structure and the app's existing types.

## Setup Steps

### 1. Prepare Supabase
- Backup your existing Supabase database (optional)
- Open your Supabase SQL editor

### 2. Drop Old Tables (if migrating)
If you have existing data in the old schema, export it first. Then run:
```sql
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
```

### 3. Apply schema2.sql
Paste the entire contents of `schema2.sql` into the Supabase SQL editor and execute.

### 4. Seed Your Data
The normalized schema requires data in these tables:
- **driver** (driver_id, first_name, last_name, license_number, contact_info)
- **vehicle** (vehicle_id, plate_number, model, driver_id)
- **device** (device_id, status, video_feed, vehicle_id)
- **recorded_evidence** (event_id, timestamp, device_id)
- **detection_events** (id, created_at, reported_at, alert_level, triggered_metrics, eyes_status, yawn_status, head_pose_status, posture_status, fps, device_id, screenshot_url)
- **detection** (detection_id, timestamp, perclos, blink_rate, yawn, body_posture, head_pose, fatigue_score, driver_state, event_id, detection_event_id)
- **alert** (alert_id, alert_level, alert_type, duration, detection_id, detection_event_id)
- **system_log** (systemlog_id, message, log_type, timestamp, device_id)

### 5. Verify Connectivity
The app's API layer will automatically:
- Fetch drivers with their vehicle assignments
- Load alerts with driver/vehicle context
- Display system and behavior logs
- Calculate safety scores from alert history

## Data Mapping Reference

### Drivers Page
Maps from: `driver` + `vehicle` tables
- Lists all drivers with assigned vehicles
- Safety score calculated from related alerts
- Vehicle plate number displayed in vehicle column

### Alerts Page / Dashboard
Maps from: `alert` → `detection` → `recorded_evidence` → `device` → `vehicle` → `driver`
- Recent events shown with driver and vehicle context
- Alert level maps to severity (High/Moderate/Low)
- Timestamps extracted and formatted as MM/DD/YYYY HH:MM

### System Logs / Dashboard
Maps from: `system_log` and `behavior_log` tables
- System logs displayed with message and log type
- Hardware logs show device associations
- Timestamps formatted consistently

## Important Notes

⚠️ **RLS (Row Level Security)**
- If you have RLS policies, ensure the API user has SELECT access to all required tables
- The app makes nested queries across multiple tables

⚠️ **Foreign Key Constraints**
- All FK constraints use ON DELETE SET NULL, so related records won't cascade-delete

⚠️ **Timestamp Format**
- The app expects date format: MM/DD/YYYY and time format: HH:MM
- Ensure your data follows this format or update `parseAlertTimestamp` in the API

## Troubleshooting

**Blank driver list?**
- Check that `driver` and `vehicle` tables have data
- Verify the LEFT JOIN is working correctly

**No alerts showing?**
- Verify `alert`, `detection`, and `recorded_evidence` tables are populated
- Check device → vehicle → driver relationships are linked

**Logs not appearing?**
- Ensure `system_log` or `behavior_log` have records
- Verify timestamps are parseable (ISO format or MM/DD/YYYY HH:MM)

## API Changes

All data access goes through `/src/api/viratrak.ts`:
- **driversApi.list()** - Fetches normalized driver data with vehicle context
- **alertsApi.list()** - Fetches alerts with driver/vehicle enrichment
- **logsApi.list()** - Combines system_log and behavior_log
- **usersApi** - Unchanged, still uses users table

No UI components need modification; the mapping is transparent to the app.
