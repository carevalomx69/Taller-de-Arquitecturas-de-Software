-- schema.sql
-- Práctica 0: Disección de XAMPP
--
-- Dominio: una mini "biblioteca" (lectores + préstamos de libros).
-- A propósito NO es el mismo dominio que el gestor de tareas que usarán
-- en las 9 prácticas de Docker — esto es solo una demostración de un día,
-- no queremos que se confunda con el hilo conductor del semestre.

-- Fuerza la codificación de la conexión a UTF-8, sin importar la
-- configuración por defecto del cliente que ejecute este script
-- (línea de comandos, phpMyAdmin, etc.). Sin esto, nombres con acentos
-- pueden guardarse corruptos.
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS monolito_demo_db;
USE monolito_demo_db;

CREATE TABLE lectores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    status VARCHAR(50)
);

CREATE TABLE prestamos (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    libro VARCHAR(150),
    lector_id INT,
    FOREIGN KEY (lector_id) REFERENCES lectores(id)
);

-- Datos de prueba
INSERT INTO lectores (nombre, status) VALUES
    ('Carlos Mendoza', 'activo'),
    ('Ana Gómez', 'suspendido');

INSERT INTO prestamos (libro, lector_id) VALUES
    ('Cien años de soledad', 1);
