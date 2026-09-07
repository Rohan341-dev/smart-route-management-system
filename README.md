# Smart Route Management System

A comprehensive school bus fleet management platform with real-time GPS tracking, driver monitoring, SOS emergency system, and student safety features.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Maps:** Leaflet + React-Leaflet
- **Charts:** Recharts
- **Face Detection:** face-api.js, MediaPipe
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
│   ├── DemoPanel.tsx         # Demo mode controls
│   ├── Header.tsx            # Top navigation header
│   ├── LiveCameraFeed.tsx    # Webcam feed for face detection
│   ├── MobileNav.tsx         # Mobile bottom navigation
│   └── Sidebar.tsx           # Side navigation menu
├── data/
│   ├── mockData.ts           # Sample data for demo
│   └── types.ts              # TypeScript interfaces
├── hooks/
│   ├── useBuzzer.ts          # Audio buzzer for alerts
│   ├── useFaceDetection.ts   # Face detection & drowsiness
│   ├── useGPS.ts             # GPS location tracking
│   └── useWebRTC.ts          # WebRTC camera utilities
├── pages/
│   ├── Dashboard.tsx         # Main dashboard
│   ├── LiveFleet.tsx         # Live fleet tracking map
│   ├── Vehicles.tsx          # Vehicle management
│   ├── Drivers.tsx           # Driver management
│   ├── Driver.tsx            # Individual driver view
│   ├── Students.tsx          # Student management
│   ├── Routes.tsx            # Route management
│   ├── Trips.tsx             # Trip management
│   ├── DriverMonitoring.tsx  # Driver face monitoring
│   ├── Alerts.tsx            # Alert management
│   ├── SOSEmergency.tsx      # SOS emergency panel
│   ├── Notifications.tsx     # Notification center
│   ├── Reports.tsx           # Reports dashboard
│   └── Settings.tsx          # System settings
├── store/
│   └── useStore.ts           # Zustand state store
├── App.tsx                   # Main application
├── main.tsx                  # Entry point
└── index.css                 # Global styles
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

## Key Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview of all fleet operations |
| Live Fleet | Real-time map tracking of all vehicles |
| Vehicles | Vehicle list and management |
| Drivers | Driver profiles and status |
| Students | Student list with bus assignments |
| Routes | Route definitions and stop management |
| Trips | Trip scheduling and tracking |
| Driver Monitoring | Live webcam drowsiness detection |
| Alerts | Driver alert management |
| SOS Emergency | Emergency response panel |
| Notifications | System notifications |
| Reports | Analytics and reporting |
| Settings | System configuration |

## License

MIT
