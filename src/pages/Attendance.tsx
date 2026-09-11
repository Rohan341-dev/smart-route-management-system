import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  QrCode, ScanLine, Play, Square, Clock, Bus, Route,
  CheckCircle, XCircle, AlertTriangle, Search, Filter,
  UserCheck, ChevronDown, Calendar, Bug, RefreshCw
} from 'lucide-react';
import QRScanner from '../components/QRScanner';
import DemoQRScanner from '../components/DemoQRScanner';
import AttendanceSummary from '../components/AttendanceSummary';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import { TripStage } from '../data/types';

interface DebugInfo {
  camera: string;
  scanner: string;
  qrDetected: boolean;
  rawValue: string;
  parsedStudentId: string;
  studentFound: boolean;
  apiRequest: string;
  apiStatus: string;
  dbRecord: string;
  uiState: string;
}

export default function Attendance() {
  const {
    vehicles, routes, students, attendanceSession, lastScanResult, attendanceEvents,
    selectedAttendanceVehicle, selectedAttendanceRoute, selectedTripStage,
    setSelectedAttendanceVehicle, setSelectedAttendanceRoute, setSelectedTripStage,
    startAttendanceSession, stopAttendanceSession, scanStudentQR, clearLastScanResult,
    getStudentsOnBus, getBusOccupancy, fetchStudents, fetchRoutes,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    camera: 'IDLE',
    scanner: 'IDLE',
    qrDetected: false,
    rawValue: '',
    parsedStudentId: '',
    studentFound: false,
    apiRequest: 'NOT SENT',
    apiStatus: '--',
    dbRecord: '--',
    uiState: 'WAITING',
  });

  // Sync students and routes from Django on mount
  useEffect(() => {
    const syncData = async () => {
      try {
        await Promise.all([fetchStudents(), fetchRoutes()]);
      } catch (e) {
        console.error('[Attendance] Failed to sync data:', e);
      } finally {
        setInitialLoading(false);
      }
    };
    syncData();
  }, []);

  const assignedStudents = students.filter(
    s => s.assignedVehicleId === selectedAttendanceVehicle && s.assignedRouteId === selectedAttendanceRoute
  );

  const filtered = assignedStudents.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.attendanceStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const occupancy = getBusOccupancy(selectedAttendanceVehicle);

  const handleScan = useCallback(async (qrCode: string) => {
    console.log('[Attendance] handleScan called with:', qrCode);

    // Parse student ID for debug
    let parsedId = qrCode;
    if (qrCode.startsWith('SMARTBUS:STUDENT:')) {
      parsedId = qrCode.replace('SMARTBUS:STUDENT:', '').trim();
    }

    const studentInList = students.find(s => s.studentId === parsedId);

    setDebugInfo(prev => ({
      ...prev,
      qrDetected: true,
      rawValue: qrCode,
      parsedStudentId: parsedId,
      studentFound: !!studentInList,
      apiRequest: 'SENT',
      apiStatus: 'PENDING...',
      dbRecord: 'PENDING...',
      uiState: 'PROCESSING...',
    }));

    await scanStudentQR(qrCode);

    const result = useStore.getState().lastScanResult;
    if (result?.success) {
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 2000);
      setDebugInfo(prev => ({
        ...prev,
        apiStatus: '201 CREATED',
        dbRecord: 'CREATED',
        uiState: 'UPDATED',
      }));
    } else {
      setDebugInfo(prev => ({
        ...prev,
        apiStatus: 'FAILED',
        dbRecord: 'NOT CREATED',
        uiState: 'ERROR',
      }));
    }
  }, [scanStudentQR, students]);

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
          <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-electric-400" />
            QR Student Attendance
          </h1>
          <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Scan student QR codes to record bus boarding and drop attendance in real time.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] dark:text-gray-400 text-surface-500 dark:bg-navy-700/50 bg-surface-100 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3 h-3" />
            {today}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] dark:text-gray-400 text-surface-500 dark:bg-navy-700/50 bg-surface-100 px-3 py-1.5 rounded-lg">
            <Bus className="w-3 h-3" />
            {selectedAttendanceVehicle}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] dark:text-gray-400 text-surface-500 dark:bg-navy-700/50 bg-surface-100 px-3 py-1.5 rounded-lg">
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
            <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Select Vehicle</label>
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
            <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Select Route</label>
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
            <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Trip Stage</label>
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
            <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Session</label>
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
        <div className={`glass-card p-3 border-l-4 ${
          lastScanResult.success ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-red-500 bg-red-500/5'
        } ${scanSuccess ? 'scan-success-pulse' : ''}`}>
          <div className="flex items-center gap-2">
            {lastScanResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <p className={`text-xs font-bold ${lastScanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastScanResult.message}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scanner & Demo */}
        <div className="space-y-4">
          {/* QR Camera Scanner */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-electric-400" />
              QR Camera Scanner
            </h3>
            <QRScanner
              onScan={handleScan}
              isActive={!!attendanceSession?.isActive}
              onStatusChange={(status) => setDebugInfo(prev => ({ ...prev, camera: status, scanner: status === 'ACTIVE' ? 'RUNNING' : 'IDLE' }))}
            />
          </div>

          {/* Demo Scanner */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              Demo QR Scanner
            </h3>
            <DemoQRScanner onScan={handleScan} isActive={!!attendanceSession?.isActive} />
          </div>

          {/* Debug Panel */}
          <div className="glass-card p-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-full flex items-center justify-between text-xs font-bold dark:text-white text-surface-900"
            >
              <span className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-400" />
                QR Scanner Debug
              </span>
              <span className="text-[10px] dark:text-gray-400 text-surface-500">{showDebug ? 'HIDE' : 'SHOW'}</span>
            </button>
            {showDebug && (
              <div className="mt-3 space-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Camera:</span>
                  <span className={debugInfo.camera === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>{debugInfo.camera}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Scanner:</span>
                  <span className={debugInfo.scanner === 'RUNNING' ? 'text-emerald-400' : 'text-amber-400'}>{debugInfo.scanner}</span>
                </div>
                <div className="border-t dark:border-white/5 border-surface-200 my-1" />
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">QR Detected:</span>
                  <span className={debugInfo.qrDetected ? 'text-emerald-400' : 'text-gray-500'}>{debugInfo.qrDetected ? 'YES' : 'NO'}</span>
                </div>
                {debugInfo.rawValue && (
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-surface-500">Raw Value:</span>
                    <span className="text-electric-400 truncate max-w-[180px]">{debugInfo.rawValue}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Parsed Student ID:</span>
                  <span className="text-white font-bold">{debugInfo.parsedStudentId || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Student Found:</span>
                  <span className={debugInfo.studentFound ? 'text-emerald-400' : 'text-red-400'}>{debugInfo.studentFound ? 'YES' : 'NO'}</span>
                </div>
                <div className="border-t dark:border-white/5 border-surface-200 my-1" />
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">API Request:</span>
                  <span className="text-white">{debugInfo.apiRequest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">API Status:</span>
                  <span className={debugInfo.apiStatus.includes('201') ? 'text-emerald-400' : debugInfo.apiStatus === 'FAILED' ? 'text-red-400' : 'text-amber-400'}>{debugInfo.apiStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Database:</span>
                  <span className={debugInfo.dbRecord === 'CREATED' ? 'text-emerald-400' : 'text-gray-500'}>{debugInfo.dbRecord}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">UI State:</span>
                  <span className={debugInfo.uiState === 'UPDATED' ? 'text-emerald-400' : 'text-gray-500'}>{debugInfo.uiState}</span>
                </div>
                <div className="border-t dark:border-white/5 border-surface-200 my-1" />
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Students in Store:</span>
                  <span className="text-white">{students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-surface-500">Session Active:</span>
                  <span className={attendanceSession?.isActive ? 'text-emerald-400' : 'text-red-400'}>{attendanceSession?.isActive ? 'YES' : 'NO'}</span>
                </div>
                <button
                  onClick={() => {
                    setDebugInfo({
                      camera: 'IDLE', scanner: 'IDLE', qrDetected: false, rawValue: '',
                      parsedStudentId: '', studentFound: false, apiRequest: 'NOT SENT',
                      apiStatus: '--', dbRecord: '--', uiState: 'WAITING',
                    });
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 text-[10px] font-bold flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Debug
                </button>
              </div>
            )}
          </div>

          {/* Bus Occupancy */}
          <AttendanceSummary vehicleId={selectedAttendanceVehicle} />
        </div>

        {/* Right Column - Attendance List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-400 text-surface-500" />
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
                      : 'dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500 dark:hover:bg-navy-600/50 hover:bg-surface-200'
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
                  <tr className="border-b dark:border-white/5 border-surface-200">
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Student</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">ID</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Class</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Boarding Time</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Drop Time</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className={`border-b dark:border-white/5 border-surface-200 dark:hover:bg-white/5 hover:bg-surface-50 transition-all ${
                      lastScanResult?.student?.id === s.id ? 'bg-electric-500/10' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.photo ? (
                            <img src={s.photo} alt={s.fullName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-electric-600/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-electric-400">{s.fullName[0]}</span>
                            </div>
                          )}
                          <p className="text-xs font-bold dark:text-white text-surface-900">{s.fullName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] dark:text-gray-400 text-surface-500">{s.studentId}</td>
                      <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{s.class}-{s.section}</td>
                      <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{s.lastBoardedAt || '--'}</td>
                      <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{s.lastDroppedAt || '--'}</td>
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
                        <p className="text-xs dark:text-gray-400 text-surface-500">No students found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Attendance Events */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-400" />
              Recent Attendance Events
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {attendanceEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg dark:bg-navy-700/30 bg-surface-50">
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
                    <p className="text-[11px] dark:text-white text-surface-900 truncate">{event.message}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">{event.time} — {event.vehicleId}</p>
                  </div>
                </div>
              ))}
              {attendanceEvents.length === 0 && (
                <p className="text-xs dark:text-gray-400 text-surface-500 text-center py-4">No attendance events yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
