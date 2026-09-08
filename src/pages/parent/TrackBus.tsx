import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useLiveGPS } from '../../hooks/useLiveGPS';
import { Bus, MapPin, Navigation, Clock, ArrowLeft, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busIcon = (status: string) => {
  const color = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;background:${color};border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.5);font-size:20px;">🚌</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const schoolIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:#3b76ff;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:18px;">🏫</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function TrackBus() {
  const { currentUser, students, vehicles, routes, setCurrentPage, resolvedTheme } = useStore();
  const { parentLocations, lastSync, refresh, loading } = useLiveGPS({ enabled: true, intervalMs: 8000, parentId: true });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const childIds = currentUser?.studentIds || [];
  const childStudents = students.filter(s => childIds.includes(s.id));
  const childBusIds = [...new Set(childStudents.map(s => s.assignedBus))];
  const childBuses = vehicles.filter(v => childBusIds.includes(v.id));
  const childRoutes = routes.filter(r => childBusIds.includes(r.vehicleId));

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [27.7100, 85.3130],
      zoom: 14,
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
      .bindPopup('<b style="color:#3b76ff">🏫 School</b>');

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

  // Update bus marker from scoped GPS data
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || parentLocations.length === 0) return;

    const loc = parentLocations[0]; // Parent sees only their child's bus
    if (!loc) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([loc.latitude, loc.longitude]);
    } else {
      const marker = L.marker([loc.latitude, loc.longitude], { icon: busIcon(loc.gps_status) })
        .addTo(map)
        .bindPopup(`<b>${loc.bus_id}</b><br/>Speed: ${loc.speed} km/h<br/>GPS: ${loc.gps_status}`);
      markerRef.current = marker;
    }

    map.flyTo([loc.latitude, loc.longitude], 16, { duration: 1 });
  }, [parentLocations]);

  return (
    <div className="min-h-screen dark:bg-navy-950 bg-surface-50">
      <header className="dark:bg-navy-900/80 bg-white border-b dark:border-white/5 border-surface-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => setCurrentPage('parent-home')} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-surface-500" />
          </button>
          <Bus className="w-5 h-5 text-electric-400" />
          <h1 className="text-sm font-bold dark:text-white text-surface-900">Track Bus</h1>
          <div className="flex-1" />
          <button onClick={refresh} className="p-2 rounded-xl dark:bg-navy-700/50 bg-surface-100">
            <RefreshCw className={`w-4 h-4 dark:text-gray-400 text-surface-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Live map */}
        <div className="glass-card overflow-hidden" style={{ height: '250px' }}>
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {childBuses.map(bus => {
          const route = childRoutes.find(r => r.vehicleId === bus.id);
          const driver = useStore.getState().drivers.find(d => d.id === bus.assignedDriver);
          const gpsData = parentLocations.find(l => l.bus_id === bus.id);
          return (
            <div key={bus.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    bus.status === 'moving' ? 'bg-emerald-500' : bus.status === 'stopped' ? 'bg-amber-500' : 'bg-gray-500'
                  }`}>
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white text-surface-900">{bus.id}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{bus.plateNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gpsData && (
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${
                      gpsData.gps_status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {gpsData.gps_status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      GPS
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    bus.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' :
                    bus.status === 'stopped' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {bus.status === 'moving' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {bus.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Route</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{route?.name || 'N/A'}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Driver</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{driver?.fullName || 'N/A'}</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Speed</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.speed} km/h</p>
                </div>
                <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Students</p>
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.currentStudents}/{bus.capacity}</p>
                </div>
              </div>

              {/* Live GPS location */}
              <div className="dark:bg-navy-700/30 bg-surface-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] dark:text-gray-400 text-surface-500">Current Location</p>
                  {gpsData?.last_updated && (
                    <p className="text-[8px] dark:text-gray-500 text-surface-400">
                      Updated: {Math.floor((Date.now() - new Date(gpsData.last_updated).getTime()) / 1000)}s ago
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-electric-400" />
                  <p className="text-xs font-bold dark:text-white text-surface-900 font-mono">
                    {(gpsData?.latitude || bus.currentLat).toFixed(6)}° N, {(gpsData?.longitude || bus.currentLng).toFixed(6)}° E
                  </p>
                </div>
              </div>

              {route && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] dark:text-gray-400 text-surface-500 font-medium">Route Stops</p>
                  {route.stops.map((stop, i) => (
                    <div key={stop.id} className="flex items-center gap-2 p-2 rounded-lg dark:bg-navy-700/20 bg-surface-50/50">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-electric-500 text-white' : 'dark:bg-navy-600 bg-surface-200 dark:text-gray-400 text-surface-500'
                      }`}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium dark:text-white text-surface-900">{stop.name}</p>
                        <p className="text-[9px] dark:text-gray-500 text-surface-400">{stop.time}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        stop.type === 'school' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{stop.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {childBuses.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Bus className="w-10 h-10 dark:text-gray-500 text-surface-400 mx-auto mb-3" />
            <p className="text-sm dark:text-gray-400 text-surface-500">No bus assigned to your child yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
