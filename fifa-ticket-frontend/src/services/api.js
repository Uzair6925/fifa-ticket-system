/**
 * api.js — Central API Client for FIFA Ticketing Distributed Backend
 * ──────────────────────────────────────────────────────────────────
 * Connects to the Express backend running on http://localhost:5000/api
 * Injects JWT Bearer token automatically from localStorage.
 */

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

export const api = {
  // ─── Authentication APIs ──────────────────────────────────────────
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
    return res.json();
  },

  // ─── Matches & Stadiums ──────────────────────────────────────────
  getMatches: async () => {
    const res = await fetch(`${API_BASE_URL}/matches`);
    return res.json();
  },

  getStadiums: async () => {
    const res = await fetch(`${API_BASE_URL}/stadiums`);
    return res.json();
  },

  // ─── Seats & Redis Locks ─────────────────────────────────────────
  getSeatsForMatch: async (matchId) => {
    const res = await fetch(`${API_BASE_URL}/seats/match/${matchId}`);
    return res.json();
  },

  holdSeats: async (matchId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/seats/hold`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds }),
    });
    return res.json();
  },

  releaseSeats: async (matchId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/seats/release`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds }),
    });
    return res.json();
  },

  // ─── Bookings & ACID Transaction ─────────────────────────────────
  confirmBooking: async (matchId, seatIds, paymentDetails) => {
    const res = await fetch(`${API_BASE_URL}/bookings/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ matchId, seatIds, paymentDetails }),
    });
    return res.json();
  },

  getMyBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ─── Distributed System & Admin Overview ─────────────────────────
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

  runTrafficStressTest: async (targetTraffic = 5000000, concurrentRequests = 1000) => {
    const res = await fetch(`${API_BASE_URL}/admin/traffic-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTraffic, concurrentRequests }),
    });
    return res.json();
  },
};
