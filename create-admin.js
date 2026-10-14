// Creates the blog admin user, or resets that user's password if it already exists.
//
// Usage (credentials come from the environment, never from this file):
//   ADMIN_USERNAME=yourname ADMIN_PASSWORD='a-long-unique-passphrase' node create-admin.js
//
// DATABASE_URL must also be set (in .env or the environment) and should point at
// the database you want to change.
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment first.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Use a password of at least 12 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, username`,
      [username, passwordHash]
    );
    console.log('Admin saved:', result.rows[0]);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();
