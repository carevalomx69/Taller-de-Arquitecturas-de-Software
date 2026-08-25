# Práctica 2 — Arquitectura Cliente-Servidor

## Objetivo

Separar lo que estaba junto en el Monolito: el frontend, el backend y ahora
también los datos, cada uno en su propio contenedor, comunicándose por red.

## Qué construimos sobre la práctica anterior

Partimos del mismo `server.js` de la Práctica 1 y lo dividimos en tres
piezas:

| Antes (Monolito) | Ahora (Cliente-Servidor) |
|---|---|
| Un archivo sirve HTML/CSS/JS y responde la API | `frontend/` (Nginx) solo sirve HTML/CSS/JS |
| Los datos viven en un arreglo en memoria | `backend/` (Node/Express) solo resuelve la lógica |
| — | `db/` (MySQL) — **primera vez que la base de datos es su propio servicio** |

El frontend y el backend ya no comparten proceso ni memoria: se comunican
por HTTP, cada uno en su propio puerto.

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.


- Práctica 1 completada.
- Haber revisado las diapositivas: "Las redes, TCP/IP", "Concepto de Puerto",
  "APIs", "Base de datos como servicio", "Tecnología de Dockers (Compose)" y
  "Redes de contenedores y nombres de servicio".

## Estructura de archivos

```
02-cliente-servidor/
├── docker-compose.yml       ← orquesta los 4 servicios
├── frontend/
│   ├── Dockerfile            (Nginx)
│   └── public/                (index.html, style.css, app.js)
├── backend/
│   ├── Dockerfile             (Node/Express)
│   ├── package.json
│   └── server.js
└── db/
    └── init.sql               (crea las tablas users y tasks)
```

## Instrucciones paso a paso

1. Abre una terminal en esta carpeta (`02-cliente-servidor/`).
2. Levanta los 4 servicios:
   ```
   docker-compose up --build
   ```
3. Espera a que la terminal muestre `API Server running on http://localhost:3000`
   (dentro del contenedor `backend`) — puede tardar unos segundos mientras
   MySQL termina de inicializar.
4. Abre `http://localhost:8080` — ahí está el frontend.
5. Abre también `http://localhost:8081` — ahí está phpMyAdmin (usuario
   `root`, contraseña `rootpass`). Entra a la base `taskdb` y observa las
   tablas `users` y `tasks` mientras usas la app desde el otro puerto.
6. Registra un usuario, agrega tareas, marca alguna como completada, y
   **refresca la tabla en phpMyAdmin** para ver los cambios reflejados ahí.

## Qué deberías observar

- **Cuatro contenedores, un solo `docker-compose up`.** Ya no alcanza con
  `docker build`/`docker run`: hay algo que orquestar.
- **El backend se conecta a `db`, no a `localhost`.** Abre
  `backend/server.js` y busca `DB_HOST`. Ese nombre (`db`) es el nombre del
  servicio en `docker-compose.yml` — así es como los contenedores se
  encuentran entre sí dentro de la red que Compose crea automáticamente.
- **Los datos ahora sobreviven a un reinicio del backend.** Detén y vuelve a
  levantar solo el backend (`docker-compose restart backend`) y comprueba
  que tus tareas siguen ahí — a diferencia del Monolito, los datos ya no
  dependen del proceso de la aplicación.
- **El frontend llama al backend por su URL completa**
  (`http://localhost:4000`), no por una ruta relativa. Es la primera vez en
  el curso que cliente y servidor están, literalmente, en direcciones
  distintas.

## Experimento: apagar y encender servicios

Con los 4 contenedores ya corriendo (`docker-compose up --build` en otra
terminal, o con `-d` en segundo plano), abre una segunda terminal en esta
misma carpeta y prueba lo siguiente — es el mismo "choque de red" que
viviste apagando MySQL en XAMPP, pero ahora puedes apagar **cualquier**
pieza por separado, no solo la base de datos.

Primero, revisa el estado de los 4 servicios:

```
docker-compose ps
```

### Experimento 1 — Apagar la base de datos

```
docker-compose stop db
```

