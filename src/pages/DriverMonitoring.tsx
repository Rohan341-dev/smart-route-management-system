import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import LiveCameraFeed from '../components/LiveCameraFeed';
import {
  Eye, EyeOff, AlertTriangle, CheckCircle, Shield, Activity, Clock,
  Play, Square, RotateCcw, Zap, Volume2, VolumeX, Monitor
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
  const demoTimerRef = useRef<number | null>(null);
  const demoClosedAtRef = useRef<number | null>(null);

  const activeDriver = drivers.find(d => d.id === 'DRV-07');
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  const monitorState = monitoringState.monitoringState;
  const bothEyesClosed = !monitoringState.leftEyeOpen && !monitoringState.rightEyeOpen;
  const closureDuration = monitoringState.closureDuration || 0;
  const closureProgress = Math.min(closureDuration / DROWSINESS_THRESHOLD_MS, 1);
  const closureSeconds = Math.floor(closureDuration / 1000);

  const stateConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    initializing: { color: 'text-gray-400', bg: 'bg-gray-500', icon: '⚙', label: 'INITIALIZING' },
    no_face: { color: 'text-amber-400', bg: 'bg-amber-500', icon: '👤', label: 'NO FACE DETECTED' },
    monitoring: { color: 'text-emerald-400', bg: 'bg-emerald-500', icon: '👁', label: 'MONITORING' },
    eyes_closed: { color: 'text-orange-400', bg: 'bg-orange-500', icon: '😴', label: 'EYES CLOSED' },
    drowsiness_confirmed: { color: 'text-red-400', bg: 'bg-red-500', icon: '🚨', label: 'DROWSINESS CONFIRMED' },
    alarm_active: { color: 'text-red-500', bg: 'bg-red-600', icon: '🔊', label: 'ALARM ACTIVE' },
    awaiting_response: { color: 'text-yellow-400', bg: 'bg-yellow-500', icon: '⏳', label: 'AWAITING RESPONSE' },
    sos_active: { color: 'text-red-600', bg: 'bg-red-700', icon: '🆘', label: 'SOS ACTIVE' },
    resolved: { color: 'text-green-400', bg: 'bg-green-500', icon: '✅', label: 'RESOLVED' },
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <LiveCameraFeed vehicleId="BUS-107" driverName={activeDriver?.fullName || 'Suresh Magar'} />

        <div className="space-y-4">
          <div className="glass-card p-4 md:p-6">
            <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-electric-400" />
              Driver Status
            </h3>

            <div className={`p-4 rounded-xl mb-4 ${
              monitorState === 'sos_active' || monitorState === 'alarm_active' ? 'bg-red-500/20 border border-red-500/30' :
              monitorState === 'eyes_closed' ? 'bg-orange-500/20 border border-orange-500/30' :
              monitorState === 'drowsiness_confirmed' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-emerald-500/20 border border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentState.bg}`}>
                  <span className="text-xl">{currentState.icon}</span>
                </div>
                <div>
                  <p className={`text-sm font-bold ${currentState.color}`}>
                    {currentState.label}
                  </p>
                  <p className="text-xs dark:text-gray-300 text-surface-600">
                    Driver: {activeDriver?.fullName || 'Suresh Magar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Left Eye</p>
                <div className="flex items-center gap-1">
                  {monitoringState.leftEyeOpen ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                  <p className={`text-sm font-bold ${monitoringState.leftEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monitoringState.leftEyeOpen ? 'Open' : 'Closed'}
                  </p>
                </div>
              </div>
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Right Eye</p>
                <div className="flex items-center gap-1">
                  {monitoringState.rightEyeOpen ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                  <p className={`text-sm font-bold ${monitoringState.rightEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monitoringState.rightEyeOpen ? 'Open' : 'Closed'}
                  </p>
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

            {monitorState === 'alarm_active' || monitorState === 'drowsiness_confirmed' ? (
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
            ) : null}
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
                { step: 'Eye Detection', status: monitoringState.faceDetected },
                { step: 'Both Eyes Closed', status: bothEyesClosed && monitoringState.faceDetected },
                { step: 'Eye Closure Timer', status: monitorState === 'eyes_closed' },
                { step: 'Drowsiness Detection', status: monitorState === 'drowsiness_confirmed' || monitorState === 'alarm_active' },
                { step: 'Buzzer Alert', status: monitoringState.buzzerActive },
                { step: 'Driver Response', status: monitoringState.driverResponded === true },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.status ? 'bg-emerald-500' : 'dark:bg-navy-600 bg-surface-200'
                  }`}>
                    {item.status ? <CheckCircle className="w-3.5 h-3.5 text-white" /> :
                     <span className="text-[10px] dark:text-gray-400 text-surface-500 font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-xs ${item.status ? 'text-emerald-400' : 'dark:text-gray-400 text-surface-500'}`}>{item.step}</span>
                  {index < 7 && <div className={`flex-1 h-0.5 ${item.status ? 'bg-emerald-500/30' : 'dark:bg-navy-600 bg-surface-200'}`}></div>}
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
        <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-electric-400" />
          Demo Controls
        </h3>
        <p className="text-[10px] dark:text-gray-400 text-surface-500 mb-4">
          Simulate driver drowsiness detection flow. Uses the same state machine as real camera detection.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={demoSimulateEyesClosed}
            disabled={demoTimerRunning || monitorState === 'alarm_active' || monitorState === 'sos_active'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <EyeOff className="w-4 h-4" />
            Simulate Eyes Closed
          </button>
          <button
            onClick={demoOpenEyes}
            disabled={!demoTimerRunning && monitorState !== 'eyes_closed'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Open Eyes
          </button>
          <button
            onClick={demoTriggerDrowsiness}
            disabled={monitorState === 'alarm_active' || monitorState === 'sos_active'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Trigger Drowsiness
          </button>
          <button
            onClick={demoReset}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Monitoring
          </button>
        </div>

        {demoTimerRunning && (
          <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-orange-300 font-bold">DEMO TIMER RUNNING</p>
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
            <p className="text-[10px] text-orange-300 mt-1 text-center">
              {Math.floor(demoTimer / 1000)} / 5 Seconds
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2">
            <p className="text-[9px] dark:text-gray-400 text-surface-500">STATE</p>
            <p className={`text-[10px] font-bold ${currentState.color}`}>{currentState.label}</p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2">
            <p className="text-[9px] dark:text-gray-400 text-surface-500">LEFT EYE</p>
            <p className={`text-[10px] font-bold ${monitoringState.leftEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
              {monitoringState.leftEyeOpen ? 'OPEN' : 'CLOSED'}
            </p>
          </div>
          <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-2">
            <p className="text-[9px] dark:text-gray-400 text-surface-500">RIGHT EYE</p>
            <p className={`text-[10px] font-bold ${monitoringState.rightEyeOpen ? 'text-emerald-400' : 'text-red-400'}`}>
              {monitoringState.rightEyeOpen ? 'OPEN' : 'CLOSED'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
