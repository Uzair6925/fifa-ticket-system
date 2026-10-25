/**
 * shardRouter.js — PostgreSQL Shard Router & Distributed Manager
 * ─────────────────────────────────────────────────────────────
 * Geographically partitions the system across 4 Regional Shards:
 *  - fifa_europe
 *  - fifa_asia
 *  - fifa_north_am
 *  - fifa_south_am
 *
 * SHARDING KEY: stadium_region (Venue Location)
 * Supports both real PostgreSQL clusters and an in-memory high-speed
 * Distributed Fake Database for seamless academic presentation & millions-user testing.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const fakeDb = require('./fakeDatabase');
const logger = require('../utils/logger');

// Check if Fake Database mode is activated (Default: true for frictionless local demo)
const useFakeDb = process.env.USE_FAKE_DB !== 'false';

// ─── Create Mock Shard Pool (In-Memory Distributed Simulation) ────
const createMockPool = (region) => ({
  query: async (text, values = []) => fakeDb.executeSql(region, text, values),
  connect: async () => ({
    query: async (text, values = []) => fakeDb.executeSql(region, text, values),
    release: () => {},
  }),
});

// ─── Create Real or Mock Pools for Each Shard ─────────────────────
const shardPools = {
  europe: useFakeDb
    ? createMockPool('europe')
    : new Pool({
        host: process.env.DB_EUROPE_HOST || 'localhost',
        port: parseInt(process.env.DB_EUROPE_PORT) || 5432,
        database: process.env.DB_EUROPE_NAME || 'fifa_europe',
        user: process.env.DB_EUROPE_USER || 'postgres',
        password: process.env.DB_EUROPE_PASSWORD || '2605',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),

  asia: useFakeDb
    ? createMockPool('asia')
    : new Pool({
        host: process.env.DB_ASIA_HOST || 'localhost',
        port: parseInt(process.env.DB_ASIA_PORT) || 5432,
        database: process.env.DB_ASIA_NAME || 'fifa_asia',
        user: process.env.DB_ASIA_USER || 'postgres',
        password: process.env.DB_ASIA_PASSWORD || '2605',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),

  north_america: useFakeDb
    ? createMockPool('north_america')
    : new Pool({
        host: process.env.DB_NORTH_AM_HOST || 'localhost',
        port: parseInt(process.env.DB_NORTH_AM_PORT) || 5432,
        database: process.env.DB_NORTH_AM_NAME || 'fifa_north_am',
        user: process.env.DB_NORTH_AM_USER || 'postgres',
        password: process.env.DB_NORTH_AM_PASSWORD || '2605',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),

  south_america: useFakeDb
    ? createMockPool('south_america')
    : new Pool({
        host: process.env.DB_SOUTH_AM_HOST || 'localhost',
        port: parseInt(process.env.DB_SOUTH_AM_PORT) || 5432,
        database: process.env.DB_SOUTH_AM_NAME || 'fifa_south_am',
        user: process.env.DB_SOUTH_AM_USER || 'postgres',
        password: process.env.DB_SOUTH_AM_PASSWORD || '2605',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),
};

// Log active mode
if (useFakeDb) {
  logger.info('📦 [ShardRouter] 4 Regional Shards initialized in Fake / In-Memory Sharded Mode (fifa_europe, fifa_asia, fifa_north_am, fifa_south_am)');
} else {
  logger.info('📦 [ShardRouter] Connected to Live PostgreSQL Regional Shards');
}

// ─── Shard Mapping: Country → Region ─────────────────────────────
const countryToShard = {
  // Europe
  germany: 'europe', france: 'europe', spain: 'europe',
  italy: 'europe', england: 'europe', portugal: 'europe',
  netherlands: 'europe', belgium: 'europe', croatia: 'europe',

  // Asia
  japan: 'asia', south_korea: 'asia', australia: 'asia',
  saudi_arabia: 'asia', iran: 'asia', qatar: 'asia',

  // North America
  usa: 'north_america', canada: 'north_america', mexico: 'north_america',

  // South America
  brazil: 'south_america', argentina: 'south_america',
  colombia: 'south_america', chile: 'south_america', uruguay: 'south_america',
};

// ─── Normalize Region Helper ──────────────────────────────────────
const normalizeRegionName = (region) => {
  let norm = region?.toLowerCase().replace(/ /g, '_');
  if (norm === 'north_am') norm = 'north_america';
  if (norm === 'south_am') norm = 'south_america';
  return norm;
};

// ─── Get Shard Pool by Region Name ───────────────────────────────
const getShardByRegion = (region) => {
  const normalizedRegion = normalizeRegionName(region);
  const pool = shardPools[normalizedRegion];
  if (!pool) {
    throw new Error(`❌ No shard found for region: "${region}". Valid: europe | asia | north_america | south_america`);
  }
  return pool;
};

// ─── Get Shard Pool by Country ────────────────────────────────────
const getShardByCountry = (country) => {
  const normalizedCountry = country?.toLowerCase().replace(/ /g, '_');
  const region = countryToShard[normalizedCountry];
  if (!region) {
    throw new Error(`❌ Country "${country}" not mapped to any shard.`);
  }
  return shardPools[region];
};

// ─── Get ALL Shards (for global queries across all 4 shards) ──────
const getAllShards = () => {
  return Object.entries(shardPools).map(([region, pool]) => ({ region, pool }));
};

// ─── Test All DB Connections ──────────────────────────────────────
const testAllConnections = async () => {
  for (const [region, pool] of Object.entries(shardPools)) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info(`✅ [ShardRouter] Connected to ${region.toUpperCase()} shard`);
    } catch (err) {
      logger.error(`❌ [ShardRouter] Failed to connect to ${region.toUpperCase()} shard: ${err.message}`);
    }
  }
};

module.exports = {
  getShardByRegion,
  getShardByCountry,
  getAllShards,
  testAllConnections,
  shardPools,
  isUsingFakeDb: () => useFakeDb,
};
