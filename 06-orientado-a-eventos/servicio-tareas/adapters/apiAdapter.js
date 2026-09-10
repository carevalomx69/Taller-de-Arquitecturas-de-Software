// ========== servicio-tareas/adapters/apiAdapter.js ==========
// Solo las rutas de tareas. Este servicio no sabe que existe el login.
//
// ÚNICO CAMBIO respecto a la Práctica 5: después de que el dominio resuelve
// con éxito un create() o un updateStatus(), le avisamos al eventPublisher.
// Nótese que taskDomain.js (el dominio) nunca recibe el publisher como
// parámetro -- no le hace falta saber que algo se está anunciando. Es el
// apiAdapter, no el dominio, quien decide "avisar" después de que la
// operación de negocio ya terminó.

const express = require('express');
const cors = require('cors');

const taskDomain = require('../domain/taskDomain');

function createApiAdapter(repo, eventPublisher) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-tareas)' });
  });

  app.get('/api/tasks/:userId', async (req, res) => {
    const result = await taskDomain.list(repo, req.params.userId);
    respond(res, result);
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
