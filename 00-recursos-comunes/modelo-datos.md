# Modelo de datos común

Este documento define las dos entidades que usan **las 9 prácticas**, sin excepción.
El código, los nombres de campo y el comportamiento deben ser consistentes en
cada carpeta — si una práctica necesita desviarse (por ejemplo, para ilustrar
algo específico del patrón), debe anotarlo explícitamente en su propio README.

## Usuario

| Campo | Tipo | Notas |
|---|---|---|
| `id` | entero | autogenerado |
| `username` | texto | único |
| `password` | texto | sin hash — es una app didáctica, no de producción |

## Tarea

| Campo | Tipo | Notas |
|---|---|---|
| `id` | entero | autogenerado |
| `userId` | entero | referencia al Usuario dueño de la tarea |
| `title` | texto | |
| `status` | texto | `"pending"` o `"completed"` — **nuevo respecto al semestre anterior** |
| `createdAt` | fecha/hora | |

## Endpoints que toda práctica expone (aunque cambie *cómo* los resuelve)

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/register` | Crea un usuario |
| `POST` | `/api/login` | Verifica credenciales (simplificado, sin JWT) |
| `GET` | `/api/tasks/:userId` | Lista las tareas de un usuario |
| `POST` | `/api/tasks` | Crea una tarea nueva (`status: "pending"` por defecto) |
| `PATCH` | `/api/tasks/:id` | Cambia el `status` de una tarea (marcar como completada) |

El endpoint `PATCH /api/tasks/:id` es nuevo respecto al semestre pasado. Se
agregó a propósito: es el que le da sentido real a Event Sourcing más adelante
(`TAREA_CREADA`, `TAREA_COMPLETADA` como eventos) — sin una acción de "cambio
de estado", Event Sourcing no tiene nada interesante que registrar.

## Por qué esto importa

Cada práctica parte del código de la anterior. Si el modelo de datos cambiara
de una práctica a otra, el alumno no podría comparar el *antes* y el *después*
con un diff — solo estaría viendo dos aplicaciones distintas que casualmente
tratan sobre tareas. Mantener el modelo fijo es lo que hace visible la
evolución arquitectónica.
