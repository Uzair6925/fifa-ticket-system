import React from 'react';
import { Trophy, Globe2, Ticket, BarChart3, User, LogOut, ShieldCheck, Flame } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, shardOverview }) {
  const totalUsers = shardOverview?.totalUsers || 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060913]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('matches')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg tracking-wider text-white">
                FIFA <span className="text-amber-400">2026</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Distributed
              </span>
            </div>
            <p className="text-[11px] text-gray-400 tracking-wide font-medium">World Cup Ticketing Architecture</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matches'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            Fixtures & Matches
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'monitor'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Distributed Monitor
            {totalUsers > 0 && (
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                {totalUsers.toLocaleString()}
              </span>
            )}
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bookings'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ticket className="w-4 h-4" />
              My Tickets
            </button>
          )}
        </nav>

        {/* Right Section: User Status or Sign In */}
        <div className="flex items-center gap-3">
          {/* Shard Indicator Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">4 Regional Shards Active</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white/[0.05] border border-white/10 px-3.5 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    {user.full_name}
                    {user.role === 'admin' && (
                      <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1 py-0.2 rounded font-bold uppercase">Admin</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                    Shard: {user.home_region || 'Europe'}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-primary text-xs !py-2.5 !px-4"
            >
              <User className="w-4 h-4" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
