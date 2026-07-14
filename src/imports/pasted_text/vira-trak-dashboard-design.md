Design a desktop web dashboard (1440px wide) for "ViraTrak" — a Driver Behavior Detection System. 
Use a clean, light UI with white backgrounds, light gray section containers (#F8F9FA), and a blue 
primary accent (#1D6AE5). All text in Inter font.

LAYOUT STRUCTURE:
Split into 3 columns:
- Left sidebar: 200px wide, white background with subtle border-right
- Main content area: ~780px wide, light gray background (#F4F5F7), padding 24px
- Right panel: ~400px wide, white background with left border, padding 24px

LEFT SIDEBAR:
- Top: Logo area with a blue shield icon and "ViraTrak" bold text, subtitle "Behavior Detection 
  System" in small gray text
- Nav items (vertical list, 48px tall each): Dashboard (active state: blue background #1D6AE5, 
  white text, rounded 8px), Live Monitoring, Events & Recordings, Drivers, Alerts, Reports, 
  Analytics, System Logs, Settings, Users — each with a matching outline icon on the left
- Bottom: Company selector "ViraTrak Logistics" with a dropdown chevron and a grid/building icon
- Footer: "© 2026 ViraTrak System. All rights reserved." in 11px gray text

TOP HEADER BAR (spans main + right panel):
- Left: "Dashboard" in 22px bold, subtitle "Overview of driver behavior and system status" in 
  13px gray
- Right: Search bar with placeholder "Search anything... Ctrl+K", notification bell icon with 
  red badge showing "3", user avatar circle + "Admin User / Administrator" with dropdown chevron

MAIN CONTENT — 4 STAT CARDS (horizontal row, equal width, white bg, rounded-12, shadow-sm):
1. Blue icon (people) — "Total Drivers" / bold "24" / "Active today" gray label / small blue 
   sparkline chart right-aligned
2. Green icon (shield check) — "Safe Drives" / bold "18" / "75% of total" green label / small 
   green sparkline
3. Orange icon (warning triangle) — "Alerts Today" / bold "6" / "25% from yesterday" orange 
   label / small orange sparkline
4. Red icon (video camera) — "Events Recorded" / bold "32" / "Today" gray label / small red 
   sparkline

LIVE MONITORING SECTION (white card, rounded-12):
- Header: "Live Monitoring" with a green pulsing dot + "Live" label, "View All" link top-right
- Left side (~390px): Dark grayscale image of a driver at the wheel with a green bounding box 
  rectangle overlaid on the face with green facial landmark dots. Top-left overlay: "CAM 01 • Cabin" 
  badge. Top-right: timestamp "10:24:15 AM". Bottom-left: red "● REC" indicator.
- Right side: 
  - "Detected Status" section title
  - 5 rows with icon + label + status value: Eyes→Open (green), Yawning→No (green), 
    Head Pose→Normal (blue), Distraction→No (green), Posture→Good (green)
  - "Vehicle Info" section below with 4 rows: Vehicle ID→TRK-101, Driver→Juan Dela Cruz, 
    Route→Manila→Clark, Speed→62 km/h. All in small gray/dark text pairs.

RECENT EVENTS TABLE (white card, rounded-12):
- Header: "Recent Events" + "View All" link
- Table with columns: Event | Driver | Vehicle | Time | Severity | Snapshot
- 5 rows of data:
  Row 1: [yawn icon] Yawning Detected | Juan Dela Cruz | TRK-101 | 10:23:14 AM | "High" red 
    badge | small thumbnail
  Row 2: [eye icon] Eyes Closed | Mark Santos | TRK-104 | 10:18:07 AM | "High" red badge | thumbnail
  Row 3: [distraction icon] Distraction Detected | Pedro Reyes | TRK-107 | 10:12:45 AM | 
    "Medium" orange badge | thumbnail
  Row 4: [posture icon] Poor Posture | Luis Fernandez | TRK-103 | 09:58:33 AM | "Medium" orange 
    badge | thumbnail
  Row 5: [head icon] Head Pose Abnormal | Ramon Garcia | TRK-102 | 09:45:21 AM | "Low" green 
    badge | thumbnail

RIGHT PANEL — TOP: "Recent Alerts" heading + "View All" link
4 alert rows (each: icon left, text center, time + severity badge right):
1. Orange yawn icon — "Yawning Detected" bold / "Driver: Juan Dela Cruz • Vehicle: TRK-101" 
   small gray — 10:23 AM — "High" red pill badge
2. Red eye icon — "Eyes Closed" / "Driver: Mark Santos • Vehicle: TRK-104" — 10:18 AM — 
   "High" red pill
3. Orange alert icon — "Distraction Detected" / "Driver: Pedro Reyes • Vehicle: TRK-107" — 
   10:12 AM — "Medium" orange pill
4. Purple posture icon — "Poor Posture" / "Driver: Luis Fernandez • Vehicle: TRK-103" — 
   09:58 AM — "Medium" orange pill

RIGHT PANEL — MIDDLE: "Behavior Summary (Today)"
- Donut chart (160px diameter), center label "32 / Total Events"
- Chart segments: Red 31% Yawning, Orange 22% Eyes Closed, Yellow 19% Distraction, 
  Green 16% Poor Posture, Blue 12% Head Pose Abnormal
- Legend to the right of chart with color dot + label + count + percentage for each

RIGHT PANEL — BOTTOM: "Alerts Trend" heading + "Last 7 Days" dropdown selector
- Line chart showing red trend line from May 14–20
- Y-axis 0–20, X-axis dates May 14, 15, 16, 17, 18, 19, 20
- Line dips low (~2) on May 14, rises to peak (~16) on May 18, drops back to ~3 on May 20

Use Inter font throughout. Severity badges: rounded pill shape, "High"=red bg+text, 
"Medium"=orange, "Low"=green. Icons: outlined style, matching the section color accent. 
All cards use white background, 12px border radius, subtle box shadow.