-- init.sql (Práctica 8 -- Event Sourcing)
--
-- CAMBIO de fondo respecto a la Práctica 7: la tabla "tasks" DEJA de ser
-- la fuente de verdad. Ahora es "event_store" -- un registro de solo
-- INSERT, que nunca se actualiza ni se borra. "tasks" se vuelve una
-- PROYECCIÓN -- una copia derivada, pensada solo para que servicio-tareas
-- pueda validar rápido cosas como "¿ya existe esta tarea? ¿ya estaba
-- completada?" sin tener que reconstruir el historial completo cada vez.
-- Si borraras "tasks" por completo, la app podría reconstruirla entera
-- solo repitiendo lo que hay en "event_store" -- eso es lo que vas a
-- probar en el experimento central de esta práctica (aunque, para no
-- repetir el mismo ejercicio dos veces, lo vas a hacer sobre
-- "tasks_read", en servicio-consultas -- ver el README).

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- LA FUENTE DE VERDAD. Append-only: solo INSERT, nunca UPDATE ni DELETE.
CREATE TABLE IF NOT EXISTS event_store (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aggregate_id INT NOT NULL,          -- el id de la tarea a la que pertenece este evento
    tipo VARCHAR(50) NOT NULL,          -- 'TareaCreada' | 'TareaCompletada'
    payload JSON NOT NULL,              -- los datos completos del evento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROYECCIÓN / snapshot -- derivada de event_store, no la fuente de
-- verdad. Se mantiene por velocidad (para no tener que replayar todo el
-- historial en cada petición de escritura), no porque sea indispensable.
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Sin FOREIGN KEY hacia users -- ver Práctica 5 para la discusión.
);

