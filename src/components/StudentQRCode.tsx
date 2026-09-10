import { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Download, Printer, User } from 'lucide-react';
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
    const photoHtml = student.photo
      ? `<img src="${student.photo}" width="120" height="120" style="border-radius: 12px; object-fit: cover; border: 2px solid #e5e7eb;" />`
      : `<div style="width:120px;height:120px;border-radius:12px;background:#f3f4f6;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:32px;">👤</div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SMARTBUS - ${student.fullName} ID Card</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          .card { background: white; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 380px; }
          .school-name { font-size: 14px; font-weight: 900; letter-spacing: 1px; color: #1e3a5f; text-transform: uppercase; }
          .school-subtitle { font-size: 10px; color: #6b7280; margin-top: 2px; }
          .photo-container { margin: 16px auto; }
          .student-name { font-size: 16px; font-weight: 700; color: #111827; margin-top: 12px; }
          .student-id { font-size: 12px; color: #6b7280; font-family: monospace; }
          .student-class { font-size: 11px; color: #6b7280; }
          .qr-container { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 12px; display: inline-block; margin: 12px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
          .info-box { background: #f9fafb; border-radius: 8px; padding: 8px; }
          .info-label { font-size: 9px; color: #9ca3af; }
          .info-value { font-size: 11px; font-weight: 700; color: #111827; }
          .footer { margin-top: 12px; font-size: 9px; color: #d1d5db; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #e5e7eb; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="school-name">SAGARMATHA</div>
          <div class="school-subtitle">SECONDARY SCHOOL</div>
          <div class="photo-container">${photoHtml}</div>
          <div class="student-name">${student.fullName}</div>
          <div class="student-id">${student.studentId}</div>
          <div class="student-class">Class: ${student.class}${student.section ? '-' + student.section : ''}</div>
          <div class="qr-container">
            ${qrDataUrl ? `<img src="${qrDataUrl}" width="150" height="150" />` : '<div style="width:150px;height:150px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">QR Code</div>'}
          </div>
          <div class="info-grid">
            <div class="info-box"><div class="info-label">Bus</div><div class="info-value">${student.assignedVehicleId || 'N/A'}</div></div>
            <div class="info-box"><div class="info-label">Route</div><div class="info-value">${assignedRoute?.name || student.assignedRouteId || 'N/A'}</div></div>
          </div>
          <div class="footer">Scan for Bus Attendance</div>
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
          <h3 className="text-sm font-bold dark:text-white text-surface-900">Student ID Card</h3>
          <button onClick={onClose} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100 transition-all">
            <X className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-3">
            <h4 className="text-sm font-black tracking-wider text-slate-800 dark:text-white">SAGARMATHA</h4>
            <p className="text-[10px] dark:text-gray-400 text-surface-500 tracking-widest">SECONDARY SCHOOL</p>
          </div>

          {student.photo ? (
            <img src={student.photo} alt={student.fullName} className="w-24 h-24 rounded-xl object-cover border-2 dark:border-white/10 border-surface-200 mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-xl dark:bg-navy-700/50 bg-surface-100 border-2 dark:border-white/10 border-surface-200 flex items-center justify-center mb-3">
              <User className="w-10 h-10 dark:text-gray-500 text-surface-400" />
            </div>
          )}

          <div className="text-center space-y-0.5 mb-3">
            <p className="text-sm font-bold dark:text-white text-surface-900">{student.fullName}</p>
            <p className="text-xs dark:text-gray-400 text-surface-500 font-mono">{student.studentId}</p>
            <p className="text-[10px] dark:text-gray-400 text-surface-500">Class: {student.class}{student.section ? '-' + student.section : ''}</p>
          </div>

          <div className="bg-white p-3 rounded-xl mb-3" ref={qrRef}>
            <QRCodeCanvas
              value={student.qrCode}
              size={150}
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="text-[9px] dark:text-gray-500 text-surface-400 font-mono mb-3">{student.qrCode}</p>

          <div className="w-full grid grid-cols-2 gap-2 text-[10px]">
            <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
              <p className="dark:text-gray-400 text-surface-500">Bus</p>
              <p className="dark:text-white text-surface-900 font-bold">{student.assignedVehicleId || 'N/A'}</p>
            </div>
            <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
              <p className="dark:text-gray-400 text-surface-500">Route</p>
              <p className="dark:text-white text-surface-900 font-bold">{assignedRoute?.name || student.assignedRouteId || 'N/A'}</p>
            </div>
          </div>

          <p className="text-[9px] dark:text-gray-500 text-surface-400 mt-3">Scan for Bus Attendance</p>

          <div className="flex gap-2 mt-3 w-full">
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
