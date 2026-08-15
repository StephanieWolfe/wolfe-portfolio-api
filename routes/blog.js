const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// --- Get all published posts (for blog list page)
router.get('/posts', async (req, res) => {
  try {
    // Check if request has a valid auth token
    const authHeader = req.headers.authorization;
    let isAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = true;
      } catch {
        isAdmin = false;
      }
    }

    const query = isAdmin
      ? 'SELECT id, title, slug, summary, published, created_at FROM posts ORDER BY created_at DESC'
      : 'SELECT id, title, slug, summary, created_at FROM posts WHERE published = true ORDER BY created_at DESC';

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong fetching posts' });
  }
});

// --- Get a single post by slug (for individual post page)
router.get('/posts/:slug', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let isAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = true;
      } catch {
        isAdmin = false;
      }
    }

    const query = isAdmin
      ? 'SELECT * FROM posts WHERE slug = $1'
      : 'SELECT * FROM posts WHERE slug = $1 AND published = true';

    const result = await pool.query(query, [req.params.slug]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong fetching the post' });
  }
});

// --- Create a new post
// --- Create a new post (protected)
router.post('/posts', requireAuth, async (req, res) => {
  const { title, slug, summary, content, published } = req.body;

  if (!title || !slug || !summary || !content) {
    return res.status(400).json({ error: 'title, slug, summary, and content are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (title, slug, summary, content, published)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, slug, summary, content, published ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A post with that slug already exists' });
    }
    res.status(500).json({ error: 'Something went wrong creating the post' });
  }
});

// --- Delete a post (protected)
router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong deleting the post' });
  }
});

// --- Update a post (protected)
router.put('/posts/:slug', requireAuth, async (req, res) => {
  const { title, slug, summary, content, published } = req.body;

  if (!title || !slug || !summary || !content) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE posts SET title=$1, slug=$2, summary=$3, content=$4, published=$5
       WHERE slug=$6 RETURNING *`,
      [title, slug, summary, content, published, req.params.slug]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A post with that slug already exists' });
    }
    res.status(500).json({ error: 'Something went wrong updating the post' });
  }
});

module.exports = router;