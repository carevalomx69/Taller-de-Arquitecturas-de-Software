// ========== servicio-tareas/index.js ==========
const { createDbAdapter, createPool } = require('./adapters/dbAdapter');
const { createApiAdapter } = require('./adapters/apiAdapter');
const { createEventPublisher } = require('./adapters/eventPublisher');
const { createEventStoreAdapter } = require('./adapters/eventStoreAdapter');

const PORT = 3000;

async function waitForDatabase(pool, retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('[servicio-tareas] Conexión a la base de datos establecida.');
      return;
    } catch (err) {
      console.log(`[servicio-tareas] Esperando a la base de datos... intento ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('[servicio-tareas] No se pudo conectar a la base de datos.');
}

async function main() {
  const pool = createPool();
  await waitForDatabase(pool);
  const repo = createDbAdapter(pool);
  const eventStore = createEventStoreAdapter(pool);
  // El eventPublisher se crea aquí pero NO bloqueamos el arranque del
  // servicio esperando a que RabbitMQ esté listo -- se conecta perezosamente
  // en el primer publish(). Así, si RabbitMQ tarda en levantar, servicio-tareas
  // igual puede empezar a atender /api/health y el resto de sus rutas.
  const eventPublisher = createEventPublisher();
  const app = createApiAdapter(repo, eventPublisher, eventStore);
  app.listen(PORT, () => {
    console.log(`[servicio-tareas] escuchando en el puerto ${PORT}`);
  });
}

main().catch(err => {
  console.error('[servicio-tareas] Error fatal al arrancar:', err);
  process.exit(1);
});
