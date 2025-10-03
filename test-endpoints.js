const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to test them
const User = require('./models/User');
const Post = require('./models/Post');
const Review = require('./models/Review');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

async function testEndpoints() {
    console.log('🧪 Testing Backend Models and Endpoints...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connected successfully\n');

        // Test 1: User Model
        console.log('1. Testing User Model:');
        const testUser = new User({
            userId: 'test-user-' + Date.now(),
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedpassword',
            skillsToTeach: ['JavaScript', 'React'],
            skillsToLearn: ['Python', 'Django'],
            bookmarkedPosts: []
        });

        const savedUser = await testUser.save();
        console.log('   ✅ User model works - Created user:', savedUser.name);

        // Test 2: Post Model
        console.log('\n2. Testing Post Model:');
        const testPost = new Post({
            postId: 'test-post-' + Date.now(),
            authorId: savedUser.userId,
            authorName: savedUser.name,
            title: 'Test Post',
            description: 'This is a test post',
            skillsOffered: ['JavaScript'],
            skillsNeeded: ['Python'],
            likes: [],
            comments: [],
            bookmarkedBy: []
        });

        const savedPost = await testPost.save();
        console.log('   ✅ Post model works - Created post:', savedPost.title);

        // Test 3: Review Model
        console.log('\n3. Testing Review Model:');
        const testReview = new Review({
            reviewId: 'test-review-' + Date.now(),
            reviewerId: savedUser.userId,
            reviewerName: savedUser.name,
            revieweeId: 'another-user-id',
            rating: 5,
            comment: 'Great experience!',
            skillExchanged: 'JavaScript',
            exchangeType: 'taught'
        });

        const savedReview = await testReview.save();
        console.log('   ✅ Review model works - Created review with rating:', savedReview.rating);

        // Test 4: Conversation Model
        console.log('\n4. Testing Conversation Model:');
        const testConversation = new Conversation({
            conversationId: 'test-conv-' + Date.now(),
            participants: [savedUser.userId, 'another-user-id'],
            participantNames: [savedUser.name, 'Another User'],
            participantDPs: ['', ''],
            lastMessage: 'Hello there!',
            lastMessageTime: new Date()
        });

        const savedConversation = await testConversation.save();
        console.log('   ✅ Conversation model works - Created conversation:', savedConversation.conversationId);

        // Test 5: Message Model
        console.log('\n5. Testing Message Model:');
        const testMessage = new Message({
            messageId: 'test-msg-' + Date.now(),
            conversationId: savedConversation.conversationId,
            senderId: savedUser.userId,
            senderName: savedUser.name,
            content: 'Hello, this is a test message!',
            messageType: 'text'
        });

        const savedMessage = await testMessage.save();
        console.log('   ✅ Message model works - Created message:', savedMessage.content);

        // Test 6: Notification Model
        console.log('\n6. Testing Notification Model:');
        const testNotification = new Notification({
            notificationId: 'test-notif-' + Date.now(),
            userId: savedUser.userId,
            fromUserId: 'another-user-id',
            type: 'message',
            title: 'New Message',
            message: 'You have a new message',
            data: {
                conversationId: savedConversation.conversationId
            }
        });

        const savedNotification = await testNotification.save();
        console.log('   ✅ Notification model works - Created notification:', savedNotification.title);

        // Test 7: Post with likes and comments
        console.log('\n7. Testing Post interactions:');

        // Add like
        savedPost.likes.push(savedUser.userId);

        // Add comment
        savedPost.comments.push({
            commentId: 'test-comment-' + Date.now(),
            userId: savedUser.userId,
            userName: savedUser.name,
            userDP: '',
            content: 'This is a test comment',
            createdAt: new Date()
        });

        await savedPost.save();
        console.log('   ✅ Post interactions work - Likes:', savedPost.likes.length, 'Comments:', savedPost.comments.length);

        // Test 8: User bookmarks
        console.log('\n8. Testing User bookmarks:');
        savedUser.bookmarkedPosts.push(savedPost.postId);
        savedPost.bookmarkedBy.push(savedUser.userId);

        await Promise.all([savedUser.save(), savedPost.save()]);
        console.log('   ✅ Bookmarks work - User has', savedUser.bookmarkedPosts.length, 'bookmarks');

        // Cleanup test data
        console.log('\n9. Cleaning up test data:');
        await User.deleteOne({ userId: savedUser.userId });
        await Post.deleteOne({ postId: savedPost.postId });
        await Review.deleteOne({ reviewId: savedReview.reviewId });
        await Conversation.deleteOne({ conversationId: savedConversation.conversationId });
        await Message.deleteOne({ messageId: savedMessage.messageId });
        await Notification.deleteOne({ notificationId: savedNotification.notificationId });
        console.log('   ✅ Test data cleaned up');

        console.log('\n🎉 All backend models and interactions work perfectly!');
        console.log('\n📋 Summary:');
        console.log('   ✅ User model with bookmarks');
        console.log('   ✅ Post model with likes and comments');
        console.log('   ✅ Review model with ratings');
        console.log('   ✅ Conversation model with participants');
        console.log('   ✅ Message model with sender info');
        console.log('   ✅ Notification model with types');
        console.log('   ✅ All interactions (likes, comments, bookmarks)');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    }
}

testEndpoints();