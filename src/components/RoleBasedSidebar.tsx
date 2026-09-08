import { useStore } from '../store/useStore';
import { LayoutDashboard, MapPin, Truck, Users, GraduationCap, Route, Navigation, Eye, Bell, AlertTriangle, Shield, BarChart3, Settings, ChevronLeft, ChevronRight, Bus, Radio, Map, QrCode, Home, User, ClipboardList } from 'lucide-react';
import type { UserRole } from '../data/types';

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-fleet', label: 'Live Fleet', icon: MapPin },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'trips', label: 'Trips', icon: Bus },
  { id: 'attendance', label: 'QR Attendance', icon: QrCode },
  { id: 'user-management', label: 'User Management', icon: Users },
  { id: 'bus-management', label: 'Bus Management', icon: Bus },
  { id: 'bus-assignment', label: 'Bus Assignment', icon: ClipboardList },
  { id: 'driver-monitoring', label: 'AI Monitoring', icon: Eye },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'sos', label: 'SOS Emergency', icon: AlertTriangle },
  { id: 'notifications', label: 'Notifications', icon: Radio },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const parentNavItems = [
  { id: 'parent-home', label: 'Home', icon: Home },
  { id: 'parent-track', label: 'Track Bus', icon: MapPin },
  { id: 'parent-children', label: 'My Children', icon: Users },
  { id: 'parent-attendance', label: 'Attendance', icon: QrCode },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const driverNavItems = [
  { id: 'driver-home', label: 'Dashboard', icon: Home },
  { id: 'driver-route', label: 'My Route', icon: Route },
  { id: 'attendance', label: 'QR Attendance', icon: QrCode },
  { id: 'driver-monitoring', label: 'AI Monitoring', icon: Eye },
  { id: 'sos', label: 'Emergency', icon: AlertTriangle },
  { id: 'driver-profile', label: 'My Profile', icon: User },
];

function getNavItems(role: UserRole) {
  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'school_staff':
    case 'teacher':
      return adminNavItems;
    case 'parent': return parentNavItems;
    case 'driver': return driverNavItems;
    default: return adminNavItems;
  }
}

export default function RoleBasedSidebar() {
  const { sidebarOpen, setSidebarOpen, currentPage, setCurrentPage, currentUser, driverAlerts, sosAlerts, notifications } = useStore();
  const role = currentUser?.role || 'admin';
  const navItems = getNavItems(role);
  const unreadAlerts = driverAlerts.filter(a => !a.acknowledged).length;
  const activeSOS = sosAlerts.filter(s => s.status === 'active' || s.status === 'escalating').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <aside className={`fixed left-0 top-0 h-full ${sidebarOpen ? 'w-64' : 'w-20'} dark:bg-navy-800 bg-white dark:border-r dark:border-white/5 border-r border-surface-200 flex flex-col z-40 transition-all duration-300`}>
      <div className="p-4 flex items-center gap-3 dark:border-b dark:border-white/5 border-b border-surface-200">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${
          role === 'admin' ? 'from-electric-500 to-electric-700' :
          role === 'parent' ? 'from-emerald-500 to-emerald-700' :
          'from-amber-500 to-orange-600'
        }`}>
          {role === 'admin' ? <Shield className="w-6 h-6 text-white" /> :
           role === 'parent' ? <Users className="w-6 h-6 text-white" /> :
           <Bus className="w-6 h-6 text-white" />}
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold dark:text-white text-surface-900 tracking-tight">SMARTBUS</h1>
            <p className="text-[10px] dark:text-gray-400 text-surface-500 capitalize">{role} Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          let badge = 0;
          if (item.id === 'alerts') badge = unreadAlerts;
          if (item.id === 'sos') badge = activeSOS;
          if (item.id === 'notifications') badge = unreadNotifs;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-link w-full ${isActive ? 'active' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${item.id === 'sos' && activeSOS > 0 ? 'text-red-400 sos-pulse' : ''}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${item.id === 'sos' && activeSOS > 0 ? 'text-red-500' : ''}`} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && badge > 0 && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${item.id === 'sos' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t dark:border-white/5 border-surface-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:hover:bg-navy-600/50 hover:bg-surface-200 dark:text-gray-400 text-surface-500 dark:hover:text-white hover:text-surface-900 transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
