// ========== models/userModel.js ==========
// Capa de ACCESO A DATOS. Esta es la única capa que sabe que existe MySQL,
// que sabe escribir SQL, y que conoce los nombres de las columnas.
// Ni las rutas ni los controladores deberían escribir una sola línea de SQL.

const pool = require('../db');

async function create(username, password) {
  const [result] = await pool.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password]
  );
  return { id: result.insertId, username };
}

async function findByCredentials(username, password) {
  const [rows] = await pool.query(
    'SELECT id, username FROM users WHERE username = ? AND password = ?',
    [username, password]
  );
  return rows[0] || null;
}

module.exports = { create, findByCredentials };
