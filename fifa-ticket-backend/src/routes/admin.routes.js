const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/overview', adminController.getShardOverview);
router.post('/generate-users', adminController.generateUsersBenchmark);
router.post('/traffic-test', adminController.runTrafficStressTest);
router.get('/stats', protect, adminOnly, adminController.getGlobalStats);

module.exports = router;
