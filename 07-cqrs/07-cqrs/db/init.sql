-- init.sql (Práctica 6 -- Orientado a Eventos)
-- Idéntico al de la Práctica 5: servicio-usuarios y servicio-tareas siguen
-- siendo dos microservicios independientes que comparten esta base de
-- datos física (cada uno en su propia tabla). Esa parte de la arquitectura
-- NO cambia en esta práctica -- lo nuevo es el bus de eventos, no la base
-- de datos. Ver el init.sql y el README de la Práctica 5 para la discusión
-- completa de por qué no hay FOREIGN KEY entre "tasks" y "users".

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
    -- Sin FOREIGN KEY hacia users -- ver Práctica 5 para la discusión.
);
