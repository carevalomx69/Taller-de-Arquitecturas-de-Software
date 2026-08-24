# Práctica 3 — Arquitectura en Capas / MVC

## Objetivo

Reorganizar el backend (hasta ahora un solo archivo con todo mezclado) en
capas con responsabilidades claras, sin cambiar en nada lo que la
aplicación hace desde afuera.

## Qué construimos sobre la práctica anterior

El `frontend/` y el `db/` son **idénticos** a la Práctica 2 — cero
cambios. Lo único que cambia es la organización interna del `backend/`:

| Antes (Práctica 2) | Ahora (Capas / MVC) |
|---|---|
| `server.js` con rutas, validaciones y SQL mezclados | `routes/` → `controllers/` → `models/`, cada uno con una sola responsabilidad |
| Un archivo de ~120 líneas | `server.js` de ~30 líneas que solo arma la aplicación |

**Nota sobre MVC:** este proyecto ya no usa vistas renderizadas en el
servidor (a diferencia del MVC "clásico" con plantillas). La **Vista** es
el `frontend/` que ya tenías — una SPA que consume la API. El **Modelo**
vive en `models/` y el **Controlador** en `controllers/`. Es la forma
moderna de MVC en una arquitectura API + SPA, tan válida como la clásica.

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.
- Práctica 2 completada.
- Haber revisado la diapositiva **"MVC"** y la tabla **"Capas del modelo
  MVC"**.

## Estructura de archivos

```
03-capas-mvc/
├── docker-compose.yml
├── frontend/                (sin cambios respecto a la Práctica 2 — es la "Vista")
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js             ← solo arma la app, ~30 líneas
│   ├── db.js                 ← conexión a MySQL (único lugar que la crea)
│   ├── routes/                (capa de Presentación: URL + verbo HTTP)
│   │   ├── userRoutes.js
│   │   └── taskRoutes.js
│   ├── controllers/            (el "Controlador": orquesta la petición)
│   │   ├── userController.js
│   │   └── taskController.js
│   └── models/                 (el "Modelo": el único que sabe SQL)
│       ├── userModel.js
│       └── taskModel.js
└── db/
    └── init.sql                (idéntico a la Práctica 2)
```

## Instrucciones paso a paso

1. Abre una terminal en esta carpeta (`03-capas-mvc/`).
2. Levanta los servicios:
   ```
   docker-compose up --build
   ```
3. Abre `http://localhost:8080` — debería verse y comportarse **exactamente
   igual** que en la Práctica 2.
4. Registra un usuario, agrega tareas, marca alguna como completada.
5. Ahora ve al código: abre `backend/routes/taskRoutes.js`, luego
   `backend/controllers/taskController.js`, luego
   `backend/models/taskModel.js` — sigue el camino completo de una
   petición `POST /api/tasks` a través de las tres capas.

## Qué deberías observar

- **La app se comporta idéntico a la Práctica 2** — mismos endpoints,
  mismas respuestas, mismo frontend. Reorganizar en capas no cambia el
  comportamiento externo del sistema; cambia qué tan fácil es mantenerlo.
- **Cada capa solo habla con su vecina.** Las rutas nunca tocan el
  Modelo directamente — siempre pasan por el Controlador. El Controlador
  nunca escribe SQL — siempre se lo pide al Modelo.
- **`server.js` casi no tiene lógica.** Compáralo con el de la Práctica 2:
  ahí vivía todo; aquí solo conecta piezas que viven en otros archivos.
- **Ningún archivo del `frontend/` cambió.** Es la prueba de que separar
  el backend en capas no debería afectar a quien lo consume desde afuera.

## Errores comunes y solución

| Problema | Causa probable | Solución |
|---|---|---|
| `Cannot find module '../models/taskModel'` | Ruta relativa incorrecta al mover/renombrar un archivo | Revisa que la estructura de carpetas coincida exactamente con la de este README |
| Los mismos errores de la Práctica 2 (puerto ocupado, `Access denied`, etc.) | Misma causa que antes — la topología de contenedores es la misma | Revisa el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) y el README de la Práctica 2 |

## Preguntas de reflexión

1. Si el cliente pidiera agregar "categorías" a las tareas, ¿qué archivo(s)
   tendrías que tocar ahora, comparado con la Práctica 2? ¿Es más o menos
   claro dónde hacer el cambio?
2. ¿Por qué crees que `controllers/taskController.js` no importa
   directamente el módulo `mysql2`? ¿Qué se rompería si lo hiciera?
3. Piensa en tu proyecto real de cliente (el de Ingeniería de
   Requerimientos). ¿Su backend ya está organizado en capas, o todo vive
   en un solo lugar? ¿Qué tan realista es aplicar este mismo reacomodo ahí,
   comparado con aplicar Microservicios o CQRS?

## Entregable

1. Captura de pantalla de la app funcionando en `http://localhost:8080`
   (debe verse igual que en la Práctica 2).
2. Captura de tu terminal mostrando los 4 servicios corriendo
   (`docker-compose ps`).
3. `REFLEXION.md` con tus respuestas a las 3 preguntas.
