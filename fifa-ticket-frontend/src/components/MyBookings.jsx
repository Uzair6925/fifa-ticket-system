import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MyBookings({ user, onGoToMatches }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.data || []);
      }
    } catch (err) {
      setStatusBanner({ type: 'error', text: 'Failed to load tickets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setStatusBanner(null);
    try {
      const res = await api.cancelBooking(bookingId);
      if (!res.success) {
        setStatusBanner({ type: 'error', text: res.message || 'Unable to cancel booking.' });
        return;
      }

      setStatusBanner({
        type: 'success',
        text: res.message || 'Booking cancelled and refund initiated.',
      });
      setConfirmCancelId(null);
      await fetchBookings();
    } catch (err) {
      setStatusBanner({ type: 'error', text: 'Network error while cancelling booking.' });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-400">Loading your match passes...</p>
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
          You have not reserved any match passes yet. Explore upcoming tournament fixtures to reserve your seats.
        </p>
        <button
          onClick={onGoToMatches}
          className="btn-primary mt-6 text-xs uppercase tracking-wider"
        >
          View Fixtures
        </button>
      </div>
    );
  }

  const activeBookingsCount = bookings.filter((b) => b.booking_status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-heading font-black text-white">My Match Passes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your confirmed tournament passes or request an instant cancellation and refund.
          </p>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {activeBookingsCount} Active {activeBookingsCount === 1 ? 'Pass' : 'Passes'}
        </span>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-slide-up ${
            statusBanner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.map((booking) => {
          const isCancelled = booking.booking_status === 'cancelled';
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
              className={`bg-gradient-to-br from-[#0e172a] via-[#101b33] to-[#0a101f] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all ${
                isCancelled
                  ? 'border-white/10 opacity-75'
                  : 'border-amber-400/30 hover:border-amber-400/60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Official FIFA Pass
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isCancelled
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isCancelled ? 'CANCELLED & REFUNDED' : booking.booking_status?.toUpperCase()}
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

              <div className="my-4 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                {booking.seats?.map((seat, idx) => (
                  <span
                    key={idx}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      isCancelled
                        ? 'bg-white/5 text-gray-500 border-white/5 line-through'
                        : 'bg-white/10 text-white border-white/10'
                    }`}
                  >
                    Seat {seat.seat_number} (${seat.price})
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-gray-500">
                    {isCancelled ? 'Refunded Amount' : 'Total Paid'}
                  </p>
                  <p className={`text-sm font-extrabold ${isCancelled ? 'text-gray-400' : 'text-amber-400'}`}>
                    ${booking.total_amount}
                  </p>
                  <span className="text-[9px] text-gray-500 font-mono block mt-0.5">
                    Ref: {booking.booking_id?.slice(0, 12)}
                  </span>
                </div>

                {!isCancelled && (
                  <div>
                    {confirmCancelId === booking.booking_id ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={cancellingId === booking.booking_id}
                          onClick={() => handleCancelBooking(booking.booking_id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
                        >
                          {cancellingId === booking.booking_id ? 'Cancelling...' : 'Confirm Cancel'}
                        </button>
                        <button
                          disabled={cancellingId === booking.booking_id}
                          onClick={() => setConfirmCancelId(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(booking.booking_id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Ticket & Refund
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
