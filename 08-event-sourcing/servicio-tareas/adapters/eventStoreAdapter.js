// ========== servicio-tareas/adapters/eventStoreAdapter.js ==========
// NUEVO en la Práctica 8. Este adaptador solo sabe hacer una cosa:
// agregar un evento al final del historial, y leer ese historial de
// vuelta. Nunca actualiza ni borra un renglón que ya exista -- eso es lo
// que lo distingue de dbAdapter.js (que sí hace UPDATE sobre "tasks").
//
// Fíjate que taskDomain.js (el dominio) sigue sin saber que esto existe,
// exactamente igual que nunca supo de eventPublisher.js en la Práctica 6.
// Es el apiAdapter quien, después de que el dominio resuelve la
// operación, decide anotarla aquí.

function createEventStoreAdapter(pool) {
  return {
    async append(tipo, aggregateId, payload) {
      await pool.query(
        'INSERT INTO event_store (aggregate_id, tipo, payload) VALUES (?, ?, ?)',
        [aggregateId, tipo, JSON.stringify(payload)]
      );
    },

    // Historial completo, en el orden en que ocurrió -- esto es lo que
    // servicio-consultas va a pedir prestado para reconstruirse desde
    // cero en el experimento de esta práctica.
    async obtenerTodos() {
      const [rows] = await pool.query(
        'SELECT id, aggregate_id AS aggregateId, tipo, payload, created_at AS createdAt FROM event_store ORDER BY id ASC'
      );
      return rows.map(r => ({ ...r, payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload }));
    },

    // Historial de una sola tarea -- útil para depurar o para mostrarle a
    // un alumno "así fue como llegó esta tarea a su estado actual".
    async obtenerPorTarea(aggregateId) {
      const [rows] = await pool.query(
        'SELECT id, aggregate_id AS aggregateId, tipo, payload, created_at AS createdAt FROM event_store WHERE aggregate_id = ? ORDER BY id ASC',
        [aggregateId]
      );
      return rows.map(r => ({ ...r, payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload }));
    },
  };
}

module.exports = { createEventStoreAdapter };
