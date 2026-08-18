import { useStore } from '../store/useStore';
import { LayoutDashboard, MapPin, Truck, Users, GraduationCap, Route, Navigation, Eye, Bell, AlertTriangle, Shield, BarChart3, Settings, ChevronLeft, ChevronRight, Bus, Radio, Map } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-fleet', label: 'Live Fleet', icon: MapPin },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'trips', label: 'Trips', icon: Bus },
  { id: 'driver-monitoring', label: 'AI Monitoring', icon: Eye },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'sos', label: 'SOS Emergency', icon: AlertTriangle },
  { id: 'notifications', label: 'Notifications', icon: Radio },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, currentPage, setCurrentPage, driverAlerts, sosAlerts, notifications } = useStore();
  const unreadAlerts = driverAlerts.filter(a => !a.acknowledged).length;
  const activeSOS = sosAlerts.filter(s => s.status === 'active' || s.status === 'escalating').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <aside className={`fixed left-0 top-0 h-full ${sidebarOpen ? 'w-64' : 'w-20'} bg-navy-800 border-r border-white/5 flex flex-col z-40 transition-all duration-300`}>
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-tight">SMART ROUTE</h1>
            <p className="text-[10px] text-gray-400">AI Driver Monitoring + SOS</p>
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

      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-navy-700/50 hover:bg-navy-600/50 text-gray-400 hover:text-white transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
