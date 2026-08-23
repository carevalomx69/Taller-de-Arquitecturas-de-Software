// ========== backend/server.js ==========
// Práctica 3: Capas / MVC
//
// Compara este archivo con el de la Práctica 2: ahí tenía ~120 líneas con
// rutas, validaciones y SQL todo junto. Aquí server.js solo ARMA la
// aplicación — conecta las piezas, no contiene ninguna regla de negocio ni
// ninguna consulta SQL. Cada responsabilidad vive en su propia capa:
//
//   routes/       -> qué URL + qué verbo HTTP dispara qué acción
//   controllers/  -> el "Controlador": orquesta la petición
//   models/       -> el "Modelo": el único lugar que sabe hablar con MySQL
//
// La "Vista" de este MVC es el frontend/ (sin cambios respecto a la
// Práctica 2) — no hay plantillas renderizadas en el servidor. Esta es la
// forma moderna de MVC en una arquitectura API + SPA.

const express = require('express');
const cors = require('cors');

const pool = require('./db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running (capas-mvc)' });
});

app.use('/api', userRoutes);
app.use('/api/tasks', taskRoutes);

// Misma red de seguridad que en la Práctica 2: aunque docker-compose ya
// espera a que "db" esté healthy, este reintento cubre el margen de tiempo
// extra que MySQL a veces necesita para aceptar conexiones.
async function waitForDatabase(retries = 10, delayMs = 3000) {
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

waitForDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API Server (Capas/MVC) running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
