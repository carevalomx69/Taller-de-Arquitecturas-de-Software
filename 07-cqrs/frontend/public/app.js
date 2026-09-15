// La diferencia clave respecto al Monolito: el frontend y el backend ahora
// son dos procesos distintos, en dos puertos distintos. Por eso ya no
// podemos usar rutas relativas ("/api/...") — necesitamos la URL completa
// del backend.
const API_BASE_URL = 'http://localhost:4000';

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
    // NUEVO (a partir de la Práctica 7): guardamos las tareas en memoria
    // del lado del navegador, para poder actualizarlas de inmediato sin
    // depender de volver a preguntarle al backend. Antes de la Práctica 7,
    // GET /api/tasks lo respondía el mismo servicio que acababa de guardar
    // el cambio -- por construcción, no había ningún retraso posible. Desde
    // que separamos comandos y consultas (CQRS), GET pasa por
    // servicio-consultas, que se entera de los cambios por eventos
    // asíncronos -- normalmente en milisegundos, pero no es instantáneo.
    // Si esta pantalla esperara siempre a un GET después de cada cambio,
    // a veces la tarea recién creada no aparecería hasta el siguiente
    // refresco -- ver el README de la Práctica 7, "Qué deberías observar".
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

    // Esta sigue siendo la única función que de verdad LE PREGUNTA al
    // backend -- se usa al iniciar sesión (para traer la lista real) y
    // como respaldo si algo saliera mal. Ya NO se llama después de crear
    // o completar una tarea (ver más abajo).
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
                // Actualización optimista: servicio-tareas ya confirmó el
                // cambio (por eso llegamos aquí) -- lo reflejamos de una
                // vez en la pantalla, en vez de preguntarle a
                // servicio-consultas si ya se enteró.
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
                // Actualización optimista: usamos la tarea que el propio
                // POST nos devolvió (ya tiene id, título y status) en vez
                // de esperar a que GET /api/tasks la refleje. Va al
                // principio de la lista, igual que la ordena el backend
                // (más reciente primero).
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
