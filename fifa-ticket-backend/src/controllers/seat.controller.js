const SeatModel = require('../models/seat.model');
const MatchModel = require('../models/match.model');
const { acquireSeatLock, releaseSeatLock } = require('../config/redisClient');

exports.getSeatsForMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const matchRecord = await MatchModel.getById(matchId);
    if (!matchRecord) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const { region } = matchRecord;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
    const offset = (page - 1) * limit;

    const [dbSeats, totalCount, heldSeatIds] = await Promise.all([
      SeatModel.getSeatsForMatch(matchId, region, limit, offset),
      SeatModel.getSeatCountForMatch(matchId, region),
      SeatModel.getActiveHoldsForMatch(matchId),
    ]);

    const seats = dbSeats.map((seat) => {
      if (seat.status === 'available' && heldSeatIds.includes(seat.id)) {
        seat.status = 'held';
      }
      return seat;
    });

    res.status(200).json({
      success: true,
      count: seats.length,
      totalCount,
      page,
      pageSize: limit,
      data: seats,
    });
  } catch (error) {
    next(error);
  }
};

exports.holdSeats = async (req, res, next) => {
  try {
    const { matchId, seatIds } = req.body;
    const userId = req.user.id;

    if (!matchId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
    }

    const matchRecord = await MatchModel.getById(matchId);
    if (!matchRecord) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const dbSeats = await SeatModel.getSeatsByIds(seatIds, matchRecord.region);
    if (dbSeats.length !== seatIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected seats do not exist.' });
    }

    const alreadyBooked = dbSeats.some((s) => s.status === 'booked');
    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats have already been sold.',
      });
    }

    const lockPromises = seatIds.map((seatId) => acquireSeatLock(matchId, seatId, userId));
    const lockResults = await Promise.all(lockPromises);

    const failedIndex = lockResults.indexOf(false);
    if (failedIndex !== -1) {
      const rollbackPromises = [];
      for (let i = 0; i < seatIds.length; i++) {
        if (lockResults[i] === true) {
          rollbackPromises.push(releaseSeatLock(matchId, seatIds[i], userId));
        }
      }
      await Promise.all(rollbackPromises);

      return res.status(409).json({
        success: false,
        message: 'One or more selected seats are currently reserved by another customer. Please choose different seats.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seats reserved for 10 minutes.',
      data: { matchId, seatIds, expires_in_seconds: 600 },
    });
  } catch (error) {
    next(error);
  }
};

exports.releaseSeats = async (req, res, next) => {
  try {
    const { matchId, seatIds } = req.body;
    const userId = req.user.id;

    if (!matchId || !seatIds || !Array.isArray(seatIds)) {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
    }

    const releasePromises = seatIds.map((seatId) => releaseSeatLock(matchId, seatId, userId));
    await Promise.all(releasePromises);

    res.status(200).json({
      success: true,
      message: 'Seat reservation released.',
    });
  } catch (error) {
    next(error);
  }
};
