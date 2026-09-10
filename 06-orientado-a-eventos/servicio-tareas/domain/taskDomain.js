// ========== domain/taskDomain.js ==========
// Mismo principio que userDomain.js: lógica de negocio pura, sin
// dependencias de infraestructura. Este archivo se podría probar sin
// Docker, sin MySQL, y sin siquiera tener Node instalado con npm install
// de más paquetes — solo JavaScript puro (ver test_domain.js).
//
// Puerto esperado:
//   repo.findTasksByUserId(userId)      -> [tarea, ...]
//   repo.createTask(userId, title)      -> tarea
//   repo.updateTaskStatus(id, status)   -> boolean (si se actualizó algo)

async function list(repo, userId) {
  const tasks = await repo.findTasksByUserId(userId);
  return { data: tasks, status: 200 };
}

async function create(repo, userId, title) {
  if (!userId || !title) {
    return { error: 'User ID and title are required', status: 400 };
  }
  const task = await repo.createTask(userId, title);
  return { data: task, status: 201 };
}

async function updateStatus(repo, id, status) {
  if (status !== 'pending' && status !== 'completed') {
    return { error: 'status must be "pending" or "completed"', status: 400 };
  }
  const updated = await repo.updateTaskStatus(id, status);
  if (!updated) {
    return { error: 'Task not found', status: 404 };
  }
  return { data: { id: Number(id), status }, status: 200 };
}

module.exports = { list, create, updateStatus };
