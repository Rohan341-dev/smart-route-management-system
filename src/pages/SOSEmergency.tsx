import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Phone, MapPin, Clock, Shield, ArrowUp, CheckCircle, Navigation, Eye, Radio } from 'lucide-react';

export default function SOSEmergency() {
  const { sosAlerts, adminResponds, adminNoResponse, secondaryResponds, secondaryNoResponse, resolveEmergency, drivers, vehicles, decrementEscalationTimer } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const active = state.sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');
      if (active && active.escalationTimer > 0) {
        decrementEscalationTimer();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [decrementEscalationTimer]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-red-500/20 text-red-400 border-red-500/30',
      acknowledged: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      escalating: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      resolved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      false_alarm: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || colors.active;
  };

  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  return (
    <div className="space-y-6">
      {/* Active SOS Banner */}
      {activeSOS && (
        <div className="glass-card p-6 bg-red-500/10 border-2 border-red-500/50 sos-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-400">🚨 ACTIVE SOS EMERGENCY</h2>
                <p className="text-sm text-gray-300 mt-1">Vehicle: {activeSOS.vehicleId} | Driver: {activeSOS.driverId}</p>
                <p className="text-xs text-gray-400 mt-1">{activeSOS.reason}</p>
                <p className="text-xs text-gray-400">Location: {activeSOS.location.lat.toFixed(4)}°N, {activeSOS.location.lng.toFixed(4)}°E</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-navy-700/50 rounded-xl">
                <p className="text-[10px] text-gray-400">Escalation Level</p>
                <p className="text-lg font-bold text-amber-400">{activeSOS.escalationLevel.toUpperCase()}</p>
              </div>
              <div className="text-center px-4 py-2 bg-navy-700/50 rounded-xl">
                <p className="text-[10px] text-gray-400">Time Remaining</p>
                <p className={`text-lg font-bold ${activeSOS.escalationTimer <= 10 ? 'text-red-400' : 'text-amber-400'}`}>{activeSOS.escalationTimer}s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Tree */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="w-4 h-4 text-electric-400" />
          SOS Escalation Tree
        </h3>

        {sosAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">No Active Emergencies</h4>
            <p className="text-sm text-gray-400">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sosAlerts.map((sos) => {
              const driver = drivers.find(d => d.id === sos.driverId);
              return (
                <div key={sos.id} className={`rounded-2xl border p-6 ${
                  sos.status === 'active' ? 'bg-red-500/10 border-red-500/30' :
                  sos.status === 'escalating' ? 'bg-amber-500/10 border-amber-500/30' :
                  sos.status === 'acknowledged' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  'bg-navy-700/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`status-badge border ${getStatusBadge(sos.status)}`}>{sos.status.toUpperCase()}</span>
                      <span className="text-xs text-gray-400">{sos.id} — {sos.time}</span>
                    </div>
                    <span className="text-xs text-gray-400">{sos.vehicleId} — {driver?.fullName || sos.driverId}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Level 1 - School Admin */}
                    <div className={`rounded-xl p-4 border ${
                      sos.escalationLevel === 'primary' && !sos.primaryResponded
                        ? 'bg-amber-500/10 border-amber-500/30' : 'bg-navy-700/30 border-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Level 1 — School Admin</span>
                        {sos.primaryResponded ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Responded</span>
                        ) : sos.escalationLevel === 'primary' ? (
                          <span className="text-[10px] text-amber-400 animate-pulse">Waiting...</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Skipped</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{sos.primaryContact.name}</p>
                      <p className="text-[10px] text-gray-400">{sos.primaryContact.phone}</p>
                      {sos.escalationLevel === 'primary' && !sos.primaryResponded && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button onClick={adminResponds} className="btn-success text-[10px] py-1.5">Respond</button>
                          <button onClick={adminNoResponse} className="btn-danger text-[10px] py-1.5">No Response</button>
                        </div>
                      )}
                    </div>

                    {/* Level 2 - Secondary */}
                    <div className={`rounded-xl p-4 border ${
                      sos.escalationLevel === 'secondary' && !sos.secondaryResponded
                        ? 'bg-amber-500/10 border-amber-500/30' : 'bg-navy-700/30 border-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Level 2 — Secondary</span>
                        {sos.secondaryResponded ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Responded</span>
                        ) : sos.escalationLevel === 'secondary' ? (
                          <span className="text-[10px] text-amber-400 animate-pulse">Waiting...</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Waiting</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{sos.secondaryContact.name}</p>
                      <p className="text-[10px] text-gray-400">{sos.secondaryContact.phone}</p>
                      {sos.escalationLevel === 'secondary' && !sos.secondaryResponded && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button onClick={secondaryResponds} className="btn-success text-[10px] py-1.5">Respond</button>
                          <button onClick={secondaryNoResponse} className="btn-danger text-[10px] py-1.5">No Response</button>
                        </div>
                      )}
                    </div>

                    {/* Level 3 - Authority */}
                    <div className={`rounded-xl p-4 border ${
                      sos.escalationLevel === 'authority' && !sos.authorityResponded
                        ? 'bg-red-500/10 border-red-500/30' : 'bg-navy-700/30 border-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Level 3 — Authority</span>
                        {sos.authorityResponded ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Notified</span>
                        ) : sos.escalationLevel === 'authority' ? (
                          <span className="text-[10px] text-red-400 animate-pulse">EMERGENCY NOTIFIED</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Waiting</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{sos.authorityContact.name}</p>
                      <p className="text-[10px] text-gray-400">{sos.authorityContact.phone}</p>
                      {sos.escalationLevel === 'authority' && (
                        <div className="mt-3">
                          <div className="bg-red-500/20 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-red-400 font-bold">EMERGENCY AUTHORITY NOTIFIED</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <button onClick={() => useStore.getState().setCurrentPage('live-fleet')} className="btn-primary text-xs flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5" /> Track Vehicle
                    </button>
                    <button onClick={() => useStore.getState().setCurrentPage('driver-monitoring')} className="btn-primary text-xs flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" /> View Camera
                    </button>
                    <button onClick={resolveEmergency} className="btn-success text-xs flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Emergency
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency History */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white mb-4">Emergency Log</h3>
        <div className="space-y-2">
          {sosAlerts.map((sos) => (
            <div key={sos.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-700/30">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                sos.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {sos.status === 'resolved' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{sos.vehicleId} — {sos.reason}</p>
                <p className="text-[10px] text-gray-400">{sos.time} — {sos.status}</p>
              </div>
              <span className={`status-badge border text-[10px] ${getStatusBadge(sos.status)}`}>{sos.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
