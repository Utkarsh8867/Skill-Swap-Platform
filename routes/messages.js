const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// GET /api/messages/conversations - Get user conversations
router.get('/conversations', auth, async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.userId,
            isActive: true
        }).sort({ updatedAt: -1 });

        // Populate participant details and unread counts
        const populatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const otherParticipantId = conv.participants.find(p => p !== req.user.userId);
                const participant = await User.findOne({ userId: otherParticipantId })
                    .select('userId name profilePicture isOnline');

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    conversationId: conv.conversationId,
                    senderId: { $ne: req.user.userId },
                    isRead: false
                });

                return {
                    id: conv.conversationId,
                    participant,
                    lastMessage: conv.lastMessage,
                    lastMessageTime: conv.lastMessageTime,
                    unreadCount,
                    createdAt: conv.createdAt,
                    updatedAt: conv.updatedAt
                };
            })
        );

        res.json(populatedConversations);
    } catch (error) {
        logger.error('Get conversations error:', error);
        next(error);
    }
});

// POST /api/messages/conversations - Create new conversation
router.post('/conversations', auth, async (req, res, next) => {
    try {
        const { participantId } = req.body;

        if (!participantId) {
            return res.status(400).json({ error: 'Participant ID is required' });
        }

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            participants: { $all: [req.user.userId, participantId] }
        });

        if (existingConversation) {
            return res.json({ id: existingConversation.conversationId });
        }

        // Create new conversation
        const conversation = new Conversation({
            conversationId: Date.now().toString(),
            participants: [req.user.userId, participantId]
        });

        await conversation.save();

        // Get participant details
        const participant = await User.findOne({ userId: participantId })
            .select('userId name profilePicture isOnline');

        res.status(201).json({
            id: conversation.conversationId,
            participant,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        });
    } catch (error) {
        logger.error('Create conversation error:', error);
        next(error);
    }
});

// GET /api/messages/:conversationId - Get messages in conversation
router.get('/:conversationId', auth, async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        // Verify user is participant
        const conversation = await Conversation.findOne({
            conversationId,
            participants: req.user.userId
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Reverse to get chronological order
        messages.reverse();

        res.json(messages);
    } catch (error) {
        logger.error('Get messages error:', error);
        next(error);
    }
});

// POST /api/messages/:conversationId - Send message
router.post('/:conversationId', auth, async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { content, type = 'text' } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findOne({
            conversationId,
            participants: req.user.userId
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Create message
        const message = new Message({
            messageId: Date.now().toString(),
            conversationId,
            senderId: req.user.userId,
            senderName: req.user.name,
            content: content.trim(),
            messageType: type
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message.content;
        conversation.lastMessageTime = message.createdAt;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Emit socket event
        req.io.emit('newMessage', {
            ...message.toObject(),
            conversationId
        });

        logger.info(`Message sent by user ${req.user.userId} in conversation ${conversationId}`);
        res.status(201).json(message);
    } catch (error) {
        logger.error('Send message error:', error);
        next(error);
    }
});

// PUT /api/messages/:conversationId/read - Mark messages as read
router.put('/:conversationId/read', auth, async (req, res, next) => {
    try {
        const { conversationId } = req.params;

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findOne({
            conversationId,
            participants: req.user.userId
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: req.user.userId },
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        logger.error('Mark as read error:', error);
        next(error);
    }
});

// DELETE /api/messages/message/:messageId - Delete message
router.delete('/message/:messageId', auth, async (req, res, next) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findOne({ messageId });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Only sender can delete message
        if (message.senderId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this message' });
        }

        await Message.findOneAndDelete({ messageId });

        // Emit socket event
        req.io.emit('messageDeleted', { messageId, conversationId: message.conversationId });

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        logger.error('Delete message error:', error);
        next(error);
    }
});

// GET /api/messages/search - Search messages
router.get('/search', auth, async (req, res, next) => {
    try {
        const { q: query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        // Get user's conversations
        const conversations = await Conversation.find({
            participants: req.user.userId
        }).select('conversationId');

        const conversationIds = conversations.map(c => c.conversationId);

        // Search messages
        const messages = await Message.find({
            conversationId: { $in: conversationIds },
            content: { $regex: query, $options: 'i' }
        }).sort({ createdAt: -1 }).limit(50);

        res.json(messages);
    } catch (error) {
        logger.error('Search messages error:', error);
        next(error);
    }
});

module.exports = router;