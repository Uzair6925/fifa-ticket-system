const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Public system & distributed metrics
router.get('/overview', adminController.getShardOverview);
router.post('/generate-users', adminController.generateUsersBenchmark);
router.post('/traffic-test', adminController.runTrafficStressTest);

// Protected Admin-only routes
router.get('/stats', protect, adminOnly, adminController.getGlobalStats);

module.exports = router;
