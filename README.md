# Smart Route Management System

A comprehensive school bus fleet management platform with real-time GPS tracking, driver monitoring, SOS emergency system, QR-based student attendance, and dark/light mode support.

## Live Demo

**https://sms.codenestnep.com**

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS (dark mode: `class` strategy)
- **State Management:** Zustand
- **Maps:** Leaflet + React-Leaflet
- **Charts:** Recharts
- **Face Detection:** face-api.js, MediaPipe
- **QR Codes:** qrcode.react
- **Routing:** React Router DOM
- **Icons:** Lucide React

## Features

### Dashboard
- Real-time KPI cards (vehicles, drivers, students, routes)
- Vehicle status distribution charts
- Weekly trip analytics
- Driver safety score overview
- Activity logs and recent alerts

### Fleet Management
- Live vehicle tracking on interactive maps
- Vehicle status monitoring (moving, stopped, idle, delayed, offline, emergency)
- Real-time speed, heading, and GPS coordinates
- Vehicle assignment to drivers and routes

### Driver Monitoring
- Face detection and drowsiness detection using webcam
- Eye aspect ratio (EAR) analysis for blink detection
- Head pose estimation (pitch, yaw, roll)
- Audio buzzer alerts for drowsiness
- Driver safety scoring system
- Driving hours tracking

### SOS Emergency System
- One-touch SOS activation from driver page
- Multi-level escalation (Primary > Secondary > Authority)
- Auto-escalation timer with configurable intervals
- Real-time GPS location sharing
- Response acknowledgment tracking
- Emergency contact management

### Student Tracking
- Student pickup and drop status
- Bus occupancy tracking
- Parent contact information
- Route assignment per student
- Real-time student status (waiting, picked_up, on_bus, dropped, absent)

### QR-Based Student Bus Attendance
- Unique QR code generation per student (display/print ready)
- QR scanner for real-time attendance marking on bus
- Scan-by-ID manual entry fallback
- Attendance summary with trip-level and daily statistics
- Pickup/drop tracking per student per trip
- Demo QR scanner for testing without camera
- Attendance status badges (Present/Absent/Late/Excused)

### Dark Mode / Light Mode / System Default
- Three theme options: Light, Dark, System Default
- Theme toggle dropdown in header
- Theme persisted in localStorage (`smartbus-theme`)
- Flash prevention script in `index.html` (reads theme before render)
- Theme-aware Leaflet map tiles (light basemap / dark basemap)
- Theme-aware Recharts (grid, axis, tooltip colors adapt)
- QR codes always render with white background regardless of theme
- SOS/emergency colors remain highly visible in both themes
- Tailwind `darkMode: 'class'` strategy — classes applied to `<html>`

### Route Management
- Route creation with multiple stops
- Pickup, drop, and school stop types
- Estimated time and distance calculations
- Route status tracking (active, in_progress, completed, scheduled)

### Alerts & Notifications
- Driver alerts (drowsiness, overspeed, harsh braking, route deviation)
- Severity-based alert classification (low, medium, high, critical)
- Real-time notification system
- Alert acknowledgment tracking

### Reports
- Trip reports with pickup/drop statistics
- Driver performance reports
- Vehicle utilization reports

### Mobile Responsive
- Responsive sidebar navigation
- Mobile bottom navigation bar
- Touch-friendly interface

### Demo Mode
- Simulated bus movement
- Demo data visualization
- Toggle demo mode from sidebar panel

## Project Structure

```
src/
├── components/
│   ├── AttendanceSummary.tsx    # Attendance stats cards
│   ├── AttendanceStatusBadge.tsx # Attendance status indicator
│   ├── DemoPanel.tsx            # Demo mode controls
│   ├── DemoQRScanner.tsx        # Demo QR scanner (no camera)
│   ├── Header.tsx               # Top navigation header + theme toggle
│   ├── LiveCameraFeed.tsx       # Webcam feed for face detection
│   ├── MobileNav.tsx            # Mobile bottom navigation
│   ├── QRScanner.tsx            # Real QR scanner (camera-based)
│   ├── Sidebar.tsx              # Side navigation menu
│   ├── StudentQRCode.tsx        # Individual student QR code
│   └── ThemeToggle.tsx          # Light/Dark/System theme dropdown
├── data/
│   ├── mockData.ts              # Sample data for demo
│   └── types.ts                 # TypeScript interfaces
├── hooks/
│   ├── useBuzzer.ts             # Audio buzzer for alerts
│   ├── useFaceDetection.ts      # Face detection & drowsiness
│   ├── useGPS.ts                # GPS location tracking
│   └── useWebRTC.ts             # WebRTC camera utilities
├── pages/
│   ├── Attendance.tsx           # Attendance overview + QR scanner
│   ├── Dashboard.tsx            # Main dashboard
│   ├── Driver.tsx               # Individual driver view (mobile)
│   ├── DriverMonitoring.tsx     # Driver face monitoring
│   ├── Drivers.tsx              # Driver management
│   ├── LiveFleet.tsx            # Live fleet tracking map
│   ├── Notifications.tsx        # Notification center
│   ├── Reports.tsx              # Reports dashboard
│   ├── Routes.tsx               # Route management
│   ├── Settings.tsx             # System settings + Appearance
│   ├── SOSEmergency.tsx         # SOS emergency panel
│   ├── Students.tsx             # Student management + QR codes
│   ├── Trips.tsx                # Trip management
│   └── Vehicles.tsx             # Vehicle management
├── store/
│   └── useStore.ts              # Zustand state store (incl. theme)
├── App.tsx                      # Main application
├── main.tsx                     # Entry point
└── index.css                    # Theme-aware global styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment (Shared Hosting)

### SSH Setup

```bash
# Add to ~/.ssh/config
Host smart-route-deploy
  HostName sms.codenestnep.com
  User codenest
  IdentityFile ~/.ssh/smart_route_key
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
```

### Deploy

```bash
# Build
npm run build

# Upload dist to server
scp -r dist/* smart-route-deploy:~/sms.codenestnep.com/
```

### Server Requirements

- Apache with `mod_rewrite` enabled
- `.htaccess` for SPA routing (React Router):
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Environment Variables

No `.env` file required — all configuration is in-code.

## Key Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview of all fleet operations + attendance stats |
| Live Fleet | Real-time map tracking of all vehicles (light/dark tiles) |
| Vehicles | Vehicle list and management |
| Drivers | Driver profiles and status |
| Students | Student list with QR codes and bus assignments |
| Routes | Route definitions and stop management |
| Trips | Trip scheduling and tracking |
| Attendance | QR-based bus attendance scanning and overview |
| Driver Monitoring | Live webcam drowsiness detection |
| Alerts | Driver alert management |
| SOS Emergency | Emergency response panel |
| Notifications | System notifications |
| Reports | Analytics and reporting |
| Settings | System configuration + Appearance (Light/Dark/System) |

## License

MIT
