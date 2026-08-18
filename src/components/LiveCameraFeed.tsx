import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { Video, VideoOff, Wifi, WifiOff, Monitor, Copy, Check } from 'lucide-react';

interface LiveCameraFeedProps {
  vehicleId?: string;
  driverName?: string;
}

export default function LiveCameraFeed({ vehicleId = 'BUS-107', driverName = 'Suresh Magar' }: LiveCameraFeedProps) {
  const { remoteStream, connectionState, startAsAdmin } = useWebRTC();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cleanup = startAsAdmin();
    return () => { cleanup.then(fn => fn?.()); };
  }, [startAsAdmin]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('[LiveCamera] Attaching stream:', remoteStream.id, 'tracks:', remoteStream.getTracks().length);
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch(e => console.error('[LiveCamera] Play error:', e));
    }
  }, [remoteStream]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/driver');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      <div className="relative bg-black" style={{ aspectRatio: '4/3', minHeight: '240px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            backgroundColor: '#000',
          }}
        />

        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/80 p-4">
            <VideoOff className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-xs text-gray-400 text-center mb-2">Waiting for driver camera...</p>
            <p className="text-[10px] text-gray-500 text-center mb-3">Open /driver on phone to connect</p>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-electric-600/20 hover:bg-electric-600/30 rounded-lg text-[10px] text-electric-400 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy driver link'}
            </button>
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
