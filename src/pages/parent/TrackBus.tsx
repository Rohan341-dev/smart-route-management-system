import { useStore } from '../../store/useStore';
import { Bus, MapPin, Navigation, Clock, ArrowLeft, Wifi, WifiOff } from 'lucide-react';

export default function TrackBus() {
  const { currentUser, students, vehicles, routes, setCurrentPage } = useStore();
  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));
  const childBusIds = [...new Set(childStudents.map(s => s.assignedBus))];
  const childBuses = vehicles.filter(v => childBusIds.includes(v.id));
  const childRoutes = routes.filter(r => childBusIds.includes(r.vehicleId));

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('parent-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <Bus className="w-5 h-5 text-electric-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">Track Bus</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {childBuses.map(bus => {
          const route = childRoutes.find(r => r.vehicleId === bus.id);
          const driver = useStore.getState().drivers.find(d => d.id === bus.assignedDriver);
          return (
            <div key={bus.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    bus.status === 'moving' ? 'bg-emerald-500' : bus.status === 'stopped' ? 'bg-amber-500' : 'bg-gray-500'
                  }`}>
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{bus.id}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{bus.plateNumber}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  bus.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' :
                  bus.status === 'stopped' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {bus.status === 'moving' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {bus.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Route</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{route?.name || 'N/A'}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Driver</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{driver?.fullName || 'N/A'}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.speed} km/h</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Students</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.currentStudents}/{bus.capacity}</p>
                </div>
              </div>

              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Current Location</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-electric-400" />
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.currentLat.toFixed(4)}° N, {bus.currentLng.toFixed(4)}° E</p>
                </div>
              </div>

              {route && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] dark:text-gray-400 text-surface-500 font-medium">Route Stops</p>
                  {route.stops.map((stop, i) => (
                    <div key={stop.id} className="flex items-center gap-2 p-2 rounded-lg dark:bg-navy-700/20 bg-surface-50/50">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-electric-500 text-white' : 'dark:bg-navy-600 bg-surface-200 dark:text-gray-400 text-surface-500'
                      }`}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium dark:text-white text-surface-900">{stop.name}</p>
                        <p className="text-[9px] dark:text-gray-500 text-surface-400">{stop.time}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        stop.type === 'school' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{stop.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {childBuses.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Bus className="w-10 h-10 dark:text-gray-500 text-surface-400 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-400 text-surface-500">No bus assigned to your child yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
