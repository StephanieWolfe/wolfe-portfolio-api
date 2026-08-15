require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function createAdmin() {
  const username = 'stephanie';
  const password = 'C0tt3nC@ndy%1';

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );
    console.log('Admin created:', result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      console.log('User already exists');
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}

createAdmin();