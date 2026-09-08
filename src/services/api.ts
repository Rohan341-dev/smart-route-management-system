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
};

// Routes
export const routesAPI = {
  list: () => apiRequest<any[]>('/routes/'),
  get: (id: string) => apiRequest<any>(`/routes/${id}/`),
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
  scan: (qrData: string, busId: string, driverId: string, action: string) =>
    apiRequest<{
      success: boolean;
      student: { id: string; name: string };
      attendanceStatus: string;
      timestamp: string;
      message?: string;
    }>('/attendance/scan/', {
      method: 'POST',
      body: JSON.stringify({ qrData, busId, driverId, action }),
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
