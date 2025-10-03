const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadLimiter, sanitizeInput } = require('../middleware/validation');
const logger = require('../utils/logger');
const router = express.Router();

// Configure multer with file size limits and type validation
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/posts - List all posts with pagination
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 posts per page
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(sanitizeInput(req.query.search), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skillsOffered: { $in: [searchRegex] } },
        { skillsNeeded: { $in: [searchRegex] } }
      ];
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add computed fields for frontend
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isLiked: req.user ? post.likes?.includes(req.user.userId) || false : false,
      isBookmarked: req.user ? post.bookmarkedBy?.includes(req.user.userId) || false : false
    }));

    const total = await Post.countDocuments(filter);

    res.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Add computed fields
    const postWithCounts = {
      ...post.toObject(),
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isLiked: req.user ? post.likes?.includes(req.user.userId) || false : false,
      isBookmarked: req.user ? post.bookmarkedBy?.includes(req.user.userId) || false : false
    };

    res.json(postWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - Create post
router.post('/', auth, uploadLimiter, upload.array('images', 5), async (req, res, next) => {
  try {
    const { title, description, skillsOffered, skillsNeeded, location } = req.body;

    // Input validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be less than 200 characters' });
    }

    if (description.length > 2000) {
      return res.status(400).json({ error: 'Description must be less than 2000 characters' });
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'gnec-posts',
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          });
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          logger.error('Image upload error:', uploadError);
        }
      }
    }

    const post = new Post({
      postId: Date.now().toString(),
      authorId: req.user.userId,
      authorName: req.user.name,
      authorDP: req.user.profilePicture || '',
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      skillsOffered: Array.isArray(skillsOffered) ?
        skillsOffered.map(sanitizeInput) :
        (skillsOffered ? skillsOffered.split(',').map(s => sanitizeInput(s.trim())) : []),
      skillsNeeded: Array.isArray(skillsNeeded) ?
        skillsNeeded.map(sanitizeInput) :
        (skillsNeeded ? skillsNeeded.split(',').map(s => sanitizeInput(s.trim())) : []),
      location,
      images: imageUrls
    });

    await post.save();

    logger.info(`Post created by user ${req.user.userId}: ${post.postId}`);
    req.io.emit('postCreated', post);
    res.status(201).json(post);
  } catch (error) {
    logger.error('Post creation error:', error);
    next(error);
  }
});

// PUT /api/posts/:id - Edit post
router.put('/:id', auth, uploadLimiter, upload.array('images', 5), async (req, res, next) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { title, description, skillsOffered, skillsNeeded, removeImages } = req.body;

    // Input validation
    if (title && title.length > 200) {
      return res.status(400).json({ error: 'Title must be less than 200 characters' });
    }

    if (description && description.length > 2000) {
      return res.status(400).json({ error: 'Description must be less than 2000 characters' });
    }

    let imageUrls = [...post.images];

    // Remove specified images
    if (removeImages && Array.isArray(removeImages)) {
      imageUrls = imageUrls.filter(url => !removeImages.includes(url));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'gnec-posts',
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          });
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          logger.error('Image upload error:', uploadError);
        }
      }
    }

    // Update post fields
    if (title) post.title = sanitizeInput(title);
    if (description) post.description = sanitizeInput(description);
    if (skillsOffered) {
      post.skillsOffered = Array.isArray(skillsOffered) ?
        skillsOffered.map(sanitizeInput) :
        skillsOffered.split(',').map(s => sanitizeInput(s.trim()));
    }
    if (skillsNeeded) {
      post.skillsNeeded = Array.isArray(skillsNeeded) ?
        skillsNeeded.map(sanitizeInput) :
        skillsNeeded.split(',').map(s => sanitizeInput(s.trim()));
    }

    post.images = imageUrls;
    post.updatedAt = new Date();

    await post.save();

    logger.info(`Post updated by user ${req.user.userId}: ${post.postId}`);
    req.io.emit('postUpdated', post);
    res.json(post);
  } catch (error) {
    logger.error('Post update error:', error);
    next(error);
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Soft delete - mark as inactive instead of removing
    post.isActive = false;
    await post.save();

    logger.info(`Post deleted by user ${req.user.userId}: ${post.postId}`);
    req.io.emit('postDeleted', req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Post deletion error:', error);
    next(error);
  }
});

