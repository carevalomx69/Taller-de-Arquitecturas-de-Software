// ========== api/crear-tarea.js ==========
// Esto es una FUNCIÓN, no un servicio. No hay "app.listen()" en ningún
// lado de este archivo, ni de toda la práctica -- no existe el concepto
// de "puerto" ni de "servidor arriba". Vercel decide cuándo ejecutar
// este archivo (cuando llega una petición a /api/crear-tarea) y cuándo
// no (el resto del tiempo, no hay nada corriendo, y no cuesta nada).
//
// Nota algo más: el adaptador se crea DENTRO del handler, en cada
// invocación -- no arriba del archivo, como "una sola vez al arrancar".
// No hay "arrancar" que valga aquí: cada invocación podría ser la
// primera vez que este código corre en esa instancia efímera.

const { createPostgresAdapter } = require('../adapters/postgresAdapter');
const taskDomain = require('../domain/taskDomain');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido -- usa POST' });
    return;
  }

  const { userId, title } = req.body || {};
  const repo = createPostgresAdapter();
  const result = await taskDomain.create(repo, userId, title);

  if (result.error) {
    res.status(result.status).json({ error: result.error });
  } else {
    res.status(result.status).json(result.data);
  }
};
