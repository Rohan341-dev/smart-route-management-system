import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Truck, Search, Filter, Eye, Edit, Trash2, Plus, ChevronRight, MapPin, Clock, Wrench } from 'lucide-react';

export default function Vehicles() {
  const { vehicles, drivers, setSelectedVehicle, setCurrentPage } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

  const filtered = vehicles.filter(v => {
    const matchSearch = v.id.toLowerCase().includes(search.toLowerCase()) || v.registrationNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const detail = vehicles.find(v => v.id === selectedDetail);
  const detailDriver = detail ? drivers.find(d => d.id === detail.assignedDriver) : null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      moving: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      stopped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      delayed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      offline: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
      emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
      route_deviation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[status] || colors.idle;
  };

  if (detail) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedDetail(null)} className="text-electric-400 text-sm hover:text-electric-300 flex items-center gap-1">
          ← Back to Vehicles
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{detail.id}</h2>
                <p className="text-sm text-gray-400">{detail.registrationNumber}</p>
              </div>
              <span className={`status-badge border ${getStatusBadge(detail.status)}`}>{detail.status.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs text-gray-400">Type</p>
                <p className="text-sm font-bold text-white">{detail.type}</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs text-gray-400">Capacity</p>
                <p className="text-sm font-bold text-white">{detail.capacity} seats</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs text-gray-400">Speed</p>
                <p className="text-sm font-bold text-white">{detail.speed} km/h</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs text-gray-400">Students</p>
                <p className="text-sm font-bold text-white">{detail.currentStudents}/{detail.capacity}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Assigned Driver</h3>
              {detailDriver && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-electric-600/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-electric-400">{detailDriver.fullName[0]}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{detailDriver.fullName}</p>
                    <p className="text-[10px] text-gray-400">{detailDriver.id} — Score: {detailDriver.safetyScore}/100</p>
                  </div>
                </div>
              )}
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">System IDs</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">GPS Device</span><span className="text-white">{detail.gpsDeviceId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Dash Camera</span><span className="text-white">{detail.dashCameraId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Route</span><span className="text-white">{detail.assignedRoute}</span></div>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Maintenance</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Last Service</span><span className="text-white">{detail.maintenanceDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Insurance</span><span className="text-white">{detail.insuranceExpiry}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Fitness</span><span className="text-white">{detail.fitnessExpiry}</span></div>
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
            <input type="text" placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="all">All Status</option>
            <option value="moving">Moving</option>
            <option value="stopped">Stopped</option>
            <option value="idle">Idle</option>
            <option value="delayed">Delayed</option>
            <option value="offline">Offline</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((v) => {
          const driver = drivers.find(d => d.id === v.assignedDriver);
          return (
            <div key={v.id} onClick={() => setSelectedDetail(v.id)} className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-electric-400 transition-colors">{v.id}</h3>
                  <p className="text-[10px] text-gray-400">{v.registrationNumber}</p>
                </div>
                <span className={`status-badge border text-[10px] ${getStatusBadge(v.status)}`}>{v.status.replace('_', ' ')}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver</span>
                  <span className="text-white">{driver?.fullName || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-white">{v.speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Students</span>
                  <span className="text-white">{v.currentStudents}/{v.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Route</span>
                  <span className="text-white">{v.assignedRoute}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-navy-600 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-electric-500 rounded-full" style={{ width: `${(v.currentStudents / v.capacity) * 100}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
