// ========== controllers/userController.js ==========
// Capa de CONTROL (el "Controlador" de MVC, y la "Lógica de negocio" de
// Capas). Recibe req/res ya resueltos por la capa de rutas, valida lo
// mínimo indispensable, y le pide los datos al Modelo. No sabe ni le
// importa si el Modelo usa MySQL, MongoDB o un archivo de texto.

const userModel = require('../models/userModel');

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await userModel.create(username, password);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await userModel.findByCredentials(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { register, login };
