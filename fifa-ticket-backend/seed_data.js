const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfigs = [
  { region: 'europe', db: 'fifa_europe' },
  { region: 'asia', db: 'fifa_asia' },
  { region: 'north_am', db: 'fifa_north_am' },
  { region: 'south_am', db: 'fifa_south_am' },
];

const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const user = process.env.POSTGRES_SUPER_USER || 'postgres';
const password = process.env.POSTGRES_SUPER_PASSWORD || '2605';

const stadiumsData = {
  europe: [{ name: 'Wembley Stadium', city: 'London', country: 'England', capacity: 90000 }],
  asia: [{ name: 'Lusail Stadium', city: 'Lusail', country: 'Qatar', capacity: 88966 }],
  north_am: [{ name: 'MetLife Stadium', city: 'New York', country: 'USA', capacity: 82500 }],
  south_am: [{ name: 'Maracanã Stadium', city: 'Rio de Janeiro', country: 'Brazil', capacity: 78838 }]
};

const teamsData = {
  europe: ['England', 'France', 'Germany', 'Spain'],
  asia: ['Japan', 'South Korea', 'Saudi Arabia', 'Qatar'],
  north_am: ['USA', 'Mexico', 'Canada', 'Costa Rica'],
  south_am: ['Brazil', 'Argentina', 'Uruguay', 'Colombia']
};

async function insertSeats(client, matchId, capacity, categories) {
  const rowsPerSection = Math.ceil(capacity / 100);
  const batchSize = 1000;

  for (let offset = 0; offset < capacity; offset += batchSize) {
    const batchCount = Math.min(batchSize, capacity - offset);
    const values = [];
    const placeholders = [];

    for (let i = 0; i < batchCount; i++) {
      const seatIndex = offset + i;
      const sectionNumber = Math.floor(seatIndex / (rowsPerSection * 10)) + 1;
      const rowNumber = Math.floor((seatIndex % (rowsPerSection * 10)) / 10) + 1;
      const seatInRow = (seatIndex % 10) + 1;
      const vipThreshold = Math.floor(capacity * 0.05);
      const premiumThreshold = Math.floor(capacity * 0.25);
      const category = seatIndex < vipThreshold
        ? categories.vip
        : seatIndex < premiumThreshold
          ? categories.premium
          : categories.general;
      const valueOffset = values.length;

      values.push(
        uuidv4(),
        matchId,
        category.id,
        `${sectionNumber}-${rowNumber}-${seatInRow}`,
        String(rowNumber),
        `S-${sectionNumber}`,
        category.price
      );
      placeholders.push(
        `($${valueOffset + 1}, $${valueOffset + 2}, $${valueOffset + 3}, $${valueOffset + 4}, $${valueOffset + 5}, $${valueOffset + 6}, $${valueOffset + 7}, 'available')`
      );
    }

    await client.query(
      `INSERT INTO seats (id, match_id, category_id, seat_number, row_number, section, price, status)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (match_id, seat_number) DO NOTHING`,
      values
    );
  }
}

async function seed() {
  console.log('🌱 Seeding databases with sample data...');

  for (const config of dbConfigs) {
    const client = new Client({
      user, password, host, port, database: config.db
    });

    try {
      await client.connect();
      console.log(`\n Connected to ${config.db}...`);

      // 1. Insert Stadium
      const stadium = stadiumsData[config.region][0];
      const stadiumId = uuidv4();
      await client.query(`
        INSERT INTO stadiums (id, name, city, country, region, capacity)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [stadiumId, stadium.name, stadium.city, stadium.country, config.region, stadium.capacity]);
      
      console.log(`🏟️ Inserted Stadium: ${stadium.name}`);

      // 2. Insert Match
      const teams = teamsData[config.region];
      const matchId = uuidv4();
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 14); // Match 14 days from now

      await client.query(`
        INSERT INTO matches (id, home_team, away_team, stadium_id, match_date, tournament_stage, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
        ON CONFLICT (id) DO NOTHING
      `, [matchId, teams[0], teams[1], stadiumId, matchDate.toISOString(), 'Group Stage']);

      console.log(`⚽ Inserted Match: ${teams[0]} vs ${teams[1]}`);

      // 3. Insert Seat Categories
      const categories = {
        vip: { id: uuidv4(), name: 'VIP Hospitality', price: 550.00 },
        premium: { id: uuidv4(), name: 'Category 1 - Premium', price: 320.00 },
        general: { id: uuidv4(), name: 'Category 2 - Standard', price: 150.00 },
      };
      await client.query(`
        INSERT INTO seat_categories (id, stadium_id, name, base_price)
        VALUES ($1, $2, $3, $4), ($5, $2, $6, $7), ($8, $2, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        categories.vip.id, stadiumId, categories.vip.name, categories.vip.price,
        categories.premium.id, categories.premium.name, categories.premium.price,
        categories.general.id, categories.general.name, categories.general.price,
      ]);

      await insertSeats(client, matchId, stadium.capacity, categories);
      console.log(`💺 Created ${stadium.capacity.toLocaleString()} seats for the match.`);

      await client.end();
    } catch (err) {
      console.error(`❌ Error seeding ${config.db}:`, err.message);
    }
  }
  
  console.log('\n✅ Seeding complete!');
}

seed();
