// ========== api/tasks/[id].js ==========
// Este archivo responde a AMBAS rutas dinámicas que app.js necesita:
//   GET   /api/tasks/:userId  -> listar las tareas de ese usuario
//   PATCH /api/tasks/:id      -> completar esa tarea
// No es la misma "cosa" semánticamente (un userId no es un task id) --
// pero para el enrutador de Vercel, ambas son "/api/tasks/" seguido de
// un segmento dinámico, así que un solo archivo las atiende a las dos,
// exactamente como ya pasaba en nginx.conf con una sola "location".
// Vercel pone ese segmento en req.query.id sin importar qué signifique.

const { createPostgresAdapter } = require('../../adapters/postgresAdapter');
const taskDomain = require('../../domain/taskDomain');

module.exports = async (req, res) => {
  const { id } = req.query;
  const repo = createPostgresAdapter();

  if (req.method === 'GET') {
    // Aquí "id" es en realidad el userId -- ver el comentario de arriba.
    const result = await taskDomain.list(repo, id);
    res.status(result.status).json(result.data);
    return;
  }

  if (req.method === 'PATCH') {
    const result = await taskDomain.updateStatus(repo, id, req.body?.status);
    if (result.error) res.status(result.status).json({ error: result.error });
    else res.status(result.status).json(result.data);
    return;
  }

  res.status(405).json({ error: 'Método no permitido -- usa GET o PATCH' });
};
