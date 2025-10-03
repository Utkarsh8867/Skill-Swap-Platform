# GNEC Backend - Skill Exchange Platform API

A comprehensive Node.js backend for the GNEC skill exchange platform with real-time features, file uploads, and complete CRUD operations.

## 🚀 Features

- **User Authentication** - Registration and login system
- **Post Management** - Complete CRUD operations for skill exchange posts
- **Real-time Updates** - Socket.IO for instant notifications
- **File Upload** - Cloudinary integration for image storage
- **User Matching** - AI-powered skill matching system
- **Reviews System** - User rating and review functionality
- **Location-based Search** - Find nearby users and posts

## 📋 Prerequisites

- Node.js 14+
- MongoDB (local or Atlas)
- Cloudinary account

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd gnec-backend
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required environment variables:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gnec
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

4. **Start the server:**
```bash
npm start          # Production mode
npm run dev        # Development mode with nodemon
```

## 📊 Complete API Documentation

### �S Authentication APIs

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "skillsToTeach": ["JavaScript", "React", "Node.js"],
  "skillsToLearn": ["Python", "Machine Learning"],
  "location": {
    "city": "New York",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

**Response:**
```json
{
  "userId": "1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "skillsToTeach": ["JavaScript", "React", "Node.js"],
  "skillsToLearn": ["Python", "Machine Learning"],
  "location": {
    "city": "New York",
    "coordinates": {"lat": 40.7128, "lng": -74.0060}
  },
  "rating": 0,
  "totalReviews": 0,
  "completedExchanges": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "userId": "1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "skillsToTeach": ["JavaScript", "React", "Node.js"],
  "skillsToLearn": ["Python", "Machine Learning"]
}
```

---

### � Poosts APIs

#### 3. Get All Posts
```http
GET /api/posts
```

**Response:**
```json
[
  {
    "postId": "1234567890",
    "authorId": "user123",
    "authorName": "John Doe",
    "authorDP": "https://cloudinary.com/profile.jpg",
    "title": "Learn Python, Teach JavaScript",
    "description": "Looking to exchange web development skills",
    "skillsOffered": ["JavaScript", "React"],
    "skillsNeeded": ["Python", "Django"],
    "images": ["https://cloudinary.com/image1.jpg"],
    "location": {
      "city": "New York",
      "coordinates": {"lat": 40.7128, "lng": -74.0060}
    },
    "isActive": true,
    "matchedUsers": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 4. Get Single Post
```http
GET /api/posts/{postId}
```

**Example:** `GET /api/posts/1234567890`

#### 5. Create Post (JSON)
```http
POST /api/posts
Content-Type: application/json
```

**Request Body:**
```json
{
  "authorId": "1234567890",
  "authorName": "John Doe",
  "authorDP": "https://example.com/profile.jpg",
  "title": "Learn Python, Teach JavaScript",
  "description": "Looking to exchange web development skills for Python expertise",
  "skillsOffered": ["JavaScript", "React", "Node.js"],
  "skillsNeeded": ["Python", "Django", "Machine Learning"],
  "location": {
    "city": "New York",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

#### 6. Create Post with Images
```http
POST /api/posts
Content-Type: multipart/form-data
```

**Form Fields:**
- `authorId`: "1234567890"
- `authorName`: "John Doe"
- `authorDP`: "https://example.com/profile.jpg"
- `title`: "Learn Python, Teach JavaScript"
- `description`: "Looking to exchange web development skills"
- `skillsOffered`: "JavaScript,React,Node.js"
- `skillsNeeded`: "Python,Django,Machine Learning"
- `location`: `{"city": "New York", "coordinates": {"lat": 40.7128, "lng": -74.0060}}`
- `images`: [file1.jpg, file2.jpg] (up to 5 files)

#### 7. Update Post
```http
PUT /api/posts/{postId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated: Learn Python, Teach JavaScript",
  "description": "Updated description with more details",
  "skills": ["JavaScript", "React", "Vue.js"]
}
```

#### 8. Delete Post
```http
DELETE /api/posts/{postId}
```

**Example:** `DELETE /api/posts/1234567890`

---

### 👥 Users APIs

#### 9. Get All Users
```http
GET /api/users
```

**Response:**
```json
[
  {
    "userId": "1234567890",
    "name": "John Doe",
    "skillsToTeach": ["JavaScript", "React"],
    "skillsToLearn": ["Python", "ML"],
    "location": {
      "city": "New York",
      "coordinates": {"lat": 40.7128, "lng": -74.0060}
    },
    "rating": 4.5,
    "totalReviews": 10,
    "completedExchanges": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 10. Create User
```http
POST /api/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "skillsToTeach": ["Python", "Data Science"],
  "skillsToLearn": ["React", "Frontend"],
  "location": {
    "city": "San Francisco",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  }
}
```

#### 11. Find Nearby Users
```http
GET /api/users/nearby?lat=40.7128&lng=-74.0060&radius=10
```

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius in km (optional, default: 10)

---

### ⭐ Reviews APIs

#### 12. Create Review
```http
POST /api/reviews
Content-Type: application/json
```

**Request Body:**
```json
{
  "fromUserId": "1234567890",
  "toUserId": "0987654321",
  "postId": "1111111111",
  "rating": 5,
  "comment": "Great skill exchange! Very knowledgeable in Python.",
  "skillExchanged": "Python for JavaScript"
}
```

**Response:**
```json
{
  "reviewId": "review123",
  "fromUserId": "1234567890",
  "toUserId": "0987654321",
  "postId": "1111111111",
  "rating": 5,
  "comment": "Great skill exchange! Very knowledgeable in Python.",
  "skillExchanged": "Python for JavaScript",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 13. Get User Reviews
```http
GET /api/reviews/{userId}
```

**Example:** `GET /api/reviews/0987654321`

---

### 🎯 Matching APIs

#### 14. Get AI Matches for User
```http
GET /api/matching/{userId}
```

**Example:** `GET /api/matching/1234567890`

**Response:**
```json
[
  {
    "postId": "match123",
    "authorId": "user456",
    "authorName": "Jane Smith",
    "title": "Teach Python, Learn JavaScript",
    "description": "Python expert looking to learn frontend",
    "skillsOffered": ["Python", "Django"],
    "skillsNeeded": ["JavaScript", "React"],
    "matchScore": 4,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 🏥 System APIs

#### 15. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

## 🧪 Testing with cURL

### Authentication Tests
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "skillsToTeach": ["JavaScript"],
    "skillsToLearn": ["Python"]
  }'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Posts Tests
```bash
# Create a post
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "authorId": "123",
    "authorName": "Test User",
    "title": "Learn Python",
    "description": "Want to learn Python",
    "skillsOffered": ["JavaScript"],
    "skillsNeeded": ["Python"]
  }'

# Get all posts
curl http://localhost:5000/api/posts

# Get single post
curl http://localhost:5000/api/posts/1234567890

# Update post
curl -X PUT http://localhost:5000/api/posts/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description"
  }'

# Delete post
curl -X DELETE http://localhost:5000/api/posts/1234567890
```

### Users Tests
```bash
# Get all users
curl http://localhost:5000/api/users

# Find nearby users
curl "http://localhost:5000/api/users/nearby?lat=40.7128&lng=-74.0060&radius=10"
```

### Reviews Tests
```bash
# Create review
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "123",
    "toUserId": "456",
    "postId": "789",
    "rating": 5,
    "comment": "Great exchange!",
    "skillExchanged": "Python for JavaScript"
  }'

