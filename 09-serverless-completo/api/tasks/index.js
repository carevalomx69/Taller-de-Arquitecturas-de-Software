// ========== api/tasks/index.js ==========
// Vercel enruta esto a /api/tasks -- el mismo path exacto que app.js
// ya usaba desde la Práctica 2 para crear una tarea. Cero cambios
// necesarios en el frontend para esta ruta.

const { createPostgresAdapter } = require('../../adapters/postgresAdapter');
const taskDomain = require('../../domain/taskDomain');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido -- usa POST' });
    return;
  }
  const { userId, title } = req.body || {};
  const repo = createPostgresAdapter();
  const result = await taskDomain.create(repo, userId, title);
  if (result.error) res.status(result.status).json({ error: result.error });
  else res.status(result.status).json(result.data);
};
