-- ViraTrak schema migration
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/fgfxfghtzhlkxmljtprh/sql/new

-- -------------------------------------------------------
-- USERS  (system accounts: Owner / Administrator / Supervisor)
-- -------------------------------------------------------
create table if not exists public.users (
  id            serial primary key,
  first_name    text        not null,
  last_name     text        not null,
  email         text unique not null,
  role          text        not null check (role in ('Owner','Administrator','Supervisor')),
  status        text        not null default 'Active' check (status in ('Active','Inactive')),
  last_login    text        not null default 'Never',
  password      text        not null,
  must_change_password boolean not null default false,
  created_at    timestamptz not null default now()
);

-- -------------------------------------------------------
-- EMPLOYEES  (driver profiles)
-- -------------------------------------------------------
create table if not exists public.employees (
  id            serial primary key,
  first_name    text    not null,
  last_name     text    not null,
  vehicle       text    not null,
  contact       text    not null,
  safety_score  integer not null default 100 check (safety_score >= 0 and safety_score <= 100),
  created_at    timestamptz not null default now()
);

-- -------------------------------------------------------
-- Employee code: [MM][YYYY][0001] via sequence + trigger
-- -------------------------------------------------------
create sequence if not exists public.employees_code_seq;

alter table public.employees add column if not exists employee_code text unique;

