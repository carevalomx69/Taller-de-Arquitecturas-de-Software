// ========== adapters/postgresAdapter.js ==========
// NUEVO en esta práctica. Nota el paquete: '@neondatabase/serverless',
// NO 'pg' (el driver normal de Postgres para Node). No es un capricho --
// 'pg' abre una conexión TCP y la mantiene viva; en un servidor normal
// (como servicio-tareas en las Prácticas 2-8), eso es exactamente lo que
// quieres, porque el proceso vive minutos u horas y puede reusar esa
// conexión miles de veces (por eso usábamos mysql.createPool()).
//
// Una función serverless NO tiene ese lujo: puede que ni siquiera exista
// todavía cuando llega la petición (arranca, responde, y potencialmente
// se apaga segundos después -- "cold start"). Abrir y cerrar una conexión
// TCP normal en cada invocación es lento y, con miles de invocaciones
// simultáneas, satura el límite de conexiones de la base de datos casi
// de inmediato. El driver de Neon resuelve esto hablando por HTTP en vez
// de TCP -- cada consulta es, en los hechos, una petición HTTP suelta,
// exactamente el estilo de comunicación para el que están hechas las
// funciones serverless.

const { neon } = require('@neondatabase/serverless');

function createPostgresAdapter() {
  const sql = neon(process.env.DATABASE_URL);

  return {
    async findTasksByUserId(userId) {
      const rows = await sql`
        SELECT id, user_id AS "userId", title, status, created_at AS "createdAt"
        FROM tasks
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      return rows;
    },

    async createTask(userId, title) {
      const rows = await sql`
        INSERT INTO tasks (user_id, title, status)
        VALUES (${userId}, ${title}, 'pending')
        RETURNING id, user_id AS "userId", title, status
      `;
      return rows[0];
    },

    async updateTaskStatus(id, status) {
      const rows = await sql`
        UPDATE tasks SET status = ${status} WHERE id = ${id}
        RETURNING id
      `;
      return rows.length > 0;
    },
  };
}

module.exports = { createPostgresAdapter };
