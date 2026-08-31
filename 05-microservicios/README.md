# Práctica 5 — Microservicios

## Objetivo

Partir el backend en dos servicios verdaderamente independientes —
`servicio-usuarios` y `servicio-tareas` — cada uno desplegable, escalable y
modificable por separado, comunicados con el frontend a través de un único
punto de entrada: un API Gateway.

## Qué construimos sobre la práctica anterior

Este es el momento que las prácticas 3 y 4 estaban preparando sin que se
notara demasiado. Mira lo que se reutiliza **sin cambiar una sola línea**:

| Archivo de la Práctica 4 (Hexagonal) | Dónde vive ahora |
|---|---|
| `backend/domain/userDomain.js` | `servicio-usuarios/domain/userDomain.js` — idéntico, byte a byte |
| `backend/domain/taskDomain.js` | `servicio-tareas/domain/taskDomain.js` — idéntico, byte a byte |

Esa es la recompensa de haber aislado la lógica de negocio de la
tecnología en la Práctica 4: cuando llegó el momento de partir el sistema
en dos servicios de verdad, el dominio ya estaba listo para mudarse sin
tocarlo. Lo que sí cambió es que cada servicio ahora tiene **su propio**
`adapters/apiAdapter.js` y `adapters/dbAdapter.js` — recortados para
conocer solo su propia porción del negocio.

También aparece una pieza nueva: el **API Gateway**, el primer Nginx del
curso que actúa como *proxy inverso* de verdad (no solo sirviendo archivos
estáticos, como en las prácticas 2-4) — el concepto que vimos en la
diapositiva "Proxy inverso" y que dejamos pendiente hasta este momento.

El `frontend/` es una copia **sin ningún cambio** de la Práctica 4 — sigue
llamando a `http://localhost:4000` como si fuera un solo backend. Esa es
la idea central de un API Gateway: el cliente nunca se entera de que hay
dos servicios detrás.

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.
- Práctica 4 completada.
- Haber revisado las diapositivas **"Patrón de microservicios"** y
  **"Proxy inverso"**.

## Estructura de archivos

```
05-microservicios/
├── README.md
├── docker-compose.yml
├── frontend/                        (idéntico a la Práctica 4)
├── api-gateway/
│   ├── Dockerfile
│   └── nginx.conf                    ← el proxy inverso real
├── servicio-usuarios/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   ├── domain/
│   │   └── userDomain.js             ← copiado sin cambios de la Práctica 4
│   └── adapters/
│       ├── apiAdapter.js              (solo rutas de usuario)
│       └── dbAdapter.js               (solo métodos de usuario)
├── servicio-tareas/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   ├── domain/
│   │   └── taskDomain.js             ← copiado sin cambios de la Práctica 4
│   └── adapters/
│       ├── apiAdapter.js              (solo rutas de tareas)
│       └── dbAdapter.js               (solo métodos de tareas)
└── db/
    └── init.sql                       (con una diferencia importante -- ver abajo)
```

## Instrucciones paso a paso

1. Abre una terminal en esta carpeta (`05-microservicios/`).
2. Levanta todo:
   ```
   docker-compose up --build
   ```
3. Abre `http://localhost:8080` y usa la app normalmente — para el
   usuario, nada se ve distinto a la Práctica 4.
4. Abre `http://localhost:8081` (phpMyAdmin) y observa que **ambos**
   servicios escriben en la misma base de datos `taskdb`, cada uno en su
   propia tabla.

## Qué deberías observar

- **El dominio se mudó sin cambios.** Compara
  `servicio-usuarios/domain/userDomain.js` con el de la Práctica 4 — son
  idénticos.
- **Ningún servicio conoce al otro.** `servicio-tareas` no importa nada de
  usuarios; `servicio-usuarios` no importa nada de tareas.
- **El frontend no cambió.** Sigue pidiendo todo a `http://localhost:4000`
  — ya no sabe (ni le importa) que ahí responde un Gateway y no un backend
  único.
- **`servicio-usuarios` y `servicio-tareas` no tienen puerto expuesto en
  `docker-compose.yml`.** A diferencia de prácticas anteriores, no puedes
  llamarlos directo desde tu navegador — el único punto de entrada público
  es el `api-gateway`. Así se ve un microservicio real: oculto detrás de
  la puerta de entrada.

### Una base de datos compartida — y un error real que encontramos al probar esto

Vale la pena que lo sepas de antemano, porque es una tensión real del
patrón, no un detalle menor: los dos servicios siguen escribiendo en la
**misma** base de datos (`taskdb`), solo que cada uno solo toca su propia
tabla. Es una simplificación deliberada — una arquitectura de
microservicios "de manual" le daría una base de datos completamente
separada a cada servicio, pero eso complica bastante el taller sin
enseñar nada nuevo en este punto del curso (van a ver *por qué* eso
importa de verdad cuando lleguen a CQRS y Event Sourcing).

