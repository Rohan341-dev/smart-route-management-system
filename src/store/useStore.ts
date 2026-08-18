import { create } from 'zustand';
import { Vehicle, Driver, Student, Route, DriverAlert, SOSAlert, Notification, Trip, ActivityLog, DriverMonitoringState } from '../data/types';
import { vehicles as initialVehicles, drivers as initialDrivers, students as initialStudents, routes as initialRoutes, driverAlerts as initialAlerts, sosAlerts as initialSOS, notifications as initialNotifications, trips as initialTrips, activityLogs as initialLogs } from '../data/mockData';

interface AppState {
  vehicles: Vehicle[];
  drivers: Driver[];
  students: Student[];
  routes: Route[];
  driverAlerts: DriverAlert[];
  sosAlerts: SOSAlert[];
  notifications: Notification[];
  trips: Trip[];
  activityLogs: ActivityLog[];
  selectedVehicle: string | null;
  sidebarOpen: boolean;
  demoMode: boolean;
  demoModeActive: boolean;
  currentPage: string;
  monitoringState: DriverMonitoringState;
  escalationInterval: number | null;
  systemServices: { gps: boolean; ai: boolean; notifications: boolean };

  setSelectedVehicle: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  toggleDemoMode: () => void;

  // Demo simulation actions
  simulateBusMovement: () => void;
  simulateDrowsiness: () => void;
  triggerBuzzer: () => void;
  driverResponds: () => void;
  driverNoResponse: () => void;
  triggerSOS: () => void;
  adminResponds: () => void;
  adminNoResponse: () => void;
  secondaryResponds: () => void;
  secondaryNoResponse: () => void;
  resolveEmergency: () => void;
  simulateRouteDeviation: () => void;
  simulateStudentPickup: () => void;
  simulateStudentDrop: () => void;
  markNotificationRead: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  decrementEscalationTimer: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  vehicles: initialVehicles,
  drivers: initialDrivers,
  students: initialStudents,
  routes: initialRoutes,
  driverAlerts: initialAlerts,
  sosAlerts: initialSOS,
  notifications: initialNotifications,
  trips: initialTrips,
  activityLogs: initialLogs,
  selectedVehicle: null,
  sidebarOpen: true,
  demoMode: true,
  demoModeActive: true,
  currentPage: 'dashboard',
  escalationInterval: null,
  systemServices: { gps: true, ai: true, notifications: true },
  monitoringState: {
    isMonitoring: true,
    faceDetected: true,
    eyesOpen: true,
    eyeClosureDuration: 0,
    blinkFrequency: 15,
    headPosition: 'center',
    attention: 'normal',
    drowsinessDetected: false,
    buzzerActive: false,
    driverResponded: null,
    monitoringStartTime: Date.now(),
  },

