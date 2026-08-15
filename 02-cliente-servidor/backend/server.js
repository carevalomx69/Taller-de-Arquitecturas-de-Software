// ========== backend/server.js ==========
// Práctica 2: Cliente-Servidor
//
// Diferencia clave respecto al Monolito: este proceso YA NO contiene los
// datos. Se conecta a una base de datos que vive en su propio contenedor
// ("db"), en su propio servicio, en su propia red de Docker. Nótese que
// nos conectamos a ella por su NOMBRE DE SERVICIO ("db"), no por una IP fija
// — así es como se "ven" los contenedores entre sí dentro de la red que
// crea Docker Compose.

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_HOST = process.env.DB_HOST || 'db';
const DB_USER = process.env.DB_USER || 'taskuser';
const DB_PASSWORD = process.env.DB_PASSWORD || 'taskpass';
const DB_NAME = process.env.DB_NAME || 'taskdb';

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Reintenta la conexión al arrancar. Aunque docker-compose ya espera a que
// "db" pase su healthcheck antes de arrancar este servicio, este reintento
// es una segunda red de seguridad: MySQL puede tardar unos segundos más en
// aceptar conexiones incluso después de reportarse "healthy".
async function waitForDatabase(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('Conexión a la base de datos establecida.');
      return;
    } catch (err) {
      console.log(`Esperando a la base de datos... intento ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('No se pudo conectar a la base de datos después de varios intentos.');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running (cliente-servidor)' });
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );
    res.status(201).json({ id: result.insertId, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/tasks/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id AS userId, title, status, created_at AS createdAt FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { userId, title } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, \'pending\')',
      [userId, title]
    );
    res.status(201).json({ id: result.insertId, userId, title, status: 'pending' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'pending' && status !== 'completed') {
    return res.status(400).json({ error: 'status must be "pending" or "completed"' });
  }
  try {
    const [result] = await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ id: Number(id), status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

waitForDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
