// ========== adapters/apiAdapter.js ==========
// El "traductor" del mundo web. Sabe cómo recibir una petición HTTP con
// Express y cómo llamarle al dominio — pero el dominio no sabe que Express
// existe. Este archivo es el ÚNICO que conoce req/res.

const express = require('express');
const cors = require('cors');

const userDomain = require('../domain/userDomain');
const taskDomain = require('../domain/taskDomain');

function createApiAdapter(repo) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (hexagonal)' });
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await userDomain.register(repo, username, password);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await userDomain.login(repo, username, password);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });

  app.get('/api/tasks/:userId', async (req, res) => {
    try {
      const result = await taskDomain.list(repo, req.params.userId);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const { userId, title } = req.body;
      const result = await taskDomain.create(repo, userId, title);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const result = await taskDomain.updateStatus(repo, req.params.id, req.body.status);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });

  return app;
}

// Convierte la respuesta uniforme del dominio ({data, status} o
// {error, status}) en una respuesta HTTP real. Esta traducción vive aquí,
// no en el dominio.
function respond(res, result) {
  if (result.error) {
    res.status(result.status).json({ error: result.error });
  } else {
    res.status(result.status).json(result.data);
  }
}

module.exports = { createApiAdapter };
