import { useState, useEffect, useRef, useCallback } from 'react';

export interface GPSState {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
  isActive: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export function useGPS() {
  const watchIdRef = useRef<number | null>(null);
  const [state, setState] = useState<GPSState>({
    latitude: 0,
    longitude: 0,
    speed: 0,
    heading: 0,
    accuracy: 0,
    timestamp: 0,
    isActive: false,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.geolocation) {
        setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
        return false;
      }
      const result = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      setState(prev => ({
        ...prev,
        permissionGranted: true,
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        speed: result.coords.speed || 0,
        heading: result.coords.heading || 0,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp,
      }));
      return true;
    } catch (err: any) {
      let msg = 'Location access denied';
      if (err.code === 1) msg = 'Location permission denied. Please enable in browser settings.';
      else if (err.code === 2) msg = 'Location unavailable';
      else if (err.code === 3) msg = 'Location request timed out';
      setState(prev => ({ ...prev, error: msg }));
      return false;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          isActive: true,
          error: null,
        }));
      },
      (error) => {
        let msg = 'GPS tracking error';
        if (error.code === 1) msg = 'Location permission lost';
        setState(prev => ({ ...prev, isActive: false, error: msg }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, requestPermission, startTracking, stopTracking };
}
