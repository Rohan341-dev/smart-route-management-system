import { useStore } from '../../store/useStore';
import { Route, ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';

export default function MyRoute() {
  const { currentUser, routes, vehicles, setCurrentPage } = useStore();
  const vehicleId = currentUser?.assignedVehicleId || 'BUS-107';
  const route = routes.find(r => r.vehicleId === vehicleId);
  const vehicle = vehicles.find(v => v.id === vehicleId);

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('driver-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <Route className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">My Route</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {route ? (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold dark:text-white text-surface-900">{route.name}</p>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">{route.distance} - {route.estimatedTime}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                route.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-400' :
                route.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {route.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              {route.stops.map((stop, i) => (
                <div key={stop.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-electric-500 text-white' :
                      i === route.stops.length - 1 ? 'bg-red-500 text-white' :
                      'dark:bg-navy-600 bg-surface-200 dark:text-gray-400 text-surface-500'
                    }`}>{i + 1}</div>
                    {i < route.stops.length - 1 && <div className="w-0.5 h-8 dark:bg-navy-600 bg-surface-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold dark:text-white text-surface-900">{stop.name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        stop.type === 'school' ? 'bg-blue-500/20 text-blue-400' :
                        stop.type === 'pickup' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{stop.type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 dark:text-gray-500 text-surface-400" />
                        <p className="text-[10px] dark:text-gray-400 text-surface-500">{stop.time}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 dark:text-gray-500 text-surface-400" />
                        <p className="text-[10px] dark:text-gray-400 text-surface-500">{stop.studentsCount} students</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <Route className="w-10 h-10 dark:text-gray-500 text-surface-400 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-400 text-surface-500">No route assigned</p>
          </div>
        )}

        {vehicle && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-2">Current GPS</h3>
            <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-electric-400" />
                <p className="text-xs font-bold dark:text-white text-surface-900">
                  {vehicle.currentLat.toFixed(4)}° N, {vehicle.currentLng.toFixed(4)}° E
                </p>
              </div>
              <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-1">Speed: {vehicle.speed} km/h</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
