const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAccountLimiter, validateEmail, validatePassword, sanitizeInput } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// POST /api/auth/register - Register user
router.post('/register', createAccountLimiter, async (req, res, next) => {
  try {
    const { name, email, password, skillsToTeach, skillsToLearn, location } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      userId: Date.now().toString(),
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      password: hashedPassword,
      skillsToTeach: Array.isArray(skillsToTeach) ? skillsToTeach.map(sanitizeInput) : [],
      skillsToLearn: Array.isArray(skillsToLearn) ? skillsToLearn.map(sanitizeInput) : [],
      location
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      logger.warn(`Failed login attempt for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    logger.info(`User logged in: ${user.email}`);
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', auth, async (req, res, next) => {
  try {
    const token = jwt.sign(
      { userId: req.user.userId, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

module.exports = router;