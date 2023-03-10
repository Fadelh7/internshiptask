import mysql2 from 'mysql2';
import express from 'express';
import pkg from 'body-parser';

const { json } = pkg;

const app = express();
const port = 3000;

// create mysql connection
const posts_db = mysql2.createConnection({
  host: 'localhost',//"127.0.0.1"
  user: 'root',
  password: 'Fadel777',
  database: 'posts_db'
});

// connect to mysql
posts_db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// middleware
app.use(json());

// GET /posts
app.get('/posts', (req, res) => {
    posts_db.query('SELECT * FROM posts_table', (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// GET /posts/:id
app.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  posts_db.query('SELECT * FROM posts_table WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.send(results[0]);
  });
});

// POST /posts
app.post('/posts', (req, res) => {
  const { title, body } = req.body;
  const createdAt = new Date();
  const updatedAt = new Date();
  posts_db.query('INSERT INTO posts_table (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)', [title, body, createdAt, updatedAt], (err, results) => {
    if (err) throw err;
    res.send({ id: results.insertId, title, body, created_at: createdAt, updated_at: updatedAt });
  });
});

// PUT /posts/:id
app.put('/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
  const updatedAt = new Date();
  posts_db.query('UPDATE posts_table SET title = ?, body = ?, updated_at = ? WHERE id = ?', [title, body, updatedAt, id], (err, results) => {
    if (err) throw err;
    res.send({ id, title, body, updated_at: updatedAt });
  });
});

// DELETE /posts/:id
app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  posts_db.query('DELETE FROM posts_table WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.send(`Post with ID ${id} deleted`);
  });
});

// start server
app.listen(port, () => {
  console.log(`SERVER : http://localhost:${port}`);
});
