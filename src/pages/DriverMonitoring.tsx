import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Zap, Shield, Activity, Clock } from 'lucide-react';

export default function DriverMonitoring() {
  const { monitoringState, drivers, triggerBuzzer, driverResponds, driverNoResponse, simulateDrowsiness, sosAlerts } = useStore();
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeDriver = drivers.find(d => d.id === 'DRV-07');
  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  useEffect(() => {
    if (monitoringState.eyesOpen) {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev >= 5) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 5;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [monitoringState.eyesOpen]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">-
        {/* Live Camera Feed */}
        <LiveCameraFeed vehicleId="BUS-107" driverName={activeDriver?.fullName || 'Suresh Magar'} />

        {/* Monitoring Panel */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-electric-400" />
              Driver Status
            </h3>
            <div className={`p-4 rounded-xl mb-4 ${
              monitoringState.drowsinessDetected ? 'bg-red-500/20 border border-red-500/30' :
              monitoringState.buzzerActive ? 'bg-amber-500/20 border border-amber-500/30' :
              monitoringState.eyesOpen ? 'bg-emerald-500/20 border border-emerald-500/30' :
              'bg-orange-500/20 border border-orange-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  monitoringState.drowsinessDetected ? 'bg-red-500' :
                  monitoringState.buzzerActive ? 'bg-amber-500' :
                  monitoringState.eyesOpen ? 'bg-emerald-500' : 'bg-orange-500'
                }`}>
                  {monitoringState.eyesOpen ? <Eye className="w-6 h-6 text-white" /> : <EyeOff className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white text-surface-900">
                    {monitoringState.drowsinessDetected ? 'DROWSINESS DETECTED' :
                     monitoringState.buzzerActive ? 'BUZZER ACTIVE' :
                     monitoringState.eyesOpen ? 'ALERT' : 'EYES CLOSED'}
                  </p>
                  <p className="text-xs dark:text-gray-300 text-surface-600">Driver: {activeDriver?.fullName || 'Suresh Magar'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Eyes</p>
                <p className={`text-sm font-bold ${monitoringState.eyesOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monitoringState.eyesOpen ? 'Open' : 'Closed'}
                </p>
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
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Blink Frequency</p>
                <p className="text-sm font-bold dark:text-white text-surface-900">{monitoringState.blinkFrequency} bpm</p>
              </div>
            </div>
          </div>

          {/* AI Detection Workflow */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-electric-400" />
              AI Detection Pipeline
            </h3>
            <div className="space-y-2">
              {[
                { step: 'Dash Camera', status: true },
                { step: 'Face Detection', status: monitoringState.faceDetected },
                { step: 'Eye Detection', status: monitoringState.faceDetected },
                { step: 'Eye Closure Timer', status: !monitoringState.eyesOpen },
                { step: 'Drowsiness Detection', status: monitoringState.drowsinessDetected },
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
                  {index < 6 && <div className={`flex-1 h-0.5 ${item.status ? 'bg-emerald-500/30' : 'dark:bg-navy-600 bg-surface-200'}`}></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {(monitoringState.buzzerActive || monitoringState.drowsinessDetected) && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold dark:text-white text-surface-900 mb-3">Driver Response Required</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={driverResponds} className="btn-success flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Driver Responds
                </button>
                <button onClick={driverNoResponse} className="btn-danger flex items-center justify-center gap-2">
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
    </div>
  );
}
