const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isMockRedis = process.env.USE_FAKE_DB !== 'false';

// ─── In-Memory Distributed Lock & Cache Engine (Redis Simulator) ──────────
const inMemoryLocks = new Map(); // lockKey -> { userId, expiresAt }
const inMemoryCache = new Map(); // cacheKey -> { value, expiresAt }

// ─── Connect Redis ────────────────────────────────────────────────
const connectRedis = async () => {
  // If in fake DB mode or USE_FAKE_DB is not explicitly false, use mock Redis directly
  if (process.env.USE_FAKE_DB !== 'false') {
    isMockRedis = true;
    logger.info('⚡ [Redis Lock Coordinator] Running in High-Speed In-Memory Simulation mode (Atomic NX & TTL enabled)');
    return null;
  }

  try {
    const client = createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 1) return new Error('Redis connection failed');
          return 200;
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      logger.warn(`Redis client error: ${err.message}`);
    });

    client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await client.connect();
    redisClient = client;
    isMockRedis = false;
    return redisClient;
  } catch (err) {
    logger.warn(`⚠️ Could not connect to external Redis (${err.message}). Activating In-Memory Distributed Lock Manager (Mock Redis).`);
    isMockRedis = true;
    return null;
  }
};

// ─── Get Redis Client ─────────────────────────────────────────────
const getRedisClient = () => {
  if (isMockRedis) return null;
  if (!redisClient) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redisClient;
};

// ─── Cache Helper: SET with TTL ────────────────────────────────────
const setCache = async (key, value, ttlSeconds = 300) => {
  if (isMockRedis) {
    inMemoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return;
  }
  const client = getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
};

// ─── Cache Helper: GET ─────────────────────────────────────────────
const getCache = async (key) => {
  if (isMockRedis) {
    const item = inMemoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return item.value;
  }
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

// ─── Cache Helper: DELETE ──────────────────────────────────────────
const deleteCache = async (key) => {
  if (isMockRedis) {
    inMemoryCache.delete(key);
    return;
  }
  const client = getRedisClient();
  await client.del(key);
};

// ─── Seat Hold Lock: Acquire ──────────────────────────────────────
// Returns true if lock acquired, false if already locked (seat taken)
const acquireSeatLock = async (matchId, seatId, userId) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  const ttl = parseInt(process.env.SEAT_HOLD_TTL) || 600; // 10 min

  if (isMockRedis) {
    const now = Date.now();
    const existing = inMemoryLocks.get(lockKey);
    if (existing && existing.expiresAt > now) {
      return false; // Already locked by someone else (zero double-booking)
    }
    // Atomic NX lease acquisition
    inMemoryLocks.set(lockKey, { userId, expiresAt: now + ttl * 1000 });
    return true;
  }

  const client = getRedisClient();
  // NX = only set if NOT exists (atomic operation — no race condition)
  const result = await client.set(lockKey, userId, { NX: true, EX: ttl });
  return result === 'OK';
};

// ─── Seat Hold Lock: Release ──────────────────────────────────────
const releaseSeatLock = async (matchId, seatId) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  if (isMockRedis) {
    inMemoryLocks.delete(lockKey);
    return;
  }
  await deleteCache(lockKey);
};

// ─── Check if Seat is Locked ──────────────────────────────────────
const isSeatLocked = async (matchId, seatId) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  if (isMockRedis) {
    const existing = inMemoryLocks.get(lockKey);
    if (!existing) return false;
    if (Date.now() > existing.expiresAt) {
      inMemoryLocks.delete(lockKey);
      return false;
    }
    return true;
  }
  const client = getRedisClient();
  const val = await client.get(lockKey);
  return val !== null;
};

// ─── Get Active Holds for a Match ─────────────────────────────────
const getActiveHoldsForMatch = async (matchId) => {
  if (isMockRedis) {
    const prefix = `seat_lock:${matchId}:`;
    const now = Date.now();
    const heldSeats = [];
    for (const [key, lock] of inMemoryLocks.entries()) {
      if (key.startsWith(prefix)) {
        if (lock.expiresAt > now) {
          heldSeats.push(key.replace(prefix, ''));
        } else {
          inMemoryLocks.delete(key);
        }
      }
    }
    return heldSeats;
  }

  const client = getRedisClient();
  const keys = await client.keys(`seat_lock:${matchId}:*`);
  if (!keys || keys.length === 0) return [];
  return keys.map((key) => key.split(':')[2]);
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  acquireSeatLock,
  releaseSeatLock,
  isSeatLocked,
  getActiveHoldsForMatch,
  isMockRedis: () => isMockRedis,
};
