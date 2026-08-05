const express = require('express');
const router = express.Router();
const ratingController = require('../../controllers/ratings/ratingController');
const { protect } = require('../../middleware/auth');
const { validateRating } = require('../../middleware/validation');

router.post('/trip/:tripId', protect, validateRating, ratingController.createRating);
router.get('/user/:userId', ratingController.getUserRatings);
router.get('/trip/:tripId', protect, ratingController.getTripRating);

module.exports = router;
