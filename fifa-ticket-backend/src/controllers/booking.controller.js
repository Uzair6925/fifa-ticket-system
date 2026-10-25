const BookingModel = require('../models/booking.model');
const SeatModel = require('../models/seat.model');
const MatchModel = require('../models/match.model');
const { isSeatLocked, releaseSeatLock } = require('../config/redisClient');
const { v4: uuidv4 } = require('uuid');

exports.createBooking = async (req, res, next) => {
  try {
    const { matchId, seatIds, paymentDetails } = req.body;
    const userId = req.user.id;

    if (!matchId || !seatIds || seatIds.length === 0 || !paymentDetails) {
      return res.status(400).json({ success: false, message: 'Invalid request payload.' });
    }

    // 1. Check which shard this match belongs to
    const matchRecord = await MatchModel.getById(matchId);
    if (!matchRecord) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }
    const { region } = matchRecord;

    // 2. Validate Redis Locks (Does the user actually hold these seats?)
    for (const seatId of seatIds) {
      const locked = await isSeatLocked(matchId, seatId);
      if (!locked) {
        return res.status(400).json({ 
          success: false, 
          message: `Your hold on seat ${seatId} has expired or was not acquired. Please select seats again.`
        });
      }
    }

    // 3. Calculate Total Amount
    const seats = await SeatModel.getSeatsByIds(seatIds, region);
    if (seats.length !== seatIds.length) {
      return res.status(400).json({ success: false, message: 'Some seats are invalid.' });
    }
    const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);

    // 4. Mock Payment Gateway Processing
    // In a real app, you would call Stripe/PayPal API here.
    const mockTransactionId = `TXN-${uuidv4()}`;
    const paymentData = {
      transactionId: mockTransactionId,
      method: paymentDetails.method || 'Credit Card'
    };

    // 5. Execute DB Transaction
    const bookingId = await BookingModel.createTransaction(
      userId, 
      matchId, 
      seatIds, 
      totalAmount, 
      paymentData, 
      region
    );

    // 6. Release Redis Locks (since they are now permanently booked in DB)
    const releasePromises = seatIds.map(seatId => releaseSeatLock(matchId, seatId));
    await Promise.all(releasePromises);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: {
        bookingId,
        transactionId: mockTransactionId,
        totalAmount
      }
    });

  } catch (error) {
    if (error.message.includes('no longer available')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookings = await BookingModel.getUserBookings(userId);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};