// POST /api/posts/:id/like - Like/Unlike post
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.userId;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    await post.save();

    logger.info(`Post ${isLiked ? 'unliked' : 'liked'} by user ${userId}: ${post.postId}`);
    req.io.emit('postLiked', { postId: post.postId, userId, isLiked: !isLiked, likesCount: post.likes.length });

    res.json({
      isLiked: !isLiked,
      likesCount: post.likes.length,
      message: isLiked ? 'Post unliked' : 'Post liked'
    });
  } catch (error) {
    logger.error('Post like error:', error);
    next(error);
  }
});

// POST /api/posts/:id/bookmark - Bookmark/Unbookmark post
router.post('/:id/bookmark', auth, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.userId;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isBookmarked = user.bookmarkedPosts.includes(req.params.id);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarkedPosts = user.bookmarkedPosts.filter(id => id !== req.params.id);
      post.bookmarkedBy = post.bookmarkedBy.filter(id => id !== userId);
    } else {
      // Add bookmark
      user.bookmarkedPosts.push(req.params.id);
      post.bookmarkedBy.push(userId);
    }

    await Promise.all([user.save(), post.save()]);

    logger.info(`Post ${isBookmarked ? 'unbookmarked' : 'bookmarked'} by user ${userId}: ${post.postId}`);

    res.json({
      isBookmarked: !isBookmarked,
      message: isBookmarked ? 'Bookmark removed' : 'Post bookmarked'
    });
  } catch (error) {
    logger.error('Post bookmark error:', error);
    next(error);
  }
});

// GET /api/posts/:id/comments - Get post comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ comments });
  } catch (error) {
    logger.error('Get comments error:', error);
    next(error);
  }
});

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments', auth, async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment must be less than 500 characters' });
    }

    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      commentId: Date.now().toString(),
      userId: req.user.userId,
      userName: req.user.name,
      userDP: req.user.profilePicture || '',
      content: sanitizeInput(content.trim()),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    logger.info(`Comment added by user ${req.user.userId} to post ${post.postId}`);
    req.io.emit('commentAdded', { postId: post.postId, comment });

    res.status(201).json({ comment, message: 'Comment added successfully' });
  } catch (error) {
    logger.error('Add comment error:', error);
    next(error);
  }
});

// POST /api/posts/:id/contact - Contact post author for exchange
router.post('/:id/contact', auth, async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const post = await Post.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot contact yourself' });
    }

    // Create or find existing conversation
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, post.authorId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: Date.now().toString(),
        participants: [req.user.userId, post.authorId],
        participantNames: [req.user.name, post.authorName],
        participantDPs: [req.user.profilePicture || '', post.authorDP || '']
      });
      await conversation.save();
    }

    // Create the message
    const newMessage = new Message({
      messageId: Date.now().toString(),
      conversationId: conversation.conversationId,
      senderId: req.user.userId,
      senderName: req.user.name,
      content: `Hi! I'm interested in your post "${post.title}". ${sanitizeInput(message.trim())}`,
      messageType: 'text',
      postReference: {
        postId: post.postId,
        title: post.title
      }
    });

    await newMessage.save();

    // Update conversation
    conversation.lastMessage = newMessage.content;
    conversation.lastMessageTime = new Date();
    conversation.unreadCount = { [post.authorId]: (conversation.unreadCount?.[post.authorId] || 0) + 1 };
    await conversation.save();

    // Emit real-time events
    req.io.to(post.authorId).emit('newMessage', newMessage);
    req.io.to(post.authorId).emit('conversationUpdated', conversation);

    logger.info(`Contact message sent from ${req.user.userId} to ${post.authorId} for post ${post.postId}`);

    res.json({
      message: 'Message sent successfully',
      conversationId: conversation.conversationId
    });
  } catch (error) {
    logger.error('Contact for exchange error:', error);
    next(error);
  }
});

module.exports = router;