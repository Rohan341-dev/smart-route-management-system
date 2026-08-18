import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed Simulation */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-electric-400" />
            Driver Camera Feed — {activeDriver?.id || 'DRV-07'}
          </h3>
          <div className="relative bg-navy-800 rounded-2xl overflow-hidden aspect-video">
            {/* Simulated camera view */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-48 h-48 rounded-full border-4 ${
                monitoringState.drowsinessDetected ? 'border-red-500' :
                monitoringState.buzzerActive ? 'border-amber-500' :
                monitoringState.eyesOpen ? 'border-emerald-500' : 'border-orange-500'
              } flex items-center justify-center`}>
                {/* Face representation */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-navy-600 flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                  {/* Eyes */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center gap-6">
                    <div className={`w-4 h-3 rounded-full ${monitoringState.eyesOpen ? 'bg-white' : 'bg-navy-800 border border-white/30'}`}>
                      {monitoringState.eyesOpen && <div className="w-2 h-2 bg-navy-800 rounded-full mx-auto mt-0.5"></div>}
                    </div>
                    <div className={`w-4 h-3 rounded-full ${monitoringState.eyesOpen ? 'bg-white' : 'bg-navy-800 border border-white/30'}`}>
                      {monitoringState.eyesOpen && <div className="w-2 h-2 bg-navy-800 rounded-full mx-auto mt-0.5"></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                monitoringState.eyesOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'
              }`}>
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                {monitoringState.eyesOpen ? 'LIVE' : 'ALERT'}
              </span>
              <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">CAM-007</span>
            </div>

            {/* Eye closure timer */}
            {!monitoringState.eyesOpen && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className={`px-4 py-2 rounded-xl text-center ${
                  timer >= 5 ? 'bg-red-600' : timer >= 3 ? 'bg-amber-600' : 'bg-orange-600'
                }`}>
                  <p className="text-[10px] text-white/80">EYES CLOSED</p>
                  <p className="text-2xl font-bold text-white">{timer}:00</p>
                  {timer >= 3 && timer < 5 && <p className="text-[10px] text-white">WARNING — Stay alert!</p>}
                  {timer >= 5 && <p className="text-[10px] text-white font-bold">DROWSINESS DETECTED</p>}
                </div>
              </div>
            )}

            {monitoringState.eyesOpen && !monitoringState.drowsinessDetected && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className="px-4 py-2 rounded-xl bg-emerald-600/80 text-center">
                  <p className="text-xs text-white font-medium">Driver Alert — Eyes Open</p>
                  <p className="text-[10px] text-white/80">Monitoring Active</p>
                </div>
              </div>
            )}
          </div>

          {/* Eye closure progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Eye Closure Duration</span>
              <span>{timer}s / 5s</span>
            </div>
            <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timer >= 5 ? 'bg-red-500' : timer >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(timer / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Monitoring Panel */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
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
                  <p className="text-sm font-bold text-white">
                    {monitoringState.drowsinessDetected ? 'DROWSINESS DETECTED' :
                     monitoringState.buzzerActive ? 'BUZZER ACTIVE' :
                     monitoringState.eyesOpen ? 'ALERT' : 'EYES CLOSED'}
                  </p>
                  <p className="text-xs text-gray-300">Driver: {activeDriver?.fullName || 'Suresh Magar'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[10px] text-gray-400">Eyes</p>
                <p className={`text-sm font-bold ${monitoringState.eyesOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monitoringState.eyesOpen ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[10px] text-gray-400">Attention</p>
                <p className={`text-sm font-bold ${
                  monitoringState.attention === 'normal' ? 'text-emerald-400' :
                  monitoringState.attention === 'distracted' ? 'text-amber-400' : 'text-red-400'
                }`}>{monitoringState.attention}</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[10px] text-gray-400">Safety Score</p>
                <p className="text-sm font-bold text-white">{activeDriver?.safetyScore || 91}/100</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[10px] text-gray-400">Blink Frequency</p>
                <p className="text-sm font-bold text-white">{monitoringState.blinkFrequency} bpm</p>
              </div>
            </div>
          </div>

          {/* AI Detection Workflow */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
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
                    item.status ? 'bg-emerald-500' : 'bg-navy-600'
                  }`}>
                    {item.status ? <CheckCircle className="w-3.5 h-3.5 text-white" /> :
                     <span className="text-[10px] text-gray-400 font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-xs ${item.status ? 'text-emerald-400' : 'text-gray-400'}`}>{item.step}</span>
                  {index < 6 && <div className={`flex-1 h-0.5 ${item.status ? 'bg-emerald-500/30' : 'bg-navy-600'}`}></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {(monitoringState.buzzerActive || monitoringState.drowsinessDetected) && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Driver Response Required</h3>
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
              <p className="text-xs text-gray-300">Emergency escalation in progress — {activeSOS.escalationLevel.toUpperCase()}</p>
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
