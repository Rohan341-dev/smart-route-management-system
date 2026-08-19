import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { MapPin, Navigation, Clock, Users, AlertTriangle, Bus, ChevronRight, X, Eye, Radio, Locate } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busIcon = (status: string) => {
  const color = status === 'moving' ? '#10b981' :
    status === 'emergency' ? '#ef4444' :
    status === 'delayed' ? '#f59e0b' :
    status === 'stopped' ? '#3b82f6' : '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;">🚌</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const schoolIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:#3b76ff;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:18px;">🏫</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LiveFleet() {
  const { vehicles, drivers, setSelectedVehicle, selectedVehicle, routes } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [27.7100, 85.3130],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add school marker
    L.marker([27.7100, 85.3130], { icon: schoolIcon })
      .addTo(map)
      .bindPopup('<b style="color:#3b76ff">🏫 School HQ</b><br/>Kathmandu International Academy');

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update vehicle markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vehicles.forEach(vehicle => {
      const lat = vehicle.currentLat || vehicle.lat;
      const lng = vehicle.currentLng || vehicle.lng;

      if (markersRef.current[vehicle.id]) {
        markersRef.current[vehicle.id].setLatLng([lat, lng]);
        markersRef.current[vehicle.id].setIcon(busIcon(vehicle.status));
      } else {
        const marker = L.marker([lat, lng], { icon: busIcon(vehicle.status) })
          .addTo(map)
          .bindPopup(`<b>${vehicle.id}</b><br/>${vehicle.routeName || vehicle.assignedRoute}<br/>Speed: ${vehicle.speed} km/h<br/>Students: ${vehicle.currentStudents}/${vehicle.capacity}`);

        marker.on('click', () => setSelectedVehicle(vehicle.id));
        markersRef.current[vehicle.id] = marker;
      }
    });
  }, [vehicles, setSelectedVehicle]);

  // Fly to selected vehicle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selected) return;
    const lat = selected.currentLat || selected.lat;
    const lng = selected.currentLng || selected.lng;
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [selected]);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 max-md:flex-col max-md:h-auto max-md:min-h-[calc(100vh-6rem)]">
      {/* Map */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 max-md:min-h-[300px]">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Live badge */}
        <div className="absolute top-3 left-3 z-[1000] glass-card px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-white">LIVE FLEET TRACKING</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] glass-card p-2">
          <div className="flex items-center gap-3 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Moving</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> SOS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Stopped</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 max-md:w-full glass-card p-4 overflow-y-auto">
        <h3 className="text-sm font-bold text-white mb-4">Fleet Overview</h3>
        <div className="space-y-2">
          {vehicles.map((v) => {
            const driver = drivers.find(d => d.id === v.assignedDriver);
            const isSelected = selectedVehicle === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isSelected ? 'bg-electric-600/20 border border-electric-500/30' : 'bg-navy-700/30 hover:bg-navy-600/30'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${getStatusColor(v.status)} flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{v.id}</p>
                  <p className="text-[10px] text-gray-400 truncate">{driver?.fullName || 'No driver'} — {v.speed} km/h</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
