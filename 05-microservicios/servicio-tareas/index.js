// ========== servicio-tareas/index.js ==========
const { createDbAdapter, createPool } = require('./adapters/dbAdapter');
const { createApiAdapter } = require('./adapters/apiAdapter');

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
  const dbAdapter = createDbAdapter(pool);
  const app = createApiAdapter(dbAdapter);
  app.listen(PORT, () => {
    console.log(`[servicio-tareas] corriendo en el puerto ${PORT}`);
  });
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
