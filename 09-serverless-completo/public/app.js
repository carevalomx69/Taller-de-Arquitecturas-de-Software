// ========== public/app.js ==========
// ÚNICO cambio de fondo respecto al app.js de las Prácticas 2-8:
// API_BASE_URL. Antes apuntaba a un api-gateway en otro puerto
// (http://localhost:4000) porque el frontend y el backend vivían en
// contenedores distintos. Aquí, el frontend estático y las funciones de
// /api/ los sirve el MISMO dominio de Vercel -- no hace falta ninguna
// URL absoluta, ni ningún gateway que decida a dónde mandar cada
// petición. Una cadena vacía + una ruta relativa ("/api/tasks") ya
// resuelve sola al lugar correcto.
const API_BASE_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const tasksSection = document.getElementById('tasks-section');

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const addTaskBtn = document.getElementById('add-task-btn');

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authError = document.getElementById('auth-error');

    const welcomeMessage = document.getElementById('welcome-message');
    const taskList = document.getElementById('task-list');
    const newTaskTitleInput = document.getElementById('new-task-title');

    let currentUser = null;
    // Actualización optimista (heredada de las Prácticas 7-8): guardamos
    // las tareas en memoria del navegador para reflejar cambios de
    // inmediato, sin depender de un GET posterior. Aquí no hay
    // consistencia eventual real (Postgres responde la escritura y la
    // lectura contra la misma fuente) -- pero no cuesta nada mantenerlo,
    // y evita una llamada de red de más en cada acción.
    let currentTasks = [];

    function showAuthView() {
        currentUser = null;
        sessionStorage.removeItem('user');
        authSection.classList.remove('hidden');
        tasksSection.classList.add('hidden');
        authError.textContent = '';
    }

    function showTasksView(user) {
        currentUser = user;
        sessionStorage.setItem('user', JSON.stringify(user));
        authSection.classList.add('hidden');
        tasksSection.classList.remove('hidden');
        welcomeMessage.textContent = `Bienvenido, ${user.username}!`;
        fetchTasks();
    }

    async function handleLogin() {
        const username = usernameInput.value;
        const password = passwordInput.value;
        authError.textContent = '';
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                showTasksView(data);
            } else {
                authError.textContent = data.error || 'Error al iniciar sesión.';
            }
        } catch (err) {
            authError.textContent = 'No se pudo conectar con el servidor.';
        }
    }

    async function handleRegister() {
        const username = usernameInput.value;
        const password = passwordInput.value;
        authError.textContent = '';
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Usuario registrado con éxito! Ahora puedes iniciar sesión.');
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                authError.textContent = data.error || 'Error al registrar.';
            }
        } catch (err) {
            authError.textContent = 'No se pudo conectar con el servidor.';
        }
    }

    async function fetchTasks() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/${currentUser.id}`);
            currentTasks = await response.json();
            renderTasks();
        } catch (err) {
            taskList.innerHTML = '<li>Error al cargar las tareas.</li>';
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';
        if (currentTasks.length === 0) {
            taskList.innerHTML = '<li>No tienes tareas pendientes.</li>';
            return;
        }
        currentTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.status === 'completed' ? 'completed' : '';

            const span = document.createElement('span');
            span.textContent = task.title;

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.textContent = task.status === 'completed' ? 'Reabrir' : 'Completar';
            toggleBtn.addEventListener('click', () => toggleTaskStatus(task));

            li.appendChild(span);
            li.appendChild(toggleBtn);
            taskList.appendChild(li);
        });
    }

    async function toggleTaskStatus(task) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                const tareaLocal = currentTasks.find(t => t.id === task.id);
                if (tareaLocal) tareaLocal.status = newStatus;
                renderTasks();
            } else {
                alert('No se pudo actualizar la tarea.');
            }
        } catch (err) {
            alert('No se pudo conectar con el servidor.');
        }
    }

    async function handleAddTask() {
        const title = newTaskTitleInput.value;
        if (!title || !currentUser) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, title })
            });
            if (response.ok) {
                const tareaCreada = await response.json();
                currentTasks.unshift(tareaCreada);
                renderTasks();
                newTaskTitleInput.value = '';
            } else {
                alert('Error al crear la tarea.');
            }
        } catch (err) {
            alert('No se pudo conectar con el servidor.');
        }
    }

    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', showAuthView);
    addTaskBtn.addEventListener('click', handleAddTask);

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        showTasksView(JSON.parse(storedUser));
    } else {
        showAuthView();
    }
});
