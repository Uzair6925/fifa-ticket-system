const targetUrl = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');

async function runLiveStressSuite() {
  console.log('-----------------------------------------------------------------------');
  console.log('FIFA 2026 TICKETING PLATFORM - 50-MILLION TRAFFIC LOAD TEST');
  console.log('-----------------------------------------------------------------------');
  console.log(`Target Endpoint : ${targetUrl}`);
  console.log('-----------------------------------------------------------------------\n');

  try {
    console.log('[Step 1/3] Checking service health...');
    const healthStart = Date.now();
    const healthRes = await fetch(`${targetUrl}/health`);
    const healthData = await healthRes.json();
    console.log(`Service Online (${Date.now() - healthStart}ms): ${healthData.message}\n`);

    const burstSize = 100;
    console.log(`[Step 2/3] Sending ${burstSize} concurrent HTTP requests to /api/matches...`);
    const burstStart = Date.now();
    const burstResponses = await Promise.all(
      Array.from({ length: burstSize }, () => fetch(`${targetUrl}/api/matches`).then((r) => r.json()))
    );
    const burstElapsed = Date.now() - burstStart;
    const successCount = burstResponses.filter((r) => r && r.success).length;
    console.log(`Concurrent HTTP Burst Complete: ${successCount}/${burstSize} succeeded in ${burstElapsed}ms`);
    console.log(`Gateway Throughput: ${Math.round((burstSize / (burstElapsed || 1)) * 1000).toLocaleString()} req/sec\n`);

    console.log('[Step 3/3] Running 50,000,000 Traffic Load & Seat Reservation Contention Test...');
    const stressRes = await fetch(`${targetUrl}/api/admin/traffic-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetTraffic: 50000000,
        concurrentRequests: 1000,
      }),
    });
    const stressData = await stressRes.json();

    if (!stressData.success) {
      throw new Error(stressData.message || 'Traffic test failed');
    }

    console.log('\nTRAFFIC & CONCURRENCY REPORT:');
    console.log('-----------------------------------------------------------------------');
    console.log(`Traffic Processed           : ${stressData.trafficRouted.toLocaleString()} requests`);
    console.log(`Total System Volume         : ${stressData.totalTrafficAllShards.toLocaleString()} records`);
    console.log(`Processing Throughput       : ${stressData.performance.effectiveThroughputPerSec.toLocaleString()} req/sec (${stressData.performance.totalElapsedMs} ms)`);
    console.log(`Regional Query Latency      : ${stressData.performance.parallel4ShardLatencyMs} ms`);
    console.log('-----------------------------------------------------------------------');
    console.log('CONCURRENT SEAT RESERVATION VERIFICATION:');
    console.log(`  Simultaneous Requests (Same Seat) : ${stressData.concurrencyTest.simultaneousBuyersOnSameSeat.toLocaleString()}`);
    console.log(`  Reservations Granted              : ${stressData.concurrencyTest.locksGranted}`);
    console.log(`  Duplicate Attempts Blocked        : ${stressData.concurrencyTest.doubleBookingsPrevented.toLocaleString()}`);
    console.log(`  Zero Double-Booking Verified      : ${stressData.concurrencyTest.zeroDoubleBookingVerified ? 'YES' : 'NO'}`);
    console.log('-----------------------------------------------------------------------');
    console.log('REGIONAL LOAD DISTRIBUTION:');
    for (const [region, stat] of Object.entries(stressData.shardMetrics)) {
      const pct = ((stat.totalUsers / stressData.totalTrafficAllShards) * 100).toFixed(2);
      console.log(`  [${stat.dbName.padEnd(14)}] (${region.padEnd(13)}) : ${stat.totalUsers.toLocaleString().padStart(11)} (${pct}%)`);
    }
    console.log('-----------------------------------------------------------------------\n');
  } catch (err) {
    console.error(`\nLoad Test Error: ${err.message}`);
    console.error(`Ensure the server is running at ${targetUrl} before executing this script.`);
    process.exit(1);
  }
}

runLiveStressSuite();