Regresa al navegador (`http://localhost:8080`) e intenta crear una tarea.
La página **sigue cargando** (el frontend no depende de `db`), pero la
acción falla — el backend no puede completar la consulta SQL. Revisa los
logs del backend (`docker-compose logs backend`) y verás el error de
conexión.

Vuelve a prenderla:
```
docker-compose start db
```
Refresca la página: todo vuelve a funcionar, **y tus tareas anteriores
siguen ahí** — los datos viven en el volumen de `db`, no en el proceso del
backend ni en el del frontend.

### Experimento 2 — Apagar el backend

```
docker-compose stop backend
```

El frontend (`http://localhost:8080`) sigue cargando perfectamente — Nginx
no necesita al backend para servir HTML/CSS/JS. Pero cualquier acción que
dependa de la API (login, ver tareas, crear una) falla con un error de
conexión en la consola del navegador. Esto demuestra que "la página carga"
y "la aplicación funciona" son dos cosas distintas.

```
docker-compose start backend
```

### Experimento 3 — Apagar el frontend

```
docker-compose stop frontend
```

Ahora `http://localhost:8080` ni siquiera responde. Pero el backend sigue
vivo — pruébalo directamente, sin pasar por el navegador de la app:
```
curl http://localhost:4000/api/health
```
Deberías recibir la respuesta JSON de todos modos. El backend no necesita
al frontend para funcionar — es el cliente el que necesita al servidor,
no al revés.

```
docker-compose start frontend
```

### La pregunta que conecta los tres experimentos

En cada caso, **dos de los tres servicios (frontend/backend/db) siguieron
"vivos" según `docker-compose ps`**, pero la aplicación completa solo
funciona cuando los tres están arriba a la vez. ¿En qué se parece esto a
lo que viste con Apache y MySQL en XAMPP? ¿En qué es distinto, ahora que
son tres piezas en vez de dos?

## Errores comunes y solución

**¿Docker Desktop no arranca o no se instala correctamente?** Revisa
primero el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) en la raíz del repo —
cubre los problemas de instalación más frecuentes (falta WSL2,
virtualización deshabilitada en el BIOS, antivirus bloqueando Docker,
etc.) y también cómo descargar solo esta carpeta con `git sparse-checkout`.

Errores ya con Docker funcionando:

| Problema | Causa probable | Solución |
|---|---|---|
| El backend se reinicia varias veces (`Esperando a la base de datos...`) | MySQL sigue inicializando | Es normal las primeras veces; espera, el `healthcheck` hará que continúe solo |
| `Access denied for user 'taskuser'` | Volumen de MySQL de una corrida anterior con credenciales distintas | `docker-compose down -v` (el `-v` borra el volumen) y vuelve a levantar |
| El navegador no carga las tareas y la consola muestra un error de CORS | Backend no está corriendo aún o se modificó sin reiniciar | Revisa que `docker-compose ps` muestre los 4 servicios como `Up` |
| Puerto 3306, 4000, 8080 u 8081 ya en uso | Otro proceso (o otra práctica) sigue corriendo | `docker-compose down` en la carpeta que lo esté usando, o cambia el puerto expuesto en `docker-compose.yml` |

## Preguntas de reflexión

1. En el Monolito, si el proceso se caía, se perdía todo (servidor y datos).
   Aquí, ¿qué pasa si el contenedor `backend` se cae? ¿Y si se cae `db`?
   ¿Son el mismo tipo de falla?
2. ¿Por qué el backend se conecta a `db` y no a `127.0.0.1` o a
   `localhost`? ¿Qué pasaría si lo intentaras?
3. Ahora que frontend y backend están separados, ¿qué equipo(s) de trabajo
   se necesitarían en una empresa real para mantener cada uno? ¿Cambia algo
   respecto al Monolito?

## Entregable

1. Captura de pantalla de la app funcionando en `http://localhost:8080`.
2. Captura de phpMyAdmin mostrando la tabla `tasks` con al menos un
   registro.
3. Captura de tu terminal mostrando los 4 servicios corriendo
   (`docker-compose ps`).
4. `REFLEXION.md` con tus respuestas a las 3 preguntas.
