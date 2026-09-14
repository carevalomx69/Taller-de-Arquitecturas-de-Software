// ========== servicio-tareas/adapters/apiAdapter.js ==========
// Solo las rutas de tareas -- y, desde esta práctica, SOLO las de ESCRITURA.
// Este servicio no sabe que existe el login, y desde la Práctica 7 tampoco
// sabe cómo listar tareas -- ese ya no es su trabajo.
//
// CAMBIO respecto a la Práctica 6: se QUITÓ la ruta GET /api/tasks/:userId.
// taskDomain.list() (el dominio) sigue existiendo sin tocarse -- el cambio
// es que ya nadie en este servicio lo llama. La responsabilidad de
// responder consultas se movió por completo a servicio-consultas, que
// nunca le pregunta nada a este servicio: se entera de los cambios por los
// mismos eventos que ya publicábamos desde la Práctica 6.

const express = require('express');
const cors = require('cors');

const taskDomain = require('../domain/taskDomain');

function createApiAdapter(repo, eventPublisher) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-tareas -- solo comandos)' });
  });

  app.post('/api/tasks', async (req, res) => {
    const { userId, title } = req.body;
    const result = await taskDomain.create(repo, userId, title);
    if (!result.error) {
      // La tarea YA se guardó en MySQL -- esto es solo avisar. Si falla,
      // la petición HTTP igual responde 201 (ver eventPublisher.js).
      await eventPublisher.publish('tarea.creada', {
        evento: 'tarea.creada',
        tarea: result.data,
        timestamp: new Date().toISOString(),
      });
    }
    respond(res, result);
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    const result = await taskDomain.updateStatus(repo, req.params.id, req.body.status);
    if (!result.error && result.data.status === 'completed') {
      await eventPublisher.publish('tarea.completada', {
        evento: 'tarea.completada',
        tarea: result.data,
        timestamp: new Date().toISOString(),
      });
    }
    respond(res, result);
  });

  return app;
}

function respond(res, result) {
  if (result.error) {
    res.status(result.status).json({ error: result.error });
  } else {
    res.status(result.status).json(result.data);
  }
}

module.exports = { createApiAdapter };
