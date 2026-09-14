// ========== servicio-consultas/index.js ==========
// Servicio NUEVO de la Práctica 7 -- el lado de LECTURA de CQRS.
//
// Fíjate en algo importante: este archivo se suscribe al MISMO exchange
// "eventos_tareas" que servicio-auditoria ya usaba desde la Práctica 6, en
// una cola PROPIA y DISTINTA ("cola_consultas"). servicio-tareas no sabe,
// ni le importa, que ahora hay dos consumidores en vez de uno -- no se
// tocó ni una línea de servicio-tareas para agregar este servicio. Esa es
// la ventaja de "productor desacoplado de consumidores" de la que
// hablamos para la Práctica 6, ahora demostrada en código, no solo en
// teoría.
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
          if (evento.evento === 'tarea.creada') {
            await repo.upsertTaskCreated(evento.tarea);
          } else if (evento.evento === 'tarea.completada') {
            await repo.updateTaskStatus(evento.tarea.id, evento.tarea.status);
          }
          console.log(`[servicio-consultas] proyectado: ${evento.evento} (tarea #${evento.tarea?.id})`);
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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-consultas)' });
  });

  app.get('/api/tasks/:userId', async (req, res) => {
    const tasks = await repo.findTasksByUserId(req.params.userId);
    res.json(tasks);
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
