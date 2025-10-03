const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const logger = require('../utils/logger');
const router = express.Router();

// GET /api/reviews/user/:userId - Get reviews for a user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      revieweeId: req.params.userId,
      isVisible: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments({
      revieweeId: req.params.userId,
      isVisible: true
    });

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { revieweeId: req.params.userId, isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
        totalReviews: avgRating.length > 0 ? avgRating[0].count : 0
      }
    });
  } catch (error) {
    logger.error('Get user reviews error:', error);
    next(error);
  }
});

// POST /api/reviews - Create a review
router.post('/', auth, async (req, res, next) => {
  try {
    const { revieweeId, rating, comment, skillExchanged, exchangeType } = req.body;

    // Validation
    if (!revieweeId || !rating || !comment || !exchangeType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (revieweeId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Comment must be less than 500 characters' });
    }

    if (!['taught', 'learned'].includes(exchangeType)) {
      return res.status(400).json({ error: 'Exchange type must be either "taught" or "learned"' });
    }

    // Check if reviewee exists
    const reviewee = await User.findOne({ userId: revieweeId });
    if (!reviewee) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if review already exists for this exchange
    const existingReview = await Review.findOne({
      reviewerId: req.user.userId,
      revieweeId,
      skillExchanged: skillExchanged || 'general',
      exchangeType
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this exchange' });
    }

    // Create review
    const review = new Review({
      reviewId: Date.now().toString(),
      reviewerId: req.user.userId,
      reviewerName: req.user.name,
      reviewerDP: req.user.profilePicture || '',
      revieweeId,
      rating,
      comment: sanitizeInput(comment.trim()),
      skillExchanged: skillExchanged || 'general',
      exchangeType
    });

    await review.save();

    // Update user's rating and review count
    const userReviews = await Review.find({ revieweeId, isVisible: true });
    const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / userReviews.length;

    await User.findOneAndUpdate(
      { userId: revieweeId },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: userReviews.length
      }
    );

    logger.info(`Review created by ${req.user.userId} for ${revieweeId}`);

    // Emit real-time notification
    req.io.to(revieweeId).emit('newReview', {
      reviewerId: req.user.userId,
      reviewerName: req.user.name,
      rating,
      skillExchanged
    });

    res.status(201).json({
      review,
      message: 'Review created successfully'
    });
  } catch (error) {
    logger.error('Create review error:', error);
    next(error);
  }
});

// PUT /api/reviews/:reviewId - Update a review
router.put('/:reviewId', auth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({ reviewId: req.params.reviewId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Comment must be less than 500 characters' });
    }

    // Update review
    if (rating) review.rating = rating;
    if (comment) review.comment = sanitizeInput(comment.trim());

    await review.save();

    // Recalculate user's average rating
    const userReviews = await Review.find({ revieweeId: review.revieweeId, isVisible: true });
    const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / userReviews.length;

    await User.findOneAndUpdate(
      { userId: review.revieweeId },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: userReviews.length
      }
    );

    logger.info(`Review updated by ${req.user.userId}: ${review.reviewId}`);

    res.json({
      review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    logger.error('Update review error:', error);
    next(error);
  }
});

// DELETE /api/reviews/:reviewId - Delete a review
router.delete('/:reviewId', auth, async (req, res, next) => {
  try {
    const review = await Review.findOne({ reviewId: req.params.reviewId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Soft delete
    review.isVisible = false;
    await review.save();

    // Recalculate user's average rating
    const userReviews = await Review.find({ revieweeId: review.revieweeId, isVisible: true });
    const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = userReviews.length > 0 ? totalRating / userReviews.length : 0;

    await User.findOneAndUpdate(
      { userId: review.revieweeId },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: userReviews.length
      }
    );

    logger.info(`Review deleted by ${req.user.userId}: ${review.reviewId}`);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error:', error);
    next(error);
  }
});

module.exports = router;