import mysql2 from 'mysql2';
import express from 'express';
import pkg from 'body-parser';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import bcrypt from 'bcrypt';



const { json } = pkg;

const app = express();
const port = 3000;
const secretKey = 'secret-key';


app.use(pkg.urlencoded({ extended: false }));

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


// Generate JWT token 
const token = jwt.sign({ userId: '123' }, 'secret-key', {
  expiresIn: '1h',
  jwtid: Math.random().toString(36).substring(2, 13) // generates a random 11-character string
});

// Set up the authorization middleware
const authMiddleware = expressJwt.expressjwt ({
  secret: secretKey,
  algorithms: ['HS256'],
  getToken: function(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

// GET /posts
app.get('/posts', authMiddleware, (req, res) => {
    posts_db.query('SELECT * FROM posts_table', (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// GET /posts/:id
app.get('/posts/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  posts_db.query('SELECT * FROM posts_table WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.send(results[0]);
  });
});

// POST /posts
app.post('/posts', authMiddleware, (req, res) => {
  const { title, body } = req.body;
  const createdAt = new Date();
  const updatedAt = new Date();
  posts_db.query('INSERT INTO posts_table (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)', [title, body, createdAt, updatedAt], (err, results) => {
    if (err) throw err;
    res.send({ id: results.insertId, title, body, created_at: createdAt, updated_at: updatedAt });
  });
});

// PUT /posts/:id
app.put('/posts/:id', authMiddleware,(req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
  const updatedAt = new Date();
  posts_db.query('UPDATE posts_table SET title = ?, body = ?, updated_at = ? WHERE id = ?', [title, body, updatedAt, id], (err, results) => {
    if (err) throw err;
    res.send({ id, title, body, updated_at: updatedAt });
  });
});

// DELETE /posts/:id
app.delete('/posts/:id', authMiddleware,(req, res) => {
  const { id } = req.params;
  posts_db.query('DELETE FROM posts_table WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.send(`Post with ID ${id} deleted`);
  });
});


// POST /login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Retrieve the user from the database
    const results = await new Promise((resolve, reject) => {
      posts_db.query('SELECT * FROM users_table WHERE username = ?', [username], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Check if the user exists and the password matches
    if (results.length === 0) {
      res.status(401).send('Invalid username or password');
    } else {
      const user = results[0];
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (passwordMatches) {
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
        res.send({ token });
      } else {
        res.status(401).send('Invalid username or password');
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});


// POST /signup

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const createdAt = new Date();
  const updatedAt = new Date();
  try {
    // Hash the password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Insert the user into the database
    posts_db.query('INSERT INTO users_table (username, password, created_at, updated_at) VALUES (?, ?, ?, ?)', [username, hashedPassword, createdAt, updatedAt], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error creating user');
      } else {
        const user = { id: results.insertId, username, password: hashedPassword, created_at: createdAt, updated_at: updatedAt };
        res.send(user);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});



// start server
app.listen(port, () => {
  console.log(`SERVER : http://localhost:${port}`);
});
