const express = require('express');
const cors = require('cors');
require('dotenv').config();
const blogRouter = require('./routes/blog');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Wolfe Portfolio API is running' });
});

app.use('/api/blog', blogRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});