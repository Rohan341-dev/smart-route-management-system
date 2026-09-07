import { useStore } from '../store/useStore';
import { Users, Bus, CheckCircle, Clock, UserX } from 'lucide-react';

interface AttendanceSummaryProps {
  vehicleId: string;
}

export default function AttendanceSummary({ vehicleId }: AttendanceSummaryProps) {
  const { students, vehicles } = useStore();
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const assignedStudents = students.filter(s => s.assignedVehicleId === vehicleId);

  const total = assignedStudents.length;
  const capacity = vehicle?.capacity || 40;
  const pickedUp = assignedStudents.filter(s => s.attendanceStatus === 'picked_up').length;
  const onBus = assignedStudents.filter(s => s.attendanceStatus === 'on_bus').length;
  const dropped = assignedStudents.filter(s => s.attendanceStatus === 'dropped').length;
  const absent = assignedStudents.filter(s => s.attendanceStatus === 'absent').length;
  const waiting = assignedStudents.filter(s => s.attendanceStatus === 'waiting').length;
  const occupancy = pickedUp + onBus;
  const occupancyPercent = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-electric-400" />
          <h4 className="text-xs font-bold dark:text-white text-surface-900">{vehicleId}</h4>
        </div>
        <span className="text-[10px] dark:text-gray-400 text-surface-500">Capacity: {capacity}</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] dark:text-gray-400 text-surface-500">Current Occupancy</span>
          <span className="text-xs font-bold dark:text-white text-surface-900">{occupancy} / {capacity}</span>
        </div>
        <div className="h-2 dark:bg-navy-600 bg-surface-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPercent > 90 ? 'bg-red-500' : occupancyPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
          />
        </div>
        <p className="text-[10px] dark:text-gray-400 text-surface-500 mt-0.5 text-right">{occupancyPercent}%</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="text-center p-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg">
          <Users className="w-3.5 h-3.5 dark:text-gray-400 text-surface-500 mx-auto mb-1" />
          <p className="text-sm font-bold dark:text-white text-surface-900">{total}</p>
          <p className="text-[8px] dark:text-gray-400 text-surface-500">Assigned</p>
        </div>
        <div className="text-center p-2 bg-amber-500/10 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-amber-400">{waiting}</p>
          <p className="text-[8px] dark:text-gray-400 text-surface-500">Waiting</p>
        </div>
        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-blue-400">{pickedUp}</p>
          <p className="text-[8px] dark:text-gray-400 text-surface-500">Picked</p>
        </div>
        <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
          <Bus className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-emerald-400">{onBus}</p>
          <p className="text-[8px] dark:text-gray-400 text-surface-500">On Bus</p>
        </div>
        <div className="text-center p-2 bg-purple-500/10 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-purple-400">{dropped}</p>
          <p className="text-[8px] dark:text-gray-400 text-surface-500">Dropped</p>
        </div>
      </div>

      {absent > 0 && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
          <UserX className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] text-red-400">{absent} student(s) marked absent</span>
        </div>
      )}
    </div>
  );
}
