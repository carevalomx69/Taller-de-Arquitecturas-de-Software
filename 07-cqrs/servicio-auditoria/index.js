// ========== servicio-auditoria/index.js ==========
// Servicio NUEVO de la Práctica 6. No tiene "domain/" propio -- a
// diferencia de usuarios y tareas, este servicio no tiene reglas de
// negocio que proteger, solo una responsabilidad: escuchar lo que pasó y
// llevar un registro. Por eso tampoco tiene dbAdapter.js -- guarda la
// bitácora en un arreglo en memoria, deliberadamente (ver README,
// "Qué deberías observar", para la discusión de ese trade-off).
//
// Este servicio jamás recibe una petición HTTP que le pida "crea una
// tarea" -- nunca habla con servicio-tareas ni con servicio-usuarios.
// Solo con RabbitMQ. Esa es la diferencia central con la Práctica 5: ahí,
// todo se coordinaba con llamadas directas a través del api-gateway.
// Aquí, este servicio ni siquiera aparece en las rutas del gateway hacia
// afuera para "hacer" algo -- solo para "consultar" lo que ya escuchó.

const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');

const PORT = 3000;
const EXCHANGE = 'eventos_tareas';
const QUEUE = 'cola_auditoria';

const bitacora = []; // en memoria -- ver README para la discusión de este trade-off
const MAX_ENTRADAS = 500;

async function iniciarConsumidor() {
  const url = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

  for (let intento = 1; intento <= 15; intento++) {
    try {
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();

      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      // Cola DURABLE: si servicio-auditoria está apagado, RabbitMQ retiene
      // los eventos aquí en vez de perderlos. Cuando el servicio vuelva a
      // conectarse, los recibe en orden -- ese es el experimento central
      // de esta práctica (ver README).
      await ch.assertQueue(QUEUE, { durable: true });
      // Nos suscribimos a CUALQUIER evento de tarea ("tarea.creada",
      // "tarea.completada", y cualquier otro que se agregue en el futuro
      // sin tener que tocar este archivo).
      await ch.bindQueue(QUEUE, EXCHANGE, 'tarea.*');

      ch.consume(QUEUE, (msg) => {
        if (!msg) return;
        try {
          const evento = JSON.parse(msg.content.toString());
          bitacora.unshift({ ...evento, recibidoEn: new Date().toISOString() });
          if (bitacora.length > MAX_ENTRADAS) bitacora.pop();
          console.log(`[servicio-auditoria] evento recibido: ${evento.evento} (tarea #${evento.tarea?.id})`);
          ch.ack(msg);
        } catch (err) {
          console.error('[servicio-auditoria] mensaje inválido, se descarta:', err.message);
          ch.ack(msg); // no reintentamos mensajes malformados indefinidamente
        }
      });

      conn.on('close', () => {
        console.error('[servicio-auditoria] conexión a RabbitMQ cerrada, reintentando...');
        setTimeout(iniciarConsumidor, 3000);
      });

      console.log('[servicio-auditoria] escuchando eventos en la cola', QUEUE);
      return;
    } catch (err) {
      console.log(`[servicio-auditoria] esperando a RabbitMQ... intento ${intento}/15 (${err.message})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('[servicio-auditoria] no se pudo conectar a RabbitMQ tras varios intentos.');
}

function crearApp() {
  const app = express();
  app.use(cors());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running (servicio-auditoria)', eventosEnMemoria: bitacora.length });
  });

  app.get('/api/audit', (req, res) => {
    res.json(bitacora);
  });

  return app;
}

async function main() {
  const app = crearApp();
  app.listen(PORT, () => {
    console.log(`[servicio-auditoria] escuchando en el puerto ${PORT}`);
  });
  await iniciarConsumidor();
}

main().catch(err => {
  console.error('[servicio-auditoria] Error fatal al arrancar:', err);
  process.exit(1);
});
