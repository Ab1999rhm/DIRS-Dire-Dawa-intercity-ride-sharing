const express = require('express');
const router = express.Router();
const vehicleController = require('../../controllers/vehicles/vehicleController');
const { protect, authorize } = require('../../middleware/auth');

router.post('/', protect, authorize('driver'), vehicleController.registerVehicle);
router.get('/my', protect, authorize('driver'), vehicleController.getMyVehicle);
router.put('/my', protect, authorize('driver'), vehicleController.updateVehicle);
router.get('/:id', protect, vehicleController.getVehicleById);

module.exports = router;
