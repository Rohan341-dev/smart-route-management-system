import { useStore } from '../store/useStore';
import {
  LayoutDashboard, MapPin, Truck, Users, Bus, Route,
  Monitor, AlertTriangle, Shield, Bell, BarChart3, Settings
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'live-fleet', label: 'Fleet', icon: MapPin },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'driver-monitoring', label: 'Monitor', icon: Monitor },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'sos', label: 'SOS', icon: Shield },
  { id: 'notifications', label: 'Notify', icon: Bell },
  { id: 'settings', label: 'More', icon: Settings },
];

export default function MobileNav() {
  const { currentPage, setCurrentPage, driverAlerts, sosAlerts, notifications } = useStore();
  const activeAlerts = driverAlerts.filter(a => !a.acknowledged).length;
  const activeSOS = sosAlerts.filter(s => s.status === 'active' || s.status === 'escalating').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const getBadge = (id: string) => {
    if (id === 'alerts' && activeAlerts > 0) return activeAlerts;
    if (id === 'sos' && activeSOS > 0) return activeSOS;
    if (id === 'notifications' && unreadNotifs > 0) return unreadNotifs;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-md border-t border-white/5 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const badge = getBadge(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all min-w-0 flex-1 ${
                isActive ? 'text-electric-400' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-electric-400' : ''}`} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] mt-0.5 truncate ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
