import { useStore } from '../store/useStore';
import { Truck, Users, GraduationCap, Route, AlertTriangle, Eye, CheckCircle, Clock, MapPin, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#3b76ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { vehicles, drivers, students, routes, driverAlerts, sosAlerts, activityLogs, trips, driverMonitorState } = useStore();

  const movingVehicles = vehicles.filter(v => v.status === 'moving').length;
  const stoppedVehicles = vehicles.filter(v => v.status === 'stopped').length;
  const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
  const emergencyVehicles = vehicles.filter(v => v.status === 'emergency').length;
  const delayedVehicles = vehicles.filter(v => v.status === 'delayed').length;
  const routeDeviation = vehicles.filter(v => v.status === 'route_deviation').length;

  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const alertDrivers = drivers.filter(d => d.status === 'alert').length;
  const emergencyDrivers = drivers.filter(d => d.status === 'emergency').length;

  const onBus = students.filter(s => s.status === 'on_bus').length;
  const dropped = students.filter(s => s.status === 'dropped').length;
  const waiting = students.filter(s => s.status === 'waiting').length;

  const activeRoutes = routes.filter(r => r.status === 'in_progress').length;
  const completedRoutes = routes.filter(r => r.status === 'completed').length;
  const scheduledRoutes = routes.filter(r => r.status === 'scheduled').length;

  const activeSOS = sosAlerts.filter(s => s.status === 'active' || s.status === 'escalating').length;
  const unreadAlerts = driverAlerts.filter(a => !a.acknowledged).length;

  const vehicleStatusData = [
    { name: 'Moving', value: movingVehicles },
    { name: 'Stopped', value: stoppedVehicles },
    { name: 'Idle', value: idleVehicles },
    { name: 'Delayed', value: delayedVehicles },
    { name: 'Offline', value: offlineVehicles },
    { name: 'Emergency', value: emergencyVehicles },
  ];

  const weeklyTrips = [
    { day: 'Mon', trips: 24, students: 480 },
    { day: 'Tue', trips: 26, students: 520 },
    { day: 'Wed', trips: 25, students: 500 },
    { day: 'Thu', trips: 27, students: 540 },
    { day: 'Fri', trips: 24, students: 480 },
    { day: 'Sat', trips: 12, students: 240 },
    { day: 'Sun', trips: 0, students: 0 },
  ];

  const safetyData = drivers.map(d => ({ name: d.fullName.split(' ')[0], score: d.safetyScore }));

  const kpiCards = [
    { label: 'Total Vehicles', value: vehicles.length, icon: Truck, color: 'from-blue-500 to-blue-700', change: '+2', up: true },
    { label: 'Active Vehicles', value: movingVehicles, icon: Activity, color: 'from-emerald-500 to-emerald-700', change: `${vehicles.length - movingVehicles - offlineVehicles} others`, up: false },
    { label: 'Total Drivers', value: drivers.length, icon: Users, color: 'from-purple-500 to-purple-700', change: `${activeDrivers} active`, up: true },
    { label: 'Total Students', value: students.length, icon: GraduationCap, color: 'from-cyan-500 to-cyan-700', change: `${onBus} on bus`, up: true },
    { label: 'Active Routes', value: activeRoutes, icon: Route, color: 'from-amber-500 to-orange-700', change: `${scheduledRoutes} scheduled`, up: false },
    { label: 'Driver Alerts', value: unreadAlerts, icon: AlertTriangle, color: unreadAlerts > 0 ? 'from-red-500 to-red-700' : 'from-gray-500 to-gray-700', change: `${driverAlerts.length} total`, up: false },
    { label: 'SOS Active', value: activeSOS, icon: AlertTriangle, color: activeSOS > 0 ? 'from-red-600 to-red-800' : 'from-gray-500 to-gray-700', change: activeSOS > 0 ? 'CRITICAL' : 'None', up: false },
    { label: 'Students On Bus', value: onBus, icon: GraduationCap, color: 'from-teal-500 to-teal-700', change: `${dropped} dropped`, up: true },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4 hover:bg-white/5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-full">{card.change}</span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Trip Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyTrips}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="students" stroke="#3b76ff" fill="#3b76ff20" strokeWidth={2} />
              <Area type="monotone" dataKey="trips" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Vehicle Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {vehicleStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {vehicleStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></span>
                <span className="text-[10px] text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safety Scores */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Driver Safety Scores</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={safetyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {safetyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score >= 90 ? '#10b981' : entry.score >= 80 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Live Activity Feed</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-navy-700/30 hover:bg-navy-600/30 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  log.severity === 'danger' ? 'bg-red-500/20 text-red-400' :
                  log.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  log.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-electric-500/20 text-electric-400'
                }`}>
                  {log.severity === 'danger' ? <AlertTriangle className="w-4 h-4" /> :
                   log.severity === 'success' ? <CheckCircle className="w-4 h-4" /> :
                   log.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                   <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{log.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
