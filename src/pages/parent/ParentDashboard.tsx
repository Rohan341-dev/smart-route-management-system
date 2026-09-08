import { useStore } from '../../store/useStore';
import { Bus, MapPin, Clock, Users, Navigation, Shield, LogOut, Home, Route, Eye, AlertTriangle } from 'lucide-react';

export default function ParentDashboard() {
  const { currentUser, students, vehicles, routes, notifications, logout, setCurrentPage } = useStore();
  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));
  const childBusIds = [...new Set(childStudents.map(s => s.assignedBus))];
  const childBuses = vehicles.filter(v => childBusIds.includes(v.id));
  const childRoutes = routes.filter(r => childBusIds.includes(r.vehicleId));
  const childNotifs = notifications.filter(n => childStudents.some(s => s.id === n.studentId));

  const student = childStudents[0];
  const bus = childBuses[0];
  const route = childRoutes[0];

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold dark:text-white text-surface-900">SMARTBUS</h1>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Parent Portal</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="glass-card p-5">
          <p className="text-xs dark:text-gray-400 text-surface-500">GOOD MORNING</p>
          <h2 className="text-lg font-black dark:text-white text-surface-900">Welcome, {currentUser?.name || 'Parent'}!</h2>
        </div>

        {student && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {student.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white text-surface-900">{student.fullName}</p>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Class {student.class} - Section {student.section}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Assigned Bus</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{student.assignedBus}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Route</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{route?.name || 'N/A'}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 col-span-2">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    student.attendanceStatus === 'on_bus' ? 'bg-emerald-400' :
                    student.attendanceStatus === 'dropped' ? 'bg-blue-400' :
                    student.attendanceStatus === 'picked_up' ? 'bg-amber-400' : 'bg-gray-400'
                  }`} />
                  <p className={`text-sm font-bold ${
                    student.attendanceStatus === 'on_bus' ? 'text-emerald-400' :
                    student.attendanceStatus === 'dropped' ? 'text-blue-400' :
                    student.attendanceStatus === 'picked_up' ? 'text-amber-400' : 'dark:text-gray-400 text-surface-500'
                  }`}>
                    {student.attendanceStatus === 'on_bus' ? 'ON BUS' :
                     student.attendanceStatus === 'dropped' ? 'DROPPED SAFELY' :
                     student.attendanceStatus === 'picked_up' ? 'PICKED UP' : 'WAITING'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {bus && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bus className="w-4 h-4 text-electric-400" />
              <h3 className="text-sm font-bold dark:text-white text-surface-900">Live Bus Tracking</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Bus Status</p>
                <p className={`text-sm font-bold ${bus.status === 'moving' ? 'text-emerald-400' : bus.status === 'stopped' ? 'text-amber-400' : 'text-gray-400'}`}>
                  {bus.status.toUpperCase()}
                </p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{bus.speed} km/h</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Driver</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{drivers.find(d => d.id === bus.assignedDriver)?.fullName || 'N/A'}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[9px] dark:text-gray-400 text-surface-500">Students</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{bus.currentStudents}</p>
              </div>
            </div>
          </div>
        )}

        {childNotifs.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-3">Recent Notifications</h3>
            <div className="space-y-2">
              {childNotifs.slice(0, 5).map(n => (
                <div key={n.id} className={`p-3 rounded-xl ${
                  n.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                  n.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                  'dark:bg-navy-700/30 bg-surface-50'
                }`}>
                  <p className="text-xs font-medium dark:text-white text-surface-900">{n.title}</p>
                  <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Bus, label: 'Track Bus', page: 'parent-track', color: 'bg-electric-500/20 text-electric-400' },
            { icon: Users, label: 'My Children', page: 'parent-children', color: 'bg-emerald-500/20 text-emerald-400' },
            { icon: Clock, label: 'Attendance', page: 'parent-attendance', color: 'bg-purple-500/20 text-purple-400' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.page} onClick={() => setCurrentPage(item.page)} className="glass-card p-4 text-center hover:scale-105 transition-transform">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold dark:text-white text-surface-900">{item.label}</p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
