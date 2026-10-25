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

async function seed() {
  console.log('🌱 Seeding databases with sample data...');

  for (const config of dbConfigs) {
    const client = new Client({
      user, password, host, port, database: config.db
    });

    try {
      await client.connect();
      console.log(`\n📦 Connected to ${config.db}...`);

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
      const catId = uuidv4();
      await client.query(`
        INSERT INTO seat_categories (id, stadium_id, name, base_price)
        VALUES ($1, $2, 'General', 150.00)
        ON CONFLICT (id) DO NOTHING
      `, [catId, stadiumId]);

      // 4. Insert some Seats
      for (let i = 1; i <= 5; i++) {
        const seatId = uuidv4();
        await client.query(`
          INSERT INTO seats (id, match_id, category_id, seat_number, row_number, section, price, status)
          VALUES ($1, $2, $3, $4, 'A', '101', 150.00, 'available')
          ON CONFLICT (match_id, seat_number) DO NOTHING
        `, [seatId, matchId, catId, `A-${i}`]);
      }
      console.log(`💺 Inserted Seats for match.`);

      await client.end();
    } catch (err) {
      console.error(`❌ Error seeding ${config.db}:`, err.message);
    }
  }
  
  console.log('\n✅ Seeding complete!');
}

seed();
