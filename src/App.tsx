import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import RoleBasedSidebar from './components/RoleBasedSidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveFleet from './pages/LiveFleet';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Students from './pages/Students';
import Routes from './pages/Routes';
import DriverMonitoring from './pages/DriverMonitoring';
import Alerts from './pages/Alerts';
import SOSEmergency from './pages/SOSEmergency';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Trips from './pages/Trips';
import Driver from './pages/Driver';
import Attendance from './pages/Attendance';
import DemoPanel from './components/DemoPanel';
import UserManagement from './pages/admin/UserManagement';
import BusManagement from './pages/admin/BusManagement';
import AssignmentScreen from './pages/admin/AssignmentScreen';
import RouteManagement from './pages/admin/RouteManagement';
import ParentDashboard from './pages/parent/ParentDashboard';
import TrackBus from './pages/parent/TrackBus';
import MyChildren from './pages/parent/MyChildren';
import ParentAttendance from './pages/parent/ParentAttendance';
import DriverDashboard from './pages/driver/DriverDashboard';
import MyRoute from './pages/driver/MyRoute';
import DriverProfile from './pages/driver/DriverProfile';

function AdminApp() {
  const { sidebarOpen, currentPage, demoModeActive, simulateBusMovement, sosAlerts } = useStore();
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (demoModeActive) simulateBusMovement();
    }, 3000);
    return () => clearInterval(interval);
  }, [demoModeActive, simulateBusMovement]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'live-fleet': return <LiveFleet />;
      case 'vehicles': return <Vehicles />;
      case 'drivers': return <Drivers />;
      case 'students': return <Students />;
      case 'routes': return <Routes />;
      case 'trips': return <Trips />;
      case 'attendance': return <Attendance />;
      case 'driver-monitoring': return <DriverMonitoring />;
      case 'alerts': return <Alerts />;
      case 'sos': return <SOSEmergency />;
      case 'notifications': return <Notifications />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'user-management': return <UserManagement />;
      case 'bus-management': return <BusManagement />;
      case 'bus-assignment': return <AssignmentScreen />;
      case 'route-management': return <RouteManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200 dark:bg-navy-900 bg-surface-50">
      {activeSOS && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 backdrop-blur-md text-white px-4 py-2 flex items-center justify-between animate-pulse-fast">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <span className="font-bold text-sm">ACTIVE SOS - {activeSOS.vehicleId} - {activeSOS.driverId}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Escalation: {activeSOS.escalationLevel.toUpperCase()} | Timer: {activeSOS.escalationTimer}s
            </span>
          </div>
          <button
            onClick={() => useStore.getState().setCurrentPage('sos')}
            className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100"
          >
            VIEW SOS
          </button>
        </div>
      )}

      <div className="hidden md:block">
        <RoleBasedSidebar />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${
        !isMobile && (sidebarOpen ? 'md:ml-64' : 'md:ml-20')
      } ${activeSOS ? 'mt-12' : ''} transition-all duration-300`}>
        <Header />
        <main className={`flex-1 overflow-y-auto p-4 ${isMobile ? 'pb-20' : 'md:p-6'}`}>
          {renderPage()}
        </main>
      </div>

      {isMobile && <MobileNav />}

      <div className="hidden md:block">
        <DemoPanel />
      </div>
    </div>
  );
}

function PortalApp() {
  const { currentPage, sidebarOpen } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'parent-home': return <ParentDashboard />;
      case 'parent-track': return <TrackBus />;
      case 'parent-children': return <MyChildren />;
      case 'parent-attendance': return <ParentAttendance />;
      case 'driver-home': return <DriverDashboard />;
      case 'driver-route': return <MyRoute />;
      case 'driver-profile': return <DriverProfile />;
      case 'driver-monitoring': return <DriverMonitoring />;
      case 'attendance': return <Attendance />;
      case 'sos': return <SOSEmergency />;
      case 'notifications': return <Notifications />;
      case 'alerts': return <Alerts />;
      default: {
        const role = useStore.getState().currentUser?.role;
        if (role === 'driver') return <DriverDashboard />;
        return <ParentDashboard />;
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200 dark:bg-navy-900 bg-surface-50">
      <div className="hidden md:block">
        <RoleBasedSidebar />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${
        !isMobile && (sidebarOpen ? 'md:ml-64' : 'md:ml-20')
      } transition-all duration-300`}>
        <Header />
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-0' : 'md:p-6'}`}>
          {renderPage()}
        </main>
      </div>

      {isMobile && <MobileNav />}
    </div>
  );
}

function App() {
  const currentUser = useStore(s => s.currentUser);

  useEffect(() => {
    if (window.location.pathname === '/driver') {
      window.history.pushState({}, '', '/driver');
    }
  }, []);

  if (window.location.pathname === '/driver') {
    return <Driver />;
  }

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.role === 'admin') {
    return <AdminApp />;
  }

  return <PortalApp />;
}

export default App;
