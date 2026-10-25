import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MyBookings({ user, onGoToMatches }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.getMyBookings();
        if (res.success) {
          setBookings(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-400">Loading your official match tickets...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="py-20 text-center glass-panel rounded-3xl border border-white/5 p-8 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Ticket className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-heading font-extrabold text-white">No Tickets Booked Yet</h3>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          You haven't reserved any match tickets yet. Browse available World Cup matches across all 4 regional shards!
        </p>
        <button
          onClick={onGoToMatches}
          className="btn-primary mt-6 text-xs uppercase tracking-wider"
        >
          Browse Upcoming Matches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-heading font-black text-white">My World Cup Passes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Confirmed match reservations stored across your distributed account.
          </p>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {bookings.length} {bookings.length === 1 ? 'Ticket' : 'Tickets'} Confirmed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.map((booking) => {
          const matchDate = new Date(booking.match_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={booking.booking_id}
              className="bg-gradient-to-br from-[#0e172a] via-[#101b33] to-[#0a101f] border border-amber-400/30 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-400/60 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  FIFA Match Pass
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {booking.booking_status?.toUpperCase()}
                </span>
              </div>

              <h3 className="text-lg font-heading font-black text-white">
                {booking.home_team} <span className="text-amber-400">vs</span> {booking.away_team}
              </h3>

              <div className="space-y-2 mt-4 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{booking.stadium_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{matchDate}</span>
                </div>
              </div>

              {/* Seats Pill List */}
              <div className="my-4 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                {booking.seats?.map((seat, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10"
                  >
                    Seat {seat.seat_number} (${seat.price})
                  </span>
                ))}
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500">Total Paid</p>
                  <p className="text-sm font-extrabold text-amber-400">${booking.total_amount}</p>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-gray-500 font-mono block">ID: {booking.booking_id?.slice(0, 12)}...</span>
                  <span className="font-mono text-xs text-gray-400 tracking-widest">|||| |||||| ||</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
