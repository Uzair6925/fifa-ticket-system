const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isViteDev = typeof window !== 'undefined' && window.location.port === '5173';

const API_BASE_URL = isViteDev
  ? `http://${hostname}:5000/api`
  : '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('fifa_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('fifa_token');
    localStorage.removeItem('fifa_user');
    window.dispatchEvent(new Event('fifa-auth-expired'));
  }
  return data;
};

export const api = {
  register: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  changePassword: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getMatches: async () => {
    const res = await fetch(`${API_BASE_URL}/matches`);
    return res.json();
  },

  getStadiums: async () => {
    const res = await fetch(`${API_BASE_URL}/stadiums`);
    return res.json();
  },

  getSeatsForMatch: async (matchId, page = 1, limit = 100) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/seats/match/${matchId}?${params}`);
    return res.json();
  },

  holdSeats: async (matchId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/seats/hold`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds }),
    });
    return handleResponse(res);
  },

  releaseSeats: async (matchId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/seats/release`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds }),
    });
    return handleResponse(res);
  },

  confirmBooking: async (matchId, seatIds, paymentDetails) => {
    const res = await fetch(`${API_BASE_URL}/bookings/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds, paymentDetails }),
    });
    return handleResponse(res);
  },

  getMyBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  cancelBooking: async (bookingId) => {
    const res = await fetch(`${API_BASE_URL}/bookings/cancel/${bookingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getShardOverview: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/overview`);
    return res.json();
  },

  generateFakeUsers: async (count = 10000) => {
    const res = await fetch(`${API_BASE_URL}/admin/generate-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    return res.json();
  },

  runTrafficStressTest: async (targetTraffic = 50000000, concurrentRequests = 1000) => {
    const res = await fetch(`${API_BASE_URL}/admin/traffic-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTraffic, concurrentRequests }),
    });
    return res.json();
  },
};
