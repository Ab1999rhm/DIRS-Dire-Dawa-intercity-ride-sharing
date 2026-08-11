const express = require('express');
const router = express.Router();
const sosController = require('../../controllers/sos/sosController');
const { protect } = require('../../middleware/auth');

router.post('/', protect, sosController.createUserIncident);
router.get('/', protect, sosController.getUserIncidents);

module.exports = router;
