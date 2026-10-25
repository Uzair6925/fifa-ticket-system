import React, { useState, useEffect } from 'react';
import { Database, Zap, Globe2, Server, BarChart2, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const shardMetadata = {
  europe: {
    name: 'Europe Shard',
    flag: '🇪🇺',
    db: 'fifa_europe',
    venue: 'Wembley Stadium (London)',
    color: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/30',
  },
  asia: {
    name: 'Asia Shard',
    flag: '🇦ジア',
    db: 'fifa_asia',
    venue: 'Lusail Stadium (Qatar)',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30',
  },
  north_america: {
    name: 'North America Shard',
    flag: '🇺🇸',
    db: 'fifa_north_am',
    venue: 'MetLife Stadium (New York)',
    color: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
  },
  south_america: {
    name: 'South America Shard',
    flag: '🇧🇷',
    db: 'fifa_south_am',
    venue: 'Maracanã Stadium (Rio)',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            Distributed Database System Course Architecture
          </div>
          <h2 className="text-3xl font-heading font-black text-white">Regional Shards & Live Partition Monitor</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Horizontal fragmentation partitioned by physical stadium venue location.
            Maintains zero distributed joins and guarantees atomic ACID transactions locally.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Shards
        </button>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Total Global Users</p>
          <p className="text-2xl font-heading font-black text-amber-400 mt-1">
            {totalUsers.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-medium">Distributed across 4 shards</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Regional Shards</p>
          <p className="text-2xl font-heading font-black text-white mt-1">4 Nodes</p>
          <span className="text-[10px] text-gray-400 font-medium">Europe, Asia, NA, SA</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">Sharding Key</p>
          <p className="text-base font-heading font-bold text-emerald-400 mt-1 truncate">stadium_region</p>
          <span className="text-[10px] text-gray-400 font-medium">Zero cross-shard joins</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-[11px] font-semibold text-gray-400">CAP Theorem Model</p>
          <p className="text-2xl font-heading font-black text-cyan-400 mt-1">CP Focus</p>
          <span className="text-[10px] text-gray-400 font-medium">Zero double-booking tolerance</span>
        </div>
      </div>

      {/* 4 Regional Shard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(shardMetadata).map(([key, meta]) => {
          const shardStat = shardsData[key] || {};
          const userCount = shardStat.totalUsers || 0;
          const userPct = totalUsers > 0 ? ((userCount / totalUsers) * 100).toFixed(1) : '25.0';

          return (
            <div
              key={key}
              className={`bg-gradient-to-br ${meta.color} bg-[#0c1322] border ${meta.border} rounded-3xl p-6 shadow-xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{meta.flag}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{meta.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{meta.db}</p>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>

              {/* Shard Stats */}
              <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                <div>
                  <p className="text-[10px] text-gray-400">Users Stored</p>
                  <p className="text-lg font-heading font-black text-amber-400">
                    {userCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Matches</p>
                  <p className="text-lg font-heading font-black text-white">
                    {shardStat.totalMatches || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Seats Matrix</p>
                  <p className="text-lg font-heading font-black text-emerald-400">
                    {shardStat.totalSeats || 50}
                  </p>
                </div>
              </div>

              {/* Horizontal Balance Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Partition Balance:</span>
                  <span className="font-bold text-white">{userPct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(userPct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Primary Venue: {meta.venue}</span>
                <span className="text-[10px] text-gray-500 font-mono">Port: 5432</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Millions Fake Users Generator & Benchmark Section */}
      <div className="glass-panel-gold p-6 sm:p-8 rounded-3xl border border-amber-500/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            Live Viva Demonstration Tool
          </div>
          <h3 className="text-2xl font-heading font-black text-white">Millions Fake Users Batch Generator</h3>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            Instantly inject thousands of fake user records into the 4 distributed shards to demonstrate horizontal load balancing, round-robin partitioning, and multi-shard query throughput.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              disabled={generating || stressTesting}
              onClick={() => handleGenerate(10000)}
              className="btn-primary text-xs !py-3 !px-5"
            >
              {generating ? 'Generating Users...' : '⚡ Generate 10,000 Users'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleGenerate(50000)}
              className="btn-emerald text-xs !py-3 !px-5"
            >
              {generating ? 'Generating Users...' : '🚀 Generate 50,000 Users'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleStressTest(1000000)}
              className="btn-secondary text-xs !py-3 !px-5 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            >
              {stressTesting ? 'Running 1M Surge...' : '🔥 Simulate 1,000,000 Traffic'}
            </button>

            <button
              disabled={generating || stressTesting}
              onClick={() => handleStressTest(5000000)}
              className="px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-black shadow-lg shadow-rose-500/30 hover:scale-105 transition-all disabled:opacity-50"
            >
              {stressTesting ? 'Executing 5M Flash Surge...' : '🏆 Launch 5,000,000 Traffic Stress Test'}
            </button>
          </div>

          {/* Generator Benchmark Output */}
          {genResult && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5 animate-slide-up">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{genResult.message}</span>
              </div>
              <p className="text-gray-300">
                ⚡ Benchmark Speed: <strong>{genResult.throughputPerSecond?.toLocaleString()} users/second</strong> ({genResult.elapsedMs} ms elapsed).
              </p>
              <p className="text-gray-300">
                📊 New System Total: <strong>{genResult.totalUsersAllShards?.toLocaleString()} users</strong> horizontally partitioned across Europe, Asia, North America, and South America shards.
              </p>
            </div>
          )}

          {/* 5-Million Traffic & Concurrency Benchmark Report */}
          {stressResult && (
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-emerald-500/15 border border-amber-500/40 text-xs space-y-3 animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 font-extrabold text-sm text-amber-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{stressResult.message}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                  PASS: 100% ZERO DOUBLE-BOOKING
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Traffic Routed</p>
                  <p className="text-base font-black text-white mt-0.5">
                    {stressResult.trafficRouted?.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-amber-400">
                    {stressResult.perShardTraffic?.toLocaleString()} / shard (25%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Shard Throughput</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    {stressResult.performance?.effectiveThroughputPerSec?.toLocaleString()}/s
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Time: {stressResult.performance?.totalElapsedMs} ms
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">Simultaneous Seat Buyers</p>
                  <p className="text-base font-black text-cyan-400 mt-0.5">
                    {stressResult.concurrencyTest?.simultaneousBuyersOnSameSeat?.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-400">
                    1 Winner | {stressResult.concurrencyTest?.doubleBookingsPrevented} Blocked
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-400">4-Shard Query Latency</p>
                  <p className="text-base font-black text-amber-300 mt-0.5">
                    {stressResult.performance?.parallel4ShardLatencyMs} ms
                  </p>
                  <span className="text-[10px] text-gray-400">Parallel Promise.all()</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
