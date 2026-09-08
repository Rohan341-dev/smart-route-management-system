import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, ScanLine, Zap } from 'lucide-react';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  isActive: boolean;
}

export default function QRScanner({ onScan, isActive }: QRScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastDecoded, setLastDecoded] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>('');
  const scanDebounceRef = useRef(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      setCameraError(null);
      await stopScanner();

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        setCameraError('No cameras found on this device.');
        return;
      }

      const preferredCamera = facingMode === 'environment'
        ? cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment'))
        : cameras.find(c => c.label.toLowerCase().includes('front') || c.label.toLowerCase().includes('user'));

      const cameraId = preferredCamera?.id || cameras[cameras.length - 1].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          if (now - scanDebounceRef.current < 2000) return;
          if (decodedText === lastScanRef.current && now - scanDebounceRef.current < 5000) return;

          scanDebounceRef.current = now;
          lastScanRef.current = decodedText;
          setLastDecoded(decodedText);
          onScan(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error('QR Scanner error:', err);
      setCameraError(
        err.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access.'
          : err.message?.includes('not found')
          ? 'No camera found on this device.'
          : 'Unable to start QR scanner. Try again.'
      );
      setCameraActive(false);
    }
  }, [facingMode, onScan, stopScanner]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (cameraActive) {
      stopScanner().then(() => {
        setTimeout(() => startScanner(), 300);
      });
    }
  }, [cameraActive, startScanner, stopScanner]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  useEffect(() => {
    if (!isActive && cameraActive) {
      stopScanner();
    }
  }, [isActive, cameraActive, stopScanner]);

  return (
    <div className="space-y-3">
      <div className="relative dark:bg-navy-900 bg-surface-100 rounded-2xl overflow-hidden border dark:border-white/10 border-surface-200" style={{ minHeight: '280px' }}>
        <div id="qr-reader" className="w-full" style={{ minHeight: '280px' }} />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full dark:bg-navy-700/50 bg-surface-200 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 dark:text-gray-500 text-surface-500" />
            </div>
            {cameraError ? (
              <div className="text-center">
                <p className="text-xs text-red-400 mb-2">{cameraError}</p>
                <button onClick={startScanner} className="btn-primary text-xs py-2 px-4">
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs dark:text-gray-400 text-surface-500 mb-1">Camera inactive</p>
                <p className="text-[10px] dark:text-gray-500 text-surface-500">Tap start to activate QR scanner</p>
              </div>
            )}
          </div>
        )}

        {cameraActive && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-electric-500/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-electric-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-electric-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-electric-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-electric-400 rounded-br-lg" />
                <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-electric-400/30 animate-pulse" />
              </div>
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-[9px] text-white font-bold">SCANNING</span>
            </div>
            {lastDecoded && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
                <p className="text-[10px] text-emerald-400 font-bold">Last scan: {lastDecoded}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2">
        {!cameraActive ? (
          <button
            onClick={startScanner}
            disabled={!isActive}
            className={`flex-1 text-xs py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-electric-600 to-electric-700 text-white hover:from-electric-500 hover:to-electric-600 shadow-lg shadow-electric-500/25'
                : 'dark:bg-navy-700/50 bg-surface-200 dark:text-gray-500 text-surface-500 cursor-not-allowed'
            }`}
          >
            <Camera className="w-4 h-4" /> Start QR Scanner
          </button>
        ) : (
          <>
            <button onClick={stopScanner} className="flex-1 btn-danger text-xs py-2.5 flex items-center justify-center gap-2">
              <CameraOff className="w-4 h-4" /> Stop Scanner
            </button>
            <button onClick={switchCamera} className="px-4 py-2.5 dark:bg-navy-700 bg-surface-200 dark:hover:bg-navy-600 hover:bg-surface-300 rounded-xl text-xs dark:text-gray-300 text-surface-600 flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {!isActive && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3 h-3 text-amber-400" />
          <p className="text-[10px] text-amber-400">Start an attendance session first</p>
        </div>
      )}
    </div>
  );
}
