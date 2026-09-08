import { useState } from 'react';
import { useStore } from '../store/useStore';
import { QrCode } from 'lucide-react';

interface DemoQRScannerProps {
  onScan: (qrCode: string) => void;
  isActive: boolean;
}

export default function DemoQRScanner({ onScan, isActive }: DemoQRScannerProps) {
  const { students, selectedAttendanceVehicle, selectedAttendanceRoute } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const assignedStudents = students.filter(
    s => s.assignedVehicleId === selectedAttendanceVehicle && s.assignedRouteId === selectedAttendanceRoute
  );

  const handleSimulateScan = () => {
    if (!selectedStudentId) return;
    const student = assignedStudents.find(s => s.id === selectedStudentId);
    if (student) {
      console.log('[DemoQR] Simulating scan:', student.qrCode);
      onScan(student.qrCode);
      setSelectedStudentId('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
        <span className="text-xs font-bold text-amber-400">DEMO MODE</span>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Select Student to Simulate Scan</label>
        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="input-field text-xs"
        >
          <option value="">-- Choose a student --</option>
          {assignedStudents.map(s => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.studentId}) - {s.attendanceStatus === 'waiting' ? 'Waiting' : s.attendanceStatus === 'on_bus' ? 'On Bus' : s.attendanceStatus === 'dropped' ? 'Dropped' : s.attendanceStatus}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSimulateScan}
        disabled={!selectedStudentId || !isActive}
        className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          selectedStudentId && isActive
            ? 'bg-gradient-to-r from-electric-600 to-electric-700 text-white hover:from-electric-500 hover:to-electric-600'
            : 'dark:bg-navy-700/50 bg-surface-200 dark:text-gray-500 text-surface-500 cursor-not-allowed'
        }`}
      >
        <QrCode className="w-4 h-4" />
        Simulate QR Scan
      </button>

      {!isActive && (
        <p className="text-[10px] dark:text-gray-500 text-surface-500 text-center">Start an attendance session first</p>
      )}

      {assignedStudents.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs dark:text-gray-400 text-surface-500">No students assigned to this bus/route</p>
        </div>
      )}
    </div>
  );
}
