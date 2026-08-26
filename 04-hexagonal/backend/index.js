// ========== index.js ==========
// El "glue code": crea el adaptador de base de datos real, y con él arma
// el adaptador de API. Es el único lugar del backend donde se decide QUÉ
// tecnología concreta usa el dominio — si algún día cambiara la base de
// datos, este es el único archivo (junto con dbAdapter.js) que se tocaría.

const { createDbAdapter, createPool } = require('./adapters/dbAdapter');
const { createApiAdapter } = require('./adapters/apiAdapter');

const PORT = 3000;

async function waitForDatabase(pool, retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('Conexión a la base de datos establecida.');
      return;
    } catch (err) {
      console.log(`Esperando a la base de datos... intento ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('No se pudo conectar a la base de datos después de varios intentos.');
}

async function main() {
  const pool = createPool();
  await waitForDatabase(pool);

  const dbAdapter = createDbAdapter(pool);
  const app = createApiAdapter(dbAdapter);

  app.listen(PORT, () => {
    console.log(`API Server (Hexagonal) running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
