const SeatModel = require('../models/seat.model');
const MatchModel = require('../models/match.model');
const { acquireSeatLock, releaseSeatLock, isSeatLocked } = require('../config/redisClient');

exports.getSeatsForMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    // First find which shard this match is on
    const matchRecord = await MatchModel.getById(matchId);
    if (!matchRecord) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const { region } = matchRecord;

    // Fetch DB seats and Redis holds in parallel
    const [dbSeats, heldSeatIds] = await Promise.all([
      SeatModel.getSeatsForMatch(matchId, region),
      SeatModel.getActiveHoldsForMatch(matchId)
    ]);

    // Merge status (Redis hold overrides DB 'available' status)
    const seats = dbSeats.map(seat => {
      if (seat.status === 'available' && heldSeatIds.includes(seat.id)) {
        seat.status = 'held'; // Overwrite status for frontend
      }
      return seat;
    });

    res.status(200).json({
      success: true,
      count: seats.length,
      data: seats
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

    // Try to acquire lock for each seat concurrently
    const lockPromises = seatIds.map(seatId => acquireSeatLock(matchId, seatId, userId));
    const lockResults = await Promise.all(lockPromises);

    // If any lock failed, it means someone else beat us to it.
    // We must release any locks we DID acquire in this batch to prevent dangling holds.
    const failedIndex = lockResults.indexOf(false);
    
    if (failedIndex !== -1) {
      // Release the ones that succeeded
      const rollbackPromises = [];
      for (let i = 0; i < seatIds.length; i++) {
        if (lockResults[i] === true) {
          rollbackPromises.push(releaseSeatLock(matchId, seatIds[i]));
        }
      }
      await Promise.all(rollbackPromises);

      return res.status(409).json({ 
        success: false, 
        message: 'One or more selected seats are already held or booked by another user. Please choose different seats.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seats held successfully for 10 minutes.',
      data: { matchId, seatIds, expires_in_seconds: 600 }
    });
  } catch (error) {
    next(error);
  }
};

exports.releaseSeats = async (req, res, next) => {
  try {
    const { matchId, seatIds } = req.body;

    if (!matchId || !seatIds || !Array.isArray(seatIds)) {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
    }

    // Release all locks
    const releasePromises = seatIds.map(seatId => releaseSeatLock(matchId, seatId));
    await Promise.all(releasePromises);

    res.status(200).json({
      success: true,
      message: 'Seat holds released successfully.'
    });
  } catch (error) {
    next(error);
  }
};