Al probar esta práctica antes de publicarla, nos topamos con esto: el
`init.sql` que traíamos de las prácticas 2-4 tenía una restricción
`FOREIGN KEY (user_id) REFERENCES users(id)` en la tabla `tasks`. Tenía
sentido cuando un solo backend tocaba ambas tablas — pero aquí,
`servicio-tareas` no tiene ninguna relación de *código* con
`servicio-usuarios`, así que esa restricción de la base de datos estaba
acoplando en secreto a dos servicios que se suponía eran independientes.
El síntoma: crear una tarea fallaba con un error de MySQL
(`ER_NO_REFERENCED_ROW_2`) si el `userId` no existía formalmente en la
tabla `users` — un acoplamiento invisible que ni el código de
`servicio-tareas` ni tú como quien programa el servicio podrían ver con
solo leer sus archivos.

**La solución:** quitamos esa restricción del `init.sql` de esta práctica.
Ahora `servicio-tareas` acepta cualquier `userId`, sin verificar que
exista — que es, de hecho, el comportamiento real de un microservicio
independiente: si de verdad quisiera garantizar que el usuario existe,
tendría que preguntarle a `servicio-usuarios` por HTTP (con el costo de
latencia y acoplamiento que eso trae), no confiar en que la base de datos
lo resuelva por él.

## Postman (opcional)

Misma colección de siempre -- aunque ahora el puerto 4000 es el
API Gateway, no un backend único, el contrato de la API sigue igual.
Importa `postman_collection.json` de esta carpeta. Opcional, no se
califica -- pero vale la pena correrla una vez completa, y luego volver a
correrla después del experimento de abajo (con `servicio-tareas` o
`servicio-usuarios` apagado) para ver el `502` directamente en Postman,
no solo en el navegador.

## Experimento: apagar y encender servicios

Igual que en la Práctica 2, con los 6 contenedores corriendo, prueba
apagar servicios uno por uno:

```
docker-compose stop servicio-tareas
```

Regresa a la app: el login sigue funcionando perfectamente (vive en
`servicio-usuarios`, que sigue arriba), pero cualquier acción con tareas
falla. Revisa `docker-compose logs api-gateway` — vas a ver un error
`502 Bad Gateway`, la forma en que Nginx te dice "sé a quién le tenía que
reenviar esto, pero no me contesta".

```
docker-compose start servicio-tareas
```

Compáralo con apagar `servicio-usuarios` en su lugar: ahora ni el login
funciona, pero si ya tenías una sesión iniciada, seguir viendo/completando
tareas seguiría andando. Cada servicio falla **de forma completamente
independiente** — a diferencia de la Práctica 2, donde apagar el único
backend tumbaba absolutamente toda la funcionalidad de la API a la vez.

## Errores comunes y solución

| Problema | Causa probable | Solución |
|---|---|---|
| `502 Bad Gateway` en el navegador todo el tiempo, no solo al experimentar | `servicio-usuarios` o `servicio-tareas` no terminaron de arrancar (esperando a la BD) | Espera unos segundos y refresca; revisa `docker-compose logs servicio-usuarios` |
| Error de FK / usuario no encontrado al crear tareas | Estás usando el `init.sql` de una práctica anterior | Confirma que uses el `db/init.sql` **de esta carpeta**, no el de la Práctica 2-4 |
| Los mismos errores de Docker de siempre | — | Revisa el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) |

## Preguntas de reflexión

1. En el experimento de apagar servicios, ¿qué tan distinto se sintió
   respecto a hacerlo en la Práctica 2? ¿Por qué "cada servicio falla por
   su cuenta" es justamente el punto de vender esta arquitectura, aunque
   también sea su mayor complicación operativa?
2. Compartimos una sola base de datos entre los dos servicios, y tuvimos
   que quitar una restricción de integridad para que fueran realmente
   independientes. ¿Qué se ganó al quitarla? ¿Qué se perdió?
3. Si `servicio-tareas` sí necesitara saber el nombre del lector (no solo
   su `userId`) para mostrarlo en pantalla, ¿cómo lo conseguiría sin
   acceder directamente a la tabla `users`? (Pista: repasa la respuesta
   que dimos sobre la disección de XAMPP y la redundancia de datos.)

## Entregable

1. Captura de la app funcionando en `http://localhost:8080`.
2. Captura de `docker-compose ps` mostrando los 6 servicios corriendo.
3. Captura del error `502 Bad Gateway` al apagar uno de los dos
   microservicios (Experimento de arriba).
4. `REFLEXION.md` con tus respuestas a las 3 preguntas.