# Get user reviews
curl http://localhost:5000/api/reviews/456
```

### Matching Tests
```bash
# Get matches for user
curl http://localhost:5000/api/matching/123
```

### System Tests
```bash
# Health check
curl http://localhost:5000/health
```

---

## 🔄 Real-time Features (Socket.IO)

The server emits the following Socket.IO events:

### Events Emitted:
- `postCreated` - When a new post is created
- `postUpdated` - When a post is updated
- `postDeleted` - When a post is deleted

### Client Connection:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('postCreated', (post) => {
  console.log('New post created:', post);
});

socket.on('postUpdated', (post) => {
  console.log('Post updated:', post);
});

socket.on('postDeleted', (postId) => {
  console.log('Post deleted:', postId);
});
```

---

## 📋 Response Formats

### Success Response
```json
{
  "data": {...},
  "message": "Success"
}
```

### Error Response
```json
{
  "error": "Error message description",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 Configuration & Features

### File Upload Limits
- Max file size: 5MB per image
- Max files: 5 images per post
- Supported formats: JPG, PNG, GIF
- Storage: Cloudinary CDN

### Database Models

#### User Model
```javascript
{
  userId: String (unique),
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  profilePicture: String,
  skillsToTeach: [String],
  skillsToLearn: [String],
  location: {
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  rating: Number (default: 0),
  totalReviews: Number (default: 0),
  completedExchanges: Number (default: 0),
  createdAt: Date
}
```

#### Post Model
```javascript
{
  postId: String (unique),
  authorId: String (required),
  authorName: String (required),
  authorDP: String,
  title: String (required),
  description: String (required),
  skillsOffered: [String],
  skillsNeeded: [String],
  images: [String],
  location: {
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  isActive: Boolean (default: true),
  matchedUsers: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### Review Model
```javascript
{
  reviewId: String (unique),
  fromUserId: String (required),
  toUserId: String (required),
  postId: String (required),
  rating: Number (1-5, required),
  comment: String (required),
  skillExchanged: String (required),
  createdAt: Date
}
```

---

## 🚀 Getting Started

1. **Install dependencies:** `npm install`
2. **Set up environment:** Copy `.env.example` to `.env` and configure
3. **Start MongoDB:** Ensure MongoDB is running locally or use Atlas
4. **Run the server:** `npm start` or `npm run dev`
5. **Test the API:** Use the health check endpoint: `GET /health`

The server will be running at `http://localhost:5000` with full API documentation above!