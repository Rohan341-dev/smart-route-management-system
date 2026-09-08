import { useStore } from '../store/useStore';
import {
  LayoutDashboard, MapPin, Users, Bus, Route,
  AlertTriangle, Shield, Bell, Settings, QrCode, Home, Eye, User
} from 'lucide-react';

const adminNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'live-fleet', label: 'Fleet', icon: MapPin },
  { id: 'attendance', label: 'QR Scan', icon: QrCode },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'sos', label: 'SOS', icon: Shield },
  { id: 'notifications', label: 'Notify', icon: Bell },
  { id: 'settings', label: 'More', icon: Settings },
];

const parentNavItems = [
  { id: 'parent-home', label: 'Home', icon: Home },
  { id: 'parent-track', label: 'Track', icon: MapPin },
  { id: 'parent-children', label: 'Children', icon: Users },
  { id: 'parent-attendance', label: 'Attendance', icon: QrCode },
  { id: 'notifications', label: 'Notify', icon: Bell },
];

const driverNavItems = [
  { id: 'driver-home', label: 'Home', icon: Home },
  { id: 'driver-route', label: 'Route', icon: Route },
  { id: 'driver-monitoring', label: 'Camera', icon: Eye },
  { id: 'sos', label: 'SOS', icon: Shield },
  { id: 'driver-profile', label: 'Profile', icon: User },
];

function getNavItems(role: string) {
  switch (role) {
    case 'admin': return adminNavItems;
    case 'parent': return parentNavItems;
    case 'driver': return driverNavItems;
    default: return adminNavItems;
  }
}

export default function MobileNav() {
  const { currentPage, setCurrentPage, driverAlerts, sosAlerts, notifications, currentUser } = useStore();
  const role = currentUser?.role || 'admin';
  const navItems = getNavItems(role);
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 dark:bg-navy-900/95 bg-white/95 backdrop-blur-md dark:border-t dark:border-white/5 border-t border-surface-200 safe-area-bottom md:hidden">
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
                isActive ? 'text-electric-400' : 'dark:text-gray-500 text-surface-400'
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
