const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notificationId: { type: String, required: true, unique: true },
    userId: { type: String, required: true }, // Recipient
    fromUserId: { type: String }, // Sender (optional for system notifications)
    type: {
        type: String,
        required: true,
        enum: ['message', 'follow', 'post_like', 'post_comment', 'skill_match', 'review', 'system']
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
        postId: String,
        postTitle: String,
        conversationId: String,
        reviewId: String,
        url: String
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);