// ========== test_domain.js ==========
// LA PRUEBA DE QUE EL HEXÁGONO FUNCIONA. Este archivo prueba la lógica de
// negocio (domain/) en aislamiento total: sin Docker, sin MySQL, sin
// levantar ningún servidor. Le damos al dominio un adaptador FALSO — un
// objeto en memoria que cumple el mismo "puerto" que dbAdapter.js, pero
// que internamente solo usa un arreglo de JavaScript.
//
// Correr con: node test_domain.js
// (no requiere npm install de nada adicional, ni Docker corriendo)

const userDomain = require('./domain/userDomain');
const taskDomain = require('./domain/taskDomain');

// --- Adaptador falso, en memoria, para pruebas ---
function createFakeRepo() {
  const users = [];
  const tasks = [];
  let nextUserId = 1;
  let nextTaskId = 1;

  return {
    async createUser(username, password) {
      if (users.find(u => u.username === username)) {
        const err = new Error('Duplicate');
        err.code = 'DUPLICATE_USERNAME';
        throw err;
      }
      const user = { id: nextUserId++, username, password };
      users.push(user);
      return { id: user.id, username: user.username };
    },
    async findUserByCredentials(username, password) {
      const user = users.find(u => u.username === username && u.password === password);
      return user ? { id: user.id, username: user.username } : null;
    },
    async findTasksByUserId(userId) {
      return tasks.filter(t => t.userId === Number(userId));
    },
    async createTask(userId, title) {
      const task = { id: nextTaskId++, userId: Number(userId), title, status: 'pending', createdAt: Date.now() };
      tasks.push(task);
      return task;
    },
    async updateTaskStatus(id, status) {
      const task = tasks.find(t => t.id === Number(id));
      if (!task) return false;
      task.status = status;
      return true;
    },
  };
}

// --- Utilidad mínima de aserciones (sin depender de ningún framework de testing) ---
let passed = 0;
let failed = 0;

function assertEqual(actual, expected, description) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  OK  - ${description}`);
    passed++;
  } else {
    console.log(`FALLO - ${description}`);
    console.log(`        esperado: ${JSON.stringify(expected)}`);
    console.log(`        obtenido: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// --- Las pruebas ---
async function run() {
  const repo = createFakeRepo();

  console.log('Probando userDomain...');
  const registerResult = await userDomain.register(repo, 'carlos', '1234');
  assertEqual(registerResult.status, 201, 'registrar un usuario nuevo regresa 201');

  const dupResult = await userDomain.register(repo, 'carlos', 'otraClave');
  assertEqual(dupResult.status, 409, 'registrar un username repetido regresa 409');

  const loginOk = await userDomain.login(repo, 'carlos', '1234');
  assertEqual(loginOk.status, 200, 'login con credenciales correctas regresa 200');

  const loginBad = await userDomain.login(repo, 'carlos', 'incorrecta');
  assertEqual(loginBad.status, 401, 'login con credenciales incorrectas regresa 401');

  console.log('\nProbando taskDomain...');
  const createResult = await taskDomain.create(repo, 1, 'Probar hexagonal');
  assertEqual(createResult.status, 201, 'crear una tarea regresa 201');
  assertEqual(createResult.data.status, 'pending', 'una tarea nueva empieza como "pending"');

  const listResult = await taskDomain.list(repo, 1);
  assertEqual(listResult.data.length, 1, 'listar tareas del usuario 1 regresa 1 tarea');

  const completeResult = await taskDomain.updateStatus(repo, createResult.data.id, 'completed');
  assertEqual(completeResult.status, 200, 'completar una tarea existente regresa 200');

  const notFoundResult = await taskDomain.updateStatus(repo, 9999, 'completed');
  assertEqual(notFoundResult.status, 404, 'completar una tarea inexistente regresa 404');

  const invalidStatusResult = await taskDomain.updateStatus(repo, createResult.data.id, 'archivada');
  assertEqual(invalidStatusResult.status, 400, 'un status inválido regresa 400');

  console.log(`\n${passed} pruebas exitosas, ${failed} fallidas.`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
