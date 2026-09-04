import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://njiabox-api.onrender.com/api/v1';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('accessToken');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(method, path, body, false);
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json();
    if (res.ok && json.data?.accessToken) {
      await AsyncStorage.setItem('accessToken', json.data.accessToken);
      return true;
    }
  } catch {}
  return false;
}

export const api = {
  // Auth
  register: (body: { fullName: string; phoneNumber: string; password: string; role: string; businessName?: string }) =>
    request('POST', '/auth/register', body),
  login: (body: { phoneNumber: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>('POST', '/auth/login', body),
  logout: () => request('POST', '/auth/logout'),
  me: () => request<Record<string, unknown>>('GET', '/auth/me'),
  updateProfile: (body: Record<string, unknown>) => request('PATCH', '/auth/profile', body),

  // Consignments
  listConsignments: (params?: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams(params as Record<string, string> ?? {}).toString();
    return request<{ items: unknown[]; total: number }>('GET', `/consignments${q ? `?${q}` : ''}`);
  },
  createConsignment: (body: unknown) => request('POST', '/consignments', body),
  getConsignment: (trackingCode: string) => request('GET', `/consignments/${trackingCode}`),
  completeCustomsDetails: (id: string, body: unknown) => request('PATCH', `/consignments/${id}/customs-details`, body),

  // Capacities
  listCapacities: (params?: { routeCode?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string> ?? {}).toString();
    return request<unknown[]>('GET', `/transporter-capacities${q ? `?${q}` : ''}`);
  },
  createCapacity: (body: unknown) => request('POST', '/transporter-capacities', body),

  // Delivery
  generateOtp: (consignmentId: string) => request('POST', `/consignments/${consignmentId}/generate-otp`),
  verifyAndRelease: (body: { consignmentId: string; clearanceOtp: string }) =>
    request('POST', '/delivery/verify-and-release', body),

  // Manifests
  generateManifest: (capacityId: string) =>
    request('POST', `/transporter-capacities/${capacityId}/generate-manifest`),
  listManifests: (capacityId: string) =>
    request('GET', `/transporter-capacities/${capacityId}/manifests`),
};
