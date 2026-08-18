export type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'delayed' | 'offline' | 'emergency' | 'route_deviation';
export type DriverStatus = 'active' | 'inactive' | 'alert' | 'drowsy' | 'emergency';
export type StudentStatus = 'waiting' | 'picked_up' | 'on_bus' | 'dropped' | 'absent' | 'emergency';
export type AlertType = 'drowsiness' | 'overspeed' | 'harsh_braking' | 'route_deviation' | 'driver_offline';
export type SOSStatus = 'active' | 'acknowledged' | 'escalating' | 'resolved' | 'false_alarm';
export type EscalationLevel = 'primary' | 'secondary' | 'authority';
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DriverEyeStatus = 'open' | 'closed' | 'squinting';
export type DriverAttention = 'normal' | 'distracted' | 'absent';

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
  speed: number;
  heading: number;
  currentStudents: number;
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
}

export interface Student {
  id: string;
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
  status: 'active' | 'completed' | 'scheduled';
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

export interface DriverMonitoringState {
  isMonitoring: boolean;
  faceDetected: boolean;
  eyesOpen: boolean;
  eyeClosureDuration: number;
  blinkFrequency: number;
  headPosition: string;
  attention: DriverAttention;
  drowsinessDetected: boolean;
  buzzerActive: boolean;
  driverResponded: boolean | null;
  monitoringStartTime: number;
}
