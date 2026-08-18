const express = require('express');
const router = express.Router();
const rideController = require('../../controllers/rides/rideController');
const { protect, authorize } = require('../../middleware/auth');
const { validateOptionalApiKey } = require('../../middleware/apiKey');
const { validateRideRequest } = require('../../middleware/validation');
const Place = require('../../models/Place');

// Public endpoint - fetch active places for passenger/driver autocomplete
// Optional x-api-key header is validated when present
router.get('/places', validateOptionalApiKey, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    const places = await Place.find(query).sort({ sortOrder: 1, name: 1 }).select('-createdBy -updatedBy -__v');
    res.json({ places });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

router.post('/estimate', protect, rideController.estimateFare);

router.post('/', protect, authorize('passenger'), validateRideRequest, rideController.createRideRequest);
router.post('/:rideRequestId/accept', protect, authorize('driver'), rideController.acceptRideRequest);
router.post('/:rideRequestId/decline', protect, authorize('driver'), rideController.declineRideRequest);
router.post('/:rideRequestId/cancel', protect, authorize('passenger'), rideController.cancelRideRequest);

router.get('/available', protect, authorize('driver'), rideController.getAvailableRides);
router.get('/shared-trips', protect, rideController.getSharedTrips);
router.get('/vehicle-trip/:tripId/seats', protect, rideController.getVehicleTripSeats);
router.get('/driver/stats', protect, authorize('driver'), rideController.getDriverStats);
router.get('/passenger/trips', protect, authorize('passenger'), rideController.getPassengerTrips);
router.get('/driver/trips', protect, authorize('driver'), rideController.getDriverTrips);
router.get('/trip/:id', protect, rideController.getTripDetails);
router.get('/:id', protect, rideController.getRideRequest);

router.post('/trip/:tripId/start', protect, authorize('driver'), rideController.startTrip);
router.post('/trip/:tripId/complete', protect, authorize('driver'), rideController.completeTrip);
router.post('/trip/:tripId/arrival', protect, authorize('driver'), rideController.confirmArrival);
router.post('/trip/:tripId/cancel', protect, authorize('driver', 'passenger'), rideController.cancelTrip);

module.exports = router;
