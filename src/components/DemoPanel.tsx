import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronUp, ChevronDown, Play, Eye, EyeOff, AlertTriangle, Phone, PhoneOff, CheckCircle, Navigation, UserPlus, UserMinus, RotateCcw, Zap } from 'lucide-react';

export default function DemoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    simulateBusMovement, simulateDrowsiness, triggerBuzzer,
    driverResponds, driverNoResponse, triggerSOS,
    adminResponds, adminNoResponse, secondaryResponds, secondaryNoResponse,
    resolveEmergency, simulateRouteDeviation, simulateStudentPickup, simulateStudentDrop,
    monitoringState, sosAlerts
  } = useStore();

  const activeSOS = sosAlerts.find(s => s.status === 'active' || s.status === 'escalating');

  const sections = [
    {
      title: 'Bus Simulation',
      items: [
        { label: 'Simulate Bus Movement', icon: Navigation, action: simulateBusMovement, color: 'bg-electric-600 hover:bg-electric-700' },
        { label: 'Simulate Route Deviation', icon: AlertTriangle, action: simulateRouteDeviation, color: 'bg-amber-600 hover:bg-amber-700' },
      ]
    },
    {
      title: 'Driver Monitoring',
      items: [
        { label: 'Simulate Drowsiness', icon: EyeOff, action: simulateDrowsiness, color: 'bg-orange-600 hover:bg-orange-700' },
        { label: 'Trigger Buzzer', icon: Zap, action: triggerBuzzer, color: 'bg-red-600 hover:bg-red-700', disabled: !monitoringState.drowsinessDetected && monitoringState.eyeClosureDuration < 3 },
        { label: 'Driver Responds', icon: CheckCircle, action: driverResponds, color: 'bg-emerald-600 hover:bg-emerald-700', disabled: !monitoringState.buzzerActive },
        { label: 'Driver No Response', icon: AlertTriangle, action: driverNoResponse, color: 'bg-red-800 hover:bg-red-900', disabled: !monitoringState.buzzerActive },
      ]
    },
    {
      title: 'SOS Emergency',
      items: [
        { label: 'Trigger SOS', icon: AlertTriangle, action: triggerSOS, color: 'bg-red-600 hover:bg-red-700' },
        { label: 'Admin Responds', icon: Phone, action: adminResponds, color: 'bg-emerald-600 hover:bg-emerald-700', disabled: !activeSOS || activeSOS.escalationLevel !== 'primary' },
        { label: 'Admin No Response', icon: PhoneOff, action: adminNoResponse, color: 'bg-red-800 hover:bg-red-900', disabled: !activeSOS || activeSOS.escalationLevel !== 'primary' },
        { label: 'Secondary Responds', icon: Phone, action: secondaryResponds, color: 'bg-emerald-600 hover:bg-emerald-700', disabled: !activeSOS || activeSOS.escalationLevel !== 'secondary' },
        { label: 'Secondary No Response', icon: PhoneOff, action: secondaryNoResponse, color: 'bg-red-800 hover:bg-red-900', disabled: !activeSOS || activeSOS.escalationLevel !== 'secondary' },
        { label: 'Resolve Emergency', icon: CheckCircle, action: resolveEmergency, color: 'bg-emerald-600 hover:bg-emerald-700' },
      ]
    },
    {
      title: 'Student Tracking',
      items: [
        { label: 'Simulate Student Pickup', icon: UserPlus, action: simulateStudentPickup, color: 'bg-teal-600 hover:bg-teal-700' },
        { label: 'Simulate Student Drop', icon: UserMinus, action: simulateStudentDrop, color: 'bg-indigo-600 hover:bg-indigo-700' },
      ]
    }
  ];

  return (
    <div className="fixed bottom-0 right-0 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-electric-600 to-electric-700 text-white px-4 py-2 rounded-tl-xl flex items-center gap-2 text-xs font-bold shadow-lg hover:from-electric-500 hover:to-electric-600 transition-all"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        DEMO CONTROL PANEL
      </button>

      {isOpen && (
        <div className="bg-navy-800 border border-white/10 rounded-tl-2xl w-[380px] max-h-[70vh] overflow-y-auto shadow-2xl">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400">DEMO MODE — LIVE SIMULATION</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Use these controls to simulate the complete workflow</p>
          </div>

          <div className="p-4 space-y-4">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">{section.title}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        disabled={item.disabled}
                        className={`${item.color} ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''} text-white px-3 py-2 rounded-lg text-[11px] font-medium flex items-center gap-2 transition-all`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">Quick Scenario</h4>
            <button
              onClick={async () => {
                simulateDrowsiness();
                setTimeout(() => triggerBuzzer(), 1500);
                setTimeout(() => driverNoResponse(), 3000);
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:from-red-500 hover:to-red-600 transition-all"
            >
              <Zap className="w-4 h-4" />
              Run Full Drowsiness → SOS Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
