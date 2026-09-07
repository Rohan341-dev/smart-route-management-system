import { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Download, Printer } from 'lucide-react';
import { Student } from '../data/types';
import { useStore } from '../store/useStore';

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
  const qrRef = useRef<HTMLDivElement>(null);
  const { routes } = useStore();
  const assignedRoute = routes.find(r => r.id === student.assignedRouteId);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const qrCanvas = qrRef.current?.querySelector('canvas');
    const qrDataUrl = qrCanvas?.toDataURL('image/png') || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SMARTBUS - ${student.fullName} QR Card</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          .card { background: white; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 350px; }
          .header { margin-bottom: 16px; }
          .brand { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #3b76ff; }
          .subtitle { font-size: 11px; color: #6b7280; margin-top: 4px; }
          .qr-container { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; display: inline-block; margin: 16px 0; }
          .student-name { font-size: 16px; font-weight: 700; color: #111827; margin-top: 12px; }
          .student-id { font-size: 12px; color: #6b7280; }
          .qr-id { font-size: 10px; color: #9ca3af; font-family: monospace; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
          .info-box { background: #f9fafb; border-radius: 8px; padding: 8px; }
          .info-label { font-size: 10px; color: #9ca3af; }
          .info-value { font-size: 12px; font-weight: 700; color: #111827; }
          .footer { margin-top: 16px; font-size: 9px; color: #d1d5db; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #e5e7eb; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="brand">SMARTBUS</div>
            <div class="subtitle">Student Bus Attendance Card</div>
          </div>
          <div class="qr-container">
            ${qrDataUrl ? `<img src="${qrDataUrl}" width="180" height="180" />` : '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">QR Code</div>'}
          </div>
          <div class="student-name">${student.fullName}</div>
          <div class="student-id">Student ID: ${student.studentId}</div>
          <div class="qr-id">${student.qrId}</div>
          <div class="info-grid">
            <div class="info-box"><div class="info-label">Bus</div><div class="info-value">${student.assignedVehicleId}</div></div>
            <div class="info-box"><div class="info-label">Route</div><div class="info-value">${assignedRoute?.name || student.assignedRouteId}</div></div>
          </div>
          <div class="footer">SMARTBUS Student Attendance System</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleDownload = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;
    const link = document.createElement('a');
    link.download = `SMARTBUS-${student.studentId}-QR.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="dark:bg-navy-800 bg-white dark:border-white/10 border-surface-200 border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-white/5 border-surface-200">
          <h3 className="text-sm font-bold dark:text-white text-surface-900">Student QR Card</h3>
          <button onClick={onClose} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100 transition-all">
            <X className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-4">
            <h4 className="text-xs font-black tracking-wider text-electric-400">SMARTBUS</h4>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">Student QR Attendance Card</p>
          </div>

          <div className="bg-white p-4 rounded-2xl mb-4" ref={qrRef}>
            <QRCodeCanvas
              value={student.qrCode}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-bold dark:text-white text-surface-900">{student.fullName}</p>
            <p className="text-xs dark:text-gray-400 text-surface-500">Student ID: {student.studentId}</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">QR ID: {student.qrCode}</p>
          </div>

          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
              <p className="dark:text-gray-400 text-surface-500">Route</p>
              <p className="dark:text-white text-surface-900 font-bold">{student.assignedRouteId}</p>
            </div>
            <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
              <p className="dark:text-gray-400 text-surface-500">Bus</p>
              <p className="dark:text-white text-surface-900 font-bold">{student.assignedVehicleId}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4 w-full">
            <button onClick={handlePrint} className="flex-1 btn-primary text-[10px] py-2 flex items-center justify-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button onClick={handleDownload} className="flex-1 btn-primary text-[10px] py-2 flex items-center justify-center gap-1">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
