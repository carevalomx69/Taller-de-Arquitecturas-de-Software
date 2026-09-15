-- db-lectura/init.sql (Práctica 7 -- CQRS)
-- Esta es una base de datos COMPLETAMENTE SEPARADA de "db" (la de
-- escritura). No es la misma tabla "tasks" duplicada -- es la tabla que
-- servicio-consultas construye y mantiene por su cuenta, a partir de los
-- eventos que recibe. Nunca se escribe aquí directamente desde
-- servicio-tareas; la única forma en que un dato entra a esta tabla es
-- que servicio-consultas lo escriba después de recibir un evento.

CREATE TABLE IF NOT EXISTS tasks_read (
    id INT PRIMARY KEY,                 -- mismo id que la tarea original en "db"
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NULL,          -- copiado del evento, no generado aquí
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -- "actualizado_en" es propio de esta tabla -- no existe en la tabla
    -- "tasks" de escritura. Es un ejemplo pequeño, pero real, de que el
    -- lado de lectura puede guardar información pensada para lecturas
    -- (aquí: "hace cuánto se actualizó por última vez este renglón"),
    -- sin que el lado de escritura tenga que cargar con ese campo.
);
