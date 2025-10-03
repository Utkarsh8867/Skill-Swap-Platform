const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  skillsToTeach: [String],
  skillsToLearn: [String],
  location: {
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  completedExchanges: { type: Number, default: 0 },
  bookmarkedPosts: [{ type: String }], // Array of post IDs
  followers: [{ type: String }],
  following: [{ type: String }],
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);