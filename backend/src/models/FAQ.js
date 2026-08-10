const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['getting_started', 'account', 'payment', 'trips', 'driver', 'safety', 'technical', 'billing', 'other'],
    required: true
  },
  tags: [String],
  order: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'am', 'om', 'so'],
    default: 'en'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ isPublished: 1 });
faqSchema.index({ language: 1 });
faqSchema.index({ title: 'text', content: 'text' });

faqSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FAQ', faqSchema);
