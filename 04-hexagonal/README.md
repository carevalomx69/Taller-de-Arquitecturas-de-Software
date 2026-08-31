# Práctica 4 — Arquitectura Hexagonal (Puertos y Adaptadores)

## Objetivo

Aislar la lógica de negocio de la tecnología que la rodea, al punto de
poder probarla **sin Docker, sin MySQL, sin ningún servidor corriendo**.

## Qué construimos sobre la práctica anterior

El `frontend/` y el `db/` son idénticos a la Práctica 3. Lo que cambia es
cómo se organiza el `backend/` — ya no en capas horizontales
(rutas → controladores → modelos), sino alrededor de un núcleo protegido:

| Práctica 3 (Capas) | Práctica 4 (Hexagonal) |
|---|---|
| `routes/` → `controllers/` → `models/` | `domain/` (el núcleo) rodeado de `adapters/` |
| El Controlador conoce Express (`req`/`res`) | El dominio no conoce ni Express ni MySQL |
| Para probar la lógica, hay que levantar el servidor y la BD | El dominio se prueba solo, con `node test_domain.js` |

La lógica de negocio (qué es registrar un usuario, qué es completar una
tarea) es exactamente la misma que en la Práctica 3 — nada más que ahora
vive separada de "cómo llega la petición" (HTTP) y "dónde se guardan los
datos" (MySQL).

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.
- Práctica 3 completada.
- Haber revisado la diapositiva **"Patrón 'Hexagonal' (Puertos y
  adaptadores)"**.

## Estructura de archivos

```
04-hexagonal/
├── docker-compose.yml
├── frontend/                (sin cambios respecto a la Práctica 3)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js              ← ensambla el dominio con los adaptadores reales
│   ├── test_domain.js         ← prueba el dominio SIN Docker ni MySQL
│   ├── domain/                 (EL HEXÁGONO: lógica pura, sin dependencias)
│   │   ├── userDomain.js
│   │   └── taskDomain.js
│   └── adapters/                (los "traductores" hacia el mundo exterior)
│       ├── apiAdapter.js         (traduce HTTP ↔ dominio)
│       └── dbAdapter.js          (traduce MySQL ↔ dominio)
└── db/
    └── init.sql                  (idéntico a la Práctica 3)
```

## Instrucciones paso a paso

### Parte 1 — Probar el dominio en aislamiento (sin Docker)

1. Abre una terminal en `04-hexagonal/backend/`.
2. Instala las dependencias: `npm install`
3. Corre las pruebas del dominio:
   ```
   node test_domain.js
   ```
4. Deberías ver 10 pruebas exitosas — **sin haber levantado Docker, sin
   MySQL corriendo.** `test_domain.js` le da al dominio un adaptador falso
   en memoria en vez del real. Esa es la demostración central de esta
   práctica.

### Parte 2 — Correr el sistema completo (con Docker)

1. En `04-hexagonal/`, levanta los servicios:
   ```
   docker-compose up --build
   ```
2. Abre `http://localhost:8080` y verifica que la app se comporte igual
   que en la Práctica 3.

## Qué deberías observar

- **El dominio no importa `express` ni `mysql2`.** Abre `domain/userDomain.js`
  y `domain/taskDomain.js` — ni un solo `require('express')` o
  `require('mysql2')`. Reciben un `repo` genérico y confían en que cumpla
  el contrato.
- **`dbAdapter.js` traduce errores de MySQL a un lenguaje que el dominio
  entiende.** Busca `ER_DUP_ENTRY` — ese es un código específico de MySQL;
  el adaptador lo convierte a `DUPLICATE_USERNAME` antes de que el dominio
  lo vea. Si cambiaran de base de datos, solo este archivo se toca.
- **`test_domain.js` usa un adaptador falso, no la base de datos real.**
  Es la prueba de que el "puerto" (el contrato) es lo único que le importa
  al dominio — no quién lo implementa.
- **El comportamiento observable de la app no cambió respecto a la
  Práctica 3.** Mismos endpoints, mismas respuestas.

## Postman (opcional)

Misma colección de siempre -- el contrato de la API sigue sin cambiar,
aunque por dentro ahora sea un hexágono con adaptadores. Importa
`postman_collection.json` de esta carpeta para probarlo tú mismo. Opcional,
no se califica. (Los diagramas de secuencia de esta práctica -- incluyendo
uno mostrando `test_domain.js` hablándole al dominio sin pasar por ningún
adaptador -- llegan en la próxima actualización del repo.)

## Errores comunes y solución

| Problema | Causa probable | Solución |
|---|---|---|
| `node test_domain.js` no corre / `Cannot find module` | No corriste `npm install` primero | Ejecuta `npm install` dentro de `backend/` antes de las pruebas |
| Los mismos errores de Docker de prácticas anteriores | Misma causa que antes | Revisa el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) |

## Preguntas de reflexión

1. En `test_domain.js`, el "adaptador falso" no usa base de datos alguna.
   ¿Por qué esto demuestra que la lógica de negocio está bien aislada?
   ¿Qué hubiera pasado si `domain/taskDomain.js` importara `mysql2`
   directamente?
2. Si mañana quisieras agregar una versión de la app que funcione desde la
   línea de comandos (sin navegador), ¿qué archivo(s) tendrías que crear?
   ¿Tendrías que tocar `domain/`?
3. Compara el esfuerzo de "probar que la lógica funciona" en esta práctica
   contra la Práctica 3 (Capas). ¿Vale la pena esta separación adicional
   para un proyecto tan pequeño como este? ¿Cuándo empezaría a valer la
   pena en un proyecto real?

## Entregable

1. Captura de la terminal mostrando las 10 pruebas de `test_domain.js`
   pasando.
2. Captura de pantalla de la app funcionando en `http://localhost:8080`.
3. `REFLEXION.md` con tus respuestas a las 3 preguntas.
