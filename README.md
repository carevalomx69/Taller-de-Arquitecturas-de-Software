# Gestor de Tareas: un recorrido por 9 arquitecturas de software

Este repositorio contiene las 9 prácticas de la Unidad II de Diseño de
Software. Todas parten de **la misma aplicación** — un gestor de tareas con
usuarios y tareas (ver [`00-recursos-comunes/modelo-datos.md`](00-recursos-comunes/modelo-datos.md))
— y cada práctica la transforma para resolver un problema concreto que dejó
la anterior. La arquitectura no es un catálogo de estilos que memorizar: es
una historia de decisiones, y aquí puedes ver el código antes y después de
cada una.

**Sugerencia:** usa el comparador de archivos de GitHub para ver el `diff`
entre una carpeta y la siguiente — es la forma más directa de ver qué cambió
y por qué.

## Antes de empezar: Práctica 0

[`00-practica-0-xampp/`](00-practica-0-xampp/) es una demostración guiada
(no calificada) que usa XAMPP — algo que probablemente ya conoces de otras
materias — para diseccionar en vivo qué es un monolito, antes de verlo con
Docker. Usa un dominio distinto (una mini "biblioteca") a propósito, para
no mezclarse con el hilo conductor del gestor de tareas.

**¿Problemas instalando Docker, o quieres descargar solo una carpeta del
repo?** Revisa el [`FAQ-TECNICO.md`](FAQ-TECNICO.md) — cubre los problemas
de instalación más frecuentes (falta WSL2 en Windows, virtualización
deshabilitada en el BIOS) y cómo usar `git sparse-checkout` para bajar
solo la práctica que necesitas.

## Las 9 prácticas (+ 1 intermedio necesario)

| # | Arquitectura | Problema que resuelve | Carpeta | Diapositiva de referencia |
|---|---|---|---|---|
| 1 | Monolito | Punto de partida: todo junto para lanzar rápido | [`01-monolito/`](01-monolito/) | "Monolito — en una mirada" |
| 1.5 | *(intermedio)* Postman y HTTP | Ver un GET/POST "al descubierto" antes de seguir — sin esto, el resto de la unidad da por hecho un modelo mental tal vez incompleto | [`01.5-postman-http/`](01.5-postman-http/) | "APIs" / "Cómo se ve una API" |
| 2 | Cliente-Servidor | Varios usuarios necesitan acceder a los mismos datos | [`02-cliente-servidor/`](02-cliente-servidor/) | "Cliente-Servidor — en una mirada" |
| 3 | Capas / MVC | El servidor mezcla presentación, lógica y datos | [`03-capas-mvc/`](03-capas-mvc/) | "MVC — en una mirada" |
| 4 | Hexagonal | Probar la lógica exige levantar toda la infraestructura | [`04-hexagonal/`](04-hexagonal/) | "Hexagonal — en una mirada" |
| 5 | Microservicios | Un solo servidor ya no escala ni se despliega por partes | [`05-microservicios/`](05-microservicios/) | "Microservicios — en una mirada" |
| 6 | Orientado a Eventos | Los servicios siguen acoplados por llamadas síncronas | [`06-orientado-a-eventos/`](06-orientado-a-eventos/) | "Orientado a Eventos — en una mirada" |
| 7 | CQRS | Cargas de lectura y escritura muy distintas entre sí | [`07-cqrs/`](07-cqrs/) | "CQRS — en una mirada" |
| 8 | Event Sourcing | Se necesita un historial auditable, no solo el estado final | [`08-event-sourcing/`](08-event-sourcing/) | "Event Sourcing — en una mirada" |
| 9 | Serverless / FaaS | Mantener infraestructura corriendo 24/7 para algo que se usa poco | [`09-serverless/`](09-serverless/) | "Serverless / FaaS — en una mirada" |

**Nota sobre la 1.5:** no es una arquitectura, así que no encaja en la
numeración de patrones — pero se hizo evidente su necesidad al ver que la
mayoría del grupo no lograba visualizar el flujo real de una petición
HTTP en las prácticas 2 y 3. No tiene su propio `docker-compose.yml`;
reutiliza el contenedor de la Práctica 1 tal cual.

## Cómo usar cada práctica

1. Entra a la carpeta de la práctica correspondiente.
2. Lee su `README.md` — cada una explica su objetivo, qué cambió respecto a
   la anterior, cómo correrla con Docker, qué deberías observar, y las
   preguntas de reflexión que debes entregar.
3. La mayoría de las prácticas usan `docker-compose up --build`; la
   Práctica 1 (Monolito) es la única excepción y usa `docker build` /
   `docker run` directo, porque todavía no hay nada que orquestar.

## Flujo de trabajo entre prácticas

Cada práctica corre **en limpio**, sin depender de contenedores de la
práctica anterior — y de hecho no debe hacerlo, para que la comparación
entre prácticas sea siempre sobre el código, no sobre datos residuales de
una corrida pasada.

**Antes de empezar una práctica nueva**, dentro de la carpeta de la
práctica **anterior**:

```
docker-compose down -v
```

El `-v` es la parte importante: borra también los **volúmenes** (los
datos de la base de datos), para que la siguiente práctica arranque con
los datos definidos en su propio `init.sql`, no con residuos de la corrida
anterior.

Para la Práctica 1 (que no usa `docker-compose`, solo `docker run`):

```
docker stop <container_id>
```

De vez en cuando — no necesariamente entre cada práctica, pero sí si el
disco se empieza a llenar de imágenes viejas:

```
docker system prune
```

**Por qué importa:** los puertos se repiten a propósito entre prácticas
(8080, 4000, 3307, 8081...) para no tener que memorizar 9 combinaciones
distintas. Esto significa que si dejas corriendo una práctica anterior, la
siguiente no podrá levantar sus servicios — verás el error
`"port is already allocated"` del [`FAQ-TECNICO.md`](FAQ-TECNICO.md).

## Convenciones que se mantienen en las 9 prácticas

- Mismo modelo de datos (Usuario, Tarea) — ver `00-recursos-comunes/`.
- Mismos endpoints de API (`/api/register`, `/api/login`, `/api/tasks/...`),
  aunque *cómo* se resuelven cambie radicalmente de una práctica a otra.
- Mismo entregable: capturas de pantalla + `REFLEXION.md` con las preguntas
  de cada práctica.
- A partir de la Práctica 2, cada carpeta trae un `postman_collection.json`
  opcional — casi idéntico entre prácticas, porque el contrato de la API
  no cambia aunque la arquitectura por dentro sí.
