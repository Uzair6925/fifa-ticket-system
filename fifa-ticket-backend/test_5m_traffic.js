/**
 * test_5m_traffic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Live HTTP Stress & 5-Million Traffic Benchmark Runner
 * Can target either your local server (http://localhost:5000) OR your live
 * deployed Render URL (e.g., https://fifa-ticket-system.onrender.com)
 *
 * Usage:
 *   node test_5m_traffic.js [BASE_URL]
 *   e.g.: node test_5m_traffic.js http://localhost:5000
 *   e.g.: node test_5m_traffic.js https://your-app-name.onrender.com
 */

const targetUrl = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');

async function runLiveStressSuite() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🚀 FIFA 2026 DISTRIBUTED SYSTEM — LIVE 5-MILLION TRAFFIC STRESS TEST');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🌐 Target Endpoint : ${targetUrl}`);
  console.log(`📦 Architecture    : 4 Horizontal Shards (Europe, Asia, N.Am, S.Am) + Redis Mutex`);
  console.log('───────────────────────────────────────────────────────────────────────\n');

  try {
    // 1. Health & Connectivity Check
    console.log('📡 [Step 1/3] Verifying live server health...');
    const healthStart = Date.now();
    const healthRes = await fetch(`${targetUrl}/health`);
    const healthData = await healthRes.json();
    console.log(`✅ Server Online (${Date.now() - healthStart}ms): ${healthData.message}\n`);

    // 2. Concurrent HTTP Burst Test (Simulating simultaneous API gateway flood)
    const burstSize = 100;
    console.log(`⚡ [Step 2/3] Firing ${burstSize} parallel HTTP requests to /api/matches across 4 shards...`);
    const burstStart = Date.now();
    const burstResponses = await Promise.all(
      Array.from({ length: burstSize }, () => fetch(`${targetUrl}/api/matches`).then((r) => r.json()))
    );
    const burstElapsed = Date.now() - burstStart;
    const successCount = burstResponses.filter((r) => r && r.success).length;
    console.log(`✅ Parallel HTTP Burst Complete: ${successCount}/${burstSize} succeeded in ${burstElapsed}ms`);
    console.log(`🚀 HTTP Gateway Rate: ${Math.round((burstSize / (burstElapsed || 1)) * 1000).toLocaleString()} HTTP req/sec\n`);

    // 3. 5,000,000 Distributed Traffic & Concurrency Benchmark
    console.log('🔥 [Step 3/3] Triggering 5,000,000 Traffic Surge & 1,000-Buyer Seat Lock Contention...');
    const stressRes = await fetch(`${targetUrl}/api/admin/traffic-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetTraffic: 5000000,
        concurrentRequests: 1000,
      }),
    });
    const stressData = await stressRes.json();

    if (!stressData.success) {
      throw new Error(stressData.message || 'Traffic test failed');
    }

    console.log('\n🎉 5-MILLION TRAFFIC BENCHMARK REPORT:');
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log(`📈 Traffic Routed in Surge   : ${stressData.trafficRouted.toLocaleString()} requests`);
    console.log(`🌐 Total System Traffic      : ${stressData.totalTrafficAllShards.toLocaleString()} users across 4 shards`);
    console.log(`⚡ Processing Throughput     : ${stressData.performance.effectiveThroughputPerSec.toLocaleString()} users/sec (${stressData.performance.totalElapsedMs} ms)`);
    console.log(`⏱️ 4-Shard Parallel Latency  : ${stressData.performance.parallel4ShardLatencyMs} ms`);
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log('🔒 REDIS SETNX CONCURRENCY & ZERO DOUBLE-BOOKING PROOF:');
    console.log(`   • Simultaneous Buyers on VIP Seat #1 : ${stressData.concurrencyTest.simultaneousBuyersOnSameSeat.toLocaleString()}`);
    console.log(`   • Seat Locks Granted                 : ${stressData.concurrencyTest.locksGranted} (Winner)`);
    console.log(`   • Double-Bookings Blocked            : ${stressData.concurrencyTest.doubleBookingsPrevented.toLocaleString()} (409 Conflict)`);
    console.log(`   • Zero Double-Booking Verified       : ${stressData.concurrencyTest.zeroDoubleBookingVerified ? '✅ YES (100% Atomic)' : '❌ NO'}`);
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log('📊 REGIONAL SHARD DISTRIBUTION (25% HORIZONTAL BALANCE):');
    for (const [region, stat] of Object.entries(stressData.shardMetrics)) {
      const pct = ((stat.totalUsers / stressData.totalTrafficAllShards) * 100).toFixed(2);
      console.log(`   📍 [${stat.dbName.padEnd(14)}] (${region.padEnd(13)}) : ${stat.totalUsers.toLocaleString().padStart(11)} users (${pct}%)`);
    }
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error(`\n❌ Stress Test Error: ${err.message}`);
    console.error(`💡 Make sure your server is running at ${targetUrl} before running this test.`);
    process.exit(1);
  }
}

runLiveStressSuite();
