// ========== servicio-tareas/adapters/dbAdapter.js ==========
// Solo los métodos de tareas. Este servicio no sabe que existen los
// usuarios como entidad propia — solo conoce un "userId" como dato suelto,
// nunca hace un JOIN contra la tabla users.

const mysql = require('mysql2/promise');

function createDbAdapter(pool) {
  return {
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
