const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

router.get('/', matchController.getAllMatches);
router.get('/search', matchController.searchMatches);
router.get('/:id', matchController.getMatchById);

module.exports = router;
