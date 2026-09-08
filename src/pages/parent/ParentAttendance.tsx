import { useStore } from '../../store/useStore';
import { Clock, ArrowLeft, CheckCircle, AlertCircle, Circle } from 'lucide-react';

export default function ParentAttendance() {
  const { currentUser, students, setCurrentPage } = useStore();
  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('parent-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <Clock className="w-5 h-5 text-purple-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">Attendance</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {childStudents.map(student => (
          <div key={student.id} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {student.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white text-surface-900">{student.fullName}</p>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">{student.assignedBus}</p>
              </div>
            </div>

            <div className="space-y-2">
              {(['waiting', 'picked_up', 'on_bus', 'dropped'] as const).map(status => {
                const isActive = student.attendanceStatus === status;
                const isPast = ['picked_up', 'on_bus', 'dropped'].indexOf(student.attendanceStatus) > ['picked_up', 'on_bus', 'dropped'].indexOf(status);
                return (
                  <div key={status} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                    isActive ? 'dark:bg-electric-500/20 bg-electric-50 border border-electric-500/30' :
                    isPast ? 'dark:bg-emerald-500/10 bg-emerald-50 border border-emerald-500/20' :
                    'dark:bg-navy-700/20 bg-surface-50'
                  }`}>
                    {isPast ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
                     isActive ? <AlertCircle className="w-4 h-4 text-electric-400 flex-shrink-0 animate-pulse" /> :
                     <Circle className="w-4 h-4 dark:text-gray-600 text-surface-300 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${
                        isActive ? 'text-electric-400' : isPast ? 'text-emerald-400' : 'dark:text-gray-500 text-surface-400'
                      }`}>
                        {status === 'waiting' ? 'Waiting' : status === 'picked_up' ? 'Picked Up' : status === 'on_bus' ? 'On Bus' : 'Dropped Safely'}
                      </p>
                    </div>
                    {isActive && <span className="text-[10px] text-electric-400 font-bold">CURRENT</span>}
                  </div>
                );
              })}
            </div>

            {student.attendanceHistory.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500 font-medium mb-2">History</p>
                {student.attendanceHistory.slice(-3).reverse().map(record => (
                  <div key={record.id} className="flex items-center gap-2 p-2 rounded-lg dark:bg-navy-700/20 bg-surface-50/50 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      record.scanType === 'board' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {record.scanType === 'board' ? 'BOARD' : 'DROP'}
                    </span>
                    <span className="text-[10px] dark:text-gray-300 text-surface-600">{record.scannedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
