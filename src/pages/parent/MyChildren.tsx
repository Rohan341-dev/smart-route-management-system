import { useStore } from '../../store/useStore';
import { Users, ArrowLeft, GraduationCap, Bus, Clock, CheckCircle, User } from 'lucide-react';

export default function MyChildren() {
  const { currentUser, students, vehicles, routes, setCurrentPage } = useStore();
  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('parent-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <Users className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">My Children</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {childStudents.map(student => {
          const bus = vehicles.find(v => v.id === student.assignedBus);
          const route = routes.find(r => r.vehicleId === student.assignedBus);
          return (
            <div key={student.id} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                {student.photo ? (
                  <img src={student.photo} alt={student.fullName} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {student.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold dark:text-white text-surface-900">{student.fullName}</p>
                  <p className="text-[10px] dark:text-gray-400 text-surface-500">Class {student.class} - Section {student.section}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      student.attendanceStatus === 'on_bus' ? 'bg-emerald-400' :
                      student.attendanceStatus === 'dropped' ? 'bg-blue-400' :
                      student.attendanceStatus === 'picked_up' ? 'bg-amber-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-[10px] dark:text-gray-400 text-surface-500">
                      {student.attendanceStatus === 'on_bus' ? 'On Bus' :
                       student.attendanceStatus === 'dropped' ? 'Dropped' :
                       student.attendanceStatus === 'picked_up' ? 'Picked Up' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Bus className="w-3 h-3 text-electric-400" />
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Bus</p>
                  </div>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{student.assignedBus}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <GraduationCap className="w-3 h-3 text-purple-400" />
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Route</p>
                  </div>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{route?.name || 'N/A'}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Pickup</p>
                  </div>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{student.pickupStop}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Drop</p>
                  </div>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{student.dropStop}</p>
                </div>
              </div>

              {student.lastBoardedAt && (
                <div className="mt-2 dark:bg-emerald-500/10 bg-emerald-50 border border-emerald-500/20 rounded-xl p-2.5">
                  <p className="text-[10px] text-emerald-400 font-medium">Last Boarded: {student.lastBoardedAt}</p>
                </div>
              )}
            </div>
          );
        })}

        {childStudents.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Users className="w-10 h-10 dark:text-gray-500 text-surface-400 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-400 text-surface-500">No children registered</p>
          </div>
        )}
      </main>
    </div>
  );
}
