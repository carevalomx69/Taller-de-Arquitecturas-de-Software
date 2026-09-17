# Práctica 9 (versión completa) — Serverless con la app entera

## Qué es esto, y por qué existe aparte

La Práctica 9 "oficial" (`09-serverless/`) redujo la app al mínimo a
propósito -- dos funciones, sin login, sin frontend -- para que el
concepto de "función efímera" se viera sin distracciones. Esta carpeta
es la extensión natural: **la misma app del taller completa** --
registro, login, crear/listar/completar tareas, y el frontend real --
corriendo 100% serverless. Es el cierre de ciclo: la misma aplicación
que viste como Monolito en la Práctica 1 corre aquí, en el otro extremo
del espectro arquitectónico, sin que su dominio haya cambiado una sola
línea en el camino.

## Qué construimos sobre la práctica anterior

| Pieza de `09-serverless/` (la mínima) | Aquí |
|---|---|
| `domain/taskDomain.js` | Idéntico, byte a byte |
| Driver y patrón de conexión (`@neondatabase/serverless`) | Idéntico |
| Enfoque general (funciones sueltas en `api/`, sin servidor) | Idéntico |

Lo nuevo:

- **`domain/userDomain.js`**: el mismo de las Prácticas 4-8, sin tocar.
- **`adapters/postgresAdapter.js`**: ahora combina métodos de usuarios y
  de tareas en un solo archivo -- no hay "dos servicios" que
  justifiquen separarlos, como sí los había en Docker.
- **Cuatro funciones en vez de dos**: `api/register.js`, `api/login.js`,
  y `api/tasks/` reestructurado en dos archivos:
  - `api/tasks/index.js` -> atiende `POST /api/tasks`
  - `api/tasks/[id].js` -> atiende **tanto** `GET /api/tasks/:userId`
    (listar) **como** `PATCH /api/tasks/:id` (completar), diferenciando
    por método dentro del mismo archivo -- exactamente el mismo truco
    que ya usaba `nginx.conf` desde la Práctica 7 para separar por verbo.
- **`public/`**: el frontend real (`index.html`, `style.css`, `app.js`),
  con un **único cambio de fondo** en `app.js`: `API_BASE_URL` pasó de
  `http://localhost:4000` a una cadena vacía (`''`). Ver la sección
  siguiente para la razón completa.

### Por qué el api-gateway desaparece, y no lo reemplazamos por nada

En Docker, necesitabas un Nginx que decidiera "esta ruta va a este
contenedor, esta otra a aquél" porque el frontend y cada backend vivían
en procesos separados. Aquí, **el frontend estático y todas las
funciones de `/api/` viven bajo el mismo dominio de Vercel** desde el
origen -- no hay "varios servicios" que enrutar entre sí. El propio
`app.js`, con una ruta relativa como `fetch('/api/tasks')`, ya llega
solo al lugar correcto. La plataforma hace ese trabajo de "gateway" sin
que nadie lo construya.

## Requisitos previos

Los mismos que la versión mínima -- ver `09-serverless/README.md`,
sección "Requisitos previos" (incluida la nota de guardar tus códigos
de recuperación).

## Estructura de archivos

```
09-serverless-completo/
├── README.md
├── package.json
├── schema.sql              -- corres esto a mano en Neon, una vez (users + tasks)
├── .env.example
├── .gitignore
├── public/                  -- Vercel sirve esto tal cual, sin build
│   ├── index.html
│   ├── style.css
│   └── app.js                (único cambio real: API_BASE_URL = '')
├── domain/
│   ├── taskDomain.js         ← idéntico a las Prácticas 4-8
│   └── userDomain.js         ← idéntico a las Prácticas 4-8
├── adapters/
│   └── postgresAdapter.js    (usuarios + tareas combinados)
└── api/
    ├── register.js           -- POST /api/register
    ├── login.js               -- POST /api/login
    └── tasks/
        ├── index.js           -- POST /api/tasks
        └── [id].js             -- GET /api/tasks/:userId Y PATCH /api/tasks/:id
```

## Instrucciones paso a paso

Son las mismas 6 de `09-serverless/README.md` (subir a GitHub, crear
proyecto en Vercel, conectar Neon, correr `schema.sql`, redeploy) -- con
una sola diferencia: en el paso 4, `schema.sql` de esta carpeta crea
**dos** tablas (`users` y `tasks`), no solo una.

Al terminar, en vez de probar con Postman, **abre tu URL de Vercel
directo en el navegador** (`https://tu-proyecto.vercel.app`) -- ahí
está la app completa, con pantalla de login y todo, funcionando en
serverless real.

## Qué deberías observar

- **La app se ve, y se siente, idéntica a la Práctica 2 (Cliente-
  Servidor)** -- mismo HTML, mismo CSS, mismo flujo de login y tareas.
  Lo único que cambió por completo es *dónde* y *cómo* corre por
  debajo. Esa es la demostración final del taller: la experiencia del
  usuario final es independiente de la arquitectura -- puedes cambiar
  radicalmente cómo está construido un sistema sin que la persona que
  lo usa note nada distinto.
- **`api/tasks/[id].js` atiende dos rutas semánticamente distintas
  desde un solo archivo.** Ábrelo y confirma que la única razón por la
  que funciona es el `if (req.method === 'GET')` / `if (req.method ===
  'PATCH')` -- Vercel nunca sabe que un caso es "userId" y el otro es
  "id de tarea"; solo ve un segmento dinámico en la URL.

## Postman

La colección incluye las 8 peticiones de siempre (health check no
aplica aquí -- no hay un endpoint dedicado a eso en esta versión) contra
tu propia URL de Vercel -- cambia `base_url` antes de correrlas.

## Errores comunes y solución

Revisa primero la tabla de `09-serverless/README.md` (Root Directory,
recovery codes, etc. -- todo aplica igual aquí). Específico de esta
versión:

| Problema | Causa probable | Solución |
|---|---|---|
| La página carga pero el CSS no se ve | `style.css` no está exactamente en `public/style.css` | Revisa la ruta -- Vercel sirve `public/` como raíz estática automáticamente |
| `GET /api/tasks/:userId` responde `404` | El archivo se llama distinto a `[id].js` (con esos corchetes exactos) dentro de `api/tasks/` | Los corchetes son parte del nombre del archivo, no un placeholder que tengas que rellenar |
| Login funciona pero crear tarea da error de CORS en la consola del navegador | No debería pasar -- frontend y funciones están en el mismo dominio | Si te aparece, confirma que `API_BASE_URL` en efecto quedó como cadena vacía, no con una URL de otro dominio pegada por error |

## Preguntas de reflexión

1. Compara el `app.js` de esta práctica con el de la Práctica 2
   (Cliente-Servidor). Solo cambió una constante. ¿Qué dice eso sobre
   qué tan bien diseñado estaba el frontend desde el principio?
2. `api/tasks/[id].js` mezcla dos responsabilidades (listar y
   completar) en un solo archivo, diferenciadas por método HTTP. En
   Hexagonal (Práctica 4) o CQRS (Práctica 7) hubiéramos separado esto
   con más cuidado. ¿Por qué aquí sí es razonable no separarlo?
3. Recorre las 9 prácticas mentalmente, de la 1 a esta. ¿Qué fue lo
   único que nunca cambió en absoluto, en ninguna de las nueve?

## Entregable

Los mismos 5 puntos del entregable de `09-serverless/README.md`, más:

6. Captura de la app completa funcionando en tu navegador, en tu URL
   real de Vercel -- con login, creación y una tarea completada.
