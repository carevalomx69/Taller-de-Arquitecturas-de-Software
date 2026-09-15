// ========== servicio-consultas/index.js ==========
// Servicio de la Práctica 7 (el lado de LECTURA de CQRS) -- extendido en
// la Práctica 8 con la capacidad de RECONSTRUIRSE por completo desde
// event_store, no solo de escuchar eventos en vivo.
//
// Fíjate en algo importante: este archivo se suscribe al MISMO exchange
// "eventos_tareas" que servicio-auditoria ya usaba desde la Práctica 6, en
// una cola PROPIA y DISTINTA ("cola_consultas"). servicio-tareas no sabe,
// ni le importa, que ahora hay dos consumidores en vez de uno -- no se
// tocó ni una línea de servicio-tareas para agregar este servicio.
//
// Este servicio tampoco tiene domain/ propio -- igual que
// servicio-auditoria, no protege reglas de negocio, solo mantiene una
// proyección de lo que ha pasado, optimizada para resolver rápido la
// pregunta "¿qué tareas tiene este usuario?".

const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');

const { createDbAdapter, createPool } = require('./adapters/dbAdapter');

const PORT = 3000;
const EXCHANGE = 'eventos_tareas';
const QUEUE = 'cola_consultas';
const SERVICIO_TAREAS_URL = process.env.SERVICIO_TAREAS_URL || 'http://servicio-tareas:3000';

// ÚNICA función que sabe cómo actualizar tasks_read a partir de un
// evento -- sin importar si ese evento llegó en vivo por RabbitMQ o
// como parte de un replay completo de event_store. "tipo" aquí ya viene
// normalizado ('creada' | 'completada'), independiente del nombre exacto
// que use cada transporte (RabbitMQ dice "tarea.creada", event_store dice
// "TareaCreada" -- a esta función eso ya no le importa).
async function proyectarEvento(repo, tipo, tarea) {
  if (tipo === 'creada') {
    await repo.upsertTaskCreated(tarea);
  } else if (tipo === 'completada') {
    await repo.updateTaskStatus(tarea.id, tarea.status);
  }
}

async function waitForDatabase(pool, retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('[servicio-consultas] Conexión a db-lectura establecida.');
      return;
    } catch (err) {
      console.log(`[servicio-consultas] Esperando a db-lectura... intento ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('[servicio-consultas] No se pudo conectar a db-lectura.');
}

async function iniciarConsumidor(repo) {
  const url = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

  for (let intento = 1; intento <= 15; intento++) {
    try {
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();

      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      await ch.assertQueue(QUEUE, { durable: true });
      await ch.bindQueue(QUEUE, EXCHANGE, 'tarea.*');

      ch.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const evento = JSON.parse(msg.content.toString());
          const tipo = evento.evento === 'tarea.creada' ? 'creada'
                     : evento.evento === 'tarea.completada' ? 'completada'
                     : null;
          if (tipo) await proyectarEvento(repo, tipo, evento.tarea);
          console.log(`[servicio-consultas] proyectado en vivo: ${evento.evento} (tarea #${evento.tarea?.id})`);
          ch.ack(msg);
        } catch (err) {
          console.error('[servicio-consultas] error al proyectar el evento, se descarta:', err.message);
          ch.ack(msg);
        }
      });

      conn.on('close', () => {
        console.error('[servicio-consultas] conexión a RabbitMQ cerrada, reintentando...');
        setTimeout(() => iniciarConsumidor(repo), 3000);
      });

      console.log('[servicio-consultas] escuchando eventos en la cola', QUEUE);
      return;
    } catch (err) {
      console.log(`[servicio-consultas] esperando a RabbitMQ... intento ${intento}/15 (${err.message})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('[servicio-consultas] no se pudo conectar a RabbitMQ tras varios intentos.');
}

function crearApp(repo) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-consultas)' });
  });

  app.get('/api/tasks/:userId', async (req, res) => {
    const tasks = await repo.findTasksByUserId(req.params.userId);
    res.json(tasks);
  });

  // NUEVO en la Práctica 8 -- el experimento central. Vacía tasks_read
  // por completo y la reconstruye desde cero, pidiéndole a
  // servicio-tareas el historial COMPLETO de event_store (no eventos en
  // vivo -- esto es una llamada HTTP síncrona normal, directa entre los
  // dos servicios, distinta del mecanismo de eventos que usa el resto de
  // esta práctica; tiene sentido que sea síncrona porque es una operación
  // de administración/recuperación que sí necesita saber si terminó bien).
  app.post('/api/reconstruir', async (req, res) => {
    try {
      console.log('[servicio-consultas] iniciando reconstrucción completa...');
      await repo.vaciar();

      const respuesta = await fetch(`${SERVICIO_TAREAS_URL}/api/eventos`);
      if (!respuesta.ok) {
        throw new Error(`servicio-tareas respondió ${respuesta.status}`);
      }
      const eventos = await respuesta.json();

      for (const evento of eventos) {
        const tipo = evento.tipo === 'TareaCreada' ? 'creada'
                   : evento.tipo === 'TareaCompletada' ? 'completada'
                   : null;
        if (tipo) await proyectarEvento(repo, tipo, evento.payload);
      }

      console.log(`[servicio-consultas] reconstrucción completa -- ${eventos.length} eventos repetidos.`);
      res.json({ status: 'ok', eventosReplayed: eventos.length });
    } catch (err) {
      console.error('[servicio-consultas] error al reconstruir:', err.message);
      res.status(500).json({ error: 'No se pudo reconstruir la proyección', detalle: err.message });
    }
  });

  return app;
}

async function main() {
  const pool = createPool();
  await waitForDatabase(pool);
  const repo = createDbAdapter(pool);

  const app = crearApp(repo);
  app.listen(PORT, () => {
    console.log(`[servicio-consultas] escuchando en el puerto ${PORT}`);
  });

  await iniciarConsumidor(repo);
}

main().catch(err => {
  console.error('[servicio-consultas] Error fatal al arrancar:', err);
  process.exit(1);
});
