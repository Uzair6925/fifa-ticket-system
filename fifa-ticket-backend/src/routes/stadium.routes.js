const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadium.controller');

router.get('/', stadiumController.getAllStadiums);
router.get('/:id', stadiumController.getStadiumById);

module.exports = router;
