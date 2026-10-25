-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
--  FIFA TICKET BOOKING SYSTEM
--  Database Init Script â€” North America Shard
--  Runs automatically when Docker container starts for first time
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- â”€â”€â”€ USERS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ STADIUMS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS stadiums (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    country     VARCHAR(100) NOT NULL,
    region      VARCHAR(50)  NOT NULL DEFAULT 'north_america',
    capacity    INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ MATCHES TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team       VARCHAR(100) NOT NULL,
    away_team       VARCHAR(100) NOT NULL,
    stadium_id      UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    match_date      TIMESTAMP NOT NULL,
    tournament_stage VARCHAR(50) DEFAULT 'Group Stage',
    status          VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ SEAT CATEGORIES TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS seat_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id  UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,   -- e.g., 'VIP', 'Premium', 'General'
    base_price  NUMERIC(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ SEATS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS seats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES seat_categories(id),
    seat_number     VARCHAR(10) NOT NULL,   -- e.g., 'A-12', 'B-45'
    row_number      VARCHAR(5),
    section         VARCHAR(10),
    price           NUMERIC(10,2) NOT NULL,
    status          VARCHAR(15) DEFAULT 'available' CHECK (status IN ('available','reserved','booked','unavailable')),
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, seat_number)
);

-- â”€â”€â”€ BOOKINGS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    match_id        UUID NOT NULL REFERENCES matches(id),
    total_amount    NUMERIC(10,2) NOT NULL,
    status          VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','refunded')),
    booked_at       TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ BOOKING_SEATS (Junction Table) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS booking_seats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id     UUID NOT NULL REFERENCES seats(id),
    UNIQUE(booking_id, seat_id)
);

-- â”€â”€â”€ PAYMENTS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    amount              NUMERIC(10,2) NOT NULL,
    payment_status      VARCHAR(15) DEFAULT 'pending' CHECK (payment_status IN ('pending','success','failed','refunded')),
    transaction_id      VARCHAR(100) UNIQUE,
    payment_method      VARCHAR(30),
    paid_at             TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ AUDIT LOG TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name      VARCHAR(50) NOT NULL,
    record_id       UUID NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    changed_by      UUID,          -- user who made the change
    old_values      JSONB,
    new_values      JSONB,
    shard_name      VARCHAR(30) DEFAULT 'north_america',
    created_at      TIMESTAMP DEFAULT NOW()
);

-- â”€â”€â”€ INDEXES for fast search & sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Full-text search on teams and stadium name
CREATE INDEX IF NOT EXISTS idx_matches_home_team   ON matches USING GIN (to_tsvector('english', home_team));
CREATE INDEX IF NOT EXISTS idx_matches_away_team   ON matches USING GIN (to_tsvector('english', away_team));
CREATE INDEX IF NOT EXISTS idx_stadiums_name       ON stadiums USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_stadiums_city       ON stadiums USING GIN (to_tsvector('english', city));

-- B-tree indexes for numeric filters and sorting
CREATE INDEX IF NOT EXISTS idx_matches_date        ON matches (match_date);
CREATE INDEX IF NOT EXISTS idx_seats_price         ON seats (price);
CREATE INDEX IF NOT EXISTS idx_seats_status        ON seats (status);
CREATE INDEX IF NOT EXISTS idx_seats_match_id      ON seats (match_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_match_id   ON bookings (match_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings (status);

-- Composite indexes for common combined filter queries
CREATE INDEX IF NOT EXISTS idx_seats_match_status  ON seats (match_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches (match_date, status);

RAISE NOTICE 'âœ… North America Shard schema initialized successfully!';
