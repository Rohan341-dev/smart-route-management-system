import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, AlertTriangle, CheckCircle, Eye, Radio, User, Truck, Bus, Shield, Filter } from 'lucide-react';

export default function Notifications() {
  const { notifications, markNotificationRead } = useStore();
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = notifications.filter(n => {
    const matchType = filterType === 'all' || n.type === filterType;
    const matchSeverity = filterSeverity === 'all' || n.severity === filterSeverity;
    return matchType && matchSeverity;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'driver': return <User className="w-4 h-4" />;
      case 'vehicle': return <Truck className="w-4 h-4" />;
      case 'student': return <User className="w-4 h-4" />;
      case 'route': return <Bus className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-electric-500/20 text-electric-400 border-electric-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{notifications.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-red-400">{unreadCount}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Critical</p>
          <p className="text-2xl font-bold text-orange-400">{notifications.filter(n => n.severity === 'critical').length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Today</p>
          <p className="text-2xl font-bold text-electric-400">{notifications.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto">
          <option value="all">All Types</option>
          <option value="emergency">Emergency</option>
          <option value="driver">Driver</option>
          <option value="vehicle">Vehicle</option>
          <option value="student">Student</option>
          <option value="route">Route</option>
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-field w-auto">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={`glass-card p-4 cursor-pointer hover:bg-white/5 transition-all ${
              !n.read ? 'border-l-4 border-l-electric-500' : 'opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getSeverityColor(n.severity)}`}>
                {getTypeIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{n.title}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-700/50 text-gray-400 capitalize">{n.type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getSeverityColor(n.severity)}`}>{n.severity}</span>
                  {n.vehicleId && <span className="text-[10px] text-gray-400">{n.vehicleId}</span>}
                  {!n.read && <span className="w-2 h-2 bg-electric-500 rounded-full"></span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
