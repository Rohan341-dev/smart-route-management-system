import { useStore } from '../store/useStore';
import { Bell, Search, User, Wifi, WifiOff, Eye, Radio, Activity } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { currentPage, notifications, systemServices, demoModeActive, toggleDemoMode, sosAlerts } = useStore();
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
  };

  return (
    <header className={`h-16 bg-navy-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-6 ${activeSOS ? 'bg-red-900/30' : ''}`}>
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{pageTitle[currentPage] || 'Dashboard'}</h2>
          <p className="text-xs text-gray-400">Safe Drives. Smart Routes. Secure Futures.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {demoModeActive && (
          <span className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            DEMO MODE
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowServices(!showServices)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-700/50 hover:bg-navy-600/50 text-gray-300 text-xs transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${systemServices.gps ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
            <span className="hidden md:inline">Systems</span>
          </button>
          {showServices && (
            <div className="absolute right-0 top-full mt-2 w-64 glass-card p-4 space-y-3 z-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">GPS Service</span>
                <span className={`flex items-center gap-1 ${systemServices.gps ? 'text-emerald-400' : 'text-red-400'}`}>
                  {systemServices.gps ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {systemServices.gps ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">AI Monitoring</span>
                <span className={`flex items-center gap-1 ${systemServices.ai ? 'text-emerald-400' : 'text-red-400'}`}>
                  <Eye className="w-3 h-3" />
                  {systemServices.ai ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Notifications</span>
                <span className={`flex items-center gap-1 ${systemServices.notifications ? 'text-emerald-400' : 'text-red-400'}`}>
                  <Radio className="w-3 h-3" />
                  {systemServices.notifications ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleDemoMode}
          className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${demoModeActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-navy-700/50 hover:bg-navy-600/50 text-gray-300'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          {demoModeActive ? 'Demo ON' : 'Demo OFF'}
        </button>

        <div className="relative">
          <button className="relative p-2 rounded-xl bg-navy-700/50 hover:bg-navy-600/50 text-gray-300 transition-all">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-white">Admin</p>
            <p className="text-[10px] text-gray-400">School Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
