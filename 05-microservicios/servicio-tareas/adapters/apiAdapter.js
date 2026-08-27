// ========== servicio-tareas/adapters/apiAdapter.js ==========
// Solo las rutas de tareas. Este servicio no sabe que existe el login.

const express = require('express');
const cors = require('cors');

const taskDomain = require('../domain/taskDomain');

function createApiAdapter(repo) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-tareas)' });
  });

  app.get('/api/tasks/:userId', async (req, res) => {
    try {
      const result = await taskDomain.list(repo, req.params.userId);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error in servicio-tareas' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const { userId, title } = req.body;
      const result = await taskDomain.create(repo, userId, title);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error in servicio-tareas' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const result = await taskDomain.updateStatus(repo, req.params.id, req.body.status);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error in servicio-tareas' });
    }
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
