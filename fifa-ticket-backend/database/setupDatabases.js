/**
 * setupDatabases.js
 * ─────────────────
 * Yeh script:
 * 1. 4 PostgreSQL databases create karta hai
 * 2. Har database mein saari tables + indexes banata hai
 * 3. Connection test karta hai
 *
 * Run: node database/setupDatabases.js
 */

require('dotenv').config();
const { Client } = require('pg');

// ─── Shard Config ─────────────────────────────────────────────────
const shards = [
  {
    name: 'europe',
    db: process.env.DB_EUROPE_NAME || 'fifa_europe',
    host: process.env.DB_EUROPE_HOST || 'localhost',
    port: parseInt(process.env.DB_EUROPE_PORT) || 5432,
    user: process.env.DB_EUROPE_USER || 'fifa_admin',
    password: process.env.DB_EUROPE_PASSWORD || 'fifa_pass_2026',
  },
  {
    name: 'asia',
    db: process.env.DB_ASIA_NAME || 'fifa_asia',
    host: process.env.DB_ASIA_HOST || 'localhost',
    port: parseInt(process.env.DB_ASIA_PORT) || 5432,
    user: process.env.DB_ASIA_USER || 'fifa_admin',
    password: process.env.DB_ASIA_PASSWORD || 'fifa_pass_2026',
  },
  {
    name: 'north_america',
    db: process.env.DB_NORTH_AM_NAME || 'fifa_north_am',
    host: process.env.DB_NORTH_AM_HOST || 'localhost',
    port: parseInt(process.env.DB_NORTH_AM_PORT) || 5432,
    user: process.env.DB_NORTH_AM_USER || 'fifa_admin',
    password: process.env.DB_NORTH_AM_PASSWORD || 'fifa_pass_2026',
  },
  {
    name: 'south_america',
    db: process.env.DB_SOUTH_AM_NAME || 'fifa_south_am',
    host: process.env.DB_SOUTH_AM_HOST || 'localhost',
    port: parseInt(process.env.DB_SOUTH_AM_PORT) || 5432,
    user: process.env.DB_SOUTH_AM_USER || 'fifa_admin',
    password: process.env.DB_SOUTH_AM_PASSWORD || 'fifa_pass_2026',
  },
];

// ─── Schema SQL ───────────────────────────────────────────────────
const getSchema = (region) => `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stadiums (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    country     VARCHAR(100) NOT NULL,
    region      VARCHAR(50)  NOT NULL DEFAULT '${region}',
    capacity    INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS matches (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team        VARCHAR(100) NOT NULL,
    away_team        VARCHAR(100) NOT NULL,
    stadium_id       UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    match_date       TIMESTAMP NOT NULL,
    tournament_stage VARCHAR(50) DEFAULT 'Group Stage',
    status           VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    created_at       TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS seat_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id  UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    base_price  NUMERIC(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS seats (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES seat_categories(id),
    seat_number  VARCHAR(10) NOT NULL,
    row_number   VARCHAR(5),
    section      VARCHAR(10),
    price        NUMERIC(10,2) NOT NULL,
    status       VARCHAR(15) DEFAULT 'available' CHECK (status IN ('available','reserved','booked','unavailable')),
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, seat_number)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id),
    match_id      UUID NOT NULL REFERENCES matches(id),
    total_amount  NUMERIC(10,2) NOT NULL,
    status        VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','refunded')),
    booked_at     TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS booking_seats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id     UUID NOT NULL REFERENCES seats(id),
    UNIQUE(booking_id, seat_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    amount          NUMERIC(10,2) NOT NULL,
    payment_status  VARCHAR(15) DEFAULT 'pending' CHECK (payment_status IN ('pending','success','failed','refunded')),
    transaction_id  VARCHAR(100) UNIQUE,
    payment_method  VARCHAR(30),
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name  VARCHAR(50) NOT NULL,
    record_id   UUID NOT NULL,
    action      VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    changed_by  UUID,
    old_values  JSONB,
    new_values  JSONB,
    shard_name  VARCHAR(30) DEFAULT '${region}',
    created_at  TIMESTAMP DEFAULT NOW()
  );

  -- Indexes for fast search & sort
  CREATE INDEX IF NOT EXISTS idx_matches_date       ON matches (match_date);
  CREATE INDEX IF NOT EXISTS idx_seats_price        ON seats (price);
  CREATE INDEX IF NOT EXISTS idx_seats_status       ON seats (status);
  CREATE INDEX IF NOT EXISTS idx_seats_match_id     ON seats (match_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON bookings (user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_match_id  ON bookings (match_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings (status);
  CREATE INDEX IF NOT EXISTS idx_seats_match_status ON seats (match_id, status);
  CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches (match_date, status);
`;

// ─── Create DB if not exists ──────────────────────────────────────
async function createDatabase(shard) {
  // Connect to default postgres DB first to create new DB
  const adminClient = new Client({
    host: shard.host,
    port: shard.port,
    user: 'postgres',          // default superuser
    password: shard.password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    // Check if DB exists
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [shard.db]
    );
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${shard.db}`);
      console.log(`  Database "${shard.db}" created`);
    } else {
      console.log(`  Database "${shard.db}" already exists`);
    }

    // Create user if not exists
    const userRes = await adminClient.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`, [shard.user]
    );
    if (userRes.rowCount === 0) {
      await adminClient.query(
        `CREATE USER ${shard.user} WITH PASSWORD '${shard.password}'`
      );
      console.log(` User "${shard.user}" created`);
    }

    // Grant privileges
    await adminClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE ${shard.db} TO ${shard.user}`
    );
  } finally {
    await adminClient.end();
  }
}

// ─── Apply Schema ─────────────────────────────────────────────────
async function applySchema(shard) {
  const client = new Client({
    host: shard.host,
    port: shard.port,
    user: 'postgres',
    password: shard.password,
    database: shard.db,
  });

  try {
    await client.connect();
    await client.query(getSchema(shard.name));
    console.log(` Schema applied to "${shard.db}"`);
  } finally {
    await client.end();
  }
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('\nFIFA Ticket DB Setup Starting...\n');
  console.log('━'.repeat(50));

  for (const shard of shards) {
    console.log(`\n Setting up [${shard.name.toUpperCase()}] shard → ${shard.db}`);
    try {
      await createDatabase(shard);
      await applySchema(shard);
      console.log(` [${shard.name.toUpperCase()}] COMPLETE!`);
    } catch (err) {
      console.error(` [${shard.name.toUpperCase()}] ERROR:`, err.message);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('All shards setup complete!\n');
  console.log('Databases created:');
  shards.forEach(s => console.log(`   • ${s.db} (port ${s.port})`));
  console.log('\n Now run: npm run dev\n');
}

main().catch(console.error);
