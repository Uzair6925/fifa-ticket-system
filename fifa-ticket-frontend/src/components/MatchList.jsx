import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, Users, Search, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const regionFlags = {
  europe: '🇪🇺',
  asia: '🇦ジア',
  north_america: '🇺🇸',
  south_america: '🇧🇷',
};

const teamFlags = {
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  'Saudi Arabia': '🇸🇦',
  Australia: '🇦🇺',
  USA: '🇺🇸',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
};

export default function MatchList({ matches, loading, onSelectMatch }) {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = matches.filter((m) => {
    const matchesRegion = selectedRegion === 'all' || m.shard === selectedRegion;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      m.home_team.toLowerCase().includes(query) ||
      m.away_team.toLowerCase().includes(query) ||
      m.stadium_name.toLowerCase().includes(query) ||
      m.stadium_city.toLowerCase().includes(query);

    return matchesRegion && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 sm:p-12 glass-panel-gold">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Official FIFA World Cup 2026 Ticketing
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-white leading-tight tracking-tight">
            Reserve Your Seat on the <span className="text-amber-400">Global Stage</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mt-3 leading-relaxed">
            Ultra-fast distributed booking powered by 4 regional database shards with atomic Redis seat locking.
            Zero double-booking, guaranteed.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Shard Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Shards' },
            { id: 'europe', label: '🇪🇺 Europe' },
            { id: 'asia', label: '🇦ジア Asia' },
            { id: 'north_america', label: '🇺🇸 North America' },
            { id: 'south_america', label: '🇧🇷 South America' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedRegion === tab.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or stadiums..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* Match Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Querying 4 Regional Database Shards in parallel...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-16 text-center glass-panel rounded-2xl border border-white/5 p-8">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-300">No matches found</h3>
          <p className="text-xs text-gray-500 mt-1">Try resetting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((match) => {
            const formattedDate = new Date(match.match_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={match.id}
                className="glass-panel hover:border-amber-500/40 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Tournament Stage & Regional Shard Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      {match.tournament_stage || 'FIFA Match'}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Shard: {match.shard?.toUpperCase()}
                    </span>
                  </div>

                  {/* Teams Matchup */}
                  <div className="my-5 flex items-center justify-between px-2">
                    {/* Home Team */}
                    <div className="flex-1 text-center">
                      <div className="text-3xl mb-1">{teamFlags[match.home_team] || '⚽'}</div>
                      <p className="text-sm font-extrabold text-white truncate">{match.home_team}</p>
                      <span className="text-[10px] text-gray-500 font-medium">Home</span>
                    </div>

                    {/* VS Badge */}
                    <div className="px-3">
                      <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-heading font-black text-xs text-amber-400">
                        VS
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center">
                      <div className="text-3xl mb-1">{teamFlags[match.away_team] || '⚽'}</div>
                      <p className="text-sm font-extrabold text-white truncate">{match.away_team}</p>
                      <span className="text-[10px] text-gray-500 font-medium">Away</span>
                    </div>
                  </div>

                  {/* Stadium & Schedule Details */}
                  <div className="space-y-2 pt-4 border-t border-white/5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{match.stadium_name}, {match.stadium_city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span>Capacity: {Number(match.capacity || 80000).toLocaleString()} seats</span>
                    </div>
                  </div>
                </div>

                {/* Booking CTA Button */}
                <button
                  onClick={() => onSelectMatch(match)}
                  className="w-full btn-emerald justify-center !py-2.5 text-xs tracking-wider uppercase mt-6 group-hover:scale-[1.02] transition-transform"
                >
                  <span>Select Seats</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
