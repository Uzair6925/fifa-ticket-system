import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, AlertCircle, Timer, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const formatRegion = (r) => {
  if (!r) return 'Global';
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function SeatSelectorModal({ match, user, onClose, onAuthRequired, onBookingCompleted }) {
  if (!match) return null;

  const savedMethods =
    user?.payment_methods && user.payment_methods.length > 0
      ? user.payment_methods.map((pm) => `${pm.type} •••• ${pm.last4} (${pm.bank_name})`)
      : ['Visa Credit Card', 'MasterCard', 'Direct Bank Wire (IBAN)', 'Apple Pay'];

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatPage, setSeatPage] = useState(1);
  const [totalSeatCount, setTotalSeatCount] = useState(0);
  const [heldSeatIds, setHeldSeatIds] = useState([]);
  const [holdTimer, setHoldTimer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(savedMethods[0]);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSeats = async (page = seatPage) => {
    try {
      setLoading(true);
      const res = await api.getSeatsForMatch(match.id, page);
      if (res.success) {
        setSeats(res.data);
        setTotalSeatCount(res.totalCount ?? res.count ?? res.data.length);
      }
    } catch (err) {
      setErrorMsg('Unable to load stadium seating map.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSeatPage(1);
    setSelectedSeats([]);
    setHeldSeatIds([]);
    setHoldTimer(null);
  }, [match.id]);

  useEffect(() => {
    fetchSeats(seatPage);
  }, [match.id, seatPage]);

  useEffect(() => {
    if (holdTimer === null || holdTimer <= 0) return;

    const interval = setInterval(() => {
      setHoldTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setHeldSeatIds([]);
          setErrorMsg('Your 10-minute reservation window has expired. Please select your seats again.');
          fetchSeats();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [holdTimer]);

  const toggleSelectSeat = (seat) => {
    if (seat.status === 'booked' || seat.status === 'held') return;
    setErrorMsg('');

    setSelectedSeats((prev) =>
      prev.some((selected) => selected.id === seat.id)
        ? prev.filter((selected) => selected.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handleAcquireHold = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    const selectedSeatIds = selectedSeats.map((seat) => seat.id);
    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one available seat.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await api.holdSeats(match.id, selectedSeatIds);
      if (!res.success) {
        setErrorMsg(res.message || 'Selected seats could not be reserved.');
        fetchSeats();
        return;
      }

      setHeldSeatIds([...selectedSeatIds]);
      setHoldTimer(res.data?.expires_in_seconds || 600);
    } catch (err) {
      setErrorMsg('Unable to reserve seats at this time. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (heldSeatIds.length === 0) {
      setErrorMsg('Please reserve your selected seats before completing payment.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await api.confirmBooking(match.id, heldSeatIds, {
        method: paymentMethod,
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Payment confirmation failed.');
        return;
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setBookingConfirmed(res.data);
      onBookingCompleted();
    } catch (err) {
      setErrorMsg('A network error occurred while processing your booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedSeatIds = selectedSeats.map((seat) => seat.id);
  const selectedSeatsList = selectedSeats;
  const totalPrice = selectedSeatsList.reduce((sum, s) => sum + Number(s.price), 0);

  const formatTimer = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-4xl glass-panel-gold p-6 sm:p-8 shadow-2xl border border-white/10 my-8 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {match.tournament_stage || 'Official Match'}
            </span>
            <span className="text-xs text-gray-400 font-medium">{match.stadium_name} ({formatRegion(match.shard)})</span>
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            {match.home_team} <span className="text-amber-400 font-black">vs</span> {match.away_team}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Select your preferred seats from the stadium layout below. Reserved seats are held for 10 minutes during checkout.
          </p>
        </div>

        {bookingConfirmed ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-heading font-black text-white">Booking Confirmed</h3>
              <p className="text-xs text-gray-400 mt-1">
                Your official digital match pass has been issued and added to your account.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-black/60 border border-amber-400/40 rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">FIFA World Cup 2026 Pass</p>
                  <p className="text-sm font-extrabold text-white">{match.home_team} vs {match.away_team}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">CONFIRMED</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-white/10">
                <div>
                  <p className="text-[10px] text-gray-500">Venue</p>
                  <p className="font-semibold text-gray-200">{match.stadium_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Seats</p>
                  <p className="font-semibold text-amber-400">
                    {selectedSeatsList.map((s) => s.seat_number).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Booking Reference</p>
                  <p className="font-mono text-[10px] text-gray-300 truncate">{bookingConfirmed.bookingId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Amount Paid</p>
                  <p className="font-extrabold text-white">${bookingConfirmed.totalAmount}</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">Ref: {bookingConfirmed.transactionId}</span>
                <span className="text-xs font-bold text-amber-400 tracking-widest font-mono">|||| ||| |||||||</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary !px-8 text-xs font-bold uppercase tracking-wider"
            >
              Return to Fixtures
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="w-full h-24 rounded-2xl bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border border-emerald-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-20 h-20 rounded-full border border-emerald-400/20 absolute -top-10" />
                <div className="w-full h-0.5 bg-emerald-400/25 absolute top-1/2" />
                <span className="font-heading font-black text-[11px] tracking-widest text-emerald-300 uppercase z-10 bg-emerald-950/80 px-4 py-1 rounded-full border border-emerald-500/30">
                  Stadium Pitch
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-300 py-2 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-white/20 border border-white/30" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500/60 border border-amber-400" />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-rose-950/60 border border-rose-500/30" />
                  <span>Sold</span>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-gray-400">Loading stadium seating map...</div>
              ) : (
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 max-h-72 overflow-y-auto">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {seats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isHeldByMe = heldSeatIds.includes(seat.id);
                      const isHeldByOther = seat.status === 'held' && !isHeldByMe;
                      const isBooked = seat.status === 'booked';

                      let btnStyle = 'bg-white/10 hover:bg-white/20 border-white/20 text-gray-200';
                      if (isSelected || isHeldByMe) {
                        btnStyle = 'bg-emerald-500 border-emerald-400 text-black font-extrabold shadow-md shadow-emerald-500/30';
                      } else if (isHeldByOther) {
                        btnStyle = 'bg-amber-500/30 border-amber-400/50 text-amber-300 cursor-not-allowed';
                      } else if (isBooked) {
                        btnStyle = 'bg-rose-950/40 border-rose-500/20 text-gray-600 cursor-not-allowed';
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isHeldByOther || isBooked}
                          onClick={() => toggleSelectSeat(seat)}
                          title={`${seat.seat_number} - $${seat.price} (${seat.category_name})`}
                          className={`h-11 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center transition-all ${btnStyle}`}
                        >
                          <span>{seat.seat_number}</span>
                          <span className="text-[9px] opacity-75">${seat.price}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-4 text-xs text-gray-400">
                    <span>
                      {totalSeatCount === 0
                        ? 'No seats available'
                        : `Showing ${(seatPage - 1) * 100 + 1}-${Math.min(seatPage * 100, totalSeatCount)} of ${totalSeatCount.toLocaleString()} seats`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSeatPage((page) => Math.max(1, page - 1))}
                        disabled={seatPage === 1 || loading}
                        className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setSeatPage((page) => page + 1)}
                        disabled={seatPage * 100 >= totalSeatCount || loading}
                        className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Order Summary</h4>

                {errorMsg && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {holdTimer !== null && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span className="font-semibold">Time Remaining</span>
                    </div>
                    <span className="font-mono font-black text-sm bg-black/40 px-2 py-0.5 rounded">
                      {formatTimer(holdTimer)}
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Seats Selected:</span>
                    <span className="font-bold text-white">{selectedSeatIds.length}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Region:</span>
                    <span className="font-bold text-emerald-400">{formatRegion(match.shard)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">${totalPrice}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
                    <span>Total Amount:</span>
                    <span className="text-amber-400 text-base font-black">${totalPrice}</span>
                  </div>
                </div>

                {heldSeatIds.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {savedMethods.map((methodLabel, idx) => (
                        <option key={idx} value={methodLabel} className="bg-[#0f172a]">
                          {methodLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {heldSeatIds.length === 0 ? (
                  <button
                    disabled={selectedSeatIds.length === 0 || actionLoading}
                    onClick={handleAcquireHold}
                    className="w-full btn-primary justify-center !py-3 text-xs tracking-wider uppercase"
                  >
                    {actionLoading ? (
                      'Reserving Seats...'
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-1" />
                        Reserve Selected Seats
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={handleConfirmBooking}
                    className="w-full btn-emerald justify-center !py-3 text-xs tracking-wider uppercase"
                  >
                    {actionLoading ? 'Processing Payment...' : `Complete Purchase ($${totalPrice})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
