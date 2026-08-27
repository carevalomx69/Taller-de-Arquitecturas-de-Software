// ========== servicio-usuarios/adapters/apiAdapter.js ==========
// Solo las rutas de usuario. Este servicio no sabe que existen las tareas.

const express = require('express');
const cors = require('cors');

const userDomain = require('../domain/userDomain');

function createApiAdapter(repo) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-usuarios)' });
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await userDomain.register(repo, username, password);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error in servicio-usuarios' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await userDomain.login(repo, username, password);
      respond(res, result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unexpected error in servicio-usuarios' });
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
