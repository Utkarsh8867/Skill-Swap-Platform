// Simple server test without database
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Server is running without database'
    });
});

// Test posts endpoint
app.get('/api/posts', (req, res) => {
    res.json({
        posts: [
            {
                postId: '1',
                authorId: 'test-user',
                authorName: 'Test User',
                title: 'Test Post',
                description: 'This is a test post',
                skillsOffered: ['JavaScript'],
                skillsNeeded: ['Python'],
                createdAt: new Date().toISOString()
            }
        ],
        pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
        }
    });
});

// Test auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        user: {
            userId: 'test-user-123',
            name: 'Test User',
            email: 'test@example.com'
        },
        token: 'test-jwt-token'
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log('This server works without database for testing');
});