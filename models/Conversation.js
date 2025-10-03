const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true },
    participants: [{ type: String, required: true }],
    participantNames: [{ type: String, required: true }],
    participantDPs: [{ type: String, default: '' }],
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);