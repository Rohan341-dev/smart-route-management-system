import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import LiveCameraFeed from '../components/LiveCameraFeed';
import {
  Eye, EyeOff, AlertTriangle, CheckCircle, Shield, Activity, Clock,
  RotateCcw, Zap, Volume2, VolumeX, Monitor, ChevronDown, ChevronUp,
  Settings, Info
} from 'lucide-react';

const DROWSINESS_THRESHOLD_MS = 5000;

export default function DriverMonitoring() {
  const {
    monitoringState, drivers, sosAlerts,
    simulateDrowsiness, triggerBuzzer, driverResponds, driverNoResponse,
    resolveDriverEmergency, startEyeClosure, resetEyeClosure, confirmDrowsiness,
    startAlarm, stopAlarm, escalateToSOS,
  } = useStore();

  const [demoTimer, setDemoTimer] = useState(0);
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const demoTimerRef = useRef<number | null>(null);
  const demoClosedAtRef = useRef<number | null>(null);

  const activeDriver = drivers.find(d => d.id === 'DRV-07');
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  const monitorState = monitoringState.monitoringState;
  const bothEyesClosed = !monitoringState.leftEyeOpen && !monitoringState.rightEyeOpen;
  const closureDuration = monitoringState.closureDuration || 0;
  const closureProgress = Math.min(closureDuration / DROWSINESS_THRESHOLD_MS, 1);
  const closureSeconds = Math.floor(closureDuration / 1000);

  const stateConfig: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
    initializing: { color: 'text-gray-400', bg: 'bg-gray-500', border: 'border-gray-500/30', icon: '⚙', label: 'INITIALIZING' },
    no_face: { color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30', icon: '👤', label: 'NO FACE DETECTED' },
    monitoring: { color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30', icon: '👁', label: 'MONITORING' },
    eyes_closed: { color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30', icon: '😴', label: 'EYES CLOSED' },
    drowsiness_confirmed: { color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/30', icon: '🚨', label: 'DROWSINESS CONFIRMED' },
    alarm_active: { color: 'text-red-500', bg: 'bg-red-600', border: 'border-red-600/30', icon: '🔊', label: 'ALARM ACTIVE' },
    awaiting_response: { color: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30', icon: '⏳', label: 'AWAITING RESPONSE' },
    sos_active: { color: 'text-red-600', bg: 'bg-red-700', border: 'border-red-700/30', icon: '🆘', label: 'SOS ACTIVE' },
    resolved: { color: 'text-green-400', bg: 'bg-green-500', border: 'border-green-500/30', icon: '✅', label: 'RESOLVED' },
  };

  const currentState = stateConfig[monitorState] || stateConfig.monitoring;

  const demoSimulateEyesClosed = useCallback(() => {
    const now = Date.now();
    demoClosedAtRef.current = now;
    setDemoTimerRunning(true);
    startEyeClosure();

    const tick = () => {
      if (!demoClosedAtRef.current) return;
      const elapsed = Date.now() - demoClosedAtRef.current;
      setDemoTimer(elapsed);

      if (elapsed >= DROWSINESS_THRESHOLD_MS) {
        confirmDrowsiness();
        setDemoTimerRunning(false);
        demoClosedAtRef.current = null;
        return;
      }
      demoTimerRef.current = requestAnimationFrame(tick);
    };
    demoTimerRef.current = requestAnimationFrame(tick);
  }, [startEyeClosure, confirmDrowsiness]);

  const demoOpenEyes = useCallback(() => {
    if (demoTimerRef.current) {
      cancelAnimationFrame(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    demoClosedAtRef.current = null;
    setDemoTimer(0);
    setDemoTimerRunning(false);
    resetEyeClosure();
  }, [resetEyeClosure]);

  const demoTriggerDrowsiness = useCallback(() => {
    demoOpenEyes();
    setTimeout(() => {
      triggerBuzzer();
      startAlarm();
    }, 200);
  }, [demoOpenEyes, triggerBuzzer, startAlarm]);

  const demoReset = useCallback(() => {
    if (demoTimerRef.current) {
      cancelAnimationFrame(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    demoClosedAtRef.current = null;
    setDemoTimer(0);
    setDemoTimerRunning(false);
    resolveDriverEmergency();
  }, [resolveDriverEmergency]);

  const handleDriverResponds = useCallback(() => {
    stopAlarm();
    driverResponds();
    demoOpenEyes();
  }, [stopAlarm, driverResponds, demoOpenEyes]);

  const handleNoResponse = useCallback(() => {
    escalateToSOS();
    driverNoResponse();
  }, [escalateToSOS, driverNoResponse]);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current) cancelAnimationFrame(demoTimerRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const eyeStateColor = (ear: number) => {
    if (ear >= monitoringState.openThreshold) return 'text-emerald-400';
    if (ear <= monitoringState.closedThreshold) return 'text-red-400';
    return 'text-amber-400';
  };

  const eyeStateLabel = (ear: number) => {
    if (ear >= monitoringState.openThreshold) return 'OPEN';
    if (ear <= monitoringState.closedThreshold) return 'CLOSED';
    return 'CLOSING';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <LiveCameraFeed vehicleId="BUS-107" driverName={activeDriver?.fullName || 'Suresh Magar'} />

        <div className="space-y-4">
          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold dark:text-white text-surface-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-electric-400" />
                Driver Safety Status
              </h3>
              {monitoringState.isCalibrated && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Calibrated
                </span>
              )}
            </div>

            <div className={`p-4 rounded-xl mb-4 border ${
              monitorState === 'sos_active' || monitorState === 'alarm_active' ? 'bg-red-500/20 border-red-500/30' :
              monitorState === 'eyes_closed' ? 'bg-orange-500/20 border-orange-500/30' :
              monitorState === 'drowsiness_confirmed' ? 'bg-red-500/20 border-red-500/30' :
              'bg-emerald-500/20 border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentState.bg}`}>
                  <span className="text-xl">{currentState.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${currentState.color}`}>{currentState.label}</p>
                  <p className="text-xs dark:text-gray-300 text-surface-600">{activeDriver?.fullName || 'Suresh Magar'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] dark:text-gray-400 text-surface-500">EAR</p>
                  <p className={`text-sm font-mono font-bold ${eyeStateColor(monitoringState.avgEAR)}`}>
                    {monitoringState.avgEAR.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-1">Left Eye</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {monitoringState.leftEyeOpen ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                    <p className={`text-sm font-bold ${monitoringState.leftEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                      {monitoringState.leftEyeOpen ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${eyeStateColor(monitoringState.leftEAR)}`}>
                    {monitoringState.leftEAR.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-1">Right Eye</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {monitoringState.rightEyeOpen ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                    <p className={`text-sm font-bold ${monitoringState.rightEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                      {monitoringState.rightEyeOpen ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${eyeStateColor(monitoringState.rightEAR)}`}>
                    {monitoringState.rightEAR.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Attention</p>
                <p className={`text-sm font-bold ${
                  monitoringState.attention === 'normal' ? 'text-emerald-400' :
                  monitoringState.attention === 'distracted' ? 'text-amber-400' : 'text-red-400'
                }`}>{monitoringState.attention}</p>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Safety Score</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{activeDriver?.safetyScore || 91}/100</p>
              </div>
            </div>

            {bothEyesClosed && monitoringState.faceDetected && monitorState === 'eyes_closed' && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] dark:text-orange-300 text-orange-700 font-bold">CONTINUOUS CLOSURE TIMER</p>
                  <p className="text-sm font-mono font-bold text-orange-400">
                    {formatTime(closureDuration)} / 00:05
                  </p>
                </div>
                <div className="w-full h-3 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      closureProgress >= 1 ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${closureProgress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] dark:text-orange-300 text-orange-700 mt-1 text-center">
                  {closureSeconds} / 5 Seconds
                </p>
              </div>
            )}

            {(monitorState === 'alarm_active' || monitorState === 'drowsiness_confirmed') && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {monitoringState.buzzerActive ? <Volume2 className="w-4 h-4 text-red-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                  <p className="text-xs font-bold text-red-400">DROWSINESS DETECTED</p>
                </div>
                <p className="text-xs dark:text-gray-300 text-surface-600">Eyes closed for 5 continuous seconds</p>
                <div className="w-full h-3 bg-navy-700 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
                </div>
                <p className="text-[10px] dark:text-red-300 text-red-700 mt-1 text-center">5 / 5 Seconds</p>
              </div>
            )}

            {!monitoringState.isCalibrated && monitoringState.faceDetected && (
              <div className="bg-electric-500/10 border border-electric-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-electric-400 animate-spin" />
                  <p className="text-xs font-bold text-electric-400">CALIBRATING</p>
                </div>
                <p className="text-[10px] dark:text-gray-300 text-surface-600 mb-2">Please keep your eyes open and look at the camera</p>
                <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-electric-500 rounded-full transition-all duration-300"
                    style={{ width: `${(monitoringState.calibrationProgress || 0) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] dark:text-electric-300 text-electric-700 mt-1 text-center">
                  {Math.round((monitoringState.calibrationProgress || 0) * 100)}% - Establishing baseline
                </p>
              </div>
            )}
          </div>

          <div className="glass-card p-4 md:p-6">
            <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-electric-400" />
              AI Detection Pipeline
            </h3>
            <div className="space-y-2">
              {[
                { step: 'Dash Camera', status: true },
                { step: 'Face Detection', status: monitoringState.faceDetected },
                { step: 'Eye Landmarks', status: monitoringState.faceDetected && monitoringState.isCalibrated },
                { step: 'EAR Calculation', status: monitoringState.isCalibrated },
                { step: 'Eye State Analysis', status: monitoringState.isCalibrated },
                { step: 'Both Eyes Closed', status: bothEyesClosed && monitoringState.faceDetected },
                { step: 'Closure Timer', status: monitorState === 'eyes_closed' },
                { step: 'Drowsiness Detection', status: monitorState === 'drowsiness_confirmed' || monitorState === 'alarm_active' },
                { step: 'Buzzer Alert', status: monitoringState.buzzerActive },
                { step: 'Driver Response', status: monitoringState.driverResponded === true },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.status ? 'bg-emerald-500' : 'dark:bg-navy-600 bg-surface-200'
                  }`}>
                    {item.status ? <CheckCircle className="w-3 h-3 text-white" /> :
                     <span className="text-[9px] dark:text-gray-400 text-surface-500 font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-[11px] ${item.status ? 'text-emerald-400' : 'dark:text-gray-400 text-surface-500'}`}>{item.step}</span>
                  {index < 9 && <div className={`flex-1 h-0.5 ${item.status ? 'bg-emerald-500/30' : 'dark:bg-navy-600 bg-surface-200'}`}></div>}
                </div>
              ))}
            </div>
          </div>

          {(monitoringState.buzzerActive || monitorState === 'drowsiness_confirmed' || monitorState === 'alarm_active') && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Driver Response Required
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDriverResponds} className="btn-success flex items-center justify-center gap-2 py-3">
                  <CheckCircle className="w-4 h-4" />
                  I Am Alert
                </button>
                <button onClick={handleNoResponse} className="btn-danger flex items-center justify-center gap-2 py-3">
                  <AlertTriangle className="w-4 h-4" />
                  No Response (SOS)
                </button>
              </div>
            </div>
          )}

          {activeSOS && (
            <div className="glass-card p-4 bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">SOS ACTIVE</span>
              </div>
              <p className="text-xs dark:text-gray-300 text-surface-600">Emergency escalation in progress — {activeSOS.escalationLevel.toUpperCase()}</p>
              <button onClick={() => useStore.getState().setCurrentPage('sos')} className="btn-danger w-full mt-3 text-xs">
                View SOS Center
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-electric-400" />
            Live Diagnostics
          </h3>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1 text-[10px] dark:text-gray-400 text-surface-500 hover:text-white transition-colors"
          >
            {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4">
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Camera</p>
            <p className={`text-[10px] font-bold ${
              monitoringState.cameraState === 'active' ? 'text-emerald-400' :
              monitoringState.cameraState === 'connecting' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {monitoringState.cameraState === 'active' ? 'CONNECTED' :
               monitoringState.cameraState === 'connecting' ? 'CONNECTING' : 'DISCONNECTED'}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Face</p>
            <p className={`text-[10px] font-bold ${monitoringState.faceDetected ? 'text-emerald-400' : 'text-red-400'}`}>
              {monitoringState.faceDetected ? 'DETECTED' : 'NOT DETECTED'}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Left Eye</p>
            <p className={`text-[10px] font-bold ${monitoringState.leftEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
              {monitoringState.leftEyeOpen ? 'OPEN' : 'CLOSED'}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Right Eye</p>
            <p className={`text-[10px] font-bold ${monitoringState.rightEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
              {monitoringState.rightEyeOpen ? 'OPEN' : 'CLOSED'}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Left EAR</p>
            <p className={`text-[10px] font-mono font-bold ${eyeStateColor(monitoringState.leftEAR)}`}>
              {monitoringState.leftEAR.toFixed(3)}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Right EAR</p>
            <p className={`text-[10px] font-mono font-bold ${eyeStateColor(monitoringState.rightEAR)}`}>
              {monitoringState.rightEAR.toFixed(3)}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Avg EAR</p>
            <p className={`text-[10px] font-mono font-bold ${eyeStateColor(monitoringState.avgEAR)}`}>
              {monitoringState.avgEAR.toFixed(3)}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
            <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">Thresholds</p>
            <p className="text-[10px] font-mono font-bold text-gray-300">
              {monitoringState.openThreshold.toFixed(3)} / {monitoringState.closedThreshold.toFixed(3)}
            </p>
          </div>
        </div>

        {showDebug && (
          <div className="border-t dark:border-white/5 border-surface-200 pt-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { label: 'FPS', value: monitoringState.fps || 0, color: 'dark:text-white text-surface-900' },
                { label: 'Face Confidence', value: `${monitoringState.faceConfidence || 0}%`, color: 'dark:text-white text-surface-900' },
                { label: 'Left EAR', value: monitoringState.leftEAR.toFixed(3), color: eyeStateColor(monitoringState.leftEAR) },
                { label: 'Right EAR', value: monitoringState.rightEAR.toFixed(3), color: eyeStateColor(monitoringState.rightEAR) },
                { label: 'Average EAR', value: monitoringState.avgEAR.toFixed(3), color: eyeStateColor(monitoringState.avgEAR) },
                { label: 'Baseline EAR', value: monitoringState.baselineEAR.toFixed(3), color: 'text-electric-400' },
                { label: 'Open Threshold', value: monitoringState.openThreshold.toFixed(3), color: 'text-emerald-400' },
                { label: 'Closed Threshold', value: monitoringState.closedThreshold.toFixed(3), color: 'text-red-400' },
                { label: 'Consecutive Closed', value: monitoringState.consecutiveClosedFrames, color: monitoringState.consecutiveClosedFrames > 0 ? 'text-amber-400' : 'dark:text-white text-surface-900' },
                { label: 'Eye State', value: monitoringState.eyeState.toUpperCase(), color: monitoringState.eyeState === 'open' ? 'text-emerald-400' : monitoringState.eyeState === 'closing' ? 'text-amber-400' : 'text-red-400' },
                { label: 'Left Eye State', value: monitoringState.leftEyeState.toUpperCase(), color: monitoringState.leftEyeState === 'open' ? 'text-emerald-400' : monitoringState.leftEyeState === 'closing' ? 'text-amber-400' : 'text-red-400' },
                { label: 'Right Eye State', value: monitoringState.rightEyeState.toUpperCase(), color: monitoringState.rightEyeState === 'open' ? 'text-emerald-400' : monitoringState.rightEyeState === 'closing' ? 'text-amber-400' : 'text-red-400' },
                { label: 'Calibrated', value: monitoringState.isCalibrated ? 'YES' : 'NO', color: monitoringState.isCalibrated ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Calibration', value: `${Math.round((monitoringState.calibrationProgress || 0) * 100)}%`, color: 'text-electric-400' },
                { label: 'Closure Duration', value: `${Math.floor((monitoringState.closureDuration || 0) / 1000)}s`, color: 'text-amber-400' },
                { label: 'Drowsiness Score', value: (monitoringState.drowsinessScore || 0).toFixed(2), color: monitoringState.drowsinessScore > 0.5 ? 'text-red-400' : 'dark:text-white text-surface-900' },
              ].map(item => (
                <div key={item.label} className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500 mb-0.5">{item.label}</p>
                  <p className={`text-xs font-mono font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 dark:bg-navy-700/20 bg-surface-50 rounded-xl p-3">
              <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-2 font-medium">EAR Visualization</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Left', ear: monitoringState.leftEAR },
                  { label: 'Right', ear: monitoringState.rightEAR },
                  { label: 'Avg', ear: monitoringState.avgEAR },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-[10px] dark:text-gray-400 text-surface-500 w-8">{item.label}</span>
                    <div className="flex-1 h-2 dark:bg-navy-600 bg-surface-200 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${
                          item.ear >= monitoringState.openThreshold ? 'bg-emerald-500' :
                          item.ear <= monitoringState.closedThreshold ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(item.ear / 0.5, 1) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-px bg-white/50"
                        style={{ left: `${Math.min(monitoringState.closedThreshold / 0.5, 1) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-px bg-white/30"
                        style={{ left: `${Math.min(monitoringState.openThreshold / 0.5, 1) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono font-bold w-12 text-right ${eyeStateColor(item.ear)}`}>
                      {item.ear.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-4 md:p-6">
        <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-electric-400" />
          Simulation Controls
        </h3>
        <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-4">
          Simulate driver drowsiness detection flow for testing. Uses the same state machine as real camera detection.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <button
            onClick={demoSimulateEyesClosed}
            disabled={demoTimerRunning || monitorState === 'alarm_active' || monitorState === 'sos_active'}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <EyeOff className="w-4 h-4" />
            Eyes Closed
          </button>
          <button
            onClick={demoOpenEyes}
            disabled={!demoTimerRunning && monitorState !== 'eyes_closed'}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Open Eyes
          </button>
          <button
            onClick={demoTriggerDrowsiness}
            disabled={monitorState === 'alarm_active' || monitorState === 'sos_active'}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Trigger Drowsiness
          </button>
          <button
            onClick={demoReset}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {demoTimerRunning && (
          <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-orange-300 font-bold">SIMULATION TIMER RUNNING</p>
              <p className="text-sm font-mono font-bold text-orange-400">
                {formatTime(demoTimer)} / 00:05
              </p>
            </div>
            <div className="w-full h-3 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  (demoTimer / DROWSINESS_THRESHOLD_MS) >= 1 ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(demoTimer / DROWSINESS_THRESHOLD_MS, 1) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
