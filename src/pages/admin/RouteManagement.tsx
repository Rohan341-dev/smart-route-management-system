import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, GripVertical, Save, Route, Clock, Ruler, ChevronUp, ChevronDown, X, Edit2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { Route as RouteType, RouteStop } from '../../data/types';

const MIRCHAIYA_CENTER: [number, number] = [26.7737, 85.9520];

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const schoolIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;background:#10b981;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏫</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function makeStopIcon(order: number) {
  return new L.DivIcon({
    html: `<div style="width:26px;height:26px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${order}</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Geocode lat/lng to address
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name || `Stop (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch {
    return `Stop (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

// Geocode address to lat/lng
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
    }
  } catch {}
  return null;
}

// Calculate straight-line distance
function calcDistance(stops: RouteStop[], school: { lat: number; lng: number }): string {
  if (stops.length === 0) return '0 km';
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
  }
  total += haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lng, school.lat, school.lng);
  return `${total.toFixed(1)} km`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Map click handler
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fly-to when school location changes
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 15, { duration: 1 }); }, [center]);
  return null;
}

export default function RouteManagement() {
  const { routes, addRoute, updateRoute, createRoute } = useStore();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [distance, setDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(MIRCHAIYA_CENTER);

  // Recalculate distance when stops/school change
  useEffect(() => {
    if (stops.length >= 2 && schoolLocation) {
      setDistance(calcDistance(stops, schoolLocation));
      setEstimatedTime(`${Math.ceil(stops.length * 3 + 5)} min`);
    } else {
      setDistance('');
      setEstimatedTime('');
    }
  }, [stops, schoolLocation]);

  const resetForm = () => {
    setRouteName('');
    setSchoolLocation(null);
    setSchoolSearchQuery('');
    setStopSearchQuery('');
    setStops([]);
    setDistance('');
    setEstimatedTime('');
    setIsMapClickMode(false);
    setEditingRouteId(null);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isMapClickMode) return;
    const name = await reverseGeocode(lat, lng);
    addStop(name, lat, lng);
  };

  const addStop = (name: string, lat: number, lng: number) => {
    const newStop: RouteStop = {
      id: `STOP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name, lat, lng, time: '', studentsCount: 0,
      order: stops.length + 1, type: 'pickup',
    };
    setStops(prev => [...prev, newStop].map((s, i) => ({ ...s, order: i + 1 })));
  };

  const removeStop = (stopId: string) => {
    setStops(prev => prev.filter(s => s.id !== stopId).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    setStops(prev => {
      const arr = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleSchoolSearch = async () => {
    if (!schoolSearchQuery.trim()) return;
    const result = await geocodeAddress(schoolSearchQuery);
    if (result) {
      setSchoolLocation(result);
      setMapCenter([result.lat, result.lng]);
      setSchoolSearchQuery('');
    }
  };

  const handleStopSearch = async () => {
    if (!stopSearchQuery.trim()) return;
    const result = await geocodeAddress(stopSearchQuery);
    if (result) {
      addStop(result.name, result.lat, result.lng);
      setStopSearchQuery('');
    }
  };

  const handleSaveRoute = async () => {
    if (!routeName || !schoolLocation || stops.length === 0) return;

    if (editingRouteId) {
      updateRoute(editingRouteId, {
        name: routeName,
        stops,
        estimatedTime: estimatedTime || 'N/A',
        distance: distance || 'N/A',
      });
    } else {
      try {
        await createRoute({
          name: routeName,
          distance: distance || 'N/A',
          estimatedTime: estimatedTime || 'N/A',
          stops,
        });
      } catch (err) {
        console.error('Failed to save route:', err);
      }
    }
    setShowForm(false);
    resetForm();
  };

  const openEditRoute = (route: RouteType) => {
    setEditingRouteId(route.id);
    setSelectedRouteId(route.id);
    setRouteName(route.name);
    setStops([...route.stops]);
    const schoolStop = route.stops.find(s => s.type === 'school');
    if (schoolStop) {
      setSchoolLocation({ lat: schoolStop.lat, lng: schoolStop.lng, name: schoolStop.name });
      setMapCenter([schoolStop.lat, schoolStop.lng]);
    } else if (route.stops.length > 0) {
      const last = route.stops[route.stops.length - 1];
      setSchoolLocation({ lat: last.lat, lng: last.lng, name: last.name });
      setMapCenter([last.lat, last.lng]);
    }
    setDistance(route.distance !== 'N/A' ? route.distance : '');
    setEstimatedTime(route.estimatedTime !== 'N/A' ? route.estimatedTime : '');
    setShowForm(true);
  };

  const handleDeleteRoute = (routeId: string) => {
    const store = useStore.getState();
    useStore.setState({
      routes: store.routes.filter(r => r.id !== routeId),
      activityLogs: [{
        id: `LOG-${Date.now()}`,
        type: 'route' as const,
        message: `Route deleted`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        icon: 'route',
        severity: 'warning' as const,
      }, ...store.activityLogs],
    });
    if (selectedRouteId === routeId) {
      setSelectedRouteId(null);
      setShowForm(false);
      resetForm();
    }
    setDeleteConfirm(null);
  };

  const toggleRouteStatus = (route: RouteType) => {
    updateRoute(route.id, { status: route.status === 'active' ? 'scheduled' : 'active' });
  };

  // Build polyline for route
  const polylinePoints: [number, number][] = [];
  if (schoolLocation) {
    stops.forEach(s => polylinePoints.push([s.lat, s.lng]));
    polylinePoints.push([schoolLocation.lat, schoolLocation.lng]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-electric-400" />
            Route Management
          </h1>
          <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Create, edit, and manage bus routes on the map.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Route
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Route List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold dark:text-white text-surface-900">Routes ({routes.length})</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {routes.map(route => (
              <div key={route.id} className={`glass-card p-3 transition-all hover:ring-2 hover:ring-electric-500/50 ${selectedRouteId === route.id ? 'ring-2 ring-electric-500' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => openEditRoute(route)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold dark:text-white text-surface-900 truncate">{route.name}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{route.stops.length} stops • {route.distance} • {route.estimatedTime}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 ${
                    route.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>{route.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleRouteStatus(route)} className="p-1 rounded hover:bg-white/10" title={route.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {route.status === 'active'
                      ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                      : <ToggleLeft className="w-4 h-4 dark:text-gray-500 text-surface-400" />
                    }
                  </button>
                  <button onClick={() => openEditRoute(route)} className="p-1 rounded hover:bg-white/10" title="Edit">
                    <Edit2 className="w-3.5 h-3.5 dark:text-gray-400 text-surface-500" />
                  </button>
                  {deleteConfirm === route.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDeleteRoute(route.id)} className="text-[9px] px-1.5 py-0.5 bg-red-600 text-white rounded font-bold">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-[9px] px-1.5 py-0.5 dark:bg-navy-700 bg-surface-200 dark:text-gray-400 text-surface-500 rounded">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(route.id)} className="p-1 rounded hover:bg-red-500/20" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="glass-card p-6 text-center">
                <Route className="w-8 h-8 mx-auto mb-2 dark:text-gray-500 text-surface-400" />
                <p className="text-xs dark:text-gray-400 text-surface-500">No routes yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Map + Form */}
        <div className="lg:col-span-2 space-y-4">
          {showForm && (
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold dark:text-white text-surface-900">{editingRouteId ? 'Edit Route' : 'Create New Route'}</h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100"><X className="w-4 h-4 dark:text-gray-400 text-surface-500" /></button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Route Name *</label>
                <input type="text" value={routeName} onChange={e => setRouteName(e.target.value)} className="input-field text-xs" placeholder="e.g., Mirchaiya Route A" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">School Location *</label>
                <div className="flex gap-2">
                  <input type="text" value={schoolSearchQuery} onChange={e => setSchoolSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSchoolSearch()} className="input-field text-xs flex-1" placeholder="Search school..." />
                  <button onClick={handleSchoolSearch} className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-[10px] font-bold shrink-0">
                    <Search className="w-3 h-3 inline mr-1" />Search
                  </button>
                  <button onClick={() => { setSchoolLocation({ lat: mapCenter[0], lng: mapCenter[1], name: 'Map Center' }); }} className="px-3 py-2 bg-electric-600/20 text-electric-400 rounded-lg text-[10px] font-bold shrink-0">
                    Map Center
                  </button>
                </div>
                {schoolLocation && (
                  <p className="text-[10px] text-emerald-400 mt-1">📍 {schoolLocation.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Pickup Stops ({stops.length})</label>
                  <button onClick={() => setIsMapClickMode(!isMapClickMode)} className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${isMapClickMode ? 'bg-electric-600 text-white' : 'dark:bg-navy-700 bg-surface-200 dark:text-gray-400 text-surface-500'}`}>
                    {isMapClickMode ? '✓ Click Map' : '🗺️ Map Click'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={stopSearchQuery} onChange={e => setStopSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStopSearch()} className="input-field text-xs flex-1" placeholder="Search stop location..." />
                  <button onClick={handleStopSearch} className="px-3 py-2 dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 rounded-lg text-[10px] font-bold shrink-0">Add</button>
                </div>

                {stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                    <GripVertical className="w-3 h-3 dark:text-gray-500 text-surface-400 shrink-0" />
                    <span className="w-5 h-5 rounded-full bg-electric-600/20 flex items-center justify-center text-[10px] font-bold text-electric-400 shrink-0">{stop.order}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] dark:text-white text-surface-900 truncate">{stop.name}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveStop(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={() => removeStop(stop.id)} className="p-1 rounded hover:bg-red-500/20"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                ))}
                {stops.length === 0 && (
                  <p className="text-[10px] dark:text-gray-500 text-surface-500 text-center py-3">
                    {isMapClickMode ? 'Click on the map to add stops' : 'Search or use map click to add stops'}
                  </p>
                )}
              </div>

              {(distance || estimatedTime) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold dark:text-white text-surface-900">{distance}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Distance</p>
                  </div>
                  <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold dark:text-white text-surface-900">{estimatedTime}</p>
                    <p className="text-[9px] dark:text-gray-400 text-surface-500">Est. Time</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleSaveRoute} disabled={!routeName || !schoolLocation || stops.length === 0} className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" /> {editingRouteId ? 'Update Route' : 'Save Route'}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2.5 dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 rounded-xl text-xs">Cancel</button>
              </div>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="glass-card overflow-hidden" style={{ height: showForm ? '400px' : '600px' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler onMapClick={handleMapClick} />
              {showForm && <FlyTo center={mapCenter} />}

              {schoolLocation && (
                <Marker position={[schoolLocation.lat, schoolLocation.lng]} icon={schoolIcon}>
                  <Popup><b>School:</b> {schoolLocation.name}</Popup>
                </Marker>
              )}

              {stops.map(stop => (
                <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeStopIcon(stop.order)}>
                  <Popup><b>Stop {stop.order}:</b> {stop.name}</Popup>
                </Marker>
              ))}

              {polylinePoints.length >= 2 && (
                <Polyline positions={polylinePoints} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
