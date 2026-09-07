import { StudentAttendanceStatus } from '../data/types';

interface AttendanceStatusBadgeProps {
  status: StudentAttendanceStatus;
  size?: 'sm' | 'md';
}

export default function AttendanceStatusBadge({ status, size = 'sm' }: AttendanceStatusBadgeProps) {
  const config: Record<StudentAttendanceStatus, { color: string; label: string }> = {
    waiting: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Waiting' },
    picked_up: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Picked Up' },
    on_bus: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'On Bus' },
    dropped: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Dropped' },
    absent: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Absent' },
  };

  const { color, label } = config[status] || config.absent;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`status-badge border ${color} ${sizeClass}`}>
      {label}
    </span>
  );
}
