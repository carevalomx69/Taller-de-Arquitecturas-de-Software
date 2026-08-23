// ========== db.js ==========
// Punto único donde se crea la conexión a MySQL. Los modelos lo importan;
// nadie más en el backend debería necesitar tocar esto directamente.

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'taskuser',
  password: process.env.DB_PASSWORD || 'taskpass',
  database: process.env.DB_NAME || 'taskdb',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
