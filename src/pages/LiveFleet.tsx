import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { MapPin, Navigation, Clock, Users, AlertTriangle, Bus, ChevronRight, X, Eye, Radio } from 'lucide-react';

export default function LiveFleet() {
  const { vehicles, drivers, setSelectedVehicle, selectedVehicle, routes } = useStore();
  const [mapCenter] = useState({ lat: 27.7100, lng: 85.3130 });
  const selected = vehicles.find(v => v.id === selectedVehicle);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-emerald-500';
      case 'stopped': return 'bg-blue-500';
      case 'idle': return 'bg-gray-500';
      case 'delayed': return 'bg-amber-500';
      case 'offline': return 'bg-gray-600';
      case 'emergency': return 'bg-red-500';
      case 'route_deviation': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Map Area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-navy-800">
          {/* SVG Map Background */}
          <svg width="100%" height="100%" viewBox="0 0 1000 600" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff08" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Roads */}
            <path d="M 100,300 Q 300,200 500,300 Q 700,400 900,300" stroke="#ffffff15" strokeWidth="8" fill="none" />
            <path d="M 500,50 L 500,550" stroke="#ffffff10" strokeWidth="6" fill="none" />
            <path d="M 100,100 Q 500,150 900,100" stroke="#ffffff08" strokeWidth="4" fill="none" />
            <path d="M 200,500 Q 500,450 800,500" stroke="#ffffff08" strokeWidth="4" fill="none" />

            {/* School Location */}
            <circle cx="500" cy="350" r="20" fill="#3b76ff20" stroke="#3b76ff" strokeWidth="2" />
            <text x="500" y="355" textAnchor="middle" fill="#3b76ff" fontSize="10" fontWeight="bold">SCHOOL</text>

            {/* Vehicle Markers */}
            {vehicles.map((vehicle) => {
              const x = ((vehicle.lng - 85.28) / 0.15) * 800 + 100;
              const y = (1 - (vehicle.lat - 27.66) / 0.12) * 500 + 50;
              const isSelected = selectedVehicle === vehicle.id;

              return (
                <g key={vehicle.id} onClick={() => setSelectedVehicle(vehicle.id)} className="cursor-pointer">
                  {/* Pulse for emergency */}
                  {vehicle.status === 'emergency' && (
                    <circle cx={x} cy={y} r="25" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" from="15" to="30" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Vehicle circle */}
                  <circle cx={x} cy={y} r={isSelected ? 16 : 12} fill={
                    vehicle.status === 'moving' ? '#10b981' :
                    vehicle.status === 'emergency' ? '#ef4444' :
                    vehicle.status === 'delayed' ? '#f59e0b' :
                    vehicle.status === 'route_deviation' ? '#f97316' :
                    vehicle.status === 'stopped' ? '#3b82f6' :
                    '#6b7280'
                  } stroke={isSelected ? '#ffffff' : 'none'} strokeWidth={isSelected ? 3 : 0} />

                  {/* Bus icon */}
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={isSelected ? "14" : "10"}>🚌</text>

                  {/* Label */}
                  <rect x={x - 30} y={y - 28} width="60" height="16" rx="4" fill="#111827" stroke="#ffffff20" strokeWidth="1" />
                  <text x={x} y={y - 17} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{vehicle.id}</text>
                </g>
              );
            })}

            {/* Route stops */}
            {routes.filter(r => r.status === 'in_progress').flatMap(r => r.stops).map(stop => {
              const x = ((stop.lng - 85.28) / 0.15) * 800 + 100;
              const y = (1 - (stop.lat - 27.66) / 0.12) * 500 + 50;
              return (
                <g key={stop.id}>
                  <circle cx={x} cy={y} r="5" fill={stop.type === 'school' ? '#3b76ff' : stop.type === 'pickup' ? '#10b981' : '#f59e0b'} opacity="0.7" />
                </g>
              );
            })}
          </svg>

          {/* Map Overlay Info */}
          <div className="absolute top-4 left-4 glass-card p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              <span className="text-gray-300">Moving ({vehicles.filter(v => v.status === 'moving').length})</span>
              <span className="w-3 h-3 bg-red-500 rounded-full ml-2"></span>
              <span className="text-gray-300">Emergency ({vehicles.filter(v => v.status === 'emergency').length})</span>
              <span className="w-3 h-3 bg-amber-500 rounded-full ml-2"></span>
              <span className="text-gray-300">Delayed ({vehicles.filter(v => v.status === 'delayed').length})</span>
              <span className="w-3 h-3 bg-blue-500 rounded-full ml-2"></span>
              <span className="text-gray-300">Stopped ({vehicles.filter(v => v.status === 'stopped').length})</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 glass-card p-3">
            <div className="flex items-center gap-2 text-xs">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">GPS LIVE</span>
              <span className="text-gray-400 ml-2">Updates every 3s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Detail Panel */}
      {selected ? (
        <div className="w-80 glass-card p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">{selected.id}</h3>
            <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${getStatusColor(selected.status)} text-white`}>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {getStatusText(selected.status)}
          </div>

          <div className="space-y-3">
            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Vehicle Info</p>
              <p className="text-xs text-white">Registration: {selected.registrationNumber}</p>
              <p className="text-xs text-white">Type: {selected.type}</p>
              <p className="text-xs text-white">Capacity: {selected.capacity} seats</p>
            </div>

            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Driver</p>
              <p className="text-xs text-white">{drivers.find(d => d.id === selected.assignedDriver)?.fullName || 'Unassigned'}</p>
              <p className="text-xs text-gray-400">{selected.assignedDriver}</p>
            </div>

            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Live Data</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400">Speed</p>
                  <p className="text-sm font-bold text-white">{selected.speed.toFixed(0)} km/h</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Students</p>
                  <p className="text-sm font-bold text-white">{selected.currentStudents}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">GPS</p>
                  <p className="text-xs text-white">{selected.lat.toFixed(4)}°N</p>
                  <p className="text-xs text-white">{selected.lng.toFixed(4)}°E</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Route</p>
                  <p className="text-xs text-white">{selected.assignedRoute}</p>
                </div>
              </div>
            </div>

            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Route Progress</p>
              <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-electric-500 to-emerald-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">65% complete — ETA: 08:45 AM</p>
            </div>

            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">AI Monitoring</p>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Driver Alert — Monitoring Active</span>
              </div>
            </div>

            <div className="bg-navy-700/30 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Vehicle Systems</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">GPS Device</span>
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Dash Camera</span>
                  <span className="text-xs text-emerald-400">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Maintenance</span>
                  <span className="text-xs text-gray-300">{selected.maintenanceDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-80 glass-card p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-white mb-4">Fleet Overview</h3>
          <div className="space-y-2">
            {vehicles.map((v) => {
              const driver = drivers.find(d => d.id === v.assignedDriver);
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-navy-700/30 hover:bg-navy-600/30 transition-all text-left"
                >
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(v.status)} flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{v.id}</p>
                    <p className="text-[10px] text-gray-400 truncate">{driver?.fullName || 'No driver'} — {v.speed.toFixed(0)} km/h</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
