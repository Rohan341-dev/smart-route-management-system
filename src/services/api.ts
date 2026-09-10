const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface APIResponse<T> {
  data: T;
  error?: string;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
  try {
    const token = localStorage.getItem('smartbus-auth-token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      return { data: null as T, error: errorData.detail || errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { data: null as T, error: error.message || 'Network error' };
  }
}

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiRequest<any>('/auth/me/'),
};

// Buses
export const busesAPI = {
  list: () => apiRequest<any[]>('/buses/'),
  get: (id: string) => apiRequest<any>(`/buses/${id}/`),
  updateGPS: (id: string, gps: { latitude: number; longitude: number; speed: number; heading: number }) =>
    apiRequest<any>(`/buses/${id}/gps/`, {
      method: 'POST',
      body: JSON.stringify(gps),
    }),
  updateStatus: (id: string, status: string) =>
    apiRequest<any>(`/buses/${id}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};

// Drivers
export const driversAPI = {
  list: () => apiRequest<any[]>('/drivers/'),
  get: (id: string) => apiRequest<any>(`/drivers/${id}/`),
};

// Students
export const studentsAPI = {
  list: () => apiRequest<any[]>('/students/'),
  get: (id: string) => apiRequest<any>(`/students/${id}/`),
  getByBus: (busId: string) => apiRequest<any[]>(`/students/?bus=${busId}`),
  create: (data: {
    full_name: string;
    class_name: string;
    section?: string;
    parent_name: string;
    parent_phone: string;
    assigned_bus?: string;
    assigned_route?: string;
  }) => apiRequest<any>('/students/create/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/students/${id}/update/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/students/${id}/delete/`, {
    method: 'DELETE',
  }),
};

// Routes
export const routesAPI = {
  list: () => apiRequest<any[]>('/routes/'),
  get: (id: string) => apiRequest<any>(`/routes/${id}/`),
  create: (data: { name: string; distance?: number; estimated_time?: number; total_students?: number; stops?: Array<{ name: string; lat: number; lng: number; order: number; stop_type: string; students_count: number }> }) =>
    apiRequest<any>('/routes/create/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/routes/${id}/update/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<void>(`/routes/${id}/delete/`, { method: 'DELETE' }),
};

// Trips
export const tripsAPI = {
  list: () => apiRequest<any[]>('/trips/'),
  get: (id: string) => apiRequest<any>(`/trips/${id}/`),
  updateStatus: (id: string, status: string) =>
    apiRequest<any>(`/trips/${id}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  updateStop: (tripId: string, stopId: string, action: string) =>
    apiRequest<any>(`/trips/${tripId}/stops/${stopId}/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};

// Attendance
export const attendanceAPI = {
  scan: (qrData: string, _busId: string, _driverId: string, action: 'pick' | 'drop') =>
    apiRequest<{
      success: boolean;
      student: { id: string; name: string };
      status: string;
      message: string;
    }>('/attendance/scan/', {
      method: 'POST',
      body: JSON.stringify({
        qr_data: qrData,
        action,
      }),
    }),

  list: (params?: { bus?: string; date?: string; student?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<any[]>(`/attendance/${query}`);
  },

  getByStudent: (studentId: string) =>
    apiRequest<any[]>(`/attendance/?student=${studentId}`),

  getByBus: (busId: string) =>
    apiRequest<any[]>(`/attendance/?bus=${busId}`),
};

// Notifications
export const notificationsAPI = {
  list: () => apiRequest<any[]>('/notifications/'),
  markRead: (id: string) =>
    apiRequest<any>(`/notifications/${id}/read/`, { method: 'POST' }),
  send: (data: { title: string; message: string; recipientId: string; type: string }) =>
    apiRequest<any>('/notifications/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Alerts
export const alertsAPI = {
  list: () => apiRequest<any[]>('/alerts/'),
  acknowledge: (id: string) =>
    apiRequest<any>(`/alerts/${id}/acknowledge/`, { method: 'POST' }),
};

// Emergency
export const emergencyAPI = {
  trigger: (data: { vehicleId: string; driverId: string; location: { lat: number; lng: number }; reason: string }) =>
    apiRequest<any>('/emergency/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  respond: (id: string, respondedBy: string) =>
    apiRequest<any>(`/emergency/${id}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ respondedBy }),
    }),
  resolve: (id: string) =>
    apiRequest<any>(`/emergency/${id}/resolve/`, { method: 'POST' }),
};

// API status check
export const apiStatus = {
  check: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/health/`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  },
};

// GPS / SinoTrack Integration
export interface NormalizedGPS {
  device_id: string;
  bus_id: string;
  bus_db_id: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  gps_status: 'online' | 'offline' | 'unknown';
  gsm_signal: string;
  last_updated: string | null;
  bus_status: string;
  current_students: number;
  capacity: number;
}

export interface GPSDeviceData {
  id: number;
  device_name: string;
  device_model: string;
  provider: string;
  device_identifier: string;
  imei: string;
  assigned_bus: number | null;
  assigned_bus_number: string | null;
  status: string;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface GPSHistoryPoint {
  id: number;
  bus: number;
  bus_number: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recorded_at: string;
}

export const gpsAPI = {
  // Device management
  listDevices: () => apiRequest<GPSDeviceData[]>('/gps/devices/'),
  createDevice: (data: Partial<GPSDeviceData>) =>
    apiRequest<GPSDeviceData>('/gps/devices/', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id: number, data: Partial<GPSDeviceData>) =>
    apiRequest<GPSDeviceData>(`/gps/devices/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDevice: (id: number) =>
    apiRequest<void>(`/gps/devices/${id}/`, { method: 'DELETE' }),
  assignDevice: (deviceId: number, busId: number | null) =>
    apiRequest<GPSDeviceData>(`/gps/devices/${deviceId}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ bus_id: busId }),
    }),

  // SinoTrack sync
  syncDevices: () =>
    apiRequest<{ message: string; synced: number }>('/gps/sync/devices/', { method: 'POST' }),
  syncLocations: () =>
    apiRequest<{ message: string; synced: number }>('/gps/sync/locations/', { method: 'POST' }),

  // Live GPS
  fleetLocations: () => apiRequest<NormalizedGPS[]>('/gps/fleet/locations/'),
  busLatest: (busId: number) => apiRequest<NormalizedGPS>(`/gps/bus/${busId}/latest/`),
  parentLocation: () => apiRequest<NormalizedGPS[]>('/gps/parent/location/'),

  // History
  history: (busId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const query = params.toString() ? `?${params}` : '';
    return apiRequest<GPSHistoryPoint[]>(`/gps/history/${busId}/${query}`);
  },

  // Route deviation
  deviations: () => apiRequest<any[]>('/gps/deviations/'),
  acknowledgeDeviation: (id: number) =>
    apiRequest<any>(`/gps/deviations/${id}/acknowledge/`, { method: 'POST' }),

  // Health check
  health: () => apiRequest<any>('/gps/health/'),
};
