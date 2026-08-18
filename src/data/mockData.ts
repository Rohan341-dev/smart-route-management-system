import { Vehicle, Driver, Student, Route, DriverAlert, SOSAlert, Notification, Trip, ActivityLog } from './types';

export const vehicles: Vehicle[] = [
  { id: 'BUS-101', registrationNumber: 'MH-12-AB-1234', type: 'School Bus', capacity: 40, assignedDriver: 'DRV-01', assignedRoute: 'RT-01', gpsDeviceId: 'GPS-001', dashCameraId: 'CAM-001', status: 'moving', lastActive: '2026-08-18T08:30:00', maintenanceDate: '2026-07-15', insuranceExpiry: '2027-03-20', fitnessExpiry: '2027-01-10', lat: 27.7100, lng: 85.3130, speed: 45, heading: 180, currentStudents: 28 },
  { id: 'BUS-102', registrationNumber: 'MH-12-CD-5678', type: 'School Bus', capacity: 35, assignedDriver: 'DRV-02', assignedRoute: 'RT-02', gpsDeviceId: 'GPS-002', dashCameraId: 'CAM-002', status: 'moving', lastActive: '2026-08-18T08:28:00', maintenanceDate: '2026-08-01', insuranceExpiry: '2027-05-15', fitnessExpiry: '2027-04-20', lat: 27.7050, lng: 85.3200, speed: 38, heading: 225, currentStudents: 32 },
  { id: 'BUS-103', registrationNumber: 'MH-12-EF-9012', type: 'Mini Bus', capacity: 25, assignedDriver: 'DRV-03', assignedRoute: 'RT-03', gpsDeviceId: 'GPS-003', dashCameraId: 'CAM-003', status: 'stopped', lastActive: '2026-08-18T08:25:00', maintenanceDate: '2026-06-20', insuranceExpiry: '2027-02-28', fitnessExpiry: '2026-12-15', lat: 27.6980, lng: 85.3050, speed: 0, heading: 90, currentStudents: 20 },
  { id: 'BUS-104', registrationNumber: 'MH-12-GH-3456', type: 'School Bus', capacity: 45, assignedDriver: 'DRV-04', assignedRoute: 'RT-04', gpsDeviceId: 'GPS-004', dashCameraId: 'CAM-004', status: 'moving', lastActive: '2026-08-18T08:32:00', maintenanceDate: '2026-08-10', insuranceExpiry: '2027-06-30', fitnessExpiry: '2027-05-25', lat: 27.7150, lng: 85.2980, speed: 52, heading: 315, currentStudents: 38 },
  { id: 'BUS-105', registrationNumber: 'MH-12-IJ-7890', type: 'School Bus', capacity: 40, assignedDriver: 'DRV-05', assignedRoute: 'RT-05', gpsDeviceId: 'GPS-005', dashCameraId: 'CAM-005', status: 'idle', lastActive: '2026-08-18T07:45:00', maintenanceDate: '2026-07-25', insuranceExpiry: '2027-04-10', fitnessExpiry: '2027-03-05', lat: 27.7200, lng: 85.3300, speed: 0, heading: 0, currentStudents: 0 },
  { id: 'BUS-106', registrationNumber: 'MH-12-KL-1122', type: 'Mini Bus', capacity: 20, assignedDriver: 'DRV-06', assignedRoute: 'RT-06', gpsDeviceId: 'GPS-006', dashCameraId: 'CAM-006', status: 'offline', lastActive: '2026-08-17T18:00:00', maintenanceDate: '2026-05-10', insuranceExpiry: '2026-11-30', fitnessExpiry: '2026-10-20', lat: 27.6900, lng: 85.2850, speed: 0, heading: 0, currentStudents: 0 },
  { id: 'BUS-107', registrationNumber: 'MH-12-MN-3344', type: 'School Bus', capacity: 40, assignedDriver: 'DRV-07', assignedRoute: 'RT-07', gpsDeviceId: 'GPS-007', dashCameraId: 'CAM-007', status: 'moving', lastActive: '2026-08-18T08:33:00', maintenanceDate: '2026-08-05', insuranceExpiry: '2027-07-15', fitnessExpiry: '2027-06-10', lat: 27.7080, lng: 85.3150, speed: 42, heading: 135, currentStudents: 25 },
  { id: 'BUS-108', registrationNumber: 'MH-12-OP-5566', type: 'School Bus', capacity: 35, assignedDriver: 'DRV-08', assignedRoute: 'RT-08', gpsDeviceId: 'GPS-008', dashCameraId: 'CAM-008', status: 'delayed', lastActive: '2026-08-18T08:20:00', maintenanceDate: '2026-07-30', insuranceExpiry: '2027-08-20', fitnessExpiry: '2027-07-25', lat: 27.7020, lng: 85.3080, speed: 15, heading: 270, currentStudents: 30 },
];

