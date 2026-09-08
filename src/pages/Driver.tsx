import { useState, useEffect, useRef, useCallback } from 'react';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useGPS } from '../hooks/useGPS';
import { useBuzzer } from '../hooks/useBuzzer';
import { useWebRTC } from '../hooks/useWebRTC';
import { useStore } from '../store/useStore';
import {
  Camera, MapPin, Volume2, Brain, Shield, AlertTriangle,
  Phone, Eye, EyeOff, CheckCircle, XCircle,
  Navigation, Clock, Wifi, WifiOff, Zap, Video, Settings
} from 'lucide-react';

type DriverScreen = 'permissions' | 'monitoring' | 'drowsiness' | 'sos' | 'offline';

const DROWSINESS_THRESHOLD_MS = 5000;
const RESPONSE_TIMEOUT_MS = 30000;

export default function Driver() {
  const { vehicles, startEyeClosure, resetEyeClosure, confirmDrowsiness, startAlarm, stopAlarm, escalateToSOS, triggerSOS } = useStore();
  const faceDetection = useFaceDetection();
  const gps = useGPS();
  const buzzer = useBuzzer();
  const webrtc = useWebRTC();

  const [screen, setScreen] = useState<DriverScreen>('permissions');
  const [cameraPermission, setCameraPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [soundPermission, setSoundPermission] = useState(false);
  const [closureElapsed, setClosureElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);
  const [selectedDriver] = useState<string>('DRV-07');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const closureTimerRef = useRef<number | null>(null);
  const responseTimerRef = useRef<number | null>(null);
  const eyesClosedAtRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpsSendIntervalRef = useRef<number | null>(null);
  const responseDeadlineRef = useRef<number | null>(null);

  const driver = useStore(s => s.drivers.find(d => d.id === selectedDriver));
  const monitoringState = useStore(s => s.monitoringState);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-start trip once all permissions are granted
  useEffect(() => {
    if (cameraPermission && locationPermission && soundPermission && screen === 'permissions') {
      const t = setTimeout(() => startTrip(), 500);
      return () => clearTimeout(t);
    }
  }, [cameraPermission, locationPermission, soundPermission, screen]);

  useEffect(() => {
    if (gps.isActive && gps.latitude !== 0) {
      useStore.getState().updateDriverGPS(selectedDriver, selectedVehicle.id, {
        latitude: gps.latitude,
        longitude: gps.longitude,
        speed: gps.speed,
        heading: gps.heading,
      });
    }
  }, [gps.latitude, gps.longitude, gps.speed, gps.heading, gps.isActive, selectedDriver, selectedVehicle.id]);

  const requestAllPermissions = useCallback(async () => {
    setCameraError(null);
    setIsRequesting(true);

    try {
      // Check if camera was previously denied via Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (camStatus.state === 'denied') {
            setCameraError('Camera was previously blocked. Tap the lock/info icon in your address bar → Camera → Allow, then reload.');
            setIsRequesting(false);
            return;
          }
        } catch {}
      }

      // Camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraPermission(true);

      // Location
      const granted = await gps.requestPermission();
      setLocationPermission(granted);

      // Sound
      const ready = await buzzer.initAudio();
      setSoundPermission(ready);

      setIsRequesting(false);
    } catch (err: any) {
      setIsRequesting(false);
      let msg = 'Permission denied. Please allow access and try again.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera blocked. Tap the lock icon (🔒) in your address bar → Camera → Allow, then reload this page.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is in use by another app.';
      }
      setCameraError(msg);
    }
  }, [gps, buzzer]);

  const startTrip = useCallback(async () => {
    setScreen('monitoring');
    setCameraError(null);
    gps.startTracking();

    gpsSendIntervalRef.current = window.setInterval(() => {
      if (gps.latitude !== 0) {
        useStore.getState().updateDriverGPS(selectedDriver, selectedVehicle.id, {
          latitude: gps.latitude,
          longitude: gps.longitude,
          speed: gps.speed,
          heading: gps.heading,
        });
      }
    }, 3000);

    await new Promise(r => setTimeout(r, 300));

    if (videoRef.current && canvasRef.current) {
      try {
        await faceDetection.startDetection(videoRef.current, canvasRef.current);
        setTimeout(() => {
          const stream = faceDetection.getStream();
          if (stream) {
            webrtc.startAsDriver(stream).catch(() => {});
          }
        }, 1500);
      } catch (err: any) {
        setCameraError(err.message || 'Failed to start camera');
      }
    }
  }, [gps, selectedDriver, selectedVehicle.id, faceDetection, webrtc]);

  useEffect(() => {
    if (screen !== 'monitoring') return;
    if (!faceDetection.faceDetected || !faceDetection.isCalibrated) {
      return;
    }

    if (!faceDetection.leftEyeOpen || !faceDetection.rightEyeOpen) {
      if (!eyesClosedAtRef.current) {
        eyesClosedAtRef.current = Date.now();
        startEyeClosure();

        const tick = () => {
          if (!eyesClosedAtRef.current) return;
          const elapsed = Date.now() - eyesClosedAtRef.current;
          setClosureElapsed(elapsed);

          if (elapsed >= DROWSINESS_THRESHOLD_MS) {
            confirmDrowsiness();
            setTimeout(() => {
              startAlarm();
              buzzer.startBuzzer();
              setScreen('drowsiness');
            }, 100);
            return;
          }
          closureTimerRef.current = requestAnimationFrame(tick);
        };
        closureTimerRef.current = requestAnimationFrame(tick);
      }
    } else {
      if (eyesClosedAtRef.current) {
        eyesClosedAtRef.current = null;
        setClosureElapsed(0);
        if (closureTimerRef.current) {
          cancelAnimationFrame(closureTimerRef.current);
          closureTimerRef.current = null;
        }
        resetEyeClosure();
      }
    }
  }, [faceDetection.leftEyeOpen, faceDetection.rightEyeOpen, faceDetection.faceDetected, faceDetection.isCalibrated, screen, startEyeClosure, resetEyeClosure, confirmDrowsiness, startAlarm, buzzer]);

  useEffect(() => {
    if (screen !== 'drowsiness') {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      responseDeadlineRef.current = null;
      return;
    }

    responseDeadlineRef.current = Date.now() + RESPONSE_TIMEOUT_MS;
    responseTimerRef.current = window.setTimeout(() => {
      buzzer.stopBuzzer();
      escalateToSOS();
      setScreen('sos');
    }, RESPONSE_TIMEOUT_MS);

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
    };
  }, [screen, buzzer, escalateToSOS]);

  const handleDriverAwake = useCallback(() => {
    buzzer.stopBuzzer();
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    eyesClosedAtRef.current = null;
    setClosureElapsed(0);
    if (closureTimerRef.current) {
      cancelAnimationFrame(closureTimerRef.current);
      closureTimerRef.current = null;
    }
    stopAlarm();
    resetEyeClosure();
    setScreen('monitoring');
  }, [buzzer, stopAlarm, resetEyeClosure]);

  const handleNoResponse = useCallback(() => {
    buzzer.stopBuzzer();
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    escalateToSOS();
    setScreen('sos');
  }, [buzzer, escalateToSOS]);

  useEffect(() => {
    if (screen === 'sos' && gps.latitude !== 0) {
      const sosInterval = setInterval(() => {
        useStore.getState().updateDriverGPS(selectedDriver, selectedVehicle.id, {
          latitude: gps.latitude,
          longitude: gps.longitude,
          speed: gps.speed,
          heading: gps.heading,
        });
      }, 1000);
      return () => clearInterval(sosInterval);
    }
  }, [screen, gps, selectedDriver, selectedVehicle.id]);

  const endTrip = useCallback(() => {
    buzzer.stopBuzzer();
    gps.stopTracking();
    faceDetection.stopDetection();
    webrtc.disconnect();
    if (gpsSendIntervalRef.current) clearInterval(gpsSendIntervalRef.current);
    if (closureTimerRef.current) cancelAnimationFrame(closureTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    eyesClosedAtRef.current = null;
    setClosureElapsed(0);
    setScreen('permissions');
    setCameraPermission(false);
    setLocationPermission(false);
    setSoundPermission(false);
    setCameraError(null);
  }, [buzzer, gps, faceDetection, webrtc]);

  useEffect(() => {
    if (faceDetection.isCalibrated || faceDetection.faceDetected) {
      useStore.getState().updateMonitoringState({
        leftEyeOpen: faceDetection.leftEyeOpen,
        rightEyeOpen: faceDetection.rightEyeOpen,
        eyesOpen: faceDetection.eyesOpen,
        faceDetected: faceDetection.faceDetected,
        leftEyeState: faceDetection.leftEyeState,
        rightEyeState: faceDetection.rightEyeState,
        eyeState: faceDetection.eyeState,
        leftEAR: faceDetection.leftEAR,
        rightEAR: faceDetection.rightEAR,
        avgEAR: faceDetection.avgEAR,
        baselineEAR: faceDetection.baselineEAR,
        openThreshold: faceDetection.openThreshold,
        closedThreshold: faceDetection.closedThreshold,
        isCalibrated: faceDetection.isCalibrated,
        calibrationProgress: faceDetection.calibrationProgress,
        consecutiveClosedFrames: faceDetection.consecutiveClosedFrames,
        drowsinessScore: faceDetection.drowsinessScore,
        fps: faceDetection.fps,
        faceConfidence: faceDetection.faceConfidence,
      });
    }
  }, [
    faceDetection.leftEyeOpen, faceDetection.rightEyeOpen, faceDetection.eyesOpen,
    faceDetection.faceDetected, faceDetection.leftEyeState, faceDetection.rightEyeState,
    faceDetection.eyeState, faceDetection.leftEAR, faceDetection.rightEAR,
    faceDetection.avgEAR, faceDetection.baselineEAR, faceDetection.openThreshold,
    faceDetection.closedThreshold, faceDetection.isCalibrated, faceDetection.calibrationProgress,
    faceDetection.consecutiveClosedFrames, faceDetection.drowsinessScore,
    faceDetection.fps, faceDetection.faceConfidence,
  ]);

  useEffect(() => {
    return () => { endTrip(); };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const closureProgress = Math.min(closureElapsed / DROWSINESS_THRESHOLD_MS, 1);
  const closureSeconds = Math.floor(closureElapsed / 1000);
  const bothEyesClosed = !faceDetection.leftEyeOpen && !faceDetection.rightEyeOpen;

  const getCameraStatusText = () => {
    if (faceDetection.cameraState === 'active') return { text: 'Camera Connected', color: 'text-green-400', dot: 'bg-green-400' };
    if (faceDetection.cameraState === 'connecting') return { text: 'Connecting Camera', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' };
    if (faceDetection.cameraState === 'error') return { text: 'Camera Error', color: 'text-red-400', dot: 'bg-red-400' };
    if (faceDetection.cameraState === 'stopped') return { text: 'Camera Stopped', color: 'text-gray-400', dot: 'bg-gray-400' };
    return { text: 'Camera Idle', color: 'text-gray-400', dot: 'bg-gray-400' };
  };

  const cameraStatus = getCameraStatusText();

  const eyeStateColor = (ear: number) => {
    if (ear >= faceDetection.openThreshold) return 'text-green-400';
    if (ear <= faceDetection.closedThreshold) return 'text-red-400';
    return 'text-amber-400';
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col" style={{ maxWidth: '430px', margin: '0 auto' }}>
      <header className="bg-navy-900/80 backdrop-blur-sm px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">SMART ROUTE</h1>
            <p className="text-[10px] text-gray-400">DRIVER MODE</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-[10px] text-gray-400">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {screen === 'permissions' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-green-400">DRIVER SAFETY SYSTEM</h2>
            <p className="text-xs text-gray-400 mt-1">Tap below to enable camera + GPS + alerts</p>
          </div>

          <div className="w-full space-y-3">
            <div className="bg-navy-800/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-electric-400" />
                <span className="text-xs text-gray-300">Camera (face detection)</span>
                {cameraPermission && <CheckCircle className="w-3 h-3 text-green-400 ml-auto" />}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-electric-400" />
                <span className="text-xs text-gray-300">GPS (location tracking)</span>
                {locationPermission && <CheckCircle className="w-3 h-3 text-green-400 ml-auto" />}
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-electric-400" />
                <span className="text-xs text-gray-300">Sound (drowsiness alarm)</span>
                {soundPermission && <CheckCircle className="w-3 h-3 text-green-400 ml-auto" />}
              </div>
            </div>

            {cameraError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                <p className="text-[10px] text-red-400">{cameraError}</p>
              </div>
            )}

            <div className="bg-navy-800/50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Vehicle</p>
              <p className="text-sm font-bold">{selectedVehicle.id} — {selectedVehicle.plateNumber}</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Driver</p>
              <p className="text-sm font-bold">{driver?.fullName || 'Select Driver'}</p>
            </div>
          </div>

          <button
            onClick={requestAllPermissions}
            disabled={isRequesting}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 transition-all"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Requesting permissions...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> ALLOW & START
              </>
            )}
          </button>
        </div>
      )}

      {screen === 'monitoring' && (
        <div className="flex-1 flex flex-col">
          <div className="relative bg-black" style={{ height: '280px' }}>
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
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: 'scaleX(-1)',
              }}
            />

            {faceDetection.isModelLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/90">
                <div className="w-10 h-10 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-electric-400 font-bold">Loading AI Model...</p>
                <p className="text-[10px] text-gray-400 mt-1">First load takes 5-10 seconds</p>
              </div>
            )}

            {faceDetection.error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 p-4">
                <XCircle className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-xs text-red-400 font-bold text-center">{faceDetection.error}</p>
              </div>
            )}

            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${faceDetection.faceDetected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className="text-[9px]">{faceDetection.faceDetected ? 'Face Detected' : 'No Face'}</span>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              <Eye className={`w-3 h-3 ${faceDetection.eyesOpen ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-[9px]">{faceDetection.eyesOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>

            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              {faceDetection.isModelReady && (
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraStatus.dot}`}></span>
                  <span className={`text-[9px] ${cameraStatus.color}`}>{cameraStatus.text}</span>
                </div>
              )}
              {faceDetection.isCalibrated && (
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-[9px] text-green-400">Calibrated</span>
                </div>
              )}
            </div>

            {!faceDetection.isCalibrated && faceDetection.faceDetected && faceDetection.isModelReady && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-electric-400 font-bold">CALIBRATING</span>
                    <span className="text-[9px] text-gray-400">{Math.round((faceDetection.calibrationProgress || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-electric-500 rounded-full transition-all duration-200"
                      style={{ width: `${(faceDetection.calibrationProgress || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 space-y-3">
            {bothEyesClosed && faceDetection.faceDetected && faceDetection.isCalibrated ? (
              <div className="bg-orange-600/20 border border-orange-600/30 rounded-xl p-4 text-center">
                <p className="text-orange-400 text-lg font-black">EYES CLOSED</p>
                <p className="text-xs text-orange-300 mt-1">Monitoring drowsiness timer</p>
              </div>
            ) : faceDetection.isCalibrated && faceDetection.faceDetected ? (
              <div className="bg-green-600/20 border border-green-600/30 rounded-xl p-4 text-center">
                <p className="text-green-400 text-lg font-black">DRIVER SAFE</p>
                <p className="text-xs text-green-300/70 mt-1">Eyes open — system monitoring</p>
              </div>
            ) : (
              <div className="bg-gray-600/20 border border-gray-600/30 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm font-bold">Waiting for face detection...</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-navy-800/50 rounded-xl p-2 text-center">
                <Eye className={`w-4 h-4 mx-auto mb-0.5 ${faceDetection.leftEyeOpen ? 'text-green-400' : 'text-red-400'}`} />
                <p className="text-[9px] text-gray-400">Left Eye</p>
                <p className={`text-[10px] font-bold ${faceDetection.leftEyeOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {faceDetection.leftEyeOpen ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <div className="bg-navy-800/50 rounded-xl p-2 text-center">
                <Eye className={`w-4 h-4 mx-auto mb-0.5 ${faceDetection.rightEyeOpen ? 'text-green-400' : 'text-red-400'}`} />
                <p className="text-[9px] text-gray-400">Right Eye</p>
                <p className={`text-[10px] font-bold ${faceDetection.rightEyeOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {faceDetection.rightEyeOpen ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <div className="bg-navy-800/50 rounded-xl p-2 text-center">
                <Navigation className="w-4 h-4 mx-auto mb-0.5 text-electric-400" />
                <p className="text-[9px] text-gray-400">Speed</p>
                <p className="text-[10px] font-bold">{Math.round(gps.speed * 3.6)} km/h</p>
              </div>
            </div>

            {faceDetection.isCalibrated && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy-800/50 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-gray-400">EAR</p>
                  <p className={`text-sm font-mono font-bold ${
                    faceDetection.avgEAR >= faceDetection.openThreshold ? 'text-green-400' :
                    faceDetection.avgEAR <= faceDetection.closedThreshold ? 'text-red-400' : 'text-amber-400'
                  }`}>{faceDetection.avgEAR.toFixed(3)}</p>
                </div>
                <div className="bg-navy-800/50 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-gray-400">Baseline</p>
                  <p className="text-sm font-mono font-bold text-gray-300">{faceDetection.baselineEAR.toFixed(3)}</p>
                </div>
              </div>
            )}

            {bothEyesClosed && faceDetection.faceDetected && faceDetection.isCalibrated && (
              <div className="bg-navy-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-400">CONTINUOUS CLOSURE TIMER</p>
                  <p className="text-xs font-mono font-bold text-orange-400">
                    {formatTime(closureElapsed)} / 00:05
                  </p>
                </div>
                <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      closureProgress >= 1 ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${closureProgress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">{closureSeconds} / 5 Seconds</p>
              </div>
            )}

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full py-2 bg-navy-800/50 hover:bg-navy-700/50 rounded-xl text-[10px] text-gray-400 flex items-center justify-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
              {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </button>

            {showDiagnostics && (
              <div className="bg-navy-900/80 border border-white/10 rounded-xl p-3 space-y-3">
                <p className="text-[10px] text-electric-400 font-bold">DASHCAM EAR DIAGNOSTICS</p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                    <p className="text-[9px] text-gray-400">Camera</p>
                    <p className={`text-[10px] font-bold ${faceDetection.cameraState === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                      {faceDetection.cameraState === 'active' ? 'ACTIVE' : faceDetection.cameraState}
                    </p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                    <p className="text-[9px] text-gray-400">Face</p>
                    <p className={`text-[10px] font-bold ${faceDetection.faceDetected ? 'text-green-400' : 'text-red-400'}`}>
                      {faceDetection.faceDetected ? 'DETECTED' : 'MISSING'}
                    </p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                    <p className="text-[9px] text-gray-400">Calibrated</p>
                    <p className={`text-[10px] font-bold ${faceDetection.isCalibrated ? 'text-green-400' : 'text-amber-400'}`}>
                      {faceDetection.isCalibrated ? 'YES' : `${Math.round(faceDetection.calibrationProgress * 100)}%`}
                    </p>
                  </div>
                </div>

                {faceDetection.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                    <p className="text-[9px] text-red-400 font-bold">ERROR</p>
                    <p className="text-[10px] text-red-300">{faceDetection.error}</p>
                  </div>
                )}

                {/* RAW BOOLEAN STATES */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-gray-400">leftClosedNow (raw)</p>
                    <p className={`text-[10px] font-mono font-bold ${!faceDetection.leftEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {String(!faceDetection.leftEyeOpen)}
                    </p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-gray-400">rightClosedNow (raw)</p>
                    <p className={`text-[10px] font-mono font-bold ${!faceDetection.rightEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {String(!faceDetection.rightEyeOpen)}
                    </p>
                  </div>
                </div>

                {/* LEFT EYE */}
                <div className={`rounded-xl p-3 border ${!faceDetection.leftEyeOpen ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-white">LEFT EYE</p>
                    <p className={`text-[11px] font-black ${!faceDetection.leftEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {faceDetection.leftEyeState === 'unknown' ? 'UNKNOWN' : !faceDetection.leftEyeOpen ? 'CLOSED' : 'OPEN'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-gray-400 w-8">EAR:</span>
                    <span className={`text-sm font-mono font-bold ${!faceDetection.leftEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {faceDetection.leftEAR.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-gray-400 w-8">Thresh:</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {faceDetection.closedThreshold.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full h-2 dark:bg-navy-700 bg-surface-200 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${!faceDetection.leftEyeOpen ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(faceDetection.leftEAR / 0.5, 1) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-400"
                      style={{ left: `${Math.min(faceDetection.closedThreshold / 0.5, 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-gray-500 mt-0.5">
                    EAR {faceDetection.leftEAR.toFixed(3)} {faceDetection.leftEAR < faceDetection.closedThreshold ? '<' : '>'} Threshold {faceDetection.closedThreshold.toFixed(3)} → {!faceDetection.leftEyeOpen ? 'CLOSED' : 'OPEN'}
                  </p>
                </div>

                {/* RIGHT EYE */}
                <div className={`rounded-xl p-3 border ${!faceDetection.rightEyeOpen ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-white">RIGHT EYE</p>
                    <p className={`text-[11px] font-black ${!faceDetection.rightEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {faceDetection.rightEyeState === 'unknown' ? 'UNKNOWN' : !faceDetection.rightEyeOpen ? 'CLOSED' : 'OPEN'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-gray-400 w-8">EAR:</span>
                    <span className={`text-sm font-mono font-bold ${!faceDetection.rightEyeOpen ? 'text-red-400' : 'text-green-400'}`}>
                      {faceDetection.rightEAR.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-gray-400 w-8">Thresh:</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {faceDetection.closedThreshold.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full h-2 dark:bg-navy-700 bg-surface-200 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${!faceDetection.rightEyeOpen ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(faceDetection.rightEAR / 0.5, 1) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-400"
                      style={{ left: `${Math.min(faceDetection.closedThreshold / 0.5, 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-gray-500 mt-0.5">
                    EAR {faceDetection.rightEAR.toFixed(3)} {faceDetection.rightEAR < faceDetection.closedThreshold ? '<' : '>'} Threshold {faceDetection.closedThreshold.toFixed(3)} → {!faceDetection.rightEyeOpen ? 'CLOSED' : 'OPEN'}
                  </p>
                </div>

                {/* SUMMARY */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-gray-400">Avg EAR</p>
                    <p className={`text-xs font-mono font-bold ${faceDetection.avgEAR < faceDetection.closedThreshold ? 'text-red-400' : 'text-green-400'}`}>
                      {faceDetection.avgEAR.toFixed(3)}
                    </p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-gray-400">Consec Closed</p>
                    <p className={`text-xs font-mono font-bold ${faceDetection.consecutiveClosedFrames > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                      {faceDetection.consecutiveClosedFrames}
                    </p>
                  </div>
                  <div className="dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-gray-400">FPS</p>
                    <p className="text-xs font-mono font-bold text-gray-300">{faceDetection.fps}</p>
                  </div>
                </div>

                <button
                  onClick={faceDetection.recalibrate}
                  className="w-full py-2 bg-electric-600/20 hover:bg-electric-600/30 rounded-lg text-[10px] text-electric-400 font-bold transition-colors"
                >
                  Recalibrate
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={faceDetection.forceCloseEyes}
                    className="py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-[10px] text-red-400 font-bold transition-colors"
                  >
                    Force CLOSED (Test)
                  </button>
                  <button
                    onClick={faceDetection.forceOpenEyes}
                    className="py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-[10px] text-green-400 font-bold transition-colors"
                  >
                    Force OPEN (Test)
                  </button>
                </div>
              </div>
            )}

            <div className="bg-navy-800/50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">GPS Location</p>
              <p className="text-xs font-bold">{gps.latitude.toFixed(6)}° N, {gps.longitude.toFixed(6)}° E</p>
              <p className="text-[10px] text-gray-400 mt-1">Accuracy: {gps.accuracy.toFixed(0)}m</p>
            </div>

            <div className="bg-navy-800/50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Current Route</p>
              <p className="text-xs font-bold">{selectedVehicle.routeName || 'Route A'}</p>
            </div>

            <button
              onClick={() => { setScreen('sos'); triggerSOS(); }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-5 h-5" /> SOS
            </button>

            <button onClick={endTrip} className="w-full py-2 bg-navy-800 hover:bg-navy-700 rounded-xl text-xs text-gray-400 transition-colors">
              End Trip
            </button>
          </div>
        </div>
      )}

      {screen === 'drowsiness' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6 bg-red-950/30">
          <div className="w-20 h-20 rounded-full bg-red-600/30 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-red-400">DROWSINESS DETECTED</h2>
            <p className="text-sm text-red-300 mt-1">Eyes closed for 5 continuous seconds</p>
          </div>
          <div className="bg-red-900/30 rounded-xl p-4 text-center w-full">
            <p className="text-xs text-gray-400">EYES CLOSED FOR</p>
            <p className="text-3xl font-mono font-bold text-red-400">05 SECONDS</p>
          </div>
          <div className="w-full bg-navy-800/50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-2">ARE YOU OKAY?</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400">Left: {faceDetection.leftEyeOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400">Right: {faceDetection.rightEyeOpen ? 'Open' : 'Closed'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-red-300">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold">ALARM ACTIVE</span>
          </div>
          <button
            onClick={handleDriverAwake}
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-5 h-5" /> I AM ALERT
          </button>
          <button
            onClick={handleNoResponse}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> EMERGENCY
          </button>
        </div>
      )}

      {screen === 'sos' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6 bg-red-950/50">
          <div className="w-20 h-20 rounded-full bg-red-600/40 flex items-center justify-center animate-pulse">
            <Phone className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-red-400">SOS ACTIVE</h2>
            <p className="text-sm text-red-300 mt-1">Emergency services notified</p>
          </div>
          <div className="w-full space-y-2">
            <div className="bg-red-900/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Vehicle</p>
              <p className="text-xs font-bold">{selectedVehicle.id}</p>
            </div>
            <div className="bg-red-900/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Driver</p>
              <p className="text-xs font-bold">{driver?.fullName || 'Unknown'}</p>
            </div>
            <div className="bg-red-900/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Incident</p>
              <p className="text-xs font-bold">Driver Eyes Closed for 5 Seconds</p>
            </div>
            <div className="bg-red-900/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">GPS Location (SinoTrack ST-901A)</p>
              <p className="text-xs font-bold">{gps.latitude.toFixed(6)}° N, {gps.longitude.toFixed(6)}° E</p>
            </div>
            <div className="bg-red-900/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Students On Board</p>
              <p className="text-xs font-bold">{selectedVehicle.currentStudents}</p>
            </div>
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 bg-green-900/30 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs">GPS sending every 1s</span>
            </div>
            <div className="flex items-center gap-2 bg-amber-900/30 rounded-xl p-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs">Awaiting admin response...</span>
            </div>
          </div>
          <button
            onClick={() => { setScreen('monitoring'); }}
            className="w-full py-3 bg-navy-800 hover:bg-navy-700 rounded-xl text-sm font-bold"
          >
            Cancel SOS
          </button>
        </div>
      )}

      <footer className="bg-navy-900/80 backdrop-blur-sm px-4 py-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${faceDetection.cameraState === 'active' ? 'bg-green-400' : faceDetection.cameraState === 'connecting' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${gps.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${faceDetection.isModelReady ? 'bg-green-400' : 'bg-red-400'}`}></span>
            </div>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${buzzer.isReady ? 'bg-green-400' : 'bg-red-400'}`}></span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="w-3 h-3 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${webrtc.connectionState === 'connected' ? 'bg-green-400' : webrtc.connectionState === 'connecting' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
            </div>
          </div>
          <span className="text-[9px] text-gray-500">{selectedVehicle.id}</span>
        </div>
      </footer>
    </div>
  );
}