create or replace function public.generate_employee_code() returns trigger as $$
begin
  if new.employee_code is null or new.employee_code = '' then
    new.employee_code := to_char(now(), 'MMYYYY') || lpad(nextval('public.employees_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_employee_code on public.employees;
create trigger set_employee_code before insert on public.employees
for each row execute procedure public.generate_employee_code();

-- -------------------------------------------------------
-- ALERTS  (detected driver behavior events)
-- -------------------------------------------------------
create table if not exists public.alerts (
  id          serial primary key,
  type        text    not null,
  driver      text    not null,
  vehicle     text    not null,
  date        text    not null,
  time        text    not null,
  severity    text    not null check (severity in ('High','Moderate','Low')),
  evidence    boolean not null default false,
  icon_color  text    not null default '#F59E0B',
  icon_bg     text    not null default '#FFF7ED',
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------
-- SYSTEM LOGS  (audit trail: system + hardware events)
-- -------------------------------------------------------
create table if not exists public.system_logs (
  id      serial primary key,
  source  text not null check (source in ('System','Hardware')),
  date    text not null,
  time    text not null,
  level   text not null check (level in ('INFO','WARNING','ERROR')),
  ref     text not null,
  action  text not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------
-- Row Level Security — disable for server-side access
-- -------------------------------------------------------
alter table public.users       disable row level security;
alter table public.employees   disable row level security;
alter table public.alerts      disable row level security;
alter table public.system_logs disable row level security;

-- -------------------------------------------------------
-- Seed: default owner account
-- -------------------------------------------------------
insert into public.users (id, first_name, last_name, email, role, status, last_login, password, must_change_password)
values (1, 'Admin', 'User', 'admin@viratrak.com', 'Owner', 'Active', 'Never', 'admin123', false)
on conflict (id) do nothing;

-- -------------------------------------------------------
-- Seed: sample employees
-- -------------------------------------------------------
insert into public.employees (id, employee_code, first_name, last_name, vehicle, contact, safety_score) values
  (1, '0620260001', 'Juan',   'Dela Cruz',  'TRK-101', '+63 912 345 6789', 87),
  (2, '0620260002', 'Mark',   'Santos',     'TRK-104', '+63 917 234 5678', 92),
  (3, '0620260003', 'Pedro',  'Reyes',      'TRK-107', '+63 918 345 6790', 74),
  (4, '0620260004', 'Luis',   'Fernandez',  'TRK-103', '+63 919 456 7891', 95),
  (5, '0620260005', 'Ramon',  'Garcia',     'TRK-102', '+63 920 567 8902', 88),
  (6, '0620260006', 'Carlos', 'Santos',     'TRK-108', '+63 921 678 9013', 61),
  (7, '0620260007', 'Mario',  'Cruz',       'TRK-105', '+63 922 789 0124', 78)
on conflict (id) do nothing;

-- -------------------------------------------------------
-- Seed: sample alerts
-- -------------------------------------------------------
insert into public.alerts (type, driver, vehicle, date, time, severity, evidence, icon_color, icon_bg) values
  ('Yawning',      'Juan Dela Cruz',  'TRK-101', '2026-06-16', '10:23:14', 'High',     true,  '#F59E0B', '#FFF7ED'),
  ('Eyes Closed',  'Mark Santos',     'TRK-104', '2026-06-16', '10:18:07', 'High',     true,  '#EF4444', '#FEF2F2'),
  ('Head Pose',    'Pedro Reyes',     'TRK-107', '2026-06-16', '10:12:45', 'Moderate', true,  '#F59E0B', '#FFF7ED'),
  ('Body Posture', 'Luis Fernandez',  'TRK-103', '2026-06-16', '09:58:33', 'Moderate', false, '#8B5CF6', '#F5F3FF'),
  ('Micro Sleep',  'Ramon Garcia',    'TRK-102', '2026-06-16', '09:45:21', 'Low',      true,  '#1D6AE5', '#EBF2FF'),
  ('Yawning',      'Carlos Santos',   'TRK-108', '2026-06-16', '09:30:10', 'High',     true,  '#F59E0B', '#FFF7ED'),
  ('Eyes Closed',  'Mario Cruz',      'TRK-105', '2026-06-15', '09:12:55', 'High',     false, '#EF4444', '#FEF2F2'),
  ('Head Pose',    'Jose Reyes',      'TRK-109', '2026-06-15', '08:50:22', 'Moderate', true,  '#F59E0B', '#FFF7ED'),
  ('Body Posture', 'Juan Dela Cruz',  'TRK-101', '2026-06-15', '08:20:05', 'Low',      false, '#8B5CF6', '#F5F3FF'),
  ('Blink Rate',   'Mark Santos',     'TRK-104', '2026-06-14', '14:05:33', 'Moderate', true,  '#1D6AE5', '#EBF2FF'),
  ('Yawning',      'Pedro Reyes',     'TRK-107', '2026-06-14', '13:22:11', 'High',     true,  '#F59E0B', '#FFF7ED'),
  ('Eyes Closed',  'Ramon Garcia',    'TRK-102', '2026-06-14', '11:44:08', 'Moderate', false, '#EF4444', '#FEF2F2'),
  ('Micro Sleep',  'Carlos Santos',   'TRK-108', '2026-06-13', '15:30:00', 'High',     true,  '#1D6AE5', '#EBF2FF'),
  ('Body Posture', 'Mario Cruz',      'TRK-105', '2026-06-13', '09:05:44', 'Low',      false, '#8B5CF6', '#F5F3FF'),
  ('Head Pose',    'Jose Reyes',      'TRK-109', '2026-06-12', '16:18:22', 'Moderate', true,  '#F59E0B', '#FFF7ED');

-- -------------------------------------------------------
-- Seed: sample system logs
-- -------------------------------------------------------
insert into public.system_logs (source, date, time, level, ref, action) values
  ('System',   '2026-06-16', '10:24:01', 'INFO',    'Monitoring', 'Live monitoring feed started for TRK-101'),
  ('System',   '2026-06-16', '10:18:07', 'ERROR',   'Detection',  'Eyes closed alert triggered — Mark Santos (TRK-104)'),
  ('System',   '2026-06-16', '10:15:30', 'INFO',    'Auth',       'User logged in from 192.168.1.10 — Admin User'),
  ('System',   '2026-06-16', '10:00:00', 'INFO',    'System',     'Daily system health check passed'),
  ('System',   '2026-06-16', '09:45:21', 'INFO',    'Detection',  'Head pose abnormal — Ramon Garcia (TRK-102)'),
  ('System',   '2026-06-16', '09:30:00', 'INFO',    'Reports',    'Exported weekly report — alerts_jun_16.csv'),
  ('System',   '2026-06-16', '08:00:00', 'INFO',    'System',     'Shift started — 6 drivers assigned to routes'),
  ('Hardware', '2026-06-16', '10:23:55', 'ERROR',   'Camera',     'TRK-101 camera feed interrupted for 2s'),
  ('Hardware', '2026-06-16', '10:10:00', 'WARNING', 'Sensor',     'TRK-107 IR sensor calibration drift detected'),
  ('Hardware', '2026-06-16', '09:50:00', 'INFO',    'Firmware',   'TRK-104 firmware updated to v2.4.1'),
  ('Hardware', '2026-06-16', '08:05:00', 'ERROR',   'Camera',     'TRK-108 camera offline — reconnect attempt 1/3'),
  ('Hardware', '2026-06-15', '17:30:00', 'INFO',    'System',     'End-of-shift hardware diagnostics passed (6/7)'),
  ('Hardware', '2026-06-15', '14:22:00', 'WARNING', 'Battery',    'TRK-103 backup battery at 18% — schedule replacement'),
  ('Hardware', '2026-06-14', '11:00:00', 'INFO',    'Firmware',   'Fleet-wide firmware check completed — 5 up-to-date'),
  ('Hardware', '2026-06-13', '09:15:00', 'ERROR',   'Sensor',     'TRK-102 eye-tracking sensor hardware fault — replaced');
