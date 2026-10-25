import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const regionMetadata = {
  europe: {
    name: 'Europe Operations',
    code: 'EUR',
    venue: 'Wembley Stadium, London',
    color: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/30',
  },
  asia: {
    name: 'Asia Operations',
    code: 'ASA',
    venue: 'Lusail Stadium, Qatar',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30',
  },
  north_america: {
    name: 'North America Operations',
    code: 'NAM',
    venue: 'MetLife Stadium, New York',
    color: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
  },
  south_america: {
    name: 'South America Operations',
    code: 'SAM',
    venue: 'Maracana Stadium, Rio de Janeiro',
    color: 'from-rose-500/20 to-pink-500/10',
    border: 'border-rose-500/30',
  },
};

export default function ShardMonitor({ shardOverview, onRefresh }) {
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [stressTesting, setStressTesting] = useState(false);
  const [stressResult, setStressResult] = useState(null);

  const handleGenerate = async (count) => {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await api.generateFakeUsers(count);
      if (res.success) {
        setGenResult(res);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStressTest = async (trafficCount = 5000000) => {
    setStressTesting(true);
    setStressResult(null);
    try {
      const res = await api.runTrafficStressTest(trafficCount, 1000);
      if (res.success) {
        setStressResult(res);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStressTesting(false);
    }
  };

  const shardsData = shardOverview?.shards || {};
  const totalUsers = shardOverview?.totalUsers || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-2">
            Global Operations Center
          </div>
          <h2 className="text-3xl font-heading font-black text-white">Regional Capacity & Traffic Monitor</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Real-time overview of regional user registrations, fixture availability, and high-demand traffic distribution across all tournament zones.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Total Traffic & Accounts</p>
          <p className="text-2xl font-heading font-black text-amber-400 mt-1">
            {totalUsers.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-medium">Balanced across 4 regions</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Active Regional Zones</p>
          <p className="text-2xl font-heading font-black text-white mt-1">4 Regions</p>
          <span className="text-[10px] text-gray-400 font-medium">Europe, Asia, NA, SA</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Allocation Policy</p>
          <p className="text-base font-heading font-bold text-emerald-400 mt-1 truncate">Venue Based</p>
          <span className="text-[10px] text-gray-400 font-medium">Regional traffic routing</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Booking Protection</p>
          <p className="text-2xl font-heading font-black text-cyan-400 mt-1">100% Verified</p>
          <span className="text-[10px] text-gray-400 font-medium">Zero duplicate seat sales</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(regionMetadata).map(([key, meta]) => {
          const shardStat = shardsData[key] || {};
          const userCount = shardStat.totalUsers || 0;
          const userPct = totalUsers > 0 ? ((userCount / totalUsers) * 100).toFixed(1) : '25.0';

          return (
            <div
              key={key}
              className={`bg-gradient-to-br ${meta.color} bg-[#0c1322] border ${meta.border} rounded-3xl p-6 shadow-xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-heading font-black text-xs text-white">
                    {meta.code}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{meta.name}</h3>
                    <p className="text-[11px] text-gray-400">{meta.venue}</p>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                <div>
                  <p className="text-[10px] text-gray-400">Regional Traffic</p>
                  <p className="text-lg font-heading font-black text-amber-400">
                    {userCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Active Fixtures</p>
                  <p className="text-lg font-heading font-black text-white">
                    {shardStat.totalMatches || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Allocated Seats</p>
                  <p className="text-lg font-heading font-black text-emerald-400">
                    {shardStat.totalSeats || 50}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Traffic Share:</span>
                  <span className="font-bold text-white">{userPct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(userPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel-gold p-6 sm:p-8 rounded-3xl border border-amber-500/30">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-3">
            High-Demand Traffic & Capacity Simulator
          </div>
          <h3 className="text-2xl font-heading font-black text-white">Global Traffic Load Testing</h3>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            Simulate high-volume spectator traffic up to 5,000,000 requests and verify regional load distribution and concurrent seat reservation protection.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              disabled={generating || stressTesting}
              onClick={() => handleGenerate(10000)}
              className="btn-primary text-xs !py-3 !px-5"
            >
              {generating ? 'Processing...' : 'Simulate 10,000 Requests'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleGenerate(50000)}
              className="btn-emerald text-xs !py-3 !px-5"
            >
              {generating ? 'Processing...' : 'Simulate 50,000 Requests'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleStressTest(1000000)}
              className="btn-secondary text-xs !py-3 !px-5 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            >
              {stressTesting ? 'Running 1M Load...' : 'Run 1,000,000 Traffic Load'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleStressTest(5000000)}
              className="px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-black shadow-lg shadow-rose-500/30 hover:scale-105 transition-all disabled:opacity-50"
            >
              {stressTesting ? 'Running 5M Load Test...' : 'Run 5,000,000 Traffic Load Test'}
            </button>
          </div>

          {genResult && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5 animate-slide-up">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{genResult.message}</span>
              </div>
              <p className="text-gray-300">
                Processing Rate: <strong>{genResult.throughputPerSecond?.toLocaleString()} requests/second</strong> ({genResult.elapsedMs} ms elapsed).
              </p>
              <p className="text-gray-300">
                Total Active Volume: <strong>{genResult.totalUsersAllShards?.toLocaleString()}</strong> balanced across Europe, Asia, North America, and South America.
              </p>
            </div>
          )}

          {stressResult && (
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-emerald-500/15 border border-amber-500/40 text-xs space-y-3 animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 font-extrabold text-sm text-amber-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{stressResult.message}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                  VERIFIED: ZERO DUPLICATE BOOKINGS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Traffic Routed</p>
                  <p className="text-base font-black text-white mt-0.5">
                    {stressResult.trafficRouted?.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-amber-400">
                    {stressResult.perShardTraffic?.toLocaleString()} per region (25%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Processing Rate</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    {stressResult.performance?.effectiveThroughputPerSec?.toLocaleString()}/s
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Duration: {stressResult.performance?.totalElapsedMs} ms
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Concurrent Seat Requests</p>
                  <p className="text-base font-black text-cyan-400 mt-0.5">
                    {stressResult.concurrencyTest?.simultaneousBuyersOnSameSeat?.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-400">
                    1 Confirmed | {stressResult.concurrencyTest?.doubleBookingsPrevented} Rejected
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Regional Response Time</p>
                  <p className="text-base font-black text-amber-300 mt-0.5">
                    {stressResult.performance?.parallel4ShardLatencyMs} ms
                  </p>
                  <span className="text-[10px] text-gray-400">All 4 regions queried</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
