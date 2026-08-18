import { useState } from 'react';
import { Settings as SettingsIcon, Eye, Shield, MapPin, Bell, Save, RotateCcw } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', label: 'System Settings', icon: SettingsIcon },
    { id: 'monitoring', label: 'Driver Monitoring', icon: Eye },
    { id: 'sos', label: 'SOS Settings', icon: Shield },
    { id: 'gps', label: 'GPS Settings', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-electric-600 text-white'
                  : 'bg-navy-700/50 text-gray-400 hover:text-white hover:bg-navy-600/50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'system' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">System Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">School Name</label>
                <input type="text" defaultValue="Kathmandu International Academy" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">School Address</label>
                <input type="text" defaultValue="Baneshwor, Kathmandu, Nepal" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Contact Phone</label>
                <input type="text" defaultValue="+977-1-4444555" className="input-field" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Time Zone</label>
                <select className="input-field">
                  <option>Nepal Time (UTC +5:45)</option>
                  <option>India Time (UTC +5:30)</option>
                  <option>UTC</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Operating Hours Start</label>
                <input type="time" defaultValue="07:00" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Operating Hours End</label>
                <input type="time" defaultValue="18:00" className="input-field" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">Driver Monitoring Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Eye Closure Threshold</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="2" max="8" defaultValue="5" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">5 sec</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Time before drowsiness is detected</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Verification Duration</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="3" max="10" defaultValue="5" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">5 sec</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Continuous monitoring verification window</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Buzzer Duration</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="3" max="15" defaultValue="10" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">10 sec</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">How long the buzzer sounds before escalation</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Driver Response Timeout</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="5" max="30" defaultValue="15" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">15 sec</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Time for driver to acknowledge alert</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Minimum Blink Rate</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="8" max="20" defaultValue="12" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">12 bpm</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Minimum normal blink frequency</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs font-bold text-white mb-2">Detection Features</p>
                <div className="space-y-2">
                  {['Face Detection', 'Eye Tracking', 'Head Position', 'Attention Monitoring', 'Blink Frequency'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-electric-500" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sos' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">SOS Emergency Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-navy-700/30 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white mb-3">Primary Contact (School Admin)</h4>
                <input type="text" defaultValue="Principal Shrestha" className="input-field mb-2" />
                <input type="text" defaultValue="+977-9841000001" className="input-field mb-2" />
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Response Timeout</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="15" max="60" defaultValue="30" className="flex-1 accent-electric-500" />
                    <span className="text-sm text-white font-bold">30 sec</span>
                  </div>
                </div>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white mb-3">Secondary Contact</h4>
                <input type="text" defaultValue="Transport Manager Lama" className="input-field mb-2" />
                <input type="text" defaultValue="+977-9841000002" className="input-field mb-2" />
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Response Timeout</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="15" max="60" defaultValue="30" className="flex-1 accent-electric-500" />
                    <span className="text-sm text-white font-bold">30 sec</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-navy-700/30 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white mb-3">Emergency Authority</h4>
                <input type="text" defaultValue="Nepal Police Emergency" className="input-field mb-2" />
                <input type="text" defaultValue="100" className="input-field mb-2" />
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs font-bold text-white mb-3">SOS Features</p>
                <div className="space-y-2">
                  {['Auto-escalation on no response', 'GPS location sharing', 'Student notification on SOS', 'Parent emergency notification', 'Camera auto-recording on SOS'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-electric-500" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gps' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">GPS Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">GPS Update Frequency</label>
                <select className="input-field">
                  <option>Every 3 seconds</option>
                  <option>Every 5 seconds</option>
                  <option>Every 10 seconds</option>
                  <option>Every 30 seconds</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Geofence Radius</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="100" max="2000" defaultValue="500" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">500m</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Route Deviation Threshold</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="100" max="1000" defaultValue="300" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">300m</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Distance from route to trigger deviation alert</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Speed Limit (km/h)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="30" max="80" defaultValue="50" className="flex-1 accent-electric-500" />
                  <span className="text-sm text-white font-bold">50 km/h</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">School zone speed limit</p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs font-bold text-white mb-3">GPS Features</p>
                <div className="space-y-2">
                  {['Real-time tracking', 'Route history', 'Speed monitoring', 'Geofence alerts', 'Idle detection'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-electric-500" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">Notification Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs font-bold text-white mb-3">Notification Channels</p>
                <div className="space-y-2">
                  {['Web Push Notifications', 'SMS Alerts', 'Email Notifications', 'Mobile Push (if available)'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-electric-500" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-navy-700/30 rounded-xl p-4">
                <p className="text-xs font-bold text-white mb-3">Notification Types</p>
                <div className="space-y-2">
                  {['Drowsiness Alerts', 'Speed Alerts', 'Route Deviation', 'Emergency SOS', 'Student Pickup/Drop', 'Vehicle Maintenance', 'System Alerts'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-electric-500" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Settings</button>
        <button className="btn-warning flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset to Default</button>
      </div>
    </div>
  );
}
