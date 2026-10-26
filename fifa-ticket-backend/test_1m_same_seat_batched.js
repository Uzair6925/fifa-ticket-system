const {
  acquireSeatLock,
  connectRedis,
  getRedisClient,
  isMockRedis,
  releaseSeatLock,
} = require('./src/config/redisClient');

const totalAttempts = Number.parseInt(process.argv[2] || '1000000', 10);
const batchSize = Number.parseInt(process.argv[3] || '1000', 10);
const maxAttempts = 1000000;
const maxBatchSize = 1000;
const matchId = 'load-test-same-seat';
const seatId = 'single-contention-seat';

if (!Number.isInteger(totalAttempts) || totalAttempts < 1 || totalAttempts > maxAttempts) {
  throw new Error(`Total attempts must be between 1 and ${maxAttempts}.`);
}

if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > maxBatchSize) {
  throw new Error(`Batch size must be between 1 and ${maxBatchSize}.`);
}

async function runBatchedSameSeatTest() {
  await connectRedis();

  if (process.env.USE_FAKE_DB === 'false' && isMockRedis()) {
    throw new Error('Redis is required for this test, but Redis is unavailable. Test stopped.');
  }

  console.log(`Lock provider: ${isMockRedis() ? 'in-memory simulation' : 'Redis'}`);
  console.log(`Total simulated users: ${totalAttempts.toLocaleString()}`);
  console.log(`Concurrent attempts per batch: ${batchSize.toLocaleString()}`);
  console.log('All attempts contend for one test-only seat lock; the first winner keeps it until completion.\n');

  const startTime = Date.now();
  let attempted = 0;
  let granted = 0;
  let rejected = 0;
  let winningUserId = null;
  let failure = null;

  try {
    while (attempted < totalAttempts) {
      const currentBatchSize = Math.min(batchSize, totalAttempts - attempted);
      const batchStart = attempted;
      const results = await Promise.all(
        Array.from({ length: currentBatchSize }, (_, index) => {
          const userId = `load-test-user-${batchStart + index + 1}`;
          return acquireSeatLock(matchId, seatId, userId).then((acquired) => ({ userId, acquired }));
        })
      );

      for (const result of results) {
        if (result.acquired) {
          granted++;
          winningUserId = result.userId;
        } else {
          rejected++;
        }
      }

      attempted += currentBatchSize;

      if (winningUserId && attempted < totalAttempts) {
        const renewed = await acquireSeatLock(matchId, seatId, winningUserId);
        if (!renewed) {
          throw new Error('The winning seat lock expired or could not be renewed during the test.');
        }
      }

      if (attempted === totalAttempts || attempted % 100000 === 0) {
        const percent = ((attempted / totalAttempts) * 100).toFixed(1);
        console.log(`Progress: ${attempted.toLocaleString()}/${totalAttempts.toLocaleString()} (${percent}%)`);
      }
    }
  } catch (error) {
    failure = error;
  } finally {
    if (winningUserId) {
      await releaseSeatLock(matchId, seatId, winningUserId);
    }

    const client = getRedisClient();
    if (client?.isOpen) {
      await client.quit();
    }
  }

  if (failure) throw failure;

  const elapsedMs = Date.now() - startTime;
  const verified = granted === 1 && rejected === totalAttempts - 1;

  console.log('\nSame-seat lock contention result');
  console.log(`Attempts: ${attempted.toLocaleString()}`);
  console.log(`Locks granted: ${granted}`);
  console.log(`Attempts rejected: ${rejected.toLocaleString()}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)} seconds`);
  console.log(`Result: ${verified ? 'PASS — exactly one lock granted' : 'FAIL — unexpected lock count'}`);

  if (!verified) {
    process.exitCode = 1;
  }
}

runBatchedSameSeatTest().catch((error) => {
  console.error(`Same-seat test failed: ${error.message}`);
  process.exitCode = 1;
});
