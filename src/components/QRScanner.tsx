import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, ScanLine } from 'lucide-react';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  isActive: boolean;
}

export default function QRScanner({ onScan, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const lastScanRef = useRef<string>('');
  const scanDebounceRef = useRef<number>(0);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Unable to access camera.'
      );
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  useEffect(() => {
    if (isActive && cameraActive) {
      scanIntervalRef.current = window.setInterval(() => {
        // QR scanning simulation - in production, use a library like jsQR
        // For demo purposes, we rely on the demo scanner
      }, 500);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isActive, cameraActive]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative bg-navy-900 rounded-2xl overflow-hidden border border-white/10" style={{ minHeight: '240px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: cameraActive ? 'block' : 'none', minHeight: '240px' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-navy-700/50 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 text-gray-500" />
            </div>
            {cameraError ? (
              <div className="text-center">
                <p className="text-xs text-red-400 mb-2">{cameraError}</p>
                <button onClick={startCamera} className="btn-primary text-xs py-2 px-4">
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Camera inactive</p>
                <p className="text-[10px] text-gray-500">Click start to activate QR scanner</p>
              </div>
            )}
          </div>
        )}

        {cameraActive && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-electric-500/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-electric-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-electric-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-electric-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-electric-400 rounded-br-lg" />
                <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-electric-400/30 animate-pulse" />
              </div>
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-[9px] text-white">LIVE</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        {!cameraActive ? (
          <button onClick={startCamera} className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Start Camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="flex-1 btn-danger text-xs py-2.5 flex items-center justify-center gap-2">
              <CameraOff className="w-4 h-4" /> Stop Camera
            </button>
            <button onClick={switchCamera} className="px-4 py-2.5 bg-navy-700 hover:bg-navy-600 rounded-xl text-xs text-gray-300 flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
