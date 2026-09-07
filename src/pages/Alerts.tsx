import { useStore } from '../store/useStore';
import { AlertTriangle, Eye, Zap, Navigation, Clock, CheckCircle, Filter, UserX } from 'lucide-react';
import { useState } from 'react';

export default function Alerts() {
  const { driverAlerts, acknowledgeAlert, drivers, vehicles, students } = useStore();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const studentsWithWarnings = students.filter(s =>
    s.attendanceStatus === 'on_bus' && s.lastBoardedAt
  );

  const filtered = driverAlerts.filter(a => {
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchType = filterType === 'all' || a.type === a.type;
    return matchSeverity && matchType;
  });

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[severity] || colors.low;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drowsiness': return <Eye className="w-4 h-4" />;
      case 'overspeed': return <Zap className="w-4 h-4" />;
      case 'harsh_braking': return <AlertTriangle className="w-4 h-4" />;
      case 'route_deviation': return <Navigation className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const unacknowledged = driverAlerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Total Alerts</p>
          <p className="text-2xl font-bold dark:text-white text-surface-900">{driverAlerts.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Unread</p>
          <p className="text-2xl font-bold text-red-400">{unacknowledged}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Critical</p>
          <p className="text-2xl font-bold text-orange-400">{driverAlerts.filter(a => a.severity === 'critical').length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Drowsiness</p>
          <p className="text-2xl font-bold text-amber-400">{driverAlerts.filter(a => a.type === 'drowsiness').length}</p>
        </div>
      </div>

      {/* Attendance Safety Warnings */}
      {studentsWithWarnings.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-amber-500 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-400">Student Attendance Warnings</h3>
          </div>
          <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-2">Students currently on bus - verify they reach their destination safely.</p>
          <div className="space-y-1">
            {studentsWithWarnings.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-2 text-[10px]">
                <span className="dark:text-white text-surface-900">{s.fullName}</span>
                <span className="dark:text-gray-400 text-surface-500">on {s.assignedVehicleId}</span>
                <span className="text-amber-400">boarded at {s.lastBoardedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-field w-auto">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto">
          <option value="all">All Types</option>
          <option value="drowsiness">Drowsiness</option>
          <option value="overspeed">Overspeed</option>
          <option value="harsh_braking">Harsh Braking</option>
          <option value="route_deviation">Route Deviation</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => {
          const driver = drivers.find(d => d.id === alert.driverId);
          return (
            <div key={alert.id} className={`glass-card p-4 ${!alert.acknowledged ? 'border-l-4 border-l-red-500' : 'opacity-70'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold dark:text-white text-surface-900">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] dark:text-gray-400 text-surface-500">{alert.vehicleId} — {driver?.fullName || alert.driverId}</span>
                        <span className="text-[10px] dark:text-gray-400 text-surface-500 flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                        <span className={`status-badge border text-[10px] ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                        <span className="text-[10px] dark:text-gray-400 text-surface-500 capitalize">{alert.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button onClick={() => acknowledgeAlert(alert.id)} className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
