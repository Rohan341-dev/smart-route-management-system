import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Printer, FileImage, FileText, Loader2 } from 'lucide-react';
import { Student } from '../data/types';
import { useStore } from '../store/useStore';
import { getMediaUrl } from '../services/api';

interface StudentIDCardProps {
  student: Student;
  onClose: () => void;
}

export default function StudentIDCard({ student, onClose }: StudentIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { routes } = useStore();
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const assignedRoute = routes.find(r => r.id === student.assignedRouteId);

  const photoUrl = getMediaUrl(student.photo);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const cardHtml = cardEl.outerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SMARTBUS - ${student.fullName} ID Card</title>
        ${styles}
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          @media print { body { background: white; } #student-id-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; } }
        </style>
      </head>
      <body>
        ${cardHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `SMARTBUS-${student.studentId}-ID.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = img.width / img.height;
      const cardWidth = Math.min(90, pdfWidth - 20);
      const cardHeight = cardWidth / imgRatio;
      const x = (pdfWidth - cardWidth) / 2;
      const y = (pdfHeight - cardHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight);
      pdf.save(`SMARTBUS-${student.studentId}-ID.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloading(false);
    }
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
          <div ref={cardRef} id="student-id-card" className="bg-white rounded-2xl p-6 text-center shadow-lg w-[320px]">
            <div className="mb-3">
              <h4 className="text-sm font-black tracking-wider text-slate-800">SAGARMATHA</h4>
              <p className="text-[10px] text-gray-400 tracking-widest">SECONDARY SCHOOL</p>
            </div>

            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt={student.fullName}
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 mx-auto mb-3"
                onError={(e) => {
                  console.error('[StudentIDCard] Photo failed to load:', photoUrl);
                  setImgError(true);
                }}
                onLoad={() => {
                  console.log('[StudentIDCard] Photo loaded OK:', photoUrl);
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-gray-200 flex flex-col items-center justify-center mx-auto mb-3">
                <span className="text-3xl text-gray-400">👤</span>
                {!photoUrl && <span className="text-[8px] text-gray-400 mt-1">No Photo</span>}
                {imgError && <span className="text-[8px] text-red-400 mt-1">Failed to load</span>}
              </div>
            )}

            <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
            <p className="text-xs text-gray-500 font-mono">{student.studentId}</p>
            <p className="text-[10px] text-gray-500">Class: {student.class}{student.section ? '-' + student.section : ''}</p>

            <div className="my-3 flex justify-center">
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <QRCodeCanvas value={student.qrCode} size={120} level="H" includeMargin={false} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-400">Bus</p>
                <p className="text-gray-900 font-bold">{student.assignedVehicleId || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-400">Route</p>
                <p className="text-gray-900 font-bold">{assignedRoute?.name || student.assignedRouteId || 'N/A'}</p>
              </div>
            </div>

            <p className="text-[9px] text-gray-300 mt-3 border-t border-gray-100 pt-2">Scan for Bus Attendance</p>
          </div>

          <div className="flex gap-2 mt-4 w-full">
            <button onClick={handlePrint} className="flex-1 btn-primary text-[10px] py-2.5 flex items-center justify-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button onClick={handleDownloadPNG} disabled={downloading} className="flex-1 btn-primary text-[10px] py-2.5 flex items-center justify-center gap-1 disabled:opacity-50">
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileImage className="w-3 h-3" />} PNG
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="flex-1 btn-primary text-[10px] py-2.5 flex items-center justify-center gap-1 disabled:opacity-50">
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
