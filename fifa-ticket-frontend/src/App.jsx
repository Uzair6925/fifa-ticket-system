import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MatchList from './components/MatchList';
import SeatSelectorModal from './components/SeatSelectorModal';
import AuthModal from './components/AuthModal';
import MyBookings from './components/MyBookings';
import ShardMonitor from './components/ShardMonitor';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [shardOverview, setShardOverview] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fifa_user');
    const token = localStorage.getItem('fifa_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('fifa_user');
        localStorage.removeItem('fifa_token');
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      setMatchesLoading(true);
      const [matchesRes, overviewRes] = await Promise.all([
        api.getMatches(),
        api.getShardOverview(),
      ]);

      if (matchesRes.success) {
        setMatches(matchesRes.data || []);
      }
      if (overviewRes.success) {
        setShardOverview(overviewRes);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fifa_token');
    localStorage.removeItem('fifa_user');
    setUser(null);
    if (activeTab === 'bookings') {
      setActiveTab('matches');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-gray-100 selection:bg-amber-500 selection:text-black">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        shardOverview={shardOverview}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'matches' && (
          <MatchList
            matches={matches}
            loading={matchesLoading}
            onSelectMatch={(match) => setSelectedMatch(match)}
          />
        )}

        {activeTab === 'monitor' && (
          <ShardMonitor
            shardOverview={shardOverview}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'bookings' && user && (
          <MyBookings
            user={user}
            onGoToMatches={() => setActiveTab('matches')}
          />
        )}
      </main>

      {selectedMatch && (
        <SeatSelectorModal
          match={selectedMatch}
          user={user}
          onClose={() => setSelectedMatch(null)}
          onAuthRequired={() => {
            setSelectedMatch(null);
            setAuthModalOpen(true);
          }}
          onBookingCompleted={() => {
            fetchData();
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />

      <footer className="mt-auto border-t border-white/5 py-8 bg-[#04060d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-bold">FIFA World Cup 2026</span>
            <span>Official Ticketing Portal</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-gray-400">Verified Match Reservations</span>
            <span className="text-gray-400">Global Regional Operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
