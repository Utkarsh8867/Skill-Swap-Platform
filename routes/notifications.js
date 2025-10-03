const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// GET /api/notifications - Get user notifications
router.get('/', auth, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Populate sender information
        const populatedNotifications = await Promise.all(
            notifications.map(async (notif) => {
                if (notif.fromUserId) {
                    const fromUser = await User.findOne({ userId: notif.fromUserId })
                        .select('userId name profilePicture');
                    return { ...notif, fromUser };
                }
                return notif;
            })
        );

        const total = await Notification.countDocuments({ userId: req.user.userId });

        res.json({
            notifications: populatedNotifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get notifications error:', error);
        next(error);
    }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', auth, async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.userId,
            isRead: false
        });

        res.json({ count });
    } catch (error) {
        logger.error('Get unread count error:', error);
        next(error);
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', auth, async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                notificationId: req.params.id,
                userId: req.user.userId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        logger.error('Mark as read error:', error);
        next(error);
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', auth, async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                userId: req.user.userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('Mark all as read error:', error);
        next(error);
    }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            notificationId: req.params.id,
            userId: req.user.userId
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        logger.error('Delete notification error:', error);
        next(error);
    }
});

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', auth, async (req, res, next) => {
    try {
        await Notification.deleteMany({ userId: req.user.userId });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        logger.error('Clear all notifications error:', error);
        next(error);
    }
});

// POST /api/notifications - Create notification (internal use)
router.post('/', auth, async (req, res, next) => {
    try {
        const { userId, type, title, message, data, fromUserId } = req.body;

        const notification = new Notification({
            notificationId: Date.now().toString(),
            userId,
            fromUserId,
            type,
            title,
            message,
            data
        });

        await notification.save();

        // Emit socket event
        req.io.emit('newNotification', {
            userId,
            notification: notification.toObject()
        });

        res.status(201).json(notification);
    } catch (error) {
        logger.error('Create notification error:', error);
        next(error);
    }
});

module.exports = router;