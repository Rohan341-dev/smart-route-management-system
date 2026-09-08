export type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'delayed' | 'offline' | 'emergency' | 'route_deviation';
export type DriverStatus = 'active' | 'inactive' | 'alert' | 'drowsy' | 'emergency' | 'on_duty';
export type StudentStatus = 'waiting' | 'picked_up' | 'on_bus' | 'dropped' | 'absent' | 'emergency';
export type StudentAttendanceStatus = 'waiting' | 'picked_up' | 'on_bus' | 'dropped' | 'absent';
export type TripStage = 'morning_pickup' | 'morning_drop' | 'evening_pickup' | 'evening_drop';
export type AlertType = 'drowsiness' | 'overspeed' | 'harsh_braking' | 'route_deviation' | 'driver_offline';
export type SOSStatus = 'active' | 'acknowledged' | 'escalating' | 'resolved' | 'false_alarm';
export type EscalationLevel = 'primary' | 'secondary' | 'authority';
export type TripStatus = 'not_started' | 'starting' | 'in_progress' | 'delayed' | 'stopped' | 'completed' | 'scheduled' | 'cancelled';
export type DriverEyeStatus = 'open' | 'closed' | 'squinting';
export type DriverAttention = 'normal' | 'distracted' | 'absent';
export type UserRole = 'super_admin' | 'admin' | 'school_staff' | 'teacher' | 'driver' | 'parent';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  studentIds?: string[];
  driverId?: string;
  assignedVehicleId?: string;
  assignedRouteId?: string;
  profilePhoto?: string;
  createdAt?: string;
}

export interface BusAssignment {
  busId: string;
  driverId: string;
  attendantId?: string;
  routeId: string;
  gpsDeviceId?: string;
  dashcamId?: string;
}

export type DriverMonitoringStateType =
  | 'initializing'
  | 'no_face'
  | 'monitoring'
  | 'eyes_closed'
  | 'drowsiness_confirmed'
  | 'alarm_active'
  | 'awaiting_response'
  | 'sos_active'
  | 'resolved';

export type GPSDataSource = 'sinotrack' | 'driver_phone' | 'demo' | 'unknown';
export type GPSStatus = 'online' | 'offline' | 'unknown';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  capacity: number;
  assignedDriver: string;
  assignedRoute: string;
  gpsDeviceId: string;
  dashCameraId: string;
  status: VehicleStatus;
  lastActive: string;
  maintenanceDate: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  lat: number;
  lng: number;
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  currentStudents: number;
  lastUpdate?: string;
  routeName?: string;
  plateNumber?: string;
  gpsSource?: GPSDataSource;
  gpsStatus?: GPSStatus;
  lastGpsUpdate?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedVehicle: string;
  assignedRoute: string;
  emergencyContact: string;
  status: DriverStatus;
  safetyScore: number;
  drowsinessAlerts: number;
  overspeedAlerts: number;
  harshBraking: number;
  routeDeviations: number;
  sosEvents: number;
  drivingHours: number;
  eyeStatus: DriverEyeStatus;
  attention: DriverAttention;
  drowsinessDuration: number;
  currentLat?: number;
  currentLng?: number;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  class: string;
  section: string;
  parentName: string;
  parentPhone: string;
  pickupStop: string;
  dropStop: string;
  assignedBus: string;
  route: string;
  status: StudentStatus;
  pickupTime?: string;
  dropTime?: string;
  qrCode: string;
  qrId: string;
  qrEnabled: boolean;
  assignedVehicleId: string;
  assignedRouteId: string;
  attendanceStatus: StudentAttendanceStatus;
  lastBoardedAt?: string;
  lastDroppedAt?: string;
  attendanceHistory: AttendanceRecord[];
  createdAt?: string;
}

export interface Route {
  id: string;
  name: string;
  vehicleId: string;
  driverId: string;
  stops: RouteStop[];
  totalStudents: number;
  estimatedTime: string;
  distance: string;
  status: 'active' | 'in_progress' | 'completed' | 'scheduled';
  startTime?: string;
  endTime?: string;
}

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  time: string;
  studentsCount: number;
  order: number;
  type: 'pickup' | 'drop' | 'school';
}

export interface DriverAlert {
  id: string;
  driverId: string;
  vehicleId: string;
  type: AlertType;
  message: string;
  time: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

export interface SOSAlert {
  id: string;
  vehicleId: string;
  driverId: string;
  location: { lat: number; lng: number };
  time: string;
  reason: string;
  status: SOSStatus;
  escalationLevel: EscalationLevel;
  escalationTimer: number;
  primaryContact: EmergencyContact;
  secondaryContact: EmergencyContact;
  authorityContact: EmergencyContact;
  primaryResponded: boolean;
  secondaryResponded: boolean;
  authorityResponded: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  type: string;
  responded: boolean;
  responseTime?: string;
}

export interface Notification {
  id: string;
  type: 'driver' | 'vehicle' | 'student' | 'emergency' | 'route';
  title: string;
  message: string;
  time: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
  vehicleId?: string;
  driverId?: string;
  studentId?: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  status: TripStatus;
  startTime: string;
  endTime?: string;
  studentsPickedUp: number;
  studentsDropped: number;
  totalStudents: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  emergencyVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  safeDrivers: number;
  driversUnderAlert: number;
  totalStudents: number;
  onBus: number;
  dropped: number;
  absent: number;
  activeRoutes: number;
  completedRoutes: number;
  delayedRoutes: number;
  routeDeviations: number;
}

export type EyeState = 'open' | 'closing' | 'closed' | 'unknown';

export interface SmartBusQRPayload {
  type: 'SMARTBUS_STUDENT';
  version: 1;
  studentId: string;
  qrId: string;
}

export interface StopStatus {
  stopId: string;
  status: 'pending' | 'arrived' | 'completed';
  arrivedAt?: string;
  completedAt?: string;
}

export interface DriverMonitoringState {
  isMonitoring: boolean;
  faceDetected: boolean;
  eyesOpen: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  eyeClosureDuration: number;
  blinkFrequency: number;
  headPosition: string;
  attention: DriverAttention;
  drowsinessDetected: boolean;
  buzzerActive: boolean;
  driverResponded: boolean | null;
  monitoringStartTime: number;
  monitoringState: DriverMonitoringStateType;
  eyesClosedAt: number | null;
  closureDuration: number;
  responseDeadline: number | null;
  leftEyeState: EyeState;
  rightEyeState: EyeState;
  eyeState: EyeState;
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
  baselineEAR: number;
  openThreshold: number;
  closedThreshold: number;
  isCalibrated: boolean;
  calibrationProgress: number;
  consecutiveClosedFrames: number;
  drowsinessScore: number;
  fps: number;
  faceConfidence: number;
  cameraState?: 'idle' | 'connecting' | 'active' | 'error' | 'stopped';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  vehicleId: string;
  routeId: string;
  tripId?: string;
  tripStage: TripStage;
  scannedAt: string;
  scanType: 'board' | 'drop';
  status: StudentAttendanceStatus;
  scannedBy: 'qr_camera' | 'demo' | 'manual';
  location?: { lat: number; lng: number };
}

export interface AttendanceSession {
  id: string;
  vehicleId: string;
  routeId: string;
  tripStage: TripStage;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalStudents: number;
  boarded: number;
  dropped: number;
  scannedStudentIds: string[];
}

export interface AttendanceEvent {
  id: string;
  type: 'boarded' | 'dropped' | 'absent' | 'warning' | 'unauthorized';
  studentId: string;
  studentName: string;
  vehicleId: string;
  message: string;
  time: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}
