// ========== server.js ==========
// Práctica 1: Monolito
//
// TODO vive en este único archivo: el servidor web, la API, y los datos.
// A propósito, esta práctica NO usa una base de datos externa. Los datos
// viven en memoria, dentro del mismo proceso — esa es precisamente la
// propiedad que define a un monolito: todo, incluidos los datos, corre
// junto. La idea de "base de datos como servicio independiente" se
// introduce hasta la Práctica 2 (Cliente-Servidor).

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- "Base de datos" en memoria ---
// Se reinicia cada vez que el contenedor se reinicia. Es una limitación
// intencional de esta etapa, no un descuido.
let users = [];
let tasks = [];
let nextUserId = 1;
let nextTaskId = 1;

// --- Servir el frontend ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running (monolito)' });
});

// Registrar un nuevo usuario (muy simplificado, sin hash de contraseña)
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const user = { id: nextUserId++, username, password };
  users.push(user);
  res.status(201).json({ id: user.id, username: user.username });
});

// Iniciar sesión (muy simplificado)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ id: user.id, username: user.username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Obtener tareas de un usuario
app.get('/api/tasks/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const userTasks = tasks
    .filter(t => t.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(userTasks);
});

// Crear una nueva tarea
app.post('/api/tasks', (req, res) => {
  const { userId, title } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title are required' });
  }
  const task = {
    id: nextTaskId++,
    userId,
    title,
    status: 'pending',
    createdAt: Date.now(),
  };
  tasks.push(task);
  res.status(201).json(task);
});

// Cambiar el estado de una tarea (marcar como completada / pendiente de nuevo)
app.patch('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const { status } = req.body;
  if (status !== 'pending' && status !== 'completed') {
    return res.status(400).json({ error: 'status must be "pending" or "completed"' });
  }
  task.status = status;
  res.json(task);
});

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`Monolithic server running on http://localhost:${PORT}`);
});
