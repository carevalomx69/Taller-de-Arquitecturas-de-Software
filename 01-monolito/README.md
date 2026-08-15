# Práctica 1 — Arquitectura Monolítica

## Objetivo

Ejecutar y examinar una aplicación construida como una única unidad indivisible:
interfaz, lógica de negocio y datos, todo en el mismo proceso. Esta es la
línea base de la que partirán las siguientes 8 prácticas.

## Qué construimos sobre la práctica anterior

Nada — esta es la primera práctica. Es el punto de partida de toda la unidad.

## Requisitos previos

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

## Errores comunes y solución

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
