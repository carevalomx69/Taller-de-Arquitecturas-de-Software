// ========== servicio-consultas/adapters/dbAdapter.js ==========
// A diferencia de servicio-auditoria (que guarda en memoria), este
// servicio SÍ persiste su vista -- porque si se reiniciara y perdiera su
// tabla, dejaría de poder responder GET /api/tasks/:userId por completo,
// y esa es la funcionalidad principal de la app, no un extra opcional
// como la auditoría.

const mysql = require('mysql2/promise');

function createDbAdapter(pool) {
  return {
    async findTasksByUserId(userId) {
      const [rows] = await pool.query(
        'SELECT id, user_id AS userId, title, status, created_at AS createdAt, actualizado_en AS actualizadoEn FROM tasks_read WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    },

    // Se llama cuando llega el evento "tarea.creada". INSERT ... ON
    // DUPLICATE KEY UPDATE por si el mismo evento llegara dos veces
    // (RabbitMQ garantiza "al menos una vez", no "exactamente una vez" --
    // ver README para la discusión de esto).
    async upsertTaskCreated(task) {
      await pool.query(
        `INSERT INTO tasks_read (id, user_id, title, status, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status)`,
        [task.id, task.userId, task.title, task.status, new Date()]
      );
    },

    // Se llama cuando llega el evento "tarea.completada".
    async updateTaskStatus(taskId, status) {
      await pool.query('UPDATE tasks_read SET status = ? WHERE id = ?', [status, taskId]);
    },

    // NUEVO en la Práctica 8 -- destruye la proyección por completo.
    // Existe a propósito, para el experimento: si esta tabla es de
    // verdad "desechable", vaciarla no debería ser el fin del mundo,
    // mientras se pueda volver a construir desde event_store.
    async vaciar() {
      await pool.query('TRUNCATE TABLE tasks_read');
    },
  };
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'db-lectura',
    user: process.env.DB_USER || 'lectorapp',
    password: process.env.DB_PASSWORD || 'lectorpass',
    database: process.env.DB_NAME || 'readdb',
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = { createDbAdapter, createPool };
