import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
import DemoPanel from './components/DemoPanel';

function App() {
  const { sidebarOpen, currentPage, demoModeActive, simulateBusMovement, sosAlerts } = useStore();
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  useEffect(() => {
    const interval = setInterval(() => {
      if (demoModeActive) {
        simulateBusMovement();
      }
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
      case 'driver-monitoring': return <DriverMonitoring />;
      case 'alerts': return <Alerts />;
      case 'sos': return <SOSEmergency />;
      case 'notifications': return <Notifications />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
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

      <Sidebar />

      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'ml-64' : 'ml-20'} ${activeSOS ? 'mt-12' : ''} transition-all duration-300`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>

      <DemoPanel />
    </div>
  );
}

export default App;
