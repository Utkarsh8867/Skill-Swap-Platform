// Test script to verify API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Test GET all posts
    console.log('Testing GET /api/posts...');
    const response = await axios.get(`${BASE_URL}/posts`);
    console.log('✓ GET posts successful:', response.data.length, 'posts found');
    
    // Test POST new post
    console.log('\nTesting POST /api/posts...');
    const newPost = {
      authorId: 'test123',
      authorName: 'Test User',
      title: 'Test Post',
      description: 'This is a test post',
      skills: 'JavaScript,Node.js'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/posts`, newPost);
    console.log('✓ POST post successful:', createResponse.data.postId);
    
    const postId = createResponse.data.postId;
    
    // Test GET single post
    console.log('\nTesting GET /api/posts/:id...');
    const getResponse = await axios.get(`${BASE_URL}/posts/${postId}`);
    console.log('✓ GET single post successful:', getResponse.data.title);
    
    // Test PUT update post
    console.log('\nTesting PUT /api/posts/:id...');
    const updateResponse = await axios.put(`${BASE_URL}/posts/${postId}`, {
      title: 'Updated Test Post'
    });
    console.log('✓ PUT post successful:', updateResponse.data.title);
    
    // Test DELETE post
    console.log('\nTesting DELETE /api/posts/:id...');
    await axios.delete(`${BASE_URL}/posts/${postId}`);
    console.log('✓ DELETE post successful');
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run if server is running
testAPI();