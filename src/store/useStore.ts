import { create } from 'zustand';
import { Vehicle, Driver, Student, Route, DriverAlert, SOSAlert, Notification, Trip, ActivityLog, DriverMonitoringState, AttendanceRecord, AttendanceSession, AttendanceEvent, TripStage, StudentAttendanceStatus } from '../data/types';
import { vehicles as initialVehicles, drivers as initialDrivers, students as initialStudents, routes as initialRoutes, driverAlerts as initialAlerts, sosAlerts as initialSOS, notifications as initialNotifications, trips as initialTrips, activityLogs as initialLogs, attendanceEvents as initialAttendanceEvents } from '../data/mockData';

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

  // Attendance state
  attendanceRecords: AttendanceRecord[];
  attendanceSession: AttendanceSession | null;
  attendanceEvents: AttendanceEvent[];
  selectedAttendanceVehicle: string;
  selectedAttendanceRoute: string;
  selectedTripStage: TripStage;
  lastScannedStudentId: string | null;
  lastScanResult: { success: boolean; message: string; student?: Student } | null;

  setSelectedVehicle: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  toggleDemoMode: () => void;

  // Attendance actions
  setSelectedAttendanceVehicle: (id: string) => void;
  setSelectedAttendanceRoute: (id: string) => void;
  setSelectedTripStage: (stage: TripStage) => void;
  startAttendanceSession: () => void;
  stopAttendanceSession: () => void;
  scanStudentQR: (qrCode: string) => void;
  markStudentAbsent: (studentId: string) => void;
  clearLastScanResult: () => void;
  getStudentsOnBus: (vehicleId: string) => Student[];
  getBusOccupancy: (vehicleId: string) => { total: number; capacity: number; pickedUp: number; onBus: number; dropped: number; absent: number };
  getAttendanceByVehicle: (vehicleId: string) => Student[];

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
  updateDriverGPS: (driverId: string, vehicleId: string, gps: { latitude: number; longitude: number; speed: number; heading: number }) => void;
  triggerDrowsiness: () => void;
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

  // Attendance initial state
  attendanceRecords: [],
  attendanceSession: null,
  attendanceEvents: initialAttendanceEvents,
  selectedAttendanceVehicle: 'BUS-101',
  selectedAttendanceRoute: 'RT-01',
  selectedTripStage: 'morning_pickup',
  lastScannedStudentId: null,
  lastScanResult: null,

  setSelectedVehicle: (id) => set({ selectedVehicle: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleDemoMode: () => set((s) => ({ demoModeActive: !s.demoModeActive })),

  // Attendance actions
  setSelectedAttendanceVehicle: (id) => set({ selectedAttendanceVehicle: id }),
  setSelectedAttendanceRoute: (id) => set({ selectedAttendanceRoute: id }),
  setSelectedTripStage: (stage) => set({ selectedTripStage: stage }),

  startAttendanceSession: () => {
    const state = get();
    const vehicle = state.vehicles.find(v => v.id === state.selectedAttendanceVehicle);
    if (!vehicle) return;
    const route = state.routes.find(r => r.id === state.selectedAttendanceRoute);
    const totalStudents = state.students.filter(s => s.assignedVehicleId === state.selectedAttendanceVehicle && s.assignedRouteId === state.selectedAttendanceRoute).length;
    const newSession: AttendanceSession = {
      id: `ASESS-${Date.now()}`,
      vehicleId: state.selectedAttendanceVehicle,
      routeId: state.selectedAttendanceRoute,
      tripStage: state.selectedTripStage,
      startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isActive: true,
      totalStudents,
      boarded: 0,
      dropped: 0,
      scannedStudentIds: [],
    };
    set({
      attendanceSession: newSession,
      attendanceRecords: [],
      lastScannedStudentId: null,
      lastScanResult: null,
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'student' as const,
        title: 'Attendance Session Started',
        message: `QR attendance session started for ${vehicle.id} on ${route?.name || state.selectedAttendanceRoute}`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        severity: 'info' as const,
        vehicleId: vehicle.id,
      }, ...state.notifications],
    });
  },

  stopAttendanceSession: () => set((s) => {
    if (!s.attendanceSession) return s;
    const session = s.attendanceSession;
    return {
      attendanceSession: { ...session, isActive: false, endTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'student' as const,
        title: 'Attendance Session Ended',
        message: `QR attendance session completed. Boarded: ${session.boarded}, Dropped: ${session.dropped}`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        severity: 'info' as const,
        vehicleId: session.vehicleId,
      }, ...s.notifications],
    };
  }),

  scanStudentQR: (qrCode: string) => {
    const state = get();
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const student = state.students.find(s => s.qrCode === qrCode);

    if (!student) {
      set({
        lastScanResult: { success: false, message: 'Unauthorized QR code - Student not found' },
        attendanceEvents: [{
          id: `AEVT-${Date.now()}`,
          type: 'unauthorized',
          studentId: 'unknown',
          studentName: 'Unknown',
          vehicleId: state.selectedAttendanceVehicle,
          message: `Unauthorized QR scan attempted on ${state.selectedAttendanceVehicle}`,
          time: now,
          severity: 'danger',
        }, ...state.attendanceEvents],
        notifications: [{
          id: `NOT-${Date.now()}`,
          type: 'student' as const,
          title: 'Unauthorized QR Scan',
          message: `Invalid QR code scanned on ${state.selectedAttendanceVehicle}`,
          time: now,
          read: false,
          severity: 'critical' as const,
          vehicleId: state.selectedAttendanceVehicle,
        }, ...state.notifications],
      });
      return;
    }

    if (student.assignedVehicleId !== state.selectedAttendanceVehicle) {
      set({
        lastScanResult: { success: false, message: `${student.fullName} is not assigned to ${state.selectedAttendanceVehicle}` },
        attendanceEvents: [{
          id: `AEVT-${Date.now()}`,
          type: 'unauthorized',
          studentId: student.id,
          studentName: student.fullName,
          vehicleId: state.selectedAttendanceVehicle,
          message: `${student.fullName} attempted to board wrong bus - assigned to ${student.assignedVehicleId}`,
          time: now,
          severity: 'warning',
        }, ...state.attendanceEvents],
        notifications: [{
          id: `NOT-${Date.now()}`,
          type: 'student' as const,
          title: 'Wrong Bus Alert',
          message: `${student.fullName} scanned on wrong bus. Assigned: ${student.assignedVehicleId}`,
          time: now,
          read: false,
          severity: 'warning' as const,
          vehicleId: state.selectedAttendanceVehicle,
        }, ...state.notifications],
      });
      return;
    }

    const isDropStage = state.selectedTripStage.includes('drop');
    const isAlreadyBoarded = student.attendanceStatus === 'on_bus' || student.attendanceStatus === 'picked_up';
    const isAlreadyDropped = student.attendanceStatus === 'dropped';

    if (!isDropStage && isAlreadyBoarded) {
      set({
        lastScanResult: { success: false, message: `${student.fullName} has already boarded` },
      });
      return;
    }

    if (isDropStage && isAlreadyDropped) {
      set({
        lastScanResult: { success: false, message: `${student.fullName} has already been dropped` },
      });
      return;
    }

    if (isDropStage && !isAlreadyBoarded) {
      set({
        lastScanResult: { success: false, message: `${student.fullName} has not boarded yet` },
      });
      return;
    }

    const newStatus: StudentAttendanceStatus = isDropStage ? 'dropped' : 'on_bus';
    const record: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      studentId: student.id,
      vehicleId: state.selectedAttendanceVehicle,
      routeId: state.selectedAttendanceRoute,
      tripStage: state.selectedTripStage,
      scannedAt: now,
      scanType: isDropStage ? 'drop' : 'board',
      status: newStatus,
      scannedBy: 'demo',
    };

    const event: AttendanceEvent = {
      id: `AEVT-${Date.now()}`,
      type: isDropStage ? 'dropped' : 'boarded',
      studentId: student.id,
      studentName: student.fullName,
      vehicleId: state.selectedAttendanceVehicle,
      message: isDropStage
        ? `${student.fullName} dropped at school at ${now}`
        : `${student.fullName} boarded ${state.selectedAttendanceVehicle} at ${now}`,
      time: now,
      severity: 'success',
    };

    const activityLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      type: 'student',
      message: isDropStage
        ? `${student.fullName} dropped at school`
        : `${student.fullName} boarded ${state.selectedAttendanceVehicle}`,
      time: now,
      icon: 'check',
      severity: 'success',
    };

    set((s) => ({
      students: s.students.map(st => st.id === student.id ? {
        ...st,
        status: isDropStage ? 'dropped' as any : 'on_bus' as any,
        attendanceStatus: newStatus,
        lastBoardedAt: !isDropStage ? now : st.lastBoardedAt,
        lastDroppedAt: isDropStage ? now : st.lastDroppedAt,
        pickupTime: !isDropStage ? now : st.pickupTime,
        dropTime: isDropStage ? now : st.dropTime,
        attendanceHistory: [...st.attendanceHistory, record],
      } : st),
      attendanceRecords: [record, ...s.attendanceRecords],
      attendanceEvents: [event, ...s.attendanceEvents],
      activityLogs: [activityLog, ...s.activityLogs],
      attendanceSession: s.attendanceSession ? {
        ...s.attendanceSession,
        boarded: !isDropStage ? s.attendanceSession.boarded + 1 : s.attendanceSession.boarded,
        dropped: isDropStage ? s.attendanceSession.dropped + 1 : s.attendanceSession.dropped,
        scannedStudentIds: [...s.attendanceSession.scannedStudentIds, student.id],
      } : s.attendanceSession,
      lastScannedStudentId: student.id,
      lastScanResult: {
        success: true,
        message: isDropStage ? `${student.fullName} dropped successfully` : `${student.fullName} boarded successfully`,
        student,
      },
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'student' as const,
        title: isDropStage ? 'Student Dropped' : 'Student Boarded',
        message: isDropStage
          ? `${student.fullName} dropped at school - ${state.selectedAttendanceVehicle}`
          : `${student.fullName} boarded ${state.selectedAttendanceVehicle} at ${now}`,
        time: now,
        read: false,
        severity: 'info' as const,
        studentId: student.id,
        vehicleId: state.selectedAttendanceVehicle,
      }, ...s.notifications],
    }));
  },

  markStudentAbsent: (studentId: string) => {
    const state = get();
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    set((s) => ({
      students: s.students.map(st => st.id === studentId ? {
        ...st,
        status: 'absent' as any,
        attendanceStatus: 'absent' as StudentAttendanceStatus,
      } : st),
      attendanceEvents: [{
        id: `AEVT-${Date.now()}`,
        type: 'absent',
        studentId: student.id,
        studentName: student.fullName,
        vehicleId: state.selectedAttendanceVehicle,
        message: `${student.fullName} marked as absent`,
        time: now,
        severity: 'warning',
      }, ...s.attendanceEvents],
    }));
  },

  clearLastScanResult: () => set({ lastScanResult: null }),

  getStudentsOnBus: (vehicleId: string) => {
    return get().students.filter(s => s.assignedVehicleId === vehicleId && (s.attendanceStatus === 'on_bus' || s.attendanceStatus === 'picked_up'));
  },

  getBusOccupancy: (vehicleId: string) => {
    const state = get();
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    const assignedStudents = state.students.filter(s => s.assignedVehicleId === vehicleId);
    return {
      total: assignedStudents.length,
      capacity: vehicle?.capacity || 40,
      pickedUp: assignedStudents.filter(s => s.attendanceStatus === 'picked_up').length,
      onBus: assignedStudents.filter(s => s.attendanceStatus === 'on_bus').length,
      dropped: assignedStudents.filter(s => s.attendanceStatus === 'dropped').length,
      absent: assignedStudents.filter(s => s.attendanceStatus === 'absent').length,
    };
  },

  getAttendanceByVehicle: (vehicleId: string) => {
    return get().students.filter(s => s.assignedVehicleId === vehicleId);
  },

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

  updateDriverGPS: (driverId, vehicleId, gps) => set((s) => ({
    vehicles: s.vehicles.map(v => v.id === vehicleId ? {
      ...v,
      currentLat: gps.latitude,
      currentLng: gps.longitude,
      speed: Math.round(gps.speed * 3.6),
      heading: gps.heading,
      lastUpdate: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'moving' as const,
    } : v),
    drivers: s.drivers.map(d => d.id === driverId ? {
      ...d,
      currentLat: gps.latitude,
      currentLng: gps.longitude,
      status: 'on_duty' as const,
    } : d),
  })),

  triggerDrowsiness: () => set((s) => {
    const vehicle = s.vehicles[0];
    const driver = s.drivers.find(d => d.id === 'DRV-07') || s.drivers[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return {
      monitoringState: {
        ...s.monitoringState,
        status: 'drowsiness_alert',
        eyesClosed: true,
        eyesClosedStart: Date.now(),
        drowsinessScore: 0.95,
        faceDetected: true,
      },
      driverAlerts: [{
        id: `DA-${Date.now()}`,
        driverId: driver.id,
        vehicleId: vehicle.id,
        type: 'drowsiness' as const,
        severity: 'high' as const,
        message: 'Driver drowsiness detected - eyes closed for 5 seconds',
        time: now,
        acknowledged: false,
      }, ...s.driverAlerts],
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'alert',
        message: `Drowsiness detected for ${driver.fullName} in ${vehicle.id}`,
        time: now,
        icon: 'alert-triangle',
        severity: 'warning' as const,
      }, ...s.activityLogs],
    };
  }),
}));
