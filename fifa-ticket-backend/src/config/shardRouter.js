const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const fakeDb = require('./fakeDatabase');
const logger = require('../utils/logger');

const useFakeDb = process.env.USE_FAKE_DB !== 'false';

const createMockPool = (region) => ({
  query: async (text, values = []) => fakeDb.executeSql(region, text, values),
  connect: async () => ({
    query: async (text, values = []) => fakeDb.executeSql(region, text, values),
    release: () => {},
  }),
});

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

if (useFakeDb) {
  logger.info('Regional database nodes initialized in in-memory mode');
} else {
  logger.info('Connected to live PostgreSQL regional nodes');
}

const countryToShard = {
  germany: 'europe', france: 'europe', spain: 'europe',
  italy: 'europe', england: 'europe', portugal: 'europe',
  netherlands: 'europe', belgium: 'europe', croatia: 'europe',
  japan: 'asia', south_korea: 'asia', australia: 'asia',
  saudi_arabia: 'asia', iran: 'asia', qatar: 'asia',
  usa: 'north_america', canada: 'north_america', mexico: 'north_america',
  brazil: 'south_america', argentina: 'south_america',
  colombia: 'south_america', chile: 'south_america', uruguay: 'south_america',
};

const normalizeRegionName = (region) => {
  let norm = region?.toLowerCase().replace(/ /g, '_');
  if (norm === 'north_am') norm = 'north_america';
  if (norm === 'south_am') norm = 'south_america';
  return norm;
};

const getShardByRegion = (region) => {
  const normalizedRegion = normalizeRegionName(region);
  const pool = shardPools[normalizedRegion];
  if (!pool) {
    throw new Error(`Invalid region: "${region}". Valid regions: europe, asia, north_america, south_america`);
  }
  return pool;
};

const getShardByCountry = (country) => {
  const normalizedCountry = country?.toLowerCase().replace(/ /g, '_');
  const region = countryToShard[normalizedCountry];
  if (!region) {
    throw new Error(`Country "${country}" is not mapped to a region.`);
  }
  return shardPools[region];
};

const getAllShards = () => {
  return Object.entries(shardPools).map(([region, pool]) => ({ region, pool }));
};

const testAllConnections = async () => {
  for (const [region, pool] of Object.entries(shardPools)) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info(`Connected to ${region.toUpperCase()} database node`);
    } catch (err) {
      logger.error(`Failed to connect to ${region.toUpperCase()} node: ${err.message}`);
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
