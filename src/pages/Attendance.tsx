import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  QrCode, ScanLine, Play, Square, Clock, Bus, Route,
  CheckCircle, XCircle, AlertTriangle, Search, Filter,
  UserCheck, ChevronDown, Calendar
} from 'lucide-react';
import QRScanner from '../components/QRScanner';
import DemoQRScanner from '../components/DemoQRScanner';
import AttendanceSummary from '../components/AttendanceSummary';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import { TripStage } from '../data/types';

export default function Attendance() {
  const {
    vehicles, routes, students, attendanceSession, lastScanResult, attendanceEvents,
    selectedAttendanceVehicle, selectedAttendanceRoute, selectedTripStage,
    setSelectedAttendanceVehicle, setSelectedAttendanceRoute, setSelectedTripStage,
    startAttendanceSession, stopAttendanceSession, scanStudentQR, clearLastScanResult,
    getStudentsOnBus, getBusOccupancy,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const assignedStudents = students.filter(
    s => s.assignedVehicleId === selectedAttendanceVehicle && s.assignedRouteId === selectedAttendanceRoute
  );

  const filtered = assignedStudents.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.attendanceStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const occupancy = getBusOccupancy(selectedAttendanceVehicle);

  const handleScan = useCallback((qrCode: string) => {
    scanStudentQR(qrCode);
    const result = useStore.getState().lastScanResult;
    if (result?.success) {
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 2000);
    }
  }, [scanStudentQR]);

  useEffect(() => {
    if (lastScanResult) {
      const timer = setTimeout(() => clearLastScanResult(), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastScanResult, clearLastScanResult]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tripStageLabels: Record<TripStage, string> = {
    morning_pickup: 'Morning Pickup',
    morning_drop: 'Morning School Drop',
    evening_pickup: 'Evening School Pickup',
    evening_drop: 'Evening Home Drop',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-electric-400" />
            QR Student Attendance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Scan student QR codes to record bus boarding and drop attendance in real time.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-navy-700/50 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3 h-3" />
            {today}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-navy-700/50 px-3 py-1.5 rounded-lg">
            <Bus className="w-3 h-3" />
            {selectedAttendanceVehicle}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-navy-700/50 px-3 py-1.5 rounded-lg">
            <Route className="w-3 h-3" />
            {selectedAttendanceRoute}
          </div>
          {attendanceSession?.isActive && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Session Active
            </span>
          )}
        </div>
      </div>

      {/* Trip & Vehicle Selection */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Select Vehicle</label>
            <select
              value={selectedAttendanceVehicle}
              onChange={e => setSelectedAttendanceVehicle(e.target.value)}
              className="input-field text-xs"
              disabled={attendanceSession?.isActive}
            >
              {vehicles.filter(v => v.status !== 'offline').map(v => (
                <option key={v.id} value={v.id}>{v.id} - {v.routeName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Select Route</label>
            <select
              value={selectedAttendanceRoute}
              onChange={e => setSelectedAttendanceRoute(e.target.value)}
              className="input-field text-xs"
              disabled={attendanceSession?.isActive}
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Trip Stage</label>
            <select
              value={selectedTripStage}
              onChange={e => setSelectedTripStage(e.target.value as TripStage)}
              className="input-field text-xs"
              disabled={attendanceSession?.isActive}
            >
              <option value="morning_pickup">Morning Pickup</option>
              <option value="morning_drop">Morning School Drop</option>
              <option value="evening_pickup">Evening School Pickup</option>
              <option value="evening_drop">Evening Home Drop</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Session</label>
            {!attendanceSession?.isActive ? (
              <button onClick={startAttendanceSession} className="w-full btn-success text-xs py-3 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Session
              </button>
            ) : (
              <button onClick={stopAttendanceSession} className="w-full btn-danger text-xs py-3 flex items-center justify-center gap-2">
                <Square className="w-4 h-4" /> Stop Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scan Result Toast */}
      {lastScanResult && (
        <div className={`glass-card p-4 border-l-4 ${
          lastScanResult.success ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-red-500 bg-red-500/5'
        } ${scanSuccess ? 'scan-success-pulse' : ''}`}>
          <div className="flex items-center gap-3">
            {lastScanResult.success ? (
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            )}
            <div className="flex-1">
              <p className={`text-sm font-bold ${lastScanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastScanResult.success ? 'Student Verified' : 'Scan Failed'}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">{lastScanResult.message}</p>
              {lastScanResult.student && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-400">{lastScanResult.student.studentId}</span>
                  <span className="text-[10px] text-gray-400">{lastScanResult.student.assignedVehicleId}</span>
                  <span className="text-[10px] text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scanner & Demo */}
        <div className="space-y-4">
          {/* QR Camera Scanner */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-electric-400" />
              QR Camera Scanner
            </h3>
            <QRScanner onScan={handleScan} isActive={!!attendanceSession?.isActive} />
          </div>

          {/* Demo Scanner */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              Demo QR Scanner
            </h3>
            <DemoQRScanner onScan={handleScan} isActive={!!attendanceSession?.isActive} />
          </div>

          {/* Bus Occupancy */}
          <AttendanceSummary vehicleId={selectedAttendanceVehicle} />
        </div>

        {/* Right Column - Attendance List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'waiting', 'picked_up', 'on_bus', 'dropped', 'absent'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-electric-600 text-white'
                      : 'bg-navy-700/50 text-gray-400 hover:bg-navy-600/50'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">Student</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">ID</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">Class</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">Boarding Time</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">Drop Time</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className={`border-b border-white/5 hover:bg-white/5 transition-all ${
                      lastScanResult?.student?.id === s.id ? 'bg-electric-500/10' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-600/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-electric-400">{s.fullName[0]}</span>
                          </div>
                          <p className="text-xs font-bold text-white">{s.fullName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-400">{s.studentId}</td>
                      <td className="px-4 py-3 text-xs text-white">{s.class}-{s.section}</td>
                      <td className="px-4 py-3 text-xs text-white">{s.lastBoardedAt || '--'}</td>
                      <td className="px-4 py-3 text-xs text-white">{s.lastDroppedAt || '--'}</td>
                      <td className="px-4 py-3">
                        <AttendanceStatusBadge status={s.attendanceStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {s.attendanceStatus === 'on_bus' || s.attendanceStatus === 'picked_up' ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Scanned
                            </span>
                          ) : s.attendanceStatus === 'dropped' ? (
                            <span className="text-[10px] text-purple-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Dropped
                            </span>
                          ) : s.attendanceStatus === 'absent' ? (
                            <span className="text-[10px] text-red-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Absent
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <p className="text-xs text-gray-400">No students found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Attendance Events */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-400" />
              Recent Attendance Events
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {attendanceEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-navy-700/30">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    event.type === 'boarded' ? 'bg-emerald-500/20 text-emerald-400' :
                    event.type === 'dropped' ? 'bg-purple-500/20 text-purple-400' :
                    event.type === 'absent' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {event.type === 'boarded' ? <UserCheck className="w-3.5 h-3.5" /> :
                     event.type === 'dropped' ? <CheckCircle className="w-3.5 h-3.5" /> :
                     <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white truncate">{event.message}</p>
                    <p className="text-[9px] text-gray-400">{event.time} — {event.vehicleId}</p>
                  </div>
                </div>
              ))}
              {attendanceEvents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No attendance events yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
