import { create } from 'zustand';
import { Vehicle, Driver, Student, Route, DriverAlert, SOSAlert, Notification, Trip, ActivityLog, DriverMonitoringState, AttendanceRecord, AttendanceSession, AttendanceEvent, TripStage, StudentAttendanceStatus, DriverMonitoringStateType, User, UserRole, SmartBusQRPayload, TripStatus, StopStatus } from '../data/types';
import { vehicles as initialVehicles, drivers as initialDrivers, students as initialStudents, routes as initialRoutes, driverAlerts as initialAlerts, sosAlerts as initialSOS, notifications as initialNotifications, trips as initialTrips, activityLogs as initialLogs, attendanceEvents as initialAttendanceEvents } from '../data/mockData';

export type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
  try {
    return (localStorage.getItem('smartbus-theme') as Theme) || 'system';
  } catch { return 'system'; }
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface AppState {
  // Auth state
  currentUser: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;

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

  // Theme state
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;

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

  // Driver monitoring state machine actions
  setMonitoringState: (state: DriverMonitoringStateType) => void;
  updateMonitoringState: (partial: Partial<DriverMonitoringState>) => void;
  startEyeClosure: () => void;
  updateEyeState: (leftOpen: boolean, rightOpen: boolean, faceDetected: boolean) => void;
  resetEyeClosure: () => void;
  confirmDrowsiness: () => void;
  startAlarm: () => void;
  stopAlarm: () => void;
  acknowledgeDriver: () => void;
  escalateToSOS: () => void;
  resolveDriverEmergency: () => void;

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

  // Student management actions
  addStudent: (data: Omit<Student, 'id' | 'studentId' | 'qrCode' | 'qrId' | 'qrEnabled' | 'status' | 'attendanceStatus' | 'attendanceHistory' | 'createdAt'>) => Student;

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
  updateFleetGPSFromSinoTrack: (locations: Array<{
    bus_id: string;
    bus_db_id: number;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    gps_status: string;
    gsm_signal: string;
    last_updated: string | null;
    bus_status: string;
    current_students: number;
    capacity: number;
  }>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth
  currentUser: (() => {
    try {
      const saved = localStorage.getItem('smartbus-user-session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })(),

  login: (email, password, role) => {
    const demoAccounts: Record<string, { password: string; user: User }> = {
      'admin@smartbus.demo': {
        password: 'admin123',
        user: { id: 'ADM-01', name: 'School Admin', email: 'admin@smartbus.demo', role: 'admin' },
      },
      'parent@smartbus.demo': {
        password: 'parent123',
        user: { id: 'PAR-01', name: 'Ram Sharma', email: 'parent@smartbus.demo', role: 'parent', studentIds: ['STU-001', 'STU-002', 'STU-003'] },
      },
      'driver@smartbus.demo': {
        password: 'driver123',
        user: { id: 'DRV-07', name: 'Suresh Magar', email: 'driver@smartbus.demo', role: 'driver', driverId: 'DRV-07', assignedVehicleId: 'BUS-107' },
      },
    };

    const account = demoAccounts[email.toLowerCase()];
    if (account && account.password === password) {
      const user = { ...account.user, role };
      try { localStorage.setItem('smartbus-user-session', JSON.stringify(user)); } catch {}
      const landingPage = role === 'admin' ? 'dashboard' : role === 'parent' ? 'parent-home' : 'driver-home';
      set({ currentUser: user, currentPage: landingPage });
      return true;
    }
    return false;
  },

  logout: () => {
    try { localStorage.removeItem('smartbus-user-session'); } catch {}
    set({ currentUser: null, currentPage: 'dashboard' });
  },
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
    leftEyeOpen: true,
    rightEyeOpen: true,
    eyeClosureDuration: 0,
    blinkFrequency: 15,
    headPosition: 'center',
    attention: 'normal',
    drowsinessDetected: false,
    buzzerActive: false,
    driverResponded: null,
    monitoringStartTime: Date.now(),
    monitoringState: 'monitoring',
    eyesClosedAt: null,
    closureDuration: 0,
    responseDeadline: null,
    leftEyeState: 'open',
    rightEyeState: 'open',
    eyeState: 'open',
    leftEAR: 0,
    rightEAR: 0,
    avgEAR: 0,
    baselineEAR: 0,
    openThreshold: 0.22,
    closedThreshold: 0.16,
    isCalibrated: false,
    calibrationProgress: 0,
    consecutiveClosedFrames: 0,
    drowsinessScore: 0,
    fps: 0,
    faceConfidence: 0,
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

  // Driver monitoring state machine actions
  setMonitoringState: (newState) => set((s) => ({
    monitoringState: { ...s.monitoringState, monitoringState: newState },
  })),

  updateMonitoringState: (partial) => set((s) => ({
    monitoringState: { ...s.monitoringState, ...partial },
  })),

  startEyeClosure: () => {
    const now = Date.now();
    set((s) => ({
      monitoringState: {
        ...s.monitoringState,
        monitoringState: 'eyes_closed',
        eyesOpen: false,
        eyesClosedAt: now,
        closureDuration: 0,
        attention: 'distracted',
      },
      drivers: s.drivers.map(d => d.id === 'DRV-07'
        ? { ...d, eyeStatus: 'closed' as const, attention: 'distracted' as const }
        : d
      ),
    }));
  },

  updateEyeState: (leftOpen, rightOpen, faceDetected) => set((s) => {
    const bothOpen = leftOpen && rightOpen;
    const prev = s.monitoringState;
    const newState: Partial<typeof prev> = {
      leftEyeOpen: leftOpen,
      rightEyeOpen: rightOpen,
      eyesOpen: bothOpen,
      faceDetected,
    };

    if (!faceDetected) {
      newState.monitoringState = 'no_face';
      newState.eyesOpen = true;
      newState.leftEyeOpen = true;
      newState.rightEyeOpen = true;
      newState.eyesClosedAt = null;
      newState.closureDuration = 0;
      newState.attention = 'normal';
    }

    return {
      monitoringState: { ...prev, ...newState },
      drivers: s.drivers.map(d => d.id === 'DRV-07'
        ? { ...d, eyeStatus: bothOpen ? 'open' as const : 'closed' as const, attention: bothOpen ? 'normal' as const : 'distracted' as const }
        : d
      ),
    };
  }),

  resetEyeClosure: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'monitoring',
      eyesOpen: true,
      leftEyeOpen: true,
      rightEyeOpen: true,
      eyesClosedAt: null,
      closureDuration: 0,
      attention: 'normal',
    },
    drivers: s.drivers.map(d => d.id === 'DRV-07'
      ? { ...d, eyeStatus: 'open' as const, attention: 'normal' as const }
      : d
    ),
  })),

  confirmDrowsiness: () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    set((s) => ({
      monitoringState: {
        ...s.monitoringState,
        monitoringState: 'drowsiness_confirmed',
        drowsinessDetected: true,
        attention: 'absent',
      },
      drivers: s.drivers.map(d => d.id === 'DRV-07'
        ? { ...d, attention: 'absent' as const, drowsinessAlerts: d.drowsinessAlerts + 1 }
        : d
      ),
      driverAlerts: [{
        id: `ALT-${Date.now()}`,
        driverId: 'DRV-07',
        vehicleId: 'BUS-107',
        type: 'drowsiness' as const,
        message: 'Driver eyes closed for 5 seconds - Drowsiness confirmed',
        time: now,
        severity: 'critical' as const,
        acknowledged: false,
      }, ...s.driverAlerts],
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'driver',
        message: 'DROWSINESS CONFIRMED - DRV-07 on BUS-107',
        time: now,
        icon: 'alert-triangle',
        severity: 'danger' as const,
      }, ...s.activityLogs],
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'driver' as const,
        title: 'Critical Drowsiness Alert',
        message: 'Driver eyes closed for 5 continuous seconds - Drowsiness confirmed',
        time: now,
        read: false,
        severity: 'critical' as const,
        vehicleId: 'BUS-107',
        driverId: 'DRV-07',
      }, ...s.notifications],
    }));
  },

  startAlarm: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'alarm_active',
      buzzerActive: true,
    },
  })),

  stopAlarm: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'monitoring',
      buzzerActive: false,
      drowsinessDetected: false,
      eyesOpen: true,
      leftEyeOpen: true,
      rightEyeOpen: true,
      eyesClosedAt: null,
      closureDuration: 0,
      attention: 'normal',
      driverResponded: true,
      responseDeadline: null,
    },
    drivers: s.drivers.map(d => d.id === 'DRV-07'
      ? { ...d, eyeStatus: 'open' as const, attention: 'normal' as const, safetyScore: Math.max(0, d.safetyScore - 1) }
      : d
    ),
    activityLogs: [{
      id: `LOG-${Date.now()}`,
      type: 'driver',
      message: 'Driver responded to drowsiness alert - Monitoring reset',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      icon: 'check-circle',
      severity: 'success' as const,
    }, ...s.activityLogs],
  })),

  acknowledgeDriver: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'awaiting_response',
      buzzerActive: true,
      responseDeadline: Date.now() + 30000,
    },
  })),

  escalateToSOS: () => {
    const state = get();
    const vehicle = state.vehicles.find(v => v.id === 'BUS-107') || state.vehicles[0];
    const driver = state.drivers.find(d => d.id === 'DRV-07') || state.drivers[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    set({
      monitoringState: {
        ...state.monitoringState,
        monitoringState: 'sos_active',
        buzzerActive: false,
      },
      sosAlerts: [{
        id: `SOS-${Date.now()}`,
        vehicleId: vehicle.id,
        driverId: driver.id,
        location: { lat: vehicle.currentLat || vehicle.lat, lng: vehicle.currentLng || vehicle.lng },
        time: now,
        reason: 'Driver did not respond to drowsiness alarm - SOS auto-escalated',
        status: 'active' as const,
        escalationLevel: 'primary' as const,
        escalationTimer: 30,
        primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
        secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
        authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
        primaryResponded: false,
        secondaryResponded: false,
        authorityResponded: false,
      }],
      vehicles: state.vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'emergency' as const } : v),
      drivers: state.drivers.map(d => d.id === driver.id ? { ...d, status: 'emergency' as const } : d),
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'emergency' as const,
        title: 'SOS Emergency - Drowsiness',
        message: `SOS triggered on ${vehicle.id} - Driver ${driver.fullName} unresponsive to drowsiness alarm`,
        time: now,
        read: false,
        severity: 'critical' as const,
        vehicleId: vehicle.id,
      }, ...state.notifications],
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'emergency',
        message: `SOS ESCALATED on ${vehicle.id} - Driver unresponsive to drowsiness alarm`,
        time: now,
        icon: 'alert-triangle',
        severity: 'danger' as const,
      }, ...state.activityLogs],
    });
  },

  resolveDriverEmergency: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'resolved',
      buzzerActive: false,
      drowsinessDetected: false,
      eyesOpen: true,
      leftEyeOpen: true,
      rightEyeOpen: true,
      eyesClosedAt: null,
      closureDuration: 0,
      attention: 'normal',
      driverResponded: null,
      responseDeadline: null,
    },
    sosAlerts: s.sosAlerts.map(sos => sos.status !== 'resolved' ? { ...sos, status: 'resolved' as const } : sos),
    vehicles: s.vehicles.map(v => v.status === 'emergency' ? { ...v, status: 'stopped' as const } : v),
    drivers: s.drivers.map(d => d.status === 'emergency' ? { ...d, status: 'active' as const } : d),
  })),

  // Theme
  theme: getInitialTheme(),
  resolvedTheme: getResolvedTheme(getInitialTheme()),
  setTheme: (theme) => {
    const resolved = getResolvedTheme(theme);
    try { localStorage.setItem('smartbus-theme', theme); } catch {}
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(resolved);
    set({ theme, resolvedTheme: resolved });
  },

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

    let studentId = '';
    let qrId = '';
    try {
      const payload: SmartBusQRPayload = JSON.parse(qrCode);
      if (payload.type === 'SMARTBUS_STUDENT' && payload.studentId) {
        studentId = payload.studentId;
        qrId = payload.qrId || '';
      }
    } catch {
      studentId = qrCode;
    }

    const student = state.students.find(s =>
      s.studentId === studentId ||
      s.id === studentId ||
      s.qrId === qrId ||
      s.qrCode === qrCode
    );

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

  // Student management
  addStudent: (data) => {
    const state = get();
    const nextNum = state.students.length + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    const studentId = `STU-${paddedNum}`;
    const qrId = `SMARTBUS-2026-${studentId}`;
    const qrCode = qrId;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newStudent: Student = {
      ...data,
      id: studentId,
      studentId,
      qrCode,
      qrId,
      qrEnabled: true,
      status: 'waiting',
      attendanceStatus: 'waiting',
      attendanceHistory: [],
      createdAt: now,
    };

    set((s) => ({
      students: [...s.students, newStudent],
      notifications: [{
        id: `NOT-${Date.now()}`,
        type: 'student' as const,
        title: 'Student Added',
        message: `${newStudent.fullName} added successfully. QR: ${qrId}`,
        time: now,
        read: false,
        severity: 'info' as const,
      }, ...s.notifications],
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'student',
        message: `New student ${newStudent.fullName} registered - QR auto-generated`,
        time: now,
        icon: 'user-plus',
        severity: 'success' as const,
      }, ...s.activityLogs],
    }));

    return newStudent;
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

  simulateDrowsiness: () => {
    const now = Date.now();
    set((s) => ({
      monitoringState: {
        ...s.monitoringState,
        monitoringState: 'eyes_closed',
        eyesOpen: false,
        leftEyeOpen: false,
        rightEyeOpen: false,
        eyesClosedAt: now,
        closureDuration: 0,
        attention: 'distracted',
      },
      drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'closed' as const, attention: 'distracted' as const } : d),
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'Eye closure detected on DRV-07 - Monitoring', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'eye', severity: 'warning' as const }, ...s.activityLogs],
    }));
  },

  triggerBuzzer: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'alarm_active',
      eyesOpen: false,
      leftEyeOpen: false,
      rightEyeOpen: false,
      eyeClosureDuration: 5,
      closureDuration: 5000,
      drowsinessDetected: true,
      buzzerActive: true,
    },
    drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'closed' as const, attention: 'absent' as const, drowsinessAlerts: d.drowsinessAlerts + 1 } : d),
    driverAlerts: [{ id: `ALT-${Date.now()}`, driverId: 'DRV-07', vehicleId: 'BUS-107', type: 'drowsiness', message: 'Driver eyes closed for 5 seconds - Drowsiness detected', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), severity: 'critical', acknowledged: false }, ...s.driverAlerts],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'DROWSINESS ALERT - DRV-07 on BUS-107', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'alert-triangle', severity: 'danger' as const }, ...s.activityLogs],
  })),

  driverResponds: () => set((s) => ({
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'monitoring',
      eyesOpen: true,
      leftEyeOpen: true,
      rightEyeOpen: true,
      eyeClosureDuration: 0,
      closureDuration: 0,
      eyesClosedAt: null,
      drowsinessDetected: false,
      buzzerActive: false,
      driverResponded: true,
      attention: 'normal',
      responseDeadline: null,
    },
    drivers: s.drivers.map(d => d.id === 'DRV-07' ? { ...d, eyeStatus: 'open' as const, attention: 'normal' as const, safetyScore: Math.max(0, d.safetyScore - 1) } : d),
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'driver', message: 'DRV-07 responded to drowsiness alert - Monitoring reset', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' as const }, ...s.activityLogs],
  })),

  driverNoResponse: () => {
    const state = get();
    const vehicle = state.vehicles.find(v => v.id === 'BUS-107') || state.vehicles[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    // Use latest GPS from SinoTrack (currentLat/currentLng) or fallback to base coordinates
    const gpsLat = vehicle.currentLat || vehicle.lat;
    const gpsLng = vehicle.currentLng || vehicle.lng;
    set({
      monitoringState: {
        ...state.monitoringState,
        monitoringState: 'sos_active',
        buzzerActive: false,
      },
      sosAlerts: [{
        id: `SOS-${Date.now()}`, vehicleId: vehicle.id, driverId: vehicle.assignedDriver,
        location: { lat: gpsLat, lng: gpsLng }, time: now,
        reason: 'Driver did not respond to drowsiness alert', status: 'active', escalationLevel: 'primary', escalationTimer: 30,
        primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
        secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
        authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
        primaryResponded: false, secondaryResponded: false, authorityResponded: false,
      }],
      vehicles: state.vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'emergency' as const } : v),
      drivers: state.drivers.map(d => d.id === vehicle.assignedDriver ? { ...d, status: 'emergency' as const } : d),
      notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Emergency - LIVE GPS', message: `SOS triggered on ${vehicle.id} - Driver unresponsive. LIVE LOCATION: ${gpsLat.toFixed(6)}, ${gpsLng.toFixed(6)}`, time: now, read: false, severity: 'critical', vehicleId: vehicle.id }, ...state.notifications],
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: `SOS TRIGGERED on ${vehicle.id} - GPS: ${gpsLat.toFixed(6)}, ${gpsLng.toFixed(6)}`, time: now, icon: 'alert-triangle', severity: 'danger' as const }, ...state.activityLogs],
    });
  },

  triggerSOS: () => {
    const state = get();
    const v = state.vehicles.find(v => v.id === 'BUS-101') || state.vehicles[0];
    const gpsLat = v.currentLat || v.lat;
    const gpsLng = v.currentLng || v.lng;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    set({
      sosAlerts: [{
        id: `SOS-${Date.now()}`, vehicleId: v.id, driverId: v.assignedDriver,
        location: { lat: gpsLat, lng: gpsLng }, time: now,
        reason: 'Manual SOS triggered by driver', status: 'active', escalationLevel: 'primary', escalationTimer: 30,
        primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
        secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
        authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
        primaryResponded: false, secondaryResponded: false, authorityResponded: false,
      }],
      vehicles: state.vehicles.map(sv => sv.id === v.id ? { ...sv, status: 'emergency' as any } : sv),
      drivers: state.drivers.map(d => d.id === v.assignedDriver ? { ...d, status: 'emergency' as any } : d),
      notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'SOS Emergency - LIVE GPS', message: `SOS triggered on ${v.id} - Manual emergency. LIVE LOCATION: ${gpsLat.toFixed(6)}, ${gpsLng.toFixed(6)}`, time: now, read: false, severity: 'critical', vehicleId: v.id }, ...state.notifications],
      activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: `SOS TRIGGERED on ${v.id} - GPS: ${gpsLat.toFixed(6)}, ${gpsLng.toFixed(6)}`, time: now, icon: 'alert-triangle', severity: 'danger' }, ...state.activityLogs],
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
    sosAlerts: s.sosAlerts.map(sos => sos.status !== 'resolved' ? { ...sos, status: 'resolved' as const } : sos),
    vehicles: s.vehicles.map(v => v.status === 'emergency' ? { ...v, status: 'stopped' as const } : v),
    drivers: s.drivers.map(d => d.status === 'emergency' ? { ...d, status: 'active' as const } : d),
    monitoringState: {
      ...s.monitoringState,
      monitoringState: 'monitoring',
      eyesOpen: true,
      leftEyeOpen: true,
      rightEyeOpen: true,
      eyeClosureDuration: 0,
      closureDuration: 0,
      eyesClosedAt: null,
      drowsinessDetected: false,
      buzzerActive: false,
      driverResponded: null,
      attention: 'normal',
      responseDeadline: null,
    },
    notifications: [{ id: `NOT-${Date.now()}`, type: 'emergency', title: 'Emergency Resolved', message: 'Emergency incident has been resolved', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false, severity: 'info' }, ...s.notifications],
    activityLogs: [{ id: `LOG-${Date.now()}`, type: 'emergency', message: 'Emergency RESOLVED', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), icon: 'check-circle', severity: 'success' as const }, ...s.activityLogs],
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

  triggerDrowsiness: () => {
    const state = get();
    const vehicle = state.vehicles[0];
    const driver = state.drivers.find(d => d.id === 'DRV-07') || state.drivers[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return {
      monitoringState: {
        ...state.monitoringState,
        monitoringState: 'alarm_active',
        eyesOpen: false,
        leftEyeOpen: false,
        rightEyeOpen: false,
        eyesClosedAt: Date.now() - 5000,
        closureDuration: 5000,
        drowsinessDetected: true,
        buzzerActive: true,
        faceDetected: true,
        attention: 'absent',
      },
      driverAlerts: [{
        id: `DA-${Date.now()}`,
        driverId: driver.id,
        vehicleId: vehicle.id,
        type: 'drowsiness' as const,
        severity: 'critical' as const,
        message: 'Driver drowsiness detected - eyes closed for 5 seconds',
        time: now,
        acknowledged: false,
      }, ...state.driverAlerts],
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'alert',
        message: `Drowsiness detected for ${driver.fullName} in ${vehicle.id}`,
        time: now,
        icon: 'alert-triangle',
        severity: 'danger' as const,
      }, ...state.activityLogs],
    };
  },

  updateFleetGPSFromSinoTrack: (locations) => set((s) => ({
    vehicles: s.vehicles.map(v => {
      const gps = locations.find(l => l.bus_id === v.id);
      if (!gps) return v;
      return {
        ...v,
        currentLat: gps.latitude,
        currentLng: gps.longitude,
        speed: Math.round(gps.speed),
        heading: gps.heading,
        currentStudents: gps.current_students,
        lastUpdate: gps.last_updated
          ? new Date(gps.last_updated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : v.lastUpdate,
        lastGpsUpdate: gps.last_updated || undefined,
        gpsStatus: gps.gps_status as any,
        gpsSource: 'sinotrack' as const,
        status: gps.gps_status === 'offline' ? 'offline' as const
          : gps.bus_status === 'maintenance' ? 'idle' as const
          : v.status,
      };
    }),
  })),
}));
