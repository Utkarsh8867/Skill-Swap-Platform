const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true },
  reviewerId: { type: String, required: true }, // User giving the review
  reviewerName: { type: String, required: true },
  reviewerDP: { type: String, default: '' },
  revieweeId: { type: String, required: true }, // User receiving the review
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  skillExchanged: { type: String }, // What skill was exchanged
  exchangeType: { type: String, enum: ['taught', 'learned'], required: true },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one review per exchange between two users for a specific skill
reviewSchema.index({ reviewerId: 1, revieweeId: 1, skillExchanged: 1, exchangeType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);