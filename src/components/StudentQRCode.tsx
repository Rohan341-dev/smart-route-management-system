import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Download, Printer } from 'lucide-react';
import { Student } from '../data/types';

interface StudentQRCodeProps {
  student: Student;
  compact?: boolean;
}

export default function StudentQRCode({ student, compact = false }: StudentQRCodeProps) {
  const [showModal, setShowModal] = useState(false);

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="w-7 h-7 rounded-lg bg-electric-600/20 flex items-center justify-center hover:bg-electric-600/30 transition-all"
        >
          <QrCode className="w-3.5 h-3.5 text-electric-400" />
        </button>
        {showModal && (
          <QRModal student={student} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1"
      >
        <QrCode className="w-3 h-3" /> View QR
      </button>
      {showModal && (
        <QRModal student={student} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function QRModal({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Student QR Card</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-4">
            <h4 className="text-xs font-black tracking-wider text-electric-400">SMARTBUS</h4>
            <p className="text-[10px] text-gray-400">Student QR Attendance Card</p>
          </div>

          <div className="bg-white p-4 rounded-2xl mb-4">
            <QRCodeSVG
              value={student.qrCode}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white">{student.fullName}</p>
            <p className="text-xs text-gray-400">Student ID: {student.studentId}</p>
            <p className="text-[10px] text-gray-400">QR ID: {student.qrCode}</p>
          </div>

          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-navy-700/50 rounded-lg p-2 text-center">
              <p className="text-gray-400">Route</p>
              <p className="text-white font-bold">{student.assignedRouteId}</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-2 text-center">
              <p className="text-gray-400">Bus</p>
              <p className="text-white font-bold">{student.assignedVehicleId}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4 w-full">
            <button className="flex-1 btn-primary text-[10px] py-2 flex items-center justify-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button className="flex-1 btn-primary text-[10px] py-2 flex items-center justify-center gap-1">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
