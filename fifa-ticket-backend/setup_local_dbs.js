const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbs = [
  { name: 'fifa_europe', sqlFile: 'database/init/init-europe.sql' },
  { name: 'fifa_asia', sqlFile: 'database/init/init-asia.sql' },
  { name: 'fifa_north_am', sqlFile: 'database/init/init-north-am.sql' },
  { name: 'fifa_south_am', sqlFile: 'database/init/init-south-am.sql' },
];

const superUser = process.env.POSTGRES_SUPER_USER || 'postgres';
const superPassword = process.env.POSTGRES_SUPER_PASSWORD || '2605';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');

async function main() {
  console.log('🚀 Setting up FIFA Databases on local PostgreSQL...');
  
  // Connect to default postgres DB
  const rootClient = new Client({
    user: superUser,
    password: superPassword,
    host: host,
    port: port,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('✅ Connected to local PostgreSQL superuser');

    for (const db of dbs) {
      // Check if database exists
      const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${db.name}'`);
      if (res.rowCount === 0) {
        console.log(`📦 Creating database: ${db.name}...`);
        await rootClient.query(`CREATE DATABASE ${db.name}`);
      } else {
        console.log(`ℹ️ Database ${db.name} already exists.`);
      }
    }
    await rootClient.end();

    // Now run SQL init scripts on each database
    for (const db of dbs) {
      console.log(`⚡ Initializing schema for ${db.name}...`);
      const dbClient = new Client({
        user: superUser,
        password: superPassword,
        host: host,
        port: port,
        database: db.name,
      });

      await dbClient.connect();
      const sqlPath = path.join(__dirname, db.sqlFile);
      let sql = fs.readFileSync(sqlPath, 'utf8');

      // Strip BOM and RAISE statements
      sql = sql.replace(/^\uFEFF/, '');
      sql = sql.split('\n').filter(line => !line.trim().startsWith('RAISE')).join('\n');

      await dbClient.query(sql);
      console.log(`✅ ${db.name} schema created & seeded successfully!`);
      await dbClient.end();
    }

    console.log('\n🎉🎉🎉 ALL 4 REGIONAL DATABASES ARE READY & POPULATED! 🎉🎉🎉');
  } catch (err) {
    console.error('❌ DB Setup Error:', err);
    process.exit(1);
  }
}

main();
