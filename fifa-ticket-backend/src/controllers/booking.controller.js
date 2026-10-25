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

    const matchRecord = await MatchModel.getById(matchId);
    if (!matchRecord) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }
    const { region } = matchRecord;

    for (const seatId of seatIds) {
      const lockedByCurrentUser = await isSeatLocked(matchId, seatId, userId);
      if (!lockedByCurrentUser) {
        return res.status(403).json({
          success: false,
          message: 'Your seat reservation has expired or belongs to another account. Please select your seats again.',
        });
      }
    }

    const seats = await SeatModel.getSeatsByIds(seatIds, region);
    if (seats.length !== seatIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected seats are invalid.' });
    }
    const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);

    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;
    const paymentData = {
      transactionId,
      method: paymentDetails.method || 'Credit Card',
    };

    const bookingId = await BookingModel.createTransaction(
      userId,
      matchId,
      seatIds,
      totalAmount,
      paymentData,
      region
    );

    const releasePromises = seatIds.map((seatId) => releaseSeatLock(matchId, seatId, userId));
    await Promise.all(releasePromises);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed.',
      data: {
        bookingId,
        transactionId,
        totalAmount,
      },
    });
  } catch (error) {
    if (error.message.includes('no longer available')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const result = await BookingModel.cancelTransaction(bookingId, userId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to your account.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking cancelled. A refund of $${result.refundedAmount} has been initiated to your payment method.`,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('already been cancelled')) {
      return res.status(400).json({ success: false, message: error.message });
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
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
