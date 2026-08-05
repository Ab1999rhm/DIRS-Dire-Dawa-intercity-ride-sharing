const express = require('express');
const router = express.Router();
const rideController = require('../../controllers/rides/rideController');
const { protect, authorize } = require('../../middleware/auth');
const { validateRideRequest } = require('../../middleware/validation');

router.post('/', protect, authorize('passenger'), validateRideRequest, rideController.createRideRequest);
router.post('/:rideRequestId/accept', protect, authorize('driver'), rideController.acceptRideRequest);
router.post('/:rideRequestId/decline', protect, authorize('driver'), rideController.declineRideRequest);
router.post('/:rideRequestId/cancel', protect, authorize('passenger'), rideController.cancelRideRequest);

router.get('/available', protect, authorize('driver'), rideController.getAvailableRides);
router.get('/passenger/trips', protect, authorize('passenger'), rideController.getPassengerTrips);
router.get('/driver/trips', protect, authorize('driver'), rideController.getDriverTrips);
router.get('/trip/:id', protect, rideController.getTripDetails);
router.get('/:id', protect, rideController.getRideRequest);

router.post('/trip/:tripId/start', protect, authorize('driver'), rideController.startTrip);
router.post('/trip/:tripId/complete', protect, authorize('driver'), rideController.completeTrip);
router.post('/trip/:tripId/arrival', protect, authorize('driver'), rideController.confirmArrival);
router.post('/trip/:tripId/cancel', protect, authorize('driver'), rideController.cancelTrip);
router.get('/driver/stats', protect, authorize('driver'), rideController.getDriverStats);

module.exports = router;
