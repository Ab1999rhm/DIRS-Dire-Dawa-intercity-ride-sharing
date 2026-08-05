const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  categories: {
    safety: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ratingSchema.index({ trip: 1, rater: 1 }, { unique: true });
ratingSchema.index({ ratee: 1, createdAt: -1 });

ratingSchema.statics.calculateAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { ratee: userId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
  ]);

  if (result.length > 0) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(userId, {
      averageRating: Math.round(result[0].avgRating * 10) / 10,
      totalRatings: result[0].totalRatings
    });
  }
};

module.exports = mongoose.model('Rating', ratingSchema);
