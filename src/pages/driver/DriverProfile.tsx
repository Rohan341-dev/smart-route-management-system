import { useStore } from '../../store/useStore';
import { User, ArrowLeft, Shield, Phone, Clock, Award, LogOut } from 'lucide-react';

export default function DriverProfile() {
  const { currentUser, drivers, vehicles, logout, setCurrentPage } = useStore();
  const driverId = currentUser?.driverId || 'DRV-07';
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === currentUser?.assignedVehicleId);

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('driver-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <User className="w-5 h-5 text-electric-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">My Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="glass-card p-5 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-white">
              {driver?.fullName?.split(' ').map(n => n[0]).join('') || 'D'}
            </span>
          </div>
          <h2 className="text-lg font-bold dark:text-white text-surface-900">{driver?.fullName || currentUser?.name}</h2>
          <p className="text-xs dark:text-gray-400 text-surface-500">{driverId}</p>
          <p className="text-[10px] dark:text-gray-500 text-surface-400 mt-1">{driver?.licenseNumber || 'N/A'}</p>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Personal Information</h3>
          <div className="space-y-2">
            {[
              { icon: Phone, label: 'Phone', value: driver?.phone || 'N/A' },
              { icon: Shield, label: 'License Expiry', value: driver?.licenseExpiry || 'N/A' },
              { icon: Clock, label: 'Driving Hours', value: `${driver?.drivingHours || 0}h today` },
              { icon: Award, label: 'Assigned Vehicle', value: `${vehicle?.id || 'N/A'} - ${vehicle?.plateNumber || ''}` },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 dark:bg-navy-700/30 bg-surface-50 rounded-xl">
                  <Icon className="w-4 h-4 dark:text-gray-400 text-surface-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{item.label}</p>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Safety Statistics</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Safety Score', value: `${driver?.safetyScore || 91}/100`, color: 'text-emerald-400' },
              { label: 'Drowsiness Alerts', value: driver?.drowsinessAlerts || 0, color: 'text-amber-400' },
              { label: 'Overspeed Alerts', value: driver?.overspeedAlerts || 0, color: 'text-red-400' },
              { label: 'SOS Events', value: driver?.sosEvents || 0, color: 'text-red-500' },
            ].map(stat => (
              <div key={stat.label} className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </main>
    </div>
  );
}
