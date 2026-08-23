// ========== controllers/taskController.js ==========
// Capa de CONTROL para tareas. Mismo principio: orquesta, no ejecuta SQL.

const taskModel = require('../models/taskModel');

async function list(req, res) {
  const { userId } = req.params;
  try {
    const tasks = await taskModel.findByUserId(userId);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

async function create(req, res) {
  const { userId, title } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title are required' });
  }
  try {
    const task = await taskModel.create(userId, title);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'pending' && status !== 'completed') {
    return res.status(400).json({ error: 'status must be "pending" or "completed"' });
  }
  try {
    const updated = await taskModel.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ id: Number(id), status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

module.exports = { list, create, updateStatus };
