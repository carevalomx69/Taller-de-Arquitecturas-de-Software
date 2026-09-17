// ========== api/listar-tareas.js ==========
// Misma idea que crear-tarea.js -- una función independiente, con su
// propia vida efímera, que nunca sabe (ni le importa) si crear-tarea.js
// está corriendo en este momento en algún lado. Podrían ejecutarse las
// dos, en instancias completamente distintas, en el mismo microsegundo,
// para usuarios distintos, y ninguna se enteraría de la otra.

const { createPostgresAdapter } = require('../adapters/postgresAdapter');
const taskDomain = require('../domain/taskDomain');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido -- usa GET' });
    return;
  }

  const { userId } = req.query;
  if (!userId) {
    res.status(400).json({ error: 'Falta el parámetro userId (?userId=1)' });
    return;
  }

  const repo = createPostgresAdapter();
  const result = await taskDomain.list(repo, userId);
  res.status(result.status).json(result.data);
};
