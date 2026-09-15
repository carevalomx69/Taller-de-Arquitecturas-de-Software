// ========== servicio-tareas/adapters/apiAdapter.js ==========
// Solo las rutas de tareas -- SOLO las de ESCRITURA -- y, desde esta
// práctica, también las de consultar el HISTORIAL (no el estado actual --
// eso lo sigue respondiendo servicio-consultas).
//
// CAMBIO respecto a la Práctica 7: cada vez que una operación de
// escritura tiene éxito, además de actualizar la proyección "tasks" y
// publicar el evento a RabbitMQ (igual que siempre), primero lo anotamos
// en event_store -- la fuente de verdad nueva de esta práctica. Si
// alguna vez perdiéramos "tasks" por completo, podríamos reconstruirla
// solo repitiendo lo que hay aquí.

const express = require('express');
const cors = require('cors');

const taskDomain = require('../domain/taskDomain');

function createApiAdapter(repo, eventPublisher, eventStore) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-tareas -- solo comandos)' });
  });

  // NUEVO -- de solo lectura, nunca modifica nada. Es el historial
  // completo, la fuente de verdad, expuesta para que se pueda inspeccionar
  // o -- como en el experimento de esta práctica -- volver a repetir.
  app.get('/api/eventos', async (req, res) => {
    const eventos = await eventStore.obtenerTodos();
    res.json(eventos);
  });

  app.get('/api/eventos/:aggregateId', async (req, res) => {
    const eventos = await eventStore.obtenerPorTarea(req.params.aggregateId);
    res.json(eventos);
  });

  app.post('/api/tasks', async (req, res) => {
    const { userId, title } = req.body;
    const result = await taskDomain.create(repo, userId, title);
    if (!result.error) {
      // 1. Anotar en la fuente de verdad -- ANTES de avisarle a nadie más.
      await eventStore.append('TareaCreada', result.data.id, result.data);
      // 2. Avisar a quien le interese (servicio-auditoria, servicio-consultas).
      //    La tarea YA se guardó -- esto es solo avisar. Si falla, la
      //    petición HTTP igual responde 201 (ver eventPublisher.js).
      await eventPublisher.publish('tarea.creada', {
        evento: 'tarea.creada',
        tarea: result.data,
        timestamp: new Date().toISOString(),
      });
    }
    respond(res, result);
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    const result = await taskDomain.updateStatus(repo, req.params.id, req.body.status);
    if (!result.error && result.data.status === 'completed') {
      await eventStore.append('TareaCompletada', Number(req.params.id), result.data);
      await eventPublisher.publish('tarea.completada', {
        evento: 'tarea.completada',
        tarea: result.data,
        timestamp: new Date().toISOString(),
      });
    }
    respond(res, result);
  });

  return app;
}

function respond(res, result) {
  if (result.error) {
    res.status(result.status).json({ error: result.error });
  } else {
    res.status(result.status).json(result.data);
  }
}

module.exports = { createApiAdapter };

