# ViraTrak Admin Panel

A Vite + React administrative dashboard for managing ViraTrak operations, including drivers, vehicles, alerts, analytics, and system activity. The app is backed by Supabase and is designed for internal monitoring and operational workflows.

## Overview

This project provides a responsive admin interface for reviewing live operational data and managing core entities in the ViraTrak ecosystem. It includes dashboard widgets, alert review screens, user management, driver and vehicle records, and system log visibility.

The frontend is built in TypeScript with shared application components and custom CSS.

## Features

- Dashboard with KPI cards and recent activity
- Alerts and evidence review workflow
- Driver and vehicle management screens
- System logs and analytics views
- User access management and role-based restrictions
- Supabase integration for data access and authentication
- Responsive layout for desktop and mobile use

## Tech Stack

- Frontend: React + Vite
- Language: TypeScript
- Styling: custom CSS + Tailwind utility patterns
- Backend/data: Supabase (PostgreSQL)
- Charts and data display: Recharts
- PDF/export support: jsPDF / xlsx

## Project Structure

```text
.
├── src/
│   ├── api/
│   │   ├── supabaseClient.ts
│   │   └── viratrak.ts
│   ├── app/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── main.tsx
│   └── utils/
├── supabase/
│   └── functions/
├── index.html
├── package.json
├── vite.config.ts
├── ERD.sql
├── README.md
└── pnpm-lock.yaml
```

## Prerequisites

- Node.js 18+ recommended
- pnpm
- A Supabase project with the required tables and auth configuration

## Environment Setup

This app expects Supabase environment variables to be defined in the browser environment.

Create a local environment file from the example:

```bash
cp .env.example .env
```

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SCHEMA=public
```

The client is initialized in `src/api/supabaseClient.ts`, and it will warn in the console if the required variables are missing.

## Installation

```bash
pnpm install
```

## Running the App

Development server:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
```

Then open the local Vite URL shown in the terminal.

## Database and Supabase Notes

The frontend depends on a Supabase-backed database. `ERD.sql` is a structure reference only, not a migration script; `pre_migration_backup.sql` is a historical backup.

Key integration points:

- `src/api/supabaseClient.ts` creates the Supabase client
- `src/api/viratrak.ts` contains DB access helpers and validation logic
- the app expects tables like users, driver, vehicle, alerts, and system logging data to exist in the configured schema

If your Supabase project is not fully configured yet, the app may fall back to demo/admin account behavior in some flows.

## Main App Pages

- Dashboard — KPI overview and recent activity
- Alerts — alert review and evidence status tracking
- Analytics — reporting and trend views
- Drivers — employee/driver record management
- Vehicles — assigned vehicle tracking
- Users — admin user management
- Settings — app configuration and account preferences
- System Logs — platform and operational event logging

## Development Notes

- Keep UI components reusable and consistent with the existing design system.
- Validate new data flows in the Supabase schema before wiring them into the frontend.
- Prefer typed helper functions and centralized data access instead of in-page database logic.
- Be careful with environment variables and schema names when working across local and production Supabase projects.

## License

This project is currently structured as an internal application and does not include a project license file. If you plan to distribute or commercialize it, add the appropriate license before release.

## Contributing

1. Create a feature branch.
2. Keep changes scoped and well-tested.
3. Update related documentation when schema or app workflows change.
4. Verify the app builds successfully before submitting changes.
