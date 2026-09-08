import { useStore } from '../store/useStore';
import { Bell, Wifi, WifiOff, Eye, Radio, Activity } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function Header() {
  const { currentPage, notifications, systemServices, demoModeActive, toggleDemoMode, sosAlerts, currentUser } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');
  const [showServices, setShowServices] = useState(false);

  const pageTitle: Record<string, string> = {
    'dashboard': 'Dashboard Overview',
    'live-fleet': 'Live Fleet Tracking',
    'vehicles': 'Vehicle Management',
    'drivers': 'Driver Management',
    'students': 'Student Management',
    'routes': 'Route Management',
    'trips': 'Trip Management',
    'driver-monitoring': 'AI Driver Monitoring',
    'alerts': 'Driver Alerts',
    'sos': 'SOS Emergency Center',
    'notifications': 'Notification Center',
    'reports': 'Reports & Analytics',
    'settings': 'System Settings',
    'parent-home': 'Parent Dashboard',
    'parent-track': 'Track Bus',
    'parent-children': 'My Children',
    'parent-attendance': 'Attendance',
    'driver-home': 'Driver Dashboard',
    'driver-route': 'My Route',
    'driver-profile': 'My Profile',
    'attendance': 'QR Attendance',
  };

  return (
    <header className={`h-16 backdrop-blur-md border-b flex items-center justify-between px-3 md:px-6 transition-colors duration-200 dark:bg-navy-800/80 dark:border-white/5 bg-white border-surface-200 relative z-50 ${activeSOS ? 'dark:bg-red-900/30 bg-red-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white text-surface-900">{pageTitle[currentPage] || 'Dashboard'}</h2>
          <p className="text-xs dark:text-gray-400 text-surface-500">
            {currentUser?.role === 'driver' ? `Welcome, ${currentUser.name}` :
             currentUser?.role === 'parent' ? `Welcome, ${currentUser.name}` :
             'Safe Drives. Smart Routes. Secure Futures.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {currentUser?.role === 'admin' && demoModeActive && (
          <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            DEMO MODE
          </span>
        )}

        <ThemeToggle />

        {currentUser?.role === 'admin' && (
          <div className="relative">
            <button
              onClick={() => setShowServices(!showServices)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:hover:bg-navy-600/50 hover:bg-surface-200 dark:text-gray-300 text-surface-600 text-xs transition-all"
            >
              <span className={`w-2 h-2 rounded-full ${systemServices.gps ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
              <span className="hidden md:inline">Systems</span>
            </button>
            {showServices && (
              <div className="absolute right-0 top-full mt-2 w-64 glass-card p-4 space-y-3 z-50">
                <div className="flex items-center justify-between text-xs">
                  <span className="dark:text-gray-400 text-surface-500">GPS Service</span>
                  <span className={`flex items-center gap-1 ${systemServices.gps ? 'text-emerald-400' : 'text-red-400'}`}>
                    {systemServices.gps ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {systemServices.gps ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="dark:text-gray-400 text-surface-500">AI Monitoring</span>
                  <span className={`flex items-center gap-1 ${systemServices.ai ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Eye className="w-3 h-3" />
                    {systemServices.ai ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="dark:text-gray-400 text-surface-500">Notifications</span>
                  <span className={`flex items-center gap-1 ${systemServices.notifications ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Radio className="w-3 h-3" />
                    {systemServices.notifications ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {currentUser?.role === 'admin' && (
          <button
            onClick={toggleDemoMode}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${demoModeActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'dark:bg-navy-700/50 bg-surface-100 dark:hover:bg-navy-600/50 hover:bg-surface-200 dark:text-gray-300 text-surface-600'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            {demoModeActive ? 'Demo ON' : 'Demo OFF'}
          </button>
        )}

        <div className="relative">
          <button className="relative p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:hover:bg-navy-600/50 hover:bg-surface-200 dark:text-gray-300 text-surface-600 transition-all">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
