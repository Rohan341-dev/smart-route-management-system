import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Route, MapPin, Clock, Users, ChevronRight, Navigation } from 'lucide-react';

export default function Routes() {
  const { routes, vehicles, drivers, students } = useStore();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const detail = routes.find(r => r.id === selectedRoute);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[status] || colors.scheduled;
  };

  if (detail) {
    const vehicle = vehicles.find(v => v.id === detail.vehicleId);
    const driver = drivers.find(d => d.id === detail.driverId);
    const routeStudents = students.filter(s => s.route === detail.id);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedRoute(null)} className="text-electric-400 text-sm hover:text-electric-300">← Back to Routes</button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{detail.name}</h2>
                <p className="text-sm text-gray-400">{detail.id}</p>
              </div>
              <span className={`status-badge border ${getStatusBadge(detail.status)}`}>{detail.status.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-navy-700/30 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400">Distance</p>
                <p className="text-lg font-bold text-white">{detail.distance}</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400">Est. Time</p>
                <p className="text-lg font-bold text-white">{detail.estimatedTime}</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400">Students</p>
                <p className="text-lg font-bold text-white">{detail.totalStudents}</p>
              </div>
            </div>

            {/* Route Timeline */}
            <div className="space-y-0">
              {detail.stops.map((stop, index) => (
                <div key={stop.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stop.type === 'school' ? 'bg-electric-600' :
                      index < detail.stops.length - 1 ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      {stop.type === 'school' ? <Route className="w-5 h-5 text-white" /> :
                       index < detail.stops.length - 1 ? <MapPin className="w-5 h-5 text-white" /> :
                       <Clock className="w-5 h-5 text-white" />}
                    </div>
                    {index < detail.stops.length - 1 && <div className="w-0.5 h-12 bg-white/10 my-1"></div>}
                  </div>
                  <div className="pb-6 flex-1">
                    <p className="text-sm font-bold text-white">{stop.name}</p>
                    <p className="text-xs text-gray-400">{stop.time} — {stop.studentsCount} students — {stop.type.toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500">{stop.lat.toFixed(4)}°N, {stop.lng.toFixed(4)}°E</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Assignment</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Vehicle</span><span className="text-white">{detail.vehicleId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Driver</span><span className="text-white">{driver?.fullName || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Start Time</span><span className="text-white">{detail.startTime || 'Not started'}</span></div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Students on Route ({routeStudents.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {routeStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-navy-700/30">
                    <div>
                      <p className="text-xs font-bold text-white">{s.fullName}</p>
                      <p className="text-[10px] text-gray-400">{s.pickupStop}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      s.status === 'on_bus' ? 'bg-emerald-500/20 text-emerald-400' :
                      s.status === 'dropped' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{s.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {routes.map((r) => {
          const vehicle = vehicles.find(v => v.id === r.vehicleId);
          const driver = drivers.find(d => d.id === r.driverId);
          return (
            <div key={r.id} onClick={() => setSelectedRoute(r.id)} className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-electric-400 transition-colors">{r.name}</h3>
                  <p className="text-[10px] text-gray-400">{r.id}</p>
                </div>
                <span className={`status-badge border text-[10px] ${getStatusBadge(r.status)}`}>{r.status}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle</span>
                  <span className="text-white">{r.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver</span>
                  <span className="text-white">{driver?.fullName || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stops</span>
                  <span className="text-white">{r.stops.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Students</span>
                  <span className="text-white">{r.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Distance</span>
                  <span className="text-white">{r.distance}</span>
                </div>
              </div>
              {/* Mini route preview */}
              <div className="flex items-center gap-1 mt-3">
                {r.stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${stop.type === 'school' ? 'bg-electric-500' : 'bg-emerald-500'}`}></div>
                    {i < r.stops.length - 1 && <div className="w-4 h-0.5 bg-white/10"></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
