// Test server without MongoDB
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let posts = [];
let nextId = 1;

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const post = {
    postId: nextId++,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  posts.push(post);
  res.status(201).json(post);
});

app.listen(5000, () => console.log('Test server running on port 5000'));