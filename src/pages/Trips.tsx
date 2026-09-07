import { useStore } from '../store/useStore';
import { Bus, Clock, Users, MapPin, CheckCircle, Play, AlertTriangle } from 'lucide-react';

export default function Trips() {
  const { trips, vehicles, drivers, routes } = useStore();

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.scheduled;
  };

  const activeTrips = trips.filter(t => t.status === 'in_progress').length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Total Trips</p>
          <p className="text-2xl font-bold dark:text-white text-surface-900">{trips.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{activeTrips}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Completed</p>
          <p className="text-2xl font-bold text-purple-400">{completedTrips}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Students Transported</p>
          <p className="text-2xl font-bold dark:text-white text-surface-900">{trips.reduce((sum, t) => sum + t.studentsPickedUp, 0)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-surface-200">
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Trip</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Driver</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Route</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Start Time</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Students</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Progress</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const vehicle = vehicles.find(v => v.id === t.vehicleId);
                const driver = drivers.find(d => d.id === t.driverId);
                const route = routes.find(r => r.id === t.routeId);
                const progress = t.totalStudents > 0 ? ((t.studentsPickedUp + t.studentsDropped) / (t.totalStudents * 2)) * 100 : 0;

                return (
                  <tr key={t.id} className="border-b dark:border-white/5 border-surface-200 dark:hover:bg-white/5 hover:bg-surface-50 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          t.status === 'in_progress' ? 'bg-emerald-500/20' : 'dark:bg-navy-700/30 bg-surface-50'
                        }`}>
                          {t.status === 'in_progress' ? <Play className="w-4 h-4 text-emerald-400" /> :
                           t.status === 'completed' ? <CheckCircle className="w-4 h-4 text-purple-400" /> :
                           <Bus className="w-4 h-4 dark:text-gray-400 text-surface-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold dark:text-white text-surface-900">{t.id}</p>
                          <p className="text-[10px] dark:text-gray-400 text-surface-500">{t.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{t.vehicleId}</td>
                    <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{driver?.fullName || 'None'}</td>
                    <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{route?.name || t.routeId}</td>
                    <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{t.startTime}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="text-emerald-400">{t.studentsPickedUp} picked</span>
                        <span className="dark:text-gray-400 text-surface-500 mx-1">/</span>
                        <span className="text-purple-400">{t.studentsDropped} dropped</span>
                        <span className="dark:text-gray-400 text-surface-500 mx-1">/</span>
                        <span className="dark:text-white text-surface-900">{t.totalStudents} total</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-20">
                        <div className="h-1.5 dark:bg-navy-600 bg-surface-200 rounded-full overflow-hidden">
                          <div className="h-full bg-electric-500 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-0.5">{progress.toFixed(0)}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge border text-[10px] ${getStatusBadge(t.status)}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
