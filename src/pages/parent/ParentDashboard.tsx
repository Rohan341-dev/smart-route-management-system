import { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Home, MapPin, Users, Bell, User, Bus, Clock, Navigation,
  LogOut, Shield, ChevronRight, Phone, Route, Eye, AlertTriangle,
  CheckCircle
} from 'lucide-react';

type ParentTab = 'home' | 'track' | 'children' | 'alerts' | 'profile';

export default function ParentDashboard() {
  const { currentUser, students, vehicles, routes, notifications, drivers, logout, setCurrentPage } = useStore();
  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));
  const [activeTab, setActiveTab] = useState<ParentTab>('home');
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const selectedChild = childStudents[selectedChildIndex];
  const childBus = selectedChild ? vehicles.find(v => v.id === selectedChild.assignedBus) : null;
  const childRoute = selectedChild ? routes.find(r => r.vehicleId === selectedChild.assignedBus) : null;
  const childDriver = childBus ? drivers.find(d => d.id === childBus.assignedDriver) : null;
  const childNotifs = selectedChild
    ? notifications.filter(n => n.studentId === selectedChild.id)
    : notifications.filter(n => childStudents.some(s => s.id === n.studentId));

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const tabs: { id: ParentTab; icon: typeof Home; label: string; badge?: number }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'track', icon: MapPin, label: 'Track' },
    { id: 'children', icon: Users, label: 'Children' },
    { id: 'alerts', icon: Bell, label: 'Alerts', badge: childNotifs.filter(n => !n.read).length },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    on_bus: { label: 'ON BUS', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400 animate-pulse' },
    picked_up: { label: 'PICKED UP', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
    dropped: { label: 'DROPPED SAFELY', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
    waiting: { label: 'WAITING', color: 'text-gray-400', bg: 'bg-gray-500/20', dot: 'bg-gray-400' },
    absent: { label: 'ABSENT', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400' },
  };

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50 flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="dark:bg-navy-900/90 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black dark:text-white text-surface-900 tracking-tight">SMARTBUS</h1>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Parent Portal</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Greeting */}
            <div className="glass-card p-5">
              <p className="text-xs dark:text-gray-400 text-surface-500">{greeting}</p>
              <h2 className="text-lg font-black dark:text-white text-surface-900">Welcome, {currentUser?.name || 'Parent'}!</h2>
            </div>

            {/* Child Selector */}
            {childStudents.length > 1 && (
              <div className="glass-card p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-2">SELECT CHILD</p>
                <div className="flex gap-2">
                  {childStudents.map((child, idx) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildIndex(idx)}
                      className={`flex-1 p-2 rounded-xl text-center transition-all ${
                        selectedChildIndex === idx
                          ? 'bg-electric-600 text-white'
                          : 'dark:bg-navy-700/50 bg-surface-200 dark:text-gray-400 text-surface-500'
                      }`}
                    >
                      <p className="text-[10px] font-bold truncate">{child.fullName.split(' ')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Child Status Card */}
            {selectedChild && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedChild.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{selectedChild.fullName}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">Class {selectedChild.class} - Section {selectedChild.section}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Assigned Bus</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{selectedChild.assignedBus}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Route</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childRoute?.name || 'N/A'}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${statusConfig[selectedChild.attendanceStatus]?.dot || 'bg-gray-400'}`} />
                      <p className={`text-sm font-bold ${statusConfig[selectedChild.attendanceStatus]?.color || 'text-gray-400'}`}>
                        {statusConfig[selectedChild.attendanceStatus]?.label || selectedChild.attendanceStatus.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {selectedChild.lastBoardedAt && (
                    <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">Pickup Time</p>
                      <p className="text-sm font-bold dark:text-white text-surface-900">{selectedChild.lastBoardedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Bus Info */}
            {childBus && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold dark:text-white text-surface-900 flex items-center gap-2">
                    <Bus className="w-4 h-4 text-electric-400" />
                    LIVE BUS
                  </h3>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                    childBus.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' :
                    childBus.status === 'stopped' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {childBus.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childBus.speed} km/h</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Students</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childBus.currentStudents}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Driver</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childDriver?.fullName || 'N/A'}</p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Capacity</p>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childBus.currentStudents}/{childBus.capacity}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('track')}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-electric-600 to-electric-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> TRACK LIVE BUS
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: MapPin, label: 'Track Bus', tab: 'parent-track', color: 'bg-electric-500/20 text-electric-400' },
                { icon: Users, label: 'My Children', tab: 'parent-children', color: 'bg-emerald-500/20 text-emerald-400' },
                { icon: Clock, label: 'Attendance', tab: 'parent-attendance', color: 'bg-purple-500/20 text-purple-400' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.tab} onClick={() => setCurrentPage(item.tab)} className="glass-card p-4 text-center hover:scale-105 transition-transform">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold dark:text-white text-surface-900">{item.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Recent Notifications */}
            {childNotifs.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">RECENT UPDATES</h3>
                <div className="space-y-2">
                  {childNotifs.slice(0, 5).map(n => (
                    <div key={n.id} className={`p-3 rounded-xl ${
                      n.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                      n.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'dark:bg-navy-700/30 bg-surface-50'
                    }`}>
                      <p className="text-[10px] font-medium dark:text-white text-surface-900">{n.title}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="p-4 space-y-4">
            {childBus ? (
              <>
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold dark:text-white text-surface-900 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-electric-400" />
                      LIVE TRACKING
                    </h3>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                      childBus.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {childBus.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-4 text-center">
                    <Bus className="w-10 h-10 text-electric-400 mx-auto mb-2" />
                    <p className="text-sm font-bold dark:text-white text-surface-900">{childBus.id}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{childRoute?.name}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 text-center">
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                      <p className="text-sm font-bold dark:text-white text-surface-900">{childBus.speed}</p>
                      <p className="text-[8px] dark:text-gray-400 text-surface-500">km/h</p>
                    </div>
                    <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 text-center">
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">ETA</p>
                      <p className="text-sm font-bold dark:text-white text-surface-900">5</p>
                      <p className="text-[8px] dark:text-gray-400 text-surface-500">min</p>
                    </div>
                    <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 text-center">
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">Next Stop</p>
                      <p className="text-xs font-bold dark:text-white text-surface-900">School</p>
                    </div>
                  </div>
                </div>

                {/* Route Stops */}
                <div className="glass-card p-4">
                  <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">ROUTE STOPS</h3>
                  <div className="space-y-0">
                    {(childRoute?.stops || []).map((stop, index) => {
                      const isLast = index === (childRoute?.stops.length || 0) - 1;
                      return (
                        <div key={stop.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              isLast ? 'bg-electric-500' : 'bg-emerald-500'
                            }`} />
                            {!isLast && <div className="w-0.5 h-6 dark:bg-white/10 bg-surface-200" />}
                          </div>
                          <div className="pb-3 flex-1">
                            <p className="text-xs font-bold dark:text-white text-surface-900">
                              {isSchool(stop) ? '🏫' : `Stop ${stop.order}`} {stop.name}
                            </p>
                            <p className="text-[9px] dark:text-gray-400 text-surface-500">{stop.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-8 text-center">
                <Bus className="w-12 h-12 dark:text-gray-500 text-surface-400 mx-auto mb-3" />
                <p className="text-xs dark:text-gray-400 text-surface-500">No bus assigned to your child yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'children' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">MY CHILDREN ({childStudents.length})</h3>
              <div className="space-y-3">
                {childStudents.map(child => {
                  const bus = vehicles.find(v => v.id === child.assignedBus);
                  const route = routes.find(r => r.vehicleId === child.assignedBus);
                  const childStatus = statusConfig[child.attendanceStatus] || statusConfig.waiting;
                  return (
                    <div key={child.id} className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {child.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold dark:text-white text-surface-900">{child.fullName}</p>
                          <p className="text-[10px] dark:text-gray-400 text-surface-500">Class {child.class} - Section {child.section}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${childStatus.dot}`} />
                            <span className={`text-[9px] font-bold ${childStatus.color}`}>{childStatus.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                          <p className="text-[8px] dark:text-gray-400 text-surface-500">Bus</p>
                          <p className="text-[10px] font-bold dark:text-white text-surface-900">{child.assignedBus}</p>
                        </div>
                        <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                          <p className="text-[8px] dark:text-gray-400 text-surface-500">Route</p>
                          <p className="text-[10px] font-bold dark:text-white text-surface-900">{route?.name?.split(' - ')[1] || 'N/A'}</p>
                        </div>
                        <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                          <p className="text-[8px] dark:text-gray-400 text-surface-500">Pickup</p>
                          <p className="text-[10px] font-bold dark:text-white text-surface-900">{child.lastBoardedAt || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-electric-400" />
                NOTIFICATIONS
              </h3>
              <div className="space-y-2">
                {childNotifs.length > 0 ? childNotifs.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl ${
                    n.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                    n.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    n.read ? 'dark:bg-navy-700/20 bg-surface-50' : 'dark:bg-navy-700/30 bg-surface-50'
                  }`}>
                    <p className="text-[10px] font-bold dark:text-white text-surface-900">{n.title}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500 mt-0.5">{n.message}</p>
                    <p className="text-[9px] dark:text-gray-500 text-surface-400 mt-1">{n.time}</p>
                  </div>
                )) : (
                  <p className="text-xs dark:text-gray-400 text-surface-500 text-center py-8">No notifications yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="glass-card p-5 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                {currentUser?.name?.[0] || 'P'}
              </div>
              <h2 className="text-sm font-bold dark:text-white text-surface-900">{currentUser?.name}</h2>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{currentUser?.email}</p>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">Parent Account</p>
            </div>

            <div className="glass-card p-4 space-y-3">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 flex items-center justify-between">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Children</p>
                <p className="text-xs font-bold dark:text-white text-surface-900">{childStudents.length}</p>
              </div>
              {childStudents.map(child => (
                <div key={child.id} className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{child.fullName}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">{child.assignedBus}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${statusConfig[child.attendanceStatus]?.bg || 'bg-gray-500/20'} ${statusConfig[child.attendanceStatus]?.color || 'text-gray-400'}`}>
                    {statusConfig[child.attendanceStatus]?.label || 'N/A'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={logout}
              className="w-full py-3 bg-red-600/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> LOGOUT
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 dark:bg-navy-900/95 bg-white/95 backdrop-blur-md border-t dark:border-white/5 border-surface-200">
        <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-0 flex-1 ${
                  isActive ? 'text-electric-400' : 'dark:text-gray-500 text-surface-400'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-electric-400' : ''}`} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function isSchool(stop: { type?: string }) {
  return stop.type === 'school';
}
