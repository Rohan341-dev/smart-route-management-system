import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { MapPin, Plus, Trash2, GripVertical, Save, Route, Clock, Ruler, Search, ChevronUp, ChevronDown, X, Bus } from 'lucide-react';
import { Route as RouteType, RouteStop } from '../../data/types';

const MIRCHAIYA_CENTER = { lat: 26.7737, lng: 85.9520 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    window.initMap = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function RouteManagement() {
  const { routes, vehicles, students, addRoute, updateRoute } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [distance, setDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY in .env');
      return;
    }
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        setMapLoaded(true);
        initMap();
      })
      .catch(err => setMapError(err.message));
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: MIRCHAIYA_CENTER,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    // Directions renderer
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });
    directionsRendererRef.current = directionsRenderer;

    // Click map to add stop
    map.addListener('click', (e: any) => {
      if (!isEditing) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode to get name
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        const name = results?.[0]?.formatted_address || `Stop ${stops.length + 1}`;
        addStop(name, lat, lng);
      });
    });

    // Autocomplete for search
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(26.7, 85.9),
          new window.google.maps.LatLng(26.85, 86.05)
        ),
        componentRestrictions: { country: 'np' },
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.panTo(place.geometry.location);
          map.setZoom(15);
          addStop(place.name || place.formatted_address, lat, lng);
          setSearchQuery('');
        }
      });
    }
  }, [isEditing, stops.length]);

  const addStop = (name: string, lat: number, lng: number, type: 'pickup' | 'drop' | 'school' = 'pickup') => {
    const newStop: RouteStop = {
      id: `STOP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      lat,
      lng,
      time: '',
      studentsCount: 0,
      order: stops.length + 1,
      type,
    };
    const updatedStops = [...stops, newStop].map((s, i) => ({ ...s, order: i + 1 }));
    setStops(updatedStops);
    addMarker(newStop);
    if (updatedStops.length >= 2 && schoolLocation) {
      calculateRoute(updatedStops, schoolLocation);
    }
  };

  const setSchoolLocationFromMap = (name: string, lat: number, lng: number) => {
    setSchoolLocation({ lat, lng, name });
    // Clear existing markers
    clearMarkers();
    // Add school marker
    const map = mapInstanceRef.current;
    if (map) {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#10b981"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="18">🏫</text></svg>'),
          scaledSize: new window.google.maps.Size(32, 32),
        },
        zIndex: 100,
      });
      markersRef.current.push(marker);
      map.panTo({ lat, lng });
      map.setZoom(14);
    }
  };

  const addMarker = (stop: RouteStop) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const marker = new window.google.maps.Marker({
      position: { lat: stop.lat, lng: stop.lng },
      map,
      title: stop.name,
      label: {
        text: String(stop.order),
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
      },
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#3b82f6"/><text x="14" y="18" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${stop.order}</text></svg>`),
        scaledSize: new window.google.maps.Size(28, 28),
      },
    });

    marker.addListener('click', () => {
      if (isEditing) {
        removeStop(stop.id);
      }
    });

    markersRef.current.push(marker);
  };

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const removeStop = (stopId: string) => {
    const updatedStops = stops.filter(s => s.id !== stopId).map((s, i) => ({ ...s, order: i + 1 }));
    setStops(updatedStops);
    clearMarkers();
    // Re-add markers
    if (schoolLocation) {
      const schoolMarker = new window.google.maps.Marker({
        position: schoolLocation,
        map: mapInstanceRef.current,
        title: schoolLocation.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#10b981"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="18">🏫</text></svg>'),
          scaledSize: new window.google.maps.Size(32, 32),
        },
        zIndex: 100,
      });
      markersRef.current.push(schoolMarker);
    }
    updatedStops.forEach(s => addMarker(s));
    if (updatedStops.length >= 2 && schoolLocation) {
      calculateRoute(updatedStops, schoolLocation);
    } else {
      clearRoute();
    }
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    const reordered = newStops.map((s, i) => ({ ...s, order: i + 1 }));
    setStops(reordered);
    clearMarkers();
    if (schoolLocation) {
      const schoolMarker = new window.google.maps.Marker({
        position: schoolLocation,
        map: mapInstanceRef.current,
        title: schoolLocation.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#10b981"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="18">🏫</text></svg>'),
          scaledSize: new window.google.maps.Size(32, 32),
        },
        zIndex: 100,
      });
      markersRef.current.push(schoolMarker);
    }
    reordered.forEach(s => addMarker(s));
    if (reordered.length >= 2 && schoolLocation) {
      calculateRoute(reordered, schoolLocation);
    }
  };

  const calculateRoute = (routeStops: RouteStop[], school: { lat: number; lng: number }) => {
    if (!window.google || !directionsRendererRef.current) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Build waypoints from stops (excluding first and last if they are school)
    const origin = { lat: routeStops[0].lat, lng: routeStops[0].lng };
    const destination = school;
    const waypoints = routeStops.slice(1).map(s => ({
      location: new window.google.maps.LatLng(s.lat, s.lng),
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result: any, status: any) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0];
          const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
          const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);

          setDistance(`${(totalDistance / 1000).toFixed(1)} km`);
          setEstimatedTime(`${Math.ceil(totalDuration / 60)} min`);

          // Update stop times based on legs
          const updatedStops = [...routeStops];
          let cumTime = 0;
          route.legs.forEach((leg: any, i: number) => {
            if (updatedStops[i]) {
              cumTime += leg.duration.value;
              const mins = Math.ceil(cumTime / 60);
              updatedStops[i].time = `${mins} min`;
            }
          });
          setStops(updatedStops);
        }
      }
    );
  };

  const clearRoute = () => {
    setDistance('');
    setEstimatedTime('');
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  };

  const handleSaveRoute = () => {
    if (!routeName || !schoolLocation || stops.length === 0) return;

    const newRoute: RouteType = {
      id: `RT-${Date.now()}`,
      name: routeName,
      vehicleId: '',
      driverId: '',
      stops,
      totalStudents: 0,
      estimatedTime: estimatedTime || 'N/A',
      distance: distance || 'N/A',
      status: 'scheduled',
    };

    addRoute(newRoute);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setRouteName('');
    setSchoolLocation(null);
    setStops([]);
    setDistance('');
    setEstimatedTime('');
    setIsEditing(false);
    clearMarkers();
    clearRoute();
  };

  const openEditRoute = (route: RouteType) => {
    setSelectedRouteId(route.id);
    setRouteName(route.name);
    setStops(route.stops);
    setIsEditing(true);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-electric-400" />
            Route Management
          </h1>
          <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Create and manage bus routes with interactive Google Maps.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Route
        </button>
      </div>

      {mapError && (
        <div className="glass-card p-3 border-l-4 border-l-amber-500 bg-amber-500/5">
          <p className="text-xs text-amber-400">{mapError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold dark:text-white text-surface-900">Saved Routes ({routes.length})</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {routes.map(route => (
              <div key={route.id} className={`glass-card p-3 cursor-pointer transition-all hover:ring-2 hover:ring-electric-500/50 ${selectedRouteId === route.id ? 'ring-2 ring-electric-500' : ''}`} onClick={() => openEditRoute(route)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold dark:text-white text-surface-900">{route.name}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{route.stops.length} stops • {route.distance} • {route.estimatedTime}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                    route.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>{route.status}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-[9px] dark:text-gray-400 text-surface-500 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> {route.distance}
                  </span>
                  <span className="text-[9px] dark:text-gray-400 text-surface-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {route.estimatedTime}
                  </span>
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="glass-card p-6 text-center">
                <Route className="w-8 h-8 mx-auto mb-2 dark:text-gray-500 text-surface-400" />
                <p className="text-xs dark:text-gray-400 text-surface-500">No routes created yet</p>
                <p className="text-[10px] dark:text-gray-500 text-surface-500 mt-1">Click "Create Route" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Map + Form */}
        <div className="lg:col-span-2 space-y-4">
          {showForm ? (
            <>
              {/* Route Form */}
              <div className="glass-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold dark:text-white text-surface-900">{isEditing ? 'Edit Route' : 'Create New Route'}</h3>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100"><X className="w-4 h-4 dark:text-gray-400 text-surface-500" /></button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Route Name *</label>
                  <input type="text" value={routeName} onChange={e => setRouteName(e.target.value)} className="input-field text-xs" placeholder="e.g., Mirchaiya Route A" />
                </div>

                {/* School Location */}
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">School Location *</label>
                  <div className="flex gap-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="input-field text-xs flex-1"
                      placeholder="Search school location..."
                    />
                    <button
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          const map = mapInstanceRef.current;
                          const center = map.getCenter();
                          setSchoolLocationFromMap('School Location', center.lat(), center.lng());
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-[10px] font-bold"
                    >
                      Use Map Center
                    </button>
                  </div>
                  {schoolLocation && (
                    <p className="text-[10px] text-emerald-400 mt-1">📍 {schoolLocation.name} ({schoolLocation.lat.toFixed(4)}, {schoolLocation.lng.toFixed(4)})</p>
                  )}
                </div>

                {/* Stops */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Pickup Stops ({stops.length})</label>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${
                        isEditing ? 'bg-electric-600 text-white' : 'dark:bg-navy-700 bg-surface-200 dark:text-gray-400 text-surface-500'
                      }`}
                    >
                      {isEditing ? '✓ Click Map to Add' : '🗺️ Enable Map Click'}
                    </button>
                  </div>

                  {stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <GripVertical className="w-3 h-3 dark:text-gray-500 text-surface-400" />
                      <span className="w-5 h-5 rounded-full bg-electric-600/20 flex items-center justify-center text-[10px] font-bold text-electric-400">{stop.order}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] dark:text-white text-surface-900 truncate">{stop.name}</p>
                        <p className="text-[9px] dark:text-gray-400 text-surface-500">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)} {stop.time && `• ${stop.time}`}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveStop(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => removeStop(stop.id)} className="p-1 rounded hover:bg-red-500/20"><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </div>
                  ))}

                  {stops.length === 0 && (
                    <p className="text-[10px] dark:text-gray-500 text-surface-500 text-center py-4">
                      {isEditing ? 'Click on the map to add stops' : 'Enable map click mode to add stops'}
                    </p>
                  )}
                </div>

                {/* Distance & Time */}
                {(distance || estimatedTime) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-3 text-center">
                      <Ruler className="w-4 h-4 mx-auto mb-1 text-electric-400" />
                      <p className="text-sm font-bold dark:text-white text-surface-900">{distance}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">Total Distance</p>
                    </div>
                    <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-3 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <p className="text-sm font-bold dark:text-white text-surface-900">{estimatedTime}</p>
                      <p className="text-[9px] dark:text-gray-400 text-surface-500">Est. Travel Time</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleSaveRoute} disabled={!routeName || !schoolLocation || stops.length === 0} className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="w-4 h-4" /> Save Route
                  </button>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2.5 dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </div>

              {/* Map */}
              <div className="glass-card overflow-hidden">
                <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
              </div>
            </>
          ) : (
            /* Map only view */
            <div className="glass-card overflow-hidden">
              <div ref={mapRef} style={{ width: '100%', height: '600px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
