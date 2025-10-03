const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Test basic functionality
async function testBackend() {
    console.log('🧪 Testing Backend Functionality...\n');

    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables:');
    console.log('   ✅ NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('   ✅ PORT:', process.env.PORT || 5000);
    console.log('   ✅ JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '❌ Missing');
    console.log('   ✅ MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '❌ Missing');
    console.log('   ✅ CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '❌ Missing');

    // Test 2: MongoDB Connection
    console.log('\n2. Testing MongoDB Connection:');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('   ✅ MongoDB connected successfully');

        // Test models
        const User = require('./models/User');
        const Post = require('./models/Post');
        const Review = require('./models/Review');
        const Conversation = require('./models/Conversation');
        const Message = require('./models/Message');

        console.log('   ✅ User model loaded');
        console.log('   ✅ Post model loaded');
        console.log('   ✅ Review model loaded');
        console.log('   ✅ Conversation model loaded');
        console.log('   ✅ Message model loaded');

        await mongoose.disconnect();
        console.log('   ✅ MongoDB disconnected');
    } catch (error) {
        console.log('   ❌ MongoDB connection failed:', error.message);
    }

    // Test 3: Route Files
    console.log('\n3. Testing Route Files:');
    try {
        require('./routes/auth');
        console.log('   ✅ Auth routes loaded');

        require('./routes/posts');
        console.log('   ✅ Posts routes loaded');

        require('./routes/users');
        console.log('   ✅ Users routes loaded');

        require('./routes/reviews');
        console.log('   ✅ Reviews routes loaded');

        require('./routes/messages');
        console.log('   ✅ Messages routes loaded');

        require('./routes/notifications');
        console.log('   ✅ Notifications routes loaded');

        require('./routes/matching');
        console.log('   ✅ Matching routes loaded');
    } catch (error) {
        console.log('   ❌ Route loading failed:', error.message);
    }

    // Test 4: Middleware
    console.log('\n4. Testing Middleware:');
    try {
        require('./middleware/auth');
        console.log('   ✅ Auth middleware loaded');

        require('./middleware/validation');
        console.log('   ✅ Validation middleware loaded');

        require('./middleware/errorHandler');
        console.log('   ✅ Error handler loaded');
    } catch (error) {
        console.log('   ❌ Middleware loading failed:', error.message);
    }

    // Test 5: Utilities
    console.log('\n5. Testing Utilities:');
    try {
        require('./utils/logger');
        console.log('   ✅ Logger utility loaded');
    } catch (error) {
        console.log('   ❌ Utility loading failed:', error.message);
    }

    console.log('\n🎉 Backend test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm start (to start the server)');
    console.log('   2. Test endpoints with Postman or frontend');
    console.log('   3. Check logs for any runtime errors');
}

testBackend().catch(console.error);