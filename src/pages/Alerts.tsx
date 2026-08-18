import { useStore } from '../store/useStore';
import { AlertTriangle, Eye, Zap, Navigation, Clock, CheckCircle, Filter } from 'lucide-react';
import { useState } from 'react';

export default function Alerts() {
  const { driverAlerts, acknowledgeAlert, drivers, vehicles } = useStore();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = driverAlerts.filter(a => {
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchType = filterType === 'all' || a.type === filterType;
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
          <p className="text-xs text-gray-400">Total Alerts</p>
          <p className="text-2xl font-bold text-white">{driverAlerts.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-red-400">{unacknowledged}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Critical</p>
          <p className="text-2xl font-bold text-orange-400">{driverAlerts.filter(a => a.severity === 'critical').length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Drowsiness</p>
          <p className="text-2xl font-bold text-amber-400">{driverAlerts.filter(a => a.type === 'drowsiness').length}</p>
        </div>
      </div>

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
                      <p className="text-sm font-bold text-white">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400">{alert.vehicleId} — {driver?.fullName || alert.driverId}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                        <span className={`status-badge border text-[10px] ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{alert.type.replace('_', ' ')}</span>
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
