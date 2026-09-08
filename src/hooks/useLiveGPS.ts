import { useState, useEffect, useCallback, useRef } from 'react';
import { gpsAPI, NormalizedGPS } from '../services/api';

interface UseLiveGPSOptions {
  enabled?: boolean;
  intervalMs?: number;
  busId?: number;
  parentId?: boolean;
}

interface UseLiveGPSReturn {
  locations: NormalizedGPS[];
  parentLocations: NormalizedGPS[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  refresh: () => Promise<void>;
  syncFromSinoTrack: () => Promise<void>;
}

export function useLiveGPS(options: UseLiveGPSOptions = {}): UseLiveGPSReturn {
  const { enabled = true, intervalMs = 8000, parentId = false } = options;
  const [locations, setLocations] = useState<NormalizedGPS[]>([]);
  const [parentLocations, setParentLocations] = useState<NormalizedGPS[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchLocations = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      if (parentId) {
        const { data, error: err } = await gpsAPI.parentLocation();
        if (mountedRef.current) {
          if (data) {
            setParentLocations(data);
            setLastSync(new Date());
            setError(null);
          } else if (err) {
            setError(err);
          }
        }
      } else {
        const { data, error: err } = await gpsAPI.fleetLocations();
        if (mountedRef.current) {
          if (data) {
            setLocations(data);
            setLastSync(new Date());
            setError(null);
          } else if (err) {
            setError(err);
          }
        }
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message || 'Failed to fetch GPS');
      }
    }
  }, [parentId]);

  const syncFromSinoTrack = useCallback(async () => {
    setLoading(true);
    try {
      await gpsAPI.syncLocations();
      await fetchLocations();
    } catch (e: any) {
      setError(e.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  }, [fetchLocations]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      fetchLocations();
      intervalRef.current = setInterval(fetchLocations, intervalMs);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, fetchLocations]);

  return {
    locations,
    parentLocations,
    loading,
    error,
    lastSync,
    refresh: fetchLocations,
    syncFromSinoTrack,
  };
}

export default useLiveGPS;
