import { useStore } from '../store/useStore';
import { BarChart3, TrendingUp, Clock, Users, Truck, AlertTriangle, Route } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b76ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const { vehicles, drivers, students, routes, driverAlerts, sosAlerts, trips } = useStore();

  const fleetData = [
    { name: 'Moving', value: vehicles.filter(v => v.status === 'moving').length },
    { name: 'Stopped', value: vehicles.filter(v => v.status === 'stopped').length },
    { name: 'Delayed', value: vehicles.filter(v => v.status === 'delayed').length },
    { name: 'Offline', value: vehicles.filter(v => v.status === 'offline').length },
  ];

  const driverPerformance = drivers.map(d => ({
    name: d.fullName.split(' ')[0],
    safety: d.safetyScore,
    alerts: d.drowsinessAlerts + d.overspeedAlerts + d.harshBraking,
    hours: d.drivingHours,
  }));

  const dailyTrips = [
    { day: 'Mon', trips: 24, onTime: 20, delayed: 4 },
    { day: 'Tue', trips: 26, onTime: 22, delayed: 4 },
    { day: 'Wed', trips: 25, onTime: 23, delayed: 2 },
    { day: 'Thu', trips: 27, onTime: 21, delayed: 6 },
    { day: 'Fri', trips: 24, onTime: 19, delayed: 5 },
  ];

  const emergencyData = [
    { month: 'Jan', sos: 2, resolved: 2 },
    { month: 'Feb', sos: 1, resolved: 1 },
    { month: 'Mar', sos: 3, resolved: 2 },
    { month: 'Apr', sos: 0, resolved: 0 },
    { month: 'May', sos: 1, resolved: 1 },
    { month: 'Jun', sos: 2, resolved: 2 },
  ];

  const alertBreakdown = [
    { name: 'Drowsiness', value: driverAlerts.filter(a => a.type === 'drowsiness').length },
    { name: 'Overspeed', value: driverAlerts.filter(a => a.type === 'overspeed').length },
    { name: 'Harsh Braking', value: driverAlerts.filter(a => a.type === 'harsh_braking').length },
    { name: 'Route Dev', value: driverAlerts.filter(a => a.type === 'route_deviation').length },
  ];

  const reportCards = [
    { label: 'Fleet Reports', desc: 'Vehicle utilization, mileage, idle time', icon: Truck, count: vehicles.length },
    { label: 'Driver Reports', desc: 'Safety scores, alerts, driving hours', icon: Users, count: drivers.length },
    { label: 'Student Reports', desc: 'Pickup/drop history, attendance', icon: Users, count: students.length },
    { label: 'Route Reports', desc: 'On-time %, delays, deviations', icon: Route, count: routes.length },
    { label: 'Emergency Reports', desc: 'SOS count, response times', icon: AlertTriangle, count: sosAlerts.length },
    { label: 'Trip Reports', desc: 'Trip count, completion rate', icon: BarChart3, count: trips.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-600/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-electric-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{card.label}</h3>
                  <p className="text-[10px] text-gray-400">{card.desc}</p>
                </div>
                <span className="ml-auto text-sm font-bold text-electric-400">{card.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Fleet Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={fleetData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {fleetData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4">
            {fleetData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index] }}></span>
                <span className="text-[10px] text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Driver Safety Scores</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={driverPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="safety" radius={[4, 4, 0, 0]}>
                {driverPerformance.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.safety >= 90 ? '#10b981' : entry.safety >= 80 ? '#f59e0b' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Trips */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Trip Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyTrips}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="onTime" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="delayed" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Alert Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={alertBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}>
                {alertBreakdown.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4">
            {alertBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index] }}></span>
                <span className="text-[10px] text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Emergency Incident Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={emergencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="sos" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
