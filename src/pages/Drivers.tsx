import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Search, Eye, Shield, AlertTriangle, Clock, Phone, ChevronRight } from 'lucide-react';

export default function Drivers() {
  const { drivers, vehicles, setCurrentPage } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

  const filtered = drivers.filter(d => {
    const matchSearch = d.fullName.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const detail = drivers.find(d => d.id === selectedDetail);
  const detailVehicle = detail ? vehicles.find(v => v.id === detail.assignedVehicle) : null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      drowsy: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.inactive;
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-amber-400';
    return 'text-red-400';
  };

  if (detail) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedDetail(null)} className="text-electric-400 text-sm hover:text-electric-300">← Back to Drivers</button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{detail.fullName.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{detail.fullName}</h2>
                  <p className="text-sm text-gray-400">{detail.id} — {detail.licenseNumber}</p>
                  <span className={`status-badge border text-xs mt-1 inline-block ${getStatusBadge(detail.status)}`}>{detail.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-navy-700/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Safety Score</p>
                  <p className={`text-2xl font-bold ${getSafetyColor(detail.safetyScore)}`}>{detail.safetyScore}/100</p>
                </div>
                <div className="bg-navy-700/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Driving Hours</p>
                  <p className="text-2xl font-bold text-white">{detail.drivingHours}h</p>
                </div>
                <div className="bg-navy-700/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Drowsiness Alerts</p>
                  <p className={`text-2xl font-bold ${detail.drowsinessAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{detail.drowsinessAlerts}</p>
                </div>
                <div className="bg-navy-700/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400">SOS Events</p>
                  <p className={`text-2xl font-bold ${detail.sosEvents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{detail.sosEvents}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-bold text-white mb-4">Safety Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Drowsiness Alerts', value: detail.drowsinessAlerts, max: 10, color: 'bg-red-500' },
                  { label: 'Overspeed Alerts', value: detail.overspeedAlerts, max: 10, color: 'bg-amber-500' },
                  { label: 'Harsh Braking', value: detail.harshBraking, max: 10, color: 'bg-orange-500' },
                  { label: 'Route Deviations', value: detail.routeDeviations, max: 10, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${(item.value / item.max) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Contact Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><span className="text-white">{detail.phone}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-red-400" /><span className="text-white">{detail.emergencyContact}</span></div>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Current Assignment</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Vehicle</span><span className="text-white">{detail.assignedVehicle}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Route</span><span className="text-white">{detail.assignedRoute}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">License Exp</span><span className="text-white">{detail.licenseExpiry}</span></div>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">AI Monitoring Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Eye Status</span><span className="text-emerald-400">{detail.eyeStatus}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Attention</span><span className="text-emerald-400">{detail.attention}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="alert">Alert</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d) => (
          <div key={d.id} onClick={() => setSelectedDetail(d.id)} className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{d.fullName.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-electric-400 transition-colors">{d.fullName}</h3>
                  <p className="text-[10px] text-gray-400">{d.id}</p>
                </div>
              </div>
              <span className={`status-badge border text-[10px] ${getStatusBadge(d.status)}`}>{d.status}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Safety Score</span>
                <span className={`font-bold ${getSafetyColor(d.safetyScore)}`}>{d.safetyScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vehicle</span>
                <span className="text-white">{d.assignedVehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Drowsiness</span>
                <span className={`text-white ${d.drowsinessAlerts > 0 ? 'text-red-400' : ''}`}>{d.drowsinessAlerts} alerts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Driving Hours</span>
                <span className="text-white">{d.drivingHours}h</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-navy-600 rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${d.safetyScore >= 90 ? 'bg-emerald-500' : d.safetyScore >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.safetyScore}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
