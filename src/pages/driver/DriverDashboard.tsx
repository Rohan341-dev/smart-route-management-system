import { useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import {
  Home, ScanLine, Route, Bell, User, Bus, Users, MapPin, Clock,
  AlertTriangle, CheckCircle, ChevronRight, Navigation, Shield,
  LogOut, Eye, QrCode, Phone, Play, Square, RotateCcw
} from 'lucide-react';

type DriverTab = 'home' | 'scan' | 'route' | 'alerts' | 'profile';

export default function DriverDashboard() {
  const {
    currentUser, drivers, vehicles, routes, students, notifications, driverAlerts,
    logout, setCurrentPage, attendanceSession, startAttendanceSession, stopAttendanceSession,
    scanStudentQR, lastScanResult, clearLastScanResult, selectedAttendanceVehicle,
    selectedAttendanceRoute, selectedTripStage, setSelectedAttendanceVehicle,
    setSelectedAttendanceRoute, setSelectedTripStage,
  } = useStore();

  const [activeTab, setActiveTab] = useState<DriverTab>('home');
  const [tripStatus, setTripStatus] = useState<'not_started' | 'starting' | 'in_progress' | 'delayed' | 'completed'>('in_progress');
  const [showScanModal, setShowScanModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');

  const driverId = currentUser?.driverId || 'DRV-07';
  const vehicleId = currentUser?.assignedVehicleId || 'BUS-107';
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const route = routes.find(r => r.vehicleId === vehicleId);
  const assignedStudents = students.filter(s => s.assignedBus === vehicleId || s.assignedVehicleId === vehicleId);
  const driverNotifs = notifications.filter(n => n.driverId === driverId || n.vehicleId === vehicleId);
  const driverAlertsList = driverAlerts.filter(a => a.driverId === driverId || a.vehicleId === vehicleId);
  const unreadNotifs = driverNotifs.filter(n => !n.read).length;

  const pickedUp = assignedStudents.filter(s => s.attendanceStatus === 'picked_up' || s.attendanceStatus === 'on_bus').length;
  const onBus = assignedStudents.filter(s => s.attendanceStatus === 'on_bus').length;
  const waiting = assignedStudents.filter(s => s.attendanceStatus === 'waiting').length;
  const dropped = assignedStudents.filter(s => s.attendanceStatus === 'dropped').length;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const handleScan = useCallback((qrData: string) => {
    scanStudentQR(qrData);
  }, [scanStudentQR]);

  const handleManualScan = () => {
    if (!manualStudentId.trim()) return;
    const student = assignedStudents.find(s => s.studentId === manualStudentId.trim() || s.id === manualStudentId.trim());
    if (student) {
      try {
        handleScan(student.qrCode);
      } catch {
        handleScan(student.studentId);
      }
      setManualStudentId('');
    }
  };

  const tripStatusConfig = {
    not_started: { label: 'NOT STARTED', color: 'text-gray-400', bg: 'bg-gray-500/20', dot: 'bg-gray-400' },
    starting: { label: 'STARTING', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
    in_progress: { label: 'IN PROGRESS', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400 animate-pulse' },
    delayed: { label: 'DELAYED', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400' },
    completed: { label: 'COMPLETED', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
  };

  const currentTripStatus = tripStatusConfig[tripStatus];

  const tabs: { id: DriverTab; icon: typeof Home; label: string; badge?: number }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'scan', icon: ScanLine, label: 'Scan', badge: waiting },
    { id: 'route', icon: Route, label: 'Route' },
    { id: 'alerts', icon: Bell, label: 'Alerts', badge: unreadNotifs + driverAlertsList.filter(a => !a.acknowledged).length },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50 flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="dark:bg-navy-900/90 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black dark:text-white text-surface-900 tracking-tight">SMARTBUS</h1>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{vehicleId} Driver</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-[9px] font-bold ${currentTripStatus.bg} ${currentTripStatus.color}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentTripStatus.dot} mr-1`}></span>
              {currentTripStatus.label}
            </div>
            <button onClick={logout} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Greeting */}
            <div className="glass-card p-5">
              <p className="text-xs dark:text-gray-400 text-surface-500">{greeting}</p>
              <h2 className="text-lg font-black dark:text-white text-surface-900">{driver?.fullName || currentUser?.name || 'Driver'}</h2>
              <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-0.5">{vehicleId} - {route?.name || 'N/A'}</p>
            </div>

            {/* Current Trip Card */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-electric-400" />
                  CURRENT TRIP
                </h3>
                <span className={`text-[10px] font-bold ${currentTripStatus.color}`}>{currentTripStatus.label}</span>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-sm font-bold dark:text-white text-surface-900">{route?.name || 'Morning Route'}</p>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">{route?.distance || 'N/A'} - {route?.estimatedTime || 'N/A'}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {(['not_started', 'starting', 'in_progress', 'delayed', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setTripStatus(status)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                      tripStatus === status
                        ? 'bg-electric-600 text-white'
                        : 'dark:bg-navy-700/50 bg-surface-200 dark:text-gray-400 text-surface-500'
                    }`}
                  >
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Picked Up', value: pickedUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
                { label: 'On Bus', value: onBus, color: 'text-electric-400', bg: 'bg-electric-500/20' },
                { label: 'Waiting', value: waiting, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                { label: 'Dropped', value: dropped, color: 'text-purple-400', bg: 'bg-purple-500/20' },
              ].map(stat => (
                <div key={stat.label} className="glass-card p-3 text-center">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1`}>
                    <Users className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[8px] dark:text-gray-400 text-surface-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">QUICK ACTIONS</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('scan')}
                  className="p-3 rounded-xl bg-gradient-to-r from-electric-600 to-electric-700 text-white flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <ScanLine className="w-4 h-4" /> Scan QR
                </button>
                <button
                  onClick={() => setActiveTab('route')}
                  className="p-3 rounded-xl dark:bg-navy-700/50 bg-surface-200 dark:text-gray-300 text-surface-600 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <MapPin className="w-4 h-4" /> My Route
                </button>
                <button
                  onClick={() => setCurrentPage('driver-monitoring')}
                  className="p-3 rounded-xl dark:bg-navy-700/50 bg-surface-200 dark:text-gray-300 text-surface-600 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Eye className="w-4 h-4" /> Camera
                </button>
                <button
                  onClick={() => setCurrentPage('sos')}
                  className="p-3 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <AlertTriangle className="w-4 h-4" /> SOS
                </button>
              </div>
            </div>

            {/* Vehicle Status */}
            {vehicle && (
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-electric-400" />
                  VEHICLE STATUS
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Status</p>
                    <p className={`text-xs font-bold ${
                      vehicle.status === 'moving' ? 'text-emerald-400' :
                      vehicle.status === 'stopped' ? 'text-amber-400' : 'text-gray-400'
                    }`}>{vehicle.status.toUpperCase()}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{vehicle.speed} km/h</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Students</p>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{vehicle.currentStudents}/{vehicle.capacity}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Safety Score</p>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{driver?.safetyScore || 91}/100</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-electric-400" />
                QR ATTENDANCE SCANNER
              </h3>

              {!attendanceSession?.isActive ? (
                <div className="space-y-3">
                  <p className="text-[10px] dark:text-gray-400 text-surface-500">Start an attendance session to begin scanning</p>
                  <div className="space-y-2">
                    <select value={selectedAttendanceVehicle} onChange={e => setSelectedAttendanceVehicle(e.target.value)} className="input-field text-xs">
                      {vehicles.filter(v => v.id === vehicleId).map(v => (
                        <option key={v.id} value={v.id}>{v.id} - {v.routeName}</option>
                      ))}
                    </select>
                    <select value={selectedAttendanceRoute} onChange={e => setSelectedAttendanceRoute(e.target.value)} className="input-field text-xs">
                      {routes.filter(r => r.vehicleId === vehicleId).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <select value={selectedTripStage} onChange={e => setSelectedTripStage(e.target.value as any)} className="input-field text-xs">
                      <option value="morning_pickup">Morning Pickup</option>
                      <option value="morning_drop">Morning School Drop</option>
                      <option value="evening_pickup">Evening School Pickup</option>
                      <option value="evening_drop">Evening Home Drop</option>
                    </select>
                  </div>
                  <button onClick={startAttendanceSession} className="w-full py-3 bg-gradient-to-r from-electric-600 to-electric-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Start Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      Session Active
                    </span>
                    <button onClick={stopAttendanceSession} className="text-[10px] text-red-400 flex items-center gap-1">
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  </div>

                  <button
                    onClick={() => setShowScanModal(true)}
                    className="w-full py-4 bg-gradient-to-r from-electric-600 to-electric-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-electric-500/25"
                  >
                    <ScanLine className="w-5 h-5" /> TAP TO SCAN QR
                  </button>

                  {/* Manual Entry */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualStudentId}
                      onChange={e => setManualStudentId(e.target.value)}
                      placeholder="Or enter Student ID..."
                      className="input-field text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                    />
                    <button onClick={handleManualScan} className="px-4 py-2 bg-electric-600 text-white rounded-xl text-xs font-bold">
                      Go
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Result */}
            {lastScanResult && (
              <div className={`glass-card p-4 border-l-4 ${
                lastScanResult.success ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-red-500 bg-red-500/5'
              }`}>
                <div className="flex items-center gap-3">
                  {lastScanResult.success ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${lastScanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lastScanResult.success ? 'STUDENT VERIFIED' : 'SCAN FAILED'}
                    </p>
                    <p className="text-[10px] dark:text-gray-300 text-surface-600 mt-0.5">{lastScanResult.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Student List */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">TODAY'S STUDENTS ({assignedStudents.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {assignedStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl dark:bg-navy-700/30 bg-surface-50">
                    {student.photo ? (
                      <img src={student.photo} alt={student.fullName} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        student.attendanceStatus === 'on_bus' ? 'bg-emerald-500/20 text-emerald-400' :
                        student.attendanceStatus === 'picked_up' ? 'bg-amber-500/20 text-amber-400' :
                        student.attendanceStatus === 'dropped' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {student.fullName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white text-surface-900 truncate">{student.fullName}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">{student.studentId} - {student.class}-{student.section}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                      student.attendanceStatus === 'on_bus' ? 'bg-emerald-500/20 text-emerald-400' :
                      student.attendanceStatus === 'picked_up' ? 'bg-amber-500/20 text-amber-400' :
                      student.attendanceStatus === 'dropped' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {student.attendanceStatus === 'on_bus' ? 'ON BUS' :
                       student.attendanceStatus === 'picked_up' ? 'PICKED UP' :
                       student.attendanceStatus === 'dropped' ? 'DROPPED' : 'WAITING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'route' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-1 flex items-center gap-2">
                <Route className="w-4 h-4 text-electric-400" />
                {route?.name || 'ROUTE'}
              </h3>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{route?.distance} - {route?.estimatedTime}</p>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">ROUTE STOPS</h3>
              <div className="space-y-0">
                {(route?.stops || []).map((stop, index) => {
                  const isLast = index === (route?.stops.length || 0) - 1;
                  const isSchool = stop.type === 'school';
                  return (
                    <div key={stop.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          isSchool ? 'bg-electric-500 border-electric-500' :
                          'bg-emerald-500 border-emerald-500'
                        }`} />
                        {!isLast && <div className="w-0.5 h-8 dark:bg-white/10 bg-surface-200" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold dark:text-white text-surface-900">
                              {isSchool ? '🏫' : `Stop ${stop.order}`} {stop.name}
                            </p>
                            <p className="text-[9px] dark:text-gray-400 text-surface-500">{stop.time} - {stop.studentsCount} students</p>
                          </div>
                          {!isSchool && (
                            <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                              ✓ COMPLETED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-4 space-y-4">
            {driverAlertsList.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  DRIVER ALERTS
                </h3>
                <div className="space-y-2">
                  {driverAlertsList.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-xl ${
                      alert.severity === 'high' ? 'bg-red-500/10 border border-red-500/20' :
                      alert.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'dark:bg-navy-700/30 bg-surface-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold dark:text-white text-surface-900">{alert.type.replace('_', ' ').toUpperCase()}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                          alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>{alert.severity}</span>
                      </div>
                      <p className="text-[10px] dark:text-gray-300 text-surface-600 mt-1">{alert.message}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500 mt-1">{alert.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-electric-400" />
                NOTIFICATIONS
              </h3>
              <div className="space-y-2">
                {driverNotifs.slice(0, 10).map(n => (
                  <div key={n.id} className={`p-3 rounded-xl ${
                    n.read ? 'dark:bg-navy-700/20 bg-surface-50' :
                    n.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                    n.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'dark:bg-navy-700/30 bg-surface-50'
                  }`}>
                    <p className="text-[10px] font-bold dark:text-white text-surface-900">{n.title}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500 mt-0.5">{n.message}</p>
                    <p className="text-[9px] dark:text-gray-500 text-surface-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-5 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                {driver?.fullName?.[0] || 'D'}
              </div>
              <h2 className="text-sm font-bold dark:text-white text-surface-900">{driver?.fullName || currentUser?.name}</h2>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{driverId}</p>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{driver?.phone || 'N/A'}</p>
            </div>

            <div className="glass-card p-4 space-y-3">
              {[
                { label: 'License', value: driver?.licenseNumber || 'N/A' },
                { label: 'Assigned Bus', value: vehicleId },
                { label: 'Route', value: route?.name || 'N/A' },
                { label: 'Safety Score', value: `${driver?.safetyScore || 91}/100` },
                { label: 'Driving Hours', value: `${driver?.drivingHours || 0}h` },
                { label: 'Drowsiness Alerts', value: `${driver?.drowsinessAlerts || 0}` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[10px] dark:text-gray-400 text-surface-500">{item.label}</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{item.value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={logout}
              className="w-full py-3 bg-red-600/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> LOGOUT
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 dark:bg-navy-900/95 bg-white/95 backdrop-blur-md border-t dark:border-white/5 border-surface-200">
        <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-0 flex-1 ${
                  isActive ? 'text-electric-400' : 'dark:text-gray-500 text-surface-400'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-electric-400' : ''}`} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* QR Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg dark:bg-navy-900 bg-white rounded-t-2xl p-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold dark:text-white text-surface-900">Scan Student QR</h3>
              <button onClick={() => setShowScanModal(false)} className="text-xs dark:text-gray-400 text-surface-500">
                Close
              </button>
            </div>
            <div className="dark:bg-navy-800 bg-surface-100 rounded-2xl p-4 text-center">
              <ScanLine className="w-12 h-12 text-electric-400 mx-auto mb-3 animate-pulse" />
              <p className="text-xs dark:text-gray-400 text-surface-500">Point camera at student QR code</p>
              <p className="text-[10px] dark:text-gray-500 text-surface-500 mt-1">Or enter student ID manually below</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualStudentId}
                onChange={e => setManualStudentId(e.target.value)}
                placeholder="Student ID..."
                className="input-field text-xs flex-1"
                onKeyDown={e => e.key === 'Enter' && handleManualScan()}
              />
              <button onClick={handleManualScan} className="px-4 py-2 bg-electric-600 text-white rounded-xl text-xs font-bold">
                Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
