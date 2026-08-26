// ========== adapters/dbAdapter.js ==========
// El "traductor" del mundo de los datos. Implementa exactamente los
// métodos que el dominio espera (el PUERTO), usando MySQL por dentro.
// Si mañana cambiaran a PostgreSQL o MongoDB, solo este archivo se toca —
// domain/ no se entera.

const mysql = require('mysql2/promise');

function createDbAdapter(pool) {
  return {
    async createUser(username, password) {
      try {
        const [result] = await pool.query(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, password]
        );
        return { id: result.insertId, username };
      } catch (err) {
        // Traducimos el error específico de MySQL a un código genérico
        // que el dominio pueda entender SIN saber que existe MySQL.
        if (err.code === 'ER_DUP_ENTRY') {
          const genericErr = new Error('Duplicate username');
          genericErr.code = 'DUPLICATE_USERNAME';
          throw genericErr;
        }
        throw err;
      }
    },

    async findUserByCredentials(username, password) {
      const [rows] = await pool.query(
        'SELECT id, username FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      return rows[0] || null;
    },

    async findTasksByUserId(userId) {
      const [rows] = await pool.query(
        'SELECT id, user_id AS userId, title, status, created_at AS createdAt FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    },

    async createTask(userId, title) {
      const [result] = await pool.query(
        'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, \'pending\')',
        [userId, title]
      );
      return { id: result.insertId, userId, title, status: 'pending' };
    },

    async updateTaskStatus(id, status) {
      const [result] = await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
      return result.affectedRows > 0;
    },
  };
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'taskuser',
    password: process.env.DB_PASSWORD || 'taskpass',
    database: process.env.DB_NAME || 'taskdb',
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = { createDbAdapter, createPool };
