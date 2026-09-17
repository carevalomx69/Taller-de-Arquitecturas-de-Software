// ========== adapters/postgresAdapter.js ==========
// Combina lo que en las Prácticas 2-8 eran DOS adaptadores separados
// (uno en servicio-usuarios, otro en servicio-tareas) en uno solo -- aquí
// no hay dos servicios, hay funciones sueltas que comparten el mismo
// archivo de utilidades. Sigue siendo el mismo driver por HTTP de la
// versión mínima de esta práctica (ver esa versión para la explicación
// completa de por qué).

const { neon } = require('@neondatabase/serverless');

function createPostgresAdapter() {
  const sql = neon(process.env.DATABASE_URL);

  return {
    // ---- usuarios ----
    async createUser(username, password) {
      try {
        const rows = await sql`
          INSERT INTO users (username, password) VALUES (${username}, ${password})
          RETURNING id, username
        `;
        return rows[0];
      } catch (err) {
        if (err.code === '23505') { // unique_violation en Postgres
          const genericErr = new Error('Duplicate username');
          genericErr.code = 'DUPLICATE_USERNAME';
          throw genericErr;
        }
        throw err;
      }
    },

    async findUserByCredentials(username, password) {
      const rows = await sql`
        SELECT id, username FROM users WHERE username = ${username} AND password = ${password}
      `;
      return rows[0] || null;
    },

    // ---- tareas ----
    async findTasksByUserId(userId) {
      const rows = await sql`
        SELECT id, user_id AS "userId", title, status, created_at AS "createdAt"
        FROM tasks WHERE user_id = ${userId} ORDER BY created_at DESC
      `;
      return rows;
    },

    async createTask(userId, title) {
      const rows = await sql`
        INSERT INTO tasks (user_id, title, status) VALUES (${userId}, ${title}, 'pending')
        RETURNING id, user_id AS "userId", title, status
      `;
      return rows[0];
    },

    async updateTaskStatus(id, status) {
      const rows = await sql`
        UPDATE tasks SET status = ${status} WHERE id = ${id} RETURNING id
      `;
      return rows.length > 0;
    },
  };
}

module.exports = { createPostgresAdapter };
