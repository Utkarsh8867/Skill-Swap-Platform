const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const SimplePost = require('../models/SimplePost');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// GET /api/posts - List all posts
router.get('/', async (req, res) => {
  try {
    const posts = await SimplePost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await SimplePost.findOne({ postId: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - Create post
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { authorId, authorName, authorDP, title, description, skills } = req.body;
    
    const imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    }

    const post = new SimplePost({
      postId: Date.now().toString(),
      authorId,
      authorName,
      authorDP,
      title,
      description,
      skills: Array.isArray(skills) ? skills : skills?.split(',') || [],
      images: imageUrls
    });

    await post.save();
    req.io.emit('postCreated', post);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/posts/:id - Edit post
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const post = await SimplePost.findOne({ postId: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { title, description, skills } = req.body;
    
    const imageUrls = [...post.images];
    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.skills = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : post.skills;
    post.images = imageUrls;
    post.updatedAt = new Date();

    await post.save();
    req.io.emit('postUpdated', post);
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await SimplePost.findOneAndDelete({ postId: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    req.io.emit('postDeleted', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;