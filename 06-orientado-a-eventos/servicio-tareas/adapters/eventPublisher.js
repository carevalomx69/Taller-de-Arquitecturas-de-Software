// ========== servicio-tareas/adapters/eventPublisher.js ==========
// Pieza NUEVA de la Práctica 6. Traduce un "algo pasó en el negocio" (una
// tarea se creó, una tarea se completó) a un mensaje publicado en
// RabbitMQ. Igual que dbAdapter.js traduce el dominio hacia MySQL, este
// adaptador lo traduce hacia el bus de eventos — domain/taskDomain.js
// sigue sin saber que RabbitMQ existe, y de hecho nunca lo llama
// directamente: quien lo llama es el apiAdapter, DESPUÉS de que el
// dominio ya resolvió la operación.

const amqp = require('amqplib');

const EXCHANGE = 'eventos_tareas';

function createEventPublisher() {
  let channel = null;
  let connecting = null;

  async function connect() {
    if (channel) return channel;
    if (connecting) return connecting;
    connecting = (async () => {
      const url = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
      const conn = await amqp.connect(url);
      conn.on('error', (err) => {
        console.error('[eventPublisher] conexión a RabbitMQ perdida:', err.message);
        channel = null;
      });
      conn.on('close', () => {
        console.error('[eventPublisher] conexión a RabbitMQ cerrada.');
        channel = null;
      });
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      channel = ch;
      console.log('[eventPublisher] conectado a RabbitMQ y exchange declarado.');
      return ch;
    })();
    try {
      return await connecting;
    } finally {
      connecting = null;
    }
  }

  return {
    // publish() NUNCA lanza un error hacia quien la llama. Un evento que no
    // se pudo publicar no debe tumbar la petición HTTP que sí tuvo éxito:
    // crear/completar la tarea ya sucedió en la base de datos: el evento es
    // "avisar a quien le interese", no una condición para que la operación
    // principal exista. Ver la Práctica 6 README, sección "Qué deberías
    // observar", para la discusión completa de esta decisión.
    async publish(routingKey, payload) {
      try {
        const ch = await connect();
        const body = Buffer.from(JSON.stringify(payload));
        ch.publish(EXCHANGE, routingKey, body, {
          persistent: true,
          contentType: 'application/json',
        });
        console.log(`[eventPublisher] evento publicado: ${routingKey}`);
      } catch (err) {
        console.error(
          `[eventPublisher] no se pudo publicar "${routingKey}" -- la tarea ya se guardó de todas formas:`,
          err.message
        );
      }
    },
  };
}

module.exports = { createEventPublisher, EXCHANGE };