  setSelectedVehicle: (id) => set({ selectedVehicle: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleDemoMode: () => set((s) => ({ demoModeActive: !s.demoModeActive })),

  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  acknowledgeAlert: (id) => set((s) => ({
    driverAlerts: s.driverAlerts.map(a => a.id === id ? { ...a, acknowledged: true } : a)
  })),

  simulateBusMovement: () => set((s) => ({
    vehicles: s.vehicles.map(v => {
      if (v.status === 'moving') {
        const latOffset = (Math.random() - 0.5) * 0.005;
        const lngOffset = (Math.random() - 0.5) * 0.005;
        const speedChange = (Math.random() - 0.5) * 10;
        return { ...v, lat: v.lat + latOffset, lng: v.lng + lngOffset, speed: Math.max(0, Math.min(80, v.speed + speedChange)) };
      }
      return v;
    })
  })),

  simulateDrowsiness: () => set((s) => ({
    monitoringState: { ...s.monitoringState, eyesOpen: false, eyeClosureDuration: 3, attention: 'distracted' as any, drowsinessDetected: false },
    drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'closed' as any, attention: 'distracted' as any } : d),
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'Eye closure detected on DRV-07 - Monitoring', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'eye', severity: 'warning' }, ...s.activityLogs],
  })),

  triggerBuzzer: () => set((s) => ({
    monitoringState: { ...s.monitoringState, eyesOpen: false, eyeClosureDuration: 5, drowsinessDetected: true, buzzerActive: true },
    drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'closed' as any, attention: 'absent' as any, drowsinessAlerts: d.drowsinessAlerts + 1 } : d),
    driverAlerts: [{ id: `ALT-${Date.now()}`, driverId: 'DRV-07', vehicleId: 'BUS-107', type: 'drowsiness', message: 'Driver eyes closed for 5 seconds - Drowsiness detected', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), severity: 'critical', acknowledged: false }, ...s.driverAlerts],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'DROWSINESS ALERT - DRV-07 on BUS-107', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'alert-triangle', severity: 'danger' }, ...s.activityLogs],
  })),

  driverResponds: () => set((s) => ({
    monitoringState: { ...s.monitoringState, eyesOpen: true, eyeClosureDuration: 0, drowsinessDetected: false, buzzerActive: false, driverResponded: true, attention: 'normal' },
    drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'open' as any, attention: 'normal' as any, safetyScore: Math.max(0, d.safetyScore - 1) } : d),
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'DRV-07 responded to drowsiness alert - Monitoring reset', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' }, ...s.activityLogs],
  })),

  driverNoResponse: () => {
    const state = get();
    set({
      sosAlerts: [{
        id: `SOS-${Date.now()}`, vehicleId: 'BUS-107', driverId: 'DRV-07',
        location: { lat: 27.7080, lng: 85.3150 }, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        reason: 'Driver did not respond to drowsiness alert', status: 'active', escalationLevel: 'primary', escalationTimer: 30,
        primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
        secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
        authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
        primaryResponded: false, secondaryResponded: false, authorityResponded: false,
      }],
      vehicles: state.vehicles.map(v => v.id === 'BUS-107' ? { ...v, status: 'emergency' as any } : v),
      drivers: state.drivers.map(d => d.id === 'DRV-07' ? { ...d, status: 'emergency' as any } : d),
      notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Alert', message: 'SOS triggered on BUS-107 - Driver did not respond to drowsiness alert', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'critical', vehicleId: 'BUS-107' }, ...state.notifications],
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'SOS TRIGGERED on BUS-107 - Driver unresponsive', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'alert-triangle', severity: 'danger' }, ...state.activityLogs],
    });
  },

  triggerSOS: () => {
    const state = get();
    const v = state.vehicles.find(v => v.id === 'BUS-101') || state.vehicles[0];
    set({
      sosAlerts: [{
        id: `SOS-${Date.now()}`, vehicleId: v.id, driverId: v.assignedDriver,
        location: { lat: v.lat, lng: v.lng }, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        reason: 'Manual SOS triggered by driver', status: 'active', escalationLevel: 'primary', escalationTimer: 30,
        primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
        secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
        authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
        primaryResponded: false, secondaryResponded: false, authorityResponded: false,
      }],
      vehicles: state.vehicles.map(sv => sv.id === v.id ? { ...sv, status: 'emergency' as any } : sv),
      drivers: state.drivers.map(d => d.id === v.assignedDriver ? { ...d, status: 'emergency' as any } : d),
      notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Alert', message: `SOS triggered on ${v.id} - Manual emergency`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'critical', vehicleId: v.id }, ...state.notifications],
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: `SOS TRIGGERED on ${v.id}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'alert-triangle', severity: 'danger' }, ...state.activityLogs],
    });
  },

  adminResponds: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.status === 'active' ? {
      ...sos, status: 'acknowledged' as any, primaryResponded: true,
      primaryContact: { ...sos.primaryContact, responded: true, responseTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    } : sos),
    notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Acknowledged', message: 'School Admin has acknowledged the SOS alert', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info' }, ...s.notifications],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'School Admin acknowledged SOS', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' }, ...s.activityLogs],
  })),

  adminNoResponse: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.status === 'active' ? {
      ...sos, escalationLevel: 'secondary' as any, escalationTimer: 30, status: 'escalating' as any
    } : sos),
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'SOS ESCALATED to Secondary Contact - Admin no response', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'arrow-up', severity: 'danger' }, ...s.activityLogs],
  })),

  secondaryResponds: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.escalationLevel === 'secondary' || sos.status === 'escalating' ? {
      ...sos, status: 'acknowledged' as any, secondaryResponded: true,
      secondaryContact: { ...sos.secondaryContact, responded: true, responseTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    } : sos),
    notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Acknowledged', message: 'Transport Manager has acknowledged the SOS', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info' }, ...s.notifications],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'Transport Manager acknowledged SOS', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' }, ...s.activityLogs],
  })),

  secondaryNoResponse: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.escalationLevel === 'secondary' || sos.status === 'escalating' ? {
      ...sos, escalationLevel: 'authority' as any, escalationTimer: 30, status: 'escalating' as any
    } : sos),
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'SOS ESCALATED to Local Authority - No response from secondary', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'shield', severity: 'danger' }, ...s.activityLogs],
  })),

  resolveEmergency: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.status !== 'resolved' ? { ...sos, status: 'resolved' as any } : sos),
    vehicles: s.vehicles.map(v => v.status === 'emergency' ? { ...v, status: 'stopped' as any } : v),
    drivers: s.drivers.map(d => d.status === 'emergency' ? { ...d, status: 'active' as any } : d),
    monitoringState: { ...s.monitoringState, eyesOpen: true, eyeClosureDuration: 0, drowsinessDetected: false, buzzerActive: false, driverResponded: null, attention: 'normal' },
    notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'Emergency Resolved', message: 'Emergency incident has been resolved', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info' }, ...s.notifications],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'Emergency RESOLVED', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' }, ...s.activityLogs],
  })),

  simulateRouteDeviation: () => set((s) => {
    const v = s.vehicles.find(v => v.status === 'moving') || s.vehicles[0];
    return {
      vehicles: s.vehicles.map(sv => sv.id === v.id ? { ...sv, status: 'route_deviation' as any } : sv),
      driverAlerts: [{ id: `ALT-${Date.now()}`, driverId: v.assignedDriver, vehicleId: v.id, type: 'route_deviation' as any, message: `${v.id} has deviated from planned route - 450m off route`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), severity: 'medium', acknowledged: false }, ...s.driverAlerts],
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'route', message: `ROUTE DEVIATION - ${v.id} moved off planned route`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'navigation', severity: 'warning' }, ...s.activityLogs],
      notifications: [{ id: `NOT-${Date.now()}`, type: 'vehicle', title: 'Route Deviation', message: `${v.id} has deviated from its assigned route`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'warning', vehicleId: v.id }, ...s.notifications],
    };
  }),

  simulateStudentPickup: () => set((s) => {
    const waitingStudent = s.students.find(st => st.status === 'waiting');
    if (!waitingStudent) return s;
    return {
      students: s.students.map(st => st.id === waitingStudent.id ? { ...st, status: 'on_bus' as any, pickupTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : st),
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'student', message: `${waitingStudent.fullName} picked up at ${waitingStudent.pickupStop}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check', severity: 'success' }, ...s.activityLogs],
      notifications: [{ id: `NOT-${Date.now()}`, type: 'student', title: 'Student Picked Up', message: `${waitingStudent.fullName} picked up at ${waitingStudent.pickupStop}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info', studentId: waitingStudent.id }, ...s.notifications],
    };
  }),

  simulateStudentDrop: () => set((s) => {
    const onBusStudent = s.students.find(st => st.status === 'on_bus');
    if (!onBusStudent) return s;
    return {
      students: s.students.map(st => st.id === onBusStudent.id ? { ...st, status: 'dropped' as any, dropTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : st),
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'student', message: `${onBusStudent.fullName} dropped at ${onBusStudent.dropStop}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check', severity: 'success' }, ...s.activityLogs],
      notifications: [{ id: `NOT-${Date.now()}`, type: 'student', title: 'Student Dropped', message: `${onBusStudent.fullName} dropped at ${onBusStudent.dropStop}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info', studentId: onBusStudent.id }, ...s.notifications],
    };
  }),

  decrementEscalationTimer: () => set((s) => ({
    sosAlerts: s.sosAlerts.map(sos => sos.status === 'active' || sos.status === 'escalating' ? {
      ...sos, escalationTimer: Math.max(0, sos.escalationTimer - 1)
    } : sos)
  })),
}));
