const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/create', protect, bookingController.createBooking);
router.get('/my-bookings', protect, bookingController.getUserBookings);

module.exports = router;
