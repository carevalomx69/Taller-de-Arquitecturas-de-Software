// ========== models/taskModel.js ==========
// Capa de ACCESO A DATOS para tareas. Mismo principio que userModel.js:
// solo SQL aquí, nada de reglas de negocio ni de manejo de la petición HTTP.

const pool = require('../db');

async function findByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT id, user_id AS userId, title, status, created_at AS createdAt FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function create(userId, title) {
  const [result] = await pool.query(
    'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, \'pending\')',
    [userId, title]
  );
  return { id: result.insertId, userId, title, status: 'pending' };
}

async function updateStatus(id, status) {
  const [result] = await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
}

module.exports = { findByUserId, create, updateStatus };
