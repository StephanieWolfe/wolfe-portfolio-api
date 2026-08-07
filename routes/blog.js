const express = require('express');
const router = express.Router();
const pool = require('../db');

// --- Get all published posts (for blog list page)
router.get('/posts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, slug, summary, created_at FROM posts WHERE published = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong fetching posts' });
  }
});

// --- Get a single post by slug (for individual post page)
router.get('/posts/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts WHERE slug = $1 AND published = true',
      [req.params.slug]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong fetching the post' });
  }
});

// --- Create a new post
router.post('/posts', async (req, res) => {
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

module.exports = router;