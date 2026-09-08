import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useLiveGPS } from '../hooks/useLiveGPS';
import { MapPin, Navigation, Clock, Users, AlertTriangle, Bus, ChevronRight, X, Eye, Radio, Locate, RefreshCw, Wifi, WifiOff, Signal, Gauge } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busIcon = (status: string) => {
  const color = status === 'moving' ? '#10b981' :
    status === 'emergency' ? '#ef4444' :
    status === 'delayed' ? '#f59e0b' :
    status === 'stopped' ? '#3b82f6' :
    status === 'offline' ? '#6b7280' : '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:${color};border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.5);font-size:18px;position:relative;">
      <span>🚌</span>
      ${status === 'moving' ? '<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#10b981;border-radius:50%;border:2px solid white;animation:pulse 2s infinite;"></div>' : ''}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const schoolIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#3b76ff;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.5);font-size:20px;">🏫</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function LiveFleet() {
  const { vehicles, drivers, setSelectedVehicle, selectedVehicle, routes, resolvedTheme } = useStore();
  const { locations, lastSync, refresh, syncFromSinoTrack, loading: gpsLoading } = useLiveGPS({ enabled: true, intervalMs: 8000 });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const selected = vehicles.find(v => v.id === selectedVehicle);
  const selectedGps = locations.find(l => l.bus_id === selectedVehicle);
  const selectedDriver = selected ? drivers.find(d => d.id === selected.assignedDriver) : null;

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'moving': return 'MOVING';
      case 'stopped': return 'STOPPED';
      case 'idle': return 'IDLE';
      case 'delayed': return 'DELAYED';
      case 'offline': return 'OFFLINE';
      case 'emergency': return 'EMERGENCY';
      case 'route_deviation': return 'DEVIATION';
      default: return status.toUpperCase();
    }
  };

  const getGpsStatusColor = (gpsStatus?: string) => {
    if (gpsStatus === 'online') return 'text-emerald-400';
    if (gpsStatus === 'offline') return 'text-red-400';
    return 'text-gray-400';
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

    const tileUrl = resolvedTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;

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

  // Update tiles on theme change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tileUrl = resolvedTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [resolvedTheme]);

  // Update markers from GPS data
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vehicles.forEach(vehicle => {
      // Prefer live GPS from backend, fallback to store
      const gpsData = locations.find(l => l.bus_id === vehicle.id);
      const lat = gpsData?.latitude || vehicle.currentLat || vehicle.lat;
      const lng = gpsData?.longitude || vehicle.currentLng || vehicle.lng;
      const markerStatus = gpsData?.gps_status === 'offline' ? 'offline' : vehicle.status;

      if (markersRef.current[vehicle.id]) {
        markersRef.current[vehicle.id].setLatLng([lat, lng]);
        markersRef.current[vehicle.id].setIcon(busIcon(markerStatus));
        markersRef.current[vehicle.id].setPopupContent(
          `<b>${vehicle.id}</b><br/>${vehicle.routeName || vehicle.assignedRoute}<br/>Speed: ${vehicle.speed} km/h<br/>GPS: ${gpsData?.gps_status || 'unknown'}<br/>Students: ${vehicle.currentStudents}/${vehicle.capacity}`
        );
      } else {
        const marker = L.marker([lat, lng], { icon: busIcon(markerStatus) })
          .addTo(map)
          .bindPopup(`<b>${vehicle.id}</b><br/>${vehicle.routeName || vehicle.assignedRoute}<br/>Speed: ${vehicle.speed} km/h<br/>GPS: ${gpsData?.gps_status || 'unknown'}<br/>Students: ${vehicle.currentStudents}/${vehicle.capacity}`);
        marker.on('click', () => {
          setSelectedVehicle(vehicle.id);
          setDetailOpen(true);
        });
        markersRef.current[vehicle.id] = marker;
      }
    });
  }, [vehicles, locations, setSelectedVehicle]);

  // Fly to selected vehicle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selected) return;
    const gpsData = locations.find(l => l.bus_id === selected.id);
    const lat = gpsData?.latitude || selected.currentLat || selected.lat;
    const lng = gpsData?.longitude || selected.currentLng || selected.lng;
    map.flyTo([lat, lng], 16, { duration: 1 });
    setDetailOpen(true);
  }, [selected]);

  const movingCount = vehicles.filter(v => v.status === 'moving').length;
  const stoppedCount = vehicles.filter(v => v.status === 'stopped').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;
  const emergencyCount = vehicles.filter(v => v.status === 'emergency').length;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 max-md:flex-col max-md:h-auto max-md:min-h-[calc(100vh-6rem)]">
      {/* Map */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 max-md:min-h-[300px]">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Live badge */}
        <div className="absolute top-3 left-3 z-[1000] glass-card px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-white">LIVE FLEET</span>
          {lastSync && (
            <span className="text-[8px] text-gray-400 ml-1">
              {Math.floor((Date.now() - lastSync.getTime()) / 1000)}s ago
            </span>
          )}
        </div>

        {/* Fleet stats */}
        <div className="absolute top-3 right-14 z-[1000] glass-card px-3 py-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {movingCount}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {stoppedCount}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {offlineCount}
          </span>
          {emergencyCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> {emergencyCount}
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] glass-card p-2">
          <div className="flex items-center gap-3 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Moving</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> SOS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Stopped</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Offline</span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => { refresh(); }}
          className="absolute bottom-3 right-3 z-[1000] glass-card p-2 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${gpsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sidebar */}
      <div className="w-96 max-md:w-full glass-card overflow-y-auto flex flex-col">
        {/* Sidebar header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Fleet Overview</h3>
            <button
              onClick={() => syncFromSinoTrack()}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-electric-600/20 text-electric-400 text-[10px] font-bold hover:bg-electric-600/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
              SYNC
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-navy-700/30">
              <p className="text-lg font-bold text-emerald-400">{movingCount}</p>
              <p className="text-[8px] text-gray-400">MOVING</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-navy-700/30">
              <p className="text-lg font-bold text-blue-400">{stoppedCount}</p>
              <p className="text-[8px] text-gray-400">STOPPED</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-navy-700/30">
              <p className="text-lg font-bold text-gray-400">{offlineCount}</p>
              <p className="text-[8px] text-gray-400">OFFLINE</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-navy-700/30">
              <p className="text-lg font-bold text-amber-400">{vehicles.filter(v => v.status === 'delayed').length}</p>
              <p className="text-[8px] text-gray-400">DELAYED</p>
            </div>
          </div>
        </div>

        {/* Bus list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {vehicles.map((v) => {
            const driver = drivers.find(d => d.id === v.assignedDriver);
            const isSelected = selectedVehicle === v.id;
            const gpsData = locations.find(l => l.bus_id === v.id);
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedVehicle(v.id); setDetailOpen(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isSelected ? 'bg-electric-600/20 border border-electric-500/30' : 'bg-navy-700/30 hover:bg-navy-600/30'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${getStatusColor(v.status)} flex-shrink-0 relative`}>
                  {v.status === 'moving' && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50"></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{v.id}</p>
                    {gpsData && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        gpsData.gps_status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        GPS {gpsData.gps_status === 'online' ? 'ON' : 'OFF'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{driver?.fullName || 'No driver'} — {v.speed} km/h</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {detailOpen && selected && (
          <div className="border-t border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{selected.id}</h4>
              <button onClick={() => setDetailOpen(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selected.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' :
                selected.status === 'emergency' ? 'bg-red-500/20 text-red-400' :
                selected.status === 'stopped' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {getStatusLabel(selected.status)}
              </span>
              {selectedGps && (
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                  selectedGps.gps_status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedGps.gps_status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  GPS {selectedGps.gps_status === 'online' ? 'ONLINE' : 'OFFLINE'}
                </span>
              )}
            </div>

            {/* Live location card */}
            <div className="bg-navy-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-electric-400">
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-bold">LIVE LOCATION</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-gray-400">Latitude</p>
                  <p className="font-mono font-bold text-white">{(selectedGps?.latitude || selected.currentLat || selected.lat).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Longitude</p>
                  <p className="font-mono font-bold text-white">{(selectedGps?.longitude || selected.currentLng || selected.lng).toFixed(6)}</p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-navy-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3 h-3 text-emerald-400" />
                  <p className="text-[9px] text-gray-400">SPEED</p>
                </div>
                <p className="text-lg font-bold text-white">{selected.speed}<span className="text-xs text-gray-400">km/h</span></p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Navigation className="w-3 h-3 text-blue-400" />
                  <p className="text-[9px] text-gray-400">HEADING</p>
                </div>
                <p className="text-lg font-bold text-white">{selected.heading}<span className="text-xs text-gray-400">°</span></p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3 h-3 text-amber-400" />
                  <p className="text-[9px] text-gray-400">STUDENTS</p>
                </div>
                <p className="text-lg font-bold text-white">{selected.currentStudents}<span className="text-xs text-gray-400">/{selected.capacity}</span></p>
              </div>
              <div className="bg-navy-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Signal className="w-3 h-3 text-purple-400" />
                  <p className="text-[9px] text-gray-400">GSM</p>
                </div>
                <p className="text-sm font-bold text-white capitalize">{selectedGps?.gsm_signal || 'Unknown'}</p>
              </div>
            </div>

            {/* Driver info */}
            {selectedDriver && (
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[9px] text-gray-400 mb-1">DRIVER</p>
                <p className="text-xs font-bold text-white">{selectedDriver.fullName}</p>
                <p className="text-[10px] text-gray-400">{selectedDriver.phone} — Safety: {selectedDriver.safetyScore}%</p>
              </div>
            )}

            {/* Route info */}
            {selected.routeName && (
              <div className="bg-navy-700/30 rounded-xl p-3">
                <p className="text-[9px] text-gray-400 mb-1">ROUTE</p>
                <p className="text-xs font-bold text-white">{selected.routeName}</p>
              </div>
            )}

            {/* Last update */}
            {selected.lastUpdate && (
              <div className="text-center">
                <p className="text-[9px] text-gray-500">Last update: {selected.lastUpdate}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
