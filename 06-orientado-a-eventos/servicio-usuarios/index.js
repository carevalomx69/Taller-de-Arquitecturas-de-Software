// ========== servicio-usuarios/index.js ==========
const { createDbAdapter, createPool } = require('./adapters/dbAdapter');
const { createApiAdapter } = require('./adapters/apiAdapter');

const PORT = 3000;

async function waitForDatabase(pool, retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('[servicio-usuarios] Conexión a la base de datos establecida.');
      return;
    } catch (err) {
      console.log(`[servicio-usuarios] Esperando a la base de datos... intento ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('[servicio-usuarios] No se pudo conectar a la base de datos.');
}

async function main() {
  const pool = createPool();
  await waitForDatabase(pool);
  const repo = createDbAdapter(pool);
  const app = createApiAdapter(repo);
  app.listen(PORT, () => {
    console.log(`[servicio-usuarios] escuchando en el puerto ${PORT}`);
  });
}

main().catch(err => {
  console.error('[servicio-usuarios] Error fatal al arrancar:', err);
  process.exit(1);
});
