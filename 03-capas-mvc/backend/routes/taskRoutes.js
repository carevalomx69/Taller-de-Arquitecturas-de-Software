// ========== routes/taskRoutes.js ==========
// Capa de PRESENTACIÓN (HTTP) para tareas.

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/:userId', taskController.list);
router.post('/', taskController.create);
router.patch('/:id', taskController.updateStatus);

module.exports = router;
