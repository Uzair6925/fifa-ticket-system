const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { batchInsertFakeUsers, streamPartitionedTraffic, getShardMetrics } = require('./src/config/fakeDatabase');

const regions = ['europe', 'asia', 'north_america', 'south_america'];
const targetCount = parseInt(process.argv[2], 10) || 5000000;
const batchSize = 100000;

console.log('---------------------------------------------------------------');
console.log('FIFA 2026 TICKETING PLATFORM - HIGH-VOLUME TRAFFIC GENERATOR');
console.log('---------------------------------------------------------------');
console.log(`Target Volume : ${targetCount.toLocaleString()} accounts/requests`);
console.log(`Regions       : Europe, Asia, North America, South America`);
console.log(`Batch Size    : ${batchSize.toLocaleString()} records/batch`);
console.log('---------------------------------------------------------------\n');

const defaultPasswordHash = bcrypt.hashSync('Pass1234!', 10);

const firstNames = ['Lucas', 'Mateo', 'Alex', 'Liam', 'Noah', 'Oliver', 'Kenji', 'Tariq', 'Arthur', 'Leo', 'Gabriel', 'Carlos', 'Marco', 'Julian', 'Ahmed', 'Ali'];
const lastNames = ['Silva', 'Garcia', 'Smith', 'Muller', 'Dupont', 'Rossi', 'Kim', 'Tanaka', 'Al-Mansoor', 'Hernandez', 'Johnson', 'Santos', 'Khan', 'Fernandez'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function runGenerator() {
  const startTime = Date.now();
  let totalCreated = 0;

  for (let offset = 0; offset < targetCount; offset += batchSize) {
    const currentBatchLimit = Math.min(batchSize, targetCount - offset);

    if (offset < 100000) {
      const batchByShard = {
        europe: [],
        asia: [],
        north_america: [],
        south_america: [],
      };

      for (let i = 0; i < currentBatchLimit; i++) {
        const idx = offset + i + 1;
        const region = regions[idx % 4];
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);

        batchByShard[region].push({
          id: uuidv4(),
          full_name: `${firstName} ${lastName}`,
          email: `fan_${idx}_${region}@fifafan.org`,
          password: defaultPasswordHash,
          phone: `+${(idx % 900) + 100}98765${idx % 10000}`,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      for (const r of regions) {
        batchInsertFakeUsers(r, batchByShard[r]);
      }
    } else {
      streamPartitionedTraffic(currentBatchLimit);
    }

    totalCreated += currentBatchLimit;
    const progress = ((totalCreated / targetCount) * 100).toFixed(1);
    const elapsedSec = Math.max((Date.now() - startTime) / 1000, 0.01);
    const rate = Math.round(totalCreated / elapsedSec);

    process.stdout.write(`\rProgress: ${totalCreated.toLocaleString()} / ${targetCount.toLocaleString()} (${progress}%) | Rate: ${rate.toLocaleString()} req/sec | Elapsed: ${elapsedSec.toFixed(2)}s`);
  }

  const totalTime = Math.max((Date.now() - startTime) / 1000, 0.01);
  console.log('\n\nTRAFFIC GENERATION COMPLETED');
  console.log(`Total Time Elapsed : ${totalTime.toFixed(2)} seconds`);
  console.log(`Average Throughput : ${Math.round(totalCreated / totalTime).toLocaleString()} requests/second\n`);

  console.log('REGIONAL DISTRIBUTION BREAKDOWN:');
  console.log('---------------------------------------------------------------');
  const metrics = getShardMetrics();
  for (const [r, stat] of Object.entries(metrics)) {
    const pct = ((stat.totalUsers / totalCreated) * 100).toFixed(2);
    console.log(`Region [${stat.dbName.padEnd(14)}] : ${stat.totalUsers.toLocaleString().padStart(11)} records (${pct}%)`);
  }
  console.log('---------------------------------------------------------------');
  console.log(`Total Volume Across All Regions: ${totalCreated.toLocaleString()}`);
  console.log('---------------------------------------------------------------\n');
}

runGenerator().catch(console.error);
