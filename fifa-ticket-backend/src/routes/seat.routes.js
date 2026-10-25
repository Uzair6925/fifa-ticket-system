const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/match/:matchId', seatController.getSeatsForMatch);
router.post('/hold', protect, seatController.holdSeats);
router.post('/release', protect, seatController.releaseSeats);

module.exports = router;
