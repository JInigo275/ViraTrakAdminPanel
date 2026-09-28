# IMPORTANT NOTES!!!
- Remove System Log Source. Temporarily retain system logs only.
- Remove "Warning" in System Logs Type.
- Add Dark Mode Colors, apply proper dark mode colors.
- Add Range in Analytics
- Temporarily Remove Blink Rate to all.
- Add Low to Driver Load Bar Graph in Analytics Page
- Colors of Bar Graph Alert = Blue, Low = Green, Moderate = Yellow, High = Red.
- Transfer Active Drivers and Vehicles from Analytics Page to Dashboard Page.
- Add Low Severity Stat Card in Analytics Page.
- Add Device ID in Add Vehicle Options via Text. (Sample: pi-viratrak-01)
   - Edit only the Number Part. pi-viratrak- cannot be changed.
- Read Data from recent_alerts view for Dashboard, analytics and, alerts and evidences.

# ViraTrak Admin Panel

## Overview

ViraTrak Admin Panel is a React + Supabase admin dashboard for managing drivers, vehicles, alerts, recorded evidence, and system logs. It is built with modern frontend tooling and a normalized PostgreSQL schema in `schema2.sql`.

This repository is intended for developers and administrators who need a clean, maintainable interface to create, inspect, and manage the core data model behind the ViraTrak system.

## Key Features

- Driver and vehicle management
- Alert creation and evidence recording
- Behavioral event logging and system logs
- Supabase-backed database operations
- Responsive admin UI with components, forms, and tables
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

4. Use the Supabase project connection settings in `supabaseinfo.env` or your local environment to configure the client

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

The legacy `viratrak_schema.sql` file has been removed from this repository. `schema2.sql` is the single source of truth for schema creation and schema-related setup.

## Working with Supabase

- `src/api/supabaseClient.ts` initializes the Supabase client
- `src/api/viratrak.ts` contains reusable API helpers for CRUD operations and normalized query logic
- `src/app/pages/TestPage.tsx` contains sample insertion workflows and evidence generation logic

## Evidence ID Generation

Recorded evidence IDs are generated as a deterministic string, composed of:

- current date (`YYYYMMDD`)
- current time (`HHMMSS`)
- alert index or alert number
- random alphanumeric suffix

This ensures uniqueness for evidence records and avoids collisions in the primary key.

## How to Use

- `AlertsPage` — Browse, filter, and preview alerts with evidence status
- `DriversPage` — View and manage driver data
- `UsersPage` — Admin user management
- `SettingsPage` — Application-level settings and configuration
- `TestPage` — Development and test utilities for data creation and workflow validation

## Recommended Workflow

1. Apply `schema2.sql` in Supabase or your PostgreSQL instance
2. Use `npm run dev` to start the dashboard
3. Log in using seeded or admin credentials if available
4. Interact with alerts, evidence, and logs through the UI

## Notes for Contributors

- Keep schema changes in `schema2.sql`
- Keep UI primitives reusable under `src/app/components/ui`
- Avoid duplicate schema files or legacy SQL definitions
- Use strict types in TypeScript and handle Supabase errors gracefully

## Contributors

Developed by:

- Johann Inigo Emmanuel Mercado
- Rine Nathan Cabusao
- Irish Dianne Macapagal
- Uriz Soliman

## Copyright

© 2026 ViraTrak Admin Panel. All rights reserved.

This project and its source code, design, branding, components, and related materials are the intellectual property of the ViraTrak project owner and contributors. No part of this software may be reproduced, distributed, modified, or used for commercial purposes without prior written permission, unless otherwise stated by a separate license agreement.

### Third-Party Assets

This project includes third-party libraries, frameworks, icons, and UI components subject to their own licenses. Their use is governed by the respective package licenses and attribution requirements.

## License

<<<<<<< Updated upstream
This repository is provided as a development and admin dashboard asset. Update licensing information as needed for your project.
  
=======
This project is currently structured as an internal application and does not include a project license file. If you plan to distribute or commercialize it, add the appropriate license before release.

## Contributing

1. Create a feature branch.
2. Keep changes scoped and well-tested.
3. Update related documentation when schema or app workflows change.
4. Verify the app builds successfully before submitting changes.

>>>>>>> Stashed changes
