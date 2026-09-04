# ViraTrak Admin Panel

## Overview

ViraTrak Admin Panel is a React + Supabase admin dashboard for managing drivers, vehicles, alerts, recorded evidence, and system logs. It is built with modern frontend tooling and a normalized PostgreSQL schema in `schema2.sql`.

This repository is intended for developers and administrators who need a clean, maintainable interface to create, inspect, and manage the core data model behind the ViraTrak system.

## Key Features

- Driver and vehicle management
- Alert creation and evidence recording
- Behavioral event logging and system logs
- Supabase Auth with RLS-protected database operations
- Responsive admin UI with mobile navigation, forms, tables, and charts
- Shared validation for User, Driver, and Vehicle data
- Detailed schema support via `schema2.sql`

## Tech Stack

- Frontend: React with Vite
- Styling: Tailwind CSS
- Backend: Supabase (PostgreSQL + client)
- Language: TypeScript
- UI primitives: custom component library under `src/app/components/ui`

## Project Structure

- `src/main.tsx` — Application entry point
- `src/app/App.tsx` — Main app layout and routing
- `src/app/pages/` — Page components for Alerts, Drivers, Users, Settings, and Test utilities
- `src/api/` — Supabase client and API helpers (`supabaseClient.ts`, `viratrak.ts`)
- `src/app/components/` — Shared UI components, page headers, sidebars, and panels
- `src/app/components/ui/` — Design system primitives and reusable UI building blocks
- `schema2.sql` — Primary database schema for the normalized ViraTrak data model
- `schema2_rls.sql` — Row-Level Security policies and authenticated grants
- `validation_constraints.sql` — Database validation constraints and unique indexes
- `supabase/functions/create-user/` — Secure Auth and profile provisioning for new users
- `SCHEMA2_SETUP.md` — Setup guide for applying the schema

## Setup and Development

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Open the local URL shown in the terminal

4. Copy the required values into the single local `.env` file:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_SUPABASE_SCHEMA=public
```

Do not commit `.env` or place a service-role key in frontend code.

5. Restart the Vite server after changing `.env`.

## Database and Schema

This repository uses a normalized PostgreSQL schema defined in `schema2.sql`.

- `driver` — Driver records and profile data
- `vehicle` — Vehicle records linked to drivers
- `device` — Device records linked to vehicles
- `recorded_evidence` — Evidence records with unique `event_id`
- `detection` — Detection events linked to `recorded_evidence`
- `alert` — Alerts linked to detections
- `behavior_log` — Behavior log entries for event tracking
- `system_log` — System-level logs

### Important note

`schema2.sql` is the base schema. Apply `schema2_rls.sql` and `validation_constraints.sql` after it when using Supabase with authenticated access and strict validation.

## Working with Supabase

- `src/api/supabaseClient.ts` initializes the Supabase client
- `src/api/viratrak.ts` contains reusable API helpers for CRUD operations and normalized query logic
- `src/utils/validation.ts` contains shared frontend/API validation and formatting rules
- `supabase/functions/create-user/index.ts` creates a Supabase Auth user and matching profile atomically
- `src/app/pages/TestPage.tsx` contains development-only sample insertion workflows and evidence generation logic

### Authentication and user creation

Login uses Supabase Auth. The `public.users` table stores profile data, role, status, and password-change state; it must not be used to authenticate passwords.

Deploy the user-provisioning function from the repository root:

```bash
supabase login
supabase functions deploy create-user --project-ref YOUR_PROJECT_REF --use-api
```

The function requires the standard Supabase function secrets, including `SUPABASE_SERVICE_ROLE_KEY`, which stays server-side. New users are created in both `auth.users` and `public.users`. Owners and Administrators can create users; Administrators can create Supervisors only.

### Row-Level Security

Run `schema2_rls.sql` in the Supabase SQL Editor. Authenticated users can read operational data, while user creation is limited to trusted `app_metadata.role` values of `Owner` or `Administrator`. Set the role in Supabase Auth and sign out/in after changing metadata so the JWT refreshes.

### Validation rules

- Names allow letters, spaces, apostrophes, and hyphens.
- Emails are trimmed, lowercased, validated, and unique.
- Vehicle plates are uppercase alphanumeric values with a maximum of 8 characters and are unique.
- Phone numbers are stored with a country code and normalized to digits.
- Passwords require at least 8 characters, including uppercase, lowercase, a number, and a special character.

Frontend validation improves feedback, while API checks and `validation_constraints.sql` enforce important rules at the data boundary.

## Evidence ID Generation

Recorded evidence IDs are generated as a deterministic string, composed of:

- current date (`YYYYMMDD`)
- current time (`HHMMSS`)
- alert index or alert number
- random alphanumeric suffix

This ensures uniqueness for evidence records and avoids collisions in the primary key.

## How to Use

- `AlertsPage` — Browse, filter, and preview alerts with evidence status
- `DriversPage` — View and manage driver data, vehicles, and country-formatted phone numbers
- `UsersPage` — Admin user management
- `DriverDetailPage` — Driver metrics and live alert history
- `SettingsPage` — Profile and password settings
- `TestPage` — Development and test utilities for data creation and workflow validation

## Recommended Workflow

1. Apply `schema2.sql` in Supabase
2. Apply `schema2_rls.sql` and `validation_constraints.sql`
3. Create an initial user in Supabase Auth and add its matching `public.users` profile
4. Set the initial Auth user's `app_metadata.role` to `Owner`
5. Deploy `create-user` for future User page provisioning
6. Use `npm run dev` to start the dashboard
7. Configure Supabase Auth Site URL and redirect URLs for email confirmation

## Notes for Contributors

- Keep base schema changes in `schema2.sql` and security/validation changes in their dedicated SQL files
- Keep UI primitives reusable under `src/app/components/ui`
- Keep passwords out of `public.users` and frontend code
- Use strict types in TypeScript and handle Supabase errors gracefully

## License

This repository is provided as a development and admin dashboard asset. Update licensing information as needed for your project.

Created by: Inigo Mercado