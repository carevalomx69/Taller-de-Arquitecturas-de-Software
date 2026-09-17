// ========== domain/taskDomain.js ==========
// Idéntico, byte a byte, al de las Prácticas 4-8. Esta es la prueba real
// de la Práctica 9: cambiamos la base de datos (MySQL -> Postgres/Neon) Y
// el modelo de despliegue completo (contenedores persistentes -> funciones
// efímeras) -- y este archivo no se toca ni una línea. Es la misma
// lección de Hexagonal (Práctica 4), llevada al extremo: si el dominio de
// verdad no conoce la tecnología, hasta un cambio de paradigma de
// infraestructura completo queda contenido en el adaptador.

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
