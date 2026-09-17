-- schema.sql (Práctica 9 -- Serverless)
--
-- Corres esto UNA VEZ, a mano, en el editor SQL de Neon (accesible desde
-- la pestaña "Storage" de tu proyecto en Vercel -> "Open in Neon
-- Console" -> "SQL Editor"). Las funciones serverless de esta práctica
-- nunca crean tablas por sí solas -- a diferencia de las Prácticas 2-8,
-- donde Docker corría este tipo de script automáticamente al arrancar
-- "db" (docker-entrypoint-initdb.d), aquí no hay ningún "arranque de
-- contenedor" que dispare nada -- la base de datos ya existe, siempre,
-- independiente de si hay alguna función corriendo en este momento.

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Sin FOREIGN KEY hacia una tabla de usuarios -- esta práctica no
    -- construye login (ver README, "Qué construimos sobre la práctica
    -- anterior"), así que user_id aquí es solo un número que tú
    -- proporcionas al probar, no una referencia validada.
);
