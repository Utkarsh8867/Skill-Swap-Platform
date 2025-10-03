const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userDP: { type: String, default: '' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorDP: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  skillsOffered: [String],
  skillsNeeded: [String],
  images: [String],
  location: {
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  likes: [{ type: String }], // Array of user IDs who liked the post
  comments: [commentSchema],
  bookmarkedBy: [{ type: String }], // Array of user IDs who bookmarked the post
  isActive: { type: Boolean, default: true },
  matchedUsers: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);