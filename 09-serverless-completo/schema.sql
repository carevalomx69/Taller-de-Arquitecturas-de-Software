-- schema.sql (Práctica 9 completa -- Serverless con frontend y login)
--
-- Corres esto UNA VEZ en el SQL Editor de Neon, igual que en la versión
-- mínima de esta práctica. Fíjate que sigue sin haber FOREIGN KEY entre
-- las dos tablas -- misma decisión, y misma discusión, que desde la
-- Práctica 5.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