export const drivers: Driver[] = [
  { id: 'DRV-01', fullName: 'Ram Sharma', phone: '+977-9841234567', licenseNumber: 'NPL-2024-001', licenseExpiry: '2028-12-31', assignedVehicle: 'BUS-101', assignedRoute: 'RT-01', emergencyContact: '+977-9841234568', status: 'active', safetyScore: 95, drowsinessAlerts: 1, overspeedAlerts: 0, harshBraking: 0, routeDeviations: 0, sosEvents: 0, drivingHours: 6, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-02', fullName: 'Shyam Thapa', phone: '+977-9841234569', licenseNumber: 'NPL-2024-002', licenseExpiry: '2028-11-30', assignedVehicle: 'BUS-102', assignedRoute: 'RT-02', emergencyContact: '+977-9841234570', status: 'active', safetyScore: 88, drowsinessAlerts: 3, overspeedAlerts: 2, harshBraking: 1, routeDeviations: 0, sosEvents: 0, drivingHours: 7, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-03', fullName: 'Hari Prasad', phone: '+977-9841234571', licenseNumber: 'NPL-2024-003', licenseExpiry: '2028-10-31', assignedVehicle: 'BUS-103', assignedRoute: 'RT-03', emergencyContact: '+977-9841234572', status: 'active', safetyScore: 92, drowsinessAlerts: 0, overspeedAlerts: 1, harshBraking: 0, routeDeviations: 1, sosEvents: 0, drivingHours: 5, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-04', fullName: 'Krishna Das', phone: '+977-9841234573', licenseNumber: 'NPL-2024-004', licenseExpiry: '2028-09-30', assignedVehicle: 'BUS-104', assignedRoute: 'RT-04', emergencyContact: '+977-9841234574', status: 'active', safetyScore: 78, drowsinessAlerts: 5, overspeedAlerts: 3, harshBraking: 2, routeDeviations: 1, sosEvents: 1, drivingHours: 8, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-05', fullName: 'Gopal Rai', phone: '+977-9841234575', licenseNumber: 'NPL-2024-005', licenseExpiry: '2028-08-31', assignedVehicle: 'BUS-105', assignedRoute: 'RT-05', emergencyContact: '+977-9841234576', status: 'inactive', safetyScore: 97, drowsinessAlerts: 0, overspeedAlerts: 0, harshBraking: 0, routeDeviations: 0, sosEvents: 0, drivingHours: 0, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-06', fullName: 'Bikash Gurung', phone: '+977-9841234577', licenseNumber: 'NPL-2024-006', licenseExpiry: '2028-07-31', assignedVehicle: 'BUS-106', assignedRoute: 'RT-06', emergencyContact: '+977-9841234578', status: 'inactive', safetyScore: 85, drowsinessAlerts: 2, overspeedAlerts: 1, harshBraking: 1, routeDeviations: 0, sosEvents: 0, drivingHours: 0, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-07', fullName: 'Suresh Magar', phone: '+977-9841234579', licenseNumber: 'NPL-2024-007', licenseExpiry: '2028-06-30', assignedVehicle: 'BUS-107', assignedRoute: 'RT-07', emergencyContact: '+977-9841234580', status: 'active', safetyScore: 91, drowsinessAlerts: 1, overspeedAlerts: 1, harshBraking: 0, routeDeviations: 0, sosEvents: 0, drivingHours: 5, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
  { id: 'DRV-08', fullName: 'Deepak Limbu', phone: '+977-9841234581', licenseNumber: 'NPL-2024-008', licenseExpiry: '2028-05-31', assignedVehicle: 'BUS-108', assignedRoute: 'RT-08', emergencyContact: '+977-9841234582', status: 'alert', safetyScore: 82, drowsinessAlerts: 4, overspeedAlerts: 2, harshBraking: 1, routeDeviations: 0, sosEvents: 0, drivingHours: 9, eyeStatus: 'open', attention: 'normal', drowsinessDuration: 0 },
];

export const students: Student[] = [
  { id: 'STU-001', fullName: 'Aarav Sharma', class: '5', section: 'A', parentName: 'Ram Sharma', parentPhone: '+977-9841111111', pickupStop: 'Thamel', dropStop: 'Dillibazar', assignedBus: 'BUS-101', route: 'RT-01', status: 'on_bus', pickupTime: '08:05 AM' },
  { id: 'STU-002', fullName: 'Diya Thapa', class: '6', section: 'B', parentName: 'Shyam Thapa', parentPhone: '+977-9841111112', pickupStop: 'New Road', dropStop: 'Baneshwor', assignedBus: 'BUS-101', route: 'RT-01', status: 'on_bus', pickupTime: '08:07 AM' },
  { id: 'STU-003', fullName: 'Rohan Yadav', class: '4', section: 'A', parentName: 'Sanjay Yadav', parentPhone: '+977-9841111113', pickupStop: 'Kathmandu Mall', dropStop: 'Lalitpur', assignedBus: 'BUS-101', route: 'RT-01', status: 'on_bus', pickupTime: '08:08 AM' },
  { id: 'STU-004', fullName: 'Ananya KC', class: '7', section: 'A', parentName: 'Rajesh KC', parentPhone: '+977-9841111114', pickupStop: 'Durbar Marg', dropStop: 'Patan', assignedBus: 'BUS-102', route: 'RT-02', status: 'dropped', pickupTime: '08:02 AM', dropTime: '08:32 AM' },
  { id: 'STU-005', fullName: 'Arjun Rai', class: '5', section: 'C', parentName: 'Bikash Rai', parentPhone: '+977-9841111115', pickupStop: 'Putalisadak', dropStop: 'Bhaktapur', assignedBus: 'BUS-102', route: 'RT-02', status: 'on_bus', pickupTime: '08:10 AM' },
  { id: 'STU-006', fullName: 'Sita Tamang', class: '3', section: 'B', parentName: 'Dorje Tamang', parentPhone: '+977-9841111116', pickupStop: 'Balaju', dropStop: 'Swayambhu', assignedBus: 'BUS-103', route: 'RT-03', status: 'on_bus', pickupTime: '07:55 AM' },
  { id: 'STU-007', fullName: 'Vijay Magar', class: '8', section: 'A', parentName: 'Sunil Magar', parentPhone: '+977-9841111117', pickupStop: 'Koteshwor', dropStop: 'Jadibuti', assignedBus: 'BUS-104', route: 'RT-04', status: 'on_bus', pickupTime: '08:12 AM' },
  { id: 'STU-008', fullName: 'Priya Gurung', class: '6', section: 'A', parentName: 'Anil Gurung', parentPhone: '+977-9841111118', pickupStop: 'Boudha', dropStop: 'Kamaladi', assignedBus: 'BUS-104', route: 'RT-04', status: 'waiting' },
  { id: 'STU-009', fullName: 'Nischal Shrestha', class: '4', section: 'C', parentName: 'Prakash Shrestha', parentPhone: '+977-9841111119', pickupStop: 'Gongabu', dropStop: 'New Baneshwor', assignedBus: 'BUS-107', route: 'RT-07', status: 'on_bus', pickupTime: '08:03 AM' },
  { id: 'STU-010', fullName: 'Sunita Karki', class: '7', section: 'B', parentName: 'Ramesh Karki', parentPhone: '+977-9841111120', pickupStop: 'Maharajgunj', dropStop: 'Tripureshwor', assignedBus: 'BUS-107', route: 'RT-07', status: 'on_bus', pickupTime: '08:09 AM' },
  { id: 'STU-011', fullName: 'Aakash Bhandari', class: '5', section: 'A', parentName: 'Manoj Bhandari', parentPhone: '+977-9841111121', pickupStop: 'Sundarijal', dropStop: 'Gyaneshwor', assignedBus: 'BUS-108', route: 'RT-08', status: 'on_bus', pickupTime: '08:15 AM' },
  { id: 'STU-012', fullName: 'Riya Bajracharya', class: '6', section: 'C', parentName: 'Deepak Bajracharya', parentPhone: '+977-9841111122', pickupStop: 'Chabahil', dropStop: 'Rajdol', assignedBus: 'BUS-108', route: 'RT-08', status: 'waiting' },
];

export const routes: Route[] = [
  { id: 'RT-01', name: 'Route A - Thamel Circuit', vehicleId: 'BUS-101', driverId: 'DRV-01', stops: [
    { id: 'S01', name: 'Thamel', lat: 27.7150, lng: 85.3120, time: '08:00 AM', studentsCount: 8, order: 1, type: 'pickup' },
    { id: 'S02', name: 'New Road', lat: 27.7040, lng: 85.3150, time: '08:10 AM', studentsCount: 6, order: 2, type: 'pickup' },
    { id: 'S03', name: 'Kathmandu Mall', lat: 27.7100, lng: 85.3130, time: '08:20 AM', studentsCount: 8, order: 3, type: 'pickup' },
    { id: 'S04', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:45 AM', studentsCount: 0, order: 4, type: 'school' },
  ], totalStudents: 22, estimatedTime: '45 min', distance: '12.5 km', status: 'in_progress', startTime: '08:00 AM' },
  { id: 'RT-02', name: 'Route B - Eastern Ring', vehicleId: 'BUS-102', driverId: 'DRV-02', stops: [
    { id: 'S05', name: 'Baneshwor', lat: 27.6860, lng: 85.3470, time: '07:55 AM', studentsCount: 10, order: 1, type: 'pickup' },
    { id: 'S06', name: 'Koteshwor', lat: 27.6820, lng: 85.3510, time: '08:10 AM', studentsCount: 8, order: 2, type: 'pickup' },
    { id: 'S07', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:40 AM', studentsCount: 0, order: 3, type: 'school' },
  ], totalStudents: 18, estimatedTime: '40 min', distance: '10.2 km', status: 'in_progress', startTime: '07:55 AM' },
  { id: 'RT-03', name: 'Route C - Western Loop', vehicleId: 'BUS-103', driverId: 'DRV-03', stops: [
    { id: 'S08', name: 'Balaju', lat: 27.7160, lng: 85.2830, time: '07:50 AM', studentsCount: 12, order: 1, type: 'pickup' },
    { id: 'S09', name: 'Swayambhu', lat: 27.7140, lng: 85.2900, time: '08:05 AM', studentsCount: 8, order: 2, type: 'pickup' },
    { id: 'S10', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:35 AM', studentsCount: 0, order: 3, type: 'school' },
  ], totalStudents: 20, estimatedTime: '35 min', distance: '8.7 km', status: 'in_progress', startTime: '07:50 AM' },
  { id: 'RT-04', name: 'Route D - South Express', vehicleId: 'BUS-104', driverId: 'DRV-04', stops: [
    { id: 'S11', name: 'Lalitpur', lat: 27.6640, lng: 85.3200, time: '07:45 AM', studentsCount: 15, order: 1, type: 'pickup' },
    { id: 'S12', name: 'Patan', lat: 27.6720, lng: 85.3250, time: '08:00 AM', studentsCount: 12, order: 2, type: 'pickup' },
    { id: 'S13', name: 'Kupondole', lat: 27.6760, lng: 85.3100, time: '08:15 AM', studentsCount: 11, order: 3, type: 'pickup' },
    { id: 'S14', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:40 AM', studentsCount: 0, order: 4, type: 'school' },
  ], totalStudents: 38, estimatedTime: '50 min', distance: '15.3 km', status: 'in_progress', startTime: '07:45 AM' },
  { id: 'RT-05', name: 'Route E - North Circuit', vehicleId: 'BUS-105', driverId: 'DRV-05', stops: [
    { id: 'S15', name: 'Kathmandu Durbar', lat: 27.7040, lng: 85.3070, time: '08:30 AM', studentsCount: 0, order: 1, type: 'pickup' },
    { id: 'S16', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '09:00 AM', studentsCount: 0, order: 2, type: 'school' },
  ], totalStudents: 0, estimatedTime: '30 min', distance: '7.1 km', status: 'scheduled' },
  { id: 'RT-06', name: 'Route F - Eastern Express', vehicleId: 'BUS-106', driverId: 'DRV-06', stops: [
    { id: 'S17', name: 'Bhaktapur', lat: 27.6710, lng: 85.4290, time: '07:30 AM', studentsCount: 0, order: 1, type: 'pickup' },
    { id: 'S18', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:30 AM', studentsCount: 0, order: 2, type: 'school' },
  ], totalStudents: 0, estimatedTime: '60 min', distance: '22.5 km', status: 'scheduled' },
  { id: 'RT-07', name: 'Route G - Central Loop', vehicleId: 'BUS-107', driverId: 'DRV-07', stops: [
    { id: 'S19', name: 'Gongabu', lat: 27.7350, lng: 85.2950, time: '07:55 AM', studentsCount: 8, order: 1, type: 'pickup' },
    { id: 'S20', name: 'Maharajgunj', lat: 27.7200, lng: 85.3100, time: '08:10 AM', studentsCount: 6, order: 2, type: 'pickup' },
    { id: 'S21', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:40 AM', studentsCount: 0, order: 3, type: 'school' },
  ], totalStudents: 14, estimatedTime: '40 min', distance: '11.8 km', status: 'in_progress', startTime: '07:55 AM' },
  { id: 'RT-08', name: 'Route H - Hill Route', vehicleId: 'BUS-108', driverId: 'DRV-08', stops: [
    { id: 'S22', name: 'Sundarijal', lat: 27.7600, lng: 85.4100, time: '07:40 AM', studentsCount: 10, order: 1, type: 'pickup' },
    { id: 'S23', name: 'Chabahil', lat: 27.7100, lng: 85.3600, time: '08:05 AM', studentsCount: 8, order: 2, type: 'pickup' },
    { id: 'S24', name: 'School Campus', lat: 27.6800, lng: 85.3300, time: '08:45 AM', studentsCount: 0, order: 3, type: 'school' },
  ], totalStudents: 18, estimatedTime: '55 min', distance: '18.2 km', status: 'in_progress', startTime: '07:40 AM' },
];

export const driverAlerts: DriverAlert[] = [
  { id: 'ALT-001', driverId: 'DRV-08', vehicleId: 'BUS-108', type: 'drowsiness', message: 'Driver appeared drowsy - eyes closed for 3 seconds', time: '08:15 AM', severity: 'high', acknowledged: false },
  { id: 'ALT-002', driverId: 'DRV-04', vehicleId: 'BUS-104', type: 'overspeed', message: 'Vehicle exceeded speed limit - 75 km/h in 50 zone', time: '08:12 AM', severity: 'medium', acknowledged: true },
  { id: 'ALT-003', driverId: 'DRV-02', vehicleId: 'BUS-102', type: 'drowsiness', message: 'Driver drowsiness episode - 4 second eye closure', time: '08:08 AM', severity: 'high', acknowledged: true },
  { id: 'ALT-004', driverId: 'DRV-04', vehicleId: 'BUS-104', type: 'harsh_braking', message: 'Sudden deceleration detected - 0.8g', time: '08:05 AM', severity: 'medium', acknowledged: false },
  { id: 'ALT-005', driverId: 'DRV-08', vehicleId: 'BUS-108', type: 'route_deviation', message: 'Vehicle deviated 350m from planned route', time: '08:02 AM', severity: 'low', acknowledged: true },
];

export const sosAlerts: SOSAlert[] = [
  {
    id: 'SOS-001', vehicleId: 'BUS-101', driverId: 'DRV-01',
    location: { lat: 27.7100, lng: 85.3130 }, time: '08:17 AM',
    reason: 'Driver did not respond to drowsiness alert',
    status: 'active', escalationLevel: 'primary', escalationTimer: 25,
    primaryContact: { name: 'Principal Shrestha', phone: '+977-9841000001', type: 'School Admin', responded: false },
    secondaryContact: { name: 'Transport Manager Lama', phone: '+977-9841000002', type: 'Transport Manager', responded: false },
    authorityContact: { name: 'Emergency Services', phone: '100', type: 'Local Authority', responded: false },
    primaryResponded: false, secondaryResponded: false, authorityResponded: false,
  }
];

export const notifications: Notification[] = [
  { id: 'NOT-001', type: 'emergency', title: 'SOS Alert', message: 'SOS triggered on BUS-101 - Driver did not respond to drowsiness alert', time: '08:17 AM', read: false, severity: 'critical', vehicleId: 'BUS-101' },
  { id: 'NOT-002', type: 'driver', title: 'Drowsiness Alert', message: 'Driver DRV-08 appeared drowsy on BUS-108', time: '08:15 AM', read: false, severity: 'warning', vehicleId: 'BUS-108', driverId: 'DRV-08' },
  { id: 'NOT-003', type: 'student', title: 'Student Dropped', message: 'Ananya KC dropped at Patan - 08:32 AM', time: '08:32 AM', read: true, severity: 'info', studentId: 'STU-004' },
  { id: 'NOT-004', type: 'vehicle', title: 'Vehicle Delayed', message: 'BUS-108 is 15 minutes behind schedule', time: '08:20 AM', read: false, severity: 'warning', vehicleId: 'BUS-108' },
  { id: 'NOT-005', type: 'driver', title: 'Overspeed Alert', message: 'BUS-104 exceeded speed limit - 75 km/h', time: '08:12 AM', read: true, severity: 'warning', vehicleId: 'BUS-104', driverId: 'DRV-04' },
  { id: 'NOT-006', type: 'student', title: 'Student Picked Up', message: 'Aarav Sharma picked up at Thamel - 08:05 AM', time: '08:05 AM', read: true, severity: 'info', studentId: 'STU-001' },
  { id: 'NOT-007', type: 'route', title: 'Route Started', message: 'BUS-101 started Route A - Thamel Circuit', time: '08:00 AM', read: true, severity: 'info' },
  { id: 'NOT-008', type: 'vehicle', title: 'Vehicle Offline', message: 'BUS-106 GPS signal lost since 06:00 PM yesterday', time: 'Yesterday', read: true, severity: 'warning', vehicleId: 'BUS-106' },
];

export const trips: Trip[] = [
  { id: 'TRIP-001', vehicleId: 'BUS-101', driverId: 'DRV-01', routeId: 'RT-01', status: 'in_progress', startTime: '08:00 AM', studentsPickedUp: 22, studentsDropped: 0, totalStudents: 22 },
  { id: 'TRIP-002', vehicleId: 'BUS-102', driverId: 'DRV-02', routeId: 'RT-02', status: 'in_progress', startTime: '07:55 AM', studentsPickedUp: 18, studentsDropped: 1, totalStudents: 18 },
  { id: 'TRIP-003', vehicleId: 'BUS-103', driverId: 'DRV-03', routeId: 'RT-03', status: 'in_progress', startTime: '07:50 AM', studentsPickedUp: 20, studentsDropped: 0, totalStudents: 20 },
  { id: 'TRIP-004', vehicleId: 'BUS-104', driverId: 'DRV-04', routeId: 'RT-04', status: 'in_progress', startTime: '07:45 AM', studentsPickedUp: 38, studentsDropped: 0, totalStudents: 38 },
  { id: 'TRIP-005', vehicleId: 'BUS-107', driverId: 'DRV-07', routeId: 'RT-07', status: 'in_progress', startTime: '07:55 AM', studentsPickedUp: 14, studentsDropped: 0, totalStudents: 14 },
  { id: 'TRIP-006', vehicleId: 'BUS-108', driverId: 'DRV-08', routeId: 'RT-08', status: 'in_progress', startTime: '07:40 AM', studentsPickedUp: 18, studentsDropped: 0, totalStudents: 18 },
];

export const activityLogs: ActivityLog[] = [
  { id: 'LOG-001', type: 'student', message: 'Student Ananya KC dropped at school', time: '08:32 AM', icon: 'check', severity: 'success' },
  { id: 'LOG-002', type: 'emergency', message: 'SOS triggered on BUS-101', time: '08:17 AM', icon: 'alert-triangle', severity: 'danger' },
  { id: 'LOG-003', type: 'driver', message: 'Drowsiness detected - DRV-07 on BUS-107', time: '08:15 AM', icon: 'eye-off', severity: 'warning' },
  { id: 'LOG-004', type: 'vehicle', message: 'BUS-104 exceeded speed limit', time: '08:12 AM', icon: 'zap', severity: 'warning' },
  { id: 'LOG-005', type: 'student', message: 'Diya Thapa picked up at New Road', time: '08:07 AM', icon: 'check', severity: 'success' },
  { id: 'LOG-006', type: 'vehicle', message: 'BUS-108 deviated from route', time: '08:02 AM', icon: 'navigation', severity: 'warning' },
  { id: 'LOG-007', type: 'route', message: 'BUS-101 started Route A', time: '08:00 AM', icon: 'play', severity: 'info' },
  { id: 'LOG-008', type: 'student', message: 'Aarav Sharma picked up at Thamel', time: '08:05 AM', icon: 'check', severity: 'success' },
  { id: 'LOG-009', type: 'vehicle', message: 'BUS-106 GPS signal offline', time: 'Yesterday 6 PM', icon: 'wifi-off', severity: 'warning' },
  { id: 'LOG-010', type: 'route', message: 'Morning routes initiated', time: '07:45 AM', icon: 'play-circle', severity: 'info' },
];
