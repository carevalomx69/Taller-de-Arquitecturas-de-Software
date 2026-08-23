// ========== routes/userRoutes.js ==========
// Capa de PRESENTACIÓN (HTTP). Solo declara qué endpoint dispara qué
// función del controlador. No valida datos, no toca la base de datos.

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router;
