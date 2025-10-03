const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

// GET /api/matching/:userId - AI-powered matchmaking
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find posts where user's skills match others' needs
    const matches = await Post.find({
      authorId: { $ne: req.params.userId },
      isActive: true,
      $or: [
        { skillsNeeded: { $in: user.skillsToTeach } },
        { skillsOffered: { $in: user.skillsToLearn } }
      ]
    });

    // Calculate match scores
    const scoredMatches = matches.map(post => {
      let score = 0;
      const teachMatch = post.skillsNeeded.filter(skill => user.skillsToTeach.includes(skill)).length;
      const learnMatch = post.skillsOffered.filter(skill => user.skillsToLearn.includes(skill)).length;
      score = (teachMatch * 2) + learnMatch;
      
      return { ...post.toObject(), matchScore: score };
    });

    // Sort by match score
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    res.json(scoredMatches.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;