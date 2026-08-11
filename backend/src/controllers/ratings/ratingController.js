const Rating = require('../../models/Rating');
const Trip = require('../../models/Trip');
const mongoose = require('mongoose');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.createRating = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { rating, comment, categories } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status !== 'completed') {
    return res.status(400).json({ error: 'Can only rate completed trips' });
  }

  const isPassenger = trip.passenger.toString() === req.user._id.toString();
  const isDriver = trip.driver.toString() === req.user._id.toString();

  if (!isPassenger && !isDriver) {
    return res.status(403).json({ error: 'Not authorized to rate this trip' });
  }

  const rateeId = isPassenger ? trip.driver : trip.passenger;

  const existingRating = await Rating.findOne({
    trip: tripId,
    rater: req.user._id
  });

  if (existingRating) {
    return res.status(400).json({ error: 'Already rated this trip' });
  }

  const newRating = await Rating.create({
    trip: tripId,
    rater: req.user._id,
    ratee: rateeId,
    rating,
    comment,
    categories
  });

  await Rating.calculateAverageRating(rateeId);

  if (isPassenger) {
    trip.passengerRating = newRating._id;
  } else {
    trip.driverRating = newRating._id;
  }
  await trip.save();

  logger.info('Rating created', { tripId, raterId: req.user._id, rating });

  res.status(201).json({ rating: newRating });
});

exports.getUserRatings = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const ratings = await Rating.find({ ratee: userId })
    .populate('rater', 'firstName lastName profilePhoto')
    .populate('trip', 'pickupLocation dropoffLocation createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Rating.countDocuments({ ratee: userId });

  const avgResult = await Rating.aggregate([
    { $match: { ratee: mongoose.Types.ObjectId.createFromHexString(userId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
  ]);

  const stats = avgResult.length > 0 ? avgResult[0] : { avgRating: 0, totalRatings: 0 };

  res.json({
    ratings,
    stats: {
      averageRating: Math.round(stats.avgRating * 10) / 10,
      totalRatings: stats.totalRatings
    },
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getTripRating = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const ratings = await Rating.find({ trip: tripId })
    .populate('rater', 'firstName lastName profilePhoto')
    .populate('ratee', 'firstName lastName profilePhoto');

  res.json({ ratings });
});

exports.getDriverRatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const driverId = req.user._id;

  const ratings = await Rating.find({ ratee: driverId })
    .populate('rater', 'firstName lastName profilePhoto')
    .populate('trip', 'pickupLocation dropoffLocation createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Rating.countDocuments({ ratee: driverId });

  const avgResult = await Rating.aggregate([
    { $match: { ratee: mongoose.Types.ObjectId.createFromHexString(driverId.toString()) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
  ]);

  const stats = avgResult.length > 0 ? avgResult[0] : { avgRating: 0, totalRatings: 0 };

  res.json({
    ratings,
    averageRating: Math.round((stats.avgRating || 0) * 10) / 10,
    totalRatings: stats.totalRatings || 0,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});
