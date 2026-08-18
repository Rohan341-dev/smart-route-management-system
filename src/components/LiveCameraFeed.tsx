import { useEffect, useRef } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { Video, VideoOff, Wifi, WifiOff, Monitor } from 'lucide-react';

interface LiveCameraFeedProps {
  vehicleId?: string;
  driverName?: string;
}

export default function LiveCameraFeed({ vehicleId = 'BUS-107', driverName = 'Suresh Magar' }: LiveCameraFeedProps) {
  const { remoteStream, connectionState, startAsAdmin } = useWebRTC();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const cleanup = startAsAdmin();
    return () => { cleanup.then(fn => fn?.()); };
  }, [startAsAdmin]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-electric-400" />
          <h3 className="text-xs font-bold text-white">LIVE CAMERA FEED</h3>
        </div>
        <div className="flex items-center gap-2">
          {connectionState === 'connected' ? (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <Wifi className="w-3 h-3" /> LIVE
            </span>
          ) : connectionState === 'connecting' ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <Wifi className="w-3 h-3 animate-pulse" /> CONNECTING...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}
        </div>
      </div>

      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/80">
            <VideoOff className="w-10 h-10 text-gray-500 mb-2" />
            <p className="text-xs text-gray-400">Waiting for driver camera...</p>
            <p className="text-[10px] text-gray-500 mt-1">Open /driver on phone to connect</p>
          </div>
        )}

        {remoteStream && (
          <>
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <span className="text-[9px] text-white font-bold">REC</span>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <p className="text-[9px] text-white">{vehicleId} — {driverName}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
