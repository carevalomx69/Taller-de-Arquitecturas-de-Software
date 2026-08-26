# Práctica 1 — Arquitectura Monolítica

## Objetivo

Ejecutar y examinar una aplicación construida como una única unidad indivisible:
interfaz, lógica de negocio y datos, todo en el mismo proceso. Esta es la
línea base de la que partirán las siguientes 8 prácticas.

## Qué construimos sobre la práctica anterior

Nada — esta es la primera práctica. Es el punto de partida de toda la unidad.

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.

- Docker Desktop instalado y corriendo.
- Haber revisado la diapositiva **"Tecnología de Dockers"** (contenedor,
  imagen, Dockerfile) antes de esta práctica.
- Opcional pero recomendado: haber visto la demostración de disección de
  XAMPP en clase — te ayuda a tener ya un modelo mental de "varias cosas
  corriendo juntas en una sola máquina" antes de ver cómo se ve un
  monolito *de verdad* (un solo proceso).

## Estructura de archivos

```
01-monolito/
├── Dockerfile
├── package.json
├── server.js          ← servidor web + API + datos, todo en un archivo
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## Instrucciones paso a paso

1. Abre una terminal en esta carpeta (`01-monolito/`).
2. Construye la imagen:
   ```
   docker build -t gestor-tareas-monolito .
   ```
3. Corre el contenedor:
   ```
   docker run -p 3000:3000 gestor-tareas-monolito
   ```
4. Abre `http://localhost:3000` en tu navegador.
5. Regístrate con un usuario, inicia sesión, agrega un par de tareas y marca
   alguna como completada.
6. Sube tu evidencia (ver abajo).

## Qué deberías observar

- **Todo vive en `server.js`.** El ruteo HTTP, la lógica de negocio
  (registrar usuario, crear tarea, cambiar su estado) y el almacenamiento de
  los datos están en el mismo archivo, en el mismo proceso.
- **Los datos son volátiles.** Si detienes el contenedor (`Ctrl+C`) y lo
  vuelves a correr, tus usuarios y tareas desaparecieron. Esto es intencional:
  en esta etapa **no hay una base de datos como servicio independiente**
  (ese concepto se introduce hasta la Práctica 2). Los datos viven en
  variables de JavaScript en memoria — tan "monolito" como se puede ser.
- **Un solo `docker build` / `docker run`.** No hay `docker-compose.yml`
  todavía porque no hay nada que orquestar: es un solo contenedor.
- **`server.js` usa "dos sombreros" a la vez: servidor de páginas y API.**
  La ruta `/` manda el HTML (`res.sendFile(...)`) — eso **no** es la API.
  Las rutas que empiezan con `/api/...` (`/api/register`, `/api/login`,
  `/api/tasks/...`) sí lo son: reciben una petición HTTP y responden JSON,
  no HTML. Es el mismo archivo, el mismo proceso, pero dos
  responsabilidades distintas conviviendo juntas — por eso, a partir de la
  Práctica 2, separamos esos dos sombreros en dos contenedores distintos
  (`frontend` sirve páginas, `backend` es *solo* la API).

  Dicho de otro modo: una **API** es, en el fondo, el mismo concepto de
  **Interfaz** que vimos en Unidad I (el contrato que define qué
  operaciones ofrece un componente, sin decir cómo se implementan) — nada
  más que aplicado sobre una red, usando HTTP como el "idioma" para
  pedirlas. `public/app.js` no sabe (ni le importa) si las tareas viven en
  memoria o en una base de datos — solo sabe que puede pedir
  `GET /api/tasks/1` y va a recibir una lista.

  **¿Y qué es un endpoint?** Si la API es el conjunto completo de
  "preguntas" que le puedes hacer al servidor, un **endpoint** es cada
  pregunta individual — la combinación de una **ruta** (`/api/tasks/:userId`)
  y un **verbo HTTP** (`GET`, `POST`, `PATCH`...). `GET /api/tasks` y
  `POST /api/tasks` son dos endpoints *distintos*, aunque compartan la
  misma ruta, porque el verbo es parte de su identidad. En `server.js`,
  cada línea `app.get(...)`, `app.post(...)` o `app.patch(...)` que
  empieza con `/api/` define exactamente un endpoint.
  memoria o en una base de datos — solo sabe que puede pedir
  `GET /api/tasks/1` y va a recibir una lista.

## Errores comunes y solución

**¿Docker Desktop no arranca o no se instala correctamente?** Revisa
primero el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) en la raíz del repo — cubre
los problemas de instalación más frecuentes (falta WSL2, virtualización
deshabilitada en el BIOS, antivirus bloqueando Docker, etc.).

Errores ya con Docker funcionando:

| Problema | Causa probable | Solución |
|---|---|---|
| `Error: bind: address already in use` al hacer `docker run` | Ya tienes algo corriendo en el puerto 3000 | Cambia el mapeo a `-p 3001:3000` y abre `http://localhost:3001` |
| `Cannot connect to the Docker daemon` | Docker Desktop no está corriendo | Ábrelo y espera a que el ícono indique que está listo |
| La página carga pero no puedes registrar usuarios | El contenedor se reinició (recuerda: los datos son en memoria) | Vuelve a registrar el usuario; es el comportamiento esperado |

## Preguntas de reflexión

1. Si el cliente pidiera agregar "categorías" a las tareas, ¿qué archivos
   tendrías que tocar? ¿Por qué crees que eso es un problema a largo plazo?
2. ¿Qué tendría que pasar para que este monolito dejara de ser suficiente
   para el negocio? (Piensa en usuarios, no en tecnología.)
3. Compara esta arquitectura con la disección de XAMPP que vimos en clase:
   ¿en qué se parecen? ¿en qué son distintas, aunque ambas se sientan
   "monolíticas"?

## Entregable

Sube a la tarea correspondiente en Aula Virtual:

1. Captura de pantalla de la app funcionando en el navegador (con al menos
   una tarea marcada como completada).
2. Captura del `docker run` en tu terminal mostrando el mensaje
   `Monolithic server running on http://localhost:3000`.
3. Un archivo `REFLEXION.md` (o `.txt`) con tus respuestas a las 3 preguntas
   de arriba — un par de líneas por pregunta es suficiente.
