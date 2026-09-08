import { useStore } from '../../store/useStore';
import { Bus, Route, Users, Navigation, Eye, AlertTriangle, LogOut, MapPin, Clock, Shield } from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser, drivers, vehicles, routes, students, notifications, logout, setCurrentPage } = useStore();
  const driverId = currentUser?.driverId || 'DRV-07';
  const vehicleId = currentUser?.assignedVehicleId || 'BUS-107';
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const route = routes.find(r => r.vehicleId === vehicleId);
  const assignedStudents = students.filter(s => s.assignedBus === vehicleId);
  const driverNotifs = notifications.filter(n => n.driverId === driverId);

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold dark:text-white text-surface-900">SMARTBUS</h1>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Driver Portal</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="glass-card p-5">
          <p className="text-xs dark:text-gray-400 text-surface-500">WELCOME</p>
          <h2 className="text-lg font-black dark:text-white text-surface-900">{driver?.fullName || currentUser?.name || 'Driver'}</h2>
          <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-0.5">{vehicleId} - {route?.name || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
                <Bus className="w-4 h-4 text-electric-400" />
              </div>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Assigned Vehicle</p>
            </div>
            <p className="text-sm font-bold dark:text-white text-surface-900">{vehicleId}</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">{vehicle?.plateNumber || 'N/A'}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Route className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Today's Route</p>
            </div>
            <p className="text-sm font-bold dark:text-white text-surface-900">{route?.name || 'N/A'}</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">{route?.distance || 'N/A'}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Students</p>
            </div>
            <p className="text-sm font-bold dark:text-white text-surface-900">{assignedStudents.length}</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">Assigned</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Safety Score</p>
            </div>
            <p className="text-sm font-bold dark:text-white text-surface-900">{driver?.safetyScore || 91}/100</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">Good</p>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Eye, label: 'Driver\nMonitoring', page: 'driver-monitoring', color: 'bg-electric-500/20 text-electric-400' },
              { icon: MapPin, label: 'My Route', page: 'driver-route', color: 'bg-emerald-500/20 text-emerald-400' },
              { icon: AlertTriangle, label: 'SOS\nEmergency', page: 'sos', color: 'bg-red-500/20 text-red-400' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.page} onClick={() => setCurrentPage(item.page)} className="glass-card p-3 text-center hover:scale-105 transition-transform">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold dark:text-white text-surface-900 whitespace-pre-line">{item.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {vehicle && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Vehicle Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Status</p>
                <p className={`text-xs font-bold ${
                  vehicle.status === 'moving' ? 'text-emerald-400' :
                  vehicle.status === 'stopped' ? 'text-amber-400' : 'text-gray-400'
                }`}>{vehicle.status.toUpperCase()}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                <p className="text-xs font-bold dark:text-white text-surface-900">{vehicle.speed} km/h</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Students On Board</p>
                <p className="text-xs font-bold dark:text-white text-surface-900">{vehicle.currentStudents}/{vehicle.capacity}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Last Update</p>
                <p className="text-xs font-bold dark:text-white text-surface-900">{vehicle.lastUpdate || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {driverNotifs.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Notifications</h3>
            <div className="space-y-2">
              {driverNotifs.slice(0, 3).map(n => (
                <div key={n.id} className="p-2.5 rounded-xl dark:bg-navy-700/30 bg-surface-50">
                  <p className="text-[10px] font-medium dark:text-white text-surface-900">{n.title}</p>
                  <p className="text-[9px] dark:text-gray-400 text-surface-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
