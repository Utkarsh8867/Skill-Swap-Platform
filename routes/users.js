const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create user
router.post('/', async (req, res) => {
  try {
    const user = new User({
      userId: Date.now().toString(),
      ...req.body
    });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/search - Search users
router.get('/search', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(search, 'i');
    const filter = {
      $or: [
        { name: searchRegex },
        { skillsToTeach: { $in: [searchRegex] } },
        { skillsToLearn: { $in: [searchRegex] } },
        { 'location.city': searchRegex }
      ]
    };

    const users = await User.find(filter)
      .select('-email -password')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/nearby - Find users nearby
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const users = await User.find({
      'location.coordinates.lat': {
        $gte: parseFloat(lat) - radius / 111,
        $lte: parseFloat(lat) + radius / 111
      },
      'location.coordinates.lng': {
        $gte: parseFloat(lng) - radius / 111,
        $lte: parseFloat(lng) + radius / 111
      }
    }).select('-email -password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id }).select('-email -password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:id/posts - Get user posts
router.get('/:id/posts', async (req, res) => {
  try {
    const Post = require('../models/Post');
    const posts = await Post.find({
      authorId: req.params.id,
      isActive: true
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:id/follow - Follow user
router.post('/:id/follow', async (req, res) => {
  try {
    const { userId } = req.body; // Current user ID

    // Add to followers
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $addToSet: { followers: userId } }
    );

    // Add to following
    await User.findOneAndUpdate(
      { userId: userId },
      { $addToSet: { following: req.params.id } }
    );

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id/follow - Unfollow user
router.delete('/:id/follow', async (req, res) => {
  try {
    const { userId } = req.body; // Current user ID

    // Remove from followers
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $pull: { followers: userId } }
    );

    // Remove from following
    await User.findOneAndUpdate(
      { userId: userId },
      { $pull: { following: req.params.id } }
    );

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id/followers - Get user followers
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id })
      .populate('followers', 'userId name profilePicture')
      .select('followers');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id/following - Get user following
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id })
      .populate('following', 'userId name profilePicture')
      .select('following');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id/bookmarks - Get user bookmarked posts
router.get('/:id/bookmarks', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ userId: req.params.id }).select('bookmarkedPosts');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const Post = require('../models/Post');
    const posts = await Post.find({
      postId: { $in: user.bookmarkedPosts },
      isActive: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      postId: { $in: user.bookmarkedPosts },
      isActive: true
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;