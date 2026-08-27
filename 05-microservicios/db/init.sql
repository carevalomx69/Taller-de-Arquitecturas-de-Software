-- init.sql (Práctica 5 -- Microservicios)
-- Se ejecuta automáticamente la primera vez que el contenedor de MySQL
-- arranca (MySQL detecta cualquier .sql en /docker-entrypoint-initdb.d/).
--
-- DIFERENCIA IMPORTANTE respecto a las prácticas 2-4: la tabla "tasks" ya
-- NO tiene un FOREIGN KEY hacia "users". En las prácticas anteriores tenía
-- sentido -- un solo backend tocaba ambas tablas, así que la base de datos
-- podía garantizar la integridad entre ellas. Aquí, "servicio-tareas" no
-- tiene ninguna relación de código con "servicio-usuarios" -- y si la base
-- de datos impusiera esa relación por debajo, estaríamos acoplando dos
-- servicios que se supone son independientes, solo que a nivel de esquema
-- en vez de a nivel de código. Ver la sección "Qué deberías observar" del
-- README para la discusión completa (incluye un error real que encontramos
-- al probar esta práctica antes de publicarla).

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Sin FOREIGN KEY hacia users -- ver nota arriba.
);
