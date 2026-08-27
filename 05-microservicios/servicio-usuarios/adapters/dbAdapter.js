// ========== servicio-usuarios/adapters/dbAdapter.js ==========
// Igual que en la Práctica 4, solo que este adaptador ya no vive junto al
// de tareas — cada microservicio tiene el suyo propio, y cada uno solo
// conoce la porción de la base de datos que le corresponde a su dominio.

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
