const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isMockRedis = process.env.USE_FAKE_DB !== 'false';

const inMemoryLocks = new Map();
const inMemoryCache = new Map();

const connectRedis = async () => {
  if (process.env.USE_FAKE_DB !== 'false') {
    isMockRedis = true;
    logger.info('Reservation lock coordinator running in in-memory mode');
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
      logger.info('Redis connected successfully');
    });

    await client.connect();
    redisClient = client;
    isMockRedis = false;
    return redisClient;
  } catch (err) {
    logger.warn(`External Redis unavailable (${err.message}). Using in-memory lock manager.`);
    isMockRedis = true;
    return null;
  }
};

const getRedisClient = () => {
  if (isMockRedis) return null;
  if (!redisClient) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redisClient;
};

const setCache = async (key, value, ttlSeconds = 300) => {
  if (isMockRedis) {
    inMemoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return;
  }
  const client = getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
};

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

const deleteCache = async (key) => {
  if (isMockRedis) {
    inMemoryCache.delete(key);
    return;
  }
  const client = getRedisClient();
  await client.del(key);
};

const acquireSeatLock = async (matchId, seatId, userId) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  const ttl = parseInt(process.env.SEAT_HOLD_TTL) || 600;

  if (isMockRedis) {
    const now = Date.now();
    const existing = inMemoryLocks.get(lockKey);
    if (existing && existing.expiresAt > now) {
      if (existing.userId === userId) {
        existing.expiresAt = now + ttl * 1000;
        return true;
      }
      return false;
    }
    inMemoryLocks.set(lockKey, { userId, expiresAt: now + ttl * 1000 });
    return true;
  }

  const client = getRedisClient();
  const result = await client.set(lockKey, userId, { NX: true, EX: ttl });
  return result === 'OK';
};

const releaseSeatLock = async (matchId, seatId, userId = null) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  if (isMockRedis) {
    const existing = inMemoryLocks.get(lockKey);
    if (!existing) return true;
    if (userId && existing.userId !== userId) {
      return false;
    }
    inMemoryLocks.delete(lockKey);
    return true;
  }

  const client = getRedisClient();
  if (userId) {
    const owner = await client.get(lockKey);
    if (owner && owner !== userId) {
      return false;
    }
  }
  await deleteCache(lockKey);
  return true;
};

const isSeatLocked = async (matchId, seatId, userId = null) => {
  const lockKey = `seat_lock:${matchId}:${seatId}`;
  if (isMockRedis) {
    const existing = inMemoryLocks.get(lockKey);
    if (!existing) return false;
    if (Date.now() > existing.expiresAt) {
      inMemoryLocks.delete(lockKey);
      return false;
    }
    if (userId && existing.userId !== userId) {
      return false;
    }
    return true;
  }
  const client = getRedisClient();
  const val = await client.get(lockKey);
  if (val === null) return false;
  if (userId && val !== userId) return false;
  return true;
};

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
